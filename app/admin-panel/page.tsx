'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

export default function LoginPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('admin-auth', 'true');
          localStorage.setItem('admin-login-time', Date.now().toString());
        }
        router.push('/admin-panel/dashboard');
      } else {
        setError(data.error || (mounted ? t('admin.login.failed') : 'Giriş başarısız'));
      }
    } catch {
      setError(mounted ? t('admin.login.error') : 'Giriş sırasında hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="bg-white p-5 w-full max-w-xs shadow-lg rounded-lg border border-gray-200">
        <div className="text-center mb-5">
          <h1 className="text-xl font-bold text-gray-900 mb-1.5">{mounted ? t('admin.login.title') : 'Admin Giriş'}</h1>
          <p className="text-xs text-gray-600">{mounted ? t('admin.login.pleaseEnter') : 'Lütfen giriş bilgilerinizi girin'}</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 mb-3 text-xs rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {mounted ? t('admin.login.username') : 'Kullanıcı Adı'}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63] focus:border-transparent disabled:bg-gray-100"
              placeholder={mounted ? t('admin.login.usernamePlaceholder') : 'Kullanıcı adı'}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {mounted ? t('admin.login.password') : 'Şifre'}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63] focus:border-transparent disabled:bg-gray-100"
              placeholder={mounted ? t('admin.login.passwordPlaceholder') : 'Şifre'}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#E91E63] text-white py-2 text-sm font-semibold rounded-lg hover:bg-[#C2185B] transition-colors disabled:bg-gray-400"
          >
            {loading ? (mounted ? t('admin.login.loggingIn') : 'Giriş yapılıyor...') : (mounted ? t('admin.login.submit') : 'Giriş Yap')}
          </button>
        </form>
      </div>
    </div>
  );
}
