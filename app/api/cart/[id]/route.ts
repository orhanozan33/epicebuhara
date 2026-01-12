import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { cart } from '@/src/db/schema';
import { eq, and } from 'drizzle-orm';
import { cookies } from 'next/headers';

// Sepetten ürün sil
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('sessionId')?.value;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Oturum bulunamadı' },
        { status: 401 }
      );
    }

    const { id: idParam } = await params;
    const cartItemId = parseInt(idParam);

    if (isNaN(cartItemId)) {
      return NextResponse.json(
        { error: 'Geçersiz sepet ID' },
        { status: 400 }
      );
    }

    // Sepet öğesinin session'a ait olduğunu kontrol et
    const cartItem = await db.select()
      .from(cart)
      .where(and(
        eq(cart.id, cartItemId),
        eq(cart.sessionId, sessionId)
      ))
      .limit(1);

    if (cartItem.length === 0) {
      return NextResponse.json(
        { error: 'Sepet öğesi bulunamadı' },
        { status: 404 }
      );
    }

    await db.delete(cart).where(eq(cart.id, cartItemId));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting cart item (Drizzle):', error);
    return NextResponse.json(
      { error: 'Sepet öğesi silinirken hata oluştu', details: error?.message },
      { status: 500 }
    );
  }
}

// Sepet öğesi miktarını güncelle
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('sessionId')?.value;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Oturum bulunamadı' },
        { status: 401 }
      );
    }

    const { id: idParam } = await params;
    const cartItemId = parseInt(idParam);
    const body = await request.json();
    const { quantity } = body;

    if (isNaN(cartItemId)) {
      return NextResponse.json(
        { error: 'Geçersiz sepet ID' },
        { status: 400 }
      );
    }

    if (!quantity || quantity < 1) {
      return NextResponse.json(
        { error: 'Miktar 1 veya daha büyük olmalıdır' },
        { status: 400 }
      );
    }

    // Sepet öğesinin session'a ait olduğunu kontrol et
    const cartItem = await db.select()
      .from(cart)
      .where(and(
        eq(cart.id, cartItemId),
        eq(cart.sessionId, sessionId)
      ))
      .limit(1);

    if (cartItem.length === 0) {
      return NextResponse.json(
        { error: 'Sepet öğesi bulunamadı' },
        { status: 404 }
      );
    }

    const updatedItem = await db.update(cart)
      .set({
        quantity: parseInt(quantity),
        updatedAt: new Date(),
      })
      .where(eq(cart.id, cartItemId))
      .returning();

    return NextResponse.json({ success: true, cartItem: updatedItem[0] });
  } catch (error: any) {
    console.error('Error updating cart item (Drizzle):', error);
    return NextResponse.json(
      { error: 'Sepet öğesi güncellenirken hata oluştu', details: error?.message },
      { status: 500 }
    );
  }
}
