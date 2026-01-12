# Vercel-Supabase Bağlantı Sorunu - Hızlı Çözüm

## 🚨 EN YAYGIN 3 SORUN VE ÇÖZÜMÜ

### ❌ SORUN 1: POSTGRES_URL Environment Variable Eksik veya Yanlış

**Kontrol:**
1. Vercel Dashboard > Projeniz > Settings > Environment Variables
2. `POSTGRES_URL` veya `DATABASE_URL` var mı?

**Çözüm:**
1. Supabase Dashboard > Settings > Database > Connection String
2. **Transaction Pooler** seçin (port 6543)
3. Connection string'i kopyalayın
4. Sonuna `?sslmode=require&pgbouncer=true` ekleyin
5. Vercel Dashboard > Settings > Environment Variables
6. **Add New**
7. Name: `POSTGRES_URL`
8. Value: Connection string'i yapıştırın
9. Environment: ✅ Production, ✅ Preview, ✅ Development
10. **Save**
11. **MUTLAKA REDEPLOY YAPIN!** (Deployments > ... > Redeploy)

**Doğru Format:**
```
postgresql://postgres.kxnatjmutvogwoayiajw:Orhanozan33@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
```

### ❌ SORUN 2: Migration'lar Uygulanmamış (Kolon Adları Yanlış)

**Kontrol:**
1. Supabase Dashboard > Database > Tables
2. Bir tabloya tıklayın (örn: `categories`)
3. Kolon adları `is_active`, `created_at` gibi snake_case mi?
4. Yoksa `isActive`, `createdAt` gibi camelCase mi?

**Eğer camelCase ise:**
Migration uygulanmamış demektir!

**Çözüm:**
1. Supabase Dashboard > SQL Editor
2. `migration_snake_case.sql` dosyasını açın
3. İçeriğini kopyalayıp SQL Editor'a yapıştırın
4. **RUN** butonuna tıklayın
5. Tüm kolon adları snake_case'e çevrilmeli

### ❌ SORUN 3: Redeploy Yapılmamış

**ÖNEMLİ:** Environment variable ekledikten veya değiştirdikten sonra **MUTLAKA REDEPLOY** yapmalısınız!

**Çözüm:**
1. Vercel Dashboard > Deployments
2. En son deployment'a tıklayın
3. Sağ üstteki **"..."** menüsüne tıklayın
4. **"Redeploy"** seçin
5. Deployment tamamlanana kadar bekleyin

## 🔍 HATA MESAJLARINA GÖRE ÇÖZÜM

### "DATABASE_URL or POSTGRES_URL is required"
→ POSTGRES_URL environment variable eksik. Yukarıdaki Sorun 1'e bakın.

### "Failed query: select ... from \"table\""
→ Migration uygulanmamış. Yukarıdaki Sorun 2'ye bakın.

### "SSL connection is required"
→ Connection string'e `?sslmode=require` ekleyin.

### "relation \"table\" does not exist"
→ Tablolar oluşturulmamış. `npm run db:push` çalıştırın (local'den).

### "MaxClientsInSessionMode"
→ Port 6543 (Transaction Pooler) kullanın, 5432 değil.

## ✅ KONTROL LİSTESİ

- [ ] Vercel'de `POSTGRES_URL` environment variable var
- [ ] Connection string doğru format (port 6543, SSL, pooler)
- [ ] Environment variable'lar Production, Preview, Development için seçili
- [ ] **Redeploy yapıldı** (Environment variable ekledikten sonra)
- [ ] Supabase'de migration'lar uygulandı (kolon adları snake_case)
- [ ] Vercel deployment başarılı
- [ ] API route'ları test edildi ve çalışıyor

## 🧪 TEST

Production URL'nizde test edin:
```
https://your-domain.vercel.app/api/categories
https://your-domain.vercel.app/api/products
```

**Beklenen:** JSON response (kategoriler/ürünler listesi)
**Hata:** `{"error":"...","details":"..."}`

## 🆘 HALA ÇALIŞMIYORSA

1. **Vercel Runtime Logs'u kontrol edin:**
   - Vercel Dashboard > Deployments > En son deployment > Runtime Logs
   - Hata mesajını kopyalayın

2. **Supabase Dashboard'u kontrol edin:**
   - Database > Tables - Tablolar var mı?
   - Database > Connection String - Transaction Pooler URL'i doğru mu?

3. **Bu bilgileri paylaşın:**
   - Vercel Runtime Logs'daki hata mesajı
   - POSTGRES_URL'in ilk 50 karakteri (şifreyi gizleyerek)
   - Supabase'de tablolar var mı? (screenshot)
