/**
 * @todo
 * empty block text node for composition
 * fix when holding character composition
 */

import cn from 'classnames'
import { createDocument, Document } from 'components/editorBase/document'
import { DocumentMeta } from 'components/editorBase/document/meta'
import { Editor, Plugin } from 'components/editorBase/editor'
import { changeBlockAttributesInSelection } from 'components/editorBase/editor/changeBlockAttributesInSelection'
import { changeInlineAttributesInRange } from 'components/editorBase/editor/changeInlineAttributesInRange'
import { changeSelectionInlineTextAttributes } from 'components/editorBase/editor/changeSelectionInlineTextAttributes'
import {
  BlockNodeType,
  EmptyBlockNode,
  InlineNode,
  InlineNodeType,
  VoidBlockNode
} from 'components/editorBase/node'
import { createBlockNodeFromText } from 'components/editorBase/node/createBlockNodeFromText'
import { getContentBlockNodeAtIndex } from 'components/editorBase/node/getContentBlockNodeAtIndex'
import { PointType } from 'components/editorBase/point'
import { arePointsEqual } from 'components/editorBase/point/arePointsEqual'
import { getPointAtStartOfBlockNodeInDocument } from 'components/editorBase/point/getPointAtStartOfBlockNode'
import { Range } from 'components/editorBase/range'
import { createReactPlugin } from 'components/editorBase/react/createReactPlugin'
import { ReactArgumentsMap } from 'components/editorBase/react/ReactArgumentsMap'
import { createSelection } from 'components/editorBase/selection'
import { isSelectionEmpty } from 'components/editorBase/selection/isSelectionEmpty'
import {
  hasCommandModifier,
  hasKeyCode,
  hasShiftKey,
  isBold,
  isItalic
} from 'components/editorBase/utils/shortcuts'
import { createValue, Value } from 'components/editorBase/value'
import { Tooltip } from 'components/tooltip'
import { omit } from 'lodash-es'
import { CompositeDisposable } from 'modules/disposable/CompositeDisposable'
import React from 'react'
import { allPass } from 'utils/allPass'
import { ifElse } from 'utils/ifElse'
import { not } from 'utils/not'
import classes from './style.module.scss'

enum ContentBlockStyle {
  Title,
  Subtitle,
  CodeBlock,
  Quote,
  PullQuote,
  BulletList,
  NumberedList
}

interface ContentBlockAttributes {
  style?: ContentBlockStyle
}

const emptyContentBlockAttributes: ContentBlockAttributes = {}

interface VoidBlockAttributes { }

enum InlineTextFlag {
  None = 0,
  Bold = 1 << 0,
  Italic = 1 << 1,
  Underline = 1 << 2,
  Code = 1 << 3,
  Strikethrough = 1 << 4,
  Superscript = 1 << 5,
  Subscript = 1 << 6
}

interface InlineTextAttributes {
  flags?: number
}

const emptyInlineTextAttributes: InlineTextAttributes = {}

interface InlineVoidAttributes { }

const meta: DocumentMeta<
  ContentBlockAttributes,
  VoidBlockAttributes,
  InlineTextAttributes,
  InlineVoidAttributes
> = {
  areContentBlockAttributesEqual(a, b) {
    return a.style === b.style
  },
  areInlineTextAttributesEqual(a, b) {
    return a.flags === b.flags
  },
  areInlineVoidAttributesEqual() {
    return true
  },
  areVoidBlockAttributesEqual() {
    return true
  },
  createEmptyContentBlockAttributes() {
    return emptyContentBlockAttributes
  },
  createEmptyInlineTextAttributes() {
    return emptyInlineTextAttributes
  }
}

const initialDocument = createDocument<
  ContentBlockAttributes,
  VoidBlockAttributes,
  InlineTextAttributes,
  InlineVoidAttributes
