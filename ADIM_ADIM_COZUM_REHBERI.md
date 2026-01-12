# 🚀 Cart Hatası Çözüm Rehberi - Adım Adım

## 📋 Mevcut Durum

✅ **Yapılanlar:**
- Database connection ayarları düzeltildi (`prepare: false` eklendi)
- Cookie ayarları güncellendi
- Server yeniden başlatıldı

## 🎯 ŞİMDİ YAPMANIZ GEREKENLER

---

## ADIM 1: Local'de Test Edin

### 1.1 Server'ın Çalıştığını Kontrol Edin

1. Terminal'de şunu çalıştırın:
   ```bash
   npm run dev
   ```

2. Browser'da açın: **http://localhost:3000**

3. Console'u açın (F12 → Console sekmesi)

### 1.2 Cart API'yi Test Edin

1. Browser'da sayfayı yenileyin (Ctrl+F5)
2. Network tab'ını açın (F12 → Network)
3. `/api/cart` isteğini kontrol edin
4. **200 OK** görüyorsanız → ✅ Local'de çalışıyor!
5. **500 Error** görüyorsanız → ADIM 2'ye geçin

---

## ADIM 2: Hata Devam Ediyorsa - Veritabanı Kontrolü

### 2.1 Supabase'de Kolon Adlarını Kontrol Edin

1. **Supabase Dashboard** > **SQL Editor**'a gidin
2. Şu sorguyu çalıştırın:
   ```sql
   SELECT column_name, data_type
   FROM information_schema.columns 
   WHERE table_name = 'cart'
   ORDER BY ordinal_position;
   ```

3. **Beklenen sonuç (snake_case):**
   - `session_id` ✅
   - `product_id` ✅
   - `created_at` ✅
   - `updated_at` ✅

4. **Eğer camelCase görüyorsanız:**
   - `sessionId` ❌
   - `productId` ❌
   - `createdAt` ❌
   - `updatedAt` ❌

### 2.2 Kolonları Snake_Case'e Çevirin (Gerekirse)

Eğer kolonlar camelCase ise:

1. **Supabase Dashboard** > **SQL Editor**
2. `check_cart_columns.sql` dosyasını açın
3. `DO $$ ... END $$;` bloğunu çalıştırın
4. Sonuç kontrolü için tekrar SELECT sorgusunu çalıştırın

---

## ADIM 3: Vercel'de Ayarları Güncelleyin

### 3.1 Environment Variables Kontrolü

1. **Vercel Dashboard** > Projeniz > **Settings** > **Environment Variables**
2. Şu değişkenlerin olduğundan emin olun:
   - ✅ `POSTGRES_URL` veya `DATABASE_URL`
   - ✅ Transaction Pooler connection string (port 6543)

### 3.2 Connection String Formatı

**Doğru format:**
```
postgresql://postgres.kxnatjmutvogwoayiajw:orhanozan33@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
```

**Kontrol edin:**
- ✅ Port: `6543` (Transaction Pooler)
- ✅ Domain: `pooler.supabase.com`
- ✅ `pgbouncer=true` parametresi var
- ✅ `sslmode=require` parametresi var

### 3.3 Redeploy Yapın

1. **Vercel Dashboard** > **Deployments**
2. En son deployment'a tıklayın
3. **"..."** menüsüne tıklayın
4. **"Redeploy"** seçin
5. Deployment tamamlanana kadar bekleyin

---

## ADIM 4: Production'da Test Edin

### 4.1 Online Site'ı Test Edin

1. Production URL'inizi açın (örn: `https://www.epicebuhara.com`)
2. Browser Console'u açın (F12)
3. Network tab'ını açın
4. Sayfayı yenileyin (Ctrl+F5)
5. `/api/cart` isteğini kontrol edin

### 4.2 Sonuç Kontrolü

**✅ Başarılı:**
- Status: `200 OK`
- Response: `{ items: [...] }` veya `{ items: [] }`
- Console'da hata yok

**❌ Hata devam ediyorsa:**
- Status: `500 Internal Server Error`
- Response'da hata mesajı var
- ADIM 5'e geçin

---

## ADIM 5: Hata Devam Ediyorsa - Detaylı Kontrol

### 5.1 Vercel Runtime Logs Kontrolü

1. **Vercel Dashboard** > **Deployments**
2. En son deployment'a tıklayın
3. **"Runtime Logs"** sekmesine gidin
4. Hata mesajlarını kontrol edin

### 5.2 Yaygın Hatalar ve Çözümleri

#### Hata: "DATABASE_URL or POSTGRES_URL is required"
**Çözüm:**
- Vercel'de `POSTGRES_URL` environment variable'ı ekleyin
- Redeploy yapın

#### Hata: "prepared statement does not exist"
**Çözüm:**
- ✅ Zaten düzeltildi (`prepare: false` eklendi)
- Redeploy yapın

#### Hata: "column does not exist"
**Çözüm:**
- Supabase'de kolon adlarını kontrol edin
- Migration script'lerini çalıştırın

#### Hata: "SSL connection is required"
**Çözüm:**
- Connection string'e `?sslmode=require` ekleyin

---

## ADIM 6: Tüm Tabloları Kontrol Edin (Opsiyonel)

Eğer sadece cart değil, diğer API'ler de hata veriyorsa:

1. **Supabase Dashboard** > **SQL Editor**
2. `fix_all_tables.sql` dosyasını açın
3. Tüm script'i çalıştırın
4. `COMMIT;` ile değişiklikleri kaydedin

**Bu script şu tabloları düzeltir:**
- ✅ `categories`
- ✅ `products`
- ✅ `cart`
- ✅ `dealers`
- ✅ `company_settings`
- ✅ Diğer tablolar

---

## ✅ Başarı Kontrol Listesi

Tüm adımları tamamladıktan sonra:

- [ ] Local'de cart API çalışıyor (200 OK)
- [ ] Vercel'de environment variables doğru
- [ ] Vercel'de redeploy yapıldı
- [ ] Production'da cart API çalışıyor (200 OK)
- [ ] Console'da hata yok
- [ ] Sepete ürün eklenebiliyor
- [ ] Sepetten ürün silinebiliyor

---

## 🆘 Hala Sorun Varsa

1. **Browser Console** hata mesajlarını kopyalayın
2. **Network tab** → `/api/cart` → Response sekmesindeki hata mesajını kopyalayın
3. **Vercel Runtime Logs** hata mesajlarını kopyalayın
4. Bu bilgileri paylaşın, birlikte çözelim!

---

## 📝 Hızlı Referans

### Local Test
```bash
# Server başlat
npm run dev

# Browser'da test et
http://localhost:3000
```

### Vercel Connection String
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
```

### Supabase SQL Editor
- Dashboard > SQL Editor
- Script'leri çalıştır
- Sonuçları kontrol et

---

## 🎯 Öncelik Sırası

1. **ÖNCE:** Local'de test edin (ADIM 1)
2. **SONRA:** Vercel'de redeploy yapın (ADIM 3)
3. **SON OLARAK:** Production'da test edin (ADIM 4)

Her adımı tamamladıktan sonra bir sonrakine geçin!
