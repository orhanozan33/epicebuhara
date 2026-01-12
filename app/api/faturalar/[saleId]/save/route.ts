import { NextResponse } from 'next/server';
import { getDealerSaleRepository } from '@/src/db/index.typeorm';

// Faturayı kaydet (isSaved = true yap)
export async function POST(
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

    const dealerSaleRepo = await getDealerSaleRepository();
    const sale = await dealerSaleRepo.findOne({ where: { id: saleIdNum } });

    if (!sale) {
      return NextResponse.json(
        { error: 'Fatura bulunamadı' },
        { status: 404 }
      );
    }

    sale.isSaved = true;
    await dealerSaleRepo.save(sale);

    return NextResponse.json({ success: true, message: 'Fatura kaydedildi' });
  } catch (error: any) {
    console.error('Error saving invoice (TypeORM):', error);
    return NextResponse.json(
      { error: 'Fatura kaydedilemedi', details: error?.message || 'Bilinmeyen hata' },
      { status: 500 }
    );
  }
}
