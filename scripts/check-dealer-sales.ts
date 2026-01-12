import { db } from '../src/db';
import { dealers, dealerSales, dealerSaleItems } from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function checkDealerSales() {
  try {
    console.log('Bayi satışları kontrol ediliyor...\n');
    
    // Tüm bayileri listele
    const allDealers = await db.select().from(dealers);
    console.log(`Toplam Bayi Sayısı: ${allDealers.length}\n`);
    
    // Her bayi için satış sayısını göster
    for (const dealer of allDealers) {
      const sales = await db.select()
        .from(dealerSales)
        .where(eq(dealerSales.dealerId, dealer.id));
      
      let totalItems = 0;
      for (const sale of sales) {
        const items = await db.select()
          .from(dealerSaleItems)
          .where(eq(dealerSaleItems.saleId, sale.id));
        totalItems += items.length;
      }
      
      console.log(`Bayi: ${dealer.companyName} (ID: ${dealer.id})`);
      console.log(`  - Satış Sayısı: ${sales.length}`);
      console.log(`  - Satış Öğesi Sayısı: ${totalItems}`);
      console.log('');
    }
    
    // Toplam istatistikler
    const allSales = await db.select().from(dealerSales);
    const allSaleItems = await db.select().from(dealerSaleItems);
    
    console.log('=== TOPLAM İSTATİSTİKLER ===');
    console.log(`Toplam Satış: ${allSales.length}`);
    console.log(`Toplam Satış Öğesi: ${allSaleItems.length}`);
    
  } catch (error) {
    console.error('❌ Hata oluştu:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

checkDealerSales();
