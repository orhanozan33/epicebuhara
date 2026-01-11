import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { orders, orderItems, products, dealerSales } from '@/src/db/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Tarih aralığı seçilmişse filtrele, yoksa tüm verileri getir
    let dateFilter = null;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Günün sonuna kadar
      dateFilter = {
        start,
        end,
      };
    }

    // Toplam satış ve sipariş sayısı
    let ordersQuery = db
      .select({
        totalOrders: sql<number>`count(*)::int`,
        orderRevenue: sql<number>`COALESCE(SUM(${orders.total})::numeric, 0)`,
        orderSubtotal: sql<number>`COALESCE(SUM(${orders.subtotal})::numeric, 0)`,
        orderTax: sql<number>`COALESCE(SUM(${orders.tax})::numeric, 0)`,
      })
      .from(orders);
    
    if (dateFilter) {
      ordersQuery = ordersQuery.where(
        and(
          gte(orders.createdAt, dateFilter.start),
          lte(orders.createdAt, dateFilter.end)
        )
      ) as any;
    }
    
    const ordersResult = await ordersQuery;
    const totalOrders = ordersResult[0]?.totalOrders || 0;
    const orderRevenue = parseFloat(ordersResult[0]?.orderRevenue?.toString() || '0');
    const orderSubtotal = parseFloat(ordersResult[0]?.orderSubtotal?.toString() || '0');
    // Orders'da tax = TPS + TVQ, TPS = subtotal * 0.05, TVQ = subtotal * 0.09975
    // Eğer tax/subtotal oranına göre hesaplayabiliriz veya direkt hesaplayabiliriz
    const orderTPS = orderSubtotal * 0.05;
    const orderTVQ = orderSubtotal * 0.09975;

    // Toplam satış (bayi satışları sayısı) ve bayi geliri
    let totalSalesQuery = db
      .select({
        totalSales: sql<number>`count(*)::int`,
        dealerRevenue: sql<number>`COALESCE(SUM(${dealerSales.total})::numeric, 0)`,
        dealerSubtotal: sql<number>`COALESCE(SUM(${dealerSales.subtotal})::numeric, 0)`,
        dealerDiscount: sql<number>`COALESCE(SUM(${dealerSales.discount})::numeric, 0)`,
      })
      .from(dealerSales);
    
    if (dateFilter) {
      totalSalesQuery = totalSalesQuery.where(
        and(
          gte(dealerSales.createdAt, dateFilter.start),
          lte(dealerSales.createdAt, dateFilter.end)
        )
      ) as any;
    }
    
    const totalSalesResult = await totalSalesQuery;
    const totalSales = totalSalesResult[0]?.totalSales || 0;
    const dealerRevenue = parseFloat(totalSalesResult[0]?.dealerRevenue?.toString() || '0');
    const dealerSubtotalRaw = parseFloat(totalSalesResult[0]?.dealerSubtotal?.toString() || '0');
    const dealerDiscountTotal = parseFloat(totalSalesResult[0]?.dealerDiscount?.toString() || '0');
    // Bayi satışlarında: afterDiscount = subtotal - discount, TPS = afterDiscount * 0.05, TVQ = afterDiscount * 0.09975
    const dealerAfterDiscount = dealerSubtotalRaw - dealerDiscountTotal;
    const dealerTPS = dealerAfterDiscount * 0.05;
    const dealerTVQ = dealerAfterDiscount * 0.09975;

    // Toplam alacak (borçlu bayi satışları)
    let dealerSalesQuery = db
      .select({
        totalAlacak: sql<number>`COALESCE(SUM(
          CASE 
            WHEN ${dealerSales.isPaid} = false THEN 
              ${dealerSales.total}::numeric - COALESCE(${dealerSales.paidAmount}::numeric, 0)
            ELSE 0
          END
        )::numeric, 0)`,
      })
      .from(dealerSales);
    
    if (dateFilter) {
      dealerSalesQuery = dealerSalesQuery.where(
        and(
          gte(dealerSales.createdAt, dateFilter.start),
          lte(dealerSales.createdAt, dateFilter.end)
        )
      ) as any;
    }
    
    const dealerSalesResult = await dealerSalesQuery;
    const totalAlacak = parseFloat(dealerSalesResult[0]?.totalAlacak?.toString() || '0');

    // Sipariş durumlarına göre gruplama
    let ordersByStatusQuery = db
      .select({
        status: orders.status,
        count: sql<number>`count(*)::int`,
      })
      .from(orders);
    
    if (dateFilter) {
      ordersByStatusQuery = ordersByStatusQuery.where(
        and(
          gte(orders.createdAt, dateFilter.start),
          lte(orders.createdAt, dateFilter.end)
        )
      ) as any;
    }
    
    const ordersByStatusResult = await ordersByStatusQuery.groupBy(orders.status);

    const ordersByStatus = ordersByStatusResult.map((item) => ({
      status: item.status || 'Bilinmiyor',
      count: item.count || 0,
    }));

    // En çok satan ürünler
    let topProductsQuery = db
      .select({
        productId: orderItems.productId,
        productName: products.name,
        totalQuantity: sql<number>`SUM(${orderItems.quantity})::int`,
        totalRevenue: sql<number>`SUM(${orderItems.total})::numeric`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .leftJoin(products, eq(orderItems.productId, products.id));
    
    if (dateFilter) {
      topProductsQuery = topProductsQuery.where(
        and(
          gte(orders.createdAt, dateFilter.start),
          lte(orders.createdAt, dateFilter.end)
        )
      ) as any;
    }
    
    const topProductsResult = await topProductsQuery
      .groupBy(orderItems.productId, products.name)
      .orderBy(sql`SUM(${orderItems.quantity}) DESC`)
      .limit(10);

    const topProducts = topProductsResult.map((item) => ({
      name: item.productName || 'Bilinmeyen Ürün',
      quantity: item.totalQuantity || 0,
      revenue: parseFloat(item.totalRevenue?.toString() || '0'),
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
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Raporlar getirilemedi' },
      { status: 500 }
    );
  }
}
