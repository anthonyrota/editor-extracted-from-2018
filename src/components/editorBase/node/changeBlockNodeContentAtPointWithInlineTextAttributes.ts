import { ContentBlockNode, EmptyBlockNode, InlineNode } from '.'
import { Document } from '../document'
import { Point } from '../point'
import { changeBlockNodeContentAndAttributes } from './changeBlockNodeContentAndAttributes'
import { getBlockNodeAtPoint } from './getBlockNodeAtPoint'
import { getContentAttributesAtPoint } from './getContentAttributesAtPoint'

export function changeBlockNodeContentAtPointWithInlineTextAttributes<
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
  point: Point,
  newContent: Array<InlineNode<InlineTextAttributes, InlineVoidAttributes>>,
  inlineTextAttributes: InlineTextAttributes
):
  | EmptyBlockNode<ContentBlockAttributes, InlineTextAttributes>
  | ContentBlockNode<
      ContentBlockAttributes,
      InlineTextAttributes,
      InlineVoidAttributes
    > {
  const startBlockNode = getBlockNodeAtPoint(document, point)
  const contentBlockAttributes = getContentAttributesAtPoint(document, point)

  return changeBlockNodeContentAndAttributes(
    startBlockNode,
    newContent,
    contentBlockAttributes,
    inlineTextAttributes
  )
}
