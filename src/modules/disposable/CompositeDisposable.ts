import { removeOnce } from 'utils/removeOnce'
import { Disposable } from '.'

export class CompositeDisposable {
  private _disposables: Disposable[] = []

  public add(disposable: Disposable): void {
    this._disposables.push(disposable)
  }

  public remove(disposable: Disposable): void {
    removeOnce(this._disposables, disposable)
  }

  public dispose(): void {
    this._disposables.forEach(disposable => {
      disposable.dispose()
    })
  }
}
