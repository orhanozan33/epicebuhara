# 🚀 Vercel İçin Hazır Connection String

## 📋 Vercel Environment Variables

Vercel'e eklenecek connection string (şimdilik bir kenara, sonra kullanacağız):

```
postgresql://postgres.kxnatjmutvogwoayiajw:orhanozan33@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
```

## 🔧 Vercel'e Ekleme Adımları (SONRA YAPILACAK)

1. **Vercel Dashboard** > Projeniz > **Settings** > **Environment Variables**
2. **Add New** butonuna tıklayın
3. Şu bilgileri girin:
   - **Name:** `POSTGRES_URL`
   - **Value:** Yukarıdaki connection string'i yapıştırın
   - **Environment:** ✅ Production, ✅ Preview, ✅ Development
4. **Save** butonuna tıklayın
5. **Deployments** > En son deployment > **Redeploy**

## ✅ Özellikler

- ✅ Port: `6543` (Transaction Pooler)
- ✅ Domain: `pooler.supabase.com`
- ✅ `pgbouncer=true` (Zorunlu)
- ✅ `sslmode=require` (SSL zorunlu)

## 📝 Not

Bu ayarları şimdilik bir kenara bıraktık. Önce local'de her şeyi test ediyoruz, sonra Vercel'e geçeceğiz.
