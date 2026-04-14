import { NextResponse } from 'next/server';
import { tmdb } from '@/lib/tmdb';

export async function GET() {
  try {
    const languages = await tmdb.getLanguages();
    return NextResponse.json({ languages }, { headers: { 'Cache-Control': 'public, max-age=86400' } });
  } catch (err) {
    console.error('Languages fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch languages' }, { status: 500 });
  }
}
