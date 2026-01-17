-- Add name_fr and name_en columns to categories table
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS name_fr VARCHAR(255),
ADD COLUMN IF NOT EXISTS name_en VARCHAR(255);

-- Add name_fr and name_en columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS name_fr VARCHAR(255),
ADD COLUMN IF NOT EXISTS name_en VARCHAR(255);
