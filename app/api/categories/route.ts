import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { categories } from '@/src/db/schema';
import { eq, asc } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const adminView = searchParams.get('admin') === 'true';
    
    let result;
    
    if (!adminView) {
      result = await db
        .select()
        .from(categories)
        .where(eq(categories.isActive, true))
        .orderBy(asc(categories.order), asc(categories.name));
    } else {
      result = await db
        .select()
        .from(categories)
        .orderBy(asc(categories.order), asc(categories.name));
    }

    console.log(`Categories API: Found ${result.length} categories`);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    console.error('Error stack:', error?.stack);
    return NextResponse.json(
      { error: 'Kategoriler getirilemedi', details: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, slug, description, order, isActive } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Kategori adı gerekli' },
        { status: 400 }
      );
    }

    const categorySlug = slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const [newCategory] = await db
      .insert(categories)
      .values({
        name,
        slug: categorySlug,
        description: description || null,
        order: order || 0,
        isActive: isActive ?? true,
      })
      .returning();

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Kategori oluşturulurken hata oluştu' },
      { status: 500 }
    );
  }
}
