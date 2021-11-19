import { Document } from '../document'
import { isPointInVoidNode } from '../point/isPointInVoidNode'
import { findPointAtDOMNode } from './findPointAtDOMNode'

export function isNodeAtElementVoid(
  node: Node,
  document: Document<unknown, unknown, unknown, unknown>
): boolean {
  return isPointInVoidNode(document, findPointAtDOMNode(node, 0, document))
}
