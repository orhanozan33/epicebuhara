'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
        // Login başarılı - cookie otomatik olarak set edildi
        // localStorage'a da kaydet (client-side kontrol için)
        if (typeof window !== 'undefined') {
          localStorage.setItem('admin-auth', 'true');
          localStorage.setItem('admin-login-time', Date.now().toString());
        }
        router.push('/admin-panel/dashboard');
      } else {
        setError(data.error || 'Giriş başarısız');
      }
    } catch (error) {
      setError('Giriş sırasında hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="bg-white p-5 w-full max-w-xs shadow-lg rounded-lg border border-gray-200">
        <div className="text-center mb-5">
          <h1 className="text-xl font-bold text-gray-900 mb-1.5">Admin Giriş</h1>
          <p className="text-xs text-gray-600">Lütfen giriş bilgilerinizi girin</p>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 mb-3 text-xs rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Kullanıcı Adı
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63] focus:border-transparent disabled:bg-gray-100"
              placeholder="Kullanıcı adı"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Şifre
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63] focus:border-transparent disabled:bg-gray-100"
              placeholder="Şifre"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#E91E63] text-white py-2 text-sm font-semibold rounded-lg hover:bg-[#C2185B] transition-colors disabled:bg-gray-400"
          >
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>
      </div>
    </div>
  );
}
