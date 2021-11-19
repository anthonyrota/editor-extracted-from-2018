import { Editor } from '.'
import { Direction } from '../direction'
import { getDirectionToPoint } from '../direction/getDirectionToPoint'
import { createDocument, Document } from '../document'
import { DocumentMeta } from '../document/meta'
import { Fragment } from '../fragment'
import {
  BlockNode,
  BlockNodeType,
  ContentBlockNode,
  createContentBlockNode
} from '../node'
import { createContentOrEmptyBlockNode } from '../node/createContentOrEmptyBlockNode'
import { getBlockNodeAtPoint } from '../node/getBlockNodeAtPoint'
import { splitBlockNodeContentAtPointInDocument } from '../node/getBlockNodeContent'
import { getContentAttributesAtPoint } from '../node/getContentAttributesAtPoint'
import { getInlineTextAttributesAtPoint } from '../node/getInlineTextAttributesAtPoint'
import { pushIntoContentList } from '../node/pushIntoContentList'
import {
  createPointAtEndOfLine,
  createPointInNonContentBlockNode,
  Point,
  PointType
} from '../point'
import { arePointsEqual } from '../point/arePointsEqual'
import { changePointBlockNodeIndex } from '../point/changePointBlockNodeIndex'
import { Selection } from '../selection'
import { isSelectionEmpty } from '../selection/isSelectionEmpty'
import { mapSelectionPoints } from '../selection/mapSelectionPoints'
import { createValue } from '../value'
import { adjustPointAfterContentChange } from './adjustPointAfterContentChange'

export function insertFragmentAtPoint<
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
  point: Point,
  fragment: Fragment<
    ContentBlockAttributes,
    VoidBlockAttributes,
    InlineTextAttributes,
    InlineVoidAttributes
  >
): Point {
  const { collapsedCursorInlineTextAttributes } = editor
  const { document, selection } = editor.value
  const inlineAttributes = isSelectionCollapsedAtPoint(selection, point)
    ? collapsedCursorInlineTextAttributes
    : getInlineTextAttributesAtPoint(document, point)

  const blockNodesToInsert = fragment.blockNodes
  const replacementBlockNodes: Array<
    BlockNode<
      ContentBlockAttributes,
      VoidBlockAttributes,
      InlineTextAttributes,
      InlineVoidAttributes
    >
  > = []

  const selectedBlockNode = getBlockNodeAtPoint(document, point)
  const contentAttributes = getContentAttributesAtPoint(document, point)
  const [contentAtStart, contentAtEnd] = splitBlockNodeContentAtPointInDocument(
    document,
    point
  )

  replacementBlockNodes.push(
    createContentOrEmptyBlockNode(
      contentAtStart,
      contentAttributes,
      inlineAttributes,
      selectedBlockNode.key
    )
  )

  mergeBlockNodeIntoList(
    replacementBlockNodes,
    blockNodesToInsert[0],
    document.meta
  )

  for (let i = 1; i < blockNodesToInsert.length; i++) {
    replacementBlockNodes.push(blockNodesToInsert[i])
  }

  const blockNodeWithContentAtEnd = createContentOrEmptyBlockNode(
    contentAtEnd,
    contentAttributes,
    inlineAttributes
  )

  mergeBlockNodeIntoList(
    replacementBlockNodes,
    blockNodeWithContentAtEnd,
    document.meta
  )

  const newBlockNodes = document.blockNodes.slice()
  newBlockNodes.splice(point.blockNodeIndex, 1, ...replacementBlockNodes)

  const newDocument = createDocument(newBlockNodes, document.meta)
  const newSelection = adjustSelectionAfterInsertion(
    document,
    newDocument,
    point,
    replacementBlockNodes,
    selection
  )

  editor.save(createValue(newSelection, newDocument))

  return adjustPointAfterInsertion(
    document,
    point,
    replacementBlockNodes,
    point
  )
}

function mergeContentBlockNodes<
  ContentBlockAttributes,
  InlineTextAttributes,
  InlineVoidAttributes
