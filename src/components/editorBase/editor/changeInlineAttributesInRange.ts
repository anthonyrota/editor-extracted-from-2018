import { Editor } from '.'
import { createDocument } from '../document'
import {
  BlockNode,
  BlockNodeType,
  createContentBlockNode,
  createEmptyBlockNode,
  createInlineTextNode,
  createInlineVoidNode,
  InlineNode,
  InlineNodeType,
  InlineTextNode
} from '../node'
import { getBlockNodeAtPoint } from '../node/getBlockNodeAtPoint'
import { getInlineNodeAtPoint } from '../node/getInlineNodeAtPoint'
import { getInlineTextNodeAtIndex } from '../node/getInlineTextNodeAtIndex'
import { pushInlineNodeIntoContent } from '../node/pushInlineNodeIntoContent'
import { sliceInlineTextNode } from '../node/sliceInlineTextNode'
import {
  Point,
  PointAtStartOfVoidInlineNode,
  PointInTextNode,
  PointType
} from '../point'
import { Range } from '../range'
import { isRangeEmpty } from '../range/isRangeEmpty'
import { createSelection } from '../selection'
import { Mutable } from '../utils/types'
import { createValue } from '../value'

export function changeInlineAttributesInRange<
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
  changeInlineTextAttributes?: (
    attributes: InlineTextAttributes
  ) => InlineTextAttributes,
  changeInlineVoidAttributes?: (
    attributes: InlineVoidAttributes
  ) => InlineVoidAttributes
): void {
  const { document, selection } = editor.value

  if (
    isRangeEmpty(range) &&
    getBlockNodeAtPoint(document, range.start).type !== BlockNodeType.Empty
  ) {
    return
  }

  const { start, end } = range
  let newBlockNodes:
    | Array<
        BlockNode<
          ContentBlockAttributes,
          VoidBlockAttributes,
          InlineTextAttributes,
          InlineVoidAttributes
        >
      >
    | undefined

  const { anchor, cursor } = selection
  const newAnchor = asMutablePoint(anchor)
  const newCursor = asMutablePoint(cursor)

  for (let i = start.blockNodeIndex; i <= end.blockNodeIndex; i++) {
    const startPoint = i === start.blockNodeIndex && start
    const endPoint = i === end.blockNodeIndex && end
    const blockNode = document.blockNodes[i]

    if (
      (startPoint && startPoint.type === PointType.InNonContentBlockNode) ||
      (endPoint && endPoint.type === PointType.InNonContentBlockNode) ||
      blockNode.type !== BlockNodeType.Content
    ) {
      if (
        blockNode.type === BlockNodeType.Empty &&
        changeInlineTextAttributes
      ) {
        const newAttributes = changeInlineTextAttributes(
          blockNode.inlineAttributes
        )

        if (
          !document.meta.areInlineTextAttributesEqual(
            blockNode.inlineAttributes,
            newAttributes
          )
        ) {
          if (!newBlockNodes) {
            newBlockNodes = document.blockNodes.slice()
          }

          newBlockNodes[i] = createEmptyBlockNode(
            blockNode.attributes,
            newAttributes,
            blockNode.key
          )
        }
      }
      continue
    }

    let startIndex: number
    let endIndex: number

    let newContent:
      | Array<InlineNode<InlineTextAttributes, InlineVoidAttributes>>
      | undefined

    if (startPoint) {
      if (startPoint.type === PointType.AtEndOfLine) {
        continue
      }

      if (
        startPoint.type === PointType.InTextNode &&
        startPoint.textOffset > 0
      ) {
        if (changeInlineTextAttributes) {
          const inlineNode = getInlineNodeAtPoint(blockNode.content, startPoint)
          const newAttributes = changeInlineTextAttributes(
            inlineNode.attributes
          )

          if (
            !document.meta.areInlineTextAttributesEqual(
              inlineNode.attributes,
              newAttributes
            )
          ) {
            newContent = blockNode.content.slice(0, startPoint.inlineNodeIndex)

            if (
              endPoint &&
              endPoint.type === PointType.InTextNode &&
              startPoint.inlineNodeIndex === endPoint.inlineNodeIndex
            ) {
              movePointAfterSplitFromStartToEnd(
                anchor,
                newAnchor,
                startPoint,
                endPoint,
                i
              )
              movePointAfterSplitFromStartToEnd(
                cursor,
                newCursor,
                startPoint,
                endPoint,
                i
              )

              newContent.push(
                sliceInlineTextNode(inlineNode, 0, startPoint.textOffset),
                createInlineTextNode(
                  inlineNode.text.slice(
                    startPoint.textOffset,
                    endPoint.textOffset
                  ),
                  newAttributes
                ),
                sliceInlineTextNodeWithNewKey(inlineNode, endPoint.textOffset)
              )
            } else {
              movePointAfterSplit(anchor, newAnchor, startPoint, i)
              movePointAfterSplit(cursor, newCursor, startPoint, i)

              newContent.push(
                sliceInlineTextNode(inlineNode, 0, startPoint.textOffset),
                createInlineTextNode(
                  inlineNode.text.slice(startPoint.textOffset),
                  newAttributes
                )
              )
            }
          }
        }

        startIndex = startPoint.inlineNodeIndex + 1
      } else {
        startIndex = startPoint.inlineNodeIndex
      }
    } else {
      startIndex = 0
    }

    if (!endPoint || endPoint.type === PointType.AtEndOfLine) {
      endIndex = blockNode.content.length
    } else {
      endIndex = endPoint.inlineNodeIndex
    }

    for (let j = startIndex; j < endIndex; j++) {
      const inlineNode = blockNode.content[j]
      let newInlineNode:
        | InlineNode<InlineTextAttributes, InlineVoidAttributes>
        | undefined

      if (inlineNode.type === InlineNodeType.Text) {
        if (changeInlineTextAttributes) {
          const newAttributes = changeInlineTextAttributes(
            inlineNode.attributes
          )

          if (
            !document.meta.areInlineTextAttributesEqual(
              inlineNode.attributes,
              newAttributes
            )
          ) {
            newInlineNode = createInlineTextNode(
              inlineNode.text,
              newAttributes,
              inlineNode.key
            )
          }
        }
      } else if (changeInlineVoidAttributes) {
        const newAttributes = changeInlineVoidAttributes(inlineNode.attributes)

        if (
          !document.meta.areInlineVoidAttributesEqual(
            inlineNode.attributes,
            newAttributes
          )
        ) {
          newInlineNode = createInlineVoidNode(newAttributes, inlineNode.key)
        }
      }

      if (!newInlineNode && newContent) {
        newInlineNode = inlineNode
      }

      if (newInlineNode) {
        if (!newContent) {
          newContent = blockNode.content.slice(0, j)
        }

        if (
          pushInlineNodeIntoContent(newContent, newInlineNode, document.meta)
        ) {
          movePointAfterMergingInlineNode(
            anchor,
            newAnchor,
            newContent,
            newInlineNode,
            i,
            j
          )
          movePointAfterMergingInlineNode(
            cursor,
            newCursor,
            newContent,
            newInlineNode,
            i,
            j
          )
        }
      }
    }

    if (
      endPoint &&
      endPoint.type === PointType.InTextNode &&
      endPoint.textOffset > 0
    ) {
      if (
        startPoint &&
        startPoint.type === PointType.InTextNode &&
        startPoint.inlineNodeIndex === endPoint.inlineNodeIndex &&
        startPoint.textOffset > 0
      ) {
        endIndex++
      } else {
        const inlineNode = getInlineNodeAtPoint(blockNode.content, endPoint)

        if (changeInlineTextAttributes) {
          const newAttributes = changeInlineTextAttributes(
            inlineNode.attributes
          )

          if (
            !document.meta.areInlineTextAttributesEqual(
              inlineNode.attributes,
              newAttributes
            )
          ) {
            if (!newContent) {
              newContent = blockNode.content.slice(0, endPoint.inlineNodeIndex)
            }

            const firstPart = createInlineTextNode(
              inlineNode.text.slice(0, endPoint.textOffset),
              newAttributes,
              inlineNode.key
            )
            if (
              pushInlineNodeIntoContent(newContent, firstPart, document.meta)
            ) {
              movePointAfterMergingInlineNode(
                anchor,
                newAnchor,
                newContent,
                firstPart,
                i,
                endPoint.inlineNodeIndex
              )
              movePointAfterMergingInlineNode(
                cursor,
                newCursor,
                newContent,
                firstPart,
                i,
                endPoint.inlineNodeIndex
              )
            }

            movePointAfterSplit(anchor, newAnchor, endPoint, i)
            movePointAfterSplit(cursor, newCursor, endPoint, i)

            newContent.push(
              sliceInlineTextNodeWithNewKey(inlineNode, endPoint.textOffset)
            )

            endIndex++
          }
        }
      }
    }

    if (newContent && endIndex < blockNode.content.length) {
      const firstNodeToAdd = blockNode.content[endIndex]

      if (
        pushInlineNodeIntoContent(newContent, firstNodeToAdd, document.meta)
      ) {
        movePointAfterMergingInlineNode(
          anchor,
          newAnchor,
          newContent,
          firstNodeToAdd,
          i,
          endIndex
        )
        movePointAfterMergingInlineNode(
          cursor,
          newCursor,
          newContent,
          firstNodeToAdd,
          i,
          endIndex
        )
      }

      for (let i = endIndex + 1; i < blockNode.content.length; i++) {
        newContent.push(blockNode.content[i])
      }
    }

    if (newContent) {
      if (!newBlockNodes) {
        newBlockNodes = document.blockNodes.slice()
      }

      newBlockNodes[i] = createContentBlockNode(
        newContent,
        blockNode.attributes,
        blockNode.key
      )
    }
  }

  if (newBlockNodes) {
    const newDocument = createDocument(newBlockNodes, document.meta)
    const newSelection = createSelection(newAnchor, newCursor)

    editor.save(createValue(newSelection, newDocument))
  }
}

