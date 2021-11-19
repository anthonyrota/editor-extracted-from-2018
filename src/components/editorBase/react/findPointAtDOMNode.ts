import { closest } from 'utils/closest'
import { getIndexOfElement } from 'utils/getIndexOfElement'
import { Direction } from '../direction'
import { Document } from '../document'
import { getContentBlockNodeAtIndex } from '../node/getContentBlockNodeAtIndex'
import { getInlineTextNodeAtIndex } from '../node/getInlineTextNodeAtIndex'
import {
  createPointAtEndOfLine,
  createPointAtStartOfVoidInlineNode,
  createPointInNonContentBlockNode,
  createPointInTextNode,
  Point,
  PointAtEndOfLine,
  PointAtStartOfVoidInlineNode,
  PointInContentBlockNode,
  PointInNonContentBlockNode
} from '../point'
import { getPointAtEndOfInlineNodeInContent } from '../point/getPointAtEndOfInlineNodeInContent'
import { RenderNodeType } from './RenderNodeType'

export function findPointAtNonContentElement(
  element: Element
): PointInNonContentBlockNode {
  const index = getIndexOfElement(element)
  return createPointInNonContentBlockNode(index)
}

export function findPointAtContentBlockElement(
  element: Element
): PointAtEndOfLine {
  const index = getIndexOfElement(element)
  return createPointAtEndOfLine(index)
}

function getIndexOfNodeWithKey(
  nodeList: ArrayLike<{ key: string }>,
  key: string
): number {
  for (let i = 0; i < nodeList.length; i++) {
    if (nodeList[i].key === key) {
      return i
    }
  }

  throw new Error(`The given list contains no node with key ${key}`)
}

function getPathToInlineElement(
  element: Element,
  document: Document<unknown, unknown, unknown, unknown>
): [number, number] {
  const nearestBlockNode = closest(element.parentNode!, '[data-editor-type]')

  if (!nearestBlockNode) {
    throw new Error('could not find any block node')
  }

  const blockNodeIndex = getIndexOfElement(nearestBlockNode)
  const key = element.getAttribute('data-key')!
  const blockNode = getContentBlockNodeAtIndex(document, blockNodeIndex)
  const inlineNodeIndex = getIndexOfNodeWithKey(blockNode.content, key)

  return [blockNodeIndex, inlineNodeIndex]
}

export function findPointAtInlineVoidElement(
  element: Element,
  document: Document<unknown, unknown, unknown, unknown>
): PointAtStartOfVoidInlineNode {
  const [blockNodeIndex, inlineNodeIndex] = getPathToInlineElement(
    element,
    document
  )

  return createPointAtStartOfVoidInlineNode(blockNodeIndex, inlineNodeIndex)
}

export function findPointAtInlineTextElement(
  element: Element,
  nativeOffset: number,
  document: Document<unknown, unknown, unknown, unknown>
): PointInContentBlockNode {
  const [blockNodeIndex, inlineNodeIndex] = getPathToInlineElement(
    element,
    document
  )
  const blockNode = getContentBlockNodeAtIndex(document, blockNodeIndex)
  const inlineNode = getInlineTextNodeAtIndex(
    blockNode.content,
    inlineNodeIndex
  )

  if (nativeOffset === inlineNode.text.length) {
    return getPointAtEndOfInlineNodeInContent(
      blockNode.content,
      blockNodeIndex,
      inlineNodeIndex
    )
  }

  return createPointInTextNode(blockNodeIndex, inlineNodeIndex, nativeOffset)
}

