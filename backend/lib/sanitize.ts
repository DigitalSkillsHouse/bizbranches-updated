/**
 * Escape user input for use in MongoDB regex to prevent ReDoS and injection.
 * Use for search queries and any user-controlled string used in $regex.
 */
export function escapeRegex(str: string): string {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Limit length of string used in regex to avoid expensive matches.
 */
const MAX_REGEX_INPUT_LENGTH = 200;

export function safeSearchQuery(input: string | undefined): string {
  const s = String(input ?? "").trim().slice(0, MAX_REGEX_INPUT_LENGTH);
  return escapeRegex(s);
}
