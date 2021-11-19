import { Document } from '../document'
import { createSelection, Selection } from '../selection'
import { DOMSelection } from '../utils/DOMTypes'
import { findPointAtDOMNode } from './findPointAtDOMNode'

export function findRange(
  nativeRange: DOMSelection | StaticRange,
  document: Document<unknown, unknown, unknown, unknown>
): Selection {
  let anchorNode: Node
  let anchorOffset: number
  let focusNode: Node
  let focusOffset: number
  let isCollapsed: boolean

  if ('anchorNode' in nativeRange) {
    anchorNode = nativeRange.anchorNode
    anchorOffset = nativeRange.anchorOffset
    focusNode = nativeRange.focusNode
    focusOffset = nativeRange.focusOffset
    isCollapsed = nativeRange.isCollapsed
  } else {
    anchorNode = nativeRange.startContainer
    anchorOffset = nativeRange.startOffset
    focusNode = nativeRange.endContainer
    focusOffset = nativeRange.endOffset
    isCollapsed = nativeRange.collapsed
  }

  const anchor = findPointAtDOMNode(anchorNode, anchorOffset, document)
  const cursor = isCollapsed
    ? anchor
    : findPointAtDOMNode(focusNode, focusOffset, document)

  return createSelection(anchor, cursor)
}
