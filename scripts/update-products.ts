import { db } from '../src/db';
import { products, categories } from '../src/db/schema';

interface ProductData {
  kategori: string;
  urunIsmi: string;
  gr: number | string;
  adet: number | string;
  fiyat: number | string;
  urunKodu: string;
}

// Tüm ürün verileri - Excel'den alınan veriler
const productData: ProductData[] = [
  { kategori: 'ZİPLİ AMBALAJ', urunIsmi: 'Isot Pepper', gr: 50, adet: 400, fiyat: 0.70, urunKodu: '90422000011' },
  { kategori: 'ZİPLİ AMBALAJ', urunIsmi: 'Chili Flakes', gr: 60, adet: 400, fiyat: 0.76, urunKodu: '90422000011' },
  { kategori: 'ZİPLİ AMBALAJ', urunIsmi: 'Sweet Paprika Flakes', gr: 50, adet: 400, fiyat: 0.80, urunKodu: '90422000011' },
  { kategori: 'ZİPLİ AMBALAJ', urunIsmi: 'Sumac', gr: 50, adet: 400, fiyat: 0.70, urunKodu: '91099910013' },
  { kategori: 'ZİPLİ AMBALAJ', urunIsmi: 'Chili Flakes Extra Hot', gr: 50, adet: 200, fiyat: 0.82, urunKodu: '90422000011' },
  { kategori: 'ZİPLİ AMBALAJ', urunIsmi: 'Chili Powder', gr: 40, adet: 400, fiyat: 0.65, urunKodu: '90422000011' },
  { kategori: 'ZİPLİ AMBALAJ', urunIsmi: 'Sweet Paprika Powder', gr: 40, adet: 400, fiyat: 0.70, urunKodu: '90422000011' },
  { kategori: 'ZİPLİ AMBALAJ', urunIsmi: 'Bay Leaf', gr: 10, adet: 400, fiyat: 0.60, urunKodu: '91099500000' },
  { kategori: 'ZİPLİ AMBALAJ', urunIsmi: 'Mint flakes', gr: 25, adet: 400, fiyat: 0.55, urunKodu: '12119100000' },
  { kategori: 'ZİPLİ AMBALAJ', urunIsmi: 'Oregano', gr: 15, adet: 400, fiyat: 0.45, urunKodu: '91099390000' },
  { kategori: 'ZİPLİ AMBALAJ', urunIsmi: 'Fenugreek Seeds', gr: 50, adet: 200, fiyat: 0.41, urunKodu: '91099100000' },
  { kategori: 'ZİPLİ AMBALAJ', urunIsmi: 'Fenugreek Powder', gr: 60, adet: 200, fiyat: 0.44, urunKodu: '91099100000' },
  { kategori: 'ZİPLİ AMBALAJ', urunIsmi: 'Cumin Seeds', gr: 40, adet: 400, fiyat: 0.80, urunKodu: '90931000000' },
  { kategori: 'ZİPLİ AMBALAJ', urunIsmi: 'Cumin Ground', gr: 50, adet: 400, fiyat: 0.90, urunKodu: '90932000000' },
  { kategori: 'ZİPLİ AMBALAJ', urunIsmi: 'Coriander Seeds', gr: 20, adet: 400, fiyat: 0.34, urunKodu: '90921000000' },
  { kategori: 'ZİPLİ AMBALAJ', urunIsmi: 'Coriander Powder', gr: 50, adet: 400, fiyat: 0.41, urunKodu: '90922000000' },
  { kategori: 'ZİPLİ AMBALAJ', urunIsmi: 'Sesame', gr: 60, adet: 400, fiyat: 0.54, urunKodu: '12074100000' },
  { kategori: 'ZİPLİ AMBALAJ', urunIsmi: 'Black Seeds', gr: 60, adet: 400, fiyat: 0.55, urunKodu: '91099910014' },
  { kategori: 'ZİPLİ AMBALAJ', urunIsmi: 'Blue Poppy Seeds', gr: 60, adet: 200, fiyat: 0.71, urunKodu: '11043000000' },
  { kategori: 'ZİPLİ AMBALAJ', urunIsmi: 'Shredded Coconut', gr: 40, adet: 200, fiyat: 0.75, urunKodu: '80111000000' },
  { kategori: 'ZİPLİ AMBALAJ', urunIsmi: 'Sesame Roasted', gr: 60, adet: 200, fiyat: 0.62, urunKodu: '12074100000' },
  { kategori: 'ZİPLİ AMBALAJ', urunIsmi: 'Cinnamon Sticks', gr: 40, adet: 400, fiyat: 0.90, urunKodu: '90620000000' },
  { kategori: 'ZİPLİ AMBALAJ', urunIsmi: 'Cinnamon Powder', gr: 40, adet: 200, fiyat: 0.92, urunKodu: '90620000000' },
  { kategori: 'ZİPLİ AMBALAJ', urunIsmi: 'Black Pepper Ground', gr: 50, adet: 400, fiyat: 1.00, urunKodu: '90412000000' },
  { kategori: 'ZİPLİ AMBALAJ', urunIsmi: 'Black Pepper Coarse', gr: 30, adet: 400, fiyat: 0.80, urunKodu: '90412000000' },
  { kategori: 'ZİPLİ AMBALAJ', urunIsmi: 'Black Peppercorns', gr: 50, adet: 400, fiyat: 1.00, urunKodu: '90411000000' },
  { kategori: 'ZİPLİ AMBALAJ', urunIsmi: 'Cloves', gr: 30, adet: 400, fiyat: 0.85, urunKodu: '90710000000' },
  { kategori: 'ZİPLİ AMBALAJ', urunIsmi: 'Cloves Ground', gr: 30, adet: 200, fiyat: 0.80, urunKodu: '90720000000' },
  { kategori: 'ZİPLİ AMBALAJ', urunIsmi: 'Garlic Powder', gr: 30, adet: 200, fiyat: 0.64, urunKodu: '71290900011' },
  { kategori: 'ZİPLİ AMBALAJ', urunIsmi: 'Onion Powder', gr: 30, adet: 200, fiyat: 0.61, urunKodu: '71220000000' },
  { kategori: 'ZİPLİ AMBALAJ', urunIsmi: 'Allspice Powder', gr: 30, adet: 200, fiyat: 0.85, urunKodu: '90422000012' },
  { kategori: 'ZİPLİ AMBALAJ', urunIsmi: 'Ginger Powder', gr: 50, adet: 400, fiyat: 0.80, urunKodu: '91012000000' },
  { kategori: 'ZİPLİ AMBALAJ', urunIsmi: 'Turmeric Powder', gr: 50, adet: 400, fiyat: 0.61, urunKodu: '91030000000' },
  { kategori: 'ZİPLİ AMBALAJ', urunIsmi: 'Baking soda', gr: 80, adet: 400, fiyat: 0.37, urunKodu: '28363000000' },
  { kategori: 'ZİPLİ AMBALAJ', urunIsmi: 'Citric Acid Powder', gr: 100, adet: 400, fiyat: 0.70, urunKodu: '29181500000' },
  { kategori: 'ZİPLİ AMBALAJ', urunIsmi: 'Meat Seasoning', gr: 50, adet: 400, fiyat: 0.58, urunKodu: '91091900000' },
  { kategori: 'ZİPLİ AMBALAJ', urunIsmi: 'Garam Masala', gr: 60, adet: 100, fiyat: 0.92, urunKodu: '91091900000' },
  { kategori: 'ZİPLİ AMBALAJ', urunIsmi: 'Kerrie Masala', gr: 60, adet: 400, fiyat: 0.65, urunKodu: '91091900000' },
  { kategori: 'ZİPLİ AMBALAJ', urunIsmi: 'Curry', gr: 50, adet: 400, fiyat: 0.68, urunKodu: '91091900000' },
  { kategori: 'ZİPLİ AMBALAJ', urunIsmi: 'Hot Madras Curry', gr: 50, adet: 200, fiyat: 0.68, urunKodu: '91091900000' },
  { kategori: 'ZİPLİ AMBALAJ', urunIsmi: 'Barbecue Seasoning', gr: 50, adet: 400, fiyat: 0.50, urunKodu: '91091900000' },
  { kategori: 'ZİPLİ AMBALAJ', urunIsmi: 'Fries Seasoning', gr: 50, adet: 200, fiyat: 0.58, urunKodu: '91091900000' },
  { kategori: 'ZİPLİ AMBALAJ', urunIsmi: 'Ras El Hanout', gr: 50, adet: 200, fiyat: 0.61, urunKodu: '91091900000' },
  { kategori: 'ZİPLİ AMBALAJ', urunIsmi: 'Garlic Mix', gr: 50, adet: 200, fiyat: 0.58, urunKodu: '91091900000' },
  { kategori: 'ZİPLİ AMBALAJ', urunIsmi: 'Chicken Seasoning', gr: 60, adet: 400, fiyat: 0.48, urunKodu: '91091900000' },
  { kategori: 'ZİPLİ AMBALAJ', urunIsmi: '7 spice', gr: 50, adet: 400, fiyat: 0.72, urunKodu: '91091900000' },
  { kategori: 'ORTA PETLER', urunIsmi: 'Isot Pepper', gr: 150, adet: 240, fiyat: 0, urunKodu: '90422000011' },
  { kategori: 'ORTA PETLER', urunIsmi: 'Chili Flakes', gr: 150, adet: 600, fiyat: 0, urunKodu: '90422000011' },
  { kategori: 'ORTA PETLER', urunIsmi: 'Sweet Paprika Flakes', gr: 150, adet: 360, fiyat: 0, urunKodu: '90422000011' },
  { kategori: 'ORTA PETLER', urunIsmi: 'Sumac', gr: 150, adet: 600, fiyat: 0, urunKodu: '91099910013' },
  { kategori: 'ORTA PETLER', urunIsmi: 'Sumac Whole', gr: 100, adet: 120, fiyat: 0, urunKodu: '91099910013' },
  { kategori: 'ORTA PETLER', urunIsmi: 'Chili Flakes Extra Hot', gr: 150, adet: 240, fiyat: 0, urunKodu: '90422000011' },
  { kategori: 'ORTA PETLER', urunIsmi: 'Chili Powder', gr: 150, adet: 600, fiyat: 0, urunKodu: '90422000011' },
  { kategori: 'ORTA PETLER', urunIsmi: 'Sweet Paprika Powder', gr: 150, adet: 600, fiyat: 0.76, urunKodu: '90422000011' },
  { kategori: 'ORTA PETLER', urunIsmi: 'Bay Leaf', gr: 8, adet: 360, fiyat: 0.74, urunKodu: '91099500000' },
  { kategori: 'ORTA PETLER', urunIsmi: 'Mint flakes', gr: 60, adet: 600, fiyat: 0.85, urunKodu: '12119100000' },
  { kategori: 'ORTA PETLER', urunIsmi: 'Thyme', gr: 60, adet: 240, fiyat: 0.99, urunKodu: '91099310000' },
  { kategori: 'ORTA PETLER', urunIsmi: 'Oregano', gr: 40, adet: 600, fiyat: 0.89, urunKodu: '91099390000' },
  { kategori: 'ORTA PETLER', urunIsmi: 'Fenugreek Seeds', gr: 250, adet: 240, fiyat: 0, urunKodu: '91099100000' },
  { kategori: 'ORTA PETLER', urunIsmi: 'Fenugreek Powder', gr: 200, adet: 240, fiyat: 0.99, urunKodu: '91099100000' },
  { kategori: 'ORTA PETLER', urunIsmi: 'Chia Seeds', gr: 200, adet: 120, fiyat: 0, urunKodu: '12080000000' },
  { kategori: 'ORTA PETLER', urunIsmi: 'Caraway Seeds', gr: 150, adet: 360, fiyat: 0, urunKodu: '90962000000' },
  { kategori: 'ORTA PETLER', urunIsmi: 'Flaxseed', gr: 200, adet: 240, fiyat: 0, urunKodu: '12040100000' },
  { kategori: 'ORTA PETLER', urunIsmi: 'Cumin Seeds', gr: 150, adet: 600, fiyat: 0, urunKodu: '90931000000' },
  { kategori: 'ORTA PETLER', urunIsmi: 'Cumin Ground', gr: 180, adet: 600, fiyat: 0, urunKodu: '90932000000' },
  { kategori: 'ORTA PETLER', urunIsmi: 'Coriander Seeds', gr: 70, adet: 600, fiyat: 0.75, urunKodu: '90921000000' },
  { kategori: 'ORTA PETLER', urunIsmi: 'Coriander Powder', gr: 150, adet: 600, fiyat: 0.87, urunKodu: '90922000000' },
  { kategori: 'ORTA PETLER', urunIsmi: 'Sesame', gr: 180, adet: 600, fiyat: 0, urunKodu: '12074100000' },
  { kategori: 'ORTA PETLER', urunIsmi: 'Black Seeds', gr: 180, adet: 600, fiyat: 0, urunKodu: '91099910014' },
  { kategori: 'ORTA PETLER', urunIsmi: 'Blue Poppy Seeds', gr: 180, adet: 240, fiyat: 0, urunKodu: '11043000000' },
  { kategori: 'ORTA PETLER', urunIsmi: 'Shredded Coconut', gr: 120, adet: 240, fiyat: 0, urunKodu: '80111000000' },
  { kategori: 'ORTA PETLER', urunIsmi: 'Sesame&Black Seeds', gr: 180, adet: 600, fiyat: 0, urunKodu: '91091900000' },
  { kategori: 'ORTA PETLER', urunIsmi: 'Sesame Roasted', gr: 180, adet: 240, fiyat: 0, urunKodu: '12074100000' },
  { kategori: 'ORTA PETLER', urunIsmi: 'White Peppercorns', gr: 150, adet: 240, fiyat: 0, urunKodu: '90422000018' },
  { kategori: 'ORTA PETLER', urunIsmi: 'White Pepper Ground', gr: 150, adet: 240, fiyat: 0, urunKodu: '90422000018' },
  { kategori: 'ORTA PETLER', urunIsmi: 'Cinnamon Sticks', gr: 60, adet: 600, fiyat: 0, urunKodu: '90620000000' },
  { kategori: 'ORTA PETLER', urunIsmi: 'Cinnamon Powder', gr: 150, adet: 240, fiyat: 0, urunKodu: '90620000000' },
  { kategori: 'ORTA PETLER', urunIsmi: 'Black Pepper Ground', gr: 150, adet: 600, fiyat: 0, urunKodu: '90412000000' },
  { kategori: 'ORTA PETLER', urunIsmi: 'Black Pepper Coarse', gr: 150, adet: 240, fiyat: 0, urunKodu: '90412000000' },
  { kategori: 'ORTA PETLER', urunIsmi: 'Black Peppercorns', gr: 150, adet: 240, fiyat: 0, urunKodu: '90411000000' },
  { kategori: 'ORTA PETLER', urunIsmi: 'Cloves', gr: 90, adet: 600, fiyat: 0, urunKodu: '90710000000' },
  { kategori: 'ORTA PETLER', urunIsmi: 'Cloves Ground', gr: 170, adet: 240, fiyat: 0, urunKodu: '90720000000' },
  { kategori: 'ORTA PETLER', urunIsmi: 'Garlic Granules', gr: 180, adet: 240, fiyat: 0, urunKodu: '71290900011' },
  { kategori: 'ORTA PETLER', urunIsmi: 'Garlic Powder', gr: 130, adet: 240, fiyat: 0, urunKodu: '71290900011' },
  { kategori: 'ORTA PETLER', urunIsmi: 'Onion Powder', gr: 140, adet: 240, fiyat: 0, urunKodu: '71220000000' },
  { kategori: 'ORTA PETLER', urunIsmi: 'Allspice Whole', gr: 100, adet: 120, fiyat: 0, urunKodu: '90422000012' },
  { kategori: 'ORTA PETLER', urunIsmi: 'Allspice Powder', gr: 150, adet: 120, fiyat: 0, urunKodu: '90422000012' },
  { kategori: 'ORTA PETLER', urunIsmi: 'Star Anise', gr: 60, adet: 120, fiyat: 0, urunKodu: '90962000000' },
  { kategori: 'ORTA PETLER', urunIsmi: 'Ginger Powder', gr: 150, adet: 600, fiyat: 2.00, urunKodu: '91012000000' },
  { kategori: 'ORTA PETLER', urunIsmi: 'Turmeric Powder', gr: 150, adet: 600, fiyat: 0, urunKodu: '91030000000' },
  { kategori: 'ORTA PETLER', urunIsmi: 'Sea Salt Powder', gr: 350, adet: 120, fiyat: 0.88, urunKodu: '25010100000' },
  { kategori: 'ORTA PETLER', urunIsmi: 'Himalayan Salt Powder', gr: 350, adet: 120, fiyat: 0, urunKodu: '25010100000' },
  { kategori: 'ORTA PETLER', urunIsmi: 'Baking soda', gr: 350, adet: 360, fiyat: 0.91, urunKodu: '28363000000' },
  { kategori: 'ORTA PETLER', urunIsmi: 'Rock Salt Powder', gr: 350, adet: 120, fiyat: 0, urunKodu: '25010100000' },
  { kategori: 'ORTA PETLER', urunIsmi: 'Citric Acid Powder', gr: 300, adet: 600, fiyat: 0, urunKodu: '29181500000' },
  { kategori: 'ORTA PETLER', urunIsmi: 'Biryani Masala', gr: 160, adet: 360, fiyat: 0, urunKodu: '91091900000' },
  { kategori: 'ORTA PETLER', urunIsmi: 'Doner Seasoning', gr: 160, adet: 240, fiyat: 0, urunKodu: '91091900000' },
  { kategori: 'ORTA PETLER', urunIsmi: 'Meat Seasoning', gr: 150, adet: 360, fiyat: 0, urunKodu: '91091900000' },
  { kategori: 'ORTA PETLER', urunIsmi: 'Garam Masala', gr: 180, adet: 360, fiyat: 0, urunKodu: '91091900000' },
  { kategori: 'ORTA PETLER', urunIsmi: 'Kofta Seasoning', gr: 180, adet: 240, fiyat: 0, urunKodu: '91091900000' },
  { kategori: 'ORTA PETLER', urunIsmi: 'Curry', gr: 150, adet: 600, fiyat: 0, urunKodu: '91091900000' },
  { kategori: 'ORTA PETLER', urunIsmi: 'Hot Madras Curry', gr: 160, adet: 240, fiyat: 0, urunKodu: '91091900000' },
  { kategori: 'ORTA PETLER', urunIsmi: 'Barbecue Seasoning', gr: 200, adet: 360, fiyat: 0, urunKodu: '91091900000' },
  { kategori: 'ORTA PETLER', urunIsmi: 'Merguez Sausage Seasoning', gr: 160, adet: 360, fiyat: 0, urunKodu: '91091900000' },
  { kategori: 'ORTA PETLER', urunIsmi: 'Fries Seasoning', gr: 160, adet: 120, fiyat: 0, urunKodu: '91091900000' },
  { kategori: 'ORTA PETLER', urunIsmi: 'Rice Seasoning', gr: 180, adet: 240, fiyat: 0, urunKodu: '91091900000' },
  { kategori: 'ORTA PETLER', urunIsmi: 'Tandoori Masala', gr: 160, adet: 360, fiyat: 0, urunKodu: '91091900000' },
  { kategori: 'ORTA PETLER', urunIsmi: 'Chicken Seasoning', gr: 200, adet: 360, fiyat: 0, urunKodu: '91091900000' },
  { kategori: 'ORTA PETLER', urunIsmi: '7 spice', gr: 150, adet: 600, fiyat: 0, urunKodu: '91091900000' },
  { kategori: 'BÜYÜK PETLER', urunIsmi: 'Isot Pepper', gr: 500, adet: 60, fiyat: 0, urunKodu: '90422000011' },
  { kategori: 'BÜYÜK PETLER', urunIsmi: 'Chili Flakes', gr: 500, adet: 120, fiyat: 0, urunKodu: '90422000011' },
  { kategori: 'BÜYÜK PETLER', urunIsmi: 'Sweet Paprika Flakes', gr: 500, adet: 120, fiyat: 0, urunKodu: '90422000011' },
  { kategori: 'BÜYÜK PETLER', urunIsmi: 'Sumac', gr: 600, adet: 120, fiyat: 0, urunKodu: '91099910013' },
  { kategori: 'BÜYÜK PETLER', urunIsmi: 'Chili Powder', gr: 500, adet: 120, fiyat: 0, urunKodu: '90422000011' },
  { kategori: 'BÜYÜK PETLER', urunIsmi: 'Sweet Paprika Powder', gr: 400, adet: 120, fiyat: 0, urunKodu: '90422000011' },
  { kategori: 'BÜYÜK PETLER', urunIsmi: 'Rosemary Leaves', gr: 270, adet: 60, fiyat: 0, urunKodu: '12119100000' },
  { kategori: 'BÜYÜK PETLER', urunIsmi: 'Parsley Flakes', gr: 150, adet: 180, fiyat: 0, urunKodu: '71290900029' },
  { kategori: 'BÜYÜK PETLER', urunIsmi: 'Mint flakes', gr: 180, adet: 120, fiyat: 0, urunKodu: '12119100000' },
  { kategori: 'BÜYÜK PETLER', urunIsmi: 'Oregano', gr: 140, adet: 240, fiyat: 0, urunKodu: '91099390000' },
  { kategori: 'BÜYÜK PETLER', urunIsmi: 'Cumin Seeds', gr: 450, adet: 120, fiyat: 0, urunKodu: '90931000000' },
  { kategori: 'BÜYÜK PETLER', urunIsmi: 'Cumin Ground', gr: 500, adet: 120, fiyat: 0, urunKodu: '90932000000' },
  { kategori: 'BÜYÜK PETLER', urunIsmi: 'Coriander Seeds', gr: 250, adet: 120, fiyat: 0, urunKodu: '90921000000' },
  { kategori: 'BÜYÜK PETLER', urunIsmi: 'Coriander Powder', gr: 400, adet: 120, fiyat: 0, urunKodu: '90922000000' },
  { kategori: 'BÜYÜK PETLER', urunIsmi: 'Sesame', gr: 500, adet: 120, fiyat: 0, urunKodu: '12074100000' },
  { kategori: 'BÜYÜK PETLER', urunIsmi: 'Black Seeds', gr: 500, adet: 120, fiyat: 0, urunKodu: '91099910014' },
  { kategori: 'BÜYÜK PETLER', urunIsmi: 'Shredded Coconut', gr: 350, adet: 60, fiyat: 0, urunKodu: '80111000000' },
  { kategori: 'BÜYÜK PETLER', urunIsmi: 'Sesame&Black Seeds', gr: 500, adet: 60, fiyat: 0, urunKodu: '91091900000' },
  { kategori: 'BÜYÜK PETLER', urunIsmi: 'Black Pepper Ground', gr: 500, adet: 180, fiyat: 0, urunKodu: '90412000000' },
  { kategori: 'BÜYÜK PETLER', urunIsmi: 'Cloves', gr: 350, adet: 120, fiyat: 0, urunKodu: '90710000000' },
  { kategori: 'BÜYÜK PETLER', urunIsmi: 'Onion Powder', gr: 350, adet: 180, fiyat: 0, urunKodu: '71220000000' },
  { kategori: 'BÜYÜK PETLER', urunIsmi: 'Baking soda', gr: 1200, adet: 120, fiyat: 0, urunKodu: '28363000000' },
  { kategori: 'BÜYÜK PETLER', urunIsmi: 'Citric Acid Powder', gr: 900, adet: 120, fiyat: 0, urunKodu: '29181500000' },
  { kategori: 'BÜYÜK PETLER', urunIsmi: 'Curry', gr: 500, adet: 120, fiyat: 0, urunKodu: '91091900000' },
  { kategori: 'BÜYÜK PETLER', urunIsmi: 'Barbecue Seasoning', gr: 700, adet: 60, fiyat: 0, urunKodu: '91091900000' },
  { kategori: 'BÜYÜK PETLER', urunIsmi: 'Fries Seasoning', gr: 600, adet: 60, fiyat: 0, urunKodu: '91091900000' },
  { kategori: 'BÜYÜK PETLER', urunIsmi: 'Chicken Seasoning', gr: 700, adet: 60, fiyat: 0, urunKodu: '91091900000' },
  { kategori: 'BÜYÜK PETLER', urunIsmi: '7 spice', gr: 500, adet: 60, fiyat: 0, urunKodu: '91091900000' },
  { kategori: 'SOSLAR', urunIsmi: 'LEMON SAUCE 1000 ml', gr: 1000, adet: 240, fiyat: 0.74, urunKodu: '21039100000' },
  { kategori: 'SOSLAR', urunIsmi: 'LEMON SAUCE 500 ml', gr: 500, adet: 240, fiyat: 0.61, urunKodu: '21039100000' },
  { kategori: 'SOSLAR', urunIsmi: 'POMEGRANATE SAUCE 1000 ml', gr: 1000, adet: 240, fiyat: 0, urunKodu: '21039100000' },
  { kategori: 'YAĞLAR', urunIsmi: 'BLACK SEED OIL', gr: 250, adet: 120, fiyat: 0, urunKodu: '15162100000' },
  { kategori: 'YAĞLAR', urunIsmi: 'SESAME OIL 250 ml', gr: 250, adet: 120, fiyat: 0, urunKodu: '15162100000' },
  { kategori: 'SİRKELER', urunIsmi: 'WHITE VINEGAR 1000 ml', gr: 1000, adet: 120, fiyat: 0.74, urunKodu: '22090100000' },
  { kategori: 'SİRKELER', urunIsmi: 'APPLE VINEGAR 1000 ml', gr: 1000, adet: 120, fiyat: 0.74, urunKodu: '22090100000' },
  { kategori: 'SİRKELER', urunIsmi: 'GRAPE VINEGAR 1000 ml', gr: 1000, adet: 120, fiyat: 0.74, urunKodu: '22090100000' },
  { kategori: 'KOVALAR', urunIsmi: 'Sweet Paprika Powder', gr: 5000, adet: 50, fiyat: 44.19, urunKodu: '90422000011' },
  { kategori: 'KOVALAR', urunIsmi: 'Parsley Flakes', gr: 1500, adet: 50, fiyat: 0, urunKodu: '71290900029' },
  { kategori: 'KOVALAR', urunIsmi: 'Oregano', gr: 1500, adet: 50, fiyat: 17.31, urunKodu: '91099390000' },
  { kategori: 'KOVALAR', urunIsmi: 'Black Pepper Ground', gr: 5000, adet: 20, fiyat: 73.30, urunKodu: '90412000000' },
  { kategori: 'XL PETLER', urunIsmi: 'Chili Powder', gr: 2000, adet: 80, fiyat: 13.49, urunKodu: '90422000011' },
  { kategori: 'XL PETLER', urunIsmi: 'Sweet Paprika Powder', gr: 2000, adet: 120, fiyat: 16.90, urunKodu: '90422000011' },
  { kategori: 'XL PETLER', urunIsmi: 'Isot Pepper', gr: 2000, adet: 36, fiyat: 13.49, urunKodu: '90422000011' },
  { kategori: 'XL PETLER', urunIsmi: 'Oregano', gr: 500, adet: 100, fiyat: 0, urunKodu: '91099390000' },
  { kategori: 'XL PETLER', urunIsmi: 'Parsley Flakes', gr: 600, adet: 100, fiyat: 0, urunKodu: '71290900029' },
  { kategori: 'XL PETLER', urunIsmi: 'Cumin Ground', gr: 2500, adet: 100, fiyat: 24.00, urunKodu: '90932000000' },
  { kategori: 'XL PETLER', urunIsmi: 'Black Pepper Ground', gr: 2500, adet: 100, fiyat: 35.50, urunKodu: '90412000000' },
  { kategori: 'XL PETLER', urunIsmi: 'White Pepper Ground', gr: 2500, adet: 40, fiyat: 42.60, urunKodu: '90422000018' },
  { kategori: 'XL PETLER', urunIsmi: 'Garlic Powder', gr: 2000, adet: 80, fiyat: 17.75, urunKodu: '71290900011' },
  { kategori: 'XL PETLER', urunIsmi: 'Onion Powder', gr: 2000, adet: 80, fiyat: 0, urunKodu: '71220000000' },
  { kategori: 'XL PETLER', urunIsmi: 'Chili Flakes', gr: 2000, adet: 60, fiyat: 13.90, urunKodu: '90422000011' },
  { kategori: 'XL PETLER', urunIsmi: 'Chili Flakes', gr: 2000, adet: 60, fiyat: 13.50, urunKodu: '90422000011' },
  { kategori: 'STANTLAR', urunIsmi: 'STANDARD SPICE SHELF', gr: 55000, adet: 7, fiyat: 14.20, urunKodu: '94038900000' },
  { kategori: 'BİTKİ ÇAYLARI', urunIsmi: 'Sage Tea', gr: 30, adet: 144, fiyat: 0.80, urunKodu: '12119100000' },
  { kategori: 'BİTKİ ÇAYLARI', urunIsmi: 'Lınden Tea', gr: 30, adet: 72, fiyat: 0, urunKodu: '12119100000' },
  { kategori: 'BİTKİ ÇAYLARI', urunIsmi: 'Rosemary Leaves', gr: 80, adet: 72, fiyat: 0.91, urunKodu: '12119100000' },
  { kategori: 'BİTKİ ÇAYLARI', urunIsmi: 'Cinnamon Sticks', gr: 80, adet: 72, fiyat: 0, urunKodu: '90620000000' },
  { kategori: 'BİTKİ ÇAYLARI', urunIsmi: 'Bay Leaf', gr: 15, adet: 144, fiyat: 0.74, urunKodu: '91099500000' },
  { kategori: 'BİTKİ ÇAYLARI', urunIsmi: 'Wild Thyme', gr: 50, adet: 72, fiyat: 1.00, urunKodu: '91099310000' },
  { kategori: 'BİTKİ ÇAYLARI', urunIsmi: 'Flaxseed', gr: 250, adet: 72, fiyat: 0, urunKodu: '12040100000' },
  { kategori: 'BİTKİ ÇAYLARI', urunIsmi: 'Rosehip Tea', gr: 150, adet: 72, fiyat: 2.00, urunKodu: '12119100000' },
  { kategori: 'BİTKİ ÇAYLARI', urunIsmi: 'Melissa(lemon balm)', gr: 30, adet: 72, fiyat: 0, urunKodu: '12119100000' },
  { kategori: 'BİTKİ ÇAYLARI', urunIsmi: 'Hibiscus', gr: 70, adet: 72, fiyat: 0, urunKodu: '12119100000' },
  { kategori: 'BİTKİ ÇAYLARI', urunIsmi: 'Chamomile', gr: 40, adet: 144, fiyat: 0, urunKodu: '12119100000' },
  { kategori: 'BİTKİ ÇAYLARI', urunIsmi: 'Fennel', gr: 150, adet: 72, fiyat: 0, urunKodu: '90962000000' },
  { kategori: 'BİTKİ ÇAYLARI', urunIsmi: 'Green Tea', gr: 100, adet: 72, fiyat: 0, urunKodu: '90210000000' },
  { kategori: 'BİTKİ ÇAYLARI', urunIsmi: 'Gınger Whole', gr: 200, adet: 72, fiyat: 0, urunKodu: '91012000000' },
  { kategori: 'BİTKİ ÇAYLARI', urunIsmi: 'Turmerıc Whole', gr: 200, adet: 72, fiyat: 0, urunKodu: '91030000000' },
  { kategori: 'BİTKİ ÇAYLARI', urunIsmi: 'Wınter Tea', gr: 100, adet: 72, fiyat: 0, urunKodu: '12119100000' },
  { kategori: 'BİTKİ ÇAYLARI', urunIsmi: 'Form Tea', gr: 80, adet: 72, fiyat: 0, urunKodu: '12119100000' },
  { kategori: 'BİTKİ ÇAYLARI', urunIsmi: 'Lavander', gr: 60, adet: 72, fiyat: 0.89, urunKodu: '12119100000' },
  { kategori: 'BİTKİ ÇAYLARI', urunIsmi: 'Yarrow', gr: 30, adet: 72, fiyat: 0.85, urunKodu: '12119100000' },
  { kategori: 'BİTKİ ÇAYLARI', urunIsmi: 'Echinacea-Basıl', gr: 50, adet: 72, fiyat: 0, urunKodu: '12119100000' },
  { kategori: 'BİTKİ ÇAYLARI', urunIsmi: 'Anise Seeds', gr: 180, adet: 72, fiyat: 0, urunKodu: '90962000000' },
  { kategori: 'BİTKİ ÇAYLARI', urunIsmi: 'Cherry Stem', gr: 40, adet: 72, fiyat: 0.89, urunKodu: '12119100000' },
  { kategori: 'BİTKİ ÇAYLARI', urunIsmi: 'Chıa Seeds', gr: 200, adet: 72, fiyat: 0, urunKodu: '12080000000' },
  { kategori: 'BİTKİ ÇAYLARI', urunIsmi: 'Rose Buds', gr: 30, adet: 72, fiyat: 0, urunKodu: '12119100000' },
  { kategori: 'BİTKİ ÇAYLARI', urunIsmi: 'Purple Basil', gr: 30, adet: 72, fiyat: 0, urunKodu: '71290900029' },
];

