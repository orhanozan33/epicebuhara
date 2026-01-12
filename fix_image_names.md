# Resim İsim Düzeltme Rehberi

## 🔍 Sorun

1. **Fiziksel dosya:** `BUHARA FAJİTA BAHARATI 160 GR PET.jpg`
2. **Veritabanında beklenen:** `1768004061778_BUHARA_FAJ_TA_BAHARATI_160_GR_PET.jpg`

## ✅ Çözüm Seçenekleri

### Seçenek 1: Dosyayı Yeniden Adlandır (Manuel)

1. `public/uploads/products/` klasörüne gidin
2. Dosyayı veritabanındaki isimle eşleştirin:
   - `BUHARA FAJİTA BAHARATI 160 GR PET.jpg` → `1768004061778_BUHARA_FAJ_TA_BAHARATI_160_GR_PET.jpg`

### Seçenek 2: Veritabanını Güncelle (Önerilen)

Veritabanındaki resim ismini fiziksel dosya ismiyle eşleştirin:

```sql
-- Veritabanındaki resim ismini kontrol edin
SELECT id, name, images FROM products WHERE images LIKE '%BUHARA_FAJ%';

-- Resim ismini güncelleyin (dosya ismini URL-safe hale getirin)
UPDATE products 
SET images = REPLACE(images, '1768004061778_BUHARA_FAJ_TA_BAHARATI_160_GR_PET.jpg', '1768004061778_BUHARA_FAJITA_BAHARATI_160_GR_PET.jpg')
WHERE images LIKE '%1768004061778_BUHARA_FAJ_TA_BAHARATI_160_GR_PET.jpg%';
```

### Seçenek 3: Dosyayı Admin Panel'den Yeniden Yükle

1. Admin Panel > Ürünler
2. Ürünü düzenleyin
3. Eski resmi silin
4. Yeni resmi yükleyin
5. Kaydedin

## 📝 Notlar

- Upload API artık orijinal dosya uzantısını koruyor
- Dosya isimleri otomatik olarak URL-safe hale getiriliyor (boşluklar → alt çizgi)
- Timestamp ile benzersiz isimler oluşturuluyor
