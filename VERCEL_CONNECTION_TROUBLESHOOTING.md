# Vercel-Supabase Bağlantı Sorunu Giderme Rehberi

## 🔍 Adım Adım Kontrol Listesi

### 1. Vercel Environment Variables Kontrolü

Vercel Dashboard > Settings > Environment Variables'da şunlar olmalı:

#### ✅ Zorunlu Environment Variables:
- `POSTGRES_URL` veya `DATABASE_URL` (KRİTİK!)
  - Format: `postgresql://postgres.kxnatjmutvogwoayiajw:Orhanozan33@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true`
  - Port: **6543** (Transaction Pooler)
  - SSL: `sslmode=require`
  - Pooler: `pgbouncer=true`

#### ✅ Supabase Entegrasyonu ile Eklenenler:
- `SUPABASE_JWT_SECRET`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`

#### ⚠️ Kontrol Edin:
1. Vercel Dashboard > Settings > Environment Variables
2. `POSTGRES_URL` veya `DATABASE_URL` var mı?
3. Value doğru mu? (Connection string tam mı?)
4. Environment seçili mi? (Production, Preview, Development)
5. **Redeploy yaptınız mı?** (Environment variable ekledikten sonra mutlaka redeploy gerekir!)

### 2. Connection String Format Kontrolü

#### ✅ Doğru Format:
```
postgresql://postgres.kxnatjmutvogwoayiajw:Orhanozan33@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
```

#### ❌ Yanlış Formatlar:
- Port 5432 (Session Pooler - Vercel için uygun değil)
- SSL parametresi eksik
- Pooler parametresi eksik
- `postgres://` yerine `postgresql://` kullanılmalı

### 3. Supabase Database Migration Kontrolü

#### Migration'ları Uyguladınız mı?

**SEÇENEK 1: Manuel SQL (Önerilen)**
1. Supabase Dashboard > SQL Editor
2. `migration_snake_case.sql` dosyasını açın
3. İçeriğini kopyalayıp SQL Editor'a yapıştırın
4. **RUN** butonuna tıklayın
5. Tüm kolon adları snake_case'e çevrilmeli

**SEÇENEK 2: Drizzle-kit (Local'den)**
```bash
npm run db:push
```
⚠️ **Not:** Bu local'den çalışır, Vercel'den çalışmaz.

### 4. Vercel Deployment Log Kontrolü

1. Vercel Dashboard > Deployments
2. En son deployment'a tıklayın
3. **Build Logs** sekmesine gidin
4. Hata var mı kontrol edin

**Olası Hatalar:**
- `DATABASE_URL or POSTGRES_URL is required` → Environment variable eksik
- `SSL connection is required` → SSL parametresi eksik
- `Failed query: select ... from "table"` → Migration uygulanmamış (kolon adları yanlış)
- `relation "table" does not exist` → Tablolar oluşturulmamış

### 5. Runtime Log Kontrolü

1. Vercel Dashboard > Deployments
2. En son deployment'a tıklayın
3. **Runtime Logs** sekmesine gidin
4. API çağrılarında hata var mı kontrol edin

### 6. API Route Test

Production URL'nizde test edin:
- `https://your-domain.vercel.app/api/categories`
- `https://your-domain.vercel.app/api/products`

**Beklenen:** JSON response
**Hata:** `{"error":"...","details":"..."}`

## 🔧 Yaygın Sorunlar ve Çözümleri

### Sorun 1: "DATABASE_URL or POSTGRES_URL is required"

**Çözüm:**
1. Vercel Dashboard > Settings > Environment Variables
2. `POSTGRES_URL` ekleyin (veya `DATABASE_URL`)
3. Value: Connection string'i yapıştırın
4. Environment: Production, Preview, Development
5. **Save**
6. **Redeploy** (Deployments > ... > Redeploy)

### Sorun 2: "SSL connection is required"

**Çözüm:**
Connection string'in sonuna `?sslmode=require` ekleyin:
```
postgresql://...?sslmode=require&pgbouncer=true
```

### Sorun 3: "Failed query: select ... from \"table\""

**Çözüm:**
Migration uygulanmamış. `migration_snake_case.sql` dosyasını Supabase SQL Editor'dan çalıştırın.

### Sorun 4: "relation \"table\" does not exist"

**Çözüm:**
Tablolar oluşturulmamış. `npm run db:push` komutunu local'den çalıştırın.

### Sorun 5: "MaxClientsInSessionMode"

**Çözüm:**
Port 5432 yerine 6543 (Transaction Pooler) kullanın.

### Sorun 6: Connection Timeout

**Çözüm:**
1. Pooler URL kullandığınızdan emin olun
2. `pgbouncer=true` parametresini ekleyin
3. Port 6543 olduğundan emin olun

## 📋 Kontrol Listesi

- [ ] Vercel'de `POSTGRES_URL` veya `DATABASE_URL` environment variable var
- [ ] Connection string doğru format (port 6543, SSL, pooler)
- [ ] Environment variable'lar Production, Preview, Development için seçili
- [ ] Environment variable ekledikten sonra **Redeploy** yapıldı
- [ ] Supabase'de migration'lar uygulandı (kolon adları snake_case)
- [ ] Vercel deployment loglarında hata yok
- [ ] Runtime loglarında database connection hatası yok
- [ ] API route'ları test edildi ve çalışıyor

## 🧪 Test Komutları

### Local Test:
```bash
# Environment variable kontrolü
echo $DATABASE_URL

# Build test
npm run build

# Dev server
npm run dev
```

### Vercel Test:
1. Production URL'nizde API route'ları test edin
2. Browser console'da network tab'ı kontrol edin
3. Vercel Dashboard > Runtime Logs kontrol edin

## 🆘 Hala Çalışmıyorsa

1. **Vercel Dashboard'dan tam log'ları kontrol edin:**
   - Build Logs
   - Runtime Logs
   - Function Logs

2. **Supabase Dashboard'dan kontrol edin:**
   - Database > Connection String (doğru mu?)
   - Database > Tables (tablolar var mı?)
   - Database > Migrations (migration'lar uygulandı mı?)

3. **Connection string'i manuel test edin:**
   - Local'de `.env` dosyasına ekleyin
   - `npm run db:push` çalıştırın
   - Başarılı olursa, aynı string'i Vercel'e ekleyin

4. **Destek için hazırlayın:**
   - Vercel deployment log'ları (screenshot)
   - Runtime log'ları (screenshot)
   - Environment variable'ların listesi (değerleri gizleyerek)
   - Supabase Dashboard > Database > Connection String (screenshot)
