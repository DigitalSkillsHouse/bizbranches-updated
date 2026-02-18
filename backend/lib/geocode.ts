import { logger } from './logger';

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  displayName?: string;
}

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org/search';
const RATE_LIMIT_MS = 1100;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

let lastRequestTime = 0;
const cache = new Map<string, { result: GeocodeResult; ts: number }>();

function cacheKey(address: string, city: string, area?: string | null, country?: string): string {
  return [address.trim().toLowerCase(), city.trim().toLowerCase(), (area || '').trim().toLowerCase(), (country || 'Pakistan').trim().toLowerCase()].join('|');
}

async function throttle() {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < RATE_LIMIT_MS) {
    await new Promise((r) => setTimeout(r, RATE_LIMIT_MS - elapsed));
  }
  lastRequestTime = Date.now();
}

/**
 * Geocode address + city + area (Pakistan) via Nominatim. No API key required.
 * Returns lat/lng or null if not found. Use optional GOOGLE_GEOCODING_API_KEY for production if needed.
 * Results cached in-memory (24h) for scalability.
 */
export async function geocodeAddress(
  address: string,
  city: string,
  area?: string | null,
  country: string = 'Pakistan'
): Promise<GeocodeResult | null> {
  const query = [address, area, city, country].filter(Boolean).join(', ');
  if (!query.trim()) return null;

  const key = cacheKey(address, city, area, country);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.result;
  if (cache.size > 5000) {
    const oldest = [...cache.entries()].sort((a, b) => a[1].ts - b[1].ts)[0];
    if (oldest) cache.delete(oldest[0]);
  }

  const apiKey = process.env.GOOGLE_GEOCODING_API_KEY;
  if (apiKey) {
    const res = await geocodeGoogle(query, apiKey);
    if (res) {
      cache.set(key, { result: res, ts: Date.now() });
      return res;
    }
  }

  await throttle();
  try {
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      limit: '1',
      countrycodes: 'pk',
    });
    const response = await fetch(`${NOMINATIM_BASE}?${params.toString()}`, {
      headers: { 'User-Agent': 'BizBranches-Pakistan-Directory/1.0' },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const first = data[0];
    const lat = parseFloat(first?.lat);
    const lon = parseFloat(first?.lon);
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      const result: GeocodeResult = {
        latitude: lat,
        longitude: lon,
        displayName: first?.display_name,
      };
      cache.set(key, { result, ts: Date.now() });
      return result;
    }
  } catch (e) {
    logger.warn('Geocode (Nominatim) failed:', (e as Error)?.message);
  }
  return null;
}

async function geocodeGoogle(query: string, apiKey: string): Promise<GeocodeResult | null> {
  try {
    const params = new URLSearchParams({
      address: query,
      key: apiKey,
      region: 'pk',
    });
    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`, {
      signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) return null;
    const data = await response.json();
    const loc = data?.results?.[0]?.geometry?.location;
    if (loc && Number.isFinite(loc.lat) && Number.isFinite(loc.lng)) {
      return {
        latitude: loc.lat,
        longitude: loc.lng,
        displayName: data.results[0]?.formatted_address,
      };
    }
  } catch (e) {
    logger.warn('Geocode (Google) failed:', (e as Error)?.message);
  }
  return null;
}
