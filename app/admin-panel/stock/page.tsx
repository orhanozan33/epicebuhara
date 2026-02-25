'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { showToast } from '@/components/Toast';
import styles from './stock.module.css';

type StockProduct = {
  id: number;
  name: string;
  baseName: string | null;
  baseNameFr: string | null;
  baseNameEn: string | null;
  slug: string | null;
  stockUnits: number;
  packSize: number;
  stockBoxes: number;
  isLowStock: boolean;
  categoryId: number | null;
  categoryName: string | null;
  categoryNameFr: string | null;
  categoryNameEn: string | null;
  isActive: boolean;
  packLabelTr: string | null;
  packLabelEn: string | null;
  packLabelFr: string | null;
};

type StockResponse = {
  products: StockProduct[];
  lowStockThresholdBoxes: number;
  lowStockCount: number;
};

export default function StokPage() {
  const { t, i18n } = useTranslation();
  const lang = (i18n?.language || 'tr').split('-')[0] as 'tr' | 'en' | 'fr';
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<StockResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'low' | 'ok'>('all');
  const [search, setSearch] = useState('');
  const [thresholdInput, setThresholdInput] = useState('');
  const [savingThreshold, setSavingThreshold] = useState(false);

  const fetchStock = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/stock', { cache: 'no-store' });
      const json = await res.json();
      if (res.ok && !json.error) {
        setData(json);
        setThresholdInput(String(json.lowStockThresholdBoxes ?? 10));
      } else {
        showToast(json.error || (mounted ? t('admin.common.error') : 'Yüklenemedi'), 'error');
      }
    } catch {
      showToast(mounted ? t('admin.common.error') : 'Yüklenemedi', 'error');
    } finally {
      setLoading(false);
    }
  }, [mounted, t]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  const saveThreshold = async () => {
    const num = parseInt(thresholdInput, 10);
    if (Number.isNaN(num) || num < 0) {
      showToast(mounted ? t('admin.stock.invalidThreshold') : 'Geçerli bir sayı girin (0 veya üzeri)', 'error');
      return;
    }
    setSavingThreshold(true);
    try {
      const res = await fetch('/api/admin/stock-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lowStockThresholdBoxes: num }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        showToast(mounted ? t('admin.common.success') : 'Kaydedildi', 'success');
        await fetchStock();
      } else {
        showToast(json.error || (mounted ? t('admin.common.error') : 'Kaydedilemedi'), 'error');
      }
    } catch {
      showToast(mounted ? t('admin.common.error') : 'Kaydedilemedi', 'error');
    } finally {
      setSavingThreshold(false);
    }
  };

  const list = data?.products ?? [];
  const threshold = data?.lowStockThresholdBoxes ?? 10;
  const lowCount = data?.lowStockCount ?? 0;
  const okCount = list.length - lowCount;

  const getProductDisplayName = (p: StockProduct) => {
    if (lang === 'fr') return p.baseNameFr || p.baseNameEn || p.baseName || p.name;
    if (lang === 'en') return p.baseNameEn || p.baseNameFr || p.baseName || p.name;
    return p.baseName || p.name;
  };
  const getCategoryDisplayName = (p: StockProduct) => {
    if (lang === 'fr') return p.categoryNameFr || p.categoryNameEn || p.categoryName || '—';
    if (lang === 'en') return p.categoryNameEn || p.categoryNameFr || p.categoryName || '—';
    return p.categoryName || '—';
  };
  const getPackLabel = (p: StockProduct) => {
    if (p.packSize <= 1) return lang === 'fr' ? (p.packLabelFr || 'Unité') : lang === 'en' ? (p.packLabelEn || 'Unit') : (p.packLabelTr || 'Adet');
    const count = p.packSize;
    if (lang === 'fr') return p.packLabelFr ? `${count} ${p.packLabelFr}` : t('admin.stock.packWithCount', { count });
    if (lang === 'en') return p.packLabelEn ? `${count} ${p.packLabelEn}` : t('admin.stock.packWithCount', { count });
    return p.packLabelTr ? `${count}'li ${p.packLabelTr}` : t('admin.stock.packWithCount', { count });
  };

  const filtered = useMemo(() => {
    let out = list;
    const q = search.trim().toLowerCase();
    if (q) {
      out = out.filter(
        (p) =>
          getProductDisplayName(p).toLowerCase().includes(q) ||
          getCategoryDisplayName(p).toLowerCase().includes(q)
      );
    }
    if (filter === 'low') out = out.filter((p) => p.isLowStock);
    if (filter === 'ok') out = out.filter((p) => !p.isLowStock);
    return out;
  }, [list, search, filter, lang]);

  const progressPct = (p: StockProduct) =>
    threshold > 0 ? Math.min(100, (p.stockBoxes / threshold) * 100) : 100;

  const dateStr = mounted
    ? new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  const lowStockList = useMemo(() => list.filter((p) => p.isLowStock), [list]);

  const handlePrint = useCallback(() => {
    if (lowStockList.length === 0) {
      showToast(mounted ? t('admin.stock.noLowStock') : 'Düşük stokta ürün yok.', 'info');
      return;
    }
    const title = t('admin.stock.printTitle');
    const subtitle = t('admin.stock.printSubtitle');
    const unitsShort = t('admin.stock.unitsShort');
    const boxesShort = t('admin.stock.boxesShort');
    const rows = lowStockList
      .map(
        (p, i) =>
          `<tr${p.isLowStock ? ' style="background:#FCEDE9;"' : ''}>
            <td>${String(i + 1).padStart(2, '0')}</td>
            <td>${getProductDisplayName(p).replace(/</g, '&lt;')}</td>
            <td>${getCategoryDisplayName(p).replace(/</g, '&lt;')}</td>
            <td>${p.stockUnits} ${unitsShort}</td>
            <td>${p.stockBoxes} ${boxesShort}</td>
            <td>${getPackLabel(p).replace(/</g, '&lt;')}</td>
            <td>${(p.isLowStock ? t('admin.stock.lowStock') : t('admin.stock.normal')).replace(/</g, '&lt;')}</td>
          </tr>`
      )
      .join('');
    const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 24px; color: #1a1a1a; font-size: 13px; }
    h1 { font-size: 22px; margin: 0 0 4px 0; }
    .subtitle { font-size: 14px; color: #666; margin-bottom: 8px; }
    .date { font-size: 12px; color: #888; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #ddd; padding: 10px 12px; text-align: left; }
    th { background: #f5f5f5; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
    tr:nth-child(even) { background: #fafafa; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p class="subtitle">${subtitle}</p>
  <p class="date">${dateStr}</p>
  <table>
    <thead>
      <tr>
        <th>${t('admin.stock.printNo').replace(/</g, '&lt;')}</th><th>${t('admin.stock.printProductName').replace(/</g, '&lt;')}</th><th>${t('admin.stock.printCategory').replace(/</g, '&lt;')}</th><th>${t('admin.stock.printStockUnits').replace(/</g, '&lt;')}</th><th>${t('admin.stock.printStockBoxes').replace(/</g, '&lt;')}</th><th>${t('admin.stock.printPackUnit').replace(/</g, '&lt;')}</th><th>${t('admin.stock.printStatus').replace(/</g, '&lt;')}</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
      w.focus();
      w.onafterprint = () => w.close();
      setTimeout(() => w.print(), 300);
    } else {
      showToast(mounted ? t('admin.stock.popupBlocked') : 'Pop-up engellendi. Yazdırma için tarayıcıda pop-up’lara izin verin.', 'error');
    }
  }, [lowStockList, dateStr, mounted, t]);

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap"
        rel="stylesheet"
      />
      <div className={styles.root}>
        <div className={styles.wrap}>
          <div className={styles.container}>
            <header className={styles.header}>
              <div>
                <div className={styles.eyebrow}>
                  {mounted ? t('admin.stock.title') : 'Stok'} {mounted ? t('admin.stock.managementSystem') : 'Yönetim Sistemi'}
                </div>
                <h1 className={styles.title}>
                  Epice Buhara
                  <br />
                  <em className={styles.titleEm}>Envanteri</em>
                </h1>
              </div>
              <div className={styles.headerRight}>
                <div className={styles.headerDate}>{dateStr}</div>
                <button type="button" onClick={handlePrint} className={styles.addBtn}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <polyline points="6 9 6 2 18 2 18 9" />
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  </svg>
                  {mounted ? t('admin.stock.print') : 'Yazdır'}
                </button>
              </div>
            </header>

            {lowCount > 0 && (
              <div className={styles.alert}>
                <span className={styles.alertIcon}>⚠️</span>
                <div>
                  <p className={styles.alertTitle}>
                    {mounted ? t('admin.stock.lowStockAlertTitle') : 'Düşük stok uyarısı'}
                  </p>
                  <p className={styles.alertText}>
                    {mounted
                      ? t('admin.stock.lowStockAlertMessage', { count: lowCount })
                      : `${lowCount} ürün düşük stokta (${threshold} kutunun altında).`}
                  </p>
                </div>
              </div>
            )}

            <div className={styles.thresholdBlock}>
              <span className={styles.thresholdLabel}>
                {mounted ? t('admin.stock.lowStockThreshold') : 'Düşük stok eşiği (kutu)'}
              </span>
              <input
                type="number"
                min={0}
                max={9999}
                value={thresholdInput}
                onChange={(e) => setThresholdInput(e.target.value)}
                className={styles.thresholdInput}
              />
              <button
                type="button"
                onClick={saveThreshold}
                disabled={savingThreshold}
                className={styles.thresholdBtn}
              >
                {savingThreshold ? (mounted ? t('admin.common.updating') : 'Kaydediliyor...') : (mounted ? t('admin.common.save') : 'Kaydet')}
              </button>
            </div>

            <div className={styles.statsRow}>
              <div className={`${styles.stat} ${styles.statTotal}`}>
                <div className={styles.statNumber}>{list.length}</div>
                <div className={styles.statLabel}>{mounted ? t('admin.stock.filterAll') : 'Toplam Ürün'}</div>
              </div>
              <div className={`${styles.stat} ${styles.statLow}`}>
                <div className={styles.statNumber}>{lowCount}</div>
                <div className={styles.statLabel}>{mounted ? t('admin.stock.filterLowStock') : 'Düşük Stok'}</div>
              </div>
              <div className={`${styles.stat} ${styles.statOk}`}>
                <div className={styles.statNumber}>{okCount}</div>
                <div className={styles.statLabel}>{mounted ? t('admin.stock.stockSufficient') : 'Stok Yeterli'}</div>
              </div>
            </div>

            <div className={styles.toolbar}>
              <div className={styles.searchWrap}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder={mounted ? t('admin.common.search') || 'Ürün ara…' : 'Ürün ara…'}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className={styles.filterTabs}>
                <button
                  type="button"
                  className={`${styles.filterTab} ${filter === 'all' ? styles.active : ''}`}
                  onClick={() => setFilter('all')}
                >
                  {mounted ? t('admin.stock.filterAll') : 'Tümü'}
                </button>
                <button
                  type="button"
                  className={`${styles.filterTab} ${filter === 'low' ? styles.active : ''}`}
                  onClick={() => setFilter('low')}
                >
                  {mounted ? t('admin.stock.filterLowStock') : 'Düşük Stok'}
                </button>
                <button
                  type="button"
                  className={`${styles.filterTab} ${filter === 'ok' ? styles.active : ''}`}
                  onClick={() => setFilter('ok')}
                >
                  {mounted ? t('admin.stock.filterOk') : 'Yeterli'}
                </button>
              </div>
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>No</th>
                    <th>{mounted ? t('admin.stock.product') : 'Ürün Adı'}</th>
                    <th>{mounted ? t('admin.stock.category') : 'Kategori'}</th>
                    <th>{mounted ? t('admin.stock.stockUnits') : 'Stok (adet)'}</th>
                    <th>{mounted ? t('admin.stock.stockBoxes') : 'Stok (kutu)'}</th>
                    <th>{mounted ? t('admin.stock.pack') : 'Birim'}</th>
                    <th>{mounted ? t('admin.stock.status') : 'Durum'}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8}>
                        <div className={styles.loading}>
                          {mounted ? t('admin.common.loading') : 'Yükleniyor...'}
                        </div>
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8}>
                        <div className={styles.empty}>
                          <p className={styles.emptyTitle}>
                            {filter === 'low'
                              ? (mounted ? t('admin.stock.noLowStock') : 'Düşük stokta ürün yok.')
                              : (mounted ? t('admin.common.notFound') : 'Sonuç bulunamadı')}
                          </p>
                          <p className={styles.emptyText}>
                            {search ? 'Arama kriterlerinizi değiştirin.' : ''}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((p, idx) => {
                      const pct = progressPct(p);
                      return (
                        <tr
                          key={p.id}
                          className={p.isLowStock ? styles.isLow : ''}
                          style={{ animationDelay: `${idx * 0.025}s` }}
                        >
                          <td>{String(idx + 1).padStart(2, '0')}</td>
                          <td>
                            <span className={styles.productName}>{getProductDisplayName(p)}</span>
                          </td>
                          <td>{getCategoryDisplayName(p)}</td>
                          <td>
                            <div className={styles.stockCell}>
                              <div className={styles.stockTrack}>
                                <div
                                  className={`${styles.stockFill} ${p.isLowStock ? styles.fillLow : styles.fillOk}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className={styles.stockValue}>{p.stockUnits} {mounted ? t('admin.stock.unitsShort') : 'adet'}</span>
                            </div>
                          </td>
                          <td className={styles.stockValue}>{p.stockBoxes} {mounted ? t('admin.stock.boxesShort') : 'kutu'}</td>
                          <td>
                            <span className={styles.unitBadge}>
                              {getPackLabel(p)}
                            </span>
                          </td>
                          <td>
                            <span className={`${styles.statusPill} ${p.isLowStock ? styles.low : styles.ok}`}>
                              <span className={styles.statusDot} />
                              {p.isLowStock
                                ? (mounted ? t('admin.stock.lowStock') : 'Düşük')
                                : (mounted ? t('admin.stock.normal') : 'Yeterli')}
                            </span>
                          </td>
                          <td>
                            <Link
                              href={`/admin-panel/products/${p.id}`}
                              className={styles.actionLink}
                            >
                              {mounted ? t('admin.common.edit') : 'Düzenle'}
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className={styles.legend}>
              <span className={styles.legendDot}>—</span>{' '}
              {mounted ? t('admin.stock.lowStockRowsHint') : 'Kırmızı satırlar minimum stok seviyesinin altındaki ürünleri gösterir.'}
            </div>
            <div className={styles.decoLine} />
          </div>
        </div>
      </div>
    </>
  );
}
