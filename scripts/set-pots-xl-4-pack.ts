/**
 * Pots XL kategorisindeki tüm ürünlere 4'lü kutu ayarlar.
 * pack_size = 4, pack_label_tr = Kutu, pack_label_en = Box, pack_label_fr = Boîte
 *
 * Çalıştırma: npx tsx scripts/set-pots-xl-4-pack.ts
 */
import { db } from '../src/db';
import { categories, products } from '../src/db/schema';
import { eq } from 'drizzle-orm';

const CATEGORY_NAMES = ['Pots XL', 'POTS XL', 'pots xl', 'XL PETLER', 'XL Petler', 'xl petler'];

function normalize(name: string) {
  return name.toUpperCase().replace(/İ/g, 'I').trim();
}

async function run() {
  console.log('Pots XL kategorisi aranıyor...\n');

  const allCategories = await db.select().from(categories);
  const potsXlCategory = allCategories.find(
    (c) =>
      CATEGORY_NAMES.includes(c.name) ||
      normalize(c.name) === 'POTS XL' ||
      normalize(c.name) === 'XL PETLER'
  );

  if (!potsXlCategory) {
    console.log('Kategori bulunamadı. Mevcut kategoriler:', allCategories.map((c) => c.name).join(', '));
    process.exit(1);
  }

  console.log(`Kategori bulundu: "${potsXlCategory.name}" (id: ${potsXlCategory.id})\n`);

  const toUpdate = await db
    .select({ id: products.id, name: products.name, baseName: products.baseName, packSize: products.packSize })
    .from(products)
    .where(eq(products.categoryId, potsXlCategory.id));

  console.log(`Güncellenecek ürün sayısı: ${toUpdate.length}\n`);

  if (toUpdate.length === 0) {
    console.log('Bu kategoride ürün yok.');
    process.exit(0);
  }

  const updated = await db
    .update(products)
    .set({
      packSize: 4,
      packLabelTr: 'Kutu',
      packLabelEn: 'Box',
      packLabelFr: 'Boîte',
    })
    .where(eq(products.categoryId, potsXlCategory.id))
    .returning({ id: products.id, name: products.name, baseName: products.baseName });

  console.log(`✅ ${updated.length} ürün güncellendi (4'lü kutu):`);
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