>(
  [
    createBlockNodeFromText(
      '',
      emptyContentBlockAttributes,
      emptyInlineTextAttributes
    )
  ],
  meta
)

const initialValue = createValue(
  createSelection(
    getPointAtStartOfBlockNodeInDocument(initialDocument, 0),
    getPointAtStartOfBlockNodeInDocument(initialDocument, 0)
  ),
  initialDocument
)

type ReactPlugin<
  ContentBlockAttributes,
  VoidBlockAttributes,
  InlineTextAttributes,
  InlineVoidAttributes
  > = Plugin<
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

function forEachSelectedTextNodeInRange<
  ContentBlockAttributes,
  VoidBlockAttributes,
  InlineTextAttributes,
  InlineVoidAttributes
>(
  document: Document<
    ContentBlockAttributes,
    VoidBlockAttributes,
    InlineTextAttributes,
    InlineVoidAttributes
  >,
  range: Range,
  onNode: (
    node:
      | EmptyBlockNode<ContentBlockAttributes, InlineTextAttributes>
      | VoidBlockNode<VoidBlockAttributes>
      | InlineNode<InlineTextAttributes, InlineVoidAttributes>,
    blockNodeIndex: number,
    inlineNodeIndex: number
  ) => boolean | void
): void {
  const { start, end } = range

  for (let i = start.blockNodeIndex; i <= end.blockNodeIndex; i++) {
    const blockNode = document.blockNodes[i]

    if (blockNode.type !== BlockNodeType.Content) {
      onNode(blockNode, i, 0)
      continue
    }

    let j: number

    if (i === start.blockNodeIndex) {
      if (start.type === PointType.InNonContentBlockNode) {
        continue
      }

      j =
        start.type === PointType.AtEndOfLine
          ? blockNode.content.length - 1
          : start.inlineNodeIndex
    } else {
      j = 0
    }

    let endIndex: number

    if (i === end.blockNodeIndex && end.type !== PointType.AtEndOfLine) {
      if (end.type === PointType.InNonContentBlockNode) {
        continue
      }

      if (
        end.type === PointType.AtStartOfVoidInlineNode ||
        end.textOffset === 0
      ) {
        endIndex = end.inlineNodeIndex - 1

        if (arePointsEqual(start, end)) {
          if (end.inlineNodeIndex === 0) {
            endIndex = 0
          } else {
            j = endIndex
          }
        }
      } else {
        endIndex = end.inlineNodeIndex
      }
    } else {
      endIndex = blockNode.content.length - 1
    }

    for (; j <= endIndex; j++) {
      if (onNode(blockNode.content[j], i, j) === false) {
        return
      }
    }
  }
}

function areAllSelectedNodesContainingFlag(
  value: Value<unknown, unknown, InlineTextAttributes, InlineVoidAttributes>,
  flag: InlineTextFlag
): boolean {
  let isAllSelected = true

  forEachSelectedTextNodeInRange(value.document, value.selection, node => {
    if (node.type === InlineNodeType.Void || node.type === BlockNodeType.Void) {
      return
    }

    const isSelected =
      node.type === BlockNodeType.Empty
        ? !!node.inlineAttributes.flags && node.inlineAttributes.flags & flag
        : !!node.attributes.flags && node.attributes.flags & flag

    if (!isSelected) {
      isAllSelected = false
      return false
    }
  })

  return isAllSelected
}

function isFlagActive(
  editor: Editor<
    ContentBlockAttributes,
    VoidBlockAttributes,
    InlineTextAttributes,
    InlineVoidAttributes
  >,
  flag: InlineTextFlag
): boolean {
  if (isSelectionEmpty(editor.value.selection)) {
    return !!(
      editor.collapsedCursorInlineTextAttributes.flags &&
      editor.collapsedCursorInlineTextAttributes.flags & flag
    )
  } else {
    return areAllSelectedNodesContainingFlag(editor.value, flag)
  }
}

