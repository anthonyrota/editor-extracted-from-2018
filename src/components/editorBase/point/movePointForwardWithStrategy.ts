import { Point, PointInTextNode, PointType } from '.'
import { Document } from '../document'
import { assertIsPointInDocument } from '../document/assertIsPointInDocument'
import { getPointAtStartOfBlockNodeInDocument } from './getPointAtStartOfBlockNode'
import { movePointToEndOfInlineNode } from './movePointToEndOfInlineNode'

export function movePointForwardWithStrategy(
  document: Document<unknown, unknown, unknown, unknown>,
  point: Point,
  strategy: (
    document: Document<unknown, unknown, unknown, unknown>,
    point: PointInTextNode
  ) => Point
): Point {
  assertIsPointInDocument(document, point)

  if (
    point.type === PointType.InNonContentBlockNode ||
    point.type === PointType.AtEndOfLine
  ) {
    return point.blockNodeIndex === document.blockNodes.length - 1
      ? point
      : getPointAtStartOfBlockNodeInDocument(document, point.blockNodeIndex + 1)
  }

  if (point.type === PointType.AtStartOfVoidInlineNode) {
    return movePointToEndOfInlineNode(document, point)
  }

  return strategy(document, point)
}
