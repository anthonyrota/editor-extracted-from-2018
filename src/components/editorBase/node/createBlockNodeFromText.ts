import {
  ContentBlockNode,
  createContentBlockNode,
  createEmptyBlockNode,
  createInlineTextNode,
  EmptyBlockNode
} from '.'

export function createBlockNodeFromText<
  ContentBlockAttributes,
  InlineTextAttributes,
  InlineVoidAttributes
>(
  text: string,
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
  return text.length === 0
    ? createEmptyBlockNode(attributes, inlineTextAttributes, key)
    : createContentBlockNode<
        ContentBlockAttributes,
        InlineTextAttributes,
        InlineVoidAttributes
      >([createInlineTextNode(text, inlineTextAttributes)], attributes, key)
}
