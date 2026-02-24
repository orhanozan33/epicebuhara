'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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
  shippingName: string | null;
  shippingPhone: string | null;
  shippingEmail: string | null;
  shippingAddress: string | null;
  shippingProvince: string | null;
  shippingCity: string | null;
  createdAt: string;
}

interface OrderItem {
  id: number;
  productId: number;
  quantity: number;
  price: string;
  product: {
    id: number;
    name: string;
    baseName?: string;
    slug: string;
    images?: string;
  } | null;
}

function SiparisTakibiContent() {
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
  const searchParams = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(searchParams.get('orderNumber') || '');
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [showAllOrders, setShowAllOrders] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
    if (orderNumber) {
      handleSearch();
    }
  }, []);

  const handleSearchAllOrders = async () => {
    if (!searchEmail.trim() && !searchPhone.trim()) {
      showToast(mounted ? t('orderTracking.enterEmailOrPhone') || 'Lütfen email veya telefon girin' : 'Lütfen email veya telefon girin', 'error');
      return;
    }

    setLoading(true);
    setError(null);
    setShowAllOrders(true);

    try {
      const url = searchEmail.trim() 
        ? `/api/orders?email=${encodeURIComponent(searchEmail.trim())}`
        : `/api/orders?phone=${encodeURIComponent(searchPhone.trim())}`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const ordersList = Array.isArray(data) ? data : [];
        setAllOrders(ordersList);
        if (ordersList.length === 0) {
          setError(mounted ? t('orderTracking.noOrdersFound') || 'Sipariş bulunamadı' : 'Sipariş bulunamadı');
          setOrder(null);
          setItems([]);
          setSelectedOrderId(null);
        } else {
          // İlk siparişi otomatik seç
          if (ordersList.length > 0) {
            const firstOrder = ordersList[0];
            setSelectedOrderId(firstOrder.id);
            setOrderNumber(firstOrder.orderNumber);
            // İlk siparişin detaylarını getir
            try {
              const detailResponse = await fetch(`/api/orders?orderNumber=${encodeURIComponent(firstOrder.orderNumber)}`);
              if (detailResponse.ok) {
                const detailData = await detailResponse.json();
                if (detailData.order) {
                  setOrder(detailData.order);
                  setItems(detailData.items || []);
                }
              }
            } catch (err) {
              console.error('Error fetching first order details:', err);
            }
          }
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || (mounted ? t('orderTracking.fetchError') : 'Siparişler getirilirken hata oluştu'));
        setAllOrders([]);
        setOrder(null);
        setItems([]);
        setSelectedOrderId(null);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError(mounted ? t('orderTracking.fetchError') : 'Siparişler getirilirken hata oluştu');
      setAllOrders([]);
      setOrder(null);
      setItems([]);
      setSelectedOrderId(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!orderNumber.trim()) {
      showToast(mounted ? t('orderTracking.enterOrderNumber') : 'Lütfen sipariş numarası girin', 'error');
      return;
    }

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const response = await fetch(`/api/orders?orderNumber=${encodeURIComponent(orderNumber)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.order) {
          setOrder(data.order);
          setItems(data.items || []);
          setSelectedOrderId(data.order.id);
          // Siparişi listeye ekle (zaten yoksa)
          setAllOrders(prev => {
            const exists = prev.find(o => o.id === data.order.id);
            if (exists) return prev;
            return [data.order, ...prev].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          });
        } else {
          setError(mounted ? t('orderTracking.orderNotFound') : 'Sipariş bulunamadı. Lütfen sipariş numaranızı kontrol edin.');
          setOrder(null);
          setItems([]);
          setSelectedOrderId(null);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || (mounted ? t('orderTracking.fetchError') : 'Sipariş getirilirken hata oluştu'));
        setOrder(null);
        setItems([]);
        setSelectedOrderId(null);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      setError(mounted ? t('orderTracking.fetchError') : 'Sipariş getirilirken hata oluştu');
      setOrder(null);
      setItems([]);
      setSelectedOrderId(null);
    } finally {
      setLoading(false);
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

  const handleOrderClick = async (orderId: number, orderNum: string) => {
    setSelectedOrderId(orderId);
    setOrderNumber(orderNum);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/orders?orderNumber=${encodeURIComponent(orderNum)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.order) {
          setOrder(data.order);
          setItems(data.items || []);
        }
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{mounted ? t('orderTracking.title') : 'Sipariş Takibi'}</h1>
          <p className="text-sm sm:text-base text-gray-600">{mounted ? t('orderTracking.searchDescription') : 'Sipariş numaranızı girerek siparişinizin durumunu takip edebilirsiniz'}</p>
        </div>

        {/* İki Kolonlu Layout: Sol - Arama Formları, Sağ - Sipariş Detayları */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Sol Kolon: Arama Formları */}
          <div className="lg:order-1">
            {/* Sipariş Arama Formu */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
              <div className="space-y-4">
                {/* Sipariş Numarası ile Arama */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{mounted ? t('orderTracking.searchByOrderNumber') || 'Sipariş Numarası ile Ara' : 'Sipariş Numarası ile Ara'}</label>
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <input
                  type="text"
                  value={orderNumber}
                  onChange={(e) => {
                    setOrderNumber(e.target.value);
                    setShowAllOrders(false);
                    setOrder(null);
                    setItems([]);
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder={mounted ? t('orderTracking.searchPlaceholder') : "Sipariş numarası girin (örn: ORD-000001)"}
                    className="flex-1 px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63] text-sm sm:text-base"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="px-6 py-2.5 sm:py-3 bg-[#E91E63] text-white font-medium rounded-lg hover:bg-[#C2185B] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm sm:text-base whitespace-nowrap"
                  >
                    {loading ? (mounted ? t('products.loading') : 'Yükleniyor...') : (mounted ? t('admin.common.search') : 'Ara')}
                  </button>
                  </div>
                </div>
                
                {/* Email/Telefon ile Tüm Siparişleri Getir */}
                <div className="border-t pt-3" style={{ transform: 'scale(0.8)', transformOrigin: 'top left' }}>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">{mounted ? t('orderTracking.searchByEmailOrPhone') || 'Email veya Telefon ile Tüm Siparişlerimi Gör' : 'Email veya Telefon ile Tüm Siparişlerimi Gör'}</label>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <input
                  type="email"
                  value={searchEmail}
                  onChange={(e) => {
                    setSearchEmail(e.target.value);
                    setSearchPhone('');
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearchAllOrders()}
                    placeholder={mounted ? t('checkout.email') || 'E-posta' : 'E-posta'}
                    className="flex-1 px-3 py-2 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63] text-xs sm:text-sm"
                  />
                  <span className="self-center text-gray-500 hidden sm:inline text-xs">{mounted ? t('orderTracking.or') : 'veya'}</span>
                  <input
                    type="tel"
                    value={searchPhone}
                    onChange={(e) => {
                      setSearchPhone(e.target.value);
                      setSearchEmail('');
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearchAllOrders()}
                    placeholder={mounted ? t('checkout.phone') || 'Telefon' : 'Telefon'}
                    className="flex-1 px-3 py-2 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63] text-xs sm:text-sm"
                  />
                  <button
                    onClick={handleSearchAllOrders}
                    disabled={loading}
                    className="px-5 py-2 sm:py-2 bg-[#E91E63] text-white font-medium rounded-lg hover:bg-[#C2185B] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-xs sm:text-sm whitespace-nowrap"
                  >
                    {loading ? (mounted ? t('products.loading') : 'Yükleniyor...') : (mounted ? t('orderTracking.viewAllOrders') || 'Tüm Siparişlerimi Gör' : 'Tüm Siparişlerimi Gör')}
                  </button>
                  </div>
                </div>
              </div>
            </div>

          {/* Sipariş Listesi (Email/Telefon ile aranan siparişler) */}
          {showAllOrders && allOrders.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 mt-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">{mounted ? t('orderTracking.allOrders') || 'Siparişlerim' : 'Siparişlerim'}</h2>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {allOrders.map((orderItem) => (
                  <div
                    key={orderItem.id}
                    className={`border rounded-lg p-3 sm:p-4 hover:shadow-md transition-all cursor-pointer ${
                      selectedOrderId === orderItem.id
                        ? 'border-[#E91E63] bg-[#E91E63]/5 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleOrderClick(orderItem.id, orderItem.orderNumber)}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <h3 className={`text-sm sm:text-base font-semibold ${selectedOrderId === orderItem.id ? 'text-[#E91E63]' : 'text-gray-900'}`}>
                        {orderItem.orderNumber}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full flex-shrink-0 ${getStatusColor(orderItem.status)}`}>
                        {getStatusLabel(orderItem.status)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-1">
                      {new Date(orderItem.createdAt).toLocaleDateString(getLocale(), {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                    {/* Fiyat - Gizlendi */}
                  </div>
                ))}
              </div>
            </div>
          )}
          </div>

          {/* Sağ Kolon: Sipariş Detayları */}
          <div className="lg:order-2">
            {loading && (
              <div className="bg-white border border-gray-200 rounded-lg p-8 sm:p-12 text-center">
                <p className="text-gray-600">{mounted ? t('products.loading') : 'Yükleniyor...'}</p>
              </div>
            )}

            {!loading && order && (
          <div className="space-y-4 sm:space-y-6">
            {/* Sipariş Özeti */}
            <div className="bg-gradient-to-r from-[#E91E63] to-[#C2185B] rounded-xl p-4 sm:p-6 text-white">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">{mounted ? t('orderTracking.orderDetails') : 'Sipariş Detayları'}</h2>
                  <p className="text-sm sm:text-base text-white/90 font-semibold">{order.orderNumber}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-full ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                </div>
              </div>
              <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-white/20">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs sm:text-sm text-white/70 uppercase tracking-wide font-medium">{mounted ? t('orderTracking.orderDate') : 'Sipariş Tarihi'}</p>
                    <p className="text-sm sm:text-base font-semibold text-white mt-1">
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
                    <p className="text-xs sm:text-sm text-white/70 uppercase tracking-wide font-medium">{mounted ? t('cart.total') : 'Toplam'}</p>
                    {/* Fiyat - Gizlendi */}
                  </div>
                </div>
              </div>
            </div>

            {/* Teslimat Bilgileri */}
            {(order.shippingName || order.shippingAddress) && (
              <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">{mounted ? t('orderTracking.deliveryInfo') : 'Teslimat Bilgileri'}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm sm:text-base">
                  {order.shippingName && (
                    <div>
                      <p className="text-gray-500 mb-1">{mounted ? t('admin.orders.customer') : 'Müşteri'}</p>
                      <p className="font-medium text-gray-900">{order.shippingName}</p>
                    </div>
                  )}
                  {order.shippingEmail && (
                    <div>
                      <p className="text-gray-500 mb-1">E-posta</p>
                      <p className="font-medium text-gray-900">{order.shippingEmail}</p>
                    </div>
                  )}
                  {order.shippingPhone && (
                    <div>
                      <p className="text-gray-500 mb-1">{mounted ? t('checkout.phone') : 'Telefon'}</p>
                      <p className="font-medium text-gray-900">{order.shippingPhone}</p>
                    </div>
                  )}
                  {order.shippingAddress && (
                    <div className="sm:col-span-2">
                      <p className="text-gray-500 mb-1">{mounted ? t('checkout.address') : 'Adres'}</p>
                      <p className="font-medium text-gray-900">{order.shippingAddress}</p>
                    </div>
                  )}
                  {(order.shippingCity || order.shippingProvince) && (
                    <div className="sm:col-span-2">
                      <p className="text-gray-500 mb-1">{mounted ? (t('checkout.city') + ' / ' + t('checkout.province')) : 'Şehir / Eyalet'}</p>
                      <p className="font-medium text-gray-900">{order.shippingCity || ''} {order.shippingProvince ? `, ${order.shippingProvince}` : ''}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sipariş Öğeleri */}
            {items.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">{mounted ? t('orderTracking.orderItems') : 'Sipariş Öğeleri'}</h3>
                <div className="space-y-3 sm:space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3 sm:gap-4 pb-3 sm:pb-4 border-b border-gray-200 last:border-0">
                      {item.product?.images && (
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={getProductImageSrc(item.product.images)}
                            alt={item.product.baseName || item.product.name}
                            className="w-full h-full object-contain p-1 sm:p-2"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              console.error('Resim yükleme hatası:', target.src, item.product?.name);
                              target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-1">
                          {item.product?.baseName || item.product?.name || 'Ürün bulunamadı'}
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-500 mb-1">
                          {mounted ? t('cart.quantity') : 'Miktar'}: {item.quantity}
                        </p>
                        {/* Fiyat - Gizlendi */}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sipariş Özeti - Fiyat Bilgileri Gizlendi */}
          </div>
        )}

            {/* Sipariş bulunamadı mesajı (sadece arama yapıldıysa göster) */}
            {!loading && searched && !order && !showAllOrders && (
              <div className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8 text-center">
                <p className="text-gray-600 text-base sm:text-lg">{error || (mounted ? t('orderTracking.orderNotFound') : 'Sipariş bulunamadı. Lütfen sipariş numaranızı kontrol edin.')}</p>
              </div>
            )}

            {/* Tüm siparişler bulunamadı mesajı */}
            {!loading && showAllOrders && allOrders.length === 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8 text-center">
                <p className="text-gray-600 text-base sm:text-lg">{error || (mounted ? t('orderTracking.noOrdersFound') || 'Sipariş bulunamadı' : 'Sipariş bulunamadı')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SiparisTakibiPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Yükleniyor...</div>}>
      <SiparisTakibiContent />
    </Suspense>
  );
}
