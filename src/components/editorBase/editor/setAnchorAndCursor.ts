import { Editor } from '.'
import { Point } from '../point'
import { arePointsEqual } from '../point/arePointsEqual'
import { createChangeSelectionSaveData } from '../saveData'
import { createSelection } from '../selection'
import { createValue } from '../value'

export function setAnchorAndCursor<
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
  anchor: Point,
  cursor: Point
): void {
  const { document, selection } = editor.value

  if (
    arePointsEqual(anchor, selection.anchor) &&
    arePointsEqual(cursor, selection.cursor)
  ) {
    return
  }

  const newSelection = createSelection(anchor, cursor)

  editor.save(
    createValue(newSelection, document),
    createChangeSelectionSaveData()
  )
}
