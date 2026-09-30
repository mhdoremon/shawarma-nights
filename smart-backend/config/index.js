import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// ─── Environment ──────────────────────────────────────────────
const PORT = parseInt(process.env.PORT, 10) || 5001;
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// ─── Paths ────────────────────────────────────────────────────
const DATA_DIR = path.join(ROOT_DIR, 'data');
const STORES_DIR = path.join(DATA_DIR, 'stores');
const PLATFORM_DIR = path.join(DATA_DIR, '_platform');
const UPLOADS_BASE_DIR = path.join(ROOT_DIR, 'public', 'uploads');

// ─── Default Store ID (backward compat with existing frontend) ──
const DEFAULT_STORE_ID = process.env.DEFAULT_STORE_ID || 'shawarma';

// ─── Rate Limits ──────────────────────────────────────────────
const RATE_LIMIT = {
  windowMs: 15 * 60 * 1000,   // 15 minutes
  maxRequests: IS_PRODUCTION ? 200 : 1000,
  otpWindowMs: 60 * 1000,     // 1 minute
  otpMaxRequests: 5
};

// ─── WebSocket ────────────────────────────────────────────────
const WS_PATHS = {
  customer: '/ws',
  gateway: '/gateway'
};

// ─── Verticals ────────────────────────────────────────────────
const VERTICALS = [
  'food', 'fashion', 'salon', 'electronics', 'catalog',
  'grocery', 'pharmacy', 'digital', 'subscription', 'rental', 'events'
];

// ─── Order Statuses ───────────────────────────────────────────
const ORDER_STATUSES = [
  'draft', 'payment_pending', 'confirmed', 'processing',
  'ready', 'out_for_delivery', 'delivered',
  'cancelled', 'return_requested', 'refunded'
];

// ─── Fulfillment Types ───────────────────────────────────────
const FULFILLMENT_TYPES = ['delivery', 'pickup', 'dine_in', 'digital', 'booking'];

// ─── Payment Methods ─────────────────────────────────────────
const PAYMENT_METHODS = ['upi', 'cod', 'card', 'wallet', 'bank_transfer'];

// ─── Default Store Config Template ───────────────────────────
const DEFAULT_STORE_CONFIG = {
  name: '',
  slug: '',
  vertical: 'food',
  status: 'active',
  owner: {
    name: '',
    phone: '',
    email: '',
    password: '',
    token: ''
  },
  branding: {
    logo: '',
    primaryColor: '#DC2626',
    secondaryColor: '#0F172A',
    font: 'Inter',
    tagline: '',
    heroImage: ''
  },
  domain: {
    subdomain: '',
    customDomain: null
  },
  settings: {
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    language: 'hi',
    isOpen: true,
    timing: '09:00 AM – 10:00 PM',
    freeDeliveryThreshold: 350,
    deliveryRadius: 10,
    minOrderAmount: 0,
    maxOrdersPerHour: 100,
    autoAcceptOrders: false,
    enabledModules: ['catalog', 'orders', 'deals', 'reviews', 'delivery', 'payments', 'customers']
  },
  payment: {
    upiId: '',
    payeeName: '',
    razorpayKeyId: null,
    codEnabled: true,
    autoSmsVerification: true
  },
  tax: {
    enabled: false,
    gstin: '',
    defaultTaxRate: 0,
    pricesIncludeTax: false
  },
  socials: {
    instagram: '',
    whatsapp: '',
    facebook: '',
    youtube: '',
    twitter: ''
  },
  smsGateway: {
    connected: false,
    deviceId: null,
    lastSeen: null
  },
  plan: {
    type: 'free',
    monthlyFee: 0,
    validUntil: null
  }
};

// ─── Default Data Templates (per store) ──────────────────────
const DEFAULT_STORE_DATA = {
  'menu.json': { menu: [], categories: [] },
  'orders.json': [],
  'customers.json': [],
  'deals.json': [],
  'reviews.json': [],
  'delivery_boys.json': [],
  'coupon_usage.json': {},
  'used_utrs.json': []
};

export default {
  PORT,
  NODE_ENV,
  IS_PRODUCTION,
  CORS_ORIGIN,
  DATA_DIR,
  STORES_DIR,
  PLATFORM_DIR,
  UPLOADS_BASE_DIR,
  DEFAULT_STORE_ID,
  RATE_LIMIT,
  WS_PATHS,
  VERTICALS,
  ORDER_STATUSES,
  FULFILLMENT_TYPES,
  PAYMENT_METHODS,
  DEFAULT_STORE_CONFIG,
  DEFAULT_STORE_DATA
};
