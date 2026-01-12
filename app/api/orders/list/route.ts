import { NextResponse } from 'next/server';
import { getOrderRepository } from '@/src/db/index.typeorm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const orderRepo = await getOrderRepository();
    let orders: any[];

    if (status && status !== 'all') {
      if (status === 'SHIPPED') {
        orders = [];
      } else {
        orders = await orderRepo.find({
          where: { status },
          order: { createdAt: 'DESC' },
        });
      }
    } else {
      // Tüm siparişler seçildiyse, SHIPPED hariç
      orders = await orderRepo
        .createQueryBuilder('order')
        .where('order.status != :status', { status: 'SHIPPED' })
        .orderBy('order.createdAt', 'DESC')
        .getMany();
    }

    return NextResponse.json({ orders });
  } catch (error: any) {
    console.error('Error fetching orders list (TypeORM):', error);
    return NextResponse.json(
      { error: 'Siparişler getirilemedi', details: error?.message },
      { status: 500 }
    );
  }
}
