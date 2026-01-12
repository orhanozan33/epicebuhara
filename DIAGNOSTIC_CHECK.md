# 🔍 Sorun Teşhisi: Tablolar Doğru Ama Hata Devam Ediyor

## ✅ Tablolar Doğru - O Zaman Sorun Nerede?

Eğer Supabase'deki tablolar ve kolonlar zaten snake_case ise, sorun **bağlantı veya sorgu yürütme** aşamasında olabilir.

## 🔍 Kontrol Listesi

### 1. Vercel Environment Variables Kontrolü

**Vercel Dashboard > Settings > Environment Variables**'da şunlar olmalı:

#### ✅ Zorunlu:
- `POSTGRES_URL` veya `DATABASE_URL` (KRİTİK!)
  - Format: `postgresql://postgres.kxnatjmutvogwoayiajw:Orhanozan33@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true`
  - Port: **6543** (Transaction Pooler) veya **5432** (Direct Connection)
  - SSL: `sslmode=require`
  - Pooler: `pgbouncer=true` (eğer port 6543 kullanıyorsanız)

#### ⚠️ Kontrol Edin:
1. Vercel Dashboard > Settings > Environment Variables
2. `POSTGRES_URL` veya `DATABASE_URL` var mı?
3. Value doğru mu? (Connection string tam mı?)
4. Environment seçili mi? (Production, Preview, Development)
5. **Redeploy yaptınız mı?** (Environment variable ekledikten sonra mutlaka redeploy gerekir!)

### 2. Connection String Format Kontrolü

#### ✅ Doğru Format (Transaction Pooler - Port 6543):
```
postgresql://postgres.kxnatjmutvogwoayiajw:Orhanozan33@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
```

#### ✅ Doğru Format (Direct Connection - Port 5432):
```
postgresql://postgres:Orhanozan33@db.kxnatjmutvogwoayiajw.supabase.co:5432/postgres?sslmode=require
```

#### ❌ Yanlış Formatlar:
- Port 5432 ile `pgbouncer=true` (pgbouncer sadece port 6543 için)
- SSL parametresi eksik
- Şifre yanlış veya URL encode edilmemiş
- `postgres://` yerine `postgresql://` kullanılmalı

### 3. Local vs Production Farkı

#### Local'de Çalışıyor mu?
- Eğer local'de çalışıyorsa ama production'da çalışmıyorsa → **Vercel environment variable problemi**
- Eğer local'de de çalışmıyorsa → **Connection string veya SSL problemi**

### 4. Hata Mesajı Analizi

Hata mesajınız:
```
Failed query: select ... from "products" where "products"."is_active" = $1
```

Bu hata şu anlama gelebilir:
1. **Connection başarısız** → "column does not exist" hatası yerine connection hatası
2. **Authentication başarısız** → Şifre yanlış
3. **SSL problemi** → SSL ayarları yanlış
4. **Pooler problemi** → Port 6543 kullanıyorsanız ama `pgbouncer=true` eksik

### 5. Supabase Connection Test

Supabase Dashboard'dan connection string'i test edin:

1. **Supabase Dashboard > Settings > Database**
2. **Connection String** bölümüne gidin
3. **Connection Pooling** sekmesine tıklayın
4. **Transaction Mode (Port 6543)** veya **Direct Connection (Port 5432)** seçin
5. Connection string'i kopyalayın
6. Vercel'deki `POSTGRES_URL` ile karşılaştırın

### 6. Vercel Deployment Log Kontrolü

1. Vercel Dashboard > Deployments
2. En son deployment'a tıklayın
3. **Build Logs** sekmesine gidin
4. **Runtime Logs** sekmesine gidin
5. Hata mesajlarını kontrol edin:
   - `DATABASE_URL or POSTGRES_URL is required` → Environment variable eksik
   - `SSL connection is required` → SSL ayarları yanlış
   - `password authentication failed` → Şifre yanlış
   - `column does not exist` → Migration uygulanmamış (ama siz tablolar doğru dediniz)

## 🔧 Hızlı Çözüm Adımları

### ADIM 1: Vercel Environment Variable Kontrolü

1. Vercel Dashboard > Settings > Environment Variables
2. `POSTGRES_URL` veya `DATABASE_URL` var mı kontrol edin
3. Value'yu kopyalayın ve Supabase Dashboard'daki ile karşılaştırın

### ADIM 2: Connection String Güncelleme

Eğer connection string yanlışsa:

1. Supabase Dashboard > Settings > Database > Connection String
2. **Transaction Mode (Port 6543)** seçin (önerilen)
3. Connection string'i kopyalayın
4. Sonuna `?sslmode=require&pgbouncer=true` ekleyin
5. Vercel'de `POSTGRES_URL` değerini güncelleyin

### ADIM 3: Redeploy

1. Vercel Dashboard > Deployments
2. En son deployment'a tıklayın
3. **"Redeploy"** butonuna tıklayın
4. Build ve runtime loglarını kontrol edin

### ADIM 4: Test

1. Production URL'inizi açın
2. API endpoint'lerini test edin:
   - `/api/products`
   - `/api/categories`
   - `/api/cart`
3. Hata devam ediyorsa, runtime loglarını kontrol edin

## 🐛 Yaygın Sorunlar ve Çözümleri

### Sorun 1: "DATABASE_URL or POSTGRES_URL is required"
**Çözüm:** Vercel'de `POSTGRES_URL` environment variable'ı eksik. Yukarıdaki ADIM 1'e bakın.

### Sorun 2: "SSL connection is required"
**Çözüm:** Connection string'e `?sslmode=require` ekleyin.

### Sorun 3: "password authentication failed"
**Çözüm:** Supabase Dashboard'dan doğru şifreyi alın ve connection string'i güncelleyin.

### Sorun 4: "column does not exist" (ama tablolar doğru dediniz)
**Çözüm:** 
- Veritabanına gerçekten bağlanıyor musunuz? (Yanlış database'e bağlanıyor olabilirsiniz)
- Connection string doğru database'i gösteriyor mu?
- Supabase Dashboard > Database > Tables'da kolonları kontrol edin

### Sorun 5: Local'de çalışıyor ama production'da çalışmıyor
**Çözüm:** Vercel'deki environment variable'ları kontrol edin. Local `.env` ile Vercel environment variables farklı olabilir.

## 📋 Son Kontrol Listesi

- [ ] Vercel'de `POSTGRES_URL` veya `DATABASE_URL` environment variable var
- [ ] Connection string doğru format (postgresql://, sslmode=require, vb.)
- [ ] Port doğru (6543 pooler veya 5432 direct)
- [ ] Şifre doğru
- [ ] Redeploy yapıldı
- [ ] Runtime loglarında hata yok
- [ ] Supabase Dashboard'da tablolar ve kolonlar doğru (snake_case)

## 🔍 Debug İçin Ek Bilgi

Eğer hala sorun devam ediyorsa, şu bilgileri paylaşın:

1. **Vercel Runtime Logs** (hata mesajının tamamı)
2. **Vercel Environment Variables** (sadece variable isimleri, value'ları değil)
3. **Supabase Dashboard > Database > Tables** (screenshot)
4. **Local'de çalışıyor mu?** (Evet/Hayır)
