'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { showToast } from '@/components/Toast';
import { showConfirm } from '@/components/ConfirmModal';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  order: number;
  isActive: boolean;
  productCount?: number;
}

export default function KategorilerPage() {
  const [mounted, setMounted] = useState(false);
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setMounted(true);
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories?admin=true');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await showConfirm(
      mounted ? t('admin.categories.deleteTitle') : 'Kategori Sil',
      mounted ? t('admin.common.deleteConfirm') : 'Bu kategoriyi silmek istediğinize emin misiniz?',
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
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCategories(categories.filter((c) => c.id !== id));
        showToast(mounted ? t('admin.common.success') : 'Kategori başarıyla silindi', 'success');
      } else {
        showToast(mounted ? t('admin.common.error') : 'Kategori silinirken hata oluştu', 'error');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      showToast(mounted ? t('admin.common.error') : 'Kategori silinirken hata oluştu', 'error');
    }
  };

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600">{mounted ? t('admin.common.loading') : 'Yükleniyor...'}</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-hidden min-w-0 box-border" style={{ maxWidth: '100%', overflowX: 'hidden', width: '100%' }}>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-2 lg:mb-4 gap-2 lg:gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg lg:text-2xl font-bold text-gray-900">{mounted ? t('admin.categories.title') : 'Kategoriler'}</h2>
          <div className="hidden lg:flex">
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm">
              <span className="text-sm text-gray-600 font-medium">
                {mounted ? t('admin.categories.totalCategories', { count: categories.length }) : `Toplam ${categories.length} kategori`}
              </span>
            </div>
          </div>
        </div>
        <Link
          href="/admin-panel/categories/new"
          className="bg-[#E91E63] text-white px-2 py-1.5 lg:px-4 lg:py-2 rounded-lg hover:bg-[#C2185B] transition-colors text-xs lg:text-sm whitespace-nowrap"
        >
          + {mounted ? t('admin.categories.addNew') : 'Yeni Kategori Ekle'}
        </Link>
      </div>

      {/* Arama */}
      <div className="bg-white border border-gray-200 rounded-lg p-2 lg:p-4 mb-2 lg:mb-4">
        <label className="block text-xs font-medium text-gray-700 mb-1">
          {mounted ? t('admin.common.search') : 'Arama'}
        </label>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={mounted ? t('admin.categories.searchPlaceholder') : 'Kategori adı ara...'}
          className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
        />
      </div>

      {/* Mobil Kart Görünümü */}
      <div className="lg:hidden">
        {filteredCategories.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-gray-500 text-sm">
            {mounted ? t('admin.common.notFound') : 'Kategori bulunamadı'}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredCategories.map((category) => (
              <div key={category.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                          category.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {category.isActive ? (mounted ? t('admin.common.active') : 'Aktif') : (mounted ? t('admin.common.inactive') : 'Pasif')}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 mb-2">{category.name}</h3>
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                      <span>ID: {category.id}</span>
                      <span>{mounted ? t('admin.categories.order') : 'Sıra'}: {category.order || 0}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/admin-panel/categories/${category.id}`}
                    className="flex-1 bg-[#E91E63] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#C2185B] transition-colors text-center"
                  >
                    {mounted ? t('admin.common.edit') : 'Düzenle'}
                  </Link>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="flex-1 bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    {mounted ? t('admin.common.delete') : 'Sil'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop Tablo Görünümü */}
      <div className="hidden lg:block bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-hidden lg:overflow-x-visible">
          <table className="w-full table-auto min-w-0 max-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-12 min-w-0">
                  ID
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase lg:min-w-[180px] min-w-0">
                  {mounted ? t('admin.categories.categoryName') : 'Kategori Adı'}
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase lg:min-w-[150px] min-w-0">
                  {mounted ? t('admin.categories.slug') : 'Slug'}
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-20">
                  {mounted ? t('admin.categories.order') : 'Sıra'}
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-24">
                  {mounted ? t('admin.categories.status') : 'Durum'}
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase w-32">
                  {mounted ? t('admin.categories.actions') : 'İşlemler'}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-gray-500">
                    {mounted ? t('admin.common.notFound') : 'Kategori bulunamadı'}
                  </td>
                </tr>
              ) : (
                filteredCategories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3 text-sm text-gray-900">
                      {category.id}
                    </td>
                    <td className="px-3 py-3 text-sm font-medium text-gray-900">
                      <div className="truncate max-w-[180px]" title={category.name}>
                        {category.name}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-500">
                      <div className="truncate max-w-[150px]" title={category.slug}>
                        {category.slug}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-500">
                      {category.order || 0}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          category.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {category.isActive ? (mounted ? t('admin.common.active') : 'Aktif') : (mounted ? t('admin.common.inactive') : 'Pasif')}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin-panel/categories/${category.id}`}
                          className="text-[#E91E63] hover:text-[#C2185B] text-xs"
                        >
                          {mounted ? t('admin.common.edit') : 'Düzenle'}
                        </Link>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="text-red-600 hover:text-red-900 text-xs"
                        >
                          {mounted ? t('admin.common.delete') : 'Sil'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-500">
        {mounted ? t('admin.categories.showingCategories', { count: filteredCategories.length }) : `Toplam ${filteredCategories.length} kategori gösteriliyor`}
      </div>
    </div>
  );
}
