# Kurulum Talimatları

## 1. Environment Variables Oluştur

`baharat` klasöründe `.env.local` dosyası oluştur:

```env
DATABASE_URL=postgresql://postgres:333333@localhost:5432/baharat
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=333333
DB_NAME=baharat
```

## 2. Veritabanı Oluştur

PostgreSQL'de veritabanı oluştur:

```bash
psql -U postgres
CREATE DATABASE baharat;
\q
```

## 3. Veritabanı Schema'sını Uygula

```bash
cd baharat
npm run db:push
```

## 4. Admin Kullanıcısı Oluştur

```bash
npm run create-admin
```

## 5. Projeyi Başlat

```bash
npm run dev
```

## Admin Girişi

- URL: http://localhost:3000/admin-panel/login
- Kullanıcı Adı: `mehmet`
- Şifre: `33333333`

## Dil Desteği

Header'da TR, EN, FR butonları ile dil değiştirilebilir.
