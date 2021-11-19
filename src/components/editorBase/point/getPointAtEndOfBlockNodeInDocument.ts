import {
  createPointAtEndOfLine,
  createPointInNonContentBlockNode,
  Point
} from '.'
import { Document } from '../document'
import { BlockNodeType } from '../node'

export function getPointAtEndOfBlockNodeInDocument(
  document: Document<unknown, unknown, unknown, unknown>,
  index: number
): Point {
  return document.blockNodes[index].type !== BlockNodeType.Content
    ? createPointInNonContentBlockNode(index)
    : createPointAtEndOfLine(index)
}
