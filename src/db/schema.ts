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
  isSaved: boolean('isSaved').default(false),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
}, (table) => ({
  saleNumberUnique: unique('dealerSales_saleNumber_unique').on(table.saleNumber),
}));

export const dealerSaleItems = pgTable('dealerSaleItems', {
  id: serial('id').primaryKey().notNull(),
  saleId: integer('saleId').notNull(),
  productId: integer('productId').notNull(),
  quantity: integer('quantity').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  total: numeric('total', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
});

export const cart = pgTable('cart', {
  id: serial('id').primaryKey().notNull(),
  sessionId: varchar('sessionId', { length: 255 }),
  productId: integer('productId'),
  quantity: integer('quantity').default(1).notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
});

export const companySettings = pgTable('companySettings', {
  id: serial('id').primaryKey().notNull(),
  companyName: varchar('companyName', { length: 255 }),
  address: text('address'),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  postalCode: varchar('postalCode', { length: 20 }),
  taxNumber: varchar('taxNumber', { length: 100 }),
  tpsNumber: varchar('tpsNumber', { length: 100 }),
  tvqNumber: varchar('tvqNumber', { length: 100 }),
  instagramUrl: varchar('instagramUrl', { length: 500 }),
  facebookUrl: varchar('facebookUrl', { length: 500 }),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
});

export const admins = pgTable('admins', {
  id: serial('id').primaryKey().notNull(),
  username: varchar('username', { length: 255 }).notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  fullName: varchar('fullName', { length: 255 }),
  role: varchar('role', { length: 50 }).default('ADMIN'),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
}, (table) => ({
  usernameUnique: unique('admins_username_unique').on(table.username),
}));

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey().notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  orderId: integer('orderId'),
  isRead: boolean('isRead').default(false),
  createdAt: timestamp('createdAt').defaultNow(),
});

export const orders = pgTable('orders', {
  id: serial('id').primaryKey().notNull(),
  orderNumber: varchar('orderNumber', { length: 100 }).notNull(),
  userId: integer('userId'),
  status: varchar('status', { length: 50 }).default('PENDING'),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
  tax: numeric('tax', { precision: 10, scale: 2 }).default('0'),
  shipping: numeric('shipping', { precision: 10, scale: 2 }).default('0'),
  discount: numeric('discount', { precision: 10, scale: 2 }).default('0'),
  total: numeric('total', { precision: 10, scale: 2 }).notNull(),
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
}, (table) => ({
  orderNumberUnique: unique('orders_orderNumber_unique').on(table.orderNumber),
}));

export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey().notNull(),
  orderId: integer('orderId'),
  productId: integer('productId'),
  quantity: integer('quantity').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  total: numeric('total', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
});
