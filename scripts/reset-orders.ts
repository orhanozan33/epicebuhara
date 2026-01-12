import { db } from '../src/db';
import { orders, orderItems, notifications, dealers, dealerSales, dealerSaleItems } from '../src/db/schema';
import { isNotNull, eq } from 'drizzle-orm';

async function resetAllOrders() {
  try {
    console.log('Sipariş kayıtları siliniyor...');
    
    // 1. Önce sipariş öğelerini sil
    await db.delete(orderItems);
    console.log('✓ order_items temizlendi');
    
    // 2. Siparişlere ait bildirimleri sil
    await db.delete(notifications).where(isNotNull(notifications.orderId));
    console.log('✓ Sipariş bildirimleri temizlendi');
    
    // 3. Son olarak siparişleri sil
    await db.delete(orders);
    console.log('✓ orders temizlendi');
    
    // 4. "Sipariş" bayisini bul
    const siparisDealer = await db.select()
      .from(dealers)
      .where(eq(dealers.companyName, 'Sipariş'))
      .limit(1);
    
    if (siparisDealer.length > 0) {
      const dealerId = siparisDealer[0].id;
      console.log(`\n"Sipariş" bayisi bulundu (ID: ${dealerId})`);
      
      // Önce diğer bayilerin satış sayısını kontrol et
      const allDealers = await db.select().from(dealers);
      const allSales = await db.select().from(dealerSales);
      console.log(`\n⚠ UYARI: Toplam ${allDealers.length} bayi ve ${allSales.length} satış bulundu`);
      
      // 5. "Sipariş" bayisinin tüm satışlarını bul
      const siparisSales = await db.select()
        .from(dealerSales)
        .where(eq(dealerSales.dealerId, dealerId));
      
      console.log(`"Sipariş" bayisinde ${siparisSales.length} satış bulundu`);
      console.log(`Diğer bayilerde ${allSales.length - siparisSales.length} satış bulundu`);
      
      if (siparisSales.length > 0) {
        // 6. Önce satış öğelerini sil (foreign key nedeniyle)
        const saleIds = siparisSales.map(sale => sale.id);
        console.log(`\nSilinecek satış ID'leri: ${saleIds.join(', ')}`);
        
        for (const saleId of saleIds) {
          await db.delete(dealerSaleItems).where(eq(dealerSaleItems.saleId, saleId));
        }
        console.log('✓ "Sipariş" bayisi satış öğeleri temizlendi');
        
        // 7. Sonra satışları sil - SADECE "Sipariş" bayisinin satışları
        await db.delete(dealerSales).where(eq(dealerSales.dealerId, dealerId));
        console.log('✓ "Sipariş" bayisi satışları temizlendi');
        
        // Kontrol: Diğer bayilerin satışları hala var mı?
        const remainingSales = await db.select().from(dealerSales);
        console.log(`\nKalan toplam satış sayısı: ${remainingSales.length}`);
        console.log(`(Beklenen: ${allSales.length - siparisSales.length})`);
      } else {
        console.log('✓ "Sipariş" bayisinde satış bulunamadı');
      }
    } else {
      console.log('⚠ "Sipariş" bayisi bulunamadı');
    }
    
    console.log('\n✅ Tüm sipariş kayıtları ve "Sipariş" bayisi satışları başarıyla silindi!');
    
    // Kontrol
    const ordersCount = await db.select().from(orders);
    const itemsCount = await db.select().from(orderItems);
    console.log(`\nKalan kayıt sayıları:`);
    console.log(`- Orders: ${ordersCount.length}`);
    console.log(`- Order Items: ${itemsCount.length}`);
    
    if (siparisDealer.length > 0) {
      const remainingSales = await db.select()
        .from(dealerSales)
        .where(eq(dealerSales.dealerId, siparisDealer[0].id));
      console.log(`- "Sipariş" Bayisi Satışları: ${remainingSales.length}`);
    }
    
  } catch (error) {
    console.error('❌ Hata oluştu:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

resetAllOrders();
