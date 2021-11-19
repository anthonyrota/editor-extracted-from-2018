import {
  getGraphemeBreakProperty,
  GraphemeBreakProperty
} from 'modules/textSegmentation/getGraphemeBreakProperty'
import { isExtendedPictographic } from 'modules/textSegmentation/isExtendedPictographic'
import { isSurrogatePair } from 'utils/isSurrogatePair'

export function shouldBreakBetweenClasses(
  first: GraphemeBreakProperty,
  second: GraphemeBreakProperty
): boolean | null {
  // Break at the start and end of text, unless the text is empty.
  // GB1	sot	÷	Any
  // GB2	Any	÷	eot
  // Not handled here.

  // Do not break between a CR and LF.
  // GB3	CR	×	LF
  if (
    first === GraphemeBreakProperty.CR &&
    second === GraphemeBreakProperty.LF
  ) {
    return false
  }

  // Break after controls.
  // GB4	(Control | CR | LF)	÷
  if (
    first === GraphemeBreakProperty.Control ||
    first === GraphemeBreakProperty.CR ||
    first === GraphemeBreakProperty.LF
  ) {
    return true
  }

  // Break before controls.
  // GB5		÷	(Control | CR | LF)
  if (
    second === GraphemeBreakProperty.Control ||
    second === GraphemeBreakProperty.CR ||
    second === GraphemeBreakProperty.LF
  ) {
    return true
  }

  // Do not break Hangul syllable sequences.
  // GB6	L	×	(L | V | LV | LVT)
  if (
    first === GraphemeBreakProperty.L &&
    (second === GraphemeBreakProperty.L ||
      second === GraphemeBreakProperty.V ||
      second === GraphemeBreakProperty.LV ||
      second === GraphemeBreakProperty.LVT)
  ) {
    return false
  }

  // Do not break Hangul syllable sequences.
  // GB7	(LV | V)	×	(V | T)
  if (
    (first === GraphemeBreakProperty.LV || first === GraphemeBreakProperty.V) &&
    (second === GraphemeBreakProperty.V || second === GraphemeBreakProperty.T)
  ) {
    return false
  }

  // Do not break Hangul syllable sequences.
  // GB8	(LVT | T)	×	T
  if (
    (first === GraphemeBreakProperty.LVT ||
      first === GraphemeBreakProperty.T) &&
    second === GraphemeBreakProperty.T
  ) {
    return false
  }

  // Do not break before extending characters or ZWJ.
  // GB9	 	×	(Extend | ZWJ)
  if (
    second === GraphemeBreakProperty.Extend ||
    second === GraphemeBreakProperty.ZWJ
  ) {
    return false
  }

  // Do not break before SpacingMarks
  // GB9a	 	×	SpacingMark
  if (second === GraphemeBreakProperty.SpacingMark) {
    return false
  }

  // Do not break after Prepend characters
  // GB9b	Prepend	×
  if (first === GraphemeBreakProperty.Prepend) {
    return false
  }

  // Do not break within emoji modifier sequences or emoji zwj sequences.
  // GB11	\p{Extended_Pictographic} Extend* ZWJ	×	\p{Extended_Pictographic}
  // The \p{Extended_Pictographic} values are provided as a part of the Emoji data in [UTS51].
  // Not handled here.

  // Do not break within emoji flag sequences. That is, do not break between regional indicator (RI) symbols if there is an odd number of RI characters before the break point.
  // GB12	sot (RI RI)* RI	×	RI
  // GB13	[^RI] (RI RI)* RI	×	RI
  // Not handled here.

  // Otherwise, break everywhere.
  // GB999	Any	÷	Any
  // Not handled here.
  return null
}

function codePointAt(string: string, index: number): number {
  const first = string.charCodeAt(index)

  if (first >= 0xd800 && first <= 0xdbff && index < string.length - 1) {
    const second = string.charCodeAt(index + 1)

    if (second >= 0xdc00 && second <= 0xdfff) {
      return (first - 0xd800) * 0x400 + second - 0xdc00 + 0x10000
    }
  }

  return first
}

function isInLowSurrogate(text: string, index: number): boolean {
  if (index === 0) {
    return false
  }

  const charCode = text.charCodeAt(index)
  const previousCharCode = text.charCodeAt(index - 1)

  return isSurrogatePair(previousCharCode, charCode)
}

function isInHighSurrogate(text: string, index: number): boolean {
  if (index >= text.length - 1) {
    return false
  }

  const charCode = text.charCodeAt(index)
  const nextCharCode = text.charCodeAt(index + 1)

  return isSurrogatePair(charCode, nextCharCode)
}

