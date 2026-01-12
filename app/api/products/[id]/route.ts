import { NextResponse } from 'next/server';
import { getProductRepository } from '@/src/db/index.typeorm';

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

    const productRepo = await getProductRepository();
    await productRepo.delete(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting product (TypeORM):', error);
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

    const productRepo = await getProductRepository();
    const product = await productRepo.findOne({ where: { id } });

    if (!product) {
      return NextResponse.json({ error: 'Ürün bulunamadı' }, { status: 404 });
    }

    const { name, baseName, sku, price, comparePrice, stock, weight, unit, productGroup, categoryId, isActive, description, images } = body;

    // Slug generation helper function
    const generateSlug = (name: string, baseName?: string | null, weight?: string | null, unit?: string | null) => {
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
    if (name !== undefined) {
      product.name = name;
      const finalWeight = weight !== undefined ? weight : product.weight;
      const finalUnit = unit !== undefined ? unit : (product.unit || 'Gr');
      product.slug = generateSlug(name, baseName !== undefined ? baseName : product.baseName, finalWeight?.toString(), finalUnit);
    } else if (baseName !== undefined || weight !== undefined || unit !== undefined) {
      // Sadece baseName, weight veya unit değiştiyse slug'ı güncelle
      const finalBaseName = baseName !== undefined ? baseName : product.baseName;
      const finalWeight = weight !== undefined ? weight : product.weight;
      const finalUnit = unit !== undefined ? unit : (product.unit || 'Gr');
      product.slug = generateSlug(product.name, finalBaseName, finalWeight?.toString(), finalUnit);
    }

    if (baseName !== undefined) product.baseName = baseName || null;
    if (sku !== undefined) product.sku = sku || null;
    if (price !== undefined) product.price = price.toString();
    if (comparePrice !== undefined) product.comparePrice = comparePrice ? comparePrice.toString() : null;
    if (stock !== undefined) product.stock = parseInt(stock.toString()) || 0;
    if (weight !== undefined) product.weight = weight || null;
    if (unit !== undefined) product.unit = unit || 'Gr';
    if (productGroup !== undefined) product.productGroup = productGroup || null;
    if (categoryId !== undefined) product.categoryId = categoryId ? parseInt(categoryId.toString()) : null;
    if (isActive !== undefined) product.isActive = isActive;
    if (description !== undefined) product.description = description || null;
    if (images !== undefined) product.images = images || null;

    await productRepo.save(product);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating product (TypeORM):', error);
    return NextResponse.json(
      { error: 'Ürün güncellenirken hata oluştu', details: error?.message },
      { status: 500 }
    );
  }
}
