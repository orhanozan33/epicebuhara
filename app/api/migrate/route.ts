import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import postgres from 'postgres';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Migration'ları güvenli bir şekilde çalıştır
export async function POST(request: Request) {
  try {
    // Sadece development veya özel secret ile çalışsın
    const { secret } = await request.json().catch(() => ({}));
    const allowedSecret = process.env.MIGRATION_SECRET || 'dev-migration-secret';
    
    if (secret !== allowedSecret && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!connectionString) {
      return NextResponse.json(
        { error: 'Database connection string not found' },
        { status: 500 }
      );
    }

    // Direct connection kullan (migration için pooler kullanmayın)
    const directConnection = connectionString
      .replace(/pooler\.supabase\.com/, 'db.kxnatjmutvogwoayiajw.supabase.co')
      .replace(/:6543/, ':5432')
      .replace(/&pgbouncer=true/, '')
      .replace(/\?pgbouncer=true/, '');

    const client = postgres(directConnection, {
      max: 1,
      ssl: 'require',
    });

    const results: string[] = [];

    // Migration script'leri
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
      {
        name: 'Create hero_banner_settings if not exists',
        check: `SELECT 1 WHERE NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'hero_banner_settings')`,
        migrate: `CREATE TABLE hero_banner_settings (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255),
          subtitle TEXT,
          button_text VARCHAR(255),
          button_link VARCHAR(500),
          discount_label1 VARCHAR(255),
          discount_percent INTEGER,
          discount_label2 VARCHAR(255),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )`,
      },
    ];

    // Her migration'ı kontrol et ve gerekirse uygula
    for (const migration of migrations) {
      try {
        const checkResult = await client.unsafe(migration.check);
        if (checkResult.length > 0) {
          // Kolon camelCase, migration gerekli
          await client.unsafe(migration.migrate);
          results.push(`✅ ${migration.name}`);
        } else {
          results.push(`⏭️  ${migration.name} (zaten snake_case)`);
        }
      } catch (error: any) {
        results.push(`❌ ${migration.name}: ${error.message}`);
      }
    }

    await client.end();

    return NextResponse.json({
      success: true,
      message: 'Migration completed',
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      {
        error: 'Migration failed',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// Migration durumunu kontrol et
export async function GET() {
  try {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!connectionString) {
      return NextResponse.json(
        { error: 'Database connection string not found' },
        { status: 500 }
      );
    }

    const directConnection = connectionString
      .replace(/pooler\.supabase\.com/, 'db.kxnatjmutvogwoayiajw.supabase.co')
      .replace(/:6543/, ':5432')
      .replace(/&pgbouncer=true/, '')
      .replace(/\?pgbouncer=true/, '');

    const client = postgres(directConnection, {
      max: 1,
      ssl: 'require',
    });

    // Tüm tablolardaki kolon adlarını kontrol et
    const tables = ['cart', 'categories', 'products', 'orders', 'company_settings'];
    const status: Record<string, any> = {};

    for (const table of tables) {
      const columns = await client.unsafe(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [table]);

      status[table] = columns.map((col: any) => {
        const colName = col.column_name;
        // snake_case kontrolü: underscore içeriyor VEYA tek kelime (id, name, slug, etc.)
        const isSnakeCase = colName.includes('_') || 
                           colName === 'id' || 
                           ['name', 'slug', 'description', 'image', 'price', 'stock', 'quantity', 'unit', 'weight', 'sku', 'text', 'notes', 'type', 'title', 'message'].includes(colName);
        return {
          name: colName,
          type: col.data_type,
          isSnakeCase,
        };
      });
    }

    await client.end();

    return NextResponse.json({
      success: true,
      status,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Status check error:', error);
    return NextResponse.json(
      {
        error: 'Status check failed',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
