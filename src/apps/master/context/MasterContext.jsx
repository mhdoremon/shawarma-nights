import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { playOrderSound, playClickSound } from '../utils/soundHelper';

const MasterContext = createContext(null);

export const useMaster = () => {
  const context = useContext(MasterContext);
  if (!context) throw new Error('useMaster must be used within MasterProvider');
  return context;
};

// API Host resolution - detects production Render host vs local Vite
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000'
  : 'https://churuone-backend.onrender.com';

const WS_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'ws://localhost:5000'
  : 'wss://churuone-backend.onrender.com';

// ============================================================================
// CLIENT CAPABILITY RESOLVER
// Resolves store capabilities dynamically based on storeId, storeConfig, or vertical
// ============================================================================
export function resolveClientCapabilities(storeId = '', storeConfig = {}) {
  const rawVertical = (
    storeConfig?.vertical ||
    storeConfig?.type ||
    storeConfig?.category ||
    storeConfig?.businessType ||
    ''
  ).toLowerCase();
  const sId = (storeId || '').toLowerCase();

  let vertical = 'food';
  if (
    ['marketplace', 'platform', 'churuone', 'aggregator'].includes(rawVertical) ||
    sId === 'churuone' || sId === 'platform'
  ) {
    vertical = 'marketplace';
  } else if (
    ['salon', 'barbershop', 'clinic', 'doctor', 'appointment', 'spa', 'dentist'].includes(rawVertical) ||
    sId.includes('nash') || sId.includes('salon') || sId.includes('barber') || sId.includes('beard') || sId.includes('clinic') || sId.includes('doctor')
  ) {
    vertical = 'salon';
  } else if (
    ['fashion', 'apparel', 'clothing', 'footwear', 'shoes', 'boutique', 'retail'].includes(rawVertical) ||
    sId.includes('skyline') || sId.includes('fashion') || sId.includes('cloth') || sId.includes('shoe') || sId.includes('wear')
  ) {
    vertical = 'fashion';
  } else if (
    ['mohalla_kirana', 'kirana', 'mohalla', 'dairy', 'provisions', 'daily_needs', 'grocery', 'supermarket'].includes(rawVertical) ||
    sId.includes('kirana') || sId.includes('mohalla') || sId.includes('dairy') || sId.includes('provision') || sId.includes('gupta')
  ) {
    vertical = 'mohalla_kirana';
  }

  const profiles = {
    marketplace: {
      vertical: 'marketplace',
      storeType: 'marketplace',
      catalog: {
        hasVegNonVeg: false,
        hasSizes: false,
        hasColors: false,
        hasLookbook: false,
        hasServiceDuration: false,
        hasFoodAddons: false,
        itemNoun: 'Partner Store',
        itemNounPlural: 'Partner Stores',
        isAggregator: true
      },
      orders: {
        hasKotPrinting: false,
        hasRiderDispatch: true,
        hasDeliveryOtp: true,
        hasAppointments: false,
        hasAdvanceToken: false,
        hasTicketPrinting: false,
        isCrossStore: true
      },
      settings: {
        hasAdvanceTokenFee: false,
        hasFreeDeliveryThreshold: true,
        hasDeliveryFee: true,
        hasTaxesAndPackaging: false,
        hasHeroBanner: true,
        hasHeroVideo: false,
        hasFranchise: false,
        hasDayWiseHours: false,
        hasPartnerStoresManagement: true,
        hasPlatformMarquee: true
      }
    },
    salon: {
      vertical: 'salon',
      catalog: {
        hasVegNonVeg: false,
        hasSizes: false,
        hasColors: false,
        hasLookbook: false,
        hasServiceDuration: true,
        hasFoodAddons: false,
        itemNoun: 'Service',
        itemNounPlural: 'Services',
        placeholderCategories: 'haircut, beard, facial, spa, styling...',
        placeholderItemName: 'e.g. Royal Fade Haircut & Beard Grooming',
        defaultCategory: 'haircut',
        defaultPrice: '499',
        categorySuggestions: ['haircut', 'beard', 'styling', 'facial', 'spa', 'massage'],
        nameSuggestions: ['Fade Haircut', 'Beard Trim & Styling', 'Gold Facial', 'Head Massage', 'Hair Spa', 'Classic Shave'],
      },
      orders: {
        hasKotPrinting: false,
        hasRiderDispatch: false,
        hasDeliveryOtp: false,
        hasAppointments: true,
        hasAdvanceToken: true,
        hasTicketPrinting: true,
      },
      settings: {
        hasAdvanceTokenFee: true,
        hasFreeDeliveryThreshold: false,
        hasDeliveryFee: false,
        hasTaxesAndPackaging: false,
        hasHeroBanner: false,
        hasHeroVideo: true,
        hasFranchise: false,
        hasDayWiseHours: true,
      }
    },
    fashion: {
      vertical: 'fashion',
      catalog: {
        hasVegNonVeg: false,
        hasSizes: true,
        hasColors: true,
        hasLookbook: true,
        hasServiceDuration: false,
        hasFoodAddons: false,
        itemNoun: 'Product',
        itemNounPlural: 'Products',
        placeholderCategories: 'shoes, shirts, jackets, trousers, accessories...',
        placeholderItemName: 'e.g. Slick Pro Streetwear Sneakers',
        defaultCategory: 'shoes',
        defaultPrice: '1499',
        categorySuggestions: ['shoes', 'sneakers', 'shirts', 'jackets', 'trousers', 'accessories'],
        nameSuggestions: ['Slick Pro Sneakers', 'Retro Runners', 'Streetwear Lows', 'Minimalist Oxford', 'Linen Shirt', 'Canvas Slip-on'],
      },
      orders: {
        hasKotPrinting: false,
        hasRiderDispatch: true,
        hasDeliveryOtp: true,
        hasAppointments: false,
        hasAdvanceToken: false,
        hasTicketPrinting: false,
      },
      settings: {
        hasAdvanceTokenFee: false,
        hasFreeDeliveryThreshold: true,
        hasDeliveryFee: true,
        hasTaxesAndPackaging: true,
        hasHeroBanner: true,
        hasHeroVideo: false,
        hasFranchise: false,
        hasDayWiseHours: false,
      }
    },
    food: {
      vertical: 'food',
      catalog: {
        hasVegNonVeg: true,
        hasSizes: false,
        hasColors: false,
        hasLookbook: false,
        hasServiceDuration: false,
        hasFoodAddons: true,
        itemNoun: 'Dish',
        itemNounPlural: 'Dishes',
        placeholderCategories: 'shawarmas, platters, fries, drinks, starters...',
        placeholderItemName: 'e.g. Charcoal Chicken Shawarma Roll',
        defaultCategory: 'shawarmas',
        defaultPrice: '179',
        categorySuggestions: ['shawarmas', 'platters', 'fries', 'drinks', 'starters', 'rolls'],
        nameSuggestions: ['Classic Chicken Shawarma', 'Spicy Garlic Shawarma', 'Charcoal Platter Special', 'Loaded Cheese Fries', 'Falafel Hummus Roll', 'Mint Mojito', 'Crispy Chicken Wings'],
      },
      orders: {
        hasKotPrinting: true,
        hasRiderDispatch: true,
        hasDeliveryOtp: true,
        hasAppointments: false,
        hasAdvanceToken: false,
        hasTicketPrinting: false,
      },
      settings: {
        hasAdvanceTokenFee: false,
        hasFreeDeliveryThreshold: true,
        hasDeliveryFee: true,
        hasTaxesAndPackaging: true,
        hasHeroBanner: true,
        hasHeroVideo: false,
        hasFranchise: true,
        hasDayWiseHours: false,
      }
    },
    mohalla_kirana: {
      vertical: 'mohalla_kirana',
      storeType: 'mohalla_kirana',
      catalog: {
        hasVegNonVeg: true,
        hasSizes: false,
        hasColors: false,
        hasLookbook: false,
        hasServiceDuration: false,
        hasFoodAddons: false,
        hasUnitWeights: true,
        hasMasterCatalogPicker: true,
        isMohallaStore: true,
        itemNoun: 'Kirana Item',
        itemNounPlural: 'Daily Essentials',
        placeholderCategories: 'dairy, bakery, staples, oil & ghee, spices, snacks, beverages, hygiene...',
        placeholderItemName: 'e.g. Aashirvaad Shudh Chakki Atta (5kg)',
        defaultCategory: 'dairy',
        defaultPrice: '60',
        categorySuggestions: ['dairy', 'bakery', 'staples', 'oil & ghee', 'spices', 'snacks', 'beverages', 'hygiene'],
        nameSuggestions: ['Fresh Full Cream Milk 1L', 'Amul Butter 100g', 'Aashirvaad Atta 5kg', 'Fortune Mustard Oil 1L', 'Tata Salt 1kg', 'Parle-G Gold Biscuit'],
      },
      orders: {
        hasKotPrinting: false,
        hasRiderDispatch: true,
        hasDeliveryOtp: true,
        hasAppointments: false,
        hasAdvanceToken: false,
        hasTicketPrinting: false,
        isExpressDelivery: true
      },
      settings: {
        hasAdvanceTokenFee: false,
        hasFreeDeliveryThreshold: true,
        hasDeliveryFee: true,
        hasTaxesAndPackaging: false,
        hasHeroBanner: true,
        hasHeroVideo: false,
        hasFranchise: false,
        hasDayWiseHours: false,
        hasMohallaGeoFence: true,
        hasLandmarkBinding: true
      }
    }
  };

  const base = profiles[vertical] || profiles.food;
  const custom = storeConfig?.capabilities || {};

  return {
    ...base,
    ...custom,
    vertical: custom.vertical || base.vertical,
    catalog: { ...base.catalog, ...(custom.catalog || {}) },
    orders: { ...base.orders, ...(custom.orders || {}) },
    settings: { ...base.settings, ...(custom.settings || {}) },
  };
}

