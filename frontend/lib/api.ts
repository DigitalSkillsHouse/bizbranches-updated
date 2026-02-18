/**
 * Single source for backend API base URL (server-side only).
 * Client-side requests use /api/* which is rewritten to the backend.
 */
export function getBackendUrl(): string {
  return (
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:3002"
  );
}
