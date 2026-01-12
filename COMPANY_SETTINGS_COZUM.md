# 🔧 Company Settings Tablosu Sorunu - Çözüm

## 🔍 Sorun

Hata mesajı:
```
column "tax_number" does not exist
```

Bu, `company_settings` tablosunda kolon adlarının schema ile uyuşmadığını gösteriyor.

## ✅ Çözüm

### ADIM 1: Supabase'de Kontrol Edin

1. **Supabase Dashboard** > **SQL Editor**
2. `check_company_settings.sql` dosyasını açın
3. İlk SELECT sorgusunu çalıştırın (tablo adını görmek için)

**Beklenen:**
- Tablo adı: `company_settings` ✅
- VEYA: `companySettings` ❌ (değiştirilmeli)

### ADIM 2: Migration Çalıştırın

**SEÇENEK A: SQL Editor'dan (Önerilen)**

1. **Supabase Dashboard** > **SQL Editor**
2. `check_company_settings.sql` dosyasını açın
3. Tüm script'i çalıştırın
4. Sonuçları kontrol edin

**SEÇENEK B: Terminal'den**

```bash
npm run migrate
```

### ADIM 3: Server'ı Yeniden Başlatın

```bash
# Server'ı durdurun (Ctrl+C)
npm run dev
```

### ADIM 4: Test Edin

1. Browser'da: `http://localhost:3000`
2. F12 → Network tab
3. `/api/settings/company` isteğini kontrol edin
4. **200 OK** görüyorsanız → ✅ Başarılı!

---

## 📝 Olası Sorunlar

### Sorun 1: Tablo adı `companySettings` (camelCase)

**Çözüm:**
- SQL script'i otomatik olarak `company_settings`'e çevirir
- Veya manuel: `ALTER TABLE "companySettings" RENAME TO "company_settings";`

### Sorun 2: Kolonlar camelCase

**Çözüm:**
- SQL script'i otomatik olarak snake_case'e çevirir
- Örnek: `taxNumber` → `tax_number`

### Sorun 3: Kolon hiç yok

**Çözüm:**
- Tablo yapısını kontrol edin
- Eksik kolonları ekleyin (Drizzle migration ile)

---

## ✅ Başarı Kontrolü

Migration sonrası:

- [ ] Tablo adı: `company_settings` (snake_case)
- [ ] Tüm kolonlar snake_case
- [ ] `/api/settings/company` API çalışıyor
- [ ] Hata yok

---

## 🎯 Hızlı Çözüm

**En hızlı yol:**

1. **Supabase Dashboard** > **SQL Editor**
2. `check_company_settings.sql` dosyasını açın
3. Tüm script'i çalıştırın
4. Server'ı yeniden başlatın
5. Test edin

**Tüm işlem 2 dakika!** ⚡
