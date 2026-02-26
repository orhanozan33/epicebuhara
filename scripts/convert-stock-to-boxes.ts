#!/usr/bin/env tsx
/**
 * Stok dönüşümü: Mevcut adet (piece) stokları kutuya çevirir.
 * products.stock = FLOOR(stock / pack_size) — böylece stok artık "kutu" cinsinden saklanır.
 *
 * Çalıştırmadan önce: Uygulama kodunun stoku "kutu" olarak kullanacak şekilde güncellenmiş olmalı.
 *
 * Kullanım: npx tsx scripts/convert-stock-to-boxes.ts
 */

import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL veya POSTGRES_URL bulunamadı!');
  process.exit(1);
}

let directConnection = connectionString;
if (directConnection.includes('pooler.supabase.com')) {
  directConnection = directConnection.replace(/aws-0-[^.]+\.pooler\.supabase\.com/, 'db.kxnatjmutvogwoayiajw.supabase.co');
  directConnection = directConnection.replace(/[^.]+\.pooler\.supabase\.com/, 'db.kxnatjmutvogwoayiajw.supabase.co');
}
directConnection = directConnection.replace(/:6543/, ':5432');
directConnection = directConnection.replace(/&pgbouncer=true/, '');
directConnection = directConnection.replace(/\?pgbouncer=true/, '');
directConnection = directConnection.replace(/postgres\.[^:]+:/, 'postgres:');

async function run() {
  const sql = postgres(directConnection, { max: 1, ssl: 'require' });

  console.log('🔄 Adet stokları kutuya çevriliyor...\n');

  try {
    // pack_size = 0 veya NULL olanlar için 1 kullan (bölme hatası olmasın)
    await sql.unsafe(`
      UPDATE products
      SET stock = FLOOR(stock::numeric / GREATEST(COALESCE(NULLIF(pack_size, 0), 1), 1))::integer
      WHERE stock IS NOT NULL AND stock > 0
    `);
    console.log('✅ Stoklar kutuya çevrildi (stock = FLOOR(stock / pack_size)).');
  } catch (e) {
    console.error('❌ Hata:', e);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

run();
