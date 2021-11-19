import { createInlineTextNode, InlineTextNode } from '.'

export function sliceInlineTextNode<Attributes>(
  inlineTextNode: InlineTextNode<Attributes>,
  start?: number,
  end?: number
): InlineTextNode<Attributes> {
  const sliced = inlineTextNode.text.slice(start, end)

  if (sliced.length === 0) {
    throw new Error('The sliced text has a length of zero')
  }

  return createInlineTextNode(
    sliced,
    inlineTextNode.attributes,
    inlineTextNode.key
  )
}
