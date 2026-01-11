import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { dealerSales, dealers } from '@/src/db/schema';
import { desc, eq } from 'drizzle-orm';

// Tüm kaydedilmiş faturaları (dealer sales) getir
export async function GET() {
  try {
    // Sadece kaydedilmiş (isSaved = true) dealer sales'ları dealer bilgisiyle birlikte getir
    const sales = await db
      .select({
        id: dealerSales.id,
        saleNumber: dealerSales.saleNumber,
        dealerId: dealerSales.dealerId,
        paymentMethod: dealerSales.paymentMethod,
        subtotal: dealerSales.subtotal,
        discount: dealerSales.discount,
        total: dealerSales.total,
        isPaid: dealerSales.isPaid,
        paidAmount: dealerSales.paidAmount,
        paidAt: dealerSales.paidAt,
        notes: dealerSales.notes,
        isSaved: dealerSales.isSaved,
        createdAt: dealerSales.createdAt,
        updatedAt: dealerSales.updatedAt,
        companyName: dealers.companyName,
        dealerEmail: dealers.email,
      })
      .from(dealerSales)
      .leftJoin(dealers, eq(dealerSales.dealerId, dealers.id))
      .where(eq(dealerSales.isSaved, true))
      .orderBy(desc(dealerSales.createdAt));

    return NextResponse.json(sales);
  } catch (error: any) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Faturalar getirilemedi', details: error?.message || 'Bilinmeyen hata' },
      { status: 500 }
    );
  }
}
