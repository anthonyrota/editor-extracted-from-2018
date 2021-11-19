import { Editor } from '.'
import { Range } from '../range'
import { insertLinesAtRange } from './insertLinesAtRange'

const newlineRegex = /\r\n?|\n/

export function insertTextAtRange<
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
  text: string
): void {
  insertLinesAtRange(editor, range, text.split(newlineRegex))
}
