import { querySelectorInclusive } from 'utils/querySelectorInclusive'
import { Document } from '../document'
import { BlockNodeType, InlineNodeType } from '../node'
import { getBlockNodeAtPoint } from '../node/getBlockNodeAtPoint'
import { getInlineNodeAtPoint } from '../node/getInlineNodeAtPoint'
import { Point, PointType } from '../point'

export function findDOMPoint(
  point: Point,
  document: Document<unknown, unknown, unknown, unknown>,
  editableElement: HTMLElement
): [Node, number] {
  const documentBlockNode = editableElement.childNodes[
    point.blockNodeIndex
  ] as Element

  if (point.type === PointType.InNonContentBlockNode) {
    const blockNode = getBlockNodeAtPoint(document, point)

    if (blockNode.type === BlockNodeType.Empty) {
      return [documentBlockNode.firstChild!, 0]
    }

    const spacer = querySelectorInclusive(
      documentBlockNode,
      '[data-editor-spacer]'
    )

    if (!spacer) {
      throw new Error('No spacer node found')
    }

    return [spacer.firstChild!, 0]
  }

  const blockNode = getBlockNodeAtPoint(document, point)
  const inlineNode = getInlineNodeAtPoint(blockNode.content, point)

  if (point.type === PointType.AtEndOfLine) {
    const contentWrapper = querySelectorInclusive(
      documentBlockNode,
      '[data-editor-content-wrapper]'
    )

    if (!contentWrapper) {
      throw new Error('No content wrapper found')
    }

    const lastChild = contentWrapper.lastChild as Element

    if (inlineNode.type === InlineNodeType.Void) {
      return [lastChild.firstChild!, 0]
    }

    const textNode = querySelectorInclusive(lastChild, '[data-editor-text]')

    if (!textNode) {
      throw new Error('No text node found')
    }

    return [textNode.firstChild!, inlineNode.text.length]
  }

  const documentInlineNode = documentBlockNode.querySelector(
    `[data-key="${inlineNode.key}"]`
  )

  if (!documentInlineNode) {
    throw new Error(`No document node with key ${inlineNode.key} was found`)
  }

  if (point.type === PointType.InTextNode) {
    const textNode = querySelectorInclusive(
      documentInlineNode,
      '[data-editor-text]'
    )

    if (!textNode) {
      throw new Error('No text node found')
    }

    return [textNode.firstChild!, point.textOffset]
  }

  const previousInlineNode = blockNode.content[point.inlineNodeIndex - 1]
  const previousSibling = documentInlineNode.previousSibling as Element

  if (previousInlineNode.type === InlineNodeType.Void) {
    return [previousSibling, 0]
  }

  const textNode = querySelectorInclusive(previousSibling, '[data-editor-text]')

  if (!textNode) {
    throw new Error('No text node found')
  }

  return [textNode.firstChild!, previousInlineNode.text.length]
}
