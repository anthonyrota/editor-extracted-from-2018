import { Editor } from '.'
import { Direction } from '../direction'
import { deleteAtRange } from './deleteAtRange'

export function deleteSelection<
  ContentBlockAttributes,
  VoidBlockAttributes,
  InlineTextAttributes,
  InlineVoidAttributes
>(
  editor: Editor<
    ContentBlockAttributes,
    VoidBlockAttributes,
    InlineTextAttributes,
    InlineVoidAttributes
  >
): void {
  deleteAtRange(editor, editor.value.selection, Direction.Backward)
}
