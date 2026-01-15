import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { dealerSales } from '@/src/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// Tek faturayı sil
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ saleId: string }> }
) {
  try {
    const { saleId: saleIdParam } = await params;
    const id = parseInt(saleIdParam);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'Geçersiz fatura ID' }, { status: 400 });
    }

    // Faturayı sil (isSaved'ı false yap veya tamamen sil)
    // Şimdilik isSaved'ı false yapıyoruz, tamamen silmek isterseniz delete kullanabilirsiniz
    await db.update(dealerSales)
      .set({ isSaved: false })
      .where(eq(dealerSales.id, id));

    return NextResponse.json({ success: true, message: 'Fatura başarıyla silindi' });
  } catch (error: any) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json(
      { error: 'Fatura silinirken hata oluştu', details: error?.message },
      { status: 500 }
    );
  }
}
