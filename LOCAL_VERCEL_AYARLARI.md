# 🔧 Local ve Vercel Bağlantı Ayarları

## 📋 Mevcut Durum

### Local Development (Şu An)
- **Connection Type:** Transaction Pooler (port 6543)
- **Domain:** `pooler.supabase.com`
- **Kullanım:** Serverless ortamlar için optimize edilmiş

### Vercel Production (Sonra)
- **Connection Type:** Transaction Pooler (port 6543) ✅
- **Domain:** `pooler.supabase.com`
- **Kullanım:** Serverless için ideal

---

## 🎯 ÖNERİLEN: Local'de Direct Connection Kullan

### Neden?

1. **Local'de kalıcı connection'lar var**
   - VM/Container gibi uzun süreli bağlantılar
   - Direct Connection daha uygun

2. **Daha hızlı**
   - Pooler overhead'i yok
   - Daha düşük latency

3. **Daha kolay debug**
   - Connection sorunlarını tespit etmek daha kolay
   - Log'lar daha anlaşılır

4. **Prepared statements kullanılabilir**
   - `prepare: true` ile daha iyi performans
   - Tekrarlayan query'ler için optimize

---

## 🔄 Local .env Ayarları

### Direct Connection (Port 5432) - ÖNERİLEN

```env
DATABASE_URL=postgresql://postgres:orhanozan33@db.kxnatjmutvogwoayiajw.supabase.co:5432/postgres?sslmode=require
POSTGRES_URL=postgresql://postgres:orhanozan33@db.kxnatjmutvogwoayiajw.supabase.co:5432/postgres?sslmode=require
```

**Özellikler:**
- ✅ Port: `5432` (Direct Connection)
- ✅ Domain: `db.kxnatjmutvogwoayiajw.supabase.co`
- ✅ `pgbouncer=true` YOK (Direct Connection için gerekmez)
- ✅ `sslmode=require` (SSL zorunlu)

---

## 🚀 Vercel Ayarları (Sonra Yapılacak)

### Transaction Pooler (Port 6543) - Production İçin

```env
DATABASE_URL=postgresql://postgres.kxnatjmutvogwoayiajw:orhanozan33@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
POSTGRES_URL=postgresql://postgres.kxnatjmutvogwoayiajw:orhanozan33@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
```

**Özellikler:**
- ✅ Port: `6543` (Transaction Pooler)
- ✅ Domain: `pooler.supabase.com`
- ✅ `pgbouncer=true` (Zorunlu)
- ✅ `sslmode=require` (SSL zorunlu)

---

## 📝 Yapılacaklar

### ADIM 1: Local .env'i Güncelle (ŞİMDİ)

1. `.env` dosyasını açın
2. `DATABASE_URL` ve `POSTGRES_URL` değerlerini Direct Connection'a çevirin
3. Server'ı yeniden başlatın

### ADIM 2: Local'de Test Et

1. `npm run dev`
2. Browser'da test et
3. Tüm API'ler çalışıyor mu kontrol et

### ADIM 3: Vercel'e Geçiş (SONRA)

1. Vercel Dashboard > Environment Variables
2. Transaction Pooler connection string'i ekle
3. Redeploy yap

---

## ⚙️ Kod Ayarları

### src/db/index.ts

Kod otomatik olarak connection type'ı algılıyor:

```typescript
const isPooler = connectionString.includes('pooler.supabase.com') || connectionString.includes(':6543');

client = postgres(connectionString, {
  prepare: !isPooler,  // Pooler ise false, Direct ise true
  // ...
});
```

**Sonuç:**
- Local (Direct): `prepare: true` ✅
- Vercel (Pooler): `prepare: false` ✅

Her iki durumda da otomatik çalışır!

---

## ✅ Kontrol Listesi

### Local (Şimdi)
- [ ] `.env` dosyası Direct Connection (port 5432)
- [ ] Server çalışıyor
- [ ] API'ler test edildi
- [ ] Hata yok

### Vercel (Sonra)
- [ ] Environment variables eklendi
- [ ] Transaction Pooler connection string
- [ ] Redeploy yapıldı
- [ ] Production'da test edildi

---

## 🎯 Özet

**ŞİMDİ:**
- Local'de Direct Connection kullan (port 5432)
- Daha hızlı ve kolay debug
- Prepared statements aktif

**SONRA:**
- Vercel'de Transaction Pooler kullan (port 6543)
- Serverless için optimize
- Prepared statements kapalı (otomatik)

Her iki durumda da kod aynı, sadece connection string farklı! 🎉
