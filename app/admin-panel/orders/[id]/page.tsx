'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { showToast } from '@/components/Toast';
import { getProductImageSrc } from '@/lib/imageUrl';

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  subtotal: string;
  tax: string;
  shipping: string;
  discount: string;
  total: string;
  currency: string;
  shippingName: string | null;
  shippingPhone: string | null;
  shippingEmail: string | null;
  shippingAddress: string | null;
  shippingProvince: string | null;
  shippingCity: string | null;
  createdAt: string;
  updatedAt: string;
}

interface OrderItem {
  id: number;
  productId: number;
  quantity: number;
  price: string;
  total: string;
  product: {
    id: number;
    name: string;
    baseName: string | null;
    baseNameFr?: string | null;
    baseNameEn?: string | null;
    images: string | null;
  } | null;
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [mounted, setMounted] = useState(false);
  
  const lang = (mounted && i18n?.language ? i18n.language.split('-')[0] : 'fr') as 'tr' | 'fr' | 'en';
  const getLocale = () => {
    const localeMap: Record<string, string> = {
      'tr': 'tr-TR',
      'fr': 'fr-CA',
      'en': 'en-CA',
    };
    return localeMap[lang] || 'fr-CA';
  };
  const getProductDisplayName = (p: OrderItem['product']) => {
    if (!p) return '';
    if (lang === 'fr') return p.baseNameFr || p.baseNameEn || p.baseName || p.name;
    if (lang === 'en') return p.baseNameEn || p.baseNameFr || p.baseName || p.name;
    return p.baseName || p.name;
  };
  const orderId = params?.id ? parseInt(params.id as string) : null;

  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchOrderDetails = async () => {
    if (!orderId) return;

    try {
      setLoading(true);
      // Önce sipariş listesinden bul
      const response = await fetch('/api/orders/list');
      if (response.ok) {
        const data = await response.json();
        const foundOrder = data.orders?.find((o: Order) => o.id === orderId);
        if (foundOrder) {
          setOrder(foundOrder);
          // Sipariş öğelerini getir (orderNumber ile)
          const itemsResponse = await fetch(`/api/orders?orderNumber=${encodeURIComponent(foundOrder.orderNumber)}`);
          if (itemsResponse.ok) {
            const itemsData = await itemsResponse.json();
            setItems(itemsData.items || []);
          }
        } else {
          showToast(mounted ? t('admin.orders.orderNotFound') : 'Sipariş bulunamadı', 'error');
          router.push('/admin-panel/orders');
        }
      } else {
        showToast(mounted ? t('admin.orders.fetchError') : 'Sipariş bilgileri getirilirken hata oluştu', 'error');
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      showToast(mounted ? t('admin.orders.fetchError') : 'Sipariş bilgileri getirilirken hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const handleStatusChange = async (newStatus: string) => {
    if (!orderId) return;

    try {
      setUpdatingStatus(true);
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        showToast(mounted ? t('admin.orders.statusUpdated') : 'Sipariş durumu başarıyla güncellendi!', 'success');
        await fetchOrderDetails();
      } else {
        const error = await response.json();
        showToast(error.error || (mounted ? t('admin.common.error') : 'Durum güncellenirken hata oluştu'), 'error');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      showToast(mounted ? t('admin.common.error') : 'Durum güncellenirken hata oluştu', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING':
        return mounted ? t('admin.orders.pending') : 'Beklemede';
      case 'APPROVED':
        return mounted ? t('admin.orders.approved') : 'Onaylandı';
      case 'SHIPPED':
        return mounted ? t('admin.orders.shipped') : 'Gönderildi';
      case 'CANCELLED':
        return mounted ? t('admin.orders.cancelled') : 'İptal';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'SHIPPED':
        return 'bg-blue-100 text-blue-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">{mounted ? t('admin.common.loading') : 'Yükleniyor...'}</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">{mounted ? t('admin.orders.orderNotFound') : 'Sipariş bulunamadı'}</div>
        <div className="text-center mt-4">
          <Link
            href="/admin-panel/orders"
            className="text-[#E91E63] hover:text-[#C2185B]"
          >
            {mounted ? t('admin.orders.backToList') : 'Siparişler Listesine Dön'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Başlık ve Geri Dön */}
      <div className="mb-6">
        <Link
          href="/admin-panel/orders"
          className="text-[#E91E63] hover:text-[#C2185B] mb-4 inline-block"
        >
          ← {mounted ? t('admin.orders.backToList') : 'Siparişler Listesine Dön'}
        </Link>
        <div className="flex items-center justify-between mt-4">
          <h1 className="text-3xl font-bold text-gray-900">{mounted ? t('admin.orders.orderDetails') : 'Sipariş Detayları'}</h1>
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
            {getStatusLabel(order.status)}
          </span>
        </div>
      </div>

      {/* Sipariş Bilgileri */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">{mounted ? t('admin.orders.orderNumber') : 'Sipariş Numarası'}</p>
            <p className="text-lg font-semibold text-gray-900">{order.orderNumber}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">{mounted ? t('admin.orders.date') : 'Sipariş Tarihi'}</p>
            <p className="text-lg font-semibold text-gray-900">
              {new Date(order.createdAt).toLocaleDateString(getLocale(), {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">{mounted ? t('admin.orders.status') : 'Durum'}</p>
            <select
              value={order.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={updatingStatus}
              className={`px-4 py-2 rounded-lg border-none outline-none cursor-pointer font-medium ${
                updatingStatus 
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                  : getStatusColor(order.status)
              }`}
            >
              <option value="PENDING">{mounted ? t('admin.orders.pending') : 'Beklemede'}</option>
              <option value="APPROVED">{mounted ? t('admin.orders.approved') : 'Onaylandı'}</option>
              <option value="SHIPPED">{mounted ? t('admin.orders.shipped') : 'Gönderildi'}</option>
              <option value="CANCELLED">{mounted ? t('admin.orders.cancelled') : 'İptal'}</option>
            </select>
            {updatingStatus && (
              <span className="ml-2 text-sm text-gray-500">{mounted ? t('admin.common.updating') : 'Güncelleniyor...'}</span>
            )}
          </div>
        </div>

        {/* Teslimat Bilgileri */}
        {(order.shippingName || order.shippingAddress) && (
          <div className="mb-6 pt-6 border-t border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{mounted ? t('orderTracking.deliveryInfo') : 'Teslimat Bilgileri'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {order.shippingName && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">{mounted ? t('admin.orders.customer') : 'Ad Soyad'}</p>
                  <p className="font-medium text-gray-900">{order.shippingName}</p>
                </div>
              )}
              {order.shippingPhone && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">{mounted ? t('admin.dealers.phone') : 'Telefon'}</p>
                  <p className="font-medium text-gray-900">{order.shippingPhone}</p>
                </div>
              )}
              {order.shippingEmail && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">{mounted ? t('admin.dealers.email') : 'E-posta'}</p>
                  <p className="font-medium text-gray-900">{order.shippingEmail}</p>
                </div>
              )}
              {order.shippingAddress && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500 mb-1">{mounted ? t('checkout.address') : 'Adres'}</p>
                  <p className="font-medium text-gray-900">
                    {order.shippingAddress}
                    {order.shippingCity ? `, ${order.shippingCity}` : ''}
                    {order.shippingProvince ? `, ${order.shippingProvince}` : ''}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sipariş Edilen Ürünler */}
        {items.length > 0 && (
          <div className="mb-6 pt-6 border-t border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{mounted ? t('orderTracking.orderItems') : 'Sipariş Edilen Ürünler'}</h2>
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 items-center p-4 bg-gray-50 rounded-lg">
                  {item.product?.images && (
                    <div className="w-20 h-20 bg-white rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={getProductImageSrc(item.product.images)}
                        alt={getProductDisplayName(item.product)}
                        className="w-full h-full object-contain p-2"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-lg">
                      {getProductDisplayName(item.product) || (mounted ? t('admin.common.notFound') : 'Ürün bulunamadı')}
                    </p>
                    <p className="text-sm text-gray-500">{mounted ? t('cart.quantity') : 'Miktar'}: {item.quantity}</p>
                    <p className="text-sm text-gray-500">{mounted ? `Birim Fiyat: $${parseFloat(item.price).toFixed(2)}` : `Birim Fiyat: $${parseFloat(item.price).toFixed(2)}`}</p>
                  </div>
                  <p className="font-semibold text-[#E91E63] text-lg">
                    ${parseFloat(item.total).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fiyat Özeti */}
        <div className="pt-6 border-t border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{mounted ? t('orderTracking.orderSummary') : 'Fiyat Özeti'}</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>{mounted ? t('cart.subtotal') : 'Ara Toplam'}</span>
              <span>${parseFloat(order.subtotal).toFixed(2)}</span>
            </div>
            {parseFloat(order.discount) > 0 && (
              <div className="flex justify-between text-green-600">
                <span>{mounted ? t('cart.discount') : 'İndirim'}</span>
                <span>-${parseFloat(order.discount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>TPS (5%)</span>
              <span>${(parseFloat(order.subtotal) * 0.05).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>TVQ (9.975%)</span>
              <span>${(parseFloat(order.subtotal) * 0.09975).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Kargo</span>
              <span>${parseFloat(order.shipping).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-gray-900 border-t border-gray-200 pt-3 mt-3">
              <span>{mounted ? t('cart.total') : 'Toplam'}</span>
              <span className="text-[#E91E63]">${parseFloat(order.total).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
