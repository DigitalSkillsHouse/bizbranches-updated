/**
 * In-memory rate limiter for API routes. Use for submission/form endpoints.
 */
const store = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_PER_WINDOW = 30; // e.g. 30 requests per minute per IP

function getKey(ip: string, path: string): string {
  return `${ip}:${path}`;
}

function cleanup(): void {
  const now = Date.now();
  for (const [k, v] of store.entries()) {
    if (v.resetAt < now) store.delete(k);
  }
}
if (typeof setInterval !== "undefined") {
  setInterval(cleanup, 60000);
}

export function rateLimit(ip: string, path: string, maxPerWindow = MAX_PER_WINDOW): { ok: boolean; retryAfter?: number } {
  const now = Date.now();
  const key = getKey(ip, path);
  let entry = store.get(key);
  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + WINDOW_MS };
    store.set(key, entry);
  }
  entry.count += 1;
  if (entry.count > maxPerWindow) {
    return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  return { ok: true };
}

export function getClientIp(req: { ip?: string; headers?: Record<string, string | string[] | undefined> }): string {
  const forwarded = req.headers?.["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  if (Array.isArray(forwarded)) return String(forwarded[0] || "").trim();
  return req.ip || "unknown";
}

/** Global rate limit: per-IP across all API routes. */
const GLOBAL_WINDOW_MS = 60 * 1000;
const GLOBAL_MAX_PER_WINDOW = 300;

export function globalRateLimit(ip: string): { ok: boolean; retryAfter?: number } {
  const now = Date.now();
  const key = `global:${ip}`;
  let entry = store.get(key);
  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + GLOBAL_WINDOW_MS };
    store.set(key, entry);
  }
  entry.count += 1;
  if (entry.count > GLOBAL_MAX_PER_WINDOW) {
    return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  return { ok: true };
}
