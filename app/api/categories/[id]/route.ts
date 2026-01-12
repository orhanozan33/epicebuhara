import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { categories } from '@/src/db/schema';
import { eq } from 'drizzle-orm';

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

    await db.delete(categories).where(eq(categories.id, id));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting category (Drizzle):', error);
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

    const existingCategory = await db.select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);

    if (existingCategory.length === 0) {
      return NextResponse.json({ error: 'Kategori bulunamadı' }, { status: 404 });
    }

    const { name, slug, description, sortOrder, isActive } = body;
    
    const updateData: any = {};
    if (name !== undefined) {
      updateData.name = name;
      if (!slug) {
        updateData.slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      }
    }
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description || null;
    if (sortOrder !== undefined) updateData.sortOrder = parseInt(sortOrder) || 0;
    if (isActive !== undefined) updateData.isActive = isActive;
    updateData.updatedAt = new Date();

    const updatedCategory = await db.update(categories)
      .set(updateData)
      .where(eq(categories.id, id))
      .returning();

    return NextResponse.json(updatedCategory[0]);
  } catch (error: any) {
    console.error('Error updating category (Drizzle):', error);
    return NextResponse.json(
      { error: 'Kategori güncellenirken hata oluştu', details: error?.message },
      { status: 500 }
    );
  }
}
