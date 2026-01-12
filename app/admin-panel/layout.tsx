'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { AdminNotificationBanner } from '@/components/AdminNotificationBanner';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobilde default kapalı
  const [isDesktop, setIsDesktop] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    setMounted(true);
    const checkDesktop = () => {
      const isDesktopWidth = window.innerWidth >= 1024;
      setIsDesktop(isDesktopWidth);
      // Desktop'ta her zaman açık kalmalı
      if (isDesktopWidth) {
        setSidebarOpen(true);
      }
    };
    
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Login sayfası ve invoice/fatura detay sayfaları için layout gösterme (liste sayfası hariç)
  if (pathname === '/admin-panel' || 
      (pathname && pathname !== '/admin-panel/invoices' && 
       (pathname.includes('/invoice') || pathname.includes('/fatura')))) {
    return <>{children}</>;
  }

  const menuItems = [
    { href: '/admin-panel/dashboard', labelKey: 'admin.menu.dashboard', icon: '📊' },
    { href: '/admin-panel/products', labelKey: 'admin.menu.products', icon: '📦' },
    { href: '/admin-panel/categories', labelKey: 'admin.menu.categories', icon: '📁' },
    { href: '/admin-panel/orders', labelKey: 'admin.menu.orders', icon: '🛒' },
    { href: '/admin-panel/dealers', labelKey: 'admin.menu.dealers', icon: '🏪' },
    { href: '/admin-panel/reports', labelKey: 'admin.menu.reports', icon: '📈' },
    { href: '/admin-panel/invoices', labelKey: 'admin.menu.invoices', icon: '🧾' },
    { href: '/admin-panel/settings', labelKey: 'admin.menu.settings', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex relative w-full box-border" style={{ maxWidth: '100vw', overflowX: 'hidden', width: '100vw', position: 'relative' }}>
      {/* Mobil Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`bg-gray-800 text-white transition-all duration-300 fixed lg:static inset-y-0 left-0 z-50 overflow-x-hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } w-40 lg:w-64`}
      >
        <div className="p-2 lg:p-4 border-b border-gray-700 flex items-center justify-between h-12 lg:h-16">
          <h2 className="text-xs lg:text-base xl:text-xl font-bold text-white truncate">{mounted ? t('admin.menu.adminPanel') : 'Admin Panel'}</h2>
          <button
            onClick={() => {
              // Desktop'ta sidebar'ı kapatma
              if (window.innerWidth >= 1024) {
                return;
              }
              setSidebarOpen(!sidebarOpen);
            }}
            className="p-1.5 hover:bg-gray-700 rounded transition-colors lg:hidden"
          >
            <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {sidebarOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        <nav className="p-1.5 lg:p-4 flex flex-col h-[calc(100vh-3rem)] lg:h-[calc(100vh-4.5rem)]">
          <ul className="space-y-0.5 lg:space-y-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.href || (pathname?.startsWith(item.href) && item.href !== '/admin-panel/dashboard');
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => {
                      // Desktop'ta sidebar'ı kapatma, sadece mobilde kapat
                      if (window.innerWidth < 1024) {
                        setSidebarOpen(false);
                      }
                    }}
                    className={`flex items-center gap-1 lg:gap-3 p-1.5 lg:p-3 rounded transition-colors text-[10px] lg:text-sm xl:text-base ${
                      isActive
                        ? 'bg-[#E91E63] text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <span className="text-sm lg:text-lg xl:text-xl flex-shrink-0">{item.icon}</span>
                    <span className="font-medium truncate">{mounted ? t(item.labelKey) : item.labelKey}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Çıkış Butonu - Ayarlar altında */}
          <div className="mt-1.5 lg:mt-2 pt-1.5 lg:pt-2 border-t border-gray-700">
            <button
              onClick={async () => {
                try {
                  setLogoutLoading(true);
                  const response = await fetch('/api/auth/logout', {
                    method: 'POST',
                  });
                  router.push('/admin-panel');
                } catch (error) {
                  console.error('Logout error:', error);
                  router.push('/admin-panel');
                } finally {
                  setLogoutLoading(false);
                }
              }}
              disabled={logoutLoading}
              className="w-full flex items-center gap-1 lg:gap-3 p-1.5 lg:p-3 rounded transition-colors text-[10px] lg:text-sm xl:text-base text-gray-300 hover:bg-red-900 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-sm lg:text-lg xl:text-xl flex-shrink-0">🚪</span>
              <span className="font-medium truncate">{mounted ? (logoutLoading ? t('admin.menu.loggingOut') : t('admin.menu.logout')) : (logoutLoading ? 'Çıkılıyor...' : 'Çıkış Yap')}</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 lg:max-w-[calc(100vw-256px)] lg:ml-0 w-full" style={{ maxWidth: 'calc(100vw)', overflowX: 'hidden', width: 'calc(100vw)', position: 'relative', marginLeft: '0' }}>
        <header className="bg-white border-b border-gray-200 p-2 lg:p-4 w-full" style={{ maxWidth: '100%', overflowX: 'hidden', width: '100%', boxSizing: 'border-box' }}>
          <div className="flex items-center justify-between min-w-0 w-full" style={{ maxWidth: '100%', width: '100%', boxSizing: 'border-box' }}>
            <div className="flex items-center min-w-0 flex-1">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors lg:hidden flex-shrink-0 mr-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-base lg:text-xl md:text-2xl font-bold text-gray-900 truncate min-w-0">{mounted ? t('admin.menu.adminDashboard') : 'Admin Dashboard'}</h1>
            </div>
            <div className="flex-shrink-0 ml-4">
              <LanguageSwitcher />
            </div>
          </div>
        </header>

        <div className="flex-1 flex flex-col min-w-0 w-full" style={{ maxWidth: '100%', overflowX: 'hidden', width: '100%', boxSizing: 'border-box' }}>
          <AdminNotificationBanner />
          <main className="flex-1 p-1.5 lg:p-6 min-w-0 w-full box-border" style={{ maxWidth: '100%', overflowX: 'hidden', width: '100%', boxSizing: 'border-box' }}>{children}</main>
        </div>
      </div>
    </div>
  );
}
