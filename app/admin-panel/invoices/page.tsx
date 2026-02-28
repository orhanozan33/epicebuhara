'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { showToast } from '@/components/Toast';
import html2pdf from 'html2pdf.js';

interface Invoice {
  id: number;
  saleNumber: string;
  dealerId: number;
  paymentMethod: string;
  subtotal: string;
  discount: string;
  total: string;
  isPaid: boolean;
  paidAmount: string | null;
  paidAt: string | null;
  isShipped?: boolean;
  shippedAt?: string | null;
  notes: string | null;
  isSaved: boolean;
  createdAt: string;
  companyName: string | null;
  dealerEmail: string | null;
}

export default function FaturalarPage() {
  const [mounted, setMounted] = useState(false);
  const { t, i18n } = useTranslation();
  
  // Dil koduna göre locale mapping
  const getLocale = () => {
    const lang = mounted && i18n?.language ? i18n.language.split('-')[0] : 'fr';
    const localeMap: Record<string, string> = {
      'tr': 'tr-TR',
      'fr': 'fr-CA',
      'en': 'en-CA',
    };
    return localeMap[lang] || 'fr-CA';
  };
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedInvoices, setSelectedInvoices] = useState<Set<number>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const url = `/api/faturalar${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url, {
        cache: 'no-store',
      });

      if (response.ok) {
        const data = await response.json();
        setInvoices(data);
        setSelectedInvoices(new Set()); // Filtre değiştiğinde seçimleri temizle
      } else {
        console.error('Error fetching invoices');
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [startDate, endDate]);

  // Sayfa tekrar görünür olduğunda listeyi yenile (başka sekmede silinen fatura vb.)
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') fetchInvoices();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [startDate, endDate]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedInvoices(new Set(filteredInvoices.map(inv => inv.id)));
    } else {
      setSelectedInvoices(new Set());
    }
  };

  const handleSelectInvoice = (invoiceId: number, checked: boolean) => {
    const newSelected = new Set(selectedInvoices);
    if (checked) {
      newSelected.add(invoiceId);
    } else {
      newSelected.delete(invoiceId);
    }
    setSelectedInvoices(newSelected);
  };

  const handleDeleteSelected = async () => {
    if (selectedInvoices.size === 0) {
      showToast(mounted ? t('admin.invoices.noSelection') : 'Lütfen silmek için en az bir fatura seçin', 'error');
      return;
    }

    if (!confirm(mounted ? t('admin.invoices.confirmDelete', { count: selectedInvoices.size }) : `${selectedInvoices.size} faturayı silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      setIsDeleting(true);
      const ids = Array.from(selectedInvoices);
      
      if (ids.length === 1) {
        // Tek fatura silme
        const response = await fetch(`/api/faturalar/${ids[0]}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          showToast(mounted ? t('admin.invoices.deleted') : 'Fatura başarıyla silindi', 'success');
          await fetchInvoices(); // Listeyi ve Toplam Tutar'ı güncelle
        } else {
          showToast(mounted ? t('admin.invoices.deleteError') : 'Fatura silinirken hata oluştu', 'error');
        }
      } else {
        // Toplu silme
        const response = await fetch('/api/faturalar/bulk-delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids }),
        });
        if (response.ok) {
          const data = await response.json();
          showToast(mounted ? t('admin.invoices.bulkDeleted', { count: data.deletedCount }) : `${data.deletedCount} fatura başarıyla silindi`, 'success');
          await fetchInvoices(); // Listeyi ve Toplam Tutar'ı güncelle
        } else {
          showToast(mounted ? t('admin.invoices.deleteError') : 'Faturalar silinirken hata oluştu', 'error');
        }
      }
    } catch (error) {
      console.error('Error deleting invoices:', error);
      showToast(mounted ? t('admin.invoices.deleteError') : 'Faturalar silinirken hata oluştu', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const downloadInvoiceAsPDF = async (invoice: Invoice) => {
    return new Promise<void>((resolve, reject) => {
      try {
        // Yeni pencere aç
        const invoiceUrl = `/admin-panel/dealers/${invoice.dealerId}/sales/${invoice.id}/invoice?download=true`;
        const newWindow = window.open(invoiceUrl, '_blank');
        
        if (!newWindow) {
          reject(new Error('Pop-up blocked'));
          return;
        }

        // Pencere yüklendiğinde PDF indirmeyi bekle
        // Bu işlem fatura sayfasında yapılacak
        // Burada sadece pencereyi açıyoruz, PDF indirme fatura sayfasında otomatik olacak
        let checkCount = 0;
        const checkInterval = setInterval(() => {
          checkCount++;
          if (newWindow.closed || checkCount > 60) { // 30 saniye timeout
            clearInterval(checkInterval);
            resolve();
          }
        }, 500);
      } catch (error) {
        reject(error);
      }
    });
  };

  const handleDownloadSelected = async () => {
    if (selectedInvoices.size === 0) {
      showToast(mounted ? t('admin.invoices.noSelection') : 'Lütfen indirmek için en az bir fatura seçin', 'error');
      return;
    }

    try {
      setIsDownloading(true);
      const selectedInvoiceList = filteredInvoices.filter(inv => selectedInvoices.has(inv.id));
      
      // Her bir faturayı sırayla indir
      for (let i = 0; i < selectedInvoiceList.length; i++) {
        const invoice = selectedInvoiceList[i];
        try {
          await downloadInvoiceAsPDF(invoice);
          // Her indirme arasında kısa bir bekleme
          if (i < selectedInvoiceList.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          console.error(`Error downloading invoice ${invoice.saleNumber}:`, error);
          showToast(mounted ? t('admin.invoices.downloadError') : `Fatura ${invoice.saleNumber} indirilirken hata oluştu`, 'error');
        }
      }
      
      if (selectedInvoiceList.length > 0) {
        showToast(
          mounted 
            ? t('admin.invoices.downloaded', { count: selectedInvoiceList.length }) 
            : `${selectedInvoiceList.length} fatura başarıyla indirildi`, 
          'success'
        );
      }
    } catch (error) {
      console.error('Error downloading invoices:', error);
      showToast(mounted ? t('admin.invoices.downloadError') : 'Faturalar indirilirken hata oluştu', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadSingle = async (invoice: Invoice) => {
    try {
      setIsDownloading(true);
      await downloadInvoiceAsPDF(invoice);
      showToast(mounted ? t('admin.invoices.downloaded', { count: 1 }) : 'Fatura başarıyla indirildi', 'success');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      showToast(mounted ? t('admin.invoices.downloadError') : 'Fatura indirilirken hata oluştu', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleInvoiceClick = (invoice: Invoice) => {
    router.push(`/admin-panel/dealers/${invoice.dealerId}/sales/${invoice.id}/invoice`);
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.saleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (invoice.companyName && invoice.companyName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'paid' && invoice.isPaid) ||
      (statusFilter === 'unpaid' && !invoice.isPaid);

    return matchesSearch && matchesStatus;
  });

  const totalInvoices = filteredInvoices.length;
  const totalAmount = filteredInvoices.reduce((sum, inv) => sum + parseFloat(inv.total || '0'), 0);

  if (loading) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{mounted ? t('admin.invoices.title') : 'Faturalar'}</h2>
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">{mounted ? t('admin.common.loading') : 'Yükleniyor...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-hidden min-w-0 box-border" style={{ maxWidth: '100%', overflowX: 'hidden', width: '100%' }}>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-2 lg:mb-4 gap-2 lg:gap-4">
        <h2 className="text-lg lg:text-2xl font-bold text-gray-900">{mounted ? t('admin.invoices.title') : 'Faturalar'}</h2>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 lg:gap-4 mb-2 lg:mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-2 lg:p-4">
          <div className="text-xs lg:text-sm text-gray-600 mb-0.5 lg:mb-1">{mounted ? t('admin.invoices.totalInvoices') : 'Toplam Fatura Adedi'}</div>
          <div className="text-lg lg:text-2xl font-bold text-gray-900">{totalInvoices}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-2 lg:p-4">
          <div className="text-xs lg:text-sm text-gray-600 mb-0.5 lg:mb-1">{mounted ? t('admin.invoices.totalAmount') : 'Toplam Tutar'}</div>
          <div className="text-lg lg:text-2xl font-bold text-blue-600">${totalAmount.toFixed(2)} CAD</div>
        </div>
      </div>

      {/* Filtreler */}
      <div className="bg-white border border-gray-200 rounded-lg p-2 lg:p-4 mb-2 lg:mb-4">
        <div className="grid grid-cols-2 gap-2 lg:gap-3 mb-3">
          <div className="min-w-0">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {mounted ? t('admin.common.search') : 'Arama'}
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={mounted ? `${t('admin.invoices.invoiceNumber')} ${t('admin.common.search').toLowerCase()}` : 'Fatura no veya müşteri ara...'}
              className="w-full min-w-0 px-2 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
            />
          </div>
          <div className="min-w-0">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {mounted ? t('admin.invoices.status') : 'Durum'}
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'paid' | 'unpaid')}
              className="w-full min-w-0 px-2 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
            >
              <option value="all">{mounted ? t('admin.common.total') : 'Tümü'}</option>
              <option value="paid">{mounted ? t('admin.invoices.paid') : 'Ödendi'}</option>
              <option value="unpaid">{mounted ? t('admin.invoices.unpaid') : 'Ödenmedi'}</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 lg:gap-3">
          <div className="min-w-0">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {mounted ? t('admin.invoices.startDate') : 'Başlangıç Tarihi'}
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
            />
          </div>
          <div className="min-w-0">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {mounted ? t('admin.invoices.endDate') : 'Bitiş Tarihi'}
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
            />
          </div>
        </div>
      </div>

      {/* Seçim ve İşlem Butonları */}
      {filteredInvoices.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-2 lg:p-4 mb-2 lg:mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedInvoices.size === filteredInvoices.length && filteredInvoices.length > 0}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="w-4 h-4 text-[#E91E63] border-gray-300 rounded focus:ring-[#E91E63]"
              />
              <span className="text-sm font-medium text-gray-700">
                {mounted ? t('admin.invoices.selectAll') : 'Tümünü Seç'}
              </span>
            </label>
            {selectedInvoices.size > 0 && (
              <span className="text-sm text-gray-600">
                {mounted ? t('admin.invoices.selected', { count: selectedInvoices.size }) : `${selectedInvoices.size} fatura seçildi`}
              </span>
            )}
          </div>
          {selectedInvoices.size > 0 && (
            <div className="flex gap-2">
              <button
                onClick={handleDownloadSelected}
                disabled={isDownloading}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {mounted ? t('admin.invoices.download') : 'İndir'}
              </button>
              <button
                onClick={handleDeleteSelected}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {mounted ? t('admin.invoices.delete') : 'Sil'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Faturalar Tablosu */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-x-hidden min-w-0">
        {/* Mobil Kart Görünümü */}
        <div className="lg:hidden space-y-2 p-2">
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-6 text-gray-500 text-sm">
              {mounted ? t('admin.common.notFound') : (searchQuery || statusFilter !== 'all'
                ? 'Arama kriterlerine uygun fatura bulunamadı'
                : 'Henüz fatura bulunmamaktadır')}
            </div>
          ) : (
            filteredInvoices.map((invoice) => (
              <div key={invoice.id} className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={selectedInvoices.has(invoice.id)}
                      onChange={(e) => handleSelectInvoice(invoice.id, e.target.checked)}
                      className="mt-1 w-4 h-4 text-[#E91E63] border-gray-300 rounded focus:ring-[#E91E63] flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900">{invoice.saleNumber}</h3>
                      <p className="text-xs text-gray-700 mt-1">{invoice.companyName || '-'}</p>
                    </div>
                  </div>
                  <div className="flex flex-nowrap items-center gap-1 ml-2 flex-shrink-0">
                    {invoice.isPaid ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-lg text-[10px] font-semibold bg-green-100 text-green-800 border border-green-200 whitespace-nowrap">
                        ✓ {mounted ? t('admin.invoices.paid') : 'Ödendi'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-lg text-[10px] font-semibold bg-red-100 text-red-800 border border-red-200 whitespace-nowrap">
                        ⚠ {mounted ? t('admin.invoices.unpaid') : 'Ödenmedi'}
                      </span>
                    )}
                    {invoice.isShipped ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-lg text-[10px] font-semibold bg-green-100 text-green-800 border border-green-200 whitespace-nowrap">
                        ✓ {mounted ? t('admin.dealers.shipped') : 'Gönderildi'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-lg text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200 whitespace-nowrap">
                        📦 {mounted ? t('admin.dealers.notShipped') : 'Gönderilmedi'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-1 text-xs text-gray-600 mb-3">
                  <div><span className="text-gray-500">{mounted ? t('admin.invoices.date') : 'Tarih'}:</span> <span className="font-medium">
                    {new Date(invoice.createdAt).toLocaleDateString('tr-TR')}
                  </span></div>
                  <div><span className="text-gray-500">{mounted ? t('admin.invoices.total') : 'Toplam'}:</span> <span className="font-semibold text-gray-900">${parseFloat(invoice.total).toFixed(2)}</span></div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownloadSingle(invoice)}
                    disabled={isDownloading}
                    className="flex-1 bg-blue-600 text-white text-xs font-medium px-2 py-1.5 rounded-lg hover:bg-blue-700 transition-colors text-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {mounted ? t('admin.invoices.download') : 'İndir'}
                  </button>
                  <Link
                    href={`/admin-panel/dealers/${invoice.dealerId}/sales/${invoice.id}/invoice`}
                    className="flex-1 bg-[#E91E63] text-white text-xs font-medium px-2 py-1.5 rounded-lg hover:bg-[#C2185B] transition-colors text-center"
                  >
                    {mounted ? t('admin.invoices.view') : 'Görüntüle'}
                  </Link>
                  <button
                    onClick={async () => {
                      if (!confirm(mounted ? t('admin.invoices.confirmDeleteSingle') : 'Bu faturayı silmek istediğinize emin misiniz?')) {
                        return;
                      }
                      try {
                        const response = await fetch(`/api/faturalar/${invoice.id}`, {
                          method: 'DELETE',
                        });
                        if (response.ok) {
                          showToast(mounted ? t('admin.invoices.deleted') : 'Fatura başarıyla silindi', 'success');
                          await fetchInvoices();
                        } else {
                          showToast(mounted ? t('admin.invoices.deleteError') : 'Fatura silinirken hata oluştu', 'error');
                        }
                      } catch (error) {
                        console.error('Error deleting invoice:', error);
                        showToast(mounted ? t('admin.invoices.deleteError') : 'Fatura silinirken hata oluştu', 'error');
                      }
                    }}
                    className="px-2 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors"
                  >
                    {mounted ? t('admin.common.delete') : 'Sil'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Tablo Görünümü */}
        <div className="hidden lg:block overflow-x-hidden lg:overflow-x-visible">
          <table className="w-full divide-y divide-gray-200 min-w-0 max-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  <input
                    type="checkbox"
                    checked={selectedInvoices.size === filteredInvoices.length && filteredInvoices.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 text-[#E91E63] border-gray-300 rounded focus:ring-[#E91E63]"
                  />
                </th>
                <th className="px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {mounted ? t('admin.invoices.invoiceNumber') : 'Fatura No'}
                </th>
                <th className="px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {mounted ? t('admin.invoices.customer') : 'Müşteri'}
                </th>
                <th className="px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {mounted ? t('admin.invoices.date') : 'Tarih'}
                </th>
                <th className="px-3 lg:px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {mounted ? t('admin.invoices.total') : 'Toplam'}
                </th>
                <th className="px-3 lg:px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {mounted ? t('admin.invoices.status') : 'Durum'}
                </th>
                <th className="px-3 lg:px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {mounted ? t('admin.common.actions') : 'İşlemler'}
                </th>
                <th className="px-3 lg:px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {mounted ? t('admin.common.delete') : 'Sil'}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 lg:px-4 py-8 text-center text-gray-500">
                    {mounted ? t('admin.common.notFound') : (searchQuery || statusFilter !== 'all'
                      ? 'Arama kriterlerine uygun fatura bulunamadı'
                      : 'Henüz fatura bulunmamaktadır')}
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-3 lg:px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedInvoices.has(invoice.id)}
                        onChange={(e) => handleSelectInvoice(invoice.id, e.target.checked)}
                        className="w-4 h-4 text-[#E91E63] border-gray-300 rounded focus:ring-[#E91E63]"
                      />
                    </td>
                    <td className="px-3 lg:px-4 py-4">
                      <span className="font-semibold text-gray-900 truncate block">
                        {invoice.saleNumber}
                      </span>
                    </td>
                    <td className="px-3 lg:px-4 py-4 text-sm text-gray-600 truncate">
                      {invoice.companyName || '-'}
                    </td>
                    <td className="px-3 lg:px-4 py-4 text-sm text-gray-600">
                      {new Date(invoice.createdAt).toLocaleDateString(getLocale(), {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-3 lg:px-4 py-4 text-right">
                      <span className="font-bold text-blue-600 text-base">
                        ${parseFloat(invoice.total || '0').toFixed(2)}
                      </span>
                    </td>
                    <td className="px-3 lg:px-4 py-4">
                      <div className="flex flex-nowrap items-center justify-center gap-1.5">
                        {invoice.isPaid ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                            ✓ {mounted ? t('admin.invoices.paid') : 'Ödendi'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
                            ⚠ {mounted ? t('admin.invoices.unpaid') : 'Ödenmedi'}
                          </span>
                        )}
                        {invoice.isShipped ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                            ✓ {mounted ? t('admin.dealers.shipped') : 'Gönderildi'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                            📦 {mounted ? t('admin.dealers.notShipped') : 'Gönderilmedi'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 lg:px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleDownloadSingle(invoice)}
                          disabled={isDownloading}
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {mounted ? t('admin.invoices.download') : 'İndir'}
                        </button>
                        <button
                          onClick={() => handleInvoiceClick(invoice)}
                          className="text-[#E91E63] hover:text-[#C2185B] font-medium text-sm transition-colors"
                        >
                          {mounted ? t('admin.invoices.view') : 'Görüntüle'}
                        </button>
                      </div>
                    </td>
                    <td className="px-3 lg:px-4 py-4 text-center">
                      <button
                        onClick={async () => {
                          if (!confirm(mounted ? t('admin.invoices.confirmDeleteSingle') : 'Bu faturayı silmek istediğinize emin misiniz?')) {
                            return;
                          }
                          try {
                            const response = await fetch(`/api/faturalar/${invoice.id}`, {
                              method: 'DELETE',
                            });
                            if (response.ok) {
                              showToast(mounted ? t('admin.invoices.deleted') : 'Fatura başarıyla silindi', 'success');
                              await fetchInvoices();
                            } else {
                              showToast(mounted ? t('admin.invoices.deleteError') : 'Fatura silinirken hata oluştu', 'error');
                            }
                          } catch (error) {
                            console.error('Error deleting invoice:', error);
                            showToast(mounted ? t('admin.invoices.deleteError') : 'Fatura silinirken hata oluştu', 'error');
                          }
                        }}
                        className="text-red-600 hover:text-red-700 font-medium text-sm transition-colors"
                      >
                        {mounted ? t('admin.common.delete') : 'Sil'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
