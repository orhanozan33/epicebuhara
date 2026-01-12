# 🚀 Otomatik Migration Rehberi - Adım Adım

## 📋 Sistem Durumu

✅ **Hazırlanan Sistem:**
- Otomatik migration API endpoint'i (`/api/migrate`)
- Migration script'i (`scripts/run-migration.ts`)
- Güvenli migration (sadece gerekli değişiklikleri yapar)

## 🎯 YAPMANIZ GEREKENLER

---

## ADIM 1: İlk Kontrol (5 dakika)

### 1.1 Veritabanı Durumunu Kontrol Edin

**SEÇENEK A: API ile Kontrol (Önerilen)**

1. Browser'da açın: `http://localhost:3000/api/migrate`
2. GET request yapın (sayfayı açın)
3. Response'da tablo durumlarını görün

**SEÇENEK B: Terminal ile Kontrol**

```bash
npm run migrate
```

Bu komut migration'ları çalıştırmaz, sadece durumu gösterir.

### 1.2 Sonuçları Kontrol Edin

Response'da her tablo için kolon adlarını göreceksiniz:
- ✅ `isSnakeCase: true` → Zaten doğru, migration gerekmez
- ❌ `isSnakeCase: false` → Migration gerekli

---

## ADIM 2: Migration Çalıştırma (3 Seçenek)

### SEÇENEK 1: Terminal'den (Önerilen - En Güvenli)

**Local'de:**
```bash
npm run migrate
```

**Ne yapar:**
- Veritabanına bağlanır
- Her kolonu kontrol eder
- Sadece camelCase olanları snake_case'e çevirir
- Sonuçları terminal'de gösterir

**Avantajları:**
- ✅ Güvenli (her adımı görebilirsiniz)
- ✅ Hata durumunda durur
- ✅ Detaylı log gösterir

---

### SEÇENEK 2: API Endpoint ile (Frontend'den)

**Browser Console'da:**
```javascript
fetch('/api/migrate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ secret: 'dev-migration-secret' })
})
.then(r => r.json())
.then(console.log);
```

**Veya bir sayfa oluşturun:**
- Admin panel'den migration butonu
- İlk yüklemede otomatik kontrol

**Avantajları:**
- ✅ Frontend'den çalıştırılabilir
- ✅ Kullanıcı dostu arayüz yapılabilir

---

### SEÇENEK 3: Supabase SQL Editor'dan (Manuel)

1. **Supabase Dashboard** > **SQL Editor**
2. `migration_snake_case_safe.sql` dosyasını açın
3. Script'i çalıştırın
4. Sonuçları kontrol edin

**Avantajları:**
- ✅ Supabase arayüzünden yapılır
- ✅ Sonuçları görsel olarak görebilirsiniz

---

## ADIM 3: Sonuçları Kontrol Edin

### 3.1 Migration Sonrası Kontrol

**API ile:**
```
GET http://localhost:3000/api/migrate
```

**Terminal ile:**
```bash
npm run migrate
```

### 3.2 Beklenen Sonuç

**Başarılı migration:**
```
✅ cart.sessionId -> session_id
✅ cart.productId -> product_id
⏭️  cart.createdAt -> created_at (zaten snake_case)
```

**Hata durumu:**
```
❌ cart.sessionId -> session_id: ERROR: column does not exist
```

---

## ADIM 4: Uygulamayı Test Edin

### 4.1 Local'de Test

1. Server'ı yeniden başlatın:
   ```bash
   npm run dev
   ```

2. Browser'da test edin:
   - `http://localhost:3000`
   - Cart API çalışıyor mu?
   - Products API çalışıyor mu?
   - Categories API çalışıyor mu?

### 4.2 Production'da Test

1. **Vercel Dashboard** > **Deployments** > **Redeploy**
2. Production site'ı test edin
3. Console'da hata var mı kontrol edin

---

## 🔒 Güvenlik Notları

### Development (Local)
- Migration API'si `dev-migration-secret` ile korunuyor
- `.env` dosyasında `MIGRATION_SECRET` değişkeni ekleyebilirsiniz

### Production (Vercel)
- **ÖNEMLİ:** Production'da migration API'si varsayılan olarak kapalı
- Açmak için Vercel'de `MIGRATION_SECRET` environment variable ekleyin
- Sadece güvenli bir secret kullanın!

**Önerilen:**
```bash
# Güçlü bir secret oluşturun
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 📝 Migration Detayları

### Hangi Tablolar Düzeltilir?

1. **cart**
   - `sessionId` → `session_id`
   - `productId` → `product_id`
   - `createdAt` → `created_at`
   - `updatedAt` → `updated_at`

2. **categories**
   - `isActive` → `is_active`
   - `createdAt` → `created_at`
   - `updatedAt` → `updated_at`

3. **products**
   - `baseName` → `base_name`
   - `categoryId` → `category_id`
   - `isActive` → `is_active`
   - `createdAt` → `created_at`
   - `updatedAt` → `updated_at`

### Güvenlik Özellikleri

✅ **Sadece gerekli değişiklikleri yapar:**
- Kolon zaten snake_case ise dokunmaz
- Sadece camelCase kolonları değiştirir

✅ **Hata durumunda güvenli:**
- Bir migration başarısız olursa diğerlerine devam eder
- Her migration ayrı ayrı loglanır

✅ **Idempotent (tekrar çalıştırılabilir):**
- Aynı migration'ı birden fazla çalıştırabilirsiniz
- Zaten yapılmış değişiklikleri tekrar yapmaz

---

## 🆘 Sorun Giderme

### Hata: "Database connection string not found"
**Çözüm:**
- `.env` dosyasında `DATABASE_URL` veya `POSTGRES_URL` olduğundan emin olun

### Hata: "column does not exist"
**Çözüm:**
- Kolon zaten değiştirilmiş olabilir
- Veritabanı durumunu kontrol edin: `GET /api/migrate`

### Hata: "SSL connection is required"
**Çözüm:**
- Connection string'de `sslmode=require` olduğundan emin olun

### Migration çalıştı ama hala hata var
**Çözüm:**
1. Server'ı yeniden başlatın
2. Browser cache'ini temizleyin (Ctrl+F5)
3. Vercel'de redeploy yapın

---

## ✅ Başarı Kontrol Listesi

Migration sonrası kontrol edin:

- [ ] Migration başarıyla tamamlandı
- [ ] Tüm tablolar snake_case kolonlara sahip
- [ ] Local'de API'ler çalışıyor
- [ ] Production'da API'ler çalışıyor
- [ ] Console'da hata yok
- [ ] Cart, Products, Categories API'leri 200 OK dönüyor

---

## 🎯 Hızlı Başlangıç

**En hızlı yol:**

```bash
# 1. Migration çalıştır
npm run migrate

# 2. Server yeniden başlat
npm run dev

# 3. Test et
# Browser'da http://localhost:3000 aç
# F12 → Network → /api/cart kontrol et
```

**Tüm işlem 2 dakika!** ⚡

---

## 📞 Yardım

Sorun yaşıyorsanız:
1. Migration sonuçlarını kontrol edin
2. Browser console hatalarını kontrol edin
3. Vercel runtime logs'u kontrol edin
4. Bu bilgileri paylaşın, birlikte çözelim!
