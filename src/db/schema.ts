import { pgTable, serial, varchar, text, integer, decimal, boolean, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'),
  image: varchar('image', { length: 500 }),
  order: integer('order').default(0),
  isActive: boolean('isActive').default(true),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
});

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  baseName: varchar('baseName', { length: 255 }),
  slug: varchar('slug', { length: 255 }),
  sku: varchar('sku', { length: 100 }),
  description: text('description'),
  shortDescription: text('shortDescription'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull().default('0'),
  comparePrice: decimal('comparePrice', { precision: 10, scale: 2 }),
  costPrice: decimal('costPrice', { precision: 10, scale: 2 }),
  stock: integer('stock').default(0),
  trackStock: boolean('trackStock').default(true),
  unit: varchar('unit', { length: 50 }),
  weight: decimal('weight', { precision: 10, scale: 2 }),
  productGroup: varchar('productGroup', { length: 255 }), // Grup adı (aynı ürünün farklı gramajları için)
  images: text('images'),
  isActive: boolean('isActive').default(true),
  isFeatured: boolean('isFeatured').default(false),
  categoryId: integer('categoryId').references(() => categories.id),
  metaTitle: varchar('metaTitle', { length: 255 }),
  metaDescription: text('metaDescription'),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
});

export const admins = pgTable('admins', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  fullName: varchar('fullName', { length: 255 }),
  role: varchar('role', { length: 50 }).default('ADMIN'),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
});

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phone: varchar('phone', { length: 20 }),
  password: varchar('password', { length: 255 }),
  role: varchar('role', { length: 50 }).default('USER'),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
});

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  orderNumber: varchar('orderNumber', { length: 100 }).notNull().unique(),
  userId: integer('userId').references(() => users.id),
  status: varchar('status', { length: 50 }).default('PENDING'),
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
  tax: decimal('tax', { precision: 10, scale: 2 }).default('0'),
  shipping: decimal('shipping', { precision: 10, scale: 2 }).default('0'),
  discount: decimal('discount', { precision: 10, scale: 2 }).default('0'),
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).default('CAD'),
  shippingName: varchar('shippingName', { length: 255 }),
  shippingPhone: varchar('shippingPhone', { length: 20 }),
  shippingEmail: varchar('shippingEmail', { length: 255 }),
  shippingAddress: text('shippingAddress'),
  shippingProvince: varchar('shippingProvince', { length: 100 }),
  shippingCity: varchar('shippingCity', { length: 100 }),
  shippingPostalCode: varchar('shippingPostalCode', { length: 20 }),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
});

export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('orderId').references(() => orders.id),
  productId: integer('productId').references(() => products.id),
  quantity: integer('quantity').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
});

export const cart = pgTable('cart', {
  id: serial('id').primaryKey(),
  sessionId: varchar('sessionId', { length: 255 }),
  productId: integer('productId').references(() => products.id),
  quantity: integer('quantity').notNull().default(1),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
});

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  type: varchar('type', { length: 50 }).notNull(), // 'siparis' veya 'mesaj'
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  orderId: integer('orderId').references(() => orders.id),
  isRead: boolean('isRead').default(false),
  createdAt: timestamp('createdAt').defaultNow(),
});

export const dealers = pgTable('dealers', {
  id: serial('id').primaryKey(),
  companyName: varchar('companyName', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  address: text('address'),
  taxNumber: varchar('taxNumber', { length: 100 }), // Kanada vergi numarası (eski - geriye uyumluluk için)
  tpsNumber: varchar('tpsNumber', { length: 100 }), // TPS (Taxe sur les Produits et Services) numarası
  tvqNumber: varchar('tvqNumber', { length: 100 }), // TVQ (Taxe de Vente du Québec) numarası
  discount: decimal('discount', { precision: 5, scale: 2 }).default('0'), // İskonto yüzdesi
  isActive: boolean('isActive').default(true),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
});

export const dealerSales = pgTable('dealerSales', {
  id: serial('id').primaryKey(),
  dealerId: integer('dealerId').references(() => dealers.id).notNull(),
  saleNumber: varchar('saleNumber', { length: 100 }).notNull().unique(),
  paymentMethod: varchar('paymentMethod', { length: 50 }).notNull(), // 'NAKIT', 'KREDI_KARTI', 'CEK', 'ODENMEDI'
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
  discount: decimal('discount', { precision: 10, scale: 2 }).default('0'),
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
  isPaid: boolean('isPaid').default(false), // Ödenmedi seçilirse false
  paidAmount: decimal('paidAmount', { precision: 10, scale: 2 }).default('0'), // Ödenen tutar (kısmi ödeme için)
  paidAt: timestamp('paidAt'), // Borç tahsil edildiğinde doldurulacak
  isSaved: boolean('isSaved').default(false), // Fatura kaydedildi mi?
  notes: text('notes'),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
});

export const dealerSaleItems = pgTable('dealerSaleItems', {
  id: serial('id').primaryKey(),
  saleId: integer('saleId').references(() => dealerSales.id).notNull(),
  productId: integer('productId').references(() => products.id).notNull(),
  quantity: integer('quantity').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
});

export const companySettings = pgTable('companySettings', {
  id: serial('id').primaryKey(),
  companyName: varchar('companyName', { length: 255 }),
  address: text('address'),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  postalCode: varchar('postalCode', { length: 20 }),
  tpsNumber: varchar('tpsNumber', { length: 100 }),
  tvqNumber: varchar('tvqNumber', { length: 100 }),
  instagramUrl: varchar('instagramUrl', { length: 500 }),
  facebookUrl: varchar('facebookUrl', { length: 500 }),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
});

// Relations
export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  orderItems: many(orderItems),
}));

export const ordersRelations = relations(orders, ({ many }) => ({
  orderItems: many(orderItems),
  notifications: many(notifications),
}));

export const dealersRelations = relations(dealers, ({ many }) => ({
  sales: many(dealerSales),
}));

export const dealerSalesRelations = relations(dealerSales, ({ one, many }) => ({
  dealer: one(dealers, {
    fields: [dealerSales.dealerId],
    references: [dealers.id],
  }),
  items: many(dealerSaleItems),
}));

export const dealerSaleItemsRelations = relations(dealerSaleItems, ({ one }) => ({
  sale: one(dealerSales, {
    fields: [dealerSaleItems.saleId],
    references: [dealerSales.id],
  }),
  product: one(products, {
    fields: [dealerSaleItems.productId],
    references: [products.id],
  }),
}));
