import { ContentBlockNode, EmptyBlockNode, InlineNode } from '.'
import { Document } from '../document'
import { Point } from '../point'
import { changeBlockNodeContentAtPointWithInlineTextAttributes } from './changeBlockNodeContentAtPointWithInlineTextAttributes'
import { getInlineTextAttributesAtPoint } from './getInlineTextAttributesAtPoint'

export function changeBlockNodeContentAtPoint<
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
  newContent: Array<InlineNode<InlineTextAttributes, InlineVoidAttributes>>
):
  | EmptyBlockNode<ContentBlockAttributes, InlineTextAttributes>
  | ContentBlockNode<
      ContentBlockAttributes,
      InlineTextAttributes,
      InlineVoidAttributes
    > {
  return changeBlockNodeContentAtPointWithInlineTextAttributes(
    document,
    point,
    newContent,
    getInlineTextAttributesAtPoint(document, point)
  )
}
