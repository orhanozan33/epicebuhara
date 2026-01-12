import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

function getDatabaseUrl(): string {
  let url = '';
  if (process.env.DB_HOST && process.env.DB_NAME) {
    url = `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || '333333'}@${process.env.DB_HOST}:${process.env.DB_PORT || '5432'}/${process.env.DB_NAME}`;
  } else {
    // Supabase-Vercel entegrasyonu POSTGRES_URL ekler, ama DATABASE_URL de desteklenir
    url = process.env.DATABASE_URL || process.env.POSTGRES_URL || 'postgresql://postgres:333333@localhost:5432/baharat';
  }
  
  // Supabase Pooler için SSL ve pgbouncer parametrelerini ekle
  if (url.includes('pooler.supabase.com') || url.includes('supabase.co')) {
    const separator = url.includes('?') ? '&' : '?';
    if (!url.includes('sslmode=')) {
      url += `${separator}sslmode=require`;
    }
    if (!url.includes('pgbouncer=')) {
      url += `&pgbouncer=true`;
    }
  }
  
  return url;
}

function parseDatabaseUrl(url: string) {
  try {
    const urlObj = new URL(url);
    return {
      host: urlObj.hostname,
      port: parseInt(urlObj.port) || 5432,
      user: urlObj.username,
      password: urlObj.password,
      database: urlObj.pathname.slice(1),
      ssl: url.includes('supabase.co') || url.includes('pooler.supabase.com') ? { rejectUnauthorized: false } : false,
    };
  } catch {
    return null;
  }
}

const dbUrl = getDatabaseUrl();

if (!dbUrl) {
  throw new Error('DATABASE_URL veya DB_* environment variables bulunamadı');
}

const credentials = parseDatabaseUrl(dbUrl);

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: credentials || { url: dbUrl, ssl: dbUrl.includes('supabase.co') || dbUrl.includes('pooler.supabase.com') ? { rejectUnauthorized: false } : false },
});
