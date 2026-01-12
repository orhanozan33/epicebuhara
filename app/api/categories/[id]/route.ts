import { NextResponse } from 'next/server';
import { getCategoryRepository } from '@/src/db/index.typeorm';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'Geçersiz kategori ID' }, { status: 400 });
    }

    const categoryRepo = await getCategoryRepository();
    await categoryRepo.delete(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting category (TypeORM):', error);
    return NextResponse.json(
      { error: 'Kategori silinirken hata oluştu', details: error?.message },
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
      return NextResponse.json({ error: 'Geçersiz kategori ID' }, { status: 400 });
    }

    const categoryRepo = await getCategoryRepository();
    const category = await categoryRepo.findOne({ where: { id } });

    if (!category) {
      return NextResponse.json({ error: 'Kategori bulunamadı' }, { status: 404 });
    }

    const { name, slug, description, order, isActive } = body;
    
    if (name) {
      category.name = name;
      if (!slug) {
        category.slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      }
    }
    if (slug !== undefined) category.slug = slug;
    if (description !== undefined) category.description = description || null;
    if (order !== undefined) category.order = parseInt(order) || 0;
    if (isActive !== undefined) category.isActive = isActive;

    await categoryRepo.save(category);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating category (TypeORM):', error);
    return NextResponse.json(
      { error: 'Kategori güncellenirken hata oluştu', details: error?.message },
      { status: 500 }
    );
  }
}
