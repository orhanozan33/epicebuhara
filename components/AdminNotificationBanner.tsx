'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  orderId: number | null;
  isRead: boolean;
  createdAt: string;
}

export function AdminNotificationBanner() {
  const [mounted, setMounted] = useState(false);
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Her 5 saniyede bir bildirimleri güncelle
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  // Mevcut bildirimi otomatik olarak kaydır
  useEffect(() => {
    if (notifications.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % notifications.length);
      }, 5000); // Her 5 saniyede bir değiştir
      return () => clearInterval(interval);
    }
  }, [notifications.length]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications?unreadOnly=true');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isRead: true }),
      });
      fetchNotifications(); // Bildirimleri yeniden yükle
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const currentNotification = notifications[currentIndex];

  if (!currentNotification) {
    return null;
  }

  const getTypeLabel = (type: string) => {
    if (!mounted) return type === 'siparis' ? 'Sipariş' : 'Mesaj';
    return type === 'siparis' ? t('admin.notifications.order') : t('admin.notifications.message');
  };

  const getTypeColor = (type: string) => {
    return type === 'siparis' ? 'bg-green-600' : 'bg-blue-600';
  };

  return (
    <div className={`${getTypeColor(currentNotification.type)} text-white py-[0.6rem] lg:py-3 px-2 lg:px-4 relative`} style={{ maxWidth: '100vw', overflowX: 'hidden', width: '100%', boxSizing: 'border-box' }}>
      <div className="w-full flex items-center justify-between" style={{ maxWidth: '100%', width: '100%', boxSizing: 'border-box', paddingLeft: '0.5rem', paddingRight: '0.5rem' }}>
        <div className="flex items-center gap-2 lg:gap-4 flex-1 min-w-0">
          <span className="font-bold text-xs lg:text-sm whitespace-nowrap">
            {getTypeLabel(currentNotification.type)}:
          </span>
          <div className="flex-1 overflow-hidden">
            <div className="whitespace-nowrap animate-scroll text-xs lg:text-sm">
              <span className="font-medium">
                {mounted && currentNotification.title === 'Yeni Sipariş' 
                  ? t('admin.notifications.newOrder')
                  : currentNotification.title} - 
              </span>
              <span>
                {(() => {
                  if (!mounted) return currentNotification.message;
                  // "Yeni sipariş: ORD-000007 - Orhan Şimşek - Toplam: $17.46" formatını parse et
                  const message = currentNotification.message;
                  const match = message.match(/^Yeni sipariş:\s*(.+?)\s*-\s*(.+?)\s*-\s*Toplam:\s*\$(.+)$/);
                  if (match) {
                    const [, orderNumber, customerName, total] = match;
                    return t('admin.notifications.newOrderMessage', {
                      orderNumber,
                      customerName,
                      total,
                    });
                  }
                  // Eğer format eşleşmezse orijinal mesajı göster
                  return message;
                })()}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 lg:gap-2 ml-2 lg:ml-4">
          {currentNotification.orderId && (
            <Link
              href={`/admin-panel/orders/${currentNotification.orderId}`}
              className="px-2 py-0.5 lg:px-3 lg:py-1 bg-white/20 hover:bg-white/30 rounded text-xs lg:text-sm font-medium transition-colors whitespace-nowrap"
              onClick={(e) => {
                try {
                  markAsRead(currentNotification.id);
                } catch (error) {
                  console.error('Error marking notification as read:', error);
                }
              }}
            >
              {mounted ? t('admin.common.view') : 'Detay'}
            </Link>
          )}
          <button
            type="button"
            onClick={(e) => {
              try {
                e.preventDefault();
                e.stopPropagation();
                markAsRead(currentNotification.id);
              } catch (error) {
                console.error('Error marking notification as read:', error);
              }
            }}
            className="px-2 py-0.5 lg:px-3 lg:py-1 bg-white/20 hover:bg-white/30 rounded text-xs lg:text-sm font-medium transition-colors whitespace-nowrap"
          >
            ✕
          </button>
          {notifications.length > 1 && (
            <div className="flex gap-1 ml-2">
              {notifications.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                  aria-label={mounted ? t('admin.notifications.notificationLabel', { number: index + 1 }) : `Bildirim ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
