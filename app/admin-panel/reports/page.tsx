'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ReportData {
  totalSales: number;
  totalOrders: number;
  orderRevenue: number;
  dealerRevenue: number;
  orderSubtotal: number;
  dealerSubtotal: number;
  orderTPS: number;
  orderTVQ: number;
  dealerTPS: number;
  dealerTVQ: number;
  totalAlacak: number;
  ordersByStatus: { status: string; count: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
}

export default function RaporlarPage() {
  const [mounted, setMounted] = useState(false);
  const { t } = useTranslation();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  useEffect(() => {
    setMounted(true);
    fetchReports('', '');
  }, []);

  // Sayfa tekrar görünür olduğunda raporu yenile (silinen fatura sonrası güncel veri)
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        if (startDate && endDate) fetchReports(startDate, endDate);
        else fetchReports('', '');
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [startDate, endDate]);

  const fetchReports = async (start: string, end: string) => {
    setLoading(true);
    try {
      const url = start && end 
        ? `/api/reports?startDate=${start}&endDate=${end}`
        : '/api/reports';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      } else {
        console.error('Error fetching reports');
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = () => {
    // Eğer her iki tarih de seçilmişse, tarih aralığı ile filtrele
    if (startDate && endDate) {
      fetchReports(startDate, endDate);
    } else if (startDate || endDate) {
      // Sadece bir tarih seçilmişse, tüm raporları göster
      fetchReports('', '');
    } else {
      // Hiç tarih seçilmemişse, tüm raporları göster
      fetchReports('', '');
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING':
        return mounted ? t('admin.orders.pending') : 'Beklemede';
      case 'APPROVED':
        return mounted ? t('admin.orders.approved') : 'Onaylandı';
      case 'SHIPPED':
        return mounted ? t('admin.orders.shipped') : 'Gönderildi';
      case 'CANCELLED':
        return mounted ? t('admin.orders.cancelled') : 'İptal';
      default:
        return status;
    }
  };

  return (
    <div className="w-full overflow-x-hidden min-w-0 box-border" style={{ maxWidth: '100%', overflowX: 'hidden', width: '100%' }}>
      <h2 className="text-lg lg:text-2xl font-bold text-gray-900 mb-2 lg:mb-6">{mounted ? t('admin.reports.title') : 'Raporlar'}</h2>

      {/* Tarih Aralığı Seçimi */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 lg:p-6 mb-3 lg:mb-6">
        <h3 className="text-sm lg:text-lg font-semibold text-gray-900 mb-3 lg:mb-4">{mounted ? t('admin.reports.dateRange') : 'Tarih Aralığı Seçimi'}</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
          <div>
            <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1.5 lg:mb-2">
              {mounted ? t('admin.reports.startDate') : 'Başlangıç Tarihi'}
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 lg:px-4 py-2 text-sm lg:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
            />
          </div>
          <div>
            <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1.5 lg:mb-2">
              {mounted ? t('admin.reports.endDate') : 'Bitiş Tarihi'}
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 lg:px-4 py-2 text-sm lg:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={handleDateChange}
              disabled={loading || (!startDate && !endDate)}
              className="flex-1 bg-[#E91E63] text-white px-3 lg:px-4 py-2 text-sm lg:text-base rounded-lg hover:bg-[#C2185B] transition-colors disabled:bg-gray-400 font-medium"
            >
              {loading ? (mounted ? t('admin.common.loading') : 'Yükleniyor...') : (mounted ? t('admin.reports.getReport') : 'Raporu Getir')}
            </button>
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  fetchReports('', '');
                }}
                disabled={loading}
                className="px-3 lg:px-4 py-2 text-sm lg:text-base border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:bg-gray-100 font-medium text-gray-700"
              >
                {mounted ? t('admin.common.clear') : 'Temizle'}
              </button>
            )}
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-gray-600">{mounted ? t('admin.reports.loadingReports') : 'Raporlar yükleniyor...'}</p>
        </div>
      )}

      {!loading && reportData && (
        <div className="space-y-3 lg:space-y-6">
          {/* Özet Kartlar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-6 mb-3 lg:mb-6">
            <div className="bg-white border border-gray-200 rounded-lg p-3 lg:p-6">
              <h3 className="text-[10px] lg:text-sm font-medium text-gray-500 mb-1.5 lg:mb-2">{mounted ? t('admin.reports.totalSales') : 'Toplam Satış'}</h3>
              <p className="text-base lg:text-3xl font-bold text-blue-600">{reportData.totalSales}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-3 lg:p-6">
              <h3 className="text-[10px] lg:text-sm font-medium text-gray-500 mb-1.5 lg:mb-2">{mounted ? t('admin.reports.totalOrders') : 'Toplam Sipariş'}</h3>
              <p className="text-base lg:text-3xl font-bold text-green-600">{reportData.totalOrders}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-3 lg:p-6">
              <h3 className="text-[10px] lg:text-sm font-medium text-gray-500 mb-1.5 lg:mb-2">{mounted ? t('admin.reports.orderRevenue') : 'Sipariş Toplam Gelir'}</h3>
              <p className="text-xs lg:text-3xl font-bold text-[#E91E63] break-words">${reportData.orderRevenue.toFixed(2)}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-3 lg:p-6">
              <h3 className="text-[10px] lg:text-sm font-medium text-gray-500 mb-1.5 lg:mb-2">{mounted ? t('admin.reports.dealerRevenue') : 'Bayi Toplam Gelir'}</h3>
              <p className="text-xs lg:text-3xl font-bold text-purple-600 break-words">${reportData.dealerRevenue.toFixed(2)}</p>
            </div>
          </div>

          {/* Vergi Detayları */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-6 mb-3 lg:mb-6">
            <div className="bg-white border border-gray-200 rounded-lg p-3 lg:p-6">
              <h3 className="text-[10px] lg:text-sm font-medium text-gray-500 mb-1.5 lg:mb-2">{mounted ? t('admin.reports.orderTPS') : 'Sipariş TPS (5%)'}</h3>
              <p className="text-xs lg:text-2xl font-bold text-blue-500 break-words">${reportData.orderTPS.toFixed(2)}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-3 lg:p-6">
              <h3 className="text-[10px] lg:text-sm font-medium text-gray-500 mb-1.5 lg:mb-2">{mounted ? t('admin.reports.orderTVQ') : 'Sipariş TVQ (9.975%)'}</h3>
              <p className="text-xs lg:text-2xl font-bold text-indigo-500 break-words">${reportData.orderTVQ.toFixed(2)}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-3 lg:p-6">
              <h3 className="text-[10px] lg:text-sm font-medium text-gray-500 mb-1.5 lg:mb-2">{mounted ? t('admin.reports.dealerTPS') : 'Bayi TPS (5%)'}</h3>
              <p className="text-xs lg:text-2xl font-bold text-cyan-500 break-words">${reportData.dealerTPS.toFixed(2)}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-3 lg:p-6">
              <h3 className="text-[10px] lg:text-sm font-medium text-gray-500 mb-1.5 lg:mb-2">{mounted ? t('admin.reports.dealerTVQ') : 'Bayi TVQ (9.975%)'}</h3>
              <p className="text-xs lg:text-2xl font-bold text-teal-500 break-words">${reportData.dealerTVQ.toFixed(2)}</p>
            </div>
          </div>

          {/* Toplam Alacak */}
          <div className="grid grid-cols-1 gap-2 lg:gap-6 mb-3 lg:mb-6">
            <div className="bg-white border border-gray-200 rounded-lg p-3 lg:p-6">
              <h3 className="text-xs lg:text-sm font-medium text-gray-500 mb-1.5 lg:mb-2">{mounted ? t('admin.reports.totalReceivables') : 'Toplam Alacak'}</h3>
              <p className="text-base lg:text-3xl font-bold text-orange-600 break-words">${reportData.totalAlacak.toFixed(2)}</p>
            </div>
          </div>

          {/* Sipariş Durumları */}
          <div className="bg-white border border-gray-200 rounded-lg p-3 lg:p-6 mb-3 lg:mb-6">
            <h3 className="text-sm lg:text-lg font-semibold text-gray-900 mb-3 lg:mb-4">{mounted ? t('admin.reports.ordersByStatus') : 'Sipariş Durumları'}</h3>
            {reportData.ordersByStatus && reportData.ordersByStatus.length > 0 ? (
              <>
                {/* Desktop Tablo Görünümü */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          {mounted ? t('admin.reports.status') : 'Durum'}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          {mounted ? t('admin.reports.count') : 'Adet'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {reportData.ordersByStatus.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {getStatusLabel(item.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.count}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Mobil Kart Görünümü */}
                <div className="lg:hidden space-y-2">
                  {reportData.ordersByStatus.map((item, index) => (
                    <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{getStatusLabel(item.status)}</span>
                      <span className="text-sm text-gray-600 font-semibold">{item.count}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500 text-sm">{mounted ? t('admin.reports.noStatusData') : 'Seçilen tarih aralığında sipariş durumu verisi bulunamadı.'}</p>
              </div>
            )}
          </div>

          {/* En Çok Satan Ürünler */}
          <div className="bg-white border border-gray-200 rounded-lg p-3 lg:p-6">
            <h3 className="text-sm lg:text-lg font-semibold text-gray-900 mb-3 lg:mb-4">{mounted ? t('admin.reports.topProducts') : 'En Çok Satan Ürünler'}</h3>
            {reportData.topProducts && reportData.topProducts.length > 0 ? (
              <>
                {/* Desktop Tablo Görünümü */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          {mounted ? t('admin.reports.productName') : 'Ürün Adı'}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          {mounted ? t('admin.reports.quantitySold') : 'Satılan Adet'}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          {mounted ? t('admin.reports.totalRevenue') : 'Toplam Gelir'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {reportData.topProducts.map((product, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {product.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {product.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${product.revenue.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Mobil Kart Görünümü */}
                <div className="lg:hidden space-y-2">
                  {reportData.topProducts.map((product, index) => (
                    <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="text-sm font-medium text-gray-900 flex-1 pr-2 break-words">{product.name}</h4>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>{mounted ? t('admin.reports.quantitySold') : 'Satılan Adet'}: <span className="font-semibold text-gray-900">{product.quantity}</span></span>
                        <span>{mounted ? t('admin.reports.totalRevenue') : 'Gelir'}: <span className="font-semibold text-gray-900">${product.revenue.toFixed(2)}</span></span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500 text-sm">{mounted ? t('admin.reports.noProductData') : 'Seçilen tarih aralığında satılan ürün verisi bulunamadı.'}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {!loading && !reportData && (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">{mounted ? t('admin.reports.noReportData') : 'Rapor verisi bulunamadı'}</p>
        </div>
      )}
    </div>
  );
}
