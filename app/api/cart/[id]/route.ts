import { NextResponse } from 'next/server';
import { getCartRepository } from '@/src/db/index.typeorm';
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

    const cartRepo = await getCartRepository();
    
    // Sepet öğesinin session'a ait olduğunu kontrol et
    const cartItem = await cartRepo.findOne({
      where: { id: cartItemId, sessionId },
    });

    if (!cartItem) {
      return NextResponse.json(
        { error: 'Sepet öğesi bulunamadı' },
        { status: 404 }
      );
    }

    await cartRepo.delete(cartItemId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting cart item (TypeORM):', error);
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

    const cartRepo = await getCartRepository();
    
    // Sepet öğesinin session'a ait olduğunu kontrol et
    const cartItem = await cartRepo.findOne({
      where: { id: cartItemId, sessionId },
    });

    if (!cartItem) {
      return NextResponse.json(
        { error: 'Sepet öğesi bulunamadı' },
        { status: 404 }
      );
    }

    cartItem.quantity = parseInt(quantity);
    const updatedItem = await cartRepo.save(cartItem);

    return NextResponse.json({ success: true, cartItem: updatedItem });
  } catch (error: any) {
    console.error('Error updating cart item (TypeORM):', error);
    return NextResponse.json(
      { error: 'Sepet öğesi güncellenirken hata oluştu', details: error?.message },
      { status: 500 }
    );
  }
}
