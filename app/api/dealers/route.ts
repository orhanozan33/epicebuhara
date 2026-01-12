import { NextResponse } from 'next/server';
import { getDealerRepository } from '@/src/db/index.typeorm';

export async function GET() {
  try {
    const dealerRepo = await getDealerRepository();
    const dealers = await dealerRepo.find({
      order: { createdAt: 'DESC' },
    });

    return NextResponse.json(dealers);
  } catch (error: any) {
    console.error('Error fetching dealers (TypeORM):', error);
    return NextResponse.json(
      { error: 'Bayiler getirilemedi', details: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companyName, phone, email, address, taxNumber, tpsNumber, tvqNumber, discount } = body;

    // Firma ismi opsiyonel - boş olsa bile oluşturulabilir
    const finalCompanyName = (companyName && companyName.trim()) 
      ? companyName.trim() 
      : 'İsimsiz Bayi';

    const dealerRepo = await getDealerRepository();
    const newDealer = dealerRepo.create({
      companyName: finalCompanyName,
      phone: phone?.trim() || null,
      email: email?.trim() || null,
      address: address?.trim() || null,
      taxNumber: taxNumber?.trim() || null,
      tpsNumber: tpsNumber?.trim() || null,
      tvqNumber: tvqNumber?.trim() || null,
      discount: discount ? discount.toString() : '0',
      isActive: true,
    });

    const savedDealer = await dealerRepo.save(newDealer);

    return NextResponse.json(savedDealer, { status: 201 });
  } catch (error: any) {
    console.error('Error creating dealer (TypeORM):', error);
    return NextResponse.json(
      { error: 'Bayi oluşturulurken hata oluştu', details: error?.message },
      { status: 500 }
    );
  }
}
