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
dotenv.config({ path: '.env.production' });

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

// TR -> FR çeviri mapping
const trToFr: Record<string, string> = {
  'İsot Biber': 'Piment Isot',
  'Pul Biber Acı': 'Piment flocons',
  'Pul Biber Tatlı': 'Paprika doux flocons',
  'Sumak': 'Sumac',
  'Süper Acı Pul biber': 'Piment flocons Extra Hot',
  'Toz Acı Biber': 'Piment poudre',
  'Toz Tatlı Biber': 'Paprika doux en poudre',
  'Defne Yaprağı': 'Feuille de laurier',
  'Nane': 'Menthe flocons',
  'Yaprak Kekik': 'Origan',
  'Çemen Tane': 'Fenugrec graines',
  'Çemen Toz': 'Fenugrec poudre',
  'Kimyon Tane': 'Cumin graines',
  'Kimyon Toz': 'Cumin moulu',
  'Kişniş Tane': 'Coriandre graines',
  'Kişniş Toz': 'Coriandre poudre',
  'Susam': 'Sésame',
  'Çörek Otu': 'Graines noires',
  'Mavi Haşhaş': 'Pavot bleu graines',
  'Hindistan Cevizi': 'Noix de coco râpée',
  'Susam Kavrulmuş': 'Sésame rôti',
  'Çubuk Tarçın': 'Cannelle bâtons',
  'Tarçın Toz': 'Cannelle poudre',
  'Karabiber Toz': 'Poivre noir moulu',
  'Karabiber İri Çekilmiş': 'Poivre noir grossier',
  'Karabiber Tane': 'Poivre noir grains',
  'Karanfil Tane': 'Clous de girofle',
  'Karanfil Toz': 'Clous de girofle moulu',
  'Sarımsak Tozu': 'Ail poudre',
  'Soğan Tozu': 'Oignon poudre',
  'Yenibahar Toz': 'Piment de la Jamaïque poudre',
  'Zencefil Toz': 'Gingembre poudre',
  'Zerdeçal Toz': 'Curcuma poudre',
  'Karbonat': 'Bicarbonate de soude',
  'Limon Tuzu Toz': 'Acide citrique en poudre',
  'Et Baharatı': 'Assaisonnement viande',
  'Garam Masala': 'Garam Masala',
  'Kerrie Masala': 'Kerrie Masala',
  'Köri': 'Curry',
  'Köri Acılı': 'Curry Madras fort',
  'Mangal Baharatı': 'Assaisonnement barbecue',
  'Patates Baharatı': 'Assaisonnement pour frites',
  'Ras El Hanout': 'Ras El Hanout',
  'Sarımsaklı Çeşni': 'Mélange à l\'ail',
  'Tavuk Baharatı': 'Assaisonnement poulet',
  'Yedi Türlü': 'Mélange 7 épices',
  'Sumak Tüm': 'Sumac entier',
  'Sivri Kekik': 'Thym',
  'Chia Tohumu': 'Graines de chia',
  'Frenk Kimyonu Tane': 'Carvi graines',
  'Keten Tohumu': 'Graines de lin',
  'Susam&Çörek Otu': 'Sésame et graines noires',
  'Beyaz Biber Tane': 'Poivre blanc grains',
  'Beyaz Biber Toz': 'Poivre blanc moulu',
  'Sarımsak Granül': 'Ail granulés',
  'Yenibahar Tane': 'Piment de la Jamaïque entier',
  'Yıldız Anason': 'Anis étoile',
  'Deniz Tuzu Toz': 'Sel de mer poudre',
  'Himalaya Tuzu Toz': 'Sel Himalaya poudre',
  'Kaya Tuzu Toz': 'Sel de roche poudre',
  'Biryani Masala': 'Biryani Masala',
  'Döner Baharatı': 'Assaisonnement Doner',
  'Köfte Harcı': 'Assaisonnement Kofta',
  'Merguez Baharatı': 'Assaisonnement Merguez',
  'Pilav Baharatı': 'Assaisonnement riz',
  'Tandoori Masala': 'Tandoori Masala',
  'Biberiye': 'Romarin feuilles',
  'Maydonoz kurusu': 'Persil séché',
  'LİMON SOSU 1000 ml': 'Sauce au citron 1000 ml',
  'LİMON SOSU 500 ml': 'Sauce au citron 500 ml',
  'NAR EKŞİLİ SOS 1000 ml': 'Sauce à la grenade 1000 ml',
  'ÇÖREKOTU YAĞI 250 ml': 'Huile de graines noires 250 ml',
  'SUSAM YAĞI 250 ml': 'Huile de sésame 250 ml',
  'BEYAZ SİRKE 1000 ml': 'Vinaigre blanc 1000 ml',
  'ELMA SİRKESİ 1000 ml': 'Vinaigre de pomme 1000 ml',
  'ÜZÜM SİRKESİ 1000 ml': 'Vinaigre de raisin 1000 ml',
};

