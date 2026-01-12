'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  order: number;
  isActive: boolean;
}

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [id, setId] = useState<string | null>(null);

  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    order: '',
    isActive: true,
  });

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

    // "yeni" veya "new" yeni kategori oluşturma sayfası için
    if (id === 'yeni' || id === 'new') {
      setLoading(false);
      setError(''); // Hata mesajını temizle
      return;
    }

    fetchCategory();
  }, [id, mounted]);

  const fetchCategory = async () => {
    // "yeni" veya "new" yeni kategori oluşturma sayfası için
    if (!id || id === 'yeni' || id === 'new') {
      return;
    }

    try {
      const response = await fetch(`/api/categories?admin=true`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API error:', response.status, errorData);
        setError(mounted ? t('admin.common.error') : 'Kategori yüklenirken hata oluştu');
        return;
      }
      
      const categories = await response.json();
      
      // Response'un array olup olmadığını kontrol et
      if (!Array.isArray(categories)) {
        console.error('Invalid response format:', categories);
        setError(mounted ? t('admin.common.error') : 'Kategori yüklenirken hata oluştu');
        return;
      }
      
      const categoryId = parseInt(id);
      if (isNaN(categoryId) || categoryId <= 0) {
        // "new" veya "yeni" değerleri için hata gösterme, bunlar yeni kategori oluşturma için
        if (id !== 'new' && id !== 'yeni') {
          setError(mounted ? t('admin.common.error') : 'Geçersiz kategori ID');
        }
        setLoading(false);
        return;
      }
      
      const foundCategory = categories.find((c: Category) => c.id === categoryId);
      if (foundCategory) {
        setCategory(foundCategory);
        setFormData({
          name: foundCategory.name || '',
          slug: foundCategory.slug || '',
          description: foundCategory.description || '',
          order: foundCategory.order?.toString() || '0',
          isActive: foundCategory.isActive ?? true,
        });
      } else {
        setError(mounted ? t('admin.common.notFound') : 'Kategori bulunamadı');
      }
    } catch (error) {
      console.error('Error fetching category:', error);
      setError(mounted ? t('admin.common.error') : 'Kategori yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const categoryData = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        order: parseInt(formData.order) || 0,
        isActive: formData.isActive,
      };

      // "yeni" veya "new" yeni kategori oluşturma için
      const isNew = id === 'yeni' || id === 'new';
      const url = isNew ? '/api/categories' : `/api/categories/${id}`;
      const method = isNew ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData),
      });

      if (response.ok) {
        router.push('/admin-panel/categories');
      } else {
        const data = await response.json();
        setError(data.error || (mounted ? t('admin.common.error') : 'Kategori kaydedilemedi'));
      }
    } catch (error) {
      console.error('Error saving category:', error);
      setError(mounted ? t('admin.common.error') : 'Kategori kaydedilirken hata oluştu');
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
          {(id === 'yeni' || id === 'new') ? (mounted ? t('admin.categories.addNew') : 'Yeni Kategori Ekle') : (mounted ? t('admin.categories.editCategory') : 'Kategori Düzenle')}
        </h2>
        <Link
          href="/admin-panel/categories"
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
                {mounted ? t('admin.categories.categoryName') : 'Kategori Adı'} *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {mounted ? t('admin.categories.slug') : 'Slug'}
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder={mounted ? t('admin.categories.autoGenerated') : 'Otomatik oluşturulur'}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {mounted ? t('admin.categories.order') : 'Sıra'}
              </label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {mounted ? t('admin.categories.description') : 'Açıklama'}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
            />
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
              {mounted ? t('admin.categories.categoryActive') : 'Kategori Aktif'}
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
              href="/admin-panel/categories"
              className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors text-center"
            >
              {mounted ? t('admin.common.cancel') : 'İptal'}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
