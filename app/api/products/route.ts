import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { products, categories } from '@/src/db/schema';
import { eq, and, or, isNotNull, desc, asc, like, sql } from 'drizzle-orm';

// Force dynamic rendering because we use request.url
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, nameFr, nameEn, baseName, baseNameFr, baseNameEn, sku, price, comparePrice, stock, weight, unit, productGroup, categoryId, isActive, description, images } = body;

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

    // nameFr ve nameEn kolonları varsa ekle, yoksa sadece diğer kolonları ekle
    try {
      const newProduct = await db.execute(
        sql`INSERT INTO products (name, name_fr, name_en, base_name, base_name_fr, base_name_en, slug, sku, price, compare_price, stock, weight, unit, product_group, category_id, is_active, description, images, track_stock) 
            VALUES (${name}, ${nameFr || null}, ${nameEn || null}, ${baseName || null}, ${baseNameFr || null}, ${baseNameEn || null}, ${slug}, ${sku || null}, ${price.toString()}, ${comparePrice ? comparePrice.toString() : null}, ${stock || 0}, ${weight || null}, ${unit || 'Gr'}, ${productGroup || null}, ${categoryId ? parseInt(categoryId) : null}, ${isActive ?? true}, ${description || null}, ${images || null}, true) 
            RETURNING *`
      ) as any;
      const product = Array.isArray(newProduct) ? newProduct[0] : (newProduct.rows ? newProduct.rows[0] : newProduct);
      return NextResponse.json(product, { status: 201 });
    } catch (insertError: any) {
      // Eğer name_fr veya name_en kolonları yoksa, sadece diğer kolonları ekle
      if (insertError?.code === '42703' || insertError?.message?.includes('name_fr') || insertError?.message?.includes('name_en')) {
        const newProduct = await db.insert(products).values({
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
        }).returning();
        return NextResponse.json(newProduct[0], { status: 201 });
      }
      throw insertError;
    }
  } catch (error: any) {
    console.error('Error creating product (Drizzle):', error);
    console.error('Error stack:', error?.stack);
    console.error('Error code:', error?.code);
    console.error('Error query:', error?.query);
    
    // Daha detaylı hata mesajı
    let errorMessage = error?.message || 'Bilinmeyen hata';
    if (error?.code === '42703') {
      errorMessage = 'Kolon bulunamadı - Veritabanı şeması güncel değil';
    } else if (error?.code === '42P01') {
      errorMessage = 'Tablo bulunamadı - products tablosu mevcut değil';
    } else if (error?.code === '23505') {
      errorMessage = 'Bu ürün zaten mevcut (duplicate key)';
    }
    
    return NextResponse.json(
      { 
        error: 'Ürün oluşturulurken hata oluştu', 
        details: errorMessage,
        code: error?.code,
        query: error?.query || 'N/A'
      },
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
    const slug = searchParams.get('slug');
    const adminView = searchParams.get('admin') === 'true';

    // Build where conditions
    const conditions = [];

    if (!adminView) {
      conditions.push(eq(products.isActive, true));
    }

    if (slug) {
      conditions.push(eq(products.slug, slug));
    }

    if (categoryId) {
      conditions.push(eq(products.categoryId, parseInt(categoryId)));
    }

    if (featured) {
      conditions.push(eq(products.isFeatured, true));
    }

    if (discounted) {
      conditions.push(isNotNull(products.comparePrice));
      conditions.push(sql`CAST(${products.comparePrice} AS DECIMAL) > CAST(${products.price} AS DECIMAL)`);
    }

    if (search && search.trim()) {
      const searchTerm = `%${search.trim().toLowerCase()}%`;
      conditions.push(
        or(
          like(sql`LOWER(${products.name})`, searchTerm),
          like(sql`LOWER(COALESCE(${products.description}, ''))`, searchTerm),
          like(sql`LOWER(COALESCE(${products.baseName}, ''))`, searchTerm)
        )!
      );
    }

    let query = db.select().from(products);

    if (conditions.length > 0) {
      query = query.where(and(...conditions)!) as any;
    }

    // Apply ordering and limit
    if (slug) {
      query = query.limit(1) as any;
    } else if (newProducts) {
      query = query.orderBy(desc(products.createdAt)).limit(50) as any;
    } else if (adminView) {
      query = query.orderBy(asc(products.id)).limit(1000) as any;
    } else {
      query = query.orderBy(asc(products.id)).limit(100) as any;
    }

    const productResults = await query;

    // Fetch categories separately and create a map
    const allCategories = await db.select().from(categories);
    const categoryMap = new Map(allCategories.map((cat) => [cat.id, cat]));

    // Kategoriler için name_fr ve name_en kolonlarını manuel olarak çek
    const categoryIds = Array.from(new Set(productResults.filter(p => p.categoryId).map(p => p.categoryId!)));
    let categoryNameFrEnMap = new Map<number, { nameFr: string | null, nameEn: string | null }>();
    
    if (categoryIds.length > 0) {
      try {
        // Her kategori için ayrı sorgu yap
        for (const categoryId of categoryIds) {
          try {
            const categoryNameFrEnResult = await db.execute(
              sql`SELECT name_fr, name_en FROM categories WHERE id = ${categoryId}`
            ) as any;
            
            const result = Array.isArray(categoryNameFrEnResult) ? categoryNameFrEnResult[0] : (categoryNameFrEnResult.rows ? categoryNameFrEnResult.rows[0] : categoryNameFrEnResult);
            if (result) {
              categoryNameFrEnMap.set(categoryId, {
                nameFr: result.name_fr || null,
                nameEn: result.name_en || null,
              });
            }
          } catch (singleErr: any) {
            // Tek kategori için hata varsa, null kullan
          }
        }
      } catch (err: any) {
        // Genel hata varsa, boş map kullan
        console.log('Category name_fr and name_en columns not found or error:', err?.message);
      }
    }

    // name_fr, name_en, base_name_fr, base_name_en kolonlarını manuel olarak çek
    const productIds = productResults.map(p => p.id);
    let nameFrEnMap = new Map<number, { nameFr: string | null, nameEn: string | null, baseNameFr: string | null, baseNameEn: string | null }>();
    
    if (productIds.length > 0) {
      try {
        // Her ürün için ayrı sorgu yap (daha güvenli ve çalışır)
        for (const productId of productIds) {
          try {
            const nameFrEnResult = await db.execute(
              sql`SELECT name_fr, name_en, base_name_fr, base_name_en FROM products WHERE id = ${productId}`
            ) as any;
            
            const result = Array.isArray(nameFrEnResult) ? nameFrEnResult[0] : (nameFrEnResult.rows ? nameFrEnResult.rows[0] : nameFrEnResult);
            if (result) {
              nameFrEnMap.set(productId, {
                nameFr: result.name_fr || null,
                nameEn: result.name_en || null,
                baseNameFr: result.base_name_fr || null,
                baseNameEn: result.base_name_en || null,
              });
            }
          } catch (singleErr: any) {
            // Tek ürün için hata varsa, null kullan
            // console.log(`Error fetching nameFr/nameEn/baseNameFr/baseNameEn for product ${productId}:`, singleErr?.message);
          }
        }
      } catch (err: any) {
        // Genel hata varsa, boş map kullan
        console.log('name_fr, name_en, base_name_fr, base_name_en columns not found or error:', err?.message);
      }
    }

    // Format response (category bilgilerini düzenle)
    const formattedProducts = productResults.map((product) => {
      const category = product.categoryId ? categoryMap.get(product.categoryId) : null;
      const nameFrEn = nameFrEnMap.get(product.id) || { nameFr: null, nameEn: null, baseNameFr: null, baseNameEn: null };
      const categoryNameFrEn = category && product.categoryId ? categoryNameFrEnMap.get(product.categoryId) || { nameFr: null, nameEn: null } : { nameFr: null, nameEn: null };
      
      return {
        id: product.id,
        name: product.name,
        nameFr: nameFrEn.nameFr,
        nameEn: nameFrEn.nameEn,
        baseName: product.baseName,
        baseNameFr: nameFrEn.baseNameFr,
        baseNameEn: nameFrEn.baseNameEn,
        slug: product.slug,
        sku: product.sku,
        description: product.description,
        shortDescription: product.shortDescription,
        price: product.price,
        comparePrice: product.comparePrice,
        costPrice: product.costPrice,
        stock: product.stock,
        trackStock: product.trackStock,
        unit: product.unit,
        weight: product.weight,
        productGroup: product.productGroup,
        images: product.images,
        isActive: product.isActive,
        isFeatured: product.isFeatured,
        categoryId: product.categoryId,
        metaTitle: product.metaTitle,
        metaDescription: product.metaDescription,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        category: category ? {
          name: category.name,
          nameFr: categoryNameFrEn.nameFr,
          nameEn: categoryNameFrEn.nameEn,
          slug: category.slug,
        } : null,
        categoryName: category?.name || null,
        categoryNameFr: categoryNameFrEn.nameFr,
        categoryNameEn: categoryNameFrEn.nameEn,
        categorySlug: category?.slug || null,
      };
    });

    console.log(`Products API (Drizzle): Found ${formattedProducts.length} products`);

    return NextResponse.json(formattedProducts);
  } catch (error: any) {
    console.error('Error fetching products (Drizzle):', error);
    console.error('Error stack:', error?.stack);
    
    return NextResponse.json(
      { 
        error: 'Ürünler getirilemedi',
        details: error?.message || 'Bilinmeyen hata'
      },
      { status: 500 }
    );
  }
}
