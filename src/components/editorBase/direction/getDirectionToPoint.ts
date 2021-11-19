import { Direction } from '.'
import { ContentBlockPoint, Point, PointType } from '../point'
import { assertIsValidPairOfPoints } from '../point/assertIsValidPairOfPoints'

export function getDirectionToContentBlockPoint(
  a: ContentBlockPoint,
  b: ContentBlockPoint
): Direction {
  if (a.type === PointType.AtEndOfLine) {
    if (b.type === PointType.AtEndOfLine) {
      return Direction.Neutral
    }

    return Direction.Backward
  }

  if (b.type === PointType.AtEndOfLine) {
    return Direction.Forward
  }

  if (b.inlineNodeIndex > a.inlineNodeIndex) {
    return Direction.Forward
  }

  if (b.inlineNodeIndex < a.inlineNodeIndex) {
    return Direction.Backward
  }

  if (a.type === PointType.InTextNode && b.type === PointType.InTextNode) {
    if (b.textOffset > a.textOffset) {
      return Direction.Forward
    }

    if (b.textOffset < a.textOffset) {
      return Direction.Backward
    }
  }

  return Direction.Neutral
}

export function getDirectionToPoint(a: Point, b: Point): Direction {
  assertIsValidPairOfPoints(a, b)

  if (b.blockNodeIndex > a.blockNodeIndex) {
    return Direction.Forward
  }

  if (b.blockNodeIndex < a.blockNodeIndex) {
    return Direction.Backward
  }

  if (
    a.type === PointType.InNonContentBlockNode ||
    b.type === PointType.InNonContentBlockNode
  ) {
    return Direction.Neutral
  }

  return getDirectionToContentBlockPoint(a, b)
}
