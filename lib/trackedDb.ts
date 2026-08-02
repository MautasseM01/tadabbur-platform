import type { AppDatabase } from './db';
import appDbJson from '../data/app-db.json';

/**
 * The local JSON database (data/app-db.json) is embedded at build time so the
 * data survives serverless runtimes where the file is not present at runtime
 * (e.g. Vercel functions only bundle statically-referenced files).
 */
export const TRACKED_DB = appDbJson as unknown as AppDatabase;