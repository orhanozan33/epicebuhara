# 🔧 Vercel 500 Hatası Çözümü

## 📋 Durum
- ✅ Database connection başarılı ("Database connection initialized")
- ❌ Tüm API endpoint'leri 500 hatası veriyor
- ✅ Local'de her şey çalışıyor
- ✅ Tablolar Supabase'de mevcut

## 🔍 Olası Nedenler

### 1. Local ve Vercel Farklı Supabase Projelerine Bağlanıyor

**Kontrol:**
1. Local `.env` dosyasındaki `DATABASE_URL` veya `POSTGRES_URL`'i kontrol edin
2. Vercel Dashboard > Settings > Environment Variables > `POSTGRES_URL`'i kontrol edin
3. İkisi aynı Supabase projesine mi bağlanıyor?

**Çözüm:**
- Vercel'deki `POSTGRES_URL`'i local'deki ile aynı Supabase projesine işaret edecek şekilde güncelleyin

### 2. Connection String Formatı Farklı

**Local:**
```
postgresql://postgres:aslansimsek33@db.kxnatjmutvogwoayiajw.supabase.co:5432/postgres?sslmode=require
```

**Vercel:**
```
postgresql://postgres.kxnatjmutvogwoayiajw:aslansimsek33@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
```

**Sorun:** Pooler ile bazı query'ler çalışmayabilir (prepared statements)

### 3. Prepared Statements Sorunu

Transaction Pooler (port 6543) ile `prepare: false` kullanılmalı.

**Kontrol:** `src/db/index.ts` dosyasında:

```typescript
client = postgres(connectionString, {
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
  ssl: 'require',
  prepare: !isPooler, // Pooler için false olmalı
  // ...
});
```

### 4. Runtime Logs'dan Detaylı Hata Mesajı

Vercel Dashboard > Deployments > Runtime Logs'dan detaylı hata mesajını kontrol edin:

1. Hangi endpoint hata veriyor?
2. Hata mesajı ne?
3. "Failed query" mesajı var mı?
4. Hangi tablo/kolon bulunamıyor?

## ✅ Çözüm Adımları

### Adım 1: Runtime Logs'u Kontrol Edin

1. **Vercel Dashboard** > **Deployments** > En son deployment
2. **Runtime Logs** sekmesine gidin
3. Bir API isteği yapın (örn: sayfayı yenileyin)
4. Detaylı hata mesajını kopyalayın

**Arayacağınız bilgiler:**
- "Failed query: ..." mesajı
- Hangi tablo/kolon bulunamıyor?
- PostgreSQL hata kodu (örn: `42703` = kolon bulunamadı)

### Adım 2: Local ve Vercel Connection String'lerini Karşılaştırın

**Local `.env` dosyası:**
```env
DATABASE_URL=postgresql://postgres:aslansimsek33@db.kxnatjmutvogwoayiajw.supabase.co:5432/postgres?sslmode=require
```

**Vercel Environment Variable:**
```
POSTGRES_URL=postgresql://postgres.kxnatjmutvogwoayiajw:aslansimsek33@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
```

**Kontrol:**
- Aynı Supabase projesine mi bağlanıyor? (project-ref: `kxnatjmutvogwoayiajw`)
- Şifre aynı mı? (`aslansimsek33`)

### Adım 3: Database Connection Kodunu Kontrol Edin

`src/db/index.ts` dosyasında pooler için `prepare: false` ayarı var mı?

```typescript
const isPooler = connectionString.includes('pooler.supabase.com') || connectionString.includes(':6543');

client = postgres(connectionString, {
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
  ssl: 'require',
  prepare: !isPooler, // ✅ Pooler için false olmalı
  // ...
});
```

### Adım 4: Test Edin

1. Vercel'de bir API endpoint'ini test edin:
   - `https://www.epicebuhara.com/api/categories`
   - `https://www.epicebuhara.com/api/products`
2. Runtime Logs'dan hata mesajını kontrol edin
3. Hata mesajını paylaşın

## 🐛 Yaygın Hatalar ve Çözümleri

### Hata: "column X does not exist"
**Neden:** Kolon adları snake_case değil camelCase
**Çözüm:** Migration yapın veya schema'yı kontrol edin

### Hata: "relation X does not exist"
**Neden:** Tablo yok
**Çözüm:** Migration yapın

### Hata: "prepared statement does not exist"
**Neden:** Pooler ile prepared statements kullanılıyor
**Çözüm:** `prepare: false` ayarını kontrol edin

### Hata: "Tenant or user not found"
**Neden:** Connection string yanlış
**Çözüm:** Connection string'i kontrol edin

## 📞 Sonraki Adım

Runtime Logs'dan detaylı hata mesajını paylaşın. Özellikle:
- Hangi endpoint hata veriyor?
- "Failed query" mesajı ne?
- PostgreSQL hata kodu ne?

Bu bilgilerle sorunu daha spesifik çözebiliriz.