>(
  first: ContentBlockNode<
    ContentBlockAttributes,
    InlineTextAttributes,
    InlineVoidAttributes
  >,
  second: ContentBlockNode<
    ContentBlockAttributes,
    InlineTextAttributes,
    InlineVoidAttributes
  >,
  meta: DocumentMeta<unknown, unknown, InlineTextAttributes, unknown>
): ContentBlockNode<
  ContentBlockAttributes,
  InlineTextAttributes,
  InlineVoidAttributes
> {
  const newContent = first.content.slice()
  pushIntoContentList(newContent, second.content, meta)

  return createContentBlockNode(newContent, first.attributes, first.key)
}

function mergeBlockNodeIntoList<
  ContentBlockAttributes,
  VoidBlockAttributes,
  InlineTextAttributes,
  InlineVoidAttributes
>(
  blockNodes: Array<
    BlockNode<
      ContentBlockAttributes,
      VoidBlockAttributes,
      InlineTextAttributes,
      InlineVoidAttributes
    >
  >,
  blockNode: BlockNode<
    ContentBlockAttributes,
    VoidBlockAttributes,
    InlineTextAttributes,
    InlineVoidAttributes
  >,
  meta: DocumentMeta<unknown, unknown, InlineTextAttributes, unknown>
): void {
  const lastBlockNodeInList = blockNodes[blockNodes.length - 1]

  if (blockNode.type === BlockNodeType.Empty) {
    return
  }

  if (
    lastBlockNodeInList.type === BlockNodeType.Void ||
    blockNode.type === BlockNodeType.Void
  ) {
    blockNodes.push(blockNode)
  } else if (lastBlockNodeInList.type === BlockNodeType.Empty) {
    blockNodes[blockNodes.length - 1] = blockNode
  } else {
    blockNodes[blockNodes.length - 1] = mergeContentBlockNodes(
      lastBlockNodeInList,
      blockNode,
      meta
    )
  }
}

function isSelectionCollapsedAtPoint(
  selection: Selection,
  point: Point
): boolean {
  return isSelectionEmpty(selection) && arePointsEqual(selection.anchor, point)
}

function adjustPointAfterInsertion(
  oldDocument: Document<unknown, unknown, unknown, unknown>,
  insertionPoint: Point,
  replacementBlockNodes: ReadonlyArray<
    BlockNode<unknown, unknown, unknown, unknown>
  >,
  point: Point
): Point {
  const direction = getDirectionToPoint(insertionPoint, point)

  if (direction === Direction.Backward) {
    return point
  }

  const amountInserted = replacementBlockNodes.length - 1
  const newBlockNodeIndex = point.blockNodeIndex + amountInserted

  if (insertionPoint.blockNodeIndex !== point.blockNodeIndex) {
    return changePointBlockNodeIndex(insertionPoint, newBlockNodeIndex)
  }

  const lastBlockNode = replacementBlockNodes[amountInserted]

  if (lastBlockNode.type !== BlockNodeType.Content) {
    return createPointInNonContentBlockNode(newBlockNodeIndex)
  }

  if (
    insertionPoint.type === PointType.InNonContentBlockNode ||
    point.type === PointType.InNonContentBlockNode
  ) {
    return createPointAtEndOfLine(newBlockNodeIndex)
  }

  return adjustPointAfterContentChange(
    oldDocument,
    lastBlockNode.content,
    point,
    newBlockNodeIndex
  )
}

function adjustSelectionAfterInsertion(
  oldDocument: Document<unknown, unknown, unknown, unknown>,
  newDocument: Document<unknown, unknown, unknown, unknown>,
  insertionPoint: Point,
  replacementBlockNodes: ReadonlyArray<
    BlockNode<unknown, unknown, unknown, unknown>
  >,
  selection: Selection
): Selection {
  return mapSelectionPoints(newDocument, selection, point =>
    adjustPointAfterInsertion(
      oldDocument,
      insertionPoint,
      replacementBlockNodes,
      point
    )
  )
}
