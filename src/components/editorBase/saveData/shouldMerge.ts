import { SaveData, SaveDataType } from '.'
import { Direction } from '../direction'
import { arePointsEqual } from '../point/arePointsEqual'

export function shouldMerge(a?: SaveData, b?: SaveData): boolean {
  if (!b) {
    return false
  }

  if (b.type === SaveDataType.SetSelection) {
    return true
  }

  if (!a) {
    return false
  }

  if (
    a.type === SaveDataType.InsertText &&
    b.type === SaveDataType.InsertText
  ) {
    return arePointsEqual(a.pointAfterInsertion, b.insertionPoint)
  }

  if (
    a.type === SaveDataType.DeleteText &&
    b.type === SaveDataType.DeleteText &&
    a.deletedRangeDirection === b.deletedRangeDirection
  ) {
    return arePointsEqual(
      a.pointAtStartAfterDeletion,
      a.deletedRangeDirection === Direction.Backward
        ? b.deletedRange.end
        : b.deletedRange.start
    )
  }

  return false
}
