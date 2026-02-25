import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { stockSettings } from '@/src/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const defaultThreshold = 10;

export async function GET() {
  try {
    const rows = await db.select().from(stockSettings).limit(1);
    const threshold =
      rows.length > 0 && rows[0].lowStockThresholdBoxes != null
        ? rows[0].lowStockThresholdBoxes
        : defaultThreshold;
    return NextResponse.json({ lowStockThresholdBoxes: threshold });
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e?.code === '42P01') return NextResponse.json({ lowStockThresholdBoxes: defaultThreshold });
    console.error('Stock settings GET:', err);
    return NextResponse.json(
      { error: 'Stok ayarları getirilemedi' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const raw = body.lowStockThresholdBoxes;
    const value =
      raw != null && raw !== ''
        ? Math.max(0, Math.min(9999, parseInt(String(raw), 10) || 0))
        : defaultThreshold;

    const rows = await db.select().from(stockSettings).limit(1);
    if (rows.length === 0) {
      await db.insert(stockSettings).values({
        lowStockThresholdBoxes: value,
      });
    } else {
      await db
        .update(stockSettings)
        .set({ lowStockThresholdBoxes: value, updatedAt: new Date() })
        .where(eq(stockSettings.id, rows[0].id));
    }
    return NextResponse.json({ success: true, lowStockThresholdBoxes: value });
  } catch (err: unknown) {
    console.error('Stock settings PUT:', err);
    return NextResponse.json(
      { error: 'Stok ayarları kaydedilemedi' },
      { status: 500 }
    );
  }
}
