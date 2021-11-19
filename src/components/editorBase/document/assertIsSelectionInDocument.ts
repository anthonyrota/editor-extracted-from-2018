import { Document } from '.'
import { Selection } from '../selection'
import { assertIsPointInDocument } from './assertIsPointInDocument'

export function assertIsSelectionInDocument(
  document: Document<unknown, unknown, unknown, unknown>,
  selection: Selection
): void {
  assertIsPointInDocument(document, selection.anchor)
  assertIsPointInDocument(document, selection.cursor)
}
