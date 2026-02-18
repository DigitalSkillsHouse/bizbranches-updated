import express from 'express';
import multer from 'multer';
import { getModels } from '../lib/models';
import { CreateBusinessSchema, BusinessSchema } from '../lib/schemas';
import cloudinary from '../lib/cloudinary';
import { pingGoogleSitemap } from '../lib/google-ping';
import { checkDuplicateBusiness, hasAnyConflict, getNormalizedForInsert } from '../lib/duplicate-check';
import { sendConfirmationEmail } from '../lib/email';
import { geocodeAddress } from '../lib/geocode';
import { logger } from '../lib/logger';
import { rateLimit, getClientIp } from '../lib/rate-limit';
import { safeSearchQuery } from '../lib/sanitize';
import { getSafeErrorMessage } from '../lib/safe-error';

// Set up Multer for memory storage (buffers)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Helper to build a Cloudinary CDN URL from a public_id when logoUrl is missing
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const buildCdnUrl = (publicId?: string | null) => {
  if (!publicId || !process.env.CLOUDINARY_CLOUD_NAME) return undefined;

  // If it's already a full URL, return as is
  if (publicId.startsWith('http')) return publicId;

  // Normalize possible full Cloudinary-style path to extract the public_id including folders
  let cleanId = publicId
    .replace(/^https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/v?\d+\//, '') // strip host + delivery + optional version
    .replace(/^https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//, ''); // strip host + delivery (no version)

  // Remove file extension, Cloudinary works without it for transformation URLs
  cleanId = cleanId.replace(/\.[^/.]+$/, '');

  // Generate a resized, auto-format URL
  return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/c_fit,w_200,h_200,q_auto,f_auto/${cleanId}`;
};

async function uploadToCloudinary(buffer: Buffer): Promise<{ url: string; public_id: string } | null> {
  try {
    return await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "citation/business-logos",
          resource_type: "image",
          transformation: [{ quality: "auto", fetch_format: "auto", width: 200, height: 200, crop: "fit" }],
        },
        (error, result) => {
          if (error || !result) {
            logger.error("Cloudinary upload_stream error:", error);
            return reject(error);
          }
          resolve({ url: result.secure_url, public_id: result.public_id });
        },
      );
      stream.end(buffer);
    });
  } catch (e) {
    logger.error("uploadToCloudinary failed:", e);
    return null;
  }
}

// Validation helper function
async function validateUniqueBusinessName(name: string, excludeId?: string): Promise<boolean> {
  try {
    const models = await getModels();
    const filter: any = { 
      name: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    };
    
    // Exclude current business when updating
    if (excludeId) {
      const { ObjectId } = require("mongodb") as typeof import("mongodb");
      filter._id = { $ne: new ObjectId(excludeId) };
    }
    
    const existing = await models.businesses.findOne(filter);
    return !existing; // Return true if name is unique (no existing business found)
  } catch (error) {
    logger.error('Error validating unique business name:', error);
    return false;
  }
}

const router = express.Router();

// GET /api/business/pending - List pending businesses (frontend submissions only)
router.get('/pending', async (req, res) => {
  try {
    const models = await getModels();
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;
    
    // Only show pending businesses that were submitted from frontend (not admin panel)
    const filter: any = { 
      status: 'pending',
      $and: [
        { source: { $ne: 'admin' } },
        { createdBy: { $exists: false } }
      ]
    };
    
    const businesses = await models.businesses
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    const total = await models.businesses.countDocuments(filter);
    
    // Build CDN URLs for logos
    const enrichedBusinesses = businesses.map((business: any) => ({
      ...business,
      logoUrl: business.logoUrl || buildCdnUrl(business.logoPublicId)
    }));
    
    res.json({
      ok: true,
      businesses: enrichedBusinesses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err: any) {
    logger.error('Error fetching pending businesses:', err);
    res.status(500).json({ ok: false, error: getSafeErrorMessage(err, 'Failed to fetch pending businesses.') });
  }
});

// Lean projection for list endpoints (homepage carousel, featured)
const LIST_PROJECTION = { name: 1, slug: 1, category: 1, city: 1, logoUrl: 1, logoPublicId: 1, featuredAt: 1, createdAt: 1 };

// GET /api/business/featured - Featured approved businesses for homepage sections
router.get('/featured', async (req, res) => {
  try {
    const models = await getModels();
    const limit = Math.min(parseInt(req.query.limit as string) || 8, 48);

    const businesses = await models.businesses
      .find({ status: 'approved', featured: true }, { projection: LIST_PROJECTION })
      .sort({ featuredAt: -1, createdAt: -1 })
      .limit(limit)
      .toArray();

    const enriched = businesses.map((b: any) => ({
      ...b,
      logoUrl: b.logoUrl || buildCdnUrl(b.logoPublicId),
    }));

    res.set('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.json({ ok: true, businesses: enriched });
  } catch (err: any) {
    logger.error('Error fetching featured businesses:', err);
    res.status(500).json({ ok: false, error: getSafeErrorMessage(err, 'Failed to fetch featured businesses.') });
  }
});

// GET /api/business/recent - Recent approved businesses for homepage (Our Top Listings carousel)
router.get('/recent', async (req, res) => {
  try {
    const models = await getModels();
    const limit = Math.min(parseInt(req.query.limit as string) || 12, 48);

    const businesses = await models.businesses
      .find({ status: 'approved' }, { projection: LIST_PROJECTION })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    const enriched = businesses.map((b: any) => ({
      ...b,
      logoUrl: b.logoUrl || buildCdnUrl(b.logoPublicId),
    }));

    res.set('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.json({ ok: true, businesses: enriched });
  } catch (err: any) {
    logger.error('Error fetching recent businesses:', err);
    res.status(500).json({ ok: false, error: getSafeErrorMessage(err, 'Failed to fetch recent businesses.') });
  }
});

// GET /api/business/nearby - Location-based search (only locationVerified; distance tiers 0-2, 2-5, 5-10 km)
router.get('/nearby', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ ok: false, error: 'Valid lat and lng are required' });
    }
    const models = await getModels();
    const limit = Math.min(parseInt(req.query.limit as string) || 24, 60);
    const category = (req.query.category as string)?.trim();
    const q = (req.query.q as string)?.trim();
    const maxDistanceMeters = 10000;

    const geoQuery: any = {
      status: 'approved',
      locationVerified: true,
      location: { $exists: true, $ne: null },
    };
    if (category) {
      const slugForm = category.replace(/\s+/g, '-').replace(/&/g, '-');
      const nameForm = category.replace(/-/g, ' ');
      const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      geoQuery.$or = [
        { category: new RegExp(`^${escape(slugForm)}$`, 'i') },
        { category: new RegExp(`^${escape(nameForm)}$`, 'i') },
      ];
    }
    if (q) {
      const searchRegex = new RegExp(q, 'i');
      geoQuery.$and = geoQuery.$and || [];
      geoQuery.$and.push({
        $or: [
          { name: searchRegex },
          { category: searchRegex },
          { subCategory: searchRegex },
          { subcategory: searchRegex },
          { description: searchRegex },
        ],
      });
    }

    const pipeline: any[] = [
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [lng, lat] },
          distanceField: 'distance',
          maxDistance: maxDistanceMeters,
          spherical: true,
          query: geoQuery,
        },
      },
      {
        $addFields: {
          distanceKm: { $round: [{ $divide: ['$distance', 1000] }, 2] },
        },
      },
      {
        $sort: {
          distance: 1,
          featured: -1,
          ratingAvg: -1,
          createdAt: -1,
        },
      },
      { $limit: limit },
    ];

    const businesses = await models.businesses.aggregate(pipeline).toArray();
    const enriched = businesses.map((b: any) => ({
      ...b,
      id: b._id?.toString?.(),
      distanceKm: b.distanceKm,
      logoUrl: b.logoUrl || buildCdnUrl(b.logoPublicId),
    }));

    res.set('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    res.json({ ok: true, businesses: enriched });
  } catch (err: any) {
    logger.error('Error fetching nearby businesses:', err);
    res.status(500).json({ ok: false, error: getSafeErrorMessage(err, 'Failed to fetch nearby businesses.') });
  }
});

// GET /api/business - List businesses with pagination
router.get('/', async (req, res) => {
  try {
    const models = await getModels();
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;
    
    const filter: any = { status: 'approved' };
    
    // Optional filters - match both slug and name so all categories/subcategories work
    let categoryCondition: any = null;
    if (req.query.category) {
      const categoryQuery = (req.query.category as string).trim();
      const slugForm = categoryQuery.replace(/\s+/g, '-').replace(/&/g, '-');
      const nameForm = categoryQuery.replace(/-/g, ' ');
      const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      categoryCondition = {
        $or: [
          { category: new RegExp(`^${escape(slugForm)}$`, 'i') },
          { category: new RegExp(`^${escape(nameForm)}$`, 'i') }
        ]
      };
    }
    let subCategoryFilter: any = null;
    if (req.query.subCategory || req.query.subcategory) {
      const subCategoryQuery = (req.query.subCategory || req.query.subcategory) as string;
      const raw = subCategoryQuery.trim();
      const slugForm = raw.replace(/\s+/g, '-');
      const nameForm = raw.replace(/-/g, ' ');
      const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      subCategoryFilter = {
        $or: [
          { subCategory: new RegExp(`^${escape(slugForm)}$`, 'i') },
          { subCategory: new RegExp(`^${escape(nameForm)}$`, 'i') },
          { subcategory: new RegExp(`^${escape(slugForm)}$`, 'i') },
          { subcategory: new RegExp(`^${escape(nameForm)}$`, 'i') }
        ]
      };
    }
    if (req.query.city) {
      const cityQuery = req.query.city as string;
      const cityRegex = new RegExp(`^${cityQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
      filter.city = cityRegex;
    }
    if (req.query.area) {
      const areaQuery = (req.query.area as string).trim();
      const areaRegex = new RegExp(`^${areaQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
      filter.area = areaRegex;
    }
    // Build AND list so category + subcategory both apply without overwriting each other
    const andParts: any[] = [];
    if (categoryCondition) andParts.push(categoryCondition);
    if (subCategoryFilter) andParts.push(subCategoryFilter);
    if (andParts.length > 0) filter.$and = andParts;

    let businesses;
    let total;
    
    if (req.query.q) {
      const rawQ = (req.query.q as string)?.trim() ?? '';
      const searchTerm = safeSearchQuery(rawQ);
      if (!searchTerm) {
        businesses = await models.businesses.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray();
        total = await models.businesses.countDocuments(filter);
      } else {
        const searchRegex = new RegExp(searchTerm, 'i');
        const searchOrConditions = [
          { name: searchRegex },
          { category: searchRegex },
          { subcategory: searchRegex },
          { subCategory: searchRegex },
          { description: searchRegex }
        ];
        const searchFilter: any = { ...filter };
        searchFilter.$and = [ ...(searchFilter.$and || []), { $or: searchOrConditions } ];
        businesses = await models.businesses.aggregate([
          { $match: searchFilter },
          {
            $addFields: {
              searchScore: {
                $add: [
                  { $cond: [{ $regexMatch: { input: "$category", regex: `^${searchTerm}$`, options: "i" } }, 100, 0] },
                  { $cond: [{ $regexMatch: { input: "$category", regex: searchTerm, options: "i" } }, 50, 0] },
                  { $cond: [{ $regexMatch: { input: "$subcategory", regex: searchTerm, options: "i" } }, 40, 0] },
                  { $cond: [{ $regexMatch: { input: "$name", regex: `^${searchTerm}`, options: "i" } }, 30, 0] },
                  { $cond: [{ $regexMatch: { input: "$name", regex: searchTerm, options: "i" } }, 20, 0] },
                  { $cond: [{ $regexMatch: { input: "$description", regex: searchTerm, options: "i" } }, 5, 0] }
                ]
              }
            }
          },
          { $sort: { searchScore: -1, createdAt: -1 } },
          { $skip: skip },
          { $limit: limit }
        ]).toArray();
        total = await models.businesses.countDocuments(searchFilter);
      }
    } else {
      // filter already has $and with category + subcategory when present
      businesses = await models.businesses
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();
      
      total = await models.businesses.countDocuments(filter);
    }
    
    // Build CDN URLs for logos
    const enrichedBusinesses = businesses.map((business: any) => ({
      ...business,
      logoUrl: business.logoUrl || buildCdnUrl(business.logoPublicId)
    }));

    // Cache list responses for 5 min, stale-while-revalidate 10 min (SEO & performance)
    res.set('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

    res.json({
      ok: true,
      businesses: enrichedBusinesses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err: any) {
    logger.error('Error fetching businesses:', err);
    res.status(500).json({ ok: false, error: getSafeErrorMessage(err, 'Failed to fetch businesses.') });
  }
});

// Admin: approve or reject a business
// Auth: send header "x-admin-secret" or Bearer token matching process.env.ADMIN_SECRET
router.patch('/', async (req, res) => {
  try {
    const adminSecret = process.env.ADMIN_SECRET;
    if (!adminSecret) {
      return res.status(500).json({ ok: false, error: "Missing ADMIN_SECRET" });
    }

    const bearer = req.headers.authorization || "";
    const headerSecret = req.headers['x-admin-secret'] || (bearer.startsWith("Bearer ") ? bearer.slice(7) : "");
    if (headerSecret !== adminSecret) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    const body = req.body || { id: "", status: "" };
    const id = body.id?.trim();
    const nextStatus = body.status?.trim() as "approved" | "pending" | "rejected" | undefined;
    if (!id || !nextStatus || !["approved", "pending", "rejected"].includes(nextStatus)) {
      return res.status(400).json({ ok: false, error: "id and valid status are required" });
    }

    const { ObjectId } = require("mongodb") as typeof import("mongodb");
    const models = await getModels();
    const result = await models.businesses.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: nextStatus, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ ok: false, error: "Business not found" });
    }

    // Notify Google when sitemap-relevant content changes (only on approve to avoid spam)
    if (nextStatus === "approved" && result.modifiedCount > 0) {
      pingGoogleSitemap().catch((e) => logger.error('Sitemap ping:', e));
    }

    res.json({ ok: true, modifiedCount: result.modifiedCount });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: getSafeErrorMessage(err, 'Failed to update status.') });
  }
});

// POST /api/business/check-duplicates - Check for duplicate business (name+city+category, phone, email, website, social)
router.post('/check-duplicates', async (req, res) => {
  const ip = getClientIp(req);
  const rl = rateLimit(ip, 'check-duplicates', 60);
  if (!rl.ok) {
    return res.status(429).set('Retry-After', String(rl.retryAfter ?? 60)).json({ ok: false, error: 'Too many requests' });
  }
  try {
    const body = req.body || {};
    const name = String(body.name ?? '').trim();
    const city = String(body.city ?? '').trim();
    const category = String(body.category ?? '').trim();
    const phone = String(body.phone ?? '').trim();
    const whatsapp = body.whatsapp != null ? String(body.whatsapp).trim() : undefined;
    const email = String(body.email ?? '').trim();
    const websiteUrl = body.websiteUrl != null ? String(body.websiteUrl).trim() : undefined;
    const facebookUrl = body.facebookUrl != null ? String(body.facebookUrl).trim() : undefined;
    const gmbUrl = body.gmbUrl != null ? String(body.gmbUrl).trim() : undefined;
    const youtubeUrl = body.youtubeUrl != null ? String(body.youtubeUrl).trim() : undefined;

    if (!name && !phone && !email) {
      return res.status(400).json({
        ok: false,
        error: 'At least one of name+city+category, phone, or email is required',
      });
    }

    const conflicts = await checkDuplicateBusiness({
      name: name || '',
      city: city || '',
      category: category || '',
      phone: phone || '',
      whatsapp: whatsapp || undefined,
      email: email || '',
      websiteUrl: websiteUrl || undefined,
      facebookUrl: facebookUrl || undefined,
      gmbUrl: gmbUrl || undefined,
      youtubeUrl: youtubeUrl || undefined,
    });

    const hasDuplicates = hasAnyConflict(conflicts);

    res.json({
      ok: true,
      hasDuplicates,
      conflicts,
    });
  } catch (err: any) {
    logger.error('Error checking duplicates:', err);
    res.status(500).json({
      ok: false,
      error: getSafeErrorMessage(err, 'Internal server error.'),
    });
  }
});

// POST /api/business - Create business with optional logo upload
router.post('/', upload.single('logo'), async (req, res) => {
  const ip = getClientIp(req);
  const rl = rateLimit(ip, 'business-create', 10);
  if (!rl.ok) {
    return res.status(429).set('Retry-After', String(rl.retryAfter ?? 60)).json({ ok: false, error: 'Too many submissions. Try again later.' });
  }
  try {
    const models = await getModels();

    // Text fields from req.body
    const formData = {
      name: String(req.body.name || "").trim(),
      category: String(req.body.category || "").trim(),
      subCategory: String((req.body.subcategory ?? req.body.subCategory) ?? "").trim(),
      country: String(req.body.country || "").trim(),
      province: req.body.province && String(req.body.province).trim() ? String(req.body.province).trim() : undefined,
      city: String(req.body.city || "").trim(),
      area: String(req.body.area || "").trim(),
      postalCode: String(req.body.postalCode || "").trim(),
      address: String(req.body.address || "").trim(),
      phone: String(req.body.phone || "").trim(),
      contactPerson: String(req.body.contactPerson || "").trim() || "",
      whatsapp: String(req.body.whatsapp || "").trim() || "",
      email: String(req.body.email || "").trim(),
      description: String(req.body.description || "").trim(),
      websiteUrl: String(req.body.websiteUrl || "").trim(),
      facebookUrl: String(req.body.facebookUrl || "").trim(),
      gmbUrl: String(req.body.gmbUrl || "").trim(),
      youtubeUrl: String(req.body.youtubeUrl || "").trim(),
      profileUsername: String(req.body.profileUsername || "").trim(),
      // Optional: from map confirmation (not shown to user)
      latitude: req.body.latitude != null ? parseFloat(String(req.body.latitude)) : undefined,
      longitude: req.body.longitude != null ? parseFloat(String(req.body.longitude)) : undefined,
      // Bank fields
      swiftCode: String(req.body.swiftCode || "").trim(),
      branchCode: String(req.body.branchCode || "").trim(),
      cityDialingCode: String(req.body.cityDialingCode || "").trim(),
      iban: String(req.body.iban || "").trim(),
    };

    // Normalize URL fields: if provided without scheme, prepend https://
    const ensureUrl = (val: string) => {
      if (!val) return val;
      if (/^https?:\/\//i.test(val)) return val;
      return `https://${val}`;
    };
    formData.websiteUrl = ensureUrl(formData.websiteUrl);
    formData.facebookUrl = ensureUrl(formData.facebookUrl);
    formData.gmbUrl = ensureUrl(formData.gmbUrl);
    formData.youtubeUrl = ensureUrl(formData.youtubeUrl);

    if (formData.description && formData.description.includes('Business Not Found')) {
      return res.status(400).json({ 
        ok: false, 
        error: "Invalid description content detected", 
        details: "Description field contains error messages"
      });
    }

    // Validate using Zod schema
    const validationResult = CreateBusinessSchema.safeParse(formData);
    if (!validationResult.success) {
      logger.error("Validation failed:", validationResult.error.errors);
      return res.status(400).json({ 
        ok: false, 
        error: "Validation failed", 
        details: validationResult.error.errors
      });
    }

    const validatedData = validationResult.data;
    const logo = req.file; // From Multer

    let latitude: number | undefined = formData.latitude;
    let longitude: number | undefined = formData.longitude;
    let locationVerified = false;
    if (latitude != null && longitude != null && Number.isFinite(latitude) && Number.isFinite(longitude) &&
        latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180) {
      locationVerified = true;
    } else {
      const geocodeResult = await geocodeAddress(
        validatedData.address,
        validatedData.city,
        validatedData.area ?? undefined,
        validatedData.country
      );
      if (geocodeResult) {
        latitude = geocodeResult.latitude;
        longitude = geocodeResult.longitude;
        locationVerified = true;
      }
    }

    // Server-side duplicate check (indexed; blocks duplicate submissions)
    const conflicts = await checkDuplicateBusiness({
      name: validatedData.name,
      city: validatedData.city,
      category: validatedData.category,
      phone: validatedData.phone,
      whatsapp: validatedData.whatsapp || undefined,
      email: validatedData.email,
      websiteUrl: validatedData.websiteUrl,
      facebookUrl: validatedData.facebookUrl,
      gmbUrl: validatedData.gmbUrl,
      youtubeUrl: validatedData.youtubeUrl,
    });
    if (hasAnyConflict(conflicts)) {
      return res.status(409).json({
        ok: false,
        error: 'We already have this in our directory. Please update the fields below or search the site to find your existing listing.',
        conflicts,
      });
    }

    let logoUrl: string | undefined;
    let logoPublicId: string | undefined;

    // Handle logo upload to Cloudinary
    if (logo && logo.size > 0) {
      const uploaded = await uploadToCloudinary(logo.buffer);
      if (uploaded) {
        logoUrl = uploaded.url;
        logoPublicId = uploaded.public_id;
      }
    }

    // Generate unique slug from name
    const baseSlug = String(validatedData.name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 120);
    let uniqueSlug = baseSlug || `business-${Date.now()}`;
    let attempt = 0;
    while (await models.businesses.findOne({ slug: uniqueSlug })) {
      attempt += 1;
      uniqueSlug = `${baseSlug}-${attempt}`;
    }

    const { phoneDigits, websiteNormalized } = getNormalizedForInsert(validatedData.phone, validatedData.websiteUrl);
    const now = new Date();

    const locationGeo = (latitude != null && longitude != null && Number.isFinite(latitude) && Number.isFinite(longitude))
      ? { type: 'Point' as const, coordinates: [longitude, latitude] }
      : undefined;

    // Auto-approve when duplicate validation passes — listing is visible immediately
    const businessDoc = BusinessSchema.parse({
      ...validatedData,
      slug: uniqueSlug,
      logoUrl: logoUrl || undefined,
      logoPublicId: logoPublicId || undefined,
      phoneDigits,
      websiteNormalized: websiteNormalized || undefined,
      latitude,
      longitude,
      locationVerified,
      location: locationGeo,
      status: "approved" as const,
      approvedAt: now,
      approvedBy: "auto" as const,
      createdAt: now,
    });

    const result = await models.businesses.insertOne(businessDoc);

    // Update category count
    await models.categories.updateOne(
      { slug: validatedData.category },
      { $inc: { count: 1 } }
    );

    // Non-blocking: ping Google for sitemap and send confirmation email
    pingGoogleSitemap().catch((e) => logger.error('Sitemap ping after create:', e));
    sendConfirmationEmail({
      name: businessDoc.name,
      slug: businessDoc.slug,
      category: businessDoc.category,
      city: businessDoc.city,
      address: businessDoc.address,
      phone: businessDoc.phone,
      email: businessDoc.email,
      websiteUrl: businessDoc.websiteUrl,
    }).catch((e) => logger.error('Confirmation email:', e));

    res.status(201).json({
      ok: true,
      id: result.insertedId,
      slug: uniqueSlug,
      business: { ...businessDoc, _id: result.insertedId },
    });
  } catch (err: any) {
    logger.error("Business creation error:", err);
    res.status(500).json({ 
      ok: false, 
      error: getSafeErrorMessage(err, "Internal server error.") 
    });
  }
});

// GET /api/business/:slug - Get individual business by slug OR by MongoDB _id (MUST be last)
router.get('/:slug', async (req, res) => {
  try {
    const models = await getModels();
    const param = req.params.slug;
    
    if (!param) {
      return res.status(400).json({ ok: false, error: 'Slug or id is required' });
    }

    const isObjectId = /^[a-f0-9]{24}$/i.test(param);
    let business: any = null;

    if (isObjectId) {
      const { ObjectId } = require("mongodb") as typeof import("mongodb");
      business = await models.businesses.findOne(
        { _id: new ObjectId(param), status: 'approved' }
      );
    }
    if (!business) {
      business = await models.businesses.findOne(
        { slug: param, status: 'approved' }
      );
    }
    
    if (!business) {
      return res.status(404).json({ ok: false, error: 'Business not found' });
    }
    
    // Build CDN URL for logo; include id for frontend
    const enrichedBusiness = {
      ...business,
      id: business._id ? String(business._id) : undefined,
      logoUrl: business.logoUrl || buildCdnUrl(business.logoPublicId)
    };
    
    res.set('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.json({ ok: true, business: enrichedBusiness });
  } catch (err: any) {
    logger.error('Error fetching business:', err?.message, req.params.slug);
    res.status(500).json({ 
      ok: false, 
      error: getSafeErrorMessage(err, 'Failed to fetch business. Please try again later.')
    });
  }
});

export default router;