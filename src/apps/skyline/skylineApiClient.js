/**
 * Skyline Premium Outfits — Smart Backend Client
 * Connects to the ChuruOne multi-tenant engine using `x-store-id: skyline`.
 */

export const SKYLINE_CONFIG = {
  storeId: 'skyline',
  primaryUrl: typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5001'
    : 'https://churuone.in',
  fallbackUrl: 'https://churuone-backend.onrender.com'
};

function getApiBase() {
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:5001';
  }
  return SKYLINE_CONFIG.primaryUrl;
}

export async function skylineFetch(endpoint, options = {}) {
  const base = getApiBase();
  const url = `${base}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    'x-store-id': SKYLINE_CONFIG.storeId,
    ...(options.headers || {})
  };

  try {
    const res = await fetch(url, { ...options, headers });
    if (res.ok) {
      return await res.json();
    }
    const errBody = await res.json().catch(() => ({}));
    const err = new Error(errBody.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = errBody;
    throw err;
  } catch (err) {
    if (err.status && err.status < 500) throw err; // Don't retry 4xx validation errors

    // Fallback if primary domain had network failure
    if (base !== SKYLINE_CONFIG.fallbackUrl) {
      try {
        const fbUrl = `${SKYLINE_CONFIG.fallbackUrl}${endpoint}`;
        const fbRes = await fetch(fbUrl, { ...options, headers });
        if (fbRes.ok) return await fbRes.json();
        const fbErrBody = await fbRes.json().catch(() => ({}));
        const fbErr = new Error(fbErrBody.message || `HTTP ${fbRes.status}`);
        fbErr.status = fbRes.status;
        throw fbErr;
      } catch (fbErr2) {
        throw fbErr2;
      }
    }
    throw err;
  }
}

/**
 * Fetch complete store catalog, deals, reviews, and store info
 */
export async function getSkylineData() {
  return await skylineFetch('/api/data?storeId=skyline');
}

/**
 * Validate promo coupon against backend deals database
 */
export async function validateCouponCode(code, subtotal, phone = '', itemCategories = []) {
  return await skylineFetch('/api/coupon/validate', {
    method: 'POST',
    body: JSON.stringify({
      code,
      subtotal,
      phone,
      itemCategories,
      storeId: 'skyline'
    })
  });
}

/**
 * Place a customer order into the database
 */
export async function placeSkylineOrder(orderPayload) {
  return await skylineFetch('/api/orders', {
    method: 'POST',
    body: JSON.stringify({
      ...orderPayload,
      storeId: 'skyline'
    })
  });
}

/**
 * Customer Phone OTP Authentication
 */
export async function sendCustomerOtp(phone) {
  return await skylineFetch('/api/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({
      phone,
      storeId: 'skyline'
    })
  });
}

export async function verifyCustomerOtp(phone, otp) {
  return await skylineFetch('/api/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({
      phone,
      otp,
      storeId: 'skyline'
    })
  });
}

/**
 * Post a customer review
 */
export async function submitProductReview(reviewData) {
  return await skylineFetch('/api/reviews', {
    method: 'POST',
    body: JSON.stringify({
      ...reviewData,
      storeId: 'skyline'
    })
  });
}
