import { forEach } from 'lodash-es'
import { toBase64 } from 'utils/base64'
import { isIE } from 'utils/environment'
import { getWindow } from 'utils/getWindow'
import { Fragment } from '../fragment'
import { getFragmentAtRange } from '../fragment/getFragmentAtRange'
import { BlockNodeType, InlineNodeType } from '../node'
import { getBlockNodeAtPoint } from '../node/getBlockNodeAtPoint'
import { Value } from '../value'
import {
  fragmentTransferType,
  htmlTransferType,
  textTransferType
} from './transferTypes'

export function cloneFragment(
  event: React.ClipboardEvent<HTMLElement>,
  editableElement: HTMLElement,
  value: Value<unknown, unknown, unknown, unknown>,
  callback?: () => void
): void {
  const window = getWindow(event.target as Node)
  const native = window.getSelection()
  const { document, selection } = value
  const fragment = getFragmentAtRange(document, selection)
  const { start, end } = selection
  // const startVoid = document.getClosestVoid(start.key, editor)
  // const endVoid = document.getClosestVoid(end.key, editor)

  // If the selection is collapsed, and it isn't inside a void node, abort.
  if (native.isCollapsed) {
    const blockNode = getBlockNodeAtPoint(document, start)

    if (blockNode.type !== BlockNodeType.Void) {
      return
    }
  }

  // Create a fake selection so that we can add a Base64-encoded copy of the
  // fragment to the HTML, to decode on future pastes.
  const encoded = toBase64(fragment)
  const range = native.getRangeAt(0)
  let contents = range.cloneContents()
  let attach = contents.childNodes[0]

  // Make sure attach is a non-empty node, since empty nodes will not get copied
  forEach(contents.childNodes, node => {
    if (node.textContent && node.textContent.trim() !== '') {
      attach = node
    }
  })

  const endBlockNode = getBlockNodeAtPoint(document, end)

  // COMPAT: If the end node is a void node, we need to move the end of the
  // range from the void node's spacer span, to the end of the void node's
  // content, since the spacer is before void's content in the DOM.
  if (endBlockNode.type === BlockNodeType.Void) {
    const r = range.cloneRange()
    const node = editableElement.childNodes[end.blockNodeIndex]
    r.setEndAfter(node)
    contents = r.cloneContents()
  }

  const startBlockNode = getBlockNodeAtPoint(document, start)

  // COMPAT: If the start node is a void node, we need to attach the encoded
  // fragment to the void node's content node instead of the spacer, because
  // attaching it to empty `<div>/<span>` nodes will end up having it erased by
  // most browsers.
  if (startBlockNode.type === BlockNodeType.Void) {
    attach = contents.childNodes[0].childNodes[1].firstChild!
  }

  const spacers = contents.querySelectorAll('data-editor-spacer')

  for (let i = 0; i < spacers.length; i++) {
    spacers[i].textContent = ''
  }

  const voidEdgeSpacers = contents.querySelectorAll(
    'data-editor-void-edge-spacer'
  )

  for (let i = 0; i < voidEdgeSpacers.length; i++) {
    voidEdgeSpacers[i].textContent = ''
  }

  let attachElement: Element

  // Set a `data-slate-fragment` attribute on a non-empty node, so it shows up
  // in the HTML, and can be used for intra-Slate pasting. If it's a text
  // node, wrap it in a `<span>` so we have something to set an attribute on.
  if (attach.nodeType === 3) {
    const span = window.document.createElement('span')

    // COMPAT: In Chrome and Safari, if we don't add the `white-space` style
    // then leading and trailing spaces will be ignored.
    span.style.whiteSpace = 'pre'

    span.appendChild(attach)
    contents.appendChild(span)
    attachElement = span
  } else {
    attachElement = attach as Element
  }

  attachElement.setAttribute('data-editor-fragment', encoded)

  const plainText = extractTextFromFragment(fragment)

  // Add the phony content to a div element. This is needed to copy the
  // contents into the html clipboard register.
  const div = window.document.createElement('div')
  div.appendChild(contents)

  // For browsers supporting it, we set the clipboard registers manually,
  // since the result is more predictable.
  // COMPAT: IE supports the setData method, but only in restricted sense.
  // IE doesn't support arbitrary MIME types or common ones like 'text/plain'
  // it only accepts "Text" (which gets mapped to 'text/plain') and "Url"
  // (mapped to 'text/url-list') so, we should only enter block if !IS_IE
  if (event.clipboardData && event.clipboardData.setData && !isIE) {
    event.preventDefault()
    event.clipboardData.setData(textTransferType, plainText)
    event.clipboardData.setData(fragmentTransferType, encoded)
    event.clipboardData.setData(htmlTransferType, div.innerHTML)
    if (callback) {
      callback()
    }
    return
  }

  // COMPAT: For browser that don't support the Clipboard API's setData method,
  // we must rely on the browser to natively copy what's selected.
  // So we add the div (containing our content) to the DOM, and select it.
  div.setAttribute('contenteditable', 'true')
  div.style.position = 'absolute'
  div.style.left = '-9999px'
  editableElement.appendChild(div)
  native.selectAllChildren(div)

  // Revert to the previous selection right after copying.
  window.requestAnimationFrame(() => {
    editableElement.removeChild(div)

    // COMPAT: if we are in <= IE11 and the selection contains
    // tables, `removeAllRanges()` will throw
    // "unable to complete the operation due to error"
    if ('createTextRange' in window.document.body) {
      // All IE but Edge
      const range = (window.document.body as any).createTextRange()
      range.collapse()
      range.select()
    } else {
      native.removeAllRanges()
    }

    native.addRange(range)
    if (callback) {
      callback()
    }
  })
}

function extractTextFromFragment(
  fragment: Fragment<unknown, unknown, unknown, unknown>
): string {
  return fragment.blockNodes
    .map(node =>
      node.type === BlockNodeType.Content
        ? node.content.map(node =>
            node.type === InlineNodeType.Text ? node.text : ''
          )
        : ''
    )
    .join('\n')
}
