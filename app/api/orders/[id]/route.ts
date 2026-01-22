import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { orders, orderItems, products, dealers, dealerSales, dealerSaleItems, notifications } from '@/src/db/schema';
import { eq, inArray, and, desc, sql } from 'drizzle-orm';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Sipariş sil
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const orderId = parseInt(idParam);

    if (isNaN(orderId)) {
      return NextResponse.json(
        { error: 'Geçersiz sipariş ID' },
        { status: 400 }
      );
    }

    // Mevcut siparişi kontrol et
    const order = await db.select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (order.length === 0) {
      return NextResponse.json(
        { error: 'Sipariş bulunamadı' },
        { status: 404 }
      );
    }

    const currentOrder = order[0];

    // Eğer sipariş SHIPPED durumundaysa, stokları geri ekle
    if (currentOrder.status === 'SHIPPED') {
      const items = await db.select()
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));

      if (items.length > 0) {
        const productIds = items
          .map(item => item.productId)
          .filter((id): id is number => id !== null && id !== undefined);

        if (productIds.length > 0) {
          const productList = await db.select()
            .from(products)
            .where(inArray(products.id, productIds));

          // Stokları geri ekle (trackStock true olan ürünler için)
          for (const item of items) {
            if (!item.productId) continue;
            const product = productList.find(p => p.id === item.productId);
            if (product && product.trackStock) {
              const quantityToAdd = parseInt(item.quantity.toString());
              const currentStock = product.stock ? parseInt(product.stock.toString()) : 0;
              const newStock = currentStock + quantityToAdd;

              await db.update(products)
                .set({ stock: newStock })
                .where(eq(products.id, product.id));
            }
          }
        }
      }
    }

    // İlgili dealerSales kayıtlarını bul ve sil
    try {
      const relatedSales = await db.select()
        .from(dealerSales)
        .where(eq(dealerSales.saleNumber, currentOrder.orderNumber));

      for (const sale of relatedSales) {
        // Önce satış öğelerini sil
        await db.delete(dealerSaleItems).where(eq(dealerSaleItems.saleId, sale.id));
        // Sonra satışı sil
        await db.delete(dealerSales).where(eq(dealerSales.id, sale.id));
      }
    } catch (dealerSaleError: any) {
      console.warn('Warning: Could not delete related dealer sales:', dealerSaleError?.message);
    }

    // Bildirimleri sil
    try {
      await db.delete(notifications).where(eq(notifications.orderId, orderId));
    } catch (notificationError: any) {
      console.warn('Warning: Could not delete notifications:', notificationError?.message);
    }

    // Önce sipariş öğelerini sil
    await db.delete(orderItems).where(eq(orderItems.orderId, orderId));

    // Sonra siparişi sil
    await db.delete(orders).where(eq(orders.id, orderId));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting order (Drizzle):', error);
    return NextResponse.json(
      { error: 'Sipariş silinirken hata oluştu', details: error?.message },
      { status: 500 }
    );
  }
}