export function findPointAtDOMNode(
  nativeNode: Node,
  nativeOffset: number,
  document: Document<unknown, unknown, unknown, unknown>
): Point {
  const [nearestNode, nearestOffset] = normalizeNodeAndOffset(
    nativeNode,
    nativeOffset
  )

  if (nearestNode.nodeType === 3) {
    const parentNode = nearestNode.parentNode as Element

    if (parentNode.hasAttribute('data-editor-void-edge-spacer')) {
      const nextSibling = parentNode.nextSibling

      if (nextSibling) {
        const type = (nextSibling as Element).getAttribute('data-editor-type')!

        return type === RenderNodeType.InlineText
          ? findPointAtInlineTextElement(nextSibling as Element, 0, document)
          : findPointAtInlineVoidElement(nextSibling as Element, document)
      } else {
        const nearestBlockNode = closest(parentNode, '[data-editor-type]')

        if (!nearestBlockNode) {
          throw new Error('could not find any block node')
        }

        const blockNodeIndex = getIndexOfElement(nearestBlockNode)

        return createPointAtEndOfLine(blockNodeIndex)
      }
    }
  }

  const nearestDocumentNode = closest(nearestNode, '[data-editor-type]')

  if (!nearestDocumentNode) {
    throw new Error('could not find any editor nodes')
  }

  const type = nearestDocumentNode.getAttribute('data-editor-type')!

  if (type === RenderNodeType.VoidBlock || type === RenderNodeType.EmptyBlock) {
    return findPointAtNonContentElement(nearestDocumentNode)
  }

  if (type === RenderNodeType.ContentBlock) {
    return findPointAtContentBlockElement(nearestDocumentNode)
  }

  if (type === RenderNodeType.InlineVoid) {
    throw new Error('this should not happen')
    // return findPointAtInlineVoidElement(nearestDocumentNode)
  }

  if (type === RenderNodeType.InlineText) {
    return findPointAtInlineTextElement(
      nearestDocumentNode,
      nearestOffset,
      document
    )
  }

  throw new Error('this should not happen')
}

/**
 * From a DOM selection's `node` and `offset`, normalize so that it always
 * refers to a text node.
 */

function normalizeNodeAndOffset(node: Node, offset: number): [Node, number] {
  // If it's an element node, its offset refers to the index of its children
  // including comment nodes, so try to find the right text child node.
  if (node.nodeType === 1 && node.childNodes.length) {
    const isLast = offset === node.childNodes.length
    const direction = isLast ? Direction.Forward : Direction.Backward
    const index = isLast ? offset - 1 : offset
    node = getEditableChild(node, index, direction)

    // If the node has children, traverse until we have a leaf node. Leaf nodes
    // can be either text nodes, or other void DOM nodes.
    while (node.nodeType === 1 && node.childNodes.length) {
      const i = isLast ? node.childNodes.length - 1 : 0
      node = getEditableChild(node, i, direction)
    }

    if (isLast) {
      const { textContent } = node
      offset = textContent ? textContent.length : 0
    } else {
      offset = 0
    }
  }

  // Return the node and offset.
  return [node, offset]
}

/**
 * Get the nearest editable child at `index` in a `parent`, preferring
 * `direction`.
 */

function getEditableChild(
  parent: Node,
  index: number,
  direction: Direction.Forward | Direction.Backward
): Node {
  const { childNodes } = parent
  let child = childNodes[index]
  let i = index
  let triedForward = false
  let triedBackward = false

  // While the child is a comment node, or an element node with no children,
  // keep iterating to find a sibling non-void, non-comment node.
  while (
    child.nodeType === 8 ||
    (child.nodeType === 1 && child.childNodes.length === 0) ||
    (child.nodeType === 1 &&
      (child as Element).getAttribute('contenteditable') === 'false')
  ) {
    if (triedForward && triedBackward) {
      break
    }

    if (i >= childNodes.length) {
      triedForward = true
      i = index - 1
      direction = Direction.Backward
      continue
    }

    if (i < 0) {
      triedBackward = true
      i = index + 1
      direction = Direction.Forward
      continue
    }

    child = childNodes[i]

    if (direction === Direction.Forward) {
      i++
    } else {
      i--
    }
  }

  return child
}
