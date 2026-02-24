'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { showToast } from '@/components/Toast';

export type HeroBannerForm = {
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  discountLabel1: string;
  discountPercent: string;
  discountLabel2: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
};

const defaultForm: HeroBannerForm = {
  title: '',
  subtitle: '',
  buttonText: '',
  buttonLink: '',
  discountLabel1: '',
  discountPercent: '',
  discountLabel2: '',
};

export function HeroBannerModal({ open, onClose, onSaved }: Props) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState<HeroBannerForm>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      setLoading(true);
      fetch('/api/settings/hero-banner')
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            setForm(defaultForm);
            return;
          }
          setForm({
            title: data.title ?? '',
            subtitle: data.subtitle ?? '',
            buttonText: data.buttonText ?? '',
            buttonLink: data.buttonLink ?? '',
            discountLabel1: data.discountLabel1 ?? '',
            discountPercent: data.discountPercent != null ? String(data.discountPercent) : '',
            discountLabel2: data.discountLabel2 ?? '',
          });
        })
        .catch(() => setForm(defaultForm))
        .finally(() => setLoading(false));
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings/hero-banner', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title || null,
          subtitle: form.subtitle || null,
          buttonText: form.buttonText || null,
          buttonLink: form.buttonLink || null,
          discountLabel1: form.discountLabel1 || null,
          discountPercent: (() => {
            if (form.discountPercent === '') return null;
            const num = parseInt(form.discountPercent, 10);
            return Number.isNaN(num) ? null : Math.min(100, Math.max(0, num));
          })(),
          discountLabel2: form.discountLabel2 || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.error || (mounted ? t('admin.common.error') : 'Kaydedilemedi'), 'error');
        setSaving(false);
        return;
      }
      showToast(mounted ? t('admin.common.success') : 'Kaydedildi', 'success');
      onSaved?.();
      onClose();
    } catch {
      showToast(mounted ? t('admin.common.error') : 'Kaydedilemedi', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">
            {mounted ? t('admin.settings.heroBanner') : 'Ana Sayfa Banner'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
            aria-label="Kapat"
          >
            <span className="text-xl leading-none">×</span>
          </button>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Yükleniyor...</div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {mounted ? t('admin.settings.heroBannerTitle') : 'Başlık'}
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                placeholder="En İyi Fiyat Garantisi"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {mounted ? t('admin.settings.heroBannerSubtitle') : 'Alt başlık'}
              </label>
              <textarea
                value={form.subtitle}
                onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                rows={2}
                placeholder="Binlerce ürün çeşidi ile size en uygun fiyatları sunuyoruz"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {mounted ? t('admin.settings.heroBannerButtonText') : 'Buton metni'}
              </label>
              <input
                type="text"
                value={form.buttonText}
                onChange={(e) => setForm((f) => ({ ...f, buttonText: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                placeholder="Hemen Alışverişe Başla"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {mounted ? t('admin.settings.heroBannerButtonLink') : 'Buton linki (URL)'}
              </label>
              <input
                type="text"
                value={form.buttonLink}
                onChange={(e) => setForm((f) => ({ ...f, buttonLink: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                placeholder="/ veya /discounted-products"
              />
            </div>
            <div className="border-t border-gray-200 pt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">İndirim kutusu (sağ kutu)</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-0.5">
                    {mounted ? t('admin.settings.heroBannerDiscount1') : 'Üst metin'}
                  </label>
                  <input
                    type="text"
                    value={form.discountLabel1}
                    onChange={(e) => setForm((f) => ({ ...f, discountLabel1: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                    placeholder="Özel İndirimler"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-0.5">
                    {mounted ? t('admin.settings.heroBannerDiscountPercent') : 'Yüzde'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.discountPercent}
                    onChange={(e) => setForm((f) => ({ ...f, discountPercent: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                    placeholder="50"
                  />
                  <p className="text-xs text-gray-400 mt-0.5">Görüntü: %50&apos;ye Varan</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-0.5">
                    {mounted ? t('admin.settings.heroBannerDiscount2') : 'Alt metin'}
                  </label>
                  <input
                    type="text"
                    value={form.discountLabel2}
                    onChange={(e) => setForm((f) => ({ ...f, discountLabel2: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                    placeholder="İndirimler"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                {mounted ? t('admin.settings.cancel') : 'İptal'}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-4 py-2 bg-[#E91E63] text-white rounded-lg hover:bg-[#c2185b] disabled:opacity-60"
              >
                {saving ? (mounted ? t('admin.settings.saving') : 'Kaydediliyor...') : (mounted ? t('admin.settings.save') : 'Kaydet')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
