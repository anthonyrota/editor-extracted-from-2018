import {
  ContentBlockNode,
  createContentBlockNode,
  createEmptyBlockNode,
  EmptyBlockNode,
  InlineNode
} from '.'

export function createContentOrEmptyBlockNode<
  ContentBlockAttributes,
  InlineTextAttributes,
  InlineVoidAttributes
>(
  content: ReadonlyArray<
    InlineNode<InlineTextAttributes, InlineVoidAttributes>
  >,
  attributes: ContentBlockAttributes,
  inlineTextAttributes: InlineTextAttributes,
  key?: string
):
  | EmptyBlockNode<ContentBlockAttributes, InlineTextAttributes>
  | ContentBlockNode<
      ContentBlockAttributes,
      InlineTextAttributes,
      InlineVoidAttributes
    > {
  return content.length === 0
    ? createEmptyBlockNode(attributes, inlineTextAttributes, key)
    : createContentBlockNode(content, attributes, key)
}
