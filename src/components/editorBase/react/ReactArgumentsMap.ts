import { Editor, PluginArgumentMap } from '../editor'
import { RenderNodeType } from './RenderNodeType'

export interface ReactArgumentsMap<
  ContentBlockAttributes,
  VoidBlockAttributes,
  InlineTextAttributes,
  InlineVoidAttributes
>
  extends ReactRenderArgumentsMap<
      ContentBlockAttributes,
      VoidBlockAttributes,
      InlineTextAttributes,
      InlineVoidAttributes
    >,
    EditorRefArgumentsMap,
    ReactEventsArgumentMap {}

export interface EditorRenderProps<
  ContentBlockAttributes,
  VoidBlockAttributes,
  InlineTextAttributes,
  InlineVoidAttributes
> {
  readonly editorRef: React.RefObject<HTMLElement>
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
  readonly tagName?:
    | React.FunctionComponent<any>
    | React.ComponentClass<any>
    | string
  readonly autoCorrect?: boolean
  readonly className?: string
  readonly role?: string
  readonly spellCheck?: boolean
  readonly style?: React.CSSProperties
  readonly tabIndex?: number
}

export interface VoidBlockRenderProps<Attributes> {
  readonly attributes: Attributes
  readonly blockNodeIndex: number
}

export interface EmptyBlockRenderProps<BlockAttributes, InlineAttributes> {
  readonly requiredContainerElementAttributes: {
    readonly 'data-editor-type': RenderNodeType.EmptyBlock
  }
  readonly attributes: BlockAttributes
  readonly inlineAttributes: InlineAttributes
  readonly children: React.ReactNode
  readonly blockNodeIndex: number
}

export interface ContentBlockRenderProps<Attributes> {
  readonly requiredContainerElementAttributes: {
    readonly 'data-editor-type': RenderNodeType.ContentBlock
  }
  readonly requiredChildrenWrapperElementAttributes: {
    readonly 'data-editor-content-wrapper': true
  }
  readonly attributes: Attributes
  readonly children: React.ReactNode
  readonly blockNodeIndex: number
}

export interface InlineVoidRenderProps<Attributes> {
  readonly requiredContainerElementAttributes: {
    readonly 'data-editor-type': RenderNodeType.InlineVoid
    readonly 'data-key': string
    readonly contentEditable: false
  }
  readonly attributes: Attributes
  readonly blockNodeIndex: number
  readonly inlineNodeIndex: number
}

export interface InlineTextRenderProps<Attributes> {
  readonly requiredContainerElementAttributes: {
    readonly 'data-editor-type': RenderNodeType.InlineText
    readonly 'data-key': string
  }
  readonly requiredTextElementAttributes: {
    readonly 'data-editor-text': true
  }
  readonly attributes: Attributes
  readonly text: string
  readonly blockNodeIndex: number
  readonly inlineNodeIndex: number
}

export interface ReactRenderArgumentsMap<
  ContentBlockAttributes,
  VoidBlockAttributes,
  InlineTextAttributes,
  InlineVoidAttributes
> extends PluginArgumentMap {
  renderEditor: [
    [
      EditorRenderProps<
        ContentBlockAttributes,
        VoidBlockAttributes,
        InlineTextAttributes,
        InlineVoidAttributes
      >
    ],
    JSX.Element
  ]
  renderVoidBlockNode: [
    [VoidBlockRenderProps<VoidBlockAttributes>],
    JSX.Element
  ]
  renderContentBlockNode: [
    [ContentBlockRenderProps<ContentBlockAttributes>],
    JSX.Element
  ]
  renderEmptyBlockNode: [
    [EmptyBlockRenderProps<ContentBlockAttributes, InlineTextAttributes>],
    JSX.Element
  ]
  renderInlineVoidNode: [
    [InlineVoidRenderProps<InlineVoidAttributes>],
    JSX.Element
  ]
  renderInlineTextNode: [
    [InlineTextRenderProps<InlineTextAttributes>],
    JSX.Element
  ]
}

interface EditorRefArgumentsMap extends PluginArgumentMap {
  onCreateEditorRef: [[React.RefObject<HTMLElement>], void]
}

