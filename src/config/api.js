export const API_URL = import.meta.env.VITE_API_URL || '';
export const WS_URL = import.meta.env.VITE_WS_URL || '';

/**
 * Returns the currently active store ID.
 * Priority: URL query param (?storeId=) -> Subdomain -> localStorage -> VITE_STORE_ID -> 'shawarma'
 */
export function getStoreId() {
  if (typeof window !== 'undefined' && window.location) {
    try {
      const params = new URLSearchParams(window.location.search);
      const queryId = params.get('storeId') || params.get('store');
      if (queryId) return queryId.toLowerCase().trim();

      const host = window.location.hostname.toLowerCase();
      const isIp = /^[\d\.]+(?::\d+)?$/.test(host);
      const isHosting = host.includes('onrender.com') || host.includes('vercel.app') || host.includes('render.com') || host.includes('github.io') || host.includes('localhost');
      if (!isIp && !isHosting) {
        const parts = host.split('.');
        if (parts.length >= 3 && !['www', 'api', 'admin', 'platform'].includes(parts[0])) {
          return parts[0].toLowerCase().trim();
        }
      }

      const saved = localStorage.getItem('churuone_active_store_id') || localStorage.getItem('churuone_master_store_id');
      if (saved) return saved.toLowerCase().trim();
    } catch (e) {}
  }
  return (import.meta.env.VITE_STORE_ID || 'shawarma').toLowerCase().trim();
}

