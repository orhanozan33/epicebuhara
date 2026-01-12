# ⚡ Company Settings Hızlı Çözüm

## 🚨 Sorun

```
column "tax_number" does not exist
```

## ✅ Hızlı Çözüm (2 Dakika)

### ADIM 1: Supabase'de Script Çalıştırın

1. **Supabase Dashboard** > **SQL Editor**
2. `fix_company_settings_complete.sql` dosyasını açın
3. **Tüm script'i seçin ve çalıştırın** (RUN butonuna tıklayın)
4. Sonuçları kontrol edin

**Bu script:**
- ✅ Tablo yoksa oluşturur
- ✅ Tablo adını düzeltir (`companySettings` → `company_settings`)
- ✅ Kolon adlarını düzeltir (camelCase → snake_case)
- ✅ Eksik kolonları ekler

### ADIM 2: Server'ı Yeniden Başlatın

```bash
npm run dev
```

### ADIM 3: Test Edin

Browser'da:
- `http://localhost:3000`
- F12 → Network tab
- `/api/settings/company` isteğini kontrol edin
- **200 OK** → ✅ Başarılı!

---

## 📝 Script Ne Yapar?

1. **Tablo kontrolü:**
   - `companySettings` varsa → `company_settings`'e çevirir
   - Tablo yoksa → Yeni tablo oluşturur

2. **Kolon kontrolü:**
   - `taxNumber` varsa → `tax_number`'a çevirir
   - `tax_number` yoksa → Yeni kolon ekler
   - Aynı işlemi tüm kolonlar için yapar

3. **Güvenli:**
   - Sadece gerekli değişiklikleri yapar
   - Mevcut verileri korur
   - Hata durumunda rollback yapar

---

## ✅ Başarı Kontrolü

Script çalıştıktan sonra son SELECT sorgusu şunu göstermeli:

```
id              | integer
company_name    | character varying
address         | text
phone           | character varying
email           | character varying
postal_code     | character varying
tax_number      | character varying  ← Bu kolon olmalı!
tps_number      | character varying
tvq_number      | character varying
instagram_url   | character varying
facebook_url    | character varying
created_at      | timestamp
updated_at      | timestamp
```

---

## 🆘 Hala Sorun Varsa

1. **Supabase Dashboard** > **Database** > **Tables**
2. `company_settings` tablosuna tıklayın
3. Kolonları kontrol edin
4. Eksik kolonları manuel ekleyin

Veya bana Supabase'deki tablo yapısını gönderin, birlikte çözelim!
