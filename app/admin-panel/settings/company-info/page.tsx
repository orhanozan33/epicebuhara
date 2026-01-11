'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { showToast } from '@/components/Toast';

interface CompanySettings {
  id?: number;
  companyName: string;
  address: string;
  phone: string;
  email: string;
  postalCode: string;
  tpsNumber: string;
  tvqNumber: string;
}

export default function FirmaBilgileriPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<CompanySettings>({
    companyName: '',
    address: '',
    phone: '',
    email: '',
    postalCode: '',
    tpsNumber: '',
    tvqNumber: '',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings/company');
      if (response.ok) {
        const data = await response.json();
        setFormData({
          companyName: data.companyName || '',
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || '',
          postalCode: data.postalCode || '',
          tpsNumber: data.tpsNumber || '',
          tvqNumber: data.tvqNumber || '',
        });
      } else {
        showToast(mounted ? t('admin.common.error') : 'Firma bilgileri getirilirken hata oluştu', 'error');
      }
    } catch (error) {
      console.error('Error fetching company settings:', error);
      showToast(mounted ? t('admin.common.error') : 'Firma bilgileri getirilirken hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      const response = await fetch('/api/settings/company', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        showToast(mounted ? t('admin.common.success') : 'Firma bilgileri başarıyla kaydedildi!', 'success');
        await fetchSettings();
      } else {
        const error = await response.json();
        showToast(error.error || (mounted ? t('admin.common.error') : 'Firma bilgileri kaydedilirken hata oluştu'), 'error');
      }
    } catch (error) {
      console.error('Error saving company settings:', error);
      showToast(mounted ? t('admin.common.error') : 'Firma bilgileri kaydedilirken hata oluştu', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof CompanySettings, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return (
      <div>
        <div className="mb-6">
          <Link
            href="/admin-panel/settings"
            className="text-[#E91E63] hover:text-[#C2185B] mb-4 inline-block"
          >
            ← {mounted ? t('admin.settings.backToSettings') : 'Ayarlar\'a Dön'}
          </Link>
          <h2 className="text-2xl font-bold text-gray-900">{mounted ? t('admin.settings.companyInfo') : 'Firma Bilgileri'}</h2>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">{mounted ? t('admin.common.loading') : 'Yükleniyor...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin-panel/ayarlar"
          className="text-[#E91E63] hover:text-[#C2185B] mb-4 inline-block"
        >
          ← {mounted ? t('admin.settings.backToSettings') : 'Ayarlar\'a Dön'}
        </Link>
        <h2 className="text-2xl font-bold text-gray-900">{mounted ? t('admin.settings.companyInfo') : 'Firma Bilgileri'}</h2>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {mounted ? t('admin.dealers.companyName') : 'Firma İsmi'}
            </label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => handleChange('companyName', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
              placeholder={mounted ? t('admin.dealers.companyName') : 'Firma adını girin'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {mounted ? t('checkout.address') : 'Adres'}
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
              rows={3}
              placeholder={mounted ? t('checkout.addressPlaceholder') : 'Adres bilgilerini girin'}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {mounted ? t('admin.dealers.phone') : 'Telefon'}
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
                placeholder={mounted ? t('checkout.phonePlaceholder') : 'Telefon numarası'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {mounted ? t('admin.dealers.email') : 'E-posta'}
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
                placeholder={mounted ? t('checkout.emailPlaceholder') : 'E-posta adresi'}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Posta Kodu
            </label>
            <input
              type="text"
              value={formData.postalCode}
              onChange={(e) => handleChange('postalCode', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
              placeholder={mounted ? t('admin.invoices.postalCode') : 'Posta kodu'}
            />
          </div>

          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Vergi Bilgileri</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  TPS Numarası
                </label>
                <input
                  type="text"
                  value={formData.tpsNumber}
                  onChange={(e) => handleChange('tpsNumber', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
                  placeholder={mounted ? 'TPS numarası' : 'TPS numarası'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  TVQ Numarası
                </label>
                <input
                  type="text"
                  value={formData.tvqNumber}
                  onChange={(e) => handleChange('tvqNumber', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
                  placeholder={mounted ? 'TVQ numarası' : 'TVQ numarası'}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.push('/admin-panel/settings')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {mounted ? t('admin.common.cancel') : 'İptal'}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-[#E91E63] text-white rounded-lg hover:bg-[#C2185B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (mounted ? t('admin.common.loading') : 'Kaydediliyor...') : (mounted ? t('admin.common.save') : 'Kaydet')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
