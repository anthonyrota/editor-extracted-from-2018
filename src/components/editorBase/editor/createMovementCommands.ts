import { Editor } from '.'
import { Direction } from '../direction'
import { Document } from '../document'
import { BlockNodeType } from '../node'
import { getBlockNodeAtPoint } from '../node/getBlockNodeAtPoint'
import { Point } from '../point'
import { createRange, Range } from '../range'
import { isRangeEmpty } from '../range/isRangeEmpty'
import { deleteAtRange } from './deleteAtRange'
import { moveSelectionToPoint } from './moveSelectionToPoint'
import { setAnchorAndCursor } from './setAnchorAndCursor'

export function createMoveCursorCommand(
  moveCursor: (
    document: Document<unknown, unknown, unknown, unknown>,
    point: Point
  ) => Point
): <
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
) => void {
  return editor => {
    const { document, selection } = editor.value
    const newCursor = moveCursor(document, selection.cursor)

    setAnchorAndCursor(editor, selection.anchor, newCursor)
  }
}

export function createMoveBackwardCommand(
  movePointBackward: (
    document: Document<unknown, unknown, unknown, unknown>,
    point: Point
  ) => Point
): <
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
) => void {
  return editor => {
    const { document, selection } = editor.value
    const newPoint = movePointBackward(document, selection.cursor)

    moveSelectionToPoint(editor, newPoint)
  }
}

export function createMoveForwardCommand(
  movePointForward: (
    document: Document<unknown, unknown, unknown, unknown>,
    point: Point
  ) => Point
): <
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
) => void {
  return editor => {
    const { document, selection } = editor.value
    const newPoint = movePointForward(document, selection.cursor)

    setAnchorAndCursor(editor, newPoint, newPoint)
  }
}

export function createDeleteBackwardAtRangeCommand(
  movePointBackward: (
    document: Document<unknown, unknown, unknown, unknown>,
    point: Point
  ) => Point
): <
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
  >,
  range: Range
) => void {
  return (editor, range) => {
    const { document } = editor.value

    if (isRangeEmpty(range)) {
      const point = range.start
      const blockNode = document.blockNodes[range.start.blockNodeIndex]

      if (blockNode.type !== BlockNodeType.Void) {
        deleteAtRange(
          editor,
          createRange(movePointBackward(document, point), point),
          Direction.Backward
        )
        return
      }
    }

    deleteAtRange(editor, range, Direction.Backward)
  }
}

export function createDeleteForwardAtRangeCommand(
  movePointForward: (
    document: Document<unknown, unknown, unknown, unknown>,
    point: Point
  ) => Point
): <
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
  >,
  range: Range
) => void {
  return (editor, range) => {
    const { document } = editor.value

    if (isRangeEmpty(range)) {
      const point = range.start
      const blockNode = getBlockNodeAtPoint(document, point)

      if (blockNode.type !== BlockNodeType.Void) {
        deleteAtRange(
          editor,
          createRange(point, movePointForward(document, point)),
          Direction.Forward
        )
        return
      }
    }

    deleteAtRange(editor, range, Direction.Forward)
  }
}
