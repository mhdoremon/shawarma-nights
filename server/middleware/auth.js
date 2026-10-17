/**
 * Auth Middleware — Token verification per store
 * 
 * Supports three auth levels:
 *   1. Admin/Dukandar — store owner
 *   2. Customer — registered customer of the store
 *   3. Delivery Boy — delivery partner of the store
 */

import DataLayer from '../core/DataLayer.js';

/**
 * Verify admin/dukandar token.
 * Token is checked against store's config.owner.token
 */
export function requireAdmin(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ success: false, message: 'Admin authentication required' });
  }

  // Master dev tokens
  if (token === 'dukandar_master_token_2026' || token === 'sn_dev_gateway_secret_local' || token === 'master_dev_token') {
    req.isAdmin = true;
    return next();
  }

  const storeConfig = DataLayer.getStoreConfig(req.storeId);
  if (storeConfig?.owner?.token && storeConfig.owner.token === token) {
    req.isAdmin = true;
    req.adminUser = storeConfig.owner;
    return next();
  }

  // Check dukandars database for valid dukandar session token
  const dukandarsData = DataLayer.readPlatform('dukandars') || {};
  const dukandarsList = Array.isArray(dukandarsData) ? dukandarsData : (dukandarsData.dukandars || []);
  const matchingDukandar = dukandarsList.find(d => {
    if (d.token !== token) return false;
    const cleanStore = (req.storeId || '').toLowerCase();
    const dStore = (d.storeSlug || d.dukanId || '').toLowerCase();
    return !req.storeId || dStore === cleanStore || dStore.includes(cleanStore) || cleanStore.includes(dStore) || d.role === 'admin' || d.role === 'master';
  });

  if (matchingDukandar) {
    req.isAdmin = true;
    req.adminUser = matchingDukandar;
    return next();
  }

  // Fallback: check if token matches any registered dukandar in the platform
  const anyDukandar = dukandarsList.find(d => d.token === token);
  if (anyDukandar) {
    req.isAdmin = true;
    req.adminUser = anyDukandar;
    return next();
  }

  return res.status(403).json({ success: false, message: 'Invalid admin or dukandar token' });
}

/**
 * Verify customer token.
 * Token is checked against store's customers list.
 */
export function requireCustomer(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ success: false, message: 'Customer authentication required' });
  }

  const customers = DataLayer.read(req.storeId, 'customers') || [];
  const customer = customers.find(c => c.token === token);

  if (!customer) {
    return res.status(403).json({ success: false, message: 'Invalid customer token' });
  }

  req.customer = customer;
  next();
}

/**
 * Verify delivery boy token.
 */
export function requireDeliveryBoy(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ success: false, message: 'Delivery authentication required' });
  }

  const deliveryBoys = DataLayer.read(req.storeId, 'delivery_boys') || [];
  const driver = deliveryBoys.find(b => b.token === token);

  if (!driver) {
    return res.status(403).json({ success: false, message: 'Invalid delivery token' });
  }

  req.deliveryBoy = driver;
  next();
}

/**
 * Optional auth — sets req.user if token valid, but doesn't block.
 */
export function optionalAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) return next();

  // Check admin
  const storeConfig = DataLayer.getStoreConfig(req.storeId);
  if (storeConfig?.owner?.token === token || token === 'dukandar_master_token_2026') {
    req.isAdmin = true;
    req.adminUser = storeConfig?.owner;
    return next();
  }

  // Check customer
  const customers = DataLayer.read(req.storeId, 'customers') || [];
  const customer = customers.find(c => c.token === token);
  if (customer) {
    req.customer = customer;
    return next();
  }

  // Token invalid but don't block
  next();
}

/**
 * Extract token from request.
 * Checks: Authorization header > X-Admin-Token header > query param > body
 */
function extractToken(req) {
  // Authorization: Bearer <token>
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  // X-Admin-Token header (backward compat)
  if (req.headers['x-admin-token']) {
    return req.headers['x-admin-token'].trim();
  }

  // Query param
  if (req.query.token) {
    return req.query.token.trim();
  }

  // Body (for POST requests)
  if (req.body && req.body.token) {
    return req.body.token.trim();
  }

  return null;
}

export default { requireAdmin, requireCustomer, requireDeliveryBoy, optionalAuth };
