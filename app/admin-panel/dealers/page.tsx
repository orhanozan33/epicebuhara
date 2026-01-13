'use client';

/**
 * CRITICAL STABILITY PATTERNS - DO NOT MODIFY WITHOUT UNDERSTANDING
 * 
 * See STABILITY_GUIDE.md for detailed patterns and best practices.
 * 
 * Key patterns used in this component:
 * 1. isMounted pattern for lifecycle management
 * 2. AbortController for API call cancellation
 * 3. Functional state updates to prevent stale closures
 * 4. Safe array/type checks before operations
 * 5. Error boundaries with graceful fallbacks
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { showToast } from '@/components/Toast';
import { showConfirm } from '@/components/ConfirmModal';

interface Dealer {
  id: number;
  companyName: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  taxNumber: string | null;
  tpsNumber: string | null;
  tvqNumber: string | null;
  discount: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function BayiPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  
  // CRITICAL: isMountedRef MUST be at component top level
  const isMountedRef = useRef(true);
  
  // CRITICAL: State initialization
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDealer, setEditingDealer] = useState<Dealer | null>(null);
  const [formData, setFormData] = useState({
    companyName: '',
    phone: '',
    email: '',
    address: '',
    tpsNumber: '',
    tvqNumber: '',
    discount: '0',
  });

  // CRITICAL: useCallback with empty deps - function should NOT depend on state
  // CRITICAL: Always use AbortSignal for API calls
  const fetchDealers = useCallback(async (signal?: AbortSignal) => {
    try {
      // CRITICAL: Check isMountedRef before state update
      if (!isMountedRef.current) return;
      
      const response = await fetch('/api/dealers', {
        signal,
        cache: 'no-store',
      });

      if (!isMountedRef.current) return;

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && isMountedRef.current) {
          setDealers(data);
        }
      } else {
        const errorText = await response.text();
        let errorMessage = 'Bayiler getirilirken hata oluştu';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorJson.details || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        if (isMountedRef.current) {
          showToast(`${t('admin.dealers.title')} ${t('admin.common.error')}: ${errorMessage}`, 'error');
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError' || !isMountedRef.current) return;
      console.error('Error fetching dealers:', error);
      const errorMessage = error?.message || t('admin.common.error');
      if (isMountedRef.current) {
        showToast(errorMessage, 'error');
      }
    } finally {
      // CRITICAL: Always set loading to false, even if component is unmounting
      // This prevents the loading state from being stuck
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    setMounted(true);
    // CRITICAL: Reset mounted flag on mount
    isMountedRef.current = true;
    
    const abortController = new AbortController();
    fetchDealers(abortController.signal);

    return () => {
      isMountedRef.current = false;
      abortController.abort();
    };
  }, [fetchDealers]);

  const handleCloseForm = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setShowForm(false);
    setEditingDealer(null);
    setFormData({
      companyName: '',
      phone: '',
      email: '',
      address: '',
      tpsNumber: '',
      tvqNumber: '',
      discount: '0',
    });
  };

  const handleEdit = (dealer: Dealer, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setEditingDealer(dealer);
    setFormData({
      companyName: dealer.companyName || '',
      phone: dealer.phone || '',
      email: dealer.email || '',
      address: dealer.address || '',
      tpsNumber: dealer.tpsNumber || '',
      tvqNumber: dealer.tvqNumber || '',
      discount: dealer.discount || '0',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isMountedRef.current) return;

    try {
      const url = editingDealer ? `/api/dealers/${editingDealer.id}` : '/api/dealers';
      const method = editingDealer ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!isMountedRef.current) return;

      if (response.ok) {
        showToast(editingDealer ? (mounted ? t('admin.common.success') : 'Bayi başarıyla güncellendi!') : (mounted ? t('admin.common.success') : 'Bayi başarıyla oluşturuldu!'), 'success');
        handleCloseForm();
        await fetchDealers();
      } else {
        const error = await response.json().catch(() => ({ error: mounted ? t('admin.common.error') : 'Hata oluştu' }));
        const errorMessage = error.error || error.details || (mounted ? t('admin.common.error') : 'Hata oluştu');
        showToast(errorMessage, 'error');
      }
    } catch (error: any) {
      if (!isMountedRef.current) return;
      console.error('Error saving dealer:', error);
      showToast(error?.message || (mounted ? t('admin.common.error') : 'Hata oluştu'), 'error');
    }
  };

  const handleDelete = async (id: number, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!isMountedRef.current) return;

    const confirmed = await showConfirm(
      mounted ? t('admin.dealers.deleteTitle') : 'Bayi Sil',
      mounted ? t('admin.common.deleteConfirm') : 'Bu bayi kaydını silmek istediğinize emin misiniz?',
      {
        confirmText: mounted ? t('admin.common.delete') : 'Sil',
        cancelText: mounted ? t('admin.common.cancelConfirm') : 'İptal',
        type: 'danger',
      }
    );

    if (!confirmed || !isMountedRef.current) return;

    try {
      const response = await fetch(`/api/dealers/${id}`, {
        method: 'DELETE',
      });

      if (!isMountedRef.current) return;

      if (response.ok) {
        showToast(mounted ? t('admin.common.success') : 'Bayi başarıyla silindi', 'success');
        await fetchDealers();
      } else {
        const error = await response.json().catch(() => ({ error: 'Bayi silinirken hata oluştu' }));
        const errorMessage = error.error || error.details || (mounted ? t('admin.common.error') : 'Bayi silinirken hata oluştu');
        showToast(errorMessage, 'error');
      }
    } catch (error: any) {
      if (!isMountedRef.current) return;
      console.error('Error deleting dealer:', error);
      const errorMessage = error?.message || (mounted ? t('admin.common.error') : 'Bayi silinirken hata oluştu');
      showToast(errorMessage, 'error');
    }
  };

  if (loading) {
    return (
      <div className="w-full overflow-x-hidden min-w-0 box-border" style={{ maxWidth: '100%', overflowX: 'hidden', width: '100%' }}>
        <h2 className="text-lg lg:text-2xl font-bold text-gray-900 mb-2 lg:mb-6">{mounted ? t('admin.dealers.title') : 'Bayi Yönetimi'}</h2>
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">{mounted ? t('admin.common.loading') : 'Yükleniyor...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-hidden min-w-0 box-border" style={{ maxWidth: '100%', overflowX: 'hidden', width: '100%' }}>
      <div className="flex items-center justify-between mb-2 lg:mb-6">
        <h2 className="text-lg lg:text-2xl font-bold text-gray-900">{mounted ? t('admin.dealers.title') : 'Bayi Yönetimi'}</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-[#E91E63] text-white px-3 lg:px-4 py-2 lg:py-2.5 rounded-lg hover:bg-[#C2185B] transition-colors text-sm lg:text-base font-medium"
          >
            + {mounted ? t('admin.dealers.addNew') : 'Bayi Aç'}
          </button>
        )}
      </div>

      {/* Bayi Listesi */}
      {!showForm && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {mounted ? t('admin.dealers.companyName') : 'Firma İsmi'}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {mounted ? t('admin.dealers.phone') : 'Telefon'}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {mounted ? t('admin.dealers.email') : 'E-posta'}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {mounted ? t('admin.dealers.discount') : 'İskonto'}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {mounted ? t('admin.dealers.status') : 'Durum'}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {mounted ? t('admin.dealers.actions') : 'İşlemler'}
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {dealers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      {mounted ? t('admin.common.notFound') : 'Henüz bayi eklenmemiş'}
                    </td>
                  </tr>
                ) : (
                  dealers.map((dealer) => (
                    <tr key={dealer.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 text-sm font-medium text-gray-900">
                        <div className="truncate" title={dealer.companyName}>
                          {dealer.companyName}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        <div className="truncate" title={dealer.phone || ''}>
                          {dealer.phone || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        <div className="truncate" title={dealer.email || ''}>
                          {dealer.email || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {parseFloat(dealer.discount || '0').toFixed(2)}%
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            dealer.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {dealer.isActive ? (mounted ? t('admin.common.active') : 'Aktif') : (mounted ? t('admin.common.inactive') : 'Pasif')}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                              e.preventDefault();
                              e.stopPropagation();
                              try {
                                router.push(`/admin-panel/dealers/sales/${dealer.id}`);
                              } catch (err: any) {
                                console.error('Error opening sales form:', err);
                                showToast(mounted ? t('admin.common.error') : 'Satış formu açılırken hata oluştu', 'error');
                              }
                            }}
                            className="px-3 py-1.5 bg-[#E91E63] text-white rounded-lg hover:bg-[#C2185B] transition-colors text-xs font-medium whitespace-nowrap"
                          >
                            {mounted ? t('admin.dealers.viewSales') : 'Satış Yap'}
                          </button>
                          <button
                            type="button"
                            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                              e.preventDefault();
                              e.stopPropagation();
                              try {
                                router.push(`/admin-panel/dealers/${dealer.id}/hesap`);
                              } catch (err: any) {
                                console.error('Error opening account details:', err);
                                showToast(mounted ? t('admin.common.error') : 'Hesap detayı açılırken hata oluştu', 'error');
                              }
                            }}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium whitespace-nowrap"
                          >
                            {mounted ? t('admin.dealers.viewAccount') : 'Hesap Detay'}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleEdit(dealer, e)}
                            className="px-3 py-1.5 text-blue-600 hover:text-blue-800 transition-colors text-xs font-medium hidden"
                          >
                            {mounted ? t('admin.common.edit') : 'Düzenle'}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDelete(dealer.id, e)}
                            className="px-3 py-1.5 text-red-600 hover:text-red-800 transition-colors text-xs font-medium hidden"
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
      )}

      {/* Mobil Görünüm */}
      {!showForm && dealers.length > 0 && (
        <div className="lg:hidden mt-4 space-y-3">
          {dealers.map((dealer) => (
            <div key={dealer.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">{dealer.companyName}</h3>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ml-2 flex-shrink-0 ${
                    dealer.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {dealer.isActive ? (mounted ? t('admin.common.active') : 'Aktif') : (mounted ? t('admin.common.inactive') : 'Pasif')}
                </span>
              </div>
              <div className="space-y-2 text-xs text-gray-600 mb-3">
                <div><span className="text-gray-500">{mounted ? t('admin.dealers.phone') : 'Telefon'}:</span> <span className="font-medium">{dealer.phone || '-'}</span></div>
                <div className="truncate"><span className="text-gray-500">{mounted ? t('admin.dealers.email') : 'E-posta'}:</span> <span className="font-medium">{dealer.email || '-'}</span></div>
                <div>
                  <span className="font-medium">{mounted ? t('admin.dealers.discount') : 'İskonto'}: </span>
                  <span>{parseFloat(dealer.discount || '0').toFixed(2)}%</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.preventDefault();
                    e.stopPropagation();
                    try {
                      router.push(`/admin-panel/dealers/${dealer.id}/hesap`);
                    } catch (err: any) {
                      console.error('Error opening account details:', err);
                      showToast(mounted ? t('admin.common.error') : 'Hesap detayı açılırken hata oluştu', 'error');
                    }
                  }}
                  className="w-full bg-blue-600 text-white text-xs font-medium px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-center"
                >
                  {mounted ? t('admin.dealers.viewAccount') : 'Hesap Detay'}
                </button>
                <button
                  type="button"
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.preventDefault();
                    e.stopPropagation();
                    try {
                      router.push(`/admin-panel/dealers/sales/${dealer.id}`);
                    } catch (err: any) {
                      console.error('Error opening sales form:', err);
                      showToast(mounted ? t('admin.common.error') : 'Satış formu açılırken hata oluştu', 'error');
                    }
                  }}
                  className="w-full bg-[#E91E63] text-white text-xs font-medium px-3 py-2 rounded-lg hover:bg-[#C2185B] transition-colors text-center"
                >
                  {mounted ? t('admin.dealers.viewSales') : 'Satış Yap'}
                </button>
                <div className="flex gap-2 hidden">
                  <button
                    type="button"
                    onClick={(e) => handleEdit(dealer, e)}
                    className="flex-1 text-blue-600 hover:text-blue-800 transition-colors text-xs font-medium py-2"
                  >
                    {mounted ? t('admin.common.edit') : 'Düzenle'}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(dealer.id, e)}
                    className="flex-1 text-red-600 hover:text-red-800 transition-colors text-xs font-medium py-2"
                  >
                    {mounted ? t('admin.common.delete') : 'Sil'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bayi Açma/Düzenleme Formu */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 lg:p-6">
          <div className="flex items-center justify-between mb-4 lg:mb-6">
            <h3 className="text-lg lg:text-xl font-bold text-gray-900">
              {editingDealer ? (mounted ? t('admin.dealers.editDealer') : 'Bayi Düzenle') : (mounted ? t('admin.dealers.addNew') : 'Yeni Bayi Aç')}
            </h3>
            <button
              type="button"
              onClick={handleCloseForm}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {mounted ? t('admin.dealers.companyName') : 'Firma İsmi'} *
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {mounted ? t('admin.dealers.phone') : 'Telefon'}
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {mounted ? t('admin.dealers.email') : 'E-posta'}
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {mounted ? t('admin.dealers.discount') : 'İskonto'} (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {mounted ? t('checkout.address') : 'Adres'}
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  TPS Numarası
                </label>
                <input
                  type="text"
                  value={formData.tpsNumber}
                  onChange={(e) => setFormData({ ...formData, tpsNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  TVQ Numarası
                </label>
                <input
                  type="text"
                  value={formData.tvqNumber}
                  onChange={(e) => setFormData({ ...formData, tvqNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.preventDefault();
                  e.stopPropagation();
                  try {
                    handleCloseForm(e);
                  } catch (err: any) {
                    console.error('Error in cancel button:', err);
                    // Fallback: form'u kapat
                    setShowForm(false);
                    setEditingDealer(null);
                  }
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {mounted ? t('admin.common.cancel') : 'İptal'}
              </button>
              <button
                type="button"
                onClick={async (e) => {
                  console.log('Submit button clicked');
                  e.preventDefault();
                  e.stopPropagation();
                  
                  // Form submit'i manuel olarak çağır
                  const form = e.currentTarget.closest('form');
                  if (form) {
                    const fakeEvent = {
                      preventDefault: () => {},
                      stopPropagation: () => {},
                      target: form,
                      currentTarget: form,
                    } as unknown as React.FormEvent<HTMLFormElement>;
                    
                    await handleSubmit(fakeEvent);
                  }
                }}
                className="px-4 py-2 bg-[#E91E63] text-white rounded-lg hover:bg-[#C2185B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingDealer ? (mounted ? t('admin.common.update') : 'Güncelle') : (mounted ? t('admin.common.create') : 'Oluştur')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
