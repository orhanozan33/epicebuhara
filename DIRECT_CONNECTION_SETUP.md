# Direct Connection Setup

## 📋 Direct Connection String

```
postgresql://postgres:orhanozan33@db.kxnatjmutvogwoayiajw.supabase.co:5432/postgres?sslmode=require
```

## ✅ Local .env Dosyası

`.env` dosyasında:
```env
DATABASE_URL=postgresql://postgres:orhanozan33@db.kxnatjmutvogwoayiajw.supabase.co:5432/postgres?sslmode=require
```

## 🚀 Vercel Environment Variables

Vercel Dashboard > Settings > Environment Variables:

**Key:** `DATABASE_URL`
**Value:** 
```
postgresql://postgres:orhanozan33@db.kxnatjmutvogwoayiajw.supabase.co:5432/postgres?sslmode=require
```

**Environment:** Production, Preview, Development (hepsini seçin)

## 🔧 Önemli Notlar

1. **Direct Connection (Port 5432):** 
   - Pooler kullanmıyor
   - Direkt database'e bağlanıyor
   - Local development için uygun

2. **SSL Mode:** 
   - `?sslmode=require` eklendi (SSL gerekli)

3. **Şifre:** 
   - `orhanozan33` (sizin şifreniz)

4. **Deploy:**
   - Vercel'e ekledikten sonra mutlaka redeploy yapın!

## ⚠️ Vercel'de Direct Connection

Vercel'de Direct Connection kullanmak genellikle önerilmez çünkü:
- Connection limit sorunları yaşanabilir
- Pooler (port 6543) daha iyi performans sağlar

Ama eğer Direct Connection kullanmak istiyorsanız, yukarıdaki connection string'i kullanabilirsiniz.
