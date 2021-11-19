import { Document } from '.'
import { BlockNodeType, createContentBlockNode, InlineNode } from '../node'
import { createKey } from '../utils/createKey'

export function regenerateDocumentKeys<
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
  >
): Document<
  ContentBlockAttributes,
  VoidBlockAttributes,
  InlineTextAttributes,
  InlineVoidAttributes
> {
  return {
    blockNodes: document.blockNodes.map(node =>
      node.type === BlockNodeType.Content
        ? createContentBlockNode(
            node.content.map<
              InlineNode<InlineTextAttributes, InlineVoidAttributes>
            >(node => ({ ...node, key: createKey() })),
            node.attributes
          )
        : { ...node, key: createKey() }
    ),
    meta: document.meta
  }
}
