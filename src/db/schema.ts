import { pgTable, serial, varchar, text, integer, boolean, timestamp, numeric, unique } from 'drizzle-orm/pg-core';

export const categories = pgTable('categories', {
  id: serial('id').primaryKey().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull(),
  description: text('description'),
  image: varchar('image', { length: 500 }),
  order: integer('order').default(0),
  isActive: boolean('isActive').default(true),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
}, (table) => ({
  slugUnique: unique('categories_slug_unique').on(table.slug),
}));

// Placeholder exports for other tables - will be completed later
export const products = pgTable('products', {
  id: serial('id').primaryKey().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  baseName: varchar('baseName', { length: 255 }),
  slug: varchar('slug', { length: 255 }),
  sku: varchar('sku', { length: 100 }),
  description: text('description'),
  shortDescription: text('shortDescription'),
  price: numeric('price', { precision: 10, scale: 2 }).default('0').notNull(),
  comparePrice: numeric('comparePrice', { precision: 10, scale: 2 }),
  costPrice: numeric('costPrice', { precision: 10, scale: 2 }),
  stock: integer('stock').default(0),
  trackStock: boolean('trackStock').default(true),
  unit: varchar('unit', { length: 50 }),
  weight: numeric('weight', { precision: 10, scale: 2 }),
  productGroup: varchar('productGroup', { length: 255 }),
  images: text('images'),
  isActive: boolean('isActive').default(true),
  isFeatured: boolean('isFeatured').default(false),
  categoryId: integer('categoryId'),
  metaTitle: varchar('metaTitle', { length: 255 }),
  metaDescription: text('metaDescription'),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
});

export const dealers = pgTable('dealers', {
  id: serial('id').primaryKey().notNull(),
  companyName: varchar('companyName', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  address: text('address'),
  taxNumber: varchar('taxNumber', { length: 100 }),
  tpsNumber: varchar('tpsNumber', { length: 100 }),
  tvqNumber: varchar('tvqNumber', { length: 100 }),
  discount: numeric('discount', { precision: 5, scale: 2 }).default('0'),
  isActive: boolean('isActive').default(true),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
});

export const dealerSales = pgTable('dealerSales', {
  id: serial('id').primaryKey().notNull(),
  dealerId: integer('dealerId').notNull(),
  saleNumber: varchar('saleNumber', { length: 100 }).notNull(),
  paymentMethod: varchar('paymentMethod', { length: 50 }).notNull(),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
  discount: numeric('discount', { precision: 10, scale: 2 }).default('0'),
  total: numeric('total', { precision: 10, scale: 2 }).notNull(),
  isPaid: boolean('isPaid').default(false),
  paidAmount: numeric('paidAmount', { precision: 10, scale: 2 }).default('0'),
  paidAt: timestamp('paidAt'),
  notes: text('notes'),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
}, (table) => ({
  saleNumberUnique: unique('dealerSales_saleNumber_unique').on(table.saleNumber),
}));
