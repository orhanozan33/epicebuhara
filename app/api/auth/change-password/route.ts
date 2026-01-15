import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { admins } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { currentPassword, newPassword, newUsername } = body;

    // En az bir değişiklik olmalı
    if (!currentPassword) {
      return NextResponse.json(
        { error: 'Mevcut şifre gerekli' },
        { status: 400 }
      );
    }

    // Yeni şifre veya kullanıcı adı belirtilmeli
    if (!newPassword && !newUsername) {
      return NextResponse.json(
        { error: 'Yeni şifre veya kullanıcı adı belirtilmelidir' },
        { status: 400 }
      );
    }

    // Yeni şifre validasyonu
    if (newPassword && newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Yeni şifre en az 6 karakter olmalıdır' },
        { status: 400 }
      );
    }

    // Tüm adminleri getir (şu an tek admin varsayıyoruz)
    const adminList = await db.select().from(admins).limit(1);

    if (adminList.length === 0) {
      return NextResponse.json(
        { error: 'Admin bulunamadı' },
        { status: 404 }
      );
    }

    const admin = adminList[0];

    // Mevcut şifreyi doğrula
    const isValid = await bcrypt.compare(currentPassword, admin.password);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Mevcut şifre hatalı' },
        { status: 401 }
      );
    }

    // Güncelleme verilerini hazırla
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Kullanıcı adı değiştirilecekse
    if (newUsername && newUsername.trim()) {
      // Kullanıcı adı zaten kullanılıyor mu kontrol et
      const existingAdmin = await db.select()
        .from(admins)
        .where(eq(admins.username, newUsername.trim()))
        .limit(1);

      if (existingAdmin.length > 0 && existingAdmin[0].id !== admin.id) {
        return NextResponse.json(
          { error: 'Bu kullanıcı adı zaten kullanılıyor' },
          { status: 400 }
        );
      }

      updateData.username = newUsername.trim();
    }

    // Şifre değiştirilecekse
    if (newPassword && newPassword.trim()) {
      const hashedPassword = await bcrypt.hash(newPassword.trim(), 10);
      updateData.password = hashedPassword;
    }

    // Admin'i güncelle
    const updatedAdmin = await db.update(admins)
      .set(updateData)
      .where(eq(admins.id, admin.id))
      .returning();

    return NextResponse.json({ 
      success: true,
      message: 'Kullanıcı adı ve/veya şifre başarıyla güncellendi'
    });
  } catch (error: any) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { error: 'Şifre değiştirilirken hata oluştu', details: error?.message },
      { status: 500 }
    );
  }
}
