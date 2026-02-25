import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { cart, products } from '@/src/db/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';
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
    const existingCartItem = await db.select()
      .from(cart)
      .where(and(
        eq(cart.sessionId, sessionId),
        eq(cart.productId, parseInt(productId))
      ))
      .limit(1);

    let result;

    if (existingCartItem.length > 0) {
      // Ürün zaten sepette varsa, miktarını artır
      const updatedCartItem = await db.update(cart)
        .set({
          quantity: existingCartItem[0].quantity + quantity,
          updatedAt: new Date(),
        })
        .where(eq(cart.id, existingCartItem[0].id))
        .returning();
      result = updatedCartItem[0];
    } else {
      // Yeni ürün ekle
      const newCartItem = await db.insert(cart).values({
        sessionId,
        productId: parseInt(productId),
        quantity: parseInt(quantity) || 1,
      }).returning();
      result = newCartItem[0];
    }

    const response = NextResponse.json({ success: true, cartItem: result });
    response.cookies.set('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' || process.env.VERCEL === '1',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 gün
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Error adding to cart (Drizzle):', error);
    return NextResponse.json(
      { error: 'Ürün sepete eklenirken hata oluştu', details: error?.message },
      { status: 500 }
    );
  }
}

// Sepeti getir
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    let sessionId = cookieStore.get('sessionId')?.value;

    // Eğer sessionId yoksa, yeni bir tane oluştur ama boş sepet döndür
    // (Cookie'yi set etmek için response'a ekleyeceğiz)
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }

    const cartItems = await db.select()
      .from(cart)
      .where(eq(cart.sessionId, sessionId));

    // Eğer sepet boşsa, boş array döndür ama cookie'yi set et
    if (cartItems.length === 0) {
      const response = NextResponse.json({ items: [] });
      response.cookies.set('sessionId', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production' || process.env.VERCEL === '1',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 gün
        path: '/',
      });
      return response;
    }

    // Ürün bilgilerini getir
    const productIds = cartItems
      .map(item => item.productId)
      .filter((id): id is number => id !== null && id !== undefined);

    if (productIds.length === 0) {
      const response = NextResponse.json({ items: [] });
      response.cookies.set('sessionId', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production' || process.env.VERCEL === '1',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 gün
        path: '/',
      });
      return response;
    }

    // Ürünleri getir (IN query) - Boş array kontrolü
    let filteredProducts: any[] = [];
    const productNameFrEnMap = new Map<number, { baseNameFr: string | null; baseNameEn: string | null }>();
    if (productIds.length > 0) {
      filteredProducts = await db.select({
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
      try {
        const rows = await db.execute(
          sql`SELECT id, base_name_fr, base_name_en FROM products WHERE id IN (${sql.join(productIds.map((id) => sql`${id}`), sql`, `)})`
        );
        const arr = Array.isArray(rows) ? rows : (rows as { rows?: unknown[] })?.rows ?? [];
        for (const row of arr) {
          const r = row as { id: number; base_name_fr?: string | null; base_name_en?: string | null };
          if (r && typeof r.id !== 'undefined') {
            productNameFrEnMap.set(Number(r.id), {
              baseNameFr: r.base_name_fr ?? null,
              baseNameEn: r.base_name_en ?? null,
            });
          }
        }
      } catch {
        // Kolon yoksa atla
      }
    }

    const items = cartItems.map(cartItem => {
      const product = filteredProducts.find(p => p.id === cartItem.productId);
      const frEn = product ? productNameFrEnMap.get(product.id) : null;
      return {
        id: cartItem.id,
        productId: cartItem.productId,
        quantity: cartItem.quantity,
        createdAt: cartItem.createdAt,
        updatedAt: cartItem.updatedAt,
        product: product ? {
          id: product.id,
          name: product.name,
          baseName: product.baseName,
          baseNameFr: frEn?.baseNameFr ?? null,
          baseNameEn: frEn?.baseNameEn ?? null,
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

    // Response oluştur ve cookie'yi set et
    const response = NextResponse.json({ items });
    response.cookies.set('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' || process.env.VERCEL === '1',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 gün
      path: '/',
    });
    
    return response;
  } catch (error: any) {
    console.error('Error fetching cart (Drizzle):', error);
    console.error('Error stack:', error?.stack);
    console.error('Error code:', error?.code);
    console.error('Error name:', error?.name);
    
    // Daha detaylı hata mesajı
    const errorMessage = error?.message || 'Bilinmeyen hata';
    const errorDetails = {
      message: errorMessage,
      code: error?.code,
      name: error?.name,
      query: error?.query || 'N/A',
    };
    
    return NextResponse.json(
      { 
        error: 'Sepet getirilirken hata oluştu', 
        details: errorMessage,
        debug: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      },
      { status: 500 }
    );
  }
}
