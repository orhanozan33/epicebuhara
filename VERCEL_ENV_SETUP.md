# Vercel Environment Variables Kurulum Rehberi

## 📋 Mevcut Durum

Supabase-Vercel entegrasyonu ile şu environment variables eklendi:
- ✅ `SUPABASE_JWT_SECRET` - JWT token doğrulama için
- ✅ `SUPABASE_PUBLISHABLE_KEY` - Public API key (anon key)
- ✅ `SUPABASE_SECRET_KEY` - Service Role Key (private key)

## ❌ Eksik Olan (Kritik!)

**POSTGRES_URL** veya **DATABASE_URL** - Veritabanı bağlantısı için **MUTLAKA GEREKLİ!**

Bu olmadan uygulama çalışmaz!

## 🔧 Çözüm: POSTGRES_URL Ekleme

### SEÇENEK 1: Vercel Dashboard'dan Manuel Ekleme

1. **Vercel Dashboard** > Projeniz > **Settings** > **Environment Variables**
2. **"Add New"** butonuna tıklayın
3. Şu bilgileri girin:
   - **Name:** `POSTGRES_URL` (veya `DATABASE_URL`)
   - **Value:** Supabase'den alacağınız connection string (aşağıda)
   - **Environment:** Production, Preview, Development (hepsini seçin)

4. **Supabase Connection String'i almak için:**
   - Supabase Dashboard > **Settings** > **Database**
   - **Connection String** bölümüne gidin
   - **Connection Pooling** sekmesine tıklayın
   - **Transaction Mode (Port 6543)** - ÖNERİLEN
   - Connection string'i kopyalayın (şu formatta):
     ```
     postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
     ```
   
5. **SSL ve Pooler parametrelerini ekleyin:**
   Connection string'in sonuna `?sslmode=require&pgbouncer=true` ekleyin:
   ```
   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
   ```

6. **"Save"** butonuna tıklayın

### SEÇENEK 2: Vercel CLI ile Ekleme

```bash
# Vercel CLI'ı yükleyin (eğer yoksa)
npm i -g vercel

# Vercel'e giriş yapın
vercel login

# Environment variable ekleyin
vercel env add POSTGRES_URL production
# (Value'yu yapıştırın)

vercel env add POSTGRES_URL preview
vercel env add POSTGRES_URL development
```

## 📝 SUPABASE_URL (Opsiyonel - Eğer API kullanıyorsanız)

Eğer Supabase REST API veya Client SDK kullanıyorsanız, `SUPABASE_URL` da eklenmeli:

1. **Vercel Dashboard** > Settings > Environment Variables
2. **Add New**
3. **Name:** `SUPABASE_URL`
4. **Value:** `https://[PROJECT-REF].supabase.co`
   - PROJECT-REF'i Supabase Dashboard > Settings > General'den bulabilirsiniz
5. **Environment:** Production, Preview, Development
6. **Save**

## ✅ Kontrol Listesi

Kurulum sonrası Vercel'de şu environment variables olmalı:

- ✅ `POSTGRES_URL` veya `DATABASE_URL` (KRİTİK!)
- ✅ `SUPABASE_JWT_SECRET` (Supabase entegrasyonu ile eklendi)
- ✅ `SUPABASE_PUBLISHABLE_KEY` (Supabase entegrasyonu ile eklendi)
- ✅ `SUPABASE_SECRET_KEY` (Supabase entegrasyonu ile eklendi)
- ⚠️ `SUPABASE_URL` (Opsiyonel - API kullanıyorsanız)

## 🔍 Test Etme

1. **Yeni bir deployment tetikleyin:**
   - Vercel Dashboard > Deployments
   - En son commit'e "Redeploy" yapın
   - Veya yeni bir commit push edin

2. **Build loglarını kontrol edin:**
   - Deployment sayfasında "Build Logs" sekmesine gidin
   - Hata var mı kontrol edin

3. **Runtime loglarını kontrol edin:**
   - Deployment sayfasında "Runtime Logs" sekmesine gidin
   - "DATABASE_URL or POSTGRES_URL is required" hatası varsa, environment variable eklenmemiş demektir

## ⚠️ Önemli Notlar

1. **Connection Pooling:** Production'da mutlaka Pooler URL (port 6543) kullanın
2. **SSL:** `sslmode=require` parametresi mutlaka olmalı
3. **pgbouncer:** `pgbouncer=true` parametresi pooler için gereklidir
4. **Güvenlik:** Connection string'de şifre var, asla public repository'lere commit etmeyin

## 🔄 Environment Variables Mapping

Kodunuz şu öncelik sırasıyla environment variables'ı kontrol eder:

1. `DATABASE_URL` (en yüksek öncelik)
2. `POSTGRES_URL` (Supabase-Vercel entegrasyonu)
3. `DB_HOST`, `DB_USER`, `DB_PASSWORD`, etc. (fallback)

## 🐛 Sorun Giderme

### Hata: "DATABASE_URL or POSTGRES_URL is required"
**Çözüm:** `POSTGRES_URL` environment variable'ı eksik. Yukarıdaki adımları takip edin.

### Hata: "SSL connection is required"
**Çözüm:** Connection string'in sonuna `?sslmode=require` ekleyin.

### Hata: "MaxClientsInSessionMode"
**Çözüm:** Port 5432 yerine 6543 (Transaction Pooler) kullanın.

### Hata: Connection timeout
**Çözüm:** Pooler URL kullandığınızdan emin olun ve `pgbouncer=true` parametresini ekleyin.
