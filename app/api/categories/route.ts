import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { categories } from '@/src/db/schema';
import { eq, desc, asc, sql } from 'drizzle-orm';

// Force dynamic rendering because we use request.url
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const adminView = searchParams.get('admin') === 'true';
    
    let result;
    
    if (!adminView) {
      result = await db.select()
        .from(categories)
        .where(eq(categories.isActive, true))
        .orderBy(asc(categories.sortOrder), asc(categories.name));
    } else {
      result = await db.select()
        .from(categories)
        .orderBy(asc(categories.sortOrder), asc(categories.name));
    }

    console.log(`Categories API (Drizzle): Found ${result.length} categories`);

    // Frontend'de 'order' olarak kullanılıyor, 'sortOrder' olarak map et
    const mappedResult = result.map(category => ({
      ...category,
      order: category.sortOrder || 0,
    }));

    return NextResponse.json(mappedResult);
  } catch (error: any) {
    console.error('Error fetching categories (Drizzle):', error);
    console.error('Error stack:', error?.stack);
    console.error('Error code:', error?.code);
    console.error('Error name:', error?.name);
    console.error('Error query:', error?.query);
    console.error('Error detail:', error?.detail);
    console.error('Error constraint:', error?.constraint);
    
    // Drizzle/postgres hataları farklı formatta olabilir
    const postgresError = error?.cause || error;
    const errorCode = postgresError?.code || error?.code;
    const errorMessage = postgresError?.message || error?.message || 'Bilinmeyen hata';
    const errorQuery = postgresError?.query || error?.query;
    const errorDetail = postgresError?.detail || error?.detail;
    
    // Daha detaylı hata mesajı
    let detailedMessage = errorMessage;
    if (errorQuery) {
      detailedMessage = `Failed query: ${errorQuery}`;
      if (errorDetail) {
        detailedMessage += `\nDetail: ${errorDetail}`;
      }
    } else if (errorCode === '42703') {
      detailedMessage = 'Kolon bulunamadı - Veritabanı şeması güncel değil';
    } else if (errorCode === '42P01') {
      detailedMessage = 'Tablo bulunamadı - categories tablosu mevcut değil';
    } else if (errorCode === '08006') {
      detailedMessage = 'Veritabanı bağlantı hatası - Connection string kontrol edin';
    }
    
    return NextResponse.json(
      { 
        error: 'Kategoriler getirilemedi',
        details: detailedMessage,
        code: errorCode,
        query: errorQuery || 'N/A',
        message: errorMessage
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, nameFr, nameEn, slug, description, sortOrder, isActive } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Kategori adı gerekli' },
        { status: 400 }
      );
    }

    const categorySlug = slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    // nameFr ve nameEn kolonları varsa ekle, yoksa sadece diğer kolonları ekle
    try {
      const newCategory = await db.execute(
        sql`INSERT INTO categories (name, name_fr, name_en, slug, description, sort_order, is_active) 
            VALUES (${name}, ${nameFr || null}, ${nameEn || null}, ${categorySlug}, ${description || null}, ${sortOrder || 0}, ${isActive ?? true}) 
            RETURNING *`
      ) as any;
      const category = Array.isArray(newCategory) ? newCategory[0] : (newCategory.rows ? newCategory.rows[0] : newCategory);
      return NextResponse.json({ ...category, order: (category as any).sort_order || 0 }, { status: 201 });
    } catch (insertError: any) {
      // Eğer name_fr veya name_en kolonları yoksa, sadece diğer kolonları ekle
      if (insertError?.code === '42703' || insertError?.message?.includes('name_fr') || insertError?.message?.includes('name_en')) {
        const newCategory = await db.insert(categories).values({
          name,
          slug: categorySlug,
          description: description || null,
          sortOrder: sortOrder || 0,
          isActive: isActive ?? true,
        }).returning();
        return NextResponse.json({ ...newCategory[0], order: newCategory[0].sortOrder || 0 }, { status: 201 });
      }
      throw insertError;
    }
  } catch (error: any) {
    console.error('Error creating category (Drizzle):', error);
    return NextResponse.json(
      { error: 'Kategori oluşturulurken hata oluştu', details: error?.message },
      { status: 500 }
    );
  }
}
