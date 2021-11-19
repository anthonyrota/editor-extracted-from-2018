import { InlineNode } from '.'
import { Document } from '../document'
import { ContentBlockPoint, Point, PointType } from '../point'
import { assertDirectionBetweenContentBlockPointsIsNotBackward } from '../range/assertDirectionBetweenPointsIsNotBackwards'
import { createKey } from '../utils/createKey'
import { getBlockNodeAtPoint } from './getBlockNodeAtPoint'
import { getInlineNodeAtPoint } from './getInlineNodeAtPoint'
import { regenerateKey } from './regenerateKey'
import { sliceInlineTextNode } from './sliceInlineTextNode'

export function getBlockNodeContentBeforePoint<
  InlineTextAttributes,
  InlineVoidAttributes
>(
  content: ReadonlyArray<
    InlineNode<InlineTextAttributes, InlineVoidAttributes>
  >,
  point: ContentBlockPoint
): Array<InlineNode<InlineTextAttributes, InlineVoidAttributes>> {
  if (point.type === PointType.AtEndOfLine) {
    return content.slice()
  }

  const blockNodeContentAtStart = content.slice(0, point.inlineNodeIndex)

  if (point.type === PointType.InTextNode && point.textOffset !== 0) {
    blockNodeContentAtStart.push(
      sliceInlineTextNode(
        getInlineNodeAtPoint(content, point),
        0,
        point.textOffset
      )
    )
  }

  return blockNodeContentAtStart
}

export function getBlockNodeContentBeforePointInDocument<
  InlineTextAttributes,
  InlineVoidAttributes
>(
  document: Document<
    unknown,
    unknown,
    InlineTextAttributes,
    InlineVoidAttributes
  >,
  point: Point
): Array<InlineNode<InlineTextAttributes, InlineVoidAttributes>> {
  if (point.type === PointType.InNonContentBlockNode) {
    return []
  }

  return getBlockNodeContentBeforePoint(
    getBlockNodeAtPoint(document, point).content,
    point
  )
}

export function getBlockNodeContentAfterPoint<
  InlineTextAttributes,
  InlineVoidAttributes
>(
  content: ReadonlyArray<
    InlineNode<InlineTextAttributes, InlineVoidAttributes>
  >,
  point: ContentBlockPoint
): Array<InlineNode<InlineTextAttributes, InlineVoidAttributes>> {
  if (point.type === PointType.AtEndOfLine) {
    return []
  }

  const blockNodeContentAtEnd = content.slice(point.inlineNodeIndex + 1)

  if (
    point.type === PointType.AtStartOfVoidInlineNode ||
    point.textOffset === 0
  ) {
    blockNodeContentAtEnd.unshift(getInlineNodeAtPoint(content, point))
  } else {
    blockNodeContentAtEnd.unshift(
      sliceInlineTextNode(
        getInlineNodeAtPoint(content, point),
        point.textOffset
      )
    )
  }

  return blockNodeContentAtEnd
}

export function getBlockNodeContentAfterPointInDocument<
  InlineTextAttributes,
  InlineVoidAttributes
>(
  document: Document<
    unknown,
    unknown,
    InlineTextAttributes,
    InlineVoidAttributes
  >,
  point: Point
): Array<InlineNode<InlineTextAttributes, InlineVoidAttributes>> {
  if (point.type === PointType.InNonContentBlockNode) {
    return []
  }

  return getBlockNodeContentAfterPoint(
    getBlockNodeAtPoint(document, point).content,
    point
  )
}

export function splitBlockNodeContentAtPointInDocument<
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
  point: Point
): [
  Array<InlineNode<InlineTextAttributes, InlineVoidAttributes>>,
  Array<InlineNode<InlineTextAttributes, InlineVoidAttributes>>
] {
  const before = getBlockNodeContentBeforePointInDocument(document, point)
  const after = getBlockNodeContentAfterPointInDocument(document, point)

  if (
    after.length > 0 &&
    before.length > 0 &&
    after[0].key === before[before.length - 1].key
  ) {
    after[0] = regenerateKey(after[0])
  }

  return [before, after]
}

export function getBlockNodeContentBetweenPoints<
  InlineTextAttributes,
  InlineVoidAttributes
>(
  content: ReadonlyArray<
    InlineNode<InlineTextAttributes, InlineVoidAttributes>
  >,
  start: ContentBlockPoint,
  end: ContentBlockPoint
): Array<InlineNode<InlineTextAttributes, InlineVoidAttributes>> {
  assertDirectionBetweenContentBlockPointsIsNotBackward(start, end)

  if (start.type === PointType.AtEndOfLine) {
    return []
  }

  if (end.type === PointType.AtEndOfLine) {
    return getBlockNodeContentAfterPoint(content, start)
  }

  if (start.inlineNodeIndex === end.inlineNodeIndex) {
    if (
      start.type === PointType.InTextNode &&
      end.type === PointType.InTextNode
    ) {
      return [
        sliceInlineTextNode(
          getInlineNodeAtPoint(content, start),
          start.textOffset,
          end.textOffset
        )
      ]
    } else {
      return []
    }
  }

  const blockNodeContentAtMiddle = content.slice(
    start.inlineNodeIndex + 1,
    end.inlineNodeIndex
  )

  if (
    start.type === PointType.AtStartOfVoidInlineNode ||
    start.textOffset === 0
  ) {
    blockNodeContentAtMiddle.unshift(getInlineNodeAtPoint(content, start))
  } else {
    blockNodeContentAtMiddle.unshift(
      sliceInlineTextNode(
        getInlineNodeAtPoint(content, start),
        start.textOffset
      )
    )
  }

  if (end.type === PointType.InTextNode && end.textOffset !== 0) {
    blockNodeContentAtMiddle.push(
      sliceInlineTextNode(getInlineNodeAtPoint(content, end), 0, end.textOffset)
    )
  }

  return blockNodeContentAtMiddle
}
