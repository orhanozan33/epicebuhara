import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { products, categories, stockSettings } from '@/src/db/schema';
import { asc, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Ana sorgu: sadece her ortamda kesin var olan kolonlar (pack_label_en/fr yoksa select patlamasın diye ayrı denenecek)
    const [productsList, settingsRows] = await Promise.all([
      db
        .select({
          id: products.id,
          name: products.name,
          baseName: products.baseName,
          slug: products.slug,
          stock: products.stock,
          packSize: products.packSize,
          categoryId: products.categoryId,
          isActive: products.isActive,
          packLabelTr: products.packLabelTr,
        })
        .from(products)
        .orderBy(asc(products.id)),
      db.select().from(stockSettings).limit(1),
    ]);

    const threshold =
      settingsRows.length > 0 && settingsRows[0].lowStockThresholdBoxes != null
        ? settingsRows[0].lowStockThresholdBoxes
        : 10;

    const categoryIds = [...new Set(productsList.map((p) => p.categoryId).filter(Boolean))] as number[];
    const categoriesList =
      categoryIds.length > 0
        ? await db.select({ id: categories.id, name: categories.name }).from(categories)
        : [];
    const categoryMap = new Map(categoriesList.map((c) => [c.id, c.name]));

    // Çokdilli veriler tek sorguda (kolon yoksa hata vermez, sadece map boş kalır)
    const categoryNameFrEnMap = new Map<number, { nameFr: string | null; nameEn: string | null }>();
    const productNameFrEnMap = new Map<number, { baseNameFr: string | null; baseNameEn: string | null }>();
    const packLabelMap = new Map<number, { packLabelEn: string | null; packLabelFr: string | null }>();

    try {
      if (categoryIds.length > 0) {
        const catRows = await db.execute(
          sql`SELECT id, name_fr, name_en FROM categories WHERE id IN (${sql.join(categoryIds.map((id) => sql`${id}`), sql`, `)})`
        );
        const catArr = Array.isArray(catRows) ? catRows : (catRows as { rows?: unknown[] })?.rows ?? [];
        for (const row of catArr) {
          const r = row as { id: number; name_fr?: string | null; name_en?: string | null };
          if (r && typeof r.id !== 'undefined') {
            categoryNameFrEnMap.set(Number(r.id), {
              nameFr: r.name_fr ?? null,
              nameEn: r.name_en ?? null,
            });
          }
        }
      }
    } catch {
      // name_fr / name_en kolonları yoksa atla
    }

    const productIds = productsList.map((p) => p.id);
    if (productIds.length > 0) {
      // Önce sadece base_name_fr/en dene (pack_label kolonları her ortamda olmayabilir)
      try {
        const prodRows = await db.execute(
          sql`SELECT id, base_name_fr, base_name_en FROM products WHERE id IN (${sql.join(productIds.map((id) => sql`${id}`), sql`, `)})`
        );
        const prodArr = Array.isArray(prodRows) ? prodRows : (prodRows as { rows?: unknown[] })?.rows ?? [];
        for (const row of prodArr) {
          const r = row as { id: number; base_name_fr?: string | null; base_name_en?: string | null };
          if (r && typeof r.id !== 'undefined') {
            productNameFrEnMap.set(Number(r.id), {
              baseNameFr: r.base_name_fr ?? null,
              baseNameEn: r.base_name_en ?? null,
            });
          }
        }
      } catch {
        // base_name_fr/en kolonları yoksa atla
      }
      // pack_label_en/fr ayrı dene (kolon yoksa tek sorgu patlamasın diye)
      try {
        const packRows = await db.execute(
          sql`SELECT id, pack_label_en, pack_label_fr FROM products WHERE id IN (${sql.join(productIds.map((id) => sql`${id}`), sql`, `)})`
        );
        const packArr = Array.isArray(packRows) ? packRows : (packRows as { rows?: unknown[] })?.rows ?? [];
        for (const row of packArr) {
          const r = row as { id: number; pack_label_en?: string | null; pack_label_fr?: string | null };
          if (r && typeof r.id !== 'undefined') {
            packLabelMap.set(Number(r.id), {
              packLabelEn: r.pack_label_en ?? null,
              packLabelFr: r.pack_label_fr ?? null,
            });
          }
        }
      } catch {
        // pack_label_en/fr yoksa atla
      }
    }

    // Stok artık kutu cinsinden saklanıyor (stock = kutu sayısı)
    const list = productsList.map((p) => {
      const stockBoxes = p.stock ?? 0;
      const packSize = p.packSize ?? 1;
      const stockUnits = stockBoxes * packSize;
      const isLowStock = stockBoxes < threshold;
      const catFrEn = p.categoryId ? categoryNameFrEnMap.get(p.categoryId) : null;
      const prodFrEn = productNameFrEnMap.get(p.id);
      const packLabels = packLabelMap.get(p.id);
      return {
        id: p.id,
        name: p.name,
        baseName: p.baseName,
        baseNameFr: prodFrEn?.baseNameFr ?? null,
        baseNameEn: prodFrEn?.baseNameEn ?? null,
        slug: p.slug,
        stockUnits,
        packSize,
        stockBoxes,
        isLowStock,
        categoryId: p.categoryId,
        categoryName: (p.categoryId && categoryMap.get(p.categoryId)) || null,
        categoryNameFr: catFrEn?.nameFr ?? null,
        categoryNameEn: catFrEn?.nameEn ?? null,
        isActive: p.isActive,
        packLabelTr: p.packLabelTr,
        packLabelEn: packLabels?.packLabelEn ?? null,
        packLabelFr: packLabels?.packLabelFr ?? null,
      };
    });

    const lowStockCount = list.filter((p) => p.isLowStock).length;

    return NextResponse.json({
      products: list,
      lowStockThresholdBoxes: threshold,
      lowStockCount,
    });
  } catch (err: unknown) {
    console.error('Admin stock GET:', err);
    return NextResponse.json(
      { error: 'Stok listesi getirilemedi' },
      { status: 500 }
    );
  }
}