// Sipariş durumunu güncelle
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const orderId = parseInt(idParam);

    if (isNaN(orderId)) {
      return NextResponse.json(
        { error: 'Geçersiz sipariş ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Sipariş durumu gerekli' },
        { status: 400 }
      );
    }

    // Geçerli durumlar
    const validStatuses = ['PENDING', 'PROCESSING', 'APPROVED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Geçersiz sipariş durumu' },
        { status: 400 }
      );
    }

    // Mevcut siparişi al
    const order = await db.select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (order.length === 0) {
      return NextResponse.json(
        { error: 'Sipariş bulunamadı' },
        { status: 404 }
      );
    }

    const currentOrder = order[0];
    const oldStatus = currentOrder.status;

    // Sipariş bayisini bul veya oluştur
    let orderDealer = await db.select()
      .from(dealers)
      .where(eq(dealers.companyName, 'Sipariş'))
      .limit(1);

    if (orderDealer.length === 0) {
      const newDealer = await db.insert(dealers).values({
        companyName: 'Sipariş',
        phone: null,
        email: null,
        address: null,
        taxNumber: null,
        tpsNumber: null,
        tvqNumber: null,
        discount: '0',
        isActive: true,
      }).returning();
      orderDealer = newDealer;
    }

    const dealerId = orderDealer[0].id;

    // Eğer durum CANCELLED'a çevriliyorsa ve önceki durum SHIPPED ise, stokları geri ekle
    if (status === 'CANCELLED' && oldStatus === 'SHIPPED') {
      const items = await db.select()
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));

      if (items.length > 0) {
        const productIds = items
          .map(item => item.productId)
          .filter((id): id is number => id !== null && id !== undefined);

        if (productIds.length > 0) {
          const productList = await db.select()
            .from(products)
            .where(inArray(products.id, productIds));

          // Stokları geri ekle (trackStock true olan ürünler için)
          for (const item of items) {
            if (!item.productId) continue;
            const product = productList.find(p => p.id === item.productId);
            if (product && product.trackStock) {
              const quantityToAdd = parseInt(item.quantity.toString());
              const currentStock = product.stock ? parseInt(product.stock.toString()) : 0;
              const newStock = currentStock + quantityToAdd;

              await db.update(products)
                .set({ stock: newStock })
                .where(eq(products.id, product.id));
            }
          }
        }
      }
    }

    // Eğer durum SHIPPED'a çevriliyorsa, stoktan düş ve bayi satışı oluştur
    if (status === 'SHIPPED' && oldStatus !== 'SHIPPED') {
      const items = await db.select()
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));

      if (items.length > 0) {
        const productIds = items
          .map(item => item.productId)
          .filter((id): id is number => id !== null && id !== undefined);

        if (productIds.length > 0) {
          const productList = await db.select()
            .from(products)
            .where(inArray(products.id, productIds));

          // Stok güncelle (trackStock true olan ürünler için)
          for (const item of items) {
            if (!item.productId) continue;
            const product = productList.find(p => p.id === item.productId);
            if (product && product.trackStock) {
              const quantityToSubtract = parseInt(item.quantity.toString());
              const currentStock = product.stock ? parseInt(product.stock.toString()) : 0;
              const newStock = Math.max(0, currentStock - quantityToSubtract);

              await db.update(products)
                .set({ stock: newStock })
                .where(eq(products.id, product.id));
            }
          }

          // Satış numarası olarak sipariş numarasını kullan
          const saleNumber = currentOrder.orderNumber;

          // Bu sipariş numarasıyla daha önce satış oluşturulmuş mu kontrol et
          const existingSale = await db.select()
            .from(dealerSales)
            .where(eq(dealerSales.saleNumber, saleNumber))
            .limit(1);

          // Eğer satış yoksa oluştur
          if (existingSale.length === 0) {
            // Fiyat hesaplamaları
            let subtotal = 0;
            const saleItems = items
              .filter(item => item.productId)
              .map((item) => {
                const quantity = parseInt(item.quantity.toString());
                const price = parseFloat(item.price || '0');
                const total = price * quantity;
                subtotal += total;

                return {
                  productId: item.productId!,
                  quantity,
                  price: price.toFixed(2),
                  total: total.toFixed(2),
                };
              });

            // Eğer satış öğesi yoksa, satış oluşturma
            if (saleItems.length === 0) {
              console.warn('Sipariş öğeleri bulunamadı, satış oluşturulmayacak');
            } else {
              const discountAmount = 0;
              const orderSubtotal = parseFloat(currentOrder.subtotal || '0');
              const orderTotal = parseFloat(currentOrder.total || '0');
              const finalSubtotal = Math.abs(orderSubtotal - subtotal) < 0.01 ? orderSubtotal : subtotal;
              const finalTotal = orderTotal;

              // Bayi satışı oluştur (ödendi olarak işaretle, notes boş)
              const newSale = await db.insert(dealerSales).values({
                dealerId,
                saleNumber,
                paymentMethod: 'NAKIT',
                subtotal: finalSubtotal.toFixed(2),
                discount: discountAmount.toFixed(2),
                total: finalTotal.toFixed(2),
                isPaid: true,
                paidAmount: finalTotal.toFixed(2),
                paidAt: new Date(),
                // notes alanını eklemiyoruz (nullable, default null)
              }).returning();

              const savedSale = newSale[0];

              // Satış öğelerini oluştur
              if (saleItems.length > 0) {
                await db.insert(dealerSaleItems).values(
                  saleItems.map((item) => ({
                    saleId: savedSale.id,
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.price,
                    total: item.total,
                  }))
                );
              }
            }
          }
        }
      }
    }

    // Sipariş durumunu güncelle
    const updated = await db.update(orders)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))
      .returning();

    // Eğer sipariş bayisi için önceden oluşturulmuş borçlu satışlar varsa, onları da ödenmiş yap
    // (Notes alanı boş olabilir, bu yüzden sadece dealerId ve isPaid kontrolü yapıyoruz)
    const unpaidOrderSales = await db.select()
      .from(dealerSales)
      .where(
        and(
          eq(dealerSales.dealerId, dealerId),
          eq(dealerSales.isPaid, false)
        )
      );

    if (unpaidOrderSales.length > 0) {
      for (const sale of unpaidOrderSales) {
        const total = parseFloat(sale.total || '0');
        await db.update(dealerSales)
          .set({
            paymentMethod: 'NAKIT',
            isPaid: true,
            paidAmount: total.toFixed(2),
            paidAt: new Date(),
          })
          .where(eq(dealerSales.id, sale.id));
      }
    }

    return NextResponse.json({ success: true, order: updated[0] });
  } catch (error: any) {
    console.error('Error updating order (Drizzle):', error);
    console.error('Error stack:', error?.stack);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      detail: error?.detail,
      constraint: error?.constraint,
    });
    return NextResponse.json(
      { 
        error: 'Sipariş güncellenirken hata oluştu', 
        details: error?.message || 'Bilinmeyen hata',
        code: error?.code,
        constraint: error?.constraint,
      },
      { status: 500 }
    );
  }
}