function changeInlineTextAttributesInSelection<
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
  changeAttributes: (attributes: InlineTextAttributes) => InlineTextAttributes
): void {
  const { selection } = editor.value

  if (isSelectionEmpty(selection)) {
    changeSelectionInlineTextAttributes(editor, changeAttributes)
  } else {
    changeInlineAttributesInRange(editor, selection, changeAttributes)
  }
}

function toggleInlineTextFlag(
  editor: Editor<
    ContentBlockAttributes,
    VoidBlockAttributes,
    InlineTextAttributes,
    InlineVoidAttributes
  >,
  flag: InlineTextFlag
): void {
  const isActive = isFlagActive(editor, flag)

  changeInlineTextAttributesInSelection(editor, attributes => {
    const { flags } = attributes

    if (isActive) {
      if (flags) {
        const newFlags = flags & ~flag

        if (newFlags === InlineTextFlag.None) {
          return omit(attributes, 'flags')
        }

        return { ...attributes, flags: newFlags }
      }

      return attributes
    }

    if (flags) {
      const newFlags = flags | flag

      if (flags === newFlags) {
        return attributes
      }

      return { ...attributes, flags: newFlags }
    }

    return { ...attributes, flags: flag }
  })
}

function isContentBlockStyleActive(
  editor: Editor<
    ContentBlockAttributes,
    VoidBlockAttributes,
    InlineTextAttributes,
    InlineVoidAttributes
  >,
  start: number,
  end: number,
  style: ContentBlockStyle
): boolean {
  const { document } = editor.value
  let isAllVoid = true

  for (let i = start; i <= end; i++) {
    const blockNode = document.blockNodes[i]

    if (blockNode.type !== BlockNodeType.Void) {
      isAllVoid = false

      if (blockNode.attributes.style !== style) {
        return false
      }
    }
  }

  return !isAllVoid
}

function toggleContentBlockStyle(
  editor: Editor<
    ContentBlockAttributes,
    VoidBlockAttributes,
    InlineTextAttributes,
    InlineVoidAttributes
  >,
  style: ContentBlockStyle
): void {
  const { selection } = editor.value
  const isActive = isContentBlockStyleActive(
    editor,
    selection.start.blockNodeIndex,
    selection.end.blockNodeIndex,
    style
  )

  changeBlockAttributesInSelection(editor, attributes => {
    if (isActive) {
      return omit(attributes, 'style')
    }

    if (attributes.style === style) {
      return attributes
    }

    return { ...attributes, style }
  })
}

function getActiveContentBlockStyleClass(
  attributes: ContentBlockAttributes,
  document: Document<
    ContentBlockAttributes,
    VoidBlockAttributes,
    InlineTextAttributes,
    InlineVoidAttributes
  >,
  blockNodeIndex: number
): string | undefined {
  switch (attributes.style) {
    case ContentBlockStyle.Title: {
      return cn(classes.title, classes.editorContentLine)
    }

    case ContentBlockStyle.Subtitle: {
      return cn(classes.subtitle, classes.editorContentLine)
    }

    case ContentBlockStyle.CodeBlock: {
      const nextNode = document.blockNodes[blockNodeIndex + 1]
      const isLast =
        !nextNode ||
        nextNode.type === BlockNodeType.Void ||
        nextNode.attributes.style !== ContentBlockStyle.CodeBlock

      return cn(classes.codeblock, isLast && classes.lastCodeBlock)
    }

    case ContentBlockStyle.Quote: {
      return cn(classes.quote, classes.editorContentLine)
    }

    case ContentBlockStyle.PullQuote: {
      return cn(classes.pullquote, classes.editorContentLine)
    }

    case ContentBlockStyle.BulletList: {
      return cn(classes.note, classes.editorContentLine)
    }

    case ContentBlockStyle.NumberedList: {
      return cn(classes.list, classes.editorContentLine)
    }
  }
}

