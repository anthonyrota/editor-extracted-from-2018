import { createPointInNonContentBlockNode, Point } from '.'
import { Document } from '../document'
import { BlockNode, BlockNodeType } from '../node'
import { getPointAtStartOfInlineNodeInContent } from './getPointAtStartOfInlineNodeInContent'

export function getPointAtStartOfBlockNode(
  blockNode: BlockNode<unknown, unknown, unknown, unknown>,
  blockNodeIndex: number
): Point {
  return blockNode.type !== BlockNodeType.Content
    ? createPointInNonContentBlockNode(blockNodeIndex)
    : getPointAtStartOfInlineNodeInContent(blockNode.content, blockNodeIndex, 0)
}

export function getPointAtStartOfBlockNodeInDocument(
  document: Document<unknown, unknown, unknown, unknown>,
  index: number
): Point {
  return getPointAtStartOfBlockNode(document.blockNodes[index], index)
}
