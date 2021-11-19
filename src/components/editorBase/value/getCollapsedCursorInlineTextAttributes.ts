import { Value } from '.'
import { getInlineTextAttributesAtPoint } from '../node/getInlineTextAttributesAtPoint'
import { arePointsEqual } from '../point/arePointsEqual'

export function getCollapsedCursorInlineTextAttributes<A>(
  value: Value<unknown, unknown, A, unknown>
): A {
  return arePointsEqual(value.selection.anchor, value.selection.cursor)
    ? getInlineTextAttributesAtPoint(value.document, value.selection.anchor)
    : value.document.meta.createEmptyInlineTextAttributes()
}
