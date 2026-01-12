import { NextResponse } from 'next/server';
import { getCompanySettingsRepository } from '@/src/db/index.typeorm';

// Force dynamic rendering to avoid build-time metadata issues
export const dynamic = 'force-dynamic';

// Firma bilgilerini getir
export async function GET() {
  try {
    const settingsRepo = await getCompanySettingsRepository();
    
    // Tek bir kayıt varsa onu getir, yoksa boş döndür
    const settings = await settingsRepo.find({ take: 1 });

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
    console.error('Error fetching company settings (TypeORM):', error);
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

    const settingsRepo = await getCompanySettingsRepository();
    
    // Mevcut kayıt var mı kontrol et
    const existing = await settingsRepo.find({ take: 1 });

    if (existing.length > 0) {
      // Güncelle
      const settings = existing[0];
      settings.companyName = companyName?.trim() || null;
      settings.address = address?.trim() || null;
      settings.phone = phone?.trim() || null;
      settings.email = email?.trim() || null;
      settings.postalCode = postalCode?.trim() || null;
      settings.tpsNumber = tpsNumber?.trim() || null;
      settings.tvqNumber = tvqNumber?.trim() || null;
      settings.instagramUrl = instagramUrl?.trim() || null;
      settings.facebookUrl = facebookUrl?.trim() || null;

      const updated = await settingsRepo.save(settings);
      return NextResponse.json(updated);
    } else {
      // Yeni oluştur
      const newSettings = settingsRepo.create({
        companyName: companyName?.trim() || null,
        address: address?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        postalCode: postalCode?.trim() || null,
        tpsNumber: tpsNumber?.trim() || null,
        tvqNumber: tvqNumber?.trim() || null,
        instagramUrl: instagramUrl?.trim() || null,
        facebookUrl: facebookUrl?.trim() || null,
      });

      const created = await settingsRepo.save(newSettings);
      return NextResponse.json(created);
    }
  } catch (error: any) {
    console.error('Error updating company settings (TypeORM):', error);
    return NextResponse.json(
      { error: 'Firma bilgileri güncellenirken hata oluştu', details: error?.message || 'Bilinmeyen hata' },
      { status: 500 }
    );
  }
}