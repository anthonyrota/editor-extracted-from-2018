import { Direction } from '../direction'
import { Point } from '../point'
import { Range } from '../range'

export enum SaveDataType {
  SetSelection,
  InsertText,
  DeleteText
}

export interface ChangeSelectionSaveData {
  readonly type: SaveDataType.SetSelection
}

export function createChangeSelectionSaveData(): ChangeSelectionSaveData {
  return {
    type: SaveDataType.SetSelection
  }
}

export interface InsertTextSaveData {
  readonly type: SaveDataType.InsertText
  readonly insertionPoint: Point
  readonly pointAfterInsertion: Point
}

export function createInsertTextSaveData(
  insertionPoint: Point,
  pointAfterInsertion: Point
): InsertTextSaveData {
  return {
    type: SaveDataType.InsertText,
    insertionPoint,
    pointAfterInsertion
  }
}

export interface DeleteTextSaveData {
  readonly type: SaveDataType.DeleteText
  readonly deletedRange: Range
  readonly deletedRangeDirection: Direction.Backward | Direction.Forward
  readonly pointAtStartAfterDeletion: Point
}

export function createDeleteTextSaveData(
  deletedRange: Range,
  deletedRangeDirection: Direction.Backward | Direction.Forward,
  pointAtStartAfterDeletion: Point
): DeleteTextSaveData {
  return {
    type: SaveDataType.DeleteText,
    deletedRange,
    deletedRangeDirection,
    pointAtStartAfterDeletion
  }
}

export type SaveData =
  | ChangeSelectionSaveData
  | InsertTextSaveData
  | DeleteTextSaveData
