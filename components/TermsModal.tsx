'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface TermsModalProps {
  isOpen: boolean;
  type: 'privacy' | 'terms';
  onClose: () => void;
}

export function TermsModal({ isOpen, type, onClose }: TermsModalProps) {
  const [mounted, setMounted] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const title = type === 'privacy' 
    ? (mounted ? t('footer.privacyPolicy') : 'Gizlilik Politikası')
    : (mounted ? t('footer.termsOfService') : 'Kullanım Koşulları');
  
  const content = type === 'privacy' ? (
    <div className="space-y-4">
      <p>
        {mounted ? t('footer.privacyIntro') : 'Bu gizlilik politikası, sitemizdeki bilgilerin nasıl toplandığını, kullanıldığını ve korunduğunu açıklamaktadır.'}
      </p>
      <h3 className="font-semibold text-lg mt-6">{mounted ? t('footer.informationCollection') : 'Bilgi Toplama'}</h3>
      <p>
        {mounted ? t('footer.privacyCollectionText') : 'Sitemizi ziyaret ettiğinizde, kişisel bilgileriniz (ad, e-posta, telefon numarası vb.) sipariş işlemleri için toplanabilir.'}
      </p>
      <h3 className="font-semibold text-lg mt-6">{mounted ? t('footer.informationUsage') : 'Bilgi Kullanımı'}</h3>
      <p>
        {mounted ? t('footer.privacyUsageText') : 'Toplanan bilgiler, siparişlerinizi işlemek, müşteri hizmetleri sağlamak ve size daha iyi hizmet sunmak için kullanılır.'}
      </p>
      <h3 className="font-semibold text-lg mt-6">{mounted ? t('footer.informationSecurity') : 'Bilgi Güvenliği'}</h3>
      <p>
        {mounted ? t('footer.privacySecurityText') : 'Kişisel bilgilerinizin güvenliğini sağlamak için uygun teknik ve idari önlemler alınmaktadır.'}
      </p>
    </div>
  ) : (
    <div className="space-y-4">
      <p>
        {mounted ? t('footer.termsIntro') : 'Bu kullanım koşulları, sitemizin kullanımı ile ilgili kuralları ve yükümlülükleri belirlemektedir.'}
      </p>
      <h3 className="font-semibold text-lg mt-6">{mounted ? t('footer.serviceUsage') : 'Hizmetlerin Kullanımı'}</h3>
      <p>
        {mounted ? t('footer.termsUsageText') : 'Sitemizi kullanarak, bu koşulları kabul etmiş sayılırsınız. Hizmetlerimizi yasalara uygun şekilde kullanmanız gerekmektedir.'}
      </p>
      <h3 className="font-semibold text-lg mt-6">{mounted ? t('footer.orders') : 'Siparişler'}</h3>
      <p>
        {mounted ? t('footer.termsOrdersText') : 'Siparişleriniz onaylandıktan sonra işleme alınır. Sipariş iptal ve iade koşulları ürün sayfasında belirtilmiştir.'}
      </p>
      <h3 className="font-semibold text-lg mt-6">{mounted ? t('footer.intellectualProperty') : 'Fikri Mülkiyet'}</h3>
      <p>
        {mounted ? t('footer.termsIntellectualPropertyText') : 'Sitedeki tüm içerikler, logolar ve markalar telif hakkı ile korunmaktadır. İzinsiz kullanımı yasaktır.'}
      </p>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={mounted ? t('footer.close') : 'Kapat'}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto p-6 text-gray-700">
          {content}
        </div>
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#E91E63] text-white rounded-lg hover:bg-[#C2185B] transition-colors"
          >
            {mounted ? t('footer.close') : 'Kapat'}
          </button>
        </div>
      </div>
    </div>
  );
}
