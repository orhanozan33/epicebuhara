# Supabase Kurulum Rehberi

## 1. Supabase Projesi Oluşturma

1. https://supabase.com adresine gidin
2. Yeni bir proje oluşturun
3. Database Settings > Connection String bölümünden connection string'i alın

## 2. Connection String Formatı

Supabase'den alacağınız connection string şu formatta olacak:

```
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

## 3. .env.local Yapılandırması

`.env.local` dosyasını şu şekilde güncelleyin:

```env
# Supabase Connection String (Direkt kullanım için)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# Veya ayrı parametreler ile:
DB_HOST=db.[PROJECT-REF].supabase.co
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=[YOUR-PASSWORD]
DB_NAME=postgres
```

**ÖNEMLİ:** 
- `[YOUR-PASSWORD]` yerine Supabase projenizin database şifresini yazın
- `[PROJECT-REF]` yerine proje referans ID'nizi yazın
- Connection string'deki şifre özel karakterler içeriyorsa URL encode edin (%40 = @, %3A = :, vb.)

## 4. Connection Pooling (Önerilen - Production için)

Supabase connection pooling kullanmak için:

```env
# Transaction Pooler (Port 6543) - Önerilen
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true

# Session Pooler (Port 5432)
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```

## 5. SSL Bağlantısı

Supabase SSL gerektirir. Connection string'e SSL parametresi ekleyin:

```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require
```

## 6. Veritabanı Schema'sını Uygula

```bash
npm run db:push
```

## 7. Test Et

```bash
npm run dev
```

## Güvenlik Notları

- `.env.local` dosyasını asla commit etmeyin (zaten .gitignore'da olmalı)
- Production'da environment variables'ı hosting platform'unuzda (Vercel, Railway, vb.) ayarlayın
- Supabase dashboard'dan connection string'i görebilirsiniz: Settings > Database > Connection string
