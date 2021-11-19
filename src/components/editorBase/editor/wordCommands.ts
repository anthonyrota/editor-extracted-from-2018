import { Document } from '../document'
import { InlineNode, InlineNodeType } from '../node'
import { getBlockNodeAtPoint } from '../node/getBlockNodeAtPoint'
import { getInlineNodeAtPoint } from '../node/getInlineNodeAtPoint'
import { getInlineTextNodeAtIndex } from '../node/getInlineTextNodeAtIndex'
import {
  ContentBlockPointInTextNode,
  createPointAtEndOfLine,
  createPointInTextNode,
  Point,
  PointInTextNode
} from '../point'
import { movePointBackWithStrategy } from '../point/movePointBackWithStrategy'
import { movePointForwardWithStrategy } from '../point/movePointForwardWithStrategy'
import { convertRangeCommandToSelectionCommand } from './convertRangeCommandToSelectionCommand'
import {
  createDeleteBackwardAtRangeCommand,
  createDeleteForwardAtRangeCommand,
  createMoveBackwardCommand,
  createMoveCursorCommand,
  createMoveForwardCommand
} from './createMovementCommands'

export const moveWordBackward = createMoveBackwardCommand(movePointBackOneWord)
export const moveWordForward = createMoveForwardCommand(movePointForwardOneWord)
export const moveCursorWordBackward = createMoveCursorCommand(
  movePointBackOneWord
)
export const moveCursorWordForward = createMoveCursorCommand(
  movePointForwardOneWord
)
export const deleteWordBackwardAtRange = createDeleteBackwardAtRangeCommand(
  movePointBackOneWord
)
export const deleteWordForwardAtRange = createDeleteForwardAtRangeCommand(
  movePointForwardOneWord
)
export const deleteWordBackward = convertRangeCommandToSelectionCommand(
  deleteWordBackwardAtRange
)
export const deleteWordForward = convertRangeCommandToSelectionCommand(
  deleteWordForwardAtRange
)

// \u00a1-\u00b1\u00b4-\u00b8\u00ba\u00bb\u00bf
//             is latin supplement punctuation except fractions and superscript
//             numbers
// \u2010-\u2027\u2030-\u205e
//             is punctuation from the general punctuation block:
//             weird quotes, commas, bullets, dashes, etc.
// \u30fb\u3001\u3002\u3008-\u3011\u3014-\u301f
//             is CJK punctuation
// \uff1a-\uff1f\uff01-\uff0f\uff3b-\uff40\uff5b-\uff65
//             is some full-width/half-width punctuation
// \u2E2E\u061f\u066a-\u066c\u061b\u060c\u060d\uFD3e\uFD3F
//             is some Arabic punctuation marks
// \u1801\u0964\u104a\u104b
//             is misc. other language punctuation marks
const PUNCTUATION =
  '[.,+*?$|#{}()\'\\^\\-\\[\\]\\\\\\/!@%"~=<>_:\u30fb\u3001\u3002\u3008-\u3011\u3014-\u301f\uff1a-\uff1f\uff01-\uff0f\uff3b-\uff40\uff5b-\uff65\u2E2E\u061f\u066a-\u066c\u061b\u060c\u060d\uFD3e\uFD3F\u1801\u0964\u104a\u104b\u2010-\u2027\u2030-\u205e\u00a1-\u00b1\u00b4-\u00b8\u00ba\u00bb\u00bf]'

const CHAMELEON_CHARS = "['\u2018\u2019]"

// Remove the underscore, which should count as part of the removable word. The
// "chameleon chars" also count as punctuation in this regex.
const WHITESPACE_AND_PUNCTUATION = '\\s|(?![_])' + PUNCTUATION

const WORD_FORWARDS_REGEX = new RegExp(
  '^' +
    '(?:' +
    WHITESPACE_AND_PUNCTUATION +
    ')*' +
    '(?:' +
    CHAMELEON_CHARS +
    '|(?!' +
    WHITESPACE_AND_PUNCTUATION +
    ').)*' +
    '(?:(?!' +
    WHITESPACE_AND_PUNCTUATION +
    ').)'
)

const WORD_BACKWARDS_REGEX = new RegExp(
  '(?:(?!' +
    WHITESPACE_AND_PUNCTUATION +
    ').)' +
    '(?:' +
    CHAMELEON_CHARS +
    '|(?!' +
    WHITESPACE_AND_PUNCTUATION +
    ').)*' +
    '(?:' +
    WHITESPACE_AND_PUNCTUATION +
    ')*' +
    '$'
)

