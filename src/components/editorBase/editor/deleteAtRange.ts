import { Editor } from '.'
import { Direction } from '../direction'
import { createDocument, Document } from '../document'
import { BlockNodeType, createEmptyBlockNode, InlineNode } from '../node'
import { changeBlockNodeContentAtPoint } from '../node/changeBlockNodeContentAtPoint'
import { getBlockNodeAtPoint } from '../node/getBlockNodeAtPoint'
import {
  getBlockNodeContentAfterPointInDocument,
  getBlockNodeContentBeforePointInDocument
} from '../node/getBlockNodeContent'
import { pushIntoContentList } from '../node/pushIntoContentList'
import { regenerateKey } from '../node/regenerateKey'
import {
  createPointAtEndOfLine,
  createPointInNonContentBlockNode,
  Point,
  PointAtEndOfLine,
  PointInNonContentBlockNode,
  PointType
} from '../point'
import { changePointBlockNodeIndex } from '../point/changePointBlockNodeIndex'
import { isPointAfterRange } from '../point/isPointAfterRange'
import { isPointBeforeRange } from '../point/isPointBeforeRange'
import { Range } from '../range'
import { isRangeEmpty } from '../range/isRangeEmpty'
import { createDeleteTextSaveData } from '../saveData'
import { Selection } from '../selection'
import { mapSelectionPoints } from '../selection/mapSelectionPoints'
import { createValue } from '../value'
import { adjustPointAfterContentChange } from './adjustPointAfterContentChange'

export function deleteAtRange<
  ContentBlockAttributes,
  VoidBlockAttributes,
  InlineTextAttributes,
  InlineVoidAttributes
>(
  editor: Editor<
    ContentBlockAttributes,
    VoidBlockAttributes,
    InlineTextAttributes,
    InlineVoidAttributes
  >,
  range: Range,
  direction: Direction.Backward | Direction.Forward
): Point {
  const { document, selection } = editor.value

  if (isRangeEmpty(range)) {
    const point = range.start
    const blockNode = getBlockNodeAtPoint(document, point)

    if (blockNode.type === BlockNodeType.Void) {
      const newBlockNodes = document.blockNodes.slice()
      newBlockNodes[point.blockNodeIndex] = createEmptyBlockNode(
        document.meta.createEmptyContentBlockAttributes(),
        document.meta.createEmptyInlineTextAttributes(),
        blockNode.key
      )

      editor.save(
        createValue(selection, createDocument(newBlockNodes, document.meta)),
        createDeleteTextSaveData(range, direction, range.start)
      )
    }

    return selection.anchor
  }

  const replacementContent = getBlockNodeContentBeforePointInDocument(
    document,
    range.start
  )

  const contentAfterPoint = getBlockNodeContentAfterPointInDocument(
    document,
    range.end
  )

  if (
    replacementContent.length > 0 &&
    contentAfterPoint.length > 0 &&
    contentAfterPoint[0].key ===
      replacementContent[replacementContent.length - 1].key
  ) {
    contentAfterPoint[0] = regenerateKey(contentAfterPoint[0])
  }

  pushIntoContentList(replacementContent, contentAfterPoint, document.meta)

  const newBlockNodes = document.blockNodes.slice()
  const replacementBlockNode = changeBlockNodeContentAtPoint(
    document,
    range.start,
    replacementContent
  )

  newBlockNodes.splice(
    range.start.blockNodeIndex,
    range.end.blockNodeIndex - range.start.blockNodeIndex + 1,
    replacementBlockNode
  )

  const newDocument = createDocument(newBlockNodes, document.meta)
  const newSelection = adjustSelectionAfterDeletion(
    document,
    newDocument,
    range,
    replacementContent,
    selection
  )

  const pointAtStartAfterDeletion = getPointAtStartAfterDeletion(
    document,
    range,
    replacementContent
  )

  editor.save(
    createValue(newSelection, newDocument),
    createDeleteTextSaveData(range, direction, pointAtStartAfterDeletion)
  )

  return pointAtStartAfterDeletion
}

function getPointAtEndOfContent(
  content: ReadonlyArray<InlineNode<unknown, unknown>>,
  blockNodeIndex: number
): PointInNonContentBlockNode | PointAtEndOfLine {
  return content.length === 0
    ? createPointInNonContentBlockNode(blockNodeIndex)
    : createPointAtEndOfLine(blockNodeIndex)
}

function getPointAtStartAfterDeletion(
  oldDocument: Document<unknown, unknown, unknown, unknown>,
  deletedRange: Range,
  replacementContent: ReadonlyArray<InlineNode<unknown, unknown>>
): Point {
  const newBlockNodeIndex = deletedRange.start.blockNodeIndex

  if (deletedRange.end.type === PointType.InNonContentBlockNode) {
    return getPointAtEndOfContent(replacementContent, newBlockNodeIndex)
  }

  return adjustPointAfterContentChange(
    oldDocument,
    replacementContent,
    deletedRange.end,
    newBlockNodeIndex
  )
}

function adjustPointAfterDeletion(
  oldDocument: Document<unknown, unknown, unknown, unknown>,
  deletedRange: Range,
  replacementContent: ReadonlyArray<InlineNode<unknown, unknown>>,
  point: Point
): Point {
  if (isPointBeforeRange(point, deletedRange)) {
    return point
  }

  if (isPointAfterRange(point, deletedRange)) {
    const amountRemoved =
      deletedRange.end.blockNodeIndex - deletedRange.start.blockNodeIndex
    const newBlockNodeIndex = point.blockNodeIndex - amountRemoved

    if (
      point.type !== PointType.InNonContentBlockNode &&
      point.blockNodeIndex === deletedRange.end.blockNodeIndex
    ) {
      return adjustPointAfterContentChange(
        oldDocument,
        replacementContent,
        point,
        newBlockNodeIndex
      )
    }

    return changePointBlockNodeIndex(point, newBlockNodeIndex)
  }

  return getPointAtStartAfterDeletion(
    oldDocument,
    deletedRange,
    replacementContent
  )
}

function adjustSelectionAfterDeletion(
  oldDocument: Document<unknown, unknown, unknown, unknown>,
  newDocument: Document<unknown, unknown, unknown, unknown>,
  deletedRange: Range,
  replacementContent: ReadonlyArray<InlineNode<unknown, unknown>>,
  selection: Selection
): Selection {
  return mapSelectionPoints(newDocument, selection, point =>
    adjustPointAfterDeletion(
      oldDocument,
      deletedRange,
      replacementContent,
      point
    )
  )
}