function sliceInlineTextNodeWithNewKey<InlineTextAttributes>(
  inlineTextNode: InlineTextNode<InlineTextAttributes>,
  start?: number,
  end?: number
): InlineTextNode<InlineTextAttributes> {
  return createInlineTextNode(
    inlineTextNode.text.slice(start, end),
    inlineTextNode.attributes
  )
}

function asMutablePoint<T extends Point>(point: T): Mutable<T> {
  return { ...point }
}

function isInInlineNode(
  point: Point
): point is PointAtStartOfVoidInlineNode | PointInTextNode {
  return (
    point.type === PointType.AtStartOfVoidInlineNode ||
    point.type === PointType.InTextNode
  )
}

function movePointAfterSplitFromStartToEnd(
  oldPoint: Point,
  newPoint: Mutable<Point>,
  splitStart: PointInTextNode,
  splitEnd: PointInTextNode,
  blockNodeIndex: number
): void {
  if (
    isInInlineNode(oldPoint) &&
    isInInlineNode(newPoint) &&
    oldPoint.blockNodeIndex === blockNodeIndex
  ) {
    if (oldPoint.inlineNodeIndex > splitStart.inlineNodeIndex) {
      newPoint.inlineNodeIndex += 2
    } else if (
      oldPoint.type === PointType.InTextNode &&
      newPoint.type === PointType.InTextNode &&
      oldPoint.inlineNodeIndex === splitStart.inlineNodeIndex
    ) {
      if (oldPoint.textOffset >= splitEnd.textOffset) {
        newPoint.inlineNodeIndex += 2
        newPoint.textOffset -= splitEnd.textOffset
      } else if (oldPoint.textOffset >= splitStart.textOffset) {
        newPoint.inlineNodeIndex++
        newPoint.textOffset -= splitStart.textOffset
      }
    }
  }
}