function findFirstWord(text: string) {
  const matches = WORD_FORWARDS_REGEX.exec(text)
  return matches ? matches[0] : text
}

function findLastWord(text: string) {
  const matches = WORD_BACKWARDS_REGEX.exec(text)
  return matches ? matches[0] : text
}

function getTextBeforeContentBlockPointUntilBreak(
  content: ReadonlyArray<InlineNode<unknown, unknown>>,
  point: ContentBlockPointInTextNode
): string {
  const textNode = getInlineNodeAtPoint(content, point)
  let text = textNode.text.slice(0, point.textOffset)

  for (let i = point.inlineNodeIndex - 1; i >= 0; i--) {
    const inlineNode = content[i]

    if (inlineNode.type !== InlineNodeType.Text) {
      break
    }

    text = inlineNode.text + text
  }

  return text
}

function getTextAfterContentBlockPointUntilBreak(
  content: ReadonlyArray<InlineNode<unknown, unknown>>,
  point: ContentBlockPointInTextNode
): string {
  const textNode = getInlineNodeAtPoint(content, point)
  let text = textNode.text.slice(point.textOffset)

  for (let i = point.inlineNodeIndex + 1; i < content.length; i++) {
    const inlineNode = content[i]

    if (inlineNode.type !== InlineNodeType.Text) {
      break
    }

    text += inlineNode.text
  }

  return text
}

const movePointBackOneWordStrategy = (
  document: Document<unknown, unknown, unknown, unknown>,
  point: PointInTextNode
): Point => {
  const blockNode = getBlockNodeAtPoint(document, point)
  const text = getTextBeforeContentBlockPointUntilBreak(
    blockNode.content,
    point
  )

  const word = findLastWord(text)

  if (word.length <= point.textOffset) {
    return createPointInTextNode(
      point.blockNodeIndex,
      point.inlineNodeIndex,
      point.textOffset - word.length
    )
  }

  let newInlineNodeIndex = point.inlineNodeIndex - 1
  let amountRemainingInWord = word.length - point.textOffset

  while (true) {
    const textNode = getInlineTextNodeAtIndex(
      blockNode.content,
      newInlineNodeIndex
    )

    if (amountRemainingInWord <= textNode.text.length) {
      return createPointInTextNode(
        point.blockNodeIndex,
        newInlineNodeIndex,
        textNode.text.length - amountRemainingInWord
      )
    }

    amountRemainingInWord -= textNode.text.length
    newInlineNodeIndex--
  }
}

function movePointBackOneWord(
  document: Document<unknown, unknown, unknown, unknown>,
  point: Point
): Point {
  return movePointBackWithStrategy(
    document,
    point,
    movePointBackOneWordStrategy
  )
}

const movePointForwardOneWordStrategy = (
  document: Document<unknown, unknown, unknown, unknown>,
  point: PointInTextNode
): Point => {
  const blockNode = getBlockNodeAtPoint(document, point)
  const text = getTextAfterContentBlockPointUntilBreak(blockNode.content, point)

  const word = findFirstWord(text)
  const inlineNode = getInlineNodeAtPoint(blockNode.content, point)
  const amountRemainingInFirstNode = inlineNode.text.length - point.textOffset

  if (word.length < amountRemainingInFirstNode) {
    return createPointInTextNode(
      point.blockNodeIndex,
      point.inlineNodeIndex,
      point.textOffset + word.length
    )
  }

  let newInlineNodeIndex = point.inlineNodeIndex + 1
  let amountRemainingInWord = word.length - amountRemainingInFirstNode

  for (; newInlineNodeIndex < blockNode.content.length; newInlineNodeIndex++) {
    const textNode = getInlineTextNodeAtIndex(
      blockNode.content,
      newInlineNodeIndex
    )

    if (amountRemainingInWord < textNode.text.length) {
      return createPointInTextNode(
        point.blockNodeIndex,
        newInlineNodeIndex,
        amountRemainingInWord
      )
    }

    amountRemainingInWord -= textNode.text.length
  }

  return createPointAtEndOfLine(point.blockNodeIndex)
}

function movePointForwardOneWord(
  document: Document<unknown, unknown, unknown, unknown>,
  point: Point
): Point {
  return movePointForwardWithStrategy(
    document,
    point,
    movePointForwardOneWordStrategy
  )
}
