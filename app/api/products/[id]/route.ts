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
    
    // Önce kolonların var olup olmadığını kontrol et
    try {
      // Kolonları kontrol et
      const columnCheck = await db.execute(
        sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'products' AND column_name IN ('name_fr', 'name_en', 'base_name_fr', 'base_name_en')`
      ) as any;
      
      const existingColumns = Array.isArray(columnCheck) 
        ? columnCheck.map((row: any) => row.column_name || row.column_name)
        : (columnCheck.rows ? columnCheck.rows.map((row: any) => row.column_name || row.column_name) : []);
      
      console.log('GET - Existing multilingual columns:', existingColumns);
      
      // Eksik kolonları oluştur
      if (!existingColumns.includes('base_name_fr')) {
        try {
          await db.execute(sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS base_name_fr VARCHAR(255)`);
          console.log('GET - Created base_name_fr column');
        } catch (createErr: any) {
          console.error('GET - Error creating base_name_fr:', createErr?.message);
        }
      }
      if (!existingColumns.includes('base_name_en')) {
        try {
          await db.execute(sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS base_name_en VARCHAR(255)`);
          console.log('GET - Created base_name_en column');
        } catch (createErr: any) {
          console.error('GET - Error creating base_name_en:', createErr?.message);
        }
      }
      
      // Şimdi değerleri çek (kolonlar artık var olmalı)
      const nameFrEnResult = await db.execute(
        sql`SELECT base_name_fr, base_name_en FROM products WHERE id = ${id}`
      ) as any;
      const result = Array.isArray(nameFrEnResult) ? nameFrEnResult[0] : (nameFrEnResult.rows ? nameFrEnResult.rows[0] : nameFrEnResult);
      
      // Debug: SQL sorgusunun sonucunu logla
      console.log('GET - SQL query result for product', id, ':', result);
      console.log('GET - base_name_fr value:', result?.base_name_fr, 'type:', typeof result?.base_name_fr);
      console.log('GET - base_name_en value:', result?.base_name_en, 'type:', typeof result?.base_name_en);
      
      if (result) {
        nameFrEn = {
          nameFr: null, // Artık kullanılmıyor
          nameEn: null, // Artık kullanılmıyor
          baseNameFr: result.base_name_fr ?? null, // nullish coalescing kullan
          baseNameEn: result.base_name_en ?? null, // nullish coalescing kullan
        };
        console.log('GET - Parsed nameFrEn:', nameFrEn);
      } else {
        console.log('GET - No result found for product', id);
      }
    } catch (err: any) {
      // Kolonlar yoksa veya başka bir hata varsa, null kullan
      console.error('GET - Could not fetch baseNameFr/baseNameEn fields:', err?.message);
      console.error('GET - Error details:', err);
      // Hata olsa bile devam et, null değerlerle dön
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
    
    // Debug: Gönderilen değerleri logla
    console.log('Received baseNameFr:', baseNameFr, 'type:', typeof baseNameFr);
    console.log('Received baseNameEn:', baseNameEn, 'type:', typeof baseNameEn);

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
      
      // Sonra baseNameFr, baseNameEn'i güncelle (her zaman gönderiliyor, undefined değilse)
      // Her field için ayrı ayrı güncelleme yap (daha güvenli)
      if (hasBaseNameFr) {
        try {
          await db.execute(
            sql`UPDATE products SET base_name_fr = ${normalizedBaseNameFr}, updated_at = NOW() WHERE id = ${id}`
          );
          console.log(`Updated base_name_fr for product ${id}:`, normalizedBaseNameFr);
        } catch (err: any) {
          // Kolon yoksa, önce kolonu oluştur, sonra güncelle
          if (err?.code === '42703' || err?.message?.includes('base_name_fr')) {
            console.log('Column base_name_fr does not exist, creating it...');
            try {
              await db.execute(
                sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS base_name_fr VARCHAR(255)`
              );
              // Kolon oluşturulduktan sonra tekrar güncelle
              await db.execute(
                sql`UPDATE products SET base_name_fr = ${normalizedBaseNameFr}, updated_at = NOW() WHERE id = ${id}`
              );
              console.log(`Created and updated base_name_fr for product ${id}:`, normalizedBaseNameFr);
            } catch (createErr: any) {
              console.error('Error creating/updating base_name_fr:', createErr);
            }
          } else {
            console.error('Error updating base_name_fr:', err);
            throw err;
          }
        }
      }
      if (hasBaseNameEn) {
        try {
          await db.execute(
            sql`UPDATE products SET base_name_en = ${normalizedBaseNameEn}, updated_at = NOW() WHERE id = ${id}`
          );
          console.log(`Updated base_name_en for product ${id}:`, normalizedBaseNameEn);
        } catch (err: any) {
          // Kolon yoksa, önce kolonu oluştur, sonra güncelle
          if (err?.code === '42703' || err?.message?.includes('base_name_en')) {
            console.log('Column base_name_en does not exist, creating it...');
            try {
              await db.execute(
                sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS base_name_en VARCHAR(255)`
              );
              // Kolon oluşturulduktan sonra tekrar güncelle
              await db.execute(
                sql`UPDATE products SET base_name_en = ${normalizedBaseNameEn}, updated_at = NOW() WHERE id = ${id}`
              );
              console.log(`Created and updated base_name_en for product ${id}:`, normalizedBaseNameEn);
            } catch (createErr: any) {
              console.error('Error creating/updating base_name_en:', createErr);
            }
          } else {
            console.error('Error updating base_name_en:', err);
            throw err;
          }
        }
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
      // Önce kolonların var olup olmadığını kontrol et
      const columnCheck = await db.execute(
        sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'products' AND column_name IN ('base_name_fr', 'base_name_en')`
      ) as any;
      
      const existingColumns = Array.isArray(columnCheck) 
        ? columnCheck.map((row: any) => row.column_name || row.column_name)
        : (columnCheck.rows ? columnCheck.rows.map((row: any) => row.column_name || row.column_name) : []);
      
      console.log('PUT - Existing multilingual columns:', existingColumns);
      
      // Eksik kolonları oluştur
      if (!existingColumns.includes('base_name_fr')) {
        try {
          await db.execute(sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS base_name_fr VARCHAR(255)`);
          console.log('PUT - Created base_name_fr column');
        } catch (createErr: any) {
          console.error('PUT - Error creating base_name_fr:', createErr?.message);
        }
      }
      if (!existingColumns.includes('base_name_en')) {
        try {
          await db.execute(sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS base_name_en VARCHAR(255)`);
          console.log('PUT - Created base_name_en column');
        } catch (createErr: any) {
          console.error('PUT - Error creating base_name_en:', createErr?.message);
        }
      }
      
      // Şimdi değerleri çek (kolonlar artık var olmalı)
      const nameFrEnResult = await db.execute(
        sql`SELECT base_name_fr, base_name_en FROM products WHERE id = ${id}`
      ) as any;
      const result = Array.isArray(nameFrEnResult) ? nameFrEnResult[0] : (nameFrEnResult.rows ? nameFrEnResult.rows[0] : nameFrEnResult);
      
      // Debug: SQL sorgusunun sonucunu logla
      console.log('PUT - SQL query result for product', id, ':', result);
      console.log('PUT - base_name_fr value:', result?.base_name_fr, 'type:', typeof result?.base_name_fr);
      console.log('PUT - base_name_en value:', result?.base_name_en, 'type:', typeof result?.base_name_en);
      
      if (result) {
        nameFrEn = {
          nameFr: null, // Artık kullanılmıyor
          nameEn: null, // Artık kullanılmıyor
          baseNameFr: result.base_name_fr ?? null, // nullish coalescing kullan
          baseNameEn: result.base_name_en ?? null, // nullish coalescing kullan
        };
        console.log('PUT - Parsed nameFrEn:', nameFrEn);
      } else {
        console.log('PUT - No result found for product', id);
      }
    } catch (err: any) {
      // Kolonlar yoksa, null kullan
      console.error('PUT - Could not fetch nameFr/nameEn/baseNameFr/baseNameEn fields:', err?.message);
      console.error('PUT - Error details:', err);
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
