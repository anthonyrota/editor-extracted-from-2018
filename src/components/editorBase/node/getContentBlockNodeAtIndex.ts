import { BlockNodeType, ContentBlockNode } from '.'
import { Document } from '../document'

export function getContentBlockNodeAtIndex<
  ContentBlockAttributes,
  InlineTextAttributes,
  InlineVoidAttributes
>(
  document: Document<
    ContentBlockAttributes,
    unknown,
    InlineTextAttributes,
    InlineVoidAttributes
  >,
  index: number
): ContentBlockNode<
  ContentBlockAttributes,
  InlineTextAttributes,
  InlineVoidAttributes
> {
  const blockNode = document.blockNodes[index]

  if (blockNode.type !== BlockNodeType.Content) {
    throw new Error(`The block node at index ${index} is not a content node`)
  }

  return blockNode
}
