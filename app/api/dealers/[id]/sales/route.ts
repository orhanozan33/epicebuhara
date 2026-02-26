import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { dealerSales, dealerSaleItems, products, dealers, orders, orderItems, categories } from '@/src/db/schema';
import { eq, desc, inArray, sql } from 'drizzle-orm';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Bayi satışlarını getir
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dealerId = parseInt(id);

    if (isNaN(dealerId)) {
      return NextResponse.json(
        { error: 'Geçersiz bayi ID' },
        { status: 400 }
      );
    }

    // Satışları getir
    const sales = await db.select()
      .from(dealerSales)
      .where(eq(dealerSales.dealerId, dealerId))
      .orderBy(desc(dealerSales.createdAt));

    if (sales.length === 0) {
      return NextResponse.json([]);
    }

    // Satış öğelerini getir
    const saleIds = sales.map(s => s.id);

    // Tüm satışlar için öğeleri getir (boş array kontrolü)
    const allItems = saleIds.length > 0
      ? await db.select()
          .from(dealerSaleItems)
          .where(inArray(dealerSaleItems.saleId, saleIds))
      : [];

    // ORD- ile başlayan satışlar için order_items'tan öğeleri getir
    const ordSales = sales.filter(s => s.saleNumber.startsWith('ORD-'));
    const ordSaleNumbers = ordSales.map(s => s.saleNumber);
    
    let orderItemsData: any[] = [];
    const orderNumberToId = new Map<string, number>();
    
    if (ordSaleNumbers.length > 0) {
      // ORD- satışları için siparişleri bul
      const orderRecords = await db.select()
        .from(orders)
        .where(inArray(orders.orderNumber, ordSaleNumbers));
      
      // Order number'dan order ID mapping oluştur
      orderRecords.forEach(order => {
        orderNumberToId.set(order.orderNumber, order.id);
      });
      
      if (orderRecords.length > 0) {
        const orderIds = orderRecords.map(o => o.id);
        // Sipariş öğelerini getir
        orderItemsData = await db.select()
          .from(orderItems)
          .where(inArray(orderItems.orderId, orderIds));
      }
    }

    // Tüm product ID'leri topla (hem dealer_sale_items hem de order_items'tan)
    const allProductIds = [
      ...allItems.map(item => item.productId).filter((id): id is number => id !== null && id !== undefined),
      ...orderItemsData.map(item => item.productId).filter((id): id is number => id !== null && id !== undefined),
    ];
    const uniqueProductIds = [...new Set(allProductIds)];

    // Product bilgilerini getir (kategori ve pack için) + çeviri alanları
    const productList = uniqueProductIds.length > 0
      ? await db.select({
          id: products.id,
          name: products.name,
          baseName: products.baseName,
          images: products.images,
          categoryId: products.categoryId,
          packSize: products.packSize,
          packLabelTr: products.packLabelTr,
          packLabelEn: products.packLabelEn,
          packLabelFr: products.packLabelFr,
        })
          .from(products)
          .where(inArray(products.id, uniqueProductIds))
      : [];

    // base_name_fr, base_name_en (veritabanında var, schema'da opsiyonel)
    const productNameFrEnMap = new Map<number, { baseNameFr: string | null; baseNameEn: string | null }>();
    if (uniqueProductIds.length > 0) {
      try {
        for (const productId of uniqueProductIds) {
          const res = await db.execute(sql`SELECT base_name_fr, base_name_en FROM products WHERE id = ${productId}`) as any;
          const row = Array.isArray(res) ? res[0] : (res?.rows?.[0] ?? res);
          if (row) {
            productNameFrEnMap.set(productId, {
              baseNameFr: row.base_name_fr ?? null,
              baseNameEn: row.base_name_en ?? null,
            });
          }
        }
      } catch (_) { /* kolon yoksa görmezden gel */ }
    }

    // Kategori isimlerini getir + name_fr, name_en
    const categoryIds = [...new Set(productList.map(p => p.categoryId).filter((id): id is number => id != null))];
    const categoryList = categoryIds.length > 0
      ? await db.select({ id: categories.id, name: categories.name }).from(categories).where(inArray(categories.id, categoryIds))
      : [];
    const categoryMap = new Map(categoryList.map(c => [c.id, c.name]));
    const categoryNameFrEnMap = new Map<number, { nameFr: string | null; nameEn: string | null }>();
    if (categoryIds.length > 0) {
      try {
        for (const catId of categoryIds) {
          const res = await db.execute(sql`SELECT name_fr, name_en FROM categories WHERE id = ${catId}`) as any;
          const row = Array.isArray(res) ? res[0] : (res?.rows?.[0] ?? res);
          if (row) {
            categoryNameFrEnMap.set(catId, { nameFr: row.name_fr ?? null, nameEn: row.name_en ?? null });
          }
        }
      } catch (_) { /* kolon yoksa görmezden gel */ }
    }

    // Satışları öğelerle birleştir
    const salesWithItems = sales.map((sale) => {
      // Önce dealer_sale_items'tan öğeleri al (hem SAL- hem ORD- için)
      const getItemWithTranslations = (item: typeof allItems[0], product: typeof productList[0] | undefined, packSize: number) => {
        const frEn = product ? productNameFrEnMap.get(product.id) : null;
        const catFrEn = product?.categoryId != null ? categoryNameFrEnMap.get(product.categoryId) : null;
        const productNameTr = product?.baseName || product?.name || 'Ürün bulunamadı';
        const productNameFr = frEn?.baseNameFr || frEn?.baseNameEn || product?.baseName || product?.name || null;
        const productNameEn = frEn?.baseNameEn || frEn?.baseNameFr || product?.baseName || product?.name || null;
        const categoryName = product?.categoryId != null ? (categoryMap.get(product.categoryId) || null) : null;
        return {
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
          productName: productNameTr,
          productNameFr: productNameFr || productNameTr,
          productNameEn: productNameEn || productNameTr,
          productBaseName: product?.baseName || null,
          productImage: product?.images || null,
          categoryName: categoryName,
          categoryNameFr: catFrEn?.nameFr || catFrEn?.nameEn || categoryName,
          categoryNameEn: catFrEn?.nameEn || catFrEn?.nameFr || categoryName,
          packSize: packSize > 1 ? packSize : null,
          packLabelTr: product?.packLabelTr || null,
          packLabelFr: product?.packLabelFr || product?.packLabelEn || null,
          packLabelEn: product?.packLabelEn || product?.packLabelFr || null,
        };
      };

      let items = allItems
        .filter(item => item.saleId === sale.id)
        .map((item) => {
          const product = productList.find(p => p.id === item.productId);
          const packSize = product?.packSize ?? 1;
          return getItemWithTranslations(item, product, packSize);
        });

      // Eğer ORD- satışıysa ve dealer_sale_items'tan öğe yoksa, order_items'tan al
      if (sale.saleNumber.startsWith('ORD-') && items.length === 0) {
        const orderId = orderNumberToId.get(sale.saleNumber);
        
        if (orderId) {
          const ordItems = orderItemsData.filter(item => item.orderId === orderId);
          items = ordItems.map((item) => {
            const product = productList.find(p => p.id === item.productId);
            const packSize = product?.packSize ?? 1;
            return getItemWithTranslations(item as any, product, packSize);
          });
        }
      }

      // SAL- satışları için dealer_sale_items'tan items gelmeli
      // Eğer items hala boşsa ve SAL- satışıysa, bu bir veri sorunu olabilir
      // Ama yine de boş array döndürelim ki frontend'de kontrol edilebilsin
      // SAL- satışları normalde dealer_sale_items'ta olmalı

      return {
        ...sale,
        items: items || [], // Her durumda items array'i garantile
      };
    });

    return NextResponse.json(salesWithItems);
  } catch (error: any) {
    console.error('Error fetching dealer sales (Drizzle):', error);
    return NextResponse.json(
      { error: 'Satışlar getirilemedi', details: error?.message || 'Bilinmeyen hata' },
      { status: 500 }
    );
  }
}

