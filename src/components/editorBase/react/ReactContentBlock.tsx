import { always } from 'rambda'
import * as React from 'react'
import { ContentBlockNode, InlineNodeType } from '../node'
import { ReactInlineNode } from './ReactInlineNode'
import { ReactNodeProps } from './ReactNodeProps'
import { RenderNodeType } from './RenderNodeType'
import { spacerStyle } from './spacerStyle'

export function ReactContentBlock<
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
    ContentBlockNode<
      ContentBlockAttributes,
      InlineTextAttributes,
      InlineVoidAttributes
    >
  > & { blockNodeIndex: number }
): JSX.Element | null {
  const nodeContent = props.node.content
  const content: React.ReactNode[] = []

  const firstNode = nodeContent[0]

  if (firstNode.type === InlineNodeType.Void) {
    content.push(<VoidEdgeSpacer key="start-spacer" />)
  }

  for (let i = 0; i < nodeContent.length; i++) {
    const node = nodeContent[i]

    content.push(
      <ReactInlineNode
        key={node.key}
        editor={props.editor}
        node={node}
        blockNodeIndex={props.blockNodeIndex}
        inlineNodeIndex={i}
      />
    )

    if (
      node.type === InlineNodeType.Void &&
      (i === nodeContent.length - 1 ||
        nodeContent[i + 1].type === InlineNodeType.Void)
    ) {
      content.push(<VoidEdgeSpacer key={node.key + '__spacer'} />)
    }
  }

  return (
    props.editor.run('renderContentBlockNode', {
      requiredContainerElementAttributes: {
        'data-editor-type': RenderNodeType.ContentBlock
      },
      requiredChildrenWrapperElementAttributes: {
        'data-editor-content-wrapper': true
      },
      attributes: props.node.attributes,
      children: content,
      blockNodeIndex: props.blockNodeIndex
    }) || null
  )
}

const VoidEdgeSpacer = always(
  <span data-editor-void-edge-spacer={true} style={spacerStyle}>
    {'\uFEFF'}
  </span>
)
