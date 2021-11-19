import { Editor } from '.'
import { Direction } from '../direction'
import { createFragment } from '../fragment'
import { createBlockNodeFromText } from '../node/createBlockNodeFromText'
import { getContentAttributesAtPoint } from '../node/getContentAttributesAtPoint'
import { Range } from '../range'
import { createInsertTextSaveData } from '../saveData'
import { deleteAtRange } from './deleteAtRange'
import { insertFragmentAtPoint } from './insertFragmentAtPoint'

export function insertLinesAtRange<
  ContentBlockAttributes,
  VoidBlockAttributes,
  InlineTextAttributes,
  InlineVoidAttributes
>(
  editor: Editor<
    ContentBlockAttributes,
    VoidBlockAttributes,
    InlineTextAttributes,
    InlineVoidAttributes
  >,
  range: Range,
  lines: string[]
): void {
  if (lines.length === 0) {
    return
  }

  editor.edit(() => {
    const { collapsedCursorInlineTextAttributes } = editor
    const point = deleteAtRange(editor, range, Direction.Backward)

    const { document } = editor.value
    const contentAttributes = getContentAttributesAtPoint(document, point)

    const pointAfterInsertion = insertFragmentAtPoint(
      editor,
      point,
      createFragment<
        ContentBlockAttributes,
        VoidBlockAttributes,
        InlineTextAttributes,
        InlineVoidAttributes
      >(
        lines.map(text =>
          createBlockNodeFromText(
            text,
            contentAttributes,
            collapsedCursorInlineTextAttributes
          )
        )
      )
    )

    return lines.length > 1
      ? undefined
      : createInsertTextSaveData(point, pointAfterInsertion)
  })
}
