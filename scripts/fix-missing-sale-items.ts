import { db } from '../src/db';
import { dealerSales, dealerSaleItems, orderItems, products, orders } from '../src/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

async function fixMissingSaleItems() {
  try {
    console.log('Eksik satış öğeleri düzeltiliyor...\n');
    
    // Öğesi olmayan satışları bul
    const allSales = await db.select().from(dealerSales);
    const allItems = await db.select().from(dealerSaleItems);
    
    const salesWithoutItems = allSales.filter(sale => {
      const items = allItems.filter(item => item.saleId === sale.id);
      return items.length === 0;
    });
    
    console.log(`Öğesi olmayan satış sayısı: ${salesWithoutItems.length}\n`);
    
    // Mevcut max ID'yi al
    const maxIdResult = await db.execute(sql`
      SELECT COALESCE(MAX(id), 0) as max_id FROM dealer_sale_items
    `);
    let nextId = (maxIdResult[0]?.max_id || 0) + 1;
    
    for (const sale of salesWithoutItems) {
      console.log(`Satış ID: ${sale.id}, Satış No: ${sale.saleNumber}`);
      
      // Eğer sipariş numarası formatındaysa (ORD-), sipariş öğelerinden oluştur
      if (sale.saleNumber.startsWith('ORD-')) {
        console.log('  → Sipariş numarası formatı, sipariş öğelerinden oluşturuluyor...');
        
        // Sipariş numarasından siparişi bul
        const order = await db.select()
          .from(orders)
          .where(eq(orders.orderNumber, sale.saleNumber))
          .limit(1);
        
        if (order.length > 0) {
          const orderId = order[0].id;
          const items = await db.select()
            .from(orderItems)
            .where(eq(orderItems.orderId, orderId));
          
          if (items.length > 0) {
            // Ürün bilgilerini getir
            const productIds = items
              .map(item => item.productId)
              .filter((id): id is number => id !== null && id !== undefined);
            
            if (productIds.length > 0) {
              const productList = await db.select()
                .from(products)
                .where(inArray(products.id, productIds));
              
              // Satış öğelerini oluştur - ID'yi manuel belirle
              const saleItemsToInsert = items
                .filter(item => item.productId)
                .map((item, index) => {
                  const product = productList.find(p => p.id === item.productId);
                  if (!product) return null;
                  
                  const quantity = parseInt(item.quantity.toString());
                  const price = parseFloat(item.price || '0');
                  const total = price * quantity;
                  
                  return {
                    id: nextId++,
                    saleId: sale.id,
                    productId: item.productId!,
                    quantity,
                    price: price.toFixed(2),
                    total: total.toFixed(2),
                  };
                })
                .filter((item): item is NonNullable<typeof item> => item !== null);
              
              if (saleItemsToInsert.length > 0) {
                // ID'leri manuel belirleyerek ekle
                await db.execute(sql.raw(`
                  INSERT INTO dealer_sale_items (id, sale_id, product_id, quantity, price, total, created_at)
                  VALUES ${saleItemsToInsert.map((item, idx) => 
                    `(${item.id}, ${item.saleId}, ${item.productId}, ${item.quantity}, ${item.price}, ${item.total}, NOW())`
                  ).join(', ')}
                `));
                console.log(`  ✅ ${saleItemsToInsert.length} satış öğesi oluşturuldu`);
              } else {
                console.log('  ⚠ Geçerli satış öğesi oluşturulamadı');
              }
            } else {
              console.log('  ⚠ Ürün ID\'leri bulunamadı');
            }
          } else {
            console.log('  ⚠ Sipariş öğeleri bulunamadı');
          }
        } else {
          console.log('  ⚠ Sipariş bulunamadı');
        }
      } else {
        console.log('  ⚠ Manuel satış - öğeleri manuel olarak eklenmesi gerekiyor');
      }
      console.log('');
    }
    
    // Sequence'i güncelle (eğer items eklendiyse)
    if (nextId > (maxIdResult[0]?.max_id || 0) + 1) {
      try {
        await db.execute(sql.raw(`
          SELECT setval('dealer_sale_items_id_seq', ${nextId - 1}, true)
        `));
        console.log(`✅ Sequence güncellendi (${nextId - 1})`);
      } catch (seqError) {
        console.log('⚠ Sequence güncellenemedi (normal olabilir):', (seqError as Error).message);
      }
    }
    console.log('\n✅ İşlem tamamlandı!');
    
  } catch (error) {
    console.error('❌ Hata oluştu:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

fixMissingSaleItems();
