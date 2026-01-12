import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { orders, orderItems, cart, notifications, products } from '@/src/db/schema';
import { eq, desc, ne, inArray } from 'drizzle-orm';
import { cookies } from 'next/headers';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Siparişleri getir
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const orderNumber = searchParams.get('orderNumber');

    if (orderNumber) {
      // Belirli bir sipariş numarası ile sipariş getir
      const order = await db.select()
        .from(orders)
        .where(eq(orders.orderNumber, orderNumber))
        .limit(1);

      if (order.length === 0) {
        return NextResponse.json(
          { error: 'Sipariş bulunamadı' },
          { status: 404 }
        );
      }

      // Sipariş öğelerini getir ve product bilgilerini join et
      const items = await db.select({
        id: orderItems.id,
        productId: orderItems.productId,
        quantity: orderItems.quantity,
        price: orderItems.price,
        total: orderItems.total,
        product: {
          id: products.id,
          name: products.name,
          baseName: products.baseName,
          slug: products.slug,
          images: products.images,
        },
      })
        .from(orderItems)
        .leftJoin(products, eq(orderItems.productId, products.id))
        .where(eq(orderItems.orderId, order[0].id));

      return NextResponse.json({
        order: order[0],
        items: items.map(item => ({
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
          product: item.product,
        })),
      });
    }

    // Email veya telefon ile siparişleri getir
    const email = searchParams.get('email');
    const phone = searchParams.get('phone');
    
    if (email || phone) {
      let ordersList;
      if (email) {
        ordersList = await db.select()
          .from(orders)
          .where(eq(orders.shippingEmail, email))
          .orderBy(desc(orders.createdAt));
      } else if (phone) {
        ordersList = await db.select()
          .from(orders)
          .where(eq(orders.shippingPhone, phone))
          .orderBy(desc(orders.createdAt));
      }
      
      return NextResponse.json(ordersList || []);
    }

    // Tüm siparişleri getir (filtreleme ile)
    let ordersList;
    if (status && status !== 'all') {
      ordersList = await db.select()
        .from(orders)
        .where(eq(orders.status, status))
        .orderBy(desc(orders.createdAt));
    } else {
      // Tüm siparişler (SHIPPED hariç)
      ordersList = await db.select()
        .from(orders)
        .where(ne(orders.status, 'SHIPPED'))
        .orderBy(desc(orders.createdAt));
    }

    return NextResponse.json(ordersList);
  } catch (error: any) {
    console.error('Error fetching orders (Drizzle):', error);
    return NextResponse.json(
      { error: 'Siparişler getirilemedi', details: error?.message },
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
      shippingPostalCode,
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

    // Sipariş numarası oluştur
    const lastOrder = await db.select()
      .from(orders)
      .orderBy(desc(orders.id))
      .limit(1);

    let orderNumber: string;
    if (lastOrder.length > 0 && lastOrder[0].orderNumber) {
      const match = lastOrder[0].orderNumber.match(/ORD-(\d{6})$/);
      if (match && match[1]) {
        const num = parseInt(match[1]);
        if (!isNaN(num) && num > 0) {
          orderNumber = `ORD-${(num + 1).toString().padStart(6, '0')}`;
        } else {
          const totalOrders = await db.select().from(orders);
          orderNumber = `ORD-${(totalOrders.length + 1).toString().padStart(6, '0')}`;
        }
      } else {
        const totalOrders = await db.select().from(orders);
        orderNumber = `ORD-${(totalOrders.length + 1).toString().padStart(6, '0')}`;
      }
    } else {
      orderNumber = `ORD-000001`;
    }

    // Sipariş oluştur
    const newOrder = await db.insert(orders).values({
      orderNumber,
      subtotal: parseFloat(subtotal).toFixed(2),
      tax: parseFloat(tax || '0').toFixed(2),
      shipping: parseFloat(shipping || '0').toFixed(2),
      discount: '0.00',
      total: parseFloat(total).toFixed(2),
      currency: 'CAD',
      shippingName: shippingName.trim(),
      shippingPhone: shippingPhone.trim(),
      shippingEmail: shippingEmail.trim(),
      shippingAddress: shippingAddress.trim(),
      shippingProvince: shippingProvince?.trim() || null,
      shippingCity: shippingCity.trim(),
      shippingPostalCode: shippingPostalCode?.trim() || null,
      status: 'PENDING',
    }).returning();

    const savedOrder = newOrder[0];

    // Sipariş öğelerini oluştur
    const itemsToInsert = cartItems.map((item: any) => ({
      orderId: savedOrder.id,
      productId: parseInt(item.productId),
      quantity: parseInt(item.quantity),
      price: parseFloat(item.price).toFixed(2),
      total: parseFloat(item.total || (parseFloat(item.price) * parseInt(item.quantity))).toFixed(2),
    }));

    await db.insert(orderItems).values(itemsToInsert);

    // Stok güncelle (trackStock true olan ürünler için)
    const productIds = itemsToInsert
      .map((item: { productId: number; quantity: number; price: string; total: string }) => item.productId)
      .filter((id: number | null | undefined): id is number => id !== null && id !== undefined);
    
    if (productIds.length > 0) {
      const productList = await db.select()
        .from(products)
        .where(inArray(products.id, productIds));
      
      for (const item of itemsToInsert) {
        if (!item.productId) continue;
        const product = productList.find(p => p.id === item.productId);
        if (product && product.trackStock) {
          const quantityToSubtract = item.quantity;
          const currentStock = product.stock ? parseInt(product.stock.toString()) : 0;
          const newStock = Math.max(0, currentStock - quantityToSubtract);
          
          await db.update(products)
            .set({ stock: newStock })
            .where(eq(products.id, product.id));
        }
      }
    }

    // Bildirim oluştur (opsiyonel)
    try {
      await db.insert(notifications).values({
        type: 'siparis',
        title: 'Yeni Sipariş',
        message: `Yeni sipariş: ${orderNumber} - ${shippingName} - Toplam: $${total}`,
        orderId: savedOrder.id,
        isRead: false,
      });
    } catch (notificationError: any) {
      console.warn('Warning: Could not create notification:', notificationError?.message);
    }

    // Sepeti temizle
    try {
      await db.delete(cart).where(eq(cart.sessionId, sessionId));
    } catch (deleteError: any) {
      console.warn('Warning: Could not clear cart:', deleteError?.message);
    }

    return NextResponse.json({
      success: true,
      order: {
        id: savedOrder.id,
        orderNumber: savedOrder.orderNumber,
        total: savedOrder.total,
      },
    });
  } catch (error: any) {
    console.error('Error creating order (Drizzle):', error);
    return NextResponse.json(
      { error: 'Sipariş oluşturulurken hata oluştu', details: error?.message },
      { status: 500 }
    );
  }
}
