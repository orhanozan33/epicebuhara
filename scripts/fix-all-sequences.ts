import { db } from '../src/db';
import { sql } from 'drizzle-orm';

async function fixAllSequences() {
  try {
    console.log('Tüm sequence\'ler düzeltiliyor...\n');
    
    // dealer_sale_items için
    const maxItemIdResult = await db.execute(sql`
      SELECT COALESCE(MAX(id), 0) as max_id FROM dealer_sale_items
    `);
    const maxItemId = maxItemIdResult[0]?.max_id || 0;
    console.log(`dealer_sale_items - Max ID: ${maxItemId}`);
    
    // dealer_sales için
    const maxSaleIdResult = await db.execute(sql`
      SELECT COALESCE(MAX(id), 0) as max_id FROM dealer_sales
    `);
    const maxSaleId = maxSaleIdResult[0]?.max_id || 0;
    console.log(`dealer_sales - Max ID: ${maxSaleId}`);
    console.log('');
    
    // Sequence'leri düzelt - setval kullan
    try {
      await db.execute(sql.raw(`
        SELECT setval('dealerSaleItems_id_seq', ${maxItemId}, true)
      `));
      console.log(`✅ dealerSaleItems_id_seq düzeltildi (${maxItemId})`);
    } catch (e: any) {
      console.log(`⚠ dealerSaleItems_id_seq düzeltilemedi:`, e.message);
    }
    
    try {
      await db.execute(sql.raw(`
        SELECT setval('dealerSales_id_seq', ${maxSaleId}, true)
      `));
      console.log(`✅ dealerSales_id_seq düzeltildi (${maxSaleId})`);
    } catch (e: any) {
      console.log(`⚠ dealerSales_id_seq düzeltilemedi:`, e.message);
    }
    
    console.log('\n✅ İşlem tamamlandı!');
    
  } catch (error) {
    console.error('❌ Hata oluştu:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

fixAllSequences();
