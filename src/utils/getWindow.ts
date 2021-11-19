import { getDocument } from './getDocument'

export function getWindow(node: Node): Window {
  const document = getDocument(node)

  return document.defaultView || (document as any).parentWindow
}
