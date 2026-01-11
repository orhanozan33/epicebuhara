import { db } from '../src/db';
import { products, categories } from '../src/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

async function fixCategoryIds() {
  try {
    // Tüm aktif ürünleri ve kategorileri al
    const allProducts = await db.select().from(products).where(eq(products.isActive, true));
    const allCategories = await db.select().from(categories).where(eq(categories.isActive, true));
    
    console.log(`Toplam ${allProducts.length} aktif ürün bulundu`);
    console.log(`Toplam ${allCategories.length} aktif kategori bulundu`);
    
    // Kategori adına göre kategori ID'lerini eşleştir
    const categoryMap: { [key: string]: number } = {};
    allCategories.forEach(cat => {
      categoryMap[cat.name.toLowerCase()] = cat.id;
      categoryMap[cat.slug] = cat.id;
    });
    
    let updatedCount = 0;
    let nullCategoryCount = 0;
    
    // Ürünleri kontrol et ve gerekirse kategori ID'sini güncelle
    for (const product of allProducts) {
      if (!product.categoryId) {
        nullCategoryCount++;
        // Ürün adından kategori bulmayı dene
        const productNameLower = product.name.toLowerCase();
        let foundCategoryId: number | null = null;
        
        // Kategori adlarını kontrol et
        for (const [catName, catId] of Object.entries(categoryMap)) {
          if (productNameLower.includes(catName) || productNameLower.includes(catName.replace('-', ' '))) {
            foundCategoryId = catId;
            break;
          }
        }
        
        // Bulunamazsa ilk kategoriyi ata
        if (!foundCategoryId && allCategories.length > 0) {
          foundCategoryId = allCategories[0].id;
        }
        
        if (foundCategoryId) {
          await db
            .update(products)
            .set({ categoryId: foundCategoryId })
            .where(eq(products.id, product.id));
          updatedCount++;
        }
      }
    }
    
    console.log(`${nullCategoryCount} ürünün kategori ID'si yoktu`);
    console.log(`${updatedCount} ürünün kategori ID'si güncellendi`);
    console.log('Kategori ID güncelleme işlemi tamamlandı!');
    
    process.exit(0);
  } catch (error) {
    console.error('Kategori ID güncelleme hatası:', error);
    process.exit(1);
  }
}

fixCategoryIds();
