import { Editor } from '.'
import { changeInlineAttributesInRange } from './changeInlineAttributesInRange'

export function changeInlineAttributes<
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
  changeInlineTextAttributes?: (
    attributes: InlineTextAttributes
  ) => InlineTextAttributes,
  changeInlineVoidAttributes?: (
    attributes: InlineVoidAttributes
  ) => InlineVoidAttributes
): void {
  changeInlineAttributesInRange(
    editor,
    editor.value.selection,
    changeInlineTextAttributes,
    changeInlineVoidAttributes
  )
}
