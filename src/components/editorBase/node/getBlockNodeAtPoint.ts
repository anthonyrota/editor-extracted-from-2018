import {
  BlockNode,
  BlockNodeType,
  ContentBlockNode,
  EmptyBlockNode,
  VoidBlockNode
} from '.'
import { Document } from '../document'
import {
  Point,
  PointInContentBlockNode,
  PointInNonContentBlockNode,
  PointType
} from '../point'

export class InvalidBlockNodeAtPointError extends Error {
  public name = 'InvalidBlockNodeAtPointError'

  constructor(
    public blockNode: BlockNode<unknown, unknown, unknown, unknown>,
    public point: Point
  ) {
    super(`Invalid block node at point`)
  }
}

export function getBlockNodeAtPoint<
  ContentBlockAttributes,
  VoidBlockAttributes,
  InlineTextAttributes,
  InlineVoidAttributes
>(
  document: Document<
    ContentBlockAttributes,
    VoidBlockAttributes,
    InlineTextAttributes,
    InlineVoidAttributes
  >,
  point: PointInNonContentBlockNode
):
  | VoidBlockNode<VoidBlockAttributes>
  | EmptyBlockNode<ContentBlockAttributes, InlineTextAttributes>
export function getBlockNodeAtPoint<
  ContentBlockAttributes,
  VoidBlockAttributes,
  InlineTextAttributes,
  InlineVoidAttributes
>(
  document: Document<
    ContentBlockAttributes,
    VoidBlockAttributes,
    InlineTextAttributes,
    InlineVoidAttributes
  >,
  point: PointInContentBlockNode
): ContentBlockNode<
  ContentBlockAttributes,
  InlineTextAttributes,
  InlineVoidAttributes
>
export function getBlockNodeAtPoint<
  ContentBlockAttributes,
  VoidBlockAttributes,
  InlineTextAttributes,
  InlineVoidAttributes
>(
  document: Document<
    ContentBlockAttributes,
    VoidBlockAttributes,
    InlineTextAttributes,
    InlineVoidAttributes
  >,
  point: Point
): BlockNode<
  ContentBlockAttributes,
  VoidBlockAttributes,
  InlineTextAttributes,
  InlineVoidAttributes
>
export function getBlockNodeAtPoint<
  ContentBlockAttributes,
  VoidBlockAttributes,
  InlineTextAttributes,
  InlineVoidAttributes
>(
  document: Document<
    ContentBlockAttributes,
    VoidBlockAttributes,
    InlineTextAttributes,
    InlineVoidAttributes
  >,
  point: Point
): BlockNode<
  ContentBlockAttributes,
  VoidBlockAttributes,
  InlineTextAttributes,
  InlineVoidAttributes
> {
  const blockNode = document.blockNodes[point.blockNodeIndex]

  if (
    (blockNode.type !== BlockNodeType.Content) !==
    (point.type === PointType.InNonContentBlockNode)
  ) {
    throw new InvalidBlockNodeAtPointError(blockNode, point)
  }

  return blockNode
}
