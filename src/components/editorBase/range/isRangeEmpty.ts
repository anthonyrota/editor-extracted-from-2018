import { Range } from '.'
import { arePointsEqual } from '../point/arePointsEqual'

export function isRangeEmpty(range: Range): boolean {
  return arePointsEqual(range.start, range.end)
}
