import { NextResponse } from 'next/server';
import { getDataSource, getOrderRepository } from '@/src/db/index.typeorm';
import { loadEntityClass } from '@/src/db/entity-loader';
import { cookies } from 'next/headers';

// Sipariş numarası ile sipariş detaylarını getir
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get('orderNumber');

    if (!orderNumber) {
      return NextResponse.json(
        { error: 'Sipariş numarası gerekli' },
        { status: 400 }
      );
    }

    const orderRepo = await getOrderRepository();
    const order = await orderRepo.findOne({
      where: { orderNumber },
      relations: ['orderItems', 'orderItems.product'],
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Sipariş bulunamadı' },
        { status: 404 }
      );
    }

    // Format items
    const formattedItems = (order.orderItems || []).map((item: any) => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
      total: item.total,
      product: item.product ? {
        id: item.product.id,
        name: item.product.name,
        baseName: item.product.baseName,
        images: item.product.images,
      } : null,
    }));

    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        subtotal: order.subtotal,
        tax: order.tax,
        shipping: order.shipping,
        discount: order.discount,
        total: order.total,
        currency: order.currency,
        shippingName: order.shippingName,
        shippingPhone: order.shippingPhone,
        shippingEmail: order.shippingEmail,
        shippingAddress: order.shippingAddress,
        shippingProvince: order.shippingProvince,
        shippingCity: order.shippingCity,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
      items: formattedItems,
    });
  } catch (error: any) {
    console.error('Error fetching order (TypeORM):', error);
    return NextResponse.json(
      { error: 'Sipariş getirilirken hata oluştu', details: error?.message },
      { status: 500 }
    );
  }
}

// Sipariş oluştur
export async function POST(request: Request) {
  const dataSource = await getDataSource();
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const body = await request.json();
    const {
      cartItems,
      shippingName,
      shippingPhone,
      shippingEmail,
      shippingAddress,
      shippingProvince,
      shippingCity,
      subtotal,
      tax,
      tps,
      tvq,
      shipping,
      total,
    } = body;

    // Validasyon
    if (!cartItems || cartItems.length === 0) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      return NextResponse.json(
        { error: 'Sepet boş olamaz' },
        { status: 400 }
      );
    }

    if (!shippingName || !shippingPhone || !shippingEmail || !shippingAddress || !shippingProvince || !shippingCity) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      return NextResponse.json(
        { error: 'Tüm teslimat bilgileri gerekli' },
        { status: 400 }
      );
    }

    // Session ID'yi al
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('sessionId')?.value;

    if (!sessionId) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      return NextResponse.json(
        { error: 'Oturum bulunamadı' },
        { status: 401 }
      );
    }

    // Sepet öğelerini kontrol et (opsiyonel)
    const CartEntity = await loadEntityClass('Cart');
    const cartRepo: any = queryRunner.manager.getRepository(CartEntity);
    let cartItemsFromDb: any[] = [];
    try {
      cartItemsFromDb = await cartRepo.find({
        where: { sessionId },
      });
    } catch (cartError: any) {
      console.warn('Warning: Could not fetch cart from database, using frontend cartItems:', cartError?.message);
    }

    // Frontend'den gelen cartItems'ı doğrula
    for (const item of cartItems) {
      if (!item.productId || !item.quantity) {
        await queryRunner.rollbackTransaction();
        await queryRunner.release();
        return NextResponse.json(
          { error: 'Sepet öğelerinde eksik bilgi var' },
          { status: 400 }
        );
      }
    }

    // Sipariş numarası oluştur
    const OrderEntity = await loadEntityClass('Order');
    const orderRepo: any = queryRunner.manager.getRepository(OrderEntity);
    let orderNumber: string;
    try {
      const lastOrder = await orderRepo
        .createQueryBuilder('order')
        .orderBy('order.id', 'DESC')
        .getOne();
      
      let nextNumber = 1;
      if (lastOrder?.orderNumber) {
        const match = lastOrder.orderNumber.match(/ORD-(\d{6})$/);
        if (match && match[1]) {
          const num = parseInt(match[1]);
          if (!isNaN(num) && num > 0) {
            nextNumber = num + 1;
          }
        } else {
          const total = await orderRepo.count();
          nextNumber = total + 1;
        }
      }
      orderNumber = `ORD-${nextNumber.toString().padStart(6, '0')}`;
    } catch (orderNumError: any) {
      console.warn('Warning: Could not fetch last order number, using timestamp-based number:', orderNumError?.message);
      const timestamp = Math.floor(Date.now() / 1000) % 1000000;
      orderNumber = `ORD-${timestamp.toString().padStart(6, '0')}`;
    }

    // Decimal değerleri string'e çevir
    const subtotalStr = parseFloat(subtotal).toFixed(2);
    const taxStr = parseFloat(tax).toFixed(2);
    const shippingStr = shipping ? parseFloat(shipping).toFixed(2) : '0.00';
    const totalStr = parseFloat(total).toFixed(2);

    // Sipariş oluştur
    const newOrder = orderRepo.create({
      orderNumber,
      subtotal: subtotalStr,
      tax: taxStr,
      shipping: shippingStr,
      discount: '0.00',
      total: totalStr,
      currency: 'CAD',
      shippingName: shippingName?.trim() || '',
      shippingPhone: shippingPhone?.trim() || '',
      shippingEmail: shippingEmail?.trim() || '',
      shippingAddress: shippingAddress?.trim() || '',
      shippingProvince: shippingProvince?.trim() || null,
      shippingCity: shippingCity?.trim() || '',
      status: 'PENDING',
    });
    const savedOrder = await orderRepo.save(newOrder);

    // Sipariş öğelerini oluştur
    const OrderItemEntity = await loadEntityClass('OrderItem');
    const orderItemRepo: any = queryRunner.manager.getRepository(OrderItemEntity);
    const orderItemsToInsert = orderItemRepo.create(
      cartItems.map((item: any) => ({
        orderId: savedOrder.id,
        productId: parseInt(item.productId),
        quantity: parseInt(item.quantity),
        price: parseFloat(item.price).toFixed(2),
        total: parseFloat(item.total || (parseFloat(item.price) * parseInt(item.quantity))).toFixed(2),
      }))
    );
    await orderItemRepo.save(orderItemsToInsert);

    // Bildirim oluştur (opsiyonel)
    try {
      const NotificationEntity = await loadEntityClass('Notification');
      const notificationRepo: any = queryRunner.manager.getRepository(NotificationEntity);
      await notificationRepo.save({
        type: 'siparis',
        title: 'Yeni Sipariş',
        message: `Yeni sipariş: ${orderNumber} - ${shippingName} - Toplam: $${total}`,
        orderId: savedOrder.id,
        isRead: false,
      });
    } catch (notificationError: any) {
      console.warn('Warning: Could not create notification:', notificationError?.message);
    }

    // Sepeti temizle (transaction içinde)
    try {
      await cartRepo.delete({ sessionId } as any);
    } catch (deleteError: any) {
      console.warn('Warning: Could not clear cart from database:', deleteError?.message);
    }

    await queryRunner.commitTransaction();

    return NextResponse.json({
      success: true,
      order: {
        id: savedOrder.id,
        orderNumber: savedOrder.orderNumber,
        total: savedOrder.total,
      },
    });
  } catch (error: any) {
    await queryRunner.rollbackTransaction();
    console.error('Error creating order (TypeORM):', error);
    return NextResponse.json(
      { error: 'Sipariş oluşturulurken hata oluştu', details: error?.message },
      { status: 500 }
    );
  } finally {
    await queryRunner.release();
  }
}