function parseValue(value: number | string): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    // Boş string veya sadece virgül ise 0 döndür
    const cleaned = value.toString().trim().replace(/,/g, '.');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function parseSku(sku: string): string {
  // Bilimsel notasyon (1,21191E+11) veya virgüllü sayıları temizle
  if (sku.includes('E') || sku.includes('e')) {
    // Bilimsel notasyon - sadece rakamları al
    return sku.replace(/[^0-9]/g, '');
  }
  // Virgüllü sayıları temizle, sadece rakamları al
  return sku.replace(/[^0-9]/g, '');
}

async function main() {
  try {
    console.log('Ürünler güncelleniyor...');

    // Mevcut tüm ürünleri sil
    await db.delete(products);
    console.log('Eski ürünler silindi');

    // Kategorileri al veya oluştur
    const categoryMap = new Map<number, string>();
    const allCategories = await db.select().from(categories);
    
    for (const cat of allCategories) {
      categoryMap.set(cat.id, cat.name);
    }

    // Kategorileri oluştur
    const categoryNames = Array.from(new Set(productData.map((p) => p.kategori)));
    for (const catName of categoryNames) {
      const existing = allCategories.find((c) => c.name === catName);
      if (!existing) {
        const slug = catName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const [newCat] = await db
          .insert(categories)
          .values({
            name: catName,
            slug: slug,
            isActive: true,
          })
          .returning();
        categoryMap.set(newCat.id, catName);
        console.log(`Yeni kategori oluşturuldu: ${catName}`);
      } else {
        categoryMap.set(existing.id, catName);
      }
    }

    // Ürünleri ekle
    const categoryNameToId = new Map<string, number>();
    for (const [id, name] of categoryMap.entries()) {
      categoryNameToId.set(name, id);
    }

    let addedCount = 0;
    for (const product of productData) {
      const categoryId = categoryNameToId.get(product.kategori);
      if (!categoryId) {
        console.error(`Kategori bulunamadı: ${product.kategori}`);
        continue;
      }

      const slug = product.urunIsmi.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const sku = parseSku(product.urunKodu);
      const fiyat = parseValue(product.fiyat);
      const adet = parseValue(product.adet);
      const gr = parseValue(product.gr);

      // Fiyat 0 ise ürünü aktif etme veya fiyat belirleme seçeneği
      // Şimdilik 0 fiyatlı ürünleri de ekliyoruz ama pasif yapıyoruz
      
      await db.insert(products).values({
        name: product.urunIsmi,
        slug: slug,
        sku: sku || null,
        price: fiyat > 0 ? fiyat.toString() : '0',
        stock: adet || 0,
        weight: gr > 0 ? gr.toString() : null,
        categoryId: categoryId,
        isActive: fiyat > 0, // Fiyatı 0'dan büyükse aktif
        trackStock: true,
        unit: 'g',
      });

      addedCount++;
    }

    console.log(`${addedCount} ürün eklendi`);
    console.log('Ürünler başarıyla güncellendi!');
  } catch (error) {
    console.error('Hata:', error);
    throw error;
  }
}

main()
  .then(() => {
    console.log('İşlem tamamlandı');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Hata:', error);
    process.exit(1);
  });
