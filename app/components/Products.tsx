'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { showToast } from '@/components/Toast';

interface ProductsProps {
  categoryId?: string | null;
  featured?: boolean;
  newProducts?: boolean;
  discounted?: boolean;
}

export function Products({ categoryId, featured, newProducts, discounted }: ProductsProps) {
  const [mounted, setMounted] = useState(false);
  const { t } = useTranslation();
  const [productsList, setProductsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [addingToCart, setAddingToCart] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Debounce için: kullanıcı yazmayı bitirdikten 300ms sonra arama yap
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);

  // Input'un focus'unu korumak için onChange handler
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    // Focus'u koru
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        let url = '/api/products?';
        if (categoryId) {
          url += `categoryId=${categoryId}&`;
        }
        if (featured) {
          url += 'featured=true&';
        }
        if (newProducts) {
          url += 'new=true&';
        }
        if (discounted) {
          url += 'discounted=true&';
        }
        if (debouncedSearchQuery.trim()) {
          url += `search=${encodeURIComponent(debouncedSearchQuery.trim())}&`;
        }

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          console.log('Products loaded:', data?.length || 0, 'items');
          setProductsList(Array.isArray(data) ? data : []);
        } else {
          const errorText = await response.text();
          console.error('API error:', response.status, response.statusText, errorText);
          setProductsList([]);
        }
      } catch (error) {
        console.error('Error loading products:', error);
        setProductsList([]);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, [categoryId, featured, newProducts, discounted, debouncedSearchQuery]);

  if (loading) {
    return <div className="text-center py-8">{mounted ? t('products.loading') : 'Yükleniyor...'}</div>;
  }

  if (productsList.length === 0) {
    return (
      <div className="w-full min-w-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div className="flex items-center justify-between w-full lg:w-auto gap-2 sm:gap-3">
            <h2 className="text-2xl font-bold text-gray-900 whitespace-nowrap">{mounted ? t('products.title') : 'Ürünler'}</h2>
            {/* Mobil Arama Kutusu - Başlığın Sağında */}
            <div className="md:hidden flex items-center gap-0">
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder={mounted ? t('products.searchPlaceholder') : 'Ara...'}
                className="border border-gray-300 rounded-l-lg px-2 py-1.5 outline-none focus:border-[#E91E63] text-xs w-24 sm:w-32"
                autoComplete="off"
              />
              <button 
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setDebouncedSearchQuery('');
                  if (inputRef.current) {
                    inputRef.current.focus();
                  }
                }}
                className="bg-[#E91E63] text-white px-2 py-1.5 rounded-r-lg hover:bg-[#C2185B] transition-colors flex items-center justify-center"
              >
                {searchQuery ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          {/* Desktop Arama Kutusu */}
          <div className="hidden md:flex items-center gap-0 w-full sm:w-auto sm:flex-shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder={mounted ? (t('header.search') || 'Ürün ara...') : 'Ürün ara...'}
              className="border border-gray-300 rounded-l-lg px-4 py-2 outline-none focus:border-[#E91E63] text-sm w-full sm:w-64"
              autoComplete="off"
            />
            <button 
              type="button"
              onClick={() => {
                setSearchQuery('');
                setDebouncedSearchQuery('');
                if (inputRef.current) {
                  inputRef.current.focus();
                }
              }}
              className="bg-[#E91E63] text-white px-4 py-2 rounded-r-lg hover:bg-[#C2185B] transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchQuery && (
                <span className="text-sm font-medium">Temizle</span>
              )}
            </button>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center shadow-sm w-full">
          <p className="text-gray-600">{mounted ? t('products.notFound') : 'Henüz ürün bulunmamaktadır.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
        <div className="flex items-center justify-between w-full lg:w-auto gap-2 sm:gap-3">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 whitespace-nowrap">{mounted ? t('products.title') : 'Ürünler'}</h2>
          {/* Mobil Arama Kutusu - Başlığın Sağında */}
          <div className="md:hidden flex items-center gap-0">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Ara..."
              className="border border-gray-300 rounded-l-lg px-2 py-1.5 outline-none focus:border-[#E91E63] text-xs w-40 sm:w-48"
              autoComplete="off"
            />
            <button 
              type="button"
              onClick={() => {
                setSearchQuery('');
                setDebouncedSearchQuery('');
                if (inputRef.current) {
                  inputRef.current.focus();
                }
              }}
              className="bg-[#E91E63] text-white px-2 py-1.5 rounded-r-lg hover:bg-[#C2185B] transition-colors flex items-center justify-center"
            >
              {searchQuery ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
            </button>
          </div>
        </div>
        {/* Desktop Arama Kutusu */}
        <div className="hidden md:flex items-center gap-0 w-full sm:w-auto sm:flex-shrink-0">
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder={mounted ? (t('header.search') || 'Ürün ara...') : 'Ürün ara...'}
            className="border border-gray-300 rounded-l-lg px-4 py-2 outline-none focus:border-[#E91E63] text-sm w-full sm:w-64"
            autoComplete="off"
          />
          <button 
            type="button"
            onClick={() => {
              setSearchQuery('');
              setDebouncedSearchQuery('');
              if (inputRef.current) {
                inputRef.current.focus();
              }
            }}
            className="bg-[#E91E63] text-white px-4 py-2 rounded-r-lg hover:bg-[#C2185B] transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <span className="text-sm font-medium">Temizle</span>
            )}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4 w-full">
        {productsList.map((product) => {
          const hasDiscount = product.comparePrice && parseFloat(product.comparePrice) > parseFloat(product.price);
          const discountPercent = hasDiscount 
            ? Math.round(((parseFloat(product.comparePrice) - parseFloat(product.price)) / parseFloat(product.comparePrice)) * 100)
            : 0;
          
          return (
            <div
              key={product.id} 
              className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all hover:border-[#E91E63] flex flex-col"
            >
              <Link href={`/product/${product.slug || product.id}`} className="block" title={product.name}>
                <div className="relative w-full aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                  {/* İndirim Badge - Sol Üst Köşe */}
                  {hasDiscount && (
                    <div className="absolute top-1 left-1 sm:top-2 sm:left-2 z-10">
                      <span className="inline-block bg-red-500 text-white text-[10px] sm:text-xs font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded">
                        {mounted ? t('products.discountBadge', { percent: discountPercent }) : `%${discountPercent} İNDİRİM`}
                      </span>
                    </div>
                  )}
                  
                  {product.images ? (
                    <img 
                      src={(() => {
                        const imgSrc = product.images.split(',')[0].trim();
                        if (!imgSrc) return '';
                        
                        // Eğer zaten tam URL ise (http/https veya Supabase Storage URL), olduğu gibi döndür
                        if (imgSrc.startsWith('http://') || imgSrc.startsWith('https://')) {
                          return imgSrc;
                        }
                        
                        // Eğer / ile başlıyorsa, olduğu gibi döndür
                        if (imgSrc.startsWith('/')) {
                          return imgSrc;
                        }
                        
                        // Supabase Storage URL kontrolü (storage/v1/object/public içeriyorsa)
                        if (imgSrc.includes('storage/v1/object/public')) {
                          return imgSrc;
                        }
                        
                        // Local dosya yolu - /uploads/products/ ekle
                        return `/uploads/products/${imgSrc}`;
                      })()}
                      alt={product.name} 
                      className="w-full h-full object-contain p-2 hover:scale-105 transition-transform duration-300" 
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        console.error('Resim yükleme hatası:', target.src, product.name);
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent && !parent.querySelector('.error-placeholder')) {
                          const placeholder = document.createElement('span');
                          placeholder.className = 'error-placeholder text-gray-400 text-sm';
                          placeholder.textContent = mounted ? t('admin.products.imageUploadError') : 'Resim Yüklenemedi';
                          parent.appendChild(placeholder);
                        }
                      }}
                    />
                  ) : (
                    <span className="text-gray-400 text-sm">{mounted ? t('admin.common.noImage') : 'Resim Yok'}</span>
                  )}
                </div>
              </Link>
              
              <div className="p-2 sm:p-3 md:p-4 flex-1 flex flex-col">
                <Link href={`/product/${product.slug || product.id}`} className="block flex-1" title={product.baseName || product.name}>
                  <div className="flex items-start justify-between gap-1 sm:gap-2 mb-1 sm:mb-2">
                    <h3 className="font-semibold text-gray-900 text-xs sm:text-sm line-clamp-2 flex-1">{product.baseName || product.name}</h3>
                    {/* Gramaj/Kilo Bilgisi - Sağda */}
                    {product.weight && (
                      <span className="text-[10px] sm:text-xs text-gray-500 whitespace-nowrap">
                        {(() => {
                          const weightNum = parseFloat(product.weight);
                          const unit = product.unit || 'Gr';
                          if (unit === 'Gr' && weightNum >= 1000 && weightNum % 1000 === 0) {
                            return `${(weightNum / 1000)} Kg`;
                          }
                          return `${Math.floor(weightNum)} ${unit}`;
                        })()}
                      </span>
                    )}
                  </div>
                   
                  {/* Fiyat Bilgisi */}
                  <div className="flex items-center justify-between mt-1 sm:mt-2 mb-2 sm:mb-3">
                    {hasDiscount ? (
                      <>
                        {/* Yeni Fiyat - Solda */}
                        <span className="text-base sm:text-lg font-bold text-[#E91E63]">
                          ${parseFloat(product.price).toFixed(2)}
                        </span>
                        {/* Eski Fiyat - Sağda - Kalın Siyah */}
                        <span className="text-xs sm:text-sm font-bold text-black line-through">
                          ${parseFloat(product.comparePrice).toFixed(2)}
                        </span>
                      </>
                    ) : (
                      <span className="text-base sm:text-lg font-bold text-[#E91E63]">
                        ${parseFloat(product.price).toFixed(2)}
                      </span>
                    )}
                  </div>
                </Link>

                {/* Sepete Ekle Butonu */}
                <button
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    if (addingToCart === product.id) return;
                    
                    setAddingToCart(product.id);
                    try {
                      const response = await fetch('/api/cart', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          productId: product.id,
                          quantity: 1,
                        }),
                      });

                      if (response.ok) {
                        showToast(mounted ? t('cart.addedToCart') : 'Ürün sepete eklendi!', 'success');
                        // Sepet badge'ini güncelle
                        window.dispatchEvent(new Event('cartUpdated'));
                      } else {
                        const error = await response.json();
                        showToast(error.error || (mounted ? t('cart.addToCartError') : 'Ürün sepete eklenirken hata oluştu'), 'error');
                      }
                    } catch (error) {
                      console.error('Error adding to cart:', error);
                      showToast(mounted ? t('cart.addToCartError') : 'Ürün sepete eklenirken hata oluştu', 'error');
                    } finally {
                      setAddingToCart(null);
                    }
                  }}
                  disabled={addingToCart === product.id || product.stock === 0}
                  className="w-full px-2 py-1.5 sm:px-3 sm:py-2 bg-[#E91E63] text-white text-[10px] sm:text-xs font-medium rounded hover:bg-[#C2185B] transition-colors mt-auto disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {addingToCart === product.id 
                    ? (mounted ? t('products.addingToCart') : 'Ekleniyor...')
                    : (mounted ? t('products.addToCart') : 'Sepete Ekle')}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
