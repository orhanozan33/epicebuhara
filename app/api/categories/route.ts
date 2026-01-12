import { NextResponse } from 'next/server';
import { getCategoryRepository } from '@/src/db/index.typeorm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const adminView = searchParams.get('admin') === 'true';
    
    const categoryRepo = await getCategoryRepository();
    
    let result;
    
    if (!adminView) {
      result = await categoryRepo.find({
        where: { isActive: true },
        order: { order: 'ASC', name: 'ASC' },
      });
    } else {
      result = await categoryRepo.find({
        order: { order: 'ASC', name: 'ASC' },
      });
    }

    console.log(`Categories API (TypeORM): Found ${result.length} categories`);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching categories (TypeORM):', error);
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
    const { name, slug, description, order, isActive } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Kategori adı gerekli' },
        { status: 400 }
      );
    }

    const categoryRepo = await getCategoryRepository();
    const categorySlug = slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const newCategory = categoryRepo.create({
      name,
      slug: categorySlug,
      description: description || null,
      order: order || 0,
      isActive: isActive ?? true,
    });

    const savedCategory = await categoryRepo.save(newCategory);

    return NextResponse.json(savedCategory, { status: 201 });
  } catch (error: any) {
    console.error('Error creating category (TypeORM):', error);
    return NextResponse.json(
      { error: 'Kategori oluşturulurken hata oluştu', details: error?.message },
      { status: 500 }
    );
  }
}
