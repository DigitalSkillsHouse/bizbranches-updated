/**
 * Google Sitemap Ping — notifies Google when sitemap content changes.
 * Server-side only, non-blocking, never throws. Call after sitemap-relevant updates (e.g. business approved).
 */

import { logger } from './logger';
import { getModels } from './models';

/** Google limit: 50,000 URLs per sitemap. Match frontend sitemap split. */
const SITEMAP_BUSINESS_LIMIT = 45000;

/** Public site base URL (frontend) where sitemap.xml is served. */
function getSiteBaseUrl(): string {
  const url =
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.FRONTEND_URL ||
    (process.env.NODE_ENV === 'production' ? 'https://bizbranches.pk' : 'https://bizbranches-theta.vercel.app');
  return url.replace(/\/$/, '');
}

/**
 * Build list of sitemap URLs to ping: index + pages.xml + businesses/1..N.
 * Uses DB count so child sitemaps stay in sync with actual split.
 */
async function getSitemapUrls(): Promise<string[]> {
  const base = getSiteBaseUrl();
  const urls: string[] = [
    `${base}/sitemap.xml`,
    `${base}/sitemap/pages.xml`,
  ];

  try {
    const models = await getModels();
    const filter = {
      status: 'approved',
      slug: { $exists: true, $ne: '', $type: 'string' as const },
    };
    const total = await models.businesses.countDocuments(filter);
    if (total > 0) {
      const pages = Math.ceil(total / SITEMAP_BUSINESS_LIMIT);
      for (let p = 1; p <= pages; p++) {
        urls.push(`${base}/sitemap/businesses/${p}`);
      }
    }
  } catch (e) {
    logger.error('Google ping: failed to get business count, pinging index + pages only', e);
  }

  return urls;
}

/**
 * Send a single GET request to Google ping endpoint. URL must be fully encoded.
 * Logs result; never throws.
 */
async function pingOne(sitemapUrl: string): Promise<{ url: string; ok: boolean; status?: number }> {
  const pingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
  try {
    const res = await fetch(pingUrl, { method: 'GET' });
    const ok = res.ok;
    if (!ok) {
      logger.error('Google sitemap ping failed:', sitemapUrl, res.status);
    } else {
      logger.log('Google sitemap ping OK:', sitemapUrl);
    }
    return { url: sitemapUrl, ok, status: res.status };
  } catch (err) {
    logger.error('Google sitemap ping error:', sitemapUrl, err);
    return { url: sitemapUrl, ok: false };
  }
}

/**
 * Ping Google for the sitemap index and all child sitemaps.
 * Non-blocking: run with .catch() from caller. Never throws; logs success/failure per URL.
 * Call only when sitemap content actually changes (e.g. business approved) to avoid spam.
 */
export async function pingGoogleSitemap(): Promise<void> {
  try {
    const urls = await getSitemapUrls();
    if (urls.length === 0) return;

    const results = await Promise.allSettled(urls.map(pingOne));

    let okCount = 0;
    let failCount = 0;
    for (const r of results) {
      if (r.status === 'fulfilled') {
        if (r.value.ok) okCount++;
        else failCount++;
      } else {
        failCount++;
        logger.error('Google ping promise rejected:', r.reason);
      }
    }

    logger.log(`Google sitemap ping done: ${okCount} OK, ${failCount} failed (${urls.length} URLs)`);
  } catch (e) {
    logger.error('Google sitemap ping (top-level):', e);
  }
}
