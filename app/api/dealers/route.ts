import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { dealers } from '@/src/db/schema';
import { desc } from 'drizzle-orm';

export async function GET() {
  try {
    const dealersList = await db.select()
      .from(dealers)
      .orderBy(desc(dealers.createdAt));

    return NextResponse.json(dealersList);
  } catch (error: any) {
    console.error('Error fetching dealers (Drizzle):', error);
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

    const newDealer = await db.insert(dealers).values({
      companyName: finalCompanyName,
      phone: phone?.trim() || null,
      email: email?.trim() || null,
      address: address?.trim() || null,
      taxNumber: taxNumber?.trim() || null,
      tpsNumber: tpsNumber?.trim() || null,
      tvqNumber: tvqNumber?.trim() || null,
      discount: discount ? discount.toString() : '0',
      isActive: true,
    }).returning();

    return NextResponse.json(newDealer[0], { status: 201 });
  } catch (error: any) {
    console.error('Error creating dealer (Drizzle):', error);
    return NextResponse.json(
      { error: 'Bayi oluşturulurken hata oluştu', details: error?.message },
      { status: 500 }
    );
  }
}
