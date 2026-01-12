# 🔐 Şifre Güncelleme Talimatları

## ✅ Yeni Şifre: `orhanozan33`

Supabase'de veritabanı şifresini değiştirdiniz. Şimdi tüm connection string'leri güncellemeniz gerekiyor.

## 📋 ADIM ADIM GÜNCELLEME

### ADIM 1: Local .env Dosyasını Güncelle

1. `baharat/.env` dosyasını açın
2. `DATABASE_URL` ve `POSTGRES_URL` satırlarını bulun
3. Şifreyi `orhanozan33` olarak güncelleyin:

```env
# Supabase Database Connection (Local - Direct Connection)
DATABASE_URL=postgresql://postgres:orhanozan33@db.kxnatjmutvogwoayiajw.supabase.co:5432/postgres?sslmode=require
POSTGRES_URL=postgresql://postgres:orhanozan33@db.kxnatjmutvogwoayiajw.supabase.co:5432/postgres?sslmode=require
```

4. Dosyayı kaydedin

### ADIM 2: Vercel Environment Variable'ı Güncelle

1. **Vercel Dashboard** > Projeniz > **Settings** > **Environment Variables**
2. `POSTGRES_URL` veya `DATABASE_URL` değişkenini bulun
3. **Edit** butonuna tıklayın
4. Value'yu şu connection string ile değiştirin:

```
postgresql://postgres.kxnatjmutvogwoayiajw:orhanozan33@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
```

5. **Save** butonuna tıklayın

### ADIM 3: Redeploy Yap

1. **Vercel Dashboard** > **Deployments**
2. En son deployment'a tıklayın
3. **"Redeploy"** butonuna tıklayın
4. Build ve runtime loglarını kontrol edin

### ADIM 4: Test Et

1. Local'de test:
   ```bash
   npm run dev
   ```
   - API endpoint'lerini test edin: `/api/products`, `/api/categories`

2. Production'da test:
   - Production URL'inizi açın
   - API endpoint'lerini test edin
   - Runtime loglarını kontrol edin

## 🔍 HAZIR CONNECTION STRING'LER

Tüm hazır connection string'ler `NEW_PASSWORD_CONNECTION_STRINGS.txt` dosyasında.

## ⚠️ ÖNEMLİ NOTLAR

1. **Şifre:** `orhanozan33` (küçük harf, özel karakter yok)
2. **Local:** Direct Connection (port 5432) kullanın
3. **Vercel:** Transaction Pooler (port 6543) kullanın (önerilen)
4. **Redeploy:** Environment variable güncelledikten sonra mutlaka redeploy yapın!
5. **Test:** Her güncellemeden sonra test edin

## 🐛 Sorun Giderme

### Hata: "password authentication failed"
- Connection string'deki şifreyi kontrol edin
- Şifre `orhanozan33` olmalı (küçük harf)

### Hata: "SSL connection is required"
- Connection string'in sonunda `?sslmode=require` olmalı

### Hata: "column does not exist"
- Bu şifre ile ilgili değil, migration sorunu
- `migration_complete_fix.sql` dosyasını Supabase SQL Editor'dan çalıştırın

### Local'de çalışıyor ama production'da çalışmıyor
- Vercel'deki environment variable'ı kontrol edin
- Redeploy yaptınız mı?
