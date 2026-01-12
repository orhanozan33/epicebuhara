-- Tüm tablolardaki kolonları snake_case'e çevir (GÜVENLİ VERSİYON)
-- Supabase Dashboard > SQL Editor'dan çalıştırın
-- Bu script tüm tablolardaki camelCase kolonları snake_case'e çevirir

BEGIN;

-- Categories table
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'isActive') THEN
        ALTER TABLE categories RENAME COLUMN "isActive" TO "is_active";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'createdAt') THEN
        ALTER TABLE categories RENAME COLUMN "createdAt" TO "created_at";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'updatedAt') THEN
        ALTER TABLE categories RENAME COLUMN "updatedAt" TO "updated_at";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'order') THEN
        ALTER TABLE categories RENAME COLUMN "order" TO "sort_order";
    END IF;
END $$;

-- Cart table (KRİTİK - Hata burada!)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cart' AND column_name = 'sessionId') THEN
        ALTER TABLE cart RENAME COLUMN "sessionId" TO "session_id";
        RAISE NOTICE 'cart.sessionId -> session_id değiştirildi';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cart' AND column_name = 'productId') THEN
        ALTER TABLE cart RENAME COLUMN "productId" TO "product_id";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cart' AND column_name = 'createdAt') THEN
        ALTER TABLE cart RENAME COLUMN "createdAt" TO "created_at";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cart' AND column_name = 'updatedAt') THEN
        ALTER TABLE cart RENAME COLUMN "updatedAt" TO "updated_at";
    END IF;
END $$;

-- Products table
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'baseName') THEN
        ALTER TABLE products RENAME COLUMN "baseName" TO "base_name";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'shortDescription') THEN
        ALTER TABLE products RENAME COLUMN "shortDescription" TO "short_description";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'comparePrice') THEN
        ALTER TABLE products RENAME COLUMN "comparePrice" TO "compare_price";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'costPrice') THEN
        ALTER TABLE products RENAME COLUMN "costPrice" TO "cost_price";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'trackStock') THEN
        ALTER TABLE products RENAME COLUMN "trackStock" TO "track_stock";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'productGroup') THEN
        ALTER TABLE products RENAME COLUMN "productGroup" TO "product_group";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'isActive') THEN
        ALTER TABLE products RENAME COLUMN "isActive" TO "is_active";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'isFeatured') THEN
        ALTER TABLE products RENAME COLUMN "isFeatured" TO "is_featured";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'categoryId') THEN
        ALTER TABLE products RENAME COLUMN "categoryId" TO "category_id";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'metaTitle') THEN
        ALTER TABLE products RENAME COLUMN "metaTitle" TO "meta_title";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'metaDescription') THEN
        ALTER TABLE products RENAME COLUMN "metaDescription" TO "meta_description";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'createdAt') THEN
        ALTER TABLE products RENAME COLUMN "createdAt" TO "created_at";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'updatedAt') THEN
        ALTER TABLE products RENAME COLUMN "updatedAt" TO "updated_at";
    END IF;
END $$;

-- Dealers table
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dealers' AND column_name = 'companyName') THEN
        ALTER TABLE dealers RENAME COLUMN "companyName" TO "company_name";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dealers' AND column_name = 'taxNumber') THEN
        ALTER TABLE dealers RENAME COLUMN "taxNumber" TO "tax_number";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dealers' AND column_name = 'tpsNumber') THEN
        ALTER TABLE dealers RENAME COLUMN "tpsNumber" TO "tps_number";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dealers' AND column_name = 'tvqNumber') THEN
        ALTER TABLE dealers RENAME COLUMN "tvqNumber" TO "tvq_number";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dealers' AND column_name = 'isActive') THEN
        ALTER TABLE dealers RENAME COLUMN "isActive" TO "is_active";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dealers' AND column_name = 'createdAt') THEN
        ALTER TABLE dealers RENAME COLUMN "createdAt" TO "created_at";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dealers' AND column_name = 'updatedAt') THEN
        ALTER TABLE dealers RENAME COLUMN "updatedAt" TO "updated_at";
    END IF;
END $$;

-- Diğer tablolar (dealer_sales, dealer_sale_items, company_settings, admins, notifications, orders, order_items)
-- migration_snake_case_safe.sql dosyasındaki diğer tabloları da ekleyebilirsiniz

COMMIT;

-- Sonuç kontrolü - Cart tablosu
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'cart'
ORDER BY ordinal_position;
