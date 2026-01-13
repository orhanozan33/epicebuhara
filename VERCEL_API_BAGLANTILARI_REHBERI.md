# 🚀 Vercel API Bağlantıları - Adım Adım Rehber

Bu rehber, Vercel'de uygulamanızın API bağlantılarını (veritabanı, Supabase Storage) kurmak için gereken tüm adımları içerir.

---

## 📋 İçindekiler

1. [Gereksinimler](#gereksinimler)
2. [Adım 1: Supabase Connection String Alma](#adım-1-supabase-connection-string-alma)
3. [Adım 2: Vercel Dashboard'a Giriş](#adım-2-vercel-dashboarda-giriş)
4. [Adım 3: Environment Variables Ekleme](#adım-3-environment-variables-ekleme)
5. [Adım 4: Deployment ve Test](#adım-4-deployment-ve-test)
6. [Sorun Giderme](#sorun-giderme)

---

## 📦 Gereksinimler

- ✅ Vercel hesabı (ücretsiz)
- ✅ Supabase hesabı (ücretsiz)
- ✅ GitHub'da deploy edilmiş proje
- ✅ Supabase projesi oluşturulmuş

---

## 🔗 Adım 1: Supabase Connection String Alma

### 1.1 Supabase Dashboard'a Giriş

1. https://supabase.com adresine gidin
2. Hesabınıza giriş yapın
3. Projenizi seçin

### 1.2 Database Connection String Alma

1. Sol menüden **Settings** (⚙️) seçeneğine tıklayın
2. **Database** sekmesine gidin
3. Aşağı kaydırın ve **Connection String** bölümünü bulun
4. **Connection Pooling** sekmesine tıklayın
5. **Transaction Mode** seçeneğini seçin (Port 6543) - ⚠️ **ÖNEMLİ: Bu seçenek Vercel için önerilir**
6. Connection string'i kopyalayın

**Örnek Connection String:**
```
postgresql://postgres.kxnatjmutvogwoayiajw:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

### 1.3 Connection String'i Düzenleme

Kopyaladığınız connection string'in sonuna şu parametreleri ekleyin:

```
?sslmode=require&pgbouncer=true
```

**Final Connection String Örneği:**
```
postgresql://postgres.kxnatjmutvogwoayiajw:orhanozan33@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
```

⚠️ **ÖNEMLİ:** 
- `[YOUR-PASSWORD]` kısmını kendi şifrenizle değiştirin
- Port **6543** olmalı (Transaction Pooler)
- `pgbouncer=true` parametresi mutlaka olmalı
- `sslmode=require` parametresi mutlaka olmalı

---

## 🌐 Adım 2: Vercel Dashboard'a Giriş

1. https://vercel.com adresine gidin
2. Hesabınıza giriş yapın
3. Projenizi seçin (veya yeni proje oluşturun)

---

## ⚙️ Adım 3: Environment Variables Ekleme

### 3.1 Environment Variables Sayfasına Gitme

1. Vercel Dashboard'da projenize tıklayın
2. Üst menüden **Settings** sekmesine tıklayın
3. Sol menüden **Environment Variables** seçeneğine tıklayın

### 3.2 POSTGRES_URL Ekleme (KRİTİK!)

Bu değişken **MUTLAKA** eklenmelidir, aksi halde uygulama çalışmaz.

1. **"Add New"** butonuna tıklayın
2. Şu bilgileri girin:
   - **Name:** `POSTGRES_URL`
   - **Value:** Adım 1.3'te hazırladığınız connection string'i yapıştırın
   - **Environment:** 
     - ✅ Production
     - ✅ Preview
     - ✅ Development
     - (Hepsini seçin)
3. **"Save"** butonuna tıklayın

**Örnek:**
```
Name: POSTGRES_URL
Value: postgresql://postgres.kxnatjmutvogwoayiajw:orhanozan33@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
Environment: Production, Preview, Development
```

### 3.3 SUPABASE_URL Ekleme (Resim Yükleme İçin)

Eğer uygulamanızda resim yükleme özelliği varsa (Supabase Storage kullanıyorsanız), bu değişkeni de ekleyin.

1. **"Add New"** butonuna tekrar tıklayın
2. Şu bilgileri girin:
   - **Name:** `NEXT_PUBLIC_SUPABASE_URL`
   - **Value:** `https://[PROJECT-REF].supabase.co`
     - `[PROJECT-REF]` kısmını Supabase Dashboard > Settings > General'den bulabilirsiniz
     - Örnek: `https://kxnatjmutvogwoayiajw.supabase.co`
   - **Environment:** 
     - ✅ Production
     - ✅ Preview
     - ✅ Development
3. **"Save"** butonuna tıklayın

### 3.4 SUPABASE_SERVICE_ROLE_KEY Ekleme (Resim Yükleme İçin)

Supabase Storage'a resim yüklemek için service role key gereklidir.

1. **Supabase Dashboard** > **Settings** > **API** sekmesine gidin
2. **Service Role Key** (secret) kısmını bulun
3. **"Reveal"** butonuna tıklayın ve key'i kopyalayın
4. **Vercel Dashboard**'a dönün
5. **"Add New"** butonuna tıklayın
6. Şu bilgileri girin:
   - **Name:** `SUPABASE_SERVICE_ROLE_KEY`
   - **Value:** Kopyaladığınız service role key'i yapıştırın
   - **Environment:** 
     - ✅ Production
     - ✅ Preview
     - ✅ Development
7. **"Save"** butonuna tıklayın

⚠️ **GÜVENLİK UYARISI:** Service Role Key çok hassas bir bilgidir. Asla public repository'lere commit etmeyin!

---

## 🚀 Adım 4: Deployment ve Test

### 4.1 Redeploy Yapma

Environment variable ekledikten veya güncelledikten sonra **MUTLAKA** redeploy yapmalısınız!

1. Vercel Dashboard'da üst menüden **Deployments** sekmesine tıklayın
2. En son deployment'ı bulun
3. Sağ üstteki **"..."** (üç nokta) menüsüne tıklayın
4. **"Redeploy"** seçeneğini seçin
5. Deployment tamamlanana kadar bekleyin (2-5 dakika)

### 4.2 Build Loglarını Kontrol Etme

1. Deployment sayfasında **"Build Logs"** sekmesine tıklayın
2. Hata var mı kontrol edin
3. Eğer hata varsa, hata mesajını okuyun ve [Sorun Giderme](#sorun-giderme) bölümüne bakın

### 4.3 Runtime Loglarını Kontrol Etme

1. Deployment sayfasında **"Runtime Logs"** sekmesine tıklayın
2. Uygulama başlatıldığında şu mesajı görmelisiniz:
   ```
   ✅ Database connection initialized
   ```
3. Eğer şu hatayı görüyorsanız:
   ```
   ❌ Database connection error: DATABASE_URL or POSTGRES_URL is required
   ```
   → Environment variable eklenmemiş veya redeploy yapılmamış demektir.

### 4.4 Uygulamayı Test Etme

1. Deployment sayfasında **"Visit"** butonuna tıklayın
2. Uygulama açıldığında:
   - Ana sayfa yüklenmeli
   - Ürünler listelenmeli
   - API endpoint'leri çalışmalı

---

## ✅ Kontrol Listesi

Kurulum sonrası Vercel'de şu environment variables olmalı:

### Zorunlu:
- ✅ `POSTGRES_URL` (KRİTİK! - Veritabanı bağlantısı için)

### Opsiyonel (Resim Yükleme İçin):
- ✅ `NEXT_PUBLIC_SUPABASE_URL` (Supabase Storage URL'i)
- ✅ `SUPABASE_SERVICE_ROLE_KEY` (Supabase Storage authentication)

### Otomatik Eklenenler (Supabase-Vercel Entegrasyonu):
- ✅ `SUPABASE_JWT_SECRET` (Otomatik eklenir)
- ✅ `SUPABASE_PUBLISHABLE_KEY` (Otomatik eklenir)
- ✅ `SUPABASE_SECRET_KEY` (Otomatik eklenir)

---

## 🐛 Sorun Giderme

### Hata 1: "DATABASE_URL or POSTGRES_URL is required"

**Neden:** Environment variable eklenmemiş veya redeploy yapılmamış.

**Çözüm:**
1. Vercel Dashboard > Settings > Environment Variables
2. `POSTGRES_URL` var mı kontrol edin
3. Yoksa ekleyin (Adım 3.2)
4. **Redeploy yapın** (Adım 4.1)

---

### Hata 2: "SSL connection is required"

**Neden:** Connection string'de `sslmode=require` parametresi eksik.

**Çözüm:**
1. Connection string'in sonuna `?sslmode=require&pgbouncer=true` ekleyin
2. Environment variable'ı güncelleyin
3. **Redeploy yapın**

---

### Hata 3: "MaxClientsInSessionMode" veya "too many clients"

**Neden:** Port 5432 (Session Pooler) kullanılıyor, Vercel için uygun değil.

**Çözüm:**
1. Connection string'de port **6543** (Transaction Pooler) kullanın
2. `pgbouncer=true` parametresini ekleyin
3. Environment variable'ı güncelleyin
4. **Redeploy yapın**

**Doğru Format:**
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
```

---

### Hata 4: "Connection timeout"

**Neden:** Connection string yanlış veya network problemi.

**Çözüm:**
1. Connection string'i kontrol edin:
   - Şifre doğru mu?
   - PROJECT-REF doğru mu?
   - Port 6543 mü?
2. Supabase Dashboard > Settings > Database'den connection string'i tekrar kopyalayın
3. Environment variable'ı güncelleyin
4. **Redeploy yapın**

---

### Hata 5: "Resim yüklenirken hata oluştu"

**Neden:** Supabase Storage environment variables eksik.

**Çözüm:**
1. `NEXT_PUBLIC_SUPABASE_URL` ekleyin (Adım 3.3)
2. `SUPABASE_SERVICE_ROLE_KEY` ekleyin (Adım 3.4)
3. **Redeploy yapın**

---

### Hata 6: Build başarılı ama uygulama çalışmıyor

**Neden:** Environment variable eklenmiş ama redeploy yapılmamış.

**Çözüm:**
1. **MUTLAKA REDEPLOY YAPIN** (Adım 4.1)
2. Environment variable ekledikten sonra redeploy yapmadan uygulama yeni değişkenleri göremez!

---

## 📝 Önemli Notlar

1. **Connection Pooling:** Vercel'de mutlaka Transaction Pooler (port 6543) kullanın
2. **SSL:** `sslmode=require` parametresi mutlaka olmalı
3. **pgbouncer:** `pgbouncer=true` parametresi pooler için gereklidir
4. **Redeploy:** Environment variable ekledikten veya güncelledikten sonra mutlaka redeploy yapın
5. **Güvenlik:** Connection string'lerde şifre var, asla public repository'lere commit etmeyin
6. **Local vs Production:** 
   - Local'de Direct Connection (port 5432) kullanabilirsiniz
   - Production'da Transaction Pooler (port 6543) kullanmalısınız

---

## 🔄 Environment Variables Öncelik Sırası

Uygulamanız şu sırayla environment variables'ı kontrol eder:

1. `DATABASE_URL` (en yüksek öncelik)
2. `POSTGRES_URL` (Supabase-Vercel entegrasyonu)
3. `DB_HOST`, `DB_USER`, `DB_PASSWORD`, etc. (fallback)

---

## 📞 Yardım

Sorun yaşıyorsanız:

1. Vercel Dashboard > Deployments > Build Logs'u kontrol edin
2. Vercel Dashboard > Deployments > Runtime Logs'u kontrol edin
3. Supabase Dashboard > Logs'u kontrol edin
4. Hata mesajlarını okuyun ve yukarıdaki sorun giderme bölümüne bakın

---

## ✅ Başarı Kontrolü

Kurulum başarılı ise:

- ✅ Build loglarında hata yok
- ✅ Runtime loglarında "✅ Database connection initialized" mesajı var
- ✅ Uygulama açılıyor ve sayfalar yükleniyor
- ✅ API endpoint'leri çalışıyor
- ✅ Veritabanı sorguları başarılı

---

**🎉 Tebrikler! Vercel API bağlantılarınız hazır!**
