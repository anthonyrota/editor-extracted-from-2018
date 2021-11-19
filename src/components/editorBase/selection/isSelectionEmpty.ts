import { Selection } from '.'
import { arePointsEqual } from '../point/arePointsEqual'

export function isSelectionEmpty(selection: Selection): boolean {
  return arePointsEqual(selection.anchor, selection.cursor)
}
