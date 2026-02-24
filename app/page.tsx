'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Categories } from './components/Categories';
import { Products } from './components/Products';
import { useTranslation } from 'react-i18next';

type HeroSettings = {
  title: string | null;
  subtitle: string | null;
  buttonText: string | null;
  buttonLink: string | null;
  discountLabel1: string | null;
  discountPercent: number | null;
  discountLabel2: string | null;
};

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [hero, setHero] = useState<HeroSettings | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetch('/api/settings/hero-banner', { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } })
      .then((res) => res.json())
      .then((data) => {
        const hasAny =
          !data.error &&
          (data.title != null ||
            data.subtitle != null ||
            data.buttonText != null ||
            data.buttonLink != null ||
            data.discountLabel1 != null ||
            data.discountPercent != null ||
            data.discountLabel2 != null);
        if (hasAny) {
          setHero({
            title: data.title ?? null,
            subtitle: data.subtitle ?? null,
            buttonText: data.buttonText ?? null,
            buttonLink: data.buttonLink ?? null,
            discountLabel1: data.discountLabel1 ?? null,
            discountPercent: data.discountPercent ?? null,
            discountLabel2: data.discountLabel2 ?? null,
          });
        }
      })
      .catch(() => {});
  }, []);

  const heroTitle = (hero?.title?.trim() || '') || (mounted ? t('home.title') : 'En İyi Fiyat Garantisi');
  const heroSubtitle = (hero?.subtitle?.trim() || '') || (mounted ? t('home.subtitle') : 'Binlerce ürün çeşidi ile size en uygun fiyatları sunuyoruz');
  const heroButtonText = (hero?.buttonText?.trim() || '') || (mounted ? t('home.startShopping') : 'Hemen Alışverişe Başla');
  const heroButtonLink = hero?.buttonLink?.trim() || '/';
  const discount1 = (hero?.discountLabel1?.trim() || '') || (mounted ? t('home.specialDiscounts') : 'Özel İndirimler');
  const discountPercentVal = hero?.discountPercent;
  const discountMiddle =
    discountPercentVal != null ? `%${Number(discountPercentVal)}'ye Varan` : (mounted ? t('home.upTo50') : "%50'ye Varan");
  const discount2 = (hero?.discountLabel2?.trim() || '') || (mounted ? t('home.discounts') : 'İndirimler');

  return (
    <div className="min-h-screen bg-gray-50 w-full overflow-x-hidden">
      {/* Hero Section */}
      <div className="bg-[#E91E63] text-white relative overflow-hidden w-full">
        <div className="container mx-auto px-4 py-5 sm:py-8 max-w-7xl">
          <div className="flex flex-col lg:flex-row items-center gap-4 sm:gap-6">
            {/* Sol: Ana Mesaj */}
            <div className="flex-1 text-center lg:text-left min-w-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-1 sm:mb-2 break-words">{heroTitle}</h1>
              <p className="text-sm sm:text-base md:text-lg mb-3 sm:mb-4 text-white/90 break-words">{heroSubtitle}</p>
              <Link
                href={heroButtonLink}
                className="inline-block px-5 py-2 sm:px-6 sm:py-2.5 bg-white text-[#E91E63] font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg text-sm sm:text-base whitespace-nowrap"
              >
                {heroButtonText}
              </Link>
            </div>
            
            {/* Sağ: İndirim Kutusu */}
            <div className="bg-[#C2185B] rounded-xl p-1.5 sm:p-5 lg:p-6 text-center lg:text-left w-full lg:w-auto lg:min-w-[288px] flex-shrink-0">
              <div className="text-white space-y-0 sm:space-y-1.5 lg:space-y-1.5">
                <p className="text-[10px] sm:text-base font-medium">{discount1}</p>
                <p className="text-xs sm:text-xl lg:text-3xl font-bold">{discountMiddle}</p>
                <p className="text-[10px] sm:text-base font-medium">{discount2}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 max-w-7xl w-full">
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
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 w-full min-w-0">
          {/* Sol: Kategoriler */}
          <aside className="lg:w-1/5 flex-shrink-0 min-w-0">
            <Categories />
          </aside>
          {/* Sağ: Ürünler */}
          <main className="lg:w-4/5 flex-1 min-w-0">
            <Products />
          </main>
        </div>
      </div>
    </div>
  );
}
