import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { heroBannerSettings } from '@/src/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const defaults = {
  title: null as string | null,
  subtitle: null as string | null,
  buttonText: null as string | null,
  buttonLink: null as string | null,
  discountLabel1: null as string | null,
  discountPercent: null as number | null,
  discountLabel2: null as string | null,
};

export async function GET() {
  try {
    const rows = await db.select().from(heroBannerSettings).limit(1);
    if (rows.length === 0) {
      return NextResponse.json(defaults);
    }
    const row = rows[0];
    return NextResponse.json({
      title: row.title ?? defaults.title,
      subtitle: row.subtitle ?? defaults.subtitle,
      buttonText: row.buttonText ?? defaults.buttonText,
      buttonLink: row.buttonLink ?? defaults.buttonLink,
      discountLabel1: row.discountLabel1 ?? defaults.discountLabel1,
      discountPercent: row.discountPercent ?? defaults.discountPercent,
      discountLabel2: row.discountLabel2 ?? defaults.discountLabel2,
    });
  } catch (error: unknown) {
    console.error('Error fetching hero banner settings:', error);
    const err = error as { code?: string; message?: string };
    if (err?.code === '42P01') {
      return NextResponse.json(defaults);
    }
    return NextResponse.json(
      { error: 'Hero banner ayarları getirilemedi', details: err?.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      subtitle,
      buttonText,
      buttonLink,
      discountLabel1,
      discountPercent,
      discountLabel2,
    } = body;

    const percentVal =
      discountPercent != null && discountPercent !== ''
        ? Math.min(100, Math.max(0, parseInt(String(discountPercent), 10) || 0))
        : null;

    const rows = await db.select().from(heroBannerSettings).limit(1);

    if (rows.length === 0) {
      await db.insert(heroBannerSettings).values({
        title: title?.trim() || null,
        subtitle: subtitle?.trim() || null,
        buttonText: buttonText?.trim() || null,
        buttonLink: buttonLink?.trim() || null,
        discountLabel1: discountLabel1?.trim() || null,
        discountPercent: percentVal,
        discountLabel2: discountLabel2?.trim() || null,
      });
    } else {
      await db
        .update(heroBannerSettings)
        .set({
          title: title?.trim() ?? null,
          subtitle: subtitle?.trim() ?? null,
          buttonText: buttonText?.trim() ?? null,
          buttonLink: buttonLink?.trim() ?? null,
          discountLabel1: discountLabel1?.trim() ?? null,
          discountPercent: percentVal,
          discountLabel2: discountLabel2?.trim() ?? null,
          updatedAt: new Date(),
        })
        .where(eq(heroBannerSettings.id, rows[0].id));
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error updating hero banner settings:', error);
    const err = error as { message?: string };
    return NextResponse.json(
      { error: 'Hero banner ayarları kaydedilemedi', details: err?.message },
      { status: 500 }
    );
  }
}
