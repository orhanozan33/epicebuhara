# Cart Tablosu Kolon Adı Sorunu - Çözüm

## 🔍 Sorun

Cart API'de 500 hatası alıyorsunuz. Hata mesajı:
```
Failed query: select "id", "session_id", "product_id", "quantity", "created_at", "updated_at" from "cart"
```

Bu, veritabanındaki kolon adlarının schema ile uyuşmadığını gösteriyor.

## ✅ Çözüm

### ADIM 1: Kolon Adlarını Kontrol Edin

1. **Supabase Dashboard** > **SQL Editor**'a gidin
2. `check_cart_columns.sql` dosyasını açın
3. İlk SELECT sorgusunu çalıştırın (kolon adlarını görmek için)

**Beklenen sonuç (snake_case):**
- `session_id`
- `product_id`
- `created_at`
- `updated_at`

**Eğer camelCase görüyorsanız:**
- `sessionId`
- `productId`
- `createdAt`
- `updatedAt`

### ADIM 2: Kolonları Snake_Case'e Çevirin

Eğer kolonlar camelCase ise:

1. `check_cart_columns.sql` dosyasındaki `DO $$ ... END $$;` bloğunu çalıştırın
2. Bu script kolonları otomatik olarak snake_case'e çevirecek

### ADIM 3: Diğer Tabloları da Kontrol Edin

Cart dışında diğer tablolarda da aynı sorun olabilir:
- `categories`
- `products`
- `orders`
- `company_settings`

Tüm tablolar için `fix_all_tables.sql` dosyasını kullanabilirsiniz.

## 📝 Hızlı Çözüm (Tüm Tablolar İçin)

Eğer tüm tablolarda sorun varsa:

1. **Supabase Dashboard** > **SQL Editor**
2. `fix_all_tables.sql` dosyasını açın
3. Tüm script'i çalıştırın
4. `COMMIT;` ile değişiklikleri kaydedin

## ⚠️ Önemli Notlar

- Bu işlem veritabanı yapısını değiştirir
- Production'da dikkatli olun
- Önce backup alın (Supabase otomatik backup yapıyor ama yine de dikkatli olun)
- Migration'ları test ortamında önce deneyin

## 🔄 Sonrasında

Migration'ları çalıştırdıktan sonra:
1. Server'ı yeniden başlatın
2. Cart API'yi test edin
3. Diğer API'leri de kontrol edin
