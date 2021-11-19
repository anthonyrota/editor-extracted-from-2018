import { BlockNode } from '../node'

export interface Fragment<
  ContentBlockAttributes,
  VoidBlockAttributes,
  InlineTextAttributes,
  InlineVoidAttributes
> {
  readonly blockNodes: ReadonlyArray<
    BlockNode<
      ContentBlockAttributes,
      VoidBlockAttributes,
      InlineTextAttributes,
      InlineVoidAttributes
    >
  >
}

export function createFragment<
  ContentBlockAttributes,
  VoidBlockAttributes,
  InlineTextAttributes,
  InlineVoidAttributes
>(
  blockNodes: ReadonlyArray<
    BlockNode<
      ContentBlockAttributes,
      VoidBlockAttributes,
      InlineTextAttributes,
      InlineVoidAttributes
    >
  >
): Fragment<
  ContentBlockAttributes,
  VoidBlockAttributes,
  InlineTextAttributes,
  InlineVoidAttributes
> {
  if (blockNodes.length === 0) {
    throw new Error('There must be at least one block node')
  }

  return { blockNodes }
}
