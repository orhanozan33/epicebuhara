import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { admins } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Kullanıcı adı ve şifre gerekli' },
        { status: 400 }
      );
    }

    const adminList = await db.select()
      .from(admins)
      .where(eq(admins.username, username))
      .limit(1);

    if (adminList.length === 0) {
      return NextResponse.json(
        { error: 'Kullanıcı adı veya şifre hatalı' },
        { status: 401 }
      );
    }

    const admin = adminList[0];
    const isValid = await bcrypt.compare(password, admin.password);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Kullanıcı adı veya şifre hatalı' },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Login error (Drizzle):', error);
    return NextResponse.json(
      { error: 'Giriş sırasında hata oluştu', details: error?.message },
      { status: 500 }
    );
  }
}
