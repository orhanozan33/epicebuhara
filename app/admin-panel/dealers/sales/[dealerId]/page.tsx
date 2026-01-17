'use client';

/**
 * CRITICAL STABILITY PATTERNS - DO NOT MODIFY WITHOUT UNDERSTANDING
 * 
 * This component uses several critical patterns to prevent crashes and state corruption:
 * 
 * 1. isMountedRef Pattern:
 *    - ALWAYS check isMountedRef.current before ANY state update
 *    - ALWAYS reset isMountedRef.current = true in useEffect cleanup
 *    - Prevents memory leaks and "Cannot update unmounted component" errors
 * 
 * 2. Functional State Updates:
 *    - ALWAYS use functional updates: setState(prev => ...)
 *    - NEVER use state values directly in callbacks (use prev parameter)
 *    - Prevents race conditions and stale closures
 * 
 * 3. AbortController Pattern:
 *    - ALWAYS create AbortController in useEffect
 *    - ALWAYS abort in cleanup function
 *    - ALWAYS check signal.aborted before state updates
 *    - Prevents API calls from updating state after unmount
 * 
 * 4. useCallback/useMemo Pattern:
 *    - ALWAYS wrap callbacks in useCallback with correct dependencies
 *    - ALWAYS wrap expensive computations in useMemo
 *    - Prevents unnecessary re-renders and infinite loops
 * 
 * 5. Safe Array/Type Checks:
 *    - ALWAYS use Array.isArray() before array operations
 *    - ALWAYS check typeof and isNaN for numbers
 *    - ALWAYS provide fallback values (|| [] or ?? [])
 *    - Prevents runtime errors from unexpected data types
 * 
 * 6. Next.js 15 Params Handling:
 *    - ALWAYS handle params as potential Promise
 *    - ALWAYS wait for paramsLoaded before using params
 *    - Prevents "Cannot read property of undefined" errors
 * 
 * 7. Error Boundaries:
 *    - ALWAYS wrap async operations in try-catch
 *    - ALWAYS check isMountedRef before showing toasts
 *    - ALWAYS handle AbortError gracefully
 *    - Prevents unhandled promise rejections
 * 
 * WHEN MODIFYING THIS FILE:
 * - Maintain all isMountedRef checks
 * - Keep functional state updates
 * - Preserve AbortController pattern
 * - Test after EVERY change
 * - Check browser console for warnings
 */

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { showToast } from '@/components/Toast';
import Image from 'next/image';

interface Product {
  id: number;
  name: string;
  baseName: string | null;
  slug: string | null;
  price: string;
  stock: number | null;
  images: string | null;
  isActive: boolean;
  weight: string | null;
  unit: string | null;
}

interface CartItem {
  productId: number;
  productName: string;
  productImage: string | null;
  price: number;
  quantity: number;
  total: number;
}

interface Dealer {
  id: number;
  companyName: string;
  discount: string;
}

