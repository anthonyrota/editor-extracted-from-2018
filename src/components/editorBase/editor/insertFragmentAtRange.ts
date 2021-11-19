import { Editor } from '.'
import { Direction } from '../direction'
import { Fragment } from '../fragment'
import { Range } from '../range'
import { deleteAtRange } from './deleteAtRange'
import { insertFragmentAtPoint } from './insertFragmentAtPoint'

export function insertFragmentAtRange<
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
  fragment: Fragment<
    ContentBlockAttributes,
    VoidBlockAttributes,
    InlineTextAttributes,
    InlineVoidAttributes
  >
): void {
  editor.edit(() => {
    const pointAfterDeletion = deleteAtRange(editor, range, Direction.Backward)

    insertFragmentAtPoint(editor, pointAfterDeletion, fragment)
  })
}
