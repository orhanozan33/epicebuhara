import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { companySettings } from '@/src/db/schema';

// Force dynamic rendering to avoid build-time metadata issues
export const dynamic = 'force-dynamic';

// Firma bilgilerini getir
export async function GET() {
  try {
    // Tek bir kayıt varsa onu getir, yoksa boş döndür
    const settings = await db.select().from(companySettings).limit(1);

    if (settings.length === 0) {
      return NextResponse.json({
        companyName: '',
        address: '',
        phone: '',
        email: '',
        postalCode: '',
        tpsNumber: '',
        tvqNumber: '',
        instagramUrl: '',
        facebookUrl: '',
      });
    }

    return NextResponse.json(settings[0]);
  } catch (error: any) {
    console.error('Error fetching company settings (Drizzle):', error);
    return NextResponse.json(
      { error: 'Firma bilgileri getirilirken hata oluştu', details: error?.message || 'Bilinmeyen hata' },
      { status: 500 }
    );
  }
}

// Firma bilgilerini güncelle veya oluştur
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { companyName, address, phone, email, postalCode, tpsNumber, tvqNumber, instagramUrl, facebookUrl } = body;

    // Mevcut kayıt var mı kontrol et
    const existing = await db.select().from(companySettings).limit(1);

    if (existing.length > 0) {
      // Güncelle
      const updated = await db.update(companySettings)
        .set({
          companyName: companyName?.trim() || null,
          address: address?.trim() || null,
          phone: phone?.trim() || null,
          email: email?.trim() || null,
          postalCode: postalCode?.trim() || null,
          tpsNumber: tpsNumber?.trim() || null,
          tvqNumber: tvqNumber?.trim() || null,
          instagramUrl: instagramUrl?.trim() || null,
          facebookUrl: facebookUrl?.trim() || null,
          updatedAt: new Date(),
        })
        .where(eq(companySettings.id, existing[0].id))
        .returning();

      return NextResponse.json(updated[0]);
    } else {
      // Yeni oluştur
      const created = await db.insert(companySettings).values({
        companyName: companyName?.trim() || null,
        address: address?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        postalCode: postalCode?.trim() || null,
        tpsNumber: tpsNumber?.trim() || null,
        tvqNumber: tvqNumber?.trim() || null,
        instagramUrl: instagramUrl?.trim() || null,
        facebookUrl: facebookUrl?.trim() || null,
      }).returning();

      return NextResponse.json(created[0]);
    }
  } catch (error: any) {
    console.error('Error updating company settings (Drizzle):', error);
    return NextResponse.json(
      { error: 'Firma bilgileri güncellenirken hata oluştu', details: error?.message || 'Bilinmeyen hata' },
      { status: 500 }
    );
  }
}
