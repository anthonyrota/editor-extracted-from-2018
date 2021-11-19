import { matches } from './closest'

export function querySelectorInclusive(
  element: Element,
  selector: string
): Element | null {
  if (matches.call(element, selector)) {
    return element
  }

  return element.querySelector(selector)
}
