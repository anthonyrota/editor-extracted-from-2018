import { Document } from '../document'
import { Point } from '../point'
import { getPointAtEndOfBlockNodeInDocument } from '../point/getPointAtEndOfBlockNodeInDocument'
import { getPointAtStartOfBlockNodeInDocument } from '../point/getPointAtStartOfBlockNode'
import { convertRangeCommandToSelectionCommand } from './convertRangeCommandToSelectionCommand'
import {
  createDeleteBackwardAtRangeCommand,
  createDeleteForwardAtRangeCommand,
  createMoveBackwardCommand,
  createMoveCursorCommand,
  createMoveForwardCommand
} from './createMovementCommands'

export const moveToStartOfLine = createMoveBackwardCommand(
  movePointToStartOfLine
)
export const moveToEndOfLine = createMoveForwardCommand(movePointToEndOfLine)
export const moveCursorToStartOfLine = createMoveCursorCommand(
  movePointToStartOfLine
)
export const moveCursorToEndOfLine = createMoveCursorCommand(
  movePointToEndOfLine
)
export const deleteLineBackwardAtRange = createDeleteBackwardAtRangeCommand(
  movePointToStartOfLine
)
export const deleteLineForwardAtRange = createDeleteForwardAtRangeCommand(
  movePointToEndOfLine
)
export const deleteLineBackward = convertRangeCommandToSelectionCommand(
  deleteLineBackwardAtRange
)
export const deleteLineForward = convertRangeCommandToSelectionCommand(
  deleteLineForwardAtRange
)

function movePointToStartOfLine(
  document: Document<unknown, unknown, unknown, unknown>,
  point: Point
): Point {
  return getPointAtStartOfBlockNodeInDocument(document, point.blockNodeIndex)
}

function movePointToEndOfLine(
  document: Document<unknown, unknown, unknown, unknown>,
  point: Point
): Point {
  return getPointAtEndOfBlockNodeInDocument(document, point.blockNodeIndex)
}
