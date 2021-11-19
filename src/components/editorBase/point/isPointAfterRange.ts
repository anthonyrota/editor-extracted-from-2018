import { Point } from '.'
import { Direction } from '../direction'
import { getDirectionToPoint } from '../direction/getDirectionToPoint'
import { Range } from '../range'

export function isPointAfterRange(point: Point, range: Range): boolean {
  return getDirectionToPoint(point, range.end) === Direction.Backward
}
