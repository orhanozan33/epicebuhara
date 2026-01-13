# Quebec Vergi Sistemi - Dokümantasyon

## 📋 Vergi Sistemi Özeti

Quebec'te iki tür vergi uygulanır:

1. **TPS (GST - Goods and Services Tax)**: %5.00
2. **TVQ (QST - Quebec Sales Tax)**: %9.975

---

## 🔢 Hesaplama Formülü

### Quebec Vergi Sistemi Kuralları:

1. **Öncelik:** Önce TPS, sonra TVQ
2. **TVQ Hesaplama:** TVQ, TPS eklenmiş fiyat üzerinden hesaplanır (kademeli vergi sistemi)

### Formül:

```typescript
// 1. Subtotal (İskonto sonrası)
const afterDiscount = subtotal - discount;

// 2. TPS hesapla (%5)
const tpsAmount = afterDiscount * 0.05;

// 3. TVQ hesapla (%9.975) - TPS dahil fiyat üzerinden
const tvqAmount = (afterDiscount + tpsAmount) * 0.09975;

// 4. Toplam
const total = afterDiscount + tpsAmount + tvqAmount;
```

---

## 📐 Örnek Hesaplama

### Örnek 1: $100.00 Subtotal

```typescript
const subtotal = 100.00;
const afterDiscount = 100.00; // İskonto yok

// TPS hesapla
const tpsAmount = 100.00 * 0.05 = 5.00;

// TVQ hesapla (TPS dahil fiyat üzerinden)
const tvqAmount = (100.00 + 5.00) * 0.09975 = 10.47375 ≈ 10.47;

// Toplam
const total = 100.00 + 5.00 + 10.47 = 115.47;
```

**Sonuç:**
- Subtotal: $100.00
- TPS (5%): $5.00
- TVQ (9.975%): $10.47
- **Total: $115.47**

### Örnek 2: $100.00 Subtotal + %10 İskonto

```typescript
const subtotal = 100.00;
const discount = 10.00; // %10
const afterDiscount = 100.00 - 10.00 = 90.00;

// TPS hesapla
const tpsAmount = 90.00 * 0.05 = 4.50;

// TVQ hesapla (TPS dahil fiyat üzerinden)
const tvqAmount = (90.00 + 4.50) * 0.09975 = 9.42375 ≈ 9.42;

// Toplam
const total = 90.00 + 4.50 + 9.42 = 103.92;
```

**Sonuç:**
- Subtotal: $100.00
- İskonto: -$10.00
- İskonto Sonrası: $90.00
- TPS (5%): $4.50
- TVQ (9.975%): $9.42
- **Total: $103.92**

---

## ⚠️ Yaygın Hatalar

### ❌ YANLIŞ Hesaplama:

```typescript
// YANLIŞ - TVQ, subtotal üzerinden hesaplanıyor
const tpsAmount = afterDiscount * 0.05;
const tvqAmount = afterDiscount * 0.09975; // ❌ YANLIŞ!
const total = afterDiscount + tpsAmount + tvqAmount;
```

**Sorun:** Bu formül, TVQ'yu subtotal üzerinden hesaplar, ancak Quebec sisteminde TVQ, TPS eklenmiş fiyat üzerinden hesaplanmalıdır.

### ✅ DOĞRU Hesaplama:

```typescript
// DOĞRU - TVQ, TPS dahil fiyat üzerinden hesaplanıyor
const tpsAmount = afterDiscount * 0.05;
const tvqAmount = (afterDiscount + tpsAmount) * 0.09975; // ✅ DOĞRU!
const total = afterDiscount + tpsAmount + tvqAmount;
```

---

## 💾 Database Schema

### Company Settings Tablosu

```typescript
export const companySettings = pgTable('company_settings', {
  // ...
  tpsRate: numeric('tps_rate', { precision: 5, scale: 2 }).default('5.00'),
  tvqRate: numeric('tvq_rate', { precision: 6, scale: 3 }).default('9.975'),
  // ...
});
```

**Default Değerler:**
- `tps_rate`: 5.00 (%5.00)
- `tvq_rate`: 9.975 (%9.975)

---

## 🔧 Kodda Kullanım

### TypeScript / JavaScript

```typescript
// Quebec vergi hesaplama fonksiyonu
function calculateQuebecTaxes(afterDiscount: number): {
  tps: number;
  tvq: number;
  total: number;
} {
  const tpsRate = 0.05; // %5
  const tvqRate = 0.09975; // %9.975
  
  // TPS hesapla
  const tps = Math.round(afterDiscount * tpsRate * 100) / 100;
  
  // TVQ hesapla (TPS dahil fiyat üzerinden)
  const tvq = Math.round((afterDiscount + tps) * tvqRate * 100) / 100;
  
  // Toplam
  const total = Math.round((afterDiscount + tps + tvq) * 100) / 100;
  
  return { tps, tvq, total };
}

// Kullanım
const { tps, tvq, total } = calculateQuebecTaxes(100.00);
// tps: 5.00
// tvq: 10.47
// total: 115.47
```

---

## 📝 Yuvarlama

Quebec vergi sistemi için yuvarlama kuralı:

```typescript
// Her adımda 2 ondalık basamağa yuvarla
const tps = Math.round(afterDiscount * 0.05 * 100) / 100;
const tvq = Math.round((afterDiscount + tps) * 0.09975 * 100) / 100;
const total = Math.round((afterDiscount + tps + tvq) * 100) / 100;
```

**Neden?**
- Her vergi tutarı 2 ondalık basamağa yuvarlanmalı
- Toplam tutar da 2 ondalık basamağa yuvarlanmalı
- Bu, finansal hesaplamalarda standart uygulamadır

---

## 🎯 Güncellenmiş Dosyalar

Quebec vergi sistemine göre güncellenen dosyalar:

1. ✅ `app/api/dealers/[id]/sales/route.ts`
2. ✅ `app/admin-panel/dealers/sales/[dealerId]/page.tsx`
3. ✅ `app/admin-panel/dealers/[id]/satis/[saleId]/page.tsx` (3 yer)
4. ✅ `app/admin-panel/dealers/[id]/satis/[saleId]/fatura/page.tsx`
5. ✅ `app/admin-panel/dealers/[id]/sales/[saleId]/invoice/page.tsx`
6. ✅ `app/api/reports/route.ts` (2 yer: orders ve dealers)

---

## 📚 Kaynaklar

- [Revenu Québec - TPS/TVQ Hesaplama](https://www.revenuquebec.ca/en/businesses/consumption-taxes/gst-and-qst/)
- Quebec vergi sistemi kademeli (cascading) vergi sistemidir
- TVQ, TPS eklenmiş fiyat üzerinden hesaplanır

---

**Son Güncelleme:** 2026-01-12
**Proje:** Epicê Buhara - Baharat Satış
**Vergi Sistemi:** Quebec (Canada)
