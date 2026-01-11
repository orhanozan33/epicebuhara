import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { orders } from '@/src/db/schema';
import { desc, eq, not } from 'drizzle-orm';

// Siparişleri listele
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let result;
    if (status && status !== 'all') {
      // Belirli bir durum seçildiyse, SHIPPED hariç tutulmaz (çünkü zaten seçili durum)
      // Ancak kullanıcı "SHIPPED" seçemeyecek, bu yüzden bu durumda boş dönelim
      if (status === 'SHIPPED') {
        result = await Promise.resolve([]);
      } else {
        result = await db
          .select()
          .from(orders)
          .where(eq(orders.status, status))
          .orderBy(desc(orders.createdAt));
      }
    } else {
      // Tüm siparişler seçildiyse, SHIPPED durumundakileri hariç tut
      result = await db
        .select()
        .from(orders)
        .where(not(eq(orders.status, 'SHIPPED')))
        .orderBy(desc(orders.createdAt));
    }

    return NextResponse.json({ orders: result });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Siparişler getirilirken hata oluştu' },
      { status: 500 }
    );
  }
}
