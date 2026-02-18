import express from 'express';
import { getModels } from '../lib/models';
import { logger } from '../lib/logger';
import { getSafeErrorMessage } from '../lib/safe-error';

const router = express.Router();

/** Google limit: 50,000 URLs per sitemap. Use 45,000 to stay safe. */
const MAX_LIMIT = 45000;

/** Slugify for URL segments (city, category, area). */
function toSlug(s: string): string {
  return String(s || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * GET /api/sitemap/businesses
 * Paginated list of approved businesses for sitemap (slug + updatedAt only).
 * Used by Next.js sitemap routes; does not load full documents.
 */
router.get('/businesses', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(req.query.limit as string) || MAX_LIMIT));
    const skip = (page - 1) * limit;

    const models = await getModels();
    const filter = {
      status: 'approved',
      slug: { $exists: true, $ne: '', $type: 'string' }
    };

    const [total, businesses] = await Promise.all([
      models.businesses.countDocuments(filter),
      models.businesses
        .find(filter, {
          projection: { slug: 1, updatedAt: 1, createdAt: 1 },
          sort: { _id: 1 }
        })
        .skip(skip)
        .limit(limit)
        .toArray()
    ]);

    const list = (businesses as Array<{ slug?: string; updatedAt?: Date; createdAt?: Date }>)
      .filter(b => b.slug && String(b.slug).trim())
      .map(b => ({
        slug: String(b.slug).trim(),
        updatedAt: b.updatedAt || b.createdAt || new Date()
      }));

    res.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    res.json({
      ok: true,
      total,
      page,
      limit,
      businesses: list
    });
  } catch (err: any) {
    logger.error('Sitemap API businesses:', err);
    res.status(500).json({ ok: false, error: getSafeErrorMessage(err, 'Failed to fetch sitemap businesses.') });
  }
});

/**
 * GET /api/sitemap/geo-pages
 * Returns distinct city+category and city+category+area combos that have at least one approved business.
 * Used by frontend sitemap for SEO; only indexes pages with content (scalable).
 */
router.get('/geo-pages', async (req, res) => {
  try {
    const models = await getModels();
    const cityCategory = await models.businesses
      .aggregate([
        { $match: { status: 'approved' } },
        { $group: { _id: { city: '$city', category: '$category' } } },
        { $project: { city: '$_id.city', category: '$_id.category', _id: 0 } },
        { $match: { city: { $exists: true, $ne: '' }, category: { $exists: true, $ne: '' } } },
        { $limit: 5000 },
      ])
      .toArray();
    const cityCategoryArea = await models.businesses
      .aggregate([
        { $match: { status: 'approved', area: { $exists: true, $ne: '', $type: 'string' } } },
        { $group: { _id: { city: '$city', category: '$category', area: '$area' } } },
        { $project: { city: '$_id.city', category: '$_id.category', area: '$_id.area', _id: 0 } },
        { $match: { city: { $exists: true, $ne: '' }, category: { $exists: true, $ne: '' }, area: { $exists: true, $ne: '' } } },
        { $limit: 10000 },
      ])
      .toArray();

    const cityCategoryList = (cityCategory as Array<{ city: string; category: string }>).map((r) => ({
      city: toSlug(r.city),
      cityName: r.city,
      category: toSlug(r.category),
    }));
    const cityCategoryAreaList = (cityCategoryArea as Array<{ city: string; category: string; area: string }>).map((r) => ({
      city: toSlug(r.city),
      cityName: r.city,
      category: toSlug(r.category),
      area: toSlug(r.area),
    }));

    res.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1200');
    res.json({
      ok: true,
      cityCategory: cityCategoryList,
      cityCategoryArea: cityCategoryAreaList,
    });
  } catch (err: any) {
    logger.error('Sitemap API geo-pages:', err);
    res.status(500).json({ ok: false, error: getSafeErrorMessage(err, 'Failed to fetch geo pages.') });
  }
});

export default router;
