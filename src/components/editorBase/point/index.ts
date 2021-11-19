export enum PointType {
  AtEndOfLine,
  InNonContentBlockNode,
  AtStartOfVoidInlineNode,
  InTextNode
}

export interface ContentBlockPointAtEndOfLine {
  readonly type: PointType.AtEndOfLine
}

export interface ContentBlockPointAtStartOfVoidInlineNode {
  readonly type: PointType.AtStartOfVoidInlineNode
  readonly inlineNodeIndex: number
}

export interface ContentBlockPointInTextNode {
  readonly type: PointType.InTextNode
  readonly inlineNodeIndex: number
  readonly textOffset: number
}

export interface PointAtEndOfLine extends ContentBlockPointAtEndOfLine {
  readonly blockNodeIndex: number
}

export interface PointInNonContentBlockNode {
  readonly type: PointType.InNonContentBlockNode
  readonly blockNodeIndex: number
}

export interface PointAtStartOfVoidInlineNode
  extends ContentBlockPointAtStartOfVoidInlineNode {
  readonly blockNodeIndex: number
}

export interface PointInTextNode extends ContentBlockPointInTextNode {
  readonly blockNodeIndex: number
}

export type ContentBlockPoint =
  | ContentBlockPointAtEndOfLine
  | ContentBlockPointAtStartOfVoidInlineNode
  | ContentBlockPointInTextNode

export type Point =
  | PointAtEndOfLine
  | PointInNonContentBlockNode
  | PointAtStartOfVoidInlineNode
  | PointInTextNode

export type PointInContentBlockNode =
  | PointAtEndOfLine
  | PointAtStartOfVoidInlineNode
  | PointInTextNode

export function createPointAtEndOfLine(
  blockNodeIndex: number
): PointAtEndOfLine {
  return {
    type: PointType.AtEndOfLine,
    blockNodeIndex
  }
}

export function createPointInNonContentBlockNode(
  blockNodeIndex: number
): PointInNonContentBlockNode {
  return {
    type: PointType.InNonContentBlockNode,
    blockNodeIndex
  }
}

export function createPointAtStartOfVoidInlineNode(
  blockNodeIndex: number,
  inlineNodeIndex: number
): PointAtStartOfVoidInlineNode {
  return {
    type: PointType.AtStartOfVoidInlineNode,
    blockNodeIndex,
    inlineNodeIndex
  }
}

export function createPointInTextNode(
  blockNodeIndex: number,
  inlineNodeIndex: number,
  textOffset: number
): PointInTextNode {
  return {
    type: PointType.InTextNode,
    blockNodeIndex,
    inlineNodeIndex,
    textOffset
  }
}
