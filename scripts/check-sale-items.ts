import { db } from '../src/db';
import { dealerSales, dealerSaleItems } from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function checkSaleItems() {
  try {
    const saleNumber = 'SAL-000019';
    
    console.log(`Satış ${saleNumber} kontrol ediliyor...\n`);
    
    // Satışı bul
    const sale = await db.select()
      .from(dealerSales)
      .where(eq(dealerSales.saleNumber, saleNumber))
      .limit(1);
    
    if (sale.length === 0) {
      console.log(`❌ Satış bulunamadı: ${saleNumber}`);
      process.exit(1);
    }
    
    console.log(`✅ Satış bulundu:`);
    console.log(`   ID: ${sale[0].id}`);
    console.log(`   Satış No: ${sale[0].saleNumber}`);
    console.log(`   Toplam: $${sale[0].total}`);
    console.log(`   Oluşturulma: ${sale[0].createdAt}\n`);
    
    // Items'ları bul
    const items = await db.select()
      .from(dealerSaleItems)
      .where(eq(dealerSaleItems.saleId, sale[0].id));
    
    console.log(`📦 Satış öğeleri:`);
    console.log(`   Toplam öğe sayısı: ${items.length}\n`);
    
    if (items.length === 0) {
      console.log(`⚠️  UYARI: Bu satış için hiç öğe bulunamadı!`);
    } else {
      items.forEach((item, index) => {
        console.log(`   ${index + 1}. Ürün ID: ${item.productId}, Miktar: ${item.quantity}, Fiyat: $${item.price}, Toplam: $${item.total}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Hata oluştu:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

checkSaleItems();
