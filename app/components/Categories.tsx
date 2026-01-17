'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';

export function Categories() {
  const [mounted, setMounted] = useState(false);
  const { t, i18n } = useTranslation();
  const pathname = usePathname();
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false); // Mobilde accordion için
  const [currentLanguage, setCurrentLanguage] = useState<string>('tr');

  useEffect(() => {
    setMounted(true);
    if (i18n?.language) {
      setCurrentLanguage(i18n.language.split('-')[0]);
    }
  }, []);

  useEffect(() => {
    async function loadCategories() {
      try {
        setLoading(true);
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          console.log('Categories loaded:', data?.length || 0, 'items');
          // Response'un array olup olmadığını kontrol et
          if (Array.isArray(data)) {
            setCategoriesList(data);
          } else {
            console.error('Invalid response format:', data);
            setCategoriesList([]);
          }
        } else {
          const errorText = await response.text();
          console.error('API error:', response.status, response.statusText, errorText);
          setCategoriesList([]);
        }
      } catch (error) {
        console.error('Error loading categories:', error);
        setCategoriesList([]);
      } finally {
        setLoading(false);
      }
    }
    loadCategories();
  }, []);

  // Dil değişikliğini dinle - component'i yeniden render et
  useEffect(() => {
    if (!i18n) return;
    
    const updateLanguage = () => {
      if (i18n.language) {
        setCurrentLanguage(i18n.language.split('-')[0]);
      }
    };
    
    // İlk yüklemede dil'i ayarla
    updateLanguage();
    
    // Dil değişikliğini dinle
    i18n.on('languageChanged', updateLanguage);
    
    return () => {
      i18n.off('languageChanged', updateLanguage);
    };
  }, [i18n]);

  const isActive = (slug: string | null) => {
    if (slug === null) {
      return pathname === '/';
    }
    return pathname === `/category/${slug}`;
  };

  const handleCategoryClick = () => {
    setIsOpen(false); // Kategori seçildiğinde kapat
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full lg:pointer-events-none lg:cursor-default"
      >
        <div className="p-3 sm:p-4 bg-gradient-to-r from-[#E91E63] to-[#C2185B] flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-white">{mounted ? t('categories.title') : 'Kategoriler'}</h2>
          <svg
            className={`w-5 h-5 text-white transition-transform lg:hidden ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      <div className={`p-2 sm:p-3 w-full lg:block ${isOpen ? 'block' : 'hidden'}`}>
        {loading ? (
          <div className="py-3 sm:py-4 text-center">
            <p className="text-xs sm:text-sm text-gray-500">{mounted ? t('categories.loading') : 'Yükleniyor...'}</p>
          </div>
        ) : categoriesList.length === 0 ? (
          <div className="py-3 sm:py-4 text-center">
            <p className="text-xs sm:text-sm text-gray-500">{mounted ? t('categories.notFound') : 'Kategori bulunamadı'}</p>
          </div>
        ) : (
          <ul className="space-y-1">
            <li>
              <Link 
                href="/"
                onClick={handleCategoryClick}
                className={`block px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                  isActive(null)
                    ? 'bg-[#E91E63] text-white shadow-md'
                    : 'text-gray-700 hover:bg-[#E91E63]/10 hover:text-[#E91E63]'
                }`}
              >
                {mounted ? t('categories.allCategories') : 'Tüm Kategoriler'}
              </Link>
            </li>
            {categoriesList.map((category) => {
              // Dil değişikliğine göre kategori ismini seç
              const categoryName = (currentLanguage === 'fr' && category.nameFr) 
                ? category.nameFr 
                : (currentLanguage === 'en' && category.nameEn) 
                  ? category.nameEn 
                  : category.name;
              
              return (
                <li key={category.id}>
                  <Link
                    href={`/category/${category.slug}`}
                    onClick={handleCategoryClick}
                    className={`block px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                      isActive(category.slug)
                        ? 'bg-[#E91E63] text-white shadow-md'
                        : 'text-gray-700 hover:bg-[#E91E63]/10 hover:text-[#E91E63]'
                    }`}
                  >
                    {categoryName}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
