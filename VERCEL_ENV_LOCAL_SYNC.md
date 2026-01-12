# 🔄 VERCEL ENVIRONMENT VARIABLES → LOCAL .env SENKRONİZASYONU

## ✅ EKLENEN DEĞİŞKENLER

Aşağıdaki environment variable'lar Vercel'den alınarak local `.env` dosyasına eklendi:

### Veritabanı Bağlantısı
```env
DATABASE_URL=postgresql://postgres.kxnatjmutvogwoayiajw:orhanozan33@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require
```

### Supabase JWT ve API Keys
```env
JWT_SECRET=z0eKeFHDpJxBDf5mqOdzX33qPSupJcfgOsHz/qCpWOO3I3teeNJ0ZjmslB2MPIF5Km0bsC2u66qBbaluRxSVog==
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_GnvQLfUh510fyEJGV0mEJg_Km_-x3zN
NEXT_PUBLIC_SUPABASE_URL=https://kxnatjmutvogwoayiajw.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4bmF0am11dHZvZ3dvYXlpYWp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzg0OTIzNCwiZXhwIjoyMDgzNDI1MjM0fQ.VMoiTga2RPlcg1unmcZOamuD6xWxzqt3waOPNwW9rac
```

### Uygulama Ayarları
```env
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

## 📋 KONTROL LİSTESİ

- [x] `DATABASE_URL` eklendi/güncellendi
- [x] `JWT_SECRET` eklendi
- [x] `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` eklendi
- [x] `NEXT_PUBLIC_SUPABASE_URL` eklendi
- [x] `SUPABASE_SERVICE_ROLE_KEY` eklendi
- [x] `FRONTEND_URL` eklendi
- [x] `NODE_ENV` eklendi

## 🔍 ÖNEMLİ NOTLAR

### DATABASE_URL Farklılığı
- **Vercel:** Port 5432 (Session Pooler) - `aws-1-us-east-1.pooler.supabase.com:5432`
- **Local (Önceki):** Port 5432 (Direct Connection) - `db.kxnatjmutvogwoayiajw.supabase.co:5432`
- **Local (Yeni):** Vercel'deki ile aynı (Session Pooler) - `aws-1-us-east-1.pooler.supabase.com:5432`

### NEXT_PUBLIC Değişkenleri
- `NEXT_PUBLIC_` ile başlayan değişkenler client-side'a expose edilir
- Bu değişkenler browser'da görülebilir, hassas bilgi içermemeli

### JWT_SECRET
- Bu değer Supabase JWT token'larını doğrulamak için kullanılır
- **Asla public repository'lere commit etmeyin!**

## 🚀 SONRAKI ADIMLAR

1. **Development Server'ı yeniden başlatın:**
   ```bash
   npm run dev
   ```

2. **Bağlantıyı test edin:**
   - Admin Panel > Ayarlar > Sosyal Medya
   - Instagram ve Facebook URL'lerini kaydedin
   - Hata olmamalı

3. **API Endpoint'lerini test edin:**
   - `/api/settings/company`
   - `/api/products`
   - `/api/categories`

## ⚠️ UYARI

- `.env` dosyası `.gitignore` içinde olmalı (güvenlik için)
- Bu değerler production secret'ları, paylaşmayın
- Local ve production ortamları arasında farklılık olabilir (normal)
