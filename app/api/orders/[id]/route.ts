import { NextResponse } from 'next/server';
import { getDataSource, getOrderRepository, getOrderItemRepository, getDealerRepository, getDealerSaleRepository, getDealerSaleItemRepository, getProductRepository } from '@/src/db/index.typeorm';
import { loadEntityClass } from '@/src/db/entity-loader';
import { In, Like } from 'typeorm';

// Sipariş durumunu güncelle
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const dataSource = await getDataSource();
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    const body = await request.json();

    if (isNaN(id)) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      return NextResponse.json({ error: 'Geçersiz sipariş ID' }, { status: 400 });
    }

    const { status } = body;

    if (!status) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      return NextResponse.json({ error: 'Durum gerekli' }, { status: 400 });
    }

    // Geçerli durumlar
    const validStatuses = ['PENDING', 'APPROVED', 'SHIPPED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      return NextResponse.json({ error: 'Geçersiz durum' }, { status: 400 });
    }

    // Mevcut siparişi al
    const OrderEntity = await loadEntityClass('Order');
    const orderRepo: any = queryRunner.manager.getRepository(OrderEntity);
    const order = await orderRepo.findOne({ where: { id } });

    if (!order) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      return NextResponse.json({ error: 'Sipariş bulunamadı' }, { status: 404 });
    }

    // Sipariş bayisini bul (her zaman, çünkü borçlu satışları güncellemek için gerekli)
    const DealerEntity = await loadEntityClass('Dealer');
    const dealerRepo: any = queryRunner.manager.getRepository(DealerEntity);
    let orderDealer = await dealerRepo.findOne({ where: { companyName: 'Sipariş' } });

    if (!orderDealer) {
      // Eğer yoksa oluştur
      const newDealer = dealerRepo.create({
        companyName: 'Sipariş',
        phone: null,
        email: null,
        address: null,
        taxNumber: null,
        tpsNumber: null,
        tvqNumber: null,
        discount: '0',
        isActive: true,
      });
      orderDealer = await dealerRepo.save(newDealer);
    }

    // Eğer durum CANCELLED'a çevriliyorsa ve önceki durum SHIPPED ise, stokları geri ekle
    if (status === 'CANCELLED' && order.status === 'SHIPPED') {
      const OrderItemEntity = await loadEntityClass('OrderItem');
      const orderItemRepo: any = queryRunner.manager.getRepository(OrderItemEntity);
      const items = await orderItemRepo.find({ where: { orderId: id } });

      if (items.length > 0) {
        const productIds = items
          .map((item: any) => item.productId)
          .filter((id: any): id is number => id !== null && id !== undefined);

        if (productIds.length > 0) {
          const ProductEntity = await loadEntityClass('Product');
          const productRepo: any = queryRunner.manager.getRepository(ProductEntity);
          const productList: any[] = await productRepo.find({ where: { id: In(productIds) } });

          // Stokları geri ekle (trackStock true olan ürünler için)
          for (const item of items) {
            if (!item.productId) continue;
            const product = productList.find(p => p.id === item.productId);
            if (product && product.trackStock) {
              const quantityToAdd = parseInt(item.quantity.toString());
              
              if (product.stock !== null && product.stock !== undefined) {
                const currentStock = product.stock;
                const newStock = currentStock + quantityToAdd;
                product.stock = newStock;
                await productRepo.save(product);
              } else {
                product.stock = quantityToAdd;
                await productRepo.save(product);
              }
            }
          }
        }
      }
    }

    // Eğer durum SHIPPED'a çevriliyorsa, stoktan düş ve bayi satışı oluştur
    if (status === 'SHIPPED' && order.status !== 'SHIPPED') {
      const OrderItemEntity = await loadEntityClass('OrderItem');
      const orderItemRepo: any = queryRunner.manager.getRepository(OrderItemEntity);
      const items = await orderItemRepo.find({ where: { orderId: id } });

      if (items.length > 0) {
        const productIds = items
          .map((item: any) => item.productId)
          .filter((id: any): id is number => id !== null && id !== undefined);

        if (productIds.length > 0) {
          const ProductEntity = await loadEntityClass('Product');
          const productRepo: any = queryRunner.manager.getRepository(ProductEntity);
          const productList: any[] = await productRepo.find({ where: { id: In(productIds) } });

          // Stok güncelle (trackStock true olan ürünler için)
          for (const item of items) {
            if (!item.productId) continue;
            const product: any = productList.find((p: any) => p.id === item.productId);
            if (product && product.trackStock) {
              const quantityToSubtract = parseInt(item.quantity.toString());
              
              if (product.stock !== null && product.stock !== undefined) {
                const currentStock = product.stock;
                const newStock = Math.max(0, currentStock - quantityToSubtract);
                product.stock = newStock;
                await productRepo.save(product);
              } else {
                product.stock = -quantityToSubtract;
                await productRepo.save(product);
              }
            }
          }

          // Sipariş bayisi zaten yukarıda bulundu, kullan
          if (orderDealer) {
            const dealerId = orderDealer.id;
            const DealerSaleEntity = await loadEntityClass('DealerSale');
            const dealerSaleRepo: any = queryRunner.manager.getRepository(DealerSaleEntity);

            // Satış numarası oluştur
            const lastSale: any = await dealerSaleRepo
              .createQueryBuilder('sale')
              .orderBy('sale.id', 'DESC')
              .getOne();

            let nextNumber = 1;
            if (lastSale?.saleNumber) {
              const match = lastSale.saleNumber.match(/SAL-(\d{6})$/);
              if (match && match[1]) {
                const num = parseInt(match[1]);
                if (!isNaN(num) && num > 0) {
                  nextNumber = num + 1;
                }
              } else {
                const total = await dealerSaleRepo.count();
                nextNumber = total + 1;
              }
            }

            const saleNumber = `SAL-${nextNumber.toString().padStart(6, '0')}`;

            // Fiyat hesaplamaları
            let subtotal = 0;
            const saleItems = items
              .filter((item: any) => item.productId)
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

            const discountAmount = 0;
            const orderSubtotal = parseFloat(order.subtotal || '0');
            const orderTotal = parseFloat(order.total || '0');
            const finalSubtotal = Math.abs(orderSubtotal - subtotal) < 0.01 ? orderSubtotal : subtotal;
            const finalTotal = orderTotal;

            // Bayi satışı oluştur
            const newSale = dealerSaleRepo.create({
              dealerId,
              saleNumber,
              paymentMethod: 'NAKIT',
              subtotal: finalSubtotal.toFixed(2),
              discount: discountAmount.toFixed(2),
              total: finalTotal.toFixed(2),
              isPaid: true,
              paidAmount: finalTotal.toFixed(2),
              paidAt: new Date(),
              notes: `Sipariş: ${order.orderNumber}`,
            });
            const savedSale = await dealerSaleRepo.save(newSale);

            // Satış öğelerini oluştur
            const DealerSaleItemEntity = await loadEntityClass('DealerSaleItem');
            const dealerSaleItemRepo: any = queryRunner.manager.getRepository(DealerSaleItemEntity);
            const saleItemsToInsert = dealerSaleItemRepo.create(
              saleItems.map((item: any) => ({
                saleId: savedSale.id,
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
                total: item.total,
              }))
            );
            await dealerSaleItemRepo.save(saleItemsToInsert);
          }
        }
      }
    }

    // Sipariş durumunu güncelle
    order.status = status;
    await orderRepo.save(order);

    // Eğer sipariş bayisi için önceden oluşturulmuş borçlu satışlar varsa, onları da ödenmiş yap
    if (orderDealer) {
      const dealerId = orderDealer.id;
      const DealerSaleEntity = await loadEntityClass('DealerSale');
      const dealerSaleRepo: any = queryRunner.manager.getRepository(DealerSaleEntity);

      // Bu bayi için notes alanında "Sipariş:" ile başlayan ve borçlu olan satışları bul
      const unpaidOrderSales: any[] = await dealerSaleRepo
        .createQueryBuilder('sale')
        .where('sale.dealerId = :dealerId', { dealerId })
        .andWhere('sale.notes LIKE :notes', { notes: 'Sipariş:%' })
        .andWhere('sale.isPaid = :isPaid', { isPaid: false })
        .getMany();

      if (unpaidOrderSales.length > 0) {
        // Tüm borçlu sipariş satışlarını ödenmiş yap
        for (const sale of unpaidOrderSales) {
          const total = parseFloat(sale.total || '0');
          sale.paymentMethod = 'NAKIT';
          sale.isPaid = true;
          sale.paidAmount = total.toFixed(2);
          sale.paidAt = new Date();
          await dealerSaleRepo.save(sale);
        }
      }
    }

    await queryRunner.commitTransaction();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    await queryRunner.rollbackTransaction();
    console.error('Error updating order status (TypeORM):', error);
    console.error('Error details:', error?.message, error?.stack);
    return NextResponse.json(
      { error: 'Sipariş durumu güncellenirken hata oluştu', details: error?.message || 'Bilinmeyen hata' },
      { status: 500 }
    );
  } finally {
    await queryRunner.release();
  }
}
