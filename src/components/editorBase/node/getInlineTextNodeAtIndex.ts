import { InlineNode, InlineNodeType, InlineTextNode } from '.'

export function getInlineTextNodeAtIndex<InlineTextAttributes>(
  content: ReadonlyArray<InlineNode<InlineTextAttributes, unknown>>,
  index: number
): InlineTextNode<InlineTextAttributes> {
  const inlineNode = content[index]

  if (inlineNode.type !== InlineNodeType.Text) {
    throw new Error(`The inline node at index ${index} is not a text node`)
  }

  return inlineNode
}
