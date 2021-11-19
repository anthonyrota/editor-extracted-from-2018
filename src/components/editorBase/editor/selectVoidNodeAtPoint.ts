import { Editor } from '.'
import {
  PointAtStartOfVoidInlineNode,
  PointInNonContentBlockNode,
  PointType
} from '../point'
import { movePointToEndOfInlineNode } from '../point/movePointToEndOfInlineNode'
import { moveSelectionToPoint } from './moveSelectionToPoint'
import { setAnchorAndCursor } from './setAnchorAndCursor'

export function selectVoidNodeAtPoint<
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
  point: PointInNonContentBlockNode | PointAtStartOfVoidInlineNode
): void {
  if (point.type === PointType.InNonContentBlockNode) {
    moveSelectionToPoint(editor, point)
  } else {
    setAnchorAndCursor(
      editor,
      point,
      movePointToEndOfInlineNode(editor.value.document, point)
    )
  }
}