interface ReactEventsArgumentMap extends PluginArgumentMap {
  onNativeBeforeInput: [[BeforeInputEvent], void]
  onCopy: [[React.ClipboardEvent<HTMLElement>], void]
  onCut: [[React.ClipboardEvent<HTMLElement>], void]
  onPaste: [[React.ClipboardEvent<HTMLElement>], void]
  onBeforeInput: [
    [React.CompositionEvent<HTMLElement> | React.FormEvent<HTMLElement>],
    void
  ]
  onCompositionEnd: [[React.CompositionEvent<HTMLElement>], void]
  onCompositionUpdate: [[React.CompositionEvent<HTMLElement>], void]
  onCompositionStart: [[React.CompositionEvent<HTMLElement>], void]
  onKeyDown: [[React.KeyboardEvent<HTMLElement>], void]
  onKeyPress: [[React.KeyboardEvent<HTMLElement>], void]
  onKeyUp: [[React.KeyboardEvent<HTMLElement>], void]
  onFocus: [[React.FocusEvent<HTMLElement>], void]
  onBlur: [[React.FocusEvent<HTMLElement>], void]
  onInput: [[React.FormEvent<HTMLElement>], void]
  onClick: [[React.MouseEvent<HTMLElement>], void]
  onContextMenu: [[React.MouseEvent<HTMLElement>], void]
  onDoubleClick: [[React.MouseEvent<HTMLElement>], void]
  onDrag: [[React.DragEvent<HTMLElement>], void]
  onDragEnd: [[React.DragEvent<HTMLElement>], void]
  onDragEnter: [[React.DragEvent<HTMLElement>], void]
  onDragExit: [[React.DragEvent<HTMLElement>], void]
  onDragLeave: [[React.DragEvent<HTMLElement>], void]
  onDragOver: [[React.DragEvent<HTMLElement>], void]
  onDragStart: [[React.DragEvent<HTMLElement>], void]
  onDrop: [[React.MouseEvent<HTMLElement>], void]
  onMouseDown: [[React.MouseEvent<HTMLElement>], void]
  onMouseEnter: [[React.MouseEvent<HTMLElement>], void]
  onMouseLeave: [[React.MouseEvent<HTMLElement>], void]
  onMouseMove: [[React.MouseEvent<HTMLElement>], void]
  onMouseOut: [[React.MouseEvent<HTMLElement>], void]
  onMouseOver: [[React.MouseEvent<HTMLElement>], void]
  onMouseUp: [[React.MouseEvent<HTMLElement>], void]
  onSelect: [[React.SyntheticEvent<HTMLElement> | Event], void]
}

export type BeforeInputEvent =
  | BeforeInputEventWithData
  | BeforeInputEventWithTransfer
  | BeforeInputEventWithoutDataOrTransfer

interface BeforeInputEventBase extends UIEvent {
  readonly isComposing: boolean
  getTargetRanges(): StaticRange[]
}

interface BeforeInputEventWithData extends BeforeInputEventBase {
  readonly data: string
  readonly dataTransfer: null
  readonly inputType:
    | 'insertText' // insert typed plain text
    | 'insertCompositionText' // replace the current composition string
    | 'insertFromComposition' // insert into the DOM a finalized composed string that will not form part of the next composition string
    | 'formatSetBlockTextDirection' // set the text block direction
    | 'formatSetInlineTextDirection' // set the text inline direction
    | 'formatBackColor' // change the background color
    | 'formatFontColor' // change the font color
    | 'formatFontName' // change the font-family
    | 'insertLink' // insert a link
}

interface BeforeInputEventWithTransfer extends BeforeInputEventBase {
  readonly data: null
  readonly dataTransfer: DataTransfer
  readonly inputType:
    | 'insertFromYank' // replace the current selection with content stored in a kill buffer
    | 'insertFromDrop' // insert content into the DOM by means of drop
    | 'insertFromPaste' // paste
    | 'insertReplacementText' // replace existing text by means of a spell checker, auto-correct or similar
}

interface BeforeInputEventWithoutDataOrTransfer extends BeforeInputEventBase {
  readonly data: null
  readonly dataTransfer: null
  readonly inputType:
    | 'insertLineBreak' // insert a line break
    | 'insertParagraph' // insert a paragraph break
    | 'insertOrderedList' // insert a numbered list
    | 'insertUnorderedList' // insert a bulleted list
    | 'insertHorizontalRule' // insert a horizontal rule
    | 'insertTranspose' // transpose the last two characters that were entered
    | 'deleteByComposition' // remove a part of the DOM in order to recompose this part using IME
    | 'deleteCompositionText' // delete the current composition string before commiting a finalized string to the DOM
    | 'deleteWordBackward' // delete a word directly before the caret position
    | 'deleteWordForward' // delete a word directly after the caret position
    | 'deleteSoftLineBackward' // delete from the caret to the nearest visual line break before the caret position
    | 'deleteSoftLineForward' // delete from the caret to the nearest visual line break after the caret position
    | 'deleteEntireSoftLine' // delete from to the nearest visual line break before the caret position to the nearest visual line break after the caret position
    | 'deleteHardLineBackward' // delete from the caret to the nearest beginning of a block element or br element before the caret position
    | 'deleteHardLineForward' // delete from the caret to the nearest end of a block element or br element after the caret position
    | 'deleteByDrag' // remove content from the DOM by means of drag
    | 'deleteByCut' // remove the current selection as part of a cut
    | 'deleteContent' // delete the selection without specifying the direction of the deletion and this intention is not covered by another inputType
    | 'deleteContentBackward' // delete the content directly before the caret position and this intention is not covered by another inputType or delete the selection with the selection collapsing to its start after the deletion
    | 'deleteContentForward' // delete the content directly after the caret position and this intention is not covered by another inputType or delete the selection with the selection collapsing to its end after the deletion
    | 'historyUndo' // undo the last editing action
    | 'historyRedo' // to redo the last undone editing action
    | 'formatBold' // initiate bold text
    | 'formatItalic' // initiate italic text
    | 'formatUnderline' // initiate underline text
    | 'formatStrikeThrough' // initiate stricken through text
    | 'formatSuperscript' // initiate superscript text
    | 'formatSubscript' // initiate subscript text
    | 'formatJustifyFull' // make the current selection fully justified
    | 'formatJustifyCenter' // center align the current selection
    | 'formatJustifyRight' // right align the current selection
    | 'formatJustifyLeft' // left align the current selection
    | 'formatIndent' // indent the current selection
    | 'formatOutdent' // outdent the current selection
    | 'formatRemove' // remove all formatting from the current selection
}
