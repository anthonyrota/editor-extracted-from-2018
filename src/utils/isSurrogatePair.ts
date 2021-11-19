export function isSurrogatePair(
  firstCharCode: number,
  secondCharCode: number
): boolean {
  return (
    0xd800 <= firstCharCode &&
    firstCharCode <= 0xdbff &&
    (0xdc00 <= secondCharCode && secondCharCode <= 0xdfff)
  );
}
