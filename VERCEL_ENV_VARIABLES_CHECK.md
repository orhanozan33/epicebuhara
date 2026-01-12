# Vercel Environment Variables Kontrol Listesi

## 📋 Bu Sayfada Yapılması Gerekenler

### 1. ✅ Sync Ayarları (Şu An Doğru)
- **Production**: ✅ Açık (Sync aktif)
- **Preview**: ✅ Açık (Sync aktif)
- **Development**: ✅ Açık (Sync aktif)

Bu ayarlar doğru, değiştirmenize gerek yok.

### 2. ⚠️ ÖNEMLİ: Environment Variables Kontrolü

**"Manage" butonuna tıklayın** ve şu environment variables'ların olduğundan emin olun:

#### Zorunlu Environment Variables:

1. **`NEXT_PUBLIC_SUPABASE_URL`**
   - Value: `https://kxnatjmutvogwoayiajw.supabase.co`
   - Tüm ortamlarda (Production, Preview, Development) olmalı

2. **`SUPABASE_SERVICE_ROLE_KEY`**
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4bmF0am11dHZvZ3dvYXlpYWp3Iiwicm9sZSIsInNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzg0OTIzNCwiZXhwIjoyMDgzNDI1MjM0fQ.VMoiTga2RPlcg1unmcZOamuD6xWxzqt3waOPNwW9rac`
   - Tüm ortamlarda (Production, Preview, Development) olmalı
   - ⚠️ Bu değer hassas - asla public repository'lere commit etmeyin

3. **`DATABASE_URL`** (Opsiyonel - Supabase entegrasyonu ile otomatik eklenmiş olabilir)
   - Value: `postgresql://postgres:orhanozan33@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require`

4. **`JWT_SECRET`** (Opsiyonel)
   - Value: `z0eKeFHDpJxBDf5mqOdzX33qPSupJcfgOsHz/qCpWOO3I3teeNJ0ZjmslB2MPIF5Km0bsC2u66qBbaluRxSVog==`

5. **`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`** (Opsiyonel)
   - Value: `sb_publishable_GnvQLfUh510fyEJGV0mEJg_Km_-x3zN`

### 3. 🔧 Yapılacaklar

1. **"Manage" butonuna tıklayın**
2. Environment variables listesini kontrol edin
3. Eksik olanları ekleyin:
   - Her bir environment variable için:
     - "Add New" veya "+" butonuna tıklayın
     - Key: `NEXT_PUBLIC_SUPABASE_URL`
     - Value: `https://kxnatjmutvogwoayiajw.supabase.co`
     - Environment: Production, Preview, Development (hepsini seçin)
     - "Save" butonuna tıklayın
4. **En önemli:** `SUPABASE_SERVICE_ROLE_KEY` mutlaka olmalı!

### 4. ✅ Save Butonu

- Eğer herhangi bir değişiklik yaptıysanız, **"Save" butonuna tıklayın**
- Eğer hiçbir değişiklik yapmadıysanız, "Cancel" veya sayfayı kapatabilirsiniz

### 5. 🔄 Deploy

Environment variables ekledikten/güncelledikten sonra:
1. Yeni bir deploy tetikleyin (git push yapın veya manuel deploy yapın)
2. Deploy tamamlandıktan sonra resim yükleme işlemini test edin

## 🐛 Sorun Giderme

### Eğer environment variables yoksa:

1. **Supabase Dashboard'dan alın:**
   - `NEXT_PUBLIC_SUPABASE_URL`: Settings > API > Project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Settings > API > Service Role Key

2. **Vercel'e ekleyin:**
   - "Manage" > "Add New"
   - Key ve Value'yu girin
   - Environment'ları seçin
   - Save

### Eğer hata devam ediyorsa:

1. Browser Console'da (F12) hata mesajını kontrol edin
2. Vercel Logs'u kontrol edin (Deployments > Latest Deployment > Functions tab)
3. Environment variables'ların doğru olduğundan emin olun