const U = 85
const J = 74
const X = 88
const ONE = 49
const TWO = 50
const SEVEN = 55
const EIGHT = 56
const NINE = 57
const QUOTE = 222

const isUnderline = allPass([
  hasCommandModifier,
  not(hasShiftKey),
  hasKeyCode(U)
])
const isInlineCode = allPass([
  hasCommandModifier,
  not(hasShiftKey),
  hasKeyCode(J)
])
const isStrikethrough = allPass([
  hasCommandModifier,
  hasShiftKey,
  hasKeyCode(X)
])
const isTitle = allPass([hasCommandModifier, hasShiftKey, hasKeyCode(ONE)])
const isSubtitle = allPass([hasCommandModifier, hasShiftKey, hasKeyCode(TWO)])
const isCodeBlock = allPass([
  hasCommandModifier,
  hasShiftKey,
  hasKeyCode(SEVEN)
])
const isQuote = allPass([
  hasCommandModifier,
  not(hasShiftKey),
  hasKeyCode(QUOTE)
])
const isPullQuote = allPass([
  hasCommandModifier,
  hasShiftKey,
  hasKeyCode(QUOTE)
])
const isBulletList = allPass([
  hasCommandModifier,
  hasShiftKey,
  hasKeyCode(EIGHT)
])
const isNumberedList = allPass([
  hasCommandModifier,
  hasShiftKey,
  hasKeyCode(NINE)
])

const richPlugin: ReactPlugin<
  ContentBlockAttributes,
  VoidBlockAttributes,
  InlineTextAttributes,
  InlineVoidAttributes
> = {
  onKeyDown(editor, next, event) {
    if (isBold(event)) {
      toggleInlineTextFlag(editor, InlineTextFlag.Bold)
      return
    }

    if (isItalic(event)) {
      toggleInlineTextFlag(editor, InlineTextFlag.Italic)
      return
    }

    if (isUnderline(event)) {
      toggleInlineTextFlag(editor, InlineTextFlag.Underline)
      return
    }

    if (isInlineCode(event)) {
      toggleInlineTextFlag(editor, InlineTextFlag.Code)
      return
    }

    if (isStrikethrough(event)) {
      toggleInlineTextFlag(editor, InlineTextFlag.Strikethrough)
      return
    }

    if (isTitle(event)) {
      toggleContentBlockStyle(editor, ContentBlockStyle.Title)
      return
    }

    if (isSubtitle(event)) {
      toggleContentBlockStyle(editor, ContentBlockStyle.Subtitle)
      return
    }

    if (isCodeBlock(event)) {
      toggleContentBlockStyle(editor, ContentBlockStyle.CodeBlock)
      return
    }

    if (isQuote(event)) {
      toggleContentBlockStyle(editor, ContentBlockStyle.Quote)
      return
    }

    if (isPullQuote(event)) {
      toggleContentBlockStyle(editor, ContentBlockStyle.PullQuote)
      return
    }

    if (isBulletList(event)) {
      toggleContentBlockStyle(editor, ContentBlockStyle.BulletList)
    }

    if (isNumberedList(event)) {
      toggleContentBlockStyle(editor, ContentBlockStyle.NumberedList)
    }

    next()
  },

  renderEmptyBlockNode(editor, next, props) {
    return (
      <div
        className={getActiveContentBlockStyleClass(
          props.attributes,
          editor.value.document,
          props.blockNodeIndex
        )}
        {...props.requiredContainerElementAttributes}
      >
        {props.children}
      </div>
    )
  },

  renderContentBlockNode(editor, next, props) {
    return (
      <div
        className={getActiveContentBlockStyleClass(
          props.attributes,
          editor.value.document,
          props.blockNodeIndex
        )}
        {...props.requiredContainerElementAttributes}
        {...props.requiredChildrenWrapperElementAttributes}
      >
        {props.children}
      </div>
    )
  },

  renderInlineTextNode(editor, next, props) {
    const { flags } = props.attributes
    const activeClasses: string[] = []

    if (flags) {
      if (flags & InlineTextFlag.Bold) {
        activeClasses.push(classes.bold)
      }

      if (flags & InlineTextFlag.Italic) {
        activeClasses.push(classes.italics)
      }

      if (flags & InlineTextFlag.Underline) {
        activeClasses.push(classes.underline)
      }

      if (flags & InlineTextFlag.Strikethrough) {
        activeClasses.push(classes.strikethrough)
      }

      if (flags & InlineTextFlag.Code) {
        const contentNode = getContentBlockNodeAtIndex(
          editor.value.document,
          props.blockNodeIndex
        )
        const nextNode = contentNode.content[props.inlineNodeIndex + 1]
        const isLast =
          !nextNode ||
          nextNode.type === InlineNodeType.Void ||
          !nextNode.attributes.flags ||
          !(nextNode.attributes.flags & InlineTextFlag.Code)

        activeClasses.push(classes.code)

        if (isLast) {
          activeClasses.push(classes.lastCode)
        }
      }

      return (
        <span
          {...props.requiredContainerElementAttributes}
          {...props.requiredTextElementAttributes}
          className={cn(activeClasses)}
        >
          {props.text}
        </span>
      )
    }

    return next()
  }
}

