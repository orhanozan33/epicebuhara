'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { showToast } from '@/components/Toast';
import { getProductImageSrc } from '@/lib/imageUrl';

interface CartItem {
  id: number;
  productId: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    baseName?: string;
    slug: string;
    price: string;
    comparePrice?: string;
    images?: string;
    weight?: string;
    unit?: string;
  } | null;
}

export default function SepetPage() {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/cart');
      if (response.ok) {
        const data = await response.json();
        setCartItems(data.items || []);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (cartItemId: number) => {
    try {
      const response = await fetch(`/api/cart/${cartItemId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showToast(mounted ? t('cart.removeFromCart') : 'Ürün sepetten kaldırıldı', 'success');
        fetchCart();
        window.dispatchEvent(new Event('cartUpdated'));
      } else {
        showToast(mounted ? t('cart.removeError') : 'Ürün kaldırılırken hata oluştu', 'error');
      }
    } catch (error) {
      console.error('Error removing item:', error);
      showToast(mounted ? t('cart.removeError') : 'Ürün kaldırılırken hata oluştu', 'error');
    }
  };

  const handleUpdateQuantity = async (cartItemId: number, newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemoveItem(cartItemId);
      return;
    }

    try {
      const response = await fetch(`/api/cart/${cartItemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity: newQuantity }),
      });

      if (response.ok) {
        fetchCart();
        window.dispatchEvent(new Event('cartUpdated'));
      } else {
        showToast(mounted ? t('cart.quantityUpdateError') : 'Miktar güncellenirken hata oluştu', 'error');
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      showToast(mounted ? t('cart.quantityUpdateError') : 'Miktar güncellenirken hata oluştu', 'error');
    }
  };


  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => {
      if (item.product?.price) {
        return total + parseFloat(item.product.price) * item.quantity;
      }
      return total;
    }, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal(); // Vergi yok
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <p className="text-gray-600">{mounted ? t('products.loading') : 'Yükleniyor...'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">{mounted ? t('cart.title') : 'Sepetim'}</h1>
          <div className="bg-white border border-gray-200 rounded-lg p-8 sm:p-12 text-center">
            <p className="text-base sm:text-lg text-gray-600">{mounted ? t('cart.empty') : 'Sepetiniz şu anda boş.'}</p>
            <Link
              href="/"
              className="mt-6 inline-block bg-[#E91E63] text-white px-6 py-3 rounded-lg hover:bg-[#C2185B] transition-colors"
            >
              {mounted ? t('home.startShopping') : 'Alışverişe Başla'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">{mounted ? t('cart.title') : 'Sepetim'}</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Sol Taraf - Sepet Ürünleri */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            {cartItems.map((item) => {
              if (!item.product) return null;
              return (
                <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:gap-4">
                  {/* Ürün Resmi */}
                  {item.product.images && (
                    <div className="w-full sm:w-24 h-32 sm:h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={getProductImageSrc(item.product.images)}
                        alt={item.product.baseName || item.product.name}
                        className="w-full h-full object-contain p-1 sm:p-2"
                      />
                    </div>
                  )}
                  
                  {/* Ürün Bilgileri */}
                  <div className="flex-1 min-w-0">
                    <Link href={`/product/${item.product.slug}`}>
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1 sm:mb-2 hover:text-[#E91E63] transition-colors">
                        {item.product.baseName || item.product.name}
                      </h3>
                    </Link>
                    
                    <div className="flex items-center gap-2 sm:gap-4 mb-2 sm:mb-3">
                      <div className="flex items-center border border-gray-300 rounded-lg">
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          className="px-2 sm:px-3 py-1 sm:py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                        >
                          −
                        </button>
                        <span className="px-2 sm:px-4 py-1 sm:py-1.5 text-sm sm:text-base font-medium text-gray-900 min-w-[2.5rem] sm:min-w-[3rem] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          className="px-2 sm:px-3 py-1 sm:py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                        >
                          +
                        </button>
                      </div>
                      
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-red-600 hover:text-red-800 text-xs sm:text-sm font-medium transition-colors"
                      >
                        {mounted ? t('admin.common.delete') : 'Kaldır'}
                      </button>
                    </div>
                    
                    {/* Fiyat Bilgisi - Gizlendi */}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Sağ Taraf - Sipariş Özeti */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 sticky top-4">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">{mounted ? t('cart.orderSummary') : 'Sipariş Özeti'}</h2>
                
                {/* Fiyat Bilgileri - Gizlendi */}
                {false && (
                  <div className="space-y-2 sm:space-y-3 mb-4">
                    <div className="flex justify-between text-gray-600 text-sm sm:text-base">
                      <span>{mounted ? t('cart.subtotal') : 'Ara Toplam'}</span>
                      <span>${calculateSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-3 flex justify-between text-base sm:text-lg font-bold text-gray-900">
                      <span>{mounted ? t('cart.total') : 'Toplam'}</span>
                      <span>${calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                )}
                
                <div className="mb-4">
                  <p className="text-sm sm:text-base text-gray-600 text-center mb-3">
                    {mounted ? 'Fiyat teklifi almak için siparişi tamamlayın' : 'Fiyat teklifi almak için siparişi tamamlayın'}
                  </p>
                </div>
                
                <Link
                  href="/order"
                  className="block w-full px-4 py-2.5 sm:py-3 bg-[#E91E63] text-white font-medium rounded-lg hover:bg-[#C2185B] transition-colors text-center text-sm sm:text-base"
                >
                  {mounted ? 'Fiyat Teklifi Al' : 'Fiyat Teklifi Al'}
                </Link>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}
