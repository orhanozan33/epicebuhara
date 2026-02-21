'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
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
  const { t, i18n } = useTranslation();
  const [productsList, setProductsList] = useState<any[]>([]);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [addingToCart, setAddingToCart] = useState<number | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<string>('tr');
  const [addToCartModalProduct, setAddToCartModalProduct] = useState<any | null>(null);
  const [addToCartBoxQty, setAddToCartBoxQty] = useState<number | ''>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showGroupedByCategory = !categoryId && !featured && !newProducts && !discounted;

  useEffect(() => {
    setMounted(true);
    if (i18n?.language) {
      setCurrentLanguage(i18n.language.split('-')[0]);
    }
  }, []);

  // Dil değişikliğini dinle - component'i yeniden render et
  useEffect(() => {
    if (!i18n || typeof i18n.on !== 'function') return;
    
    const updateLanguage = () => {
      if (i18n?.language) {
        setCurrentLanguage(i18n.language.split('-')[0]);
      }
    };
    
    // İlk yüklemede dil'i ayarla
    updateLanguage();
    
    // Dil değişikliğini dinle
    try {
      i18n.on('languageChanged', updateLanguage);
    } catch (error) {
      console.error('Error setting up language change listener:', error);
    }
    
    return () => {
      try {
        if (i18n && typeof i18n.off === 'function') {
          i18n.off('languageChanged', updateLanguage);
        }
      } catch (error) {
        console.error('Error removing language change listener:', error);
      }
    };
  }, [i18n]);

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

  // Paket metni: 20'li Kutu / 20 Box / Boîte de 20
  const getPackDisplayText = useCallback((packSize: number, packLabelTr?: string | null, packLabelEn?: string | null, packLabelFr?: string | null) => {
    const label = currentLanguage === 'fr' ? (packLabelFr || 'Boîte') : currentLanguage === 'en' ? (packLabelEn || 'Box') : (packLabelTr || 'Kutu');
    if (currentLanguage === 'fr') return `${label} de ${packSize}`;
    if (currentLanguage === 'en') return `${packSize} ${label}`;
    return `${packSize}'li ${label}`;
  }, [currentLanguage]);

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

        if (!categoryId && !featured && !newProducts && !discounted) {
          const catRes = await fetch('/api/categories');
          if (catRes.ok) {
            const catData = await catRes.json();
            setCategoriesList(Array.isArray(catData) ? catData : []);
          } else {
            setCategoriesList([]);
          }
        } else {
          setCategoriesList([]);
        }
      } catch (error) {
        console.error('Error loading products:', error);
        setProductsList([]);
        setCategoriesList([]);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, [categoryId, featured, newProducts, discounted, debouncedSearchQuery]);

  // Kategori seçiliyse sadece o kategorideki ürünleri göster (API zaten filtreler, ek güvence)
  const displayProducts = useMemo(() => {
    if (!categoryId) return productsList;
    const id = parseInt(categoryId, 10);
    if (isNaN(id)) return productsList;
    return productsList.filter((p: any) => {
      const cid = p.categoryId;
      if (cid == null) return false;
      const num = typeof cid === 'number' ? cid : parseInt(String(cid), 10);
      return num === id;
    });
  }, [categoryId, productsList]);

  const groupedByCategory = useMemo(() => {
    if (!showGroupedByCategory || productsList.length === 0) return null;
    const byCat = new Map<number, any[]>();
    const other: any[] = [];
    for (const p of productsList) {
      const cid = p.categoryId;
      if (cid != null && cid !== '') {
        const id = typeof cid === 'number' ? cid : parseInt(String(cid), 10);
        if (!isNaN(id)) {
          if (!byCat.has(id)) byCat.set(id, []);
          byCat.get(id)!.push(p);
          continue;
        }
      }
      other.push(p);
    }
    const ordered: { category: any; products: any[] }[] = [];
    for (const cat of categoriesList) {
      const prods = byCat.get(cat.id);
      if (prods && prods.length > 0) ordered.push({ category: cat, products: prods });
    }
    if (other.length > 0) ordered.push({ category: { id: 0, name: mounted ? t('categories.other') : 'Diğer', slug: '' }, products: other });
    return ordered;
  }, [showGroupedByCategory, productsList, categoriesList, mounted, t]);

  if (loading) {
    return <div className="text-center py-8">{mounted ? t('products.loading') : 'Yükleniyor...'}</div>;
  }

  const renderProductCard = useCallback((product: any) => {
    const hasDiscount = product.comparePrice && parseFloat(product.comparePrice) > parseFloat(product.price);
    const discountPercent = hasDiscount 
      ? Math.round(((parseFloat(product.comparePrice) - parseFloat(product.price)) / parseFloat(product.comparePrice)) * 100)
      : 0;
    const productName = (currentLanguage === 'fr' && product.baseNameFr) 
      ? product.baseNameFr 
      : (currentLanguage === 'en' && product.baseNameEn) 
        ? product.baseNameEn 
        : (product.baseName || product.name);
    return (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all hover:border-[#E91E63] flex flex-col">
        <Link href={`/product/${product.slug || product.id}`} className="block" title={productName}>
          <div className="relative w-full aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
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
                  if (imgSrc.startsWith('http://') || imgSrc.startsWith('https://')) return imgSrc;
                  if (imgSrc.startsWith('/')) return imgSrc;
                  if (imgSrc.includes('storage/v1/object/public')) return imgSrc;
                  return `/uploads/products/${imgSrc}`;
                })()}
                alt={productName} 
                className="w-full h-full object-contain p-2 hover:scale-105 transition-transform duration-300" 
                loading="lazy"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
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
          <Link href={`/product/${product.slug || product.id}`} className="block flex-1" title={productName}>
            <div className="flex items-start justify-between gap-1 sm:gap-2 mb-1 sm:mb-2">
              <h3 className="font-semibold text-gray-900 text-xs sm:text-sm line-clamp-2 flex-1">{productName}</h3>
              {product.weight && (
                <span className="text-[10px] sm:text-xs text-gray-500 whitespace-nowrap">
                  {(() => {
                    const weightNum = parseFloat(product.weight);
                    const unit = product.unit || 'Gr';
                    if (unit === 'Gr' && weightNum >= 1000 && weightNum % 1000 === 0) return `${(weightNum / 1000)} Kg`;
                    return `${Math.floor(weightNum)} ${unit}`;
                  })()}
                </span>
              )}
            </div>
          </Link>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (product.stock === 0) return;
              setAddToCartModalProduct(product);
              setAddToCartBoxQty('');
            }}
            disabled={product.stock === 0}
            className="w-full px-2 py-1.5 sm:px-3 sm:py-2 bg-[#E91E63] text-white text-[10px] sm:text-xs font-medium rounded hover:bg-[#C2185B] transition-colors mt-auto disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {mounted ? t('products.addToCart') : 'Sepete Ekle'}
          </button>
        </div>
      </div>
    );
  }, [currentLanguage, mounted, t]);

  const hasProductsToShow = showGroupedByCategory ? productsList.length > 0 : displayProducts.length > 0;
  if (!hasProductsToShow) {
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
      {groupedByCategory && groupedByCategory.length > 0 ? (
        groupedByCategory.map(({ category, products }, index) => (
          <section key={category.id ?? 'other'} className={index === 0 ? '' : 'mt-6 sm:mt-8'}>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
              {category.slug ? (
                <Link href={`/category/${category.slug}`} className="hover:text-[#E91E63] transition-colors">
                  {(currentLanguage === 'fr' && category.nameFr) ? category.nameFr : (currentLanguage === 'en' && category.nameEn) ? category.nameEn : category.name}
                </Link>
              ) : (
                <span>{category.name}</span>
              )}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4 w-full">
              {products.map((product) => (
                <div key={product.id}>{renderProductCard(product)}</div>
              ))}
            </div>
          </section>
        ))
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4 w-full">
          {displayProducts.map((product) => (
            <div key={product.id}>{renderProductCard(product)}</div>
          ))}
        </div>
      )}

      {/* Sepete Ekle Modal - Paket türü ve kutu sayısı (sadece kutu satışı) */}
      {addToCartModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setAddToCartModalProduct(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-4 sm:p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">
              {currentLanguage === 'fr' ? 'Ajouter au panier' : currentLanguage === 'en' ? 'Add to cart' : 'Sepete Ekle'}
            </h3>
            <p className="text-gray-700 text-xs sm:text-sm mb-1">
              {(currentLanguage === 'fr' && addToCartModalProduct.baseNameFr) || (currentLanguage === 'en' && addToCartModalProduct.baseNameEn)
                ? (currentLanguage === 'fr' ? addToCartModalProduct.baseNameFr : addToCartModalProduct.baseNameEn)
                : (addToCartModalProduct.baseName || addToCartModalProduct.name)}
            </p>
            {addToCartModalProduct.weight && (
              <p className="text-gray-500 text-xs mb-3">
                {(() => {
                  const w = parseFloat(addToCartModalProduct.weight);
                  const u = addToCartModalProduct.unit || 'Gr';
                  if (u === 'Gr' && w >= 1000 && w % 1000 === 0) return `${w / 1000} Kg`;
                  return `${Math.floor(w)} ${u}`;
                })()}
              </p>
            )}
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {currentLanguage === 'fr' ? 'Type de conditionnement' : currentLanguage === 'en' ? 'Package type' : 'Paket türü'}
                </label>
                <div className="py-2 px-3 bg-gray-50 rounded-lg text-sm text-gray-900 border border-gray-200">
                  {getPackDisplayText(
                    addToCartModalProduct.packSize ?? 1,
                    addToCartModalProduct.packLabelTr,
                    addToCartModalProduct.packLabelEn,
                    addToCartModalProduct.packLabelFr
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {currentLanguage === 'fr' ? 'Nombre de boîtes' : currentLanguage === 'en' ? 'Number of boxes' : 'Kaç kutu?'}
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const q = addToCartBoxQty === '' ? 0 : addToCartBoxQty;
                      if (q <= 1) setAddToCartBoxQty('');
                      else setAddToCartBoxQty(q - 1);
                    }}
                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={0}
                    max={(() => {
                      const ps = addToCartModalProduct.packSize ?? 1;
                      const stock = addToCartModalProduct.stock ?? 0;
                      return ps > 1 ? Math.max(0, Math.floor(stock / ps)) || 99 : Math.min(stock || 99, 99);
                    })()}
                    value={addToCartBoxQty === '' ? '' : addToCartBoxQty}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === '') { setAddToCartBoxQty(''); return; }
                      const n = parseInt(v, 10);
                      if (!isNaN(n)) {
                        const ps = addToCartModalProduct.packSize ?? 1;
                        const stock = addToCartModalProduct.stock ?? 0;
                        const maxB = ps > 1 ? Math.max(0, Math.floor(stock / ps)) || 99 : Math.min(stock || 99, 99);
                        setAddToCartBoxQty(Math.min(maxB, Math.max(0, n)));
                      }
                    }}
                    className="w-14 text-center border border-gray-300 rounded-lg py-2 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const ps = addToCartModalProduct.packSize ?? 1;
                      const stock = addToCartModalProduct.stock ?? 0;
                      const maxB = ps > 1 ? Math.max(0, Math.floor(stock / ps)) || 99 : Math.min(stock || 99, 99);
                      const q = addToCartBoxQty === '' ? 0 : addToCartBoxQty;
                      setAddToCartBoxQty(Math.min(maxB, q + 1));
                    }}
                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAddToCartModalProduct(null)}
                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                {currentLanguage === 'fr' ? 'Annuler' : currentLanguage === 'en' ? 'Cancel' : 'İptal'}
              </button>
              <button
                type="button"
                disabled={addingToCart === addToCartModalProduct.id || (addToCartBoxQty === '' ? 0 : addToCartBoxQty) <= 0}
                onClick={async () => {
                  if (!addToCartModalProduct) return;
                  const qty = addToCartBoxQty === '' ? 0 : addToCartBoxQty;
                  if (qty <= 0) return;
                  const packSize = addToCartModalProduct.packSize ?? 1;
                  const quantityToAdd = packSize > 1 ? qty * packSize : qty;
                  setAddingToCart(addToCartModalProduct.id);
                  try {
                    const response = await fetch('/api/cart', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        productId: addToCartModalProduct.id,
                        quantity: quantityToAdd,
                      }),
                    });
                    if (response.ok) {
                      showToast(mounted ? t('cart.addedToCart') : 'Ürün sepete eklendi!', 'success');
                      window.dispatchEvent(new Event('cartUpdated'));
                      setAddToCartModalProduct(null);
                    } else {
                      const error = await response.json();
                      showToast(error.error || (mounted ? t('cart.addToCartError') : 'Ürün sepete eklenirken hata oluştu'), 'error');
                    }
                  } catch {
                    showToast(mounted ? t('cart.addToCartError') : 'Ürün sepete eklenirken hata oluştu', 'error');
                  } finally {
                    setAddingToCart(null);
                  }
                }}
                className="flex-1 py-2 bg-[#E91E63] text-white rounded-lg text-sm font-medium hover:bg-[#C2185B] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addingToCart === addToCartModalProduct.id
                  ? (currentLanguage === 'fr' ? 'Ajout...' : currentLanguage === 'en' ? 'Adding...' : 'Ekleniyor...')
                  : (currentLanguage === 'fr' ? 'Ajouter' : currentLanguage === 'en' ? 'Add' : 'Sepete Ekle')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
