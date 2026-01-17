import { pgTable, serial, varchar, text, integer, boolean, timestamp, numeric, unique } from 'drizzle-orm/pg-core';

export const categories = pgTable('categories', {
  id: serial('id').primaryKey().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  // nameFr: varchar('name_fr', { length: 255 }), // Migration çalıştırıldıktan sonra aktif edilecek
  // nameEn: varchar('name_en', { length: 255 }), // Migration çalıştırıldıktan sonra aktif edilecek
  slug: varchar('slug', { length: 255 }).notNull(),
  description: text('description'),
  image: varchar('image', { length: 500 }),
  sortOrder: integer('sort_order').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  slugUnique: unique('categories_slug_unique').on(table.slug),
}));

export const products = pgTable('products', {
  id: serial('id').primaryKey().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  // nameFr: varchar('name_fr', { length: 255 }), // Migration çalıştırıldıktan sonra aktif edilecek
  // nameEn: varchar('name_en', { length: 255 }), // Migration çalıştırıldıktan sonra aktif edilecek
  baseName: varchar('base_name', { length: 255 }),
  slug: varchar('slug', { length: 255 }),
  sku: varchar('sku', { length: 100 }),
  description: text('description'),
  shortDescription: varchar('short_description', { length: 500 }),
  price: numeric('price', { precision: 10, scale: 2 }).default('0').notNull(),
  comparePrice: numeric('compare_price', { precision: 10, scale: 2 }),
  costPrice: numeric('cost_price', { precision: 10, scale: 2 }),
  stock: integer('stock').default(0),
  trackStock: boolean('track_stock').default(true),
  unit: varchar('unit', { length: 50 }),
  weight: numeric('weight', { precision: 10, scale: 2 }),
  productGroup: varchar('product_group', { length: 255 }),
  images: text('images'),
  isActive: boolean('is_active').default(true),
  isFeatured: boolean('is_featured').default(false),
  categoryId: integer('category_id'),
  metaTitle: varchar('meta_title', { length: 255 }),
  metaDescription: text('meta_description'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const dealers = pgTable('dealers', {
  id: serial('id').primaryKey().notNull(),
  companyName: varchar('company_name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  address: text('address'),
  taxNumber: varchar('tax_number', { length: 100 }),
  tpsNumber: varchar('tps_number', { length: 100 }),
  tvqNumber: varchar('tvq_number', { length: 100 }),
  discount: numeric('discount', { precision: 5, scale: 2 }).default('0'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const dealerSales = pgTable('dealer_sales', {
  id: serial('id').primaryKey().notNull(),
  dealerId: integer('dealer_id').notNull(),
  saleNumber: varchar('sale_number', { length: 100 }).notNull(),
  paymentMethod: varchar('payment_method', { length: 50 }).notNull(),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
  discount: numeric('discount', { precision: 10, scale: 2 }).default('0'),
  total: numeric('total', { precision: 10, scale: 2 }).notNull(),
  isPaid: boolean('is_paid').default(false),
  paidAmount: numeric('paid_amount', { precision: 10, scale: 2 }).default('0'),
  paidAt: timestamp('paid_at'),
  notes: text('notes'),
  isSaved: boolean('is_saved').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  saleNumberUnique: unique('dealer_sales_saleNumber_unique').on(table.saleNumber),
}));

export const dealerSaleItems = pgTable('dealer_sale_items', {
  id: serial('id').primaryKey().notNull(),
  saleId: integer('sale_id').notNull(),
  productId: integer('product_id').notNull(),
  quantity: integer('quantity').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  total: numeric('total', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const cart = pgTable('cart', {
  id: serial('id').primaryKey().notNull(),
  sessionId: varchar('session_id', { length: 255 }),
  productId: integer('product_id'),
  quantity: integer('quantity').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const companySettings = pgTable('company_settings', {
  id: serial('id').primaryKey().notNull(),
  companyName: varchar('company_name', { length: 255 }),
  address: text('address'),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  postalCode: varchar('postal_code', { length: 20 }),
  taxNumber: varchar('tax_number', { length: 100 }),
  tpsNumber: varchar('tps_number', { length: 100 }),
  tvqNumber: varchar('tvq_number', { length: 100 }),
  tpsRate: numeric('tps_rate', { precision: 5, scale: 2 }).default('5.00'),
  tvqRate: numeric('tvq_rate', { precision: 6, scale: 3 }).default('9.975'),
  instagramUrl: varchar('instagram_url', { length: 500 }),
  facebookUrl: varchar('facebook_url', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const admins = pgTable('admins', {
  id: serial('id').primaryKey().notNull(),
  username: varchar('username', { length: 255 }).notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  fullName: varchar('full_name', { length: 255 }),
  role: varchar('role', { length: 50 }).default('ADMIN'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  usernameUnique: unique('admins_username_unique').on(table.username),
}));

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey().notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  orderId: integer('order_id'),
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const orders = pgTable('orders', {
  id: serial('id').primaryKey().notNull(),
  orderNumber: varchar('order_number', { length: 100 }).notNull(),
  userId: integer('user_id'),
  status: varchar('status', { length: 50 }).default('PENDING'),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
  tax: numeric('tax', { precision: 10, scale: 2 }).default('0'),
  shipping: numeric('shipping', { precision: 10, scale: 2 }).default('0'),
  discount: numeric('discount', { precision: 10, scale: 2 }).default('0'),
  total: numeric('total', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).default('CAD'),
  shippingName: varchar('shipping_name', { length: 255 }),
  shippingPhone: varchar('shipping_phone', { length: 20 }),
  shippingEmail: varchar('shipping_email', { length: 255 }),
  shippingAddress: text('shipping_address'),
  shippingProvince: varchar('shipping_province', { length: 100 }),
  shippingCity: varchar('shipping_city', { length: 100 }),
  shippingPostalCode: varchar('shipping_postal_code', { length: 20 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  orderNumberUnique: unique('orders_orderNumber_unique').on(table.orderNumber),
}));

export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey().notNull(),
  orderId: integer('order_id'),
  productId: integer('product_id'),
  quantity: integer('quantity').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  total: numeric('total', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
