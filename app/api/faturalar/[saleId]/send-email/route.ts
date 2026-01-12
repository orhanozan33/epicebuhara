import { NextResponse } from 'next/server';
import { getDealerSaleRepository, getDealerRepository } from '@/src/db/index.typeorm';

// Faturayı e-posta olarak gönder
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
    const sale = await dealerSaleRepo.findOne({
      where: { id: saleIdNum },
      relations: ['dealer'],
    });

    if (!sale) {
      return NextResponse.json(
        { error: 'Fatura bulunamadı' },
        { status: 404 }
      );
    }

    if (!sale.dealer || !sale.dealer.email) {
      return NextResponse.json(
        { error: 'Müşteri e-posta adresi bulunamadı' },
        { status: 404 }
      );
    }

    // Fatura sayfasının URL'sini oluştur
    const invoiceUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin-panel/dealers/${sale.dealerId}/satis/${saleIdNum}/fatura`;

    // TODO: Gerçek e-posta gönderme servisi entegre edilmeli
    console.log('Invoice email would be sent to:', sale.dealer.email);
    console.log('Invoice URL:', invoiceUrl);

    return NextResponse.json({
      success: true,
      message: 'Fatura e-posta olarak gönderildi',
      email: sale.dealer.email,
      invoiceUrl,
    });
  } catch (error: any) {
    console.error('Error sending invoice email (TypeORM):', error);
    return NextResponse.json(
      { error: 'Fatura e-posta ile gönderilemedi', details: error?.message || 'Bilinmeyen hata' },
      { status: 500 }
    );
  }
}
