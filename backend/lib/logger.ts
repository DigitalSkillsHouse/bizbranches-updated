/**
 * Server logger: verbose only in development; errors always (for monitoring).
 */
const isProd = process.env.NODE_ENV === "production";

export const logger = {
  log: (...args: unknown[]) => (!isProd ? console.log(...args) : undefined),
  warn: (...args: unknown[]) => (!isProd ? console.warn(...args) : undefined),
  info: (...args: unknown[]) => (!isProd ? console.info(...args) : undefined),
  error: (...args: unknown[]) => console.error(...args),
};
