import { createKey } from '../utils/createKey'

export function regenerateKey<T extends { key: string }>(node: T): T {
  return { ...node, key: createKey() }
}
