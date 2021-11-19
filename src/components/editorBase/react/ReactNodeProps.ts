import { Editor } from '../editor'
import { BlockNode } from '../node'
import { ReactArgumentsMap } from './ReactArgumentsMap'

export interface ReactNodeProps<
  ContentBlockAttributes,
  VoidBlockAttributes,
  InlineTextAttributes,
  InlineVoidAttributes,
  Node
> {
  readonly editor: Editor<
    ContentBlockAttributes,
    VoidBlockAttributes,
    InlineTextAttributes,
    InlineVoidAttributes,
    ReactArgumentsMap<
      ContentBlockAttributes,
      VoidBlockAttributes,
      InlineTextAttributes,
      InlineVoidAttributes
    >
  >
  readonly node: Node
}
