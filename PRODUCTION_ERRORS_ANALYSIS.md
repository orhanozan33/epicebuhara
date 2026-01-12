# 🐛 PRODUCTION HATALARI ANALİZİ

## ❌ TESPİT EDİLEN HATALAR

### 1. `/api/settings/company` - 500 Internal Server Error
**Sebepler:**
- Veritabanı kolon isimleri hala camelCase olabilir
- Migration (`migration_complete_fix.sql`) uygulanmamış olabilir
- `company_settings` tablosunda `instagram_url` ve `facebook_url` kolonları yok olabilir

**Çözüm:**
1. Supabase Dashboard > SQL Editor
2. `migration_complete_fix.sql` dosyasını çalıştırın
3. Özellikle `company_settings` tablosu için kolonların snake_case olduğundan emin olun

### 2. `/admin-panel/ayarlar?_rsc=ea645` - 404 Not Found
**Sebep:**
- Next.js App Router'da route sorunu olabilir
- Dosya yolu: `app/admin-panel/settings/page.tsx` ✅ (Mevcut)
- Muhtemelen Next.js build cache sorunu

**Çözüm:**
1. Vercel'de redeploy yapın
2. Build cache'i temizleyin
3. Route'un doğru olduğundan emin olun

### 3. Resim Yükleme - 404 Not Found
**Sebep:**
- Vercel'de dosya sistemi **read-only**
- `/api/upload` endpoint'i dosyayı `public/uploads/products/` klasörüne yazmaya çalışıyor
- Vercel'de bu klasör build sırasında oluşturulur ama runtime'da yazılamaz

**Çözüm:**
- **Supabase Storage** kullanın (Önerilen)
- Veya **Cloudinary**, **AWS S3** gibi cloud storage çözümleri
- Veya resimleri veritabanında base64 olarak saklayın (küçük resimler için)

### 4. `/api/upload` - 500 Internal Server Error
**Sebep:**
- Aynı sorun: Vercel'de dosya yazma izni yok
- `fs/promises` writeFile işlemi başarısız oluyor

**Çözüm:**
- Supabase Storage entegrasyonu yapılmalı

## 🔧 ACİL ÇÖZÜMLER

### ÇÖZÜM 1: Veritabanı Migration (KRİTİK!)
```sql
-- Supabase Dashboard > SQL Editor
-- migration_complete_fix.sql dosyasını çalıştırın
```

### ÇÖZÜM 2: Resim Yükleme için Supabase Storage
1. Supabase Dashboard > Storage
2. Yeni bucket oluşturun: `product-images`
3. Public access ayarlayın
4. `/api/upload` endpoint'ini Supabase Storage kullanacak şekilde güncelleyin

### ÇÖZÜM 3: Next.js Route Sorunu
1. Vercel Dashboard > Deployments
2. En son deployment'a tıklayın
3. "Redeploy" yapın
4. Build cache'i temizleyin

## 📋 ÖNCELİK SIRASI

1. **YÜKSEK ÖNCELİK:** Veritabanı migration (`migration_complete_fix.sql`)
2. **ORTA ÖNCELİK:** Resim yükleme için Supabase Storage entegrasyonu
3. **DÜŞÜK ÖNCELİK:** Next.js route sorunu (redeploy ile çözülebilir)

## ⚠️ ÖNEMLİ NOTLAR

- Vercel'de dosya sistemi **read-only** - upload API'si çalışmaz
- Production'da resim yükleme için **mutlaka cloud storage** kullanılmalı
- Supabase Storage ücretsiz planında 1GB alan var
