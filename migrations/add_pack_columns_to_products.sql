-- Paket/kutu bilgisi: pack_size (1 = adet bazlı), pack_label_* (örn. Kutu, Paket)
ALTER TABLE products ADD COLUMN IF NOT EXISTS pack_size integer DEFAULT 1;
ALTER TABLE products ADD COLUMN IF NOT EXISTS pack_label_tr varchar(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS pack_label_en varchar(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS pack_label_fr varchar(50);
