import { NextResponse } from 'next/server';
import { getOrderRepository, getOrderItemRepository, getDealerSaleRepository, getProductRepository } from '@/src/db/index.typeorm';
import { MoreThanOrEqual, LessThanOrEqual } from 'typeorm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Tarih aralığı seçilmişse filtrele
    let dateFilter = null;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter = { start, end };
    }

    const orderRepo = await getOrderRepository();
    const dealerSaleRepo = await getDealerSaleRepository();

    // Toplam sipariş ve gelir
    let ordersQueryBuilder = orderRepo
      .createQueryBuilder('order')
      .select('COUNT(order.id)', 'totalOrders')
      .addSelect('COALESCE(SUM(CAST(order.total AS DECIMAL)), 0)', 'orderRevenue')
      .addSelect('COALESCE(SUM(CAST(order.subtotal AS DECIMAL)), 0)', 'orderSubtotal')
      .addSelect('COALESCE(SUM(CAST(order.tax AS DECIMAL)), 0)', 'orderTax');

    if (dateFilter) {
      ordersQueryBuilder = ordersQueryBuilder
        .where('order.createdAt >= :start', { start: dateFilter.start })
        .andWhere('order.createdAt <= :end', { end: dateFilter.end });
    }

    const ordersResult = await ordersQueryBuilder.getRawOne();
    const totalOrders = parseInt(ordersResult?.totalOrders || '0');
    const orderRevenue = parseFloat(ordersResult?.orderRevenue || '0');
    const orderSubtotal = parseFloat(ordersResult?.orderSubtotal || '0');
    const orderTPS = orderSubtotal * 0.05;
    const orderTVQ = orderSubtotal * 0.09975;

    // Toplam bayi satışları
    let dealerSalesQueryBuilder = dealerSaleRepo
      .createQueryBuilder('sale')
      .select('COUNT(sale.id)', 'totalSales')
      .addSelect('COALESCE(SUM(CAST(sale.total AS DECIMAL)), 0)', 'dealerRevenue')
      .addSelect('COALESCE(SUM(CAST(sale.subtotal AS DECIMAL)), 0)', 'dealerSubtotal')
      .addSelect('COALESCE(SUM(CAST(sale.discount AS DECIMAL)), 0)', 'dealerDiscount');

    if (dateFilter) {
      dealerSalesQueryBuilder = dealerSalesQueryBuilder
        .where('sale.createdAt >= :start', { start: dateFilter.start })
        .andWhere('sale.createdAt <= :end', { end: dateFilter.end });
    }

    const dealerSalesResult = await dealerSalesQueryBuilder.getRawOne();
    const totalSales = parseInt(dealerSalesResult?.totalSales || '0');
    const dealerRevenue = parseFloat(dealerSalesResult?.dealerRevenue || '0');
    const dealerSubtotalRaw = parseFloat(dealerSalesResult?.dealerSubtotal || '0');
    const dealerDiscountTotal = parseFloat(dealerSalesResult?.dealerDiscount || '0');
    const dealerAfterDiscount = dealerSubtotalRaw - dealerDiscountTotal;
    const dealerTPS = dealerAfterDiscount * 0.05;
    const dealerTVQ = dealerAfterDiscount * 0.09975;

    // Toplam alacak (borçlu satışlar)
    let alacakQueryBuilder = dealerSaleRepo
      .createQueryBuilder('sale')
      .select('COALESCE(SUM(CASE WHEN sale.isPaid = false THEN CAST(sale.total AS DECIMAL) - COALESCE(CAST(sale.paidAmount AS DECIMAL), 0) ELSE 0 END), 0)', 'totalAlacak');

    if (dateFilter) {
      alacakQueryBuilder = alacakQueryBuilder
        .where('sale.createdAt >= :start', { start: dateFilter.start })
        .andWhere('sale.createdAt <= :end', { end: dateFilter.end });
    }

    const alacakResult = await alacakQueryBuilder.getRawOne();
    const totalAlacak = parseFloat(alacakResult?.totalAlacak || '0');

    // Sipariş durumlarına göre gruplama
    let ordersByStatusQueryBuilder = orderRepo
      .createQueryBuilder('order')
      .select('order.status', 'status')
      .addSelect('COUNT(order.id)', 'count')
      .groupBy('order.status');

    if (dateFilter) {
      ordersByStatusQueryBuilder = ordersByStatusQueryBuilder
        .where('order.createdAt >= :start', { start: dateFilter.start })
        .andWhere('order.createdAt <= :end', { end: dateFilter.end });
    }

    const ordersByStatusResult = await ordersByStatusQueryBuilder.getRawMany();
    const ordersByStatus = ordersByStatusResult.map((item) => ({
      status: item.status || 'Bilinmiyor',
      count: parseInt(item.count || '0'),
    }));

    // En çok satan ürünler
    const orderItemRepo = await getOrderItemRepository();
    let topProductsQueryBuilder = orderItemRepo
      .createQueryBuilder('item')
      .innerJoin('item.order', 'order')
      .leftJoin('item.product', 'product')
      .select('item.productId', 'productId')
      .addSelect('product.name', 'productName')
      .addSelect('SUM(item.quantity)', 'totalQuantity')
      .addSelect('SUM(CAST(item.total AS DECIMAL))', 'totalRevenue')
      .groupBy('item.productId')
      .addGroupBy('product.name')
      .orderBy('SUM(item.quantity)', 'DESC')
      .limit(10);

    if (dateFilter) {
      topProductsQueryBuilder = topProductsQueryBuilder
        .where('order.createdAt >= :start', { start: dateFilter.start })
        .andWhere('order.createdAt <= :end', { end: dateFilter.end });
    }

    const topProductsResult = await topProductsQueryBuilder.getRawMany();
    const topProducts = topProductsResult.map((item) => ({
      name: item.productName || 'Bilinmeyen Ürün',
      quantity: parseInt(item.totalQuantity || '0'),
      revenue: parseFloat(item.totalRevenue || '0'),
    }));

    return NextResponse.json({
      totalSales,
      totalOrders,
      orderRevenue,
      dealerRevenue,
      orderSubtotal,
      dealerSubtotal: dealerSubtotalRaw,
      orderTPS,
      orderTVQ,
      dealerTPS,
      dealerTVQ,
      totalAlacak,
      ordersByStatus,
      topProducts,
    });
  } catch (error: any) {
    console.error('Error fetching reports (TypeORM):', error);
    return NextResponse.json(
      { error: 'Raporlar getirilemedi', details: error?.message },
      { status: 500 }
    );
  }
}