// Local cache helpers for instant (0ms) UI load & Stale-While-Revalidate
const getLocalCache = (key, fallback) => {
  if (typeof window === 'undefined') return fallback;
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
};

const setLocalCache = (key, val) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {}
};

export function getStoreDefaultName(id) {
  const clean = (id || '').toLowerCase().trim();
  if (clean === 'churuone' || clean === 'platform') return 'ChuruOne Platform & Marketplace';
  if (clean.includes('skyline')) return 'Skyline Premium Outfits';
  if (clean.includes('nash')) return 'Nash Studio';
  if (clean.includes('gupta') || clean.includes('kirana')) return 'Gupta Kirana & Daily Needs';
  return 'Shawarma Nights';
}

export const MasterProvider = ({ children }) => {
  const [storeId, setStoreId] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlStore = params.get('storeId') || params.get('store');
      if (urlStore) {
        const normalized = (urlStore === 'nash' || urlStore === 'beared' || urlStore === 'beard') ? 'nash-studio' : urlStore;
        localStorage.setItem('churuone_master_store_id', normalized);
        return normalized;
      }
      const host = window.location.hostname.toLowerCase();
      if (host.includes('nash')) {
        localStorage.setItem('churuone_master_store_id', 'nash-studio');
        return 'nash-studio';
      }
      const savedUser = (() => {
        try { return JSON.parse(localStorage.getItem('churuone_master_user') || 'null'); } catch { return null; }
      })();
      return localStorage.getItem('churuone_master_store_id') || savedUser?.storeId || 'shawarma';
    }
    return 'shawarma';
  });
  const [token, setToken] = useState(() => localStorage.getItem('churuone_master_token') || '');
  const [role, setRole] = useState(() => localStorage.getItem('churuone_master_role') || 'dukandar'); // 'dukandar' | 'delivery_boy'
  const [user, setUser] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem('churuone_master_user') || 'null');
      if (u && (u.storeId === 'churuone' || u.username === 'churuone' || u.dukanId === 'CHURUONE')) {
        u.isSuperAdmin = true;
      }
      return u;
    } catch {
      return null;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(token));
  const [isConnected, setIsConnected] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState(0); // 0 to 8
  const [toast, setToast] = useState(null); // { message, type: 'info'|'success'|'error' }

  // Store Realtime Data States (Hydrated from cache for instant 0ms load)
  const [menu, setMenu] = useState(() => getLocalCache(`churuone_cache_menu_${storeId}`, []));
  const [categories, setCategories] = useState(() => getLocalCache(`churuone_cache_categories_${storeId}`, []));
  const [orders, setOrders] = useState(() => getLocalCache(`churuone_cache_orders_${storeId}`, []));
  const [deals, setDeals] = useState(() => getLocalCache(`churuone_cache_deals_${storeId}`, []));
  const [customers, setCustomers] = useState(() => getLocalCache(`churuone_cache_customers_${storeId}`, []));
  const [isCustomersLoaded, setIsCustomersLoaded] = useState(false);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [isHistoricalOrdersLoaded, setIsHistoricalOrdersLoaded] = useState(false);
  const [isLoadingHistoricalOrders, setIsLoadingHistoricalOrders] = useState(false);

  // Super Admin: City Products Platform Curation
  const [cityProducts, setCityProducts] = useState([]);
  const [isLoadingCityProducts, setIsLoadingCityProducts] = useState(false);

  // Super Admin: City Reviews & Store Permissions
  const [cityReviewsData, setCityReviewsData] = useState({ platformReviews: [], storeReviews: [], permissions: {} });
  const [isLoadingCityReviews, setIsLoadingCityReviews] = useState(false);

  const [reviews, setReviews] = useState(() => getLocalCache(`churuone_cache_reviews_${storeId}`, []));
  const [franchise, setFranchise] = useState(() => getLocalCache(`churuone_cache_franchise_${storeId}`, {
    enabled: true,
    investmentRange: '₹3.5L – ₹6.5L',
    roiMonths: '3 to 6 Months',
    grossMargin: '50% – 60%',
    setupDays: '14 Days'
  }));
  const [franchiseInquiries, setFranchiseInquiries] = useState([]);
  const [storeInfo, setStoreInfo] = useState(() => getLocalCache(`churuone_cache_storeInfo_${storeId}`, {
    name: getStoreDefaultName(storeId),
    storeName: getStoreDefaultName(storeId),
    vertical: storeId === 'churuone' ? 'marketplace' : storeId.includes('nash') ? 'salon' : storeId.includes('skyline') ? 'fashion' : 'food',
    isOpen: true
  }));
  const [heroBanner, setHeroBanner] = useState({});
  const [smsLogs, setSmsLogs] = useState([]);
  const [assignedOrders, setAssignedOrders] = useState([]);

  // Capabilities Matrix state dynamically resolved for the active store
  const [capabilities, setCapabilities] = useState(() => resolveClientCapabilities(storeId, storeInfo || {}));

  // Registered / Available Delivery Riders
  const [deliveryBoys, setDeliveryBoys] = useState([
    { id: 'db-1', name: 'Test Rider', phone: '9876543210', vehicle: 'Bike RJ-18' },
    { id: 'db-2', name: 'Express Courier', phone: '7427050263', vehicle: 'Delivery Van' }
  ]);

  // Keep capabilities in sync whenever storeId or storeInfo changes
  useEffect(() => {
    setCapabilities(prev => {
      const explicit = storeInfo?.capabilities;
      const resolved = resolveClientCapabilities(storeId, storeInfo);
      if (explicit) {
        return {
          ...resolved,
          ...explicit,
          catalog: { ...resolved.catalog, ...(explicit.catalog || {}) },
          orders: { ...resolved.orders, ...(explicit.orders || {}) },
          settings: { ...resolved.settings, ...(explicit.settings || {}) }
        };
      }
      return resolved;
    });
  }, [storeId, storeInfo]);

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const pingIntervalRef = useRef(null);

  // Show Toast helper
  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 3500);
  }, []);

  // Sync auth state to local storage
  const saveAuthSession = (newStoreId, newToken, newRole, newUser) => {
    setStoreId(newStoreId);
    setToken(newToken);
    setRole(newRole);
    setUser(newUser);
    setIsAuthenticated(true);

    localStorage.setItem('churuone_master_store_id', newStoreId);
    localStorage.setItem('churuone_master_token', newToken);
    localStorage.setItem('churuone_master_role', newRole);
    localStorage.setItem('churuone_master_user', JSON.stringify(newUser || {}));
  };

  const logout = useCallback(() => {
    setToken('');
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('churuone_master_token');
    localStorage.removeItem('churuone_master_user');
    localStorage.removeItem('churuone_master_role');
    localStorage.removeItem('churuone_master_store_id');
    sessionStorage.removeItem('churuone_active_shop');
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    showToast('Logged out successfully', 'info');
    window.location.href = '/auth?role=dukandar&mode=login';
  }, [showToast]);

  // REST API fetch wrapper with store ID and auth token headers
  const apiFetch = useCallback(async (endpoint, options = {}) => {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'x-store-id': storeId,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(options.headers || {})
      };

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal
      }).catch(() => null);
      clearTimeout(timer);

      if (!res || !res.ok) return null;
      return await res.json().catch(() => null);
    } catch {
      return null;
    }
  }, [storeId, token]);

  // Send message through WebSocket or fallback to HTTP
  const sendWs = useCallback((payload) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
      return true;
    }
    return false;
  }, []);

  // Fetch initial state via REST fallback in PARALLEL with timeouts
  const fetchInitialDataViaRest = useCallback(async () => {
    try {
      const isMarketplace = storeId === 'churuone';

      const fetchWithTimeout = async (url, options = {}, timeoutMs = 8000) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
          const res = await fetch(url, { ...options, signal: controller.signal });
          clearTimeout(timer);
          return res;
        } catch (e) {
          clearTimeout(timer);
          return null;
        }
      };

      // Parallel fetch with Promise.allSettled (Lightweight & Fast - Customers loaded on demand!)
      const [dataRes, ordersRes, franRes] = await Promise.allSettled([
        fetchWithTimeout(`${API_BASE}/api/data?storeId=${storeId}`),
        apiFetch('/api/orders'),
        isMarketplace ? Promise.resolve(null) : apiFetch('/api/franchise/config')
      ]);

      // 1. Process Store Data
      if (dataRes.status === 'fulfilled' && dataRes.value && dataRes.value.ok) {
        try {
          const data = await dataRes.value.json();
          if (data.menu) {
            setMenu(data.menu);
            setLocalCache(`churuone_cache_menu_${storeId}`, data.menu);
          }
          if (data.categories) {
            setCategories(data.categories);
            setLocalCache(`churuone_cache_categories_${storeId}`, data.categories);
          }
          if (data.deals) {
            setDeals(data.deals);
            setLocalCache(`churuone_cache_deals_${storeId}`, data.deals);
          }
          if (data.storeInfo) {
            const mergedInfo = {
              ...data.storeInfo,
              name: data.storeInfo.name || data.storeInfo.storeName || getStoreDefaultName(storeId),
              storeName: data.storeInfo.storeName || data.storeInfo.name || getStoreDefaultName(storeId),
              vertical: data.storeInfo.vertical || (storeId === 'churuone' ? 'marketplace' : 'retail')
            };
            setStoreInfo(mergedInfo);
            setLocalCache(`churuone_cache_storeInfo_${storeId}`, mergedInfo);
            const resolved = resolveClientCapabilities(storeId, { ...mergedInfo, capabilities: data.capabilities || mergedInfo.capabilities });
            setCapabilities(resolved);
          } else if (data.capabilities) {
            setCapabilities(resolveClientCapabilities(storeId, { capabilities: data.capabilities }));
          }
          if (data.heroBanner) setHeroBanner(data.heroBanner);
          if (data.reviews) {
            setReviews(data.reviews);
            setLocalCache(`churuone_cache_reviews_${storeId}`, data.reviews);
          }
        } catch (e) {
          console.warn('Failed parsing /api/data response:', e);
        }
      }

      // 2. Process Orders
      if (ordersRes.status === 'fulfilled' && ordersRes.value) {
        const rawOrders = Array.isArray(ordersRes.value) ? ordersRes.value : (ordersRes.value?.orders || []);
        const dedupedMap = new Map();
        rawOrders.forEach(o => {
          if (!o) return;
          const key = o.id || o.orderNumber;
          if (key && !dedupedMap.has(key)) {
            dedupedMap.set(key, o);
          }
        });
        const finalOrders = Array.from(dedupedMap.values());
        setOrders(finalOrders);
        setLocalCache(`churuone_cache_orders_${storeId}`, finalOrders);
      }
      // Note: Customers are intentionally NOT loaded automatically to minimize load!

      // 3. Process Franchise
      if (franRes.status === 'fulfilled' && franRes.value) {
        if (franRes.value?.config) {
          setFranchise(franRes.value.config);
          setLocalCache(`churuone_cache_franchise_${storeId}`, franRes.value.config);
        }
        if (franRes.value?.inquiries) setFranchiseInquiries(franRes.value.inquiries);
      }

    } catch (err) {
      console.warn('Initial data REST fetch error:', err);
    }
  }, [apiFetch, storeId]);

  // ─── HIGH PERFORMANCE: ON-DEMAND CUSTOMER LOADER ───
  const loadCustomersOnDemand = useCallback(async (force = false) => {
    if (isCustomersLoaded && !force && customers.length > 0) return customers;
    setIsLoadingCustomers(true);
    try {
      const res = await apiFetch('/api/auth/admin/customers');
      if (res?.customers && Array.isArray(res.customers)) {
        setCustomers(res.customers);
        setIsCustomersLoaded(true);
        setLocalCache(`churuone_cache_customers_${storeId}`, res.customers);
        return res.customers;
      }
    } catch (e) {
      console.warn('Failed loading customers on demand:', e);
    } finally {
      setIsLoadingCustomers(false);
    }
    return [];
  }, [apiFetch, isCustomersLoaded, customers, storeId]);

  // ─── HIGH PERFORMANCE: ON-DEMAND HISTORICAL ORDERS ARCHIVE LOADER ───
  const loadHistoricalOrders = useCallback(async () => {
    setIsLoadingHistoricalOrders(true);
    try {
      const res = await apiFetch('/api/orders?history=true');
      const raw = Array.isArray(res) ? res : (res?.orders || []);
      const dedupedMap = new Map();
      raw.forEach(o => {
        if (!o) return;
        const key = o.id || o.orderNumber;
        if (key && !dedupedMap.has(key)) {
          dedupedMap.set(key, o);
        }
      });
      const finalOrders = Array.from(dedupedMap.values());
      setOrders(finalOrders);
      setIsHistoricalOrdersLoaded(true);
      showToast(`Loaded ${finalOrders.length} orders archive!`, 'success');
      return finalOrders;
    } catch (e) {
      showToast('Failed to load historical archive', 'error');
    } finally {
      setIsLoadingHistoricalOrders(false);
    }
    return [];
  }, [apiFetch, showToast]);

  // ─── SUPER ADMIN: CITY PRODUCTS PLATFORM CURATION ───
  const loadCityProducts = useCallback(async () => {
    setIsLoadingCityProducts(true);
    try {
      const res = await fetch(`${API_BASE}/api/platform/products`);
      const data = await res.json().catch(() => null);
      if (data?.success && Array.isArray(data.products)) {
        setCityProducts(data.products);
        return data.products;
      }
    } catch (e) {
      console.warn('Failed to load city products:', e);
    } finally {
      setIsLoadingCityProducts(false);
    }
    return [];
  }, []);

  const toggleProductMarketplaceVisibility = useCallback(async (targetStoreId, itemId, visible) => {
    playClickSound();
    try {
      setCityProducts(prev => prev.map(p => {
        if (p.storeId === targetStoreId && String(p.id) === String(itemId)) {
          return { ...p, visibleOnChuruOne: visible, marketplaceVisible: visible };
        }
        return p;
      }));

      const res = await apiFetch(`/api/platform/products/${targetStoreId}/${itemId}/toggle-marketplace`, {
        method: 'POST',
        body: JSON.stringify({ visible })
      });
      if (res?.success) {
        showToast(res.message || 'Product visibility updated!', 'success');
        return { success: true };
      }
      return { success: false };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }, [apiFetch, showToast]);

  // ─── SUPER ADMIN: CITY REVIEWS & STORE MODERATION PERMISSIONS ───
  const loadCityReviews = useCallback(async () => {
    setIsLoadingCityReviews(true);
    try {
      const res = await fetch(`${API_BASE}/api/platform/reviews`);
      const data = await res.json().catch(() => null);
      if (data?.success) {
        setCityReviewsData({
          platformReviews: data.platformReviews || [],
          storeReviews: data.storeReviews || [],
          permissions: data.permissions || {}
        });
        return data;
      }
    } catch (e) {
      console.warn('Failed to load city reviews:', e);
    } finally {
      setIsLoadingCityReviews(false);
    }
    return null;
  }, []);

  const toggleStoreReviewPermission = useCallback(async (targetStoreId, canEdit) => {
    playClickSound();
    try {
      setCityReviewsData(prev => ({
        ...prev,
        permissions: {
          ...prev.permissions,
          [targetStoreId]: canEdit
        }
      }));

      const res = await apiFetch(`/api/platform/stores/${targetStoreId}/toggle-review-permission`, {
        method: 'POST',
        body: JSON.stringify({ canEditReviews: canEdit })
      });
      if (res?.success) {
        showToast(res.message || 'Permission updated!', 'success');
        return { success: true };
      }
      return { success: false };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }, [apiFetch, showToast]);

  // Connect WebSocket to Smart Gateway
  const connectWebSocket = useCallback(() => {
    if (!isAuthenticated) return;
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const url = `${WS_BASE}/gateway?storeId=${encodeURIComponent(storeId)}${token ? `&token=${encodeURIComponent(token)}` : ''}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        console.log(`⚡ [ChuruOne Master] Connected to Gateway for store: ${storeId}`);
        // Request Initial State immediately
        ws.send(JSON.stringify({ action: 'GET_INITIAL_STATE' }));

        // Start ping heartbeat
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ action: 'PING' }));
          }
        }, 25000);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const action = data.action || data.type;
          const payload = data.payload || data;

          switch (action) {
            case 'INIT_STATE':
            case 'INITIAL_STATE': {
              if (payload.menu) {
                setMenu(payload.menu);
                setLocalCache(`churuone_cache_menu_${storeId}`, payload.menu);
              }
              if (payload.categories) {
                setCategories(payload.categories);
                setLocalCache(`churuone_cache_categories_${storeId}`, payload.categories);
              }
              if (payload.orders) {
                setOrders(payload.orders);
                setLocalCache(`churuone_cache_orders_${storeId}`, payload.orders);
              }
              if (payload.deals) {
                setDeals(payload.deals);
                setLocalCache(`churuone_cache_deals_${storeId}`, payload.deals);
              }
              if (payload.customers) {
                setCustomers(payload.customers);
                setLocalCache(`churuone_cache_customers_${storeId}`, payload.customers);
              }
              if (payload.reviews) {
                setReviews(payload.reviews);
                setLocalCache(`churuone_cache_reviews_${storeId}`, payload.reviews);
              }
              if (payload.franchise) {
                setFranchise(payload.franchise);
                setLocalCache(`churuone_cache_franchise_${storeId}`, payload.franchise);
              }
              if (payload.franchiseInquiries) setFranchiseInquiries(payload.franchiseInquiries);
              if (payload.storeInfo) {
                setStoreInfo(prev => {
                  const updated = {
                    ...prev,
                    ...payload.storeInfo,
                    name: payload.storeInfo.name || payload.storeInfo.storeName || prev.name || getStoreDefaultName(storeId),
                    storeName: payload.storeInfo.storeName || payload.storeInfo.name || prev.storeName || getStoreDefaultName(storeId),
                    vertical: payload.storeInfo.vertical || prev.vertical || (storeId === 'churuone' ? 'marketplace' : 'retail')
                  };
                  setLocalCache(`churuone_cache_storeInfo_${storeId}`, updated);
                  return updated;
                });
                const resolved = resolveClientCapabilities(storeId, {
                  ...payload.storeInfo,
                  capabilities: payload.capabilities || payload.storeInfo.capabilities
                });
                setCapabilities(resolved);
              } else if (payload.capabilities) {
                setCapabilities(resolveClientCapabilities(storeId, { capabilities: payload.capabilities }));
              }
              if (payload.heroBanner) setHeroBanner(payload.heroBanner);
              break;
            }

            case 'ORDER_CREATED': {
              const newOrder = payload.order || payload;
              setOrders(prev => {
                const exists = prev.some(o => o && (o.id === newOrder.id || (o.orderNumber && newOrder.orderNumber && o.orderNumber === newOrder.orderNumber)));
                if (exists) {
                  return prev.map(o => (o && (o.id === newOrder.id || (o.orderNumber && newOrder.orderNumber && o.orderNumber === newOrder.orderNumber))) ? { ...o, ...newOrder } : o);
                }
                return [newOrder, ...prev];
              });
              if (soundEnabled) playOrderSound();
              showToast(`🔔 Naya Order Aaya! #${newOrder.orderNumber || newOrder.id?.slice(-4)} (₹${newOrder.total || newOrder.grandTotal})`, 'success');
              break;
            }

            case 'ORDER_UPDATED':
            case 'ORDER_STATUS_CHANGED': {
              const updatedOrder = payload.order || payload;
              const updateId = updatedOrder?.id || updatedOrder?.orderId;
              setOrders(prev => prev.map(o => (o && (o.id === updateId || o.orderNumber === updateId || (updatedOrder.orderNumber && o.orderNumber === updatedOrder.orderNumber))) ? { ...o, ...updatedOrder } : o));
              break;
            }

            case 'MENU_UPDATED': {
              if (Array.isArray(payload.menu)) {
                setMenu(payload.menu);
              } else if (payload.item) {
                setMenu(prev => prev.map(i => i.id === payload.item.id ? payload.item : i));
              }
              break;
            }

            case 'DEALS_UPDATED': {
              if (Array.isArray(payload.deals)) {
                setDeals(payload.deals);
              } else if (payload.deal) {
                setDeals(prev => {
                  const exists = prev.some(d => d.id === payload.deal.id);
                  return exists ? prev.map(d => d.id === payload.deal.id ? payload.deal : d) : [...prev, payload.deal];
                });
              }
              break;
            }

            case 'FRANCHISE_INQUIRY_RECEIVED':
            case 'NEW_FRANCHISE_INQUIRY': {
              const inq = payload.inquiry || payload;
              setFranchiseInquiries(prev => [inq, ...prev]);
              playClickSound();
              showToast(`🏢 New Franchise Inquiry from ${inq.name} (${inq.city || 'India'})!`, 'info');
              break;
            }

            case 'FRANCHISE_INQUIRY_UPDATED': {
              const inq = payload.inquiry || payload;
              setFranchiseInquiries(prev => prev.map(item => item.id === inq.id ? { ...item, ...inq } : item));
              break;
            }

            case 'FRANCHISE_CONFIG_UPDATED': {
              setFranchise(payload.config || payload);
              break;
            }

            case 'STORE_INFO_UPDATED': {
              setStoreInfo(prev => ({ ...prev, ...(payload.storeInfo || payload) }));
              break;
            }

            case 'HERO_UPDATED': {
              setHeroBanner(prev => ({ ...prev, ...(payload.heroBanner || payload) }));
              break;
            }

            case 'REVIEW_ADDED': {
              const newRev = payload.review || payload;
              setReviews(prev => [newRev, ...prev.filter(r => r.id !== newRev.id)]);
              break;
            }

            case 'REVIEW_DELETED': {
              const delId = payload.reviewId || payload.id || payload;
              setReviews(prev => prev.filter(r => r.id !== delId));
              break;
            }

            case 'SEND_SMS':
            case 'SMS_SENT_CONFIRMATION':
            case 'PAYMENT_SMS_RECEIVED': {
              setSmsLogs(prev => [{
                id: Date.now(),
                timestamp: new Date().toLocaleTimeString(),
                type: action,
                phone: data.phone || data.sender,
                text: data.message || data.smsText || ''
              }, ...prev.slice(0, 49)]);
              break;
            }

            default:
              break;
          }
        } catch (err) {
          console.warn('WS Message parse error:', err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        // Attempt reconnect in 3s if still authenticated
        if (isAuthenticated) {
          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
        }
      };

      ws.onerror = (e) => {
        console.warn('WS error:', e);
        ws.close();
      };

    } catch (e) {
      console.warn('WS init error:', e);
    }
  }, [isAuthenticated, storeId, token, soundEnabled, showToast]);

  // Connect on authentication and fetch initial data
  useEffect(() => {
    if (isAuthenticated) {
      fetchInitialDataViaRest();
      connectWebSocket();
    } else {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    }

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [isAuthenticated, connectWebSocket, fetchInitialDataViaRest]);

  // ==========================================
  // ACTION HANDLERS (Exact Match to Android App)
  // ==========================================

  // 1. DUKANDAR LOGIN
  const loginDukandar = async (targetStoreId, username, password) => {
    try {
      // Primary: Unified Dukandar Login API (Strict verification of Dukan ID + Username/Mobile + Password)
      const res = await fetch(`${API_BASE}/api/auth/dukandar/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': targetStoreId
        },
        body: JSON.stringify({ dukanId: targetStoreId, username, password })
      });
      const data = await res.json();
      if (data.success && data.token) {
        const storeIdClean = (data.storeId || targetStoreId).toLowerCase();
        const userData = {
          username: data.username || username,
          storeId: storeIdClean,
          dukanId: data.dukanId || targetStoreId.toUpperCase(),
          dukanName: data.dukanName || 'My Dukan',
          ownerName: data.ownerName || '',
          fatherName: data.fatherName || '',
          dob: data.dob || '',
          gender: data.gender || '',
          phone: data.ownerPhone || '',
          businessType: data.businessType || 'retail',
          status: data.status || 'active',
          websiteUrl: data.websiteUrl || '',
          isSuperAdmin: Boolean(data.isSuperAdmin || storeIdClean === 'churuone')
        };
        saveAuthSession(storeIdClean, data.token, 'dukandar', userData);
        const storeConf = data.storeInfo || data.storeConfig || { name: data.dukanName, status: data.status };
        const caps = data.capabilities || storeConf.capabilities;
        setCapabilities(resolveClientCapabilities(storeIdClean, { ...storeConf, capabilities: caps }));
        if (data.status === 'pending_review') {
          setActiveTab(0);
          showToast('Dukandar Login Successful! Application under review.', 'info');
        } else {
          showToast('ChuruOne Dukandar Login Successful!', 'success');
        }
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Invalid credentials' };
      }
    } catch (err) {
      return { success: false, message: err.message || 'Server connection error' };
    }
  };

  // 2. DELIVERY BOY LOGIN & REGISTRATION
  const loginDelivery = async (targetStoreId, phone, password) => {
    try {
      const res = await fetch(`${API_BASE}/api/delivery/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': targetStoreId
        },
        body: JSON.stringify({ phone, password })
      });
      const data = await res.json();
      if (data.success && data.token) {
        const boyData = data.boy || data.deliveryBoy || { phone };
        saveAuthSession(targetStoreId, data.token, 'delivery_boy', boyData);
        showToast(`Welcome ${boyData.name || 'Partner'}! Delivery Console ready.`, 'success');
        return { success: true };
      }
      return { success: false, message: data.message || 'Invalid credentials' };
    } catch (err) {
      return { success: false, message: err.message || 'Network error' };
    }
  };

  const registerDelivery = async (targetStoreId, { name, phone, vehicle, password }) => {
    try {
      const res = await fetch(`${API_BASE}/api/delivery/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': targetStoreId
        },
        body: JSON.stringify({ name, phone, vehicle, password })
      });
      const data = await res.json();
      if (data.success && data.token) {
        const boyData = data.boy || data.deliveryBoy || { name, phone, vehicle };
        saveAuthSession(targetStoreId, data.token, 'delivery_boy', boyData);
        showToast(`Welcome ${boyData.name}! Partner registered successfully.`, 'success');
        return { success: true };
      }
      return { success: false, message: data.message || 'Registration failed' };
    } catch (err) {
      return { success: false, message: err.message || 'Network error' };
    }
  };

  // 3. UPDATE ORDER STATUS
  const updateOrderStatus = async (orderId, newStatus, deliveryBoyId = null, paymentStatus = null) => {
    playClickSound();
    // 1. Optimistic local update
    setOrders(prev => prev.map(o => {
      if (o && (o.id === orderId || o.orderNumber === orderId)) {
        return {
          ...o,
          status: newStatus,
          deliveryBoyId: deliveryBoyId !== null ? deliveryBoyId : o.deliveryBoyId,
          ...(paymentStatus ? { paymentStatus } : {})
        };
      }
      return o;
    }));

    // 2. Send via WebSocket
    const sentWs = sendWs({
      action: 'UPDATE_ORDER_STATUS',
      type: 'UPDATE_ORDER_STATUS',
      orderId,
      status: newStatus,
      deliveryBoyId,
      ...(paymentStatus ? { paymentStatus } : {})
    });

    // 3. REST Fallback
    try {
      await apiFetch('/api/orders/update-status', {
        method: 'POST',
        body: JSON.stringify({
          orderId,
          status: newStatus,
          deliveryBoyId,
          ...(paymentStatus ? { paymentStatus } : {})
        })
      });
      showToast(`Order status updated to: ${newStatus.toUpperCase()}`, 'success');
    } catch (err) {
      console.warn('REST order update error:', err);
    }
  };

  // 4. MENU ACTIONS
  const toggleItemAvailability = (itemId, isAvailable) => {
    playClickSound();
    // Optimistic
    setMenu(prev => prev.map(item => item.id === itemId ? { ...item, available: isAvailable } : item));

    sendWs({
      action: 'TOGGLE_AVAILABILITY',
      type: 'TOGGLE_AVAILABILITY',
      itemId,
      available: isAvailable
    });

    apiFetch('/api/catalog/toggle-availability', {
      method: 'POST',
      body: JSON.stringify({ itemId, available: isAvailable })
    }).catch(err => console.warn('Availability API error:', err));
  };

  const addMenuItem = async (itemData) => {
    playClickSound();
    const item = { ...itemData, id: itemData.id || `dish-${Date.now()}` };
    setMenu(prev => [...prev, item]);

    sendWs({ action: 'ADD_MENU_ITEM', item });

    await apiFetch('/api/menu/item', {
      method: 'POST',
      body: JSON.stringify(item)
    }).catch(err => console.warn('Add item error:', err));
    showToast(`"${item.name}" added to menu!`, 'success');
  };

  const updateMenuItem = async (itemId, updates) => {
    playClickSound();
    setMenu(prev => prev.map(item => item.id === itemId ? { ...item, ...updates } : item));

    sendWs({ action: 'UPDATE_MENU_ITEM', item: { id: itemId, ...updates } });

    await apiFetch('/api/menu/item', {
      method: 'POST',
      body: JSON.stringify({ id: itemId, ...updates })
    }).catch(err => console.warn('Update item error:', err));
    showToast(`Dish updated successfully`, 'success');
  };

  const deleteMenuItem = async (itemId) => {
    playClickSound();
    setMenu(prev => prev.filter(item => item.id !== itemId));

    sendWs({ action: 'DELETE_MENU_ITEM', itemId });

    await apiFetch(`/api/menu/item/${itemId}`, {
      method: 'DELETE'
    }).catch(err => console.warn('Delete item error:', err));
    showToast('Dish removed from menu', 'info');
  };

  // 5. DEALS / OFFERS ACTIONS
  const addDeal = async (dealData) => {
    playClickSound();
    const isEdit = Boolean(dealData.id);
    const dealId = dealData.id || `deal-${Date.now()}`;
    const deal = { 
      ...dealData, 
      id: dealId, 
      isActive: dealData.isActive !== false && dealData.active !== false,
      active: dealData.isActive !== false && dealData.active !== false
    };

    setDeals(prev => {
      const idx = prev.findIndex(d => String(d.id) === String(dealId));
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...deal };
        return copy;
      }
      return [...prev, deal];
    });

    sendWs({ action: isEdit ? 'UPDATE_DEAL' : 'ADD_DEAL', deal });

    await apiFetch('/api/deals/item', {
      method: 'POST',
      body: JSON.stringify(deal)
    }).catch(err => console.warn('Save deal error:', err));
    
    showToast(isEdit ? `Promo Code ${deal.code} updated!` : `Promo Code ${deal.code} created!`, 'success');
  };

  const updateDeal = async (dealId, updates) => {
    playClickSound();
    setDeals(prev => prev.map(d => String(d.id) === String(dealId) ? { ...d, ...updates } : d));

    sendWs({ action: 'UPDATE_DEAL', deal: { id: dealId, ...updates } });

    await apiFetch('/api/deals/item', {
      method: 'POST',
      body: JSON.stringify({ id: dealId, ...updates })
    }).catch(err => console.warn('Update deal error:', err));
  };

  const toggleDealActive = (dealId, isActive) => {
    playClickSound();
    setDeals(prev => prev.map(d => String(d.id) === String(dealId) ? { ...d, isActive, active: isActive } : d));

    sendWs({ action: 'UPDATE_DEAL', deal: { id: dealId, isActive, active: isActive } });

    apiFetch('/api/deals/item', {
      method: 'POST',
      body: JSON.stringify({ id: dealId, isActive, active: isActive })
    }).catch(err => console.warn('Toggle deal error:', err));

    showToast(`Offer card ${isActive ? 'ACTIVATED (Live on Website)' : 'PAUSED (Hidden from Website)'}`, 'info');
  };

  const deleteDeal = async (dealId) => {
    playClickSound();
    setDeals(prev => prev.filter(d => String(d.id) !== String(dealId)));

    sendWs({ action: 'DELETE_DEAL', dealId });

    await apiFetch(`/api/deals/item/${dealId}`, {
      method: 'DELETE'
    }).catch(err => console.warn('Delete deal error:', err));
    showToast('Promo deal removed', 'info');
  };

  // 5.1 REVIEW ACTIONS
  const deleteReview = async (reviewId) => {
    playClickSound();
    setReviews(prev => prev.filter(r => r.id !== reviewId));

    sendWs({ action: 'DELETE_REVIEW', reviewId, id: reviewId });

    await apiFetch(`/api/reviews/${reviewId}`, {
      method: 'DELETE'
    }).catch(err => console.warn('Delete review error:', err));
    showToast('Review deleted successfully', 'info');
  };

  // 6. FRANCHISE ACTIONS
  const updateFranchiseConfig = async (configUpdates) => {
    playClickSound();
    const newConfig = { ...franchise, ...configUpdates };
    setFranchise(newConfig);

    sendWs({
      action: 'UPDATE_FRANCHISE_CONFIG',
      config: newConfig
    });

    await apiFetch('/api/franchise/config', {
      method: 'POST',
      body: JSON.stringify(newConfig)
    }).catch(err => console.warn('Franchise config update error:', err));
    showToast('Franchise settings saved!', 'success');
  };

  const updateFranchiseInquiryStatus = async (inquiryId, status) => {
    playClickSound();
    setFranchiseInquiries(prev => prev.map(i => i.id === inquiryId ? { ...i, status } : i));

    sendWs({
      action: 'UPDATE_FRANCHISE_INQUIRY_STATUS',
      inquiryId,
      status
    });

    await apiFetch(`/api/franchise/inquiries/${inquiryId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status })
    }).catch(err => console.warn('Inquiry status error:', err));
    showToast(`Lead marked as ${status.toUpperCase()}`, 'success');
  };

  // 7. SETTINGS & STORE ACTIONS
  const updateStoreSettings = async (updates) => {
    playClickSound();
    setStoreInfo(prev => ({ ...prev, ...updates }));

    sendWs({ action: 'UPDATE_STORE_INFO', storeInfo: updates });

    await apiFetch('/api/store-info', {
      method: 'POST',
      body: JSON.stringify(updates)
    }).catch(err => console.warn('Store info error:', err));
    showToast('Store settings updated!', 'success');
  };

  const updateHeroBanner = async (heroUpdates) => {
    playClickSound();
    setHeroBanner(prev => ({ ...prev, ...heroUpdates }));

    sendWs({ action: 'UPDATE_HERO_BANNER', heroBanner: heroUpdates });

    await apiFetch('/api/hero', {
      method: 'POST',
      body: JSON.stringify(heroUpdates)
    }).catch(err => console.warn('Hero banner update error:', err));
    showToast('Hero & Marquee banner updated!', 'success');
  };

  const updateUpiId = async (upiId) => {
    playClickSound();
    setStoreInfo(prev => ({ ...prev, upiId }));

    sendWs({ action: 'UPDATE_UPI_ID', upiId });

    await apiFetch('/api/store-info', {
      method: 'POST',
      body: JSON.stringify({ payment: { upiId } })
    }).catch(err => console.warn('UPI update error:', err));
    showToast('UPI ID updated!', 'success');
  };

  // 8. SMS & PAYMENT SMS SIMULATOR
  const simulatePaymentSms = (smsText, sender = 'SBIUPI') => {
    playClickSound();
    sendWs({
      action: 'PAYMENT_SMS_RECEIVED',
      smsText,
      smsFrom: sender
    });
    showToast('Sent payment SMS to auto-verify engine', 'info');
  };

  const sendTestSms = async (phone, message) => {
    playClickSound();
    sendWs({ action: 'SEND_SMS', phone, message });
    showToast(`SMS sent to ${phone}`, 'success');
  };

  // 9. DELIVERY BOY ACTIONS
  const verifyDeliveryOtp = async (orderId, otp) => {
    playClickSound();
    try {
      const res = await apiFetch('/api/delivery/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ orderId, otp, token })
      });
      if (res.success) {
        showToast('Order delivered successfully!', 'success');
        updateOrderStatus(orderId, 'delivered');
        return { success: true };
      }
      return { success: false, message: res.message || 'Invalid OTP' };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const flushAllOrders = async () => {
    playClickSound();
    try {
      const res = await apiFetch('/api/orders/flush', {
        method: 'POST',
        body: JSON.stringify({ storeId })
      });
      if (res?.success) {
        setOrders([]);
        showToast('Purane orders cleanly flush ho gaye! Fresh start ready.', 'success');
        return { success: true };
      }
      return { success: false, message: res?.message || 'Flush failed' };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const switchStoreId = (newId) => {
    const cleanId = (newId || 'shawarma').trim().toLowerCase();
    if (cleanId === 'churuone' && !user?.isSuperAdmin && storeId !== 'churuone') {
      showToast('Access Denied: ChuruOne Platform control requires Super Admin authorization.', 'error');
      return;
    }
    setStoreId(cleanId);
    const cachedStoreInfo = getLocalCache(`churuone_cache_storeInfo_${cleanId}`, {
      name: getStoreDefaultName(cleanId),
      storeName: getStoreDefaultName(cleanId),
      vertical: cleanId === 'churuone' ? 'marketplace' : cleanId.includes('nash') ? 'salon' : cleanId.includes('skyline') ? 'fashion' : 'food',
      isOpen: true
    });
    setStoreInfo(cachedStoreInfo);
    setCapabilities(resolveClientCapabilities(cleanId, cachedStoreInfo));
    localStorage.setItem('churuone_master_store_id', cleanId);
    showToast(`Switched to Store: ${getStoreDefaultName(cleanId)}`, 'success');
  };

  const toggleStoreMarketplaceVisibility = async (targetStoreId, visible) => {
    playClickSound();
    try {
      const res = await apiFetch(`/api/platform/stores/${targetStoreId}/toggle-marketplace`, {
        method: 'POST',
        body: JSON.stringify({ visible })
      });
      if (res?.success) {
        showToast(`Store ${targetStoreId} marketplace visibility updated!`, 'success');
        return { success: true };
      }
      return { success: false, message: res?.message || 'Update failed' };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const isSuperAdmin = Boolean(user?.isSuperAdmin || storeId === 'churuone');

  return (
    <MasterContext.Provider value={{
      storeId,
      setStoreId,
      switchStoreId,
      isSuperAdmin,
      toggleStoreMarketplaceVisibility,
      capabilities,
      setCapabilities,
      deliveryBoys,
      setDeliveryBoys,
      resolveClientCapabilities,
      token,
      role,
      user,
      isAuthenticated,
      isConnected,
      soundEnabled,
      setSoundEnabled,
      activeTab,
      setActiveTab,
      toast,
      showToast,
      // Data states
      menu,
      categories,
      orders,
      setOrders,
      deals,
      customers,
      isCustomersLoaded,
      isLoadingCustomers,
      loadCustomersOnDemand,
      isHistoricalOrdersLoaded,
      isLoadingHistoricalOrders,
      loadHistoricalOrders,
      // Super Admin: City Products
      cityProducts,
      isLoadingCityProducts,
      loadCityProducts,
      toggleProductMarketplaceVisibility,
      // Super Admin: City Reviews & Permissions
      cityReviewsData,
      isLoadingCityReviews,
      loadCityReviews,
      toggleStoreReviewPermission,
      reviews,
      franchise,
      franchiseInquiries,
      storeInfo,
      heroBanner,
      smsLogs,
      assignedOrders,
      // Actions
      apiFetch,
      loginDukandar,
      loginDelivery,
      registerDelivery,
      logout,
      updateOrderStatus,
      toggleItemAvailability,
      addMenuItem,
      updateMenuItem,
      deleteMenuItem,
      addDeal,
      updateDeal,
      toggleDealActive,
      deleteDeal,
      deleteReview,
      updateFranchiseConfig,
      updateFranchiseInquiryStatus,
      updateStoreSettings,
      updateHeroBanner,
      updateUpiId,
      simulatePaymentSms,
      sendTestSms,
      verifyDeliveryOtp,
      flushAllOrders,
      refreshData: fetchInitialDataViaRest
    }}>
      {children}
    </MasterContext.Provider>
  );
};
