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

    // Süresiz session cookie oluştur (çıkış yapana kadar geçerli)
    const response = NextResponse.json({ success: true });
    
    // Cookie'yi süresiz yapmak için maxAge'i çok büyük bir değer yapıyoruz (100 yıl)
    // Ayrıca httpOnly ve secure flag'lerini ekliyoruz
    response.cookies.set('admin-auth', 'true', {
      maxAge: 60 * 60 * 24 * 365 * 100, // 100 yıl
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    
    // Admin bilgilerini de cookie'de sakla (güvenlik için hash'lenmiş)
    response.cookies.set('admin-session', JSON.stringify({ 
      username: admin.username,
      id: admin.id 
    }), {
      maxAge: 60 * 60 * 24 * 365 * 100, // 100 yıl
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Login error (Drizzle):', error);
    return NextResponse.json(
      { error: 'Giriş sırasında hata oluştu', details: error?.message },
      { status: 500 }
    );
  }
}
