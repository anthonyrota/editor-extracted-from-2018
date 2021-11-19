import { ContentBlockPoint, Point, PointType } from '.'

export class InvalidPairOfPointsError extends Error {
  public name = 'InvalidPairOfPointsError'

  constructor(
    public firstPoint: Point | ContentBlockPoint,
    public secondPoint: Point | ContentBlockPoint
  ) {
    super(`Invalid pair of points`)
  }
}

export function assertIsValidPairOfPoints(a: Point, b: Point): void {
  if (a.blockNodeIndex !== b.blockNodeIndex) {
    return
  }

  if (a.type === PointType.InNonContentBlockNode) {
    if (b.type !== PointType.InNonContentBlockNode) {
      throw new InvalidPairOfPointsError(a, b)
    }

    return
  }

  if (b.type === PointType.InNonContentBlockNode) {
    throw new InvalidPairOfPointsError(a, b)
  }

  assertIsValidPairOfContentBlockPoints(a, b)
}

export function assertIsValidPairOfContentBlockPoints(
  a: ContentBlockPoint,
  b: ContentBlockPoint
): void {
  if (a.type === PointType.AtEndOfLine || b.type === PointType.AtEndOfLine) {
    return
  }

  if (a.inlineNodeIndex !== b.inlineNodeIndex) {
    return
  }

  if (
    (a.type === PointType.AtStartOfVoidInlineNode) !==
    (b.type === PointType.AtStartOfVoidInlineNode)
  ) {
    throw new InvalidPairOfPointsError(a, b)
  }
}
