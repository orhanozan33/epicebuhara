-- company_settings tablosunu detaylı kontrol et
-- Supabase Dashboard > SQL Editor'dan çalıştırın

-- 1. Tablo var mı kontrol et
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'company_settings'
) AS table_exists;

-- 2. Tüm kolonları listele
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'company_settings'
ORDER BY ordinal_position;

-- 3. Veri var mı kontrol et
SELECT COUNT(*) AS row_count FROM company_settings;

-- 4. Eğer veri varsa, örnek veri göster
SELECT * FROM company_settings LIMIT 1;

-- 5. Eksik kolonları tespit et (schema'da olması gerekenler)
SELECT 
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'id') THEN 'id - EKSİK!'
        ELSE 'id - VAR'
    END,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'company_name') THEN 'company_name - EKSİK!'
        ELSE 'company_name - VAR'
    END,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'instagram_url') THEN 'instagram_url - EKSİK!'
        ELSE 'instagram_url - VAR'
    END,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'facebook_url') THEN 'facebook_url - EKSİK!'
        ELSE 'facebook_url - VAR'
    END,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'created_at') THEN 'created_at - EKSİK!'
        ELSE 'created_at - VAR'
    END,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'updated_at') THEN 'updated_at - EKSİK!'
        ELSE 'updated_at - VAR'
    END;
