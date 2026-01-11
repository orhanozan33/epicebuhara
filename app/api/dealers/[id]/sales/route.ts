import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { dealerSales, dealerSaleItems, dealers, products } from '@/src/db/schema';
import { eq, desc, sql, inArray } from 'drizzle-orm';

// Bayi satışlarını getir
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dealerId = parseInt(id);

    if (isNaN(dealerId)) {
      return NextResponse.json(
        { error: 'Geçersiz bayi ID' },
        { status: 400 }
      );
    }

    const sales = await db
      .select()
      .from(dealerSales)
      .where(eq(dealerSales.dealerId, dealerId))
      .orderBy(desc(dealerSales.createdAt));

    // Her satış için ürünleri getir
    const salesWithItems = await Promise.all(
      sales.map(async (sale) => {
        const items = await db
          .select({
            id: dealerSaleItems.id,
            productId: dealerSaleItems.productId,
            quantity: dealerSaleItems.quantity,
            price: dealerSaleItems.price,
            total: dealerSaleItems.total,
            productName: products.name,
            productImage: products.images,
          })
          .from(dealerSaleItems)
          .leftJoin(products, eq(dealerSaleItems.productId, products.id))
          .where(eq(dealerSaleItems.saleId, sale.id));

        return {
          ...sale,
          items,
        };
      })
    );

    return NextResponse.json(salesWithItems);
  } catch (error: any) {
    console.error('Error fetching dealer sales:', error);
    return NextResponse.json(
      { error: 'Satışlar getirilemedi', details: error?.message || 'Bilinmeyen hata' },
      { status: 500 }
    );
  }
}

// Yeni satış oluştur
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dealerId = parseInt(id);

    if (isNaN(dealerId)) {
      return NextResponse.json(
        { error: 'Geçersiz bayi ID' },
        { status: 400 }
      );
    }

    // Bayi var mı kontrol et
    const [dealer] = await db
      .select()
      .from(dealers)
      .where(eq(dealers.id, dealerId))
      .limit(1);

    if (!dealer) {
      return NextResponse.json(
        { error: 'Bayi bulunamadı' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { items, paymentMethod, notes } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'En az bir ürün seçilmelidir' },
        { status: 400 }
      );
    }

    if (!paymentMethod || !['NAKIT', 'KREDI_KARTI', 'CEK', 'ODENMEDI'].includes(paymentMethod)) {
      return NextResponse.json(
        { error: 'Geçerli bir ödeme yöntemi seçilmelidir' },
        { status: 400 }
      );
    }

    // Ürünleri ve fiyatlarını getir
    const productIds = items.map((item: any) => parseInt(item.productId)).filter((id): id is number => !isNaN(id));
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

    if (productList.length !== productIds.length) {
      return NextResponse.json(
        { error: 'Bazı ürünler bulunamadı' },
        { status: 400 }
      );
    }

    // Fiyat hesaplamaları
    let subtotal = 0;
    const saleItems = items.map((item: any) => {
      const product = productList.find((p) => p.id === parseInt(item.productId));
      if (!product) {
        throw new Error(`Ürün bulunamadı: ${item.productId}`);
      }

      const quantity = parseInt(item.quantity) || 1;
      const price = parseFloat(product.price || '0');
      const total = price * quantity;
      subtotal += total;

      return {
        productId: product.id,
        quantity,
        price: price.toFixed(2),
        total: total.toFixed(2),
      };
    });

    // İskonto hesapla
    const discountPercent = parseFloat(dealer.discount || '0');
    const discountAmount = (subtotal * discountPercent) / 100;
    const afterDiscount = Math.max(0, subtotal - discountAmount);
    
    // TPS (Quebec Sales Tax) %5
    const tpsAmount = Math.round((afterDiscount * 0.05) * 100) / 100;
    
    // TVQ (Quebec Goods and Services Tax) %9.975
    const tvqAmount = Math.round((afterDiscount * 0.09975) * 100) / 100;
    
    // Toplam (İskonto sonrası + TPS + TVQ)
    const total = Math.round((afterDiscount + tpsAmount + tvqAmount) * 100) / 100;

    // Satış numarası oluştur (SAL-000001 formatında)
    const lastSaleResult = await db
      .select()
      .from(dealerSales)
      .orderBy(desc(dealerSales.id))
      .limit(1);

    let nextNumber = 1;
    if (lastSaleResult.length > 0 && lastSaleResult[0].saleNumber) {
      const saleNum = lastSaleResult[0].saleNumber;
      const match = saleNum.match(/SAL-(\d{6})$/);
      if (match && match[1]) {
        const num = parseInt(match[1]);
        if (!isNaN(num) && num > 0) {
          nextNumber = num + 1;
        }
      } else {
        const totalCountResult = await db
          .select({ total: sql<number>`count(*)::int` })
          .from(dealerSales);
        const total = totalCountResult[0]?.total || 0;
        nextNumber = total + 1;
      }
    }

    const saleNumber = `SAL-${nextNumber.toString().padStart(6, '0')}`;

    // Satış oluştur
    const isPaid = paymentMethod !== 'ODENMEDI';
    const [newSale] = await db
      .insert(dealerSales)
      .values({
        dealerId,
        saleNumber,
        paymentMethod,
        subtotal: subtotal.toFixed(2),
        discount: discountAmount.toFixed(2),
        total: total.toFixed(2),
        isPaid,
        paidAmount: isPaid ? total.toFixed(2) : '0',
        paidAt: isPaid ? new Date() : null,
        notes: notes?.trim() || null,
      })
      .returning();

    if (!newSale) {
      throw new Error('Satış oluşturulamadı');
    }

    // Satış öğelerini oluştur
    const saleItemsToInsert = saleItems.map((item: any) => ({
      saleId: newSale.id,
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
      total: item.total,
    }));

    await db.insert(dealerSaleItems).values(saleItemsToInsert);

    // Stok güncelle (her satışta - trackStock true olan ürünler için)
    for (const item of saleItems) {
      const product = productList.find((p) => p.id === item.productId);
      if (product && product.trackStock) {
        // trackStock true ise mutlaka stok düş
        const quantityToSubtract = parseInt(item.quantity.toString());
        
        if (product.stock !== null && product.stock !== undefined) {
          // Mevcut stok varsa düş
          const currentStock = product.stock;
          const newStock = Math.max(0, currentStock - quantityToSubtract);
          await db
            .update(products)
            .set({
              stock: newStock,
              updatedAt: new Date(),
            })
            .where(eq(products.id, item.productId));
        } else {
          // Stok null/undefined ise, 0'dan başlat ve düş (negatif olabilir)
          await db
            .update(products)
            .set({
              stock: -quantityToSubtract,
              updatedAt: new Date(),
            })
            .where(eq(products.id, item.productId));
        }
      }
    }

    return NextResponse.json({
      ...newSale,
      items: saleItems,
    });
  } catch (error: any) {
    console.error('Error creating dealer sale:', error);
    return NextResponse.json(
      { error: 'Satış oluşturulamadı', details: error?.message || 'Bilinmeyen hata' },
      { status: 500 }
    );
  }
}