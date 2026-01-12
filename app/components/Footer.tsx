'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TermsModal } from '@/components/TermsModal';

interface SocialMediaLinks {
  instagramUrl: string | null;
  facebookUrl: string | null;
}

interface CompanyInfo {
  phone: string | null;
  address: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
}

export function Footer() {
  const [mounted, setMounted] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    phone: null,
    address: null,
    instagramUrl: null,
    facebookUrl: null,
  });
  const [modalType, setModalType] = useState<'privacy' | 'terms' | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    setMounted(true);
    // Firma bilgilerini getir (telefon, adres, sosyal medya)
    fetch('/api/settings/company')
      .then((res) => res.json())
      .then((data) => {
        setCompanyInfo({
          phone: data.phone || null,
          address: data.address || null,
          instagramUrl: data.instagramUrl || null,
          facebookUrl: data.facebookUrl || null,
        });
      })
      .catch((err) => console.error('Error fetching company info:', err));
  }, []);

  return (
    <footer className="bg-gray-800 text-gray-300 mt-8 sm:mt-12">
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <div className="mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 text-white">{mounted ? t('footer.contact') : 'İletişim'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:items-center">
            <div className="flex flex-col gap-1">
              {companyInfo.phone && (
                <p className="text-xs sm:text-sm break-words">📞 {companyInfo.phone}</p>
              )}
              {companyInfo.address && (
                <p className="text-xs sm:text-sm break-words">📍 {companyInfo.address}</p>
              )}
            </div>
            <div className="hidden md:flex items-center justify-center gap-2 text-xs sm:text-sm">
              <button
                onClick={() => setModalType('privacy')}
                className="hover:text-white transition-colors"
              >
                {mounted ? t('footer.privacy') : 'Gizlilik'}
              </button>
              <span className="text-gray-500">|</span>
              <button
                onClick={() => setModalType('terms')}
                className="hover:text-white transition-colors"
              >
                {mounted ? t('footer.terms') : 'Koşullar'}
              </button>
            </div>
            <div className="hidden md:flex items-center justify-end gap-4 sm:gap-6">
              {companyInfo.instagramUrl && (
                <a
                  href={companyInfo.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors"
                  aria-label="Instagram"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              )}
              {companyInfo.facebookUrl && (
                <a
                  href={companyInfo.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors"
                  aria-label="Facebook"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
              )}
            </div>
          </div>
          {/* Mobil Düzen - Gizlilik|Koşullar ve Sosyal Medya yan yana */}
          <div className="md:hidden flex items-center justify-between w-full mt-4 pt-4 border-t border-gray-700">
            <div className="flex-1"></div>
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <button
                onClick={() => setModalType('privacy')}
                className="hover:text-white transition-colors"
              >
                {mounted ? t('footer.privacy') : 'Gizlilik'}
              </button>
              <span className="text-gray-500">|</span>
              <button
                onClick={() => setModalType('terms')}
                className="hover:text-white transition-colors"
              >
                {mounted ? t('footer.terms') : 'Koşullar'}
              </button>
            </div>
            <div className="flex items-center gap-4 sm:gap-6 flex-1 justify-end">
              {companyInfo.instagramUrl && (
                <a
                  href={companyInfo.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors"
                  aria-label="Instagram"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              )}
              {companyInfo.facebookUrl && (
                <a
                  href={companyInfo.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors"
                  aria-label="Facebook"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="border-t border-gray-700 pt-3 sm:pt-4">
          <div className="text-center text-xs sm:text-sm text-gray-400">
            <p>{mounted ? t('footer.copyright') : '© 2026 Epicê Buhara. Tüm hakları saklıdır.'}</p>
          </div>
        </div>
      </div>
      {modalType && (
        <TermsModal
          isOpen={modalType !== null}
          type={modalType}
          onClose={() => setModalType(null)}
        />
      )}
    </footer>
  );
}
