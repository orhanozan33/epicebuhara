/**
 * ZİPLİ AMBALAJ kategorisindeki tüm ürünlere 20'li kutu seçeneği ekler.
 * pack_size = 20, pack_label_tr = Kutu, pack_label_en = Box, pack_label_fr = Boîte
 *
 * Çalıştırma: npx tsx scripts/set-zipli-ambalaj-20-pack.ts
 */
import { db } from '../src/db';
import { categories, products } from '../src/db/schema';
import { eq } from 'drizzle-orm';

const CATEGORY_NAMES = ['ZİPLİ AMBALAJ', 'Zipli Ambalaj', 'ZIPLI AMBALAJ', 'zipli ambalaj'];

async function run() {
  console.log('ZİPLİ AMBALAJ kategorisi aranıyor...\n');

  const allCategories = await db.select().from(categories);
  const zipliCategory = allCategories.find(
    (c) => CATEGORY_NAMES.includes(c.name) || c.name.toUpperCase().replace(/İ/g, 'I') === 'ZIPLI AMBALAJ'
  );

  if (!zipliCategory) {
    console.log('Kategori bulunamadı. Mevcut kategoriler:', allCategories.map((c) => c.name).join(', '));
    process.exit(1);
  }

  console.log(`Kategori bulundu: "${zipliCategory.name}" (id: ${zipliCategory.id})\n`);

  const toUpdate = await db
    .select({ id: products.id, name: products.name, baseName: products.baseName, packSize: products.packSize })
    .from(products)
    .where(eq(products.categoryId, zipliCategory.id));

  console.log(`Güncellenecek ürün sayısı: ${toUpdate.length}\n`);

  if (toUpdate.length === 0) {
    console.log('Bu kategoride ürün yok.');
    process.exit(0);
  }

  const updated = await db
    .update(products)
    .set({
      packSize: 20,
      packLabelTr: 'Kutu',
      packLabelEn: 'Box',
      packLabelFr: 'Boîte',
    })
    .where(eq(products.categoryId, zipliCategory.id))
    .returning({ id: products.id, name: products.name });

  console.log(`✅ ${updated.length} ürün güncellendi (20'li kutu):`);
  updated.slice(0, 10).forEach((p) => console.log(`   - ${p.baseName || p.name}`));
  if (updated.length > 10) console.log(`   ... ve ${updated.length - 10} ürün daha.`);
  console.log('\nTamamlandı.');
}

run().catch((e) => {
  console.error('Hata:', e);
  process.exit(1);
}).finally(() => {
  process.exit(0);
});