export class Example extends React.Component {
  private _plugin = createReactPlugin({ plugins: richPlugin })
  private _editor = new Editor(initialValue, this._plugin)
  private _editorRef = React.createRef<HTMLElement>()
  private _subscriptions = new CompositeDisposable()

  constructor() {
    super({})

    this._editor.run('onCreateEditorRef', this._editorRef)

    this._subscriptions.add(
      this._editor.onValueChange(() => {
        this.forceUpdate()
      })
    )

    this._subscriptions.add(
      this._editor.onCollapsedCursorInlineTextAttributesChange(() => {
        this.forceUpdate()
      })
    )
  }

  public componentWillUnmount(): void {
    this._subscriptions.dispose()
  }

  public render(): React.ReactNode {
    return (
      <>
        <div
          className={classes.toolbar}
          onMouseDown={this._onEditorToolbarMouseDown}
        >
          {this._renderInlineTextFlagToolbarItem(
            BoldIcon,
            'bold',
            InlineTextFlag.Bold
          )}
          {this._renderInlineTextFlagToolbarItem(
            ItalicIcon,
            'italic',
            InlineTextFlag.Italic
          )}
          {this._renderInlineTextFlagToolbarItem(
            UnderlineIcon,
            'underline',
            InlineTextFlag.Underline
          )}
          {this._renderInlineTextFlagToolbarItem(
            InlineCodeIcon,
            'inline code',
            InlineTextFlag.Code
          )}
        </div>
        {this._editor.run('renderEditor', {
          editorRef: this._editorRef,
          editor: this._editor,
          className: cn(classes.editorContent),
          autoCorrect: true,
          spellCheck: true
        }) || null}
      </>
    )
  }

  private _onEditorToolbarMouseDown = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault()
  }

  private _renderInlineTextFlagToolbarItem(
    icon: React.SFC<ToolbarIconProps>,
    tooltipInfo: string,
    flag: InlineTextFlag
  ): JSX.Element {
    return this._renderToolbarItem(
      icon,
      tooltipInfo,
      this._editor.focused && isFlagActive(this._editor, flag),
      () => toggleInlineTextFlag(this._editor, flag)
    )
  }

  private _renderToolbarItem(
    Icon: React.SFC<ToolbarIconProps>,
    tooltipInfo: string,
    isActive: boolean,
    handle: () => void
  ): JSX.Element {
    return (
      <Tooltip info={tooltipInfo}>
        {({ focused }) => (
          <Icon onMouseDown={handle} focused={focused} active={isActive} />
        )}
      </Tooltip>
    )
  }
}

