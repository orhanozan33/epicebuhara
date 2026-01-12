import { db } from '../src/db';
import { categories, products, companySettings } from '../src/db/schema';

async function testConnection() {
  try {
    console.log('Veritabanı bağlantısı test ediliyor...\n');
    
    // Test 1: Categories
    console.log('1. Categories tablosu test ediliyor...');
    const categoriesResult = await db.select().from(categories).limit(1);
    console.log('✓ Categories OK - Kayıt sayısı:', categoriesResult.length);
    
    // Test 2: Products
    console.log('\n2. Products tablosu test ediliyor...');
    const productsResult = await db.select().from(products).limit(1);
    console.log('✓ Products OK - Kayıt sayısı:', productsResult.length);
    
    // Test 3: Company Settings
    console.log('\n3. Company Settings tablosu test ediliyor...');
    const companyResult = await db.select().from(companySettings).limit(1);
    console.log('✓ Company Settings OK - Kayıt sayısı:', companyResult.length);
    
    console.log('\n✅ Tüm testler başarılı!');
    
  } catch (error: any) {
    console.error('\n❌ Hata oluştu:');
    console.error('Message:', error?.message);
    console.error('Code:', error?.code);
    console.error('Name:', error?.name);
    console.error('Cause:', error?.cause);
    console.error('Stack:', error?.stack);
    if (error?.query) {
      console.error('Query:', error.query);
    }
    if (error?.params) {
      console.error('Params:', error.params);
    }
    if (error?.cause) {
      console.error('Cause details:', {
        message: error.cause?.message,
        code: error.cause?.code,
        severity: error.cause?.severity,
      });
    }
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

testConnection();
