'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';

export default function AyarlarPage() {
  const [mounted, setMounted] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="w-full overflow-x-hidden min-w-0 box-border" style={{ maxWidth: '100%', overflowX: 'hidden', width: '100%' }}>
      <h2 className="text-lg lg:text-2xl font-bold text-gray-900 mb-2 lg:mb-6">{mounted ? t('admin.settings.title') : 'Ayarlar'}</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 lg:gap-6">
        <Link
          href="/admin-panel/settings/company-info"
          className="bg-white border border-gray-200 rounded-lg p-3 lg:p-6 hover:shadow-lg transition-shadow cursor-pointer"
        >
          <div className="flex items-center gap-3 lg:gap-4">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-[#E91E63] bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-xl lg:text-2xl">🏢</span>
            </div>
            <div className="min-w-0">
              <h3 className="text-sm lg:text-lg font-semibold text-gray-900">{mounted ? t('admin.settings.companyInfo') : 'Firma Bilgileri'}</h3>
              <p className="text-xs lg:text-sm text-gray-500 mt-0.5 lg:mt-1">{mounted ? (t('admin.settings.companyInfo') + ' ' + t('admin.settings.edit')) : 'Firma bilgilerini düzenle'}</p>
            </div>
          </div>
        </Link>
        <Link
          href="/admin-panel/settings/social-media"
          className="bg-white border border-gray-200 rounded-lg p-3 lg:p-6 hover:shadow-lg transition-shadow cursor-pointer"
        >
          <div className="flex items-center gap-3 lg:gap-4">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-[#E91E63] bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-xl lg:text-2xl">📱</span>
            </div>
            <div className="min-w-0">
              <h3 className="text-sm lg:text-lg font-semibold text-gray-900">{mounted ? t('admin.settings.socialMedia') : 'Sosyal Medya'}</h3>
              <p className="text-xs lg:text-sm text-gray-500 mt-0.5 lg:mt-1">{mounted ? (t('admin.settings.socialMedia') + ' ' + t('admin.settings.editLinks')) : 'Sosyal medya linklerini düzenle'}</p>
            </div>
          </div>
        </Link>
        <Link
          href="/admin-panel/settings/change-password"
          className="bg-white border border-gray-200 rounded-lg p-3 lg:p-6 hover:shadow-lg transition-shadow cursor-pointer"
        >
          <div className="flex items-center gap-3 lg:gap-4">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-[#E91E63] bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-xl lg:text-2xl">🔐</span>
            </div>
            <div className="min-w-0">
              <h3 className="text-sm lg:text-lg font-semibold text-gray-900">{mounted ? t('admin.settings.changePassword') || 'Kullanıcı Adı ve Şifre' : 'Kullanıcı Adı ve Şifre'}</h3>
              <p className="text-xs lg:text-sm text-gray-500 mt-0.5 lg:mt-1">{mounted ? t('admin.settings.changePasswordDesc') || 'Kullanıcı adı ve şifrenizi değiştirin' : 'Kullanıcı adı ve şifrenizi değiştirin'}</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
