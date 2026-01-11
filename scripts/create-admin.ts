import { db } from '../src/db';
import { admins } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function createAdmin() {
  try {
    const existingAdmin = await db
      .select()
      .from(admins)
      .where(eq(admins.username, 'mehmet'))
      .limit(1);

    if (existingAdmin.length > 0) {
      console.log('Admin zaten mevcut');
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash('33333333', 10);

    await db.insert(admins).values({
      username: 'mehmet',
      password: hashedPassword,
      fullName: 'Mehmet Admin',
      role: 'ADMIN',
    });

    console.log('Admin başarıyla oluşturuldu');
    console.log('Kullanıcı adı: mehmet');
    console.log('Şifre: 33333333');
    process.exit(0);
  } catch (error) {
    console.error('Admin oluşturma hatası:', error);
    process.exit(1);
  }
}

createAdmin();
