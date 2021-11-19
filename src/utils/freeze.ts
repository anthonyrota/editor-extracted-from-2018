import { identity } from "lodash-es";

export const freeze: typeof Object.freeze =
  process.env.NODE_ENV === "production"
    ? identity
    : typeof Object.freeze !== "undefined"
    ? Object.freeze
    : identity;
