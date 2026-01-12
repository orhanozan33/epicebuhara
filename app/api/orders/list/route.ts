import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { orders } from '@/src/db/schema';
import { eq, desc, ne } from 'drizzle-orm';

// Force dynamic rendering because we use request.url
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let ordersList: any[];
    if (status && status !== 'all') {
      if (status === 'SHIPPED') {
        ordersList = [];
      } else {
        ordersList = await db.select()
          .from(orders)
          .where(eq(orders.status, status))
          .orderBy(desc(orders.createdAt));
      }
    } else {
      // Tüm siparişler seçildiyse, SHIPPED hariç
      ordersList = await db.select()
        .from(orders)
        .where(ne(orders.status, 'SHIPPED'))
        .orderBy(desc(orders.createdAt));
    }

    return NextResponse.json({ orders: ordersList });
  } catch (error: any) {
    console.error('Error fetching orders list (Drizzle):', error);
    return NextResponse.json(
      { error: 'Siparişler getirilemedi', details: error?.message },
      { status: 500 }
    );
  }
}
