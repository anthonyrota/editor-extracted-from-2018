import { indexOf } from 'lodash-es'

export function getIndexOfElement(element: Node): number {
  return indexOf(element.parentNode!.childNodes, element)
}
