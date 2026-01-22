import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { products } from '@/src/db/schema';
import { eq, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// Tek ürün getir
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'Geçersiz ürün ID' }, { status: 400 });
    }

    const product = await db.select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (product.length === 0) {
      return NextResponse.json({ error: 'Ürün bulunamadı' }, { status: 404 });
    }

    // nameFr, nameEn, baseNameFr, baseNameEn değerlerini çek
    let nameFrEn = {
      nameFr: null as string | null,
      nameEn: null as string | null,
      baseNameFr: null as string | null,
      baseNameEn: null as string | null,
    };
    try {
      const nameFrEnResult = await db.execute(
        sql`SELECT name_fr, name_en, base_name_fr, base_name_en FROM products WHERE id = ${id}`
      ) as any;
      const result = Array.isArray(nameFrEnResult) ? nameFrEnResult[0] : (nameFrEnResult.rows ? nameFrEnResult.rows[0] : nameFrEnResult);
      if (result) {
        nameFrEn = {
          nameFr: result.name_fr || null,
          nameEn: result.name_en || null,
          baseNameFr: result.base_name_fr || null,
          baseNameEn: result.base_name_en || null,
        };
      }
    } catch (err: any) {
      // Kolonlar yoksa, null kullan
      console.warn('Could not fetch nameFr/nameEn/baseNameFr/baseNameEn fields:', err?.message);
    }

    return NextResponse.json({
      ...product[0],
      nameFr: nameFrEn.nameFr,
      nameEn: nameFrEn.nameEn,
      baseNameFr: nameFrEn.baseNameFr,
      baseNameEn: nameFrEn.baseNameEn,
    });
  } catch (error: any) {
    console.error('Error fetching product (Drizzle):', error);
    return NextResponse.json(
      { error: 'Ürün getirilirken hata oluştu', details: error?.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'Geçersiz ürün ID' }, { status: 400 });
    }

    await db.delete(products).where(eq(products.id, id));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting product (Drizzle):', error);
    return NextResponse.json(
      { error: 'Ürün silinirken hata oluştu', details: error?.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    const body = await request.json();

    if (isNaN(id)) {
      return NextResponse.json({ error: 'Geçersiz ürün ID' }, { status: 400 });
    }

    const existingProduct = await db.select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (existingProduct.length === 0) {
      return NextResponse.json({ error: 'Ürün bulunamadı' }, { status: 404 });
    }

    const product = existingProduct[0];
    const { name, nameFr, nameEn, baseName, baseNameFr, baseNameEn, sku, price, comparePrice, stock, weight, unit, productGroup, categoryId, isActive, description, images } = body;

    // nameFr, nameEn, baseNameFr, baseNameEn için normalizasyon
    // Frontend'den her zaman değer gönderiliyor (null veya string), bu yüzden undefined kontrolü yapmıyoruz
    const normalizeMultilingualField = (value: any): string | null => {
      if (value === undefined || value === null) return null; // Undefined veya null ise null
      if (value === '') return null; // Boş string ise null
      const trimmed = String(value).trim();
      return trimmed === '' ? null : trimmed; // Trim edilmiş boş string ise null
    };

    const normalizedNameFr = normalizeMultilingualField(nameFr);
    const normalizedNameEn = normalizeMultilingualField(nameEn);
    const normalizedBaseNameFr = normalizeMultilingualField(baseNameFr);
    const normalizedBaseNameEn = normalizeMultilingualField(baseNameEn);

    // Slug oluşturma fonksiyonu
    const generateSlug = (name: string, baseName: string | null | undefined, weight: string | null | undefined, unit: string | null | undefined) => {
      let slugBase = (baseName || name).toLowerCase().trim();
      if (!baseName) {
        slugBase = slugBase.replace(/\s*\d+(\.\d+)?\s*(gr|g|kg|lt|Gr|G|Kg|Kg)\s*$/i, '').trim();
      }
      
      let slug = slugBase;
      if (weight && unit) {
        const weightNum = parseFloat(weight);
        const weightStr = weightNum % 1 === 0 ? weightNum.toString() : weightNum.toFixed(2);
        const unitLower = unit.toLowerCase();
        slug = `${slugBase}-${weightStr}-${unitLower}`;
      }
      
      return slug
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    };

    // Update fields
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (name !== undefined) {
      updateData.name = name;
      const finalWeight = weight !== undefined ? weight : product.weight;
      const finalUnit = unit !== undefined ? unit : (product.unit || 'Gr');
      updateData.slug = generateSlug(name, baseName !== undefined ? baseName : product.baseName, finalWeight?.toString(), finalUnit);
    } else if (baseName !== undefined || weight !== undefined || unit !== undefined) {
      // Sadece baseName, weight veya unit değiştiyse slug'ı güncelle
      const finalBaseName = baseName !== undefined ? baseName : product.baseName;
      const finalWeight = weight !== undefined ? weight : product.weight;
      const finalUnit = unit !== undefined ? unit : (product.unit || 'Gr');
      updateData.slug = generateSlug(product.name, finalBaseName, finalWeight?.toString(), finalUnit);
    }

    // baseNameFr ve baseNameEn her zaman gönderiliyor (null veya string)
    // Bu yüzden her zaman güncelleme yapıyoruz
    const hasBaseNameFr = baseNameFr !== undefined;
    const hasBaseNameEn = baseNameEn !== undefined;
    if (baseName !== undefined) updateData.baseName = baseName || null;
    if (sku !== undefined) updateData.sku = sku || null;
    if (price !== undefined) updateData.price = price.toString();
    if (comparePrice !== undefined) updateData.comparePrice = comparePrice ? comparePrice.toString() : null;
    if (stock !== undefined) updateData.stock = parseInt(stock.toString()) || 0;
    if (weight !== undefined) updateData.weight = weight || null;
    if (unit !== undefined) updateData.unit = unit || 'Gr';
    if (productGroup !== undefined) updateData.productGroup = productGroup || null;
    if (categoryId !== undefined) updateData.categoryId = categoryId ? parseInt(categoryId.toString()) : null;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (description !== undefined) updateData.description = description || null;
    if (images !== undefined) updateData.images = images || null;

    // baseNameFr ve baseNameEn her zaman gönderiliyor, bu yüzden her zaman güncelleme yapıyoruz
    try {
      // Önce normal field'ları güncelle
      if (Object.keys(updateData).length > 1 || !updateData.updatedAt) {
        await db.update(products)
          .set(updateData)
          .where(eq(products.id, id));
      }
      
      // Sonra baseNameFr, baseNameEn'i güncelle (her zaman gönderiliyor)
      // Her field için ayrı ayrı güncelleme yap (daha güvenli)
      if (hasBaseNameFr) {
        await db.execute(
          sql`UPDATE products SET base_name_fr = ${normalizedBaseNameFr}, updated_at = NOW() WHERE id = ${id}`
        );
      }
      if (hasBaseNameEn) {
        await db.execute(
          sql`UPDATE products SET base_name_en = ${normalizedBaseNameEn}, updated_at = NOW() WHERE id = ${id}`
        );
      }
    } catch (updateError: any) {
      // Eğer name_fr, name_en, base_name_fr veya base_name_en kolonları yoksa, sadece diğer kolonları güncelle
      if (updateError?.code === '42703' || updateError?.message?.includes('name_fr') || updateError?.message?.includes('name_en') || updateError?.message?.includes('base_name_fr') || updateError?.message?.includes('base_name_en')) {
        // nameFr, nameEn, baseNameFr, baseNameEn'i updateData'dan çıkar
        const { nameFr: _, nameEn: __, baseNameFr: ___, baseNameEn: ____, ...restUpdateData } = updateData as any;
        await db.update(products)
          .set(restUpdateData)
          .where(eq(products.id, id));
      } else {
        throw updateError;
      }
    }

    // Güncellenmiş ürünü getir (nameFr, nameEn, baseNameFr, baseNameEn dahil)
    const updatedProduct = await db.select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    let nameFrEn = { 
      nameFr: null as string | null, 
      nameEn: null as string | null,
      baseNameFr: null as string | null,
      baseNameEn: null as string | null
    };
    try {
      const nameFrEnResult = await db.execute(
        sql`SELECT name_fr, name_en, base_name_fr, base_name_en FROM products WHERE id = ${id}`
      ) as any;
      const result = Array.isArray(nameFrEnResult) ? nameFrEnResult[0] : (nameFrEnResult.rows ? nameFrEnResult.rows[0] : nameFrEnResult);
      if (result) {
        nameFrEn = {
          nameFr: result.name_fr || null,
          nameEn: result.name_en || null,
          baseNameFr: result.base_name_fr || null,
          baseNameEn: result.base_name_en || null,
        };
      }
    } catch (err: any) {
      // Kolonlar yoksa, null kullan
      console.warn('Could not fetch nameFr/nameEn/baseNameFr/baseNameEn fields:', err?.message);
    }

    return NextResponse.json({
      ...updatedProduct[0],
      nameFr: nameFrEn.nameFr,
      nameEn: nameFrEn.nameEn,
      baseNameFr: nameFrEn.baseNameFr,
      baseNameEn: nameFrEn.baseNameEn,
    });
  } catch (error: any) {
    console.error('Error updating product (Drizzle):', error);
    return NextResponse.json(
      { error: 'Ürün güncellenirken hata oluştu', details: error?.message },
      { status: 500 }
    );
  }
}