export function findNextGraphemeClusterBoundary(
  text: string,
  index: number
): number {
  if (index >= text.length) {
    return text.length
  }

  if (index === text.length - 1) {
    return text.length
  }

  if (isInHighSurrogate(text, index)) {
    if (index + 1 === text.length - 1) {
      return text.length
    }
  } else if (isInLowSurrogate(text, index)) {
    // move to beginning of surrogate pair
    index--
  }

  const firstCodePoint = codePointAt(text, index)
  let previousGraphemeBreakProperty = getGraphemeBreakProperty(firstCodePoint)

  // Do not break within emoji modifier sequences or emoji zwj sequences.
  // GB11	\p{Extended_Pictographic} Extend* ZWJ	×	\p{Extended_Pictographic}
  // The \p{Extended_Pictographic} values are provided as a part of the Emoji data in [UTS51].
  // Set up for this rule.
  let hasExtendedPictographicCharacter = false
  let areAllCharactersAfterLastExtendedPictographicExtend = false
  let areAllCharactersAfterLastExtendedPictographicExtendAndLastIsZWJ = false

  if (isExtendedPictographic(firstCodePoint)) {
    hasExtendedPictographicCharacter = true
    areAllCharactersAfterLastExtendedPictographicExtend = true
  } else if (
    previousGraphemeBreakProperty === GraphemeBreakProperty.Extend ||
    previousGraphemeBreakProperty === GraphemeBreakProperty.ZWJ
  ) {
    for (let i = index - 1; i >= 0; i--) {
      if (isInLowSurrogate(text, i)) {
        continue
      }

      const codePoint = codePointAt(text, i)

      if (isExtendedPictographic(codePoint)) {
        hasExtendedPictographicCharacter = true
        if (previousGraphemeBreakProperty === GraphemeBreakProperty.ZWJ) {
          areAllCharactersAfterLastExtendedPictographicExtendAndLastIsZWJ = true
        } else {
          areAllCharactersAfterLastExtendedPictographicExtend = true
        }
        break
      }

      const graphemeBreakProperty = getGraphemeBreakProperty(codePoint)

      if (graphemeBreakProperty !== GraphemeBreakProperty.Extend) {
        break
      }
    }
  }

  // Do not break within emoji flag sequences. That is, do not break between regional indicator (RI) symbols if there is an odd number of RI characters before the break point.
  // GB12	sot (RI RI)* RI	×	RI
  // GB13	[^RI] (RI RI)* RI	×	RI
  // Setup for this rule.
  let numberOfConsecutiveRegionalIndicatorCharacters = 0

  if (
    previousGraphemeBreakProperty === GraphemeBreakProperty.Regional_Indicator
  ) {
    numberOfConsecutiveRegionalIndicatorCharacters++

    for (let i = index - 1; i >= 0; i--) {
      if (isInLowSurrogate(text, i)) {
        continue
      }

      const codePoint = codePointAt(text, i)
      const graphemeBreakProperty = getGraphemeBreakProperty(codePoint)

      if (graphemeBreakProperty === GraphemeBreakProperty.Regional_Indicator) {
        numberOfConsecutiveRegionalIndicatorCharacters++
      } else {
        break
      }
    }
  }

  let previousCharCode = text.charCodeAt(index)

  for (let i = index + 1; i < text.length; i++) {
    const charCode = text.charCodeAt(i)

    if (isSurrogatePair(previousCharCode, charCode)) {
      previousCharCode = charCode
      continue
    }

    const codePoint = codePointAt(text, index)
    const graphemeBreakProperty = getGraphemeBreakProperty(codePoint)

    let shouldBreak = shouldBreakBetweenClasses(
      previousGraphemeBreakProperty,
      graphemeBreakProperty
    )

    if (shouldBreak) {
      return i
    }

    if (isExtendedPictographic(codePoint)) {
      hasExtendedPictographicCharacter = true
      // Do not break within emoji modifier sequences or emoji zwj sequences.
      // GB11	\p{Extended_Pictographic} Extend* ZWJ	×	\p{Extended_Pictographic}
      // The \p{Extended_Pictographic} values are provided as a part of the Emoji data in [UTS51].
      if (areAllCharactersAfterLastExtendedPictographicExtendAndLastIsZWJ) {
        shouldBreak = false
      }
      areAllCharactersAfterLastExtendedPictographicExtend = true
      areAllCharactersAfterLastExtendedPictographicExtendAndLastIsZWJ = false
    } else if (hasExtendedPictographicCharacter) {
      if (areAllCharactersAfterLastExtendedPictographicExtend) {
        if (graphemeBreakProperty === GraphemeBreakProperty.ZWJ) {
          areAllCharactersAfterLastExtendedPictographicExtend = false
          areAllCharactersAfterLastExtendedPictographicExtendAndLastIsZWJ = true
        } else if (graphemeBreakProperty !== GraphemeBreakProperty.Extend) {
          hasExtendedPictographicCharacter = false
          areAllCharactersAfterLastExtendedPictographicExtend = false
        }
      } else {
        hasExtendedPictographicCharacter = false
        areAllCharactersAfterLastExtendedPictographicExtendAndLastIsZWJ = false
      }
    }

    if (graphemeBreakProperty === GraphemeBreakProperty.Regional_Indicator) {
      // Do not break within emoji flag sequences. That is, do not break between regional indicator (RI) symbols if there is an odd number of RI characters before the break point.
      // GB12	sot (RI RI)* RI	×	RI
      // GB13	[^RI] (RI RI)* RI	×	RI
      if (numberOfConsecutiveRegionalIndicatorCharacters & 1) {
        shouldBreak = false
      }
      numberOfConsecutiveRegionalIndicatorCharacters++
    } else {
      numberOfConsecutiveRegionalIndicatorCharacters = 0
    }

    // Otherwise, break everywhere.
    // GB999	Any	÷	Any
    if (shouldBreak === null) {
      return i
    }

    previousCharCode = charCode
    previousGraphemeBreakProperty = graphemeBreakProperty
  }

  return text.length
}

