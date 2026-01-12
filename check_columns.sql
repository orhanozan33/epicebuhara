-- Supabase'deki mevcut kolon adlarını kontrol et
-- Bu script'i çalıştırarak hangi kolonların camelCase, hangilerinin snake_case olduğunu görebilirsiniz

-- Categories table
SELECT 
    'categories' as table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'categories' 
    AND column_name IN ('isActive', 'is_active', 'createdAt', 'created_at', 'updatedAt', 'updated_at', 'order', 'sort_order')
ORDER BY column_name;

-- Products table
SELECT 
    'products' as table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'products' 
    AND column_name IN ('isActive', 'is_active', 'categoryId', 'category_id', 'createdAt', 'created_at', 'updatedAt', 'updated_at')
ORDER BY column_name;

-- Cart table
SELECT 
    'cart' as table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'cart' 
    AND column_name IN ('sessionId', 'session_id', 'productId', 'product_id', 'createdAt', 'created_at', 'updatedAt', 'updated_at')
ORDER BY column_name;

-- Dealers table
SELECT 
    'dealers' as table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'dealers' 
    AND column_name IN ('companyName', 'company_name', 'taxNumber', 'tax_number', 'isActive', 'is_active', 'createdAt', 'created_at', 'updatedAt', 'updated_at')
ORDER BY column_name;
