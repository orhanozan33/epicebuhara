import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { categories } from '@/src/db/schema';
import { eq, sql } from 'drizzle-orm';

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

    const { name, nameFr, nameEn, slug, description, sortOrder, isActive } = body;
    
    const updateData: any = {};
    if (name !== undefined) {
      updateData.name = name;
      if (!slug) {
        updateData.slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      }
    }
    // nameFr ve nameEn kolonları varsa güncelle, yoksa atla
    const hasNameFr = nameFr !== undefined;
    const hasNameEn = nameEn !== undefined;
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description || null;
    if (sortOrder !== undefined) updateData.sortOrder = parseInt(sortOrder) || 0;
    if (isActive !== undefined) updateData.isActive = isActive;
    updateData.updatedAt = new Date();

    // nameFr ve nameEn kolonları varsa güncelle, yoksa sadece diğer kolonları güncelle
    try {
      // Önce nameFr ve nameEn ile birlikte güncellemeyi dene
      if (hasNameFr || hasNameEn) {
        const updateFields: string[] = [];
        const updateValues: any[] = [];
        
        Object.keys(updateData).forEach((key) => {
          if (key !== 'nameFr' && key !== 'nameEn') {
            const dbKey = key === 'sortOrder' ? 'sort_order' : key === 'isActive' ? 'is_active' : key === 'updatedAt' ? 'updated_at' : key;
            updateFields.push(`${dbKey} = $${updateFields.length + 1}`);
            updateValues.push(updateData[key as keyof typeof updateData]);
          }
        });
        
        if (hasNameFr) {
          updateFields.push(`name_fr = $${updateFields.length + 1}`);
          updateValues.push(nameFr || null);
        }
        if (hasNameEn) {
          updateFields.push(`name_en = $${updateFields.length + 1}`);
          updateValues.push(nameEn || null);
        }
        
        updateValues.push(id);
        
        const result = await db.execute(
          sql.raw(`UPDATE categories SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = $${updateValues.length} RETURNING *`)
        ) as any;
        
        const updatedCategory = Array.isArray(result) ? result[0] : (result.rows ? result.rows[0] : result);
        return NextResponse.json({ 
          ...updatedCategory, 
          nameFr: (updatedCategory as any).name_fr || null,
          nameEn: (updatedCategory as any).name_en || null,
          order: (updatedCategory as any).sort_order || 0 
        });
      } else {
        const updatedCategory = await db.update(categories)
          .set(updateData)
          .where(eq(categories.id, id))
          .returning();
        
        // nameFr ve nameEn'i manuel olarak çek
        let nameFrEn = { nameFr: null as string | null, nameEn: null as string | null };
        try {
          const nameFrEnResult = await db.execute(
            sql`SELECT name_fr, name_en FROM categories WHERE id = ${id}`
          ) as any;
          const result = Array.isArray(nameFrEnResult) ? nameFrEnResult[0] : (nameFrEnResult.rows ? nameFrEnResult.rows[0] : nameFrEnResult);
          if (result) {
            nameFrEn = {
              nameFr: result.name_fr || null,
              nameEn: result.name_en || null,
            };
          }
        } catch (err: any) {
          // Kolonlar yoksa, null kullan
        }
        
        const mappedCategory = {
          ...updatedCategory[0],
          nameFr: nameFrEn.nameFr,
          nameEn: nameFrEn.nameEn,
          order: updatedCategory[0].sortOrder || 0,
        };
        return NextResponse.json(mappedCategory);
      }
    } catch (updateError: any) {
      // Eğer name_fr veya name_en kolonları yoksa, sadece diğer kolonları güncelle
      if (updateError?.code === '42703' || updateError?.message?.includes('name_fr') || updateError?.message?.includes('name_en')) {
        // nameFr ve nameEn'i updateData'dan çıkar
        const { nameFr: _, nameEn: __, ...restUpdateData } = updateData as any;
        const updatedCategory = await db.update(categories)
          .set(restUpdateData)
          .where(eq(categories.id, id))
          .returning();
        
        const mappedCategory = {
          ...updatedCategory[0],
          nameFr: null,
          nameEn: null,
          order: updatedCategory[0].sortOrder || 0,
        };
        return NextResponse.json(mappedCategory);
      }
      throw updateError;
    }
  } catch (error: any) {
    console.error('Error updating category (Drizzle):', error);
    return NextResponse.json(
      { error: 'Kategori güncellenirken hata oluştu', details: error?.message },
      { status: 500 }
    );
  }
}
