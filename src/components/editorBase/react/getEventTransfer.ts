import { indexOf } from 'lodash-es'
import { fromBase64 } from 'utils/base64'
import { isIE } from 'utils/environment'
import {
  fragmentTransferType,
  htmlTransferType,
  richTransferType,
  textTransferType
} from './transferTypes'

export type TransferDataType =
  | typeof fragmentTransferType
  | typeof htmlTransferType
  | typeof textTransferType

export interface TransferData {
  fragment: object
  html: string
  rich: string
  text: string
}

export function getEventTransfer(
  event: React.ClipboardEvent | React.DragEvent | ClipboardEvent | DragEvent
) {
  // COMPAT: IE 11 doesn't populate nativeEvent with either
  // dataTransfer or clipboardData. We'll need to use the base event
  // object (2018/14/6)
  if (!isIE && 'nativeEvent' in event) {
    event = event.nativeEvent
  }

  const transfer: DataTransfer =
    'dataTransfer' in event ? event.dataTransfer! : event.clipboardData
  let encodedFragment = getType(transfer, fragmentTransferType)
  // let node = getType(transfer, NODE)
  const html = getType(transfer, htmlTransferType)
  const rich = getType(transfer, richTransferType)
  const text = getType(transfer, textTransferType)
  let files: File[] | undefined

  // If there isn't a fragment, but there is HTML, check to see if the HTML is
  // actually an encoded fragment.
  if (!encodedFragment && html) {
    const body = new DOMParser().parseFromString(html, 'text/html').body
    // COMPAT: in IE 11 body is null if html is an empty string
    const nodeWithFragmentTransfer =
      body && body.querySelector('[data-editor-fragment]')

    if (nodeWithFragmentTransfer) {
      encodedFragment = nodeWithFragmentTransfer.getAttribute(
        'data-editor-fragment'
      )!
    }
  }

  let fragment: object | undefined

  // Decode a fragment or node if they exist.
  if (encodedFragment) {
    fragment = fromBase64(encodedFragment)
  }

  // COMPAT: Edge sometimes throws 'NotSupportedError'
  // when accessing `transfer.items`
  try {
    if (transfer.items && transfer.items.length) {
      files = []

      for (let i = 0; i < transfer.items.length; i++) {
        const item = transfer.items[i]

        if (item.kind === 'file') {
          const file = item.getAsFile()

          if (file) {
            files.push(file)
          }
        }
      }

      if (!files.length) {
        files = undefined
      }
    } else if (transfer.files && transfer.files.length) {
      files = [].slice.call(transfer.files)
    }
  } catch (err) {
    if (transfer.files && transfer.files.length) {
      files = [].slice.call(transfer.files)
    }
  }

  return {
    files,
    fragment,
    html,
    rich,
    text
  }
}

function getType(transfer: DataTransfer, type: string): string | null {
  if (!transfer.types || !transfer.types.length) {
    // COMPAT: In IE 11, there is no `types` field but `getData('Text')`
    // is supported`. (2017/06/23)
    return type === textTransferType ? transfer.getData('Text') || null : null
  }

  // COMPAT: In Edge, transfer.types doesn't respond to `indexOf`. (2017/10/25)
  return indexOf(transfer.types, type) !== -1
    ? transfer.getData(type) || null
    : null
}