export function findPreviousGraphemeClusterBoundary(
  text: string,
  index: number
): number {
  if (index === 0) {
    return 0
  }

  index--

  if (index === 0) {
    return 0
  }

  if (isInLowSurrogate(text, index)) {
    // move to beginning of surrogate pair
    index--
  }

  let nextCodePoint = codePointAt(text, index)
  let nextGraphemeBreakProperty = getGraphemeBreakProperty(nextCodePoint)

  // Do not break within emoji flag sequences. That is, do not break between regional indicator (RI) symbols if there is an odd number of RI characters before the break point.
  // GB12	sot (RI RI)* RI	×	RI
  // GB13	[^RI] (RI RI)* RI	×	RI
  // Setup for this rule.
  let numberOfConsecutiveRegionalIndicatorCharacters = 0

  if (nextGraphemeBreakProperty === GraphemeBreakProperty.Regional_Indicator) {
    numberOfConsecutiveRegionalIndicatorCharacters++

    for (let i = index - 1; i >= 0; i--) {
      if (isInLowSurrogate(text, i)) {
        continue
      }

      const codePoint = codePointAt(text, i)
      const graphemeBreakProperty = getGraphemeBreakProperty(codePoint)

      if (graphemeBreakProperty === GraphemeBreakProperty.Regional_Indicator) {
        numberOfConsecutiveRegionalIndicatorCharacters++
      } else {
        break
      }
    }
  }

  for (let i = index - 1; i >= 0; i--) {
    if (isInLowSurrogate(text, i)) {
      continue
    }

    const codePoint = codePointAt(text, i)
    const graphemeBreakProperty = getGraphemeBreakProperty(codePoint)

    let shouldBreak = shouldBreakBetweenClasses(
      graphemeBreakProperty,
      nextGraphemeBreakProperty
    )

    if (shouldBreak) {
      return i + (isInHighSurrogate(text, i) ? 2 : 1)
    }

    if (
      shouldBreak === null &&
      isExtendedPictographic(nextCodePoint) &&
      graphemeBreakProperty === GraphemeBreakProperty.ZWJ
    ) {
      for (let j = i - 1; j >= 0; j--) {
        if (isInLowSurrogate(text, j)) {
          continue
        }

        const codePoint = codePointAt(text, j)

        if (isExtendedPictographic(codePoint)) {
          // Do not break within emoji modifier sequences or emoji zwj sequences.
          // GB11	\p{Extended_Pictographic} Extend* ZWJ	×	\p{Extended_Pictographic}
          // The \p{Extended_Pictographic} values are provided as a part of the Emoji data in [UTS51].
          shouldBreak = false
          break
        }

        const graphemeBreakProperty = getGraphemeBreakProperty(codePoint)

        if (graphemeBreakProperty !== GraphemeBreakProperty.Extend) {
          break
        }
      }
    }

    if (numberOfConsecutiveRegionalIndicatorCharacters > 0) {
      numberOfConsecutiveRegionalIndicatorCharacters--

      // We can assume that the next character is a regional indicator as the
      // `numberOfConsecutiveRegionalIndicatorCharacters` was greater than zero
      if (
        shouldBreak === null &&
        numberOfConsecutiveRegionalIndicatorCharacters & 1
      ) {
        // Do not break within emoji flag sequences. That is, do not break between regional indicator (RI) symbols if there is an odd number of RI characters before the break point.
        // GB12	sot (RI RI)* RI	×	RI
        // GB13	[^RI] (RI RI)* RI	×	RI
        shouldBreak = false
      }
    } else {
      // the number of consecutive regional indicator characters before this point has not been computed,
      // so we compute it again
      if (graphemeBreakProperty === GraphemeBreakProperty.Regional_Indicator) {
        numberOfConsecutiveRegionalIndicatorCharacters++

        for (let j = i - 1; j >= 0; j--) {
          if (isInLowSurrogate(text, j)) {
            continue
          }

          const codePoint = codePointAt(text, j)
          const graphemeBreakProperty = getGraphemeBreakProperty(codePoint)

          if (
            graphemeBreakProperty === GraphemeBreakProperty.Regional_Indicator
          ) {
            numberOfConsecutiveRegionalIndicatorCharacters++
          } else {
            break
          }
        }
      }
    }

    // Otherwise, break everywhere.
    // GB999	Any	÷	Any
    if (shouldBreak === null) {
      return i + (isInHighSurrogate(text, i) ? 2 : 1)
    }

    nextCodePoint = codePoint
    nextGraphemeBreakProperty = graphemeBreakProperty
  }

  return 0
}
