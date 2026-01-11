import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { dealerSales } from '@/src/db/schema';
import { eq, and } from 'drizzle-orm';

// Satış ödemesi al
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; saleId: string }> }
) {
  try {
    const { id, saleId } = await params;
    const dealerId = parseInt(id);
    const saleIdNum = parseInt(saleId);

    if (isNaN(dealerId) || isNaN(saleIdNum)) {
      return NextResponse.json(
        { error: 'Geçersiz bayi veya satış ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { amount, paymentMethod } = body;

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return NextResponse.json(
        { error: 'Geçerli bir ödeme tutarı giriniz' },
        { status: 400 }
      );
    }

    if (!paymentMethod || !['NAKIT', 'KREDI_KARTI', 'CEK'].includes(paymentMethod)) {
      return NextResponse.json(
        { error: 'Geçerli bir ödeme yöntemi seçiniz' },
        { status: 400 }
      );
    }

    // Satışı getir
    const [sale] = await db
      .select()
      .from(dealerSales)
      .where(
        and(
          eq(dealerSales.id, saleIdNum),
          eq(dealerSales.dealerId, dealerId)
        )
      )
      .limit(1);

    if (!sale) {
      return NextResponse.json(
        { error: 'Satış bulunamadı' },
        { status: 404 }
      );
    }

    const totalAmount = parseFloat(sale.total || '0');
    const newPaidAmount = parseFloat(amount);
    // Mevcut ödenen tutarı al (varsa)
    const currentPaidAmount = parseFloat(sale.paidAmount || '0');
    // Toplam ödenen tutar
    const totalPaidAmount = currentPaidAmount + newPaidAmount;
    const isFullyPaid = totalPaidAmount >= totalAmount;

    // Satışı güncelle
    const [updatedSale] = await db
      .update(dealerSales)
      .set({
        paymentMethod,
        isPaid: isFullyPaid,
        paidAmount: Math.min(totalPaidAmount, totalAmount).toFixed(2), // Toplam tutarı geçmesin
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(dealerSales.id, saleIdNum))
      .returning();

    if (!updatedSale) {
      throw new Error('Satış güncellenemedi');
    }

    const finalPaidAmount = Math.min(totalPaidAmount, totalAmount);
    const remainingAmount = Math.max(0, totalAmount - finalPaidAmount);

    return NextResponse.json({
      success: true,
      sale: updatedSale,
      isFullyPaid,
      remainingAmount: remainingAmount,
      paidAmount: finalPaidAmount,
    });
  } catch (error: any) {
    console.error('Error processing payment:', error);
    return NextResponse.json(
      { error: 'Ödeme işlenirken hata oluştu', details: error?.message || 'Bilinmeyen hata' },
      { status: 500 }
    );
  }
}
