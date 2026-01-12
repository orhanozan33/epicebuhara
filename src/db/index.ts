// Drizzle ORM Database Connection
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Only load dotenv in development
if (process.env.NODE_ENV !== 'production') {
  try {
    const dotenv = require('dotenv');
    dotenv.config({ path: '.env' });
  } catch (e) {
    // dotenv is optional
  }
}

function getDatabaseUrl(): string {
  let url = '';
  // Öncelik sırası: DATABASE_URL > POSTGRES_URL > DB_* variables
  if (process.env.DATABASE_URL) {
    url = process.env.DATABASE_URL;
  } else if (process.env.POSTGRES_URL) {
    url = process.env.POSTGRES_URL;
  } else if (process.env.DB_HOST && process.env.DB_NAME) {
    const user = process.env.DB_USER || 'postgres';
    const password = process.env.DB_PASSWORD || '';
    const host = process.env.DB_HOST;
    const port = process.env.DB_PORT || '5432';
    const database = process.env.DB_NAME;
    url = `postgresql://${user}:${password}@${host}:${port}/${database}`;
  } else {
    console.error('❌ Database connection error: No DATABASE_URL, POSTGRES_URL, or DB_* variables found');
    return '';
  }
  
  // Supabase Pooler için SSL parametrelerini ekle
  if (url.includes('pooler.supabase.com') || url.includes('supabase.co')) {
    const separator = url.includes('?') ? '&' : '?';
    if (!url.includes('sslmode=')) {
      url += `${separator}sslmode=require`;
    }
    // pgbouncer=true sadece Transaction Pooler (port 6543) için
    // Session Pooler (port 5432) için pgbouncer=true eklemeyin!
    if (url.includes(':6543') && !url.includes('pgbouncer=')) {
      url += `&pgbouncer=true`;
    }
  }
  
  return url;
}

// Lazy initialization - connection'ı ilk kullanımda oluştur
let client: ReturnType<typeof postgres> | null = null;
let dbInstance: ReturnType<typeof drizzle> | null = null;

function initializeDb() {
  if (dbInstance) {
    return dbInstance;
  }

  const connectionString = getDatabaseUrl();
  
  if (!connectionString) {
    const error = new Error('DATABASE_URL, POSTGRES_URL, or DB_* environment variables are required');
    console.error('❌ Database connection error:', error.message);
    console.error('Available env vars:', {
      hasDATABASE_URL: !!process.env.DATABASE_URL,
      hasPOSTGRES_URL: !!process.env.POSTGRES_URL,
      hasDB_HOST: !!process.env.DB_HOST,
      hasDB_NAME: !!process.env.DB_NAME,
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
    });
    throw error;
  }

  try {
    const isPooler = connectionString.includes('pooler.supabase.com') || connectionString.includes(':6543');
    
    client = postgres(connectionString, {
      max: 1, // Supabase ücretsiz planında sınırlı bağlantı var, tek bağlantı kullan
      idle_timeout: 20, // 20 saniye idle kalırsa bağlantıyı kapat
      connect_timeout: 10,
      ssl: connectionString.includes('supabase.co') || connectionString.includes('pooler.supabase.com') ? 'require' : (process.env.NODE_ENV === 'production' ? 'require' : undefined),
      // Transaction pooler için özel ayarlar
      prepare: !isPooler, // Transaction pooler ile prepared statements kullanmayın
      onnotice: () => {},
      transform: {
        undefined: null,
      },
    });
    
    // Drizzle configuration - Transaction pooler için optimize edilmiş
    dbInstance = drizzle(client, { 
      schema,
      // Transaction pooler ile daha iyi uyumluluk için
      logger: process.env.NODE_ENV === 'development',
    });
    console.log('✅ Database connection initialized', { isPooler, prepare: !isPooler });
  } catch (error: any) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Error code:', error.code);
    console.error('Error name:', error.name);
    console.error('Error stack:', error.stack);
    console.error('Connection string (masked):', connectionString.replace(/:[^:@]+@/, ':****@'));
    throw error;
  }
  
  return dbInstance;
}

// Export db - lazy initialization with getter
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    const db = initializeDb();
    const value = db[prop as keyof ReturnType<typeof drizzle>];
    if (typeof value === 'function') {
      return value.bind(db);
    }
    return value;
  }
});

export { schema };
