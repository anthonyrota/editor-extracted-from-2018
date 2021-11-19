import * as React from 'react'
import { BlockNode, BlockNodeType } from '../node'
import { ReactContentBlock } from './ReactContentBlock'
import { ReactEmptyBlock } from './ReactEmptyBlock'
import { ReactNodeProps } from './ReactNodeProps'
import { ReactVoidBlock } from './ReactVoidBlock'

export class ReactBlockNode<
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
    BlockNode<
      ContentBlockAttributes,
      VoidBlockAttributes,
      InlineTextAttributes,
      InlineVoidAttributes
    >
  > & { blockNodeIndex: number }
> {
  public shouldComponentUpdate(
    nextProps: ReactNodeProps<
      ContentBlockAttributes,
      VoidBlockAttributes,
      InlineTextAttributes,
      InlineVoidAttributes,
      BlockNode<
        ContentBlockAttributes,
        VoidBlockAttributes,
        InlineTextAttributes,
        InlineVoidAttributes
      >
    > & { blockNodeIndex: number }
  ): boolean {
    return (
      this.props.editor !== nextProps.editor ||
      this.props.node !== nextProps.node
    )
  }

  public render(): React.ReactNode {
    const { editor, node, blockNodeIndex } = this.props

    if (node.type === BlockNodeType.Void) {
      return (
        <ReactVoidBlock
          editor={editor}
          node={node}
          blockNodeIndex={blockNodeIndex}
        />
      )
    }

    if (node.type === BlockNodeType.Empty) {
      return (
        <ReactEmptyBlock
          editor={editor}
          node={node}
          blockNodeIndex={blockNodeIndex}
        />
      )
    }

    return (
      <ReactContentBlock
        editor={editor}
        node={node}
        blockNodeIndex={blockNodeIndex}
      />
    )
  }
}