function movePointAfterSplit(
  oldPoint: Point,
  newPoint: Mutable<Point>,
  splitAt: PointInTextNode,
  blockNodeIndex: number
): void {
  if (
    isInInlineNode(oldPoint) &&
    isInInlineNode(newPoint) &&
    oldPoint.blockNodeIndex === blockNodeIndex
  ) {
    if (oldPoint.inlineNodeIndex > splitAt.inlineNodeIndex) {
      newPoint.inlineNodeIndex++
    } else if (
      oldPoint.type === PointType.InTextNode &&
      newPoint.type === PointType.InTextNode &&
      oldPoint.inlineNodeIndex === splitAt.inlineNodeIndex &&
      oldPoint.textOffset >= splitAt.textOffset
    ) {
      newPoint.inlineNodeIndex++
      newPoint.textOffset -= splitAt.textOffset
    }
  }
}

function movePointAfterMergingInlineNode(
  oldPoint: Point,
  newPoint: Mutable<Point>,
  newContent: Array<InlineNode<unknown, unknown>>,
  addedNode: InlineTextNode<unknown>,
  blockNodeIndex: number,
  oldInlineNodeIndex: number
): void {
  if (
    isInInlineNode(oldPoint) &&
    isInInlineNode(newPoint) &&
    oldPoint.blockNodeIndex === blockNodeIndex
  ) {
    if (oldPoint.inlineNodeIndex >= oldInlineNodeIndex) {
      newPoint.inlineNodeIndex--
      if (
        oldPoint.type === PointType.InTextNode &&
        newPoint.type === PointType.InTextNode &&
        oldPoint.inlineNodeIndex === oldInlineNodeIndex
      ) {
        if (oldPoint.textOffset < addedNode.text.length) {
          newPoint.textOffset +=
            getInlineTextNodeAtIndex(newContent, newContent.length - 1).text
              .length - addedNode.text.length
        }
      }
    }
  }
}
