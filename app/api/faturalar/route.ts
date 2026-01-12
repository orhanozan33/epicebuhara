import { NextResponse } from 'next/server';
import { getDealerSaleRepository } from '@/src/db/index.typeorm';

// Force dynamic rendering to avoid build-time circular dependency issues
export const dynamic = 'force-dynamic';

// Tüm kaydedilmiş faturaları (dealer sales) getir
export async function GET() {
  try {
    const dealerSaleRepo = await getDealerSaleRepository();
    const sales = await dealerSaleRepo
      .createQueryBuilder('sale')
      .leftJoinAndSelect('sale.dealer', 'dealer')
      .where('sale.isSaved = :isSaved', { isSaved: true })
      .orderBy('sale.createdAt', 'DESC')
      .getMany();

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
      companyName: sale.dealer?.companyName || null,
      dealerEmail: sale.dealer?.email || null,
    }));

    return NextResponse.json(formattedSales);
  } catch (error: any) {
    console.error('Error fetching invoices (TypeORM):', error);
    return NextResponse.json(
      { error: 'Faturalar getirilemedi', details: error?.message || 'Bilinmeyen hata' },
      { status: 500 }
    );
  }
}
