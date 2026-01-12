# Supabase Storage Kurulum Rehberi

## 📋 Gereksinimler

1. Supabase projenizde Storage bucket oluşturulmalı
2. Bucket public olmalı (resimlerin görüntülenmesi için)
3. Environment variables doğru ayarlanmalı

## 🔧 Kurulum Adımları

### 1. Supabase Dashboard'da Bucket Oluştur

1. **Supabase Dashboard** > **Storage**
2. **"New bucket"** butonuna tıklayın
3. **Bucket name:** `product-images`
4. **Public bucket:** ✅ **Evet** (resimlerin herkese açık olması için)
5. **"Create bucket"** butonuna tıklayın

### 2. Storage Policy Ayarları

Bucket oluşturulduktan sonra, Storage Policies'yi ayarlayın:

1. **Storage** > **Policies** > **product-images**
2. **"New policy"** butonuna tıklayın
3. Policy template: **"For full customization"**
4. Policy name: `Public read access`
5. Allowed operation: **SELECT** (Read)
6. Target roles: **anon**, **authenticated**
7. Policy definition:
   ```sql
   true
   ```
8. **"Review"** > **"Save policy"**

### 3. Environment Variables Kontrolü

Vercel'de şu environment variables'ların olduğundan emin olun:

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (storage upload için gerekli)

Bu değişkenler Supabase-Vercel entegrasyonu ile otomatik eklenmiş olmalı.

### 4. Test Et

1. Admin panel'den bir resim yükleyin
2. Console loglarını kontrol edin
3. Supabase Dashboard > Storage > product-images'da resmin göründüğünü kontrol edin

## ⚠️ Önemli Notlar

- **Service Role Key kullanımı:** API route'unda Service Role Key kullanıyoruz çünkü:
  - Public bucket'lara bile upload için admin yetkisi gerekiyor
  - Bu key asla client-side'da kullanılmamalı!
  
- **Public URL formatı:**
  ```
  https://[project-ref].supabase.co/storage/v1/object/public/product-images/[filename]
  ```

- **Güvenlik:**
  - Service Role Key'i asla public repository'lere commit etmeyin
  - Environment variables'da saklanmalı

## 🐛 Sorun Giderme

### "Supabase Storage credentials not configured" hatası
- `NEXT_PUBLIC_SUPABASE_URL` ve `SUPABASE_SERVICE_ROLE_KEY` environment variables'larını kontrol edin
- Vercel Dashboard > Settings > Environment Variables

### "Storage upload failed: 404"
- Bucket adının `product-images` olduğundan emin olun
- Supabase Dashboard > Storage'da bucket'ın var olduğunu kontrol edin

### "Storage upload failed: 403"
- Bucket policies'yi kontrol edin
- Service Role Key'in doğru olduğundan emin olun

## 📝 Kod Açıklaması

API route'u otomatik olarak:
- **Production (Vercel):** Supabase Storage kullanır
- **Development (Local):** Local filesystem kullanır

Bu sayede local'de test edebilir, production'da Supabase Storage kullanabilirsiniz.
