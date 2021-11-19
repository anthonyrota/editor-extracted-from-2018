import { Document } from '.'
import { Range } from '../range'
import { assertIsPointInDocument } from './assertIsPointInDocument'

export function assertIsRangeInDocument(
  document: Document<unknown, unknown, unknown, unknown>,
  range: Range
): void {
  assertIsPointInDocument(document, range.start)
  assertIsPointInDocument(document, range.end)
}
