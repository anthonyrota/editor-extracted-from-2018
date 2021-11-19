import { BlockNodeType, InlineNode, InlineNodeType } from '.'
import { Document } from '../document'
import { Point, PointType } from '../point'
import { getBlockNodeAtPoint } from './getBlockNodeAtPoint'
import { getInlineNodeAtPoint } from './getInlineNodeAtPoint'

export function getInlineTextAttributesAtPoint<InlineTextAttributes>(
  document: Document<unknown, unknown, InlineTextAttributes, unknown>,
  point: Point
): InlineTextAttributes {
  if (point.type === PointType.InNonContentBlockNode) {
    const blockNode = getBlockNodeAtPoint(document, point)

    if (blockNode.type === BlockNodeType.Empty) {
      return blockNode.inlineAttributes
    }

    return document.meta.createEmptyInlineTextAttributes()
  }

  const blockNode = getBlockNodeAtPoint(document, point)
  let inlineNode: InlineNode<InlineTextAttributes, unknown>

  if (
    point.type !== PointType.AtEndOfLine &&
    point.inlineNodeIndex !== 0 &&
    (point.type === PointType.AtStartOfVoidInlineNode || point.textOffset === 0)
  ) {
    inlineNode = blockNode.content[point.inlineNodeIndex - 1]
  } else {
    inlineNode = getInlineNodeAtPoint(blockNode.content, point)
  }

  if (inlineNode.type === InlineNodeType.Void) {
    return document.meta.createEmptyInlineTextAttributes()
  }

  return inlineNode.attributes
}
