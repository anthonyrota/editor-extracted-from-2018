import { createFragment, Fragment } from '.'
import { Document } from '../document'
import { assertIsRangeInDocument } from '../document/assertIsRangeInDocument'
import { createContentBlockNode, createEmptyBlockNode } from '../node'
import { createContentOrEmptyBlockNode } from '../node/createContentOrEmptyBlockNode'
import { getBlockNodeAtPoint } from '../node/getBlockNodeAtPoint'
import {
  getBlockNodeContentAfterPointInDocument,
  getBlockNodeContentBeforePointInDocument,
  getBlockNodeContentBetweenPoints
} from '../node/getBlockNodeContent'
import { getContentAttributesAtPoint } from '../node/getContentAttributesAtPoint'
import { getInlineTextAttributesAtPoint } from '../node/getInlineTextAttributesAtPoint'
import { PointType } from '../point'
import { Range } from '../range'
import { isRangeEmpty } from '../range/isRangeEmpty'

export function getFragmentAtRange<
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
  >,
  range: Range
): Fragment<
  ContentBlockAttributes,
  VoidBlockAttributes,
  InlineTextAttributes,
  InlineVoidAttributes
> {
  assertIsRangeInDocument(document, range)

  if (range.start.blockNodeIndex === range.end.blockNodeIndex) {
    if (
      range.start.type === PointType.InNonContentBlockNode ||
      range.end.type === PointType.InNonContentBlockNode
    ) {
      return createFragment<
        ContentBlockAttributes,
        VoidBlockAttributes,
        InlineTextAttributes,
        InlineVoidAttributes
      >([getBlockNodeAtPoint(document, range.start)])
    }

    if (isRangeEmpty(range)) {
      return createFragment<
        ContentBlockAttributes,
        VoidBlockAttributes,
        InlineTextAttributes,
        InlineVoidAttributes
      >([
        createEmptyBlockNode(
          getContentAttributesAtPoint(document, range.start),
          getInlineTextAttributesAtPoint(document, range.start),
          getBlockNodeAtPoint(document, range.start).key
        )
      ])
    }

    const blockNode = getBlockNodeAtPoint(document, range.start)
    const selectedContent = getBlockNodeContentBetweenPoints(
      blockNode.content,
      range.start,
      range.end
    )

    return createFragment<
      ContentBlockAttributes,
      VoidBlockAttributes,
      InlineTextAttributes,
      InlineVoidAttributes
    >([
      createContentBlockNode(
        selectedContent,
        blockNode.attributes,
        blockNode.key
      )
    ])
  }

  const newContent = []

  if (range.start.type === PointType.InNonContentBlockNode) {
    newContent.push(getBlockNodeAtPoint(document, range.start))
  } else {
    newContent.push(
      createContentOrEmptyBlockNode(
        getBlockNodeContentAfterPointInDocument(document, range.start),
        getContentAttributesAtPoint(document, range.start),
        getInlineTextAttributesAtPoint(document, range.start),
        getBlockNodeAtPoint(document, range.start).key
      )
    )
  }

  for (
    let i = range.start.blockNodeIndex + 1;
    i < range.end.blockNodeIndex;
    i++
  ) {
    newContent.push(document.blockNodes[i])
  }

  if (range.end.type === PointType.InNonContentBlockNode) {
    newContent.push(getBlockNodeAtPoint(document, range.end))
  } else {
    newContent.push(
      createContentOrEmptyBlockNode(
        getBlockNodeContentBeforePointInDocument(document, range.end),
        getContentAttributesAtPoint(document, range.end),
        getInlineTextAttributesAtPoint(document, range.end),
        getBlockNodeAtPoint(document, range.end).key
      )
    )
  }

  return createFragment<
    ContentBlockAttributes,
    VoidBlockAttributes,
    InlineTextAttributes,
    InlineVoidAttributes
  >(newContent)
}
