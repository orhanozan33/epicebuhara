# Vercel için Supabase Bağlantı Rehberi

## 📋 Supabase Dashboard'dan Görünen Seçenekler

Supabase Dashboard > Database Settings sayfasında şu seçenekler var:

1. **Direct Connection** (Doğrudan Bağlantı)
2. **Transaction Pooler** (Transaction Havuzlayıcı) ⭐ **ÖNERİLEN**
3. **Session Pooler** (Session Havuzlayıcı)

## ⚠️ Vercel için Önemli Not

Supabase Dashboard'da şu uyarı görünüyor:

> **"Some platforms require a Direct Connection:"**
> - Vercel
> - GitHub Actions
> - Render
> - Retool
> 
> **"If you wish to use a Direct Connection with these, please purchase IPv4 support."**

### Çözüm: Transaction Pooler Kullanın! ✅

**Direkt Connection + IPv4 satın almak yerine**, Vercel için **Transaction Pooler** kullanın!

Supabase'in önerdiği alternatif:
> "You may also use the Session Pooler or Transaction Pooler if you are on a IPv4 network."

## 🎯 Vercel için Önerilen: Transaction Pooler

### Neden Transaction Pooler?
- ✅ **Ekstra maliyet yok** (IPv4 satın alma gerekmez)
- ✅ **Vercel için ideal** (serverless functions için optimize)
- ✅ **Ölçeklenebilir** (connection pooling sayesinde)
- ✅ **Performanslı** (kısa ve izole bağlantılar)

### Nasıl Yapılandırılır?

1. **Supabase Dashboard'da:**
   - Database Settings > Connection String
   - **Method:** "Transaction pooler" seçin
   - **SHARED POOLER** veya **DEDICATED POOLER** seçin (genellikle SHARED yeterli)
   - Connection string'i kopyalayın
   
2. **Connection String Formatı:**
   ```
   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```
   
   **Önemli:** Port **6543** (Transaction Pooler portu)

3. **SSL ve Pooler Parametrelerini Ekleyin:**
   Connection string'in sonuna şunu ekleyin:
   ```
   ?sslmode=require&pgbouncer=true
   ```
   
   **Tam format:**
   ```
   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
   ```

4. **Vercel Dashboard'da:**
   - Settings > Environment Variables
   - **POSTGRES_URL** ekleyin
   - Value olarak yukarıdaki connection string'i yapıştırın
   - Environment: Production, Preview, Development
   - Save

## 📊 Karşılaştırma

| Özellik | Direct Connection | Transaction Pooler |
|---------|------------------|-------------------|
| **Vercel uyumlu** | ✅ (IPv4 gerekli) | ✅ (IPv4 gereksiz) |
| **Ekstra maliyet** | ❌ IPv4 satın al | ✅ Ücretsiz |
| **Serverless için** | ⚠️ Uygun değil | ✅ İdeal |
| **Connection pooling** | ❌ Yok | ✅ Var |
| **Port** | 5432 | 6543 |

## 🔧 Adım Adım Kurulum

### 1. Supabase Dashboard'dan Connection String Alın

1. Supabase Dashboard > **Settings** > **Database**
2. **Connection String** bölümüne gidin
3. **Method** dropdown'ından **"Transaction pooler"** seçin
4. **SHARED POOLER** seçin (veya DEDICATED, premium hesabınız varsa)
5. Connection string'i kopyalayın
6. **Şifreyi göster** butonuna tıklayarak şifreyi görebilirsiniz (gerekirse)

### 2. Connection String'i Düzenleyin

Kopyaladığınız connection string'in sonuna `?sslmode=require&pgbouncer=true` ekleyin:

**Örnek:**
```
postgresql://postgres.kxnatjmutvogwoayiajw:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
```

### 3. Vercel'e Ekleyin

1. Vercel Dashboard > Projeniz > **Settings** > **Environment Variables**
2. **"Add New"** butonuna tıklayın
3. **Name:** `POSTGRES_URL`
4. **Value:** Yukarıdaki düzenlenmiş connection string'i yapıştırın
5. **Environment:** 
   - ✅ Production
   - ✅ Preview  
   - ✅ Development (isteğe bağlı)
6. **"Save"** butonuna tıklayın

### 4. Redeploy

1. Vercel Dashboard > **Deployments**
2. En son deployment'a **"Redeploy"** yapın
3. Veya yeni bir commit push edin

## ✅ Kontrol

Deployment başarılı olduktan sonra:

1. **Runtime Logs** kontrol edin:
   - Deployment sayfasında **"Runtime Logs"** sekmesine gidin
   - Database connection hatası var mı kontrol edin

2. **Build Logs** kontrol edin:
   - Deployment sayfasında **"Build Logs"** sekmesine gidin
   - Build başarılı mı kontrol edin

## 🐛 Sorun Giderme

### Hata: "SSL connection is required"
**Çözüm:** Connection string'in sonuna `?sslmode=require` ekleyin.

### Hata: "MaxClientsInSessionMode"
**Çözüm:** Transaction Pooler (port 6543) kullandığınızdan emin olun, Session Pooler (port 5432) değil.

### Hata: Connection timeout
**Çözüm:** 
- Pooler URL kullandığınızdan emin olun
- `pgbouncer=true` parametresini ekleyin
- Port 6543 olduğundan emin olun

## 📝 Özet

✅ **Vercel için en iyi seçenek: Transaction Pooler (Port 6543)**
- IPv4 satın alma gerekmez
- Serverless için optimize
- Ücretsiz (SHARED POOLER)
- Vercel tarafından önerilir

❌ **Direct Connection'dan kaçının (Vercel için)**
- IPv4 satın almanız gerekir
- Serverless için uygun değil
- Ekstra maliyet
