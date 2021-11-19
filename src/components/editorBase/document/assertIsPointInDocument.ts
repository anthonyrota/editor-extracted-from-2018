import { Document } from '.'
import { getBlockNodeAtPoint } from '../node/getBlockNodeAtPoint'
import { getInlineNodeAtPoint } from '../node/getInlineNodeAtPoint'
import { Point, PointType } from '../point'

export function assertIsPointInDocument(
  document: Document<unknown, unknown, unknown, unknown>,
  point: Point
): void {
  if (point.type !== PointType.InNonContentBlockNode) {
    getInlineNodeAtPoint(getBlockNodeAtPoint(document, point).content, point)
  } else {
    getBlockNodeAtPoint(document, point)
  }
}
