import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import sharp from 'sharp';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Supabase Storage kullan (Vercel için)
async function uploadToSupabaseStorage(fileBuffer: Buffer, fileName: string, contentType: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

  console.log('Supabase Storage Upload - Config Check:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseKey,
    url: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'missing',
  });

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase Storage credentials not configured. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  }

  const bucketName = 'product-images'; // Supabase Storage bucket adı

  // Supabase Storage API endpoint - Doğru format
  const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucketName}/${fileName}`;

  console.log('Uploading to:', uploadUrl.substring(0, 50) + '...');

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': contentType,
      'x-upsert': 'true', // Aynı isimde dosya varsa üzerine yaz
    },
    body: fileBuffer,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Supabase Storage Error Response:', {
      status: response.status,
      statusText: response.statusText,
      error: errorText,
    });
    throw new Error(`Supabase Storage upload failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const result = await response.json();
  console.log('Upload successful:', result);

  // Public URL'i döndür
  const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${fileName}`;
  return publicUrl;
}

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
    // Orijinal dosya uzantısını al
    const originalExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${timestamp}_${baseFileName}.${originalExt}`;

    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
    let fileUrl: string;
    let optimizedBuffer: Buffer = buffer;

    // Production (Vercel) ise Supabase Storage kullan
    if (isProduction) {
      try {
        // Sharp ile resim optimizasyonu
        let sharpInstance = sharp(buffer)
          .resize(800, 800, {
            fit: 'inside',
            withoutEnlargement: true,
          });

        if (originalExt === 'png') {
          optimizedBuffer = await sharpInstance.png({ quality: 85, compressionLevel: 6 }).toBuffer();
        } else if (originalExt === 'webp') {
          optimizedBuffer = await sharpInstance.webp({ quality: 85, effort: 4 }).toBuffer();
        } else {
          optimizedBuffer = await sharpInstance.jpeg({ quality: 85, mozjpeg: true }).toBuffer();
        }

        // Supabase Storage'a yükle
        fileUrl = await uploadToSupabaseStorage(optimizedBuffer, fileName, file.type);
      } catch (storageError: any) {
        console.error('Supabase Storage upload error:', storageError);
        return NextResponse.json(
          {
            error: 'Resim yüklenirken hata oluştu',
            details: storageError?.message || 'Supabase Storage hatası',
            code: 'STORAGE_ERROR'
          },
          { status: 500 }
        );
      }
    } else {
      // Development: Local filesystem kullan
      try {
        const uploadsDir = join(process.cwd(), 'public', 'uploads', 'products');
        if (!existsSync(uploadsDir)) {
          await mkdir(uploadsDir, { recursive: true });
        }

        const filePath = join(uploadsDir, fileName);

        try {
          let sharpInstance = sharp(buffer)
            .resize(800, 800, {
              fit: 'inside',
              withoutEnlargement: true,
            });

          if (originalExt === 'png') {
            await sharpInstance.png({ quality: 85, compressionLevel: 6 }).toFile(filePath);
          } else if (originalExt === 'webp') {
            await sharpInstance.webp({ quality: 85, effort: 4 }).toFile(filePath);
          } else {
            await sharpInstance.jpeg({ quality: 85, mozjpeg: true }).toFile(filePath);
          }
        } catch (sharpError) {
          console.error('Sharp optimization error, saving original:', sharpError);
          await writeFile(filePath, buffer);
        }

        fileUrl = `/uploads/products/${fileName}`;
      } catch (localError: any) {
        console.error('Local filesystem upload error:', localError);
        return NextResponse.json(
          {
            error: 'Resim yüklenirken hata oluştu',
            details: localError?.message || 'Local filesystem hatası',
            code: 'LOCAL_FS_ERROR'
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ url: fileUrl, fileName });
  } catch (error: any) {
    console.error('Error uploading file:', error);
    console.error('Error stack:', error?.stack);
    return NextResponse.json(
      {
        error: 'Dosya yüklenirken hata oluştu',
        details: error?.message || 'Bilinmeyen hata',
        code: error?.code || 'UNKNOWN_ERROR'
      },
      { status: 500 }
    );
  }
}
