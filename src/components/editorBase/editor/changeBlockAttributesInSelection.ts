import { Editor } from '.'
import { changeBlockAttributesInRange } from './changeBlockAttributesInRange'

export function changeBlockAttributesInSelection<
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
  changeContentBlockAttributes?: (
    attributes: ContentBlockAttributes
  ) => ContentBlockAttributes,
  changeVoidBlockAttributes?: (
    attributes: VoidBlockAttributes
  ) => VoidBlockAttributes
): void {
  changeBlockAttributesInRange(
    editor,
    editor.value.selection,
    changeContentBlockAttributes,
    changeVoidBlockAttributes
  )
}
