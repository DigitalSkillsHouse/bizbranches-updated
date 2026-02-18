import express from 'express';
import { getModels } from '../lib/models';
import { logger } from '../lib/logger';
import { safeSearchQuery } from '../lib/sanitize';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const raw = (req.query.q as string)?.trim() ?? '';
    if (raw.length < 2) {
      return res.json({
        ok: true,
        businesses: [],
        categories: [],
      });
    }

    const models = await getModels();
    const escaped = safeSearchQuery(raw);
    const regex = new RegExp(escaped, 'i');

    // Fetch businesses and categories in parallel
    const [businesses, categories] = await Promise.all([
      models.businesses
        .find(
          {
            $or: [
              { name: { $regex: regex } },
              { description: { $regex: regex } },
            ],
            status: 'approved', // Only search approved businesses
          },
          { projection: { name: 1, city: 1, category: 1, logoUrl: 1, slug: 1 } } // Include slug for linking
        )
        .limit(5) // Limit business results
        .maxTimeMS(300)
        .toArray(),

      models.categories.find(
        { name: { $regex: regex } },
        { projection: { name: 1, slug: 1 } } // Project only needed fields
      )
      .limit(3) // Limit category results
      .toArray(),
    ]);

    // Add id field for each business
    const businessesWithId = businesses.map((business: any) => ({
      ...business,
      id: business._id.toString(),
    }));

    res.json({
      ok: true,
      businesses: businessesWithId,
      categories,
    });

  } catch (error) {
    logger.error('Error fetching search suggestions:', error);
    const { getSafeErrorMessage } = await import('../lib/safe-error');
    res.status(500).json({
      ok: false,
      error: getSafeErrorMessage(error, 'Failed to fetch search suggestions.'),
    });
  }
});

export default router;