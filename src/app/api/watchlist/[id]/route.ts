import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { watchlistItems } from '@/db/schema';
import type { WatchStatus } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const itemId = parseInt(id, 10);

  if (isNaN(itemId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { status } = body as { status: WatchStatus };

    const validStatuses: WatchStatus[] = ['plan_to_watch', 'watching', 'watched'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const existing = await db
      .select()
      .from(watchlistItems)
      .where(eq(watchlistItems.id, itemId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const watchedAt = status === 'watched' ? new Date() : null;

    const updated = await db
      .update(watchlistItems)
      .set({ status, watchedAt })
      .where(eq(watchlistItems.id, itemId))
      .returning();

    const item = {
      ...updated[0],
      genres: updated[0].genres
        ? (JSON.parse(updated[0].genres) as string[])
        : [],
    };

    return NextResponse.json({ item });
  } catch (err) {
    console.error('Watchlist PATCH error:', err);
    return NextResponse.json(
      { error: 'Failed to update item' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const itemId = parseInt(id, 10);

  if (isNaN(itemId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  try {
    await db.delete(watchlistItems).where(eq(watchlistItems.id, itemId));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Watchlist DELETE error:', err);
    return NextResponse.json(
      { error: 'Failed to delete item' },
      { status: 500 }
    );
  }
}
