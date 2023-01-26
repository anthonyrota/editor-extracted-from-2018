import { v4 } from "uuid";

export function createKey(): string {
  return v4();
}
