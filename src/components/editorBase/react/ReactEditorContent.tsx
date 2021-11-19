import React from 'react'
import { closest } from 'utils/closest'
import { hasInputEventsLevel2, isFirefox } from 'utils/environment'
import { getWindow } from 'utils/getWindow'
import { mergeRefs } from 'utils/mergeRefs'
import { scrollToSelection } from 'utils/scrollToSelection'
import { Direction } from '../direction'
import { Editor } from '../editor'
import { arePointsEqual } from '../point/arePointsEqual'
import { findDOMRange } from './findDOMRange'
import { findRange } from './findRange'
import { BeforeInputEvent, ReactArgumentsMap } from './ReactArgumentsMap'
import { ReactBlockNode } from './ReactBlockNode'
import { RenderNodeType } from './RenderNodeType'

export interface ReactContentProps<
  ContentBlockAttributes,
  VoidBlockAttributes,
  InlineTextAttributes,
  InlineVoidAttributes,
  Ref
> {
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
  readonly forwardRef?: React.Ref<Ref | HTMLElement>
  readonly autoCorrect?: boolean
  readonly className?: string
  readonly role?: string
  readonly spellCheck?: boolean
  readonly style?: React.CSSProperties
  readonly tabIndex?: number
}

export class ReactEditorContent<
  ContentBlockAttributes,
  VoidBlockAttributes,
  InlineTextAttributes,
  InlineVoidAttributes,
  Ref
> extends React.Component<
  ReactContentProps<
    ContentBlockAttributes,
    VoidBlockAttributes,
    InlineTextAttributes,
    InlineVoidAttributes,
    Ref
  >
