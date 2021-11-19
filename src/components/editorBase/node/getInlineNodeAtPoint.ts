import { InlineNode, InlineNodeType, InlineTextNode, InlineVoidNode } from '.'
import {
  ContentBlockPoint,
  ContentBlockPointAtStartOfVoidInlineNode,
  ContentBlockPointInTextNode,
  PointType
} from '../point'

export class InvalidInlineNodeAtPointError extends Error {
  public name = 'InvalidInlineNodeAtPointError'

  constructor(
    public inlineNode: InlineNode<unknown, unknown>,
    public point:
      | ContentBlockPointAtStartOfVoidInlineNode
      | ContentBlockPointInTextNode
  ) {
    super(`Invalid inline node at point`)
  }
}

export function getInlineNodeAtPoint<
  InlineTextAttributes,
  InlineVoidAttributes
>(
  content: ReadonlyArray<
    InlineNode<InlineTextAttributes, InlineVoidAttributes>
  >,
  point: ContentBlockPointAtStartOfVoidInlineNode
): InlineVoidNode<InlineVoidAttributes>
export function getInlineNodeAtPoint<
  InlineTextAttributes,
  InlineVoidAttributes
>(
  content: ReadonlyArray<
    InlineNode<InlineTextAttributes, InlineVoidAttributes>
  >,
  point: ContentBlockPointInTextNode
): InlineTextNode<InlineTextAttributes>
export function getInlineNodeAtPoint<
  InlineTextAttributes,
  InlineVoidAttributes
>(
  content: ReadonlyArray<
    InlineNode<InlineTextAttributes, InlineVoidAttributes>
  >,
  point: ContentBlockPoint
): InlineNode<InlineTextAttributes, InlineVoidAttributes>
export function getInlineNodeAtPoint<
  InlineTextAttributes,
  InlineVoidAttributes
>(
  content: ReadonlyArray<
    InlineNode<InlineTextAttributes, InlineVoidAttributes>
  >,
  point: ContentBlockPoint
): InlineNode<InlineTextAttributes, InlineVoidAttributes> {
  if (point.type === PointType.AtEndOfLine) {
    return content[content.length - 1]
  }

  const inlineNode = content[point.inlineNodeIndex]

  if (
    (inlineNode.type === InlineNodeType.Void) !==
    (point.type === PointType.AtStartOfVoidInlineNode)
  ) {
    throw new InvalidInlineNodeAtPointError(inlineNode, point)
  }

  return inlineNode
}
