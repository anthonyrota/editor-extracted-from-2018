import { freeze } from 'utils/freeze'
import { BlockNode } from '../node'
import { DocumentMeta } from './meta'

export interface Document<
  ContentBlockAttributes,
  VoidBlockAttributes,
  InlineTextAttributes,
  InlineVoidAttributes
> {
  readonly blockNodes: ReadonlyArray<
    BlockNode<
      ContentBlockAttributes,
      VoidBlockAttributes,
      InlineTextAttributes,
      InlineVoidAttributes
    >
  >
  readonly meta: DocumentMeta<
    ContentBlockAttributes,
    VoidBlockAttributes,
    InlineTextAttributes,
    InlineVoidAttributes
  >
}

export function createDocument<
  ContentBlockAttributes,
  VoidBlockAttributes,
  InlineTextAttributes,
  InlineVoidAttributes
>(
  blockNodes: ReadonlyArray<
    BlockNode<
      ContentBlockAttributes,
      VoidBlockAttributes,
      InlineTextAttributes,
      InlineVoidAttributes
    >
  >,
  meta: DocumentMeta<
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
  return freeze({
    blockNodes,
    meta
  })
}
