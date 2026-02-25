import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { dealerSales, dealerSaleItems } from '@/src/db/schema';
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
    const { amount, paymentMethod, discountPercent: bodyDiscountPercent } = body;

    const amountNum = parseFloat(amount);
    const isUnpaid = paymentMethod === 'ODENMEDI';
    if (!isUnpaid && (!amount || isNaN(amountNum) || amountNum <= 0)) {
      return NextResponse.json(
        { error: 'Geçerli bir ödeme tutarı giriniz' },
        { status: 400 }
      );
    }

    if (!paymentMethod || !['NAKIT', 'KREDI_KARTI', 'CEK', 'ODENMEDI'].includes(paymentMethod)) {
      return NextResponse.json(
        { error: 'Geçerli bir ödeme yöntemi seçiniz' },
        { status: 400 }
      );
    }

    // Satışı getir
    let sale = await db.select()
      .from(dealerSales)
      .where(and(
        eq(dealerSales.id, saleIdNum),
        eq(dealerSales.dealerId, dealerId)
      ))
      .limit(1);

    if (sale.length === 0) {
      return NextResponse.json(
        { error: 'Satış bulunamadı' },
        { status: 404 }
      );
    }

    const saleData = sale[0];
    const subtotal = parseFloat(saleData.subtotal || '0');
    let totalAmount = parseFloat(saleData.total || '0');
    let currentPaidAmount = parseFloat(saleData.paidAmount || '0');

    // Opsiyonel: Ödeme alırken iskonto uygula
    if (bodyDiscountPercent != null && bodyDiscountPercent !== '') {
      const pct = Math.min(100, Math.max(0, parseFloat(String(bodyDiscountPercent)) || 0));
      const discountAmount = (subtotal * pct) / 100;
      const newTotal = Math.max(0, subtotal - discountAmount);
      // Önceden ödenen tutar yeni toplamı aşmasın
      const cappedPaid = Math.min(currentPaidAmount, newTotal);
      const isFullyPaidAfterDiscount = cappedPaid >= newTotal;

      await db.update(dealerSales)
        .set({
          discount: discountAmount.toFixed(2),
          total: newTotal.toFixed(2),
          paidAmount: cappedPaid.toFixed(2),
          isPaid: isFullyPaidAfterDiscount,
          updatedAt: new Date(),
        })
        .where(eq(dealerSales.id, saleIdNum));

      totalAmount = newTotal;
      currentPaidAmount = cappedPaid;
      // Güncel satışı kullan (aynı request içinde tekrar okumaya gerek yok, değişkenleri güncelledik)
    }

    const newPaidAmount = isUnpaid ? 0 : (parseFloat(amount) || 0);
    // Ödenmedi seçilirse ödenen tutar sıfırlanır (sadece iskonto uygulanır, borç kalır)
    const totalPaidAmount = isUnpaid ? 0 : currentPaidAmount + newPaidAmount;
    const isFullyPaid = !isUnpaid && totalPaidAmount >= totalAmount;

    const updateData = {
      paymentMethod,
      isPaid: isFullyPaid,
      paidAmount: Math.min(totalPaidAmount, totalAmount).toFixed(2),
      ...(isUnpaid ? { paidAt: null } : { paidAt: new Date() }),
      updatedAt: new Date(),
    };

    const updatedSale = await db.update(dealerSales)
      .set(updateData)
      .where(eq(dealerSales.id, saleIdNum))
      .returning();

    const finalPaidAmount = Math.min(totalPaidAmount, totalAmount);
    const remainingAmount = Math.max(0, totalAmount - finalPaidAmount);

    return NextResponse.json({
      success: true,
      sale: updatedSale[0],
      isFullyPaid,
      remainingAmount: remainingAmount,
      paidAmount: finalPaidAmount,
    });
  } catch (error: any) {
    console.error('Error processing payment (Drizzle):', error);
    return NextResponse.json(
      { error: 'Ödeme işlenirken hata oluştu', details: error?.message || 'Bilinmeyen hata' },
      { status: 500 }
    );
  }
}

// Ödemeyi iptal et (Ödenmedi yap)
export async function PATCH(
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

    const sale = await db.select()
      .from(dealerSales)
      .where(and(
        eq(dealerSales.id, saleIdNum),
        eq(dealerSales.dealerId, dealerId)
      ))
      .limit(1);

    if (sale.length === 0) {
      return NextResponse.json(
        { error: 'Satış bulunamadı' },
        { status: 404 }
      );
    }

    const updatedSale = await db.update(dealerSales)
      .set({
        isPaid: false,
        paidAmount: '0',
        paidAt: null,
        updatedAt: new Date(),
      })
      .where(eq(dealerSales.id, saleIdNum))
      .returning();

    return NextResponse.json({
      success: true,
      sale: updatedSale[0],
    });
  } catch (error: any) {
    console.error('Error cancelling payment (Drizzle):', error);
    return NextResponse.json(
      { error: 'Ödeme iptal edilirken hata oluştu', details: error?.message || 'Bilinmeyen hata' },
      { status: 500 }
    );
  }
}

// Satış sil
export async function DELETE(
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

    // Satışın bu bayie ait olduğunu kontrol et
    const sale = await db.select()
      .from(dealerSales)
      .where(and(
        eq(dealerSales.id, saleIdNum),
        eq(dealerSales.dealerId, dealerId)
      ))
      .limit(1);

    if (sale.length === 0) {
      return NextResponse.json(
        { error: 'Satış bulunamadı' },
        { status: 404 }
      );
    }

    // Önce satış öğelerini sil
    await db.delete(dealerSaleItems).where(eq(dealerSaleItems.saleId, saleIdNum));

    // Sonra satışı sil
    await db.delete(dealerSales).where(eq(dealerSales.id, saleIdNum));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting sale (Drizzle):', error);
    return NextResponse.json(
      { error: 'Satış silinirken hata oluştu', details: error?.message || 'Bilinmeyen hata' },
      { status: 500 }
    );
  }
}
