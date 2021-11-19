import { InlineNode } from '.'
import { DocumentMeta } from '../document/meta'
import { pushInlineNodeIntoContent } from './pushInlineNodeIntoContent'

export function pushIntoContentList<InlineTextAttributes, InlineVoidAttributes>(
  simplifiedContentList: Array<
    InlineNode<InlineTextAttributes, InlineVoidAttributes>
  >,
  contentToAdd: ReadonlyArray<
    InlineNode<InlineTextAttributes, InlineVoidAttributes>
  >,
  meta: DocumentMeta<unknown, unknown, InlineTextAttributes, unknown>
) {
  if (contentToAdd.length > 0) {
    pushInlineNodeIntoContent(simplifiedContentList, contentToAdd[0], meta)

    for (let i = 1; i < contentToAdd.length; i++) {
      simplifiedContentList.push(contentToAdd[i])
    }
  }
}
