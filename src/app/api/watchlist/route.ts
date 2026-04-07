import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { watchlistItems } from '@/db/schema';
import type { WatchStatus } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get('status') as WatchStatus | null;

  try {
    const query = db
      .select()
      .from(watchlistItems)
      .orderBy(desc(watchlistItems.addedAt));

    const rows = status
      ? await query.where(eq(watchlistItems.status, status))
      : await query;

    const items = rows.map((r) => ({
      ...r,
      genres: r.genres ? (JSON.parse(r.genres) as string[]) : [],
    }));

    return NextResponse.json({ items });
  } catch (err) {
    console.error('Watchlist GET error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch watchlist' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tmdbId, mediaType, title, posterPath, overview, rating, genres, year, status } =
      body;

    if (!tmdbId || !mediaType || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: tmdbId, mediaType, title' },
        { status: 400 }
      );
    }

    const existing = await db
      .select({ id: watchlistItems.id })
      .from(watchlistItems)
      .where(eq(watchlistItems.tmdbId, tmdbId))
      .limit(1);

    // Check same mediaType too
    const dup = existing.length > 0;
    if (dup) {
      return NextResponse.json(
        { error: 'Item already in watchlist' },
        { status: 409 }
      );
    }

    const inserted = await db
      .insert(watchlistItems)
      .values({
        tmdbId,
        mediaType,
        title,
        posterPath: posterPath ?? null,
        overview: overview ?? null,
        rating: rating ?? null,
        genres: genres ? JSON.stringify(genres) : null,
        year: year ?? null,
        status: status ?? 'plan_to_watch',
        addedAt: new Date(),
      })
      .returning();

    const item = {
      ...inserted[0],
      genres: inserted[0].genres
        ? (JSON.parse(inserted[0].genres) as string[])
        : [],
    };

    return NextResponse.json({ item }, { status: 201 });
  } catch (err) {
    console.error('Watchlist POST error:', err);
    return NextResponse.json(
      { error: 'Failed to add item to watchlist' },
      { status: 500 }
    );
  }
}
