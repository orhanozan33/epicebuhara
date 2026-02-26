'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { showToast } from '@/components/Toast';

interface Product {
  id: number;
  name: string;
  nameFr?: string | null;
  nameEn?: string | null;
  baseName?: string | null;
  baseNameFr?: string | null;
  baseNameEn?: string | null;
  slug: string;
  sku?: string | null;
  price: string;
  comparePrice?: string | null;
  stock: number | null;
  weight?: string | null;
  unit?: string | null;
  productGroup?: string | null;
  packSize?: number | null;
  packLabelTr?: string | null;
  packLabelEn?: string | null;
  packLabelFr?: string | null;
  categoryId?: number | null;
  description?: string | null;
  images?: string | null;
  categoryName?: string | null;
  categoryNameFr?: string | null;
  categoryNameEn?: string | null;
  isActive?: boolean;
}

interface ProductVariant {
  id: number;
  name: string;
  weight: string;
  unit: string;
  price: string;
  comparePrice?: string;
  stock: number | null;
  images?: string;
  packSize?: number | null;
  packLabelTr?: string | null;
  packLabelEn?: string | null;
  packLabelFr?: string | null;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const slug = params?.slug as string;
  const [mounted, setMounted] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [variantProducts, setVariantProducts] = useState<Map<number, Product>>(new Map());
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<string>('tr');
  const [sellUnit, setSellUnit] = useState<'adet' | 'kutu'>('kutu');
  const [quantity, setQuantity] = useState<number | ''>('');

  useEffect(() => {
    setMounted(true);
    if (i18n?.language) {
      setCurrentLanguage(i18n.language.split('-')[0]);
    }
    fetchProduct();
  }, [slug]);

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

  // Seçilen varyant değiştiğinde scroll to top ve satış birimi/miktarı sıfırla (normal kullanıcıda sadece kutu)
  useEffect(() => {
    if (selectedVariant) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const ps = (selectedVariant as any)?.packSize ?? 1;
      setSellUnit(ps > 1 ? 'kutu' : 'kutu');
      setQuantity('');
    }
  }, [selectedVariant]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      // Önce slug ile arama yap
      let response = await fetch(`/api/products?slug=${encodeURIComponent(slug)}&admin=true`);
      let foundProduct: Product | null = null;
      let allProducts: Product[] = [];
      
      if (response.ok) {
        const data = await response.json();
        // Eğer slug ile arama yaptıysak direkt ürünü al
        if (Array.isArray(data) && data.length > 0) {
          foundProduct = data[0];
        } else if (data && !Array.isArray(data)) {
          foundProduct = data;
        }
      }
      
      // Slug ile bulunamadıysa, ID ile arama yap (fallback - eski URL'ler için)
      if (!foundProduct) {
        const productId = parseInt(slug);
        if (!isNaN(productId)) {
          response = await fetch(`/api/products?admin=true`);
          if (response.ok) {
            allProducts = await response.json();
            foundProduct = allProducts.find((p: Product) => p.id === productId) || null;
          }
        } else {
          // Slug ile bulunamadıysa ve ID de değilse, tüm ürünleri getir (varyantlar için)
          response = await fetch(`/api/products?admin=true`);
          if (response.ok) {
            allProducts = await response.json();
          }
        }
      } else {
        // Slug ile bulunduysa, tüm ürünleri de getir (varyantları bulmak için)
        response = await fetch(`/api/products?admin=true`);
        if (response.ok) {
          allProducts = await response.json();
        }
      }
      
