import * as React from 'react'
import { VoidBlockNode } from '../node'
import { ReactNodeProps } from './ReactNodeProps'
import { RenderNodeType } from './RenderNodeType'
import { spacerStyle } from './spacerStyle'

export function ReactVoidBlock<
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
    VoidBlockNode<VoidBlockAttributes>
  > & { blockNodeIndex: number }
): JSX.Element {
  const children =
    props.editor.run('renderVoidBlockNode', {
      attributes: props.node.attributes,
      blockNodeIndex: props.blockNodeIndex
    }) || null

  return (
    <div data-editor-type={RenderNodeType.VoidBlock}>
      <div data-editor-spacer={true} style={spacerStyle}>
        {'\uFEFF'}
      </div>
      <div contentEditable={false}>{children}</div>
    </div>
  )
}
