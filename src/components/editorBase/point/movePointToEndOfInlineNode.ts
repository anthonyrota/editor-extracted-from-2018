import {
  createPointAtEndOfLine,
  PointAtStartOfVoidInlineNode,
  PointInContentBlockNode,
  PointInTextNode
} from '.'
import { Document } from '../document'
import { InlineNode } from '../node'
import { getBlockNodeAtPoint } from '../node/getBlockNodeAtPoint'
import { getPointAtEndOfInlineNodeInContent } from './getPointAtEndOfInlineNodeInContent'
import { getPointAtStartOfInlineNodeInContent } from './getPointAtStartOfInlineNodeInContent'

export function movePointToEndOfInlineNode(
  document: Document<unknown, unknown, unknown, unknown>,
  point: PointAtStartOfVoidInlineNode | PointInTextNode
): PointInContentBlockNode {
  const blockNode = getBlockNodeAtPoint(document, point)

  return getPointAtEndOfInlineNodeInContent(
    blockNode.content,
    point.blockNodeIndex,
    point.inlineNodeIndex
  )
}
