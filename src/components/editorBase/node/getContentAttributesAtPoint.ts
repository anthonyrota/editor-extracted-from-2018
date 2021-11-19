import { BlockNodeType } from '.'
import { Document } from '../document'
import { Point } from '../point'
import { getBlockNodeAtPoint } from './getBlockNodeAtPoint'

export function getContentAttributesAtPoint<ContentBlockAttributes>(
  document: Document<ContentBlockAttributes, unknown, unknown, unknown>,
  point: Point
): ContentBlockAttributes {
  const blockNode = getBlockNodeAtPoint(document, point)

  if (blockNode.type !== BlockNodeType.Void) {
    return blockNode.attributes
  }

  return document.meta.createEmptyContentBlockAttributes()
}
