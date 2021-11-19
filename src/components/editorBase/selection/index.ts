import { Direction } from '../direction'
import { getDirectionToPoint } from '../direction/getDirectionToPoint'
import { Point } from '../point'
import { Range } from '../range'

export interface Selection extends Range {
  readonly anchor: Point
  readonly cursor: Point
  readonly direction: Direction
}

export function createSelection(anchor: Point, cursor: Point): Selection {
  const direction = getDirectionToPoint(anchor, cursor)
  const start = direction === Direction.Forward ? anchor : cursor
  const end = direction === Direction.Forward ? cursor : anchor

  return {
    start,
    end,
    anchor,
    cursor,
    direction
  }
}
