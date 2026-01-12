import { NextResponse } from 'next/server';
import { getAdminRepository } from '@/src/db/index.typeorm';
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

    const adminRepo = await getAdminRepository();
    const admin = await adminRepo.findOne({ where: { username } });

    if (!admin) {
      return NextResponse.json(
        { error: 'Kullanıcı adı veya şifre hatalı' },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, admin.password);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Kullanıcı adı veya şifre hatalı' },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Login error (TypeORM):', error);
    return NextResponse.json(
      { error: 'Giriş sırasında hata oluştu', details: error?.message },
      { status: 500 }
    );
  }
}
