# Baharat E-Ticaret Projesi

Epice Buhara baharat satış sitesi - Next.js, Drizzle ORM, PostgreSQL

## Proje Yapısı

```
baharat/
├── drizzle/              # Drizzle migration dosyaları
├── src/
│   ├── db/
│   │   └── schema.ts     # Veritabanı tablo tanımları
│   └── index.ts          # Ana export dosyası
├── app/                  # Next.js App Router
│   ├── api/              # API routes
│   ├── components/       # React component'leri
│   ├── admin-panel/      # Admin panel sayfaları
│   └── ...
├── locales/              # Çeviri dosyaları (TR, EN, FR)
├── scripts/              # Yardımcı scriptler
├── .env.local            # Environment variables (oluşturulacak)
├── drizzle.config.ts     # Drizzle config
├── package.json
└── tsconfig.json
```

## Kurulum

### 1. Bağımlılıkları Yükle

```bash
cd baharat
npm install
```

### 2. Environment Variables

`.env.local` dosyası oluştur:

```env
DATABASE_URL=postgresql://postgres:333333@localhost:5432/baharat
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=333333
DB_NAME=baharat
```

### 3. Veritabanı Oluştur

PostgreSQL'de veritabanı oluştur:

```bash
psql -U postgres
CREATE DATABASE baharat;
```

### 4. Veritabanı Schema'sını Uygula

```bash
npm run db:push
```

### 5. Admin Kullanıcısı Oluştur

```bash
npm run create-admin
```

**Admin Bilgileri:**
- Kullanıcı Adı: `mehmet`
- Şifre: `33333333`

### 6. Projeyi Başlat

```bash
npm run dev
```

## Özellikler

- ✅ Ana sayfa (Sol: Kategoriler, Sağ: Ürünler)
- ✅ Header ve Footer
- ✅ Sepet sayfası (`/sepet`)
- ✅ Sipariş takibi (`/siparis-takibi`)
- ✅ Admin paneli (`/admin-panel`)
- ✅ Mobil uyumlu tasarım
- ✅ Drizzle ORM ile veritabanı yönetimi
- ✅ Next.js Turbopack desteği
- ✅ **3 Dil Desteği (TR, EN, FR)** - Header'da dil değiştirici
- ✅ Offline sistem desteği

## Teknolojiler

- **Frontend:** Next.js 16.1.1, React 19, Tailwind CSS 4, Turbopack
- **Database:** PostgreSQL, Drizzle ORM
- **API:** Next.js API Routes
- **i18n:** react-i18next (TR, EN, FR)

## API Endpoints

- `GET /api/products` - Tüm ürünleri getir
- `GET /api/categories` - Tüm kategorileri getir
- `POST /api/auth/login` - Admin girişi

---
*Son güncelleme: Test commit*
