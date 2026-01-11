import { db } from '../src/db';
import { categories, products } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

async function seedData() {
  try {
    // Mevcut kategorileri çek
    let existingCategories = await db.select().from(categories);
    
    // Kategoriler yoksa ekle
    if (existingCategories.length === 0) {
      const categoryData = [
        { name: 'Kırmızı Biber', slug: 'kirmizi-biber', description: 'Kırmızı biber çeşitleri', order: 1 },
        { name: 'Karabiber', slug: 'karabiber', description: 'Karabiber çeşitleri', order: 2 },
        { name: 'Kırmızı Pul Biber', slug: 'kirmizi-pul-biber', description: 'Kırmızı pul biber çeşitleri', order: 3 },
        { name: 'Kimyon', slug: 'kimyon', description: 'Kimyon çeşitleri', order: 4 },
        { name: 'Zerdeçal', slug: 'zerdecal', description: 'Zerdeçal çeşitleri', order: 5 },
        { name: 'Kekik', slug: 'kekik', description: 'Kekik çeşitleri', order: 6 },
        { name: 'Nane', slug: 'nane', description: 'Nane çeşitleri', order: 7 },
        { name: 'Sumak', slug: 'sumak', description: 'Sumak çeşitleri', order: 8 },
      ];

      existingCategories = await db.insert(categories).values(categoryData).returning();
      console.log(`${existingCategories.length} kategori eklendi.`);
    } else {
      console.log(`${existingCategories.length} kategori zaten mevcut.`);
    }

    // Slug'a göre kategori ID'lerini bul
    const categoryMap: { [key: string]: number } = {};
    existingCategories.forEach((cat) => {
      categoryMap[cat.slug] = cat.id;
    });

    // Mevcut ürünleri kontrol et (slug'a göre)
    const existingProducts = await db.select({ slug: products.slug }).from(products);
    const existingSlugs = new Set(existingProducts.map(p => p.slug));

    // Sadece indirimli ürünleri ekle (test için)
    const discountedProducts = [
      {
        name: 'Özel Karışım Baharat Seti',
        baseName: 'Baharat Seti',
        slug: 'ozel-karisim-baharat-seti',
        sku: 'BS-001',
        description: 'Özel karışım baharat seti - İndirimli!',
        shortDescription: 'Özel baharat seti',
        price: '75.00',
        comparePrice: '120.00', // İndirimli: 75₺ (eski fiyat: 120₺)
        stock: 50,
        unit: '250g',
        categoryId: categoryMap['kirmizi-biber'] || existingCategories[0].id,
        isActive: true,
        isFeatured: true,
      },
      {
        name: 'Premium Organik Zerdeçal',
        baseName: 'Zerdeçal',
        slug: 'premium-organik-zerdecal',
        sku: 'ZD-002',
        description: 'Premium organik zerdeçal - Kampanyalı fiyat!',
        shortDescription: 'Premium zerdeçal',
        price: '55.00',
        comparePrice: '85.00', // İndirimli: 55₺ (eski fiyat: 85₺)
        stock: 60,
        unit: '100g',
        categoryId: categoryMap['zerdecal'] || existingCategories[4].id,
        isActive: true,
        isFeatured: true,
      },
      {
        name: 'Acı Kırmızı Biber Paketi (Özel)',
        baseName: 'Kırmızı Biber',
        slug: 'aci-kirmizi-biber-paketi-ozel',
        sku: 'KB-003',
        description: 'Acı kırmızı biber özel paket - Fırsat!',
        shortDescription: 'Özel paket acı biber',
        price: '35.00',
        comparePrice: '50.00', // İndirimli: 35₺ (eski fiyat: 50₺)
        stock: 80,
        unit: '100g',
        categoryId: categoryMap['kirmizi-biber'] || existingCategories[0].id,
        isActive: true,
        isFeatured: true,
      },
      {
        name: 'Doğal Kekik Paketi (Kampanya)',
        baseName: 'Kekik',
        slug: 'dogal-kekik-paketi-kampanya',
        sku: 'KK-002',
        description: 'Doğal kekik paketi - İndirimli!',
        shortDescription: 'Kampanyalı kekik',
        price: '40.00',
        comparePrice: '58.00', // İndirimli: 40₺ (eski fiyat: 58₺)
        stock: 70,
        unit: '100g',
        categoryId: categoryMap['kekik'] || existingCategories[5].id,
        isActive: true,
        isFeatured: true,
      },
    ];

    // Sadece yeni ürünleri filtrele (slug'a göre)
    const newProducts = discountedProducts.filter(
      (product) => !existingSlugs.has(product.slug)
    );

    if (newProducts.length > 0) {
      const insertedProducts = await db.insert(products).values(newProducts).returning();
      console.log(`${insertedProducts.length} indirimli ürün eklendi.`);
    } else {
      console.log('Tüm indirimli ürünler zaten mevcut.');
    }

    console.log('Veri ekleme işlemi tamamlandı!');
    process.exit(0);
  } catch (error) {
    console.error('Veri ekleme hatası:', error);
    process.exit(1);
  }
}

seedData();
