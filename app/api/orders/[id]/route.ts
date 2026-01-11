import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { orders, orderItems, dealers, dealerSales, dealerSaleItems, products } from '@/src/db/schema';
import { eq, desc, sql, inArray, and, like } from 'drizzle-orm';

// Sipariş durumunu güncelle
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    const body = await request.json();

    if (isNaN(id)) {
      return NextResponse.json({ error: 'Geçersiz sipariş ID' }, { status: 400 });
    }

    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: 'Durum gerekli' }, { status: 400 });
    }

    // Geçerli durumlar
    const validStatuses = ['PENDING', 'APPROVED', 'SHIPPED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Geçersiz durum' }, { status: 400 });
    }

    // Mevcut siparişi al
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    if (!order) {
      return NextResponse.json({ error: 'Sipariş bulunamadı' }, { status: 404 });
    }

    // Sipariş bayisini bul (her zaman, çünkü borçlu satışları güncellemek için gerekli)
    let orderDealer = await db
      .select()
      .from(dealers)
      .where(eq(dealers.companyName, 'Sipariş'))
      .limit(1);

    if (orderDealer.length === 0) {
      // Eğer yoksa oluştur
      const [newDealer] = await db
        .insert(dealers)
        .values({
          companyName: 'Sipariş',
          phone: null,
          email: null,
          address: null,
          taxNumber: null,
          tpsNumber: null,
          tvqNumber: null,
          discount: '0',
          isActive: true,
        })
        .returning();
      
      if (newDealer) {
        orderDealer = [newDealer];
      }
    }

    // Eğer durum CANCELLED'a çevriliyorsa ve önceki durum SHIPPED ise, stokları geri ekle
    if (status === 'CANCELLED' && order.status === 'SHIPPED') {
      // Sipariş öğelerini getir
      const items = await db
        .select({
          id: orderItems.id,
          productId: orderItems.productId,
          quantity: orderItems.quantity,
          price: orderItems.price,
          total: orderItems.total,
        })
        .from(orderItems)
        .where(eq(orderItems.orderId, id));

      if (items.length > 0) {
        // Ürünleri getir
        const productIds = items
          .map(item => item.productId)
          .filter((id): id is number => id !== null && id !== undefined);

        if (productIds.length > 0) {
          const productList = await db
            .select()
            .from(products)
            .where(inArray(products.id, productIds));

          // Stokları geri ekle (trackStock true olan ürünler için)
          for (const item of items) {
            if (!item.productId) continue;
            const product = productList.find(p => p.id === item.productId);
            if (product && product.trackStock) {
              const quantityToAdd = parseInt(item.quantity.toString());
              
              if (product.stock !== null && product.stock !== undefined) {
                // Mevcut stok varsa geri ekle
                const currentStock = product.stock;
                const newStock = currentStock + quantityToAdd;
                await db
                  .update(products)
                  .set({
                    stock: newStock,
                    updatedAt: new Date(),
                  })
                  .where(eq(products.id, item.productId));
              } else {
                // Stok null/undefined ise, miktarı direkt ekle
                await db
                  .update(products)
                  .set({
                    stock: quantityToAdd,
                    updatedAt: new Date(),
                  })
                  .where(eq(products.id, item.productId));
              }
            }
          }
        }
      }
    }

    // Eğer durum SHIPPED'a çevriliyorsa, stoktan düş ve bayi satışı oluştur
    if (status === 'SHIPPED' && order.status !== 'SHIPPED') {
      // Sipariş öğelerini getir
      const items = await db
        .select({
          id: orderItems.id,
          productId: orderItems.productId,
          quantity: orderItems.quantity,
          price: orderItems.price,
          total: orderItems.total,
        })
        .from(orderItems)
        .where(eq(orderItems.orderId, id));

      if (items.length > 0) {
        // Ürünleri getir ve stok güncelle
        const productIds = items
          .map(item => item.productId)
          .filter((id): id is number => id !== null && id !== undefined);

        if (productIds.length > 0) {
          const productList = await db
            .select()
            .from(products)
            .where(inArray(products.id, productIds));

          // Stok güncelle (her satışta - trackStock true olan ürünler için)
          for (const item of items) {
            if (!item.productId) continue;
            const product = productList.find(p => p.id === item.productId);
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

          // Sipariş bayisi zaten yukarıda bulundu, kullan
          if (orderDealer.length > 0 && orderDealer[0]) {
            const dealerId = orderDealer[0].id;

            // Satış numarası oluştur
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

            // Fiyat hesaplamaları
            // Siparişin subtotal'ını kullan (ürünlerin toplamı)
            let subtotal = 0;
            const saleItems = items
              .filter(item => item.productId) // productId olmayanları filtrele
              .map((item: any) => {
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

            // İskonto yok (siparişler için)
            const discountAmount = 0;
            
            // Siparişin toplam tutarını kullan (vergiler dahil)
            // Siparişin total'ı zaten TPS + TVQ dahil
            const orderSubtotal = parseFloat(order.subtotal || '0');
            const orderTotal = parseFloat(order.total || '0');
            
            // Eğer sipariş subtotal'ı ile hesaplanan subtotal farklıysa, sipariş subtotal'ını kullan
            // Aksi halde siparişin total'ını direkt kullan (vergiler dahil)
            const finalSubtotal = Math.abs(orderSubtotal - subtotal) < 0.01 ? orderSubtotal : subtotal;
            const finalTotal = orderTotal; // Siparişin toplam tutarı (vergiler dahil)

            // Bayi satışı oluştur
            const [newSale] = await db
              .insert(dealerSales)
              .values({
                dealerId,
                saleNumber,
                paymentMethod: 'NAKIT', // Siparişler nakit olarak ödendi
                subtotal: finalSubtotal.toFixed(2),
                discount: discountAmount.toFixed(2),
                total: finalTotal.toFixed(2), // Siparişin toplam tutarı (vergiler dahil)
                isPaid: true, // Tamamen ödendi
                paidAmount: finalTotal.toFixed(2), // Toplam tutar kadar ödendi
                paidAt: new Date(), // Ödeme tarihi şimdi
                notes: `Sipariş: ${order.orderNumber}`,
              })
              .returning();

            if (newSale) {
              // Satış öğelerini oluştur
              const saleItemsToInsert = saleItems.map((item: any) => ({
                saleId: newSale.id,
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
                total: item.total,
              }));

              await db.insert(dealerSaleItems).values(saleItemsToInsert);
            }
          }
        }
      }
    }

    // Sipariş durumunu güncelle
    await db
      .update(orders)
      .set({ 
        status,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id));

    // Eğer sipariş bayisi için önceden oluşturulmuş borçlu satışlar varsa, onları da ödenmiş yap
    // Bu her sipariş durumu güncellemesinde kontrol edilir
    if (orderDealer.length > 0 && orderDealer[0]) {
      const dealerId = orderDealer[0].id;
      
      // Bu bayi için notes alanında "Sipariş:" ile başlayan ve borçlu olan satışları bul ve güncelle
      const unpaidOrderSales = await db
        .select()
        .from(dealerSales)
        .where(
          and(
            eq(dealerSales.dealerId, dealerId),
            like(dealerSales.notes, 'Sipariş:%'),
            eq(dealerSales.isPaid, false)
          )
        );

      if (unpaidOrderSales.length > 0) {
        // Tüm borçlu sipariş satışlarını ödenmiş yap
        for (const sale of unpaidOrderSales) {
          const total = parseFloat(sale.total || '0');
          await db
            .update(dealerSales)
            .set({
              paymentMethod: 'NAKIT',
              isPaid: true,
              paidAmount: total.toFixed(2),
              paidAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(dealerSales.id, sale.id));
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating order status:', error);
    console.error('Error details:', error?.message, error?.stack);
    return NextResponse.json(
      { error: 'Sipariş durumu güncellenirken hata oluştu', details: error?.message || 'Bilinmeyen hata' },
      { status: 500 }
    );
  }
}
