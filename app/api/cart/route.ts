import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { cart, products } from '@/src/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { cookies } from 'next/headers';

// Session ID'yi al veya oluştur
async function getSessionId(): Promise<string> {
  const cookieStore = await cookies();
  let sessionId = cookieStore.get('sessionId')?.value;
  
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
  
  return sessionId;
}

// Sepete ürün ekle
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productId, quantity = 1 } = body;

    if (!productId) {
      return NextResponse.json(
        { error: 'Ürün ID gerekli' },
        { status: 400 }
      );
    }

    const sessionId = await getSessionId();

    // Aynı ürün sepette var mı kontrol et
    const existingCartItem = await db
      .select()
      .from(cart)
      .where(and(
        eq(cart.sessionId, sessionId),
        eq(cart.productId, parseInt(productId))
      ))
      .limit(1);

    let result;

    if (existingCartItem.length > 0) {
      // Ürün zaten sepette varsa, miktarını artır
      const newQuantity = existingCartItem[0].quantity + quantity;
      [result] = await db
        .update(cart)
        .set({
          quantity: newQuantity,
          updatedAt: new Date(),
        })
        .where(eq(cart.id, existingCartItem[0].id))
        .returning();
    } else {
      // Yeni ürün ekle
      [result] = await db
        .insert(cart)
        .values({
          sessionId,
          productId: parseInt(productId),
          quantity: parseInt(quantity) || 1,
        })
        .returning();
    }

    const response = NextResponse.json({ success: true, cartItem: result });
    response.cookies.set('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 gün
    });

    return response;
  } catch (error) {
    console.error('Error adding to cart:', error);
    return NextResponse.json(
      { error: 'Ürün sepete eklenirken hata oluştu' },
      { status: 500 }
    );
  }
}

// Sepeti getir
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('sessionId')?.value;

    if (!sessionId) {
      return NextResponse.json({ items: [] });
    }

    const cartItems = await db
      .select({
        id: cart.id,
        productId: cart.productId,
        quantity: cart.quantity,
        createdAt: cart.createdAt,
        updatedAt: cart.updatedAt,
      })
      .from(cart)
      .where(eq(cart.sessionId, sessionId));

    // Ürün bilgilerini getir
    const productIds = cartItems
      .map(item => item.productId)
      .filter((id): id is number => id !== null && id !== undefined);

    if (productIds.length === 0) {
      return NextResponse.json({ items: [] });
    }

    // IN operatörü ile ürünleri getir
    const filteredProducts = await db
      .select({
        id: products.id,
        name: products.name,
        baseName: products.baseName,
        slug: products.slug,
        price: products.price,
        comparePrice: products.comparePrice,
        images: products.images,
        weight: products.weight,
        unit: products.unit,
        stock: products.stock,
      })
      .from(products)
      .where(inArray(products.id, productIds));

    const items = cartItems.map(cartItem => {
      const product = filteredProducts.find(p => p.id === cartItem.productId);
      return {
        ...cartItem,
        product: product ? {
          id: product.id,
          name: product.name,
          baseName: product.baseName,
          slug: product.slug,
          price: product.price,
          comparePrice: product.comparePrice,
          images: product.images,
          weight: product.weight,
          unit: product.unit,
          stock: product.stock,
        } : null,
      };
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json(
      { error: 'Sepet getirilirken hata oluştu' },
      { status: 500 }
    );
  }
}
