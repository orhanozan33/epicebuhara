'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { showToast } from '@/components/Toast';
import { showConfirm } from '@/components/ConfirmModal';

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  total: string;
  shippingName: string;
  shippingPhone: string;
  shippingEmail: string;
  shippingCity: string;
  shippingProvince: string;
  createdAt: string;
}

export default function SiparislerPage() {
  const [mounted, setMounted] = useState(false);
  const { t, i18n } = useTranslation();
  
  // Dil koduna göre locale mapping
  const getLocale = () => {
    const lang = mounted && i18n?.language ? i18n.language.split('-')[0] : 'fr';
    const localeMap: Record<string, string> = {
      'tr': 'tr-TR',
      'fr': 'fr-CA',
      'en': 'en-CA',
    };
    return localeMap[lang] || 'fr-CA';
  };
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const url = statusFilter === 'all' 
        ? '/api/orders/list'
        : `/api/orders/list?status=${statusFilter}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      } else {
        console.error('Error fetching orders:', response.status, response.statusText);
        showToast(mounted ? t('admin.common.error') : 'Siparişler getirilirken hata oluştu', 'error');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      showToast(mounted ? t('admin.common.error') : 'Siparişler getirilirken hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);

  const getStatusBadgeColor = (status: string) => {
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

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      setUpdatingStatus(orderId);
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        showToast(mounted ? t('admin.orders.statusUpdated') : 'Sipariş durumu başarıyla güncellendi!', 'success');
        await fetchOrders();
      } else {
        const error = await response.json();
        showToast(error.error || (mounted ? t('admin.common.error') : 'Durum güncellenirken hata oluştu'), 'error');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      showToast(mounted ? t('admin.common.error') : 'Durum güncellenirken hata oluştu', 'error');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleDelete = async (orderId: number, orderNumber: string) => {
    const confirmed = await showConfirm(
      mounted ? t('admin.orders.deleteTitle') : 'Sipariş Sil',
      mounted ? t('admin.orders.deleteConfirm', { orderNumber }) : `"${orderNumber}" siparişini kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`,
      {
        confirmText: mounted ? t('admin.common.delete') : 'Sil',
        cancelText: mounted ? t('admin.common.cancel') : 'İptal',
        type: 'danger',
      }
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showToast(mounted ? t('admin.orders.deletedSuccess') : 'Sipariş başarıyla silindi', 'success');
        await fetchOrders();
      } else {
        const errorData = await response.json();
        showToast(errorData.error || (mounted ? t('admin.common.error') : 'Sipariş silinirken hata oluştu'), 'error');
      }
    } catch (error: any) {
      console.error('Error deleting order:', error);
      showToast(error?.message || (mounted ? t('admin.common.error') : 'Sipariş silinirken hata oluştu'), 'error');
    }
  };

  if (loading) {
    return (
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">{mounted ? t('admin.orders.title') : 'Siparişler'}</h2>
        <div className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8 text-center">
          <p className="text-sm sm:text-base text-gray-600">{mounted ? t('admin.common.loading') : 'Yükleniyor...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-hidden min-w-0 box-border" style={{ maxWidth: '100%', overflowX: 'hidden', width: '100%' }}>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-2 lg:mb-6 gap-2 lg:gap-4">
        <h2 className="text-lg lg:text-2xl font-bold text-gray-900">{mounted ? t('admin.orders.title') : 'Siparişler'}</h2>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-2 py-1.5 lg:px-4 lg:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63] text-xs lg:text-sm"
        >
          <option value="all">{mounted ? `${t('admin.common.total')} ${t('admin.orders.title')}` : 'Tüm Siparişler'}</option>
          <option value="PENDING">{mounted ? t('admin.orders.pending') : 'Beklemede'}</option>
          <option value="APPROVED">{mounted ? t('admin.orders.approved') : 'Onaylandı'}</option>
          <option value="CANCELLED">{mounted ? t('admin.orders.cancelled') : 'İptal'}</option>
        </select>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-4 lg:p-8 text-center">
          <p className="text-xs lg:text-base text-gray-600">{mounted ? t('admin.common.notFound') : 'Henüz sipariş bulunmamaktadır.'}</p>
        </div>
      ) : (
        <>
          {/* Mobil Kart Görünümü */}
          <div className="lg:hidden space-y-2">
            {orders.map((order) => (
              <div key={order.id} className="bg-white border border-gray-200 rounded-lg p-2 lg:p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">{order.orderNumber}</h3>
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        disabled={updatingStatus === order.id}
                        className={`px-2 py-1 text-[10px] font-semibold rounded-lg border-none outline-none cursor-pointer transition-colors ${
                          updatingStatus === order.id 
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                            : getStatusBadgeColor(order.status)
                        }`}
                      >
                        <option value="PENDING">{mounted ? t('admin.orders.pending') : 'Beklemede'}</option>
                        <option value="APPROVED">{mounted ? t('admin.orders.approved') : 'Onaylandı'}</option>
                        <option value="SHIPPED">{mounted ? t('admin.orders.shipped') : 'Gönderildi'}</option>
                        <option value="CANCELLED">{mounted ? t('admin.orders.cancelled') : 'İptal'}</option>
                      </select>
                      {updatingStatus === order.id && (
                        <span className="text-[10px] text-gray-500">{mounted ? t('admin.common.updating') : 'Güncelleniyor...'}</span>
                      )}
                    </div>
                    <div className="space-y-1 text-xs text-gray-600 mb-2">
                      <div><span className="text-gray-500">{mounted ? t('admin.orders.customer') : 'Müşteri'}:</span> <span className="font-medium">{order.shippingName}</span></div>
          <div className="truncate"><span className="text-gray-500">{mounted ? t('admin.dealers.email') : 'E-posta'}:</span> <span className="font-medium">{order.shippingEmail}</span></div>
          <div><span className="text-gray-500">{mounted ? t('admin.dealers.phone') : 'Telefon'}:</span> <span className="font-medium">{order.shippingPhone}</span></div>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
                      <div>
                        <span className="text-xs text-gray-500">{mounted ? t('admin.orders.total') : 'Toplam'}:</span>
                        <span className="ml-1 text-sm font-semibold text-gray-900">${parseFloat(order.total).toFixed(2)}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString(getLocale(), {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <Link
                    href={`/admin-panel/orders/${order.id}`}
                    className="flex-1 bg-[#E91E63] text-white text-xs font-medium px-2 py-1 lg:px-3 lg:py-2 rounded-lg hover:bg-[#C2185B] transition-colors text-center"
                  >
                    {mounted ? t('admin.orders.viewDetails') : 'Detay Görüntüle'}
                  </Link>
                  <button
                    onClick={() => handleDelete(order.id, order.orderNumber)}
                    className="bg-red-600 text-white text-xs font-medium px-2 py-1 lg:px-3 lg:py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    {mounted ? t('admin.common.delete') : 'Sil'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Tablo Görünümü */}
          <div className="hidden lg:block bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-hidden lg:overflow-x-visible">
              <table className="w-full min-w-0 max-w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {mounted ? t('admin.orders.orderNumber') : 'Sipariş No'}
                    </th>
                    <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {mounted ? t('admin.orders.customer') : 'Müşteri'}
                    </th>
                    <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {mounted ? t('admin.orders.total') : 'Toplam'}
                    </th>
                    <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {mounted ? t('admin.orders.status') : 'Durum'}
                    </th>
                    <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {mounted ? t('admin.orders.date') : 'Tarih'}
                    </th>
                    <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {mounted ? t('admin.orders.actions') : 'İşlemler'}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 truncate">{order.orderNumber}</div>
                      </td>
                      <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 truncate">{order.shippingName}</div>
                        <div className="text-sm text-gray-500 truncate">{order.shippingEmail}</div>
                        <div className="text-sm text-gray-500 truncate">{order.shippingPhone}</div>
                      </td>
                      <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ${parseFloat(order.total).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            disabled={updatingStatus === order.id}
                            className={`px-3 py-1 text-xs font-semibold rounded-lg border-none outline-none cursor-pointer transition-colors ${
                              updatingStatus === order.id 
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                                : getStatusBadgeColor(order.status)
                            }`}
                          >
                            <option value="PENDING">{mounted ? t('admin.orders.pending') : 'Beklemede'}</option>
                            <option value="APPROVED">{mounted ? t('admin.orders.approved') : 'Onaylandı'}</option>
                            <option value="SHIPPED">{mounted ? t('admin.orders.shipped') : 'Gönderildi'}</option>
                            <option value="CANCELLED">{mounted ? t('admin.orders.cancelled') : 'İptal'}</option>
                          </select>
                          {updatingStatus === order.id && (
                            <span className="text-xs text-gray-500">{mounted ? t('admin.common.updating') : 'Güncelleniyor...'}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString(getLocale(), {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/admin-panel/orders/${order.id}`}
                            className="text-[#E91E63] hover:text-[#C2185B]"
                          >
                            {mounted ? t('admin.common.view') : 'Detay'}
                          </Link>
                          <button
                            onClick={() => handleDelete(order.id, order.orderNumber)}
                            className="text-red-600 hover:text-red-900"
                            title={mounted ? t('admin.common.delete') : 'Sil'}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
