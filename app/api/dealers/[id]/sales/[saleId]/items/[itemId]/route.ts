import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { dealerSales, dealerSaleItems, products } from '@/src/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Satıştan tek kalem çıkar: kalemi sil, stok geri ekle, fatura toplamlarını güncelle.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; saleId: string; itemId: string }> }
) {
  try {
    const { id, saleId, itemId } = await params;
    const dealerId = parseInt(id);
    const saleIdNum = parseInt(saleId);
    const itemIdNum = parseInt(itemId);

    if (isNaN(dealerId) || isNaN(saleIdNum) || isNaN(itemIdNum)) {
      return NextResponse.json(
        { error: 'Geçersiz bayi, satış veya kalem ID' },
        { status: 400 }
      );
    }

    // Satışın bu bayie ait olduğunu kontrol et
    const saleRows = await db
      .select()
      .from(dealerSales)
      .where(and(
        eq(dealerSales.id, saleIdNum),
        eq(dealerSales.dealerId, dealerId)
      ))
      .limit(1);

    if (saleRows.length === 0) {
      return NextResponse.json(
        { error: 'Satış bulunamadı' },
        { status: 404 }
      );
    }

    // Kalemi getir (bu satışa ait olmalı)
    const itemRows = await db
      .select()
      .from(dealerSaleItems)
      .where(and(
        eq(dealerSaleItems.id, itemIdNum),
        eq(dealerSaleItems.saleId, saleIdNum)
      ))
      .limit(1);

    if (itemRows.length === 0) {
      return NextResponse.json(
        { error: 'Satış kalemi bulunamadı' },
        { status: 404 }
      );
    }

    const item = itemRows[0];
    const quantity = item.quantity;
    const productId = item.productId;

    // Ürün stokunu geri ekle (trackStock true ise)
    const productRows = await db
      .select({ stock: products.stock, trackStock: products.trackStock })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (productRows.length > 0 && productRows[0].trackStock) {
      const currentStock = productRows[0].stock ?? 0;
      const newStock = currentStock + quantity;
      await db
        .update(products)
        .set({ stock: newStock })
        .where(eq(products.id, productId));
    }

    // Kalemi sil
    await db
      .delete(dealerSaleItems)
      .where(eq(dealerSaleItems.id, itemIdNum));

    // Kalan kalemlerin toplamını hesapla
    const remainingItems = await db
      .select({ total: dealerSaleItems.total })
      .from(dealerSaleItems)
      .where(eq(dealerSaleItems.saleId, saleIdNum));

    const newSubtotal = remainingItems.reduce((sum, row) => sum + parseFloat(String(row.total || '0')), 0);
    const saleData = saleRows[0];
    const discount = parseFloat(String(saleData.discount || '0'));
    const newTotal = Math.max(0, newSubtotal - discount);
    const paidAmount = parseFloat(String(saleData.paidAmount || '0'));
    const isPaid = paidAmount >= newTotal && newTotal > 0;

    // Satış toplamlarını güncelle (isSaved: true korunur – fatura Faturalar'da tek kayıt olarak güncellenir)
    await db
      .update(dealerSales)
      .set({
        subtotal: newSubtotal.toFixed(2),
        total: newTotal.toFixed(2),
        isPaid,
        paidAmount: Math.min(paidAmount, newTotal).toFixed(2),
        isSaved: true,
        updatedAt: new Date(),
      })
      .where(eq(dealerSales.id, saleIdNum));

    return NextResponse.json({
      success: true,
      message: 'Ürün faturadan çıkarıldı, stok güncellendi.',
    });
  } catch (error: unknown) {
    console.error('Error removing sale item:', error);
    const message = error instanceof Error ? error.message : 'Bilinmeyen hata';
    return NextResponse.json(
      { error: 'Kalem çıkarılırken hata oluştu', details: message },
      { status: 500 }
    );
  }
}
