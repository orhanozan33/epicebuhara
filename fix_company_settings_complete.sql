-- company_settings tablosunu tamamen düzelt
-- Supabase Dashboard > SQL Editor'dan çalıştırın
-- Bu script tablo yoksa oluşturur, kolonlar yanlışsa düzeltir

BEGIN;

-- 1. Tablo adını kontrol et ve düzelt
DO $$ 
BEGIN
    -- Eğer companySettings (camelCase) varsa, company_settings'e çevir
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companySettings') THEN
        ALTER TABLE "companySettings" RENAME TO "company_settings";
        RAISE NOTICE '✅ Tablo companySettings -> company_settings olarak değiştirildi';
    END IF;
    
    -- Tablo yoksa oluştur
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'company_settings') THEN
        CREATE TABLE company_settings (
            id SERIAL PRIMARY KEY,
            company_name VARCHAR(255),
            address TEXT,
            phone VARCHAR(20),
            email VARCHAR(255),
            postal_code VARCHAR(20),
            tax_number VARCHAR(100),
            tps_number VARCHAR(100),
            tvq_number VARCHAR(100),
            instagram_url VARCHAR(500),
            facebook_url VARCHAR(500),
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
        RAISE NOTICE '✅ company_settings tablosu oluşturuldu';
    END IF;
END $$;

-- 2. Kolonları kontrol et ve düzelt
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
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'tax_number') THEN
        ALTER TABLE company_settings ADD COLUMN tax_number VARCHAR(100);
        RAISE NOTICE '✅ tax_number kolonu eklendi';
    END IF;
    
    -- tpsNumber -> tps_number
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'tpsNumber') THEN
        ALTER TABLE company_settings RENAME COLUMN "tpsNumber" TO "tps_number";
        RAISE NOTICE '✅ tpsNumber -> tps_number';
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'tps_number') THEN
        ALTER TABLE company_settings ADD COLUMN tps_number VARCHAR(100);
        RAISE NOTICE '✅ tps_number kolonu eklendi';
    END IF;
    
    -- tvqNumber -> tvq_number
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'tvqNumber') THEN
        ALTER TABLE company_settings RENAME COLUMN "tvqNumber" TO "tvq_number";
        RAISE NOTICE '✅ tvqNumber -> tvq_number';
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'tvq_number') THEN
        ALTER TABLE company_settings ADD COLUMN tvq_number VARCHAR(100);
        RAISE NOTICE '✅ tvq_number kolonu eklendi';
    END IF;
    
    -- instagramUrl -> instagram_url
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'instagramUrl') THEN
        ALTER TABLE company_settings RENAME COLUMN "instagramUrl" TO "instagram_url";
        RAISE NOTICE '✅ instagramUrl -> instagram_url';
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'instagram_url') THEN
        ALTER TABLE company_settings ADD COLUMN instagram_url VARCHAR(500);
        RAISE NOTICE '✅ instagram_url kolonu eklendi';
    END IF;
    
    -- facebookUrl -> facebook_url
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'facebookUrl') THEN
        ALTER TABLE company_settings RENAME COLUMN "facebookUrl" TO "facebook_url";
        RAISE NOTICE '✅ facebookUrl -> facebook_url';
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'facebook_url') THEN
        ALTER TABLE company_settings ADD COLUMN facebook_url VARCHAR(500);
        RAISE NOTICE '✅ facebook_url kolonu eklendi';
    END IF;
    
    -- createdAt -> created_at
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'createdAt') THEN
        ALTER TABLE company_settings RENAME COLUMN "createdAt" TO "created_at";
        RAISE NOTICE '✅ createdAt -> created_at';
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'created_at') THEN
        ALTER TABLE company_settings ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
        RAISE NOTICE '✅ created_at kolonu eklendi';
    END IF;
    
    -- updatedAt -> updated_at
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'updatedAt') THEN
        ALTER TABLE company_settings RENAME COLUMN "updatedAt" TO "updated_at";
        RAISE NOTICE '✅ updatedAt -> updated_at';
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'updated_at') THEN
        ALTER TABLE company_settings ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
        RAISE NOTICE '✅ updated_at kolonu eklendi';
    END IF;
END $$;

COMMIT;

-- Son kontrol - Tüm kolonları listele
SELECT 
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'company_settings'
ORDER BY ordinal_position;
