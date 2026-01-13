# Company Settings Schema - Üç Format

Bu dosya `company_settings` tablosu için PostgreSQL SQL, Drizzle ORM ve Prisma schema'larını içerir.

---

## 1. PostgreSQL SQL Schema

```sql
-- Company Settings Tablosu
CREATE TABLE IF NOT EXISTS company_settings (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(255),
    address TEXT,
    phone VARCHAR(20),
    postal_code VARCHAR(20),
    tax_number VARCHAR(100),
    tps_number VARCHAR(100),
    tvq_number VARCHAR(100),
    tps_rate NUMERIC(5,2) DEFAULT 5.00,
    tvq_rate NUMERIC(6,3) DEFAULT 9.975,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Updated_at için trigger (otomatik güncelleme)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_company_settings_updated_at
    BEFORE UPDATE ON company_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Index (opsiyonel - performans için)
CREATE INDEX IF NOT EXISTS idx_company_settings_id ON company_settings(id);

-- Default değer ekleme (opsiyonel)
INSERT INTO company_settings (
    company_name,
    tps_rate,
    tvq_rate
) VALUES (
    'Epicê Buhara',
    5.00,
    9.975
) ON CONFLICT DO NOTHING;
```

---

## 2. Drizzle ORM Schema (TypeScript)

```typescript
import { 
  pgTable, 
  serial, 
  varchar, 
  text, 
  numeric, 
  timestamp 
} from 'drizzle-orm/pg-core';

export const companySettings = pgTable('company_settings', {
  id: serial('id').primaryKey().notNull(),
  companyName: varchar('company_name', { length: 255 }),
  address: text('address'),
  phone: varchar('phone', { length: 20 }),
  postalCode: varchar('postal_code', { length: 20 }),
  taxNumber: varchar('tax_number', { length: 100 }),
  tpsNumber: varchar('tps_number', { length: 100 }),
  tvqNumber: varchar('tvq_number', { length: 100 }),
  tpsRate: numeric('tps_rate', { precision: 5, scale: 2 }).default('5.00'),
  tvqRate: numeric('tvq_rate', { precision: 6, scale: 3 }).default('9.975'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

**Kullanım Örneği:**

```typescript
import { db } from '@/src/db';
import { companySettings } from '@/src/db/schema';
import { eq } from 'drizzle-orm';

// Güncelleme
await db.update(companySettings)
  .set({ 
    companyName: 'Epicê Buhara',
    tpsRate: '5.00',
    tvqRate: '9.975'
  })
  .where(eq(companySettings.id, 1));

// Okuma
const settings = await db.select().from(companySettings).limit(1);
const tpsRate = parseFloat(settings[0]?.tpsRate || '5.00');
const tvqRate = parseFloat(settings[0]?.tvqRate || '9.975');
```

---

## 3. Prisma Schema

```prisma
model CompanySettings {
  id          Int      @id @default(autoincrement())
  companyName String?  @map("company_name") @db.VarChar(255)
  address     String?  @db.Text
  phone       String?  @db.VarChar(20)
  postalCode  String?  @map("postal_code") @db.VarChar(20)
  taxNumber   String?  @map("tax_number") @db.VarChar(100)
  tpsNumber   String?  @map("tps_number") @db.VarChar(100)
  tvqNumber   String?  @map("tvq_number") @db.VarChar(100)
  tpsRate     Decimal? @map("tps_rate") @db.Decimal(5, 2) @default(5.00)
  tvqRate     Decimal? @map("tvq_rate") @db.Decimal(6, 3) @default(9.975)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@map("company_settings")
}
```

**Kullanım Örneği:**

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Güncelleme
await prisma.companySettings.update({
  where: { id: 1 },
  data: {
    companyName: 'Epicê Buhara',
    tpsRate: 5.00,
    tvqRate: 9.975
  }
});

// Okuma
const settings = await prisma.companySettings.findFirst();
const tpsRate = settings?.tpsRate.toNumber() || 5.00;
const tvqRate = settings?.tvqRate.toNumber() || 9.975;
```

---

## Notlar ve Önemli Detaylar

### Numeric Veri Tipleri

**PostgreSQL:**
- `NUMERIC(5,2)` = 5 basamak toplam, 2 ondalık (örn: 999.99)
- `NUMERIC(6,3)` = 6 basamak toplam, 3 ondalık (örn: 999.999)

**Drizzle:**
- `numeric('tps_rate', { precision: 5, scale: 2 })` - String olarak saklanır
- Okuma: `parseFloat(value)` ile number'a çevirin

**Prisma:**
- `@db.Decimal(5, 2)` - Decimal tipi kullanır
- Okuma: `.toNumber()` ile number'a çevirin

### Default Değerler

- **TPS Rate:** 5.00 (%5.00)
- **TVQ Rate:** 9.975 (%9.975)

### Supabase Uyumluluğu

✅ Tüm schema'lar Supabase PostgreSQL ile uyumludur
✅ Snake_case kolon isimleri kullanılmıştır
✅ Timestamp'ler otomatik güncellenir
✅ Numeric tipler finansal hesaplamalar için uygundur

### Migration Stratejisi

**Drizzle ile:**
```bash
npm run db:push
```

**Prisma ile:**
```bash
npx prisma migrate dev --name add_tax_rates
npx prisma generate
```

**SQL ile:**
Supabase Dashboard > SQL Editor > Yukarıdaki SQL'i çalıştırın

---

## Finansal Hesaplama Örneği

```typescript
// Drizzle kullanarak
const settings = await db.select().from(companySettings).limit(1);
const tpsRate = parseFloat(settings[0]?.tpsRate || '5.00');
const tvqRate = parseFloat(settings[0]?.tvqRate || '9.975');

// Fiyat hesaplama
const subtotal = 100.00;
const tpsAmount = (subtotal * tpsRate) / 100; // 5.00
const tvqAmount = (subtotal * tvqRate) / 100; // 9.975
const total = subtotal + tpsAmount + tvqAmount; // 114.975

// Yuvarlama (2 ondalık)
const finalTotal = Math.round(total * 100) / 100; // 114.98
```

---

**Son Güncelleme:** 2026-01-12
**Proje:** Epicê Buhara - Baharat Satış
**Database:** Supabase PostgreSQL
