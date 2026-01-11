'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export function Header() {
  const [mounted, setMounted] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    setMounted(true);
    fetchCartCount();
    
    // Sepet güncellendiğinde badge'i güncelle
    const handleCartUpdate = () => {
      fetchCartCount();
    };
    
    // Custom event dinle
    window.addEventListener('cartUpdated', handleCartUpdate);
    
    // Her 3 saniyede bir sepet sayısını kontrol et (fallback)
    const interval = setInterval(fetchCartCount, 3000);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
      clearInterval(interval);
    };
  }, []);

  const fetchCartCount = async () => {
    try {
      const response = await fetch('/api/cart');
      if (response.ok) {
        const data = await response.json();
        const totalItems = data.items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0;
        setCartCount(totalItems);
      }
    } catch (error) {
      console.error('Error fetching cart count:', error);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b w-full">
      <div className="container mx-auto px-4 max-w-7xl w-full">
        {/* Üst Bar */}
        <div className="flex items-center justify-between py-2 text-xs sm:text-sm border-b">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <LanguageSwitcher />
            <a href="tel:+15147267067" className="whitespace-nowrap !text-black font-medium text-xs sm:text-sm phone-number-black" style={{ color: '#000000' }}>📞 +1 (514) 726-7067</a>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <Link href="/order-tracking" className="hover:text-[#E91E63] whitespace-nowrap text-xs sm:text-sm">
              {mounted ? t('header.myOrders') : 'Siparişlerim'}
            </Link>
          </div>
        </div>

        {/* Ana Header */}
        <div className="flex items-center justify-between py-3 sm:py-4 gap-2 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-6 min-w-0 flex-1">
            <Link href="/" className="text-lg sm:text-xl md:text-2xl font-bold text-[#E91E63] whitespace-nowrap flex-shrink-0">
              {mounted ? t('header.title') : 'Epice Buhara'}
            </Link>
            <nav className="hidden lg:flex items-center gap-6 text-gray-700 min-w-0">
              <Link href="/" className="hover:text-[#E91E63] font-medium transition-colors whitespace-nowrap">
                {mounted ? t('header.allProducts') : 'Tüm Ürünler'}
              </Link>
              <Link href="/discounted-products" className="hover:text-[#E91E63] font-medium transition-colors whitespace-nowrap">
                {mounted ? t('header.discountedProducts') : 'İndirimli Ürünler'}
              </Link>
              <Link href="/new-products" className="hover:text-[#E91E63] font-medium transition-colors whitespace-nowrap">
                {mounted ? t('header.newProducts') : 'Yeni Ürünler'}
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <Link href="/cart" className="relative p-1.5 sm:p-2 text-gray-700 hover:text-[#E91E63] transition-colors">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 bg-[#E91E63] text-white text-[10px] sm:text-xs font-bold rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
