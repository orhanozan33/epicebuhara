#!/usr/bin/env tsx
/**
 * Database Migration Script
 * 
 * Bu script veritabanındaki kolon adlarını camelCase'den snake_case'e çevirir.
 * Sadece gerekli değişiklikleri yapar (güvenli).
 * 
 * Kullanım:
 *   npm run migrate
 *   veya
 *   tsx scripts/run-migration.ts
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

// Direct connection kullan (migration için pooler kullanmayın)
let directConnection = connectionString;
// Pooler domain'ini direct connection domain'ine çevir
if (directConnection.includes('pooler.supabase.com')) {
  // aws-0-us-east-1.pooler.supabase.com -> db.kxnatjmutvogwoayiajw.supabase.co
  directConnection = directConnection.replace(/aws-0-[^.]+\.pooler\.supabase\.com/, 'db.kxnatjmutvogwoayiajw.supabase.co');
  directConnection = directConnection.replace(/[^.]+\.pooler\.supabase\.com/, 'db.kxnatjmutvogwoayiajw.supabase.co');
}
// Port'u değiştir
directConnection = directConnection.replace(/:6543/, ':5432');
// pgbouncer parametresini kaldır
directConnection = directConnection.replace(/&pgbouncer=true/, '');
directConnection = directConnection.replace(/\?pgbouncer=true/, '');
// Username'i düzelt (postgres.kxnatjmutvogwoayiajw -> postgres)
directConnection = directConnection.replace(/postgres\.[^:]+:/, 'postgres:');

async function runMigrations() {
  const client = postgres(directConnection, {
    max: 1,
    ssl: 'require',
  });

  console.log('🔄 Migration başlatılıyor...\n');

  const migrations = [
    // Cart table
    {
      name: 'cart.sessionId -> session_id',
      check: `SELECT 1 FROM information_schema.columns WHERE table_name = 'cart' AND column_name = 'sessionId'`,
      migrate: `ALTER TABLE cart RENAME COLUMN "sessionId" TO "session_id"`,
    },
    {
      name: 'cart.productId -> product_id',
      check: `SELECT 1 FROM information_schema.columns WHERE table_name = 'cart' AND column_name = 'productId'`,
      migrate: `ALTER TABLE cart RENAME COLUMN "productId" TO "product_id"`,
    },
    {
      name: 'cart.createdAt -> created_at',
      check: `SELECT 1 FROM information_schema.columns WHERE table_name = 'cart' AND column_name = 'createdAt'`,
      migrate: `ALTER TABLE cart RENAME COLUMN "createdAt" TO "created_at"`,
    },
    {
      name: 'cart.updatedAt -> updated_at',
      check: `SELECT 1 FROM information_schema.columns WHERE table_name = 'cart' AND column_name = 'updatedAt'`,
      migrate: `ALTER TABLE cart RENAME COLUMN "updatedAt" TO "updated_at"`,
    },
    // Categories table
    {
      name: 'categories.isActive -> is_active',
      check: `SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'isActive'`,
      migrate: `ALTER TABLE categories RENAME COLUMN "isActive" TO "is_active"`,
    },
    {
      name: 'categories.createdAt -> created_at',
      check: `SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'createdAt'`,
      migrate: `ALTER TABLE categories RENAME COLUMN "createdAt" TO "created_at"`,
    },
    {
      name: 'categories.updatedAt -> updated_at',
      check: `SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'updatedAt'`,
      migrate: `ALTER TABLE categories RENAME COLUMN "updatedAt" TO "updated_at"`,
    },
    // Products table
    {
      name: 'products.baseName -> base_name',
      check: `SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'baseName'`,
      migrate: `ALTER TABLE products RENAME COLUMN "baseName" TO "base_name"`,
    },
    {
      name: 'products.categoryId -> category_id',
      check: `SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'categoryId'`,
      migrate: `ALTER TABLE products RENAME COLUMN "categoryId" TO "category_id"`,
    },
    {
      name: 'products.isActive -> is_active',
      check: `SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'isActive'`,
      migrate: `ALTER TABLE products RENAME COLUMN "isActive" TO "is_active"`,
    },
    {
      name: 'products.createdAt -> created_at',
      check: `SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'createdAt'`,
      migrate: `ALTER TABLE products RENAME COLUMN "createdAt" TO "created_at"`,
    },
    {
      name: 'products.updatedAt -> updated_at',
      check: `SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'updatedAt'`,
      migrate: `ALTER TABLE products RENAME COLUMN "updatedAt" TO "updated_at"`,
    },
    // Company Settings table
    {
      name: 'company_settings.companyName -> company_name',
      check: `SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'companyName'`,
      migrate: `ALTER TABLE company_settings RENAME COLUMN "companyName" TO "company_name"`,
    },
    {
      name: 'company_settings.postalCode -> postal_code',
      check: `SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'postalCode'`,
      migrate: `ALTER TABLE company_settings RENAME COLUMN "postalCode" TO "postal_code"`,
    },
    {
      name: 'company_settings.taxNumber -> tax_number',
      check: `SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'taxNumber'`,
      migrate: `ALTER TABLE company_settings RENAME COLUMN "taxNumber" TO "tax_number"`,
    },
    {
      name: 'company_settings.tpsNumber -> tps_number',
      check: `SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'tpsNumber'`,
      migrate: `ALTER TABLE company_settings RENAME COLUMN "tpsNumber" TO "tps_number"`,
    },
    {
      name: 'company_settings.tvqNumber -> tvq_number',
      check: `SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'tvqNumber'`,
      migrate: `ALTER TABLE company_settings RENAME COLUMN "tvqNumber" TO "tvq_number"`,
    },
    {
      name: 'company_settings.instagramUrl -> instagram_url',
      check: `SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'instagramUrl'`,
      migrate: `ALTER TABLE company_settings RENAME COLUMN "instagramUrl" TO "instagram_url"`,
    },
    {
      name: 'company_settings.facebookUrl -> facebook_url',
      check: `SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'facebookUrl'`,
      migrate: `ALTER TABLE company_settings RENAME COLUMN "facebookUrl" TO "facebook_url"`,
    },
    {
      name: 'company_settings.createdAt -> created_at',
      check: `SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'createdAt'`,
      migrate: `ALTER TABLE company_settings RENAME COLUMN "createdAt" TO "created_at"`,
    },
    {
      name: 'company_settings.updatedAt -> updated_at',
      check: `SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'updatedAt'`,
      migrate: `ALTER TABLE company_settings RENAME COLUMN "updatedAt" TO "updated_at"`,
    },
  ];

  const results: string[] = [];

  for (const migration of migrations) {
    try {
      const checkResult = await client.unsafe(migration.check);
      if (checkResult.length > 0) {
        // Kolon camelCase, migration gerekli
        await client.unsafe(migration.migrate);
        results.push(`✅ ${migration.name}`);
        console.log(`✅ ${migration.name}`);
      } else {
        results.push(`⏭️  ${migration.name} (zaten snake_case)`);
        console.log(`⏭️  ${migration.name} (zaten snake_case)`);
      }
    } catch (error: any) {
      results.push(`❌ ${migration.name}: ${error.message}`);
      console.error(`❌ ${migration.name}: ${error.message}`);
    }
  }

  await client.end();

  console.log('\n✅ Migration tamamlandı!');
  return results;
}

// Script'i çalıştır
runMigrations()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration hatası:', error);
    process.exit(1);
  });
