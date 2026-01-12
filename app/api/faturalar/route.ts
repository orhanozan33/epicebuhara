import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { dealerSales, dealers } from '@/src/db/schema';
import { desc, eq, inArray } from 'drizzle-orm';

// Force dynamic rendering to avoid build-time circular dependency issues
export const dynamic = 'force-dynamic';

// Tüm kaydedilmiş faturaları (dealer sales) getir
export async function GET() {
  try {
    const sales = await db.select()
      .from(dealerSales)
      .where(eq(dealerSales.isSaved, true))
      .orderBy(desc(dealerSales.createdAt));

    // Dealers'ı ayrı query ile getir
    const dealerIds = [...new Set(sales.map(sale => sale.dealerId))];
    const dealersList = dealerIds.length > 0 
      ? await db.select().from(dealers).where(inArray(dealers.id, dealerIds))
      : [];
    
    const dealerMap = new Map(dealersList.map((dealer) => [dealer.id, dealer]));

    // Format response
    const formattedSales = sales.map((sale) => ({
      id: sale.id,
      saleNumber: sale.saleNumber,
      dealerId: sale.dealerId,
      paymentMethod: sale.paymentMethod,
      subtotal: sale.subtotal,
      discount: sale.discount,
      total: sale.total,
      isPaid: sale.isPaid,
      paidAmount: sale.paidAmount,
      paidAt: sale.paidAt,
      notes: sale.notes,
      isSaved: sale.isSaved,
      createdAt: sale.createdAt,
      updatedAt: sale.updatedAt,
      companyName: dealerMap.get(sale.dealerId)?.companyName || null,
      dealerEmail: dealerMap.get(sale.dealerId)?.email || null,
    }));

    return NextResponse.json(formattedSales);
  } catch (error: any) {
    console.error('Error fetching invoices (Drizzle):', error);
    return NextResponse.json(
      { error: 'Faturalar getirilemedi', details: error?.message || 'Bilinmeyen hata' },
      { status: 500 }
    );
  }
}
