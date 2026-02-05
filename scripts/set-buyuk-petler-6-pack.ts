/**
 * BÜYÜK PETLER kategorisindeki tüm ürünlere 6'lı kutu ayarlar.
 * pack_size = 6, pack_label_tr = Kutu, pack_label_en = Box, pack_label_fr = Boîte
 *
 * Çalıştırma: npx tsx scripts/set-buyuk-petler-6-pack.ts
 */
import { db } from '../src/db';
import { categories, products } from '../src/db/schema';
import { eq } from 'drizzle-orm';

const CATEGORY_NAMES = ['BÜYÜK PETLER', 'Büyük Petler', 'büyük petler', 'BUYUK PETLER'];

async function run() {
  console.log('BÜYÜK PETLER kategorisi aranıyor...\n');

  const allCategories = await db.select().from(categories);
  const buyukCategory = allCategories.find(
    (c) =>
      CATEGORY_NAMES.includes(c.name) ||
      c.name.toUpperCase().replace(/İ/g, 'I').replace(/Ü/g, 'U') === 'BUYUK PETLER'
  );

  if (!buyukCategory) {
    console.log('Kategori bulunamadı. Mevcut kategoriler:', allCategories.map((c) => c.name).join(', '));
    process.exit(1);
  }

  console.log(`Kategori bulundu: "${buyukCategory.name}" (id: ${buyukCategory.id})\n`);

  const toUpdate = await db
    .select({ id: products.id, name: products.name, baseName: products.baseName, packSize: products.packSize })
    .from(products)
    .where(eq(products.categoryId, buyukCategory.id));

  console.log(`Güncellenecek ürün sayısı: ${toUpdate.length}\n`);

  if (toUpdate.length === 0) {
    console.log('Bu kategoride ürün yok.');
    process.exit(0);
  }

  const updated = await db
    .update(products)
    .set({
      packSize: 6,
      packLabelTr: 'Kutu',
      packLabelEn: 'Box',
      packLabelFr: 'Boîte',
    })
    .where(eq(products.categoryId, buyukCategory.id))
    .returning({ id: products.id, name: products.name, baseName: products.baseName });

  console.log(`✅ ${updated.length} ürün güncellendi (6'lı kutu):`);
  updated.slice(0, 15).forEach((p) => console.log(`   - ${p.baseName || p.name}`));
  if (updated.length > 15) console.log(`   ... ve ${updated.length - 15} ürün daha.`);
  console.log('\nTamamlandı.');
}

run()
  .catch((e) => {
    console.error('Hata:', e);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
