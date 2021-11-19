import { Document } from '../document'
import { Range } from '../range'
import { isRangeEmpty } from '../range/isRangeEmpty'
import { DOMRange } from '../utils/DOMTypes'
import { findDOMPoint } from './findDOMPoint'

export function findDOMRange(
  range: Range,
  document: Document<unknown, unknown, unknown, unknown>,
  editableElement: HTMLElement
): DOMRange {
  const start = findDOMPoint(range.start, document, editableElement)
  const end = isRangeEmpty(range)
    ? start
    : findDOMPoint(range.end, document, editableElement)

  const domRange = window.document.createRange()

  domRange.setStart(start[0], start[1])
  domRange.setEnd(end[0], end[1])

  return domRange
}
