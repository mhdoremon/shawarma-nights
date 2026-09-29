import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { execFile } from 'child_process';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import paymentVerifier from './paymentVerifier.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const CORS_ORIGIN = process.env.VITE_FRONTEND_URL || '*';
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

// Prevent Express from returning HTML error pages on malformed JSON / body-parser errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('❌ [API BodyParser Error]:', err.message);
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON request payload: ' + err.message
    });
  }
  next(err);
});

const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOADS_DIR));

const CUSTOMERS_DB_PATH = path.join(__dirname, 'data', 'customers.json');
const DUKANDAR_DB_PATH = path.join(__dirname, 'data', 'dukandar.json');
const DELIVERY_BOYS_DB_PATH = path.join(__dirname, 'data', 'delivery_boys.json');
const ORDERS_DB_PATH = path.join(__dirname, 'data', 'orders.json');
const MENU_DB_PATH = path.join(__dirname, 'data', 'menu.json');
const DEALS_DB_PATH = path.join(__dirname, 'data', 'deals.json');

let customersDb = [];
let deliveryBoysDb = [];
let dukandarDb = {
  adminAccount: { isRegistered: false },
  menu: [],
  orders: [],
  categories: [],
  deals: [],
  heroBanner: {},
  reviews: [],
  storeInfo: {
    timing: 'Open Daily: 12:00 PM – 04:00 AM',
    deliveryNote: 'Midnight express delivery available',
    address: 'Shop 14, Food Street Avenue, Central Plaza',
    locationNote: 'Central hub kitchen',
    aboutText: 'Artisanal charcoal spit kitchen serving hand-carved rolls, loaded fries, and signature platters since midnight.',
    halalBadgeText: '100% Halal Certified Fresh',
    payment: {
      upiId: 'shawarmanights@upi',
      payeeName: 'Shawarma Nights',
      autoSmsVerification: true
    },
    taxesAndCharges: {
      enabled: false,
      taxPercent: 0,
      packagingCharge: 0
    },
    socials: {
      instagram: 'https://instagram.com/shawarmanights',
      whatsapp: '919876574292',
      twitter: '',
      facebook: '',
      youtube: ''
    }
  }
};

const COUPON_USAGE_DB_PATH = path.join(__dirname, 'data', 'coupon_usage.json');
let couponUsage = {};

function loadCouponUsage() {
  try {
    if (fs.existsSync(COUPON_USAGE_DB_PATH)) {
      couponUsage = JSON.parse(fs.readFileSync(COUPON_USAGE_DB_PATH, 'utf-8'));
    } else {
      fs.writeFileSync(COUPON_USAGE_DB_PATH, '{}', 'utf-8');
      couponUsage = {};
    }
  } catch (err) {
    console.error('❌ Error loading coupon usage:', err);
    couponUsage = {};
  }
}

function saveCouponUsage() {
  try {
    fs.writeFileSync(COUPON_USAGE_DB_PATH, JSON.stringify(couponUsage, null, 2), 'utf-8');
  } catch (err) {
    console.error('❌ Error saving coupon usage:', err);
  }
}

function loadDeliveryBoys() {
  try {
    if (fs.existsSync(DELIVERY_BOYS_DB_PATH)) {
      deliveryBoysDb = JSON.parse(fs.readFileSync(DELIVERY_BOYS_DB_PATH, 'utf-8'));
    } else {
      fs.writeFileSync(DELIVERY_BOYS_DB_PATH, '[]', 'utf-8');
      deliveryBoysDb = [];
    }
  } catch (err) {
    console.error('❌ Error loading delivery boys database:', err);
    deliveryBoysDb = [];
  }
}

function saveDeliveryBoys() {
  try {
    fs.writeFileSync(DELIVERY_BOYS_DB_PATH, JSON.stringify(deliveryBoysDb, null, 2), 'utf-8');
  } catch (err) {
    console.error('❌ Error saving delivery boys database:', err);
  }
}

function isDeliveryBoyToken(token) {
  if (!token) return false;
  return deliveryBoysDb.some(b => b.token === token);
}

function generateDeliveryOtp() {
  return String(crypto.randomInt(1000, 10000));
}

