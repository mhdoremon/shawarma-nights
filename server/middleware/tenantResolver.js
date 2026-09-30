/**
 * Tenant Resolver Middleware
 * 
 * Resolves which store a request belongs to.
 * Priority: Header > Query > Subdomain > Path > Default
 * 
 * Attaches req.storeId to every request.
 */

import DataLayer from '../core/DataLayer.js';
import config from '../config/index.js';

/**
 * Main tenant resolver middleware.
 * For /api/platform/* routes, storeId is not required.
 */
export function tenantResolver(req, res, next) {
  // Skip tenant resolution for platform-level routes
  if (req.path.startsWith('/api/platform')) {
    return next();
  }

  // Skip for health check
  if (req.path === '/' || req.path === '/healthz' || req.path === '/api/health') {
    return next();
  }

  let storeId = null;

  // 1. Header: X-Store-Id
  if (req.headers['x-store-id']) {
    storeId = req.headers['x-store-id'].toLowerCase().trim();
  }

  // 2. Query param: ?storeId=
  if (!storeId && req.query.storeId) {
    storeId = req.query.storeId.toLowerCase().trim();
  }

  // 3. Subdomain: shawarma.churuone.in (ignore cloud hosting platform domains)
  if (!storeId) {
    const host = (req.headers.host || '').toLowerCase();
    const isHostingPlatform = host.includes('onrender.com') || host.includes('vercel.app') || host.includes('render.com') || host.includes('github.io') || host.includes('ngrok') || host.includes('loca.lt');
    
    if (!isHostingPlatform) {
      const parts = host.split('.');
      // At least 3 parts: sub.domain.tld
      if (parts.length >= 3) {
        const sub = parts[0].toLowerCase();
        if (sub !== 'www' && sub !== 'api' && sub !== 'admin' && sub !== 'platform') {
          storeId = sub;
        }
      }
    }
  }

  // 4. Path prefix: /store/:storeId/api/...
  if (!storeId && req.path.startsWith('/store/')) {
    const pathParts = req.path.split('/');
    if (pathParts.length >= 3) {
      storeId = pathParts[2].toLowerCase().trim();
      // Rewrite req.url to remove /store/:storeId prefix
      req.url = '/' + pathParts.slice(3).join('/');
      if (req.url === '/') req.url = '/api/data';
    }
  }

  // 5. Default store ID (backward compatibility)
  if (!storeId) {
    storeId = config.DEFAULT_STORE_ID;
  }

  // Sanitize storeId (alphanumeric + hyphens only)
  storeId = storeId.replace(/[^a-z0-9\-_]/g, '');

  if (!storeId) {
    return res.status(400).json({
      success: false,
      message: 'Store ID could not be resolved. Use X-Store-Id header or ?storeId= query param.'
    });
  }

  // Attach to request
  req.storeId = storeId;

  // Auto-initialize store if it doesn't exist and using default
  if (!DataLayer.storeExists(storeId) && storeId === config.DEFAULT_STORE_ID) {
    DataLayer.initStore(storeId, { name: 'Default Store', slug: storeId });
  }

  next();
}

/**
 * Strict tenant resolver — rejects if store doesn't exist.
 * Use for API routes that require an existing store.
 */
export function strictTenantResolver(req, res, next) {
  tenantResolver(req, res, () => {
    if (req.storeId && !DataLayer.storeExists(req.storeId)) {
      return res.status(404).json({
        success: false,
        message: `Store "${req.storeId}" not found. Register it first via /api/platform/stores`
      });
    }
    next();
  });
}

export default tenantResolver;
