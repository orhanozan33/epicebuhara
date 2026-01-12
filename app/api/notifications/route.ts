import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { notifications } from '@/src/db/schema';
import { desc, eq, and } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    let query = db.select()
      .from(notifications)
      .orderBy(desc(notifications.createdAt))
      .limit(50);

    if (unreadOnly) {
      query = query.where(eq(notifications.isRead, false)) as any;
    }

    const notificationsList = await query;

    return NextResponse.json({ notifications: notificationsList });
  } catch (error: any) {
    console.error('Error fetching notifications (Drizzle):', error);
    return NextResponse.json(
      { error: 'Bildirimler getirilemedi', details: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, title, message, orderId } = body;

    if (!type || !title || !message) {
      return NextResponse.json(
        { error: 'Type, title ve message gerekli' },
        { status: 400 }
      );
    }

    const newNotification = await db.insert(notifications).values({
      type,
      title,
      message,
      orderId: orderId ? parseInt(orderId) : null,
      isRead: false,
    }).returning();

    return NextResponse.json(newNotification[0], { status: 201 });
  } catch (error: any) {
    console.error('Error creating notification (Drizzle):', error);
    return NextResponse.json(
      { error: 'Bildirim oluşturulurken hata oluştu', details: error?.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, isRead } = body;

    if (id === undefined || isRead === undefined) {
      return NextResponse.json(
        { error: 'ID ve isRead gerekli' },
        { status: 400 }
      );
    }

    await db.update(notifications)
      .set({ isRead })
      .where(eq(notifications.id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating notification (Drizzle):', error);
    return NextResponse.json(
      { error: 'Bildirim güncellenirken hata oluştu', details: error?.message },
      { status: 500 }
    );
  }
}
