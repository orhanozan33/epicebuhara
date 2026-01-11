import postgres from 'postgres';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

const connectionString = `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || '333333'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}/postgres`;

async function createDatabase() {
  const sql = postgres(connectionString, { max: 1 });

  try {
    // Veritabanını oluştur (eğer yoksa)
    await sql`SELECT 1 FROM pg_database WHERE datname = ${process.env.DB_NAME || 'baharat'}`.then(async (result) => {
      if (result.length === 0) {
        await sql`CREATE DATABASE ${sql(process.env.DB_NAME || 'baharat')}`;
        console.log(`Veritabanı "${process.env.DB_NAME || 'baharat'}" başarıyla oluşturuldu.`);
      } else {
        console.log(`Veritabanı "${process.env.DB_NAME || 'baharat'}" zaten mevcut.`);
      }
    });
  } catch (error: any) {
    if (error.code === '3D000') {
      // Veritabanı yok, oluştur
      try {
        await sql`CREATE DATABASE ${sql(process.env.DB_NAME || 'baharat')}`;
        console.log(`Veritabanı "${process.env.DB_NAME || 'baharat'}" başarıyla oluşturuldu.`);
      } catch (createError) {
        console.error('Veritabanı oluşturma hatası:', createError);
        process.exit(1);
      }
    } else {
      console.error('Veritabanı kontrolü hatası:', error);
      process.exit(1);
    }
  } finally {
    await sql.end();
    process.exit(0);
  }
}

createDatabase();
