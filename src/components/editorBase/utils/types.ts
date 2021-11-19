export type DeepArrayLike<T> = T | DeepArrayLikeNotValue<T>

export interface DeepArrayLikeNotValue<T> {
  readonly length: number
  readonly [n: number]: DeepArrayLike<T>
}

export type Mutable<T> = { -readonly [K in keyof T]: T[K] }
