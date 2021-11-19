import { getWindow } from 'utils/getWindow'
import { regenerateDocumentKeys } from '../document/regenerateDocumentKeys'
import { Plugin } from '../editor'
import {
  deleteBackward,
  deleteBackwardAtRange,
  deleteForward,
  deleteForwardAtRange,
  moveBackward,
  moveCursorBackward,
  moveCursorForward,
  moveForward
} from '../editor/characterCommands'
import { deleteSelection } from '../editor/deleteSelection'
import { insertFragment } from '../editor/insertFragment'
import { insertText } from '../editor/insertText'
import { insertTextAtRange } from '../editor/insertTextAtRange'
import {
  deleteLineBackward,
  deleteLineBackwardAtRange,
  deleteLineForward,
  deleteLineForwardAtRange
} from '../editor/lineCommands'
import { removeBlockStyle } from '../editor/removeBlockStyle'
import { removeTextStyle } from '../editor/removeTextStyle'
import { selectVoidNodeAtPoint } from '../editor/selectVoidNodeAtPoint'
import { setAnchorAndCursor } from '../editor/setAnchorAndCursor'
import { splitBlock } from '../editor/splitBlock'
import { splitBlockAtRange } from '../editor/splitBlockAtRange'
import {
  deleteWordBackward,
  deleteWordBackwardAtRange,
  deleteWordForward,
  deleteWordForwardAtRange,
  moveCursorWordBackward,
  moveCursorWordForward,
  moveWordBackward,
  moveWordForward
} from '../editor/wordCommands'
import { getBlockNodeAtPoint } from '../node/getBlockNodeAtPoint'
import { getInlineNodeAtPoint } from '../node/getInlineNodeAtPoint'
import { PointType } from '../point'
import { isPointInVoidNode } from '../point/isPointInVoidNode'
import { movePointToEndOfInlineNode } from '../point/movePointToEndOfInlineNode'
import { createRange } from '../range'
import {
  isClearBlockStyle,
  isClearTextStyle,
  isDeleteBackward,
  isDeleteForward,
  isDeleteLineBackward,
  isDeleteLineForward,
  isDeleteWordBackward,
  isDeleteWordForward,
  isExtendBackward,
  isExtendForward,
  isExtendWordBackward,
  isExtendWordForward,
  isMoveBackward,
  isMoveForward,
  isMoveWordBackward,
  isMoveWordForward,
  isRedo,
  isSplitBlock,
  isUndo
} from '../utils/shortcuts'
import { cloneFragment } from './cloneFragment'
import { findPointAtDOMNode } from './findPointAtDOMNode'
import { findRange } from './findRange'
import { getEventTransfer } from './getEventTransfer'
import { ReactArgumentsMap } from './ReactArgumentsMap'

export function createAfterPlugin(): Plugin<
  any,
  any,
  any,
  any,
  ReactArgumentsMap<any, any, any, any>