function BoldIcon(props: ToolbarIconProps): JSX.Element {
  return (
    <ToolbarIcon
      version="1.1"
      width="11"
      height="14"
      viewBox="0 0 11 14"
      {...props}
    >
      <path d="M4.336 11.883q0.578 0.25 1.094 0.25 2.937 0 2.937-2.617 0-0.891-0.32-1.406-0.211-0.344-0.48-0.578t-0.527-0.363-0.629-0.195-0.656-0.082-0.738-0.016q-0.57 0-0.789 0.078 0 0.414-0.004 1.242t-0.004 1.234q0 0.062-0.008 0.527t-0.004 0.754 0.035 0.652 0.094 0.52zM4.227 6.055q0.328 0.055 0.852 0.055 0.641 0 1.117-0.102t0.859-0.348 0.582-0.699 0.199-1.109q0-0.547-0.227-0.957t-0.617-0.641-0.844-0.34-0.969-0.109q-0.391 0-1.016 0.102 0 0.391 0.031 1.18t0.031 1.187q0 0.211-0.004 0.625t-0.004 0.617q0 0.359 0.008 0.539zM0 13l0.016-0.734q0.117-0.031 0.664-0.125t0.828-0.211q0.055-0.094 0.098-0.211t0.066-0.262 0.043-0.254 0.023-0.293 0.004-0.266v-0.512q0-7.672-0.172-8.008-0.031-0.062-0.172-0.113t-0.348-0.086-0.387-0.055-0.379-0.035-0.238-0.023l-0.031-0.648q0.766-0.016 2.656-0.090t2.914-0.074q0.18 0 0.535 0.004t0.527 0.004q0.547 0 1.066 0.102t1.004 0.328 0.844 0.555 0.578 0.816 0.219 1.074q0 0.406-0.129 0.746t-0.305 0.563-0.504 0.449-0.57 0.352-0.656 0.312q1.203 0.273 2.004 1.047t0.801 1.937q0 0.781-0.273 1.402t-0.73 1.020-1.078 0.668-1.277 0.379-1.375 0.109q-0.344 0-1.031-0.023t-1.031-0.023q-0.828 0-2.398 0.086t-1.805 0.094z" />
    </ToolbarIcon>
  )
}

function ItalicIcon(props: ToolbarIconProps): JSX.Element {
  return (
    <ToolbarIcon
      version="1.1"
      width="8"
      height="14"
      viewBox="0 0 8 14"
      {...props}
    >
      <path d="M0 12.984l0.133-0.664q0.047-0.016 0.637-0.168t0.871-0.293q0.219-0.273 0.32-0.789 0.008-0.055 0.484-2.258t0.891-4.246 0.406-2.316v-0.195q-0.187-0.102-0.426-0.145t-0.543-0.062-0.453-0.043l0.148-0.805q0.258 0.016 0.937 0.051t1.168 0.055 0.941 0.020q0.375 0 0.77-0.020t0.945-0.055 0.77-0.051q-0.039 0.305-0.148 0.695-0.234 0.078-0.793 0.223t-0.848 0.262q-0.062 0.148-0.109 0.332t-0.070 0.312-0.059 0.355-0.051 0.328q-0.211 1.156-0.684 3.277t-0.605 2.777q-0.016 0.070-0.102 0.453t-0.156 0.703-0.125 0.652-0.047 0.449l0.008 0.141q0.133 0.031 1.445 0.242-0.023 0.344-0.125 0.773-0.086 0-0.254 0.012t-0.254 0.012q-0.227 0-0.68-0.078t-0.672-0.078q-1.078-0.016-1.609-0.016-0.398 0-1.117 0.070t-0.945 0.086z" />
    </ToolbarIcon>
  )
}

