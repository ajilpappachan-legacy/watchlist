import { NextRequest, NextResponse } from 'next/server';
import { tmdb } from '@/lib/tmdb';

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q')?.trim();
  const type = req.nextUrl.searchParams.get('type') ?? 'multi';

  if (!query) {
    return NextResponse.json(
      { error: 'Missing search query' },
      { status: 400 }
    );
  }

  try {
    let results;
    if (type === 'movie') {
      results = await tmdb.searchMovies(query);
    } else if (type === 'tv') {
      results = await tmdb.searchTv(query);
    } else {
      results = await tmdb.searchMulti(query);
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
