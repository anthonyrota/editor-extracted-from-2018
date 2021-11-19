export function anyPass<T>(
  predicates: Array<(value: T) => boolean>
): (value: T) => boolean {
  return value => predicates.some(func => func(value))
}
