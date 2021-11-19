import { Editor } from '.'
import { changeInlineAttributes } from './changeInlineAttributes'

export function removeTextStyle<
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
  changeInlineAttributes(editor, () => {
    return editor.value.document.meta.createEmptyInlineTextAttributes()
  })
}
