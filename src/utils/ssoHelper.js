/**
 * ChuruOne Unified Single Sign-On (SSO) & Cross-Domain Session Helper
 * 
 * Synchronizes user authentication seamlessly across:
 * - https://churuone.in (Platform Portal)
 * - https://shawarma.churuone.in (Shawarma Nights Store)
 * - https://nash.churuone.in (Nash Studio Store)
 * And localhost/dev environments.
 */

const COOKIE_NAME = 'churuone_session';

/**
 * Determine cookie domain attribute.
 * If running on any *.churuone.in domain, sets domain to '.churuone.in'
 * allowing all subdomains to share the login session automatically.
 */
function getCookieDomain() {
  if (typeof window === 'undefined') return '';
  const hostname = window.location.hostname.toLowerCase();
  if (hostname.endsWith('churuone.in')) {
    return '; domain=.churuone.in';
  }
  return '';
}

/**
 * Set persistent cross-domain SSO session cookie
 */
export function setChuruOneSession(user, token) {
  if (typeof window === 'undefined' || !user) return;
  try {
    const payload = {
      user: {
        id: user.id || user.uid || `cust_${Date.now()}`,
        name: user.name || user.displayName || 'Customer',
        displayName: user.displayName || user.name || 'Customer',
        email: user.email || '',
        phone: user.phone || user.phoneNumber || '',
        phoneNumber: user.phoneNumber || user.phone || '',
        picture: user.picture || user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name || user.displayName || 'C')}`,
        photoURL: user.photoURL || user.picture || '',
        phoneVerified: Boolean(user.phoneVerified),
        authProvider: user.authProvider || 'google'
      },
      token: token || user.token || '',
      timestamp: Date.now()
    };

    // 1. LocalStorage for current origin
    const serialized = JSON.stringify(payload.user);
    localStorage.setItem('churuone_user', serialized);
    localStorage.setItem('sn_session', serialized);
    localStorage.setItem('sn_current_user', serialized);
    localStorage.setItem('nash_user', serialized);
    if (payload.token) {
      localStorage.setItem('auth_token', payload.token);
    }

    // 2. Cross-domain cookie (shared across *.churuone.in subdomains)
    const encoded = encodeURIComponent(JSON.stringify(payload));
    const domainAttr = getCookieDomain();
    document.cookie = `${COOKIE_NAME}=${encoded}${domainAttr}; path=/; max-age=2592000; SameSite=Lax`;
  } catch (err) {
    console.warn('⚠️ [SSO] Error writing session:', err);
  }
}

/**
 * Read SSO session from Cookie or LocalStorage
 */
export function getChuruOneSession() {
  if (typeof window === 'undefined') return null;
  try {
    // 1. Check cross-domain cookie first
    const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
    if (match) {
      const decoded = JSON.parse(decodeURIComponent(match[1]));
      if (decoded && decoded.user) {
        return decoded;
      }
    }

    // 2. Fallback to LocalStorage
    const localRaw = localStorage.getItem('churuone_user') || 
                     localStorage.getItem('sn_session') || 
                     localStorage.getItem('nash_user');
    if (localRaw) {
      const parsed = JSON.parse(localRaw);
      const token = localStorage.getItem('auth_token') || '';
      return { user: parsed, token };
    }
  } catch (err) {
    console.warn('⚠️ [SSO] Error reading session:', err);
  }
  return null;
}

/**
 * Clear SSO session from Cookie and LocalStorage across domains
 */
export function clearChuruOneSession() {
  if (typeof window === 'undefined') return;
  try {
    // 1. Clear LocalStorage
    localStorage.removeItem('churuone_user');
    localStorage.removeItem('sn_session');
    localStorage.removeItem('sn_current_user');
    localStorage.removeItem('nash_user');
    localStorage.removeItem('auth_token');

    // 2. Clear Cookie on current host and root domain
    const domainAttr = getCookieDomain();
    document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT${domainAttr}; path=/; SameSite=Lax`;
    document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
  } catch (err) {
    console.warn('⚠️ [SSO] Error clearing session:', err);
  }
}

/**
 * Decorate store link with SSO tokens for seamless redirection
 */
export function attachSsoParams(urlStr, user, token) {
  if (!urlStr || !user) return urlStr;
  try {
    const isRelative = urlStr.startsWith('/');
    const url = new URL(urlStr, typeof window !== 'undefined' ? window.location.origin : 'https://churuone.in');
    url.searchParams.set('churuone_user', encodeURIComponent(JSON.stringify(user)));
    if (token) url.searchParams.set('churuone_token', token);
    return isRelative ? `${url.pathname}${url.search}` : url.toString();
  } catch (e) {
    return urlStr;
  }
}
