'use client';

/**
 * Satış Detay Sayfası
 * Modal yerine ayrı sayfa olarak satış detaylarını gösterir
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { showToast } from '@/components/Toast';
import { getProductImageSrc } from '@/lib/imageUrl';

interface SaleItem {
  id: number;
  productId: number;
  quantity: number;
  price: string;
  total: string;
  productName: string;
  productNameFr?: string | null;
  productNameEn?: string | null;
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

interface Dealer {
  id: number;
  companyName: string;
}

export default function SatisDetayPage() {
  const params = useParams();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const lang = (i18n?.language || 'tr').split('-')[0] as 'tr' | 'fr' | 'en';
  const [mounted, setMounted] = useState(false);
  
  const isMountedRef = useRef(true);
  
  const [dealerId, setDealerId] = useState<number | null>(null);
  const [saleId, setSaleId] = useState<number | null>(null);
  const [paramsLoaded, setParamsLoaded] = useState(false);
  const [sale, setSale] = useState<Sale | null>(null);
  const [dealer, setDealer] = useState<Dealer | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDiscountPercent, setPaymentDiscountPercent] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'NAKIT' | 'KREDI_KARTI' | 'CEK' | 'ODENMEDI'>('NAKIT');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [removingItemId, setRemovingItemId] = useState<number | null>(null);
  const [showAddToInvoiceModal, setShowAddToInvoiceModal] = useState(false);
  const [addToInvoiceProducts, setAddToInvoiceProducts] = useState<{ id: number; name: string; baseName?: string | null; baseNameFr?: string | null; baseNameEn?: string | null; price: string; stock: number | null; packSize?: number | null; packLabelTr?: string | null; packLabelFr?: string | null; packLabelEn?: string | null; images?: string | null; categoryId?: number | null; weight?: string | null; unit?: string | null }[]>([]);
  const [addToInvoiceSearch, setAddToInvoiceSearch] = useState('');
  const [addToInvoiceProduct, setAddToInvoiceProduct] = useState<typeof addToInvoiceProducts[0] | null>(null);
  const [addToInvoiceSellUnit, setAddToInvoiceSellUnit] = useState<'adet' | 'kutu'>('kutu');
  const [addToInvoiceQuantity, setAddToInvoiceQuantity] = useState<number | ''>('');
  const [addingToInvoice, setAddingToInvoice] = useState(false);
  const [invoiceProductSearch, setInvoiceProductSearch] = useState('');
  const [categories, setCategories] = useState<{ id: number; name: string; nameFr?: string | null; nameEn?: string | null }[]>([]);
  const [addToInvoiceCategoryId, setAddToInvoiceCategoryId] = useState<string>('');

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
        const saleIdParam = resolvedParams?.saleId 
          ? parseInt(String(resolvedParams.saleId)) 
          : null;
        
        if (isActive && isMountedRef.current) {
          setDealerId(id);
          setSaleId(saleIdParam);
          setParamsLoaded(true);
        }
      } catch (error: any) {
        console.error('Error resolving params:', error);
        if (isActive && isMountedRef.current) {
          setDealerId(null);
          setSaleId(null);
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

      if (response.ok) {
        const data = await response.json();
        if (isMountedRef.current) {
          setDealer(data);
        }
      }
    } catch (error: any) {
      if (error?.name === 'AbortError' || !isMountedRef.current) return;
      console.error('Error fetching dealer:', error);
    }
  }, [dealerId]);

  const fetchSale = useCallback(async (signal?: AbortSignal) => {
    if (!dealerId || !saleId || !isMountedRef.current) return;

    try {
      const response = await fetch(`/api/dealers/${dealerId}/sales`, {
        cache: 'no-store',
        signal,
      });

      if (signal?.aborted || !isMountedRef.current) return;

      if (!response.ok) {
        throw new Error(`Satışlar getirilemedi: ${response.status}`);
      }

      const data = await response.json();
      if (isMountedRef.current) {
        const sales = Array.isArray(data) ? data : [];
        const foundSale = sales.find((s: Sale) => s.id === saleId);
        if (foundSale) {
          setSale(foundSale);
        } else {
          throw new Error(mounted ? t('admin.dealers.saleNotFound') : 'Satış bulunamadı');
        }
      }
    } catch (error: any) {
      if (error?.name === 'AbortError' || !isMountedRef.current) return;
      console.error('Error fetching sale:', error);
      try {
        if (isMountedRef.current) {
          showToast(error?.message || (mounted ? t('admin.dealers.errorLoadingSale') : 'Satış yüklenirken hata oluştu'), 'error');
        }
      } catch (toastError) {
        console.error('Error showing toast:', toastError);
      }
    }
  }, [dealerId, saleId, mounted, t]);

  const handleRemoveItem = useCallback(async (itemId: number) => {
    if (!dealerId || !saleId || removingItemId != null) return;
    setRemovingItemId(itemId);
    try {
      const response = await fetch(`/api/dealers/${dealerId}/sales/${saleId}/items/${itemId}`, { method: 'DELETE' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        showToast(data?.error || (mounted ? t('admin.common.error') : 'İşlem başarısız'), 'error');
        return;
      }
      showToast(mounted ? t('admin.dealers.itemRemoved') : 'Ürün faturadan çıkarıldı, stok güncellendi.', 'success');
      await fetchSale();
    } catch (err: any) {
      showToast(err?.message || (mounted ? t('admin.common.error') : 'İşlem başarısız'), 'error');
    } finally {
      if (isMountedRef.current) setRemovingItemId(null);
    }
  }, [dealerId, saleId, removingItemId, fetchSale, mounted, t]);

  const fetchProductsForInvoice = useCallback(async () => {
    try {
      const res = await fetch('/api/products?admin=true', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data?.products ?? []);
      const active = list.filter((p: any) => p.isActive !== false);
      if (isMountedRef.current) setAddToInvoiceProducts(active);
    } catch (e) {
      console.error('Error fetching products:', e);
    }
  }, []);

  const fetchCategoriesForInvoice = useCallback(async () => {
    try {
      const res = await fetch('/api/categories', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      if (isMountedRef.current) setCategories(list);
    } catch (e) {
      console.error('Error fetching categories:', e);
    }
  }, []);

  const getProductDisplayName = useCallback((p: typeof addToInvoiceProducts[0]) => {
    const base = lang === 'fr' ? (p.baseNameFr || p.baseNameEn || p.name || '') : lang === 'en' ? (p.baseNameEn || p.baseNameFr || p.name || '') : (p.baseName || p.name || '');
    const packSize = p.packSize ?? 1;
    if (packSize <= 1) return base;
    const packLabel = lang === 'fr' ? (p.packLabelFr || p.packLabelEn || 'Boîte') : lang === 'en' ? (p.packLabelEn || p.packLabelFr || 'Box') : (p.packLabelTr || 'Kutu');
    return `${base} - ${packSize}'li ${packLabel}`;
  }, [lang]);
  const getItemProductDisplayName = useCallback((item: SaleItem) => {
    if (lang === 'fr') return item.productNameFr || item.productNameEn || item.productName;
    if (lang === 'en') return item.productNameEn || item.productNameFr || item.productName;
    return item.productName;
  }, [lang]);

  const handleAddProductToInvoice = useCallback(async () => {
    if (!dealerId || !saleId || !addToInvoiceProduct || addingToInvoice) return;
    const qty = addToInvoiceQuantity === '' ? 0 : addToInvoiceQuantity;
    if (qty <= 0) {
      showToast(mounted ? t('admin.dealers.invalidQuantity') : 'Lütfen miktar girin', 'error');
      return;
    }
    const ps = addToInvoiceProduct.packSize ?? 1;
    const quantityAdet = addToInvoiceSellUnit === 'kutu' ? qty * ps : qty;
    setAddingToInvoice(true);
    try {
      const res = await fetch(`/api/dealers/${dealerId}/sales/${saleId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [{ productId: addToInvoiceProduct.id, quantity: quantityAdet }] }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data?.error || (mounted ? t('admin.common.error') : 'İşlem başarısız'), 'error');
        return;
      }
      showToast(mounted ? t('admin.dealers.itemsAddedToInvoice') : 'Ürün faturaya eklendi.', 'success');
      setAddToInvoiceProduct(null);
      setAddToInvoiceQuantity('');
      await fetchSale();
    } catch (err: any) {
      showToast(err?.message || (mounted ? t('admin.common.error') : 'İşlem başarısız'), 'error');
    } finally {
      if (isMountedRef.current) setAddingToInvoice(false);
    }
  }, [dealerId, saleId, addToInvoiceProduct, addToInvoiceSellUnit, addToInvoiceQuantity, addingToInvoice, fetchSale, mounted, t]);

  useEffect(() => {
    if (!paramsLoaded) return;

    if (!dealerId || !saleId) {
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
        await Promise.all([
          fetchDealer(signal),
          fetchSale(signal),
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
  }, [paramsLoaded, dealerId, saleId, fetchDealer, fetchSale]);

  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleOpenPaymentModal = useCallback(() => {
    if (!sale) return;
    
    setPaymentDiscountPercent('');
    const total = parseFloat(sale.total || '0');
    const paid = parseFloat(sale.paidAmount || '0');
    const remainingAmount = Math.max(0, total - paid);
    setPaymentAmount(remainingAmount.toFixed(2));
    setPaymentMethod('NAKIT');
    setShowPaymentModal(true);
  }, [sale]);

  const handleClosePaymentModal = useCallback(() => {
    setShowPaymentModal(false);
    setPaymentAmount('');
    setPaymentDiscountPercent('');
    setPaymentMethod('NAKIT');
  }, []);

  // İskonto % değişince ödeme tutarını yeni kalan borca göre güncelle (toplamı aşmasın)
  useEffect(() => {
    if (!showPaymentModal || !sale) return;
    const subtotal = parseFloat(sale.subtotal || '0');
    const pct = paymentDiscountPercent !== '' ? Math.min(100, Math.max(0, parseFloat(String(paymentDiscountPercent).replace(',', '.')) || 0)) : 0;
    const effectiveTotal = pct > 0 ? Math.max(0, subtotal - (subtotal * pct) / 100) : parseFloat(sale.total || '0');
    const paid = parseFloat(sale.paidAmount || '0');
    const remaining = Math.max(0, effectiveTotal - paid);
    const current = parseFloat(paymentAmount.replace(',', '.')) || 0;
    if (current > remaining) {
      setPaymentAmount(remaining.toFixed(2));
    }
  }, [showPaymentModal, sale, paymentDiscountPercent, paymentAmount]);

  // Virgül/nokta fark etmeksizin sayı parse et (19,80 → 19.80)
  const parsePaymentAmount = useCallback((value: string) => {
    const normalized = value.trim().replace(',', '.');
    return parseFloat(normalized);
  }, []);

  const handleProcessPayment = useCallback(async () => {
    if (!dealerId || !saleId || !sale || !isMountedRef.current) return;

    const isUnpaid = paymentMethod === 'ODENMEDI';
    const amount = parsePaymentAmount(paymentAmount);
    if (!isUnpaid && (isNaN(amount) || amount <= 0)) {
      showToast(mounted ? t('admin.dealers.paymentAmountRequired') : 'Geçerli bir ödeme tutarı giriniz', 'error');
      return;
    }

    const subtotal = parseFloat(sale.subtotal || '0');
    const pct = paymentDiscountPercent !== '' ? Math.min(100, Math.max(0, parseFloat(String(paymentDiscountPercent).replace(',', '.')) || 0)) : null;
    const effectiveTotal = pct != null ? Math.max(0, subtotal - (subtotal * pct) / 100) : parseFloat(sale.total || '0');
    if (!isUnpaid && amount > effectiveTotal) {
      showToast(mounted ? t('admin.dealers.paymentAmountExceeds') : 'Ödeme tutarı toplam tutardan fazla olamaz', 'error');
      return;
    }

    try {
      setProcessingPayment(true);

      const body: { amount: string; paymentMethod: string; discountPercent?: number | string } = {
        amount: (isUnpaid ? 0 : amount).toFixed(2),
        paymentMethod,
      };
      if (paymentDiscountPercent !== '' && !isNaN(parseFloat(paymentDiscountPercent))) {
        body.discountPercent = parseFloat(paymentDiscountPercent);
      }

      const response = await fetch(`/api/dealers/${dealerId}/sales/${saleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!isMountedRef.current) return;

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Bilinmeyen hata' }));
        throw new Error(errorData.error || errorData.details || (mounted ? t('admin.dealers.paymentProcessingError') : 'Ödeme işlenemedi'));
      }

      const result = await response.json();
      
      if (!isMountedRef.current) return;

      if (isUnpaid) {
        showToast(mounted ? t('admin.dealers.discountAppliedUnpaid') : 'İskonto uygulandı. Satış ödenmedi olarak kaydedildi.', 'success');
      } else if (result.isFullyPaid) {
        showToast(mounted ? t('admin.dealers.paymentReceivedSuccess') : 'Ödeme başarıyla alındı. Satış tamamen ödendi.', 'success');
      } else {
        showToast(
          mounted ? t('admin.dealers.partialPaymentReceived', { amount: amount.toFixed(2), remaining: result.remainingAmount.toFixed(2) }) : `Kısmi ödeme alındı: $${amount.toFixed(2)}. Kalan borç: $${result.remainingAmount.toFixed(2)}`,
          'success'
        );
      }

      // Satış bilgilerini yenile
      await fetchSale();
      
      // Modal'ı kapat
      if (isMountedRef.current) {
        setShowPaymentModal(false);
        setPaymentAmount('');
        setPaymentMethod('NAKIT');
      }
    } catch (error: any) {
      if (!isMountedRef.current) return;
      console.error('Error processing payment:', error);
      showToast(error?.message || (mounted ? t('admin.dealers.errorProcessingPayment') : 'Ödeme işlenirken hata oluştu'), 'error');
    } finally {
      if (isMountedRef.current) {
        setProcessingPayment(false);
      }
    }
  }, [dealerId, saleId, sale, paymentAmount, paymentDiscountPercent, paymentMethod, fetchSale, mounted, t, parsePaymentAmount]);

  if (!paramsLoaded || loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 w-full overflow-x-hidden">
        <div className="max-w-3xl mx-auto w-full min-w-0">
          <div className="text-center py-12 text-gray-500">{mounted ? t('admin.common.loading') : 'Yükleniyor...'}</div>
        </div>
      </div>
    );
  }

  if (!dealerId || !saleId || !sale) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 w-full overflow-x-hidden">
        <div className="max-w-3xl mx-auto w-full min-w-0 p-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {mounted ? t('admin.common.notFound') : 'Satış bulunamadı veya geçersiz ID.'}
          </div>
          <button
            type="button"
            onClick={() => {
              try {
                if (dealerId) {
                  router.push(`/admin-panel/dealers/${dealerId}/hesap?refresh=true`);
                } else {
                  router.push('/admin-panel/dealers');
                }
              } catch (error: any) {
                console.error('Navigation error:', error);
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {mounted ? t('admin.common.back') : 'Geri Dön'}
          </button>
        </div>
      </div>
    );
  }

  const paymentMethodText: Record<string, string> = {
    NAKIT: mounted ? t('admin.orders.cash') : 'Nakit',
    KREDI_KARTI: mounted ? t('admin.orders.creditCard') : 'Kredi Kartı',
    CEK: mounted ? t('admin.orders.check') : 'Çek',
    ODENMEDI: mounted ? t('admin.orders.unpaid') : 'Ödenmedi',
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 w-full overflow-x-hidden">
      <div className="max-w-3xl mx-auto w-full min-w-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-xl mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-1">{sale.saleNumber}</h1>
              <p className="text-blue-100 text-sm">
                {new Date(sale.createdAt).toLocaleString('tr-TR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              {dealer && (
                <p className="text-blue-100 text-sm mt-1">
                  {mounted ? t('admin.dealers.viewAccount') : 'Müşteri'}: {dealer.companyName}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                try {
                  router.push(`/admin-panel/dealers/${dealerId}/hesap?refresh=true`);
                } catch (err: any) {
                  console.error('Error navigating back:', err);
                }
              }}
              className="text-white hover:text-gray-200 transition-colors p-2 hover:bg-white/10 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 space-y-6">
          {/* Durum ve Ödeme Bilgisi */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <label className="text-xs font-semibold text-gray-500 uppercase block mb-2">{mounted ? t('admin.dealers.status') : 'Durum'}</label>
              {sale.isPaid ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                  ✓ {mounted ? t('admin.dealers.paid') : 'Ödendi'}
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800">
                  ⚠ {mounted ? t('admin.dealers.unpaid') : 'Ödenmedi'}
                </span>
              )}
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <label className="text-xs font-semibold text-gray-500 uppercase block mb-2">{mounted ? t('admin.orders.paymentMethod') : 'Ödeme Yöntemi'}</label>
              <p className="text-gray-900 font-semibold">
                {paymentMethodText[sale.paymentMethod] || sale.paymentMethod}
              </p>
            </div>
          </div>

          {/* Ürünler */}
          {sale.items && sale.items.length > 0 && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  {mounted ? t('admin.dealers.productsLabel') : 'Ürünler'}
                </h2>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={invoiceProductSearch}
                    onChange={(e) => setInvoiceProductSearch(e.target.value)}
                    placeholder={mounted ? t('admin.dealers.searchProductInInvoice') : 'Faturada ürün ara...'}
                    className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  {invoiceProductSearch && (
                    <button
                      type="button"
                      onClick={() => setInvoiceProductSearch('')}
                      className="p-2 text-gray-500 hover:text-gray-700 rounded"
                      aria-label={mounted ? t('admin.common.clear') : 'Temizle'}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                {sale.items
                  .filter((item) => {
                    const q = invoiceProductSearch.trim().toLowerCase();
                    if (!q) return true;
                    return (item.productName || '').toLowerCase().includes(q);
                  })
                  .map((item) => {
                  const imageSrc = item.productImage ? getProductImageSrc(item.productImage) : null;
                  
                  return (
                    <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                      {imageSrc && (
                        <div className="w-16 h-16 bg-white rounded-lg overflow-hidden flex-shrink-0 border border-gray-200 flex items-center justify-center">
                          <img
                            src={imageSrc}
                            alt={item.productName || (mounted ? t('admin.common.productLabel') : 'Ürün')}
                            className="w-full h-full object-contain p-2"
                            loading="lazy"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              console.error('Resim yükleme hatası:', target.src, item.productName);
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent && !parent.querySelector('.error-placeholder')) {
                                const placeholder = document.createElement('span');
                                placeholder.className = 'error-placeholder text-gray-400 text-xs';
                                placeholder.textContent = i18n.t('admin.products.imageUploadError');
                                parent.appendChild(placeholder);
                              }
                            }}
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{getItemProductDisplayName(item)}</h3>
                        <p className="text-sm text-gray-500">
                          {mounted ? t('admin.dealers.quantity') : 'Miktar'}: {item.quantity} × ${parseFloat(item.price || '0').toFixed(2)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-3">
                        <p className="font-bold text-blue-600 text-base sm:text-lg order-1 sm:order-2">
                          ${parseFloat(item.total || '0').toFixed(2)}
                        </p>
                        {sale.saleNumber.startsWith('SAL-') && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleRemoveItem(item.id); }}
                            disabled={removingItemId === item.id}
                            className="px-2 py-1 text-[10px] sm:text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed order-2 sm:order-1"
                          >
                            {removingItemId === item.id ? (mounted ? t('admin.common.loading') : '...') : (mounted ? t('admin.dealers.removeFromInvoice') : 'Faturadan çıkar')}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Fiyat Özeti */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{mounted ? t('admin.dealers.priceSummary') : 'Fiyat Özeti'}</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-700">
                <span>{mounted ? t('cart.subtotal') : 'Ara Toplam'}:</span>
                <span className="font-semibold">${parseFloat(sale.subtotal || '0').toFixed(2)}</span>
              </div>
              {parseFloat(sale.discount || '0') > 0 && (
                <div className="flex justify-between text-sm text-blue-700">
                  <span>{mounted ? t('admin.dealers.discount') : 'İskonto'}:</span>
                  <span className="font-semibold">-${parseFloat(sale.discount || '0').toFixed(2)}</span>
                </div>
              )}
              {parseFloat(sale.discount || '0') > 0 && (
                <div className="flex justify-between text-xs text-gray-600">
                  <span>{mounted ? t('admin.dealers.discountAfter') : 'İskonto Sonrası'}:</span>
                  <span className="font-medium">${(Math.max(0, parseFloat(sale.subtotal || '0') - parseFloat(sale.discount || '0'))).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold text-gray-900 pt-3 border-t-2 border-blue-200">
                <span>{mounted ? t('cart.total') : 'Toplam'}:</span>
                <span className="text-blue-600">${(() => {
                  const subtotal = parseFloat(sale.subtotal || '0');
                  const discount = parseFloat(sale.discount || '0');
                  const afterDiscount = Math.max(0, subtotal - discount);
                  const tps = 0; // Vergi yok
                  const tvq = 0; // Vergi yok
                  const calculatedTotal = Math.round(afterDiscount * 100) / 100;
                  return calculatedTotal.toFixed(2);
                })()}</span>
              </div>
              
              {/* Yapılan Tahsilat ve Kalan Borç Bilgisi */}
              {(() => {
                const subtotal = parseFloat(sale.subtotal || '0');
                const discount = parseFloat(sale.discount || '0');
                const afterDiscount = Math.max(0, subtotal - discount);
                const total = Math.round(afterDiscount * 100) / 100; // Vergi yok
                const paid = parseFloat(sale.paidAmount || '0');
                const remaining = Math.max(0, total - paid);
                const hasPartialPayment = !sale.isPaid && paid > 0;
                
                if (sale.isPaid) {
                  // Tamamen ödendi - ödemeyi iptal et butonu
                  return (
                    <div className="mt-3 pt-3 border-t-2 border-green-200 space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-green-700 font-semibold flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {mounted ? t('admin.dealers.paymentStatus') : 'Ödeme Durumu'}:
                        </span>
                        <span className="text-green-700 font-bold">{mounted ? t('admin.dealers.fullyPaid') : 'Tamamen Ödendi'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!dealerId || !saleId) return;
                          if (!confirm(mounted ? t('admin.dealers.cancelPaymentConfirm') : 'Ödemeyi iptal edip faturayı ödenmedi yapacaksınız. Devam edilsin mi?')) return;
                          try {
                            const res = await fetch(`/api/dealers/${dealerId}/sales/${saleId}`, {
                              method: 'PATCH',
                            });
                            if (res.ok) {
                              showToast(mounted ? t('admin.dealers.paymentCancelled') : 'Ödeme iptal edildi.', 'success');
                              await fetchSale();
                            } else {
                              const data = await res.json();
                              showToast(data?.error || (mounted ? t('admin.common.error') : 'İşlem başarısız'), 'error');
                            }
                          } catch (e) {
                            showToast(mounted ? t('admin.common.error') : 'İşlem başarısız', 'error');
                          }
                        }}
                        className="w-full mt-2 px-3 py-2 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                      >
                        {mounted ? t('admin.dealers.cancelPayment') : 'Ödemeyi İptal Et'}
                      </button>
                    </div>
                  );
                } else if (hasPartialPayment) {
                  // Kısmi ödeme var
                  return (
                    <div className="mt-3 pt-3 border-t-2 border-yellow-200 space-y-2">
                      <div className="flex justify-between text-sm text-yellow-700">
                        <span className="font-semibold flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {mounted ? t('admin.dealers.paymentReceived') : 'Yapılan Tahsilat'}:
                        </span>
                        <span className="font-bold">${paid.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-red-700">
                        <span className="font-semibold flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {mounted ? t('admin.dealers.remainingDebt') : 'Kalan Borç'}:
                        </span>
                        <span className="font-bold">${remaining.toFixed(2)}</span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-yellow-300">
                        <div className="flex items-center gap-2 text-xs text-yellow-600">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {mounted ? t('admin.dealers.partialPaymentNote') : 'Kısmi ödeme yapılmış. Kalan borç tahsil edilmelidir.'}
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  // Hiç ödeme yapılmamış
                  return (
                    <div className="mt-3 pt-3 border-t-2 border-red-200">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-red-700 font-semibold flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {mounted ? t('admin.dealers.remainingDebt') : 'Kalan Borç'}:
                        </span>
                        <span className="text-red-700 font-bold">${total.toFixed(2)}</span>
                      </div>
                    </div>
                  );
                }
              })()}
            </div>
          </div>

          {/* Notlar */}
          {sale.notes && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {mounted ? t('admin.dealers.notes') : 'Notlar'}
              </h2>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-gray-700 whitespace-pre-line">{sale.notes}</p>
              </div>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-gray-200 flex justify-between items-center gap-3 flex-wrap">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  try {
                    if (dealerId && saleId) {
                      // Yeni sekmede fatura sayfasını aç - otomatik yazdırma sayfa yüklendiğinde tetiklenecek
                      const printWindow = window.open(`/admin-panel/dealers/${dealerId}/sales/${saleId}/invoice`, '_blank');
                      if (!printWindow) {
                        showToast(mounted ? t('admin.dealers.errorOpeningInvoice') : 'Pop-up engelleyici nedeniyle fatura açılamadı. Lütfen pop-up engelleyiciyi kapatın.', 'error');
                      }
                    }
                  } catch (err: any) {
                    console.error('Error opening invoice:', err);
                    showToast(mounted ? t('admin.dealers.errorOpeningInvoiceGeneric') : 'Fatura açılırken hata oluştu', 'error');
                  }
                }}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                {mounted ? t('admin.dealers.invoicePrint') : 'Fatura Yazdır'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddToInvoiceModal(true);
                  setAddToInvoiceProduct(null);
                  setAddToInvoiceQuantity('');
                  setAddToInvoiceCategoryId('');
                  setAddToInvoiceSearch('');
                  fetchProductsForInvoice();
                  fetchCategoriesForInvoice();
                }}
                className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                {mounted ? t('admin.dealers.addToInvoice') : 'Faturaya ürün ekle'}
              </button>
              {!sale.isPaid && (
                <button
                  type="button"
                  onClick={handleOpenPaymentModal}
                  className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {mounted ? t('admin.dealers.receivePayment') : 'Ödeme Al'}
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                try {
                  router.push(`/admin-panel/dealers/${dealerId}/hesap?refresh=true`);
                } catch (err: any) {
                  console.error('Error navigating back:', err);
                }
              }}
              className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              {mounted ? t('admin.common.back') : 'Geri Dön'}
            </button>
          </div>
        </div>
      </div>

      {/* Ödeme Alma Modal */}
      {showPaymentModal && sale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-hidden" style={{ maxWidth: '100vw', overflowX: 'hidden', width: '100vw' }}>
          <div className="bg-white rounded-lg shadow-2xl w-auto max-w-xs p-4 space-y-3" style={{ boxSizing: 'border-box' }}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-gray-900">{mounted ? t('admin.dealers.receivePayment') : 'Ödeme Al'}</h2>
              <button
                type="button"
                onClick={handleClosePaymentModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              {/* İskonto % (ödeme alırken uygulanacak) */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {mounted ? t('admin.dealers.manualDiscount') : 'İskonto (%)'} <span className="text-gray-400 font-normal">(opsiyonel)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={paymentDiscountPercent}
                  onChange={(e) => setPaymentDiscountPercent(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                  placeholder="0"
                />
              </div>

              {/* Toplam Tutar / Kalan Borç (iskonto sonrası) */}
              {(() => {
                const subtotal = parseFloat(sale.subtotal || '0');
                const discountPct = paymentDiscountPercent !== '' ? Math.min(100, Math.max(0, parseFloat(paymentDiscountPercent) || 0)) : 0;
                const effectiveTotal = discountPct > 0 ? Math.max(0, subtotal - (subtotal * discountPct) / 100) : parseFloat(sale.total || '0');
                const paid = parseFloat(sale.paidAmount || '0');
                const remaining = Math.max(0, effectiveTotal - paid);
                const hasPartialPayment = !sale.isPaid && paid > 0;

                if (hasPartialPayment) {
                  return (
                    <div className="bg-yellow-50 rounded-lg p-3 border-2 border-yellow-200">
                      <label className="text-[10px] font-semibold text-yellow-700 uppercase block mb-1">
                        {mounted ? t('admin.dealers.remainingDebt') : 'Kalan Borç'}
                      </label>
                      <p className="text-xl font-bold text-yellow-900">
                        ${remaining.toFixed(2)}
                      </p>
                      <div className="mt-1.5 pt-1.5 border-t border-yellow-200">
                        <div className="flex justify-between text-[10px] text-yellow-600">
                          <span>{mounted ? t('admin.dealers.totalAmount') : 'Toplam'}:</span>
                          <span className="font-semibold">${effectiveTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-green-600 mt-0.5">
                          <span>{mounted ? t('admin.dealers.paidAmount') : 'Ödenen'}:</span>
                          <span className="font-semibold">${paid.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div className="bg-blue-50 rounded-lg p-3 border-2 border-blue-200">
                      <label className="text-[10px] font-semibold text-blue-700 uppercase block mb-1">
                        {mounted ? t('admin.dealers.totalAmount') : 'Toplam Tutar'}
                        {discountPct > 0 && (
                          <span className="text-blue-600 font-normal ml-1">{mounted ? t('admin.dealers.afterDiscountPct', { pct: discountPct }) : `(%${discountPct} iskonto sonrası)`}</span>
                        )}
                      </label>
                      <p className="text-xl font-bold text-blue-900">
                        ${effectiveTotal.toFixed(2)}
                      </p>
                    </div>
                  );
                }
              })()}

              {/* Ödeme Tutarı */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  {mounted ? t('admin.dealers.paymentAmount') : 'Ödeme Tutarı'} <span className="text-red-500">*</span>
                </label>
                {(() => {
                  const subtotal = parseFloat(sale.subtotal || '0');
                  const discountPct = paymentDiscountPercent !== '' ? Math.min(100, Math.max(0, parseFloat(paymentDiscountPercent) || 0)) : 0;
                  const effectiveTotal = discountPct > 0 ? Math.max(0, subtotal - (subtotal * discountPct) / 100) : parseFloat(sale.total || '0');
                  const paid = parseFloat(sale.paidAmount || '0');
                  const remaining = Math.max(0, effectiveTotal - paid);
                  return (
                    <>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={remaining}
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base font-semibold"
                        placeholder="0.00"
                      />
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {paid > 0 
                          ? (mounted ? t('admin.dealers.maximumPayment', { amount: remaining.toFixed(2) }) : `Max ${remaining.toFixed(2)}`)
                          : (mounted ? t('admin.dealers.editAmountForPartial') : 'Kısmi ödeme için düzenle')
                        }
                      </p>
                    </>
                  );
                })()}
              </div>

              {/* Ödeme Yöntemi */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  {mounted ? t('admin.orders.paymentMethod') : 'Ödeme Yöntemi'} <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['NAKIT', 'KREDI_KARTI', 'CEK', 'ODENMEDI'] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`px-2 py-2 rounded-lg border-2 text-xs font-medium transition-all ${
                        paymentMethod === method
                          ? method === 'ODENMEDI'
                            ? 'border-amber-500 bg-amber-50 text-amber-700'
                            : 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {paymentMethodText[method]}
                    </button>
                  ))}
                </div>
                {paymentMethod === 'ODENMEDI' && (
                  <p className="text-[10px] text-amber-600 mt-1">
                    {mounted ? t('admin.dealers.unpaidDiscountHint') : 'Sadece iskonto uygulanır, ödeme alınmaz.'}
                  </p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-2 pt-3 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClosePaymentModal}
                disabled={processingPayment}
                className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {mounted ? t('admin.common.cancel') : 'İptal'}
              </button>
              <button
                type="button"
                onClick={handleProcessPayment}
                disabled={processingPayment || (paymentMethod !== 'ODENMEDI' && (!paymentAmount || parsePaymentAmount(paymentAmount) <= 0))}
                className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                {processingPayment ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {mounted ? t('admin.dealers.processing') : 'İşleniyor...'}
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {mounted ? t('admin.dealers.receivePayment') : 'Ödeme Al'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Faturaya ürün ekle modal - Bayi satışı gibi 2 sütun: sol ürünler, sağ fatura sepeti */}
      {showAddToInvoiceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
              <h2 className="text-lg font-bold text-gray-900">{mounted ? t('admin.dealers.addToInvoice') : 'Faturaya ürün ekle'}</h2>
              <button type="button" onClick={() => { setShowAddToInvoiceModal(false); setAddToInvoiceProduct(null); }} className="text-gray-400 hover:text-gray-600 p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 min-h-0 overflow-hidden">
              {/* Sol: Arama + Kategori + Ürün grid (bayi satışı gibi) */}
              <div className="lg:col-span-2 flex flex-col min-h-0 overflow-hidden">
                <div className="flex flex-wrap gap-2 items-center mb-3 flex-shrink-0">
                  <div className="relative flex-1 min-w-0 max-w-[200px] sm:max-w-[240px]">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-gray-400">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <input
                      type="text"
                      value={addToInvoiceSearch}
                      onChange={(e) => setAddToInvoiceSearch(e.target.value)}
                      placeholder={mounted ? t('admin.dealers.searchProducts') : 'Ürün ara...'}
                      className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <select
                    value={addToInvoiceCategoryId}
                    onChange={(e) => setAddToInvoiceCategoryId(e.target.value)}
                    className="py-2 pl-3 pr-8 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none min-w-[140px] bg-white"
                  >
                    <option value="">{mounted ? t('admin.products.allCategories') : 'Tüm kategoriler'}</option>
                    {categories.map((cat) => {
                      const catLabel = lang === 'fr' ? (cat.nameFr || cat.nameEn || cat.name) : lang === 'en' ? (cat.nameEn || cat.nameFr || cat.name) : cat.name;
                      return <option key={cat.id} value={cat.id}>{catLabel || '-'}</option>;
                    })}
                  </select>
                </div>
                <div className="flex-1 overflow-auto min-h-0">
                  {(() => {
                    const normalizeForSearch = (s: string) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                      const filtered = addToInvoiceProducts.filter((p) => {
                      const catId = addToInvoiceCategoryId ? parseInt(addToInvoiceCategoryId, 10) : null;
                      if (catId != null && (p.categoryId ?? null) !== catId) return false;
                      const q = addToInvoiceSearch.trim().toLowerCase();
                      if (!q) return true;
                      const qNorm = normalizeForSearch(addToInvoiceSearch.trim());
                      const pAny = p as { sku?: string | null };
                      const searchable = [p.name, p.baseName, p.baseNameFr, p.baseNameEn, pAny.sku].filter(Boolean).map(s => normalizeForSearch(String(s)));
                      return searchable.some(s => s.includes(qNorm));
                    });
                    return filtered.length === 0 ? (
                      <div className="text-center py-12 text-gray-500 text-sm">
                        {addToInvoiceSearch.trim() ? (mounted ? t('admin.dealers.noSearchResults') : 'Arama sonucu bulunamadı') : (mounted ? t('admin.dealers.noProducts') : 'Ürün bulunamadı')}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                        {filtered.map((p) => {
                          const weightNum = p.weight ? parseFloat(p.weight) : null;
                          const unit = p.unit || '';
                          const weightDisplay = weightNum != null && unit
                            ? (unit === 'Gr' && weightNum >= 1000 && weightNum % 1000 === 0 ? `${(weightNum / 1000)} Kg` : (weightNum % 1 === 0 ? weightNum + ' ' + unit : weightNum.toFixed(2) + ' ' + unit))
                            : null;
                          return (
                            <div
                              key={p.id}
                              role="button"
                              tabIndex={0}
                              onClick={() => {
                                setAddToInvoiceProduct(p);
                                setAddToInvoiceSellUnit((p.packSize ?? 1) > 1 ? 'kutu' : 'adet');
                                setAddToInvoiceQuantity('');
                              }}
                              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setAddToInvoiceProduct(p); setAddToInvoiceSellUnit((p.packSize ?? 1) > 1 ? 'kutu' : 'adet'); setAddToInvoiceQuantity(''); } }}
                              className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md hover:border-emerald-500 transition-all flex flex-col cursor-pointer group"
                            >
                              <div className="relative w-full aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                                {p.images ? (
                                  <img
                                    src={getProductImageSrc(p.images)}
                                    alt={getProductDisplayName(p)}
                                    className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform"
                                    loading="lazy"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                  />
                                ) : (
                                  <span className="text-gray-400 text-xs">{mounted ? t('admin.common.noImage') : 'Resim Yok'}</span>
                                )}
                              </div>
                              <div className="p-2 flex-1 flex flex-col min-w-0">
                                <div className="flex items-start justify-between gap-1 mb-0.5">
                                  <h3 className="font-medium text-gray-900 text-[10px] sm:text-xs leading-tight line-clamp-2 flex-1">{getProductDisplayName(p)}</h3>
                                  {weightDisplay && <span className="text-[10px] text-gray-500 whitespace-nowrap flex-shrink-0">{weightDisplay}</span>}
                                </div>
                                <div className="flex items-center justify-between mt-auto pt-1 gap-1">
                                  <span className="text-xs font-bold text-emerald-600">${parseFloat(p.price || '0').toFixed(2)}</span>
                                  <span className={`text-[10px] ${(p.stock ?? 0) > 0 ? 'text-green-600' : 'text-red-500'}`}>{mounted ? t('admin.products.stock') : 'Stok'}: {p.stock ?? 0}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>
              {/* Sağ: Faturadaki ürünler (sepet) - bayi satışındaki Sepet gibi */}
              <div className="lg:col-span-1 bg-gray-50 rounded-lg border border-gray-200 p-4 flex flex-col min-h-0">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h3 className="text-base font-bold text-gray-900">{mounted ? t('cart.title') : 'Fatura'}</h3>
                  {sale?.items && sale.items.length > 0 && (
                    <span className="bg-emerald-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{sale.items.length}</span>
                  )}
                </div>
                {!sale?.items || sale.items.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                    <svg className="w-14 h-14 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-gray-500 text-sm font-medium">{mounted ? t('admin.dealers.emptyCart') : 'Fatura boş'}</p>
                    <p className="text-gray-400 text-xs mt-1">{mounted ? t('admin.dealers.addProductsToCart') : 'Ürün eklemek için soldaki ürünlere tıklayın'}</p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-auto space-y-2 min-h-0">
                    {sale.items.map((item) => {
                      const productForName = addToInvoiceProducts.find((pr) => pr.id === item.productId);
                      const displayName = productForName ? getProductDisplayName(productForName) : item.productName;
                      return (
                        <div key={item.id} className="flex gap-2 bg-white rounded-lg p-2 border border-gray-200">
                          {item.productImage && (
                            <div className="w-12 h-12 rounded bg-gray-100 flex-shrink-0 overflow-hidden">
                              <img src={getProductImageSrc(item.productImage)} alt="" className="w-full h-full object-contain" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-900 truncate">{displayName}</p>
                            <p className="text-[10px] text-gray-500">{item.quantity} × ${parseFloat(item.price || '0').toFixed(2)} = ${parseFloat(item.total || '0').toFixed(2)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Miktar seçimi alt modalı (ürüne tıklanınca) */}
      {addToInvoiceProduct && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-3" onClick={() => setAddToInvoiceProduct(null)}>
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 w-full max-w-[280px] p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-medium text-gray-900 line-clamp-2">{getProductDisplayName(addToInvoiceProduct)}</p>
            <p className="text-xs text-gray-500">${parseFloat(addToInvoiceProduct.price || '0').toFixed(2)} / {mounted ? t('admin.dealers.piece') : 'adet'}</p>
            {(addToInvoiceProduct.packSize ?? 1) > 1 ? (
              <>
                <p className="text-[10px] text-gray-500 font-medium">{mounted ? t('admin.dealers.sellUnit') : 'Satış birimi'}</p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setAddToInvoiceSellUnit('adet'); setAddToInvoiceQuantity(''); }} className={`flex-1 py-2 rounded-lg border text-sm font-medium ${addToInvoiceSellUnit === 'adet' ? 'border-emerald-400 bg-emerald-50 text-emerald-800' : 'border-gray-200 text-gray-600'}`}>{mounted ? t('admin.dealers.piece') : 'Adet'}</button>
                  <button type="button" onClick={() => { setAddToInvoiceSellUnit('kutu'); setAddToInvoiceQuantity(''); }} className={`flex-1 py-2 rounded-lg border text-sm font-medium ${addToInvoiceSellUnit === 'kutu' ? 'border-emerald-400 bg-emerald-50 text-emerald-800' : 'border-gray-200 text-gray-600'}`}>{addToInvoiceProduct.packSize}&apos;li {lang === 'fr' ? (addToInvoiceProduct.packLabelFr || addToInvoiceProduct.packLabelEn || (mounted ? t('admin.dealers.box') : 'Kutu')) : lang === 'en' ? (addToInvoiceProduct.packLabelEn || addToInvoiceProduct.packLabelFr || (mounted ? t('admin.dealers.box') : 'Kutu')) : (addToInvoiceProduct.packLabelTr || (mounted ? t('admin.dealers.box') : 'Kutu'))}</button>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">{addToInvoiceSellUnit === 'kutu' ? (mounted ? t('admin.dealers.howManyBoxes') : 'Kaç kutu?') : (mounted ? t('admin.dealers.howManyPieces') : 'Kaç adet?')}</label>
                  <input type="number" min={0} value={addToInvoiceQuantity === '' ? '' : addToInvoiceQuantity} onChange={(e) => { const v = e.target.value; if (v === '') { setAddToInvoiceQuantity(''); return; } const n = parseInt(v, 10); if (!isNaN(n)) setAddToInvoiceQuantity(Math.max(0, n)); }} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
              </>
            ) : (
              <div>
                <label className="block text-xs text-gray-500 mb-1">{mounted ? t('admin.dealers.howManyPieces') : 'Kaç adet?'}</label>
                <input type="number" min={0} value={addToInvoiceQuantity === '' ? '' : addToInvoiceQuantity} onChange={(e) => { const v = e.target.value; if (v === '') { setAddToInvoiceQuantity(''); return; } const n = parseInt(v, 10); if (!isNaN(n)) setAddToInvoiceQuantity(Math.max(0, n)); }} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setAddToInvoiceProduct(null)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">{mounted ? t('admin.common.cancel') : 'İptal'}</button>
              <button type="button" onClick={handleAddProductToInvoice} disabled={addingToInvoice || (addToInvoiceQuantity === '' ? 0 : addToInvoiceQuantity) <= 0} className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
                {addingToInvoice ? (mounted ? t('admin.common.loading') : '...') : (mounted ? t('admin.dealers.addToCart') : 'Faturaya ekle')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
