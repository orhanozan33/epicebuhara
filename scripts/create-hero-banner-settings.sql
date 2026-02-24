-- Ana sayfa hero banner ayarları tablosu
-- Supabase SQL Editor veya migrate API ile çalıştırılabilir

CREATE TABLE IF NOT EXISTS hero_banner_settings (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255),
  subtitle TEXT,
  button_text VARCHAR(255),
  button_link VARCHAR(500),
  discount_label1 VARCHAR(255),
  discount_percent INTEGER,
  discount_label2 VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- İlk kayıt (opsiyonel - boş bırakırsanız varsayılan i18n kullanılır)
-- INSERT INTO hero_banner_settings (title, subtitle, button_text, button_link, discount_label1, discount_percent, discount_label2)
-- VALUES ('En İyi Fiyat Garantisi', 'Binlerce ürün çeşidi ile size en uygun fiyatları sunuyoruz', 'Hemen Alışverişe Başla', '/', 'Özel İndirimler', 50, 'İndirimler')
-- ON CONFLICT DO NOTHING;
