/**
 * Utility Helpers
 */

import crypto from 'crypto';

/**
 * Generate a unique ID with prefix.
 * @param {string} prefix - e.g. 'ord', 'prod', 'cust', 'deal', 'rev'
 * @returns {string} e.g. 'ord-1696012345678-a3f2'
 */
export function generateId(prefix = 'id') {
  const timestamp = Date.now();
  const random = crypto.randomBytes(2).toString('hex');
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Generate a numeric OTP.
 * @param {number} length - OTP length (default 6)
 */
export function generateOtp(length = 6) {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return String(crypto.randomInt(min, max + 1));
}

/**
 * Generate a UUID v4.
 */
export function generateUUID() {
  return crypto.randomUUID();
}

/**
 * Generate store-specific order number.
 * @param {string} prefix - Store short prefix, e.g. 'SN'
 * @param {number} sequence - Current order count
 */
export function generateOrderNumber(prefix, sequence) {
  return `${prefix}-${String(sequence).padStart(4, '0')}`;
}

/**
 * Sanitize a string for use as slug/ID.
 */
export function slugify(text) {
  if (text === null || text === undefined) return '';
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Deep merge objects (non-destructive).
 */
export function deepMerge(target, source) {
  const result = { ...target };
  if (!source) return result;
  for (const key of Object.keys(source)) {
    if (
      source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) &&
      target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])
    ) {
      result[key] = deepMerge(target[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

/**
 * Get current ISO timestamp.
 */
export function now() {
  return new Date().toISOString();
}

/**
 * Safe parse number with fallback.
 */
export function safeNum(val, fallback = 0) {
  const n = Number(val);
  return isNaN(n) ? fallback : n;
}

/**
 * Round to 2 decimal places (for money).
 */
export function money(val) {
  return Math.round(safeNum(val) * 100) / 100;
}

/**
 * Check if a value is a non-empty string.
 */
export function isNonEmpty(val) {
  return typeof val === 'string' && val.trim().length > 0;
}

/**
 * Validate Indian phone number.
 */
export function isValidPhone(phone) {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s\-\+]/g, '');
  return /^(\+?91)?[6-9]\d{9}$/.test(cleaned);
}

/**
 * Normalize phone number to 10-digit format.
 */
export function normalizePhone(phone) {
  if (!phone) return '';
  const cleaned = phone.replace(/[\s\-\+]/g, '');
  if (cleaned.startsWith('91') && cleaned.length === 12) return cleaned.substring(2);
  if (cleaned.length === 10) return cleaned;
  return cleaned;
}

/**
 * Enrich customers with their order count, total spent, last order date, and favorite dish.
 * Also includes guest customers from orders who haven't registered an account yet.
 */
export function enrichCustomersWithOrderStats(customers = [], orders = []) {
  const phoneStats = {};

  for (const order of orders) {
    let rawPhone = order.customer?.phone || order.customerPhone || '';
    let rawName = order.customer?.name || order.customerName || '';
    let address = order.address || '';
    let cleanPhone = normalizePhone(rawPhone);
    if (!cleanPhone) continue;

    if (!phoneStats[cleanPhone]) {
      phoneStats[cleanPhone] = {
        totalOrders: 0,
        totalSpent: 0,
        lastOrderAt: null,
        latestAddress: address,
        latestName: rawName,
        dishCounts: {}
      };
    }

    const stat = phoneStats[cleanPhone];
    stat.totalOrders += 1;
    const orderTotal = Number(order.total || order.grandTotal || 0);
    stat.totalSpent += isNaN(orderTotal) ? 0 : orderTotal;

    const orderDate = order.createdAt || order.placedAt;
    if (orderDate && (!stat.lastOrderAt || new Date(orderDate) > new Date(stat.lastOrderAt))) {
      stat.lastOrderAt = orderDate;
      if (address) stat.latestAddress = address;
      if (rawName && (!stat.latestName || stat.latestName === 'Customer')) stat.latestName = rawName;
    }

    const items = order.items || [];
    for (const item of items) {
      const dName = item.name || item.dishName;
      if (dName) {
        stat.dishCounts[dName] = (stat.dishCounts[dName] || 0) + (Number(item.qty) || 1);
      }
    }
  }

  const enrichedMap = new Map();

  for (const cust of customers) {
    const cleanPhone = normalizePhone(cust.phone || '');
    const stat = phoneStats[cleanPhone];

    let favoriteDish = '';
    if (stat?.dishCounts) {
      let maxQty = 0;
      for (const [dish, qty] of Object.entries(stat.dishCounts)) {
        if (qty > maxQty) {
          maxQty = qty;
          favoriteDish = dish;
        }
      }
    }

    enrichedMap.set(cleanPhone || cust.id, {
      ...cust,
      name: cust.name || stat?.latestName || 'Customer',
      address: cust.address || stat?.latestAddress || 'N/A',
      totalOrders: stat ? stat.totalOrders : 0,
      totalSpent: stat ? Math.round(stat.totalSpent) : 0,
      lastOrderAt: stat?.lastOrderAt || cust.registeredAt || null,
      favoriteDish: favoriteDish || ''
    });
  }

  for (const [cleanPhone, stat] of Object.entries(phoneStats)) {
    if (!enrichedMap.has(cleanPhone)) {
      let favoriteDish = '';
      if (stat.dishCounts) {
        let maxQty = 0;
        for (const [dish, qty] of Object.entries(stat.dishCounts)) {
          if (qty > maxQty) {
            maxQty = qty;
            favoriteDish = dish;
          }
        }
      }

      enrichedMap.set(cleanPhone, {
        id: `cust-${cleanPhone}`,
        name: stat.latestName || `Customer ${cleanPhone}`,
        phone: cleanPhone,
        address: stat.latestAddress || 'N/A',
        totalOrders: stat.totalOrders,
        totalSpent: Math.round(stat.totalSpent),
        lastOrderAt: stat.lastOrderAt,
        favoriteDish: favoriteDish || '',
        registeredAt: stat.lastOrderAt
      });
    }
  }

  return Array.from(enrichedMap.values());
}

export default {
  generateId,
  generateOtp,
  generateUUID,
  generateOrderNumber,
  slugify,
  deepMerge,
  now,
  safeNum,
  money,
  isNonEmpty,
  isValidPhone,
  normalizePhone,
  enrichCustomersWithOrderStats
};
