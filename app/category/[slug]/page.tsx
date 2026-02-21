'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Products } from '@/app/components/Products';
import { Categories } from '@/app/components/Categories';

export default function CategoryPage() {
  const params = useParams();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [slug, setSlug] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let isActive = true;
    
    const resolveParams = async () => {
      try {
        let resolvedParams: any = params;
        
        if (params && typeof params === 'object' && 'then' in params && typeof (params as any).then === 'function') {
          resolvedParams = await params;
        }
        
        const slugParam = resolvedParams?.slug ? String(resolvedParams.slug).trim() : null;
        
        if (!isActive) return;
        setSlug(slugParam);
        if (!slugParam) {
          setCategoryId(null);
        }
        
        // Slug'a göre kategori ID'sini bul (büyük/küçük harf duyarsız)
        if (slugParam) {
          try {
            const response = await fetch('/api/categories');
            if (!isActive) return;
            if (response.ok) {
              const categories = await response.json();
              const slugLower = slugParam.toLowerCase();
              const category = Array.isArray(categories)
                ? categories.find((cat: any) => (cat.slug || '').toString().trim().toLowerCase() === slugLower)
                : null;
              if (isActive) {
                setCategoryId(category ? String(category.id) : null);
              }
            } else {
              setCategoryId(null);
            }
          } catch (error) {
            console.error('Error fetching categories:', error);
            if (isActive) setCategoryId(null);
          }
        }
      } catch (error: any) {
        console.error('Error resolving params:', error);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };
    
    resolveParams();
    
    return () => {
      isActive = false;
    };
  }, [params]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 max-w-7xl">
          <div className="text-center text-gray-500 text-sm sm:text-base">{mounted ? t('categories.loading') : 'Yükleniyor...'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
            <Categories />
          </aside>
          {/* Sağ: Ürünler */}
          <main className="lg:w-4/5">
            <Products key={categoryId ?? 'all'} categoryId={categoryId} />
          </main>
        </div>
      </div>
    </div>
  );
}
