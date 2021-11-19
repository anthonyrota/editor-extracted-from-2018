import { Editor } from '.'
import { splitBlockAtRange } from './splitBlockAtRange'

export function splitBlock<
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
  splitBlockAtRange(editor, editor.value.selection)
}
