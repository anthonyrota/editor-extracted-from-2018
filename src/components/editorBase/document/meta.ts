export interface DocumentMeta<
  ContentBlockAttributes,
  VoidBlockAttributes,
  InlineTextAttributes,
  InlineVoidAttributes
> {
  createEmptyContentBlockAttributes(): ContentBlockAttributes
  createEmptyInlineTextAttributes(): InlineTextAttributes
  areContentBlockAttributesEqual(
    a: ContentBlockAttributes,
    b: ContentBlockAttributes
  ): boolean
  areVoidBlockAttributesEqual(
    a: VoidBlockAttributes,
    b: VoidBlockAttributes
  ): boolean
  areInlineTextAttributesEqual(
    a: InlineTextAttributes,
    b: InlineTextAttributes
  ): boolean
  areInlineVoidAttributesEqual(
    a: InlineVoidAttributes,
    b: InlineVoidAttributes
  ): boolean
}
