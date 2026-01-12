# Supabase-Vercel Otomatik Entegrasyon Rehberi

Bu rehber, Supabase ayarlarınızın otomatik olarak Vercel'e aktarılması için gerekli adımları açıklar.

## 🎯 Neden Otomatik Entegrasyon?

- ✅ Environment variables otomatik senkronize edilir
- ✅ Manuel ayar yapmaya gerek kalmaz
- ✅ Supabase'de değişiklik yaptığınızda Vercel'e otomatik yansır
- ✅ Daha güvenli ve tutarlı deployment

## 📋 Gereksinimler

- ✅ Vercel hesabı
- ✅ Supabase hesabı
- ✅ Vercel'de deploy edilmiş bir proje
- ✅ Supabase projesi

## 🔧 Kurulum Adımları

### SEÇENEK 1: Vercel Dashboard'dan (Önerilen)

#### Adım 1: Vercel Dashboard'a Gidin
1. https://vercel.com adresine gidin
2. Giriş yapın
3. Projenizi seçin

#### Adım 2: Integrations Menüsüne Gidin
1. Proje sayfasında **"Settings"** sekmesine tıklayın
2. Sol menüden **"Integrations"** seçeneğini seçin

#### Adım 3: Supabase Entegrasyonunu Ekleyin
1. **"Browse Marketplace"** veya **"Add Integration"** butonuna tıklayın
2. Arama kutusuna **"Supabase"** yazın
3. **"Supabase"** entegrasyonunu bulun
4. **"Add"** veya **"Configure"** butonuna tıklayın

#### Adım 4: Supabase Projesini Bağlayın
1. Supabase hesabınızla giriş yapın (izin istenirse)
2. Bağlamak istediğiniz **Supabase projesini** seçin
3. **Environment** seçeneklerini seçin:
   - ✅ Production
   - ✅ Preview
   - ✅ Development (isteğe bağlı)
4. **"Add Integration"** veya **"Save"** butonuna tıklayın

#### Adım 5: Otomatik Eklenen Environment Variables
Entegrasyon tamamlandıktan sonra Vercel otomatik olarak şu environment variables'ları ekler:

