import { API_URL } from '../config/api';

const DEFAULT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=800&q=85';

/**
 * Resolves full URL for uploaded and external images with fallback protection.
 */
export function getImageUrl(url) {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return DEFAULT_FALLBACK_IMAGE;
  }
  const cleanUrl = url.trim();
  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://') || cleanUrl.startsWith('data:')) {
    return cleanUrl;
  }
  const base = API_URL ? API_URL.replace(/\/+$/, '') : '';
  const path = cleanUrl.startsWith('/') ? cleanUrl : `/${cleanUrl}`;
  return `${base}${path}`;
}

export function handleImageError(e) {
  if (e?.target && e.target.src !== DEFAULT_FALLBACK_IMAGE) {
    e.target.src = DEFAULT_FALLBACK_IMAGE;
  }
}
