import { db } from '../src/db';
import { dealerSales, dealerSaleItems, products } from '../src/db/schema';
import { eq, sql } from 'drizzle-orm';

async function fixSale19() {
  try {
    const saleNumber = 'SAL-000019';
    
    console.log(`Satış ${saleNumber} düzeltiliyor...\n`);
    
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
    console.log(`   Toplam: $${sale[0].total}`);
    console.log(`   Subtotal: $${sale[0].subtotal}\n`);
    
    // Items'ları kontrol et
    const existingItems = await db.select()
      .from(dealerSaleItems)
      .where(eq(dealerSaleItems.saleId, sale[0].id));
    
    if (existingItems.length > 0) {
      console.log(`✅ Bu satış için zaten ${existingItems.length} öğe var.`);
      process.exit(0);
    }
    
    // Toplam tutardan ürünleri tahmin etmek zor, bu yüzden kullanıcıdan bilgi almak gerekiyor
    // Ama şimdilik satışı silip yeniden oluşturmasını söyleyebiliriz
    
    console.log(`⚠️  Bu satış için öğe bulunamadı.`);
    console.log(`   Toplam: $${sale[0].total}`);
    console.log(`   Subtotal: $${sale[0].subtotal}`);
    console.log(`\n💡 Çözüm:`);
    console.log(`   1. Bu satışı silin`);
    console.log(`   2. Aynı ürünlerle yeni bir satış oluşturun`);
    console.log(`   3. Yeni API kodu items'ları otomatik olarak kaydedecek\n`);
    
    // İsteğe bağlı: Satışı sil
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question('Bu satışı silmek ister misiniz? (e/h): ', async (answer: string) => {
      if (answer.toLowerCase() === 'e' || answer.toLowerCase() === 'evet') {
        try {
          await db.delete(dealerSales).where(eq(dealerSales.id, sale[0].id));
          console.log(`✅ Satış silindi: ${saleNumber}`);
        } catch (error) {
          console.error('❌ Satış silinirken hata:', error);
        }
      } else {
        console.log('Satış silinmedi.');
      }
      readline.close();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Hata oluştu:', error);
    throw error;
  }
}

fixSale19();