// Yeni satış oluştur
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dealerId = parseInt(id);

    if (isNaN(dealerId)) {
      return NextResponse.json(
        { error: 'Geçersiz bayi ID' },
        { status: 400 }
      );
    }

    // Bayi var mı kontrol et
    const dealer = await db.select()
      .from(dealers)
      .where(eq(dealers.id, dealerId))
      .limit(1);

    if (dealer.length === 0) {
      return NextResponse.json(
        { error: 'Bayi bulunamadı' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { items, paymentMethod, notes, discountPercent: bodyDiscountPercent } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'En az bir ürün seçilmelidir' },
        { status: 400 }
      );
    }

    if (!paymentMethod || !['NAKIT', 'KREDI_KARTI', 'CEK', 'ODENMEDI'].includes(paymentMethod)) {
      return NextResponse.json(
        { error: 'Geçerli bir ödeme yöntemi seçilmelidir' },
        { status: 400 }
      );
    }

    // Ürünleri ve fiyatlarını getir
    const productIds = items
      .map((item: any) => parseInt(item.productId))
      .filter((id): id is number => !isNaN(id));

    if (productIds.length === 0) {
      return NextResponse.json(
        { error: 'Geçerli ürün ID\'leri gerekli' },
        { status: 400 }
      );
    }

    const productList = await db.select()
      .from(products)
      .where(inArray(products.id, productIds));

    if (productList.length === 0) {
      return NextResponse.json(
        { error: 'Ürünler bulunamadı' },
        { status: 404 }
      );
    }

    // Fiyat hesaplamaları
    let subtotal = 0;
    const saleItems = items
      .map((item: any) => {
        const product = productList.find(p => p.id === parseInt(item.productId));
        if (!product) return null;

        const quantity = parseInt(item.quantity) || 1;
        const price = parseFloat(product.price?.toString() || '0');
        const total = price * quantity;
        subtotal += total;

        return {
          productId: product.id,
          quantity,
          price: price.toFixed(2),
          total: total.toFixed(2),
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    if (saleItems.length === 0) {
      return NextResponse.json(
        { error: 'Geçerli satış öğeleri oluşturulamadı' },
        { status: 400 }
      );
    }

    // İskonto hesapla: istekte gönderilen yüzde varsa onu kullan, yoksa bayi iskontosu
    const dealerDiscount = parseFloat(dealer[0].discount?.toString() || '0');
    const effectiveDiscountPercent = bodyDiscountPercent != null && bodyDiscountPercent !== ''
      ? Math.min(100, Math.max(0, parseFloat(String(bodyDiscountPercent)) || 0))
      : dealerDiscount;
    const discountAmount = (subtotal * effectiveDiscountPercent) / 100;
    const afterDiscount = subtotal - discountAmount;

    // TPS ve TVQ hesapla - Vergi yok, 0
    const tpsAmount = 0;
    const tvqAmount = 0;
    const total = afterDiscount;

    // Satış numarası oluştur - Benzersiz olmalı
    // Tüm SAL- ile başlayan satış numaralarını al ve en yüksek numarayı bul
    const allSales = await db.select({
      saleNumber: dealerSales.saleNumber,
    })
      .from(dealerSales)
      .where(sql`${dealerSales.saleNumber} LIKE 'SAL-%'`);

    let maxNumber = 0;
    for (const sale of allSales) {
      const match = sale.saleNumber.match(/SAL-(\d{6})$/);
      if (match && match[1]) {
        const num = parseInt(match[1]);
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      }
    }

    // Benzersiz numara oluştur - eğer numara varsa tekrar dene
    let nextNumber = maxNumber + 1;
    let saleNumber = `SAL-${nextNumber.toString().padStart(6, '0')}`;
    let attempts = 0;
    const maxAttempts = 100;

    while (attempts < maxAttempts) {
      const existingSale = await db.select()
        .from(dealerSales)
        .where(eq(dealerSales.saleNumber, saleNumber))
        .limit(1);

      if (existingSale.length === 0) {
        // Benzersiz numara bulundu
        break;
      }

      // Numara varsa, bir sonraki numarayı dene
      nextNumber++;
      saleNumber = `SAL-${nextNumber.toString().padStart(6, '0')}`;
      attempts++;
    }

    if (attempts >= maxAttempts) {
      return NextResponse.json(
        { error: 'Benzersiz satış numarası oluşturulamadı' },
        { status: 500 }
      );
    }

    // Satış oluştur (isSaved: true ile fatura otomatik olarak Faturalar'a kaydedilir)
    const isPaid = paymentMethod !== 'ODENMEDI';
    
    const newSale = await db.insert(dealerSales).values({
      dealerId,
      saleNumber,
      paymentMethod,
      subtotal: subtotal.toFixed(2),
      discount: discountAmount.toFixed(2),
      total: total.toFixed(2),
      isPaid,
      paidAmount: isPaid ? total.toFixed(2) : '0',
      isSaved: true,
    }).returning();
    
    // Eğer ödendi ise paidAt'i güncelle
    if (isPaid && newSale[0]) {
      await db.update(dealerSales)
        .set({ paidAt: new Date() })
        .where(eq(dealerSales.id, newSale[0].id));
    }
    
    // Eğer notes varsa güncelle
    if (notes && notes.trim() && newSale[0]) {
      await db.update(dealerSales)
        .set({ notes: notes.trim() })
        .where(eq(dealerSales.id, newSale[0].id));
    }
    
    // Güncellenmiş satışı al
    const updatedSaleResult = await db.select()
      .from(dealerSales)
      .where(eq(dealerSales.id, newSale[0].id))
      .limit(1);
    
    const savedSale = updatedSaleResult[0] || newSale[0];

    // Satış öğelerini oluştur
    if (saleItems.length > 0) {
      console.log(`Satış öğeleri oluşturuluyor: ${saleItems.length} öğe`);
      console.log('Sale items:', JSON.stringify(saleItems, null, 2));
      console.log('Saved sale ID:', savedSale.id);
      
      try {
        const insertedItems = await db.insert(dealerSaleItems).values(
          saleItems.map((item) => ({
            saleId: savedSale.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            total: item.total,
          }))
        ).returning();
        
        console.log(`✅ ${insertedItems.length} satış öğesi oluşturuldu`);
        
        // Eğer beklenen sayıda item eklenmediyse hata ver
        if (insertedItems.length !== saleItems.length) {
          console.error(`⚠️ UYARI: Beklenen ${saleItems.length} öğe, sadece ${insertedItems.length} öğe eklendi`);
        }
      } catch (insertError: any) {
        console.error('❌ Satış öğeleri oluşturulurken hata:', insertError);
        console.error('Error details:', {
          message: insertError?.message,
          code: insertError?.code,
          constraint: insertError?.constraint,
        });
        
        // Hata durumunda satışı sil
        try {
          await db.delete(dealerSales).where(eq(dealerSales.id, savedSale.id));
          console.log('⚠️ Hata nedeniyle satış silindi');
        } catch (deleteError: any) {
          console.error('❌ Satış silinirken hata:', deleteError);
        }
        
        return NextResponse.json(
          { 
            error: 'Satış öğeleri kaydedilemedi', 
            details: insertError?.message || 'Bilinmeyen hata',
            code: insertError?.code,
            constraint: insertError?.constraint,
          },
          { status: 500 }
        );
      }
    } else {
      console.warn('⚠ Satış öğesi yok, satış öğeleri oluşturulmayacak');
      console.warn('Items array:', items);
      console.warn('Product list:', productList.map(p => ({ id: p.id, name: p.name })));
      
      // Items yoksa satışı sil
      try {
        await db.delete(dealerSales).where(eq(dealerSales.id, savedSale.id));
        console.log('⚠️ Items olmadığı için satış silindi');
      } catch (deleteError: any) {
        console.error('❌ Satış silinirken hata:', deleteError);
      }
      
      return NextResponse.json(
        { error: 'Satış öğeleri bulunamadı. Satış oluşturulamadı.' },
        { status: 400 }
      );
    }

    // Stok kutu cinsinden: kutu sayısı düş
    for (const item of saleItems) {
      const product = productList.find(p => p.id === item.productId);
      if (product && product.trackStock) {
        const quantityAdet = item.quantity;
        const packSize = product.packSize ?? 1;
        const boxesToDeduct = Math.ceil(quantityAdet / packSize);
        const currentStock = product.stock ? parseInt(product.stock.toString()) : 0;
        const newStock = Math.max(0, currentStock - boxesToDeduct);
        await db.update(products)
          .set({ stock: newStock })
          .where(eq(products.id, product.id));
      }
    }

    return NextResponse.json({
      success: true,
      sale: savedSale,
      saleNumber: savedSale.saleNumber,
    });
  } catch (error: any) {
    console.error('Error creating dealer sale (Drizzle):', error);
    console.error('Error stack:', error?.stack);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      constraint: error?.constraint,
      query: error?.query,
      params: error?.params,
      cause: error?.cause,
    });
    
    // Daha detaylı hata mesajı
    let errorMessage = error?.message || 'Bilinmeyen hata';
    if (error?.cause) {
      errorMessage = error.cause.message || errorMessage;
    }
    
    return NextResponse.json(
      { 
        error: 'Satış oluşturulurken hata oluştu', 
        details: errorMessage,
        code: error?.code || error?.cause?.code,
        constraint: error?.constraint || error?.cause?.constraint,
        query: process.env.NODE_ENV === 'development' ? error?.query : undefined,
      },
      { status: 500 }
    );
  }
}