```
POSTGRES_URL=postgresql://...
POSTGRES_PRISMA_URL=postgresql://...
POSTGRES_URL_NON_POOLING=postgresql://...
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

⚠️ **ÖNEMLİ NOT:** 
- Bu environment variables **read-only** olur (Vercel'de değiştiremezsiniz)
- Değişiklik yapmak için Supabase Dashboard'u kullanmalısınız

### SEÇENEK 2: Supabase Dashboard'dan

#### Adım 1: Supabase Dashboard'a Gidin
1. https://supabase.com adresine gidin
2. Projenizi seçin
3. **"Settings"** > **"Integrations"** menüsüne gidin

#### Adım 2: Vercel Entegrasyonunu Ekleyin
1. **"Vercel"** entegrasyonunu bulun
2. **"Enable Integration"** veya **"Connect"** butonuna tıklayın
3. Vercel hesabınızla giriş yapın
4. Bağlamak istediğiniz **Vercel projesini** seçin
5. **"Connect"** butonuna tıklayın

## 🔄 Mevcut Manuel Environment Variables ile Çakışma

Eğer Vercel'de zaten manuel olarak environment variables tanımladıysanız:

### Senaryo 1: DATABASE_URL Manuel Tanımlı
Entegrasyon `POSTGRES_URL` ekler, ama kodunuz `DATABASE_URL` kullanıyorsa:

**Çözüm:** `DATABASE_URL` değişkenini **manuel olarak silin** veya kodunuzu `POSTGRES_URL` kullanacak şekilde güncelleyin.

**Veya:** Vercel'de manuel olarak `DATABASE_URL` değişkenini `POSTGRES_URL` ile aynı değere set edin:

1. Vercel > Settings > Environment Variables
2. `DATABASE_URL` değişkenini bulun
3. Value olarak `$POSTGRES_URL` yazın (diğer environment variable'ı referans eder)

### Senaryo 2: Kodunuz DATABASE_URL Bekliyor
Entegrasyon `POSTGRES_URL` ekler ama kodunuz `DATABASE_URL` kullanıyorsa:

**Çözüm 1 (Önerilen):** Kodunuzu `POSTGRES_URL` kullanacak şekilde güncelleyin:

```typescript
// src/db/index.ts veya drizzle.config.ts
const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
```

**Çözüm 2:** Vercel'de `DATABASE_URL` değişkenini ekleyin (Value: `$POSTGRES_URL`)

### Senaryo 3: Pooler URL Gerekli
Supabase Pooler kullanıyorsanız (port 6543), entegrasyonun eklediği `POSTGRES_URL` pooler URL'i olabilir veya olmayabilir.

**Kontrol:** Vercel > Settings > Environment Variables'da `POSTGRES_URL` değerini kontrol edin.

**Eğer Pooler URL değilse:**
1. Supabase Dashboard > Settings > Database > Connection String > Connection Pooling
2. Transaction Pooler URL'i kopyalayın (port 6543)
3. Vercel'de `DATABASE_URL` değişkenini manuel olarak ekleyin (Value: pooler URL)
4. Kodunuzda öncelik sırasını ayarlayın:

```typescript
const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
```

## 🔍 Entegrasyon Sonrası Kontrol

### 1. Environment Variables Kontrolü
1. Vercel Dashboard > Projeniz > Settings > Environment Variables
2. Şu değişkenlerin eklendiğini kontrol edin:
   - `POSTGRES_URL`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### 2. Environment Seçimi
Her environment variable için şunların seçili olduğundan emin olun:
- ✅ Production
- ✅ Preview
- ✅ Development (isteğe bağlı)

### 3. Test Deployment
1. Vercel Dashboard > Deployments
2. Yeni bir deployment tetikleyin
3. Build loglarını kontrol edin
4. Uygulamanızın çalıştığını doğrulayın

## 🔄 Güncelleme ve Senkronizasyon

### Otomatik Senkronizasyon
- Supabase'de yaptığınız değişiklikler otomatik olarak Vercel'e yansır
- Yeni deployment'lar otomatik olarak güncel environment variables'ları kullanır
- Manuel müdahale gerekmez

### Environment Variables Değiştirme
Entegrasyon tarafından eklenen environment variables'ları değiştirmek için:

1. Supabase Dashboard > Settings > API
2. İlgili değeri güncelleyin
3. Vercel'e otomatik olarak yansır (bir sonraki deployment'da aktif olur)

## ⚠️ Önemli Notlar

1. **Read-Only Variables:** Entegrasyon tarafından eklenen environment variables Vercel'de read-only'dir. Supabase Dashboard'dan değiştirin.

2. **Migration'lar:** Database migration'lar (`npm run db:push`) hala manuel olarak çalıştırılmalıdır. Entegrasyon sadece connection string'leri senkronize eder.

3. **Güvenlik:** `SUPABASE_SERVICE_ROLE_KEY` güvenlik açısından kritiktir. Asla public repository'lere commit etmeyin.

4. **Port ve Pooler:** Entegrasyonun eklediği `POSTGRES_URL` genellikle pooler URL'i olur, ama kontrol etmekte fayda var.

## 🐛 Sorun Giderme

### Sorun: Environment Variables Görünmüyor
**Çözüm:**
1. Vercel > Settings > Environment Variables
2. "Hide values" checkbox'ını kaldırın
3. Refresh edin
4. Entegrasyonun başarılı olduğundan emin olun

### Sorun: Deployment Başarısız
**Çözüm:**
1. Build loglarını kontrol edin
2. Environment variables'ların doğru environment'larda aktif olduğundan emin olun
3. Kodunuzun doğru environment variable isimlerini kullandığını kontrol edin

### Sorun: Bağlantı Hataları
**Çözüm:**
1. `POSTGRES_URL` değerini kontrol edin
2. Pooler URL kullanıyorsanız, port 6543 olduğundan emin olun
3. SSL parametrelerinin doğru olduğunu kontrol edin

## 📚 Ek Kaynaklar

- [Vercel Supabase Integration](https://vercel.com/integrations/supabase)
- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
