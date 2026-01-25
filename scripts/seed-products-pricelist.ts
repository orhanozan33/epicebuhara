#!/usr/bin/env tsx
/**
 * Seed Products from Price List
 * - Siler: cart, dealer_sale_items referansları, tüm products
 * - order_items.product_id = NULL yapar
 * - Fiyat listesindeki ürünleri ekler (name=TR, base_name_fr=FR, base_name_en=EN)
 *
 * Kullanım: npm run seed  veya  tsx scripts/seed-products-pricelist.ts
 */

import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!connectionString) {
  console.error('❌ DATABASE_URL veya POSTGRES_URL gerekli');
  process.exit(1);
}

let directConnection = connectionString;
if (directConnection.includes('pooler.supabase.com')) {
  directConnection = directConnection.replace(/aws-0-[^.]+\.pooler\.supabase\.com/, 'db.kxnatjmutvogwoayiajw.supabase.co');
  directConnection = directConnection.replace(/[^.]+\.pooler\.supabase\.com/, 'db.kxnatjmutvogwoayiajw.supabase.co');
}
directConnection = directConnection.replace(/:6543/, ':5432');
directConnection = directConnection.replace(/&pgbouncer=true/, '');
directConnection = directConnection.replace(/\?pgbouncer=true/, '');
directConnection = directConnection.replace(/postgres\.[^:]+:/, 'postgres:');

// Ürün verisi: FR (liste), EN, TR. Her ürün için (weight, price, sku) varyantları.
// Fiyat listesi "Liste de prix" -> Produit, Gr(g), Prix, Hs Code
type Variant = { weight: number; price: number; sku: string };
type ProductRow = { baseFr: string; baseEn: string; baseTr: string; variants: Variant[] };

