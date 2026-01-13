# 🔧 Vercel Connection String Düzeltme Rehberi

## ❌ Hata: "Tenant or user not found"

Bu hata, Supabase Transaction Pooler connection string formatının yanlış olduğunu gösterir.

---

## 🔍 Sorun Tespiti

**Hata Kodu:** `XX000`  
**Hata Mesajı:** `Tenant or user not found`

**Neden:**
- Connection string'de kullanıcı adı formatı yanlış
- Şifre yanlış veya URL encode edilmemiş
- Connection string formatı Transaction Pooler için uygun değil

---

## ✅ Çözüm: Doğru Connection String Formatı

### Transaction Pooler için Doğru Format:

```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
```

**ÖNEMLİ:**
- Kullanıcı adı: `postgres.[PROJECT-REF]` (nokta ile ayrılmış)
- ❌ Yanlış: `postgres` (sadece)
- ✅ Doğru: `postgres.kxnatjmutvogwoayiajw`

---

## 📋 Adım Adım Düzeltme

### 1. Supabase Dashboard'dan Yeni Connection String Alın

1. **Supabase Dashboard** > **Settings** > **Database**
2. **Connection String** bölümüne gidin
3. **Connection Pooling** sekmesine tıklayın
4. **Transaction Mode** seçin (Port 6543)
5. Connection string'i kopyalayın

**Örnek Format:**
```
postgresql://postgres.kxnatjmutvogwoayiajw:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

### 2. Şifreyi Kontrol Edin

**ÖNEMLİ:** Şifre özel karakterler içeriyorsa URL encode edin:

| Karakter | URL Encoded |
|----------|-------------|
| `@` | `%40` |
| `:` | `%3A` |
| `/` | `%2F` |
| `+` | `%2B` |
| `=` | `%3D` |
| `&` | `%26` |
| `#` | `%23` |
| `?` | `%3F` |
| `%` | `%25` |
| ` ` (boşluk) | `%20` |

**Örnek:**
- Şifre: `MyP@ss:123` → URL Encoded: `MyP%40ss%3A123`

### 3. Connection String'e Parametreleri Ekleyin

Kopyaladığınız connection string'in sonuna şunu ekleyin:

```
?sslmode=require&pgbouncer=true
```

**Final Format:**
```
postgresql://postgres.kxnatjmutvogwoayiajw:orhanozan33@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
```

### 4. Vercel'de Environment Variable'ı Güncelleyin

1. **Vercel Dashboard** > Projeniz > **Settings** > **Environment Variables**
2. `POSTGRES_URL` veya `DATABASE_URL` değişkenini bulun
3. **Edit** (kalem ikonu) butonuna tıklayın
4. **Value** alanına yeni connection string'i yapıştırın
5. **Save** butonuna tıklayın

### 5. REDEPLOY YAPIN! (ÇOK ÖNEMLİ!)

1. **Vercel Dashboard** > **Deployments**
2. En son deployment'ı bulun
3. Sağ üstteki **"..."** (üç nokta) menüsüne tıklayın
4. **"Redeploy"** seçeneğini seçin
5. Deployment tamamlanana kadar bekleyin (2-5 dakika)

---

## 🔍 Kontrol Listesi

Connection string'iniz şu özelliklere sahip olmalı:

- ✅ Kullanıcı adı: `postgres.[PROJECT-REF]` formatında (nokta ile)
- ✅ Port: `6543` (Transaction Pooler)
- ✅ Domain: `pooler.supabase.com`
- ✅ `?sslmode=require` parametresi var
- ✅ `&pgbouncer=true` parametresi var
- ✅ Şifre doğru ve URL encode edilmiş (gerekirse)

---

## 📝 Örnek Connection String'ler

### Doğru Format (Transaction Pooler):
```
postgresql://postgres.kxnatjmutvogwoayiajw:orhanozan33@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
```

### Yanlış Formatlar:

❌ **Yanlış 1:** Kullanıcı adı formatı yanlış
```
postgresql://postgres:orhanozan33@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
```
→ `postgres` yerine `postgres.kxnatjmutvogwoayiajw` olmalı

❌ **Yanlış 2:** Port yanlış
```
postgresql://postgres.kxnatjmutvogwoayiajw:orhanozan33@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require
```
→ Port `6543` olmalı (Transaction Pooler için)

❌ **Yanlış 3:** pgbouncer parametresi eksik
```
postgresql://postgres.kxnatjmutvogwoayiajw:orhanozan33@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require
```
→ `&pgbouncer=true` eklenmeli

---

## 🧪 Test Etme

1. **Vercel Dashboard** > **Deployments** > En son deployment
2. **Runtime Logs** sekmesine gidin
3. Şu mesajı görmelisiniz:
   ```
   ✅ Database connection initialized
   ```
4. Eğer hala hata varsa, hata mesajını kontrol edin

---

## 🐛 Hala Çalışmıyorsa

### Seçenek 1: Şifreyi Yenileyin

1. **Supabase Dashboard** > **Settings** > **Database**
2. **Database Password** bölümüne gidin
3. **"Reset database password"** butonuna tıklayın
4. Yeni şifreyi kopyalayın
5. Connection string'de şifreyi güncelleyin
6. Vercel'de environment variable'ı güncelleyin
7. **Redeploy yapın**

### Seçenek 2: Direct Connection Kullanın (Geçici)

Eğer Transaction Pooler çalışmıyorsa, geçici olarak Direct Connection kullanabilirsiniz:

```
postgresql://postgres:orhanozan33@db.kxnatjmutvogwoayiajw.supabase.co:5432/postgres?sslmode=require
```

⚠️ **Not:** Direct Connection Vercel'de IPv4 gerektirebilir. Transaction Pooler önerilir.

---

## ✅ Başarı Kontrolü

Kurulum başarılı ise:

- ✅ Runtime Logs'da "Database connection initialized" mesajı var
- ✅ API endpoint'leri çalışıyor
- ✅ Veritabanı sorguları başarılı
- ✅ "Tenant or user not found" hatası yok

---

**🎉 Connection string düzeltildikten sonra uygulama çalışmalı!**
