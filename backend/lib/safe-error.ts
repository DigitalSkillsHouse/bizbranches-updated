/**
 * Safe error messages for API responses. Never expose stack traces or
 * internal details in production.
 */
const isProd = process.env.NODE_ENV === "production";

export function getSafeErrorMessage(err: unknown, genericMessage = "An error occurred. Please try again later."): string {
  if (!isProd && err instanceof Error && err.message) {
    return err.message;
  }
  return genericMessage;
}
