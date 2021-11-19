import { Editor } from '.'
import { changeBlockAttributesInSelection } from './changeBlockAttributesInSelection'

export function removeBlockStyle<
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
  changeBlockAttributesInSelection(editor, () => {
    return editor.value.document.meta.createEmptyContentBlockAttributes()
  })
}