function getFrName(trName: string): string {
  return trToFr[trName] || trName;
}

function generateSku(baseName: string, weight: number): string {
  const hash = (s: string) => {
    let n = 0;
    for (let i = 0; i < s.length; i++) n = (n * 31 + s.charCodeAt(i)) | 0;
    return Math.abs(n) % 1000000000000;
  };
  return String(hash(baseName + String(weight))).padStart(12, '0').slice(0, 12);
}

// Yeni liste: TR, EN, gr, stok, fiyat
const PRODUCT_ROWS: Array<{ tr: string; en: string; weight: number; stock: number; price: number }> = [
  { tr: 'İsot Biber', en: 'Isot Pepper', weight: 50, stock: 400, price: 0.99 },
  { tr: 'Pul Biber Acı', en: 'Chili Flakes', weight: 60, stock: 400, price: 0.99 },
  { tr: 'Pul Biber Tatlı', en: 'Sweet Paprika Flakes', weight: 50, stock: 400, price: 0.99 },
  { tr: 'Sumak', en: 'Sumac', weight: 50, stock: 400, price: 0.99 },
  { tr: 'Süper Acı Pul biber', en: 'Chili Flakes Extra Hot', weight: 50, stock: 200, price: 0.99 },
  { tr: 'Toz Acı Biber', en: 'Chili Powder', weight: 40, stock: 400, price: 0.99 },
  { tr: 'Toz Tatlı Biber', en: 'Sweet Paprika Powder', weight: 40, stock: 400, price: 0.99 },
  { tr: 'Defne Yaprağı', en: 'Bay Leaf', weight: 10, stock: 400, price: 0.99 },
  { tr: 'Nane', en: 'Mint flakes', weight: 25, stock: 400, price: 0.99 },
  { tr: 'Yaprak Kekik', en: 'Oregano', weight: 15, stock: 400, price: 0.99 },
  { tr: 'Çemen Tane', en: 'Fenugreek Seeds', weight: 50, stock: 200, price: 0.99 },
  { tr: 'Çemen Toz', en: 'Fenugreek Powder', weight: 60, stock: 200, price: 0.99 },
  { tr: 'Kimyon Tane', en: 'Cumin Seeds', weight: 40, stock: 400, price: 0.99 },
  { tr: 'Kimyon Toz', en: 'Cumin Ground', weight: 50, stock: 400, price: 0.99 },
  { tr: 'Kişniş Tane', en: 'Coriander Seeds', weight: 20, stock: 400, price: 0.99 },
  { tr: 'Kişniş Toz', en: 'Coriander Powder', weight: 50, stock: 400, price: 0.99 },
  { tr: 'Susam', en: 'Sesame', weight: 60, stock: 400, price: 0.99 },
  { tr: 'Çörek Otu', en: 'Black Seeds', weight: 60, stock: 400, price: 0.99 },
  { tr: 'Mavi Haşhaş', en: 'Blue Poppy Seeds', weight: 60, stock: 200, price: 0.99 },
  { tr: 'Hindistan Cevizi', en: 'Shredded Coconut', weight: 40, stock: 200, price: 0.99 },
  { tr: 'Susam Kavrulmuş', en: 'Sesame Roasted', weight: 60, stock: 200, price: 0.99 },
  { tr: 'Çubuk Tarçın', en: 'Cinnamon Sticks', weight: 40, stock: 400, price: 0.99 },
  { tr: 'Tarçın Toz', en: 'Cinnamon Powder', weight: 40, stock: 200, price: 0.99 },
  { tr: 'Karabiber Toz', en: 'Black Pepper Ground', weight: 50, stock: 400, price: 0.99 },
  { tr: 'Karabiber İri Çekilmiş', en: 'Black Pepper Coarse', weight: 30, stock: 400, price: 0.99 },
  { tr: 'Karabiber Tane', en: 'Black Peppercorns', weight: 50, stock: 400, price: 0.99 },
  { tr: 'Karanfil Tane', en: 'Cloves', weight: 30, stock: 400, price: 0.99 },
  { tr: 'Karanfil Toz', en: 'Cloves Ground', weight: 30, stock: 200, price: 0.99 },
  { tr: 'Sarımsak Tozu', en: 'Garlic Powder', weight: 30, stock: 200, price: 0.99 },
  { tr: 'Soğan Tozu', en: 'Onion Powder', weight: 30, stock: 200, price: 0.99 },
  { tr: 'Yenibahar Toz', en: 'Allspice Powder', weight: 30, stock: 200, price: 0.99 },
  { tr: 'Zencefil Toz', en: 'Ginger Powder', weight: 50, stock: 400, price: 0.99 },
  { tr: 'Zerdeçal Toz', en: 'Turmeric Powder', weight: 50, stock: 400, price: 0.99 },
  { tr: 'Karbonat', en: 'Baking soda', weight: 80, stock: 400, price: 0.99 },
  { tr: 'Limon Tuzu Toz', en: 'Citric Acid Powder', weight: 100, stock: 400, price: 0.99 },
  { tr: 'Et Baharatı', en: 'Meat Seasoning', weight: 50, stock: 400, price: 0.99 },
  { tr: 'Garam Masala', en: 'Garam Masala', weight: 60, stock: 100, price: 0.99 },
  { tr: 'Kerrie Masala', en: 'Kerrie Masala', weight: 60, stock: 400, price: 0.99 },
  { tr: 'Köri', en: 'Curry', weight: 50, stock: 400, price: 0.99 },
  { tr: 'Köri Acılı', en: 'Hot Madras Curry', weight: 50, stock: 200, price: 0.99 },
  { tr: 'Mangal Baharatı', en: 'Barbecue Seasoning', weight: 50, stock: 400, price: 0.99 },
  { tr: 'Patates Baharatı', en: 'Fries Seasoning', weight: 50, stock: 200, price: 0.99 },
  { tr: 'Ras El Hanout', en: 'Ras El Hanout', weight: 50, stock: 200, price: 0.99 },
  { tr: 'Sarımsaklı Çeşni', en: 'Garlic Mix', weight: 50, stock: 200, price: 0.99 },
  { tr: 'Tavuk Baharatı', en: 'Chicken Seasoning', weight: 60, stock: 400, price: 0.99 },
  { tr: 'Yedi Türlü', en: '7 spice', weight: 50, stock: 400, price: 2.49 },
  { tr: 'İsot Biber', en: 'Isot Pepper', weight: 150, stock: 240, price: 2.49 },
  { tr: 'Pul Biber Acı', en: 'Chili Flakes', weight: 150, stock: 600, price: 2.49 },
  { tr: 'Pul Biber Tatlı', en: 'Sweet Paprika Flakes', weight: 150, stock: 360, price: 2.49 },
  { tr: 'Sumak', en: 'Sumac', weight: 150, stock: 600, price: 2.49 },
  { tr: 'Sumak Tüm', en: 'Sumac Whole', weight: 100, stock: 120, price: 2.49 },
  { tr: 'Süper Acı Pul biber', en: 'Chili Flakes Extra Hot', weight: 150, stock: 240, price: 2.49 },
  { tr: 'Toz Acı Biber', en: 'Chili Powder', weight: 150, stock: 600, price: 2.49 },
  { tr: 'Toz Tatlı Biber', en: 'Sweet Paprika Powder', weight: 150, stock: 600, price: 2.49 },
  { tr: 'Defne Yaprağı', en: 'Bay Leaf', weight: 8, stock: 360, price: 1.49 },
  { tr: 'Nane', en: 'Mint flakes', weight: 60, stock: 600, price: 1.49 },
  { tr: 'Sivri Kekik', en: 'Thyme', weight: 60, stock: 240, price: 1.49 },
  { tr: 'Yaprak Kekik', en: 'Oregano', weight: 40, stock: 600, price: 2.49 },
  { tr: 'Çemen Tane', en: 'Fenugreek Seeds', weight: 250, stock: 240, price: 2.49 },
  { tr: 'Çemen Toz', en: 'Fenugreek Powder', weight: 200, stock: 240, price: 2.49 },
  { tr: 'Chia Tohumu', en: 'Chia Seeds', weight: 200, stock: 120, price: 2.49 },
  { tr: 'Frenk Kimyonu Tane', en: 'Caraway Seeds', weight: 150, stock: 360, price: 2.49 },
  { tr: 'Keten Tohumu', en: 'Flaxseed', weight: 200, stock: 240, price: 2.49 },
  { tr: 'Kimyon Tane', en: 'Cumin Seeds', weight: 150, stock: 600, price: 2.49 },
  { tr: 'Kimyon Toz', en: 'Cumin Ground', weight: 180, stock: 600, price: 2.49 },
  { tr: 'Kişniş Tane', en: 'Coriander Seeds', weight: 70, stock: 600, price: 2.49 },
  { tr: 'Kişniş Toz', en: 'Coriander Powder', weight: 150, stock: 600, price: 2.49 },
  { tr: 'Susam', en: 'Sesame', weight: 180, stock: 600, price: 2.49 },
  { tr: 'Çörek Otu', en: 'Black Seeds', weight: 180, stock: 600, price: 2.49 },
  { tr: 'Mavi Haşhaş', en: 'Blue Poppy Seeds', weight: 180, stock: 240, price: 2.49 },
  { tr: 'Hindistan Cevizi', en: 'Shredded Coconut', weight: 120, stock: 240, price: 2.49 },
  { tr: 'Susam&Çörek Otu', en: 'Sesame&Black Seeds', weight: 180, stock: 600, price: 2.49 },
  { tr: 'Susam Kavrulmuş', en: 'Sesame Roasted', weight: 180, stock: 240, price: 2.49 },
  { tr: 'Beyaz Biber Tane', en: 'White Peppercorns', weight: 150, stock: 240, price: 3.49 },
  { tr: 'Beyaz Biber Toz', en: 'White Pepper Ground', weight: 150, stock: 240, price: 3.49 },
  { tr: 'Çubuk Tarçın', en: 'Cinnamon Sticks', weight: 60, stock: 600, price: 2.49 },
  { tr: 'Tarçın Toz', en: 'Cinnamon Powder', weight: 150, stock: 240, price: 2.49 },
  { tr: 'Karabiber Toz', en: 'Black Pepper Ground', weight: 150, stock: 600, price: 2.49 },
  { tr: 'Karabiber İri Çekilmiş', en: 'Black Pepper Coarse', weight: 150, stock: 240, price: 2.99 },
  { tr: 'Karabiber Tane', en: 'Black Peppercorns', weight: 150, stock: 240, price: 2.99 },
  { tr: 'Karanfil Tane', en: 'Cloves', weight: 90, stock: 600, price: 2.49 },
  { tr: 'Karanfil Toz', en: 'Cloves Ground', weight: 170, stock: 240, price: 3.49 },
  { tr: 'Sarımsak Granül', en: 'Garlic Granules', weight: 180, stock: 240, price: 2.49 },
  { tr: 'Sarımsak Tozu', en: 'Garlic Powder', weight: 130, stock: 240, price: 2.49 },
  { tr: 'Soğan Tozu', en: 'Onion Powder', weight: 140, stock: 240, price: 2.49 },
  { tr: 'Yenibahar Tane', en: 'Allspice Whole', weight: 100, stock: 120, price: 2.49 },
  { tr: 'Yenibahar Toz', en: 'Allspice Powder', weight: 150, stock: 120, price: 3.49 },
  { tr: 'Yıldız Anason', en: 'Star Anise', weight: 60, stock: 120, price: 2.49 },
  { tr: 'Zencefil Toz', en: 'Ginger Powder', weight: 150, stock: 600, price: 2.49 },
  { tr: 'Zerdeçal Toz', en: 'Turmeric Powder', weight: 150, stock: 600, price: 2.49 },
  { tr: 'Deniz Tuzu Toz', en: 'Sea Salt Powder', weight: 350, stock: 120, price: 1.19 },
  { tr: 'Himalaya Tuzu Toz', en: 'Himalayan Salt Powder', weight: 350, stock: 120, price: 1.48 },
  { tr: 'Karbonat', en: 'Baking soda', weight: 350, stock: 360, price: 2.49 },
  { tr: 'Kaya Tuzu Toz', en: 'Rock Salt Powder', weight: 350, stock: 120, price: 1.49 },
  { tr: 'Limon Tuzu Toz', en: 'Citric Acid Powder', weight: 300, stock: 600, price: 2.49 },
  { tr: 'Biryani Masala', en: 'Biryani Masala', weight: 160, stock: 360, price: 2.49 },
  { tr: 'Döner Baharatı', en: 'Doner Seasoning', weight: 160, stock: 240, price: 2.49 },
  { tr: 'Et Baharatı', en: 'Meat Seasoning', weight: 150, stock: 360, price: 2.49 },
  { tr: 'Garam Masala', en: 'Garam Masala', weight: 180, stock: 360, price: 2.49 },
  { tr: 'Köfte Harcı', en: 'Kofta Seasoning', weight: 180, stock: 240, price: 2.49 },
  { tr: 'Köri', en: 'Curry', weight: 150, stock: 600, price: 2.49 },
  { tr: 'Köri Acılı', en: 'Hot Madras Curry', weight: 160, stock: 240, price: 2.49 },
  { tr: 'Mangal Baharatı', en: 'Barbecue Seasoning', weight: 200, stock: 360, price: 2.49 },
  { tr: 'Merguez Baharatı', en: 'Merguez Sausage Seasoning', weight: 160, stock: 360, price: 2.49 },
  { tr: 'Patates Baharatı', en: 'Fries Seasoning', weight: 160, stock: 120, price: 2.49 },
  { tr: 'Pilav Baharatı', en: 'Rice Seasoning', weight: 180, stock: 240, price: 2.49 },
  { tr: 'Tandoori Masala', en: 'Tandoori Masala', weight: 160, stock: 360, price: 2.49 },
  { tr: 'Tavuk Baharatı', en: 'Chicken Seasoning', weight: 200, stock: 360, price: 2.49 },
  { tr: 'Yedi Türlü', en: '7 spice', weight: 150, stock: 600, price: 2.49 },
  { tr: 'İsot Biber', en: 'Isot Pepper', weight: 500, stock: 60, price: 5.49 },
  { tr: 'Pul Biber Acı', en: 'Chili Flakes', weight: 500, stock: 120, price: 5.49 },
  { tr: 'Pul Biber Tatlı', en: 'Sweet Paprika Flakes', weight: 500, stock: 120, price: 5.49 },
  { tr: 'Sumak', en: 'Sumac', weight: 600, stock: 120, price: 5.49 },
  { tr: 'Toz Acı Biber', en: 'Chili Powder', weight: 500, stock: 120, price: 5.49 },
  { tr: 'Toz Tatlı Biber', en: 'Sweet Paprika Powder', weight: 400, stock: 120, price: 5.49 },
  { tr: 'Biberiye', en: 'Rosemary Leaves', weight: 270, stock: 60, price: 5.49 },
  { tr: 'Nane', en: 'Mint flakes', weight: 180, stock: 120, price: 2.99 },
  { tr: 'Yaprak Kekik', en: 'Oregano', weight: 140, stock: 240, price: 2.99 },
  { tr: 'Kimyon Tane', en: 'Cumin Seeds', weight: 450, stock: 120, price: 5.99 },
  { tr: 'Kimyon Toz', en: 'Cumin Ground', weight: 500, stock: 120, price: 6.49 },
  { tr: 'Kişniş Tane', en: 'Coriander Seeds', weight: 250, stock: 120, price: 5.49 },
  { tr: 'Kişniş Toz', en: 'Coriander Powder', weight: 400, stock: 120, price: 5.49 },
  { tr: 'Susam', en: 'Sesame', weight: 500, stock: 120, price: 5.49 },
  { tr: 'Çörek Otu', en: 'Black Seeds', weight: 500, stock: 120, price: 5.49 },
  { tr: 'Hindistan Cevizi', en: 'Shredded Coconut', weight: 350, stock: 60, price: 5.49 },
  { tr: 'Susam&Çörek Otu', en: 'Sesame&Black Seeds', weight: 500, stock: 60, price: 5.49 },
  { tr: 'Karabiber Toz', en: 'Black Pepper Ground', weight: 500, stock: 180, price: 7.99 },
  { tr: 'Karanfil Tane', en: 'Cloves', weight: 350, stock: 120, price: 7.99 },
  { tr: 'Karbonat', en: 'Baking soda', weight: 1200, stock: 120, price: 2.99 },
  { tr: 'Limon Tuzu Toz', en: 'Citric Acid Powder', weight: 900, stock: 120, price: 5.49 },
  { tr: 'Köri', en: 'Curry', weight: 500, stock: 120, price: 5.49 },
  { tr: 'Mangal Baharatı', en: 'Barbecue Seasoning', weight: 700, stock: 60, price: 5.49 },
  { tr: 'Patates Baharatı', en: 'Fries Seasoning', weight: 600, stock: 60, price: 5.49 },
  { tr: 'Tavuk Baharatı', en: 'Chicken Seasoning', weight: 700, stock: 60, price: 5.49 },
  { tr: 'Yedi Türlü', en: '7 spice', weight: 500, stock: 60, price: 5.49 },
  { tr: 'Maydonoz kurusu', en: 'Dried Parsley', weight: 150, stock: 180, price: 2.99 },
  { tr: 'Soğan Tozu', en: 'Onion Powder', weight: 500, stock: 180, price: 4.52 },
  { tr: 'Yaprak Kekik', en: 'Oregano', weight: 500, stock: 60, price: 8.99 },
  { tr: 'Karabiber Toz', en: 'Black Pepper Ground', weight: 2500, stock: 120, price: 36.99 },
  { tr: 'Beyaz Biber Toz', en: 'White Pepper Ground', weight: 2500, stock: 40, price: 45.99 },
  { tr: 'Sarımsak Tozu', en: 'Garlic Powder', weight: 2000, stock: 80, price: 18.99 },
  { tr: 'Kimyon Toz', en: 'Cumin Ground', weight: 2500, stock: 120, price: 24.99 },
  { tr: 'Toz Acı Biber', en: 'Chili Powder', weight: 2000, stock: 80, price: 14.99 },
  { tr: 'Toz Tatlı Biber', en: 'Sweet Paprika Powder', weight: 2000, stock: 120, price: 17.99 },
  { tr: 'İsot Biber', en: 'Isot Pepper', weight: 2000, stock: 40, price: 15.49 },
  { tr: 'Maydonoz kurusu', en: 'Dried Parsley', weight: 500, stock: 120, price: 8.99 },
  { tr: 'Soğan Tozu', en: 'Onion Powder', weight: 2000, stock: 80, price: 8.99 },
  { tr: 'LİMON SOSU 1000 ml', en: 'LEMON SAUCE 1000 ml', weight: 1000, stock: 240, price: 1.49 },
  { tr: 'LİMON SOSU 500 ml', en: 'LEMON SAUCE 500 ml', weight: 500, stock: 240, price: 0.99 },
  { tr: 'NAR EKŞİLİ SOS 1000 ml', en: 'POMEGRANATE SAUCE 1000 ml', weight: 1000, stock: 240, price: 1.99 },
  { tr: 'ÇÖREKOTU YAĞI 250 ml', en: 'BLACK SEED OIL 250 ml', weight: 250, stock: 120, price: 4.99 },
  { tr: 'SUSAM YAĞI 250 ml', en: 'SESAME OIL 250 ml', weight: 250, stock: 120, price: 4.99 },
  { tr: 'BEYAZ SİRKE 1000 ml', en: 'WHITE VINEGAR 1000 ml', weight: 1000, stock: 120, price: 1.19 },
  { tr: 'ELMA SİRKESİ 1000 ml', en: 'APPLE VINEGAR 1000 ml', weight: 1000, stock: 120, price: 1.19 },
  { tr: 'ÜZÜM SİRKESİ 1000 ml', en: 'GRAPE VINEGAR 1000 ml', weight: 1000, stock: 120, price: 1.19 },
  { tr: 'Toz Tatlı Biber', en: 'Sweet Paprika Powder', weight: 5000, stock: 50, price: 47.99 },
  { tr: 'Yaprak Kekik', en: 'Oregano', weight: 1500, stock: 50, price: 24.99 },
  { tr: 'Karabiber Toz', en: 'Black Pepper Ground', weight: 5000, stock: 20, price: 74.99 },
  { tr: 'Maydonoz kurusu', en: 'Dried Parsley', weight: 2000, stock: 50, price: 24.99 },
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
  console.log('🔄 Seed (ürünler siliniyor + yeni liste ekleniyor)...\n');

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
    for (const row of PRODUCT_ROWS) {
      const baseTr = row.tr;
      const baseEn = row.en;
      const baseFr = getFrName(baseTr);
      const nameTr = `${baseTr} ${row.weight} ${row.weight >= 1000 ? 'ml' : 'Gr'}`;
      const slugBase = slugify(baseEn);
      const slug = `${slugBase}-${row.weight}-${row.weight >= 1000 ? 'ml' : 'gr'}`;
      const sku = generateSku(baseEn, row.weight);
      const unit = row.weight >= 1000 ? 'ml' : 'Gr';

      await sql`
        INSERT INTO products (name, base_name, base_name_fr, base_name_en, slug, sku, price, stock, weight, unit, is_active, track_stock)
        VALUES (${nameTr}, ${baseTr}, ${baseFr}, ${baseEn}, ${slug}, ${sku}, ${String(row.price)}, ${row.stock}, ${String(row.weight)}, ${unit}, true, true)
      `;
      inserted++;
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
