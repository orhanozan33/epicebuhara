import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { categories } from '@/src/db/schema';
import { eq, desc, asc } from 'drizzle-orm';

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

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching categories (Drizzle):', error);
    console.error('Error stack:', error?.stack);
    console.error('Error code:', error?.code);
    console.error('Error name:', error?.name);
    
    const errorMessage = error?.message || 'Bilinmeyen hata';
    return NextResponse.json(
      { 
        error: 'Kategoriler getirilemedi',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, slug, description, sortOrder, isActive } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Kategori adı gerekli' },
        { status: 400 }
      );
    }

    const categorySlug = slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const newCategory = await db.insert(categories).values({
      name,
      slug: categorySlug,
      description: description || null,
      sortOrder: sortOrder || 0,
      isActive: isActive ?? true,
    }).returning();

    return NextResponse.json(newCategory[0], { status: 201 });
  } catch (error: any) {
    console.error('Error creating category (Drizzle):', error);
    return NextResponse.json(
      { error: 'Kategori oluşturulurken hata oluştu', details: error?.message },
      { status: 500 }
    );
  }
}
