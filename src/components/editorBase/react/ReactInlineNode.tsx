import * as React from 'react'
import { InlineNode, InlineNodeType } from '../node'
import { ReactInlineText } from './ReactInlineText'
import { ReactInlineVoid } from './ReactInlineVoid'
import { ReactNodeProps } from './ReactNodeProps'

export class ReactInlineNode<
  ContentBlockAttributes,
  VoidBlockAttributes,
  InlineTextAttributes,
  InlineVoidAttributes
> extends React.Component<
  ReactNodeProps<
    ContentBlockAttributes,
    VoidBlockAttributes,
    InlineTextAttributes,
    InlineVoidAttributes,
    InlineNode<InlineTextAttributes, InlineVoidAttributes>
  > & { blockNodeIndex: number; inlineNodeIndex: number }
> {
  public shouldComponentUpdate(
    nextProps: ReactNodeProps<
      ContentBlockAttributes,
      VoidBlockAttributes,
      InlineTextAttributes,
      InlineVoidAttributes,
      InlineNode<InlineTextAttributes, InlineVoidAttributes>
    > & { blockNodeIndex: number; inlineNodeIndex: number }
  ): boolean {
    return (
      this.props.editor !== nextProps.editor ||
      this.props.node !== nextProps.node
    )
  }

  public render(): React.ReactNode {
    const { editor, node, blockNodeIndex, inlineNodeIndex } = this.props

    if (node.type === InlineNodeType.Void) {
      return (
        <ReactInlineVoid
          editor={editor}
          node={node}
          blockNodeIndex={blockNodeIndex}
          inlineNodeIndex={inlineNodeIndex}
        />
      )
    }

    return (
      <ReactInlineText
        editor={editor}
        node={node}
        blockNodeIndex={blockNodeIndex}
        inlineNodeIndex={inlineNodeIndex}
      />
    )
  }
}
