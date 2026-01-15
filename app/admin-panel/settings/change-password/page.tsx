'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { showToast } from '@/components/Toast';

export default function ChangePasswordPage() {
  const [mounted, setMounted] = useState(false);
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    newUsername: '',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validasyonlar
      if (!formData.currentPassword) {
        setError(mounted ? t('admin.settings.currentPasswordRequired') || 'Mevcut şifre gerekli' : 'Mevcut şifre gerekli');
        setLoading(false);
        return;
      }

      if (!formData.newPassword && !formData.newUsername) {
        setError(mounted ? t('admin.settings.newPasswordOrUsernameRequired') || 'Yeni şifre veya kullanıcı adı belirtilmelidir' : 'Yeni şifre veya kullanıcı adı belirtilmelidir');
        setLoading(false);
        return;
      }

      if (formData.newPassword && formData.newPassword.length < 6) {
        setError(mounted ? t('admin.settings.passwordMinLength') || 'Yeni şifre en az 6 karakter olmalıdır' : 'Yeni şifre en az 6 karakter olmalıdır');
        setLoading(false);
        return;
      }

      if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
        setError(mounted ? t('admin.settings.passwordsDoNotMatch') || 'Yeni şifreler eşleşmiyor' : 'Yeni şifreler eşleşmiyor');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword || undefined,
          newUsername: formData.newUsername || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast(
          mounted ? t('admin.settings.passwordChanged') || 'Kullanıcı adı ve/veya şifre başarıyla güncellendi' : 'Kullanıcı adı ve/veya şifre başarıyla güncellendi',
          'success'
        );
        // Formu temizle
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
          newUsername: '',
        });
        // Ayarlar sayfasına dön
        setTimeout(() => {
          router.push('/admin-panel/settings');
        }, 1500);
      } else {
        setError(data.error || (mounted ? t('admin.common.error') : 'Bir hata oluştu'));
      }
    } catch (error: any) {
      console.error('Error changing password:', error);
      setError(mounted ? t('admin.common.error') : 'Şifre değiştirilirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full overflow-x-hidden min-w-0 box-border" style={{ maxWidth: '100%', overflowX: 'hidden', width: '100%' }}>
      <div className="mb-4 lg:mb-6">
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
        >
          <span>←</span>
          <span>{mounted ? t('admin.common.back') || 'Geri' : 'Geri'}</span>
        </button>
        <h2 className="text-lg lg:text-2xl font-bold text-gray-900">
          {mounted ? t('admin.settings.changePassword') || 'Kullanıcı Adı ve Şifre Değiştir' : 'Kullanıcı Adı ve Şifre Değiştir'}
        </h2>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 mb-6 rounded">
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {mounted ? t('admin.settings.currentPassword') || 'Mevcut Şifre' : 'Mevcut Şifre'} *
            </label>
            <input
              type="password"
              value={formData.currentPassword}
              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
              placeholder={mounted ? t('admin.settings.enterCurrentPassword') || 'Mevcut şifrenizi girin' : 'Mevcut şifrenizi girin'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {mounted ? t('admin.settings.newUsername') || 'Yeni Kullanıcı Adı (Opsiyonel)' : 'Yeni Kullanıcı Adı (Opsiyonel)'}
            </label>
            <input
              type="text"
              value={formData.newUsername}
              onChange={(e) => setFormData({ ...formData, newUsername: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
              placeholder={mounted ? t('admin.settings.enterNewUsername') || 'Yeni kullanıcı adı girin' : 'Yeni kullanıcı adı girin'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {mounted ? t('admin.settings.newPassword') || 'Yeni Şifre (Opsiyonel)' : 'Yeni Şifre (Opsiyonel)'}
            </label>
            <input
              type="password"
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
              placeholder={mounted ? t('admin.settings.enterNewPassword') || 'Yeni şifre girin (min 6 karakter)' : 'Yeni şifre girin (min 6 karakter)'}
            />
          </div>

          {formData.newPassword && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {mounted ? t('admin.settings.confirmPassword') || 'Yeni Şifre Tekrar' : 'Yeni Şifre Tekrar'} *
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required={!!formData.newPassword}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
                placeholder={mounted ? t('admin.settings.confirmNewPassword') || 'Yeni şifreyi tekrar girin' : 'Yeni şifreyi tekrar girin'}
              />
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-[#E91E63] text-white font-medium rounded-lg hover:bg-[#C2185B] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading 
                ? (mounted ? t('admin.common.saving') || 'Kaydediliyor...' : 'Kaydediliyor...')
                : (mounted ? t('admin.common.save') || 'Kaydet' : 'Kaydet')
              }
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
            >
              {mounted ? t('admin.common.cancel') || 'İptal' : 'İptal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
