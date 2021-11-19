import uuid from 'uuid/v4'

export function createKey(): string {
  return uuid()
}
