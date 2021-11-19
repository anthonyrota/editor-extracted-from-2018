import { Editor } from '.'
import { Range } from '../range'

export function convertRangeCommandToSelectionCommand(
  command: <
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
    range: Range
  ) => void
): <
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
) => void {
  return editor => {
    command(editor, editor.value.selection)
  }
}
