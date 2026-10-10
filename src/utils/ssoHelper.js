/**
 * ChuruOne Unified Single Sign-On (SSO) & Cross-Domain Session Helper
 * 
 * Synchronizes user authentication seamlessly across:
 * - https://churuone.in (Platform Portal)
 * - https://shawarma.churuone.in (Shawarma Nights Store)
 * - https://skyline.churuone.in (Skyline Outfits Store)
 * - https://nash.churuone.in (Nash Studio Store)
 * And localhost/dev environments.
 * 
 * RULE: "Aik ID me login mtlb sab website me login"
 * TRACKS: Explicit authentication method ('google' | 'phone' | 'both')
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
 * Deterministically sanitizes and annotates user object with exact auth method:
 * - authMethod: 'google' | 'phone' | 'both'
 * - authMethods: ['google'] | ['phone'] | ['google', 'phone']
 * - isPhoneAuth: boolean (verified 10-digit phone via OTP)
 * - isGoogleAuth: boolean (verified Google account)
 */
export function sanitizeChuruOneUser(u) {
  if (!u || typeof u !== 'object') return null;

  const rawPhone = u.phone || u.phoneNumber || '';
  const cleanPhone = String(rawPhone).replace(/\D/g, '').slice(-10);
  const isPhoneVerified = Boolean(u.phoneVerified === true && cleanPhone.length === 10);

  const hasGoogle = Boolean(
    (u.googleId && !String(u.googleId).startsWith('churu_phone_')) ||
    (u.email && u.authProvider !== 'phone') ||
    u.authProvider === 'google' ||
    u.isGoogleAuth === true ||
    (Array.isArray(u.authMethods) && u.authMethods.includes('google'))
  );

  const hasPhone = isPhoneVerified;

  let authMethod = 'none';
  const authMethods = [];
  if (hasGoogle && hasPhone) {
    authMethod = 'both';
    authMethods.push('google', 'phone');
  } else if (hasPhone) {
    authMethod = 'phone';
    authMethods.push('phone');
  } else if (hasGoogle) {
    authMethod = 'google';
    authMethods.push('google');
  }

  const displayName = u.name || u.displayName || (cleanPhone ? `Customer +91${cleanPhone.slice(-4)}` : (u.email ? u.email.split('@')[0] : 'Customer'));

  return {
    ...u,
    id: u.id || u.uid || `cust_${Date.now()}`,
    name: displayName,
    displayName: displayName,
    email: u.email || '',
    phone: cleanPhone,
    phoneNumber: cleanPhone,
    phoneVerified: hasPhone,
    isPhoneAuth: hasPhone,
    isGoogleAuth: hasGoogle,
    authMethod: authMethod,
    authMethods: authMethods,
    authProvider: authMethod === 'both' ? 'both' : (hasPhone ? 'phone' : 'google'),
    picture: u.picture || u.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`,
    photoURL: u.photoURL || u.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`
  };
}

/**
 * Set persistent cross-domain SSO session cookie and synchronize all local storage keys
 */
export function setChuruOneSession(user, token) {
  if (typeof window === 'undefined' || !user) return;
  try {
    const sanitizedUser = sanitizeChuruOneUser(user);
    const authToken = token || user.token || '';

    const payload = {
      user: sanitizedUser,
      token: authToken,
      timestamp: Date.now()
    };

    // 1. Synchronize all local storage keys across apps (Shawarma, Skyline, Nash, Platform)
    const serialized = JSON.stringify(sanitizedUser);
    localStorage.setItem('churuone_user', serialized);
    localStorage.setItem('sn_session', serialized);
    localStorage.setItem('sn_current_user', serialized);
    localStorage.setItem('nash_user', serialized);
    localStorage.setItem('skyline_user', serialized);
    if (authToken) {
      localStorage.setItem('auth_token', authToken);
    }

    // 2. Cross-domain cookie (shared across *.churuone.in subdomains)
    const encoded = encodeURIComponent(JSON.stringify(payload));
    const domainAttr = getCookieDomain();
    document.cookie = `${COOKIE_NAME}=${encoded}${domainAttr}; path=/; max-age=2592000; SameSite=Lax`;

    // 3. Dispatch in-tab notification for reactive listeners
    window.dispatchEvent(new CustomEvent('churuone_auth_change', {
      detail: { user: sanitizedUser, token: authToken }
    }));
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
        return {
          user: sanitizeChuruOneUser(decoded.user),
          token: decoded.token || ''
        };
      }
    }

    // 2. Fallback to LocalStorage across all app keys
    const localRaw = localStorage.getItem('churuone_user') || 
                     localStorage.getItem('sn_session') || 
                     localStorage.getItem('sn_current_user') ||
                     localStorage.getItem('skyline_user') ||
                     localStorage.getItem('nash_user');
    if (localRaw) {
      const parsed = JSON.parse(localRaw);
      const token = localStorage.getItem('auth_token') || '';
      return { 
        user: sanitizeChuruOneUser(parsed), 
        token 
      };
    }
  } catch (err) {
    console.warn('⚠️ [SSO] Error reading session:', err);
  }
  return null;
}

