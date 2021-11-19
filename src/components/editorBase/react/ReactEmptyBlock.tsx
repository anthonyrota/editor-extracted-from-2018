import * as React from 'react'
import { EmptyBlockNode } from '../node'
import { ReactNodeProps } from './ReactNodeProps'
import { RenderNodeType } from './RenderNodeType'

export function ReactEmptyBlock<
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
    EmptyBlockNode<ContentBlockAttributes, InlineTextAttributes>
  > & { blockNodeIndex: number }
): JSX.Element | null {
  return (
    props.editor.run('renderEmptyBlockNode', {
      requiredContainerElementAttributes: {
        'data-editor-type': RenderNodeType.EmptyBlock
      },
      attributes: props.node.attributes,
      inlineAttributes: props.node.inlineAttributes,
      children: <br />,
      blockNodeIndex: props.blockNodeIndex
    }) || null
  )
}
