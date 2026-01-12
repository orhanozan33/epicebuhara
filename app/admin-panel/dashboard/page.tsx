'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  orderRevenue: number;
  dealerRevenue: number;
  totalRevenue: number;
}

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const { t } = useTranslation();
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    totalOrders: 0,
    orderRevenue: 0,
    dealerRevenue: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/reports');
      
      if (response.ok) {
        const data = await response.json();
        const totalRevenue = (data.orderRevenue || 0) + (data.dealerRevenue || 0);
        setStats({
          totalSales: data.totalSales || 0,
          totalOrders: data.totalOrders || 0,
          orderRevenue: data.orderRevenue || 0,
          dealerRevenue: data.dealerRevenue || 0,
          totalRevenue,
        });
      } else {
        console.error('Error fetching dashboard stats');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-w-0 box-border" style={{ maxWidth: '100%', overflowX: 'hidden', width: '100%' }}>
      <h2 className="text-lg lg:text-2xl font-bold text-gray-900 mb-3 lg:mb-6">{mounted ? t('admin.dashboard.title') : 'Dashboard'}</h2>

      {loading ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">{mounted ? t('admin.common.loading') : 'Yükleniyor...'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-xs lg:text-sm font-medium text-gray-500 mb-2 lg:mb-3">{mounted ? t('admin.dashboard.totalSales') : 'Toplam Satış'}</h3>
            <p className="text-xl lg:text-3xl font-bold text-blue-600">{stats.totalSales}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-xs lg:text-sm font-medium text-gray-500 mb-2 lg:mb-3">{mounted ? t('admin.dashboard.totalOrders') : 'Toplam Sipariş'}</h3>
            <p className="text-xl lg:text-3xl font-bold text-green-600">{stats.totalOrders}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-xs lg:text-sm font-medium text-gray-500 mb-2 lg:mb-3">{mounted ? t('admin.dashboard.orderRevenue') : 'Sipariş Geliri'}</h3>
            <p className="text-base lg:text-3xl font-bold text-[#E91E63] break-words">${stats.orderRevenue.toFixed(2)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-xs lg:text-sm font-medium text-gray-500 mb-2 lg:mb-3">{mounted ? t('admin.dashboard.dealerRevenue') : 'Bayi Geliri'}</h3>
            <p className="text-base lg:text-3xl font-bold text-purple-600 break-words">${stats.dealerRevenue.toFixed(2)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow col-span-2 lg:col-span-1">
            <h3 className="text-xs lg:text-sm font-medium text-gray-500 mb-2 lg:mb-3">{mounted ? t('admin.dashboard.totalRevenue') : 'Toplam Gelir'}</h3>
            <p className="text-base lg:text-3xl font-bold text-indigo-600 break-words">${stats.totalRevenue.toFixed(2)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
