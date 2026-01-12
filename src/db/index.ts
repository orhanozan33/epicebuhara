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
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  
  if (process.env.DB_HOST && process.env.DB_NAME) {
    const user = process.env.DB_USER || 'postgres';
    const password = process.env.DB_PASSWORD || '';
    const host = process.env.DB_HOST;
    const port = process.env.DB_PORT || '5432';
    const database = process.env.DB_NAME;
    return `postgresql://${user}:${password}@${host}:${port}/${database}`;
  }
  
  return '';
}

const connectionString = getDatabaseUrl();

if (!connectionString) {
  throw new Error('DATABASE_URL or DB_* environment variables are required');
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
