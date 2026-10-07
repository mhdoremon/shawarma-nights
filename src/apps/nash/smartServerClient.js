/**
 * ChuruOne Smart Backend Client for Nash Studio
 * Connects Nash Studio Customer Frontend & Salon Staff Portal to ChuruOne Smart Server.
 */

export const SMART_CONFIG = {
  storeId: 'nash-studio',
  primaryUrl: 'https://churuone.in',
  fallbackUrl: 'https://churuone-backend.onrender.com',
  localUrl: 'http://localhost:5001'
};

function getApiBase() {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost' && window.location.port === '5001') {
    return SMART_CONFIG.localUrl;
  }
  return SMART_CONFIG.primaryUrl;
}

/**
 * Universal fetch with automatic failover between primary domain and Render fallback.
 */
export async function smartFetch(endpoint, options = {}) {
  const base = getApiBase();
  const url = `${base}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    'x-store-id': SMART_CONFIG.storeId,
    ...(options.headers || {})
  };

  try {
    const res = await fetch(url, { ...options, headers });
    if (res.ok) {
      return await res.json();
    }
    // If 409 (e.g. slot already taken) or 400, parse JSON and throw descriptive error
    const errBody = await res.json().catch(() => ({}));
    const err = new Error(errBody.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = errBody;
    throw err;
  } catch (err) {
    if (err.status) throw err; // Don't retry client errors like 409 slot clash

    // Network error: try fallback URL if primary failed
    if (base !== SMART_CONFIG.fallbackUrl) {
      try {
        const fbUrl = `${SMART_CONFIG.fallbackUrl}${endpoint}`;
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
 * 1. Fetch entire store data (hairstyles, settings, deals, reviews)
 */
export async function getStoreData() {
  return await smartFetch(`/api/data?storeId=${SMART_CONFIG.storeId}`);
}

/**
 * 2. Fetch bookings for a date
 */
export async function getBookingsForDate(dateISO) {
  const query = dateISO ? `?dateISO=${encodeURIComponent(dateISO)}&storeId=${SMART_CONFIG.storeId}` : `?storeId=${SMART_CONFIG.storeId}`;
  const res = await smartFetch(`/api/orders/bookings${query}`);
  return res.bookings || [];
}

/**
 * 3. Create appointment booking on Smart Server
 */
export async function createSmartBooking(bookingData) {
  const res = await smartFetch(`/api/orders`, {
    method: 'POST',
    body: JSON.stringify({
      ...bookingData,
      storeId: SMART_CONFIG.storeId,
      orderNumber: bookingData.token,
      total: bookingData.totalPrice,
      customer: {
        name: bookingData.name,
        phone: bookingData.phone,
        email: bookingData.userEmail || ''
      }
    })
  });
  return res.order || res;
}

/**
 * 4. Save/update hairstyle in Smart Server catalog
 */
export async function saveSmartHairstyle(item) {
  const res = await smartFetch(`/api/menu/item`, {
    method: 'POST',
    body: JSON.stringify({
      ...item,
      time: item.time || 30,
      type: item.type || 'standard',
      price: item.price || 0,
      description: item.desc || item.description,
      image: item.img || item.image
    })
  });
  return res.data || item;
}

/**
 * 5. Delete hairstyle from Smart Server catalog
 */
export async function deleteSmartHairstyle(id) {
  return await smartFetch(`/api/menu/item/${id}`, {
    method: 'DELETE'
  });
}

/**
 * 6. Save Studio Settings (timing, address, whatsapp, phone, custom CSS)
 */
export async function saveSmartSettings(settings) {
  return await smartFetch(`/api/store-info`, {
    method: 'POST',
    body: JSON.stringify(settings)
  });
}

/**
 * 7. Post review to Smart Server
 */
export async function postSmartReview(review) {
  return await smartFetch(`/api/reviews`, {
    method: 'POST',
    body: JSON.stringify(review)
  });
}

/**
 * 8. Dukandar Admin Login
 */
export async function loginSmartAdmin(username, password) {
  return await smartFetch(`/api/auth/admin/login`, {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
}

/**
 * 9. Universal Google Sign-In with ChuruOne Smart Server
 */
export async function loginSmartGoogle(googleData) {
  return await smartFetch(`/api/auth/google`, {
    method: 'POST',
    body: JSON.stringify({
      ...googleData,
      storeId: SMART_CONFIG.storeId
    })
  });
}

/**
 * 10. Fast Direct Customer Pass Login (Name + Phone or Email)
 */
export async function loginSmartDirectCustomer(name, phone, email) {
  return await smartFetch(`/api/auth/direct`, {
    method: 'POST',
    body: JSON.stringify({
      name,
      phone,
      email,
      storeId: SMART_CONFIG.storeId
    })
  });
}

/**
 * 11. Fetch Customer Profile & Active Bookings from Smart Server
 */
export async function getSmartCustomerSession(param = {}) {
  const query = new URLSearchParams();
  if (param.phone) query.set('phone', param.phone);
  if (param.email) query.set('email', param.email);
  if (param.token) query.set('token', param.token);
  query.set('storeId', SMART_CONFIG.storeId);
  return await smartFetch(`/api/auth/me?${query.toString()}`);
}

/**
 * 9. Real-time WebSocket connection to ChuruOne Smart Server
 */
export function connectSmartWebSocket(onEvent) {
  let ws = null;
  let reconnectTimer = null;
  let isClosed = false;

  function connect() {
    if (isClosed) return;
    const base = getApiBase();
    const wsProto = base.startsWith('https') ? 'wss:' : 'ws:';
    const host = base.replace(/^https?:\/\//, '');
    const wsUrl = `${wsProto}//${host}/ws?storeId=${SMART_CONFIG.storeId}`;

    try {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('⚡ [Nash Studio] Connected to ChuruOne Smart WebSocket Hub');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const action = data.action || data.type;
          if (action && typeof onEvent === 'function') {
            onEvent(action, data.payload);
          }
        } catch (e) {}
      };

      ws.onclose = () => {
        if (!isClosed) {
          reconnectTimer = setTimeout(connect, 3000);
        }
      };

      ws.onerror = () => {
        try { ws.close(); } catch (e) {}
      };
    } catch (err) {
      if (!isClosed) {
        reconnectTimer = setTimeout(connect, 4000);
      }
    }
  }

  connect();

  return () => {
    isClosed = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (ws) {
      try { ws.close(); } catch (e) {}
    }
  };
}