const PRODUCTS: ProductRow[] = [
  { baseFr: 'Piment fort', baseEn: 'Hot pepper', baseTr: 'Acı biber', variants: [{ weight: 40, price: 0.99, sku: '090432000011' }, { weight: 100, price: 1.49, sku: '090432000012' }, { weight: 2000, price: 5.49, sku: '090432000013' }] },
  { baseFr: 'Piment Habanero', baseEn: 'Habanero pepper', baseTr: 'Habanero biber', variants: [{ weight: 40, price: 0.99, sku: '090412000011' }, { weight: 100, price: 1.49, sku: '090412000012' }] },
  { baseFr: 'Piment Isot', baseEn: 'Isot pepper', baseTr: 'İsot biber', variants: [{ weight: 50, price: 0.99, sku: '090422000011' }, { weight: 150, price: 2.49, sku: '090422000012' }, { weight: 500, price: 5.49, sku: '090422000013' }] },
  { baseFr: 'Sucre d\'Agave bio', baseEn: 'Organic agave sugar', baseTr: 'Organik agav şekeri', variants: [{ weight: 25, price: 0.99, sku: '090120000011' }, { weight: 100, price: 2.49, sku: '090120000012' }] },
  { baseFr: 'Curcuma', baseEn: 'Turmeric', baseTr: 'Zerdeçal', variants: [{ weight: 30, price: 0.99, sku: '091030000011' }, { weight: 100, price: 2.49, sku: '091030000012' }, { weight: 500, price: 5.49, sku: '091030000013' }] },
  { baseFr: 'Piment poudre', baseEn: 'Chili powder', baseTr: 'Pul biber', variants: [{ weight: 40, price: 0.99, sku: '090432000021' }, { weight: 100, price: 1.49, sku: '090432000022' }] },
  { baseFr: 'Gingembre en poudre', baseEn: 'Ground ginger', baseTr: 'Toz zencefil', variants: [{ weight: 40, price: 0.99, sku: '091000000011' }, { weight: 100, price: 2.49, sku: '091000000012' }] },
  { baseFr: 'Feuille de Laurier', baseEn: 'Bay leaf', baseTr: 'Defne yaprağı', variants: [{ weight: 25, price: 0.99, sku: '091100000011' }, { weight: 50, price: 1.49, sku: '091100000012' }] },
  { baseFr: 'Anis Etoile', baseEn: 'Star anise', baseTr: 'Yıldız anason', variants: [{ weight: 30, price: 0.99, sku: '121190000011' }, { weight: 100, price: 2.49, sku: '121190000012' }] },
  { baseFr: 'Origan', baseEn: 'Oregano', baseTr: 'Kekik', variants: [{ weight: 35, price: 0.99, sku: '090700000000' }, { weight: 100, price: 2.49, sku: '090700000001' }, { weight: 2000, price: 5.49, sku: '090700000002' }] },
  { baseFr: 'Fenugrec graines', baseEn: 'Fenugreek seeds', baseTr: 'Çemen tohumu', variants: [{ weight: 30, price: 0.99, sku: '090620000000' }, { weight: 100, price: 2.49, sku: '090620000001' }] },
  { baseFr: 'Fenugrec poudre', baseEn: 'Ground fenugreek', baseTr: 'Çemen tozu', variants: [{ weight: 40, price: 0.99, sku: '090620000010' }] },
  { baseFr: 'Cumin moulu', baseEn: 'Ground cumin', baseTr: 'Öğütülmüş kimyon', variants: [{ weight: 40, price: 0.99, sku: '090932000011' }, { weight: 200, price: 2.49, sku: '090932000012' }, { weight: 2000, price: 5.49, sku: '090932000013' }] },
  { baseFr: 'Mélange 7 épices', baseEn: '7 spice mix', baseTr: '7 baharat karışımı', variants: [{ weight: 80, price: 1.49, sku: '091200000011' }, { weight: 200, price: 2.49, sku: '091200000012' }, { weight: 750, price: 5.49, sku: '091200000013' }] },
  { baseFr: 'Romarin feuilles', baseEn: 'Rosemary leaves', baseTr: 'Biberiye yaprağı', variants: [{ weight: 40, price: 0.99, sku: '121190000067' }, { weight: 100, price: 2.49, sku: '121190000068' }] },
  { baseFr: 'Cannelle Sticks', baseEn: 'Cinnamon sticks', baseTr: 'Tarçın çubukları', variants: [{ weight: 50, price: 0.99, sku: '090610000000' }, { weight: 100, price: 2.49, sku: '090610000001' }] },
  { baseFr: 'Paprika doux en poudre', baseEn: 'Sweet paprika', baseTr: 'Tatlı toz kırmızı biber', variants: [{ weight: 40, price: 0.99, sku: '090421000011' }, { weight: 500, price: 2.49, sku: '090421000012' }, { weight: 5000, price: 5.49, sku: '090421000013' }] },
  { baseFr: 'Poivre noir moulu', baseEn: 'Ground black pepper', baseTr: 'Öğütülmüş karabiber', variants: [{ weight: 40, price: 0.99, sku: '090411000011' }, { weight: 500, price: 2.49, sku: '090411000012' }, { weight: 5000, price: 5.49, sku: '090411000013' }] },
  { baseFr: 'Coriandre graines', baseEn: 'Coriander seeds', baseTr: 'Kişniş tohumu', variants: [{ weight: 40, price: 0.99, sku: '090931000011' }, { weight: 100, price: 2.49, sku: '090931000012' }] },
  { baseFr: 'Cardamome', baseEn: 'Cardamom', baseTr: 'Kakule', variants: [{ weight: 25, price: 0.99, sku: '090830000011' }, { weight: 50, price: 1.49, sku: '090830000012' }] },
  { baseFr: 'Fenouil', baseEn: 'Fennel', baseTr: 'Rezene', variants: [{ weight: 40, price: 0.99, sku: '120400000000' }, { weight: 250, price: 2.49, sku: '120400000001' }] },
  { baseFr: 'Garam Masala', baseEn: 'Garam masala', baseTr: 'Garam masala', variants: [{ weight: 50, price: 1.49, sku: '091300000011' }, { weight: 100, price: 2.49, sku: '091300000012' }] },
  { baseFr: 'Curry', baseEn: 'Curry', baseTr: 'Köri', variants: [{ weight: 50, price: 0.99, sku: '091310000011' }, { weight: 150, price: 2.49, sku: '091310000012' }] },
  { baseFr: 'Biryani Masala', baseEn: 'Biryani masala', baseTr: 'Biryani masala', variants: [{ weight: 50, price: 1.49, sku: '091320000011' }, { weight: 100, price: 2.49, sku: '091320000012' }] },
  { baseFr: 'Tandoori Masala', baseEn: 'Tandoori masala', baseTr: 'Tandoori masala', variants: [{ weight: 50, price: 1.49, sku: '091330000011' }, { weight: 100, price: 2.49, sku: '091330000012' }] },
  { baseFr: 'Sel de mer poudre', baseEn: 'Sea salt', baseTr: 'Deniz tuzu', variants: [{ weight: 100, price: 0.99, sku: '250100000011' }, { weight: 500, price: 2.49, sku: '250100000012' }] },
  { baseFr: 'Sel Himalaya poudre', baseEn: 'Himalayan salt', baseTr: 'Himalaya tuzu', variants: [{ weight: 100, price: 1.49, sku: '250110000011' }, { weight: 500, price: 3.49, sku: '250110000012' }] },
  { baseFr: 'Thé vert', baseEn: 'Green tea', baseTr: 'Yeşil çay', variants: [{ weight: 50, price: 0.99, sku: '090210000011' }, { weight: 100, price: 1.49, sku: '090210000012' }] },
  { baseFr: 'Rosehips Tea', baseEn: 'Rosehip tea', baseTr: 'Kuşburnu çayı', variants: [{ weight: 50, price: 0.99, sku: '121190000026' }, { weight: 150, price: 2.49, sku: '121190000027' }] },
  { baseFr: 'Thé à la menthe', baseEn: 'Mint tea', baseTr: 'Nane çayı', variants: [{ weight: 50, price: 0.99, sku: '121190000028' }, { weight: 100, price: 1.49, sku: '121190000029' }] },
  { baseFr: 'Thé camomille', baseEn: 'Chamomile tea', baseTr: 'Papatya çayı', variants: [{ weight: 50, price: 0.99, sku: '121190000030' }, { weight: 100, price: 1.49, sku: '121190000031' }] },
  { baseFr: 'Thé gingembre citron', baseEn: 'Ginger lemon tea', baseTr: 'Zencefil limon çayı', variants: [{ weight: 50, price: 0.99, sku: '121190000032' }] },
  { baseFr: 'Hibiscus', baseEn: 'Hibiscus', baseTr: 'Hibisküs', variants: [{ weight: 50, price: 0.99, sku: '121190000033' }, { weight: 100, price: 1.49, sku: '121190000034' }] },
  { baseFr: 'Mélisse (citronnelle)', baseEn: 'Lemon balm', baseTr: 'Oğul otu', variants: [{ weight: 50, price: 0.99, sku: '121190000035' }] },
  { baseFr: 'Graines de lin', baseEn: 'Flaxseed', baseTr: 'Keten tohumu', variants: [{ weight: 100, price: 0.99, sku: '120400000011' }, { weight: 250, price: 2.49, sku: '120400000012' }] },
  { baseFr: 'Pavot bleu graines', baseEn: 'Blue poppy seeds', baseTr: 'Mavi haşhaş tohumu', variants: [{ weight: 40, price: 0.99, sku: '120400000021' }] },
  { baseFr: 'Assaisonnement viande', baseEn: 'Meat seasoning', baseTr: 'Et baharatı', variants: [{ weight: 50, price: 0.99, sku: '091400000011' }, { weight: 100, price: 1.49, sku: '091400000012' }] },
  { baseFr: 'Assaisonnement poulet', baseEn: 'Chicken seasoning', baseTr: 'Tavuk baharatı', variants: [{ weight: 50, price: 0.99, sku: '091410000011' }] },
  { baseFr: 'Curry Madras fort', baseEn: 'Hot Madras curry', baseTr: 'Acı Madras köri', variants: [{ weight: 50, price: 1.49, sku: '091311000011' }, { weight: 100, price: 2.49, sku: '091311000012' }] },
  { baseFr: 'Assaisonnement Doner', baseEn: 'Doner seasoning', baseTr: 'Döner baharatı', variants: [{ weight: 50, price: 0.99, sku: '091420000011' }] },
  { baseFr: 'Assaisonnement Kofta', baseEn: 'Kofta seasoning', baseTr: 'Köfte baharatı', variants: [{ weight: 50, price: 0.99, sku: '091430000011' }] },
  { baseFr: 'Assaisonnement riz', baseEn: 'Rice seasoning', baseTr: 'Pilav baharatı', variants: [{ weight: 50, price: 0.99, sku: '091440000011' }] },
  { baseFr: 'Bicarbonate de soude', baseEn: 'Baking soda', baseTr: 'Karbonat', variants: [{ weight: 100, price: 0.99, sku: '283630000011' }] },
];

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function run() {
  const sql = postgres(directConnection, { max: 1, ssl: 'require' });
  console.log('🔄 Seed (ürünler siliniyor + fiyat listesi ekleniyor)...\n');

  try {
    // 1. FK referanslarını kaldır
    await sql.unsafe('DELETE FROM cart');
    console.log('✅ cart temizlendi');

    await sql.unsafe('UPDATE order_items SET product_id = NULL WHERE product_id IS NOT NULL');
    console.log('✅ order_items.product_id null yapıldı');

    await sql.unsafe('DELETE FROM dealer_sale_items');
    console.log('✅ dealer_sale_items silindi');

    await sql.unsafe('DELETE FROM products');
    console.log('✅ products silindi');

    // 2. base_name_fr / base_name_en kolonları
    await sql.unsafe(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS base_name_fr VARCHAR(255);
      ALTER TABLE products ADD COLUMN IF NOT EXISTS base_name_en VARCHAR(255);
    `);
    console.log('✅ base_name_fr / base_name_en kolonları kontrol edildi');

    // 3. Ürünleri ekle
    let inserted = 0;
    for (const row of PRODUCTS) {
      for (const v of row.variants) {
        const nameTr = `${row.baseTr} ${v.weight} Gr`;
        const baseNameTr = row.baseTr;
        const baseNameFr = row.baseFr;
        const baseNameEn = row.baseEn;
        const slugBase = slugify(baseNameEn);
        const slug = `${slugBase}-${v.weight}-gr`;
        await sql`
          INSERT INTO products (name, name_fr, name_en, base_name, base_name_fr, base_name_en, slug, sku, price, stock, weight, unit, is_active, track_stock)
          VALUES (${nameTr}, NULL, NULL, ${baseNameTr}, ${baseNameFr}, ${baseNameEn}, ${slug}, ${v.sku}, ${String(v.price)}, 0, ${String(v.weight)}, 'Gr', true, true)
        `;
        inserted++;
      }
    }
    console.log(`✅ ${inserted} ürün eklendi.\n`);

    await sql.end();
    console.log('✅ Seed tamamlandı.');
  } catch (e: any) {
    console.error('❌ Hata:', e?.message || e);
    await sql.end();
    process.exit(1);
  }
  process.exit(0);
}

run();
