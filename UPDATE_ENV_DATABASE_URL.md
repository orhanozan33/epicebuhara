# Environment Variable Güncelleme

## 📋 Local .env Dosyasına Eklenecek

Aşağıdaki connection string'i local `.env` dosyasına ekleyin veya güncelleyin:

```env
# Direct Connection (Port 5432)
DATABASE_URL=postgresql://postgres:orhanozan33@db.kxnatjmutvogwoayiajw.supabase.co:5432/postgres?sslmode=require

# Alternatif: Eğer DATABASE_URL zaten varsa, POSTGRES_URL olarak ekleyin
POSTGRES_URL=postgresql://postgres:orhanozan33@db.kxnatjmutvogwoayiajw.supabase.co:5432/postgres?sslmode=require
```

## 🔧 Vercel Environment Variables

Vercel Dashboard'da da aynı connection string'i ekleyin:

1. **Vercel Dashboard** > **Settings** > **Environment Variables**
2. **Add New** butonuna tıklayın
3. Key: `DATABASE_URL` (veya `POSTGRES_URL` eğer DATABASE_URL read-only ise)
4. Value: `postgresql://postgres:orhanozan33@db.kxnatjmutvogwoayiajw.supabase.co:5432/postgres?sslmode=require`
5. Environment: Production, Preview, Development seçin
6. **Save**

## ⚠️ ÖNEMLİ NOT

- Şifre: `orhanozan33` (sizin daha önce paylaştığınız şifre)
- `[YOUR-PASSWORD]` kısmını `orhanozan33` ile değiştirdim
- `sslmode=require` eklendi (SSL gerekli)

## 📝 Connection String Formatı

- **Host:** `db.kxnatjmutvogwoayiajw.supabase.co`
- **Port:** `5432` (Direct Connection)
- **Database:** `postgres`
- **User:** `postgres`
- **Password:** `orhanozan33`
- **SSL:** `sslmode=require`
