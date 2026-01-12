import { NextResponse } from 'next/server';
import { getDataSource, getDealerRepository, getDealerSaleRepository, getDealerSaleItemRepository, getProductRepository } from '@/src/db/index.typeorm';
import { loadEntityClass } from '@/src/db/entity-loader';
import { In } from 'typeorm';

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

    const dealerSaleRepo = await getDealerSaleRepository();
    const sales = await dealerSaleRepo.find({
      where: { dealerId },
      order: { createdAt: 'DESC' },
      relations: ['items', 'items.product'],
    });

    // Format sales with items
    const salesWithItems = sales.map((sale) => ({
      ...sale,
      items: (sale.items || []).map((item: any) => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
        productName: item.product?.name || null,
        productImage: item.product?.images || null,
      })),
    }));

    return NextResponse.json(salesWithItems);
  } catch (error: any) {
    console.error('Error fetching dealer sales (TypeORM):', error);
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
  const dataSource = await getDataSource();
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const { id } = await params;
    const dealerId = parseInt(id);

    if (isNaN(dealerId)) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      return NextResponse.json(
        { error: 'Geçersiz bayi ID' },
        { status: 400 }
      );
    }

    // Bayi var mı kontrol et
    const DealerEntity = await loadEntityClass('Dealer');
    const dealerRepo: any = queryRunner.manager.getRepository(DealerEntity);
    const dealer = await dealerRepo.findOne({ where: { id: dealerId } });

    if (!dealer) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      return NextResponse.json(
        { error: 'Bayi bulunamadı' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { items, paymentMethod, notes } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      return NextResponse.json(
        { error: 'En az bir ürün seçilmelidir' },
        { status: 400 }
      );
    }

    if (!paymentMethod || !['NAKIT', 'KREDI_KARTI', 'CEK', 'ODENMEDI'].includes(paymentMethod)) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      return NextResponse.json(
        { error: 'Geçerli bir ödeme yöntemi seçilmelidir' },
        { status: 400 }
      );
    }

    // Ürünleri ve fiyatlarını getir
    const productIds = items.map((item: any) => parseInt(item.productId)).filter((id): id is number => !isNaN(id));
    if (productIds.length === 0) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      return NextResponse.json(
        { error: 'Geçerli ürün ID bulunamadı' },
        { status: 400 }
      );
    }

    const ProductEntity = await loadEntityClass('Product');
    const productRepo = queryRunner.manager.getRepository(ProductEntity);
    const productList: any[] = await productRepo.find({ where: { id: In(productIds) } });

    if (productList.length !== productIds.length) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      return NextResponse.json(
        { error: 'Bazı ürünler bulunamadı' },
        { status: 400 }
      );
    }

    // Fiyat hesaplamaları
    let subtotal = 0;
    const saleItems = items.map((item: any) => {
      const product: any = productList.find((p: any) => p.id === parseInt(item.productId));
      if (!product) {
        throw new Error(`Ürün bulunamadı: ${item.productId}`);
      }

      const quantity = parseInt(item.quantity) || 1;
      const price = parseFloat(product.price || '0');
      const total = price * quantity;
      subtotal += total;

      return {
        productId: product.id,
        quantity,
        price: price.toFixed(2),
        total: total.toFixed(2),
      };
    });

    // İskonto hesapla
    const discountPercent = parseFloat(dealer.discount || '0');
    const discountAmount = (subtotal * discountPercent) / 100;
    const afterDiscount = Math.max(0, subtotal - discountAmount);
    
    // TPS (Quebec Sales Tax) %5
    const tpsAmount = Math.round((afterDiscount * 0.05) * 100) / 100;
    
    // TVQ (Quebec Goods and Services Tax) %9.975
    const tvqAmount = Math.round((afterDiscount * 0.09975) * 100) / 100;
    
    // Toplam (İskonto sonrası + TPS + TVQ)
    const total = Math.round((afterDiscount + tpsAmount + tvqAmount) * 100) / 100;

    // Satış numarası oluştur
    const DealerSaleEntity = await loadEntityClass('DealerSale');
    const dealerSaleRepo: any = queryRunner.manager.getRepository(DealerSaleEntity);
    const lastSale: any = await dealerSaleRepo
      .createQueryBuilder('sale')
      .orderBy('sale.id', 'DESC')
      .getOne();

    let nextNumber = 1;
    if (lastSale?.saleNumber) {
      const match = lastSale.saleNumber.match(/SAL-(\d{6})$/);
      if (match && match[1]) {
        const num = parseInt(match[1]);
        if (!isNaN(num) && num > 0) {
          nextNumber = num + 1;
        }
      } else {
        const total = await dealerSaleRepo.count();
        nextNumber = total + 1;
      }
    }

    const saleNumber = `SAL-${nextNumber.toString().padStart(6, '0')}`;

    // Satış oluştur
    const isPaid = paymentMethod !== 'ODENMEDI';
    const newSale = dealerSaleRepo.create({
      dealerId,
      saleNumber,
      paymentMethod,
      subtotal: subtotal.toFixed(2),
      discount: discountAmount.toFixed(2),
      total: total.toFixed(2),
      isPaid,
      paidAmount: isPaid ? total.toFixed(2) : '0',
      paidAt: isPaid ? new Date() : null,
      notes: notes?.trim() || null,
    });
    const savedSale = await dealerSaleRepo.save(newSale);

    // Satış öğelerini oluştur
    const DealerSaleItemEntity = await loadEntityClass('DealerSaleItem');
    const dealerSaleItemRepo: any = queryRunner.manager.getRepository(DealerSaleItemEntity);
    const saleItemsToInsert = dealerSaleItemRepo.create(
      saleItems.map((item: any) => ({
        saleId: savedSale.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
      }))
    );
    await dealerSaleItemRepo.save(saleItemsToInsert);

    // Stok güncelle (trackStock true olan ürünler için)
    for (const item of saleItems) {
      const product: any = productList.find((p: any) => p.id === item.productId);
      if (product && product.trackStock) {
        const quantityToSubtract = parseInt(item.quantity.toString());
        
        if (product.stock !== null && product.stock !== undefined) {
          const currentStock = product.stock;
          const newStock = Math.max(0, currentStock - quantityToSubtract);
          product.stock = newStock;
          await productRepo.save(product);
        } else {
          product.stock = -quantityToSubtract;
          await productRepo.save(product);
        }
      }
    }

    await queryRunner.commitTransaction();

    return NextResponse.json({
      ...savedSale,
      items: saleItems,
    });
  } catch (error: any) {
    await queryRunner.rollbackTransaction();
    console.error('Error creating dealer sale (TypeORM):', error);
    return NextResponse.json(
      { error: 'Satış oluşturulamadı', details: error?.message || 'Bilinmeyen hata' },
      { status: 500 }
    );
  } finally {
    await queryRunner.release();
  }
}
