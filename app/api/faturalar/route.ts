import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { dealerSales, dealers } from '@/src/db/schema';
import { desc, eq, inArray, and, gte, lte } from 'drizzle-orm';

// Force dynamic rendering to avoid build-time circular dependency issues
export const dynamic = 'force-dynamic';

// Tüm kaydedilmiş faturaları (dealer sales) getir
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Tarih filtresi için koşulları hazırla
    const conditions = [eq(dealerSales.isSaved, true)];
    
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      conditions.push(gte(dealerSales.createdAt, start));
    }
    
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      conditions.push(lte(dealerSales.createdAt, end));
    }

    const sales = await db.select()
      .from(dealerSales)
      .where(and(...conditions))
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
