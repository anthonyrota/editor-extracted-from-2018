export function allPass<T>(
  predicates: Array<(value: T) => boolean>
): (value: T) => boolean {
  return value => predicates.every(func => func(value))
}
