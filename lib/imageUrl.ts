/**
 * Resim URL'sindeki satır sonu (\\r\\n, \\n) ve boşlukları kaldırır.
 * Veritabanından gelen URL'lerde bazen CRLF oluyor, Next.js Image 400 hatası veriyor.
 */
export function normalizeImageUrl(url: string | null | undefined): string {
  if (url == null || typeof url !== 'string') return '';
  return url.replace(/\r\n|\r|\n/g, '').trim();
}

/**
 * product.images (virgülle ayrılmış) string'inden ilk resim URL'sini döndürür (normalize edilmiş).
 */
export function getFirstImageSrc(imagesStr: string | null | undefined): string {
  if (!imagesStr || typeof imagesStr !== 'string') return '';
  const first = imagesStr.split(',')[0];
  return normalizeImageUrl(first);
}

/**
 * Ürün resmi için kullanılacak tam src (normalize + /uploads/products/ prefix gerekirse).
 */
export function getProductImageSrc(imagesStr: string | null | undefined): string {
  const imgSrc = getFirstImageSrc(imagesStr);
  if (!imgSrc) return '';
  if (imgSrc.startsWith('http://') || imgSrc.startsWith('https://')) return imgSrc;
  if (imgSrc.startsWith('/')) return imgSrc;
  if (imgSrc.includes('storage/v1/object/public')) return imgSrc;
  return `/uploads/products/${imgSrc}`;
}
