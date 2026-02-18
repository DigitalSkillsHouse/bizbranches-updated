import express from 'express';
import { getDb } from '../lib/mongodb';
import { getSafeErrorMessage } from '../lib/safe-error';

const router = express.Router();
const isProd = process.env.NODE_ENV === 'production';

router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const admin = db.admin();
    const ping = await admin.ping();

    const body: { ok: boolean; ping: unknown; serverInfo?: unknown } = {
      ok: true,
      ping,
    };
    if (!isProd) {
      body.serverInfo = await admin.serverStatus().catch(() => undefined);
    }
    res.status(200).json(body);
  } catch (err: unknown) {
    res.status(500).json({
      ok: false,
      error: getSafeErrorMessage(err, 'Database unavailable.'),
    });
  }
});

export default router;