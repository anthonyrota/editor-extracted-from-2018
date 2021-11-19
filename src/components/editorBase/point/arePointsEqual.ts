import { ContentBlockPoint, Point, PointType } from '.'
import {
  assertIsValidPairOfContentBlockPoints,
  assertIsValidPairOfPoints
} from './assertIsValidPairOfPoints'

export function areContentBlockPointsEqual(
  a: ContentBlockPoint,
  b: ContentBlockPoint
): boolean {
  assertIsValidPairOfContentBlockPoints(a, b)

  switch (a.type) {
    case PointType.AtEndOfLine: {
      return b.type === PointType.AtEndOfLine
    }

    case PointType.AtStartOfVoidInlineNode: {
      return (
        b.type === PointType.AtStartOfVoidInlineNode &&
        a.inlineNodeIndex === b.inlineNodeIndex
      )
    }

    case PointType.InTextNode: {
      return (
        b.type === PointType.InTextNode &&
        a.inlineNodeIndex === b.inlineNodeIndex &&
        a.textOffset === b.textOffset
      )
    }
  }
}

export function arePointsEqual(a: Point, b: Point): boolean {
  assertIsValidPairOfPoints(a, b)

  if (a.blockNodeIndex !== b.blockNodeIndex) {
    return false
  }

  if (
    a.type === PointType.InNonContentBlockNode ||
    b.type === PointType.InNonContentBlockNode
  ) {
    return a.type === b.type
  }

  return areContentBlockPointsEqual(a, b)
}
