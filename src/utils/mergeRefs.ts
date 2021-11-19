export function mergeRefs<T>(
  ...refs: Array<React.Ref<T> | undefined>
): (instance: T | null) => void {
  return (instance: T | null) => {
    refs.forEach(inputRef => {
      if (typeof inputRef === 'function') {
        inputRef(instance)
      } else if (inputRef) {
        (inputRef as any).current = instance
      }
    })
  }
}
