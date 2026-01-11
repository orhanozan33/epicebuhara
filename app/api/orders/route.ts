import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { orders, orderItems, cart, notifications, products } from '@/src/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
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

    // Siparişi bul
    const orderResult = await db
      .select()
      .from(orders)
      .where(eq(orders.orderNumber, orderNumber))
      .limit(1);

    if (orderResult.length === 0) {
      return NextResponse.json(
        { error: 'Sipariş bulunamadı' },
        { status: 404 }
      );
    }

    const order = orderResult[0];

    // Sipariş öğelerini getir
    const itemsResult = await db
      .select({
        id: orderItems.id,
        productId: orderItems.productId,
        quantity: orderItems.quantity,
        price: orderItems.price,
        total: orderItems.total,
        productId2: products.id,
        productName: products.name,
        productBaseName: products.baseName,
        productImages: products.images,
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, order.id));

    // Format items
    const formattedItems = itemsResult.map((item: any) => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
      total: item.total,
      product: item.productId2 ? {
        id: item.productId2,
        name: item.productName,
        baseName: item.productBaseName,
        images: item.productImages,
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
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Sipariş getirilirken hata oluştu' },
      { status: 500 }
    );
  }
}

// Sipariş oluştur
export async function POST(request: Request) {
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
      return NextResponse.json(
        { error: 'Sepet boş olamaz' },
        { status: 400 }
      );
    }

    if (!shippingName || !shippingPhone || !shippingEmail || !shippingAddress || !shippingProvince || !shippingCity) {
      return NextResponse.json(
        { error: 'Tüm teslimat bilgileri gerekli' },
        { status: 400 }
      );
    }

    // Session ID'yi al
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('sessionId')?.value;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Oturum bulunamadı' },
        { status: 401 }
      );
    }

    // Sepet öğelerini kontrol et
    const cartItemsFromDb = await db
      .select()
      .from(cart)
      .where(eq(cart.sessionId, sessionId));

    if (cartItemsFromDb.length === 0) {
      return NextResponse.json(
        { error: 'Sepet bulunamadı' },
        { status: 404 }
      );
    }

    // Sipariş numarası oluştur - ORD-000001 formatında sırayla artacak
    // En son siparişi ID'ye göre al (en yeni sipariş)
    const lastOrderResult = await db
      .select({ orderNumber: orders.orderNumber })
      .from(orders)
      .orderBy(desc(orders.id))
      .limit(1);
    
    let nextNumber = 1;
    if (lastOrderResult.length > 0 && lastOrderResult[0].orderNumber) {
      const orderNum = lastOrderResult[0].orderNumber;
      // ORD- ile başlayan ve ardından 6 haneli sayı olan formatı bul (yeni format: ORD-000001)
      const match = orderNum.match(/ORD-(\d{6})$/);
      if (match && match[1]) {
        const num = parseInt(match[1]);
        if (!isNaN(num) && num > 0) {
          nextNumber = num + 1;
        }
      } else {
        // Eğer eski format varsa veya format uyumsuzsa, mevcut sipariş sayısını kullan
        const totalCountResult = await db
          .select({ total: sql<number>`count(*)::int` })
          .from(orders);
        const total = totalCountResult[0]?.total || 0;
        nextNumber = total + 1;
      }
    }
    
    // 6 haneli format (ORD-000001)
    const orderNumber = `ORD-${nextNumber.toString().padStart(6, '0')}`;

    // Sipariş oluştur
    const [newOrder] = await db
      .insert(orders)
      .values({
        orderNumber,
        subtotal: subtotal.toString(),
        tax: tax.toString(),
        shipping: shipping || '0.00',
        discount: '0.00',
        total: total.toString(),
        currency: 'CAD',
        shippingName,
        shippingPhone,
        shippingEmail,
        shippingAddress,
        shippingProvince: shippingProvince || null,
        shippingCity,
        status: 'PENDING',
      })
      .returning();

    // Sipariş öğelerini oluştur
    const orderItemsList = cartItems.map((item: any) => ({
      orderId: newOrder.id,
      productId: parseInt(item.productId),
      quantity: parseInt(item.quantity),
      price: item.price.toString(),
      total: (parseFloat(item.price) * parseInt(item.quantity)).toFixed(2),
    }));

    await db.insert(orderItems).values(orderItemsList);

    // Bildirim oluştur
    await db.insert(notifications).values({
      type: 'siparis',
      title: 'Yeni Sipariş',
      message: `Yeni sipariş: ${orderNumber} - ${shippingName} - Toplam: $${total}`,
      orderId: newOrder.id,
      isRead: false,
    });

    // Sepeti temizle
    await db.delete(cart).where(eq(cart.sessionId, sessionId));

    return NextResponse.json({
      success: true,
      order: {
        id: newOrder.id,
        orderNumber: newOrder.orderNumber,
        total: newOrder.total,
      },
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Sipariş oluşturulurken hata oluştu' },
      { status: 500 }
    );
  }
}
