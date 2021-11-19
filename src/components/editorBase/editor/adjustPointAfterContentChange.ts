import { Document } from '../document'
import { InlineNode } from '../node'
import { getBlockNodeAtPoint } from '../node/getBlockNodeAtPoint'
import { getInlineNodeAtPoint } from '../node/getInlineNodeAtPoint'
import { getInlineTextNodeAtIndex } from '../node/getInlineTextNodeAtIndex'
import {
  createPointAtEndOfLine,
  createPointAtStartOfVoidInlineNode,
  createPointInNonContentBlockNode,
  createPointInTextNode,
  Point,
  PointInContentBlockNode,
  PointType
} from '../point'

export function adjustPointAfterContentChange(
  oldDocument: Document<unknown, unknown, unknown, unknown>,
  replacementContent: ReadonlyArray<InlineNode<unknown, unknown>>,
  point: PointInContentBlockNode,
  newBlockNodeIndex: number
): Point {
  if (replacementContent.length === 0) {
    return createPointInNonContentBlockNode(newBlockNodeIndex)
  }

  if (point.type === PointType.AtEndOfLine) {
    return createPointAtEndOfLine(newBlockNodeIndex)
  }

  const blockNode = getBlockNodeAtPoint(oldDocument, point)
  const distanceToEnd = blockNode.content.length - point.inlineNodeIndex
  const newInlineNodeIndex = replacementContent.length - distanceToEnd

  if (point.type === PointType.AtStartOfVoidInlineNode) {
    return createPointAtStartOfVoidInlineNode(
      newBlockNodeIndex,
      newInlineNodeIndex
    )
  }

  const oldInlineNode = getInlineNodeAtPoint(blockNode.content, point)
  const newInlineNode = getInlineTextNodeAtIndex(
    replacementContent,
    newInlineNodeIndex
  )
  const distanceToEndOfText = oldInlineNode.text.length - point.textOffset
  const newTextOffset = newInlineNode.text.length - distanceToEndOfText

  return createPointInTextNode(
    newBlockNodeIndex,
    newInlineNodeIndex,
    newTextOffset
  )
}
