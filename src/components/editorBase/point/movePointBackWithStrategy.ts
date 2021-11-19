import {
  createPointAtStartOfVoidInlineNode,
  createPointInTextNode,
  Point,
  PointInTextNode,
  PointType
} from '.'
import { Document } from '../document'
import { assertIsPointInDocument } from '../document/assertIsPointInDocument'
import { InlineNodeType } from '../node'
import { getBlockNodeAtPoint } from '../node/getBlockNodeAtPoint'
import { getPointAtEndOfBlockNodeInDocument } from './getPointAtEndOfBlockNodeInDocument'

export function movePointBackWithStrategy(
  document: Document<unknown, unknown, unknown, unknown>,
  point: Point,
  strategy: (
    document: Document<unknown, unknown, unknown, unknown>,
    textPoint: PointInTextNode
  ) => Point
): Point {
  assertIsPointInDocument(document, point)

  if (point.type === PointType.InNonContentBlockNode) {
    return point.blockNodeIndex !== 0
      ? getPointAtEndOfBlockNodeInDocument(document, point.blockNodeIndex - 1)
      : point
  }

  const blockNode = getBlockNodeAtPoint(document, point)

  let textPoint: PointInTextNode

  if (point.type === PointType.InTextNode && point.textOffset > 0) {
    textPoint = point
  } else {
    let inlineNodeIndex: number

    if (point.type === PointType.AtEndOfLine) {
      inlineNodeIndex = blockNode.content.length - 1
    } else {
      if (point.inlineNodeIndex === 0) {
        return point.blockNodeIndex !== 0
          ? getPointAtEndOfBlockNodeInDocument(
              document,
              point.blockNodeIndex - 1
            )
          : point
      }

      inlineNodeIndex = point.inlineNodeIndex - 1
    }

    const newInlineNode = blockNode.content[inlineNodeIndex]

    if (newInlineNode.type === InlineNodeType.Void) {
      return createPointAtStartOfVoidInlineNode(
        point.blockNodeIndex,
        inlineNodeIndex
      )
    }

    textPoint = createPointInTextNode(
      point.blockNodeIndex,
      inlineNodeIndex,
      newInlineNode.text.length
    )
  }

  return strategy(document, textPoint)
}
