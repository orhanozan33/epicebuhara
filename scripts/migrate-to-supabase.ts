import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { eq } from 'drizzle-orm';
import {
  categories,
  products,
  dealers,
  admins,
  orders,
  orderItems,
  dealerSales,
  dealerSaleItems,
  companySettings,
  notifications,
  users,
} from '../src/db/schema';

dotenv.config({ path: path.join(process.cwd(), '.env') });

// Local database connection (eski connection)
const localDbUrl = process.env.LOCAL_DATABASE_URL || 'postgresql://postgres:333333@localhost:5432/baharat';
const supabaseDbUrl = process.env.DATABASE_URL || '';

if (!supabaseDbUrl) {
  console.error('DATABASE_URL (Supabase) bulunamadı!');
  process.exit(1);
}

async function migrateData() {
  console.log('🚀 Veri migrasyonu başlatılıyor...\n');

  // Local database connection
  const localClient = postgres(localDbUrl);
  const localDb = drizzle(localClient);

  // Supabase database connection
  const supabaseClient = postgres(supabaseDbUrl, {
    ssl: 'require',
    max: 10,
  });
  const supabaseDb = drizzle(supabaseClient);

  try {
    // 1. Users (önce users, çünkü orders buna bağımlı)
    console.log('👥 Kullanıcılar aktarılıyor...');
    const localUsers = await localDb.select().from(users);
    if (localUsers.length > 0) {
      const existingSupabaseUsers = await supabaseDb.select({ email: users.email }).from(users);
      const existingEmails = new Set(existingSupabaseUsers.map(u => u.email));
      
      const usersToInsert = localUsers.filter(u => !existingEmails.has(u.email));
      if (usersToInsert.length > 0) {
        await supabaseDb.insert(users).values(usersToInsert);
        console.log(`   ✅ ${usersToInsert.length} kullanıcı eklendi`);
      } else {
        console.log('   ℹ️  Tüm kullanıcılar zaten mevcut');
      }
    } else {
      console.log('   ⚠️  Local DB\'de kullanıcı bulunamadı');
    }

    // 2. Categories
    console.log('\n📁 Kategoriler aktarılıyor...');
    const localCategories = await localDb.select().from(categories);
    if (localCategories.length > 0) {
      // Önce Supabase'deki mevcut kategorileri kontrol et
      const existingSupabaseCategories = await supabaseDb.select().from(categories);
      const existingSlugs = new Set(existingSupabaseCategories.map(c => c.slug));
      
      const categoriesToInsert = localCategories.filter(c => !existingSlugs.has(c.slug));
      if (categoriesToInsert.length > 0) {
        await supabaseDb.insert(categories).values(categoriesToInsert);
        console.log(`   ✅ ${categoriesToInsert.length} kategori eklendi`);
      } else {
        console.log('   ℹ️  Tüm kategoriler zaten mevcut');
      }
    } else {
      console.log('   ⚠️  Local DB\'de kategori bulunamadı');
    }

    // 3. Products
    console.log('\n📦 Ürünler aktarılıyor...');
    const localProducts = await localDb.select().from(products);
    if (localProducts.length > 0) {
      const existingSupabaseProducts = await supabaseDb.select({ slug: products.slug }).from(products);
      const existingProductSlugs = new Set(existingSupabaseProducts.map(p => p.slug).filter(Boolean));
      
      const productsToInsert = localProducts.filter(p => p.slug && !existingProductSlugs.has(p.slug));
      if (productsToInsert.length > 0) {
        await supabaseDb.insert(products).values(productsToInsert);
        console.log(`   ✅ ${productsToInsert.length} ürün eklendi`);
      } else {
        console.log('   ℹ️  Tüm ürünler zaten mevcut');
      }
    } else {
      console.log('   ⚠️  Local DB\'de ürün bulunamadı');
    }

    // 4. Dealers
    console.log('\n🏪 Bayiler aktarılıyor...');
    const localDealers = await localDb.select().from(dealers);
    if (localDealers.length > 0) {
      const existingSupabaseDealers = await supabaseDb.select({ id: dealers.id }).from(dealers);
      const existingDealerIds = new Set(existingSupabaseDealers.map(d => d.id));
      
      const dealersToInsert = localDealers.filter(d => !existingDealerIds.has(d.id));
      if (dealersToInsert.length > 0) {
        await supabaseDb.insert(dealers).values(dealersToInsert);
        console.log(`   ✅ ${dealersToInsert.length} bayi eklendi`);
      } else {
        console.log('   ℹ️  Tüm bayiler zaten mevcut');
      }
    } else {
      console.log('   ⚠️  Local DB\'de bayi bulunamadı');
    }

    // 5. Admins
    console.log('\n👤 Adminler aktarılıyor...');
    const localAdmins = await localDb.select().from(admins);
    if (localAdmins.length > 0) {
      const existingSupabaseAdmins = await supabaseDb.select({ username: admins.username }).from(admins);
      const existingUsernames = new Set(existingSupabaseAdmins.map(a => a.username));
      
      const adminsToInsert = localAdmins.filter(a => !existingUsernames.has(a.username));
      if (adminsToInsert.length > 0) {
        await supabaseDb.insert(admins).values(adminsToInsert);
        console.log(`   ✅ ${adminsToInsert.length} admin eklendi`);
      } else {
        console.log('   ℹ️  Tüm adminler zaten mevcut');
      }
    } else {
      console.log('   ⚠️  Local DB\'de admin bulunamadı');
    }

    // 6. Orders
    console.log('\n🛒 Siparişler aktarılıyor...');
    const localOrders = await localDb.select().from(orders);
    if (localOrders.length > 0) {
      const existingSupabaseOrders = await supabaseDb.select({ id: orders.id }).from(orders);
      const existingOrderIds = new Set(existingSupabaseOrders.map(o => o.id));
      
      const ordersToInsert = localOrders.filter(o => !existingOrderIds.has(o.id));
      if (ordersToInsert.length > 0) {
        await supabaseDb.insert(orders).values(ordersToInsert);
        console.log(`   ✅ ${ordersToInsert.length} sipariş eklendi`);
        
        // Order Items
        console.log('   📋 Sipariş öğeleri aktarılıyor...');
        let totalOrderItems = 0;
        for (const order of ordersToInsert) {
          const localOrderItems = await localDb
            .select()
            .from(orderItems)
            .where(eq(orderItems.orderId, order.id));
          
          if (localOrderItems.length > 0) {
            await supabaseDb.insert(orderItems).values(localOrderItems);
            totalOrderItems += localOrderItems.length;
          }
        }
        console.log(`   ✅ ${totalOrderItems} sipariş öğesi eklendi`);
      } else {
        console.log('   ℹ️  Tüm siparişler zaten mevcut');
      }
    } else {
      console.log('   ⚠️  Local DB\'de sipariş bulunamadı');
    }

    // 7. Dealer Sales
    console.log('\n💰 Bayi Satışları aktarılıyor...');
    const localDealerSales = await localDb.select().from(dealerSales);
    if (localDealerSales.length > 0) {
      const existingSupabaseSales = await supabaseDb.select({ id: dealerSales.id }).from(dealerSales);
      const existingSaleIds = new Set(existingSupabaseSales.map(s => s.id));
      
      const salesToInsert = localDealerSales.filter(s => !existingSaleIds.has(s.id));
      if (salesToInsert.length > 0) {
        await supabaseDb.insert(dealerSales).values(salesToInsert);
        console.log(`   ✅ ${salesToInsert.length} bayi satışı eklendi`);
        
        // Dealer Sale Items
        console.log('   📋 Bayi satış öğeleri aktarılıyor...');
        let totalSaleItems = 0;
        for (const sale of salesToInsert) {
          const localSaleItems = await localDb
            .select()
            .from(dealerSaleItems)
            .where(eq(dealerSaleItems.saleId, sale.id));
          
          if (localSaleItems.length > 0) {
            await supabaseDb.insert(dealerSaleItems).values(localSaleItems);
            totalSaleItems += localSaleItems.length;
          }
        }
        console.log(`   ✅ ${totalSaleItems} bayi satış öğesi eklendi`);
      } else {
        console.log('   ℹ️  Tüm bayi satışları zaten mevcut');
      }
    } else {
      console.log('   ⚠️  Local DB\'de bayi satışı bulunamadı');
    }

    // 8. Company Settings
    console.log('\n⚙️  Firma Ayarları aktarılıyor...');
    const localCompanySettings = await localDb.select().from(companySettings);
    if (localCompanySettings.length > 0) {
      const existingSupabaseSettings = await supabaseDb.select().from(companySettings);
      if (existingSupabaseSettings.length === 0) {
        await supabaseDb.insert(companySettings).values(localCompanySettings);
        console.log(`   ✅ Firma ayarları eklendi`);
      } else {
        console.log('   ℹ️  Firma ayarları zaten mevcut');
      }
    } else {
      console.log('   ⚠️  Local DB\'de firma ayarları bulunamadı');
    }

    // 9. Notifications
    console.log('\n🔔 Bildirimler aktarılıyor...');
    const localNotifications = await localDb.select().from(notifications);
    if (localNotifications.length > 0) {
      const existingSupabaseNotifications = await supabaseDb.select({ id: notifications.id }).from(notifications);
      const existingNotificationIds = new Set(existingSupabaseNotifications.map(n => n.id));
      
      const notificationsToInsert = localNotifications.filter(n => !existingNotificationIds.has(n.id));
      if (notificationsToInsert.length > 0) {
        await supabaseDb.insert(notifications).values(notificationsToInsert);
        console.log(`   ✅ ${notificationsToInsert.length} bildirim eklendi`);
      } else {
        console.log('   ℹ️  Tüm bildirimler zaten mevcut');
      }
    } else {
      console.log('   ⚠️  Local DB\'de bildirim bulunamadı');
    }

    console.log('\n✅ Veri migrasyonu tamamlandı!');
  } catch (error: any) {
    console.error('\n❌ Migrasyon hatası:', error);
    console.error('Error details:', error?.message);
    process.exit(1);
  } finally {
    await localClient.end();
    await supabaseClient.end();
  }
}

migrateData();
