-- company_settings tablosunu kontrol et
-- Supabase Dashboard > SQL Editor'dan çalıştırın

-- 1. Tablo adını kontrol et
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND (table_name = 'company_settings' OR table_name = 'companySettings')
ORDER BY table_name;

-- 2. Kolon adlarını kontrol et (company_settings)
SELECT 
    column_name, 
    data_type,
    CASE 
        WHEN column_name LIKE '%\_%' OR column_name IN ('id', 'name', 'address', 'phone', 'email') THEN '✅ snake_case'
        ELSE '❌ camelCase'
    END as status
FROM information_schema.columns
WHERE table_name = 'company_settings'
ORDER BY ordinal_position;

-- 3. Eğer companySettings tablosu varsa, kolonlarını da kontrol et
SELECT 
    column_name, 
    data_type,
    CASE 
        WHEN column_name LIKE '%\_%' OR column_name IN ('id', 'name', 'address', 'phone', 'email') THEN '✅ snake_case'
        ELSE '❌ camelCase'
    END as status
FROM information_schema.columns
WHERE table_name = 'companySettings'
ORDER BY ordinal_position;

-- 4. Tablo adını düzelt (eğer companySettings ise)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companySettings') THEN
        ALTER TABLE "companySettings" RENAME TO "company_settings";
        RAISE NOTICE '✅ Tablo companySettings -> company_settings olarak değiştirildi';
    ELSE
        RAISE NOTICE '✅ Tablo company_settings zaten mevcut';
    END IF;
END $$;

-- 5. Kolonları düzelt (eğer camelCase ise)
DO $$ 
BEGIN
    -- companyName -> company_name
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'companyName') THEN
        ALTER TABLE company_settings RENAME COLUMN "companyName" TO "company_name";
        RAISE NOTICE '✅ companyName -> company_name';
    END IF;
    
    -- postalCode -> postal_code
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'postalCode') THEN
        ALTER TABLE company_settings RENAME COLUMN "postalCode" TO "postal_code";
        RAISE NOTICE '✅ postalCode -> postal_code';
    END IF;
    
    -- taxNumber -> tax_number
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'taxNumber') THEN
        ALTER TABLE company_settings RENAME COLUMN "taxNumber" TO "tax_number";
        RAISE NOTICE '✅ taxNumber -> tax_number';
    END IF;
    
    -- tpsNumber -> tps_number
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'tpsNumber') THEN
        ALTER TABLE company_settings RENAME COLUMN "tpsNumber" TO "tps_number";
        RAISE NOTICE '✅ tpsNumber -> tps_number';
    END IF;
    
    -- tvqNumber -> tvq_number
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'tvqNumber') THEN
        ALTER TABLE company_settings RENAME COLUMN "tvqNumber" TO "tvq_number";
        RAISE NOTICE '✅ tvqNumber -> tvq_number';
    END IF;
    
    -- instagramUrl -> instagram_url
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'instagramUrl') THEN
        ALTER TABLE company_settings RENAME COLUMN "instagramUrl" TO "instagram_url";
        RAISE NOTICE '✅ instagramUrl -> instagram_url';
    END IF;
    
    -- facebookUrl -> facebook_url
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'facebookUrl') THEN
        ALTER TABLE company_settings RENAME COLUMN "facebookUrl" TO "facebook_url";
        RAISE NOTICE '✅ facebookUrl -> facebook_url';
    END IF;
    
    -- createdAt -> created_at
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'createdAt') THEN
        ALTER TABLE company_settings RENAME COLUMN "createdAt" TO "created_at";
        RAISE NOTICE '✅ createdAt -> created_at';
    END IF;
    
    -- updatedAt -> updated_at
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'updatedAt') THEN
        ALTER TABLE company_settings RENAME COLUMN "updatedAt" TO "updated_at";
        RAISE NOTICE '✅ updatedAt -> updated_at';
    END IF;
END $$;

-- 6. Son kontrol
SELECT 
    column_name, 
    data_type
FROM information_schema.columns
WHERE table_name = 'company_settings'
ORDER BY ordinal_position;
