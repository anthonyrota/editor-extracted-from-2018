import { Point } from '.'

export function changePointBlockNodeIndex(
  point: Point,
  newBlockNodeIndex: number
): Point {
  return newBlockNodeIndex === point.blockNodeIndex
    ? point
    : { ...point, blockNodeIndex: newBlockNodeIndex }
}
