'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { showToast } from '@/components/Toast';
import { showConfirm } from '@/components/ConfirmModal';

interface Product {
  id: number;
  name: string;
  sku?: string | null;
  price: string;
  stock: number | null;
  weight?: string | null;
  unit?: string | null;
  categoryName?: string | null;
  isActive?: boolean;
}

export default function UrunlerPage() {
  const [mounted, setMounted] = useState(false);
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    setMounted(true);
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products?admin=true');
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await showConfirm(
      mounted ? t('admin.products.deleteTitle') : 'Ürün Sil',
      mounted ? t('admin.common.deleteConfirm') : 'Bu ürünü silmek istediğinize emin misiniz?',
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
        setProducts(products.filter((p) => p.id !== id));
        showToast(mounted ? t('admin.common.success') : 'Ürün başarıyla silindi', 'success');
      } else {
        showToast(mounted ? t('admin.common.error') : 'Ürün silinirken hata oluştu', 'error');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      showToast(mounted ? t('admin.common.error') : 'Ürün silinirken hata oluştu', 'error');
    }
  };

  const handleToggleActive = async (id: number, currentStatus: boolean | null | undefined) => {
    try {
      const newStatus = !(currentStatus !== false); // false ise true, değilse false yap
      const response = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: newStatus }),
      });

      if (response.ok) {
        // Local state'i güncelle
        setProducts(products.map((p) => 
          p.id === id ? { ...p, isActive: newStatus } : p
        ));
        showToast(mounted ? t('admin.common.success') : `Ürün ${newStatus ? 'aktif' : 'pasif'} edildi`, 'success');
      } else {
        const error = await response.json();
        showToast(error.error || (mounted ? t('admin.common.error') : 'Durum güncellenirken hata oluştu'), 'error');
      }
    } catch (error) {
      console.error('Error toggling product status:', error);
      showToast(mounted ? t('admin.common.error') : 'Durum güncellenirken hata oluştu', 'error');
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.sku && product.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory =
      selectedCategory === 'all' || product.categoryName === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(products.map((p) => p.categoryName).filter((cat): cat is string => !!cat)));

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
          <h2 className="text-lg lg:text-2xl font-bold text-gray-900">{mounted ? t('admin.products.title') : 'Ürünler'}</h2>
          <div className="hidden lg:flex">
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm">
              <span className="text-sm text-gray-600 font-medium">
                {mounted ? t('admin.products.totalProducts', { count: products.length }) : `Toplam ${products.length} ürün`}
              </span>
            </div>
          </div>
        </div>
        <Link
          href="/admin-panel/products/new"
          className="bg-[#E91E63] text-white px-2 py-1.5 lg:px-4 lg:py-2 rounded-lg hover:bg-[#C2185B] transition-colors text-xs lg:text-sm whitespace-nowrap"
        >
          + {mounted ? t('admin.products.addNew') : 'Yeni Ürün Ekle'}
        </Link>
      </div>

      {/* Filtreler */}
      <div className="bg-white border border-gray-200 rounded-lg p-2 lg:p-4 mb-2 lg:mb-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 lg:gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {mounted ? t('admin.common.search') : 'Arama'}
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={mounted ? t('admin.products.searchPlaceholder') : 'Ürün adı veya SKU ara...'}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {mounted ? t('admin.products.category') : 'Kategori'}
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
            >
              <option value="all">{mounted ? t('admin.products.allCategories') : 'Tüm Kategoriler'}</option>
              {categories.filter(cat => cat).map((cat) => (
                <option key={cat} value={cat || ''}>
                  {cat || '-'}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Mobil Kart Görünümü */}
      <div className="lg:hidden space-y-2">
        {filteredProducts.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-gray-500 text-sm">
            {mounted ? t('admin.common.notFound') : 'Ürün bulunamadı'}
          </div>
        ) : (
          filteredProducts.map((product) => (
            <div key={product.id} className="bg-white border border-gray-200 rounded-lg p-2 lg:p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-500">#{product.id}</span>
                    <button
                      onClick={() => handleToggleActive(product.id, product.isActive)}
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded-full transition-colors ${
                        product.isActive !== false
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {product.isActive !== false ? (mounted ? t('admin.common.active') : 'Aktif') : (mounted ? t('admin.common.inactive') : 'Pasif')}
                    </button>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1 truncate">{product.name}</h3>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-600 mb-2">
                    {product.categoryName && (
                      <span className="bg-gray-100 px-2 py-0.5 rounded">📁 {product.categoryName}</span>
                    )}
                    {product.sku && (
                      <span className="bg-gray-100 px-2 py-0.5 rounded">SKU: {product.sku}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                <div>
                  <span className="text-gray-500">{mounted ? t('admin.products.weight') : 'Ağırlık'}:</span>
                  <span className="ml-1 text-gray-900 font-medium">
                    {(() => {
                      if (!product.weight) return '-';
                      const weightNum = parseFloat(product.weight);
                      const unit = product.unit || 'Gr';
                      if (unit === 'Gr' && weightNum >= 1000 && weightNum % 1000 === 0) {
                        return `${(weightNum / 1000)} Kg`;
                      }
                      return `${Math.floor(weightNum)} ${unit}`;
                    })()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">{mounted ? t('admin.products.price') : 'Fiyat'}:</span>
                  <span className="ml-1 text-gray-900 font-medium">${parseFloat(product.price || '0').toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-500">{mounted ? t('admin.products.stock') : 'Stok'}:</span>
                  <span className="ml-1 text-gray-900 font-medium">{product.stock || 0}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/admin-panel/products/${product.id}`}
                  className="flex-1 bg-[#E91E63] text-white text-xs font-medium px-2 py-1 lg:px-3 lg:py-2 rounded-lg hover:bg-[#C2185B] transition-colors text-center"
                >
                  {mounted ? t('admin.common.edit') : 'Düzenle'}
                </Link>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="flex-1 bg-red-600 text-white text-xs font-medium px-2 py-1 lg:px-3 lg:py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  {mounted ? t('admin.common.delete') : 'Sil'}
                </button>
              </div>
            </div>
          ))
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
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase lg:min-w-[150px] min-w-0">
                  {mounted ? t('admin.products.productName') : 'Ürün Adı'}
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase lg:w-[120px] min-w-0">
                  {mounted ? t('admin.products.category') : 'Kategori'}
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase lg:w-[100px] min-w-0">
                  SKU
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-20">
                  {mounted ? t('admin.products.weight') : 'Ağırlık'}
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-24">
                  {mounted ? t('admin.products.price') : 'Fiyat'}
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-20">
                  {mounted ? t('admin.products.stock') : 'Stok'}
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-20">
                  {mounted ? t('admin.products.status') : 'Durum'}
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase w-32">
                  {mounted ? t('admin.products.actions') : 'İşlemler'}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 py-8 text-center text-gray-500">
                    {mounted ? t('admin.common.notFound') : 'Ürün bulunamadı'}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3 text-sm text-gray-900">
                      {product.id}
                    </td>
                    <td className="px-3 py-3 text-sm font-medium text-gray-900">
                      <div className="truncate max-w-[150px]" title={product.name}>
                        {product.name}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-500">
                      <div className="truncate max-w-[120px]" title={product.categoryName || '-'}>
                        {product.categoryName || '-'}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-500">
                      <div className="truncate max-w-[100px]" title={product.sku || '-'}>
                        {product.sku || '-'}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-500">
                      {(() => {
                        if (!product.weight) return '-';
                        const weightNum = parseFloat(product.weight);
                        const unit = product.unit || 'Gr';
                        if (unit === 'Gr' && weightNum >= 1000 && weightNum % 1000 === 0) {
                          return `${(weightNum / 1000)} Kg`;
                        }
                        const displayWeight = Math.floor(weightNum).toString();
                        return `${displayWeight} ${unit}`;
                      })()}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-900 font-medium">
                      ${parseFloat(product.price || '0').toFixed(2)}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-500">
                      {product.stock || 0}
                    </td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => handleToggleActive(product.id, product.isActive)}
                        className={`px-2 py-1 text-xs font-semibold rounded-full transition-colors cursor-pointer hover:opacity-80 ${
                          product.isActive !== false
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                        title={mounted ? t('admin.common.status') : 'Durumu değiştirmek için tıklayın'}
                      >
                        {product.isActive !== false ? (mounted ? t('admin.common.active') : 'Aktif') : (mounted ? t('admin.common.inactive') : 'Pasif')}
                      </button>
                    </td>
                    <td className="px-3 py-3 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin-panel/products/${product.id}`}
                          className="text-[#E91E63] hover:text-[#C2185B] text-xs"
                        >
                          {mounted ? t('admin.common.edit') : 'Düzenle'}
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id)}
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
        {mounted ? t('admin.products.showingProducts', { count: filteredProducts.length }) : `Toplam ${filteredProducts.length} ürün gösteriliyor`}
      </div>
    </div>
  );
}
