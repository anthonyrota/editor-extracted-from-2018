import { createSelection, Selection } from '.'
import { Document } from '../document'
import { Point } from '../point'
import { isSelectionEmpty } from './isSelectionEmpty'

export function mapSelectionPoints(
  document: Document<unknown, unknown, unknown, unknown>,
  selection: Selection,
  transform: (point: Point) => Point
): Selection {
  const newAnchor = transform(selection.anchor)
  const newCursor = isSelectionEmpty(selection)
    ? newAnchor
    : transform(selection.cursor)

  return createSelection(newAnchor, newCursor)
}
