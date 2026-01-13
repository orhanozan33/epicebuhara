import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { orders, dealerSales, orderItems, dealerSaleItems, products } from '@/src/db/schema';
import { eq, gte, lte, and, sql, desc, inArray } from 'drizzle-orm';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

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

    // Toplam sipariş ve gelir
    const ordersQuery = db
      .select({
        totalOrders: sql<number>`COUNT(${orders.id})::int`,
        orderRevenue: sql<number>`COALESCE(SUM(CAST(${orders.total} AS DECIMAL)), 0)`,
        orderSubtotal: sql<number>`COALESCE(SUM(CAST(${orders.subtotal} AS DECIMAL)), 0)`,
        orderTax: sql<number>`COALESCE(SUM(CAST(${orders.tax} AS DECIMAL)), 0)`,
      })
      .from(orders);

    const ordersResult = dateFilter
      ? await ordersQuery.where(
          and(
            gte(orders.createdAt, dateFilter.start),
            lte(orders.createdAt, dateFilter.end)
          )
        )
      : await ordersQuery;
    const totalOrders = ordersResult[0]?.totalOrders || 0;
    const orderRevenue = parseFloat(ordersResult[0]?.orderRevenue?.toString() || '0');
    const orderSubtotal = parseFloat(ordersResult[0]?.orderSubtotal?.toString() || '0');
    const orderTPS = orderSubtotal * 0.05;
    const orderTVQ = orderSubtotal * 0.09975;

    // Toplam bayi satışları
    const dealerSalesQuery = db
      .select({
        totalSales: sql<number>`COUNT(${dealerSales.id})::int`,
        dealerRevenue: sql<number>`COALESCE(SUM(CAST(${dealerSales.total} AS DECIMAL)), 0)`,
        dealerSubtotal: sql<number>`COALESCE(SUM(CAST(${dealerSales.subtotal} AS DECIMAL)), 0)`,
        dealerDiscount: sql<number>`COALESCE(SUM(CAST(${dealerSales.discount} AS DECIMAL)), 0)`,
      })
      .from(dealerSales);

    const dealerSalesResult = dateFilter
      ? await dealerSalesQuery.where(
          and(
            gte(dealerSales.createdAt, dateFilter.start),
            lte(dealerSales.createdAt, dateFilter.end)
          )
        )
      : await dealerSalesQuery;
    const totalSales = dealerSalesResult[0]?.totalSales || 0;
    const dealerRevenue = parseFloat(dealerSalesResult[0]?.dealerRevenue?.toString() || '0');
    const dealerSubtotalRaw = parseFloat(dealerSalesResult[0]?.dealerSubtotal?.toString() || '0');
    const dealerDiscountTotal = parseFloat(dealerSalesResult[0]?.dealerDiscount?.toString() || '0');
    const dealerAfterDiscount = dealerSubtotalRaw - dealerDiscountTotal;
    const dealerTPS = dealerAfterDiscount * 0.05;
    const dealerTVQ = (dealerAfterDiscount + dealerTPS) * 0.09975; // Quebec: TVQ, TPS dahil fiyat üzerinden

    // Toplam alacak (borçlu satışlar)
    const alacakQuery = db
      .select({
        totalAlacak: sql<number>`COALESCE(SUM(CASE WHEN ${dealerSales.isPaid} = false THEN CAST(${dealerSales.total} AS DECIMAL) - COALESCE(CAST(${dealerSales.paidAmount} AS DECIMAL), 0) ELSE 0 END), 0)`,
      })
      .from(dealerSales);

    const alacakResult = dateFilter
      ? await alacakQuery.where(
          and(
            gte(dealerSales.createdAt, dateFilter.start),
            lte(dealerSales.createdAt, dateFilter.end)
          )
        )
      : await alacakQuery;
    const totalAlacak = parseFloat(alacakResult[0]?.totalAlacak?.toString() || '0');

    // Sipariş durumlarına göre gruplama
    const ordersByStatusQuery = db
      .select({
        status: orders.status,
        count: sql<number>`COUNT(${orders.id})::int`,
      })
      .from(orders)
      .groupBy(orders.status);

    const ordersByStatusResult = dateFilter
      ? await ordersByStatusQuery.where(
          and(
            gte(orders.createdAt, dateFilter.start),
            lte(orders.createdAt, dateFilter.end)
          )
        )
      : await ordersByStatusQuery;
    const ordersByStatus = ordersByStatusResult.map((item) => ({
      status: item.status || 'Bilinmiyor',
      count: item.count || 0,
    }));

    // En çok satan ürünler (hem order_items hem dealer_sale_items'tan)
    // Önce order_items'tan
    const orderItemsQuery = db
      .select({
        productId: orderItems.productId,
        totalQuantity: sql<number>`SUM(${orderItems.quantity})::int`,
        totalRevenue: sql<number>`SUM(CAST(${orderItems.total} AS DECIMAL))`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .groupBy(orderItems.productId);

    const orderItemsResult = dateFilter
      ? await orderItemsQuery.where(
          and(
            gte(orders.createdAt, dateFilter.start),
            lte(orders.createdAt, dateFilter.end)
          )
        )
      : await orderItemsQuery;

    // dealer_sale_items'tan
    const dealerItemsQuery = db
      .select({
        productId: dealerSaleItems.productId,
        totalQuantity: sql<number>`SUM(${dealerSaleItems.quantity})::int`,
        totalRevenue: sql<number>`SUM(CAST(${dealerSaleItems.total} AS DECIMAL))`,
      })
      .from(dealerSaleItems)
      .innerJoin(dealerSales, eq(dealerSaleItems.saleId, dealerSales.id))
      .groupBy(dealerSaleItems.productId);

    const dealerItemsResult = dateFilter
      ? await dealerItemsQuery.where(
          and(
            gte(dealerSales.createdAt, dateFilter.start),
            lte(dealerSales.createdAt, dateFilter.end)
          )
        )
      : await dealerItemsQuery;

    // Her iki kaynaktan gelen verileri birleştir
    const productStats = new Map<number, { quantity: number; revenue: number }>();
    
    orderItemsResult.forEach((item) => {
      if (item.productId) {
        const existing = productStats.get(item.productId) || { quantity: 0, revenue: 0 };
        productStats.set(item.productId, {
          quantity: existing.quantity + (item.totalQuantity || 0),
          revenue: existing.revenue + parseFloat(item.totalRevenue?.toString() || '0'),
        });
      }
    });

    dealerItemsResult.forEach((item) => {
      if (item.productId) {
        const existing = productStats.get(item.productId) || { quantity: 0, revenue: 0 };
        productStats.set(item.productId, {
          quantity: existing.quantity + (item.totalQuantity || 0),
          revenue: existing.revenue + parseFloat(item.totalRevenue?.toString() || '0'),
        });
      }
    });

    // Ürün isimlerini getir
    const productIds = Array.from(productStats.keys());
    let productList: { id: number; name: string }[] = [];
    if (productIds.length > 0) {
      productList = await db
        .select({
          id: products.id,
          name: products.name,
        })
        .from(products)
        .where(inArray(products.id, productIds));
    }

    // Toplam ürünleri sırala ve ilk 10'unu al
    const topProducts = Array.from(productStats.entries())
      .map(([productId, stats]) => {
        const product = productList.find(p => p.id === productId);
        return {
          name: product?.name || 'Bilinmeyen Ürün',
          quantity: stats.quantity,
          revenue: stats.revenue,
        };
      })
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

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
    console.error('Error fetching reports (Drizzle):', error);
    return NextResponse.json(
      { error: 'Raporlar getirilemedi', details: error?.message },
      { status: 500 }
    );
  }
}
