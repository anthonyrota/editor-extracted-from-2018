import {
  createPointAtStartOfVoidInlineNode,
  createPointInTextNode,
  PointAtStartOfVoidInlineNode,
  PointInTextNode
} from '.'
import { InlineNode, InlineNodeType } from '../node'

export function getPointAtStartOfInlineNodeInContent(
  content: ReadonlyArray<InlineNode<unknown, unknown>>,
  blockNodeIndex: number,
  inlineNodeIndex: number
): PointAtStartOfVoidInlineNode | PointInTextNode {
  return content[inlineNodeIndex].type === InlineNodeType.Void
    ? createPointAtStartOfVoidInlineNode(blockNodeIndex, 0)
    : createPointInTextNode(blockNodeIndex, inlineNodeIndex, 0)
}
