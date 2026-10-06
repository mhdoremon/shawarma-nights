/**
 * 🧠 ChuruOne Smart Backend — Universal Multi-Tenant Server
 * 
 * One backend. Unlimited stores. Any vertical.
 * 
 * Architecture:
 *   Request → TenantResolver (storeId) → Auth → Module Route → DataLayer → Response
 *   WebSocket → Hub → Per-Store Broadcasting
 */

import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import config from './config/index.js';
import DataLayer from './core/DataLayer.js';
import WebSocketHub from './core/WebSocketHub.js';
import { tenantResolver } from './middleware/tenantResolver.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Module route imports
import catalogRoutes from './modules/catalog/catalog.routes.js';
import ordersRoutes from './modules/orders/orders.routes.js';
import authRoutes from './modules/auth/auth.routes.js';
import dealsRoutes from './modules/deals/deals.routes.js';
import reviewsRoutes from './modules/reviews/reviews.routes.js';
import paymentsRoutes from './modules/payments/payments.routes.js';
import deliveryRoutes from './modules/delivery/delivery.routes.js';
import commsRoutes from './modules/communications/comms.routes.js';
import tenantRoutes from './modules/tenant/tenant.routes.js';
import mediaRoutes from './modules/media/media.routes.js';
import gatewayRoutes from './modules/gateway/gateway.routes.js';
import franchiseRoutes from './modules/franchise/franchise.routes.js';
import { enrichCustomersWithOrderStats } from './utils/helpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Express App Setup ────────────────────────────────────────
const app = express();

// Core middleware
app.use(cors({ origin: config.CORS_ORIGIN }));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

// Static files — serve uploads per store
app.use('/uploads', express.static(path.join(__dirname, 'data', 'stores'), {
  setHeaders: (res) => {
    res.set('Cache-Control', 'public, max-age=86400');
  }
}));

// Also serve from old path for backward compatibility
const oldUploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(oldUploadsDir)) fs.mkdirSync(oldUploadsDir, { recursive: true });
app.use('/uploads', express.static(oldUploadsDir));

// Serve frontend dist if exists (backward compat)
const distDir = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
}

// ─── Health Check (no tenant needed) ──────────────────────────
app.get(['/healthz', '/api/health'], (req, res) => {
  const stores = DataLayer.listStoreIds();
  const wsStats = WebSocketHub.getStats();
  res.json({
    status: 'ok',
    engine: 'ChuruOne Smart Backend v1.0',
    stores: stores.length,
    activeConnections: wsStats,
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    mongo: {
      hasUri: Boolean(process.env.MONGODB_URI),
      uriMasked: process.env.MONGODB_URI ? process.env.MONGODB_URI.replace(/:([^@]+)@/, ':****@') : 'NONE_NOT_SET',
      isConnected: DataLayer.isMongoReady(),
      error: DataLayer.getMongoError() || null
    }
  });
});

// ─── Platform Routes (no tenant needed) ──────────────────────
app.use('/api/platform', tenantRoutes);

// ─── Tenant Resolver (all routes below need storeId) ─────────
app.use(tenantResolver);

// ─── Store-Scoped API Routes ─────────────────────────────────
// Catalog: routes already have /menu, /categories prefixes
app.use('/api', catalogRoutes);
// Orders: routes have /, /place, /update-status → mount at /api/orders
app.use('/api/orders', ordersRoutes);
// Auth: support both /api/auth/* (customer OTP) and /api/admin/* (Dukandar portal)
app.use(['/api/auth', '/api'], authRoutes);
// Deals & Coupons: routes already have /deals/*, /coupon/* prefixes
app.use('/api', dealsRoutes);
// Reviews: routes have /, /:id → mount at /api/reviews
app.use('/api/reviews', reviewsRoutes);
// Payments: routes already have /payment/* prefix
app.use('/api', paymentsRoutes);
// Delivery: routes have /register, /login, etc → mount at /api/delivery
app.use('/api/delivery', deliveryRoutes);
// Communications: routes have /status, /test-sms → mount at /api/comms
app.use('/api/comms', commsRoutes);
// Media: routes have /upload → mount at /api
app.use('/api', mediaRoutes);
// Gateway: routes have /status → mount at /api/gateway
app.use('/api/gateway', gatewayRoutes);
// Franchise: routes have /franchise/*, /admin/franchise/* → mount at /api
app.use('/api', franchiseRoutes);
// Store Info & Hero (from tenant module): routes have /store-info, /hero
import { storeInfoRouter } from './modules/tenant/tenant.routes.js';
app.use('/api', storeInfoRouter);

