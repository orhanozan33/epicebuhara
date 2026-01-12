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
    return '';
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

const connectionString = getDatabaseUrl();

if (!connectionString) {
  throw new Error('DATABASE_URL, POSTGRES_URL, or DB_* environment variables are required');
}

const client = postgres(connectionString, {
  max: 1,
  idle_timeout: 0,
  connect_timeout: 10,
  ssl: connectionString.includes('supabase.co') || connectionString.includes('pooler.supabase.com') ? 'require' : (process.env.NODE_ENV === 'production' ? 'require' : undefined),
  onnotice: () => {},
  transform: {
    undefined: null,
  },
});

export const db = drizzle(client, { schema });
export { schema };
