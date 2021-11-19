import { Document } from '../document'
import { assertIsSelectionInDocument } from '../document/assertIsSelectionInDocument'
import { Selection } from '../selection'

export interface Value<
  ContentBlockAttributes,
  VoidBlockAttributes,
  InlineTextAttributes,
  InlineVoidAttributes
> {
  readonly _originalSelection: Selection
  readonly selection: Selection
  readonly document: Document<
    ContentBlockAttributes,
    VoidBlockAttributes,
    InlineTextAttributes,
    InlineVoidAttributes
  >
}

export function createValue<
  ContentBlockAttributes,
  VoidBlockAttributes,
  InlineTextAttributes,
  InlineVoidAttributes
>(
  selection: Selection,
  document: Document<
    ContentBlockAttributes,
    VoidBlockAttributes,
    InlineTextAttributes,
    InlineVoidAttributes
  >,
  _originalSelection = selection
): Value<
  ContentBlockAttributes,
  VoidBlockAttributes,
  InlineTextAttributes,
  InlineVoidAttributes
> {
  assertIsSelectionInDocument(document, selection)

  return {
    _originalSelection,
    selection,
    document
  }
}
