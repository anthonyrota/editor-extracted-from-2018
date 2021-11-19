import { Editor } from '.'
import { BlockNodeType } from '../node'
import { getBlockNodeAtPoint } from '../node/getBlockNodeAtPoint'
import { isSelectionEmpty } from '../selection/isSelectionEmpty'

export function changeSelectionInlineTextAttributes<
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
  changeAttributes: (attributes: InlineTextAttributes) => InlineTextAttributes
) {
  const { collapsedCursorInlineTextAttributes } = editor
  const { document, selection } = editor.value

  if (!isSelectionEmpty(selection)) {
    throw new Error('The selection must be empty')
  }

  if (
    getBlockNodeAtPoint(document, selection.start).type === BlockNodeType.Void
  ) {
    return
  }

  editor.collapsedCursorInlineTextAttributes = changeAttributes(
    collapsedCursorInlineTextAttributes
  )
}
