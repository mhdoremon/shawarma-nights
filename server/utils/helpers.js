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
 * @param {number} length - OTP length (default 4)
 */
export function generateOtp(length = 4) {
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
  return text
    .toString()
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
  normalizePhone
};
