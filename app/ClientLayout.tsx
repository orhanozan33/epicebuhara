'use client';

import { I18nProvider } from '@/components/I18nProvider';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ToastContainer } from '@/components/Toast';
import { ConfirmModalProvider } from '@/components/ConfirmModal';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (pathname?.startsWith('/admin-panel')) {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  }, [pathname]);

  if (isAdmin) {
    return (
      <I18nProvider>
        <ToastContainer />
        <ConfirmModalProvider />
        {children}
      </I18nProvider>
    );
  }

  return (
    <I18nProvider>
      <ToastContainer />
      <ConfirmModalProvider />
      <Header />
      {children}
      <Footer />
    </I18nProvider>
  );
}
