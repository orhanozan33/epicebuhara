import { db } from '../src/db';
import { sql } from 'drizzle-orm';

async function fixSequence() {
  try {
    console.log('dealer_sales sequence kontrol ediliyor...');
    
    // Mevcut sequence'leri bul
    const sequences = await db.execute(sql`
      SELECT sequence_name 
      FROM information_schema.sequences 
      WHERE sequence_name LIKE '%dealer%' OR sequence_name LIKE '%sale%'
      ORDER BY sequence_name
    `);
    
    console.log('Bulunan sequence\'ler:', sequences);
    
    // dealer_sales tablosunun max ID'sini al
    const maxIdResult = await db.execute(sql`
      SELECT COALESCE(MAX(id), 0) as max_id FROM dealer_sales
    `);
    
    const maxId = maxIdResult[0]?.max_id || 0;
    console.log('Mevcut max ID:', maxId);
    
    // Olası sequence isimlerini dene
    const possibleNames = [
      'dealer_sales_id_seq',
      'dealerSales_id_seq',
      'dealer_sales_dealer_id_seq',
    ];
    
    for (const seqName of possibleNames) {
      try {
        const result = await db.execute(sql.raw(`
          SELECT setval('${seqName}', ${maxId + 1}, false)
        `));
        console.log(`✅ Sequence ${seqName} düzeltildi!`);
        console.log('Result:', result);
        break;
      } catch (e: any) {
        if (!e.message.includes('does not exist')) {
          console.log(`⚠ ${seqName} bulunamadı, diğerini deniyorum...`);
        }
      }
    }
    
    // Alternatif: Doğrudan ALTER SEQUENCE dene
    try {
      const alterResult = await db.execute(sql.raw(`
        ALTER SEQUENCE IF EXISTS dealer_sales_id_seq RESTART WITH ${maxId + 1}
      `));
      console.log('✅ ALTER SEQUENCE başarılı!');
    } catch (e: any) {
      console.log('⚠ ALTER SEQUENCE başarısız:', e.message);
    }
    
  } catch (error: any) {
    console.error('❌ Hata oluştu:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

fixSequence();
