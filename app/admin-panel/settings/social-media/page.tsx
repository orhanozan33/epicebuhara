'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { showToast } from '@/components/Toast';

interface SocialMediaSettings {
  instagramUrl: string;
  facebookUrl: string;
}

export default function SosyalMedyaPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<SocialMediaSettings>({
    instagramUrl: '',
    facebookUrl: '',
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
          instagramUrl: data.instagramUrl || '',
          facebookUrl: data.facebookUrl || '',
        });
      } else {
        showToast(mounted ? t('admin.common.error') : 'Sosyal medya ayarları getirilirken hata oluştu', 'error');
      }
    } catch (error) {
      console.error('Error fetching social media settings:', error);
      showToast(mounted ? t('admin.common.error') : 'Sosyal medya ayarları getirilirken hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      // Mevcut firma ayarlarını getir
      const currentResponse = await fetch('/api/settings/company');
      const currentData = await currentResponse.json();
      
      // Sadece gerekli alanları gönder (id, createdAt, updatedAt gibi alanları hariç tut)
      const updateData = {
        companyName: currentData.companyName || '',
        address: currentData.address || '',
        phone: currentData.phone || '',
        email: currentData.email || '',
        postalCode: currentData.postalCode || '',
        tpsNumber: currentData.tpsNumber || '',
        tvqNumber: currentData.tvqNumber || '',
        instagramUrl: formData.instagramUrl,
        facebookUrl: formData.facebookUrl,
      };
      
      // Tüm ayarları güncelle (sadece sosyal medya değil)
      const response = await fetch('/api/settings/company', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        showToast(mounted ? t('admin.common.success') : 'Sosyal medya ayarları başarıyla kaydedildi!', 'success');
        await fetchSettings();
      } else {
        const error = await response.json();
        console.error('Error saving social media settings:', error);
        // Daha detaylı hata mesajı göster
        const errorMessage = error.details 
          ? `${error.error}: ${error.details}` 
          : (error.error || (mounted ? t('admin.common.error') : 'Sosyal medya ayarları kaydedilirken hata oluştu'));
        showToast(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Error saving social media settings:', error);
      showToast(mounted ? t('admin.common.error') : 'Sosyal medya ayarları kaydedilirken hata oluştu', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof SocialMediaSettings, value: string) => {
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
          <h2 className="text-2xl font-bold text-gray-900">{mounted ? t('admin.settings.socialMedia') : 'Sosyal Medya'}</h2>
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
        <h2 className="text-2xl font-bold text-gray-900">{mounted ? t('admin.settings.socialMedia') : 'Sosyal Medya'}</h2>
        <p className="text-sm text-gray-500 mt-1">{mounted ? 'Sosyal medya hesaplarınızın linklerini girin' : 'Sosyal medya hesaplarınızın linklerini girin'}</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="space-y-6">
          <div>
            <label htmlFor="instagramUrl" className="block text-sm font-medium text-gray-700 mb-2">
              Instagram URL
            </label>
            <input
              type="url"
              id="instagramUrl"
              value={formData.instagramUrl}
              onChange={(e) => handleChange('instagramUrl', e.target.value)}
              placeholder="https://instagram.com/hesabiniz"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
            />
          </div>

          <div>
            <label htmlFor="facebookUrl" className="block text-sm font-medium text-gray-700 mb-2">
              Facebook URL
            </label>
            <input
              type="url"
              id="facebookUrl"
              value={formData.facebookUrl}
              onChange={(e) => handleChange('facebookUrl', e.target.value)}
              placeholder="https://facebook.com/hesabiniz"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Link
            href="/admin-panel/settings"
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {mounted ? t('admin.common.cancel') : 'İptal'}
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-[#E91E63] text-white rounded-lg hover:bg-[#C2185B] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {saving ? (mounted ? t('admin.common.loading') : 'Kaydediliyor...') : (mounted ? t('admin.common.save') : 'Kaydet')}
          </button>
        </div>
      </form>
    </div>
  );
}
