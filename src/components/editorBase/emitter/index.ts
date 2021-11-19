import { Disposable } from 'modules/disposable'
import { nullDisposable } from 'modules/disposable/nullDisposable'
import { removeOnce } from 'utils/removeOnce'

export class Emitter<T> implements Disposable {
  private _disposed = false
  private _subscribers: Array<{ callback(event: T): void }> = []

  public subscribe = (callback: (event: T) => void): Disposable => {
    if (this._disposed) {
      return nullDisposable
    }

    const subscriber = { callback }

    this._subscribers.push(subscriber)

    return {
      dispose: (): void => {
        if (!this._disposed) {
          removeOnce(this._subscribers, subscriber)
        }
      }
    }
  }

  public emit(value: T): void {
    if (!this._disposed) {
      this._subscribers.forEach(subscriber => subscriber.callback(value))
    }
  }

  public dispose(): void {
    if (!this._disposed) {
      this._disposed = true
      this._subscribers.length = 0
    }
  }
}
