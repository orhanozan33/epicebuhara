import { db } from '../src/db';
import { products } from '../src/db/schema';
import { eq, sql, or, isNull } from 'drizzle-orm';

async function activateAllProducts() {
  try {
    console.log('Pasif ürünler aktif ediliyor...');
    
    // Önce pasif ürün sayısını kontrol et
    const inactiveProducts = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(or(eq(products.isActive, false), isNull(products.isActive)));
    
    const inactiveCount = inactiveProducts[0]?.count || 0;
    console.log(`${inactiveCount} pasif ürün bulundu.`);
    
    if (inactiveCount === 0) {
      console.log('Aktif edilecek pasif ürün bulunamadı.');
      process.exit(0);
    }
    
    // Tüm pasif ürünleri aktif yap
    await db
      .update(products)
      .set({
        isActive: true,
        updatedAt: new Date(),
      })
      .where(or(eq(products.isActive, false), isNull(products.isActive)));
    
    console.log(`✅ ${inactiveCount} ürün başarıyla aktif edildi!`);
    process.exit(0);
  } catch (error) {
    console.error('Hata:', error);
    process.exit(1);
  }
}

activateAllProducts();
