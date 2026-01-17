'use client';

import Link from 'next/link';
import { Products } from '../components/Products';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// CategoriesFilter component'i önce tanımlanmalı
function CategoriesFilter({ onCategorySelect, selectedCategory }: { onCategorySelect: (id: string | null) => void; selectedCategory: string | null }) {
  const [mounted, setMounted] = useState(false);
  const { t, i18n } = useTranslation();
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false); // Mobilde accordion için

  useEffect(() => {
    setMounted(true);
    async function loadCategories() {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          setCategoriesList(data);
        }
      } catch (error) {
        console.error('Error loading categories:', error);
      } finally {
        setLoading(false);
      }
    }
    loadCategories();
  }, []);

  // Dil değişikliğini dinle
  useEffect(() => {
    // i18n.language değiştiğinde component yeniden render olacak
  }, [i18n?.language]);

  const handleCategorySelect = (categoryId: string | null) => {
    onCategorySelect(categoryId);
    setIsOpen(false); // Kategori seçildiğinde kapat
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full lg:pointer-events-none lg:cursor-default"
      >
        <div className="p-4 bg-gradient-to-r from-[#E91E63] to-[#C2185B] flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">{mounted ? t('categories.title') : 'Kategoriler'}</h2>
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
      <div className={`p-3 lg:block ${isOpen ? 'block' : 'hidden'}`}>
        {loading ? (
          <div className="py-4 text-center">
            <p className="text-sm text-gray-500">{mounted ? t('categories.loading') : 'Yükleniyor...'}</p>
          </div>
        ) : (
          <ul className="space-y-1">
            <li>
              <button
                onClick={() => handleCategorySelect(null)}
                className={`w-full text-left px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  selectedCategory === null
                    ? 'bg-[#E91E63] text-white shadow-md'
                    : 'text-gray-700 hover:bg-[#E91E63]/10 hover:text-[#E91E63]'
                }`}
              >
                {mounted ? t('categories.allCategories') : 'Tüm Kategoriler'}
              </button>
            </li>
            {categoriesList.map((category) => {
              // Dil değişikliğine göre kategori ismini seç
              const currentLang = mounted && i18n?.language ? i18n.language.split('-')[0] : 'tr';
              const categoryName = (currentLang === 'fr' && category.nameFr) 
                ? category.nameFr 
                : (currentLang === 'en' && category.nameEn) 
                  ? category.nameEn 
                  : category.name;
              
              return (
                <li key={category.id}>
                  <button
                    onClick={() => handleCategorySelect(category.id.toString())}
                    className={`w-full text-left px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                      selectedCategory === category.id.toString()
                        ? 'bg-[#E91E63] text-white shadow-md'
                        : 'text-gray-700 hover:bg-[#E91E63]/10 hover:text-[#E91E63]'
                    }`}
                  >
                    {categoryName}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function IndirimliUrunlerPage() {
  const [mounted, setMounted] = useState(false);
  const { t } = useTranslation();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    // URL'den categoryId parametresini oku
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const categoryId = params.get('categoryId');
      setSelectedCategory(categoryId);
    }
  }, []);

  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    if (categoryId) {
      router.push(`/discounted-products?categoryId=${categoryId}`);
    } else {
      router.push('/discounted-products');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 max-w-7xl">
        {/* Mobil Navigasyon Linkleri - Kategoriler Üstünde */}
        <nav className="lg:hidden flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 text-gray-700 overflow-x-auto pb-2">
          <Link href="/" className="hover:text-[#E91E63] font-medium transition-colors whitespace-nowrap text-xs sm:text-sm px-2 py-1 rounded hover:bg-gray-100">
            {mounted ? t('header.allProducts') : 'Tüm Ürünler'}
          </Link>
          <Link href="/discounted-products" className="hover:text-[#E91E63] font-medium transition-colors whitespace-nowrap text-xs sm:text-sm px-2 py-1 rounded hover:bg-gray-100">
            {mounted ? t('header.discountedProducts') : 'İndirimli Ürünler'}
          </Link>
          <Link href="/new-products" className="hover:text-[#E91E63] font-medium transition-colors whitespace-nowrap text-xs sm:text-sm px-2 py-1 rounded hover:bg-gray-100">
            {mounted ? t('header.newProducts') : 'Yeni Ürünler'}
          </Link>
        </nav>
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          {/* Sol: Kategoriler */}
          <aside className="lg:w-1/5">
            <CategoriesFilter onCategorySelect={handleCategorySelect} selectedCategory={selectedCategory} />
          </aside>
          {/* Sağ: Ürünler */}
          <main className="lg:w-4/5">
            <Products categoryId={selectedCategory} discounted={true} />
          </main>
        </div>
      </div>
    </div>
  );
}
