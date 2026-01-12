#!/usr/bin/env tsx
/**
 * Product Images Kontrol Script'i
 * 
 * Veritabanındaki ürün resim yollarını kontrol eder ve düzeltir.
 * 
 * Kullanım:
 *   npm run check-images
 *   veya
 *   tsx scripts/check-product-images.ts
 */

import postgres from 'postgres';
import * as dotenv from 'dotenv';

// .env dosyasını yükle
dotenv.config({ path: '.env' });

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL veya POSTGRES_URL bulunamadı!');
  process.exit(1);
}

// Direct connection kullan
let directConnection = connectionString;
if (directConnection.includes('pooler.supabase.com')) {
  directConnection = directConnection.replace(/aws-0-[^.]+\.pooler\.supabase\.com/, 'db.kxnatjmutvogwoayiajw.supabase.co');
  directConnection = directConnection.replace(/[^.]+\.pooler\.supabase\.com/, 'db.kxnatjmutvogwoayiajw.supabase.co');
}
directConnection = directConnection.replace(/:6543/, ':5432');
directConnection = directConnection.replace(/&pgbouncer=true/, '');
directConnection = directConnection.replace(/\?pgbouncer=true/, '');
directConnection = directConnection.replace(/postgres\.[^:]+:/, 'postgres:');

async function checkImages() {
  const client = postgres(directConnection, {
    max: 1,
    ssl: 'require',
  });

  console.log('🔄 Ürün resimlerini kontrol ediliyor...\n');

  try {
    // Tüm ürünleri getir
    const products = await client.unsafe(`
      SELECT id, name, images
      FROM products
      WHERE images IS NOT NULL AND images != ''
      ORDER BY id
    `);

    console.log(`📊 Toplam ${products.length} ürün resmi bulundu\n`);

    const issues: any[] = [];
    const fixed: any[] = [];

    for (const product of products) {
      const images = product.images.split(',').map((img: string) => img.trim()).filter(Boolean);
      let needsUpdate = false;
      const fixedImages: string[] = [];

      for (let img of images) {
        const originalImg = img;
        
        // Eğer zaten tam URL ise, olduğu gibi bırak
        if (img.startsWith('http://') || img.startsWith('https://')) {
          fixedImages.push(img);
          continue;
        }
        
        // Eğer / ile başlıyorsa, olduğu gibi bırak
        if (img.startsWith('/')) {
          fixedImages.push(img);
          continue;
        }
        
        // Supabase Storage URL kontrolü
        if (img.includes('storage/v1/object/public')) {
          fixedImages.push(img);
          continue;
        }
        
        // Local dosya yolu - /uploads/products/ ekle
        if (!img.startsWith('/uploads/products/')) {
          img = `/uploads/products/${img}`;
          needsUpdate = true;
        }
        
        fixedImages.push(img);
      }

      if (needsUpdate) {
        const newImagesValue = fixedImages.join(',');
        await client.unsafe(
          `UPDATE products SET images = $1 WHERE id = $2`,
          [newImagesValue, product.id]
        );
        fixed.push({
          id: product.id,
          name: product.name,
          old: product.images,
          new: newImagesValue,
        });
        console.log(`✅ Düzeltildi: ${product.name} (ID: ${product.id})`);
      } else {
        console.log(`⏭️  Zaten doğru: ${product.name} (ID: ${product.id})`);
      }
    }

    await client.end();

    console.log(`\n✅ Kontrol tamamlandı!`);
    console.log(`📝 Düzeltilen: ${fixed.length} ürün`);
    
    if (fixed.length > 0) {
      console.log(`\n📋 Düzeltilen Ürünler:`);
      fixed.forEach(item => {
        console.log(`  - ${item.name} (ID: ${item.id})`);
        console.log(`    Eski: ${item.old.substring(0, 50)}...`);
        console.log(`    Yeni: ${item.new.substring(0, 50)}...`);
      });
    }

    return { fixed, issues };
  } catch (error: any) {
    console.error('❌ Hata:', error.message);
    await client.end();
    throw error;
  }
}

// Script'i çalıştır
checkImages()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script hatası:', error);
    process.exit(1);
  });
