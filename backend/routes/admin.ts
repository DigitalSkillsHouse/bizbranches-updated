/**
 * Admin API — auto-approved submissions log. Requires ADMIN_SECRET.
 */

import express from 'express';
import { getModels } from '../lib/models';
import { logger } from '../lib/logger';
import { rateLimit, getClientIp } from '../lib/rate-limit';
import { getSafeErrorMessage } from '../lib/safe-error';

const router = express.Router();

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) {
    return res.status(500).json({ ok: false, error: 'Missing ADMIN_SECRET' });
  }
  const bearer = req.headers.authorization || '';
  const headerSecret = req.headers['x-admin-secret'] || (bearer.startsWith('Bearer ') ? bearer.slice(7) : '');
  if (headerSecret !== adminSecret) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }
  next();
}

router.use((req, res, next) => {
  const ip = getClientIp(req);
  const rl = rateLimit(ip, 'admin', 60);
  if (!rl.ok) {
    res.setHeader('Retry-After', String(rl.retryAfter ?? 60));
    return res.status(429).json({ ok: false, error: 'Too many requests.' });
  }
  next();
});
router.use(requireAdmin);

/**
 * GET /api/admin/submissions — List auto-approved submissions for admin panel.
 * Query: page, limit, from, to (optional date filters).
 */
router.get('/submissions', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const models = await getModels();
    const filter: Record<string, unknown> = { approvedBy: 'auto', status: 'approved' };

    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    if (from || to) {
      const dateFilter: Record<string, Date> = {};
      if (from) dateFilter.$gte = new Date(from);
      if (to) dateFilter.$lte = new Date(to);
      filter.createdAt = dateFilter;
    }

    const [total, list] = await Promise.all([
      models.businesses.countDocuments(filter),
      models.businesses
        .find(filter, {
          projection: {
            name: 1,
            slug: 1,
            category: 1,
            city: 1,
            email: 1,
            phone: 1,
            createdAt: 1,
            approvedAt: 1,
            approvedBy: 1,
          },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
    ]);

    const submissions = (list as Array<Record<string, unknown>>).map((b) => ({
      id: b._id?.toString(),
      businessName: b.name,
      slug: b.slug,
      category: b.category,
      city: b.city,
      email: b.email,
      phone: b.phone,
      submittedAt: b.createdAt,
      approvedAt: b.approvedAt,
      status: 'Auto-approved',
    }));

    res.json({
      ok: true,
      total,
      page,
      limit,
      submissions,
    });
  } catch (err: unknown) {
    logger.error('Admin submissions error:', err);
    res.status(500).json({ ok: false, error: getSafeErrorMessage(err, 'Failed to fetch submissions.') });
  }
});

export default router;