> {
  let isDraggingInternally = false
  let editorRef: React.RefObject<HTMLElement> | undefined

  return {
    onCreateEditorRef(editor, next, ref) {
      editorRef = ref
      next()
    },

    onBeforeInput(editor, next, event) {
      event.preventDefault()

      if ('data' in event) {
        insertText(editor, event.data)
      }

      next()
    },

    onNativeBeforeInput(editor, next, event) {
      const { document } = editor.value
      const [targetRange] = event.getTargetRanges()

      if (!targetRange) {
        next()
        return
      }

      event.preventDefault()

      const range = findRange(targetRange, document)

      switch (event.inputType) {
        case 'deleteByDrag':
        case 'deleteByCut':
        case 'deleteContent':
        case 'deleteContentBackward': {
          deleteBackwardAtRange(editor, range)
          break
        }

        case 'deleteContentForward': {
          deleteForwardAtRange(editor, range)
          break
        }

        case 'deleteWordBackward': {
          deleteWordBackwardAtRange(editor, range)
          break
        }

        case 'deleteWordForward': {
          deleteWordForwardAtRange(editor, range)
          break
        }

        case 'deleteSoftLineBackward':
        case 'deleteHardLineBackward': {
          deleteLineBackwardAtRange(editor, range)
          break
        }

        case 'deleteSoftLineForward':
        case 'deleteHardLineForward': {
          deleteLineForwardAtRange(editor, range)
          break
        }

        case 'insertLineBreak':
        case 'insertParagraph': {
          splitBlockAtRange(editor, range)
          break
        }

        case 'insertFromYank':
        case 'insertReplacementText':
        case 'insertText': {
          const text =
            event.data === null
              ? event.dataTransfer.getData('text/plain')
              : event.data

          insertTextAtRange(editor, range, text)
          break
        }
      }

      next()
    },

    onBlur(editor, next, event) {
      editor.blur()
      next()
    },

    onClick(editor, next, event) {
      const point = findPointAtDOMNode(
        event.target as Node,
        0,
        editor.value.document
      )

      if (isPointInVoidNode(editor.value.document, point)) {
        editor.focus()
        selectVoidNodeAtPoint(editor, point)
      }

      next()
    },

    onCopy(editor, next, event) {
      cloneFragment(event, editorRef!.current!, editor.value)
      next()
    },

    onCut(editor, next, event) {
      cloneFragment(event, editorRef!.current!, editor.value, () => {
        deleteSelection(editor)
      })
      next()
    },

    onDragEnd(editor, next, event) {
      isDraggingInternally = false
      next()
    },

    /** @todo */
    onDragStart(editor, next, event) {
      isDraggingInternally = true
      next()
    },

    /** @todo */
    onDrop(editor, next, event) {
      next()
    },

    onFocus(editor, next, event) {
      editor.focus()
      next()
    },

    onInput(editor, next, event) {
      const window = getWindow(event.target as Node)
      const nativeSelection = window.getSelection()
      const { anchorNode } = nativeSelection

      editor.edit(() => {
        const { document } = editor.value
        const point = findPointAtDOMNode(anchorNode, 0, document)

        if (point.type !== PointType.InTextNode) {
          throw new Error('this should not happen')
        }

        const blockNode = getBlockNodeAtPoint(document, point)
        const textNode = getInlineNodeAtPoint(blockNode.content, point)
        const textContent = anchorNode.textContent || ''

        const newSelectionRange = findRange(nativeSelection, document)

        if (textContent === textNode.text) {
          setAnchorAndCursor(
            editor,
            newSelectionRange.anchor,
            newSelectionRange.cursor
          )
          return
        }

        const rangeOfNode = createRange(
          point,
          movePointToEndOfInlineNode(document, point)
        )

        insertTextAtRange(editor, rangeOfNode, textContent || '')
        setAnchorAndCursor(
          editor,
          newSelectionRange.anchor,
          newSelectionRange.cursor
        )
      })
    },

    onKeyDown(editor, next, event) {
      if (isSplitBlock(event)) {
        splitBlock(editor)
        return
      }

      if (isRedo(event)) {
        editor.redo()
        return
      }

      if (isUndo(event)) {
        editor.undo()
        return
      }

      if (isDeleteLineBackward(event)) {
        deleteLineBackward(editor)
        return
      }

      if (isDeleteLineForward(event)) {
        deleteLineForward(editor)
        return
      }

      if (isDeleteBackward(event)) {
        deleteBackward(editor)
        return
      }

      if (isDeleteForward(event)) {
        deleteForward(editor)
        return
      }

      if (isMoveBackward(event)) {
        event.preventDefault()
        moveBackward(editor)
        return
      }

      if (isMoveForward(event)) {
        event.preventDefault()
        moveForward(editor)
        return
      }

      if (isExtendBackward(event)) {
        event.preventDefault()
        moveCursorBackward(editor)
        return
      }

      if (isExtendForward(event)) {
        event.preventDefault()
        moveCursorForward(editor)
      }

      if (isDeleteWordBackward(event)) {
        deleteWordBackward(editor)
        return
      }

      if (isDeleteWordForward(event)) {
        deleteWordForward(editor)
        return
      }

      if (isMoveWordBackward(event)) {
        event.preventDefault()
        moveWordBackward(editor)
        return
      }

      if (isMoveWordForward(event)) {
        event.preventDefault()
        moveWordForward(editor)
        return
      }

      if (isExtendWordBackward(event)) {
        event.preventDefault()
        moveCursorWordBackward(editor)
        return
      }

      if (isExtendWordForward(event)) {
        event.preventDefault()
        moveCursorWordForward(editor)
        return
      }

      if (isClearBlockStyle(event)) {
        removeBlockStyle(editor)
        return
      }

      if (isClearTextStyle(event)) {
        removeTextStyle(editor)
        event.preventDefault()
        return
      }

      next()
    },

    onPaste(editor, next, event) {
      const transfer = getEventTransfer(event)

      if (transfer.fragment) {
        insertFragment(editor, regenerateDocumentKeys(transfer.fragment as any))
      } else if (transfer.text) {
        insertText(editor, transfer.text)
      }

      next()
    },

    onSelect(editor, next, event) {
      const window = getWindow(event.target as Node)
      const selection = window.getSelection()

      const newSelectionRange = findRange(selection, editor.value.document)
      setAnchorAndCursor(
        editor,
        newSelectionRange.anchor,
        newSelectionRange.cursor
      )

      next()
    }
  }
}
