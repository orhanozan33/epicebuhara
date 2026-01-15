import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { dealerSales } from '@/src/db/schema';
import { inArray } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// Toplu fatura silme
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Geçersiz fatura ID listesi' }, { status: 400 });
    }

    const invoiceIds = ids.map(id => parseInt(id)).filter(id => !isNaN(id));

    if (invoiceIds.length === 0) {
      return NextResponse.json({ error: 'Geçerli fatura ID bulunamadı' }, { status: 400 });
    }

    // Faturaları sil (isSaved'ı false yap)
    await db.update(dealerSales)
      .set({ isSaved: false })
      .where(inArray(dealerSales.id, invoiceIds));

    return NextResponse.json({ 
      success: true, 
      message: `${invoiceIds.length} fatura başarıyla silindi`,
      deletedCount: invoiceIds.length
    });
  } catch (error: any) {
    console.error('Error bulk deleting invoices:', error);
    return NextResponse.json(
      { error: 'Faturalar silinirken hata oluştu', details: error?.message },
      { status: 500 }
    );
  }
}