function UnderlineIcon(props: ToolbarIconProps): JSX.Element {
  return (
    <ToolbarIcon
      version="1.1"
      width="12"
      height="14"
      viewBox="0 0 12 14"
      {...props}
    >
      <path d="M0.375 1.742q-0.289-0.016-0.352-0.031l-0.023-0.688q0.102-0.008 0.312-0.008 0.469 0 0.875 0.031 1.031 0.055 1.297 0.055 0.672 0 1.313-0.023 0.906-0.031 1.141-0.039 0.438 0 0.672-0.016l-0.008 0.109 0.016 0.5v0.070q-0.469 0.070-0.969 0.070-0.469 0-0.617 0.195-0.102 0.109-0.102 1.031 0 0.102 0.004 0.254t0.004 0.199l0.008 1.789 0.109 2.188q0.047 0.969 0.398 1.578 0.273 0.461 0.75 0.719 0.688 0.367 1.383 0.367 0.813 0 1.492-0.219 0.438-0.141 0.773-0.398 0.375-0.281 0.508-0.5 0.281-0.438 0.414-0.891 0.164-0.57 0.164-1.789 0-0.617-0.027-1t-0.086-0.957-0.105-1.246l-0.031-0.461q-0.039-0.523-0.187-0.688-0.266-0.273-0.602-0.266l-0.781 0.016-0.109-0.023 0.016-0.672h0.656l1.602 0.078q0.594 0.023 1.531-0.078l0.141 0.016q0.047 0.297 0.047 0.398 0 0.055-0.031 0.242-0.352 0.094-0.656 0.102-0.57 0.086-0.617 0.133-0.117 0.117-0.117 0.32 0 0.055 0.012 0.211t0.012 0.242q0.062 0.148 0.172 3.094 0.047 1.523-0.117 2.375-0.117 0.594-0.32 0.953-0.297 0.508-0.875 0.961-0.586 0.445-1.422 0.695-0.852 0.258-1.992 0.258-1.305 0-2.219-0.359-0.93-0.367-1.398-0.953-0.477-0.594-0.648-1.523-0.125-0.625-0.125-1.852v-2.602q0-1.469-0.133-1.664-0.195-0.281-1.148-0.305zM12 12.75v-0.5q0-0.109-0.070-0.18t-0.18-0.070h-11.5q-0.109 0-0.18 0.070t-0.070 0.18v0.5q0 0.109 0.070 0.18t0.18 0.070h11.5q0.109 0 0.18-0.070t0.070-0.18z" />
    </ToolbarIcon>
  )
}

function InlineCodeIcon(props: ToolbarIconProps): JSX.Element {
  return (
    <ToolbarIcon
      version="1.1"
      width="12"
      height="14"
      viewBox="0 0 12 14"
      {...props}
    >
      <path d="M2.836 12l0.711-0.711-1.836-1.836-0.711 0.711v0.836h1v1h0.836zM6.922 4.75q0-0.172-0.172-0.172-0.078 0-0.133 0.055l-4.234 4.234q-0.055 0.055-0.055 0.133 0 0.172 0.172 0.172 0.078 0 0.133-0.055l4.234-4.234q0.055-0.055 0.055-0.133zM6.5 3.25l3.25 3.25-6.5 6.5h-3.25v-3.25zM11.836 4q0 0.414-0.289 0.703l-1.297 1.297-3.25-3.25 1.297-1.289q0.281-0.297 0.703-0.297 0.414 0 0.711 0.297l1.836 1.828q0.289 0.305 0.289 0.711z" />
    </ToolbarIcon>
  )
}

interface ToolbarIconProps extends React.SVGProps<SVGSVGElement> {
  focused?: boolean
  active?: boolean
}

function ToolbarIcon(props: ToolbarIconProps): JSX.Element {
  return (
    <svg
      className={cn(
        classes.toolbarIcon,
        props.focused && classes.focusedToolbarIcon,
        props.active && classes.activeToolbarIcon
      )}
      {...omit(props, 'focused', 'active')}
    >
      {props.children}
    </svg>
  )
}
