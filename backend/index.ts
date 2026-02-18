import path from 'path';
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { logger } from './lib/logger';
import { globalRateLimit, getClientIp } from './lib/rate-limit';

// Load .env from backend directory so SMTP works when run from repo root or backend/
dotenv.config();
dotenv.config({ path: path.join(__dirname, '.env') });
import areasRouter from './routes/areas';
import businessRouter from './routes/business';
import categoriesRouter from './routes/categories';
import citiesRouter from './routes/cities';
import dbHealthRouter from './routes/db-health';
import profileRouter from './routes/profile';
import provincesRouter from './routes/provinces';
import reviewsRouter from './routes/reviews';
import searchRouter from './routes/search';
import geocodeRouter from './routes/geocode';
import sitemapApiRouter from './routes/sitemap-api';
import businessRelatedRouter from './routes/business-related';
import adminRouter from './routes/admin';
import debugRouter from './routes/debug';

const isProd = process.env.NODE_ENV === 'production';
logger.log('MongoDB configured:', process.env.MONGODB_URI ? 'yes' : 'no');
logger.log('Database:', process.env.MONGODB_DB || 'not set');

const leopardBase = process.env.LEOPARDS_API_BASE_URL || process.env.COURIER_API_BASE_URL;
const leopardApiKey = process.env.LEOPARDS_API_KEY || process.env.COURIER_API_KEY;
const leopardUsername = process.env.LEOPARDS_API_USERNAME || process.env.COURIER_API_USERNAME;
const leopardPassword = process.env.LEOPARDS_API_PASSWORD || process.env.COURIER_API_PASSWORD;
if (!isProd) {
  logger.log('Leopard API: Base', leopardBase ? 'set' : 'not set', '| Key/User', (leopardApiKey || leopardUsername) ? 'set' : 'not set');
}

const smtpHost = process.env.SMTP_HOST;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpOk = !!(smtpHost && smtpUser && smtpPass);
logger.log('Email (SMTP):', smtpOk ? 'configured' : 'not configured (set SMTP_HOST, SMTP_USER, SMTP_PASS in backend/.env or Railway backend variables)');

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.FRONTEND_URL || 'http://localhost:3000',
];
if (process.env.NEXT_PUBLIC_SITE_URL) allowedOrigins.push(process.env.NEXT_PUBLIC_SITE_URL);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  methods: ['GET', 'HEAD', 'OPTIONS', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-secret'],
}));
app.use(express.json({ limit: '512kb' }));
app.use(express.urlencoded({ extended: true, limit: '512kb' }));

// Security response headers for all API responses
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
  next();
});

// Global rate limiting (per-IP) to prevent abuse
app.use((req, res, next) => {
  const ip = getClientIp(req);
  const rl = globalRateLimit(ip);
  if (!rl.ok) {
    res.setHeader('Retry-After', String(rl.retryAfter ?? 60));
    return res.status(429).json({ ok: false, error: 'Too many requests. Please try again later.' });
  }
  next();
});

app.use('/api/areas', areasRouter);
app.use('/api/business', businessRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/cities', citiesRouter);
app.use('/api/db-health', dbHealthRouter);
app.use('/api/profile', profileRouter);
app.use('/api/provinces', provincesRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/search', searchRouter);
app.use('/api/geocode', geocodeRouter);
app.use('/api/sitemap', sitemapApiRouter);
app.use('/api/business/related', businessRelatedRouter);
app.use('/api/admin', adminRouter);
if (!isProd) app.use('/api/debug', debugRouter);

// Root route
app.get('/', (req, res) => {
  res.json({ ok: true, message: 'BizBranches API Server', timestamp: new Date().toISOString() });
});

// Simple ping (no MongoDB needed) - use to verify backend is running
app.get('/api/ping', (req, res) => {
  res.json({ ok: true, message: 'pong', timestamp: new Date().toISOString() });
});

app.listen(PORT, HOST, async () => {
  logger.log(`Server running at http://${HOST}:${PORT}`);
  try {
    const { getModels } = await import('./lib/models');
    const models = await getModels();
    await models.initializeDefaultData();
  } catch (error) {
    logger.error('Failed to initialize default data:', error);
  }
});
