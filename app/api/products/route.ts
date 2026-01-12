import { NextResponse } from 'next/server';
import { getProductRepository, getCategoryRepository } from '@/src/db/index.typeorm';

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

    const productRepo = await getProductRepository();
    const newProduct = productRepo.create({
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
    });

    const savedProduct = await productRepo.save(newProduct);

    return NextResponse.json(savedProduct, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product (TypeORM):', error);
    return NextResponse.json(
      { error: 'Ürün oluşturulurken hata oluştu', details: error?.message },
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

    const productRepo = await getProductRepository();
    const queryBuilder = productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category');

    // Filtreler
    if (!adminView) {
      queryBuilder.andWhere('product.isActive = :isActive', { isActive: true });
    }

    if (slug) {
      queryBuilder.andWhere('product.slug = :slug', { slug });
    }

    if (categoryId) {
      queryBuilder.andWhere('product.categoryId = :categoryId', { categoryId: parseInt(categoryId) });
    }

    if (featured) {
      queryBuilder.andWhere('product.isFeatured = :isFeatured', { isFeatured: true });
    }

    if (discounted) {
      queryBuilder.andWhere('product.comparePrice IS NOT NULL');
      queryBuilder.andWhere('CAST(product.comparePrice AS DECIMAL) > CAST(product.price AS DECIMAL)');
    }

    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      queryBuilder.andWhere(
        '(LOWER(product.name) LIKE LOWER(:searchTerm) OR LOWER(COALESCE(product.description, \'\')) LIKE LOWER(:searchTerm) OR LOWER(COALESCE(product.baseName, \'\')) LIKE LOWER(:searchTerm))',
        { searchTerm }
      );
    }

    // Sıralama ve limit
    if (slug) {
      queryBuilder.limit(1);
    } else if (newProducts) {
      queryBuilder.orderBy('product.createdAt', 'DESC').limit(50);
    } else if (adminView) {
      queryBuilder.orderBy('product.id', 'ASC').limit(1000);
    } else {
      queryBuilder.orderBy('product.id', 'ASC').limit(100);
    }

    const products = await queryBuilder.getMany();

    // Fetch categories separately and create a map
    const categoryRepo = await getCategoryRepository();
    const categories = await categoryRepo.find();
    const categoryMap = new Map(categories.map((cat: any) => [cat.id, cat]));

    // Format response (category bilgilerini düzenle)
    const formattedProducts = products.map((product) => {
      const category = product.categoryId ? categoryMap.get(product.categoryId) : null;
      return {
        id: product.id,
        name: product.name,
        baseName: product.baseName,
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
          slug: category.slug,
        } : null,
        categoryName: category?.name || null,
        categorySlug: category?.slug || null,
      };
    });

    console.log(`Products API (TypeORM): Found ${formattedProducts.length} products`);

    return NextResponse.json(formattedProducts);
  } catch (error: any) {
    console.error('Error fetching products (TypeORM):', error);
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
