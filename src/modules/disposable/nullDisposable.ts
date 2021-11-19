import { Disposable } from '.'

export const nullDisposable: Disposable = {
  dispose(): void {}
}
