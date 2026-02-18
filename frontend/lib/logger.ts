/**
 * Client-safe logger: no-op in production so no console.* is shipped.
 * Use only for development debugging.
 */
const isDev = typeof process !== "undefined" && process.env.NODE_ENV !== "production";

export const logger = {
  log: (...args: unknown[]) => (isDev ? console.log(...args) : undefined),
  warn: (...args: unknown[]) => (isDev ? console.warn(...args) : undefined),
  error: (...args: unknown[]) => (isDev ? console.error(...args) : undefined),
  info: (...args: unknown[]) => (isDev ? console.info(...args) : undefined),
};
