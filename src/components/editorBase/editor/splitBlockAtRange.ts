import { Editor } from '.'
import { createDocument } from '../document'
import { BlockNodeType, createEmptyBlockNode } from '../node'
import { getBlockNodeAtPoint } from '../node/getBlockNodeAtPoint'
import { changePointBlockNodeIndex } from '../point/changePointBlockNodeIndex'
import { Range } from '../range'
import { isRangeEmpty } from '../range/isRangeEmpty'
import { createInsertTextSaveData } from '../saveData'
import { mapSelectionPoints } from '../selection/mapSelectionPoints'
import { createValue } from '../value'
import { insertTextAtRange } from './insertTextAtRange'

export function splitBlockAtRange<
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
): void {
  if (isRangeEmpty(range)) {
    const { document, selection } = editor.value
    const start = range.start
    const blockNode = getBlockNodeAtPoint(document, start)

    if (blockNode.type === BlockNodeType.Void) {
      const newBlockNodes = document.blockNodes.slice()
      const newBlockNode = createEmptyBlockNode(
        document.meta.createEmptyContentBlockAttributes(),
        document.meta.createEmptyInlineTextAttributes()
      )

      newBlockNodes.splice(start.blockNodeIndex, 0, newBlockNode)

      const newDocument = createDocument(newBlockNodes, document.meta)
      const newSelection = mapSelectionPoints(document, selection, point => {
        if (point.blockNodeIndex < start.blockNodeIndex) {
          return point
        }

        return changePointBlockNodeIndex(point, point.blockNodeIndex + 1)
      })

      editor.save(
        createValue(newSelection, newDocument),
        createInsertTextSaveData(
          start,
          changePointBlockNodeIndex(start, start.blockNodeIndex + 1)
        )
      )

      return
    }
  }

  const { collapsedCursorInlineTextAttributes } = editor

  insertTextAtRange(editor, range, '\n')
  editor.collapsedCursorInlineTextAttributes = collapsedCursorInlineTextAttributes
}
