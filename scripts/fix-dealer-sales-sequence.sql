-- dealer_sales tablosunun sequence'ini düzelt
SELECT setval('dealer_sales_id_seq', (SELECT COALESCE(MAX(id), 1) FROM dealer_sales));
