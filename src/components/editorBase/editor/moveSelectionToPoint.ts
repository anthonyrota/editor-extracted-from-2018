import { Editor } from '.'
import { Point } from '../point'
import { setAnchorAndCursor } from './setAnchorAndCursor'

export function moveSelectionToPoint<
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
  point: Point
): void {
  setAnchorAndCursor(editor, point, point)
}
