-- Otomatik Migration Script (GÜVENLİ VERSİYON)
-- Supabase Dashboard > SQL Editor'dan çalıştırın
-- Bu script sadece gerekli değişiklikleri yapar (idempotent)

BEGIN;

-- Cart table
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cart' AND column_name = 'sessionId') THEN
        ALTER TABLE cart RENAME COLUMN "sessionId" TO "session_id";
        RAISE NOTICE '✅ cart.sessionId -> session_id';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cart' AND column_name = 'productId') THEN
        ALTER TABLE cart RENAME COLUMN "productId" TO "product_id";
        RAISE NOTICE '✅ cart.productId -> product_id';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cart' AND column_name = 'createdAt') THEN
        ALTER TABLE cart RENAME COLUMN "createdAt" TO "created_at";
        RAISE NOTICE '✅ cart.createdAt -> created_at';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cart' AND column_name = 'updatedAt') THEN
        ALTER TABLE cart RENAME COLUMN "updatedAt" TO "updated_at";
        RAISE NOTICE '✅ cart.updatedAt -> updated_at';
    END IF;
END $$;

-- Categories table
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'isActive') THEN
        ALTER TABLE categories RENAME COLUMN "isActive" TO "is_active";
        RAISE NOTICE '✅ categories.isActive -> is_active';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'createdAt') THEN
        ALTER TABLE categories RENAME COLUMN "createdAt" TO "created_at";
        RAISE NOTICE '✅ categories.createdAt -> created_at';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'updatedAt') THEN
        ALTER TABLE categories RENAME COLUMN "updatedAt" TO "updated_at";
        RAISE NOTICE '✅ categories.updatedAt -> updated_at';
    END IF;
END $$;

-- Products table
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'baseName') THEN
        ALTER TABLE products RENAME COLUMN "baseName" TO "base_name";
        RAISE NOTICE '✅ products.baseName -> base_name';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'categoryId') THEN
        ALTER TABLE products RENAME COLUMN "categoryId" TO "category_id";
        RAISE NOTICE '✅ products.categoryId -> category_id';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'isActive') THEN
        ALTER TABLE products RENAME COLUMN "isActive" TO "is_active";
        RAISE NOTICE '✅ products.isActive -> is_active';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'createdAt') THEN
        ALTER TABLE products RENAME COLUMN "createdAt" TO "created_at";
        RAISE NOTICE '✅ products.createdAt -> created_at';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'updatedAt') THEN
        ALTER TABLE products RENAME COLUMN "updatedAt" TO "updated_at";
        RAISE NOTICE '✅ products.updatedAt -> updated_at';
    END IF;
END $$;

COMMIT;

-- Sonuç kontrolü
SELECT 
    table_name,
    column_name,
    CASE 
        WHEN column_name LIKE '%\_%' 
             OR column_name IN ('id', 'name', 'slug', 'description', 'image', 'price', 'stock', 'quantity', 'unit', 'weight', 'images', 'sku', 'text', 'notes', 'type', 'title', 'message', 'address', 'phone', 'email', 'currency', 'status')
        THEN '✅ snake_case'
        ELSE '❌ camelCase (migration gerekli)'
    END as status
FROM information_schema.columns
WHERE table_name IN ('cart', 'categories', 'products')
ORDER BY table_name, ordinal_position;
