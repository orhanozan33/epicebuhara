# Supabase Bağlantı Sorunu Çözümü

## Sorun
Supabase veritabanında tüm bağlantı slotları dolu. Hata: "remaining connection slots are reserved for roles with the SUPERUSER attribute"

## Çözüm

1. **Tüm Node.js process'lerini durdurun:**
   ```powershell
   # Tüm node process'lerini bul
   Get-Process node -ErrorAction SilentlyContinue
   
   # Tüm node process'lerini durdur (DİKKAT: Tüm Node.js uygulamaları kapanır)
   Stop-Process -Name node -Force
   ```

2. **Supabase Dashboard'dan bağlantıları kontrol edin:**
   - Supabase Dashboard > Database > Connection Pooling
   - Aktif bağlantıları kontrol edin
   - Gerekirse Supabase'i yeniden başlatın

3. **Sunucuyu yeniden başlatın:**
   ```powershell
   cd baharat
   npm run dev
   ```

4. **Eğer sorun devam ederse:**
   - Supabase Dashboard > Settings > Database > Connection String
   - Transaction Pooler (port 6543) kullanın
   - `.env` dosyasını güncelleyin
