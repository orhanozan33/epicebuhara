# Supabase Migration - Adım Adım Talimatlar

## ✅ Migration Dosyası Hazır

**Dosya:** `baharat/migrations/add_tax_rates_to_company_settings.sql`

Bu migration `company_settings` tablosuna `tps_rate` ve `tvq_rate` kolonlarını ekler.

---

## 🚀 Supabase'e Uygulama Adımları

### YÖNTEM 1: Supabase SQL Editor (ÖNERİLEN)

1. **Supabase Dashboard'a gidin:**
   - https://supabase.com/dashboard
   - Projenizi seçin

2. **SQL Editor'ı açın:**
   - Sol menüden **"SQL Editor"** seçin
   - Veya: **"Database" > "SQL Editor"**

3. **Yeni Query oluşturun:**
   - **"+ New query"** butonuna tıklayın

4. **SQL'i yapıştırın:**
   - Aşağıdaki SQL kodunu kopyalayıp SQL Editor'a yapıştırın:

```sql
-- Migration: Add tps_rate and tvq_rate columns to company_settings table
-- Date: 2026-01-12
-- Description: Adds tax rate columns (TPS %5.00 and TVQ %9.975) to company_settings table

-- Add tps_rate column
ALTER TABLE company_settings 
ADD COLUMN IF NOT EXISTS tps_rate NUMERIC(5,2) DEFAULT 5.00;

-- Add tvq_rate column
ALTER TABLE company_settings 
ADD COLUMN IF NOT EXISTS tvq_rate NUMERIC(6,3) DEFAULT 9.975;

-- Update existing records with default values (if needed)
UPDATE company_settings 
SET 
  tps_rate = 5.00,
  tvq_rate = 9.975
WHERE tps_rate IS NULL OR tvq_rate IS NULL;
```

5. **Çalıştırın:**
   - **"RUN"** butonuna tıklayın (veya `Ctrl+Enter` / `Cmd+Enter`)
   - Başarılı mesajını görmelisiniz: "Success. No rows returned"

6. **Doğrulayın:**
   - Sol menüden **"Table Editor"** seçin
   - `company_settings` tablosunu açın
   - `tps_rate` ve `tvq_rate` kolonlarının eklendiğini kontrol edin

---

### YÖNTEM 2: Drizzle-kit Push (Alternatif)

⚠️ **Not:** Bu yöntem interaktif sorular sorabilir.

```bash
cd baharat
npm run db:push
```

Sorular geldiğinde:
- `company_settings` tablosu için: **"Yes, add the columns"** seçin
- Diğer tablolar için: **"No, skip"** seçin

---

## ✅ Migration Sonrası Kontrol

### 1. Kolonların Eklendiğini Kontrol Edin

```sql
-- Bu SQL'i çalıştırarak kolonları kontrol edin
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'company_settings'
ORDER BY ordinal_position;
```

**Beklenen Sonuç:**
- `tps_rate` - `numeric` - `5.00`
- `tvq_rate` - `numeric` - `9.975`

### 2. Default Değerleri Kontrol Edin

```sql
-- Mevcut kayıtları kontrol edin
SELECT id, company_name, tps_rate, tvq_rate
FROM company_settings;
```

**Beklenen:**
- Tüm kayıtlarda `tps_rate = 5.00`
- Tüm kayıtlarda `tvq_rate = 9.975`

---

## 🔧 Sorun Giderme

### "column already exists" hatası

Bu normal! `IF NOT EXISTS` kullanıldığı için hata vermez, kolon zaten varsa atlar.

### "relation company_settings does not exist" hatası

`company_settings` tablosu henüz oluşturulmamış. Önce tabloyu oluşturmanız gerekir.

### Kolonlar görünmüyor

1. Sayfayı yenileyin (F5)
2. Table Editor'da **"Refresh"** butonuna tıklayın
3. SQL sorgusu ile kontrol edin (yukarıdaki kontrol SQL'i)

---

## 📝 Migration SQL (Tam Metin)

```sql
-- Migration: Add tps_rate and tvq_rate columns to company_settings table
-- Date: 2026-01-12
-- Description: Adds tax rate columns (TPS %5.00 and TVQ %9.975) to company_settings table

-- Add tps_rate column
ALTER TABLE company_settings 
ADD COLUMN IF NOT EXISTS tps_rate NUMERIC(5,2) DEFAULT 5.00;

-- Add tvq_rate column
ALTER TABLE company_settings 
ADD COLUMN IF NOT EXISTS tvq_rate NUMERIC(6,3) DEFAULT 9.975;

-- Update existing records with default values (if needed)
UPDATE company_settings 
SET 
  tps_rate = 5.00,
  tvq_rate = 9.975
WHERE tps_rate IS NULL OR tvq_rate IS NULL;
```

---

**Son Güncelleme:** 2026-01-12
**Durum:** ✅ Hazır - Supabase SQL Editor'da çalıştırılabilir
