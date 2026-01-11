import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { products, categories } from '@/src/db/schema';
import { eq, and, desc, isNotNull, sql, or, ilike } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, baseName, sku, price, comparePrice, stock, weight, unit, productGroup, categoryId, isActive, description, images } = body;

    if (!name || !price) {
      return NextResponse.json(
        { error: 'Ürün adı ve fiyat gerekli' },
        { status: 400 }
      );
    }

    // Slug oluştur: baseName + weight + unit
    // Örnek: "Isot Pepper" + "50" + "Gr" -> "isot-pepper-50-gr"
    let slugBase = (baseName || name).toLowerCase().trim();
    // Name'den gramaj bilgisini çıkar (eğer baseName yoksa)
    if (!baseName) {
      slugBase = slugBase.replace(/\s*\d+(\.\d+)?\s*(gr|g|kg|lt|Gr|G|Kg|Kg)\s*$/i, '').trim();
    }
    
    // Weight ve unit bilgisini slug'a ekle
    let slug = slugBase;
    if (weight && unit) {
      const weightNum = parseFloat(weight);
      const weightStr = weightNum % 1 === 0 ? weightNum.toString() : weightNum.toFixed(2);
      const unitLower = unit.toLowerCase();
      slug = `${slugBase}-${weightStr}-${unitLower}`;
    }
    
    // Slug'ı temizle
    slug = slug
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const [newProduct] = await db
      .insert(products)
      .values({
        name,
        baseName: baseName || null,
        slug,
        sku: sku || null,
        price: price.toString(),
        comparePrice: comparePrice ? comparePrice.toString() : null,
        stock: stock || 0,
        weight: weight || null,
        unit: unit || 'Gr',
        productGroup: productGroup || null,
        categoryId: categoryId ? parseInt(categoryId) : null,
        isActive: isActive ?? true,
        description: description || null,
        images: images || null,
        trackStock: true,
      })
      .returning();

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Ürün oluşturulurken hata oluştu' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const featured = searchParams.get('featured') === 'true';
    const newProducts = searchParams.get('new') === 'true';
    const discounted = searchParams.get('discounted') === 'true';
    const search = searchParams.get('search');
    const slug = searchParams.get('slug'); // Slug ile ürün arama

    const adminView = searchParams.get('admin') === 'true';
    let conditions: any[] = adminView ? [] : [eq(products.isActive, true)];

    // Slug ile ürün arama (tek ürün getirir) - öncelikli
    if (slug) {
      conditions.push(eq(products.slug, slug));
    }

    if (categoryId) {
      conditions.push(eq(products.categoryId, parseInt(categoryId)));
    }

    if (featured) {
      conditions.push(eq(products.isFeatured, true));
    }

    // İndirimli ürünler: comparePrice > price olan ürünler
    if (discounted) {
      conditions.push(isNotNull(products.comparePrice));
      conditions.push(sql`${products.comparePrice}::numeric > ${products.price}::numeric`);
    }

    // Arama: ürün adında veya açıklamasında arama (case-insensitive)
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      // SQL ile case-insensitive arama yapıyoruz
      conditions.push(
        sql`(
          LOWER(${products.name}::text) LIKE LOWER(${searchTerm}) 
          OR LOWER(COALESCE(${products.description}::text, '')) LIKE LOWER(${searchTerm})
          OR LOWER(COALESCE(${products.baseName}::text, '')) LIKE LOWER(${searchTerm})
        )`
      );
    }

          const baseSelect = {
            id: products.id,
            name: products.name,
            baseName: products.baseName,
            slug: products.slug,
            sku: products.sku,
            description: products.description,
            shortDescription: products.shortDescription,
            price: products.price,
            comparePrice: products.comparePrice,
            costPrice: products.costPrice,
            stock: products.stock,
            trackStock: products.trackStock,
            unit: products.unit,
            weight: products.weight,
            productGroup: products.productGroup,
            images: products.images,
            isActive: products.isActive,
            isFeatured: products.isFeatured,
            categoryId: products.categoryId,
            metaTitle: products.metaTitle,
            metaDescription: products.metaDescription,
            createdAt: products.createdAt,
            updatedAt: products.updatedAt,
            categoryName: categories.name,
            categorySlug: categories.slug,
          };

    let result;
    
    // Slug ile arama yapılıyorsa sadece 1 ürün getir
    if (slug) {
      if (conditions.length > 0) {
        result = await db
          .select(baseSelect)
          .from(products)
          .leftJoin(categories, eq(products.categoryId, categories.id))
          .where(and(...conditions))
          .limit(1);
      } else {
        result = await db
          .select(baseSelect)
          .from(products)
          .leftJoin(categories, eq(products.categoryId, categories.id))
          .where(eq(products.slug, slug))
          .limit(1);
      }
    }
    // Yeni ürünler için tarihe göre sıralama (en yeni önce)
    else if (newProducts) {
      if (conditions.length > 0) {
        result = await db
          .select(baseSelect)
          .from(products)
          .leftJoin(categories, eq(products.categoryId, categories.id))
          .where(and(...conditions))
          .orderBy(desc(products.createdAt))
          .limit(50);
      } else {
        result = await db
          .select(baseSelect)
          .from(products)
          .leftJoin(categories, eq(products.categoryId, categories.id))
          .orderBy(desc(products.createdAt))
          .limit(50);
      }
    } else if (adminView) {
      if (conditions.length > 0) {
        result = await db
          .select(baseSelect)
          .from(products)
          .leftJoin(categories, eq(products.categoryId, categories.id))
          .where(and(...conditions))
          .orderBy(products.id)
          .limit(1000);
      } else {
        result = await db
          .select(baseSelect)
          .from(products)
          .leftJoin(categories, eq(products.categoryId, categories.id))
          .orderBy(products.id)
          .limit(1000);
      }
    } else {
      if (conditions.length > 0) {
        result = await db
          .select(baseSelect)
          .from(products)
          .leftJoin(categories, eq(products.categoryId, categories.id))
          .where(and(...conditions))
          .orderBy(products.id)
          .limit(100);
      } else {
        result = await db
          .select(baseSelect)
          .from(products)
          .leftJoin(categories, eq(products.categoryId, categories.id))
          .orderBy(products.id)
          .limit(100);
      }
    }

    console.log(`Products API: Found ${result.length} products`);

    const formattedProducts = result.map((item: any) => ({
      ...item,
      category: item.categoryName ? {
        name: item.categoryName,
        slug: item.categorySlug,
      } : null,
    }));

    return NextResponse.json(formattedProducts);
  } catch (error: any) {
    console.error('Error fetching products:', error);
    console.error('Error stack:', error?.stack);
    return NextResponse.json(
      { error: 'Ürünler getirilemedi', details: error?.message },
      { status: 500 }
    );
  }
}
