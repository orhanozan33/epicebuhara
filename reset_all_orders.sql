-- Tüm sipariş kayıtlarını sıfırlama scripti
-- Dikkat: Bu script tüm sipariş ve sipariş öğelerini, ilgili bildirimleri siler

BEGIN;

-- 1. Önce sipariş öğelerini sil (foreign key constraint nedeniyle)
DELETE FROM order_items;

-- 2. Siparişlere ait bildirimleri sil
DELETE FROM notifications WHERE order_id IS NOT NULL;

-- 3. Son olarak siparişleri sil
DELETE FROM orders;

-- 4. Sequence'leri sıfırla (ID'lerin 1'den başlaması için)
ALTER SEQUENCE orders_id_seq RESTART WITH 1;
ALTER SEQUENCE order_items_id_seq RESTART WITH 1;

COMMIT;

-- Silinen kayıt sayısını kontrol et
SELECT 
    (SELECT COUNT(*) FROM orders) as orders_count,
    (SELECT COUNT(*) FROM order_items) as order_items_count,
    (SELECT COUNT(*) FROM notifications WHERE order_id IS NOT NULL) as order_notifications_count;
