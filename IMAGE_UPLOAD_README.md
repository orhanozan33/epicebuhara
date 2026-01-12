# Resim Yükleme Rehberi

## 📁 Klasör Yapısı

Resimler şu klasörde saklanır:
```
public/uploads/products/
```

## ⚠️ Mevcut Durum

- ✅ Klasörler oluşturuldu: `public/uploads/products/`
- ❌ Veritabanındaki resimler henüz bu klasörde yok
- ❌ Bu yüzden 404 hatası alıyorsunuz

## 🔧 Çözüm

### Yöntem 1: Resimleri Manuel Yükleme

1. Veritabanındaki resim dosya isimlerini alın:
   ```sql
   SELECT images FROM products WHERE images IS NOT NULL;
   ```

2. Resimleri `public/uploads/products/` klasörüne kopyalayın

### Yöntem 2: Admin Panel'den Yeniden Yükleme

1. Admin Panel > Ürünler
2. Her ürünü düzenleyin
3. Resimleri yeniden yükleyin

### Yöntem 3: Supabase Storage Kullanımı (Önerilen)

Vercel'de çalışması için Supabase Storage kullanın:

1. Supabase Dashboard > Storage
2. `product-images` bucket oluşturun
3. Resimleri Supabase Storage'a yükleyin
4. API route'unu güncelleyin (Supabase Storage API kullan)

## 📝 Notlar

- Local'de `public/uploads/products/` klasörü çalışır
- Vercel'de bu klasör çalışmaz (read-only filesystem)
- Production için Supabase Storage veya Cloudinary kullanın
