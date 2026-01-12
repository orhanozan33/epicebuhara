import { NextResponse } from 'next/server';
import { getCartRepository, getProductRepository } from '@/src/db/index.typeorm';
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
    const cartRepo = await getCartRepository();

    // Aynı ürün sepette var mı kontrol et
    const existingCartItem = await cartRepo.findOne({
      where: {
        sessionId,
        productId: parseInt(productId),
      },
    });

    let result;

    if (existingCartItem) {
      // Ürün zaten sepette varsa, miktarını artır
      existingCartItem.quantity = existingCartItem.quantity + quantity;
      result = await cartRepo.save(existingCartItem);
    } else {
      // Yeni ürün ekle
      const newCartItem = cartRepo.create({
        sessionId,
        productId: parseInt(productId),
        quantity: parseInt(quantity) || 1,
      });
      result = await cartRepo.save(newCartItem);
    }

    const response = NextResponse.json({ success: true, cartItem: result });
    response.cookies.set('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 gün
    });

    return response;
  } catch (error: any) {
    console.error('Error adding to cart (TypeORM):', error);
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
    const sessionId = cookieStore.get('sessionId')?.value;

    if (!sessionId) {
      return NextResponse.json({ items: [] });
    }

    const cartRepo = await getCartRepository();
    const productRepo = await getProductRepository();

    const cartItems = await cartRepo.find({
      where: { sessionId },
    });

    if (cartItems.length === 0) {
      return NextResponse.json({ items: [] });
    }

    // Ürün bilgilerini getir
    const productIds = cartItems
      .map(item => item.productId)
      .filter((id): id is number => id !== null && id !== undefined);

    if (productIds.length === 0) {
      return NextResponse.json({ items: [] });
    }

    // Ürünleri getir (IN query)
    const filteredProducts = await productRepo
      .createQueryBuilder('product')
      .where('product.id IN (:...ids)', { ids: productIds })
      .select([
        'product.id',
        'product.name',
        'product.baseName',
        'product.slug',
        'product.price',
        'product.comparePrice',
        'product.images',
        'product.weight',
        'product.unit',
        'product.stock',
      ])
      .getMany();

    const items = cartItems.map(cartItem => {
      const product = filteredProducts.find(p => p.id === cartItem.productId);
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
  } catch (error: any) {
    console.error('Error fetching cart (TypeORM):', error);
    return NextResponse.json(
      { error: 'Sepet getirilirken hata oluştu', details: error?.message },
      { status: 500 }
    );
  }
}
