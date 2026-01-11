import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { dealers } from '@/src/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const allDealers = await db
      .select()
      .from(dealers)
      .orderBy(desc(dealers.createdAt));

    return NextResponse.json(allDealers || []);
  } catch (error: any) {
    console.error('Error fetching dealers:', error);
    console.error('Error details:', error?.message, error?.stack);
    return NextResponse.json(
      { error: 'Bayiler getirilemedi', details: error?.message || 'Bilinmeyen hata' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('POST /api/dealers - Request body:', body);
    
    const { companyName, phone, email, address, taxNumber, tpsNumber, tvqNumber, discount } = body;

    // Firma ismi opsiyonel - boş olsa bile oluşturulabilir
    // Eğer boşsa varsayılan bir isim ver
    const finalCompanyName = (companyName && companyName.trim()) 
      ? companyName.trim() 
      : 'İsimsiz Bayi';

    const insertData = {
      companyName: finalCompanyName,
      phone: phone?.trim() || null,
      email: email?.trim() || null,
      address: address?.trim() || null,
      taxNumber: taxNumber?.trim() || null,
      tpsNumber: tpsNumber?.trim() || null,
      tvqNumber: tvqNumber?.trim() || null,
      discount: discount ? discount.toString() : '0',
      isActive: true,
    };

    console.log('Inserting dealer with data:', insertData);

    const [newDealer] = await db
      .insert(dealers)
      .values(insertData)
      .returning();

    console.log('Dealer inserted:', newDealer);

    if (!newDealer) {
      throw new Error('Bayi oluşturulamadı - returning boş geldi');
    }

    return NextResponse.json(newDealer);
  } catch (error: any) {
    console.error('Error creating dealer:', error);
    console.error('Error name:', error?.name);
    console.error('Error message:', error?.message);
    console.error('Error code:', error?.code);
    console.error('Error stack:', error?.stack);
    console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    return NextResponse.json(
      { 
        error: 'Bayi oluşturulurken hata oluştu', 
        details: error?.message || 'Bilinmeyen hata',
        code: error?.code,
        name: error?.name,
      },
      { status: 500 }
    );
  }
}
