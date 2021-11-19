import { Direction } from '../direction'
import {
  getDirectionToContentBlockPoint,
  getDirectionToPoint
} from '../direction/getDirectionToPoint'
import { ContentBlockPoint, Point } from '../point'

export class DirectionCannotBeBackwardError extends Error {
  public name = 'DirectionCannotBeBackwardError'

  constructor(
    public rangeStart: Point | ContentBlockPoint,
    public rangeEnd: Point | ContentBlockPoint
  ) {
    super(`The direction between start and end cannot be backwards`)
  }
}

export function assertDirectionBetweenContentBlockPointsIsNotBackward(
  start: ContentBlockPoint,
  end: ContentBlockPoint
): void {
  if (getDirectionToContentBlockPoint(start, end) === Direction.Backward) {
    throw new DirectionCannotBeBackwardError(start, end)
  }
}

export function assertDirectionBetweenPointsIsNotBackward(
  start: Point,
  end: Point
): void {
  if (getDirectionToPoint(start, end) === Direction.Backward) {
    throw new DirectionCannotBeBackwardError(start, end)
  }
}
