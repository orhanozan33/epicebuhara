// Test script for company_settings API
// Bu script'i çalıştırmak için: npx tsx test_company_settings_api.ts

import { db } from './src/db';
import { companySettings } from './src/db/schema';

async function testCompanySettings() {
  try {
    console.log('Testing company_settings table...');
    
    // Tabloyu kontrol et
    const result = await db.select().from(companySettings).limit(1);
    
    console.log('✅ Query başarılı!');
    console.log('Result:', result);
    
    if (result.length === 0) {
      console.log('⚠️ Tablo boş - bu normal, yeni kayıt oluşturulabilir');
    }
    
  } catch (error: any) {
    console.error('❌ HATA!');
    console.error('Error message:', error?.message);
    console.error('Error code:', error?.code);
    console.error('Error name:', error?.name);
    console.error('Error stack:', error?.stack);
    console.error('Error query:', error?.query);
    
    if (error?.code === '42703') {
      console.error('🔴 KOLON BULUNAMIYOR! Migration uygulanmamış olabilir.');
    } else if (error?.code === '42P01') {
      console.error('🔴 TABLO BULUNAMIYOR! company_settings tablosu yok.');
    }
  }
}

testCompanySettings();