export default function BayiSatisPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  
  // CRITICAL: isMountedRef MUST be at component top level
  // DO NOT move this inside useEffect or any conditional block
  const isMountedRef = useRef(true);
  
  // CRITICAL: State initialization - use functional initializers for complex values
  const [dealerId, setDealerId] = useState<number | null>(null);
  const [paramsLoaded, setParamsLoaded] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'NAKIT' | 'KREDI_KARTI' | 'CEK' | 'ODENMEDI'>('NAKIT');
  const [notes, setNotes] = useState('');
  const [dealer, setDealer] = useState<Dealer | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [manualDiscount, setManualDiscount] = useState<string>(''); // Manuel iskonto yüzdesi
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // CRITICAL: Next.js 15 params handling - ALWAYS handle as potential Promise
  // DO NOT access params.dealerId directly - must wait for paramsLoaded
  useEffect(() => {
    let isActive = true;
    
    const resolveParams = async () => {
      try {
        let resolvedParams: any = params;
        
        // CRITICAL: Promise detection for Next.js 15+
        if (params && typeof params === 'object' && 'then' in params && typeof (params as any).then === 'function') {
          resolvedParams = await params;
        }
        
        // CRITICAL: Safe parsing with validation
        const id = resolvedParams?.dealerId 
          ? parseInt(String(resolvedParams.dealerId)) 
          : null;
        
        // CRITICAL: Always check isMountedRef before state update
        if (isActive && isMountedRef.current) {
          setDealerId(id);
          setParamsLoaded(true);
        }
      } catch (error: any) {
        console.error('Error resolving params:', error);
        // CRITICAL: Set paramsLoaded even on error to prevent infinite loading
        if (isActive && isMountedRef.current) {
          setDealerId(null);
          setParamsLoaded(true);
        }
      }
    };
    
    resolveParams();
    
    // CRITICAL: Cleanup to prevent state updates after unmount
    return () => {
      isActive = false;
    };
  }, [params]);

  // CRITICAL: useCallback with empty deps - function should NOT depend on state
  // CRITICAL: Always use AbortSignal for API calls
  const fetchProducts = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch('/api/products?admin=true', {
        cache: 'no-store',
        signal, // CRITICAL: Pass signal to allow cancellation
      });

      // CRITICAL: Check both signal.aborted AND isMountedRef
      if (signal?.aborted || !isMountedRef.current) return;

      if (!response.ok) {
        throw new Error(`Ürünler getirilemedi: ${response.status}`);
      }

      const data = await response.json();
      
      // CRITICAL: Always validate array before filtering
      const activeProducts = Array.isArray(data)
        ? data.filter((p: Product) => p.isActive && (p.stock ?? 0) > 0)
        : [];

      // CRITICAL: Check isMountedRef before state update
      if (isMountedRef.current) {
        setProducts(activeProducts);
      }
    } catch (error: any) {
      // CRITICAL: Always handle AbortError silently (expected on unmount)
      if (error?.name === 'AbortError' || !isMountedRef.current) return;
      
      console.error('Error fetching products:', error);
      try {
        // CRITICAL: Check isMountedRef before showing toast
        if (isMountedRef.current) {
          showToast(mounted ? t('admin.common.error') : 'Ürünler yüklenirken hata oluştu', 'error');
        }
      } catch (toastError) {
        console.error('Error showing toast:', toastError);
      }
    } finally {
      // CRITICAL: Always check isMountedRef in finally block
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []); // CRITICAL: Empty deps - function should be stable

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
      }
    } catch (error: any) {
      if (error?.name === 'AbortError' || !isMountedRef.current) return;
      console.error('Error fetching dealer:', error);
      try {
        showToast(mounted ? t('admin.dealers.errorLoadingDealer') : 'Bayi bilgileri yüklenirken hata oluştu', 'error');
      } catch (toastError) {
        console.error('Error showing toast:', toastError);
      }
    }
  }, [dealerId, mounted, t]);

  // CRITICAL: Data loading effect - MUST wait for paramsLoaded
  // CRITICAL: MUST include all dependencies to prevent stale closures
  useEffect(() => {
    // CRITICAL: Early return if params not loaded yet
    if (!paramsLoaded) {
      return;
    }

    // CRITICAL: Handle invalid dealerId gracefully
    if (!dealerId) {
      if (isMountedRef.current) {
        setLoading(false);
      }
      return;
    }

    // CRITICAL: Reset mounted flag for this effect cycle
    isMountedRef.current = true;
    
    // CRITICAL: Create new AbortController for each effect run
    const abortController = new AbortController();
    const signal = abortController.signal;

    const loadData = async () => {
      // CRITICAL: Check isMountedRef at start of async function
      if (!isMountedRef.current) return;
      
      try {
        await Promise.all([
          fetchProducts(signal),
          fetchDealer(signal),
        ]);
      } catch (error: any) {
        // CRITICAL: Only log errors if not aborted and still mounted
        if (!signal.aborted && isMountedRef.current) {
          console.error('Error loading data:', error);
        }
      }
    };

    loadData();

    // CRITICAL: Cleanup function MUST abort controller
    return () => {
      isMountedRef.current = false;
      abortController.abort();
    };
  }, [paramsLoaded, dealerId, fetchProducts, fetchDealer]); // CRITICAL: All deps must be included

  const filteredProducts = useMemo(() => {
    const safeProducts = Array.isArray(products) ? products : [];
    const searchLower = (searchTerm || '').toLowerCase().trim();
    
    if (!searchLower) return safeProducts;
    
    return safeProducts.filter((product) => {
      try {
        if (!product || !product.name) return false;
        const nameMatch = product.name.toLowerCase().includes(searchLower);
        const baseNameMatch = product.baseName && product.baseName.toLowerCase().includes(searchLower);
        return nameMatch || baseNameMatch;
      } catch (err: any) {
        console.warn('Error filtering product:', err?.message || err);
        return false;
      }
    });
  }, [products, searchTerm]);

  // CRITICAL: useCallback with empty deps - function should NOT depend on cart state
  // CRITICAL: Use functional state update to avoid stale closures
  const addToCart = useCallback((product: Product) => {
    if (!mounted) return;
    // CRITICAL: Check isMountedRef before any operations
    if (!isMountedRef.current) return;
    
    try {
      // CRITICAL: Validate input parameters
      if (!product || typeof product.id !== 'number' || isNaN(product.id)) {
        throw new Error(mounted ? t('admin.dealers.invalidProduct') : 'Geçersiz ürün');
      }

      const price = parseFloat(product.price || '0');
      if (isNaN(price) || price < 0 || !isFinite(price)) {
        throw new Error(mounted ? t('admin.dealers.invalidPrice') : 'Geçersiz fiyat');
      }

      // CRITICAL: ALWAYS use functional state update
      setCart((prevCart) => {
        // CRITICAL: Check isMountedRef inside updater function
        if (!isMountedRef.current) return prevCart;
        
        // CRITICAL: Always validate array before operations
        const safeCart = Array.isArray(prevCart) ? prevCart : [];
        const existingItem = safeCart.find((item) => item.productId === product.id);

        if (existingItem) {
          return safeCart.map((item) => {
            if (item.productId === product.id) {
              const newQuantity = (typeof item.quantity === 'number' ? item.quantity : 0) + 1;
              const itemPrice = typeof item.price === 'number' && !isNaN(item.price) ? item.price : 0;
              return {
                ...item,
                quantity: Math.max(1, newQuantity),
                total: newQuantity * itemPrice,
              };
            }
            return item;
          });
        } else {
          let imageUrl: string | null = null;
          try {
            if (product.images && typeof product.images === 'string') {
              try {
                const parsed: unknown = JSON.parse(product.images);
                if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
                  imageUrl = parsed[0];
                }
              } catch (parseErr) {
                // JSON değilse, direkt string olarak kullan
                const trimmed = product.images.trim();
                if (trimmed) {
                  imageUrl = trimmed.split(',')[0].trim();
                }
              }
            }
          } catch (parseError: any) {
            console.warn('Error parsing product images:', parseError?.message || parseError);
            // Images parse edilemese bile devam et
          }

          return [
            ...safeCart,
            {
              productId: product.id,
              productName: product.name || (mounted ? t('admin.common.notFound') : 'İsimsiz Ürün'),
              productImage: imageUrl,
              price,
              quantity: 1,
              total: price,
            },
          ];
        }
      });
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      try {
        showToast(error?.message || (mounted ? t('admin.dealers.addToCartError') : 'Ürün sepete eklenirken hata oluştu'), 'error');
      } catch (toastError) {
        console.error('Error showing toast:', toastError);
      }
    }
  }, [mounted, t]);

  const removeFromCart = useCallback((productId: number) => {
    if (!isMountedRef.current) return;
    
    try {
      if (typeof productId !== 'number' || isNaN(productId) || productId <= 0) {
        throw new Error(mounted ? t('admin.dealers.invalidProduct') : 'Geçersiz ürün');
      }
      setCart((prevCart) => {
        if (!isMountedRef.current) return prevCart;
        const safeCart = Array.isArray(prevCart) ? prevCart : [];
        return safeCart.filter((item) => item.productId !== productId);
      });
    } catch (error: any) {
      console.error('Error removing from cart:', error);
      try {
        showToast(error?.message || (mounted ? t('admin.dealers.removeFromCartError') : 'Ürün sepetten çıkarılırken hata oluştu'), 'error');
      } catch (toastError) {
        console.error('Error showing toast:', toastError);
      }
    }
  }, []);

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    if (!isMountedRef.current) return;
    
    if (typeof quantity !== 'number' || isNaN(quantity) || quantity < 1) {
      removeFromCart(productId);
      return;
    }

    try {
      if (typeof productId !== 'number' || isNaN(productId) || productId <= 0) {
        throw new Error(mounted ? t('admin.dealers.invalidProduct') : 'Geçersiz ürün');
      }
      
      if (typeof quantity !== 'number' || isNaN(quantity) || quantity < 1 || !isFinite(quantity)) {
        throw new Error(mounted ? t('admin.dealers.invalidQuantity') : 'Geçersiz miktar');
      }

      const safeQuantity = Math.max(1, Math.floor(quantity));
      
      setCart((prevCart) => {
        if (!isMountedRef.current) return prevCart;
        const safeCart = Array.isArray(prevCart) ? prevCart : [];
        return safeCart.map((item) => {
          if (item.productId === productId) {
            const itemPrice = typeof item.price === 'number' && !isNaN(item.price) && isFinite(item.price) 
              ? item.price 
              : 0;
            return {
              ...item,
              quantity: safeQuantity,
              total: safeQuantity * itemPrice,
            };
          }
          return item;
        });
      });
    } catch (error: any) {
      console.error('Error updating quantity:', error);
      try {
        showToast(error?.message || (mounted ? t('admin.dealers.updateQuantityError') : 'Miktar güncellenirken hata oluştu'), 'error');
      } catch (toastError) {
        console.error('Error showing toast:', toastError);
      }
    }
  }, [removeFromCart, mounted, t]);

  const subtotal = useMemo(() => {
    const safeCart = Array.isArray(cart) ? cart : [];
    return safeCart.reduce((sum, item) => {
      const itemTotal = typeof item.total === 'number' && !isNaN(item.total) ? item.total : 0;
      return sum + itemTotal;
    }, 0);
  }, [cart]);
  
  // Otomatik iskonto (bayiden gelen)
  const autoDiscountPercent = useMemo(() => {
    return dealer && dealer.discount 
      ? (parseFloat(dealer.discount) || 0) 
      : 0;
  }, [dealer]);
  
  // Manuel iskonto yüzdesi
  const manualDiscountPercent = useMemo(() => {
    if (!manualDiscount || manualDiscount.trim() === '') return 0;
    const parsed = parseFloat(manualDiscount);
    if (isNaN(parsed) || parsed < 0) return 0;
    if (parsed > 100) return 100; // Max %100
    return parsed;
  }, [manualDiscount]);
  
  // Toplam iskonto yüzdesi (otomatik varsa onu kullan, yoksa manuel)
  const discountPercent = useMemo(() => {
    return autoDiscountPercent > 0 ? autoDiscountPercent : manualDiscountPercent;
  }, [autoDiscountPercent, manualDiscountPercent]);
  
  const discountAmount = useMemo(() => {
    return Math.max(0, (subtotal * discountPercent) / 100);
  }, [subtotal, discountPercent]);
  
  // İskonto sonrası tutar (TPS ve TVQ öncesi)
  const afterDiscount = useMemo(() => {
    return Math.max(0, subtotal - discountAmount);
  }, [subtotal, discountAmount]);
  
  // TPS (Quebec Sales Tax) %5
  const tpsAmount = useMemo(() => {
    return Math.round((afterDiscount * 0.05) * 100) / 100;
  }, [afterDiscount]);
  
  // TVQ (Quebec Goods and Services Tax) %9.975
  // Quebec sistemi: TVQ, TPS eklenmiş fiyat üzerinden hesaplanır
  const tvqAmount = useMemo(() => {
    return Math.round((afterDiscount + tpsAmount) * 0.09975 * 100) / 100;
  }, [afterDiscount, tpsAmount]);
  
  // Toplam (İskonto + TPS + TVQ)
  const total = useMemo(() => {
    return Math.round((afterDiscount + tpsAmount + tvqAmount) * 100) / 100;
  }, [afterDiscount, tpsAmount, tvqAmount]);

  const handleSubmit = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    if (!dealerId) {
      showToast(mounted ? t('admin.dealers.dealerIdNotFound') : 'Bayi ID bulunamadı', 'error');
      return;
    }

    const currentCart = Array.isArray(cart) ? cart : [];
    if (currentCart.length === 0) {
      showToast(mounted ? t('admin.dealers.addProductToCart') : 'Sepete en az bir ürün ekleyin', 'error');
      return;
    }

    try {
      if (!isMountedRef.current) return;
      setSubmitting(true);

      const saleData = {
        items: currentCart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        paymentMethod,
        notes: notes.trim() || null,
      };

      const response = await fetch(`/api/dealers/${dealerId}/sales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saleData),
      });

      if (!isMountedRef.current) return;

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Bilinmeyen hata' }));
        throw new Error(errorData.error || errorData.details || (mounted ? t('admin.dealers.createFailed') : 'Satış oluşturulamadı'));
      }

      const result = await response.json();
      
      if (!isMountedRef.current) return;
      
      const paymentMethodText = {
        NAKIT: mounted ? t('admin.orders.cash') : 'Nakit',
        KREDI_KARTI: mounted ? t('admin.orders.creditCard') : 'Kredi Kartı',
        CEK: mounted ? t('admin.orders.check') : 'Çek',
        ODENMEDI: mounted ? t('admin.orders.unpaid') : 'Ödenmedi (Borç)',
      }[paymentMethod];

      showToast(
        mounted ? t('admin.dealers.saleCreatedSuccess', { saleNumber: result.saleNumber, paymentMethod: paymentMethodText }) : `Satış başarıyla oluşturuldu! Satış No: ${result.saleNumber} | Ödeme: ${paymentMethodText}`,
        'success'
      );

      // Sepeti temizle ve sayfayı yenile
      if (isMountedRef.current) {
        setCart([]);
        setNotes('');
        setPaymentMethod('NAKIT');
        setManualDiscount('');
      }

      // Bayi listesine dön
      if (isMountedRef.current) {
        setTimeout(() => {
          if (isMountedRef.current) {
            router.push('/admin-panel/dealers');
          }
        }, 1500);
      }
    } catch (error: any) {
      if (!isMountedRef.current) return;
      console.error('Error creating sale:', error);
      showToast(error?.message || (mounted ? t('admin.dealers.errorCreatingSale') : 'Satış oluşturulamadı'), 'error');
    } finally {
      if (isMountedRef.current) {
        setSubmitting(false);
      }
    }
  }, [dealerId, cart, paymentMethod, notes, router, mounted, t]);

  // CRITICAL: Global cleanup effect - MUST be last effect
  // This ensures isMountedRef is always false when component unmounts
  useEffect(() => {
    // CRITICAL: Reset mounted flag on mount
    isMountedRef.current = true;
    
    // CRITICAL: Cleanup on unmount
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Params yüklenene kadar loading göster
  if (!paramsLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 w-full overflow-x-hidden">
        <div className="max-w-7xl mx-auto w-full min-w-0">
          <div className="text-center py-12 text-gray-500">{mounted ? t('admin.common.loading') : 'Yükleniyor...'}</div>
        </div>
      </div>
    );
  }

  // Geçersiz bayi ID kontrolü
  if (!dealerId) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 w-full overflow-x-hidden">
        <div className="max-w-7xl mx-auto w-full min-w-0 p-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {mounted ? t('admin.dealers.invalidDealerId') : 'Geçersiz bayi ID. Lütfen bayi listesinden satış yapmak istediğiniz bayiyi seçin.'}
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

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto w-full min-w-0">
        {/* Mobilde sağ üstte geri butonu */}
        <div className="lg:hidden flex justify-end mb-4">
          <button
            type="button"
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.preventDefault();
              e.stopPropagation();
              try {
                router.push('/admin-panel/dealers');
              } catch (err: any) {
                console.error('Error navigating back:', err);
                try {
                  showToast(mounted ? t('admin.dealers.errorNavigation') : 'Sayfaya dönülürken hata oluştu', 'error');
                } catch (toastErr) {
                  console.error('Error showing toast:', toastErr);
                }
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {mounted ? t('admin.common.back') : 'Geri'}
          </button>
        </div>

        {/* Header - Sadece desktop'ta görünür */}
        <div className="hidden lg:flex mb-6 flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{mounted ? t('admin.dealers.salesTitle') : 'Bayi Satışı'}</h1>
            {dealer && (
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span className="text-gray-700 font-medium">{dealer.companyName}</span>
                </div>
                {discountPercent > 0 && (
                  <div className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{mounted ? t('admin.dealers.discount') : 'İskonto'}: %{discountPercent.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.preventDefault();
              e.stopPropagation();
              try {
                router.push('/admin-panel/dealers');
              } catch (err: any) {
                console.error('Error navigating back:', err);
                try {
                  showToast(mounted ? t('admin.dealers.errorNavigation') : 'Sayfaya dönülürken hata oluştu', 'error');
                } catch (toastErr) {
                  console.error('Error showing toast:', toastErr);
                }
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full min-w-0">
          {/* Sağ Taraf - Sepet ve Ödeme - Mobilde en üstte */}
          <div className="lg:col-span-1 order-1 lg:order-2 bg-white rounded-xl shadow-lg border-2 border-gray-100 p-4 md:p-6 w-full min-w-0 overflow-x-hidden">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b-2 border-gray-100">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h2 className="text-2xl font-bold text-gray-900">{mounted ? t('cart.title') : 'Sepet'}</h2>
              {cart.length > 0 && (
                <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {cart.length}
                </span>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-gray-500 text-sm font-medium">{mounted ? t('admin.dealers.emptyCart') : 'Sepet boş'}</p>
                <p className="text-gray-400 text-xs mt-1">{mounted ? t('admin.dealers.addProductsToCart') : 'Ürün eklemek için ürünlere tıklayın'}</p>
              </div>
            ) : (
              <>
                {/* Sepet Ürünleri */}
                <div className="space-y-3 mb-6 max-h-96 overflow-y-auto overflow-x-hidden pr-2">
                  {cart.map((item) => (
                    <div key={item.productId} className="flex gap-3 bg-gray-50 rounded-lg p-3 border border-gray-200 hover:border-blue-300 transition-all">
                      {item.productImage && (
                        <div className="relative w-20 h-20 bg-white rounded-lg flex-shrink-0 overflow-hidden shadow-sm">
                          <Image
                            src={(() => {
                              if (!item.productImage) return '/placeholder.png';
                              // Eğer zaten http veya / ile başlıyorsa, olduğu gibi kullan
                              if (item.productImage.startsWith('http') || item.productImage.startsWith('/')) {
                                return item.productImage;
                              }
                              // Değilse /uploads/products/ ekle
                              return `/uploads/products/${item.productImage}`;
                            })()}
                            alt={item.productName || 'Ürün'}
                            fill
                            className="object-cover"
                            sizes="80px"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-gray-900 truncate mb-1">
                          {item.productName}
                        </h4>
                        <p className="text-blue-600 font-bold text-sm mb-2">
                          ${item.price.toFixed(2)}
                        </p>
                        <div className="flex items-center gap-2 mb-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuantity(item.productId, item.quantity - 1);
                            }}
                            className="w-7 h-7 bg-white border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all font-bold text-sm flex items-center justify-center"
                          >
                            −
                          </button>
                          <span className="text-sm font-bold text-gray-900 w-8 text-center bg-white border-2 border-gray-200 rounded-lg py-1">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuantity(item.productId, item.quantity + 1);
                            }}
                            className="w-7 h-7 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-bold text-sm flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                        <p className="text-gray-900 font-bold text-base">
                          ${item.total.toFixed(2)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromCart(item.productId);
                        }}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg p-1.5 transition-all flex-shrink-0 h-fit"
                        title="Kaldır"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>

                {/* Fiyat Özeti */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 mb-6 border-2 border-blue-100">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-700">
                      <span className="font-medium">{mounted ? t('cart.subtotal') : 'Ara Toplam'}:</span>
                      <span className="font-semibold">${subtotal.toFixed(2)}</span>
                    </div>
                    
                    {/* Manuel İskonto Alanı - Sadece otomatik iskonto yoksa göster */}
                    {autoDiscountPercent === 0 && (
                      <div className="bg-white px-3 py-2 rounded-lg border border-gray-200 mb-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          {mounted ? t('admin.dealers.manualDiscount') : 'Manuel İskonto (%)'}
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={manualDiscount}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              try {
                                const value = e.target.value;
                                setManualDiscount(value);
                              } catch (err: any) {
                                console.error('Error updating manual discount:', err);
                              }
                            }}
                            placeholder="0"
                            className="flex-1 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              try {
                                setManualDiscount('');
                              } catch (err: any) {
                                console.error('Error clearing manual discount:', err);
                              }
                            }}
                            className="px-2 py-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Temizle"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {discountPercent > 0 && (
                      <div className="flex justify-between text-sm text-blue-700 bg-blue-100 px-3 py-2 rounded-lg">
                        <span className="font-medium flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {autoDiscountPercent > 0 ? (mounted ? t('admin.dealers.automatic') : 'Otomatik') : (mounted ? t('admin.dealers.manual') : 'Manuel')} {mounted ? t('admin.dealers.discount') : 'İskonto'} (%{discountPercent.toFixed(2)}):
                        </span>
                        <span className="font-bold">-${discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    {discountPercent > 0 && (
                      <div className="flex justify-between text-xs text-gray-600 pb-1">
                        <span>İskonto Sonrası:</span>
                        <span className="font-medium">${afterDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    {/* TPS (Quebec Sales Tax) */}
                    <div className="flex justify-between text-sm text-gray-700 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
                      <span className="font-medium">{mounted ? t('admin.invoices.tps') : 'TPS (5%)'}:</span>
                      <span className="font-semibold">${tpsAmount.toFixed(2)}</span>
                    </div>
                    {/* TVQ (Quebec Goods and Services Tax) */}
                    <div className="flex justify-between text-sm text-gray-700 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
                      <span className="font-medium">{mounted ? t('admin.invoices.tvq') : 'TVQ (9.975%)'}:</span>
                      <span className="font-semibold">${tvqAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t-2 border-blue-200 mt-2">
                      <span>{mounted ? t('cart.total') : 'Toplam'}:</span>
                      <span className="text-blue-600">${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Ödeme Yöntemi */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    {mounted ? t('admin.orders.paymentMethod') : 'Ödeme Yöntemi'}
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                      try {
                        const value = e.target.value as typeof paymentMethod;
                        if (['NAKIT', 'KREDI_KARTI', 'CEK', 'ODENMEDI'].includes(value)) {
                          setPaymentMethod(value);
                        }
                      } catch (err: any) {
                        console.error('Error updating payment method:', err);
                      }
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
                  >
                    <option value="NAKIT">💵 {mounted ? t('admin.orders.cash') : 'Nakit'}</option>
                    <option value="KREDI_KARTI">💳 {mounted ? t('admin.orders.creditCard') : 'Kredi Kartı'}</option>
                    <option value="CEK">📝 {mounted ? t('admin.orders.check') : 'Çek'}</option>
                    <option value="ODENMEDI">📋 {mounted ? t('admin.orders.unpaid') : 'Ödenmedi (Borç)'}</option>
                  </select>
                </div>

                {/* Notlar */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    {mounted ? t('admin.dealers.notesOptional') : 'Notlar (Opsiyonel)'}
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                      try {
                        setNotes(e.target.value || '');
                      } catch (err: any) {
                        console.error('Error updating notes:', err);
                      }
                    }}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-y"
                    placeholder="Ek notlar..."
                  />
                </div>

                {/* Satışı Tamamla */}
                <button
                  type="button"
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.preventDefault();
                    e.stopPropagation();
                    try {
                      handleSubmit();
                    } catch (err: any) {
                      console.error('Error submitting sale:', err);
                      try {
                        showToast(mounted ? t('admin.common.processingError') : 'Satış işlenirken hata oluştu', 'error');
                      } catch (toastErr) {
                        console.error('Error showing toast:', toastErr);
                      }
                    }
                  }}
                  disabled={submitting || cart.length === 0}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-bold text-lg shadow-lg hover:shadow-xl disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {mounted ? t('admin.dealers.processing') : 'İşleniyor...'}
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {mounted ? t('admin.dealers.completeSale') : 'Satışı Tamamla'}
                    </>
                  )}
                </button>
              </>
            )}
          </div>

          {/* Sol Taraf - Ürünler - Mobilde altta */}
          <div className="lg:col-span-2 order-2 lg:order-1 bg-white rounded-lg shadow p-4 md:p-6 w-full min-w-0 overflow-x-hidden">
            {/* Arama */}
            <div className="mb-6 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder={mounted ? t('admin.dealers.searchProducts') : 'Ürün ara...'}
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  try {
                    setSearchTerm(e.target.value || '');
                  } catch (err: any) {
                    console.error('Error updating search term:', err);
                  }
                }}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:shadow-md"
              />
            </div>

            {/* Ürünler Listesi */}
            {loading ? (
              <div className="text-center py-12 text-gray-500">{mounted ? t('admin.common.loading') : 'Yükleniyor...'}</div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                {searchTerm ? (mounted ? t('admin.dealers.noSearchResults') : 'Arama sonucu bulunamadı') : (mounted ? t('admin.dealers.noProducts') : 'Ürün bulunamadı')}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 w-full min-w-0">
                {filteredProducts.map((product) => {

                  const weight = product.weight ? parseFloat(product.weight) : null;
                  const unit = product.unit || '';
                  const weightDisplay = weight && unit 
                    ? (() => {
                        const weightNum = parseFloat(product.weight || '0');
                        if (unit === 'Gr' && weightNum >= 1000 && weightNum % 1000 === 0) {
                          return `${(weightNum / 1000)} Kg`;
                        }
                        return weightNum % 1 === 0 ? weightNum.toString() + ' ' + unit : weightNum.toFixed(2) + ' ' + unit;
                      })()
                    : null;

                  return (
                    <div
                      key={product.id}
                      className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all hover:border-blue-500 flex flex-col cursor-pointer group"
                      onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                        e.preventDefault();
                        e.stopPropagation();
                        try {
                          addToCart(product);
                        } catch (err: any) {
                          console.error('Error adding product to cart:', err);
                        }
                      }}
                    >
                      {/* Resim Container - Ana sayfadaki gibi */}
                      <div className="relative w-full aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                        {product.images ? (
                          <img 
                            src={(() => {
                              const imgSrc = product.images.split(',')[0].trim();
                              // Eğer src / ile başlamıyorsa ve http ile başlamıyorsa, path ekle
                              if (imgSrc && !imgSrc.startsWith('/') && !imgSrc.startsWith('http')) {
                                return `/uploads/products/${imgSrc}`;
                              }
                              return imgSrc;
                            })()}
                            alt={product.name || 'Ürün'} 
                            className="w-full h-full object-contain p-2 hover:scale-105 transition-transform duration-300" 
                            loading="lazy"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              console.error('Resim yükleme hatası:', target.src, product.name);
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent && !parent.querySelector('.error-placeholder')) {
                                const placeholder = document.createElement('span');
                                placeholder.className = 'error-placeholder text-gray-400 text-xs';
                                placeholder.textContent = mounted ? t('admin.products.imageUploadError') : 'Resim Yüklenemedi';
                                parent.appendChild(placeholder);
                              }
                            }}
                          />
                        ) : (
                          <span className="text-gray-400 text-xs">{mounted ? t('admin.common.noImage') : 'Resim Yok'}</span>
                        )}
                      </div>
                      
                      {/* Ürün Bilgileri - Daha kompakt */}
                      <div className="p-2 flex-1 flex flex-col">
                        <div className="flex items-start justify-between gap-1.5 mb-1">
                          <h3 className="font-medium text-gray-900 text-[10px] leading-tight line-clamp-2 flex-1 group-hover:text-blue-600 transition-colors">
                            {product.name}
                          </h3>
                          {/* Gramaj Bilgisi - Sağda */}
                          {weightDisplay && (
                            <span className="text-[10px] text-gray-500 whitespace-nowrap flex-shrink-0">
                              {weightDisplay}
                            </span>
                          )}
                        </div>
                         
                        {/* Fiyat ve Stok Bilgisi - Daha kompakt */}
                        <div className="flex items-center justify-between mt-auto pt-1 gap-1">
                          <span className="text-xs font-bold text-blue-600">
                            ${parseFloat(product.price || '0').toFixed(2)}
                          </span>
                          {/* Stok Bilgisi */}
                          <div className="flex items-center gap-0.5">
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            <span className={`text-[10px] ${product.stock && product.stock > 0 ? 'text-green-600 font-medium' : 'text-red-500'}`}>
                              {product.stock ?? 0}
                            </span>
                          </div>
                        </div>
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
  );
}