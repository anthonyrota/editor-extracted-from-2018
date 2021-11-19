import { BlockNode, ContentBlockNode, EmptyBlockNode, InlineNode } from '.'
import { createContentOrEmptyBlockNode } from './createContentOrEmptyBlockNode'

export function changeBlockNodeContentAndAttributes<
  ContentBlockAttributes,
  InlineTextAttributes,
  InlineVoidAttributes
>(
  blockNode: BlockNode<
    ContentBlockAttributes,
    unknown,
    InlineTextAttributes,
    InlineVoidAttributes
  >,
  newContent: Array<InlineNode<InlineTextAttributes, InlineVoidAttributes>>,
  newBlockAttributes: ContentBlockAttributes,
  newInlineAttributes: InlineTextAttributes
):
  | EmptyBlockNode<ContentBlockAttributes, InlineTextAttributes>
  | ContentBlockNode<
      ContentBlockAttributes,
      InlineTextAttributes,
      InlineVoidAttributes
    > {
  return createContentOrEmptyBlockNode(
    newContent,
    newBlockAttributes,
    newInlineAttributes,
    blockNode.key
  )
}
