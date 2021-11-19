import { always } from 'rambda'
import { allPass } from 'utils/allPass'
import { anyPass } from 'utils/anyPass'
import { isIOS, isMac } from 'utils/environment'
import { ifElse } from 'utils/ifElse'
import { not } from 'utils/not'

export const isApple = always(isIOS || isMac)

export interface CompatibleKeyboardEvent {
  readonly altKey: boolean
  readonly ctrlKey: boolean
  readonly shiftKey: boolean
  readonly metaKey: boolean
  readonly keyCode: number
}

export function hasShiftKey(event: CompatibleKeyboardEvent): boolean {
  return event.shiftKey
}

export function hasControlKey(event: CompatibleKeyboardEvent): boolean {
  return event.ctrlKey && !event.altKey && !event.metaKey
}

export function hasOptionKey(event: CompatibleKeyboardEvent): boolean {
  return isApple() && event.altKey && !event.ctrlKey && !event.metaKey
}

export function hasCommandModifier(event: CompatibleKeyboardEvent): boolean {
  return isApple() ? event.metaKey && !event.altKey : hasControlKey(event)
}

export function hasNoModifiers(event: CompatibleKeyboardEvent): boolean {
  return !event.ctrlKey && !event.altKey && !event.metaKey
}

export function hasKeyCode(
  keyCode: number
): (event: CompatibleKeyboardEvent) => boolean {
  return event => event.keyCode === keyCode
}

export const I = 73
export const B = 66
export const DOWN = 40
export const RIGHT = 39
export const UP = 38
export const LEFT = 37
export const BACKSPACE = 8
export const DELETE = 46
export const ENTER = 13
export const K = 75
export const O = 79
export const Z = 90
export const Y = 89
export const T = 84
export const D = 68
export const H = 72
export const ZERO = 48
export const BACKSLASH = 220
export const SPACE = 32

export const isItalic = allPass([hasCommandModifier, hasKeyCode(I)])
export const isBold = allPass([hasCommandModifier, hasKeyCode(B)])

export const isCompose = anyPass([
  hasKeyCode(DOWN),
  hasKeyCode(LEFT),
  hasKeyCode(RIGHT),
  hasKeyCode(UP),
  hasKeyCode(BACKSPACE),
  hasKeyCode(ENTER)
])

export const hasMoveBackwardKeys = allPass([not(hasShiftKey), hasKeyCode(LEFT)])
export const hasMoveForwardKeys = allPass([not(hasShiftKey), hasKeyCode(RIGHT)])
export const hasExtendBackwardKeys = allPass([hasShiftKey, hasKeyCode(LEFT)])
export const hasExtendForwardKeys = allPass([hasShiftKey, hasKeyCode(RIGHT)])
export const hasDeleteBackwardKeys = hasKeyCode(BACKSPACE)
export const hasDeleteForwardKeys = hasKeyCode(DELETE)

export const hasWordModifier = ifElse(isApple, hasOptionKey, hasControlKey)

export const isMoveBackward = allPass([hasNoModifiers, hasMoveBackwardKeys])
export const isMoveForward = allPass([hasNoModifiers, hasMoveForwardKeys])
export const isExtendBackward = allPass([hasNoModifiers, hasExtendBackwardKeys])
export const isExtendForward = allPass([hasNoModifiers, hasExtendForwardKeys])
export const isDeleteBackward = anyPass([
  allPass([hasNoModifiers, hasDeleteBackwardKeys]),
  allPass([hasControlKey, hasKeyCode(H)])
])
export const isDeleteForward = anyPass([
  allPass([hasNoModifiers, hasDeleteForwardKeys]),
  allPass([hasControlKey, hasKeyCode(D)])
])

export const isMoveWordBackward = allPass([
  hasWordModifier,
  hasMoveBackwardKeys
])
export const isMoveWordForward = allPass([hasWordModifier, hasMoveForwardKeys])
export const isExtendWordBackward = allPass([
  hasWordModifier,
  hasExtendBackwardKeys
])
export const isExtendWordForward = allPass([
  hasWordModifier,
  hasExtendForwardKeys
])
export const isDeleteWordBackward = allPass([
  hasWordModifier,
  hasDeleteBackwardKeys
])
export const isDeleteWordForward = allPass([
  hasWordModifier,
  hasDeleteForwardKeys
])

export const isDeleteLineBackward = allPass([
  isApple,
  hasCommandModifier,
  hasDeleteBackwardKeys
])
export const isDeleteLineForward = allPass([
  isApple,
  anyPass([
    allPass([hasCommandModifier, hasDeleteForwardKeys]),
    allPass([hasControlKey, hasKeyCode(K)])
  ])
])

export const isSplitBlock = anyPass([
  allPass([hasNoModifiers, hasKeyCode(ENTER)]),
  allPass([isApple, hasControlKey, hasKeyCode(O)])
])

export const isUndo = allPass([hasCommandModifier, hasKeyCode(Z)])
export const isRedo = allPass([
  hasCommandModifier,
  ifElse(isApple, allPass([hasShiftKey, hasKeyCode(Z)]), hasKeyCode(Y))
])

export const isTransposeCharacter = allPass([
  isApple,
  hasControlKey,
  hasKeyCode(T)
])

export const isClearBlockStyle = allPass([
  hasCommandModifier,
  hasShiftKey,
  hasKeyCode(ZERO)
])

export const isClearTextStyle = anyPass([
  allPass([hasCommandModifier, not(hasShiftKey), hasKeyCode(BACKSLASH)]),
  allPass([not(isApple), hasControlKey, not(hasShiftKey), hasKeyCode(SPACE)])
])
