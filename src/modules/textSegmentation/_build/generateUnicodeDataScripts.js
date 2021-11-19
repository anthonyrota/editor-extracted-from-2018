const fs = require("fs");
const request = require("request");
const UnicodeTrieBuilder = require("unicode-trie/builder");
const path = require("path");
const inflate = require("tiny-inflate");
const dedent = require("dedent");

request(
  `http://www.unicode.org/Public/11.0.0/ucd/auxiliary/GraphemeBreakProperty.txt`,
  (error, _, data) => {
    if (error) {
      throw error;
    }

    let match;
    const re = /^([0-9A-F]+)(?:\.\.([0-9A-F]+))?\s*;\s*([A-Za-z_]+)/gm;
    let nextClass = 1;
    const classes = { Other: 0 };

    const trie = new UnicodeTrieBuilder(classes.Other);

    while ((match = re.exec(data))) {
      const start = match[1];
      const end = match[2] != null ? match[2] : start;
      const type = match[3];
      if (classes[type] == null) {
        classes[type] = nextClass++;
      }

      trie.setRange(parseInt(start, 16), parseInt(end, 16), classes[type]);
    }

    const buffer = trie.toBuffer();

    const highStart = buffer.readUInt32BE(0);
    const errorValue = buffer.readUInt32BE(4);
    const uncompressedLength = buffer.readUInt32BE(8);
    let unicodeData = buffer.slice(12);

    unicodeData = inflate(unicodeData, new Uint8Array(uncompressedLength));
    unicodeData = inflate(unicodeData, new Uint8Array(uncompressedLength));

    unicodeData = new Uint32Array(unicodeData.buffer);

    // Shift size for getting the index-1 table offset.
    const SHIFT_1 = 6 + 5;

    // Shift size for getting the index-2 table offset.
    const SHIFT_2 = 5;

    // Difference between the two shift sizes,
    // for getting an index-1 offset from an index-2 offset. 6=11-5
    const SHIFT_1_2 = SHIFT_1 - SHIFT_2;

    // Number of index-1 entries for the BMP. 32=0x20
    // This part of the index-1 table is omitted from the serialized form.
    const OMITTED_BMP_INDEX_1_LENGTH = 0x10000 >> SHIFT_1;

    // Number of entries in an index-2 block. 64=0x40
    const INDEX_2_BLOCK_LENGTH = 1 << SHIFT_1_2;

    // Mask for getting the lower bits for the in-index-2-block offset. */
    const INDEX_2_MASK = INDEX_2_BLOCK_LENGTH - 1;

    // Shift size for shifting left the index array values.
    // Increases possible data size with 16-bit index values at the cost
    // of compactability.
    // This requires data blocks to be aligned by DATA_GRANULARITY.
    const INDEX_SHIFT = 2;

    // Number of entries in a data block. 32=0x20
    const DATA_BLOCK_LENGTH = 1 << SHIFT_2;

    // Mask for getting the lower bits for the in-data-block offset.
    const DATA_MASK = DATA_BLOCK_LENGTH - 1;

    // The part of the index-2 table for U+D800..U+DBFF stores values for
    // lead surrogate code _units_ not code _points_.
    // Values for lead surrogate code _points_ are indexed with this portion of the table.
    // Length=32=0x20=0x400>>SHIFT_2. (There are 1024=0x400 lead surrogates.)
    const LSCP_INDEX_2_OFFSET = 0x10000 >> SHIFT_2;
    const LSCP_INDEX_2_LENGTH = 0x400 >> SHIFT_2;

    // Count the lengths of both BMP pieces. 2080=0x820
    const INDEX_2_BMP_LENGTH = LSCP_INDEX_2_OFFSET + LSCP_INDEX_2_LENGTH;

    // The 2-byte UTF-8 version of the index-2 table follows at offset 2080=0x820.
    // Length 32=0x20 for lead bytes C0..DF, regardless of SHIFT_2.
    const UTF8_2B_INDEX_2_OFFSET = INDEX_2_BMP_LENGTH;
    const UTF8_2B_INDEX_2_LENGTH = 0x800 >> 6; // U+0800 is the first code point after 2-byte UTF-8

    // The index-1 table, only used for supplementary code points, at offset 2112=0x840.
    // Variable length, for code points up to highStart, where the last single-value range starts.
    // Maximum length 512=0x200=0x100000>>SHIFT_1.
    // (For 0x100000 supplementary code points U+10000..U+10ffff.)
    //
    // The part of the index-2 table for supplementary code points starts
    // after this index-1 table.
    //
    // Both the index-1 table and the following part of the index-2 table
    // are omitted completely if there is only BMP data.
    const INDEX_1_OFFSET = UTF8_2B_INDEX_2_OFFSET + UTF8_2B_INDEX_2_LENGTH;

    // The alignment size of a data block. Also the granularity for compaction.
    const DATA_GRANULARITY = 1 << INDEX_SHIFT;

    const classEnumName = "GraphemeBreakProperty";
    const classEnumCode = [
      `export enum ${classEnumName} {`,
      ...Object.keys(classes).map(
        (key, index) =>
          `  ${key} = ${classes[key]}${
            index === Object.keys(classes).length - 1 ? "" : ","
          }`
      ),
      "}"
    ].join("\n");

    const getGraphemeBreakPropertyFileName = "getGraphemeBreakProperty";
    const getGraphemeBreakPropertyCode = [
      classEnumCode,
      "",
      dedent`
        export function ${getGraphemeBreakPropertyFileName}(codePoint: number): ${classEnumName} {
          if ((codePoint < 0) || (codePoint > 0x10ffff)) {
            return ${errorValue};
          }
    
          if ((codePoint < 0xd800) || ((codePoint > 0xdbff) && (codePoint <= 0xffff))) {
            // Ordinary BMP code point, excluding leading surrogates.
            // BMP uses a single level lookup.  BMP index starts at offset 0 in the index.
            // data is stored in the index array itself.
            const index = (data[codePoint >> ${SHIFT_2}] << ${INDEX_SHIFT}) + (codePoint & ${DATA_MASK});
            return data[index];
          }
    
          if (codePoint <= 0xffff) {
            // Lead Surrogate Code Point.  A Separate index section is stored for
            // lead surrogate code units and code points.
            //   The main index has the code unit data.
            //   For this function, we need the code point data.
            const index = (data[${LSCP_INDEX_2_OFFSET} + ((codePoint - 0xd800) >> ${SHIFT_2})] << ${INDEX_SHIFT}) + (codePoint & ${DATA_MASK});
            return data[index];
          }
    
          if (codePoint < ${highStart}) {
            // Supplemental code point, use two-level lookup.
            let index = data[${INDEX_1_OFFSET -
              OMITTED_BMP_INDEX_1_LENGTH} + (codePoint >> ${SHIFT_1})];
            index = data[index + ((codePoint >> ${SHIFT_2}) & ${INDEX_2_MASK})];
            index = (index << ${INDEX_SHIFT}) + (codePoint & ${DATA_MASK});
            return data[index];
          }
    
          return data[data.length - ${DATA_GRANULARITY}];
        }

        const data = new Uint32Array([${unicodeData}])
      `
    ].join("\n");

    fs.writeFile(
      path.join(__dirname, `../${getGraphemeBreakPropertyFileName}.ts`),
      getGraphemeBreakPropertyCode,
      error => {
        if (error) {
          throw error;
        }
      }
    );
  }
);