// ─── Backward Compat: /api/data (all-in-one endpoint) ────────
app.get('/api/data', (req, res) => {
  const storeId = req.storeId;
  const storeConfig = DataLayer.getStoreConfig(storeId);
  const menuData = DataLayer.read(storeId, 'menu') || { menu: [], categories: [] };
  const orders = DataLayer.read(storeId, 'orders') || [];
  const deals = DataLayer.read(storeId, 'deals') || [];
  const reviews = DataLayer.read(storeId, 'reviews') || [];
  const rawCustomers = DataLayer.read(storeId, 'customers') || [];
  const customers = enrichCustomersWithOrderStats(rawCustomers, orders);
  const franchiseData = DataLayer.read(storeId, 'franchise') || {};

  res.json({
    menu: menuData.menu || [],
    categories: menuData.categories || [],
    orders,
    deals,
    reviews,
    customers,
    franchise: franchiseData.config || {},
    heroBanner: storeConfig?.heroBanner || {},
    storeInfo: {
      ...(storeConfig?.settings || {}),
      payment: storeConfig?.payment || {},
      ...(storeConfig?.payment || {}),
      socials: storeConfig?.socials || {},
      taxesAndCharges: storeConfig?.taxesAndCharges || storeConfig?.tax || {},
      name: storeConfig?.name || storeConfig?.settings?.name || 'Shawarma Nights',
      vertical: storeConfig?.vertical || 'food',
      branding: storeConfig?.branding || {},
      address: storeConfig?.settings?.address || '',
      timing: storeConfig?.settings?.timing || '',
      freeDeliveryThreshold: storeConfig?.settings?.freeDeliveryThreshold ?? 350
    },
    adminAccount: storeConfig?.owner ? { isRegistered: !!storeConfig.owner.token } : { isRegistered: false }
  });
});

// ─── APK Download (backward compat) ──────────────────────────
app.get(['/download/app', '/app.apk'], (req, res) => {
  const candidates = [
    path.join(__dirname, '..', 'public', 'app.apk'),
    path.join(__dirname, '..', 'dist', 'app.apk'),
    path.join(__dirname, '..', 'android-gateway', 'bin', 'ShawarmaSmsGateway.apk')
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      return res.download(p, 'DukandarApp.apk');
    }
  }
  res.status(404).json({ success: false, message: 'APK not found' });
});

