import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import sharp from 'sharp';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 400 });
    }

    // Dosya tipi kontrolü
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Sadece resim dosyaları yüklenebilir' }, { status: 400 });
    }

    // Dosya boyutu kontrolü (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Dosya boyutu 5MB\'dan küçük olmalıdır' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Dosya adını oluştur
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const baseFileName = originalName.replace(/\.[^/.]+$/, '') || 'image';
    const fileName = `${timestamp}_${baseFileName}.webp`;

    // Uploads klasörünü oluştur
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'products');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Resmi optimize et ve kaydet
    const filePath = join(uploadsDir, fileName);
    
    try {
      // Sharp ile resim optimizasyonu
      // Resmi max 800x800 px boyutunda optimize et (aspect ratio korunarak)
      // WebP formatına çevir (daha küçük dosya boyutu, daha iyi kalite)
      await sharp(buffer)
        .resize(800, 800, {
          fit: 'inside',
          withoutEnlargement: true, // Küçük resimleri büyütme
        })
        .webp({ 
          quality: 85, // Kalite (0-100)
          effort: 4, // Sıkıştırma çabası (0-6, daha yüksek = daha iyi sıkıştırma ama daha yavaş)
        })
        .toFile(filePath);
    } catch (sharpError) {
      console.error('Sharp optimization error, saving original:', sharpError);
      // Sharp hatası durumunda orijinal resmi kaydet
      await writeFile(filePath, buffer);
    }

    // URL'i döndür
    const fileUrl = `/uploads/products/${fileName}`;

    return NextResponse.json({ url: fileUrl, fileName });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Dosya yüklenirken hata oluştu' },
      { status: 500 }
    );
  }
}
