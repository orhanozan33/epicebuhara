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
  categoryId?: number | null;
  isActive?: boolean;
  baseName?: string | null;
  baseNameFr?: string | null;
  baseNameEn?: string | null;
}

interface Category {
  id: number;
  name: string;
  nameFr?: string | null;
  nameEn?: string | null;
}

interface CompanySettings {
  companyName: string;
  address: string;
  phone: string;
  email: string;
  postalCode: string;
}

export default function UrunlerPage() {
  const [mounted, setMounted] = useState(false);
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [company, setCompany] = useState<CompanySettings | null>(null);

  useEffect(() => {
    setMounted(true);
    fetchProducts();
    fetchCategories();
    fetchCompany();
  }, []);

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

  const fetchCompany = async () => {
    try {
      const response = await fetch('/api/settings/company');
      if (response.ok) {
        const data = await response.json();
        setCompany({
          companyName: data.companyName || '',
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || '',
          postalCode: data.postalCode || '',
        });
      }
    } catch (error) {
      console.error('Error fetching company:', error);
    }
  };

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

  const categoryNames = Array.from(new Set(products.map((p) => p.categoryName).filter((cat): cat is string => !!cat)));

  const handlePrintPriceList = () => {
    setShowPrintModal(true);
  };

  const handlePrint = () => {
    if (selectedCategories.length === 0) {
      showToast('Lütfen en az bir kategori seçin', 'error');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const selectedCategoryIds = categories
      .filter(cat => selectedCategories.includes(cat.id))
      .map(cat => cat.id);
    
    // Kategori ID'lerine göre filtrele
    const productsToPrint = products.filter(p => {
      return p.categoryId && selectedCategoryIds.includes(p.categoryId) && p.isActive !== false;
    }).sort((a, b) => {
      // Kategoriye göre sırala, sonra ürün adına göre
      const catA = a.categoryName || '';
      const catB = b.categoryName || '';
      if (catA !== catB) return catA.localeCompare(catB);
      return (a.baseNameFr || a.baseNameEn || a.name).localeCompare(b.baseNameFr || b.baseNameEn || b.name);
    });

    const printContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Liste de Prix</title>
  <style>
    @media print {
      @page { margin: 1cm; }
      body { margin: 0; }
    }
    body {
      font-family: Arial, sans-serif;
      padding: 20px;
      color: #000;
    }
    .header {
      margin-bottom: 30px;
      border-bottom: 2px solid #000;
      padding-bottom: 15px;
    }
    .company-name {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .company-info {
      font-size: 12px;
      line-height: 1.6;
      color: #333;
    }
    .title {
      font-size: 28px;
      font-weight: bold;
      text-align: center;
      margin: 30px 0;
      text-transform: uppercase;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th, td {
      border: 1px solid #000;
      padding: 8px;
      text-align: left;
      font-size: 12px;
    }
    th {
      background-color: #f0f0f0;
      font-weight: bold;
    }
    tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    .product-name {
      font-weight: 500;
    }
    .price {
      text-align: right;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-name">${company?.companyName || 'Epicê Buhara'}</div>
    <div class="company-info">
      ${company?.phone ? `<div>Tél: ${company.phone}</div>` : ''}
      ${company?.email ? `<div>Email: ${company.email}</div>` : ''}
    </div>
  </div>
  
  <table>
    <thead>
      <tr>
        <th style="width: 5%;">#</th>
        <th style="width: 60%;">Produit</th>
        <th style="width: 15%;">Poids</th>
        <th style="width: 20%;" class="price">Prix</th>
      </tr>
    </thead>
    <tbody>
      ${productsToPrint.map((product, index) => {
        let weight = '-';
        if (product.weight) {
          const weightNum = parseFloat(product.weight);
          const weightStr = weightNum % 1 === 0 ? Math.floor(weightNum).toString() : weightNum.toString();
          weight = `${weightStr} ${product.unit || 'Gr'}`;
        }
        const productName = product.baseNameFr || product.baseNameEn || product.name;
        return `
          <tr>
            <td>${index + 1}</td>
            <td class="product-name">${productName}</td>
            <td>${weight}</td>
            <td class="price">$${parseFloat(product.price || '0').toFixed(2)}</td>
          </tr>
        `;
      }).join('')}
    </tbody>
  </table>
  
  <div style="margin-top: 30px; font-size: 11px; text-align: center; color: #666;">
    Total: ${productsToPrint.length} produits
  </div>
</body>
</html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
    setShowPrintModal(false);
  };

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
        <div className="flex gap-2">
          <button
            onClick={handlePrintPriceList}
            className="bg-blue-600 text-white px-2 py-1.5 lg:px-4 lg:py-2 rounded-lg hover:bg-blue-700 transition-colors text-xs lg:text-sm whitespace-nowrap"
          >
            🖨️ Ürün Listesi Yazdır
          </button>
          <Link
            href="/admin-panel/products/new"
            className="bg-[#E91E63] text-white px-2 py-1.5 lg:px-4 lg:py-2 rounded-lg hover:bg-[#C2185B] transition-colors text-xs lg:text-sm whitespace-nowrap"
          >
            + {mounted ? t('admin.products.addNew') : 'Yeni Ürün Ekle'}
          </Link>
        </div>
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
              {categoryNames.filter(cat => cat).map((cat) => (
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

      {/* Print Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Kategori Seçin</h3>
            <div className="space-y-2 mb-6 max-h-96 overflow-y-auto">
              {categories.map((category) => (
                <label key={category.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCategories([...selectedCategories, category.id]);
                      } else {
                        setSelectedCategories(selectedCategories.filter(id => id !== category.id));
                      }
                    }}
                    className="w-4 h-4 text-[#E91E63] focus:ring-[#E91E63] border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-900">{category.name}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowPrintModal(false);
                  setSelectedCategories([]);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handlePrint}
                disabled={selectedCategories.length === 0}
                className="px-4 py-2 bg-[#E91E63] text-white rounded-lg hover:bg-[#C2185B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Yazdır
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
