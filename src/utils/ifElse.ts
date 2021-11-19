export function ifElse<T, R>(
  predicate: (value: T) => boolean,
  ifTrue: (value: T) => R,
  ifFalse: (value: T) => R
): (value: T) => R {
  return value => (predicate(value) ? ifTrue(value) : ifFalse(value))
}
