'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { showToast } from '@/components/Toast';
import html2pdf from 'html2pdf.js';

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

interface Dealer {
  id: number;
  companyName: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  postalCode: string | null;
  tpsNumber: string | null;
  tvqNumber: string | null;
}

interface CompanySettings {
  companyName: string;
  address: string;
  phone: string;
  email: string;
  postalCode: string;
  tpsNumber: string;
  tvqNumber: string;
}

export default function FaturaPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { t, i18n } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const isMountedRef = useRef(true);
  const invoiceContentRef = useRef<HTMLDivElement>(null);
  const hasDownloadedRef = useRef(false);
  
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
  
  const [dealerId, setDealerId] = useState<number | null>(null);
  const [saleId, setSaleId] = useState<number | null>(null);
  const [paramsLoaded, setParamsLoaded] = useState(false);
  const [sale, setSale] = useState<Sale | null>(null);
  const [dealer, setDealer] = useState<Dealer | null>(null);
  const [company, setCompany] = useState<CompanySettings | null>(null);
  const [orderInfo, setOrderInfo] = useState<{
    shippingName: string | null;
    shippingPhone: string | null;
    shippingEmail: string | null;
    shippingAddress: string | null;
    shippingCity: string | null;
    shippingProvince: string | null;
    shippingPostalCode: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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

  useEffect(() => {
    if (!paramsLoaded || !dealerId || !saleId) {
      if (isMountedRef.current) {
        setLoading(false);
      }
      return;
    }

    const loadData = async () => {
      try {
        // Dealer bilgilerini getir
        const dealerResponse = await fetch(`/api/dealers/${dealerId}`, {
          cache: 'no-store',
        });
        if (dealerResponse.ok) {
          const dealerData = await dealerResponse.json();
          if (isMountedRef.current) {
            setDealer(dealerData);
          }
        }

        // Satış bilgilerini getir
        const salesResponse = await fetch(`/api/dealers/${dealerId}/sales`, {
          cache: 'no-store',
        });
        if (salesResponse.ok) {
          const salesData = await salesResponse.json();
          const sales = Array.isArray(salesData) ? salesData : [];
          const foundSale = sales.find((s: Sale) => s.id === saleId);
          if (foundSale && isMountedRef.current) {
            // Eğer satış numarası ORD- ile başlıyorsa, sipariş bilgilerini çek
            if (foundSale.saleNumber && foundSale.saleNumber.startsWith('ORD-')) {
              try {
                const orderResponse = await fetch(`/api/orders?orderNumber=${encodeURIComponent(foundSale.saleNumber)}`, {
                  cache: 'no-store',
                });
                if (orderResponse.ok) {
                  const orderData = await orderResponse.json();
                  if (orderData.order && isMountedRef.current) {
                    setOrderInfo({
                      shippingName: orderData.order.shippingName,
                      shippingPhone: orderData.order.shippingPhone,
                      shippingEmail: orderData.order.shippingEmail,
                      shippingAddress: orderData.order.shippingAddress,
                      shippingCity: orderData.order.shippingCity,
                      shippingProvince: orderData.order.shippingProvince,
                      shippingPostalCode: orderData.order.shippingPostalCode,
                    });
                  }
                  // Eğer items boşsa, order items'ı kullan
                  if ((!foundSale.items || foundSale.items.length === 0) && orderData.items && orderData.items.length > 0 && isMountedRef.current) {
                    // Order items'ı sale items formatına çevir
                    const formattedItems: SaleItem[] = orderData.items.map((item: any) => ({
                      id: item.id,
                      productId: item.productId,
                      quantity: item.quantity,
                      price: item.price,
                      total: item.total,
                      productName: item.product?.baseName || item.product?.name || 'Ürün bulunamadı',
                      productImage: item.product?.images || null,
                    }));
                    foundSale.items = formattedItems;
                  }
                }
              } catch (error) {
                console.error('Error fetching order info:', error);
              }
            }
            setSale(foundSale);
          }
        }

        // Firma bilgilerini getir
        const companyResponse = await fetch('/api/settings/company', {
          cache: 'no-store',
        });
        if (companyResponse.ok) {
          const companyData = await companyResponse.json();
          console.log('Company data received:', companyData);
          if (isMountedRef.current) {
            setCompany(companyData);
          }
        } else {
          console.error('Company API error:', companyResponse.status, companyResponse.statusText);
          const errorData = await companyResponse.json().catch(() => ({}));
          console.error('Company API error data:', errorData);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    loadData();
  }, [paramsLoaded, dealerId, saleId]);

  // Otomatik PDF indirme (download=true query parametresi varsa)
  useEffect(() => {
    if (hasDownloadedRef.current) return; // Zaten indirme yapıldıysa tekrar yapma
    if (!mounted) return; // Component henüz mount olmadı
    
    // window.location'dan query parametresini al (daha güvenilir)
    let shouldDownload = false;
    try {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        shouldDownload = urlParams.get('download') === 'true';
      }
      if (!shouldDownload && searchParams) {
        shouldDownload = searchParams.get('download') === 'true';
      }
    } catch (e) {
      console.error('Error reading search params:', e);
    }
    
    if (!shouldDownload) return;
    
    // Tüm veriler yüklendi mi kontrol et
    if (loading || !sale || !dealer || !company) {
      return; // Veriler henüz yüklenmedi, bekle
    }

    // Sayfa tamamen yüklensin ve render olsun diye bekleme
    let retryCount = 0;
    const maxRetries = 20; // 10 saniye max bekleme
    
    const checkAndDownload = () => {
      retryCount++;
      
      const invoiceContent = invoiceContentRef.current;
      if (!invoiceContent) {
        if (retryCount < maxRetries) {
          setTimeout(checkAndDownload, 500);
        } else {
          console.error('Invoice content element not found after', maxRetries, 'retries');
        }
        return;
      }

      // Element'in içeriğinin yüklendiğini kontrol et
      const hasContent = invoiceContent.innerHTML.trim().length > 500;
      if (!hasContent) {
        if (retryCount < maxRetries) {
          setTimeout(checkAndDownload, 500);
        } else {
          console.error('Invoice content not loaded after', maxRetries, 'retries');
        }
        return;
      }

      // DOM'un tamamen render olduğundan emin ol
      if (document.readyState !== 'complete') {
        if (retryCount < maxRetries) {
          setTimeout(checkAndDownload, 500);
          return;
        }
      }

      hasDownloadedRef.current = true;
      
      try {
        // oklch renklerini rgb'ye dönüştür (html2canvas oklch desteklemiyor)
        const convertOklchToRgb = (element: HTMLElement) => {
          const style = window.getComputedStyle(element);
          const color = style.color;
          const backgroundColor = style.backgroundColor;
          const borderColor = style.borderColor;
          
          // oklch içeren renkleri dönüştür
          if (color && color.includes('oklch')) {
            element.style.color = '#000000'; // Varsayılan siyah
          }
          if (backgroundColor && backgroundColor.includes('oklch')) {
            // oklch'yi rgb'ye dönüştürmek için basit bir yaklaşım
            // Eğer oklch renk varsa, varsayılan renkler kullan
            if (backgroundColor.includes('gray')) {
              element.style.backgroundColor = '#f3f4f6';
            } else if (backgroundColor.includes('white')) {
              element.style.backgroundColor = '#ffffff';
            } else {
              element.style.backgroundColor = '#ffffff';
            }
          }
          if (borderColor && borderColor.includes('oklch')) {
            element.style.borderColor = '#e5e7eb';
          }
        };

        // Tüm elementlerde oklch renklerini dönüştür
        const allElements = invoiceContent.querySelectorAll('*');
        allElements.forEach((el) => {
          if (el instanceof HTMLElement) {
            convertOklchToRgb(el);
          }
        });

        const opt = {
          margin: [5, 5, 5, 5] as [number, number, number, number],
          filename: `${sale.saleNumber}.pdf`,
          image: { type: 'jpeg' as const, quality: 0.98 },
          html2canvas: { 
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            allowTaint: true,
            letterRendering: true,
            onclone: (clonedDoc: Document) => {
              // Clone'da da oklch renklerini dönüştür
              const clonedElements = clonedDoc.querySelectorAll('*');
              clonedElements.forEach((el) => {
                if (el instanceof HTMLElement) {
                  const style = window.getComputedStyle(el);
                  const color = style.color;
                  const backgroundColor = style.backgroundColor;
                  const borderColor = style.borderColor;
                  
                  if (color && color.includes('oklch')) {
                    el.style.color = '#000000';
                  }
                  if (backgroundColor && backgroundColor.includes('oklch')) {
                    el.style.backgroundColor = '#ffffff';
                  }
                  if (borderColor && borderColor.includes('oklch')) {
                    el.style.borderColor = '#e5e7eb';
                  }
                  
                  // Tüm CSS özelliklerini kontrol et
                  const computedStyle = window.getComputedStyle(el);
                  for (let i = 0; i < computedStyle.length; i++) {
                    const prop = computedStyle[i];
                    const value = computedStyle.getPropertyValue(prop);
                    if (value && value.includes('oklch')) {
                      // oklch içeren değerleri temizle veya varsayılan değerler kullan
                      if (prop.includes('color')) {
                        el.style.setProperty(prop, '#000000', 'important');
                      } else if (prop.includes('background')) {
                        el.style.setProperty(prop, '#ffffff', 'important');
                      } else if (prop.includes('border')) {
                        el.style.setProperty(prop, '#e5e7eb', 'important');
                      }
                    }
                  }
                }
              });
            }
          },
          jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait' as const
          }
        };

        html2pdf().set(opt).from(invoiceContent).save().then(() => {
          // PDF indirildikten sonra pencereyi kapat
          setTimeout(() => {
            if (typeof window !== 'undefined' && window.close) {
              try {
                window.close();
              } catch (e) {
                // Pencere kapatılamazsa (bazı tarayıcılarda), sadece log
                console.log('Window could not be closed');
              }
            }
          }, 1000);
        }).catch((err: any) => {
          console.error('Error generating PDF:', err);
          hasDownloadedRef.current = false; // Hata durumunda tekrar deneme için
          if (mounted && isMountedRef.current) {
            showToast(t('admin.invoices.downloadError'), 'error');
          }
        });
      } catch (error) {
        console.error('Error in PDF download:', error);
        hasDownloadedRef.current = false; // Hata durumunda tekrar deneme için
        if (mounted && isMountedRef.current) {
          showToast(t('admin.invoices.downloadError'), 'error');
        }
      }
    };

    // İlk kontrol için 3 saniye bekle (sayfa ve veriler tam yüklensin)
    setTimeout(checkAndDownload, 3000);
  }, [loading, sale, dealer, company, searchParams, mounted, t]);

  const handlePrint = () => {
    window.print();
  };

  const handleSaveInvoice = async () => {
    if (!saleId || saving) return;
    
    try {
      setSaving(true);
      const response = await fetch(`/api/faturalar/${saleId}/save`, {
        method: 'PUT',
      });

      if (response.ok) {
        // Response'u kontrol et
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          try {
            const data = await response.json();
            // JSON başarıyla parse edildi
          } catch (jsonError) {
            // JSON parse hatası, ama response ok olduğu için devam et
            console.warn('Response OK but JSON parse failed:', jsonError);
          }
        }
        setIsSaved(true);
        showToast(mounted ? t('admin.invoices.saved') : 'Fatura başarıyla kaydedildi!', 'success');
      } else {
        // Hata durumunda response'u güvenli şekilde parse et
        let errorMessage = mounted ? t('admin.common.error') : 'Fatura kaydedilemedi';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            errorMessage = data.error || data.details || errorMessage;
          } else {
            const text = await response.text();
            if (text) {
              errorMessage = text;
            }
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
          errorMessage = `${errorMessage}: ${response.status} ${response.statusText}`;
        }
        showToast(errorMessage, 'error');
      }
    } catch (error: any) {
      console.error('Error saving invoice:', error);
      showToast((mounted ? t('admin.common.error') : 'Fatura kaydedilemedi: ') + (error.message || 'Bilinmeyen hata'), 'error');
    } finally {
      setSaving(false);
    }
  };


  if (loading || !sale || !dealer) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="text-center text-gray-500">{mounted ? t('admin.common.loading') : 'Yükleniyor...'}</div>
      </div>
    );
  }

  const subtotal = parseFloat(sale.subtotal || '0');
  const discount = parseFloat(sale.discount || '0');
  const afterDiscount = Math.max(0, subtotal - discount);
  const tps = Math.round(afterDiscount * 0.05 * 100) / 100;
  const tvq = Math.round((afterDiscount + tps) * 0.09975 * 100) / 100; // Quebec: TVQ, TPS dahil fiyat üzerinden
  const total = parseFloat(sale.total || '0');

  const paymentMethodText: Record<string, string> = {
    NAKIT: mounted ? t('admin.orders.cash') : 'Nakit',
    KREDI_KARTI: mounted ? t('admin.orders.creditCard') : 'Kredi Kartı',
    CEK: mounted ? t('admin.orders.check') : 'Çek',
    ODENMEDI: mounted ? t('admin.orders.unpaid') : 'Ödenmedi',
  };

  return (
    <div className="min-h-screen bg-gray-100 p-2 lg:p-8 print:p-4 print:mt-0 print:bg-white w-full overflow-x-auto" style={{ maxWidth: '100%', width: '100%', boxSizing: 'border-box' }}>
      {/* Action Buttons - Only visible when not printing */}
      <div className="mb-4 lg:mb-6 print:hidden flex gap-2 lg:gap-3 items-center justify-center">
        <button
          onClick={handlePrint}
          className="px-3 lg:px-6 py-1.5 lg:py-2 bg-[#E91E63] text-white rounded-lg hover:bg-[#C2185B] transition-colors text-xs lg:text-base font-medium"
        >
          🖨️ {mounted ? t('admin.invoices.printSave') : 'Yazdır / PDF Olarak Kaydet'}
        </button>
        <button
          onClick={handleSaveInvoice}
          disabled={isSaved || saving}
          className={`px-3 lg:px-6 py-1.5 lg:py-2 rounded-lg transition-colors text-xs lg:text-base font-medium ${
            isSaved
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
              : saving
              ? 'bg-blue-400 text-white cursor-wait'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {saving ? (mounted ? t('admin.invoices.saving') : 'Kaydediliyor...') : isSaved ? `✓ ${mounted ? t('admin.invoices.saved') : 'Kaydedildi'}` : `💾 ${mounted ? t('admin.invoices.saveInvoice') : 'Faturayı Kaydet'}`}
        </button>
      </div>

      <div ref={invoiceContentRef} className="invoice-content max-w-4xl mx-auto bg-white border-2 border-gray-300 p-8 print:border-0 print:shadow-none print:p-4">
        {/* Header - Firma Bilgileri ve Müşteri/Fatura Bilgileri */}
        <div className="border-b-2 border-gray-800 pb-6 mb-6">
          {/* Üst: FATURA (Sol) ve Müşteri Bilgileri (Sağ) - Yan Yana */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Sol: FATURA ve Firma Bilgileri - Kare Çerçeve */}
            <div className="border-2 border-gray-800 p-2 lg:p-4">
              <h1 className="text-sm lg:text-2xl font-bold text-gray-900 mb-2 lg:mb-4">
                {mounted ? t('admin.invoices.invoice') : 'FATURA'}
              </h1>
              <div className="text-[10px] lg:text-sm text-gray-700 space-y-0.5 lg:space-y-1">
                {company?.companyName && <p className="font-semibold text-xs lg:text-base">{company.companyName}</p>}
                <p><strong>{mounted ? t('checkout.address') : 'Adres'}:</strong> {company?.address || ''}</p>
                <p><strong>{mounted ? t('admin.invoices.postalCode') : 'Posta Kodu'}:</strong> {company?.postalCode || ''}</p>
                <p><strong>{mounted ? t('checkout.phone') : 'Telefon'}:</strong> {company?.phone || ''}</p>
                <div className="flex flex-col gap-0.5 lg:gap-1 mt-1 lg:mt-2">
                  <p className="text-[9px] lg:text-xs"><strong>{mounted ? t('admin.invoices.tpsRegistrationNumber') : 'TPS Kayıt No'}:</strong> {company?.tpsNumber || ''}</p>
                  <p className="text-[9px] lg:text-xs"><strong>{mounted ? t('admin.invoices.tvqRegistrationNumber') : 'TVQ Kayıt No'}:</strong> {company?.tvqNumber || ''}</p>
                </div>
              </div>
            </div>
            
            {/* Sağ: Müşteri Bilgileri */}
            <div className="border-2 border-gray-300 p-2 lg:p-4">
              <h2 className="text-xs lg:text-lg font-bold text-gray-900 mb-2 lg:mb-3 border-b-2 border-gray-800 pb-1 lg:pb-2">
                <u>{mounted ? t('admin.invoices.clientInfo') : 'Müşteri Bilgileri'}</u>
              </h2>
              <div className="text-[10px] lg:text-sm text-gray-700 space-y-0.5 lg:space-y-1 mt-1.5 lg:mt-3">
                {/* Eğer sipariş bilgileri varsa (ORD- satışları için), onları göster */}
                {orderInfo && sale?.saleNumber?.startsWith('ORD-') ? (
                  <>
                    {orderInfo.shippingName && (
                      <p><strong>{mounted ? t('admin.invoices.companyNameLabel') : 'Ad Soyad'}:</strong> {orderInfo.shippingName}</p>
                    )}
                    {orderInfo.shippingPhone && (
                      <p><strong>{mounted ? t('checkout.phone') : 'Telefon'}:</strong> {orderInfo.shippingPhone}</p>
                    )}
                    {orderInfo.shippingEmail && (
                      <p><strong>{mounted ? t('checkout.email') : 'E-posta'}:</strong> {orderInfo.shippingEmail}</p>
                    )}
                    {orderInfo.shippingAddress && (
                      <p><strong>{mounted ? t('checkout.address') : 'Adres'}:</strong> {orderInfo.shippingAddress}</p>
                    )}
                    {(orderInfo.shippingCity || orderInfo.shippingProvince) && (
                      <p><strong>{mounted ? (t('checkout.city') + ' / ' + t('checkout.province')) : 'Şehir / Eyalet'}:</strong> {orderInfo.shippingCity || ''} {orderInfo.shippingProvince ? `, ${orderInfo.shippingProvince}` : ''}</p>
                    )}
                    {orderInfo.shippingPostalCode && (
                      <p><strong>{mounted ? t('admin.invoices.postalCode') : 'Posta Kodu'}:</strong> {orderInfo.shippingPostalCode}</p>
                    )}
                  </>
                ) : (
                  <>
                    <p><strong>{mounted ? t('admin.invoices.companyNameLabel') : 'Firma Adı'}:</strong> {dealer.companyName}</p>
                    {dealer.phone && <p><strong>{mounted ? t('checkout.phone') : 'Telefon'}:</strong> {dealer.phone}</p>}
                    {dealer.address && <p><strong>{mounted ? t('checkout.address') : 'Adres'}:</strong> {dealer.address}</p>}
                    {(dealer.tpsNumber || dealer.tvqNumber) && (
                      <div className="flex flex-col gap-0.5 lg:gap-1 mt-1 lg:mt-2">
                        {dealer.tpsNumber && <p className="text-[9px] lg:text-xs"><strong>{mounted ? t('admin.invoices.tpsRegistrationNumber') : 'TPS Kayıt No'}:</strong> {dealer.tpsNumber}</p>}
                        {dealer.tvqNumber && <p className="text-[9px] lg:text-xs"><strong>{mounted ? t('admin.invoices.tvqRegistrationNumber') : 'TVQ Kayıt No'}:</strong> {dealer.tvqNumber}</p>}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
          
        </div>

        {/* Ürünler Tablosu */}
        <div className="mb-6 overflow-x-auto" style={{ maxWidth: '100%', width: '100%' }}>
          <table className="w-full border-collapse border-2 border-gray-800 min-w-0 lg:min-w-0">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-800">
                <th className="text-left py-1 lg:py-3 px-1.5 lg:px-3 font-bold text-[10px] lg:text-base text-gray-900 border-r border-gray-300">{mounted ? t('admin.invoices.product') : 'Ürün'}</th>
                <th className="text-center py-1 lg:py-3 px-1.5 lg:px-3 font-bold text-[10px] lg:text-base text-gray-900 border-r border-gray-300">{mounted ? t('admin.invoices.quantityLabel') : 'Miktar'}</th>
                <th className="text-right py-1 lg:py-3 px-1.5 lg:px-3 font-bold text-[10px] lg:text-base text-gray-900 border-r border-gray-300">{mounted ? t('admin.invoices.unitPrice') : 'Birim Fiyat'}</th>
                <th className="text-right py-1 lg:py-3 px-1.5 lg:px-3 font-bold text-[10px] lg:text-base text-gray-900">{mounted ? t('admin.invoices.total') : 'Toplam'}</th>
              </tr>
            </thead>
            <tbody>
              {sale.items && sale.items.map((item, index) => (
                <tr key={item.id} className={`border-b border-gray-300 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="py-1 lg:py-3 px-1.5 lg:px-3 text-[10px] lg:text-sm text-gray-700 border-r border-gray-300">{item.productName}</td>
                  <td className="py-1 lg:py-3 px-1.5 lg:px-3 text-center text-[10px] lg:text-sm text-gray-700 border-r border-gray-300">{item.quantity}</td>
                  <td className="py-1 lg:py-3 px-1.5 lg:px-3 text-right text-[10px] lg:text-sm text-gray-700 border-r border-gray-300">${parseFloat(item.price || '0').toFixed(2)}</td>
                  <td className="py-1 lg:py-3 px-1.5 lg:px-3 text-right text-[10px] lg:text-sm font-semibold text-gray-900">${parseFloat(item.total || '0').toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Fatura Bilgileri ve Fiyat Özeti - Yan Yana */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Sol: Fatura Bilgileri */}
          <div>
            <div className="border-2 border-gray-300 p-2 lg:p-4">
              <h2 className="text-xs lg:text-lg font-bold text-gray-900 mb-2 lg:mb-3 border-b-2 border-gray-800 pb-1 lg:pb-2">
                <u>{mounted ? t('admin.invoices.invoiceInfo') : 'Fatura Bilgileri'}</u>
              </h2>
              <div className="text-[10px] lg:text-sm text-gray-700 space-y-0.5 lg:space-y-1 mt-1.5 lg:mt-3">
                <p><strong>{mounted ? t('admin.invoices.invoiceNumberLabel') : 'Fatura No'}:</strong> {sale.saleNumber}</p>
                <p><strong>{mounted ? t('admin.invoices.orderNumberLabel') : 'Sipariş No'}:</strong> {sale.saleNumber}</p>
                <p><strong>{mounted ? t('admin.invoices.invoiceDateLabel') : 'Fatura Tarihi'}:</strong> {new Date(sale.createdAt).toLocaleDateString(getLocale(), {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                }).replace(/\//g, '.')}</p>
              </div>
            </div>
          </div>
          
          {/* Sağ: Fiyat Özeti */}
          <div>
            <div className="border-2 border-gray-800">
              <div className="p-2 lg:p-4 space-y-1 lg:space-y-2 bg-gray-50">
                <div className="flex justify-between text-[10px] lg:text-sm">
                  <span className="text-gray-700">{mounted ? t('admin.invoices.subtotal') : 'Ara Toplam'}:</span>
                  <span className="font-semibold text-gray-900">${subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <>
                    <div className="flex justify-between text-[10px] lg:text-sm">
                      <span className="text-gray-700">{mounted ? t('admin.invoices.discount') : 'İskonto'}:</span>
                      <span className="font-semibold text-red-600">-${discount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[9px] lg:text-xs text-gray-600">
                      <span>{mounted ? t('admin.invoices.afterDiscount') : 'İskonto Sonrası'}:</span>
                      <span className="font-medium">${afterDiscount.toFixed(2)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between text-[10px] lg:text-sm">
                  <span className="text-gray-700">{mounted ? t('admin.invoices.tps') : 'TPS (5%)'}:</span>
                  <span className="font-semibold text-gray-900">${tps.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[10px] lg:text-sm">
                  <span className="text-gray-700">{mounted ? t('admin.invoices.tvq') : 'TVQ (9.975%)'}:</span>
                  <span className="font-semibold text-gray-900">${tvq.toFixed(2)}</span>
                </div>
              </div>
              <div className="p-2 lg:p-4 bg-gray-800 text-white">
                <div className="flex justify-between items-center">
                  <span className="text-xs lg:text-base font-bold">{mounted ? t('admin.invoices.totalLabel') : 'TOPLAM'}:</span>
                  <span className="text-sm lg:text-xl font-bold">${total.toFixed(2)} CAD</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* İmza Alanları */}
        <div className="mb-6 pb-6 border-b border-gray-300">
          <div className="grid grid-cols-2 gap-6 mt-8">
            {/* Sol: Müşteri İmza */}
            <div>
              <div className="pt-4">
                <p className="font-semibold text-[10px] lg:text-base text-gray-900 mb-4 lg:mb-8">{dealer.companyName}</p>
                <p className="text-[10px] lg:text-sm text-gray-600 mb-1 lg:mb-2">{mounted ? t('admin.invoices.signature') : 'İmza'}:</p>
                <div className="border-b-2 border-gray-400 mt-8 lg:mt-16 mb-1 lg:mb-2"></div>
                <div className="h-4 lg:h-8"></div>
              </div>
            </div>
            
            {/* Sağ: Epic Buhara İmza */}
            <div>
              <div className="pt-4">
                <p className="font-semibold text-[10px] lg:text-base text-gray-900 mb-4 lg:mb-8">{company?.companyName || 'Epicê Buhara'}</p>
                <p className="text-[10px] lg:text-sm text-gray-600 mb-1 lg:mb-2">{mounted ? t('admin.invoices.signature') : 'İmza'}:</p>
                <div className="border-b-2 border-gray-400 mt-8 lg:mt-16 mb-1 lg:mb-2 relative">
                  {/* Signature électronique - Au-dessus de la ligne de signature */}
                  <div className="absolute -top-6 lg:-top-12 left-0 right-0 text-center">
                    <div className="inline-block bg-white px-2 lg:px-4 py-1 lg:py-2 border-2 border-gray-800 rounded">
                      <p className="text-[9px] lg:text-xs font-bold text-gray-800 uppercase tracking-wide">
                        {mounted ? t('admin.invoices.electronicSignature') : 'Elektronik İmza'}
                      </p>
                      <p className="text-[9px] lg:text-xs font-mono text-gray-600 mt-0.5 lg:mt-1">
                        {sale.saleNumber}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(sale.createdAt).toLocaleDateString(getLocale(), {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                        }).replace(/\//g, '.')}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="h-4 lg:h-8"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Notlar */}
        {sale.notes && (
          <div className="mb-6">
            <p className="font-semibold text-gray-900 mb-2">{mounted ? t('admin.invoices.notesLabel') : 'Notlar:'}</p>
            <p className="text-sm text-gray-700 whitespace-pre-line">{sale.notes}</p>
          </div>
        )}

      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4 !important;
            size: 210mm 297mm !important; /* A4 boyutunu zorla */
            margin: 10mm !important;
            marks: none !important;
            page-break-before: auto !important;
            page-break-after: auto !important;
          }
          
          @page {
            @bottom-right { content: "" !important; }
            @bottom-left { content: "" !important; }
            @top-right { content: "" !important; }
            @top-left { content: "" !important; }
          }
          
          html, body {
            width: 210mm !important; /* A4 genişliği */
            height: 297mm !important; /* A4 yüksekliği */
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important; /* Renkleri koru */
            print-color-adjust: exact !important;
            overflow: visible !important;
          }
          
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          body::after,
          body::before {
            display: none !important;
            content: "" !important;
          }
          
          /* Admin Panel Layout Elemanlarını Gizle */
          aside,
          header,
          footer,
          [class*="footer"],
          [class*="Footer"],
          [class*="AdminNotificationBanner"],
          [class*="notification"],
          [class*="Notification"],
          [id*="notification"],
          [id*="Notification"],
          div.bg-green-600,
          div.bg-blue-600,
          [style*="position: fixed"],
          [style*="position: sticky"] {
            display: none !important;
            visibility: hidden !important;
          }
          
          header *,
          aside * {
            display: none !important;
          }
          
          /* AdminLayout wrapper'larını gizle */
          div.min-h-screen.bg-gray-100.flex > div.flex-1.flex.flex-col > div.flex-1.flex.flex-col:first-child {
            display: none !important;
          }
          
          /* Main container'ı temizle */
          main {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            display: block !important;
            background: white !important;
            overflow: visible !important;
          }
          
          /* Fatura sayfası container'ı - KESINLIKLE GÖRÜNÜR */
          div.min-h-screen.bg-gray-100,
          div.min-h-screen {
            min-height: auto !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            width: 100% !important;
            max-width: 100% !important;
            position: relative !important;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          /* Invoice content - KESINLIKLE GÖRÜNÜR */
          .invoice-content {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            transform: none !important;
            position: relative !important;
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 auto !important;
            background: white !important;
            page-break-inside: avoid !important;
          }
          
          /* Tüm wrapper container'lar görünür */
          #__next,
          #__next > div,
          main > div.min-h-screen {
            display: block !important;
            background: white !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          
          /* Fatura içeriği kesinlikle görünür */
          .min-h-screen .invoice-content,
          main .invoice-content,
          main > div .invoice-content,
          div.min-h-screen .invoice-content {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
          }
          
          .print\\:p-4 {
            padding: 0.5rem !important;
          }
          
          .print\\:border-0 {
            border: 0 !important;
          }
          
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          
          .max-w-4xl {
            max-width: 100% !important;
            margin: 0 auto !important;
            padding: 0.5rem !important;
          }
          
          h1 {
            font-size: 1.5rem !important;
            margin-bottom: 0.5rem !important;
          }
          
          h2 {
            font-size: 1rem !important;
            margin-bottom: 0.25rem !important;
          }
          
          p {
            font-size: 0.75rem !important;
            margin: 0.125rem 0 !important;
          }
          
          .p-4, .p-6, .p-8 {
            padding: 0.5rem !important;
          }
          
          .mb-6, .mb-4 {
            margin-bottom: 0.5rem !important;
          }
          
          .space-y-1 > * + * {
            margin-top: 0.125rem !important;
          }
          
          .space-y-2 > * + * {
            margin-top: 0.25rem !important;
          }
          
          table {
            font-size: 0.7rem !important;
          }
          
          th, td {
            padding: 0.25rem !important;
          }
          
          .mt-16 {
            margin-top: 2rem !important;
          }
          
          .mb-8 {
            margin-bottom: 1rem !important;
          }
        }
      `}</style>
    </div>
  );
}