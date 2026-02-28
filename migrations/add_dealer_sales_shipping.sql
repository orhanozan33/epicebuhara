-- Gönderim durumu: faturada "gönderildi / gönderilmedi" ve gönderim sonrası "Gönderildi" butonu için
ALTER TABLE dealer_sales ADD COLUMN IF NOT EXISTS is_shipped boolean DEFAULT false;
ALTER TABLE dealer_sales ADD COLUMN IF NOT EXISTS shipped_at timestamp;