      if (foundProduct) {
        setProduct(foundProduct);
          
          // İsmi normalize et (karşılaştırma için) - gramaj ve birim bilgisini çıkar
          const normalizeName = (name: string | null | undefined): string => {
            if (!name) return '';
            return name
              .toLowerCase()
              .trim()
              .replace(/\s+/g, ' ') // Birden fazla boşluğu tek boşluğa çevir
              .replace(/\d+(\.\d+)?\s*(gr|g|kg|lt|Gr|G|Kg|Kg)\s*$/i, '') // Sonundaki gramaj bilgisini çıkar
              .trim();
          };
          
          // productGroup'dan base name çıkar (örn: "Isot Pepper 50 Gr" -> "isot pepper")
          const extractBaseFromProductGroup = (productGroup: string | null | undefined): string | null => {
            if (!productGroup) return null;
            return normalizeName(productGroup);
          };
          
          // Ürünün grup adını belirle - dile göre baseName kullan
          // Önce mevcut dili al
          const currentLang = typeof window !== 'undefined' && i18n?.language ? i18n.language.split('-')[0] : 'tr';
          
          // Dile göre baseName seç
          const getBaseNameForGrouping = (p: Product): string | null => {
            if (currentLang === 'fr' && p.baseNameFr) {
              return p.baseNameFr;
            } else if (currentLang === 'en' && p.baseNameEn) {
              return p.baseNameEn;
            } else if (p.baseName) {
              return p.baseName;
            } else if (p.productGroup) {
              // productGroup'dan base name çıkar
              return extractBaseFromProductGroup(p.productGroup);
            } else if (p.name) {
              return normalizeName(p.name);
            }
            return null;
          };
          
          const groupKey = getBaseNameForGrouping(foundProduct);
          
          // Aynı grup ürünlerini bul - dile göre baseName kullanarak
          let groupProducts: Product[] = [];
          
          if (groupKey && groupKey.length > 0) {
            const normalizedGroupKey = normalizeName(groupKey);
            groupProducts = allProducts.filter((p: Product) => {
              if (p.isActive === false) return false;
              if (p.id === foundProduct.id) return false; // Kendisini hariç tut
              
              const pBaseName = getBaseNameForGrouping(p);
              if (pBaseName) {
                const normalizedPBaseName = normalizeName(pBaseName);
                return normalizedPBaseName === normalizedGroupKey;
              }
              
              return false;
            });
          }
          
          // Eğer grup bulunamadıysa veya sadece 1 ürün varsa, mevcut ürünü göster
          // Ancak eğer bulunan ürünler içinde mevcut ürün varsa ve birden fazla ürün varsa, varyantları göster
          if (groupProducts.length === 0) {
            // Grup bulunamadıysa, sadece mevcut ürünü göster
            groupProducts = [foundProduct];
          } else {
            // Grup bulundu, mevcut ürünün grup içinde olup olmadığını kontrol et
            const foundProductInGroup = groupProducts.find(p => p.id === foundProduct.id);
            if (!foundProductInGroup) {
              // Mevcut ürün grup içinde değilse, ekle
              groupProducts.push(foundProduct);
            }
            
            // Eğer sadece 1 ürün varsa (mevcut ürün), varyantları gösterme
            if (groupProducts.length === 1) {
              groupProducts = [foundProduct];
            }
          }
          
          // Varyantları oluştur (eğer birden fazla ürün varsa)
          const variantsList: ProductVariant[] = groupProducts.length > 1 
            ? groupProducts.map((p: Product) => ({
                id: p.id,
                name: p.name,
                weight: p.weight || '',
                unit: p.unit || 'Gr',
                price: p.price || '0',
                comparePrice: p.comparePrice || undefined,
                stock: p.stock ?? 0,
                images: p.images || undefined,
                packSize: p.packSize ?? 1,
                packLabelTr: p.packLabelTr ?? null,
                packLabelEn: p.packLabelEn ?? null,
                packLabelFr: p.packLabelFr ?? null,
              }))
            : [];
          
          // Gramaja göre sırala
          variantsList.sort((a, b) => {
            const weightA = parseFloat(a.weight || '0') * (a.unit === 'Kg' ? 1000 : 1);
            const weightB = parseFloat(b.weight || '0') * (b.unit === 'Kg' ? 1000 : 1);
            return weightA - weightB;
          });
          
          // Varyantlar kaldırıldı: her zaman tek ürün göster, gramaj seçenekleri yok
          setVariants([]);
          setVariantProducts(new Map());
          setSelectedVariant(null);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-gray-600 text-sm sm:text-base">{mounted ? t('products.loading') : 'Yükleniyor...'}</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8 text-center">
          <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">{mounted ? t('products.productNotFound') : 'Ürün bulunamadı'}</p>
          <Link href="/" className="text-[#E91E63] hover:text-[#C2185B] text-sm sm:text-base">
            {mounted ? t('home.backToHome') : 'Ana Sayfaya Dön'}
          </Link>
        </div>
      </div>
    );
  }

  // Seçili varyant varsa, onun tam ürün bilgilerini variantProducts Map'inden al
  const selectedVariantProduct = selectedVariant && variantProducts.size > 0 
    ? variantProducts.get(selectedVariant.id) 
    : null;
  
  // Seçili varyant varsa, onun bilgilerini kullan, yoksa mevcut ürünü kullan
  // selectedVariantProduct zaten tam ürün bilgilerini içeriyor (resimler, slug, description dahil)
  const displayProduct = selectedVariant && selectedVariantProduct 
    ? selectedVariantProduct  // Seçilen varyantın tam ürün bilgilerini doğrudan kullan
    : product;
  
  // Dil değişikliğine göre ürün ismini seç
  const getProductName = () => {
    if (!displayProduct) return '';
    
    if (currentLanguage === 'fr' && displayProduct.baseNameFr) {
      return displayProduct.baseNameFr;
    }
    if (currentLanguage === 'en' && displayProduct.baseNameEn) {
      return displayProduct.baseNameEn;
    }
    // TR veya çeviri yoksa orijinal ismi kullan
    return displayProduct.baseName || displayProduct.name;
  };

  // Paket etiketi (dile göre): Kutu, Box, Boîte
  const getPackLabel = (p: { packLabelTr?: string | null; packLabelEn?: string | null; packLabelFr?: string | null }) => {
    if (currentLanguage === 'fr' && p.packLabelFr) return p.packLabelFr;
    if (currentLanguage === 'en' && p.packLabelEn) return p.packLabelEn;
    return p.packLabelTr || 'Kutu';
  };

  // Paket gösterim metni: TR "20'li Kutu", EN "20 Box", FR "Boîte de 20"
  const getPackDisplayText = (packSize: number) => {
    const label = getPackLabel(displayProduct as any);
    const isFr = currentLanguage === 'fr' || String(currentLanguage).startsWith('fr');
    if (isFr) return `${label} de ${packSize}`;
    if (currentLanguage === 'en' || String(currentLanguage).startsWith('en')) return `${packSize} ${label}`;
    return `${packSize}'li ${label}`;
  };

  // Başlık: "İsot Biber 50 Gr - 20'li Kutu" / FR "Piment Isot 50 Gr - 20' Boîte de"
  const getDisplayTitle = () => {
    const base = getProductName();
    const packSize = (displayProduct as any)?.packSize;
    if (!packSize || packSize <= 1) return base;
    const weight = displayProduct?.weight;
    const unit = displayProduct?.unit || 'Gr';
    const weightPart = weight && unit ? ` ${weight} ${unit}` : '';
    return `${base}${weightPart} - ${getPackDisplayText(packSize)}`;
  };
  
  const productName = getProductName();
  
  const images = displayProduct?.images ? displayProduct.images.split(',').map(img => {
    const trimmed = (img || '').replace(/\r\n|\r|\n/g, '').trim();
    if (!trimmed) return '';
    
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    if (trimmed.startsWith('/')) return trimmed;
    if (trimmed.includes('storage/v1/object/public')) return trimmed;
    return `/uploads/products/${trimmed}`;
  }).filter(Boolean) : [];

  const hasDiscount = displayProduct.comparePrice && parseFloat(displayProduct.comparePrice) > parseFloat(displayProduct.price);

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
      {/* Mobil Navigasyon Linkleri - Başlık Üstünde */}
      <nav className="lg:hidden flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 text-gray-700 overflow-x-auto pb-2">
        <Link href="/" className="hover:text-[#E91E63] font-medium transition-colors whitespace-nowrap text-xs sm:text-sm px-2 py-1 rounded hover:bg-gray-100">
          {mounted ? t('header.allProducts') : 'Tüm Ürünler'}
        </Link>
        <Link href="/discounted-products" className="hover:text-[#E91E63] font-medium transition-colors whitespace-nowrap text-xs sm:text-sm px-2 py-1 rounded hover:bg-gray-100">
          {mounted ? t('header.discountedProducts') : 'İndirimli Ürünler'}
        </Link>
        <Link href="/new-products" className="hover:text-[#E91E63] font-medium transition-colors whitespace-nowrap text-xs sm:text-sm px-2 py-1 rounded hover:bg-gray-100">
          {mounted ? t('header.newProducts') : 'Yeni Ürünler'}
        </Link>
      </nav>
      <div className="mb-3 sm:mb-4">
        <Link href="/" className="text-gray-600 hover:text-[#E91E63] text-sm sm:text-base">
          ← {mounted ? t('home.backToHome') : 'Ana Sayfaya Dön'}
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
          {/* Sol Taraf - Ürün Resimleri */}
          <div className="space-y-3 sm:space-y-4">
            {images.length > 0 ? (
              <>
                <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={images[0]}
                    alt={productName}
                    className="w-full h-full object-contain p-2 sm:p-4"
                    loading="eager"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      console.error('Resim yükleme hatası:', target.src, displayProduct.name);
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector('.error-placeholder')) {
                        const placeholder = document.createElement('span');
                        placeholder.className = 'error-placeholder text-gray-400 text-sm sm:text-base';
                        placeholder.textContent = mounted ? t('admin.common.noImage') : 'Resim Yüklenemedi';
                        parent.appendChild(placeholder);
                      }
                    }}
                  />
                </div>
                {images.length > 1 && (
                  <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                    {images.slice(1, 5).map((img, index) => (
                      <div key={index} className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={img}
                          alt={`${productName} ${index + 2}`}
                          className="w-full h-full object-contain p-1 sm:p-2"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            console.error('Resim yükleme hatası:', target.src);
                            target.style.display = 'none';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-gray-400 text-sm sm:text-base">{mounted ? t('admin.common.noImage') : 'Resim Yok'}</span>
              </div>
            )}
          </div>

          {/* Sağ Taraf - Ürün Detayları ve Varyantlar */}
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
                {getDisplayTitle()}
              </h1>
              {displayProduct.categoryName && (() => {
                const categoryName = (currentLanguage === 'fr' && displayProduct.categoryNameFr) 
                  ? displayProduct.categoryNameFr 
                  : (currentLanguage === 'en' && displayProduct.categoryNameEn) 
                    ? displayProduct.categoryNameEn 
                    : displayProduct.categoryName;
                return (
                  <p className="text-gray-500 text-xs sm:text-sm">{categoryName}</p>
                );
              })()}
            </div>

            {displayProduct.description && (
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">{mounted ? t('products.description') : 'Açıklama'}</h2>
                <p className="text-gray-600 whitespace-pre-line text-sm sm:text-base">{displayProduct.description}</p>
              </div>
            )}

            {/* Fiyat: packSize > 1 ise sadece kutu fiyatı; packSize === 1 ise birim fiyat (normal kullanıcıda adet seçeneği yok) */}
            <div className="space-y-1">
              {((displayProduct as any)?.packSize ?? 1) > 1 ? (
                <p className="text-sm text-gray-700">
                  1 {getPackLabel(displayProduct as any)} = {parseFloat(displayProduct?.price || '0').toFixed(2)} × {((displayProduct as any)?.packSize ?? 1)} ={' '}
                  <span className="font-semibold text-gray-900">
                    ${(parseFloat(displayProduct?.price || '0') * ((displayProduct as any)?.packSize ?? 1)).toFixed(2)}
                  </span>
                </p>
              ) : (
                <p className="text-sm text-gray-600">
                  {currentLanguage === 'fr' ? 'Prix unitaire' : currentLanguage === 'en' ? 'Unit price' : 'Birim fiyat'}:{' '}
                  <span className="font-semibold text-gray-900">${parseFloat(displayProduct?.price || '0').toFixed(2)}</span>
                </p>
              )}
              <p className="text-base font-semibold text-[#E91E63]">
                {currentLanguage === 'fr' ? 'Total' : currentLanguage === 'en' ? 'Total' : 'Toplam'}:{' '}
                {(() => {
                  const q = quantity === '' ? 0 : quantity;
                  return ((displayProduct as any)?.packSize ?? 1) > 1 && sellUnit === 'kutu'
                    ? `${q} ${getPackLabel(displayProduct as any)} = $${(parseFloat(displayProduct?.price || '0') * ((displayProduct as any)?.packSize ?? 1) * q).toFixed(2)}`
                    : `${q} ${currentLanguage === 'fr' ? 'pièce(s)' : currentLanguage === 'en' ? 'piece(s)' : 'adet'} = $${(parseFloat(displayProduct?.price || '0') * q).toFixed(2)}`;
                })()}
              </p>
            </div>

            {/* Stok Durumu */}
            <div>
              <p className={`text-xs sm:text-sm ${(displayProduct.stock ?? 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(displayProduct.stock ?? 0) > 0 
                  ? (mounted ? t('products.inStock', { count: displayProduct.stock ?? 0 }) : `Stokta: ${displayProduct.stock ?? 0} kutu`)
                  : (mounted ? t('products.outOfStock') : 'Stokta Yok')}
              </p>
            </div>

            {/* Satış birimi: normal kullanıcıda sadece kutu (adet seçeneği yok, sadece admin bayi satışında) */}
            {((displayProduct as any)?.packSize ?? 1) > 1 ? (
              <div className="mt-3 sm:mt-4 space-y-3">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-900">
                  {currentLanguage === 'fr' ? 'Unité de vente' : currentLanguage === 'en' ? 'Selling unit' : 'Satış birimi'}
                </h3>
                <div className="flex flex-wrap gap-2">
                  <span className="flex-shrink-0 p-2 sm:p-3 border-2 border-green-300 bg-green-50 rounded-lg text-center min-w-[80px] sm:min-w-[90px] text-sm font-medium text-gray-900">
                    {getPackDisplayText((displayProduct as any)?.packSize ?? 1)}
                  </span>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    {currentLanguage === 'fr' ? 'Nombre de boîtes' : currentLanguage === 'en' ? 'Number of boxes' : 'Kaç kutu?'}
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white">
                      <button
                        type="button"
                        aria-label={currentLanguage === 'fr' ? 'Diminuer' : currentLanguage === 'en' ? 'Decrease' : 'Azalt'}
                        onClick={() => {
                          const q = quantity === '' ? 0 : quantity;
                          if (q <= 0) return;
                          setQuantity(q - 1);
                        }}
                        className="flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-lg select-none touch-manipulation"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={0}
                        max={sellUnit === 'kutu'
                          ? Math.max(0, (displayProduct?.stock ?? 0) || 99)
                          : Math.max(0, displayProduct?.stock ?? 99)}
                        value={quantity === '' ? '' : quantity}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === '') { setQuantity(''); return; }
                          const n = parseInt(v, 10);
                          if (!isNaN(n)) {
                            const maxVal = sellUnit === 'kutu'
                              ? Math.max(0, (displayProduct?.stock ?? 0) || 99)
                              : Math.max(0, displayProduct?.stock ?? 99);
                            setQuantity(Math.min(Math.max(0, n), maxVal));
                          }
                        }}
                        className="w-14 sm:w-16 px-2 py-2 text-center border-0 border-x border-gray-300 focus:outline-none focus:ring-0 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button
                        type="button"
                        aria-label={currentLanguage === 'fr' ? 'Augmenter' : currentLanguage === 'en' ? 'Increase' : 'Artır'}
                        onClick={() => {
                          const maxVal = sellUnit === 'kutu'
                            ? Math.max(0, (displayProduct?.stock ?? 0) || 99)
                            : Math.max(0, displayProduct?.stock ?? 99);
                          const q = quantity === '' ? 0 : quantity;
                          if (q >= maxVal) return;
                          setQuantity(q + 1);
                        }}
                        className="flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-lg select-none touch-manipulation"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-sm text-gray-600">
                      {sellUnit === 'kutu' ? getPackLabel(displayProduct as any) : (currentLanguage === 'fr' ? 'unité(s)' : currentLanguage === 'en' ? 'piece(s)' : 'adet')}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-3 sm:mt-4">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  {currentLanguage === 'fr' ? 'Quantité' : currentLanguage === 'en' ? 'Quantity' : 'Miktar'}
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white">
                    <button
                      type="button"
                      aria-label={currentLanguage === 'fr' ? 'Diminuer' : currentLanguage === 'en' ? 'Decrease' : 'Azalt'}
                      onClick={() => {
                        const q = quantity === '' ? 0 : quantity;
                        if (q <= 0) return;
                        setQuantity(q - 1);
                      }}
                      className="flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-lg select-none touch-manipulation"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min={0}
                      max={Math.max(0, displayProduct?.stock ?? 99)}
                      value={quantity === '' ? '' : quantity}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === '') { setQuantity(''); return; }
                        const n = parseInt(v, 10);
                        if (!isNaN(n)) {
                          const maxVal = Math.max(0, displayProduct?.stock ?? 99);
                          setQuantity(Math.min(Math.max(0, n), maxVal));
                        }
                      }}
                      className="w-14 sm:w-16 px-2 py-2 text-center border-0 border-x border-gray-300 focus:outline-none focus:ring-0 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      aria-label={currentLanguage === 'fr' ? 'Augmenter' : currentLanguage === 'en' ? 'Increase' : 'Artır'}
                      onClick={() => {
                        const maxVal = Math.max(0, displayProduct?.stock ?? 99);
                        const q = quantity === '' ? 0 : quantity;
                        if (q >= maxVal) return;
                        setQuantity(q + 1);
                      }}
                      className="flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-lg select-none touch-manipulation"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-sm text-gray-600">{currentLanguage === 'fr' ? 'unité(s)' : currentLanguage === 'en' ? 'unit(s)' : 'adet'}</span>
                </div>
              </div>
            )}

            
            {/* Sepete ekle butonu */}
            {(
              <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
                <button
                  onClick={async () => {
                    if (!product?.id) return;
                    const q = quantity === '' ? 0 : quantity;
                    if (q <= 0) {
                      showToast(mounted ? t('admin.dealers.invalidQuantity') : 'Lütfen miktar girin', 'error');
                      return;
                    }
                    const packSize = (displayProduct as any)?.packSize ?? 1;
                    const quantityToAdd = packSize > 1
                      ? (sellUnit === 'kutu' ? q * packSize : q)
                      : q;
                    
                    setAddingToCart(true);
                    try {
                      const response = await fetch('/api/cart', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          productId: product.id,
                          quantity: quantityToAdd,
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
                      setAddingToCart(false);
                    }
                  }}
                  disabled={addingToCart || (quantity === '' ? 0 : quantity) <= 0 || !product || (product.stock ?? 0) === 0}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[#E91E63] text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-[#C2185B] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {addingToCart 
                    ? (mounted ? t('products.addingToCart') : 'Ekleniyor...')
                    : product && (product.stock ?? 0) > 0 
                      ? (mounted ? t('products.addToCart') : 'Sepete Ekle')
                      : (mounted ? t('products.outOfStock') : 'Stokta Yok')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
