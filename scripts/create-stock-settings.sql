-- Stok ayarları tablosu (düşük stok eşiği)
-- Supabase SQL Editor veya migrate API ile çalıştırılabilir

CREATE TABLE IF NOT EXISTS stock_settings (
  id SERIAL PRIMARY KEY,
  low_stock_threshold_boxes INTEGER DEFAULT 10,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- İlk kayıt (opsiyonel - varsayılan 10 kutu)
-- INSERT INTO stock_settings (low_stock_threshold_boxes) VALUES (10) ON CONFLICT DO NOTHING;