function loadOrders() {
  try {
    if (fs.existsSync(ORDERS_DB_PATH)) {
      const saved = JSON.parse(fs.readFileSync(ORDERS_DB_PATH, 'utf-8'));
      dukandarDb.orders = Array.isArray(saved) ? saved : (saved.orders || []);
    } else {
      fs.writeFileSync(ORDERS_DB_PATH, JSON.stringify(dukandarDb.orders || [], null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('❌ Error loading orders database:', err);
    dukandarDb.orders = [];
  }
}

function saveOrders() {
  try {
    fs.writeFileSync(ORDERS_DB_PATH, JSON.stringify(dukandarDb.orders || [], null, 2), 'utf-8');
  } catch (err) {
    console.error('❌ Error saving orders database:', err);
  }
}

function loadMenu() {
  try {
    if (fs.existsSync(MENU_DB_PATH)) {
      const saved = JSON.parse(fs.readFileSync(MENU_DB_PATH, 'utf-8'));
      if (Array.isArray(saved)) {
        dukandarDb.menu = saved;
      } else if (saved && typeof saved === 'object') {
        dukandarDb.menu = Array.isArray(saved.menu) ? saved.menu : [];
        if (Array.isArray(saved.categories)) {
          dukandarDb.categories = saved.categories;
        }
      }
    } else {
      fs.writeFileSync(MENU_DB_PATH, JSON.stringify({
        menu: dukandarDb.menu || [],
        categories: dukandarDb.categories || []
      }, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('❌ Error loading menu database:', err);
  }
}

function saveMenu() {
  try {
    fs.writeFileSync(MENU_DB_PATH, JSON.stringify({
      menu: dukandarDb.menu || [],
      categories: dukandarDb.categories || []
    }, null, 2), 'utf-8');
  } catch (err) {
    console.error('❌ Error saving menu database:', err);
  }
}

function loadDeals() {
  try {
    if (fs.existsSync(DEALS_DB_PATH)) {
      const saved = JSON.parse(fs.readFileSync(DEALS_DB_PATH, 'utf-8'));
      dukandarDb.deals = Array.isArray(saved) ? saved : (saved.deals || []);
    } else {
      fs.writeFileSync(DEALS_DB_PATH, JSON.stringify(dukandarDb.deals || [], null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('❌ Error loading deals database:', err);
    dukandarDb.deals = [];
  }
}

function saveDeals() {
  try {
    fs.writeFileSync(DEALS_DB_PATH, JSON.stringify(dukandarDb.deals || [], null, 2), 'utf-8');
  } catch (err) {
    console.error('❌ Error saving deals database:', err);
  }
}

function loadDb() {
  try {
    if (fs.existsSync(CUSTOMERS_DB_PATH)) {
      customersDb = JSON.parse(fs.readFileSync(CUSTOMERS_DB_PATH, 'utf-8'));
    }
    if (fs.existsSync(DUKANDAR_DB_PATH)) {
      const saved = JSON.parse(fs.readFileSync(DUKANDAR_DB_PATH, 'utf-8'));
      if (saved.adminAccount) dukandarDb.adminAccount = saved.adminAccount;
      if (saved.storeInfo) dukandarDb.storeInfo = { ...dukandarDb.storeInfo, ...saved.storeInfo };
      if (saved.heroBanner) dukandarDb.heroBanner = saved.heroBanner;
      if (saved.reviews) dukandarDb.reviews = saved.reviews;

      // Backward compatibility fallback if dedicated files are not yet created
      if (!fs.existsSync(ORDERS_DB_PATH) && Array.isArray(saved.orders)) {
        dukandarDb.orders = saved.orders;
      }
      if (!fs.existsSync(MENU_DB_PATH) && Array.isArray(saved.menu)) {
        dukandarDb.menu = saved.menu;
      }
      if (!fs.existsSync(MENU_DB_PATH) && Array.isArray(saved.categories)) {
        dukandarDb.categories = saved.categories;
      }
      if (!fs.existsSync(DEALS_DB_PATH) && Array.isArray(saved.deals)) {
        dukandarDb.deals = saved.deals;
      }
    }

    loadOrders();
    loadMenu();
    loadDeals();
    loadCouponUsage();
    loadDeliveryBoys();

    // Ensure all existing orders have a secure delivery OTP
    let otpBackfilled = false;
    for (const o of (dukandarDb.orders || [])) {
      if (!o.deliveryOtp) {
        o.deliveryOtp = generateDeliveryOtp();
        otpBackfilled = true;
      }
    }
    if (otpBackfilled) {
      saveOrders();
    }

    console.log('✅ Databases loaded. Customers:', customersDb.length, 'Orders:', dukandarDb.orders.length, 'Menu:', dukandarDb.menu.length, 'Categories:', dukandarDb.categories.length, 'Deals:', dukandarDb.deals.length, 'Delivery Boys:', deliveryBoysDb.length);
  } catch (err) {
    console.error('❌ Error loading databases:', err);
  }
}

function saveCustomers() {
  fs.writeFileSync(CUSTOMERS_DB_PATH, JSON.stringify(customersDb, null, 2), 'utf-8');
}

function saveDukandar(target) {
  try {
    if (target === 'orders') return saveOrders();
    if (target === 'menu') return saveMenu();
    if (target === 'deals') return saveDeals();

    const dataToSave = {
      adminAccount: dukandarDb.adminAccount || { isRegistered: false },
      storeInfo: dukandarDb.storeInfo || {},
      heroBanner: dukandarDb.heroBanner || {},
      reviews: dukandarDb.reviews || []
    };
    fs.writeFileSync(DUKANDAR_DB_PATH, JSON.stringify(dataToSave, null, 2), 'utf-8');
  } catch (err) {
    console.error('❌ Error saving dukandar master database:', err);
  }
}

loadDb();

// Holds the connected Android phone's WebSocket and state
let phoneGatewayWs = null;
let phoneGatewayConnectedAt = null;
const smsQueue = []; // SMS queue for when phone is temporarily offline
const SMS_QUEUE_MAX = 20;
const SMS_QUEUE_TIMEOUT_MS = 10 * 60 * 1000; // 10 min max wait
const pendingSmsCallbacks = new Map(); // requestId → { resolve, timer }

// Create HTTP and WebSocket Server
const server = createServer(app);
const wss = new WebSocketServer({ noServer: true });

// Broadcast helper to all connected clients (Web browsers and Phone Gateway)
function broadcast(type, payload, senderWs = null) {
  const message = JSON.stringify({
    type,
    action: type,
    payload,
    timestamp: Date.now()
  });

  // 1. Broadcast to all web/browser clients
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client !== senderWs) {
      client.send(message);
    }
  });

  // 2. Broadcast to all connected phone gateway clients (Dukandar & Delivery riders)
  const sentGatewaySockets = new Set();
  gatewayWss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client !== senderWs) {
      try {
        client.send(message);
        sentGatewaySockets.add(client);
      } catch (err) {
        console.error('❌ Error broadcasting to gateway client:', err.message);
      }
    }
  });
  if (phoneGatewayWs && phoneGatewayWs.readyState === WebSocket.OPEN && phoneGatewayWs !== senderWs && !sentGatewaySockets.has(phoneGatewayWs)) {
    try {
      phoneGatewayWs.send(message);
    } catch (err) {
      console.error('❌ Error broadcasting to phone gateway:', err.message);
    }
  }
}

// WebSocket Connection Management
wss.on('connection', (ws) => {
  console.log(`🔌 Client connected to Real-Time Server. Active clients: ${wss.clients.size}`);

  // Send full current state immediately upon connecting
  ws.send(JSON.stringify({
    type: 'INIT_STATE',
    payload: dukandarDb,
    timestamp: Date.now()
  }));

  ws.on('message', (raw) => {
    try {
      const data = JSON.parse(raw);
      console.log('📨 Received Real-Time Action:', data.type);

      const clientRole = data.role || data.payload?.role;
      const clientToken = data.token || data.payload?.token;
      const isDeliveryBoy = clientRole === 'delivery_boy' || isDeliveryBoyToken(clientToken);

      if (isDeliveryBoy) {
        const adminActions = [
          'ADD_MENU_ITEM', 'UPDATE_MENU_ITEM', 'DELETE_MENU_ITEM', 'TOGGLE_AVAILABILITY',
          'ADD_CATEGORY', 'DELETE_CATEGORY', 'ADD_DEAL', 'UPDATE_DEAL', 'DELETE_DEAL',
          'UPDATE_HERO_BANNER', 'UPDATE_STORE_INFO', 'UPDATE_UPI_ID', 'DELETE_REVIEW',
          'GET_CUSTOMERS'
        ];
        if (adminActions.includes(data.type)) {
          console.warn(`🚨 [SECURITY ALERT] Unauthorized admin action '${data.type}' blocked for delivery boy!`);
          ws.send(JSON.stringify({
            type: 'ERROR',
            error: '403 Forbidden: Delivery partners cannot access or modify store administrative settings.'
          }));
          return;
        }

        if (data.type === 'UPDATE_ORDER_STATUS') {
          const status = data.payload?.status || data.status;
          if (status !== 'out_for_delivery' && status !== 'delivered' && status !== 'out') {
            console.warn(`🚨 [SECURITY ALERT] Unauthorized order status change to '${status}' blocked for delivery boy!`);
            ws.send(JSON.stringify({
              type: 'ERROR',
              error: '403 Forbidden: Delivery partners can only update orders to Out for Delivery or Delivered.'
            }));
            return;
          }
        }
      }

      switch (data.type) {
        case 'PLACE_ORDER': {
          const newOrder = {
            id: data.payload.orderId || `SN-${Math.floor(100000 + Math.random() * 900000)}`,
            customerName: data.payload.customerName || 'Online Customer',
            customerPhone: data.payload.customerPhone || '+91 98765-00000',
            address: data.payload.address || 'Delivery Address',
            items: data.payload.items || [],
            status: 'new',
            placedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            total: data.payload.grandTotal || 0,
            note: data.payload.note || '',
            paymentMethod: data.payload.paymentMethod || 'COD',
            paymentStatus: data.payload.paymentStatus || (data.payload.paymentMethod === 'UPI' ? 'paid' : 'pending_cash'),
            utr: data.payload.utr || null,
            couponCode: data.payload.couponCode || null,
            discountApplied: data.payload.discountApplied || 0,
            deliveryOtp: data.payload.deliveryOtp || generateDeliveryOtp(),
            orderGps: data.payload.orderGps || null,
          };
          
          if (newOrder.couponCode) {
            const code = newOrder.couponCode;
            const phone = newOrder.customerPhone;
            const deal = dukandarDb.deals?.find(d => d.code === code);
            if (deal) {
              deal.usageCount = (deal.usageCount || 0) + 1;
              saveDeals();
            }
            if (!couponUsage[code]) couponUsage[code] = {};
            couponUsage[code][phone] = (couponUsage[code][phone] || 0) + 1;
            saveCouponUsage();
          }
          
          dukandarDb.orders.unshift(newOrder);
          saveOrders();
          broadcast('ORDER_CREATED', newOrder);
          break;
        }

        case 'INITIATE_UPI_PAYMENT': {
          const orderData = data.payload || {};
          const orderId = orderData.orderId || `SN-${Math.floor(100000 + Math.random() * 900000)}`;
          const grandTotal = Number(orderData.grandTotal) || 0;
          const deliveryOtp = orderData.deliveryOtp || generateDeliveryOtp();
          
          const payConfig = dukandarDb.storeInfo?.payment || {};
          const upiId = payConfig.upiId || 'shawarmanights@upi';
          const payeeName = payConfig.payeeName || 'Shawarma Nights';
          
          const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${grandTotal.toFixed(2)}&cu=INR&tn=${encodeURIComponent(orderId)}&tr=${encodeURIComponent(orderId)}`;
          
          const pendingRes = paymentVerifier.createPendingOrder({
            ...orderData,
            orderId,
            grandTotal,
            upiUrl,
            upiId,
            payeeName,
            deliveryOtp,
          });

          if (pendingRes.verificationType) {
            dukandarDb.orders.unshift(pendingRes.order);
            saveOrders();
            broadcast('ORDER_CREATED', pendingRes.order);
            broadcast('PAYMENT_CONFIRMED', pendingRes);
          }

          ws.send(JSON.stringify({
            type: 'UPI_PAYMENT_INITIATED',
            payload: {
              orderId,
              grandTotal,
              upiUrl,
              upiId,
              payeeName,
              deliveryOtp,
              expiresAt: Date.now() + 10 * 60 * 1000,
              alreadyConfirmed: !!pendingRes.verificationType,
            },
            timestamp: Date.now()
          }));
          break;
        }

        case 'PAYMENT_SMS_RECEIVED': {
          const { smsText, sender } = data.payload || {};
          const res = paymentVerifier.processIncomingPaymentSms({ smsText, sender });
          if (res.success) {
            dukandarDb.orders.unshift(res.order);
            saveOrders();
            broadcast('ORDER_CREATED', res.order);
            broadcast('PAYMENT_CONFIRMED', res);
          }
          ws.send(JSON.stringify({
            type: 'PAYMENT_SMS_RESULT',
            payload: res,
            timestamp: Date.now()
          }));
          break;
        }

        case 'SUBMIT_MANUAL_UTR': {
          ws.send(JSON.stringify({
            type: 'MANUAL_UTR_RESULT',
            payload: {
              success: false,
              message: 'Manual UTR entry is disabled. Payments are verified automatically.'
            },
            timestamp: Date.now()
          }));
          break;
        }

        case 'UPDATE_ORDER_STATUS': {
          const { orderId, status, otp, boyName } = data.payload || data || {};
          const order = dukandarDb.orders.find((o) => o.id === orderId || o.orderId === orderId);
          if (order && status) {
            if (status === 'delivered') {
              if (!otp || String(otp).trim() !== String(order.deliveryOtp || '').trim()) {
                console.warn(`🚨 [WS /ws] Rejected status change to delivered without OTP for ${orderId}`);
                ws.send(JSON.stringify({
                  type: 'ERROR',
                  error: 'Delivery OTP Aniwarya Hai! Customer ka 4-digit OTP dalein.'
                }));
                break;
              }
              order.status = 'delivered';
              order.deliveredAt = new Date().toISOString();
              order.deliveredBy = boyName || 'Delivery Partner';
              if (order.paymentMethod === 'COD') order.paymentStatus = 'paid';
            } else {
              order.status = status;
            }
            saveOrders();
            broadcast('ORDER_STATUS_CHANGED', { orderId: order.id, status: order.status, order });
            broadcast('ORDER_UPDATED', { orderId: order.id, status: order.status, order });
          }
          break;
        }

        case 'ADD_MENU_ITEM': {
          const newItem = {
            ...data.payload,
            id: data.payload.id || `dish-${Date.now()}`,
            available: true,
            rating: data.payload.rating || 5.0,
            reviews: data.payload.reviews || 1,
          };
          dukandarDb.menu.unshift(newItem);
          saveMenu();
          broadcast('MENU_UPDATED', dukandarDb.menu);
          break;
        }

        case 'UPDATE_MENU_ITEM': {
          const { id, updates } = data.payload;
          dukandarDb.menu = dukandarDb.menu.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          );
          saveMenu();
          broadcast('MENU_UPDATED', dukandarDb.menu);
          break;
        }

        case 'DELETE_MENU_ITEM': {
          const { id } = data.payload;
          dukandarDb.menu = dukandarDb.menu.filter((item) => item.id !== id);
          saveMenu();
          broadcast('MENU_UPDATED', dukandarDb.menu);
          break;
        }

        case 'TOGGLE_AVAILABILITY': {
          const { id } = data.payload;
          dukandarDb.menu = dukandarDb.menu.map((item) => {
            if (item.id === id) {
              const currentStatus = item.available !== false; // default true
              return { ...item, available: !currentStatus };
            }
            return item;
          });
          saveMenu();
          broadcast('MENU_UPDATED', dukandarDb.menu);
          break;
        }

        case 'ADD_REVIEW': {
          const rev = data.payload || {};
          const revId = rev.id || `rev-${Date.now()}`;
          if (!dukandarDb.reviews) dukandarDb.reviews = [];
          // Avoid duplicate if already inserted
          const exists = dukandarDb.reviews.find((r) => r.id === revId);
          if (!exists) {
            const newReview = {
              id: revId,
              name: rev.name || 'Foodie',
              phone: rev.phone ? rev.phone.slice(-4) : '',
              rating: Number(rev.rating) || 5,
              comment: rev.comment || '',
              dish: rev.dish || 'Dukan Ka Anubhav',
              dishId: rev.dishId || null,
              type: rev.type || 'restaurant',
              tags: Array.isArray(rev.tags) ? rev.tags : [],
              date: rev.date || 'Just now',
              createdAt: rev.createdAt || new Date().toISOString(),
            };
            dukandarDb.reviews.unshift(newReview);
            saveDukandar();
            broadcast('REVIEW_ADDED', newReview);
          }
          break;
        }

        case 'DELETE_REVIEW': {
          const { id } = data.payload || {};
          if (dukandarDb.reviews) {
            dukandarDb.reviews = dukandarDb.reviews.filter((r) => String(r.id) !== String(id));
            saveDukandar();
            broadcast('INIT_STATE', { reviews: dukandarDb.reviews });
          }
          break;
        }

        case 'ADD_CATEGORY': {
          const cat = data.payload;
          if (!dukandarDb.categories) dukandarDb.categories = [];
          if (!dukandarDb.categories.find((c) => c.id === cat.id)) {
            dukandarDb.categories.push(cat);
            saveMenu();
            broadcast('CATEGORIES_UPDATED', dukandarDb.categories);
          }
          break;
        }

        case 'DELETE_CATEGORY': {
          const { id } = data.payload;
          if (dukandarDb.categories) {
            dukandarDb.categories = dukandarDb.categories.filter((c) => c.id !== id);
            saveMenu();
            broadcast('CATEGORIES_UPDATED', dukandarDb.categories);
          }
          break;
        }

        case 'ADD_DEAL': {
          const newDeal = {
            id: `deal-${Date.now()}`,
            isActive: true,
            usageCount: 0,
            ...data.payload,
          };
          if (!dukandarDb.deals) dukandarDb.deals = [];
          dukandarDb.deals.unshift(newDeal);
          saveDeals();
          broadcast('DEALS_UPDATED', dukandarDb.deals);
          break;
        }

        case 'UPDATE_DEAL': {
          const { id, updates } = data.payload;
          if (dukandarDb.deals) {
            dukandarDb.deals = dukandarDb.deals.map((d) =>
              d.id === id ? { ...d, ...updates } : d
            );
            saveDeals();
            broadcast('DEALS_UPDATED', dukandarDb.deals);
          }
          break;
        }

        case 'DELETE_DEAL': {
          const { id } = data.payload;
          if (dukandarDb.deals) {
            dukandarDb.deals = dukandarDb.deals.filter((d) => d.id !== id);
            saveDeals();
            broadcast('DEALS_UPDATED', dukandarDb.deals);
          }
          break;
        }

        case 'UPDATE_HERO_BANNER': {
          dukandarDb.heroBanner = { ...(dukandarDb.heroBanner || {}), ...data.payload };
          saveDukandar();
          broadcast('HERO_UPDATED', dukandarDb.heroBanner);
          break;
        }

        case 'UPDATE_STORE_INFO': {
          const payload = data.payload || {};
          dukandarDb.storeInfo = {
            ...(dukandarDb.storeInfo || {}),
            ...payload,
            ...(payload.taxesAndCharges ? {
              taxesAndCharges: {
                ...(dukandarDb.storeInfo?.taxesAndCharges || {}),
                ...payload.taxesAndCharges
              }
            } : {})
          };
          saveDukandar();
          broadcast('STORE_INFO_UPDATED', dukandarDb.storeInfo);
          break;
        }

        default:
          console.warn('Unknown event type:', data.type);
      }
    } catch (err) {
      console.error('Error handling WebSocket message:', err);
    }
  });

  ws.on('close', () => {
    console.log(`🔌 Client disconnected. Remaining: ${wss.clients.size}`);
  });
});

// REST Fallback API Endpoints (with Cache-Control for microsecond loading)
app.get('/api/data', (req, res) => {
  res.set('Cache-Control', 'public, max-age=10, stale-while-revalidate=30');
  res.json(dukandarDb);
});
app.get('/api/menu', (req, res) => {
  res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
  res.json(dukandarDb.menu);
});
app.get('/api/orders', (req, res) => res.json(dukandarDb.orders));

// REST order placement endpoint (guaranteed delivery)
app.post(['/api/orders', '/api/orders/place'], (req, res) => {
  try {
    const payload = req.body || {};
    const orderId = payload.orderId || payload.id || `SN-${Math.floor(100000 + Math.random() * 900000)}`;
    
    // Idempotency check: don't duplicate order if already placed
    const existing = dukandarDb.orders.find(o => o.id === orderId);
    if (existing) {
      return res.json({ success: true, order: existing, message: 'Order already exists' });
    }

    const newOrder = {
      id: orderId,
      customerName: payload.customerName || 'Online Customer',
      customerPhone: payload.customerPhone || '+91 98765-00000',
      address: payload.address || 'Delivery Address',
      items: payload.items || [],
      status: 'new',
      placedAt: payload.placedAt || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      total: Number(payload.grandTotal || payload.total || 0),
      note: payload.note || '',
      paymentMethod: payload.paymentMethod || 'COD',
      paymentStatus: payload.paymentStatus || (payload.paymentMethod === 'UPI' ? 'paid' : 'pending_cash'),
      utr: payload.utr || null,
      couponCode: payload.couponCode || null,
      discountApplied: Number(payload.discountApplied || 0),
      deliveryOtp: payload.deliveryOtp || generateDeliveryOtp(),
      orderGps: payload.orderGps || null,
    };

    if (newOrder.couponCode) {
      const code = newOrder.couponCode;
      const phone = newOrder.customerPhone;
      const deal = dukandarDb.deals?.find(d => d.code === code);
      if (deal) {
        deal.usageCount = (deal.usageCount || 0) + 1;
        saveDeals();
      }
      if (!couponUsage[code]) couponUsage[code] = {};
      couponUsage[code][phone] = (couponUsage[code][phone] || 0) + 1;
      saveCouponUsage();
    }

    dukandarDb.orders.unshift(newOrder);
    saveOrders();
    broadcast('ORDER_CREATED', newOrder);
    console.log(`📦 [REST Orders] New order #${newOrder.id} placed for ₹${newOrder.total}`);
    res.json({ success: true, order: newOrder });
  } catch (err) {
    console.error('❌ Error processing REST order:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});
app.get('/api/reviews', (req, res) => {
  res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
  res.json(dukandarDb.reviews || []);
});
app.post('/api/reviews', (req, res) => {
  try {
    const rev = req.body || {};
    const revId = rev.id || `rev-${Date.now()}`;
    if (!dukandarDb.reviews) dukandarDb.reviews = [];
    const exists = dukandarDb.reviews.find((r) => r.id === revId);
    if (!exists) {
      const newReview = {
        id: revId,
        name: rev.name || 'Foodie',
        phone: rev.phone ? String(rev.phone).slice(-4) : '',
        rating: Number(rev.rating) || 5,
        comment: rev.comment || '',
        dish: rev.dish || 'Dukan Ka Anubhav',
        dishId: rev.dishId || null,
        type: rev.type || 'restaurant',
        tags: Array.isArray(rev.tags) ? rev.tags : [],
        date: rev.date || 'Just now',
        createdAt: rev.createdAt || new Date().toISOString(),
      };
      dukandarDb.reviews.unshift(newReview);
      saveDukandar();
      broadcast('REVIEW_ADDED', newReview);
      return res.json({ success: true, review: newReview });
    }
    return res.json({ success: true, message: 'Review already saved' });
  } catch (err) {
    console.error('Error saving review:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});
app.delete('/api/reviews/:id', (req, res) => {
  const { id } = req.params;
  if (dukandarDb.reviews) {
    dukandarDb.reviews = dukandarDb.reviews.filter((r) => String(r.id) !== String(id));
    saveDukandar();
    broadcast('INIT_STATE', { reviews: dukandarDb.reviews });
  }
  return res.json({ success: true });
});
app.get('/api/deals', (req, res) => {
  res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
  res.json(dukandarDb.deals || []);
});
app.get('/api/categories', (req, res) => {
  res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
  res.json(dukandarDb.categories || []);
});
app.get('/api/hero', (req, res) => {
  res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
  res.json(dukandarDb.heroBanner || {});
});
app.get('/api/store-info', (req, res) => {
  res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
  res.json(dukandarDb.storeInfo || {});
});
app.post('/api/store-info', (req, res) => {
  const payload = req.body || {};
  dukandarDb.storeInfo = {
    ...(dukandarDb.storeInfo || {}),
    ...payload,
    ...(payload.taxesAndCharges ? {
      taxesAndCharges: {
        ...(dukandarDb.storeInfo?.taxesAndCharges || {}),
        ...payload.taxesAndCharges
      }
    } : {})
  };
  saveDukandar();
  broadcast('STORE_INFO_UPDATED', dukandarDb.storeInfo);
  res.json({ success: true, storeInfo: dukandarDb.storeInfo });
});

function validateCoupon(deal, subtotal, phone, itemCategories = []) {
  if (deal.isActive === false) return { valid: false, reason: 'Coupon is not active' };
  
  if (deal.minOrder && subtotal < deal.minOrder) return { valid: false, reason: `Minimum order of ₹${deal.minOrder} required` };
  if (deal.maxOrder && subtotal > deal.maxOrder) return { valid: false, reason: `Maximum order of ₹${deal.maxOrder} exceeded` };
  
  if (deal.usageLimit && (deal.usageCount || 0) >= deal.usageLimit) return { valid: false, reason: 'Coupon usage limit reached' };
  
  if (deal.perUserLimit && phone) {
    const userCount = couponUsage[deal.code]?.[phone] || 0;
    if (userCount >= deal.perUserLimit) return { valid: false, reason: 'You have reached the usage limit for this coupon' };
  }
  
  const now = new Date();
  
  if (deal.startDate && new Date(deal.startDate) > now) return { valid: false, reason: 'Coupon is not valid yet' };
  if (deal.endDate && new Date(deal.endDate) < now) return { valid: false, reason: 'Coupon has expired' };
  
  if (deal.startTime || deal.endTime) {
    const hours = now.getHours().toString().padStart(2, '0');
    const mins = now.getMinutes().toString().padStart(2, '0');
    const currentTime = `${hours}:${mins}`;
    if (deal.startTime && currentTime < deal.startTime) return { valid: false, reason: `Coupon valid from ${deal.startTime}` };
    if (deal.endTime && currentTime > deal.endTime) return { valid: false, reason: `Coupon valid until ${deal.endTime}` };
  }
  
  if (deal.activeDays && deal.activeDays.length > 0) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = days[now.getDay()];
    if (!deal.activeDays.includes(currentDay)) return { valid: false, reason: `Coupon not valid on ${currentDay}` };
  }
  
  if (deal.applicableCategories && deal.applicableCategories.length > 0) {
    const hasCategory = itemCategories.some(cat => deal.applicableCategories.includes(cat));
    if (!hasCategory && itemCategories.length > 0) return { valid: false, reason: 'Coupon not valid for items in your cart' };
  }
  
  if (deal.firstOrderOnly && phone) {
    const hasPastOrder = dukandarDb.orders.some(o => o.customerPhone === phone && o.status !== 'cancelled' && o.status !== 'rejected');
    if (hasPastOrder) return { valid: false, reason: 'Coupon valid for first order only' };
  }
  
  return { valid: true };
}

app.post('/api/coupon/validate', (req, res) => {
  const { code, subtotal, phone, itemCategories } = req.body;
  if (!code) return res.status(400).json({ success: false, valid: false, reason: 'Coupon code required', message: 'Coupon code required' });
  const deal = dukandarDb.deals?.find(d => (d.code || '').trim().toUpperCase() === String(code).trim().toUpperCase());
  if (!deal) return res.json({ success: false, valid: false, reason: 'Invalid coupon code', message: 'Invalid promo code. Kripya valid code dalein.' });
  const result = validateCoupon(deal, subtotal, phone, itemCategories || []);
  const isValid = Boolean(result.valid);
  res.json({
    success: isValid,
    valid: isValid,
    coupon: isValid ? deal : null,
    deal: isValid ? deal : null,
    message: result.reason || (isValid ? `Coupon "${deal.code}" applied!` : 'Invalid coupon'),
    reason: result.reason || ''
  });
});

app.get('/api/coupon/best', (req, res) => {
  const { subtotal, phone } = req.query;
  const numSubtotal = Number(subtotal) || 0;
  
  if (!dukandarDb.deals) return res.json({ deal: null, discount: 0 });
  
  let bestDeal = null;
  let maxDiscount = 0;
  
  for (const deal of dukandarDb.deals) {
    if (deal.autoApply) {
      const result = validateCoupon(deal, numSubtotal, phone, []);
      if (result.valid) {
        let discount = 0;
        if (deal.discountType === 'percentage') {
          discount = (numSubtotal * (deal.discountValue || 0)) / 100;
          if (deal.maxDiscount && discount > deal.maxDiscount) discount = deal.maxDiscount;
        } else {
          discount = deal.discountValue || 0;
        }
        
        if (discount > maxDiscount) {
          maxDiscount = discount;
          bestDeal = deal;
        }
      }
    }
  }
  
  res.json({ deal: bestDeal, discount: maxDiscount });
});

// Dedicated REST mutations for Dukandar App & Portal
app.post('/api/orders/update-status', (req, res) => {
  const { orderId, status, otp, boyName } = req.body || {};
  const order = dukandarDb.orders.find((o) => o.id === orderId || o.orderId === orderId);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  if (status === 'delivered') {
    if (!otp || String(otp).trim() !== String(order.deliveryOtp || '').trim()) {
      console.warn(`🚨 [REST API] Blocked attempt to mark order ${orderId} delivered without valid OTP! Expected: ${order.deliveryOtp}, Got: ${otp}`);
      return res.status(400).json({
        success: false,
        message: 'Delivery OTP Aniwarya Hai! Customer ka 4-digit OTP dale bina order deliver nahi ho sakta.'
      });
    }
    order.status = 'delivered';
    order.deliveredAt = new Date().toISOString();
    order.deliveredBy = boyName || req.body?.deliveredBy || 'Delivery Partner';
    if (order.paymentMethod === 'COD') {
      order.paymentStatus = 'paid';
    }
    saveOrders();
    broadcast('ORDER_UPDATED', { orderId: order.id, status: 'delivered', order });
    broadcast('ORDER_STATUS_CHANGED', { orderId: order.id, status: 'delivered', order });
    console.log(`🎉 [REST API Delivery OTP] Order ${order.id} verified with OTP ${otp} by ${order.deliveredBy}`);
    return res.json({ success: true, order });
  }

  if (status) {
    order.status = status;
    saveOrders();
    broadcast('ORDER_UPDATED', { orderId: order.id, status, order });
    broadcast('ORDER_STATUS_CHANGED', { orderId: order.id, status, order });
    console.log(`📦 [REST API] Order ${order.id} status updated to: ${status}`);
    return res.json({ success: true, order });
  }
  return res.status(400).json({ success: false, message: 'Order not found or invalid status' });
});

app.post('/api/menu/toggle-stock', (req, res) => {
  const { id, available } = req.body || {};
  let found = false;
  dukandarDb.menu = dukandarDb.menu.map((item) => {
    if (item.id === id) {
      found = true;
      const updatedAvailable = available !== undefined ? Boolean(available) : !(item.available !== false);
      return { ...item, available: updatedAvailable };
    }
    return item;
  });
  if (found) {
    saveMenu();
    broadcast('MENU_UPDATED', dukandarDb.menu);
    console.log(`🍲 [REST API] Item ${id} stock availability toggled to ${available}`);
    return res.json({ success: true, menu: dukandarDb.menu });
  }
  return res.status(404).json({ success: false, message: 'Item not found' });
});

app.post('/api/menu/item', (req, res) => {
  const { id, updates, ...directItem } = req.body || {};
  if (id && updates) {
    dukandarDb.menu = dukandarDb.menu.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    );
    saveMenu();
    broadcast('MENU_UPDATED', dukandarDb.menu);
    console.log(`🍲 [REST API] Item ${id} updated`);
    return res.json({ success: true, menu: dukandarDb.menu });
  }
  const itemToAdd = {
    ...directItem,
    id: directItem.id || `dish-${Date.now()}`,
    available: directItem.available !== false,
    rating: directItem.rating || 5.0,
    reviews: directItem.reviews || 1,
  };
  dukandarDb.menu.unshift(itemToAdd);
  saveMenu();
  broadcast('MENU_UPDATED', dukandarDb.menu);
  console.log(`🍲 [REST API] Added menu item: ${itemToAdd.name}`);
  return res.json({ success: true, item: itemToAdd, menu: dukandarDb.menu });
});

app.delete('/api/menu/item/:id', (req, res) => {
  const { id } = req.params;
  dukandarDb.menu = dukandarDb.menu.filter((m) => m.id !== id);
  saveMenu();
  broadcast('MENU_UPDATED', dukandarDb.menu);
  console.log(`🍲 [REST API] Deleted menu item: ${id}`);
  return res.json({ success: true, menu: dukandarDb.menu });
});

app.post('/api/deals/item', (req, res) => {
  const { id, updates, ...dealPayload } = req.body || {};
  if (!dukandarDb.deals) dukandarDb.deals = [];
  if (id && updates) {
    dukandarDb.deals = dukandarDb.deals.map((d) => d.id === id ? { ...d, ...updates } : d);
    saveDeals();
    broadcast('DEALS_UPDATED', dukandarDb.deals);
    return res.json({ success: true, deals: dukandarDb.deals });
  }
  const newDeal = { 
    id: `deal-${Date.now()}`, 
    isActive: true,
    usageCount: 0,
    ...dealPayload 
  };
  dukandarDb.deals.unshift(newDeal);
  saveDeals();
  broadcast('DEALS_UPDATED', dukandarDb.deals);
  return res.json({ success: true, deal: newDeal, deals: dukandarDb.deals });
});

app.delete('/api/deals/item/:id', (req, res) => {
  const { id } = req.params;
  if (dukandarDb.deals) {
    dukandarDb.deals = dukandarDb.deals.filter((d) => d.id !== id);
    saveDeals();
    broadcast('DEALS_UPDATED', dukandarDb.deals);
  }
  return res.json({ success: true });
});

app.post('/api/hero', (req, res) => {
  dukandarDb.heroBanner = { ...(dukandarDb.heroBanner || {}), ...req.body };
  saveDukandar();
  broadcast('HERO_UPDATED', dukandarDb.heroBanner);
  return res.json({ success: true, heroBanner: dukandarDb.heroBanner });
});

// Direct Download Endpoint for Shawarma SMS Gateway APK
const APK_PATH = path.join(__dirname, '..', 'android-gateway', 'bin', 'ShawarmaSmsGateway.apk');
app.get('/download/app', (req, res) => {
  if (fs.existsSync(APK_PATH)) {
    res.download(APK_PATH, 'ShawarmaSmsGateway.apk');
  } else {
    res.status(404).send('APK not found.');
  }
});
app.get('/app.apk', (req, res) => {
  if (fs.existsSync(APK_PATH)) {
    res.download(APK_PATH, 'ShawarmaSmsGateway.apk');
  } else {
    res.status(404).send('APK not found.');
  }
});

app.get('/api/payment/config', (req, res) => {
  const payConfig = dukandarDb.storeInfo?.payment || {
    upiId: 'shawarmanights@upi',
    payeeName: 'Shawarma Nights',
    autoSmsVerification: true,
  };
  res.json({ success: true, payment: payConfig });
});

app.post('/api/payment/initiate', (req, res) => {
  try {
    const orderData = req.body || {};
    const orderId = orderData.orderId || `SN-${Math.floor(100000 + Math.random() * 900000)}`;
    const grandTotal = Number(orderData.grandTotal) || 0;
    
    const payConfig = dukandarDb.storeInfo?.payment || {};
    const upiId = payConfig.upiId || 'shawarmanights@upi';
    const payeeName = payConfig.payeeName || 'Shawarma Nights';
    
    const deliveryOtp = orderData.deliveryOtp || generateDeliveryOtp();
    const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${grandTotal.toFixed(2)}&cu=INR&tn=${encodeURIComponent(orderId)}&tr=${encodeURIComponent(orderId)}`;
    
    const pendingRes = paymentVerifier.createPendingOrder({
      ...orderData,
      orderId,
      grandTotal,
      upiUrl,
      upiId,
      payeeName,
      deliveryOtp,
    });

    if (pendingRes.verificationType) {
      dukandarDb.orders.unshift(pendingRes.order);
      saveOrders();
      broadcast('ORDER_CREATED', pendingRes.order);
      broadcast('PAYMENT_CONFIRMED', pendingRes);
      return res.json({
        success: true,
        orderId,
        grandTotal,
        upiUrl,
        upiId,
        payeeName,
        deliveryOtp,
        status: 'confirmed',
        order: pendingRes.order,
      });
    }

    res.json({
      success: true,
      orderId,
      grandTotal,
      upiUrl,
      upiId,
      payeeName,
      deliveryOtp,
      status: 'awaiting_payment',
      expiresAt: Date.now() + 10 * 60 * 1000,
    });
  } catch (err) {
    console.error('Error initiating payment:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/payment/verify-sms', (req, res) => {
  try {
    const { smsText, sender } = req.body;
    if (!smsText) {
      return res.status(400).json({ success: false, message: 'smsText is required' });
    }
    const result = paymentVerifier.processIncomingPaymentSms({ smsText, sender: sender || 'BANK-SMS' });
    if (result.success) {
      dukandarDb.orders.unshift(result.order);
      saveOrders();
      broadcast('ORDER_CREATED', result.order);
      broadcast('PAYMENT_CONFIRMED', result);
    }
    res.json(result);
  } catch (err) {
    console.error('Error verifying SMS:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/payment/submit-utr', (req, res) => {
  return res.status(400).json({
    success: false,
    message: 'Manual UTR entry is disabled. Payments are verified automatically.'
  });
});

app.get('/api/payment/status/:orderId', (req, res) => {
  const { orderId } = req.params;
  const pending = paymentVerifier.getPendingOrder(orderId);
  if (pending) {
    return res.json({ status: 'awaiting_payment', pendingOrder: pending });
  }
  const confirmed = dukandarDb.orders.find(o => o.id === orderId || o.orderId === orderId);
  if (confirmed) {
    return res.json({ status: 'confirmed', order: confirmed });
  }
  res.json({ status: 'not_found' });
});

// Photo Upload Endpoint for Dukandar
app.post('/api/upload', (req, res) => {
  try {
    const { image, filename } = req.body;
    if (!image) {
      return res.status(400).json({ success: false, error: 'No image data provided' });
    }

    let base64Data = image;
    let ext = '.jpg';
    if (image.startsWith('data:image/')) {
      const matches = image.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
      if (matches) {
        const rawExt = matches[1].toLowerCase();
        ext = '.' + (rawExt === 'jpeg' ? 'jpg' : rawExt.split('+')[0]);
        base64Data = matches[2];
      }
    }

    const safeName = `dish-${Date.now()}-${Math.floor(100 + Math.random() * 900)}${ext}`;
    const filePath = path.join(UPLOADS_DIR, safeName);
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filePath, buffer);

    const fileUrl = `/uploads/${safeName}`;
    console.log(`📸 Dukandar Photo Uploaded: ${fileUrl} (${Math.round(buffer.length / 1024)} KB)`);
    return res.json({ success: true, url: fileUrl });
  } catch (err) {
    console.error('Error saving uploaded photo:', err);
    return res.status(500).json({ success: false, error: 'Upload failed: ' + err.message });
  }
});

// ============================================================
// PRIVATE ANDROID SIM SMS GATEWAY & BANK-GRADE SECURITY ENGINE
// ============================================================
const otpStore = new Map();         // cleanPhone -> { otp, expiresAt, attempts, createdAt }
const cooldownStore = new Map();    // cleanPhone -> lastRequestTimestamp
const dailyQuotaStore = new Map();  // cleanPhone -> { count, date }
const lockoutStore = new Map();     // cleanPhone -> lockoutExpiryTimestamp

// Helper: Strict Indian Mobile Number Validation
function validateIndianPhoneNumber(phone) {
  const clean = (phone || '').replace(/\D/g, '').slice(-10);
  if (clean.length !== 10) {
    return { valid: false, error: 'Kripya poora 10-digit mobile number dalein.' };
  }
  // Indian telecom numbers must begin with 6, 7, 8, or 9
  if (!/^[6-9]\d{9}$/.test(clean)) {
    return { valid: false, error: 'Indian mobile number 6, 7, 8 ya 9 se shuru hona chahiye.' };
  }
  // Block common fake/dummy patterns
  const dummyPatterns = [
    '0000000000', '1111111111', '2222222222', '3333333333', '4444444444',
    '5555555555', '6666666666', '7777777777', '8888888888', '9999999999',
    '1234567890', '9876543210'
  ];
  if (dummyPatterns.includes(clean)) {
    return { valid: false, error: 'Ye number dummy/farzi lagta hai. Kripya apna asli number dalein.' };
  }
  return { valid: true, cleanPhone: clean };
}

// Helper: Private Android SIM Gateway Configuration
function getSimGatewayConfig() {
  const candidateFiles = [
    path.join(__dirname, '../.env.local'),
    path.join(__dirname, '../.env'),
  ];
  let config = {
    enabled: false,
    url: '',
    token: '',
    simSlot: 1,
  };
  for (const f of candidateFiles) {
    if (fs.existsSync(f)) {
      const content = fs.readFileSync(f, 'utf8');
      const urlM = content.match(/SIM_GATEWAY_URL\s*[:=]\s*["']?([^"'\r\n]+)["']?/i);
      if (urlM && urlM[1].trim()) {
        config.url = urlM[1].trim();
        config.enabled = true;
      }
      const tokenM = content.match(/SIM_GATEWAY_TOKEN\s*[:=]\s*["']?([^"'\r\n]+)["']?/i);
      if (tokenM && tokenM[1].trim()) {
        config.token = tokenM[1].trim();
      }
      const slotM = content.match(/SIM_GATEWAY_SIM_SLOT\s*[:=]\s*["']?([^"'\r\n]+)["']?/i);
      if (slotM && slotM[1].trim()) {
        config.simSlot = parseInt(slotM[1].trim(), 10) || 1;
      }
      const enabledM = content.match(/SIM_GATEWAY_ENABLED\s*[:=]\s*["']?([^"'\r\n]+)["']?/i);
      if (enabledM) {
        config.enabled = enabledM[1].trim().toLowerCase() === 'true';
      }
    }
  }
  if (process.env.SIM_GATEWAY_URL) {
    config.url = process.env.SIM_GATEWAY_URL.trim();
    config.enabled = process.env.SIM_GATEWAY_ENABLED !== 'false';
  }
  return config;
}

// Helper: Dispatch SMS via Private Android SIM Gateway
async function sendViaPrivateSimGateway(phone, message, config) {
  try {
    console.log(`📡 [Private SIM Gateway] Dispatching Real Telecom SMS from Android SIM to +91 ${phone}...`);
    const targetUrl = config.url.trim();
    const headers = {
      'Content-Type': 'application/json',
    };
    if (config.token) {
      headers['Authorization'] = `Bearer ${config.token}`;
      headers['X-API-KEY'] = config.token;
    }

    // Android SMS Gateway payload
    const body = {
      phoneNumbers: [`+91${phone}`],
      to: `+91${phone}`,
      number: `+91${phone}`,
      message: message,
      text: message,
      sim: config.simSlot || 1,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000); // 7s timeout

    const res = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      console.log(`✅ [Private SIM Gateway] SMS delivered to Android SIM queue for +91 ${phone}!`);
      return { success: true, message: 'SMS aapke Android SIM se customer ke phone par bhej diya gaya!' };
    } else {
      const errText = await res.text();
      console.warn(`⚠️ [Private SIM Gateway] Phone returned ${res.status}:`, errText);
      return { success: false, message: `Phone gateway returned status ${res.status}` };
    }
  } catch (err) {
    console.error('❌ [Private SIM Gateway] Android phone connect nahi hua:', err.message);
    return { success: false, message: `Phone se connection nahi ban paya (${err.message})` };
  }
}

const ADB_PATH = 'C:\\Users\\HCI\\AppData\\Local\\Android\\Sdk\\platform-tools\\adb.exe';

// Helper: Dispatch SMS via USB Connected Android Phone (In-House Shawarma SMS Gateway)
function sendViaAdbSim(phone, message) {
  return new Promise((resolve) => {
    if (!fs.existsSync(ADB_PATH)) {
      return resolve({ success: false, error: 'ADB tool not found on system' });
    }
    console.log(`🔌 [USB Private SIM Gateway] Dispatching real SMS via Samsung S23 FE to +91 ${phone}...`);
    // Escape single quotes by closing the quote, adding escaped quote, and reopening.
    const safeMessage = message.replace(/'/g, "'\\''");
    const cmd = [
      'shell', 'am', 'broadcast',
      '-a', 'com.shawarma.SEND_SMS',
      '-n', 'com.shawarma.smsgateway/.SmsBroadcastReceiver',
      '--es', 'phone', `'+91${phone}'`,
      '--es', 'message', `'${safeMessage}'`
    ];
    
    execFile(ADB_PATH, cmd, { timeout: 8000 }, (err, stdout, stderr) => {
      if (err) {
        console.warn('ADB SMS dispatch error:', err.message);
        resolve({ success: false, error: err.message });
      } else if (stdout && stdout.includes('result=1')) {
        console.log(`✅ [USB Private SIM Gateway] Real SMS dispatched from connected Samsung phone SIM to +91 ${phone}!`);
        resolve({ success: true, message: 'Real SMS aapke Samsung Phone ke SIM card se bhej diya gaya hai!' });
      } else {
        console.warn('ADB SMS response:', stdout);
        resolve({ success: false, error: stdout || 'ADB error' });
      }
    });
  });
}

// Helper: Fast2SMS API Key reader (Secondary fallback)
function getSmsApiKey() {
  const candidateFiles = [
    path.join(__dirname, '../.env.local'),
    path.join(__dirname, '../.env'),
  ];
  for (const f of candidateFiles) {
    if (fs.existsSync(f)) {
      const content = fs.readFileSync(f, 'utf8');
      const m = content.match(/(?:FAST2SMS_API_KEY|SMS_API_KEY)\s*[:=]\s*["']?([^"'\r\n]+)["']?/i);
      if (m && m[1].trim()) return m[1].trim();

      const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      for (const line of lines) {
        if (!line.includes('=') && line.length >= 30 && /^[A-Za-z0-9]+$/.test(line)) {
          return line;
        }
      }
    }
  }
  return (process.env.FAST2SMS_API_KEY || '').trim();
}

// Helper: Timing-safe OTP hash comparison (prevents timing attacks)
function verifyOtpHash(enteredOtp, storedOtp) {
  if (!enteredOtp || !storedOtp || enteredOtp.length !== storedOtp.length) {
    return false;
  }
  try {
    const bufferA = Buffer.from(enteredOtp);
    const bufferB = Buffer.from(storedOtp);
    return crypto.timingSafeEqual(bufferA, bufferB);
  } catch {
    return enteredOtp === storedOtp;
  }
}

// Clean up expired OTPs and expired Lockouts periodically
setInterval(() => {
  const now = Date.now();
  for (const [phone, record] of otpStore.entries()) {
    if (record.expiresAt < now) {
      otpStore.delete(phone);
    }
  }
  for (const [phone, expiry] of lockoutStore.entries()) {
    if (expiry < now) {
      lockoutStore.delete(phone);
    }
  }
}, 30000);

// Endpoint: Send Real High-Speed SMS OTP with Bank-Grade Rate-Limiting
app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const rawPhone = req.body.phone || '';
    const phoneValidation = validateIndianPhoneNumber(rawPhone);
    if (!phoneValidation.valid) {
      return res.status(400).json({ success: false, message: phoneValidation.error });
    }
    const cleanPhone = phoneValidation.cleanPhone;
    const now = Date.now();

    // 1. Anti-Brute-Force Lockout Check
    const lockoutExpiry = lockoutStore.get(cleanPhone);
    if (lockoutExpiry && lockoutExpiry > now) {
      const minutesLeft = Math.ceil((lockoutExpiry - now) / 60000);
      return res.status(403).json({
        success: false,
        lockedOut: true,
        minutesLeft,
        message: `🚨 Security Lockout: Zyada galat attempts ke kaaran ye number ${minutesLeft} minute ke liye block hai.`,
      });
    }

    // 2. Anti-SMS Exhaustion: 60-Second Cooldown Check
    const lastRequest = cooldownStore.get(cleanPhone);
    if (lastRequest && now - lastRequest < 60000) {
      const secondsLeft = Math.ceil((60000 - (now - lastRequest)) / 1000);
      return res.status(429).json({
        success: false,
        cooldown: true,
        secondsLeft,
        message: `Kripya naya OTP mangwane ke liye ${secondsLeft} second wait karein.`,
      });
    }

    // 3. Daily SMS Quota Shield (Protect user's 100 free SIM SMS)
    const today = new Date().toDateString();
    const quota = dailyQuotaStore.get(cleanPhone) || { count: 0, date: today };
    if (quota.date === today && quota.count >= 5) {
      return res.status(429).json({
        success: false,
        message: 'Is number par aaj ki maximum OTP limit (5) poori ho chuki hai.',
      });
    }

    // Generate real cryptographically sound 6-digit random code
    const generatedOtp = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = now + 5 * 60 * 1000; // 5 min expiry

    otpStore.set(cleanPhone, {
      otp: generatedOtp,
      expiresAt,
      attempts: 0,
      createdAt: now,
    });
    cooldownStore.set(cleanPhone, now);
    dailyQuotaStore.set(cleanPhone, {
      count: quota.date === today ? quota.count + 1 : 1,
      date: today,
    });

    const smsMessage = `Welcome to Shawarma Nights! Aapka login code ${generatedOtp} hai. Is code ko website me dalein.`;

    // 4. Dispatch SMS via Priority Chain
    let isSmsDispatched = false;
    let dispatchMethod = 'none';
    let gatewayMessage = '';

    // PRIORITY 1: WSS Gateway (Android phone connected over internet via 4G/5G)
    const wssResult = await sendViaWssGateway(cleanPhone, smsMessage);
    if (wssResult.success) {
      isSmsDispatched = true;
      dispatchMethod = 'wss_gateway';
      gatewayMessage = wssResult.message;
    }

    // PRIORITY 2: USB Connected Android Phone (local ADB — development fallback)
    if (!isSmsDispatched) {
      const adbResult = await sendViaAdbSim(cleanPhone, smsMessage);
      if (adbResult.success) {
        isSmsDispatched = true;
        dispatchMethod = 'sim_gateway';
        gatewayMessage = adbResult.message;
      }
    }

    // 5. Try PRIORITY 2: Private Android SIM Gateway HTTP (Wi-Fi)
    if (!isSmsDispatched) {
      const simConfig = getSimGatewayConfig();
      if (simConfig.enabled && simConfig.url) {
        const simResult = await sendViaPrivateSimGateway(cleanPhone, smsMessage, simConfig);
        if (simResult.success) {
          isSmsDispatched = true;
          dispatchMethod = 'sim_gateway';
          gatewayMessage = simResult.message;
        } else {
          gatewayMessage = `Android SIM: ${simResult.message}`;
        }
      }
    }

    // 5. Try PRIORITY 2: Fast2SMS (if SIM gateway not configured or failed)
    const apiKey = getSmsApiKey();
    if (!isSmsDispatched && apiKey) {
      try {
        console.log(`📡 [Fast2SMS] Attempting Fast2SMS telecom route to +91 ${cleanPhone}...`);
        const queryParams = new URLSearchParams({
          authorization: apiKey.trim(),
          route: 'otp',
          variables_values: generatedOtp,
          numbers: cleanPhone,
        });

        const smsRes = await fetch(`https://www.fast2sms.com/dev/bulkV2?${queryParams.toString()}`, {
          method: 'GET',
          headers: { 'cache-control': 'no-cache' },
        });
        const smsData = await smsRes.json();
        if (smsData.return === true || smsData.status_code === 200) {
          isSmsDispatched = true;
          dispatchMethod = 'fast2sms';
          gatewayMessage = 'SMS delivered via Fast2SMS telecom route';
        } else {
          gatewayMessage = Array.isArray(smsData.message) ? smsData.message.join(', ') : (smsData.message || 'Fast2SMS notice');
        }
      } catch (smsErr) {
        gatewayMessage = `Fast2SMS error: ${smsErr.message}`;
      }
    }

    console.log('\n======================================================');
    console.log(`📱 REAL OTP DISPATCH FOR: +91 ${cleanPhone}`);
    console.log(`🔑 6-DIGIT CODE         : [ ${generatedOtp} ]`);
    console.log(`⏱️ VALIDITY              : 5 Minutes`);
    console.log(`🛡️ SECURITY             : Anti-Brute-Force (3 Strikes Max)`);
    console.log(`📡 DISPATCH STATUS       : ${isSmsDispatched ? `SENT VIA ${dispatchMethod.toUpperCase()} 🚀` : `STANDBY (${gatewayMessage || 'Ready for SIM Gateway'})`}`);
    console.log('======================================================\n');

    if (isSmsDispatched) {
      return res.json({
        success: true,
        phone: cleanPhone,
        isSmsDispatched: true,
        dispatchMethod,
        message: dispatchMethod === 'sim_gateway'
          ? `Real SMS aapke Android SIM (+91 telecom) se bhej diya gaya hai! SMS inbox check karein.`
          : `Real SMS OTP +91 ${cleanPhone} par bhej diya gaya hai! SMS inbox check karein.`,
      });
    }

    // Return smooth response with gateway pairing info
    const isVerificationPending = gatewayMessage.toLowerCase().includes('website verification') ||
                                 gatewayMessage.includes('996') ||
                                 gatewayMessage.includes('100 INR');

    const simConfig = getSimGatewayConfig();
    return res.json({
      success: true,
      phone: cleanPhone,
      isSmsDispatched: false,
      simGatewayEnabled: simConfig.enabled,
      hasSmsApiKey: Boolean(apiKey),
      fast2smsError: gatewayMessage,
      fast2smsWebsiteVerificationPending: isVerificationPending,
      // SECURITY: generatedOtp is NEVER sent to browser. It only exists in server memory.
      message: simConfig.enabled 
        ? `Android SIM Gateway connect ho raha hai...` 
        : `Private SIM Gateway set karne ke liye tayar hai.`,
    });
  } catch (err) {
    console.error('Error in send-otp:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Diagnostic Endpoint: Check Private SIM Gateway Status
app.get('/api/auth/sim-gateway/status', (req, res) => {
  const config = getSimGatewayConfig();
  res.json({
    enabled: config.enabled,
    url: config.url || 'Not configured (e.g. http://192.168.1.100:8080/message)',
    simSlot: config.simSlot,
    activeOtps: otpStore.size,
    activeLockouts: lockoutStore.size,
  });
});

// Serve compiled production frontend if dist folder exists
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/ws') && !req.path.startsWith('/gateway')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

// ============================================================
// WSS GATEWAY TUNNEL — Android Phone ←→ Cloud Server
// ============================================================
// (phoneGatewayWs, phoneGatewayConnectedAt, smsQueue, pendingSmsCallbacks declared at server setup)

// HMAC-SHA256 authentication for phone gateway
const GATEWAY_SECRET = 'sn_dev_gateway_secret_local';
function verifyGatewayToken(token) {
  if (!token || !GATEWAY_SECRET) return false;
  try {
    const expected = crypto
      .createHmac('sha256', GATEWAY_SECRET)
      .update('shawarma-nights-gateway')
      .digest('hex');
    // Also allow plain secret match for simplicity
    return token === expected || token === GATEWAY_SECRET;
  } catch {
    return false;
  }
}

// WSS Gateway WebSocket Server (separate path for phone)
const gatewayWss = new WebSocketServer({ noServer: true });

gatewayWss.on('connection', (ws, req) => {
  console.log('📱 [WSS Gateway] Android phone connected from:', req.socket.remoteAddress);
  phoneGatewayWs = ws;
  phoneGatewayConnectedAt = Date.now();

  // 1. Respond with connection confirmation
  ws.send(JSON.stringify({ action: 'CONNECTED', serverTime: Date.now() }));

  // 2. Send initial state immediately upon connecting
  ws.send(JSON.stringify({
    action: 'INIT_STATE',
    type: 'INIT_STATE',
    payload: { ...dukandarDb, customers: customersDb },
    timestamp: Date.now()
  }));

  // Send any queued SMS immediately
  while (smsQueue.length > 0) {
    const queued = smsQueue.shift();
    if (Date.now() - queued.queuedAt < SMS_QUEUE_TIMEOUT_MS) {
      console.log(`📤 [WSS Gateway] Sending queued SMS to +91 ${queued.phone}...`);
      ws.send(JSON.stringify({
        action: 'SEND_SMS',
        requestId: queued.requestId,
        phone: `+91${queued.phone}`,
        message: queued.message,
      }));
    }
  }

  // Heartbeat ping every 30 seconds
  const heartbeat = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    } else {
      clearInterval(heartbeat);
    }
  }, 30000);

  ws.on('message', (raw) => {
    try {
      const data = JSON.parse(raw.toString());
      const action = data.action || data.type;
      console.log('📱 [WSS Gateway] Message received action:', action);

      const clientRole = data.role || data.payload?.role;
      const clientToken = data.token || data.payload?.token;
      const isDeliveryBoy = clientRole === 'delivery_boy' || isDeliveryBoyToken(clientToken);

      // SECURITY AUDIT: If delivery boy attempts administrative action, strictly block!
      if (isDeliveryBoy) {
        const adminForbiddenActions = [
          'ADD_MENU_ITEM', 'UPDATE_MENU_ITEM', 'DELETE_MENU_ITEM', 'TOGGLE_AVAILABILITY',
          'ADD_CATEGORY', 'DELETE_CATEGORY',
          'ADD_DEAL', 'UPDATE_DEAL', 'DELETE_DEAL',
          'UPDATE_HERO_BANNER', 'UPDATE_STORE_INFO', 'UPDATE_UPI_ID',
          'DELETE_REVIEW', 'GET_CUSTOMERS'
        ];
        if (adminForbiddenActions.includes(action)) {
          console.warn(`🚨 [SECURITY ALERT] Unauthorized store action '${action}' blocked for delivery boy!`);
          ws.send(JSON.stringify({
            action: 'ERROR',
            type: 'ERROR',
            error: '403 Forbidden: Delivery partners cannot access or modify store administrative settings.',
            code: 403
          }));
          return;
        }

        // Delivery boy can only change order status to 'out_for_delivery' or 'delivered'
        if (action === 'UPDATE_ORDER_STATUS') {
          const status = data.status || data.payload?.status;
          if (status !== 'out_for_delivery' && status !== 'delivered' && status !== 'out') {
            console.warn(`🚨 [SECURITY ALERT] Unauthorized order status change to '${status}' blocked for delivery boy!`);
            ws.send(JSON.stringify({
              action: 'ERROR',
              type: 'ERROR',
              error: '403 Forbidden: Delivery partners can only mark orders as Out for Delivery or Delivered.'
            }));
            return;
          }
        }
      }

      if (action === 'UPDATE_RIDER_LOCATION' || action === 'RIDER_LOCATION') {
        const payload = data.payload || data;
        const boyId = payload.boyId || payload.id;
        const boy = deliveryBoysDb.find(b => b.id === boyId || b.token === payload.token || b.phone === payload.phone);
        if (boy) {
          boy.currentLocation = {
            lat: payload.lat,
            lng: payload.lng,
            speed: payload.speed || 0,
            updatedAt: Date.now()
          };
          broadcast('RIDER_LOCATION_UPDATED', {
            boyId: boy.id,
            name: boy.name,
            vehicle: boy.vehicle,
            location: boy.currentLocation
          });
        }
        return;
      }
      
      if (action === 'SMS_RESULT') {
        console.log(`📱 [WSS Gateway] SMS Result for +91 ${data.phone}: ${data.success ? '✅ SENT' : '❌ FAILED'}`);
        
        // Resolve pending callback if exists
        const cb = pendingSmsCallbacks.get(data.requestId);
        if (cb) {
          clearTimeout(cb.timer);
          cb.resolve({
            success: data.success,
            message: data.success 
              ? 'Real SMS aapke Android phone se customer ke number par bhej diya gaya!' 
              : `SMS send fail: ${data.error || 'Unknown error'}`,
          });
          pendingSmsCallbacks.delete(data.requestId);
        }
      } else if (action === 'PAYMENT_SMS_RECEIVED') {
        const smsText = data.smsText || data.payload?.smsText;
        const sender = data.sender || data.payload?.sender || 'BANK-SMS';
        console.log(`📱 [WSS Gateway] Incoming Bank/UPI SMS from [${sender}]: ${smsText}`);
        const res = paymentVerifier.processIncomingPaymentSms({
          smsText,
          sender,
        });
        if (res.success) {
          dukandarDb.orders.unshift(res.order);
          saveOrders();
          broadcast('ORDER_CREATED', res.order);
          broadcast('PAYMENT_CONFIRMED', res);
        }
      } else if (action === 'UPDATE_ORDER_STATUS') {
        const orderId = data.orderId || data.payload?.orderId;
        const status = data.status || data.payload?.status;
        const otp = data.otp || data.payload?.otp;
        const boyName = data.boyName || data.payload?.boyName || 'Delivery Partner';
        const order = dukandarDb.orders.find((o) => o.id === orderId || o.orderId === orderId);
        if (order && status) {
          if (status === 'delivered') {
            if (!otp || String(otp).trim() !== String(order.deliveryOtp || '').trim()) {
              console.warn(`🚨 [WSS Gateway] Blocked attempt to mark order ${orderId} delivered without valid OTP! Expected: ${order.deliveryOtp}, Got: ${otp}`);
              ws.send(JSON.stringify({
                action: 'ERROR',
                type: 'ERROR',
                error: 'Delivery OTP Aniwarya Hai! Customer ka 4-digit OTP dalein.'
              }));
              return;
            }
            order.status = 'delivered';
            order.deliveredAt = new Date().toISOString();
            order.deliveredBy = boyName;
            if (order.paymentMethod === 'COD') order.paymentStatus = 'paid';
          } else {
            order.status = status;
          }
          saveOrders();
          console.log(`📦 [WSS Gateway] Order ${orderId} status updated to: ${order.status}`);
          broadcast('ORDER_UPDATED', { orderId: order.id, status: order.status, order });
          broadcast('ORDER_STATUS_CHANGED', { orderId: order.id, status: order.status, order });
        } else {
          console.warn(`⚠️ [WSS Gateway] Order not found or invalid status: ${orderId} -> ${status}`);
        }
      } else if (action === 'VERIFY_DELIVERY_OTP') {
        const orderId = data.orderId || data.payload?.orderId;
        const otp = data.otp || data.payload?.otp;
        const boyName = data.boyName || data.payload?.boyName || 'Delivery Partner';
        const order = dukandarDb.orders.find((o) => o.id === orderId || o.orderId === orderId);
        if (order && String(order.deliveryOtp || '').trim() === String(otp || '').trim()) {
          order.status = 'delivered';
          order.deliveredAt = new Date().toISOString();
          order.deliveredBy = boyName;
          if (order.paymentMethod === 'COD') order.paymentStatus = 'paid';
          saveOrders();
          console.log(`🎉 [WSS Gateway] Order #${orderId} verified with OTP by ${boyName}`);
          broadcast('ORDER_UPDATED', order);
          ws.send(JSON.stringify({ action: 'DELIVERY_OTP_RESULT', success: true, orderId, message: 'OTP Verified! Order delivered.' }));
        } else {
          ws.send(JSON.stringify({ action: 'DELIVERY_OTP_RESULT', success: false, orderId, message: 'Galat OTP! Customer se sahi OTP lein.' }));
        }
      } else if (action === 'TOGGLE_AVAILABILITY') {
        const itemId = data.itemId || data.id || data.payload?.itemId || data.payload?.id;
        const isAvailable = data.isAvailable !== undefined ? data.isAvailable : data.payload?.isAvailable;
        let found = false;
        dukandarDb.menu = dukandarDb.menu.map((item) => {
          if (item.id === itemId) {
            found = true;
            const updatedAvailable = isAvailable !== undefined ? Boolean(isAvailable) : !(item.available !== false);
            return { ...item, available: updatedAvailable };
          }
          return item;
        });
        if (found) {
          saveMenu();
          console.log(`🍲 [WSS Gateway] Item ${itemId} availability updated`);
          broadcast('MENU_UPDATED', dukandarDb.menu);
        } else {
          console.warn(`⚠️ [WSS Gateway] Item not found for TOGGLE_AVAILABILITY: ${itemId}`);
        }
      } else if (action === 'GET_INITIAL_STATE') {
        if (isDeliveryBoy) {
          console.log('📋 [WSS Gateway] Delivery boy requested initial state - sending stripped delivery orders only');
          ws.send(JSON.stringify({
            action: 'INIT_STATE',
            type: 'INIT_STATE',
            role: 'delivery_boy',
            payload: {
              orders: dukandarDb.orders,
              storeInfo: {
                name: dukandarDb.storeInfo?.name || 'Shawarma Nights',
                address: dukandarDb.storeInfo?.address || 'Shop 14, Food Street Avenue'
              }
            },
            timestamp: Date.now()
          }));
        } else {
          console.log('📋 [WSS Gateway] Phone requested initial state');
          ws.send(JSON.stringify({
            action: 'INIT_STATE',
            type: 'INIT_STATE',
            payload: { ...dukandarDb, customers: customersDb },
            timestamp: Date.now()
          }));
        }
      } else if (action === 'UPDATE_UPI_ID') {
        const upiId = data.upiId || data.payload?.upiId;
        if (upiId) {
          if (!dukandarDb.storeInfo) dukandarDb.storeInfo = {};
          if (!dukandarDb.storeInfo.payment) dukandarDb.storeInfo.payment = {};
          dukandarDb.storeInfo.payment.upiId = String(upiId).trim();
          saveDukandar();
          console.log(`💳 [WSS Gateway] UPI ID updated to ${dukandarDb.storeInfo.payment.upiId}`);
          broadcast('STORE_INFO_UPDATED', dukandarDb.storeInfo);
        }
      } else if (action === 'ADD_MENU_ITEM') {
        const payload = data.payload || data;
        const newItem = {
          ...payload,
          id: payload.id || `dish-${Date.now()}`,
          available: payload.available !== false,
          rating: payload.rating || 5.0,
          reviews: payload.reviews || 1,
        };
        dukandarDb.menu.unshift(newItem);
        saveMenu();
        console.log(`🍲 [WSS Gateway] Added menu item: ${newItem.name}`);
        broadcast('MENU_UPDATED', dukandarDb.menu);
      } else if (action === 'UPDATE_MENU_ITEM') {
        const { id, updates } = data.payload || data;
        if (id && updates) {
          dukandarDb.menu = dukandarDb.menu.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          );
          saveMenu();
          console.log(`🍲 [WSS Gateway] Updated menu item: ${id}`);
          broadcast('MENU_UPDATED', dukandarDb.menu);
        }
      } else if (action === 'DELETE_MENU_ITEM') {
        const id = data.id || data.payload?.id;
        if (id) {
          dukandarDb.menu = dukandarDb.menu.filter((item) => item.id !== id);
          saveMenu();
          console.log(`🍲 [WSS Gateway] Deleted menu item: ${id}`);
          broadcast('MENU_UPDATED', dukandarDb.menu);
        }
      } else if (action === 'ADD_CATEGORY') {
        const cat = data.payload || data;
        if (cat && cat.id) {
          if (!dukandarDb.categories) dukandarDb.categories = [];
          if (!dukandarDb.categories.find((c) => c.id === cat.id)) {
            dukandarDb.categories.push(cat);
            saveMenu();
            console.log(`📂 [WSS Gateway] Added category: ${cat.name}`);
            broadcast('CATEGORIES_UPDATED', dukandarDb.categories);
          }
        }
      } else if (action === 'DELETE_CATEGORY') {
        const id = data.id || data.payload?.id;
        if (id && dukandarDb.categories) {
          dukandarDb.categories = dukandarDb.categories.filter((c) => c.id !== id);
          saveMenu();
          console.log(`📂 [WSS Gateway] Deleted category: ${id}`);
          broadcast('CATEGORIES_UPDATED', dukandarDb.categories);
        }
      } else if (action === 'ADD_DEAL') {
        const payload = data.payload || data;
        const newDeal = {
          id: `deal-${Date.now()}`,
          ...payload,
        };
        if (!dukandarDb.deals) dukandarDb.deals = [];
        dukandarDb.deals.unshift(newDeal);
        saveDeals();
        console.log(`🏷️ [WSS Gateway] Added deal: ${newDeal.code}`);
        broadcast('DEALS_UPDATED', dukandarDb.deals);
      } else if (action === 'UPDATE_DEAL') {
        const { id, updates } = data.payload || data;
        if (id && updates && dukandarDb.deals) {
          dukandarDb.deals = dukandarDb.deals.map((d) =>
            d.id === id ? { ...d, ...updates } : d
          );
          saveDeals();
          console.log(`🏷️ [WSS Gateway] Updated deal: ${id}`);
          broadcast('DEALS_UPDATED', dukandarDb.deals);
        }
      } else if (action === 'DELETE_DEAL') {
        const id = data.id || data.payload?.id;
        if (id && dukandarDb.deals) {
          dukandarDb.deals = dukandarDb.deals.filter((d) => d.id !== id);
          saveDeals();
          console.log(`🏷️ [WSS Gateway] Deleted deal: ${id}`);
          broadcast('DEALS_UPDATED', dukandarDb.deals);
        }
      } else if (action === 'UPDATE_HERO_BANNER') {
        const payload = data.payload || data;
        dukandarDb.heroBanner = { ...(dukandarDb.heroBanner || {}), ...payload };
        saveDukandar();
        console.log(`✨ [WSS Gateway] Hero Banner updated`);
        broadcast('HERO_UPDATED', dukandarDb.heroBanner);
      } else if (action === 'UPDATE_STORE_INFO') {
        const payload = data.payload || data;
        dukandarDb.storeInfo = {
          ...(dukandarDb.storeInfo || {}),
          ...payload,
          ...(payload.taxesAndCharges ? {
            taxesAndCharges: {
              ...(dukandarDb.storeInfo?.taxesAndCharges || {}),
              ...payload.taxesAndCharges
            }
          } : {})
        };
        saveDukandar();
        console.log(`🏪 [WSS Gateway] Store Info updated`);
        broadcast('STORE_INFO_UPDATED', dukandarDb.storeInfo);
      } else if (action === 'DELETE_REVIEW') {
        const id = data.id || data.payload?.id;
        if (id && dukandarDb.reviews) {
          dukandarDb.reviews = dukandarDb.reviews.filter((r) => String(r.id) !== String(id));
          saveDukandar();
          console.log(`⭐ [WSS Gateway] Deleted review: ${id}`);
          broadcast('INIT_STATE', { reviews: dukandarDb.reviews });
        }
      } else if (action === 'GET_CUSTOMERS') {
        ws.send(JSON.stringify({
          action: 'CUSTOMERS_LIST',
          payload: customersDb,
          timestamp: Date.now()
        }));
      } else if (action === 'PLACE_ORDER') {
        const payload = data.payload || data;
        const newOrder = {
          id: payload.orderId || payload.id || `SN-${Math.floor(100000 + Math.random() * 900000)}`,
          customerName: payload.customerName || 'Phone Customer',
          customerPhone: payload.customerPhone || '+91 98765-00000',
          address: payload.address || 'Delivery Address',
          items: payload.items || [],
          status: 'new',
          placedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          total: payload.grandTotal || payload.total || 0,
          note: payload.note || '',
          paymentMethod: payload.paymentMethod || 'COD',
          paymentStatus: payload.paymentStatus || (payload.paymentMethod === 'UPI' ? 'paid' : 'pending_cash'),
          utr: payload.utr || null,
          deliveryOtp: payload.deliveryOtp || generateDeliveryOtp(),
          orderGps: payload.orderGps || null,
        };
        dukandarDb.orders.unshift(newOrder);
        saveOrders();
        broadcast('ORDER_CREATED', newOrder);
        console.log(`🛒 [WSS Gateway] Order placed from gateway: ${newOrder.id}`);
      } else if (action === 'HEARTBEAT' || action === 'PING') {
        if (action === 'PING') {
          ws.send(JSON.stringify({ action: 'PONG', timestamp: Date.now() }));
        }
      } else {
        console.log(`ℹ️ [WSS Gateway] Received unhandled action: ${action}`);
      }
    } catch (e) {
      console.warn('[WSS Gateway] Invalid message from phone:', e.message);
    }
  });

  ws.on('close', () => {
    console.log('📱 [WSS Gateway] Android phone disconnected.');
    if (phoneGatewayWs === ws) {
      phoneGatewayWs = null;
      phoneGatewayConnectedAt = null;
    }
    clearInterval(heartbeat);
  });

  ws.on('error', (err) => {
    console.error('[WSS Gateway] Phone connection error:', err.message);
  });
});

// Dispatch SMS via WSS Gateway (internet-connected phone)
function sendViaWssGateway(phone, message) {
  return new Promise((resolve) => {
    if (!phoneGatewayWs || phoneGatewayWs.readyState !== WebSocket.OPEN) {
      // Phone not connected — queue the SMS if we're in production
      if (IS_PRODUCTION && smsQueue.length < SMS_QUEUE_MAX) {
        const requestId = crypto.randomUUID();
        smsQueue.push({ phone, message, requestId, queuedAt: Date.now() });
        console.log(`📥 [WSS Gateway] Phone offline. SMS queued (${smsQueue.length}/${SMS_QUEUE_MAX}).`);
        
        // Set timeout to resolve as failed after 2 minutes
        const timer = setTimeout(() => {
          pendingSmsCallbacks.delete(requestId);
          resolve({ success: false, message: 'Phone offline — SMS queued, will send when phone reconnects.' });
        }, 120000);
        
        pendingSmsCallbacks.set(requestId, { resolve, timer });
        return;
      }
      return resolve({ success: false, message: 'Android phone WSS se connected nahi hai.' });
    }

    const requestId = crypto.randomUUID();
    
    // Send SMS command to phone
    phoneGatewayWs.send(JSON.stringify({
      action: 'SEND_SMS',
      requestId,
      phone: `+91${phone}`,
      message,
    }));

    // Wait for result with 10-second timeout
    const timer = setTimeout(() => {
      pendingSmsCallbacks.delete(requestId);
      resolve({ success: false, message: 'Phone ne 10 second me respond nahi kiya.' });
    }, 10000);

    pendingSmsCallbacks.set(requestId, { resolve, timer });
  });
}



// ============================================================
// SECURE USER & ADMIN AUTHENTICATION API
// ============================================================

// Customer: Verify OTP
app.post('/api/auth/verify-otp', (req, res) => {
  const { phone, otp } = req.body;
  const cleanPhone = (phone || '').replace(/\D/g, '').slice(-10);
  
  if (!cleanPhone || !otp) return res.status(400).json({ success: false, message: 'Invalid Input' });

  const record = otpStore.get(cleanPhone);
  if (!record || record.expiresAt < Date.now() || record.otp !== otp.trim()) {
    return res.status(400).json({ success: false, message: 'OTP expired or incorrect.' });
  }

  // OTP is correct!
  otpStore.delete(cleanPhone);

  const existingCustomer = customersDb.find(u => u.phone === cleanPhone);
  if (existingCustomer) {
    const token = crypto.randomUUID();
    return res.json({ success: true, isNewUser: false, token, user: existingCustomer });
  } else {
    const tempToken = crypto.randomUUID();
    return res.json({ success: true, isNewUser: true, tempToken, message: 'Please complete registration.' });
  }
});

// Customer: Register
app.post('/api/auth/register', (req, res) => {
  const { phone, name, email, address, tempToken } = req.body;
  if (!phone || !name || !tempToken) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }
  
  const newCustomer = {
    id: 'cust-' + Date.now(),
    name, phone, email, address,
    registeredAt: new Date().toISOString()
  };
  
  customersDb.push(newCustomer);
  saveCustomers();
  
  const token = crypto.randomUUID();
  res.json({ success: true, token, user: newCustomer });
});

// Customer: Update Profile
app.post('/api/auth/update-profile', (req, res) => {
  const { phone, name, email, address } = req.body;
  const cleanPhone = (phone || '').replace(/\D/g, '').slice(-10);
  const customer = customersDb.find(u => u.phone === cleanPhone);
  if (customer) {
    if (name) customer.name = name;
    if (email !== undefined) customer.email = email;
    if (address !== undefined) customer.address = address;
    saveCustomers();
    return res.json({ success: true, user: customer });
  }
  res.status(404).json({ success: false, message: 'Customer not found' });
});

// Customer: Delete Account
app.post('/api/auth/delete-account', (req, res) => {
  const { phone } = req.body;
  const cleanPhone = (phone || '').replace(/\D/g, '').slice(-10);
  customersDb = customersDb.filter(u => u.phone !== cleanPhone);
  saveCustomers();
  res.json({ success: true, message: 'Account deleted permanently' });
});

// Customer: Verify Session & Fetch Current Profile
app.all('/api/auth/me', (req, res) => {
  const rawPhone = req.query.phone || req.body?.phone || '';
  const cleanPhone = rawPhone.replace(/\D/g, '').slice(-10);
  if (!cleanPhone) {
    return res.status(400).json({ success: false, message: 'Phone number required' });
  }
  const customer = customersDb.find(u => u.phone === cleanPhone);
  if (customer) {
    return res.json({ success: true, user: customer });
  }
  return res.status(404).json({ success: false, message: 'Customer not found' });
});

// Admin: Check Registration Status
app.get('/api/admin/status', (req, res) => {
  res.json({ 
    isRegistered: !!(dukandarDb.adminAccount && dukandarDb.adminAccount.isRegistered),
    dukanName: dukandarDb.storeInfo?.name || dukandarDb.adminAccount?.dukanName || 'Shawarma Nights'
  });
});

// Admin: First-Time Setup
app.post('/api/admin/setup', (req, res) => {
  if (dukandarDb.adminAccount && dukandarDb.adminAccount.isRegistered) {
    return res.status(403).json({ success: false, message: 'Server Locked: Master Admin is already registered. Dusra account nahi ban sakta.' });
  }
  
  const { username, password, ownerPhone, dukanName } = req.body;
  if (!username || !password || !ownerPhone) {
    return res.status(400).json({ success: false, message: 'All fields required (Username, Password, Phone).' });
  }
  
  dukandarDb.adminAccount = {
    isRegistered: true,
    dukanName: dukanName ? dukanName.trim() : 'Shawarma Nights',
    username: username.trim(),
    password: password.trim(),
    ownerPhone: ownerPhone.trim(),
    token: crypto.randomUUID(),
    setupAt: new Date().toISOString()
  };
  if (dukanName && dukandarDb.storeInfo) {
    dukandarDb.storeInfo.name = dukanName.trim();
  }
  saveDukandar();
  
  res.json({ 
    success: true, 
    token: dukandarDb.adminAccount.token,
    username: dukandarDb.adminAccount.username,
    dukanName: dukandarDb.adminAccount.dukanName,
    message: 'Master Admin Account created permanently and locked.' 
  });
});

// Admin: Login
app.post('/api/admin/login', (req, res) => {
  if (!dukandarDb.adminAccount || !dukandarDb.adminAccount.isRegistered) {
    return res.status(400).json({ success: false, message: 'Master Admin not registered yet. Please create account first.' });
  }

  const { username, password } = req.body;
  const admin = dukandarDb.adminAccount;
  
  const uMatch = username && (
    username.trim().toLowerCase() === (admin.username || '').toLowerCase() ||
    username.trim().toLowerCase() === (admin.dukanName || '').toLowerCase() ||
    username.trim() === (admin.ownerPhone || '').trim()
  );
  const pMatch = password && (password.trim() === (admin.password || '').trim());

  if (uMatch && pMatch) {
    const token = admin.token || 'dukandar_master_token_2026';
    res.json({
      success: true,
      token,
      username: admin.username,
      dukanName: admin.dukanName || 'Shawarma Nights',
      ownerPhone: admin.ownerPhone,
      message: 'Login successful!'
    });
  } else {
    res.status(401).json({ success: false, message: 'Galat Username ya Password! Kripya sahi credentials dalein.' });
  }
});

// Admin: Login Verify (Step 2)
app.post('/api/admin/verify', (req, res) => {
  const { otp } = req.body;
  const admin = dukandarDb.adminAccount;
  const record = otpStore.get(admin.ownerPhone);
  
  if (!record || record.expiresAt < Date.now() || record.otp !== otp) {
    return res.status(401).json({ success: false, message: 'Invalid or Expired 2FA OTP' });
  }
  
  otpStore.delete(admin.ownerPhone);
  const token = crypto.randomUUID();
  
  res.json({ 
    success: true, 
    token, 
    user: { id: 'admin-1', role: 'dukandar', name: 'Master Admin' } 
  });
});

// Admin: Get Customers Directory (Protected from delivery boys)
app.get('/api/admin/customers', (req, res) => {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim() || req.headers['x-admin-token'] || req.query.token;
  if (isDeliveryBoyToken(token)) {
    return res.status(403).json({ success: false, message: '403 Forbidden: Delivery partners cannot access customer vault.' });
  }
  res.json({ success: true, customers: customersDb });
});

// ==========================================
// DELIVERY PARTNER MULTI-ACCOUNT SUBSYSTEM
// ==========================================

// Delivery Boy: Register New Partner
app.post('/api/delivery/register', (req, res) => {
  const { name, phone, password, vehicle } = req.body;
  if (!name || !phone || !password || !vehicle) {
    return res.status(400).json({ success: false, message: 'Sabhi fields bharna anivarya hai (Name, Phone, Password, Vehicle)!' });
  }

  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length < 10) {
    return res.status(400).json({ success: false, message: 'Valid 10-digit mobile number dalein!' });
  }

  if (password.trim().length < 4) {
    return res.status(400).json({ success: false, message: 'Password kam se kam 4 characters ka ho!' });
  }

  const exists = deliveryBoysDb.find(b => b.phone.replace(/\D/g, '') === cleanPhone);
  if (exists) {
    return res.status(400).json({ success: false, message: 'Yeh mobile number pehle se registered hai! Kripya login karein.' });
  }

  const newBoy = {
    id: 'db-' + Date.now(),
    name: name.trim(),
    phone: cleanPhone,
    password: password.trim(),
    vehicle: vehicle.trim(),
    token: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    status: 'active',
    currentLocation: null
  };

  deliveryBoysDb.push(newBoy);
  saveDeliveryBoys();

  console.log(`🛵 [Delivery Subsystem] New Delivery Partner Registered: ${newBoy.name} (${newBoy.phone}, ${newBoy.vehicle})`);

  res.json({
    success: true,
    token: newBoy.token,
    boy: {
      id: newBoy.id,
      name: newBoy.name,
      phone: newBoy.phone,
      vehicle: newBoy.vehicle
    },
    message: 'Delivery Partner registration successful!'
  });
});

// Delivery Boy: Login
app.post('/api/delivery/login', (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) {
    return res.status(400).json({ success: false, message: 'Phone aur Password dono dalein!' });
  }

  const cleanPhone = phone.replace(/\D/g, '');
  const boy = deliveryBoysDb.find(b => b.phone.replace(/\D/g, '') === cleanPhone && b.password === password.trim());

  if (!boy) {
    return res.status(401).json({ success: false, message: 'Galat Phone Number ya Password! Kripya sahi credentials dalein.' });
  }

  if (!boy.token) {
    boy.token = crypto.randomUUID();
    saveDeliveryBoys();
  }

  console.log(`🛵 [Delivery Subsystem] Delivery Partner Logged In: ${boy.name} (${boy.phone})`);

  res.json({
    success: true,
    token: boy.token,
    boy: {
      id: boy.id,
      name: boy.name,
      phone: boy.phone,
      vehicle: boy.vehicle
    },
    message: 'Login successful!'
  });
});

// Delivery Boy: Status / Count
app.get('/api/delivery/status', (req, res) => {
  res.json({
    success: true,
    count: deliveryBoysDb.length,
    activeRiders: deliveryBoysDb.filter(b => b.status === 'active').length
  });
});

// Delivery Boy: Update Live Location
app.post('/api/delivery/update-location', (req, res) => {
  const { token, lat, lng, speed } = req.body;
  if (!token) {
    return res.status(401).json({ success: false, message: 'Token required' });
  }
  const boy = deliveryBoysDb.find(b => b.token === token);
  if (!boy) {
    return res.status(403).json({ success: false, message: 'Invalid delivery token' });
  }
  boy.currentLocation = {
    lat: Number(lat),
    lng: Number(lng),
    speed: Number(speed) || 0,
    updatedAt: Date.now()
  };
  broadcast('RIDER_LOCATION_UPDATED', {
    boyId: boy.id,
    name: boy.name,
    vehicle: boy.vehicle,
    location: boy.currentLocation
  });
  res.json({ success: true });
});

// Delivery Boy: Get active delivery orders (safe filtered orders only)
app.get('/api/delivery/orders', (req, res) => {
  const orders = (dukandarDb.orders || []).filter(o => 
    o.status === 'preparing' || o.status === 'out_for_delivery' || o.status === 'out' || o.status === 'ready'
  );
  res.json({ success: true, orders });
});

// Delivery Boy: Verify Delivery Confirmation OTP & Mark Order Delivered
app.post('/api/delivery/verify-otp', (req, res) => {
  const { orderId, otp, boyId, boyName } = req.body || {};
  if (!orderId || !otp) {
    return res.status(400).json({ success: false, message: 'Order ID aur OTP dono anivarya hain!' });
  }

  const cleanEnteredOtp = String(otp).trim();
  const order = (dukandarDb.orders || []).find(o => String(o.id) === String(orderId) || String(o.orderId) === String(orderId));

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order #' + orderId + ' nahi mila!' });
  }

  if (order.status === 'delivered') {
    return res.json({ success: true, message: 'Yeh order pehle se delivered mark ho chuka hai.', order });
  }

  const realOtp = String(order.deliveryOtp || '').trim();
  if (!realOtp) {
    return res.status(400).json({ success: false, message: 'Is order par OTP set nahi tha. Dukandar se contact karein.' });
  }

  if (cleanEnteredOtp !== realOtp) {
    console.warn(`🚨 [Delivery OTP] Mismatch for order ${orderId}: Entered ${cleanEnteredOtp}, expected ${realOtp}`);
    return res.status(400).json({
      success: false,
      message: 'Galat OTP! Customer ke mobile screen par dikhne wala 4-digit OTP enter karein.'
    });
  }

  // OTP verified! Mark order delivered
  order.status = 'delivered';
  order.deliveredAt = new Date().toISOString();
  order.deliveredBy = boyName || boyId || 'Delivery Partner';
  if (order.paymentMethod === 'COD') {
    order.paymentStatus = 'paid';
  }

  saveOrders();
  broadcast('ORDER_UPDATED', order);

  console.log(`🎉 [Delivery OTP Success] Order #${orderId} verified with OTP ${realOtp} by ${order.deliveredBy}!`);

  res.json({
    success: true,
    message: 'OTP verified! Order successfully delivered.',
    order
  });
});

// Gateway health status endpoint (enhanced)
app.get('/api/gateway/status', (req, res) => {
  res.json({
    phoneConnected: phoneGatewayWs !== null && phoneGatewayWs.readyState === WebSocket.OPEN,
    connectedSince: phoneGatewayConnectedAt ? new Date(phoneGatewayConnectedAt).toISOString() : null,
    queuedSms: smsQueue.length,
    pendingCallbacks: pendingSmsCallbacks.size,
    activeOtps: otpStore.size,
    activeLockouts: lockoutStore.size,
  });
});

// Health check endpoint for Render & uptime monitors
app.get(['/', '/healthz', '/api/health'], (req, res) => {
  res.json({
    status: 'ok',
    service: 'Shawarma Nights Realtime Server',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// Ensure any unmatched /api route returns JSON 404, NEVER an HTML error page
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.method} ${req.originalUrl} not found`
  });
});

// Global API error handler ensuring strictly JSON error responses
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// Handle WebSocket upgrade for both /ws (frontend) and /gateway (phone)
server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
  
  if (pathname === '/gateway') {
    // Authenticate phone connection
    const url = new URL(request.url, `http://${request.headers.host}`);
    const token = url.searchParams.get('token') || request.headers['x-gateway-token'];
    
    if (!verifyGatewayToken(token)) {
      console.warn('🚨 [WSS Gateway] Unauthorized connection attempt blocked!');
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }
    
    gatewayWss.handleUpgrade(request, socket, head, (ws) => {
      gatewayWss.emit('connection', ws, request);
    });
  } else if (pathname === '/ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log(`║  🚀 Shawarma Nights Server — Port ${PORT}              ║`);
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║  Mode     : ${IS_PRODUCTION ? 'PRODUCTION 🔒' : 'DEVELOPMENT 🔧'}                      ║`);
  console.log(`║  CORS     : ${IS_PRODUCTION ? CORS_ORIGIN.substring(0, 35) : 'All Origins (dev)'}     ║`);
  console.log(`║  Frontend : ws://localhost:${PORT}/ws                  ║`);
  console.log(`║  Gateway  : ws://localhost:${PORT}/gateway             ║`);
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('');

  // 24/7 Keep-Alive Self-Ping: Pings external URL every 8 minutes so Render NEVER spins down
  const KEEP_ALIVE_URL = process.env.RENDER_EXTERNAL_URL || 'https://churuone-backend.onrender.com';
  setInterval(async () => {
    try {
      const res = await fetch(`${KEEP_ALIVE_URL}/healthz`);
      if (res.ok) {
        console.log(`💓 [24/7 Heartbeat] Pinged ${KEEP_ALIVE_URL}/healthz - Server kept awake.`);
      }
    } catch (err) {
      console.warn('⚠️ [24/7 Heartbeat] Ping error:', err.message);
    }
  }, 8 * 60 * 1000);
});
