-- Supabase Storage Bucket ve Policies Kurulum Script'i
-- Bu script'i Supabase Dashboard > SQL Editor'dan çalıştırın

-- 1. Bucket oluştur (eğer yoksa)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true, -- Public bucket (herkese açık)
  5242880, -- 5MB file size limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage Policies: Public Read (Herkes okuyabilir)
CREATE POLICY "Public read access for product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- 3. Storage Policies: Authenticated Upload (Sadece authenticated kullanıcılar yükleyebilir)
-- NOT: Service Role Key kullandığımız için bu policy'ye ihtiyaç yok
-- Ama authenticated kullanıcılar için de izin verelim

CREATE POLICY "Authenticated upload access for product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Authenticated update access for product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated delete access for product images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');

-- 4. Service Role için tam yetki (API route'larımız için)
-- NOT: Service Role Key zaten tüm yetkilere sahip, bu yüzden policy gerekmez
-- Ama açık olması için:

CREATE POLICY "Service role full access for product images"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');

-- 5. Mevcut policies'leri kontrol et
SELECT * FROM storage.buckets WHERE id = 'product-images';
SELECT * FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE '%product-images%';
