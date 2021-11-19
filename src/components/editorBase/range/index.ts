import { Point } from '../point'
import { assertDirectionBetweenPointsIsNotBackward } from './assertDirectionBetweenPointsIsNotBackwards'

export interface Range {
  readonly start: Point
  readonly end: Point
}

export function createRange(start: Point, end: Point): Range {
  assertDirectionBetweenPointsIsNotBackward(start, end)

  return { start, end }
}
