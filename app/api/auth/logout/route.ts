import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Logout işlemi - cookie'leri temizle veya session'ı sonlandır
    const response = NextResponse.json({ success: true });
    
    // Admin cookie'sini temizle (eğer kullanılıyorsa)
    response.cookies.delete('admin-auth');
    response.cookies.delete('admin-session');
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Çıkış sırasında hata oluştu' },
      { status: 500 }
    );
  }
}
