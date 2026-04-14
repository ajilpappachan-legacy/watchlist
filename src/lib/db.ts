import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '@/db/schema';
import path from 'path';
import fs from 'fs';

const DB_PATH =
  process.env.DATABASE_PATH ?? path.join(process.cwd(), 'data/watchlist.db');

// Ensure the data directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Singleton pattern — prevents multiple connections during Next.js HMR
const globalForDb = global as unknown as {
  db?: ReturnType<typeof drizzle>;
};

if (!globalForDb.db) {
  const sqlite = new Database(DB_PATH);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  // Auto-create table if it doesn't exist
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS watchlist_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tmdb_id INTEGER NOT NULL,
      media_type TEXT NOT NULL CHECK(media_type IN ('movie', 'tv')),
      title TEXT NOT NULL,
      poster_path TEXT,
      overview TEXT,
      rating REAL,
      genres TEXT,
      year TEXT,
      status TEXT NOT NULL DEFAULT 'plan_to_watch' CHECK(status IN ('plan_to_watch', 'watching', 'watched')),
      sort_order INTEGER,
      added_at INTEGER,
      watched_at INTEGER,
      UNIQUE(tmdb_id, media_type)
    )
  `);

  // Migrate existing databases that predate the sort_order column
  try {
    sqlite.exec('ALTER TABLE watchlist_items ADD COLUMN sort_order INTEGER');
  } catch {
    // Column already exists — safe to ignore
  }

  globalForDb.db = drizzle(sqlite, { schema });
}

export const db = globalForDb.db;
