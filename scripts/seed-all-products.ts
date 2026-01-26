#!/usr/bin/env tsx
/**
 * Seed All Products and Categories from Price List
 * - Tüm ürünleri ve kategorileri siler
 * - Yeni listedeki kategorileri oluşturur (TR, EN, FR)
 * - Yeni listedeki ürünleri oluşturur (TR, EN, FR)
 *
 * Kullanım: npm run seed-all  veya  tsx scripts/seed-all-products.ts
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
  'Maydanoz Kurusu': 'Persil séché',
  'LİMON SOSU 1000 ml': 'Sauce au citron 1000 ml',
  'LİMON SOSU 500 ml': 'Sauce au citron 500 ml',
  'NAR EKŞİLİ SOS 1000 ml': 'Sauce à la grenade 1000 ml',
  'ÇÖREKOTU YAĞI 250 ml': 'Huile de graines noires 250 ml',
  'SUSAM YAĞI 250 ml': 'Huile de sésame 250 ml',
  'BEYAZ SİRKE 1000 ml': 'Vinaigre blanc 1000 ml',
  'ELMA SİRKESİ 1000 ml': 'Vinaigre de pomme 1000 ml',
  'ÜZÜM SİRKESİ 1000 ml': 'Vinaigre de raisin 1000 ml',
  'Pulbiber Çekirdekli': 'Piment flocons avec graines',
  'Pulbiber': 'Piment flocons',
  'BAHARAT STANDI': 'Étagère à épices standard',
  'Boz Ada': 'Thé à la sauge',
  'Ihlamur': 'Tilleul',
  'Tarçın Çubuk(Kabuk)': 'Cannelle bâtons',
  'Dağ Kekiği': 'Thym sauvage',
  'Kuşburnu Çayı': 'Thé d\'églantier',
  'Melisa': 'Mélisse',
  'Nar Çiçeği': 'Hibiscus',
  'Papatya': 'Camomille',
  'Rezene': 'Fenouil',
  'Yeşilçay': 'Thé vert',
  'Zencefil Tane': 'Gingembre entier',
  'Zerdeçal Tane': 'Curcuma entier',
  'Kış Çayı': 'Thé d\'hiver',
  'Form Çayı': 'Thé Form',
  'Lavanta': 'Lavande',
  'Civan Perçemi': 'Achillée millefeuille',
  'Ekinezya-Reyhan': 'Échinacée-Basilic',
  'Anason': 'Graines d\'anis',
  'Kiraz Sapı': 'Tige de cerise',
  'Chıa Tohumu': 'Graines de chia',
  'Tomurcuk Gül Çayı': 'Boutons de rose',
  'Mor Reyhan': 'Basilic pourpre',
};

function getFrName(trName: string): string {
  return trToFr[trName] || trName;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function generateSku(baseName: string, weight: number): string {
  const hash = (s: string) => {
    let n = 0;
    for (let i = 0; i < s.length; i++) n = (n * 31 + s.charCodeAt(i)) | 0;
    return Math.abs(n) % 1000000000000;
  };
  return String(hash(baseName + String(weight))).padStart(12, '0').slice(0, 12);
}

// Kategori mapping (TR -> EN -> FR)
const CATEGORY_MAP: Record<string, { en: string; fr: string }> = {
  'ZİPLİ AMBALAJ': { en: 'Zipped Package', fr: 'Emballage zippé' },
  'ORTA PETLER': { en: 'Medium Jars', fr: 'Pots moyens' },
  'BÜYÜK PETLER': { en: 'Large Jars', fr: 'Grands pots' },
  'SOSLAR': { en: 'Sauces', fr: 'Sauces' },
  'YAĞLAR': { en: 'Oils', fr: 'Huiles' },
  'SİRKELER': { en: 'Vinegars', fr: 'Vinaigres' },
  'KOVALAR': { en: 'Buckets', fr: 'Seaux' },
  'XL PETLER': { en: 'XL Jars', fr: 'Pots XL' },
  'STANTLAR': { en: 'Stands', fr: 'Étagères' },
  'BİTKİ ÇAYLARI': { en: 'Herbal Teas', fr: 'Thés aux herbes' },
};

// Ürün listesi
interface ProductRow {
  package: string;
  tr: string;
  en: string;
  gr: number;
  stok: number;
  fiyat: number | string;
  hsCode: string;
}

const PRODUCT_LIST: ProductRow[] = [
  { package: 'ZİPLİ AMBALAJ', tr: 'İsot Biber', en: 'Isot Pepper', gr: 50, stok: 400, fiyat: 0.99, hsCode: '90422000011' },
  { package: 'ZİPLİ AMBALAJ', tr: 'Pul Biber Acı', en: 'Chili Flakes', gr: 60, stok: 400, fiyat: 0.99, hsCode: '90422000011' },
  { package: 'ZİPLİ AMBALAJ', tr: 'Pul Biber Tatlı', en: 'Sweet Paprika Flakes', gr: 50, stok: 400, fiyat: 0.99, hsCode: '90422000011' },
  { package: 'ZİPLİ AMBALAJ', tr: 'Sumak', en: 'Sumac', gr: 50, stok: 400, fiyat: 0.99, hsCode: '91099910013' },
  { package: 'ZİPLİ AMBALAJ', tr: 'Süper Acı Pul biber', en: 'Chili Flakes Extra Hot', gr: 50, stok: 200, fiyat: 0.99, hsCode: '90422000011' },
  { package: 'ZİPLİ AMBALAJ', tr: 'Toz Acı Biber', en: 'Chili Powder', gr: 40, stok: 400, fiyat: 0.99, hsCode: '90422000011' },
  { package: 'ZİPLİ AMBALAJ', tr: 'Toz Tatlı Biber', en: 'Sweet Paprika Powder', gr: 40, stok: 400, fiyat: 0.99, hsCode: '90422000011' },
  { package: 'ZİPLİ AMBALAJ', tr: 'Defne Yaprağı', en: 'Bay Leaf', gr: 10, stok: 400, fiyat: 0.99, hsCode: '91099500000' },
  { package: 'ZİPLİ AMBALAJ', tr: 'Nane', en: 'Mint flakes', gr: 25, stok: 400, fiyat: 0.99, hsCode: '121190860023' },
  { package: 'ZİPLİ AMBALAJ', tr: 'Yaprak Kekik', en: 'Oregano', gr: 15, stok: 400, fiyat: 0.99, hsCode: '91099390000' },
  { package: 'ZİPLİ AMBALAJ', tr: 'Çemen Tane', en: 'Fenugreek Seeds', gr: 50, stok: 200, fiyat: 0.99, hsCode: '91099100000' },
  { package: 'ZİPLİ AMBALAJ', tr: 'Çemen Toz', en: 'Fenugreek Powder', gr: 60, stok: 200, fiyat: 0.99, hsCode: '91099100000' },
  { package: 'ZİPLİ AMBALAJ', tr: 'Kimyon Tane', en: 'Cumin Seeds', gr: 40, stok: 400, fiyat: 0.99, hsCode: '90931000000' },
  { package: 'ZİPLİ AMBALAJ', tr: 'Kimyon Toz', en: 'Cumin Ground', gr: 50, stok: 400, fiyat: 0.99, hsCode: '90932000000' },
  { package: 'ZİPLİ AMBALAJ', tr: 'Kişniş Tane', en: 'Coriander Seeds', gr: 20, stok: 400, fiyat: 0.99, hsCode: '90921000000' },
  { package: 'ZİPLİ AMBALAJ', tr: 'Kişniş Toz', en: 'Coriander Powder', gr: 50, stok: 400, fiyat: 0.99, hsCode: '90922000000' },
  { package: 'ZİPLİ AMBALAJ', tr: 'Susam', en: 'Sesame', gr: 60, stok: 400, fiyat: 0.99, hsCode: '120740900012' },
  { package: 'ZİPLİ AMBALAJ', tr: 'Çörek Otu', en: 'Black Seeds', gr: 60, stok: 400, fiyat: 0.99, hsCode: '91099910014' },
  { package: 'ZİPLİ AMBALAJ', tr: 'Mavi Haşhaş', en: 'Blue Poppy Seeds', gr: 60, stok: 200, fiyat: 0.99, hsCode: '110429890000' },
  { package: 'ZİPLİ AMBALAJ', tr: 'Hindistan Cevizi', en: 'Shredded Coconut', gr: 40, stok: 200, fiyat: 0.99, hsCode: '80111000000' },
  { package: 'ZİPLİ AMBALAJ', tr: 'Susam Kavrulmuş', en: 'Sesame Roasted', gr: 60, stok: 200, fiyat: 0.99, hsCode: '120740900012' },
  { package: 'ZİPLİ AMBALAJ', tr: 'Çubuk Tarçın', en: 'Cinnamon Sticks', gr: 40, stok: 400, fiyat: 0.99, hsCode: '90620000000' },
  { package: 'ZİPLİ AMBALAJ', tr: 'Tarçın Toz', en: 'Cinnamon Powder', gr: 40, stok: 200, fiyat: 0.99, hsCode: '90620000000' },
  { package: 'ZİPLİ AMBALAJ', tr: 'Karabiber Toz', en: 'Black Pepper Ground', gr: 50, stok: 400, fiyat: 0.99, hsCode: '90412000000' },
  { package: 'ZİPLİ AMBALAJ', tr: 'Karabiber İri Çekilmiş', en: 'Black Pepper Coarse', gr: 30, stok: 400, fiyat: 0.99, hsCode: '90412000000' },
  { package: 'ZİPLİ AMBALAJ', tr: 'Karabiber Tane', en: 'Black Peppercorns', gr: 50, stok: 400, fiyat: 0.99, hsCode: '90411000000' },
  { package: 'ZİPLİ AMBALAJ', tr: 'Karanfil Tane', en: 'Cloves', gr: 30, stok: 400, fiyat: 0.99, hsCode: '90710000000' },
  { package: 'ZİPLİ AMBALAJ', tr: 'Karanfil Toz', en: 'Cloves Ground', gr: 30, stok: 200, fiyat: 0.99, hsCode: '90720000000' },
  { package: 'ZİPLİ AMBALAJ', tr: 'Sarımsak Tozu', en: 'Garlic Powder', gr: 30, stok: 200, fiyat: 0.99, hsCode: '71290900011' },
  { package: 'ZİPLİ AMBALAJ', tr: 'Soğan Tozu', en: 'Onion Powder', gr: 30, stok: 200, fiyat: 0.99, hsCode: '71220000000' },
  { package: 'ZİPLİ AMBALAJ', tr: 'Yenibahar Toz', en: 'Allspice Powder', gr: 30, stok: 200, fiyat: 0.99, hsCode: '90422000012' },
  { package: 'ZİPLİ AMBALAJ', tr: 'Zencefil Toz', en: 'Ginger Powder', gr: 50, stok: 400, fiyat: 0.99, hsCode: '91012000000' },
  { package: 'ZİPLİ AMBALAJ', tr: 'Zerdeçal Toz', en: 'Turmeric Powder', gr: 50, stok: 400, fiyat: 0.99, hsCode: '91030000000' },
  { package: 'ZİPLİ AMBALAJ', tr: 'Karbonat', en: 'Baking soda', gr: 80, stok: 400, fiyat: 0.99, hsCode: '283630000000' },
  { package: 'ZİPLİ AMBALAJ', tr: 'Limon Tuzu Toz', en: 'Citric Acid Powder', gr: 100, stok: 400, fiyat: 0.99, hsCode: '291815009029' },
  { package: 'ZİPLİ AMBALAJ', tr: 'Et Baharatı', en: 'Meat Seasoning', gr: 50, stok: 400, fiyat: 0.99, hsCode: '91091900000' },
  { package: 'ZİPLİ AMBALAJ', tr: 'Garam Masala', en: 'Garam Masala', gr: 60, stok: 100, fiyat: 0.99, hsCode: '91091900000' },
  { package: 'ZİPLİ AMBALAJ', tr: 'Kerrie Masala', en: 'Kerrie Masala', gr: 60, stok: 400, fiyat: 0.99, hsCode: '91091900000' },
  { package: 'ZİPLİ AMBALAJ', tr: 'Köri', en: 'Curry', gr: 50, stok: 400, fiyat: 0.99, hsCode: '91091900000' },
  { package: 'ZİPLİ AMBALAJ', tr: 'Köri Acılı', en: 'Hot Madras Curry', gr: 50, stok: 200, fiyat: 0.99, hsCode: '91091900000' },
  { package: 'ZİPLİ AMBALAJ', tr: 'Mangal Baharatı', en: 'Barbecue Seasoning', gr: 50, stok: 400, fiyat: 0.99, hsCode: '91091900000' },
  { package: 'ZİPLİ AMBALAJ', tr: 'Patates Baharatı', en: 'Fries Seasoning', gr: 50, stok: 200, fiyat: 0.99, hsCode: '91091900000' },
  { package: 'ZİPLİ AMBALAJ', tr: 'Ras El Hanout', en: 'Ras El Hanout', gr: 50, stok: 200, fiyat: 0.99, hsCode: '91091900000' },
  { package: 'ZİPLİ AMBALAJ', tr: 'Sarımsaklı Çeşni', en: 'Garlic Mix', gr: 50, stok: 200, fiyat: 0.99, hsCode: '91091900000' },
  { package: 'ZİPLİ AMBALAJ', tr: 'Tavuk Baharatı', en: 'Chicken Seasoning', gr: 60, stok: 400, fiyat: 0.99, hsCode: '91091900000' },
  { package: 'ZİPLİ AMBALAJ', tr: 'Yedi Türlü', en: '7 spice', gr: 50, stok: 400, fiyat: 0.99, hsCode: '91091900000' },
  { package: 'ORTA PETLER', tr: 'İsot Biber', en: 'Isot Pepper', gr: 150, stok: 240, fiyat: 2.49, hsCode: '90422000011' },
  { package: 'ORTA PETLER', tr: 'Pul Biber Acı', en: 'Chili Flakes', gr: 150, stok: 600, fiyat: 2.49, hsCode: '90422000011' },
  { package: 'ORTA PETLER', tr: 'Pul Biber Tatlı', en: 'Sweet Paprika Flakes', gr: 150, stok: 360, fiyat: 2.49, hsCode: '90422000011' },
  { package: 'ORTA PETLER', tr: 'Sumak', en: 'Sumac', gr: 150, stok: 600, fiyat: 2.49, hsCode: '91099910013' },
  { package: 'ORTA PETLER', tr: 'Sumak Tüm', en: 'Sumac Whole', gr: 100, stok: 120, fiyat: 2.49, hsCode: '91099910013' },
  { package: 'ORTA PETLER', tr: 'Süper Acı Pul biber', en: 'Chili Flakes Extra Hot', gr: 150, stok: 240, fiyat: 2.49, hsCode: '90422000011' },
  { package: 'ORTA PETLER', tr: 'Toz Acı Biber', en: 'Chili Powder', gr: 150, stok: 600, fiyat: 2.49, hsCode: '90422000011' },
  { package: 'ORTA PETLER', tr: 'Toz Tatlı Biber', en: 'Sweet Paprika Powder', gr: 150, stok: 600, fiyat: 2.49, hsCode: '90422000011' },
  { package: 'ORTA PETLER', tr: 'Defne Yaprağı', en: 'Bay Leaf', gr: 8, stok: 360, fiyat: 2.49, hsCode: '91099500000' },
  { package: 'ORTA PETLER', tr: 'Nane', en: 'Mint flakes', gr: 60, stok: 600, fiyat: 1.49, hsCode: '121190860023' },
  { package: 'ORTA PETLER', tr: 'Sivri Kekik', en: 'Thyme', gr: 60, stok: 240, fiyat: 1.49, hsCode: '91099310000' },
  { package: 'ORTA PETLER', tr: 'Yaprak Kekik', en: 'Oregano', gr: 40, stok: 600, fiyat: 1.49, hsCode: '91099390000' },
  { package: 'ORTA PETLER', tr: 'Çemen Tane', en: 'Fenugreek Seeds', gr: 250, stok: 240, fiyat: 2.49, hsCode: '91099100000' },
  { package: 'ORTA PETLER', tr: 'Çemen Toz', en: 'Fenugreek Powder', gr: 200, stok: 240, fiyat: 2.49, hsCode: '91099100000' },
  { package: 'ORTA PETLER', tr: 'Chia Tohumu', en: 'Chia Seeds', gr: 200, stok: 120, fiyat: 2.49, hsCode: '120799960011' },
  { package: 'ORTA PETLER', tr: 'Frenk Kimyonu Tane', en: 'Caraway Seeds', gr: 150, stok: 360, fiyat: 2.49, hsCode: '90962000000' },
  { package: 'ORTA PETLER', tr: 'Keten Tohumu', en: 'Flaxseed', gr: 200, stok: 240, fiyat: 2.49, hsCode: '120400900000' },
  { package: 'ORTA PETLER', tr: 'Kimyon Tane', en: 'Cumin Seeds', gr: 150, stok: 600, fiyat: 2.49, hsCode: '90931000000' },
  { package: 'ORTA PETLER', tr: 'Kimyon Toz', en: 'Cumin Ground', gr: 180, stok: 600, fiyat: 2.49, hsCode: '90932000000' },
  { package: 'ORTA PETLER', tr: 'Kişniş Tane', en: 'Coriander Seeds', gr: 70, stok: 600, fiyat: 2.49, hsCode: '90921000000' },
  { package: 'ORTA PETLER', tr: 'Kişniş Toz', en: 'Coriander Powder', gr: 150, stok: 600, fiyat: 2.49, hsCode: '90922000000' },
  { package: 'ORTA PETLER', tr: 'Susam', en: 'Sesame', gr: 180, stok: 600, fiyat: 2.49, hsCode: '120740900012' },
  { package: 'ORTA PETLER', tr: 'Çörek Otu', en: 'Black Seeds', gr: 180, stok: 600, fiyat: 2.49, hsCode: '91099910014' },
  { package: 'ORTA PETLER', tr: 'Mavi Haşhaş', en: 'Blue Poppy Seeds', gr: 180, stok: 240, fiyat: 2.49, hsCode: '110429890000' },
  { package: 'ORTA PETLER', tr: 'Hindistan Cevizi', en: 'Shredded Coconut', gr: 120, stok: 240, fiyat: 2.49, hsCode: '80111000000' },
  { package: 'ORTA PETLER', tr: 'Susam&Çörek Otu', en: 'Sesame&Black Seeds', gr: 180, stok: 600, fiyat: 2.49, hsCode: '91091900000' },
  { package: 'ORTA PETLER', tr: 'Susam Kavrulmuş', en: 'Sesame Roasted', gr: 180, stok: 240, fiyat: 2.49, hsCode: '120740900012' },
  { package: 'ORTA PETLER', tr: 'Beyaz Biber Tane', en: 'White Peppercorns', gr: 150, stok: 240, fiyat: 2.49, hsCode: '90422000018' },
  { package: 'ORTA PETLER', tr: 'Beyaz Biber Toz', en: 'White Pepper Ground', gr: 150, stok: 240, fiyat: 3.49, hsCode: '90422000018' },
  { package: 'ORTA PETLER', tr: 'Çubuk Tarçın', en: 'Cinnamon Sticks', gr: 60, stok: 600, fiyat: 3.49, hsCode: '90620000000' },
  { package: 'ORTA PETLER', tr: 'Tarçın Toz', en: 'Cinnamon Powder', gr: 150, stok: 240, fiyat: 2.49, hsCode: '90620000000' },
  { package: 'ORTA PETLER', tr: 'Karabiber Toz', en: 'Black Pepper Ground', gr: 150, stok: 600, fiyat: 2.49, hsCode: '90412000000' },
  { package: 'ORTA PETLER', tr: 'Karabiber İri Çekilmiş', en: 'Black Pepper Coarse', gr: 150, stok: 240, fiyat: 2.49, hsCode: '90412000000' },
  { package: 'ORTA PETLER', tr: 'Karabiber Tane', en: 'Black Peppercorns', gr: 150, stok: 240, fiyat: 2.99, hsCode: '90411000000' },
  { package: 'ORTA PETLER', tr: 'Karanfil Tane', en: 'Cloves', gr: 90, stok: 600, fiyat: 2.99, hsCode: '90710000000' },
  { package: 'ORTA PETLER', tr: 'Karanfil Toz', en: 'Cloves Ground', gr: 170, stok: 240, fiyat: 2.49, hsCode: '90720000000' },
  { package: 'ORTA PETLER', tr: 'Sarımsak Granül', en: 'Garlic Granules', gr: 180, stok: 240, fiyat: 3.49, hsCode: '71290900011' },
  { package: 'ORTA PETLER', tr: 'Sarımsak Tozu', en: 'Garlic Powder', gr: 130, stok: 240, fiyat: 2.49, hsCode: '71290900011' },
  { package: 'ORTA PETLER', tr: 'Soğan Tozu', en: 'Onion Powder', gr: 140, stok: 240, fiyat: 2.49, hsCode: '71220000000' },
  { package: 'ORTA PETLER', tr: 'Yenibahar Tane', en: 'Allspice Whole', gr: 100, stok: 120, fiyat: 2.49, hsCode: '90422000012' },
  { package: 'ORTA PETLER', tr: 'Yenibahar Toz', en: 'Allspice Powder', gr: 150, stok: 120, fiyat: 2.49, hsCode: '90422000012' },
  { package: 'ORTA PETLER', tr: 'Yıldız Anason', en: 'Star Anise', gr: 60, stok: 120, fiyat: 3.49, hsCode: '90962000000' },
  { package: 'ORTA PETLER', tr: 'Zencefil Toz', en: 'Ginger Powder', gr: 150, stok: 600, fiyat: 2.49, hsCode: '91012000000' },
  { package: 'ORTA PETLER', tr: 'Zerdeçal Toz', en: 'Turmeric Powder', gr: 150, stok: 600, fiyat: 2.49, hsCode: '91030000000' },
  { package: 'ORTA PETLER', tr: 'Deniz Tuzu Toz', en: 'Sea Salt Powder', gr: 350, stok: 120, fiyat: 2.49, hsCode: '250100910000' },
  { package: 'ORTA PETLER', tr: 'Himalaya Tuzu Toz', en: 'Himalayan Salt Powder', gr: 350, stok: 120, fiyat: 1.19, hsCode: '250100910000' },
  { package: 'ORTA PETLER', tr: 'Karbonat', en: 'Baking soda', gr: 350, stok: 360, fiyat: 1.48, hsCode: '283630000000' },
  { package: 'ORTA PETLER', tr: 'Kaya Tuzu Toz', en: 'Rock Salt Powder', gr: 350, stok: 120, fiyat: 2.49, hsCode: '250100910000' },
  { package: 'ORTA PETLER', tr: 'Limon Tuzu Toz', en: 'Citric Acid Powder', gr: 300, stok: 600, fiyat: 1.49, hsCode: '291815009029' },
  { package: 'ORTA PETLER', tr: 'Biryani Masala', en: 'Biryani Masala', gr: 160, stok: 360, fiyat: 2.49, hsCode: '91091900000' },
  { package: 'ORTA PETLER', tr: 'Döner Baharatı', en: 'Doner Seasoning', gr: 160, stok: 240, fiyat: 2.49, hsCode: '91091900000' },
  { package: 'ORTA PETLER', tr: 'Et Baharatı', en: 'Meat Seasoning', gr: 150, stok: 360, fiyat: 2.49, hsCode: '91091900000' },
  { package: 'ORTA PETLER', tr: 'Garam Masala', en: 'Garam Masala', gr: 180, stok: 360, fiyat: 2.49, hsCode: '91091900000' },
  { package: 'ORTA PETLER', tr: 'Köfte Harcı', en: 'Kofta Seasoning', gr: 180, stok: 240, fiyat: 2.49, hsCode: '91091900000' },
  { package: 'ORTA PETLER', tr: 'Köri', en: 'Curry', gr: 150, stok: 600, fiyat: 2.49, hsCode: '91091900000' },
  { package: 'ORTA PETLER', tr: 'Köri Acılı', en: 'Hot Madras Curry', gr: 160, stok: 240, fiyat: 2.49, hsCode: '91091900000' },
  { package: 'ORTA PETLER', tr: 'Mangal Baharatı', en: 'Barbecue Seasoning', gr: 200, stok: 360, fiyat: 2.49, hsCode: '91091900000' },
  { package: 'ORTA PETLER', tr: 'Merguez Baharatı', en: 'Merguez Sausage Seasoning', gr: 160, stok: 360, fiyat: 2.49, hsCode: '91091900000' },
  { package: 'ORTA PETLER', tr: 'Patates Baharatı', en: 'Fries Seasoning', gr: 160, stok: 120, fiyat: 2.49, hsCode: '91091900000' },
  { package: 'ORTA PETLER', tr: 'Pilav Baharatı', en: 'Rice Seasoning', gr: 180, stok: 240, fiyat: 2.49, hsCode: '91091900000' },
  { package: 'ORTA PETLER', tr: 'Tandoori Masala', en: 'Tandoori Masala', gr: 160, stok: 360, fiyat: 2.49, hsCode: '91091900000' },
  { package: 'ORTA PETLER', tr: 'Tavuk Baharatı', en: 'Chicken Seasoning', gr: 200, stok: 360, fiyat: 2.49, hsCode: '91091900000' },
  { package: 'ORTA PETLER', tr: 'Yedi Türlü', en: '7 spice', gr: 150, stok: 600, fiyat: 2.49, hsCode: '91091900000' },
  { package: 'BÜYÜK PETLER', tr: 'İsot Biber', en: 'Isot Pepper', gr: 500, stok: 60, fiyat: 5.49, hsCode: '90422000011' },
  { package: 'BÜYÜK PETLER', tr: 'Pul Biber Acı', en: 'Chili Flakes', gr: 500, stok: 120, fiyat: 5.49, hsCode: '90422000011' },
  { package: 'BÜYÜK PETLER', tr: 'Pul Biber Tatlı', en: 'Sweet Paprika Flakes', gr: 500, stok: 120, fiyat: 5.49, hsCode: '90422000011' },
  { package: 'BÜYÜK PETLER', tr: 'Sumak', en: 'Sumac', gr: 600, stok: 120, fiyat: 5.49, hsCode: '91099910013' },
  { package: 'BÜYÜK PETLER', tr: 'Toz Acı Biber', en: 'Chili Powder', gr: 500, stok: 120, fiyat: 5.49, hsCode: '90422000011' },
  { package: 'BÜYÜK PETLER', tr: 'Toz Tatlı Biber', en: 'Sweet Paprika Powder', gr: 400, stok: 120, fiyat: 5.49, hsCode: '90422000011' },
  { package: 'BÜYÜK PETLER', tr: 'Biberiye', en: 'Rosemary Leaves', gr: 270, stok: 60, fiyat: 5.49, hsCode: '121190860041' },
  { package: 'BÜYÜK PETLER', tr: 'Maydanoz Kurusu', en: 'Parsley Flakes', gr: 150, stok: 180, fiyat: 2.99, hsCode: '71290900029' },
  { package: 'BÜYÜK PETLER', tr: 'Nane', en: 'Mint flakes', gr: 180, stok: 120, fiyat: 2.99, hsCode: '121190860023' },
  { package: 'BÜYÜK PETLER', tr: 'Yaprak Kekik', en: 'Oregano', gr: 140, stok: 240, fiyat: 5.99, hsCode: '91099390000' },
  { package: 'BÜYÜK PETLER', tr: 'Kimyon Tane', en: 'Cumin Seeds', gr: 450, stok: 120, fiyat: 6.49, hsCode: '90931000000' },
  { package: 'BÜYÜK PETLER', tr: 'Kimyon Toz', en: 'Cumin Ground', gr: 500, stok: 120, fiyat: 5.49, hsCode: '90932000000' },
  { package: 'BÜYÜK PETLER', tr: 'Kişniş Tane', en: 'Coriander Seeds', gr: 250, stok: 120, fiyat: 5.49, hsCode: '90921000000' },
  { package: 'BÜYÜK PETLER', tr: 'Kişniş Toz', en: 'Coriander Powder', gr: 400, stok: 120, fiyat: 5.49, hsCode: '90922000000' },
  { package: 'BÜYÜK PETLER', tr: 'Susam', en: 'Sesame', gr: 500, stok: 120, fiyat: 5.49, hsCode: '120740900012' },
  { package: 'BÜYÜK PETLER', tr: 'Çörek Otu', en: 'Black Seeds', gr: 500, stok: 120, fiyat: 5.49, hsCode: '91099910014' },
  { package: 'BÜYÜK PETLER', tr: 'Hindistan Cevizi', en: 'Shredded Coconut', gr: 350, stok: 60, fiyat: 5.49, hsCode: '80111000000' },
  { package: 'BÜYÜK PETLER', tr: 'Susam&Çörek Otu', en: 'Sesame&Black Seeds', gr: 500, stok: 60, fiyat: 7.99, hsCode: '91091900000' },
  { package: 'BÜYÜK PETLER', tr: 'Karabiber Toz', en: 'Black Pepper Ground', gr: 500, stok: 180, fiyat: 7.99, hsCode: '90412000000' },
  { package: 'BÜYÜK PETLER', tr: 'Karanfil Tane', en: 'Cloves', gr: 350, stok: 120, fiyat: 2.99, hsCode: '90710000000' },
  { package: 'BÜYÜK PETLER', tr: 'Soğan Tozu', en: 'Onion Powder', gr: 350, stok: 180, fiyat: 5.49, hsCode: '71220000000' },
  { package: 'BÜYÜK PETLER', tr: 'Karbonat', en: 'Baking soda', gr: 1200, stok: 120, fiyat: 5.49, hsCode: '283630000000' },
  { package: 'BÜYÜK PETLER', tr: 'Limon Tuzu Toz', en: 'Citric Acid Powder', gr: 900, stok: 120, fiyat: 5.49, hsCode: '291815009029' },
  { package: 'BÜYÜK PETLER', tr: 'Köri', en: 'Curry', gr: 500, stok: 120, fiyat: 5.49, hsCode: '91091900000' },
  { package: 'BÜYÜK PETLER', tr: 'Mangal Baharatı', en: 'Barbecue Seasoning', gr: 700, stok: 60, fiyat: 5.49, hsCode: '91091900000' },
  { package: 'BÜYÜK PETLER', tr: 'Patates Baharatı', en: 'Fries Seasoning', gr: 600, stok: 60, fiyat: 5.49, hsCode: '91091900000' },
  { package: 'BÜYÜK PETLER', tr: 'Tavuk Baharatı', en: 'Chicken Seasoning', gr: 700, stok: 60, fiyat: 2.99, hsCode: '91091900000' },
  { package: 'BÜYÜK PETLER', tr: 'Yedi Türlü', en: '7 spice', gr: 500, stok: 60, fiyat: 4.52, hsCode: '91091900000' },
  { package: 'SOSLAR', tr: 'LİMON SOSU 1000 ml', en: 'LEMON SAUCE 1000 ml', gr: 1000, stok: 240, fiyat: '', hsCode: '210390900018' },
  { package: 'SOSLAR', tr: 'LİMON SOSU 500 ml', en: 'LEMON SAUCE 500 ml', gr: 500, stok: 240, fiyat: '', hsCode: '210390900018' },
  { package: 'SOSLAR', tr: 'NAR EKŞİLİ SOS 1000 ml', en: 'POMEGRANATE SAUCE 1000 ml', gr: 1000, stok: 240, fiyat: '', hsCode: '210390900018' },
  { package: 'YAĞLAR', tr: 'ÇÖREKOTU YAĞI 250 ml', en: 'BLACK SEED OIL', gr: 250, stok: 120, fiyat: '', hsCode: '151620910029' },
  { package: 'YAĞLAR', tr: 'SUSAM YAĞI 250 ml', en: 'SESAME OIL 250 ml', gr: 250, stok: 120, fiyat: '', hsCode: '151620910026' },
  { package: 'SİRKELER', tr: 'BEYAZ SİRKE 1000 ml', en: 'WHITE VINEGAR 1000 ml', gr: 1000, stok: 120, fiyat: '', hsCode: '220900910000' },
  { package: 'SİRKELER', tr: 'ELMA SİRKESİ 1000 ml', en: 'APPLE VINEGAR 1000 ml', gr: 1000, stok: 120, fiyat: '', hsCode: '220900910000' },
  { package: 'SİRKELER', tr: 'ÜZÜM SİRKESİ 1000 ml', en: 'GRAPE VINEGAR 1000 ml', gr: 1000, stok: 120, fiyat: '', hsCode: '220900910000' },
  { package: 'KOVALAR', tr: 'Toz Tatlı Biber', en: 'Sweet Paprika Powder', gr: 5000, stok: 50, fiyat: '', hsCode: '90422000011' },
  { package: 'KOVALAR', tr: 'Maydanoz Kurusu', en: 'Parsley Flakes', gr: 1500, stok: 50, fiyat: '', hsCode: '71290900029' },
  { package: 'KOVALAR', tr: 'Yaprak Kekik', en: 'Oregano', gr: 1500, stok: 50, fiyat: '', hsCode: '91099390000' },
  { package: 'KOVALAR', tr: 'Karabiber Toz', en: 'Black Pepper Ground', gr: 5000, stok: 20, fiyat: '', hsCode: '90412000000' },
  { package: 'XL PETLER', tr: 'Toz Acı Biber', en: 'Chili Powder', gr: 2000, stok: 80, fiyat: 8.99, hsCode: '90422000011' },
  { package: 'XL PETLER', tr: 'Toz Tatlı Biber', en: 'Sweet Paprika Powder', gr: 2000, stok: 120, fiyat: 36.99, hsCode: '90422000011' },
  { package: 'XL PETLER', tr: 'İsot Biber', en: 'Isot Pepper', gr: 2000, stok: 36, fiyat: 45.99, hsCode: '90422000011' },
  { package: 'XL PETLER', tr: 'Yaprak Kekik', en: 'Oregano', gr: 500, stok: 100, fiyat: 18.99, hsCode: '91099390000' },
  { package: 'XL PETLER', tr: 'Maydanoz Kurusu', en: 'Parsley Flakes', gr: 600, stok: 100, fiyat: 24.99, hsCode: '71290900029' },
  { package: 'XL PETLER', tr: 'Kimyon Toz', en: 'Cumin Ground', gr: 2500, stok: 100, fiyat: 14.99, hsCode: '90932000000' },
  { package: 'XL PETLER', tr: 'Karabiber Toz', en: 'Black Pepper Ground', gr: 2500, stok: 100, fiyat: 17.99, hsCode: '90412000000' },
  { package: 'XL PETLER', tr: 'Beyaz Biber Toz', en: 'White Pepper Ground', gr: 2500, stok: 40, fiyat: 15.49, hsCode: '90422000018' },
  { package: 'XL PETLER', tr: 'Sarımsak Tozu', en: 'Garlic Powder', gr: 2000, stok: 80, fiyat: 8.99, hsCode: '71290900011' },
  { package: 'XL PETLER', tr: 'Soğan Tozu', en: 'Onion Powder', gr: 2000, stok: 80, fiyat: 8.99, hsCode: '71220000000' },
  { package: 'XL PETLER', tr: 'Pulbiber Çekirdekli', en: 'Chili Flakes', gr: 2000, stok: 60, fiyat: '', hsCode: '90422000011' },
  { package: 'XL PETLER', tr: 'Pulbiber', en: 'Chili Flakes', gr: 2000, stok: 60, fiyat: '', hsCode: '90422000011' },
  { package: 'STANTLAR', tr: 'BAHARAT STANDI', en: 'STANDARD SPICE SHELF', gr: 55000, stok: 7, fiyat: 14.20, hsCode: '940389000000' },
  { package: 'BİTKİ ÇAYLARI', tr: 'Boz Ada', en: 'Sage Tea', gr: 30, stok: 144, fiyat: 0.80, hsCode: '121190860026' },
  { package: 'BİTKİ ÇAYLARI', tr: 'Ihlamur', en: 'Lınden Tea', gr: 30, stok: 72, fiyat: 1.95, hsCode: '121190860024' },
  { package: 'BİTKİ ÇAYLARI', tr: 'Biberiye', en: 'Rosemary Leaves', gr: 80, stok: 72, fiyat: 0.91, hsCode: '121190860041' },
  { package: 'BİTKİ ÇAYLARI', tr: 'Tarçın Çubuk(Kabuk)', en: 'Cinnamon Sticks', gr: 80, stok: 72, fiyat: 1.25, hsCode: '90620000000' },
  { package: 'BİTKİ ÇAYLARI', tr: 'Defne Yaprağı', en: 'Bay Leaf', gr: 15, stok: 144, fiyat: 0.74, hsCode: '91099500000' },
  { package: 'BİTKİ ÇAYLARI', tr: 'Dağ Kekiği', en: 'Wild Thyme', gr: 50, stok: 72, fiyat: 1.00, hsCode: '91099310000' },
  { package: 'BİTKİ ÇAYLARI', tr: 'Keten Tohumu', en: 'Flaxseed', gr: 250, stok: 72, fiyat: 1.15, hsCode: '120400900000' },
  { package: 'BİTKİ ÇAYLARI', tr: 'Kuşburnu Çayı', en: 'Rosehip Tea', gr: 150, stok: 72, fiyat: 2.00, hsCode: '121190860039' },
  { package: 'BİTKİ ÇAYLARI', tr: 'Melisa', en: 'Melissa(lemon balm)', gr: 30, stok: 72, fiyat: 2.40, hsCode: '121190860039' },
  { package: 'BİTKİ ÇAYLARI', tr: 'Nar Çiçeği', en: 'Hibiscus', gr: 70, stok: 72, fiyat: 1.10, hsCode: '121190860039' },
  { package: 'BİTKİ ÇAYLARI', tr: 'Papatya', en: 'Chamomile', gr: 40, stok: 144, fiyat: 1.50, hsCode: '121190860039' },
  { package: 'BİTKİ ÇAYLARI', tr: 'Rezene', en: 'Fennel', gr: 150, stok: 72, fiyat: 1.35, hsCode: '90962000000' },
  { package: 'BİTKİ ÇAYLARI', tr: 'Yeşilçay', en: 'Green Tea', gr: 100, stok: 72, fiyat: 2.20, hsCode: '90210000000' },
  { package: 'BİTKİ ÇAYLARI', tr: 'Zencefil Tane', en: 'Gınger Whole', gr: 200, stok: 72, fiyat: 2.10, hsCode: '91012000000' },
  { package: 'BİTKİ ÇAYLARI', tr: 'Zerdeçal Tane', en: 'Turmerıc Whole', gr: 200, stok: 72, fiyat: 1.70, hsCode: '91030000000' },
  { package: 'BİTKİ ÇAYLARI', tr: 'Kış Çayı', en: 'Wınter Tea', gr: 100, stok: 72, fiyat: 1.70, hsCode: '121190860039' },
  { package: 'BİTKİ ÇAYLARI', tr: 'Form Çayı', en: 'Form Tea', gr: 80, stok: 72, fiyat: 1.15, hsCode: '121190860039' },
  { package: 'BİTKİ ÇAYLARI', tr: 'Lavanta', en: 'Lavander', gr: 60, stok: 72, fiyat: 0.89, hsCode: '121190860039' },
  { package: 'BİTKİ ÇAYLARI', tr: 'Civan Perçemi', en: 'Yarrow', gr: 30, stok: 72, fiyat: 0.85, hsCode: '121190860039' },
  { package: 'BİTKİ ÇAYLARI', tr: 'Ekinezya-Reyhan', en: 'Echinacea-Basıl', gr: 50, stok: 72, fiyat: 1.45, hsCode: '121190860039' },
  { package: 'BİTKİ ÇAYLARI', tr: 'Anason', en: 'Anise Seeds', gr: 180, stok: 72, fiyat: 1.65, hsCode: '90962000000' },
  { package: 'BİTKİ ÇAYLARI', tr: 'Kiraz Sapı', en: 'Cherry Stem', gr: 40, stok: 72, fiyat: 0.89, hsCode: '121190860039' },
  { package: 'BİTKİ ÇAYLARI', tr: 'Chıa Tohumu', en: 'Chıa Seeds', gr: 200, stok: 72, fiyat: 1.60, hsCode: '121190860039' },
  { package: 'BİTKİ ÇAYLARI', tr: 'Tomurcuk Gül Çayı', en: 'Rose Buds', gr: 30, stok: 72, fiyat: 1.15, hsCode: '121190860039' },
  { package: 'BİTKİ ÇAYLARI', tr: 'Mor Reyhan', en: 'Purple Basil', gr: 30, stok: 72, fiyat: 1.10, hsCode: '71290900029' },
];

async function run() {
  const sql = postgres(directConnection, { max: 1, ssl: 'require' });
  console.log('🔄 Tüm ürünler ve kategoriler siliniyor, yeni liste ekleniyor...\n');

  try {
    // 1. FK referanslarını kaldır
    await sql.unsafe('DELETE FROM cart');
    console.log('✅ cart temizlendi');

    await sql.unsafe('UPDATE order_items SET product_id = NULL WHERE product_id IS NOT NULL');
    console.log('✅ order_items.product_id null yapıldı');

    await sql.unsafe('DELETE FROM dealer_sale_items');
    console.log('✅ dealer_sale_items silindi');

    // 2. Tüm ürünleri sil
    await sql.unsafe('DELETE FROM products');
    console.log('✅ products silindi');

    // 3. Tüm kategorileri sil
    await sql.unsafe('DELETE FROM categories');
    console.log('✅ categories silindi');

    // 4. base_name_fr / base_name_en kolonları
    await sql.unsafe(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS base_name_fr VARCHAR(255);
      ALTER TABLE products ADD COLUMN IF NOT EXISTS base_name_en VARCHAR(255);
    `);
    console.log('✅ base_name_fr / base_name_en kolonları kontrol edildi');

    // 5. categories tablosuna name_fr, name_en ekle
    await sql.unsafe(`
      ALTER TABLE categories ADD COLUMN IF NOT EXISTS name_fr VARCHAR(255);
      ALTER TABLE categories ADD COLUMN IF NOT EXISTS name_en VARCHAR(255);
    `);
    console.log('✅ categories name_fr / name_en kolonları kontrol edildi');

    // 6. Kategorileri oluştur
    const categoryMap = new Map<string, number>();
    let sortOrder = 0;
    for (const [trName, translations] of Object.entries(CATEGORY_MAP)) {
      const slug = slugify(trName);
      const result = await sql`
        INSERT INTO categories (name, name_fr, name_en, slug, sort_order, is_active)
        VALUES (${trName}, ${translations.fr}, ${translations.en}, ${slug}, ${sortOrder++}, true)
        RETURNING id
      `;
      categoryMap.set(trName, result[0].id);
      console.log(`✅ Kategori oluşturuldu: ${trName} (ID: ${result[0].id})`);
    }

    // 7. Ürünleri ekle
    let inserted = 0;
    for (const row of PRODUCT_LIST) {
      const baseTr = row.tr;
      const baseEn = row.en;
      const baseFr = getFrName(baseTr);
      const weight = row.gr;
      const unit = (row.package === 'SOSLAR' || row.package === 'YAĞLAR' || row.package === 'SİRKELER') ? 'ml' : 'Gr';
      const nameTr = `${baseTr} ${weight} ${unit}`;
      const slugBase = slugify(baseEn);
      const slug = `${slugBase}-${weight}-${unit.toLowerCase()}`;
      const sku = generateSku(baseEn, weight);
      const categoryId = categoryMap.get(row.package) || null;
      const price = row.fiyat === '' || row.fiyat === null ? '0.00' : String(row.fiyat);

      await sql`
        INSERT INTO products (name, base_name, base_name_fr, base_name_en, slug, sku, price, stock, weight, unit, category_id, is_active, track_stock)
        VALUES (${nameTr}, ${baseTr}, ${baseFr}, ${baseEn}, ${slug}, ${sku}, ${price}, ${row.stok}, ${String(weight)}, ${unit}, ${categoryId}, true, true)
      `;
      inserted++;
    }
    console.log(`\n✅ ${inserted} ürün eklendi.`);

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
