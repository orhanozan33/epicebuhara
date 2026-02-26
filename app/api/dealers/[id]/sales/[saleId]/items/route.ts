import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { dealerSales, dealerSaleItems, products } from '@/src/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

/**
 * Faturaya ürün ekle: yeni kalemleri ekle, stok düş, fatura toplamlarını güncelle.
 * Body: { items: [ { productId: number, quantity: number } ] } — quantity adet cinsinden.
 */
export async function POST(
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

    const body = await request.json().catch(() => ({}));
    const items = Array.isArray(body.items) ? body.items : [];
    if (items.length === 0) {
      return NextResponse.json(
        { error: 'En az bir ürün gönderin' },
        { status: 400 }
      );
    }

    // Satışın bu bayie ait ve SAL- satışı olduğunu kontrol et
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

    const saleData = saleRows[0];
    if (!saleData.saleNumber.startsWith('SAL-')) {
      return NextResponse.json(
        { error: 'Sadece bayi satışlarına (SAL-) ürün eklenebilir' },
        { status: 400 }
      );
    }

    const productIds = items.map((i: { productId?: number }) => i?.productId).filter((id: number | undefined): id is number => typeof id === 'number' && !isNaN(id));
    if (productIds.length === 0) {
      return NextResponse.json(
        { error: 'Geçerli ürün ID bulunamadı' },
        { status: 400 }
      );
    }

    const productList = await db
      .select()
      .from(products)
      .where(inArray(products.id, productIds));

    const saleItemsToInsert: { saleId: number; productId: number; quantity: number; price: string; total: string }[] = [];
    let newItemsSubtotal = 0;

    for (const row of items) {
      const productId = typeof row.productId === 'number' ? row.productId : parseInt(String(row.productId), 10);
      const quantity = typeof row.quantity === 'number' ? row.quantity : parseInt(String(row.quantity), 10);
      if (isNaN(productId) || isNaN(quantity) || quantity < 1) continue;

      const product = productList.find(p => p.id === productId);
      if (!product) continue;

      const price = parseFloat(product.price?.toString() || '0');
      const total = price * quantity;
      newItemsSubtotal += total;

      saleItemsToInsert.push({
        saleId: saleIdNum,
        productId,
        quantity,
        price: price.toFixed(2),
        total: total.toFixed(2),
      });
    }

    if (saleItemsToInsert.length === 0) {
      return NextResponse.json(
        { error: 'Eklenebilir geçerli kalem yok' },
        { status: 400 }
      );
    }

    // Stok kutu cinsinden: mevcut kutu * packSize >= istenen adet
    for (const item of saleItemsToInsert) {
      const product = productList.find(p => p.id === item.productId);
      if (product?.trackStock) {
        const stockBoxes = product.stock ?? 0;
        const packSize = product.packSize ?? 1;
        const availableAdet = stockBoxes * packSize;
        if (availableAdet < item.quantity) {
          return NextResponse.json(
            { error: `"${product.baseName || product.name}" için yeterli stok yok (mevcut: ${stockBoxes} kutu, istenen: ${item.quantity} adet)` },
            { status: 400 }
          );
        }
      }
    }

    // Kalemleri ekle
    await db.insert(dealerSaleItems).values(
      saleItemsToInsert.map(({ saleId, productId, quantity, price, total }) => ({
        saleId,
        productId,
        quantity,
        price,
        total,
      }))
    );

    // Stok düş (kutu cinsinden)
    for (const item of saleItemsToInsert) {
      const product = productList.find(p => p.id === item.productId);
      if (product?.trackStock) {
        const packSize = product.packSize ?? 1;
        const boxesToDeduct = Math.ceil(item.quantity / packSize);
        const currentStock = product.stock ?? 0;
        const newStock = Math.max(0, currentStock - boxesToDeduct);
        await db.update(products).set({ stock: newStock }).where(eq(products.id, product.id));
      }
    }

    // Fatura toplamlarını güncelle: tüm kalemleri topla
    const allItems = await db
      .select({ total: dealerSaleItems.total })
      .from(dealerSaleItems)
      .where(eq(dealerSaleItems.saleId, saleIdNum));

    const newSubtotal = allItems.reduce((sum, row) => sum + parseFloat(String(row.total || '0')), 0);
    const discount = parseFloat(String(saleData.discount || '0'));
    const newTotal = Math.max(0, newSubtotal - discount);
    const paidAmount = parseFloat(String(saleData.paidAmount || '0'));
    const isPaid = paidAmount >= newTotal && newTotal > 0;

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
      message: 'Ürünler faturaya eklendi.',
      added: saleItemsToInsert.length,
    });
  } catch (error: unknown) {
    console.error('Error adding sale items:', error);
    const message = error instanceof Error ? error.message : 'Bilinmeyen hata';
    return NextResponse.json(
      { error: 'Faturaya ürün eklenirken hata oluştu', details: message },
      { status: 500 }
    );
  }
}
