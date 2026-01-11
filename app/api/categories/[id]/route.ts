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
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Kategori silinirken hata oluştu' },
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

    const { name, slug, description, order, isActive } = body;
    
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (name) {
      updateData.name = name;
      if (!slug) {
        updateData.slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      }
    }
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description || null;
    if (order !== undefined) updateData.order = parseInt(order) || 0;
    if (isActive !== undefined) updateData.isActive = isActive;

    await db
      .update(categories)
      .set(updateData)
      .where(eq(categories.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: 'Kategori güncellenirken hata oluştu' },
      { status: 500 }
    );
  }
}
