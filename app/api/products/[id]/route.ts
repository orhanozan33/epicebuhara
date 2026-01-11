import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { products } from '@/src/db/schema';
import { eq } from 'drizzle-orm';

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
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Ürün silinirken hata oluştu' },
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

    const { name, baseName, sku, price, comparePrice, stock, weight, unit, productGroup, categoryId, isActive, description, images } = body;
    
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (name) {
      updateData.name = name;
      // Slug oluştur: baseName + weight + unit
      let slugBase = (baseName || name).toLowerCase().trim();
      // Name'den gramaj bilgisini çıkar (eğer baseName yoksa)
      if (!baseName) {
        slugBase = slugBase.replace(/\s*\d+(\.\d+)?\s*(gr|g|kg|lt|Gr|G|Kg|Kg)\s*$/i, '').trim();
      }
      
      // Weight ve unit bilgisini slug'a ekle
      let slug = slugBase;
      const finalWeight = weight !== undefined ? weight : (updateData.weight || null);
      const finalUnit = unit !== undefined ? unit : (updateData.unit || 'Gr');
      if (finalWeight && finalUnit) {
        const weightNum = parseFloat(finalWeight.toString());
        const weightStr = weightNum % 1 === 0 ? weightNum.toString() : weightNum.toFixed(2);
        const unitLower = finalUnit.toLowerCase();
        slug = `${slugBase}-${weightStr}-${unitLower}`;
      }
      
      // Slug'ı temizle
      updateData.slug = slug
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    } else if (baseName !== undefined || weight !== undefined || unit !== undefined) {
      // Sadece baseName, weight veya unit değiştiyse slug'ı güncelle
      const currentProductResult = await db.select().from(products).where(eq(products.id, id)).limit(1);
      const currentProduct = currentProductResult;
      if (currentProduct.length > 0) {
        const current = currentProduct[0];
        const finalBaseName = baseName !== undefined ? baseName : current.baseName;
        const finalWeight = weight !== undefined ? weight : current.weight;
        const finalUnit = unit !== undefined ? unit : (current.unit || 'Gr');
        
        let slugBase = (finalBaseName || current.name).toLowerCase().trim();
        if (!finalBaseName) {
          slugBase = slugBase.replace(/\s*\d+(\.\d+)?\s*(gr|g|kg|lt|Gr|G|Kg|Kg)\s*$/i, '').trim();
        }
        
        let slug = slugBase;
        if (finalWeight && finalUnit) {
          const weightNum = parseFloat(finalWeight.toString());
          const weightStr = weightNum % 1 === 0 ? weightNum.toString() : weightNum.toFixed(2);
          const unitLower = finalUnit.toLowerCase();
          slug = `${slugBase}-${weightStr}-${unitLower}`;
        }
        
        updateData.slug = slug
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
      }
    }
    if (baseName !== undefined) updateData.baseName = baseName || null;
    if (sku !== undefined) updateData.sku = sku || null;
    if (price !== undefined) updateData.price = price.toString();
    if (comparePrice !== undefined) updateData.comparePrice = comparePrice ? comparePrice.toString() : null;
    if (stock !== undefined) updateData.stock = parseInt(stock) || 0;
    if (weight !== undefined) updateData.weight = weight || null;
    if (unit !== undefined) updateData.unit = unit || 'Gr';
    if (productGroup !== undefined) updateData.productGroup = productGroup || null;
    if (categoryId !== undefined) updateData.categoryId = categoryId ? parseInt(categoryId) : null;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (description !== undefined) updateData.description = description || null;
    if (images !== undefined) updateData.images = images || null;

    await db
      .update(products)
      .set(updateData)
      .where(eq(products.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Ürün güncellenirken hata oluştu' },
      { status: 500 }
    );
  }
}
