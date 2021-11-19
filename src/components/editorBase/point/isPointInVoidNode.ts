import {
  Point,
  PointAtStartOfVoidInlineNode,
  PointInNonContentBlockNode,
  PointType
} from '.'
import { Document } from '../document'
import { BlockNodeType } from '../node'
import { getBlockNodeAtPoint } from '../node/getBlockNodeAtPoint'

export function isPointInVoidNode(
  document: Document<unknown, unknown, unknown, unknown>,
  point: Point
): point is PointInNonContentBlockNode | PointAtStartOfVoidInlineNode {
  return (
    (point.type === PointType.InNonContentBlockNode &&
      getBlockNodeAtPoint(document, point).type === BlockNodeType.Void) ||
    point.type === PointType.AtStartOfVoidInlineNode
  )
}
