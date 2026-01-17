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
  slug: string;
  sku?: string | null;
  price: string;
  comparePrice?: string | null;
  stock: number | null;
  weight?: string | null;
  unit?: string | null;
  productGroup?: string | null;
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
  images?: string; // Varyantın resimlerini de sakla
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

  // Seçilen varyant değiştiğinde scroll to top (URL güncellemesi onClick'te yapılıyor)
  useEffect(() => {
    if (selectedVariant) {
      // Sadece scroll yap, URL güncellemesi onClick handler'ında yapılıyor
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
          
          // Ürünün grup adını belirle (önce productGroup'dan base name çıkar, sonra baseName, sonra name'den çıkar)
          let groupKey: string | null = null;
          
          if (foundProduct.productGroup) {
            // productGroup varsa, ondan base name çıkar (örn: "Isot Pepper 50 Gr" -> "isot pepper")
            groupKey = extractBaseFromProductGroup(foundProduct.productGroup);
          } else if (foundProduct.baseName) {
            groupKey = normalizeName(foundProduct.baseName);
          } else if (foundProduct.name) {
            groupKey = normalizeName(foundProduct.name);
          }
          
          // Aynı grup ürünlerini bul
          let groupProducts: Product[] = [];
          
          if (groupKey && groupKey.length > 0) {
            groupProducts = allProducts.filter((p: Product) => {
              if (p.isActive === false) return false;
              
              // productGroup varsa, ondan base name çıkar ve karşılaştır
              if (p.productGroup) {
                const pGroupBase = extractBaseFromProductGroup(p.productGroup);
                if (pGroupBase === groupKey) {
                  return true;
                }
              }
              
              // baseName varsa onu kullan
              if (p.baseName) {
                const normalizedBaseName = normalizeName(p.baseName);
                if (normalizedBaseName === groupKey) {
                  return true;
                }
              }
              
              // name'den normalize edilmiş isimle karşılaştır
              if (p.name) {
                const normalizedName = normalizeName(p.name);
                if (normalizedName === groupKey && normalizedName.length > 0) {
                  return true;
                }
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
                images: p.images || undefined, // Her varyantın resimlerini de sakla
              }))
            : [];
          
          // Gramaja göre sırala
          variantsList.sort((a, b) => {
            const weightA = parseFloat(a.weight || '0') * (a.unit === 'Kg' ? 1000 : 1);
            const weightB = parseFloat(b.weight || '0') * (b.unit === 'Kg' ? 1000 : 1);
            return weightA - weightB;
          });
          
          setVariants(variantsList);
          
          // Her varyantın tam ürün bilgilerini sakla (resimler dahil)
          const variantProductsMap = new Map(groupProducts.map((p: Product) => [p.id, p]));
          setVariantProducts(variantProductsMap);
          
          // Seçili varyantı ayarla: Önce mevcut ürünün ID'sine göre bul, bulunamazsa ilkini seç
          if (variantsList.length > 0) {
            // Mevcut ürünün ID'sine göre varyantı bul
            const selectedVariantById = variantsList.find(v => v.id === foundProduct.id);
            if (selectedVariantById) {
              setSelectedVariant(selectedVariantById);
            } else {
              // Bulunamazsa ilk varyantı seç
              setSelectedVariant(variantsList[0]);
            }
          } else {
            // Varyant yoksa, mevcut ürünü seçili varyant olarak ayarla (göstermek için)
            setSelectedVariant(null);
          }
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
    
    if (currentLanguage === 'fr' && displayProduct.nameFr) {
      return displayProduct.nameFr;
    }
    if (currentLanguage === 'en' && displayProduct.nameEn) {
      return displayProduct.nameEn;
    }
    // TR veya çeviri yoksa orijinal ismi kullan
    return displayProduct.baseName || displayProduct.name;
  };
  
  const productName = getProductName();
  
  const images = displayProduct?.images ? displayProduct.images.split(',').map(img => {
    const trimmed = img.trim();
    if (!trimmed) return '';
    
    // Eğer zaten tam URL ise (http/https veya Supabase Storage URL), olduğu gibi döndür
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    
    // Eğer / ile başlıyorsa, olduğu gibi döndür
    if (trimmed.startsWith('/')) {
      return trimmed;
    }
    
    // Supabase Storage URL kontrolü (storage/v1/object/public içeriyorsa)
    if (trimmed.includes('storage/v1/object/public')) {
      return trimmed;
    }
    
    // Local dosya yolu - /uploads/products/ ekle
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
                {displayProduct.baseName || displayProduct.name}
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

            {/* Fiyat */}
            <div>
              {hasDiscount ? (
                <div className="flex items-center gap-2 sm:gap-4">
                  <span className="text-2xl sm:text-3xl font-bold text-[#E91E63]">
                    ${parseFloat(displayProduct.price).toFixed(2)}
                  </span>
                  <span className="text-lg sm:text-xl font-bold text-black line-through">
                    ${parseFloat(displayProduct.comparePrice!).toFixed(2)}
                  </span>
                </div>
              ) : (
                <span className="text-2xl sm:text-3xl font-bold text-[#E91E63]">
                  ${parseFloat(displayProduct.price).toFixed(2)}
                </span>
              )}
            </div>

            {/* Stok Durumu */}
            <div>
              <p className={`text-xs sm:text-sm ${(displayProduct.stock ?? 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(displayProduct.stock ?? 0) > 0 
                  ? (mounted ? t('products.inStock', { count: displayProduct.stock ?? 0 }) : `Stokta: ${displayProduct.stock} adet`)
                  : (mounted ? t('products.outOfStock') : 'Stokta Yok')}
              </p>
            </div>

            {/* Gramaj Varyantları - Küçük ve Kompakt */}
            {variants.length > 1 && (
              <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3">{mounted ? t('products.weightOptions') : 'Gramaj Seçenekleri'}</h3>
                <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                  {variants.map((variant) => {
                    const variantHasDiscount = variant.comparePrice && parseFloat(variant.comparePrice) > parseFloat(variant.price);
                    const isSelected = selectedVariant?.id === variant.id;
                    
                    // Weight gösterimi: 1000 gr ise 1 Kg göster
                    let displayWeight = variant.weight;
                    let displayUnit = variant.unit;
                    if (variant.unit === 'Gr' && displayWeight && parseFloat(displayWeight) >= 1000 && parseFloat(displayWeight) % 1000 === 0) {
                      const kgValue = parseFloat(displayWeight) / 1000;
                      // Ondalık kısmı 0 ise sadece tam sayı göster
                      displayWeight = kgValue % 1 === 0 ? kgValue.toString() : kgValue.toFixed(2);
                      displayUnit = 'Kg';
                    } else if (displayWeight) {
                      const weightNum = parseFloat(displayWeight);
                      // Ondalık kısmı 0 ise sadece tam sayı göster
                      displayWeight = weightNum % 1 === 0 ? weightNum.toString() : weightNum.toFixed(2);
                    }
                    if (!displayWeight || displayWeight === '0') {
                      displayWeight = '-';
                      displayUnit = '';
                    }
                    
                    // Her varyantın slug'ını al (eğer yoksa ID kullan)
                    const variantProduct = variantProducts.get(variant.id);
                    const variantSlug = variantProduct?.slug || variant.id.toString();
                    const variantUrl = `/product/${variantSlug}`;
                    
                    return (
                      <Link
                        key={variant.id}
                        href={variantUrl}
                        onClick={(e) => {
                          // Eğer aynı varyant seçiliyse, navigation'ı engelle
                          if (variantSlug === slug) {
                            e.preventDefault();
                            return;
                          }
                          // Seçili varyantı güncelle
                          setSelectedVariant(variant);
                          // Link component otomatik olarak URL'yi güncelleyecek
                          // Sayfanın en üstüne kaydır
                          setTimeout(() => {
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }, 100);
                        }}
                        className={`flex-shrink-0 p-2 sm:p-3 border-2 rounded-lg text-center transition-all min-w-[80px] sm:min-w-[100px] block cursor-pointer ${
                          isSelected
                            ? 'border-green-300 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-[10px] sm:text-xs font-semibold text-gray-900 mb-0.5 sm:mb-1">
                          {displayWeight} {displayUnit ? displayUnit : ''}
                        </div>
                        <div className="space-y-0.5">
                          {variantHasDiscount ? (
                            <>
                              <div className="text-xs sm:text-sm font-bold text-[#E91E63]">
                                ${parseFloat(variant.price).toFixed(2)}
                              </div>
                              <div className="text-[10px] sm:text-xs font-bold text-black line-through">
                                ${parseFloat(variant.comparePrice!).toFixed(2)}
                              </div>
                            </>
                          ) : (
                            <div className="text-xs sm:text-sm font-bold text-[#E91E63]">
                              ${parseFloat(variant.price).toFixed(2)}
                            </div>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
                {/* Sepete Ekle Butonu - Varyantların Altında */}
                <button
                  onClick={async () => {
                    const productIdToAdd = selectedVariant?.id || product?.id;
                    if (!productIdToAdd) return;
                    
                    setAddingToCart(true);
                    try {
                      const response = await fetch('/api/cart', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          productId: productIdToAdd,
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
                      setAddingToCart(false);
                    }
                  }}
                         disabled={addingToCart || (!selectedVariant && (!product || (product.stock ?? 0) === 0)) || (selectedVariant ? (selectedVariant.stock ?? 0) === 0 : false)}
                         className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[#E91E63] text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-[#C2185B] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                       >
                         {addingToCart 
                           ? (mounted ? t('products.addingToCart') : 'Ekleniyor...')
                           : (selectedVariant && (selectedVariant.stock ?? 0) > 0) || (product && (product.stock ?? 0) > 0) 
                             ? (mounted ? t('products.addToCart') : 'Sepete Ekle')
                             : (mounted ? t('products.outOfStock') : 'Stokta Yok')}
                </button>
              </div>
            )}
            
            {/* Varyant yoksa sepete ekle butonu */}
            {variants.length <= 1 && (
              <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
                <button
                  onClick={async () => {
                    if (!product?.id) return;
                    
                    setAddingToCart(true);
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
                      setAddingToCart(false);
                    }
                  }}
                  disabled={addingToCart || !product || (product.stock ?? 0) === 0}
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
