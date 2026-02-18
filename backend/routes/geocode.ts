import express from 'express';
import { geocodeAddress } from '../lib/geocode';
import { logger } from '../lib/logger';
import { getClientIp, rateLimit } from '../lib/rate-limit';

const router = express.Router();

router.get('/', async (req, res) => {
  const ip = getClientIp(req);
  const rl = rateLimit(ip, 'geocode', 20);
  if (!rl.ok) {
    return res.status(429).set('Retry-After', String(rl.retryAfter ?? 60)).json({ ok: false, error: 'Too many geocode requests' });
  }
  try {
    const address = String(req.query.address ?? '').trim();
    const city = String(req.query.city ?? '').trim();
    const area = (req.query.area != null && req.query.area !== '') ? String(req.query.area).trim() : undefined;
    const country = String(req.query.country ?? 'Pakistan').trim() || 'Pakistan';

    if (!address || !city) {
      return res.status(400).json({ ok: false, error: 'address and city are required' });
    }

    const result = await geocodeAddress(address, city, area, country);
    if (!result) {
      return res.json({ ok: true, latitude: null, longitude: null, error: 'Location could not be determined' });
    }
    res.json({
      ok: true,
      latitude: result.latitude,
      longitude: result.longitude,
      displayName: result.displayName,
    });
  } catch (e) {
    logger.error('Geocode route error:', e);
    res.status(500).json({ ok: false, error: 'Geocoding failed' });
  }
});

export default router;
