import { createKey } from '../utils/createKey'

export enum InlineNodeType {
  Text = 'text',
  Void = 'void'
}

export interface InlineTextNode<Attributes> {
  readonly type: InlineNodeType.Text
  readonly key: string
  readonly text: string
  readonly attributes: Attributes
}

export function createInlineTextNode<Attributes>(
  text: string,
  attributes: Attributes,
  key: string = createKey()
): InlineTextNode<Attributes> {
  return {
    text,
    attributes,
    key,
    type: InlineNodeType.Text
  }
}

export interface InlineVoidNode<Attributes> {
  readonly type: InlineNodeType.Void
  readonly key: string
  readonly attributes: Attributes
}

export function createInlineVoidNode<Attributes>(
  attributes: Attributes,
  key: string = createKey()
): InlineVoidNode<Attributes> {
  return {
    attributes,
    key,
    type: InlineNodeType.Void
  }
}

export type InlineNode<TextAttributes, VoidAttributes> =
  | InlineTextNode<TextAttributes>
  | InlineVoidNode<VoidAttributes>

export enum BlockNodeType {
  Content = 'content',
  Void = 'void',
  Empty = 'empty'
}

export interface ContentBlockNode<
  ContentBlockAttributes,
  InlineTextAttributes,
  InlineVoidAttributes
> {
  readonly type: BlockNodeType.Content
  readonly key: string
  readonly content: ReadonlyArray<
    InlineNode<InlineTextAttributes, InlineVoidAttributes>
  >
  readonly attributes: ContentBlockAttributes
}

export function createContentBlockNode<
  ContentBlockAttributes,
  InlineTextAttributes,
  InlineVoidAttributes
>(
  content: ReadonlyArray<
    InlineNode<InlineTextAttributes, InlineVoidAttributes>
  >,
  attributes: ContentBlockAttributes,
  key: string = createKey()
): ContentBlockNode<
  ContentBlockAttributes,
  InlineTextAttributes,
  InlineVoidAttributes
> {
  if (content.length === 0) {
    throw new Error(
      'There must be at least one InlineNode in a ContentBlockNode'
    )
  }

  return {
    content,
    attributes,
    key,
    type: BlockNodeType.Content
  }
}

export interface VoidBlockNode<Attributes> {
  readonly type: BlockNodeType.Void
  readonly key: string
  readonly attributes: Attributes
}

export function createVoidBlockNode<Attributes>(
  attributes: Attributes,
  key: string = createKey()
): VoidBlockNode<Attributes> {
  return {
    attributes,
    key,
    type: BlockNodeType.Void
  }
}

export interface EmptyBlockNode<ContentBlockAttributes, InlineTextAttributes> {
  readonly type: BlockNodeType.Empty
  readonly key: string
  readonly attributes: ContentBlockAttributes
  readonly inlineAttributes: InlineTextAttributes
}

export function createEmptyBlockNode<
  ContentBlockAttributes,
  InlineTextAttributes
>(
  attributes: ContentBlockAttributes,
  inlineAttributes: InlineTextAttributes,
  key: string = createKey()
): EmptyBlockNode<ContentBlockAttributes, InlineTextAttributes> {
  return {
    attributes,
    inlineAttributes,
    key,
    type: BlockNodeType.Empty
  }
}

export type BlockNode<
  ContentBlockAttributes,
  VoidBlockAttributes,
  InlineTextAttributes,
  InlineVoidAttributes
> =
  | ContentBlockNode<
      ContentBlockAttributes,
      InlineTextAttributes,
      InlineVoidAttributes
    >
  | VoidBlockNode<VoidBlockAttributes>
  | EmptyBlockNode<ContentBlockAttributes, InlineTextAttributes>