// ─── SPA Fallback (serve index.html for client-side routing) ──
if (fs.existsSync(distDir)) {
  app.get('*', (req, res, next) => {
    // Don't intercept API or WebSocket routes
    if (req.path.startsWith('/api') || req.path.startsWith('/ws') || req.path.startsWith('/gateway')) {
      return next();
    }
    const indexPath = path.join(distDir, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
    next();
  });
}

// ─── Error Handling ───────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── HTTP Server + WebSocket ─────────────────────────────────
const server = createServer(app);

// WebSocket message handler — routes messages to appropriate module services
function handleWebSocketMessage(data, ws, storeId, source) {
  const action = data.action || data.type;
  if (!action) return;

  console.log(`📨 [WS ${source}] ${storeId}: ${action}`);

  // Import and delegate to module handlers dynamically
  // Each module registers its WS handlers
  for (const handler of wsMessageHandlers) {
    if (handler(data, ws, storeId, source)) return;
  }

  console.log(`⚠️ [WS] Unhandled action: ${action} from ${source} (${storeId})`);
}

// Registry for WebSocket message handlers
const wsMessageHandlers = [];

export function registerWsHandler(handler) {
  wsMessageHandlers.push(handler);
}

// Register module WS handlers
import { handleGatewayMessage } from './modules/gateway/gateway.service.js';
wsMessageHandlers.push(handleGatewayMessage);

// Initialize WebSocket Hub
WebSocketHub.init(server, handleWebSocketMessage);

// ─── Initialize Default Store ─────────────────────────────────
function initDefaultStore() {
  if (!DataLayer.storeExists(config.DEFAULT_STORE_ID)) {
    console.log(`🏪 Initializing default store: "${config.DEFAULT_STORE_ID}"`);
    DataLayer.initStore(config.DEFAULT_STORE_ID, {
      name: 'Shawarma Nights',
      slug: 'shawarma-nights',
      vertical: 'food'
    });
  }
}

// ─── Migrate Existing Data (if upgrading from old backend) ────
function migrateExistingData() {
  const oldDataDir = path.join(__dirname, '..', 'server', 'data');
  const storeId = config.DEFAULT_STORE_ID;
  const storeDataDir = DataLayer.getStorePath(storeId);

  // Check if store was already migrated — never run or overwrite again!
  const migrationLock = path.join(storeDataDir, '.migrated');
  if (fs.existsSync(migrationLock)) {
    console.log(`ℹ️ [Migration] Store "${storeId}" already migrated. Skipping migration.`);
    return;
  }

  // Check if old data exists and store data doesn't
  if (!fs.existsSync(oldDataDir)) return;

  const filesToMigrate = [
    { old: 'menu.json', new: 'menu.json' },
    { old: 'orders.json', new: 'orders.json' },
    { old: 'customers.json', new: 'customers.json' },
    { old: 'deals.json', new: 'deals.json' },
    { old: 'coupon_usage.json', new: 'coupon_usage.json' },
    { old: 'used_utrs.json', new: 'used_utrs.json' },
    { old: 'delivery_boys.json', new: 'delivery_boys.json' }
  ];

  let migrated = 0;
  for (const f of filesToMigrate) {
    const oldPath = path.join(oldDataDir, f.old);
    const newPath = path.join(storeDataDir, f.new);

    if (!fs.existsSync(oldPath)) continue;

    // Check if new file is empty/default (needs migration)
    let needsMigration = !fs.existsSync(newPath);
    if (!needsMigration) {
      try {
        const existing = JSON.parse(fs.readFileSync(newPath, 'utf-8'));
        // Consider empty arrays, empty objects, or default structures as needing migration
        const isEmpty = Array.isArray(existing) ? existing.length === 0 :
          (typeof existing === 'object' && existing !== null) ?
            (existing.menu ? existing.menu.length === 0 && (existing.categories || []).length === 0 : Object.keys(existing).length === 0) :
            true;
        if (isEmpty) needsMigration = true;
      } catch { needsMigration = true; }
    }

    if (needsMigration) {
      try {
        const data = JSON.parse(fs.readFileSync(oldPath, 'utf-8'));
        // Don't overwrite with empty old data either
        const oldIsEmpty = Array.isArray(data) ? data.length === 0 :
          (typeof data === 'object' && data !== null) ?
            (data.menu ? data.menu.length === 0 : Object.keys(data).length === 0) : true;
        if (!oldIsEmpty) {
          DataLayer.writeSync(storeId, f.new, data);
          DataLayer.invalidateCache(storeId);
          migrated++;
        }
      } catch (err) {
        console.error(`⚠️ [Migration] Failed to migrate ${f.old}:`, err.message);
      }
    }
  }

  // Migrate dukandar.json → store config
  const oldDukandarPath = path.join(oldDataDir, 'dukandar.json');
  if (fs.existsSync(oldDukandarPath)) {
    try {
      const oldData = JSON.parse(fs.readFileSync(oldDukandarPath, 'utf-8'));
      const currentConfig = DataLayer.getStoreConfig(storeId) || {};

      // Map old fields to new config structure
      if (oldData.adminAccount) {
        currentConfig.owner = {
          name: oldData.adminAccount.dukanName || currentConfig.owner?.name || '',
          phone: oldData.adminAccount.ownerPhone || currentConfig.owner?.phone || '',
          password: oldData.adminAccount.password || '',
          token: oldData.adminAccount.token || '',
          username: oldData.adminAccount.username || ''
        };
      }

      if (oldData.storeInfo) {
        currentConfig.settings = {
          ...currentConfig.settings,
          timing: oldData.storeInfo.timing || currentConfig.settings?.timing || '',
          address: oldData.storeInfo.address || currentConfig.settings?.address || '',
          deliveryNote: oldData.storeInfo.deliveryNote || '',
          locationNote: oldData.storeInfo.locationNote || '',
          aboutText: oldData.storeInfo.aboutText || '',
          halalBadgeText: oldData.storeInfo.halalBadgeText || '',
          freeDeliveryThreshold: oldData.storeInfo.freeDeliveryThreshold ?? 350,
          isOpen: true
        };

        if (oldData.storeInfo.payment) {
          currentConfig.payment = {
            ...currentConfig.payment,
            upiId: oldData.storeInfo.payment.upiId || '',
            payeeName: oldData.storeInfo.payment.payeeName || '',
            autoSmsVerification: oldData.storeInfo.payment.autoSmsVerification ?? true,
            codEnabled: true
          };
        }

        if (oldData.storeInfo.taxesAndCharges) {
          currentConfig.tax = {
            ...currentConfig.tax,
            enabled: oldData.storeInfo.taxesAndCharges.enabled || false,
            defaultTaxRate: oldData.storeInfo.taxesAndCharges.taxPercent || 0
          };
          currentConfig.settings.packagingCharge = oldData.storeInfo.taxesAndCharges.packagingCharge || 0;
        }

        if (oldData.storeInfo.socials) {
          currentConfig.socials = { ...currentConfig.socials, ...oldData.storeInfo.socials };
        }

        if (oldData.storeInfo.name) {
          currentConfig.name = oldData.storeInfo.name;
        }
      }

      // Only set heroBanner if currentConfig doesn't have one
      if (oldData.heroBanner && (!currentConfig.heroBanner || Object.keys(currentConfig.heroBanner).length === 0)) {
        currentConfig.heroBanner = oldData.heroBanner;
      }

      // Save reviews from dukandar.json
      if (oldData.reviews && Array.isArray(oldData.reviews)) {
        const existingReviews = DataLayer.read(storeId, 'reviews') || [];
        if (existingReviews.length === 0) {
          DataLayer.writeSync(storeId, 'reviews', oldData.reviews);
          migrated++;
        }
      }

      // Save orders from dukandar.json if orders.json is empty
      if (oldData.orders && Array.isArray(oldData.orders)) {
        const existingOrders = DataLayer.read(storeId, 'orders') || [];
        if (existingOrders.length === 0 && oldData.orders.length > 0) {
          DataLayer.writeSync(storeId, 'orders', oldData.orders);
          migrated++;
        }
      }

      DataLayer.updateStoreConfig(storeId, currentConfig);
      migrated++;
    } catch (err) {
      console.error('⚠️ [Migration] Failed to migrate dukandar.json:', err.message);
    }
  }

  // Create migration lock file so this never runs again
  try {
    fs.writeFileSync(migrationLock, JSON.stringify({ migratedAt: new Date().toISOString() }), 'utf-8');
  } catch (err) {
    console.warn('⚠️ [Migration] Could not write .migrated lock:', err.message);
  }

  if (migrated > 0) {
    console.log(`📦 [Migration] Migrated ${migrated} file(s) from old backend to store "${storeId}"`);
  }
}

// ─── Start Server ─────────────────────────────────────────────
const PORT = config.PORT;

server.listen(PORT, async () => {
  console.log('\n' + '═'.repeat(60));
  console.log('  🧠 ChuruOne Smart Backend v1.0');
  console.log('  🌐 Multi-Tenant Engine Started');
  console.log(`  🚀 HTTP:  http://localhost:${PORT}`);
  console.log(`  🔌 WS:    ws://localhost:${PORT}/ws`);
  console.log(`  📱 GW:    ws://localhost:${PORT}/gateway`);
  console.log(`  📁 Data:  ${config.DATA_DIR}`);
  console.log(`  🏪 Default Store: "${config.DEFAULT_STORE_ID}"`);
  console.log('═'.repeat(60) + '\n');

  // Connect to MongoDB Atlas (if MONGODB_URI is provided)
  await DataLayer.initMongo();

  // Init default store & migrate
  initDefaultStore();
  migrateExistingData();

  const stores = DataLayer.listStoreIds();
  console.log(`📊 Active Stores: ${stores.length} → [${stores.join(', ')}]`);

  // 24/7 Keep-Alive Self-Ping: Keeps Render free instance awake so it never sleeps
  const KEEP_ALIVE_URL = process.env.RENDER_EXTERNAL_URL || 'https://churuone-backend.onrender.com';
  console.log(`💓 [24/7 Keep-Alive] Initializing heartbeat for: ${KEEP_ALIVE_URL}`);

  setInterval(async () => {
    try {
      const res = await fetch(`${KEEP_ALIVE_URL}/healthz`);
      if (res.ok) {
        console.log(`💓 [24/7 Keep-Alive] Pinged ${KEEP_ALIVE_URL}/healthz - Server awake.`);
      }
    } catch (err) {
      console.warn('⚠️ [24/7 Keep-Alive] Ping error:', err.message);
    }
  }, 8 * 60 * 1000); // 8 minutes interval (Render free tier sleeps after 15 mins)
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  DataLayer.stopFlushTimer();
  server.close(() => process.exit(0));
});

export { app, server };
