'use client';

/**
 * Müşteri Hesap Detay Sayfası
 * Modern tablo tasarımı ve modal ile satış detayları
 */

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { showToast } from '@/components/Toast';
import { showConfirm } from '@/components/ConfirmModal';

interface Dealer {
  id: number;
  companyName: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  taxNumber: string | null;
  tpsNumber: string | null;
  tvqNumber: string | null;
  discount: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SaleItem {
  id: number;
  productId: number;
  quantity: number;
  price: string;
  total: string;
  productName: string;
  productImage: string | null;
}

interface Sale {
  id: number;
  saleNumber: string;
  paymentMethod: string;
  subtotal: string;
  discount: string;
  total: string;
  isPaid: boolean;
  paidAmount: string | null;
  paidAt: string | null;
  notes: string | null;
  createdAt: string;
  items: SaleItem[];
}

export default function MusteriHesapDetayPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, i18n } = useTranslation();
  const [mounted, setMounted] = useState(false);
  
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
  
  const isMountedRef = useRef(true);
  
  const [dealerId, setDealerId] = useState<number | null>(null);
  const [paramsLoaded, setParamsLoaded] = useState(false);
  const [dealer, setDealer] = useState<Dealer | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isBilgilerOpen, setIsBilgilerOpen] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    phone: '',
    address: '',
    discount: '0',
    isActive: true,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Params handling
  useEffect(() => {
    let isActive = true;
    
    const resolveParams = async () => {
      try {
        let resolvedParams: any = params;
        
        if (params && typeof params === 'object' && 'then' in params && typeof (params as any).then === 'function') {
          resolvedParams = await params;
        }
        
        const id = resolvedParams?.id 
          ? parseInt(String(resolvedParams.id)) 
          : null;
        
        if (isActive && isMountedRef.current) {
          setDealerId(id);
          setParamsLoaded(true);
        }
      } catch (error: any) {
        console.error('Error resolving params:', error);
        if (isActive && isMountedRef.current) {
          setDealerId(null);
          setParamsLoaded(true);
        }
      }
    };
    
    resolveParams();
    
    return () => {
      isActive = false;
    };
  }, [params]);

  const fetchDealer = useCallback(async (signal?: AbortSignal) => {
    if (!dealerId || !isMountedRef.current) return;

    try {
      const response = await fetch(`/api/dealers/${dealerId}`, {
        cache: 'no-store',
        signal,
      });

      if (signal?.aborted || !isMountedRef.current) return;

      if (!response.ok) {
        throw new Error(`Bayi bilgileri getirilemedi: ${response.status}`);
      }

      const data = await response.json();
      if (isMountedRef.current) {
        setDealer(data);
        // Form verilerini doldur
        setFormData({
          companyName: data.companyName || '',
          phone: data.phone || '',
          address: data.address || '',
          discount: data.discount || '0',
          isActive: data.isActive ?? true,
        });
      }
    } catch (error: any) {
      if (error?.name === 'AbortError' || !isMountedRef.current) return;
      console.error('Error fetching dealer:', error);
      try {
        if (isMountedRef.current) {
          showToast(mounted ? t('admin.dealers.errorLoadingDealer') : 'Bayi bilgileri yüklenirken hata oluştu', 'error');
        }
      } catch (toastError) {
        console.error('Error showing toast:', toastError);
      }
    }
  }, [dealerId, mounted, t]);

  const fetchSales = useCallback(async (signal?: AbortSignal) => {
    if (!dealerId || !isMountedRef.current) return;

    try {
      // Cache bypass için timestamp ekle
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/dealers/${dealerId}/sales?t=${timestamp}`, {
        cache: 'no-store',
        signal,
      });

      if (signal?.aborted || !isMountedRef.current) return;

      if (!response.ok) {
        throw new Error(`Satışlar getirilemedi: ${response.status}`);
      }

      const data = await response.json();
      if (isMountedRef.current) {
        const salesArray = Array.isArray(data) ? data : [];
        setSales(salesArray);
        
        // Debug: Satışları konsola yazdır
        if (process.env.NODE_ENV === 'development') {
          console.log('Satışlar yüklendi:', salesArray.map(s => ({
            id: s.id,
            saleNumber: s.saleNumber,
            total: s.total,
            isPaid: s.isPaid,
            paidAmount: s.paidAmount,
          })));
        }
      }
    } catch (error: any) {
      if (error?.name === 'AbortError' || !isMountedRef.current) return;
      console.error('Error fetching sales:', error);
      try {
        if (isMountedRef.current) {
          showToast(mounted ? t('admin.dealers.errorLoadingSales') : 'Satışlar yüklenirken hata oluştu', 'error');
        }
      } catch (toastError) {
        console.error('Error showing toast:', toastError);
      }
    }
  }, [dealerId, mounted, t]);

  useEffect(() => {
    if (!paramsLoaded) return;

    if (!dealerId) {
      if (isMountedRef.current) {
        setLoading(false);
      }
      return;
    }

    isMountedRef.current = true;
    
    const abortController = new AbortController();
    const signal = abortController.signal;

    const loadData = async () => {
      if (!isMountedRef.current) return;
      
      try {
        // Her zaman güncel verileri çek (cache bypass)
        await Promise.all([
          fetchDealer(signal),
          fetchSales(signal),
        ]);
      } catch (error: any) {
        if (!signal.aborted && isMountedRef.current) {
          console.error('Error loading data:', error);
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMountedRef.current = false;
      abortController.abort();
    };
  }, [paramsLoaded, dealerId, fetchDealer, fetchSales]);

  // İstatistikler - useMemo ile memoize edilmiş
  const stats = useMemo(() => {
    const totalSales = sales.length;
    const totalAmount = sales.reduce((sum, sale) => sum + parseFloat(sale.total || '0'), 0);
    
    // Ödenen tutar: Tamamen ödendiyse toplam tutarı, değilse ödenen tutarı ekle
    const paidAmount = sales.reduce((sum, sale) => {
      const total = parseFloat(sale.total || '0');
      
      if (sale.isPaid) {
        // Tamamen ödendiyse toplam tutarı ekle
        return sum + total;
      } else {
        // Kısmi ödeme varsa ödenen tutarı ekle, yoksa 0
        const paid = parseFloat(sale.paidAmount || '0');
        return sum + paid;
      }
    }, 0);
    
    // Borç tutarı: Her satış için (Toplam - Ödenen)
    const unpaidAmount = sales.reduce((sum, sale) => {
      const total = parseFloat(sale.total || '0');
      
      if (sale.isPaid) {
        // Tamamen ödendiyse borç yok
        return sum;
      } else {
        // Ödenmediyse: Eğer paidAmount varsa kalanı hesapla, yoksa tamamı borç
        const paid = parseFloat(sale.paidAmount || '0');
        // Eğer paidAmount 0 ise (eski satışlar için), tüm tutar borç
        // Eğer paidAmount > 0 ise, kalan borç = total - paid
        const remaining = paid > 0 ? Math.max(0, total - paid) : total;
        return sum + remaining;
      }
    }, 0);
    
    const totalDiscount = sales.reduce((sum, sale) => sum + parseFloat(sale.discount || '0'), 0);
    
    // Debug için console.log (geliştirme ortamında)
    if (process.env.NODE_ENV === 'development') {
      console.log('İstatistik Hesaplama:', {
        totalSales,
        totalAmount,
        paidAmount,
        unpaidAmount,
        totalDiscount,
        sales: sales.map(s => ({
          id: s.id,
          saleNumber: s.saleNumber,
          total: s.total,
          isPaid: s.isPaid,
          paidAmount: s.paidAmount,
          calculatedDebt: s.isPaid ? 0 : (parseFloat(s.paidAmount || '0') > 0 ? Math.max(0, parseFloat(s.total || '0') - parseFloat(s.paidAmount || '0')) : parseFloat(s.total || '0'))
        }))
      });
    }

    return {
      totalSales,
      totalAmount,
      paidAmount,
      unpaidAmount,
      totalDiscount,
    };
  }, [sales]);

  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Query parametresinden refresh kontrolü (satış detay sayfasından geri dönüldüğünde)
  useEffect(() => {
    if (!paramsLoaded || !dealerId) return;

    const refresh = searchParams.get('refresh');
    if (refresh === 'true' && isMountedRef.current) {
      // Verileri hemen yenile
      const refreshData = async () => {
        await fetchSales();
        await fetchDealer();
      };
      
      refreshData();
      
      // Query parametresini temizle
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.delete('refresh');
      const newSearch = newSearchParams.toString();
      const newUrl = newSearch ? `?${newSearch}` : '';
      router.replace(`/admin-panel/dealers/${dealerId}/hesap${newUrl}`, { scroll: false });
    }
  }, [paramsLoaded, dealerId, searchParams, fetchSales, fetchDealer, router]);

  // Sayfa görünür olduğunda verileri yenile (ek güvence)
  useEffect(() => {
    if (!paramsLoaded || !dealerId) return;

    let timeoutId: NodeJS.Timeout | null = null;
    let lastRefreshTime = 0;
    const REFRESH_COOLDOWN = 2000; // 2 saniye cooldown

    const refreshData = () => {
      const now = Date.now();
      if (now - lastRefreshTime < REFRESH_COOLDOWN) return; // Çok sık yenilemeyi önle
      lastRefreshTime = now;

      if (isMountedRef.current && dealerId) {
        fetchSales();
        fetchDealer();
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden && isMountedRef.current && dealerId) {
        // Sayfa görünür olduğunda verileri yenile (küçük bir gecikme ile)
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(refreshData, 500);
      }
    };

    const handleFocus = () => {
      if (isMountedRef.current && dealerId) {
        // Pencere focus olduğunda verileri yenile (küçük bir gecikme ile)
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(refreshData, 500);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [paramsLoaded, dealerId, fetchSales, fetchDealer]);

  const handleSaleClick = (sale: Sale) => {
    try {
      router.push(`/admin-panel/dealers/${dealerId}/satis/${sale.id}`);
    } catch (err: any) {
      console.error('Error navigating to sale detail:', err);
      showToast(mounted ? t('admin.dealers.errorNavigatingSaleDetail') : 'Satış detayına gidilirken hata oluştu', 'error');
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (dealer) {
      setFormData({
        companyName: dealer.companyName || '',
        phone: dealer.phone || '',
        address: dealer.address || '',
        discount: dealer.discount || '0',
        isActive: dealer.isActive ?? true,
      });
    }
  };

  const handleUpdate = useCallback(async () => {
    if (!dealerId || !isMountedRef.current) return;

    if (!formData.companyName || !formData.companyName.trim()) {
      showToast(mounted ? t('admin.dealers.companyNameRequired') : 'Firma ismi gerekli', 'error');
      return;
    }

    try {
      const response = await fetch(`/api/dealers/${dealerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName: formData.companyName.trim(),
          phone: formData.phone?.trim() || null,
          address: formData.address?.trim() || null,
          discount: formData.discount || '0',
          isActive: formData.isActive,
        }),
      });

      if (!isMountedRef.current) return;

      if (response.ok) {
        showToast(mounted ? t('admin.dealers.customerUpdated') : 'Müşteri bilgileri güncellendi', 'success');
        setIsEditing(false);
        // Verileri yeniden yükle
        await fetchDealer();
        await fetchSales();
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Bilinmeyen hata' }));
        throw new Error(errorData.error || errorData.details || (mounted ? t('admin.dealers.updateFailed') : 'Güncelleme başarısız'));
      }
    } catch (error: any) {
      if (!isMountedRef.current) return;
      console.error('Error updating dealer:', error);
      showToast(error?.message || (mounted ? t('admin.dealers.errorUpdatingCustomer') : 'Müşteri güncellenirken hata oluştu'), 'error');
    }
  }, [dealerId, formData, fetchDealer, fetchSales, mounted, t]);

  const handleDelete = useCallback(async () => {
    if (!dealerId || !isMountedRef.current) return;

    const confirmed = await showConfirm(
      mounted ? t('admin.dealers.deleteCustomer') : 'Müşteri Sil',
      `"${dealer?.companyName}" ${mounted ? t('admin.common.deleteConfirm') : 'müşterisini silmek istediğinize emin misiniz? Bu işlem geri alınamaz!'}`,
      {
        confirmText: mounted ? t('admin.common.delete') : 'Sil',
        cancelText: mounted ? t('admin.common.cancelConfirm') : 'İptal',
        type: 'danger',
      }
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/dealers/${dealerId}`, {
        method: 'DELETE',
      });

      if (!isMountedRef.current) return;

      if (response.ok) {
        showToast(mounted ? t('admin.dealers.customerDeleted') : 'Müşteri silindi', 'success');
        router.push('/admin-panel/dealers');
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Bilinmeyen hata' }));
        throw new Error(errorData.error || errorData.details || (mounted ? t('admin.dealers.deleteFailed') : 'Silme başarısız'));
      }
    } catch (error: any) {
      if (!isMountedRef.current) return;
      console.error('Error deleting dealer:', error);
      showToast(error?.message || (mounted ? t('admin.dealers.errorDeletingCustomer') : 'Müşteri silinirken hata oluştu'), 'error');
    }
  }, [dealerId, dealer, router, mounted, t]);

  if (!paramsLoaded || loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 w-full overflow-x-hidden">
        <div className="max-w-7xl mx-auto w-full min-w-0">
          <div className="text-center py-12 text-gray-500">{mounted ? t('admin.common.loading') : 'Yükleniyor...'}</div>
        </div>
      </div>
    );
  }

  if (!dealerId || !dealer) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 w-full overflow-x-hidden">
        <div className="max-w-7xl mx-auto w-full min-w-0 p-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {mounted ? t('admin.dealers.dealerNotFound') : 'Bayi bulunamadı veya geçersiz ID.'}
          </div>
          <button
            type="button"
            onClick={() => {
              try {
                router.push('/admin-panel/dealers');
              } catch (error: any) {
                console.error('Navigation error:', error);
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {mounted ? t('admin.dealers.backToList') : 'Bayi Listesine Dön'}
          </button>
        </div>
      </div>
    );
  }

  const paymentMethodText: Record<string, string> = {
    NAKIT: mounted ? t('admin.orders.cash') : 'Nakit',
    KREDI_KARTI: mounted ? t('admin.orders.creditCard') : 'Kredi Kartı',
    CEK: mounted ? t('admin.orders.check') : 'Çek',
    ODENMEDI: mounted ? t('admin.orders.unpaid') : 'Ödenmedi (Borç)',
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto w-full min-w-0">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{mounted ? t('admin.dealers.accountDetails') : 'Müşteri Hesap Detayı'}</h1>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span className="text-gray-700 font-semibold text-lg">{dealer.companyName}</span>
              </div>
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                dealer.isActive
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {dealer.isActive ? (mounted ? t('admin.common.active') : 'Aktif') : (mounted ? t('admin.common.inactive') : 'Pasif')}
              </span>
              <span className="text-sm text-gray-500">
                {mounted ? t('admin.dealers.discount') : 'İskonto'}: <span className="font-semibold text-blue-600">%{parseFloat(dealer.discount || '0').toFixed(2)}</span>
              </span>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                try {
                  router.push(`/admin-panel/dealers/sales/${dealer.id}`);
                } catch (err: any) {
                  console.error('Error navigating to sales:', err);
                }
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#E91E63] text-white rounded-xl hover:bg-[#C2185B] transition-all shadow-sm hover:shadow-md whitespace-nowrap font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {mounted ? t('admin.dealers.viewSales') : 'Satış Yap'}
            </button>
            <button
              type="button"
              onClick={() => {
                try {
                  router.push('/admin-panel/dealers');
                } catch (err: any) {
                  console.error('Error navigating back:', err);
                }
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm hover:shadow-md whitespace-nowrap font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {mounted ? t('admin.common.back') : 'Geri Dön'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 w-full min-w-0">
            {/* Sol Taraf - Müşteri Bilgileri */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-5">
                <button
                  type="button"
                  onClick={() => setIsBilgilerOpen(!isBilgilerOpen)}
                  className="w-full text-left"
                >
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {mounted ? t('admin.dealers.information') : 'Bilgiler'}
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${isBilgilerOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </h2>
                </button>
                {isBilgilerOpen && (
                  <>
                    {!isEditing ? (
                      <>
                        <div className="space-y-3 text-sm">
                          <div>
                            <label className="text-xs font-semibold text-gray-500 block">{mounted ? t('admin.dealers.companyName') : 'Firma Adı'}</label>
                            <p className="text-gray-900 font-medium">{dealer.companyName}</p>
                          </div>
                          {dealer.phone && (
                            <div>
                              <label className="text-xs font-semibold text-gray-500 block">{mounted ? t('admin.dealers.phone') : 'Telefon'}</label>
                              <p className="text-gray-900 font-medium">{dealer.phone}</p>
                            </div>
                          )}
                          {dealer.address && (
                            <div>
                              <label className="text-xs font-semibold text-gray-500 block">{mounted ? t('checkout.address') : 'Adres'}</label>
                              <p className="text-gray-900 font-medium whitespace-pre-line">{dealer.address}</p>
                            </div>
                          )}
                          <div>
                            <label className="text-xs font-semibold text-gray-500 block">{mounted ? t('admin.dealers.discount') : 'İskonto'}</label>
                            <p className="text-blue-600 font-medium">%{parseFloat(dealer.discount || '0').toFixed(2)}</p>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-500 block">{mounted ? t('admin.dealers.status') : 'Durum'}</label>
                            <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                              dealer.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {dealer.isActive ? (mounted ? t('admin.common.active') : 'Aktif') : (mounted ? t('admin.common.inactive') : 'Pasif')}
                            </span>
                          </div>
                        </div>
                        <div className="mt-6 pt-4 border-t border-gray-200 space-y-2">
                          <button
                            type="button"
                            onClick={handleEdit}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            {mounted ? t('admin.common.edit') : 'Düzenle'}
                          </button>
                          <button
                            type="button"
                            onClick={handleDelete}
                            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            {mounted ? t('admin.dealers.deleteCustomer') : 'Müşteri Sil'}
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            {mounted ? t('admin.dealers.companyName') : 'Firma Adı'} <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.companyName}
                            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">{mounted ? t('admin.dealers.phone') : 'Telefon'}</label>
                          <input
                            type="text"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">{mounted ? t('checkout.address') : 'Adres'}</label>
                          <textarea
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-y"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">{mounted ? t('admin.dealers.discount') : 'İskonto'} (%)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={formData.discount}
                            onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                        </div>
                        <div>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.isActive}
                              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-xs font-semibold text-gray-700">{mounted ? t('admin.common.active') : 'Aktif'}</span>
                          </label>
                        </div>
                        <div className="pt-2 space-y-2">
                          <button
                            type="button"
                            onClick={handleUpdate}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            {mounted ? t('admin.common.save') : 'Kaydet'}
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                          >
                            {mounted ? t('admin.common.cancel') : 'İptal'}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Sağ Taraf - İstatistikler ve Satışlar Tablosu */}
            <div className="lg:col-span-3 space-y-6">
              {/* İstatistikler Kartları */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-3 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-1">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="text-[10px] font-semibold text-blue-600 uppercase mb-0.5">{mounted ? t('admin.dealers.totalSales') : 'Toplam Satış'}</div>
                  <div className="text-lg font-bold text-blue-900">{stats.totalSales}</div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-green-200 p-3 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-1">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-[10px] font-semibold text-green-600 uppercase mb-0.5">{mounted ? t('admin.dealers.totalAmount') : 'Toplam Tutar'}</div>
                  <div className="text-lg font-bold text-green-900">${stats.totalAmount.toFixed(2)}</div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-purple-200 p-3 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-1">
                    <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-[10px] font-semibold text-purple-600 uppercase mb-0.5">{mounted ? t('admin.dealers.paidAmount') : 'Ödenen'}</div>
                  <div className="text-lg font-bold text-purple-900">${stats.paidAmount.toFixed(2)}</div>
                </div>
                {stats.unpaidAmount > 0 ? (
                  <div className="bg-white rounded-lg shadow-sm border border-red-200 p-3 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-1">
                      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="text-[10px] font-semibold text-red-600 uppercase mb-0.5">{mounted ? t('admin.dealers.unpaidAmount') : 'Borç'}</div>
                    <div className="text-lg font-bold text-red-900">${stats.unpaidAmount.toFixed(2)}</div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-1">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="text-[10px] font-semibold text-gray-500 uppercase mb-0.5">{mounted ? t('admin.dealers.discount') : 'İskonto'}</div>
                    <div className="text-lg font-bold text-gray-700">${stats.totalDiscount.toFixed(2)}</div>
                  </div>
                )}
              </div>

              {/* Satışlar Tablosu */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    {mounted ? t('admin.dealers.salesHistory') : 'Satış Geçmişi'} ({sales.length})
                  </h2>
                </div>
              
              {sales.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-sm font-medium">{mounted ? t('admin.dealers.noSalesRecord') : 'Henüz satış kaydı yok'}</p>
                </div>
              ) : (
                <div className="overflow-x-auto w-full">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">{mounted ? t('admin.dealers.saleNumber') : 'Satış No'}</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">{mounted ? t('admin.dealers.date') : 'Tarih'}</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">{mounted ? t('admin.dealers.productCount') : 'Ürün Sayısı'}</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">{mounted ? t('admin.dealers.total') : 'Toplam'}</th>
                        <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase">{mounted ? t('admin.dealers.status') : 'Durum'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {sales.map((sale) => (
                        <tr
                          key={sale.id}
                          onClick={() => handleSaleClick(sale)}
                          className="hover:bg-blue-50 cursor-pointer transition-colors group"
                        >
                          <td className="py-4 px-4">
                            <span className="text-xs lg:text-sm font-medium text-gray-900 group-hover:text-blue-600">
                              {sale.saleNumber}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-sm text-gray-600">
                            {new Date(sale.createdAt).toLocaleDateString(getLocale(), {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>
                          <td className="py-4 px-4 text-sm text-gray-600">
                            <span className="lg:hidden">{sale.items?.length || 0}</span>
                            <span className="hidden lg:inline">{sale.items?.length || 0} {mounted ? t('admin.dealers.products') : 'ürün'}</span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span className="font-bold text-blue-600 text-base">
                              ${parseFloat(sale.total || '0').toFixed(2)}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            {sale.isPaid ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                {mounted ? t('admin.dealers.paid') : 'Ödendi'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                {mounted ? t('admin.dealers.unpaid') : 'Borçlu'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