> {
  private _isUpdatingSelection = false
  private _editorRef = React.createRef<HTMLElement>()
  private _reactEventHandlers = reactEventNames.reduce<ReactEventHandlerMap>(
    <K extends keyof HandledReactEvents>(
      handlers: ReactEventHandlerMap,
      eventName: K
    ) => {
      handlers[eventName] = (event: HandledReactEvents[K]) =>
        this._onEvent(eventName, event)
      return handlers
    },
    {} as ReactEventHandlerMap
  )

  public componentDidMount(): void {
    const window = getWindow(this._editorRef.current!)

    window.document.addEventListener(
      'selectionchange',
      this._onNativeSelectionChange
    )

    if (hasInputEventsLevel2) {
      this._editorRef.current!.addEventListener(
        'beforeinput',
        this._onNativeBeforeInput
      )
    }

    this._updateDOMSelection()
  }

  /**
   * When unmounting, remove DOM event listeners.
   */

  public componentWillUnmount(): void {
    const window = getWindow(this._editorRef.current!)

    if (window) {
      window.document.removeEventListener(
        'selectionchange',
        this._onNativeSelectionChange
      )
    }

    if (hasInputEventsLevel2) {
      this._editorRef.current!.removeEventListener(
        'beforeinput',
        this._onNativeBeforeInput
      )
    }
  }

  public componentDidUpdate(): void {
    this._updateDOMSelection()
  }

  private _updateDOMSelection(): void {
    if (!this.props.editor.focused) {
      return
    }

    const { selection } = this.props.editor.value
    const isBackward = selection.direction === Direction.Backward
    const window = getWindow(this._editorRef.current!)
    const native = window.getSelection()
    // const { activeElement } = window.document

    // COMPAT: In Firefox, there's a bug where `getSelection` can return `null`.
    // https://bugzilla.mozilla.org/show_bug.cgi?id=827585
    if (!native) {
      return
    }

    const isActiveElementEditor =
      window.document.activeElement === this._editorRef.current!

    if (this.props.editor.focused) {
      if (!isActiveElementEditor) {
        this._editorRef.current!.focus()
      }
    } else if (isActiveElementEditor) {
      this._editorRef.current!.blur()
    }

    const { rangeCount /*, anchorNode*/ } = native

    // // If the Slate selection is unset, but the DOM selection has a range
    // // selected in the editor, we need to remove the range.
    // if (selection.isUnset && rangeCount && this._isNodeEditable(anchorNode)) {
    //   removeAllRanges(native)
    // }

    // Otherwise, figure out which DOM nodes should be selected...
    if (this.props.editor.focused /* && selection.isSet */) {
      const current = !!rangeCount && native.getRangeAt(0)
      const range = findDOMRange(
        selection,
        this.props.editor.value.document,
        this._editorRef.current!
      )

      if (!range) {
        console.warn(
          'Unable to find a native DOM range from the current selection.'
        )

        return
      }

      const { startContainer, startOffset, endContainer, endOffset } = range

      // If the new range matches the current selection, there is nothing to fix.
      // COMPAT: The native `Range` object always has it's "start" first and "end"
      // last in the DOM. It has no concept of "backwards/forwards", so we have
      // to check both orientations here.

      if (
        current &&
        ((startContainer === current.startContainer &&
          startOffset === current.startOffset &&
          endContainer === current.endContainer &&
          endOffset === current.endOffset) ||
          (startContainer === current.endContainer &&
            startOffset === current.endOffset &&
            endContainer === current.startContainer &&
            endOffset === current.startOffset))
      ) {
        return
      }

      // Otherwise, set the `isUpdatingSelection` flag and update the selection.
      this._isUpdatingSelection = true

      const { document } = window

      // COMPAT: if we are in <= IE11 and the selection contains
      // tables, `removeAllRanges()` will throw
      // "unable to complete the operation due to error"
      if ('createTextRange' in document.body) {
        // All IE but Edge
        const range = (document.body as any).createTextRange()
        range.collapse()
        range.select()
      } else {
        native.removeAllRanges()
      }

      // COMPAT: IE 11 does not support `setBaseAndExtent`.
      if (native.setBaseAndExtent) {
        // COMPAT: Since the DOM range has no concept of backwards/forwards
        // we need to check and do the right thing here.
        if (isBackward) {
          native.setBaseAndExtent(
            range.endContainer,
            range.endOffset,
            range.startContainer,
            range.startOffset
          )
        } else {
          native.setBaseAndExtent(
            range.startContainer,
            range.startOffset,
            range.endContainer,
            range.endOffset
          )
        }
      } else {
        native.addRange(range)
      }

      // Scroll to the selection, in case it's out of view.
      scrollToSelection(native)

      // Then unset the `isUpdatingSelection` flag after a delay, to ensure that
      // it is still set when selection-related events from updating it fire.
      setTimeout(() => {
        // COMPAT: In Firefox, it's not enough to create a range, you also need
        // to focus the contenteditable element too.
        if (isFirefox && this._editorRef.current) {
          this._editorRef.current.focus()
        }

        this._isUpdatingSelection = false
      })
    }
  }

  /**
   * Check if an event `target` is fired from within the contenteditable
   * element. This should be false for edits happening in non-contenteditable
   * children, such as void nodes and other nested Slate editors.
   */

  private _isNodeEditable = (node: Node): boolean => {
    let element: HTMLElement

    try {
      // COMPAT: In Firefox, sometimes the node can be comment which doesn't
      // have .closest and it crashes.
      if (node.nodeType === 8) {
        return false
      }

      // COMPAT: Text nodes don't have `isContentEditable` property. So, when
      // `node` is a text node use its parent node for check.
      element = (node.nodeType === 3 ? node.parentNode : node) as HTMLElement
    } catch (err) {
      // COMPAT: In Firefox, `node.nodeType` will throw an error if node is
      // originating from an internal "restricted" element (e.g. a stepper
      // arrow on a number input)
      if (
        isFirefox &&
        /Permission denied to access property "nodeType"/.test(err.message)
      ) {
        return false
      }

      throw err
    }

    return (
      element.isContentEditable &&
      (element === this._editorRef.current! ||
        closest(element, `[data-editor-type="${RenderNodeType.Editor}"]`) ===
          this._editorRef.current!)
    )
  }

  private _onEvent<K extends keyof HandledEvents>(
    handler: K,
    event: HandledEvents[K]
  ): void {
    if (
      this._isUpdatingSelection &&
      /* handler === 'onSelect' ||*/ (handler === 'onBlur' ||
        handler === 'onFocus')
    ) {
      return
    }

    // // COMPAT: There are situations where a select event will fire with a new
    // // native selection that resolves to the same internal position. In those
    // // cases we don't need to trigger any changes, since our internal model is
    // // already up to date, but we do want to update the native selection again
    // // to make sure it is in sync.
    // if (handler === 'onSelect') {
    //   const { document, selection } = this.props.editor.value
    //   const window = getWindow(event.target as Node)
    //   const native = window.getSelection()
    //   const range = findRange(native, document)

    //   if (
    //     arePointsEqual(selection.anchor, range.anchor) &&
    //     arePointsEqual(selection.cursor, range.cursor)
    //   ) {
    //     this._updateDOMSelection()
    //     return
    //   }
    // }

    // Don't handle drag and drop events coming from embedded editors.
    if (
      handler === 'onDrag' ||
      handler === 'onDragEnd' ||
      handler === 'onDragEnter' ||
      handler === 'onDragExit' ||
      handler === 'onDragLeave' ||
      handler === 'onDragOver' ||
      handler === 'onDragStart' ||
      handler === 'onDrop'
    ) {
      const closestEditor = closest(
        event.target as Node,
        `[data-editor-type="${RenderNodeType.Editor}"]`
      )

      if (closestEditor !== this._editorRef.current!) {
        return
      }
    }

    // Some events require being in editable in the editor, so if the event
    // target isn't, ignore them.
    if (
      handler === 'onNativeBeforeInput' ||
      handler === 'onBeforeInput' ||
      handler === 'onBlur' ||
      handler === 'onCompositionEnd' ||
      handler === 'onCompositionUpdate' ||
      handler === 'onCompositionStart' ||
      handler === 'onCopy' ||
      handler === 'onCut' ||
      handler === 'onFocus' ||
      handler === 'onInput' ||
      handler === 'onKeyDown' ||
      handler === 'onKeyPress' ||
      handler === 'onKeyUp' ||
      handler === 'onPaste' // ||
      // handler === 'onSelect'
    ) {
      if (!this._isNodeEditable(event.target as Node)) {
        return
      }
    }

    if (handler === 'onSelect') {
      console.log('running on select with', event)
    }
    this.props.editor.run<any>(handler, event)
  }

  private _onNativeBeforeInput = (event: Event): void => {
    this._onEvent('onNativeBeforeInput', event as BeforeInputEvent)
  }

  /**
   * On native `selectionchange` event, trigger the `onSelect` handler. This is
   * needed to account for React's `onSelect` being non-standard and not firing
   * until after a selection has been released. This causes issues in situations
   * where another change happens while a selection is being made.
   */

  private _onNativeSelectionChange = (event: Event): void => {
    if (this._isUpdatingSelection) {
      return
    }

    const window = getWindow(event.target as Node)
    const { activeElement } = window.document

    if (activeElement !== this._editorRef.current) {
      return
    }

    const { document, selection } = this.props.editor.value
    const native = window.getSelection()
    const range = findRange(native, document)

    if (
      arePointsEqual(selection.anchor, range.anchor) &&
      arePointsEqual(selection.cursor, range.cursor)
    ) {
      this._updateDOMSelection()
      return
    }

    this.props.editor.run('onSelect', event)
  }

  public render(): React.ReactNode {
    const { document } = this.props.editor.value
    const children = document.blockNodes.map((node, i) => (
      <ReactBlockNode
        key={node.key}
        editor={this.props.editor}
        node={node}
        blockNodeIndex={i}
      />
    ))

    const style: React.CSSProperties = {
      // Prevent the default outline styles.
      outline: 'none',
      // Preserve adjacent whitespace and new lines.
      whiteSpace: 'pre-wrap',
      // Allow words to break if they are too long.
      wordWrap: 'break-word',
      // COMPAT: In iOS, a formatting menu with bold, italic and underline
      // buttons is shown which causes our internal value to get out of sync in
      // weird ways. This hides that.
      WebkitUserModify: 'read-write-plaintext-only',
      // Allow for passed-in styles to override anything.
      ...this.props.style
    }

    const Component = this.props.tagName || 'div'

    return (
      <Component
        {...this._reactEventHandlers}
        data-editor-type={RenderNodeType.Editor}
        ref={mergeRefs(this._editorRef, this.props.forwardRef)}
        contentEditable={true}
        suppressContentEditableWarning={true}
        className={this.props.className}
        autoCorrect={this.props.autoCorrect ? 'on' : 'off'}
        spellCheck={this.props.spellCheck}
        style={style}
        role={this.props.role || 'textbox'}
        tabIndex={this.props.tabIndex}
        // COMPAT: The Grammarly Chrome extension works by changing the DOM out
        // from under `contenteditable` elements, which leads to weird behaviors
        // so we have to disable it like this.
        data-gramm={false}
      >
        {children}
      </Component>
    )
  }
}
interface HandledReactEvents {
  onCopy: React.ClipboardEvent<HTMLElement>
  onCut: React.ClipboardEvent<HTMLElement>
  onPaste: React.ClipboardEvent<HTMLElement>
  onBeforeInput:
    | React.CompositionEvent<HTMLElement>
    | React.FormEvent<HTMLElement>
  onCompositionEnd: React.CompositionEvent<HTMLElement>
  onCompositionUpdate: React.CompositionEvent<HTMLElement>
  onCompositionStart: React.CompositionEvent<HTMLElement>
  onKeyDown: React.KeyboardEvent<HTMLElement>
  onKeyPress: React.KeyboardEvent<HTMLElement>
  onKeyUp: React.KeyboardEvent<HTMLElement>
  onFocus: React.FocusEvent<HTMLElement>
  onBlur: React.FocusEvent<HTMLElement>
  onInput: React.FormEvent<HTMLElement>
  onClick: React.MouseEvent<HTMLElement>
  onContextMenu: React.MouseEvent<HTMLElement>
  onDoubleClick: React.MouseEvent<HTMLElement>
  onDrag: React.DragEvent<HTMLElement>
  onDragEnd: React.DragEvent<HTMLElement>
  onDragEnter: React.DragEvent<HTMLElement>
  onDragExit: React.DragEvent<HTMLElement>
  onDragLeave: React.DragEvent<HTMLElement>
  onDragOver: React.DragEvent<HTMLElement>
  onDragStart: React.DragEvent<HTMLElement>
  onDrop: React.MouseEvent<HTMLElement>
  onMouseDown: React.MouseEvent<HTMLElement>
  onMouseEnter: React.MouseEvent<HTMLElement>
  onMouseLeave: React.MouseEvent<HTMLElement>
  onMouseMove: React.MouseEvent<HTMLElement>
  onMouseOut: React.MouseEvent<HTMLElement>
  onMouseOver: React.MouseEvent<HTMLElement>
  onMouseUp: React.MouseEvent<HTMLElement>
}

interface HandledEvents extends HandledReactEvents {
  onNativeBeforeInput: BeforeInputEvent
  onSelect: Event
}

const reactEventNames: Array<keyof HandledReactEvents> = [
  'onCopy',
  'onCut',
  'onPaste',
  'onBeforeInput',
  'onCompositionEnd',
  'onCompositionUpdate',
  'onCompositionStart',
  'onKeyDown',
  'onKeyPress',
  'onKeyUp',
  'onFocus',
  'onBlur',
  'onInput',
  'onClick',
  'onContextMenu',
  'onDoubleClick',
  'onDrag',
  'onDragEnd',
  'onDragEnter',
  'onDragExit',
  'onDragLeave',
  'onDragOver',
  'onDragStart',
  'onDrop',
  'onMouseDown',
  'onMouseEnter',
  'onMouseLeave',
  'onMouseMove',
  'onMouseOut',
  'onMouseOver',
  'onMouseUp'
  // 'onSelect'
]

type ReactEventHandlerMap = {
  [K in keyof HandledReactEvents]: (event: HandledReactEvents[K]) => void
}
