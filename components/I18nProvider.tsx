'use client';

import { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [i18nInstance, setI18nInstance] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    
    const loadI18n = async () => {
      try {
        if (typeof window !== 'undefined') {
          const module = await import('@/lib/i18n/config');
          if (isMounted && module.default) {
            setI18nInstance(module.default);
            setMounted(true);
          }
        }
      } catch (error: any) {
        console.error('Error loading i18n:', error);
        // Hata olsa bile children'ı göster
        if (isMounted) {
          setMounted(true);
        }
      }
    };

    loadI18n();

    return () => {
      isMounted = false;
    };
  }, []);

  // Server-side render veya i18n yüklenene kadar children'ı direkt döndür
  if (!mounted || !i18nInstance) {
    return <>{children}</>;
  }

  try {
    return <I18nextProvider i18n={i18nInstance}>{children}</I18nextProvider>;
  } catch (error: any) {
    console.error('Error rendering I18nextProvider:', error);
    // Hata durumunda children'ı direkt göster
    return <>{children}</>;
  }
}
