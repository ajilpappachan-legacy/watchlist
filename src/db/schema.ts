import { sqliteTable, text, integer, real, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const watchlistItems = sqliteTable(
  'watchlist_items',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    tmdbId: integer('tmdb_id').notNull(),
    mediaType: text('media_type', { enum: ['movie', 'tv'] }).notNull(),
    title: text('title').notNull(),
    posterPath: text('poster_path'),
    overview: text('overview'),
    rating: real('rating'),
    genres: text('genres'), // JSON string: string[]
    year: text('year'),
    status: text('status', {
      enum: ['plan_to_watch', 'watching', 'watched'],
    })
      .notNull()
      .default('plan_to_watch'),
    addedAt: integer('added_at', { mode: 'timestamp' }).$defaultFn(
      () => new Date()
    ),
    watchedAt: integer('watched_at', { mode: 'timestamp' }),
  },
  (table) => [uniqueIndex('tmdb_media_idx').on(table.tmdbId, table.mediaType)]
);

export type WatchlistItem = typeof watchlistItems.$inferSelect;
export type NewWatchlistItem = typeof watchlistItems.$inferInsert;
export type WatchStatus = 'plan_to_watch' | 'watching' | 'watched';
export type MediaType = 'movie' | 'tv';
