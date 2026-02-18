/**
 * Sitemap helpers: base URL, XML escaping, and Google-standard URL entries.
 * Used by App Router sitemap routes only (server-side).
 */

import { SITE_URL } from "./site";

export function getBaseUrl(): string {
  return (SITE_URL || "https://bizbranches.pk").replace(/\/$/, "");
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * One <url> entry for urlset (pages or listings).
 */
export function urlEntry(
  path: string,
  options: { lastmod?: Date; changefreq?: string; priority?: string } = {}
): string {
  const base = getBaseUrl();
  const loc = path.startsWith("http") ? path : `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const lastmod = options.lastmod
    ? `<lastmod>${options.lastmod.toISOString().slice(0, 10)}</lastmod>`
    : "";
  const changefreq = options.changefreq ? `<changefreq>${escapeXml(options.changefreq)}</changefreq>` : "";
  const priority = options.priority ? `<priority>${escapeXml(options.priority)}</priority>` : "";
  return `<url><loc>${escapeXml(loc)}</loc>${lastmod}${changefreq}${priority}</url>`;
}

/**
 * One <sitemap> entry for sitemap index.
 */
export function sitemapEntry(path: string, lastmod?: Date): string {
  const base = getBaseUrl();
  const loc = path.startsWith("http") ? path : `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const lastmodTag = lastmod
    ? `<lastmod>${lastmod.toISOString().slice(0, 10)}</lastmod>`
    : "";
  return `<sitemap><loc>${escapeXml(loc)}</loc>${lastmodTag}</sitemap>`;
}
