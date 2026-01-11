import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { notifications } from '@/src/db/schema';
import { desc, eq } from 'drizzle-orm';

// Bildirimleri getir
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    let query = db.select().from(notifications);

    if (unreadOnly) {
      query = query.where(eq(notifications.isRead, false)) as any;
    }

    const allNotifications = await query.orderBy(desc(notifications.createdAt)).limit(50);

    return NextResponse.json({ notifications: allNotifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Bildirimler getirilirken hata oluştu' },
      { status: 500 }
    );
  }
}

// Bildirimi okundu olarak işaretle
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, isRead } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Bildirim ID gerekli' },
        { status: 400 }
      );
    }

    await db
      .update(notifications)
      .set({ isRead: isRead ?? true })
      .where(eq(notifications.id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: 'Bildirim güncellenirken hata oluştu' },
      { status: 500 }
    );
  }
}
