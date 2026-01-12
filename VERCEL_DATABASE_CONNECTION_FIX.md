# Vercel Database Connection Sorunu - Çözüm

## 🔍 Sorun

Vercel'e Supabase entegrasyonu eklendiğinde otomatik olarak environment variables ekleniyor. Bu variables bazen yanlış database'e veya farklı bir connection string'e bağlanabiliyor.

## 🐛 Belirtiler

- Ürünler görünmüyor
- Database bağlantı hatası
- Farklı bir database'e bağlanılıyor

## ✅ Çözüm

### 1. Vercel Dashboard'da Environment Variables Kontrolü

1. **Vercel Dashboard** > **Settings** > **Environment Variables**
2. Şu variables'ları kontrol edin:

#### Zorunlu Variables:

1. **`DATABASE_URL`** veya **`POSTGRES_URL`**
   - Doğru format:
     ```
     postgresql://postgres:orhanozan33@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require
     ```
   - **ÖNEMLİ:** Doğru database'e (epicbuhara projesinin database'ine) bağlanıyor olmalı

2. **`NEXT_PUBLIC_SUPABASE_URL`**
   - Value: `https://kxnatjmutvogwoayiajw.supabase.co`

3. **`SUPABASE_SERVICE_ROLE_KEY`**
   - Service role key'iniz

### 2. Hangi Variable Kullanılıyor?

Kod şu sırayla environment variable'ları kontrol ediyor:
1. `DATABASE_URL` (öncelikli)
2. `POSTGRES_URL` (alternatif)
3. `DB_HOST`, `DB_NAME`, vb. (son çare)

### 3. Yanlış Variable Varsa Düzeltme

Eğer Supabase-Vercel entegrasyonu yanlış bir `DATABASE_URL` veya `POSTGRES_URL` eklediyse:

1. **Vercel Dashboard** > **Settings** > **Environment Variables**
2. `DATABASE_URL` variable'ını bulun
3. Value'yu doğru connection string ile değiştirin:
   ```
   postgresql://postgres:orhanozan33@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require
   ```
4. **Production, Preview, Development** için güncelleyin
5. **Save** butonuna tıklayın

### 4. Alternative: Variable Priority

Eğer `DATABASE_URL` değiştirilemiyorsa (read-only ise), `POSTGRES_URL` kullanılabilir:

1. `POSTGRES_URL` variable'ını ekleyin veya güncelleyin
2. Doğru connection string'i girin
3. Save

### 5. Deploy ve Test

1. Yeni bir deploy tetikleyin
2. Deploy tamamlandıktan sonra test edin
3. Ürünlerin geri geldiğini kontrol edin

## 🔧 Supabase-Vercel Entegrasyonu Sorunu

Eğer Supabase-Vercel entegrasyonu otomatik olarak yanlış database'e bağlanıyorsa:

1. **Entegrasyonu Kontrol Edin:**
   - Vercel Dashboard > **Settings** > **Integrations** > **Supabase**
   - Hangi Supabase projesine bağlandığını kontrol edin
   - Doğru projeye bağlı olduğundan emin olun

2. **Gerekirse Entegrasyonu Kaldırın:**
   - Entegrasyonu kaldırın
   - Manuel olarak environment variables ekleyin
   - Doğru connection string'leri kullanın

## 📋 Kontrol Listesi

- [ ] `DATABASE_URL` doğru database'e bağlanıyor mu?
- [ ] `POSTGRES_URL` doğru database'e bağlanıyor mu?
- [ ] Supabase projesi doğru mu?
- [ ] Connection string formatı doğru mu?
- [ ] SSL mode (`sslmode=require`) var mı?
- [ ] Şifre doğru mu? (`orhanozan33`)
- [ ] Deploy yapıldı mı?

## ⚠️ ÖNEMLİ NOT

Supabase-Vercel entegrasyonu bazen yanlış database'e bağlanabilir veya farklı bir connection string kullanabilir. Her zaman manuel olarak kontrol edin ve doğru connection string'i kullandığınızdan emin olun.
