import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { watchlistItems } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const { orderedIds } = await req.json() as { orderedIds: number[] };

    if (!Array.isArray(orderedIds) || orderedIds.some((id) => typeof id !== 'number')) {
      return NextResponse.json({ error: 'orderedIds must be an array of numbers' }, { status: 400 });
    }

    for (let i = 0; i < orderedIds.length; i++) {
      await db
        .update(watchlistItems)
        .set({ sortOrder: i })
        .where(eq(watchlistItems.id, orderedIds[i]));
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Reorder error:', err);
    return NextResponse.json({ error: 'Failed to reorder watchlist' }, { status: 500 });
  }
}
