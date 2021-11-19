import {
  findNextGraphemeClusterBoundary,
  findPreviousGraphemeClusterBoundary
} from 'modules/textSegmentation/findGraphemeClusterBoundary'
import { Editor } from '.'
import { Document } from '../document'
import { getBlockNodeAtPoint } from '../node/getBlockNodeAtPoint'
import { getInlineNodeAtPoint } from '../node/getInlineNodeAtPoint'
import { createPointInTextNode, Point, PointInTextNode } from '../point'
import { movePointBackWithStrategy } from '../point/movePointBackWithStrategy'
import { movePointForwardWithStrategy } from '../point/movePointForwardWithStrategy'
import { movePointToEndOfInlineNode } from '../point/movePointToEndOfInlineNode'
import { isSelectionEmpty } from '../selection/isSelectionEmpty'
import { convertRangeCommandToSelectionCommand } from './convertRangeCommandToSelectionCommand'
import {
  createDeleteBackwardAtRangeCommand,
  createDeleteForwardAtRangeCommand,
  createMoveCursorCommand
} from './createMovementCommands'
import { moveSelectionToPoint } from './moveSelectionToPoint'
import { setAnchorAndCursor } from './setAnchorAndCursor'

export const moveCursorBackward = createMoveCursorCommand(
  movePointBackOneCharacter
)
export const moveCursorForward = createMoveCursorCommand(
  movePointForwardOneCharacter
)
export const deleteBackwardAtRange = createDeleteBackwardAtRangeCommand(
  movePointBackOneCharacter
)
export const deleteForwardAtRange = createDeleteForwardAtRangeCommand(
  movePointForwardOneCharacter
)
export const deleteBackward = convertRangeCommandToSelectionCommand(
  deleteBackwardAtRange
)
export const deleteForward = convertRangeCommandToSelectionCommand(
  deleteForwardAtRange
)

export function moveBackward<
  ContentBlockAttributes,
  VoidBlockAttributes,
  InlineTextAttributes,
  InlineVoidAttributes
>(
  editor: Editor<
    ContentBlockAttributes,
    VoidBlockAttributes,
    InlineTextAttributes,
    InlineVoidAttributes
  >
): void {
  const { document, selection } = editor.value

  if (isSelectionEmpty(selection)) {
    const newPoint = movePointBackOneCharacter(document, selection.cursor)

    moveSelectionToPoint(editor, newPoint)
  } else {
    moveSelectionToPoint(editor, selection.start)
  }
}

export function moveForward<
  ContentBlockAttributes,
  VoidBlockAttributes,
  InlineTextAttributes,
  InlineVoidAttributes
>(
  editor: Editor<
    ContentBlockAttributes,
    VoidBlockAttributes,
    InlineTextAttributes,
    InlineVoidAttributes
  >
): void {
  const { document, selection } = editor.value

  if (isSelectionEmpty(selection)) {
    const newPoint = movePointForwardOneCharacter(document, selection.cursor)

    setAnchorAndCursor(editor, newPoint, newPoint)
  } else {
    moveSelectionToPoint(editor, selection.end)
  }
}

const movePointBackOneCharacterStrategy = (
  document: Document<unknown, unknown, unknown, unknown>,
  point: PointInTextNode
): Point => {
  const blockNode = getBlockNodeAtPoint(document, point)
  const textNode = getInlineNodeAtPoint(blockNode.content, point)
  const newTextOffset = findPreviousGraphemeClusterBoundary(
    textNode.text,
    point.textOffset
  )

  return createPointInTextNode(
    point.blockNodeIndex,
    point.inlineNodeIndex,
    newTextOffset
  )
}

function movePointBackOneCharacter(
  document: Document<unknown, unknown, unknown, unknown>,
  point: Point
): Point {
  return movePointBackWithStrategy(
    document,
    point,
    movePointBackOneCharacterStrategy
  )
}

const movePointForwardOneCharacterStrategy = (
  document: Document<unknown, unknown, unknown, unknown>,
  point: PointInTextNode
): Point => {
  const blockNode = getBlockNodeAtPoint(document, point)
  const inlineNode = getInlineNodeAtPoint(blockNode.content, point)

  const newTextOffset = findNextGraphemeClusterBoundary(
    inlineNode.text,
    point.textOffset
  )

  if (newTextOffset === inlineNode.text.length) {
    return movePointToEndOfInlineNode(document, point)
  }

  return createPointInTextNode(
    point.blockNodeIndex,
    point.inlineNodeIndex,
    newTextOffset
  )
}

function movePointForwardOneCharacter(
  document: Document<unknown, unknown, unknown, unknown>,
  point: Point
): Point {
  return movePointForwardWithStrategy(
    document,
    point,
    movePointForwardOneCharacterStrategy
  )
}
