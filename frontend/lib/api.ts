/**
 * Single source for backend API base URL (server-side only).
 * 
 * On cPanel: frontend and backend share the same domain.
 * Apache routes /api/* to PHP, so BACKEND_URL = SITE_URL.
 * 
 * In dev: /api/* is proxied to the PHP backend via Next.js rewrites.
 */
export function getBackendUrl(): string {
  return (
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:3002"
  );
}
