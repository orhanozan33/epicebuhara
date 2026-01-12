# Prepared Statements ve Transaction Pooler Açıklaması

## 🔍 Prepared Statements Nedir?

### Normal Query (prepare: false)
```sql
-- Her seferinde tam query gönderilir
SELECT * FROM cart WHERE session_id = 'session_123';
SELECT * FROM cart WHERE session_id = 'session_456';
SELECT * FROM cart WHERE session_id = 'session_789';
```

**Nasıl çalışır:**
1. Client → Server: Tam SQL query gönderilir
2. Server: Query'yi parse eder, planlar, çalıştırır
3. Server → Client: Sonuç döner

**Avantajları:**
- ✅ Her query bağımsızdır
- ✅ Connection değişse bile çalışır
- ✅ Transaction Pooler ile uyumludur

**Dezavantajları:**
- ❌ Her query için parse/plan maliyeti var
- ❌ Biraz daha yavaş (küçük fark)

---

### Prepared Statement (prepare: true - Varsayılan)
```sql
-- İlk sefer: Query hazırlanır
PREPARE get_cart AS SELECT * FROM cart WHERE session_id = $1;

-- Sonraki seferler: Sadece parametre gönderilir
EXECUTE get_cart('session_123');
EXECUTE get_cart('session_456');
EXECUTE get_cart('session_789');
```

**Nasıl çalışır:**
1. **İlk query:** Client → Server: `PREPARE get_cart AS SELECT * FROM cart WHERE session_id = $1`
   - Server: Query'yi parse eder, planlar, **hafızada saklar**
2. **Sonraki query'ler:** Client → Server: `EXECUTE get_cart('session_123')`
   - Server: Hazır planı kullanır, sadece parametre değişir
3. Server → Client: Sonuç döner

**Avantajları:**
- ✅ Parse/plan maliyeti sadece bir kez
- ✅ Tekrarlayan query'ler için daha hızlı
- ✅ SQL injection koruması

**Dezavantajları:**
- ❌ Prepared statement **connection-specific** (bağlantıya özel)
- ❌ Connection değişirse prepared statement kaybolur
- ❌ Transaction Pooler ile **UYUMLU DEĞİL**

---

## 🚨 Transaction Pooler (pgbouncer) Sorunu

### Transaction Pooler Nasıl Çalışır?

```
Client Request 1 → Pooler → Connection 1 → Database
Client Request 2 → Pooler → Connection 2 → Database  (FARKLI CONNECTION!)
Client Request 3 → Pooler → Connection 1 → Database  (İLK CONNECTION GERİ DÖNDÜ)
```

**Önemli:** Her request farklı bir connection kullanabilir!

### Prepared Statement Sorunu

```javascript
// Request 1: Connection 1 kullanıldı
PREPARE get_cart AS SELECT * FROM cart WHERE session_id = $1;  // Connection 1'de hazırlandı

// Request 2: Connection 2 kullanıldı (FARKLI!)
EXECUTE get_cart('session_123');  // ❌ HATA! Bu prepared statement Connection 2'de yok!
```

**Sonuç:**
- ❌ `ERROR: prepared statement "get_cart" does not exist`
- ❌ Query başarısız olur
- ❌ 500 Internal Server Error

---

## ✅ Çözüm: prepare: false

### Transaction Pooler ile Doğru Kullanım

```javascript
// postgres client ayarları
const client = postgres(connectionString, {
  prepare: false,  // ← Prepared statements KAPALI
  // ...
});
```

**Nasıl çalışır:**
```sql
-- Request 1: Connection 1
SELECT * FROM cart WHERE session_id = 'session_123';  // Tam query, çalışır ✅

-- Request 2: Connection 2 (FARKLI!)
SELECT * FROM cart WHERE session_id = 'session_456';  // Tam query, çalışır ✅

-- Request 3: Connection 1 (GERİ DÖNDÜ)
SELECT * FROM cart WHERE session_id = 'session_789';  // Tam query, çalışır ✅
```

**Sonuç:**
- ✅ Her query bağımsız
- ✅ Connection değişse bile çalışır
- ✅ Transaction Pooler ile uyumlu

---

## 📊 Performans Karşılaştırması

### prepare: true (Normal Connection)
- **İlk query:** ~10ms (parse + plan + execute)
- **Sonraki query'ler:** ~2ms (sadece execute)
- **Toplam (100 query):** ~290ms

### prepare: false (Transaction Pooler)
- **Her query:** ~5ms (parse + plan + execute)
- **Toplam (100 query):** ~500ms

**Fark:** ~200ms (100 query için) - **Çok küçük fark!**

**Önemli:** Transaction Pooler'ın avantajları (connection pooling, ölçeklenebilirlik) bu küçük performans kaybından çok daha değerli!

---

## 🎯 Ne Zaman Hangi Ayarı Kullanmalı?

### prepare: false (Transaction Pooler)
✅ **Kullan:**
- Vercel, Netlify gibi serverless ortamlar
- Transaction Pooler (port 6543)
- Connection pooling kullanıyorsanız
- Her request farklı connection kullanabilir

### prepare: true (Direct Connection)
✅ **Kullan:**
- Kalıcı connection'lar (VM, container)
- Direct Connection (port 5432)
- Aynı connection'ı tekrar kullanıyorsanız
- Yüksek performans gerekiyorsa (ve connection pooling yoksa)

---

## 🔧 Kod Örneği

### Şu Anki Kodumuz (Doğru)

```typescript
const isPooler = connectionString.includes('pooler.supabase.com') || connectionString.includes(':6543');

client = postgres(connectionString, {
  prepare: !isPooler,  // ← Pooler ise false, değilse true
  // ...
});
```

**Mantık:**
- Transaction Pooler kullanıyorsak → `prepare: false`
- Direct Connection kullanıyorsak → `prepare: true` (varsayılan)

---

## 📝 Özet

1. **Prepared Statements:** Query'yi bir kez hazırla, sonra parametreleri değiştir
2. **Transaction Pooler:** Her request farklı connection kullanabilir
3. **Sorun:** Prepared statement connection-specific, pooler'da kaybolur
4. **Çözüm:** Transaction Pooler kullanırken `prepare: false` yap
5. **Performans:** Küçük bir fark var ama önemli değil
6. **Sonuç:** Transaction Pooler ile çalışır, hata yok! ✅
