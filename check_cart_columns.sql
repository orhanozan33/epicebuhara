-- Cart tablosundaki kolon adlarını kontrol et
-- Supabase Dashboard > SQL Editor'dan çalıştırın

SELECT 
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'cart'
ORDER BY ordinal_position;

-- Eğer kolonlar camelCase ise (sessionId, productId), şunu çalıştırın:
-- (Aşağıdaki script'i sadece camelCase kolonlar varsa kullanın)

-- Cart table - camelCase'den snake_case'e çevir
DO $$ 
BEGIN
    -- sessionId -> session_id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cart' AND column_name = 'sessionId') THEN
        ALTER TABLE cart RENAME COLUMN "sessionId" TO "session_id";
        RAISE NOTICE 'cart.sessionId -> session_id değiştirildi';
    END IF;
    
    -- productId -> product_id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cart' AND column_name = 'productId') THEN
        ALTER TABLE cart RENAME COLUMN "productId" TO "product_id";
        RAISE NOTICE 'cart.productId -> product_id değiştirildi';
    END IF;
    
    -- createdAt -> created_at
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cart' AND column_name = 'createdAt') THEN
        ALTER TABLE cart RENAME COLUMN "createdAt" TO "created_at";
        RAISE NOTICE 'cart.createdAt -> created_at değiştirildi';
    END IF;
    
    -- updatedAt -> updated_at
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cart' AND column_name = 'updatedAt') THEN
        ALTER TABLE cart RENAME COLUMN "updatedAt" TO "updated_at";
        RAISE NOTICE 'cart.updatedAt -> updated_at değiştirildi';
    END IF;
END $$;

-- Tekrar kontrol et
SELECT 
    column_name, 
    data_type
FROM information_schema.columns 
WHERE table_name = 'cart'
ORDER BY ordinal_position;