request(
  "https://unicode.org/Public/emoji/11.0/emoji-data.txt",
  (error, _, data) => {
    if (error) {
      throw error;
    }

    let match;
    const re = /^([0-9A-F]+)(?:\.\.([0-9A-F]+))?\s*;\s*([A-Za-z_]+)/gm;

    const trie = new UnicodeTrieBuilder(0);
    let ranges = [];

    while ((match = re.exec(data))) {
      const start = match[1];
      const end = match[2] != null ? match[2] : start;
      const type = match[3];

      if (type !== "Extended_Pictographic") {
        continue;
      }

      ranges.push([parseInt(start, 16), parseInt(end, 16)]);
      trie.setRange(parseInt(start, 16), parseInt(end, 16), 1);
    }

    console.log(JSON.stringify(ranges));

    const buffer = trie.toBuffer();

    const highStart = buffer.readUInt32BE(0);
    const errorValue = buffer.readUInt32BE(4);
    const uncompressedLength = buffer.readUInt32BE(8);
    let unicodeData = buffer.slice(12);

    unicodeData = inflate(unicodeData, new Uint8Array(uncompressedLength));
    unicodeData = inflate(unicodeData, new Uint8Array(uncompressedLength));

    unicodeData = new Uint32Array(unicodeData.buffer);

    // Shift size for getting the index-1 table offset.
    const SHIFT_1 = 6 + 5;

    // Shift size for getting the index-2 table offset.
    const SHIFT_2 = 5;

    // Difference between the two shift sizes,
    // for getting an index-1 offset from an index-2 offset. 6=11-5
    const SHIFT_1_2 = SHIFT_1 - SHIFT_2;

    // Number of index-1 entries for the BMP. 32=0x20
    // This part of the index-1 table is omitted from the serialized form.
    const OMITTED_BMP_INDEX_1_LENGTH = 0x10000 >> SHIFT_1;

    // Number of entries in an index-2 block. 64=0x40
    const INDEX_2_BLOCK_LENGTH = 1 << SHIFT_1_2;

    // Mask for getting the lower bits for the in-index-2-block offset. */
    const INDEX_2_MASK = INDEX_2_BLOCK_LENGTH - 1;

    // Shift size for shifting left the index array values.
    // Increases possible data size with 16-bit index values at the cost
    // of compactability.
    // This requires data blocks to be aligned by DATA_GRANULARITY.
    const INDEX_SHIFT = 2;

    // Number of entries in a data block. 32=0x20
    const DATA_BLOCK_LENGTH = 1 << SHIFT_2;

    // Mask for getting the lower bits for the in-data-block offset.
    const DATA_MASK = DATA_BLOCK_LENGTH - 1;

    // The part of the index-2 table for U+D800..U+DBFF stores values for
    // lead surrogate code _units_ not code _points_.
    // Values for lead surrogate code _points_ are indexed with this portion of the table.
    // Length=32=0x20=0x400>>SHIFT_2. (There are 1024=0x400 lead surrogates.)
    const LSCP_INDEX_2_OFFSET = 0x10000 >> SHIFT_2;
    const LSCP_INDEX_2_LENGTH = 0x400 >> SHIFT_2;

    // Count the lengths of both BMP pieces. 2080=0x820
    const INDEX_2_BMP_LENGTH = LSCP_INDEX_2_OFFSET + LSCP_INDEX_2_LENGTH;

    // The 2-byte UTF-8 version of the index-2 table follows at offset 2080=0x820.
    // Length 32=0x20 for lead bytes C0..DF, regardless of SHIFT_2.
    const UTF8_2B_INDEX_2_OFFSET = INDEX_2_BMP_LENGTH;
    const UTF8_2B_INDEX_2_LENGTH = 0x800 >> 6; // U+0800 is the first code point after 2-byte UTF-8

    // The index-1 table, only used for supplementary code points, at offset 2112=0x840.
    // Variable length, for code points up to highStart, where the last single-value range starts.
    // Maximum length 512=0x200=0x100000>>SHIFT_1.
    // (For 0x100000 supplementary code points U+10000..U+10ffff.)
    //
    // The part of the index-2 table for supplementary code points starts
    // after this index-1 table.
    //
    // Both the index-1 table and the following part of the index-2 table
    // are omitted completely if there is only BMP data.
    const INDEX_1_OFFSET = UTF8_2B_INDEX_2_OFFSET + UTF8_2B_INDEX_2_LENGTH;

    // The alignment size of a data block. Also the granularity for compaction.
    const DATA_GRANULARITY = 1 << INDEX_SHIFT;

    const isEmojiPresentationFileName = "isExtendedPictographic";
    const isEmojiPresentationCode = dedent`
      export function ${isEmojiPresentationFileName}(codePoint: number): boolean {
        return getValueFromUnicodeTrieData(codePoint) === 1
      }

      function getValueFromUnicodeTrieData(codePoint: number): number {
        if ((codePoint < 0) || (codePoint > 0x10ffff)) {
          return ${errorValue};
        }
  
        if ((codePoint < 0xd800) || ((codePoint > 0xdbff) && (codePoint <= 0xffff))) {
          // Ordinary BMP code point, excluding leading surrogates.
          // BMP uses a single level lookup.  BMP index starts at offset 0 in the index.
          // data is stored in the index array itself.
          const index = (data[codePoint >> ${SHIFT_2}] << ${INDEX_SHIFT}) + (codePoint & ${DATA_MASK});
          return data[index];
        }
  
        if (codePoint <= 0xffff) {
          // Lead Surrogate Code Point.  A Separate index section is stored for
          // lead surrogate code units and code points.
          //   The main index has the code unit data.
          //   For this function, we need the code point data.
          const index = (data[${LSCP_INDEX_2_OFFSET} + ((codePoint - 0xd800) >> ${SHIFT_2})] << ${INDEX_SHIFT}) + (codePoint & ${DATA_MASK});
          return data[index];
        }
  
        if (codePoint < ${highStart}) {
          // Supplemental code point, use two-level lookup.
          let index = data[${INDEX_1_OFFSET -
            OMITTED_BMP_INDEX_1_LENGTH} + (codePoint >> ${SHIFT_1})];
          index = data[index + ((codePoint >> ${SHIFT_2}) & ${INDEX_2_MASK})];
          index = (index << ${INDEX_SHIFT}) + (codePoint & ${DATA_MASK});
          return data[index];
        }
  
        return data[data.length - ${DATA_GRANULARITY}];
      }

      const data = new Uint32Array([${unicodeData}])
    `;

    fs.writeFile(
      path.join(__dirname, `../${isEmojiPresentationFileName}.ts`),
      isEmojiPresentationCode,
      error => {
        if (error) {
          throw error;
        }
      }
    );
  }
);

// does something to disable some weird error
export {};
