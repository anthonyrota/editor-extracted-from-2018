export function toBase64(object: object): string {
  return btoa(encodeURIComponent(JSON.stringify(object)))
}

export function fromBase64(string: string): object {
  return JSON.parse(decodeURIComponent(atob(string)))
}
