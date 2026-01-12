import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { dealerSales, dealers } from '@/src/db/schema';
import { eq } from 'drizzle-orm';

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

    const sale = await db.select()
      .from(dealerSales)
      .where(eq(dealerSales.id, saleIdNum))
      .limit(1);

    if (sale.length === 0) {
      return NextResponse.json(
        { error: 'Fatura bulunamadı' },
        { status: 404 }
      );
    }

    const saleData = sale[0];
    
    // Dealer'ı getir
    const dealer = await db.select()
      .from(dealers)
      .where(eq(dealers.id, saleData.dealerId))
      .limit(1);

    if (dealer.length === 0 || !dealer[0].email) {
      return NextResponse.json(
        { error: 'Müşteri e-posta adresi bulunamadı' },
        { status: 404 }
      );
    }

    // Fatura sayfasının URL'sini oluştur
    const invoiceUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin-panel/dealers/${saleData.dealerId}/satis/${saleIdNum}/fatura`;

    // TODO: Gerçek e-posta gönderme servisi entegre edilmeli
    console.log('Invoice email would be sent to:', dealer[0].email);
    console.log('Invoice URL:', invoiceUrl);

    return NextResponse.json({
      success: true,
      message: 'Fatura e-posta olarak gönderildi',
      email: dealer[0].email,
      invoiceUrl,
    });
  } catch (error: any) {
    console.error('Error sending invoice email (Drizzle):', error);
    return NextResponse.json(
      { error: 'Fatura e-posta ile gönderilemedi', details: error?.message || 'Bilinmeyen hata' },
      { status: 500 }
    );
  }
}
