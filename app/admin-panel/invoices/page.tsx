'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { showToast } from '@/components/Toast';

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

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/faturalar', {
        cache: 'no-store',
      });

      if (response.ok) {
        const data = await response.json();
        setInvoices(data);
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
  }, []);

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

  const paymentMethodText: Record<string, string> = {
    NAKIT: mounted ? t('admin.orders.cash') : 'Nakit',
    KREDI_KARTI: mounted ? t('admin.orders.creditCard') : 'Kredi Kartı',
    CEK: mounted ? t('admin.orders.check') : 'Çek',
    ODENMEDI: mounted ? t('admin.orders.unpaid') : 'Ödenmedi',
  };

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 lg:gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {mounted ? t('admin.common.search') : 'Arama'}
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={mounted ? `${t('admin.invoices.invoiceNumber')} ${t('admin.common.search').toLowerCase()}` : 'Fatura no veya müşteri ara...'}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {mounted ? t('admin.invoices.status') : 'Durum'}
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'paid' | 'unpaid')}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
            >
              <option value="all">{mounted ? t('admin.common.total') : 'Tümü'}</option>
              <option value="paid">{mounted ? t('admin.invoices.paid') : 'Ödendi'}</option>
              <option value="unpaid">{mounted ? t('admin.invoices.unpaid') : 'Ödenmedi'}</option>
            </select>
          </div>
        </div>
      </div>

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
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900">{invoice.saleNumber}</h3>
                    <p className="text-xs text-gray-700 mt-1">{invoice.companyName || '-'}</p>
                  </div>
                  <span className={`px-2 py-1 text-[10px] font-semibold rounded-full ml-2 flex-shrink-0 ${
                    invoice.isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {invoice.isPaid ? (mounted ? t('admin.invoices.paid') : 'Ödendi') : (mounted ? t('admin.invoices.unpaid') : 'Ödenmedi')}
                  </span>
                </div>
                <div className="space-y-1 text-xs text-gray-600 mb-3">
                  <div><span className="text-gray-500">{mounted ? t('admin.invoices.date') : 'Tarih'}:</span> <span className="font-medium">
                    {new Date(invoice.createdAt).toLocaleDateString('tr-TR')}
                  </span></div>
                  <div><span className="text-gray-500">{mounted ? t('admin.invoices.total') : 'Toplam'}:</span> <span className="font-semibold text-gray-900">${parseFloat(invoice.total).toFixed(2)}</span></div>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/admin-panel/dealers/${invoice.dealerId}/sales/${invoice.id}/invoice`}
                    className="flex-1 bg-[#E91E63] text-white text-xs font-medium px-2 py-1.5 rounded-lg hover:bg-[#C2185B] transition-colors text-center"
                  >
                    {mounted ? t('admin.invoices.view') : 'Görüntüle'}
                  </Link>
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
                <th className="px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {mounted ? t('admin.invoices.invoiceNumber') : 'Fatura No'}
                </th>
                <th className="px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {mounted ? t('admin.invoices.customer') : 'Müşteri'}
                </th>
                <th className="px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {mounted ? t('admin.invoices.date') : 'Tarih'}
                </th>
                <th className="px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {mounted ? t('admin.invoices.paymentMethod') : 'Ödeme Yöntemi'}
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
                    <td className="px-3 lg:px-4 py-4 text-sm text-gray-600 truncate">
                      {paymentMethodText[invoice.paymentMethod] || invoice.paymentMethod}
                    </td>
                    <td className="px-3 lg:px-4 py-4 text-right">
                      <span className="font-bold text-blue-600 text-base">
                        ${parseFloat(invoice.total || '0').toFixed(2)}
                      </span>
                    </td>
                    <td className="px-3 lg:px-4 py-4 text-center">
                      {invoice.isPaid ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          ✓ {mounted ? t('admin.invoices.paid') : 'Ödendi'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                          ⚠ {mounted ? t('admin.invoices.unpaid') : 'Ödenmedi'}
                        </span>
                      )}
                    </td>
                    <td className="px-3 lg:px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleInvoiceClick(invoice)}
                          className="text-[#E91E63] hover:text-[#C2185B] font-medium text-sm transition-colors"
                        >
                          {mounted ? t('admin.invoices.view') : 'Görüntüle'}
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
    </div>
  );
}
