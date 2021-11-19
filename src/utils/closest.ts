export const matches =
  Element.prototype.matches ||
  (Element.prototype as any).msMatchesSelector ||
  (Element.prototype as any).webkitMatchesSelector

export function closest<K extends keyof HTMLElementTagNameMap>(
  node: Node | Element,
  selector: K
): HTMLElementTagNameMap[K] | null
export function closest<K extends keyof SVGElementTagNameMap>(
  element: Node | Element,
  selector: K
): SVGElementTagNameMap[K] | null
export function closest(node: Node | Element, selector: string): Element | null
export function closest(
  node: Node | Element,
  selector: string
): Element | null {
  if ('closest' in node) {
    return node.closest(selector)
  }

  if (node.nodeType !== 1) {
    node = node.parentNode!
  }

  while (node && node.nodeType === 1) {
    if (matches.call(node, selector)) {
      return node as Element
    }

    node = node.parentNode!
  }

  return null
}
