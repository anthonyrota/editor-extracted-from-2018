import { Editor } from '.'
import { insertTextAtRange } from './insertTextAtRange'

export function insertText<
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
  >,
  text: string
): void {
  insertTextAtRange(editor, editor.value.selection, text)
}
