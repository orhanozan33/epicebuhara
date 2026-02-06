'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { showToast } from '@/components/Toast';

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

export default function SiparisPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { t } = useTranslation();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutForm, setCheckoutForm] = useState({
    firstName: '',
    lastName: '',
    province: '',
    city: '',
    address: '',
    phone: '',
    email: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Kanada eyaletleri ve şehirleri
  const provinceCities: { [key: string]: string[] } = {
    'QC': ['Montreal', 'Quebec City', 'Laval', 'Gatineau', 'Longueuil', 'Sherbrooke', 'Saguenay', 'Lévis', 'Trois-Rivières', 'Terrebonne'],
    'ON': ['Toronto', 'Ottawa', 'Mississauga', 'Brampton', 'Hamilton', 'London', 'Markham', 'Vaughan', 'Kitchener', 'Windsor'],
    'BC': ['Vancouver', 'Surrey', 'Burnaby', 'Richmond', 'Langley', 'Abbotsford', 'Coquitlam', 'Kelowna', 'Victoria', 'Nanaimo'],
    'AB': ['Calgary', 'Edmonton', 'Red Deer', 'Lethbridge', 'St. Albert', 'Medicine Hat', 'Grande Prairie', 'Airdrie', 'Spruce Grove', 'Leduc'],
    'MB': ['Winnipeg', 'Brandon', 'Steinbach', 'Thompson', 'Portage la Prairie', 'Winkler', 'Selkirk', 'Dauphin', 'Morden', 'Flin Flon'],
    'SK': ['Saskatoon', 'Regina', 'Prince Albert', 'Moose Jaw', 'Swift Current', 'Yorkton', 'North Battleford', 'Estevan', 'Weyburn', 'Melfort'],
    'NS': ['Halifax', 'Dartmouth', 'Sydney', 'Truro', 'New Glasgow', 'Glace Bay', 'Kentville', 'Amherst', 'Bridgewater', 'Yarmouth'],
    'NB': ['Saint John', 'Moncton', 'Fredericton', 'Dieppe', 'Miramichi', 'Riverview', 'Edmundston', 'Bathurst', 'Campbellton', 'Oromocto'],
    'NL': ['St. John\'s', 'Mount Pearl', 'Corner Brook', 'Conception Bay South', 'Grand Falls-Windsor', 'Gander', 'Happy Valley-Goose Bay', 'Labrador City', 'Stephenville', 'Portugal Cove-St. Philip\'s'],
    'PE': ['Charlottetown', 'Summerside', 'Stratford', 'Cornwall', 'Montague', 'Kensington', 'Souris', 'Alberton', 'Tignish', 'Georgetown'],
    'NT': ['Yellowknife', 'Hay River', 'Inuvik', 'Fort Smith', 'Behchokò', 'Fort Simpson', 'Tuktoyaktuk', 'Norman Wells', 'Rankin Inlet', 'Iqaluit'],
    'YT': ['Whitehorse', 'Dawson City', 'Watson Lake', 'Haines Junction', 'Carmacks', 'Faro', 'Ross River', 'Mayo', 'Teslin', 'Old Crow'],
    'NU': ['Iqaluit', 'Rankin Inlet', 'Arviat', 'Baker Lake', 'Cambridge Bay', 'Igloolik', 'Pangnirtung', 'Pond Inlet', 'Kugluktuk', 'Cape Dorset'],
  };

  const canadianProvinces = [
    { value: 'QC', label: 'Quebec' },
    { value: 'ON', label: 'Ontario' },
    { value: 'BC', label: 'British Columbia' },
    { value: 'AB', label: 'Alberta' },
    { value: 'MB', label: 'Manitoba' },
    { value: 'SK', label: 'Saskatchewan' },
    { value: 'NS', label: 'Nova Scotia' },
    { value: 'NB', label: 'New Brunswick' },
    { value: 'NL', label: 'Newfoundland and Labrador' },
    { value: 'PE', label: 'Prince Edward Island' },
    { value: 'NT', label: 'Northwest Territories' },
    { value: 'YT', label: 'Yukon' },
    { value: 'NU', label: 'Nunavut' },
  ];

  const getCitiesForProvince = (province: string) => {
    return provinceCities[province] || [];
  };

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
        
        if (data.items.length === 0) {
          router.push('/cart');
        }
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSubtotal = () => {
    // Fiyat hesaplaması gizlendi - sadece backend için gerekli
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

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!checkoutForm.firstName || !checkoutForm.lastName || !checkoutForm.province || 
        !checkoutForm.city || !checkoutForm.address || !checkoutForm.phone || !checkoutForm.email) {
      showToast(mounted ? t('checkout.fillAllFields') : 'Lütfen tüm alanları doldurun', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const subtotal = calculateSubtotal();
      const total = subtotal; // Vergi yok

      const orderData = {
        cartItems: cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.product?.price || '0',
        })),
        shippingName: `${checkoutForm.firstName} ${checkoutForm.lastName}`,
        shippingPhone: checkoutForm.phone,
        shippingEmail: checkoutForm.email,
        shippingAddress: checkoutForm.address,
        shippingProvince: checkoutForm.province,
        shippingCity: checkoutForm.city,
        subtotal: subtotal.toFixed(2),
        tax: '0.00',
        tps: '0.00',
        tvq: '0.00',
        shipping: '0.00',
        total: total.toFixed(2),
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        const order = await response.json();
        showToast(mounted ? t('checkout.orderCreated') : 'Siparişiniz başarıyla oluşturuldu!', 'success');
        for (const item of cartItems) {
          try {
            const deleteResponse = await fetch(`/api/cart/${item.id}`, { method: 'DELETE' });
            if (!deleteResponse.ok) {
              console.warn(`Sepet öğesi ${item.id} silinemedi:`, deleteResponse.status);
            }
          } catch (error) {
            console.error(`Sepet öğesi ${item.id} silinirken hata:`, error);
          }
        }
        window.dispatchEvent(new Event('cartUpdated'));
        router.push(`/order-tracking?orderNumber=${order.order.orderNumber}`);
      } else {
        const error = await response.json();
        showToast(error.error || (mounted ? t('checkout.orderError') : 'Sipariş oluşturulurken hata oluştu'), 'error');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      showToast(mounted ? t('checkout.orderError') : 'Sipariş oluşturulurken hata oluştu', 'error');
    } finally {
      setSubmitting(false);
    }
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
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-6">
          <Link href="/cart" className="text-gray-600 hover:text-[#E91E63] flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {mounted ? t('checkout.backToCart') : 'Sepete Dön'}
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-6">{mounted ? t('checkout.title') : 'Sipariş Bilgileri'}</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sol Taraf - Form */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <form onSubmit={handleCheckout} className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">{mounted ? t('checkout.deliveryInfo') : 'Teslimat Bilgileri'}</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {mounted ? t('checkout.firstName') : 'Ad'} *
                      </label>
                      <input
                        type="text"
                        value={checkoutForm.firstName}
                        onChange={(e) => setCheckoutForm({ ...checkoutForm, firstName: e.target.value })}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {mounted ? t('checkout.lastName') : 'Soyad'} *
                      </label>
                      <input
                        type="text"
                        value={checkoutForm.lastName}
                        onChange={(e) => setCheckoutForm({ ...checkoutForm, lastName: e.target.value })}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {mounted ? t('checkout.province') : 'Eyalet'} *
                      </label>
                      <select
                        value={checkoutForm.province}
                        onChange={(e) => setCheckoutForm({ ...checkoutForm, province: e.target.value, city: '' })}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
                      >
                        <option value="">{mounted ? t('checkout.selectProvince') : 'Eyalet Seçin'}</option>
                        {canadianProvinces.map((province) => (
                          <option key={province.value} value={province.value}>
                            {province.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {mounted ? t('checkout.city') : 'Şehir'} *
                      </label>
                      <select
                        value={checkoutForm.city}
                        onChange={(e) => setCheckoutForm({ ...checkoutForm, city: e.target.value })}
                        required
                        disabled={!checkoutForm.province}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63] disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">
                          {checkoutForm.province ? (mounted ? t('checkout.selectCity') : 'Şehir Seçin') : (mounted ? t('checkout.selectCityFirst') : 'Önce Eyalet Seçin')}
                        </option>
                        {checkoutForm.province && getCitiesForProvince(checkoutForm.province).map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {mounted ? t('checkout.address') : 'Adres'} *
                    </label>
                    <textarea
                      value={checkoutForm.address}
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, address: e.target.value })}
                      required
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
                      placeholder={mounted ? t('checkout.addressPlaceholder') : 'Tam adres bilgisi'}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {mounted ? t('checkout.phone') : 'Telefon'} *
                      </label>
                      <input
                        type="tel"
                        value={checkoutForm.phone}
                        onChange={(e) => setCheckoutForm({ ...checkoutForm, phone: e.target.value })}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
                        placeholder={mounted ? t('checkout.phonePlaceholder') : '+1 (514) 123-4567'}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {mounted ? t('checkout.email') : 'E-posta'} *
                      </label>
                      <input
                        type="email"
                        value={checkoutForm.email}
                        onChange={(e) => setCheckoutForm({ ...checkoutForm, email: e.target.value })}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
                        placeholder={mounted ? t('checkout.emailPlaceholder') : 'ornek@email.com'}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-gray-200">
                  <Link
                    href="/cart"
                    className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-colors text-center"
                  >
                    {mounted ? t('checkout.back') : 'Geri Dön'}
                  </Link>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-3 bg-[#E91E63] text-white font-medium rounded-lg hover:bg-[#C2185B] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {submitting ? (mounted ? t('checkout.creatingOrder') : 'Sipariş Oluşturuluyor...') : 'Fiyat Teklifi Al'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Sağ Taraf - Sipariş Özeti */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{mounted ? t('checkout.orderSummary') : 'Sipariş Özeti'}</h2>
              
              {/* Sepet Ürünleri */}
              <div className="space-y-3 mb-4 max-h-[400px] overflow-y-auto">
                {cartItems.map((item) => {
                  if (!item.product) return null;
                  return (
                    <div key={item.id} className="flex gap-3 pb-3 border-b border-gray-100">
                      {item.product.images && (
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={item.product.images.split(',')[0].trim()}
                            alt={item.product.baseName || item.product.name}
                            className="w-full h-full object-contain p-1"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {item.product.baseName || item.product.name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {mounted ? t('cart.quantity') : 'Miktar'}: {item.quantity}
                        </p>
                        {/* Fiyat Bilgisi - Gizlendi */}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Fiyat Özeti - Tamamen Kaldırıldı */}
              
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 text-center mb-3">
                  {mounted ? 'Fiyat teklifi almak için siparişi onaylayın' : 'Fiyat teklifi almak için siparişi onaylayın'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
