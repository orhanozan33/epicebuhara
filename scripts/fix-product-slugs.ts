import { db } from '../src/db';
import { products } from '../src/db/schema';
import { isNull, eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

// Slug oluşturma fonksiyonu - baseName + weight + unit
function generateSlug(product: any): string {
  // baseName varsa onu kullan, yoksa name'den gramaj bilgisini çıkar
  let slugBase = (product.baseName || product.name).toLowerCase().trim();
  if (!product.baseName) {
    slugBase = slugBase.replace(/\s*\d+(\.\d+)?\s*(gr|g|kg|lt|Gr|G|Kg|Kg)\s*$/i, '').trim();
  }
  
  // Weight ve unit bilgisini slug'a ekle
  let slug = slugBase;
  if (product.weight && product.unit) {
    const weightNum = parseFloat(product.weight.toString());
    const weightStr = weightNum % 1 === 0 ? weightNum.toString() : weightNum.toFixed(2);
    const unitLower = product.unit.toLowerCase();
    slug = `${slugBase}-${weightStr}-${unitLower}`;
  }
  
  // Slug'ı temizle
  return slug
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function fixProductSlugs() {
  try {
    // Tüm ürünleri al
    const allProducts = await db.select().from(products);
    
    console.log(`Toplam ${allProducts.length} ürün bulundu`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    // Her ürün için slug kontrolü yap
    for (const product of allProducts) {
      // Her zaman slug'ı güncelle (gramaj bilgisi eklemek için)
      const newSlug = generateSlug(product);
      
      // Eğer slug yoksa veya mevcut slug yanlışsa güncelle
      if (!product.slug || product.slug.trim() === '' || product.slug !== newSlug) {
        
        // Benzersiz slug oluştur (varsa ID ekle)
        let uniqueSlug = newSlug;
        let counter = 1;
        
        // Aynı slug'a sahip başka ürün var mı kontrol et
        while (true) {
          const existingProduct = await db
            .select()
            .from(products)
            .where(eq(products.slug, uniqueSlug))
            .limit(1);
          
          if (existingProduct.length === 0 || existingProduct[0].id === product.id) {
            break; // Slug benzersiz, kullanabiliriz
          }
          
          // Slug benzersiz değilse ID ekle
          uniqueSlug = `${newSlug}-${product.id}`;
          counter++;
        }
        
        // Slug'ı güncelle
        await db
          .update(products)
          .set({ slug: uniqueSlug, updatedAt: new Date() })
          .where(eq(products.id, product.id));
        
        console.log(`✓ Ürün ID ${product.id}: "${product.name}" -> slug: "${uniqueSlug}"`);
        updatedCount++;
      } else {
        skippedCount++;
      }
    }
    
    console.log(`\n✓ ${updatedCount} ürünün slug'ı oluşturuldu/güncellendi`);
    console.log(`✓ ${skippedCount} ürün zaten slug'a sahipti`);
    console.log('Slug güncelleme işlemi tamamlandı!');
    
    process.exit(0);
  } catch (error) {
    console.error('Slug güncelleme hatası:', error);
    process.exit(1);
  }
}

fixProductSlugs();
