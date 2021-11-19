import { createPointAtEndOfLine, PointInContentBlockNode } from '.'
import { InlineNode } from '../node'
import { getPointAtStartOfInlineNodeInContent } from './getPointAtStartOfInlineNodeInContent'

export function getPointAtEndOfInlineNodeInContent(
  content: ReadonlyArray<InlineNode<unknown, unknown>>,
  blockNodeIndex: number,
  inlineNodeIndex: number
): PointInContentBlockNode {
  if (inlineNodeIndex === content.length - 1) {
    return createPointAtEndOfLine(blockNodeIndex)
  }

  return getPointAtStartOfInlineNodeInContent(
    content,
    blockNodeIndex,
    inlineNodeIndex + 1
  )
}
