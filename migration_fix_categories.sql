-- Categories tablosu için migration fix
-- Eğer categories tablosunda hala camelCase kolonlar varsa bunları snake_case'e çevirir

BEGIN;

-- Categories table - Sadece var olan kolonları değiştir
DO $$ 
BEGIN
    -- isActive -> is_active
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'isActive') THEN
        ALTER TABLE categories RENAME COLUMN "isActive" TO "is_active";
        RAISE NOTICE 'categories.isActive -> is_active değiştirildi';
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'is_active') THEN
        RAISE NOTICE 'categories.is_active zaten mevcut';
    END IF;
    
    -- createdAt -> created_at
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'createdAt') THEN
        ALTER TABLE categories RENAME COLUMN "createdAt" TO "created_at";
        RAISE NOTICE 'categories.createdAt -> created_at değiştirildi';
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'created_at') THEN
        RAISE NOTICE 'categories.created_at zaten mevcut';
    END IF;
    
    -- updatedAt -> updated_at
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'updatedAt') THEN
        ALTER TABLE categories RENAME COLUMN "updatedAt" TO "updated_at";
        RAISE NOTICE 'categories.updatedAt -> updated_at değiştirildi';
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'updated_at') THEN
        RAISE NOTICE 'categories.updated_at zaten mevcut';
    END IF;
    
    -- order -> sort_order
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'order') THEN
        ALTER TABLE categories RENAME COLUMN "order" TO "sort_order";
        RAISE NOTICE 'categories.order -> sort_order değiştirildi';
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'sort_order') THEN
        RAISE NOTICE 'categories.sort_order zaten mevcut';
    END IF;
END $$;

COMMIT;

-- Sonuç kontrolü
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'categories' 
    AND column_name IN ('is_active', 'created_at', 'updated_at', 'sort_order')
ORDER BY column_name;
