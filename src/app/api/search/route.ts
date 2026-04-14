import { NextRequest, NextResponse } from 'next/server';
import { tmdb } from '@/lib/tmdb';

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q')?.trim();
  const type = req.nextUrl.searchParams.get('type') ?? 'multi';
  const language = req.nextUrl.searchParams.get('language') ?? '';
  const yearRaw = req.nextUrl.searchParams.get('year') ?? '';
  const year = /^\d{4}$/.test(yearRaw) ? yearRaw : '';

  if (!query) {
    return NextResponse.json(
      { error: 'Missing search query' },
      { status: 400 }
    );
  }

  const options = { language: language || undefined, year: year || undefined };

  try {
    let results;
    if (/^tt\d+$/i.test(query)) {
      results = await tmdb.findByImdbId(query);
    } else if (type === 'movie') {
      results = await tmdb.searchMovies(query, options);
    } else if (type === 'tv') {
      results = await tmdb.searchTv(query, options);
    } else {
      results = await tmdb.searchMulti(query, options);
    }

    return NextResponse.json({ results });
  } catch (err) {
    console.error('Search error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch search results' },
      { status: 500 }
    );
  }
}
