import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

function getDatabaseUrl(): string {
  if (process.env.DB_HOST && process.env.DB_NAME) {
    return `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || '333333'}@${process.env.DB_HOST}:${process.env.DB_PORT || '5432'}/${process.env.DB_NAME}`;
  }
  return process.env.DATABASE_URL || 'postgresql://postgres:333333@localhost:5432/baharat';
}

const dbUrl = getDatabaseUrl();

if (!dbUrl) {
  throw new Error('DATABASE_URL veya DB_* environment variables bulunamadı');
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: dbUrl,
  },
});
