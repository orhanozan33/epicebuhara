'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { showToast } from '@/components/Toast';
import { showConfirm } from '@/components/ConfirmModal';

interface Category {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  baseName?: string | null;
  sku?: string | null;
  price: string;
  comparePrice?: string | null;
  stock?: number | null;
  weight?: string | null;
  unit?: string | null;
  productGroup?: string | null;
  categoryId?: number | null;
  isActive?: boolean;
  description?: string | null;
  images?: string | null;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const { t, i18n } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [id, setId] = useState<string | null>(null);

  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    nameFr: '',
    nameEn: '',
    baseName: '',
    baseNameFr: '',
    baseNameEn: '',
    sku: '',
    price: '',
    comparePrice: '',
    stock: '',
    weight: '',
    unit: 'Gr',
    productGroup: '',
    categoryId: '',
    isActive: true,
    description: '',
    images: '',
  });
  const [uploading, setUploading] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Params handling - Next.js 15 compatible
  useEffect(() => {
    let isActive = true;
    
    const resolveParams = async () => {
      try {
        let resolvedParams: any = params;
        
        // Next.js 15'te params Promise olabilir
        if (params && typeof params === 'object' && 'then' in params && typeof (params as any).then === 'function') {
          resolvedParams = await params;
        }
        
        const idParam = resolvedParams?.id ? String(resolvedParams.id) : null;
        
        if (isActive) {
          setId(idParam);
        }
      } catch (error: any) {
        console.error('Error resolving params:', error);
        if (isActive) {
          setId(null);
        }
      }
    };
    
    resolveParams();
    
    return () => {
      isActive = false;
    };
  }, [params]);

  useEffect(() => {
    if (!id) {
      return;
    }

    // "yeni" veya "new" yeni ürün oluşturma sayfası için
    if (id === 'yeni' || id === 'new') {
      fetchCategories();
      setLoading(false);
      setError(''); // Hata mesajını temizle
      return;
    }

    fetchProduct();
    fetchCategories();
  }, [id, mounted]);

  const fetchProduct = async () => {
    // "yeni" veya "new" yeni ürün oluşturma sayfası için
    if (!id || id === 'yeni' || id === 'new') {
      return;
    }

    // ID'nin geçerli bir sayı olup olmadığını kontrol et
    const productId = parseInt(id);
    if (isNaN(productId) || productId <= 0) {
      // "new" veya "yeni" değerleri için hata gösterme, bunlar yeni ürün oluşturma için
      if (id !== 'new' && id !== 'yeni') {
        setError(mounted ? t('admin.common.error') : 'Geçersiz ürün ID');
      }
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/products?admin=true`);
      if (response.ok) {
        const products = await response.json();
        const product = products.find((p: Product) => p.id === productId);
        if (product) {
          setProduct(product);
          const images = product.images ? product.images.split(',').map((img: string) => img.trim()).filter(Boolean) : [];
          setImageUrls(images);
          
          // Weight ve unit işleme: 1000 gr = 1 Kg dönüşümü ve ondalık kısmı kaldırma
          let weight = product.weight || '';
          let unit = product.unit || 'Gr';
          
          if (weight) {
            const weightNum = parseFloat(weight);
            if (unit === 'Gr') {
              // 1000 gr ise otomatik 1 Kg yap
              if (weightNum >= 1000 && weightNum % 1000 === 0) {
                weight = (weightNum / 1000).toString();
                unit = 'Kg';
              } else {
                // Ondalık kısmı kaldır
                weight = Math.floor(weightNum).toString();
              }
            } else {
              // Kg veya Lt ise ondalık kısmı kaldır
              weight = Math.floor(weightNum).toString();
            }
          }
          
          setFormData({
            name: product.name || '',
            nameFr: (product as any).nameFr || '',
            nameEn: (product as any).nameEn || '',
            baseName: product.baseName || '',
            baseNameFr: (product as any).baseNameFr || '',
            baseNameEn: (product as any).baseNameEn || '',
            sku: product.sku || '',
            price: product.price || '',
            comparePrice: product.comparePrice || '',
            stock: product.stock?.toString() || '',
            weight: weight,
            unit: unit,
            productGroup: product.productGroup || '',
            categoryId: product.categoryId?.toString() || '',
            isActive: product.isActive ?? true,
            description: product.description || '',
            images: product.images || '',
          });
        } else {
          setError(mounted ? t('admin.common.notFound') : 'Ürün bulunamadı');
        }
      } else {
        setError(mounted ? t('admin.common.error') : 'Ürün yüklenirken hata oluştu');
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      setError(mounted ? t('admin.common.error') : 'Ürün yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Dosya tipi kontrolü
    if (!file.type.startsWith('image/')) {
      setError(mounted ? t('admin.common.error') : 'Sadece resim dosyaları yüklenebilir');
      return;
    }

    // Dosya boyutu kontrolü (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError(mounted ? t('admin.common.error') : 'Dosya boyutu 5MB\'dan küçük olmalıdır');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (response.ok) {
        const data = await response.json();
        const newImageUrl = data.url;
        console.log('Image upload successful, URL:', newImageUrl);
        
        // URL'i kontrol et
        if (!newImageUrl) {
          throw new Error('Resim URL\'i alınamadı');
        }
        
        const updatedUrls = [...imageUrls, newImageUrl];
        setImageUrls(updatedUrls);
        setFormData({ ...formData, images: updatedUrls.join(',') });
        setError(''); // Başarılı olduğunda hatayı temizle
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Bilinmeyen hata' }));
        const errorMessage = errorData.error || errorData.details || (mounted ? t('admin.common.error') : 'Resim yüklenirken hata oluştu');
        console.error('Image upload failed:', errorMessage, errorData);
        setError(errorMessage);
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      const errorMessage = error?.message || (mounted ? t('admin.common.error') : 'Resim yüklenirken hata oluştu');
      setError(errorMessage);
    } finally {
      setUploading(false);
      // Input'u temizle
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    const updatedUrls = imageUrls.filter((_, i) => i !== index);
    setImageUrls(updatedUrls);
    setFormData({ ...formData, images: updatedUrls.join(',') });
  };

  const handleDelete = async () => {
    if (!id || id === 'yeni' || id === 'new') {
      return;
    }

    const confirmed = await showConfirm(
      mounted ? t('admin.products.deleteTitle') : 'Ürün Sil',
      mounted ? t('admin.common.deleteConfirm') : 'Bu ürünü silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
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
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showToast(mounted ? t('admin.common.success') : 'Ürün başarıyla silindi', 'success');
        router.push('/admin-panel/products');
      } else {
        const errorData = await response.json();
        showToast(errorData.error || (mounted ? t('admin.common.error') : 'Ürün silinirken hata oluştu'), 'error');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      showToast(mounted ? t('admin.common.error') : 'Ürün silinirken hata oluştu', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    if (!id) {
      setError(mounted ? t('admin.common.error') : 'Ürün ID bulunamadı');
      setSaving(false);
      return;
    }

    try {
      // Weight kaydetme: ondalık kısmı kaldır, unit'i olduğu gibi kaydet
      let weight = formData.weight || null;
      let unit = formData.unit || 'Gr';
      
      if (weight) {
        const weightNum = parseFloat(weight);
        // Ondalık kısmı kaldır (tam sayı)
        weight = Math.floor(weightNum).toString();
      }
      
      const productData = {
        name: formData.name,
        nameFr: formData.nameFr || null,
        nameEn: formData.nameEn || null,
        baseName: formData.baseName || null,
        baseNameFr: formData.baseNameFr || null,
        baseNameEn: formData.baseNameEn || null,
        sku: formData.sku,
        price: formData.price,
        comparePrice: formData.comparePrice || null,
        stock: parseInt(formData.stock) || 0,
        weight: weight,
        unit: unit,
        productGroup: formData.productGroup || null,
        categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
        isActive: formData.isActive,
        description: formData.description || null,
        images: imageUrls.join(',') || null,
      };

      // "yeni" veya "new" yeni ürün oluşturma için
      const isNew = id === 'yeni' || id === 'new';
      const url = isNew ? '/api/products' : `/api/products/${id}`;
      const method = isNew ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        router.push('/admin-panel/products');
      } else {
        const data = await response.json();
        setError(data.error || (mounted ? t('admin.common.error') : 'Ürün kaydedilemedi'));
      }
    } catch (error) {
      console.error('Error saving product:', error);
      setError(mounted ? t('admin.common.error') : 'Ürün kaydedilirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600">{mounted ? t('admin.common.loading') : 'Yükleniyor...'}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {(id === 'yeni' || id === 'new') ? (mounted ? t('admin.products.addNew') : 'Yeni Ürün Ekle') : (mounted ? t('admin.products.editProduct') : 'Ürün Düzenle')}
        </h2>
        <Link
          href="/admin-panel/products"
          className="text-gray-600 hover:text-gray-900"
        >
          ← {mounted ? t('admin.common.back') : 'Geri Dön'}
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 mb-6 rounded">
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {mounted ? t('admin.products.baseName') : 'Ürün Grubu Adı (Temel Ad)'}
              </label>
              <input
                type="text"
                value={formData.baseName}
                onChange={(e) => {
                  const newBaseName = e.target.value;
                  // baseName değiştiğinde productGroup'u güncelle
                  // Eğer weight ve unit varsa: baseName + weight + unit
                  // Yoksa: sadece baseName
                  let newProductGroup = '';
                  if (newBaseName && formData.weight && formData.unit) {
                    const weightNum = parseFloat(formData.weight);
                    const weightStr = weightNum % 1 === 0 ? weightNum.toString() : weightNum.toFixed(2);
                    newProductGroup = `${newBaseName} ${weightStr} ${formData.unit}`;
                  } else if (newBaseName) {
                    newProductGroup = newBaseName;
                  }
                  
                  setFormData({ ...formData, baseName: newBaseName, productGroup: newProductGroup });
                }}
                placeholder="Örn: Isot Pepper"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
              />
              <p className="mt-1 text-xs text-gray-500">
                {mounted ? t('admin.products.baseNameHelp') : 'Aynı ürünün farklı gramajları için grup adı (opsiyonel - otomatik oluşturulur)'}
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {mounted ? t('admin.products.productName') : 'Ürün Adı'} *
              </label>
              
              {/* TR (Türkçe) */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">TR (Türkçe) *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={async (e) => {
                    const newName = e.target.value;
                    
                    // Ürün adından baseName çıkarmaya çalış (gramaj bilgisini temizle)
                    const nameWithoutWeight = newName.replace(/\s*\d+(\.\d+)?\s*(gr|g|kg|lt|Gr|G|Kg|Kg)\s*$/i, '').trim();
                    
                    let newBaseName = formData.baseName;
                    if (!formData.baseName && nameWithoutWeight && nameWithoutWeight !== newName) {
                      newBaseName = nameWithoutWeight;
                    } else if (!formData.baseName && newName) {
                      newBaseName = newName;
                    }
                    
                    // productGroup oluştur
                    const baseNameForGroup = newBaseName || formData.baseName;
                    let newProductGroup = '';
                    if (baseNameForGroup && formData.weight && formData.unit) {
                      const weightNum = parseFloat(formData.weight);
                      const weightStr = weightNum % 1 === 0 ? weightNum.toString() : weightNum.toFixed(2);
                      newProductGroup = `${baseNameForGroup} ${weightStr} ${formData.unit}`;
                    } else if (baseNameForGroup) {
                      newProductGroup = baseNameForGroup;
                    }
                    
                    setFormData({ 
                      ...formData, 
                      name: newName,
                      baseName: newBaseName,
                      productGroup: newProductGroup
                    });
                  }}
                  required
                  placeholder="Örn: Isot Pepper"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
                />
              </div>
              
              {/* FR (Fransızca) */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  FR (Fransızca)
                </label>
                <input
                  type="text"
                  value={formData.nameFr}
                  onChange={(e) => setFormData({ ...formData, nameFr: e.target.value })}
                  placeholder="Manuel olarak girin"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63] bg-gray-50"
                />
              </div>
              
              {/* EN (İngilizce) */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  EN (İngilizce)
                </label>
                <input
                  type="text"
                  value={formData.nameEn}
                  onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                  placeholder="Manuel olarak girin"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63] bg-gray-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {mounted ? t('admin.products.sku') : 'SKU'}
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {mounted ? t('admin.products.category') : 'Kategori'}
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
              >
                <option value="">{mounted ? t('admin.products.selectCategory') : 'Kategori Seçin'}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {mounted ? t('admin.products.productGroup') : 'Ürün Grubu (Otomatik)'}
              </label>
              <input
                type="text"
                value={formData.productGroup}
                onChange={(e) => setFormData({ ...formData, productGroup: e.target.value })}
                placeholder={mounted ? t('admin.products.autoGenerated') : 'Otomatik oluşturulur (baseName ile aynı)'}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-500">
                {mounted ? t('admin.products.autoGeneratedHelp') : 'Ürün adı ve miktar seçilince otomatik oluşturulur (örn: Isot Pepper 50 Gr)'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {mounted ? t('admin.products.quantity') : 'Miktar'}
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="1"
                  value={formData.weight}
                  onChange={(e) => {
                    let value = e.target.value;
                    let unit = formData.unit;
                    // baseName varsa onu kullan, yoksa name'den gramaj bilgisini çıkar
                    let baseName = formData.baseName;
                    if (!baseName && formData.name) {
                      // Name'den gramaj bilgisini çıkar
                      baseName = formData.name.replace(/\s*\d+(\.\d+)?\s*(gr|g|kg|lt|Gr|G|Kg|Kg)\s*$/i, '').trim() || formData.name;
                    }
                    
                    let newWeight = '';
                    let newUnit = unit;
                    let newProductGroup = '';
                    
                    // 1000 gr ise otomatik 1 Kg yap
                    if (unit === 'Gr' && value && parseFloat(value) >= 1000 && parseFloat(value) % 1000 === 0) {
                      const kgValue = Math.floor(parseFloat(value) / 1000).toString();
                      newWeight = kgValue;
                      newUnit = 'Kg';
                    } else {
                      // Ondalık kısmı kaldır (tam sayı)
                      newWeight = value ? Math.floor(parseFloat(value)).toString() : '';
                    }
                    
                    // baseName + weight + unit ile productGroup oluştur
                    if (baseName && newWeight && newUnit) {
                      const weightNum = parseFloat(newWeight);
                      const weightStr = weightNum % 1 === 0 ? weightNum.toString() : weightNum.toFixed(2);
                      newProductGroup = `${baseName} ${weightStr} ${newUnit}`;
                    } else if (baseName) {
                      newProductGroup = baseName;
                    }
                    
                    setFormData({ ...formData, weight: newWeight, unit: newUnit, productGroup: newProductGroup });
                  }}
                  placeholder={mounted ? t('admin.products.quantity') : 'Miktar'}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
                />
                <select
                  value={formData.unit}
                  onChange={(e) => {
                    const newUnit = e.target.value;
                    let weight = formData.weight;
                    // baseName varsa onu kullan, yoksa name'den gramaj bilgisini çıkar
                    let baseName = formData.baseName;
                    if (!baseName && formData.name) {
                      // Name'den gramaj bilgisini çıkar
                      baseName = formData.name.replace(/\s*\d+(\.\d+)?\s*(gr|g|kg|lt|Gr|G|Kg|Kg)\s*$/i, '').trim() || formData.name;
                    }
                    
                    let newWeight = weight;
                    let newProductGroup = '';
                    
                    // Gr'den Kg'ye geçiş: 1000'e böl
                    if (formData.unit === 'Gr' && newUnit === 'Kg' && weight) {
                      const weightNum = parseFloat(weight);
                      if (weightNum >= 1000 && weightNum % 1000 === 0) {
                        newWeight = (weightNum / 1000).toString();
                      }
                    }
                    // Kg'den Gr'ye geçiş: 1000 ile çarp
                    else if (formData.unit === 'Kg' && newUnit === 'Gr' && weight) {
                      newWeight = (parseFloat(weight) * 1000).toString();
                    }
                    
                    // baseName + weight + unit ile productGroup oluştur
                    if (baseName && newWeight && newUnit) {
                      const weightNum = parseFloat(newWeight);
                      const weightStr = weightNum % 1 === 0 ? weightNum.toString() : weightNum.toFixed(2);
                      newProductGroup = `${baseName} ${weightStr} ${newUnit}`;
                    } else if (baseName) {
                      newProductGroup = baseName;
                    }
                    
                    setFormData({ ...formData, unit: newUnit, weight: newWeight, productGroup: newProductGroup });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
                >
                  <option value="Gr">Gr</option>
                  <option value="Kg">Kg</option>
                  <option value="Lt">Lt</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {mounted ? t('admin.products.oldPrice') : 'Eski Fiyat ($)'}
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.comparePrice}
                onChange={(e) => setFormData({ ...formData, comparePrice: e.target.value })}
                placeholder={mounted ? t('admin.products.oldPricePlaceholder') : 'İndirim öncesi fiyat (opsiyonel)'}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
              />
              <p className="mt-1 text-xs text-gray-500">
                {mounted ? t('admin.products.oldPriceHelp') : 'İndirimli ürünler için eski fiyatı girin'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {mounted ? t('admin.products.newPrice') : 'Yeni Fiyat ($)'} *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
                placeholder={mounted ? t('admin.products.salePricePlaceholder') : 'Satış fiyatı'}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {mounted ? t('admin.products.stock') : 'Stok'} *
              </label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {mounted ? t('admin.products.description') : 'Açıklama'}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
            />
          </div>

          {/* Resim Yükleme */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {mounted ? t('admin.products.productImages') : 'Ürün Resimleri'}
            </label>
            <div className="space-y-4">
              {/* Resim Yükleme Input */}
              <div className="flex items-center gap-4">
                <label className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                  <span className="text-sm text-gray-700">
                    {uploading ? (mounted ? t('admin.products.uploading') : 'Yükleniyor...') : (mounted ? ('+ ' + t('admin.products.addImage')) : '+ Resim Ekle')}
                  </span>
                </label>
                <span className="text-xs text-gray-500">
                  JPG, PNG, GIF (Max 5MB)
                </span>
              </div>

              {/* Yüklenen Resimler */}
              {imageUrls.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {imageUrls.map((url, index) => (
                    <div key={index} className="relative group aspect-square bg-gray-100 rounded-lg border border-gray-200 overflow-hidden">
                      <img
                        src={url}
                        alt={`Ürün resmi ${index + 1}`}
                        className="w-full h-full object-contain p-2"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          console.error('Image load error:', target.src);
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent && !parent.querySelector('.error-placeholder')) {
                            const placeholder = document.createElement('span');
                            placeholder.className = 'error-placeholder text-gray-400 text-xs absolute inset-0 flex items-center justify-center bg-gray-50';
                            placeholder.textContent = mounted ? t('admin.products.imageUploadError') : 'Resim Yüklenemedi';
                            parent.appendChild(placeholder);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        title={mounted ? t('admin.products.removeImage') : 'Resmi Sil'}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      {index === 0 && (
                        <span className="absolute bottom-2 left-2 bg-[#E91E63] text-white text-xs px-2 py-1 rounded">
                          {mounted ? t('admin.products.mainImage') : 'Ana Resim'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-[#E91E63] border-gray-300 rounded focus:ring-[#E91E63]"
            />
            <label htmlFor="isActive" className="ml-2 text-sm font-medium text-gray-700">
              {mounted ? t('admin.products.productActive') : 'Ürün Aktif'}
            </label>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="bg-[#E91E63] text-white px-6 py-2 rounded-lg hover:bg-[#C2185B] transition-colors disabled:bg-gray-400"
            >
              {saving ? (mounted ? t('admin.common.loading') : 'Kaydediliyor...') : (mounted ? t('admin.common.save') : 'Kaydet')}
            </button>
            <Link
              href="/admin-panel/products"
              className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors text-center"
            >
              {mounted ? t('admin.common.cancel') : 'İptal'}
            </Link>
            {id && id !== 'yeni' && id !== 'new' && (
              <button
                type="button"
                onClick={handleDelete}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                {mounted ? t('admin.common.delete') : 'Sil'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
