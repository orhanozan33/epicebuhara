import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { dealers } from '@/src/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'Geçersiz bayi ID' }, { status: 400 });
    }

    const dealer = await db.select()
      .from(dealers)
      .where(eq(dealers.id, id))
      .limit(1);

    if (dealer.length === 0) {
      return NextResponse.json({ error: 'Bayi bulunamadı' }, { status: 404 });
    }

    return NextResponse.json(dealer[0]);
  } catch (error: any) {
    console.error('Error fetching dealer (Drizzle):', error);
    return NextResponse.json(
      { error: 'Bayi getirilirken hata oluştu', details: error?.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    const body = await request.json();

    if (isNaN(id)) {
      return NextResponse.json({ error: 'Geçersiz bayi ID' }, { status: 400 });
    }

    const existingDealer = await db.select()
      .from(dealers)
      .where(eq(dealers.id, id))
      .limit(1);

    if (existingDealer.length === 0) {
      return NextResponse.json({ error: 'Bayi bulunamadı' }, { status: 404 });
    }

    const { companyName, phone, email, address, taxNumber, tpsNumber, tvqNumber, discount, isActive } = body;

    const updateData: any = {
      updatedAt: new Date(),
    };
    if (companyName !== undefined) updateData.companyName = companyName;
    if (phone !== undefined) updateData.phone = phone || null;
    if (email !== undefined) updateData.email = email || null;
    if (address !== undefined) updateData.address = address || null;
    if (taxNumber !== undefined) updateData.taxNumber = taxNumber || null;
    if (tpsNumber !== undefined) updateData.tpsNumber = tpsNumber || null;
    if (tvqNumber !== undefined) updateData.tvqNumber = tvqNumber || null;
    if (discount !== undefined) updateData.discount = discount || '0';
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedDealer = await db.update(dealers)
      .set(updateData)
      .where(eq(dealers.id, id))
      .returning();

    return NextResponse.json(updatedDealer[0]);
  } catch (error: any) {
    console.error('Error updating dealer (Drizzle):', error);
    return NextResponse.json(
      { error: 'Bayi güncellenirken hata oluştu', details: error?.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'Geçersiz bayi ID' }, { status: 400 });
    }

    await db.delete(dealers).where(eq(dealers.id, id));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting dealer (Drizzle):', error);
    return NextResponse.json(
      { error: 'Bayi silinirken hata oluştu', details: error?.message },
      { status: 500 }
    );
  }
}
