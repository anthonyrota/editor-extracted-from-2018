import {
  createInlineTextNode,
  InlineNode,
  InlineNodeType,
  InlineTextNode
} from '.'
import { DocumentMeta } from '../document/meta'

export function pushInlineNodeIntoContent<
  InlineTextAttributes,
  InlineVoidAttributes
>(
  content: Array<InlineNode<InlineTextAttributes, InlineVoidAttributes>>,
  inlineNode: InlineNode<InlineTextAttributes, InlineVoidAttributes>,
  meta: DocumentMeta<unknown, unknown, InlineTextAttributes, unknown>
): inlineNode is InlineTextNode<InlineTextAttributes> {
  const lastNode = content[content.length - 1]

  if (
    lastNode &&
    lastNode.type === InlineNodeType.Text &&
    inlineNode.type === InlineNodeType.Text &&
    meta.areInlineTextAttributesEqual(
      lastNode.attributes,
      inlineNode.attributes
    )
  ) {
    content[content.length - 1] = createInlineTextNode(
      lastNode.text + inlineNode.text,
      lastNode.attributes,
      lastNode.key
    )
    return true
  } else {
    content.push(inlineNode)
    return false
  }
}
