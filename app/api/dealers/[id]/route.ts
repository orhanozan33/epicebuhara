import { NextResponse } from 'next/server';
import { getDealerRepository } from '@/src/db/index.typeorm';

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

    const dealerRepo = await getDealerRepository();
    const dealer = await dealerRepo.findOne({ where: { id } });

    if (!dealer) {
      return NextResponse.json({ error: 'Bayi bulunamadı' }, { status: 404 });
    }

    return NextResponse.json(dealer);
  } catch (error: any) {
    console.error('Error fetching dealer (TypeORM):', error);
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

    const dealerRepo = await getDealerRepository();
    const dealer = await dealerRepo.findOne({ where: { id } });

    if (!dealer) {
      return NextResponse.json({ error: 'Bayi bulunamadı' }, { status: 404 });
    }

    const { companyName, phone, email, address, taxNumber, tpsNumber, tvqNumber, discount, isActive } = body;

    if (companyName !== undefined) dealer.companyName = companyName;
    if (phone !== undefined) dealer.phone = phone || null;
    if (email !== undefined) dealer.email = email || null;
    if (address !== undefined) dealer.address = address || null;
    if (taxNumber !== undefined) dealer.taxNumber = taxNumber || null;
    if (tpsNumber !== undefined) dealer.tpsNumber = tpsNumber || null;
    if (tvqNumber !== undefined) dealer.tvqNumber = tvqNumber || null;
    if (discount !== undefined) dealer.discount = discount || '0';
    if (isActive !== undefined) dealer.isActive = isActive;

    await dealerRepo.save(dealer);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating dealer (TypeORM):', error);
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

    const dealerRepo = await getDealerRepository();
    await dealerRepo.delete(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting dealer (TypeORM):', error);
    return NextResponse.json(
      { error: 'Bayi silinirken hata oluştu', details: error?.message },
      { status: 500 }
    );
  }
}
