import { InlineTextNode } from '../node'
import { ReactNodeProps } from './ReactNodeProps'
import { RenderNodeType } from './RenderNodeType'

export function ReactInlineText<
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
    InlineTextNode<InlineTextAttributes>
  > & { blockNodeIndex: number; inlineNodeIndex: number }
): JSX.Element | null {
  return (
    props.editor.run('renderInlineTextNode', {
      requiredContainerElementAttributes: {
        'data-editor-type': RenderNodeType.InlineText,
        'data-key': props.node.key
      },
      requiredTextElementAttributes: {
        'data-editor-text': true
      },
      attributes: props.node.attributes,
      text: props.node.text,
      blockNodeIndex: props.blockNodeIndex,
      inlineNodeIndex: props.inlineNodeIndex
    }) || null
  )
}
