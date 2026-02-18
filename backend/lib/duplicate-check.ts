/**
 * Duplicate business validation — indexed checks for name+city+category, phone, email, website, social URLs.
 * Used server-side only; never blocks UI. Returns which fields caused conflict.
 */

import { getModels } from './models';

const COLLATION = { locale: 'en', strength: 2 }; // case-insensitive

function normalizePhone(phone: string): string {
  return String(phone || '').replace(/\D/g, '');
}

function normalizeEmail(email: string): string {
  return String(email || '').trim().toLowerCase();
}

function normalizeUrl(url: string): string | null {
  const u = String(url || '').trim().toLowerCase();
  if (!u) return null;
  try {
    const parsed = new URL(u.startsWith('http') ? u : `https://${u}`);
    let path = parsed.pathname.replace(/\/+$/, '') || '/';
    return `${parsed.host}${path}${parsed.search}`;
  } catch {
    return u;
  }
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** For insert/update: compute phoneDigits and websiteNormalized for indexing. */
export function getNormalizedForInsert(phone: string, websiteUrl?: string | null): { phoneDigits: string; websiteNormalized?: string } {
  const phoneDigits = normalizePhone(phone);
  const websiteNormalized = websiteUrl ? normalizeUrl(websiteUrl) ?? undefined : undefined;
  return { phoneDigits, websiteNormalized };
}

export type DuplicateConflicts = {
  nameCityCategory?: boolean;
  phone?: boolean;
  whatsapp?: boolean;
  email?: boolean;
  address?: boolean;
  websiteUrl?: boolean;
  facebookUrl?: boolean;
  gmbUrl?: boolean;
  youtubeUrl?: boolean;
};

export type DuplicateCheckInput = {
  name: string;
  city: string;
  category: string;
  phone: string;
  whatsapp?: string | null;
  email: string;
  websiteUrl?: string | null;
  facebookUrl?: string | null;
  gmbUrl?: string | null;
  youtubeUrl?: string | null;
  /** When checking before create, pass nothing. When editing, pass current business id to exclude from check. */
  excludeId?: string;
};

/**
 * Run duplicate checks using indexed/collation queries. Returns which fields conflict.
 * Does not throw; returns empty conflicts on error.
 */
export async function checkDuplicateBusiness(input: DuplicateCheckInput): Promise<DuplicateConflicts> {
  const conflicts: DuplicateConflicts = {};
  try {
    const models = await getModels();
    const name = String(input.name || '').trim();
    const city = String(input.city || '').trim();
    const category = String(input.category || '').trim();
    const phoneNorm = normalizePhone(input.phone);
    const whatsappNorm = input.whatsapp ? normalizePhone(input.whatsapp) : '';
    const emailNorm = normalizeEmail(input.email);
    const websiteNorm = input.websiteUrl ? normalizeUrl(input.websiteUrl) : null;
    const facebookNorm = input.facebookUrl ? normalizeUrl(input.facebookUrl) : null;
    const gmbNorm = input.gmbUrl ? normalizeUrl(input.gmbUrl) : null;
    const youtubeNorm = input.youtubeUrl ? normalizeUrl(input.youtubeUrl) : null;

    const excludeFilter = input.excludeId ? { _id: { $ne: input.excludeId } } : {};
    const withExclude = (q: object) => (Object.keys(excludeFilter).length ? { $and: [q, excludeFilter] } : q);

    const queries: Array<{ key: keyof DuplicateConflicts; run: () => Promise<boolean> }> = [];

    if (name && city && category) {
      queries.push({
        key: 'nameCityCategory',
        run: async () => {
          const doc = await models.businesses.findOne(
            withExclude({ name, city, category }),
            { collation: COLLATION, projection: { _id: 1 } }
          );
          return !!doc;
        },
      });
    }

    if (phoneNorm.length >= 7) {
      queries.push({
        key: 'phone',
        run: async () => {
          const byDigits = await models.businesses.findOne(
            withExclude({ phoneDigits: phoneNorm }),
            { projection: { _id: 1 } }
          );
          if (byDigits) return true;
          const escaped = escapeRegex(input.phone.trim());
          const byRegex = await models.businesses.findOne(
            withExclude({ phone: { $regex: new RegExp(escaped, 'i') } }),
            { projection: { _id: 1 } }
          );
          return !!byRegex;
        },
      });
    }

    if (whatsappNorm.length >= 7) {
      queries.push({
        key: 'whatsapp',
        run: async () => {
          const escaped = escapeRegex(input.whatsapp!.trim());
          const doc = await models.businesses.findOne(
            withExclude({ whatsapp: { $regex: new RegExp(escaped, 'i') } }),
            { projection: { _id: 1 } }
          );
          return !!doc;
        },
      });
    }

    if (emailNorm) {
      queries.push({
        key: 'email',
        run: async () => {
          const doc = await models.businesses.findOne(
            withExclude({ email: emailNorm }),
            { collation: COLLATION, projection: { _id: 1 } }
          );
          if (doc) return true;
          const escaped = escapeRegex(input.email.trim());
          const docRegex = await models.businesses.findOne(
            withExclude({ email: { $regex: new RegExp(`^${escaped}$`, 'i') } }),
            { projection: { _id: 1 } }
          );
          return !!docRegex;
        },
      });
    }

    if (websiteNorm) {
      queries.push({
        key: 'websiteUrl',
        run: async () => {
          const doc = await models.businesses.findOne(
            withExclude({ websiteNormalized: websiteNorm }),
            { projection: { _id: 1 } }
          );
          if (doc) return true;
          const escaped = escapeRegex(websiteNorm);
          const docRegex = await models.businesses.findOne(
            withExclude({
              $or: [
                { websiteUrl: { $regex: new RegExp(escaped, 'i') } },
                { websiteNormalized: { $regex: new RegExp(escaped, 'i') } },
              ],
            }),
            { projection: { _id: 1 } }
          );
          return !!docRegex;
        },
      });
    }

    if (facebookNorm) {
      queries.push({
        key: 'facebookUrl',
        run: async () => {
          const escaped = escapeRegex(facebookNorm);
          const doc = await models.businesses.findOne(
            withExclude({ facebookUrl: { $regex: new RegExp(escaped, 'i') } }),
            { projection: { _id: 1 } }
          );
          return !!doc;
        },
      });
    }

    if (gmbNorm) {
      queries.push({
        key: 'gmbUrl',
        run: async () => {
          const escaped = escapeRegex(gmbNorm);
          const doc = await models.businesses.findOne(
            withExclude({ gmbUrl: { $regex: new RegExp(escaped, 'i') } }),
            { projection: { _id: 1 } }
          );
          return !!doc;
        },
      });
    }

    if (youtubeNorm) {
      queries.push({
        key: 'youtubeUrl',
        run: async () => {
          const escaped = escapeRegex(youtubeNorm);
          const doc = await models.businesses.findOne(
            withExclude({ youtubeUrl: { $regex: new RegExp(escaped, 'i') } }),
            { projection: { _id: 1 } }
          );
          return !!doc;
        },
      });
    }

    const outcomes = await Promise.all(queries.map(async (q) => ({ key: q.key, found: await q.run() })));
    for (const { key, found } of outcomes) {
      if (found) (conflicts as Record<string, boolean>)[key] = true;
    }
  } catch (e) {
    const { logger } = await import('./logger');
    logger.error('Duplicate check error:', e);
  }
  return conflicts;
}

export function hasAnyConflict(conflicts: DuplicateConflicts): boolean {
  return Object.values(conflicts).some(Boolean);
}

/** Map API conflict keys to form field names for frontend */
export const conflictToFormField: Record<keyof DuplicateConflicts, string> = {
  nameCityCategory: 'businessName',
  phone: 'phone',
  whatsapp: 'whatsapp',
  email: 'email',
  address: 'address',
  websiteUrl: 'websiteUrl',
  facebookUrl: 'facebookUrl',
  gmbUrl: 'gmbUrl',
  youtubeUrl: 'youtubeUrl',
};