/**
 * Clear SSO session from Cookie and LocalStorage across all domains and apps
 */
export function clearChuruOneSession() {
  if (typeof window === 'undefined') return;
  try {
    // 1. Clear LocalStorage across all apps
    localStorage.removeItem('churuone_user');
    localStorage.removeItem('sn_session');
    localStorage.removeItem('sn_current_user');
    localStorage.removeItem('nash_user');
    localStorage.removeItem('skyline_user');
    localStorage.removeItem('auth_token');

    // 2. Clear Cookie on current host and root domain
    const domainAttr = getCookieDomain();
    document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT${domainAttr}; path=/; SameSite=Lax`;
    document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;

    // 3. Dispatch in-tab notification for reactive listeners
    window.dispatchEvent(new CustomEvent('churuone_auth_change', {
      detail: { user: null, token: '' }
    }));
  } catch (err) {
    console.warn('⚠️ [SSO] Error clearing session:', err);
  }
}

/**
 * Subscribe to cross-tab (storage event) and in-window auth changes
 */
export function subscribeToChuruOneAuth(callback) {
  if (typeof window === 'undefined' || typeof callback !== 'function') return () => {};

  const handleStorage = (e) => {
    if (!e.key || ['churuone_user', 'sn_session', 'sn_current_user', 'nash_user', 'skyline_user', 'churuone_session'].includes(e.key)) {
      const session = getChuruOneSession();
      callback(session ? session.user : null, session ? session.token : '');
    }
  };

  const handleCustom = (e) => {
    callback(e.detail?.user || null, e.detail?.token || '');
  };

  window.addEventListener('storage', handleStorage);
  window.addEventListener('churuone_auth_change', handleCustom);

  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener('churuone_auth_change', handleCustom);
  };
}

/**
 * Check store-specific mandatory authentication policy
 * @param {string} storeId - Store identifier ('shawarma', 'skyline', 'nash-studio', etc.)
 * @param {object} user - User object
 */
export function checkStoreAuthPolicy(storeId, user) {
  const sUser = user ? sanitizeChuruOneUser(user) : null;
  if (!sUser) {
    return {
      allowed: false,
      reason: 'login_required',
      missingMethod: 'login',
      message: 'Kripya apne ChuruOne account me sign in karein.'
    };
  }

  const id = (storeId || '').toLowerCase();
  // Food Delivery (Shawarma Nights) & Fashion Wardrobe (Skyline) require 10-digit verified phone OTP
  if (id === 'shawarma' || id === 'skyline') {
    if (!sUser.isPhoneAuth) {
      return {
        allowed: false,
        reason: 'phone_otp_required',
        missingMethod: 'phone',
        user: sUser,
        message: `${id === 'shawarma' ? 'Shawarma Nights' : 'Skyline'} par order ke liye mobile number OTP verify hona zaroori hai.`
      };
    }
  }

  return {
    allowed: true,
    reason: 'ok',
    missingMethod: null,
    user: sUser,
    message: 'Authenticated'
  };
}

/**
 * Decorate store link with SSO tokens for seamless redirection
 */
export function attachSsoParams(urlStr, user, token) {
  if (!urlStr || !user) return urlStr;
  try {
    const isRelative = urlStr.startsWith('/');
    const url = new URL(urlStr, typeof window !== 'undefined' ? window.location.origin : 'https://churuone.in');
    const sanitized = sanitizeChuruOneUser(user);
    url.searchParams.set('churuone_user', encodeURIComponent(JSON.stringify(sanitized)));
    if (token) url.searchParams.set('churuone_token', token);
    return isRelative ? `${url.pathname}${url.search}` : url.toString();
  } catch (e) {
    return urlStr;
  }
}
