import { InlineVoidNode } from '../node'
import { ReactNodeProps } from './ReactNodeProps'
import { RenderNodeType } from './RenderNodeType'

export function ReactInlineVoid<
  ContentBlockAttributes,
  VoidBlockAttributes,
  InlineTextAttributes,
  InlineVoidAttributes
>(
  props: ReactNodeProps<
    ContentBlockAttributes,
    VoidBlockAttributes,
    InlineTextAttributes,
    InlineVoidAttributes,
    InlineVoidNode<InlineVoidAttributes>
  > & { blockNodeIndex: number; inlineNodeIndex: number }
): JSX.Element | null {
  return (
    props.editor.run('renderInlineVoidNode', {
      requiredContainerElementAttributes: {
        'data-editor-type': RenderNodeType.InlineVoid,
        'data-key': props.node.key,
        contentEditable: false
      },
      attributes: props.node.attributes,
      blockNodeIndex: props.blockNodeIndex,
      inlineNodeIndex: props.inlineNodeIndex
    }) || null
  )
}
