import { NextResponse } from 'next/server';
import { getNotificationRepository } from '@/src/db/index.typeorm';

// Bildirimleri getir
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const notificationRepo = await getNotificationRepository();
    
    const findOptions: any = {
      order: { createdAt: 'DESC' },
      take: 50,
    };

    if (unreadOnly) {
      findOptions.where = { isRead: false };
    }

    const allNotifications = await notificationRepo.find(findOptions);

    return NextResponse.json({ notifications: allNotifications });
  } catch (error: any) {
    console.error('Error fetching notifications (TypeORM):', error);
    return NextResponse.json(
      { error: 'Bildirimler getirilirken hata oluştu', details: error?.message },
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

    const notificationRepo = await getNotificationRepository();
    const notification = await notificationRepo.findOne({ where: { id: parseInt(id) } });

    if (!notification) {
      return NextResponse.json({ error: 'Bildirim bulunamadı' }, { status: 404 });
    }

    notification.isRead = isRead ?? true;
    await notificationRepo.save(notification);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating notification (TypeORM):', error);
    return NextResponse.json(
      { error: 'Bildirim güncellenirken hata oluştu', details: error?.message },
      { status: 500 }
    );
  }
}
