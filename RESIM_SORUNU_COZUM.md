# 🖼️ Ürün Resimleri Sorunu - Çözüm Rehberi

## 🔍 Sorun

Ürün resimleri gösterilmiyor veya 404 hatası veriyor.

## ✅ Yapılan Düzeltmeler

1. **Resim yolu kontrolü iyileştirildi:**
   - HTTP/HTTPS URL'leri doğru işleniyor
   - Supabase Storage URL'leri destekleniyor
   - Local dosya yolları düzeltildi

2. **Hata yakalama eklendi:**
   - Resim yüklenemezse placeholder gösteriliyor
   - Console'da hata loglanıyor

3. **Resim kontrol script'i eklendi:**
   - `npm run check-images` ile tüm resim yollarını kontrol edebilirsiniz

## 🎯 Kontrol Adımları

### ADIM 1: Resim Yollarını Kontrol Edin

Terminal'de:
```bash
npm run check-images
```

Bu script:
- Tüm ürün resimlerini kontrol eder
- Yanlış yolları düzeltir
- Sonuçları gösterir

### ADIM 2: Resim Dosyalarını Kontrol Edin

**Local'de:**
```bash
dir public\uploads\products
```

**Kontrol edin:**
- Resim dosyaları `public/uploads/products/` klasöründe mi?
- Dosya adları veritabanındaki yollarla eşleşiyor mu?

### ADIM 3: Browser'da Test Edin

1. Browser'da: `http://localhost:3000`
2. F12 → Network tab
3. Bir ürün resmine tıklayın
4. Resim isteğini kontrol edin:
   - **200 OK** → ✅ Resim yüklendi
   - **404 Not Found** → Resim dosyası yok veya yol yanlış

## 🔧 Olası Sorunlar ve Çözümleri

### Sorun 1: Resim Dosyası Yok

**Kontrol:**
- `public/uploads/products/` klasöründe dosya var mı?
- Dosya adı veritabanındaki yol ile eşleşiyor mu?

**Çözüm:**
- Resmi tekrar yükleyin
- Veya veritabanındaki resim yolunu düzeltin

### Sorun 2: Resim Yolu Yanlış

**Kontrol:**
```bash
npm run check-images
```

**Çözüm:**
- Script otomatik olarak düzeltir
- Veya manuel olarak veritabanında düzeltin

### Sorun 3: Next.js Static Files Sorunu

**Kontrol:**
- `public/uploads/products/` klasörü `public` klasörü içinde mi?
- Dosya adlarında özel karakter var mı? (boşluk, Türkçe karakter)

**Çözüm:**
- Dosya adlarını normalize edin (boşluk → `_`, Türkçe karakter → İngilizce)
- Server'ı yeniden başlatın

### Sorun 4: Supabase Storage URL'leri

**Kontrol:**
- Resimler Supabase Storage'da mı?
- URL formatı doğru mu?

**Beklenen format:**
```
https://kxnatjmutvogwoayiajw.supabase.co/storage/v1/object/public/product-images/filename.jpg
```

## 📝 Resim Yolu Formatları

### Local Development
```
/uploads/products/1768237766768_BUHARA_FAJ_TA_BAHARATI_160_GR_PET.jpg
```

### Supabase Storage
```
https://kxnatjmutvogwoayiajw.supabase.co/storage/v1/object/public/product-images/filename.jpg
```

### Veritabanında Saklanan Format

**Local için:**
```
1768237766768_BUHARA_FAJ_TA_160_GR_PET.jpg
```
(Kod otomatik olarak `/uploads/products/` ekler)

**Supabase için:**
```
https://kxnatjmutvogwoayiajw.supabase.co/storage/v1/object/public/product-images/filename.jpg
```
(Olduğu gibi kullanılır)

## ✅ Test Kontrol Listesi

- [ ] `npm run check-images` çalıştırıldı
- [ ] Resim dosyaları `public/uploads/products/` klasöründe
- [ ] Browser'da resimler görünüyor
- [ ] Network tab'da 200 OK görünüyor
- [ ] Console'da hata yok

## 🆘 Hala Sorun Varsa

1. **Browser Console** hata mesajlarını kontrol edin
2. **Network tab** → Resim isteğini kontrol edin
3. **Veritabanı** → Ürün resim yollarını kontrol edin
4. Bu bilgileri paylaşın, birlikte çözelim!
