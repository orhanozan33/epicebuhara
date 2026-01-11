import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

function getDatabaseUrl(): string {
  if (process.env.DB_HOST && process.env.DB_NAME) {
    return `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || '333333'}@${process.env.DB_HOST}:${process.env.DB_PORT || '5432'}/${process.env.DB_NAME}`;
  }
  return process.env.DATABASE_URL || '';
}

const connectionString = getDatabaseUrl() || 'postgresql://postgres:333333@localhost:5432/baharat';

if (!connectionString) {
  console.error('Database connection string is missing!');
  throw new Error('DATABASE_URL is required');
}

const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  ssl: connectionString.includes('supabase.co') ? 'require' : (process.env.NODE_ENV === 'production' ? 'require' : undefined),
  onnotice: () => {},
  transform: {
    undefined: null,
  },
});

export const db = drizzle(client);

export function getDb() {
  return db;
}
