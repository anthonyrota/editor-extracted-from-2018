import { Editor } from '.'
import { Fragment } from '../fragment'
import { insertFragmentAtRange } from './insertFragmentAtRange'

export function insertFragment<
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
  fragment: Fragment<
    ContentBlockAttributes,
    VoidBlockAttributes,
    InlineTextAttributes,
    InlineVoidAttributes
  >
): void {
  insertFragmentAtRange(editor, editor.value.selection, fragment)
}
