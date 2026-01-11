import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { dealerSales } from '@/src/db/schema';
import { eq } from 'drizzle-orm';

// Faturayı kaydet (isSaved = true yap)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ saleId: string }> }
) {
  try {
    const { saleId } = await params;
    const saleIdNum = parseInt(saleId);

    if (isNaN(saleIdNum)) {
      return NextResponse.json(
        { error: 'Geçersiz fatura ID' },
        { status: 400 }
      );
    }

    // Faturayı kaydet
    await db
      .update(dealerSales)
      .set({
        isSaved: true,
        updatedAt: new Date(),
      })
      .where(eq(dealerSales.id, saleIdNum));

    return NextResponse.json({ success: true, message: 'Fatura kaydedildi' });
  } catch (error: any) {
    console.error('Error saving invoice:', error);
    return NextResponse.json(
      { error: 'Fatura kaydedilemedi', details: error?.message || 'Bilinmeyen hata' },
      { status: 500 }
    );
  }
}
