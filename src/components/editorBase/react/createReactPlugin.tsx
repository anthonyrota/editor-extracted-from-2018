import * as React from 'react'
import { Plugin } from '../editor'
import { DeepArrayLike } from '../utils/types'
import { createAfterPlugin } from './createAfterPlugin'
import { createBeforePlugin } from './createBeforePlugin'
import { ReactArgumentsMap, ReactRenderArgumentsMap } from './ReactArgumentsMap'
import { ReactEditorContent } from './ReactEditorContent'

export function createReactPlugin<
  ContentBlockAttributes,
  VoidBlockAttributes,
  InlineTextAttributes,
  InlineVoidAttributes
>(
  config: ReactPluginConfig<
    ContentBlockAttributes,
    VoidBlockAttributes,
    InlineTextAttributes,
    InlineVoidAttributes
  >
): DeepArrayLike<
  Plugin<
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
> {
  const renderPlugin: Plugin<
    ContentBlockAttributes,
    VoidBlockAttributes,
    InlineTextAttributes,
    InlineVoidAttributes,
    ReactRenderArgumentsMap<
      ContentBlockAttributes,
      VoidBlockAttributes,
      InlineTextAttributes,
      InlineVoidAttributes
    >
  > = {
    renderEditor(editor, next, props) {
      return (
        <ReactEditorContent
          tagName={props.tagName}
          autoCorrect={props.autoCorrect}
          className={props.className}
          editor={props.editor}
          forwardRef={props.editorRef}
          role={props.role}
          spellCheck={props.spellCheck}
          style={props.style}
          tabIndex={props.tabIndex}
        />
      )
    },

    renderEmptyBlockNode(editor, next, props) {
      return (
        <div {...props.requiredContainerElementAttributes}>
          {props.children}
        </div>
      )
    },

    renderContentBlockNode(editor, next, props) {
      return (
        <div
          {...props.requiredContainerElementAttributes}
          {...props.requiredChildrenWrapperElementAttributes}
        >
          {props.children}
        </div>
      )
    },

    renderInlineVoidNode(editor, next, props) {
      return <span {...props.requiredContainerElementAttributes} />
    },

    renderInlineTextNode(editor, next, props) {
      return (
        <span
          {...props.requiredContainerElementAttributes}
          {...props.requiredTextElementAttributes}
        >
          {props.text}
        </span>
      )
    }
  }

  return [
    createBeforePlugin(),
    config.plugins,
    createAfterPlugin(),
    renderPlugin
  ]
}

export interface ReactPluginConfig<
  ContentBlockAttributes,
  VoidBlockAttributes,
  InlineTextAttributes,
  InlineVoidAttributes
> {
  readonly plugins: DeepArrayLike<
    Plugin<
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
  >
}
