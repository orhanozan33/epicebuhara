import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { companySettings } from '@/src/db/schema';
import { eq } from 'drizzle-orm';

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
        companyNameLine2: '',
        address: '',
        phone: '',
        email: '',
        postalCode: '',
        tpsNumber: '',
        tvqNumber: '',
        tpsRate: '5.00',
        tvqRate: '9.975',
        instagramUrl: '',
        facebookUrl: '',
      });
    }

    return NextResponse.json(settings[0]);
  } catch (error: any) {
    console.error('Error fetching company settings (Drizzle):', error);
    console.error('Error stack:', error?.stack);
    console.error('Error code:', error?.code);
    console.error('Error name:', error?.name);
    console.error('Error query:', error?.query);
    console.error('Error cause:', error?.cause);
    console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    // Drizzle/postgres hataları farklı formatta olabilir
    const postgresError = error?.cause || error;
    const errorCode = postgresError?.code || error?.code;
    const errorMessage = postgresError?.message || error?.message || 'Bilinmeyen hata';
    const errorQuery = postgresError?.query || error?.query;
    
    // Daha detaylı hata mesajı
    let detailedMessage = errorMessage;
    if (errorCode === '42703') {
      detailedMessage = 'Kolon bulunamadı - Veritabanı şeması güncel değil';
    } else if (errorCode === '42P01') {
      detailedMessage = 'Tablo bulunamadı - company_settings tablosu mevcut değil';
    } else if (errorQuery) {
      detailedMessage = `Failed query: ${errorQuery}`;
    }
    
    return NextResponse.json(
      { 
        error: 'Firma bilgileri getirilirken hata oluştu', 
        details: detailedMessage,
        code: errorCode,
        query: errorQuery || 'N/A',
        message: errorMessage,
        originalError: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

// Firma bilgilerini güncelle veya oluştur
export async function PUT(request: Request) {
  let body: any = null;
  try {
    body = await request.json();
    const { companyName, companyNameLine2, address, phone, email, postalCode, tpsNumber, tvqNumber, tpsRate, tvqRate, instagramUrl, facebookUrl } = body;

    const tpsRateVal = tpsRate != null && tpsRate !== '' ? String(Math.min(100, Math.max(0, parseFloat(String(tpsRate)) || 0))) : null;
    const tvqRateVal = tvqRate != null && tvqRate !== '' ? String(Math.min(100, Math.max(0, parseFloat(String(tvqRate)) || 0))) : null;

    // Mevcut kayıt var mı kontrol et
    const existing = await db.select().from(companySettings).limit(1);

    if (existing.length > 0) {
      // Güncelle
      const updatePayload: Record<string, unknown> = {
        companyName: companyName?.trim() || null,
        companyNameLine2: companyNameLine2?.trim() || null,
        address: address?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        postalCode: postalCode?.trim() || null,
        tpsNumber: tpsNumber?.trim() || null,
        tvqNumber: tvqNumber?.trim() || null,
        instagramUrl: instagramUrl?.trim() || null,
        facebookUrl: facebookUrl?.trim() || null,
        updatedAt: new Date(),
      };
      if (tpsRateVal !== null) (updatePayload as any).tpsRate = tpsRateVal;
      if (tvqRateVal !== null) (updatePayload as any).tvqRate = tvqRateVal;

      const updated = await db.update(companySettings)
        .set(updatePayload as any)
        .where(eq(companySettings.id, existing[0].id))
        .returning();

      return NextResponse.json(updated[0]);
    } else {
      // Yeni oluştur
      const insertPayload: Record<string, unknown> = {
        companyName: companyName?.trim() || null,
        companyNameLine2: companyNameLine2?.trim() || null,
        address: address?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        postalCode: postalCode?.trim() || null,
        tpsNumber: tpsNumber?.trim() || null,
        tvqNumber: tvqNumber?.trim() || null,
        instagramUrl: instagramUrl?.trim() || null,
        facebookUrl: facebookUrl?.trim() || null,
      };
      if (tpsRateVal !== null) (insertPayload as any).tpsRate = tpsRateVal;
      if (tvqRateVal !== null) (insertPayload as any).tvqRate = tvqRateVal;

      const created = await db.insert(companySettings).values(insertPayload as any).returning();

      return NextResponse.json(created[0]);
    }
  } catch (error: any) {
    console.error('Error updating company settings (Drizzle):', error);
    console.error('Error stack:', error?.stack);
    console.error('Error code:', error?.code);
    console.error('Error name:', error?.name);
    console.error('Request body:', body);
    
    // Daha detaylı hata mesajı
    let errorMessage = error?.message || 'Bilinmeyen hata';
    if (error?.code === '42703') {
      errorMessage = 'Kolon bulunamadı - Veritabanı şeması güncel değil';
    } else if (error?.code === '42P01') {
      errorMessage = 'Tablo bulunamadı - company_settings tablosu mevcut değil';
    }
    
    return NextResponse.json(
      { 
        error: 'Firma bilgileri güncellenirken hata oluştu', 
        details: errorMessage,
        code: error?.code,
        query: error?.query || 'N/A'
      },
      { status: 500 }
    );
  }
}
