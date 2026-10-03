import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { sounds } from '../utils/soundEffects';
import { API_URL, WS_URL } from '../config/api';
import { isFirebaseConfigured } from '../firebase/config';
import { 
  subscribeToMenu, 
  subscribeToOrders, 
  subscribeToReviews,
  fbPlaceOrder,
  fbUpdateOrderStatus,
  fbAddMenuItem,
  fbUpdateMenuItem,
  fbDeleteMenuItem,
  fbToggleAvailability,
  fbAddReview
} from '../firebase/firebaseService';

const RealtimeContext = createContext(null);

export function RealtimeProvider({ children }) {
  const [menu, setMenu] = useState([]);
  const [orders, setOrders] = useState([]);
  const [deals, setDeals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [heroBanner, setHeroBanner] = useState({
    badgeText: '50% OFF — NIGHT50',
    titleLine1: 'REAL',
    titleLine2: 'CHARCOAL',
    titleHighlight: 'SHAWARMA',
    subtitle: 'Slow-turned on glowing coals. Carved fresh. Wrapped in toasted saj bread with our legendary garlic toum.',
    circleImage: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=800&q=85',
    priceText: 'Starts from',
    priceValue: '₹179',
    ratingText: '4.9 ★',
    reviewsText: 'Customer Favorite',
    marqueeText: '★ OPEN TILL 4 AM ● ★ CHARCOAL SPIT LIVE ● ★ 100% HALAL ● ★ USE CODE NIGHT50 ● ★ 25 MIN EXPRESS'
  });
  const [storeInfo, setStoreInfo] = useState({
    timing: 'Open Daily: 12:00 PM – 04:00 AM',
    deliveryNote: 'Midnight express delivery available',
    address: 'Shop 14, Food Street Avenue, Central Plaza',
    locationNote: 'Central hub kitchen',
    aboutText: 'Artisanal charcoal spit kitchen serving hand-carved rolls, loaded fries, and signature platters since midnight.',
    halalBadgeText: '100% Halal Certified Fresh',
    socials: {
      instagram: 'https://instagram.com/shawarmanights',
      whatsapp: '919876574292',
      twitter: '',
      facebook: '',
      youtube: ''
    }
  });
  const [reviews, setReviews] = useState([]);
  const [lastPaymentConfirmed, setLastPaymentConfirmed] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [engineType, setEngineType] = useState(isFirebaseConfigured ? 'Firebase' : 'Built-in Realtime');

  const wsRef = useRef(null);
  const broadcastChannelRef = useRef(null);
  const toastTimeoutRef = useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    // -------------------------------------------------------------
    // MODE 1: GOOGLE FIREBASE REAL-TIME SYNC (Active if keys provided)
    // -------------------------------------------------------------
    if (isFirebaseConfigured) {
      console.log('🚀 Activating Google Firebase Real-Time Synchronization Engine');
      setEngineType('Firebase Cloud');
      setIsConnected(true);

      const unsubMenu = subscribeToMenu((items) => {
        setMenu(items);
        showToast('Live: Menu update hua!');
      });

      const unsubOrders = subscribeToOrders((liveOrders) => {
        setOrders(liveOrders);
        sounds.playChime();
        showToast('Live: Orders update hue!');
      });

      const unsubReviews = subscribeToReviews((liveReviews) => {
        setReviews(liveReviews);
      });

      return () => {
        unsubMenu();
        unsubOrders();
        unsubReviews();
      };
    }

    // -------------------------------------------------------------
    // MODE 2: LOCAL WEBSOCKET + BROADCASTCHANNEL ENGINE (Fallback)
    // -------------------------------------------------------------
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const bc = new BroadcastChannel('sn_realtime_broadcast');
      broadcastChannelRef.current = bc;

      bc.onmessage = (event) => {
        const { type, payload } = event.data || {};
        handleRealtimeEvent(type, payload, false);
      };
    }

    let isMounted = true;
    let reconnectTimeout = null;

    function connectWs() {
      let wsUrl = '';
      if (WS_URL) {
        const clean = WS_URL.trim().replace(/\/+$/, '');
        wsUrl = clean.endsWith('/ws') ? clean : `${clean}/ws`;
      } else {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        wsUrl = `${protocol}//${window.location.host}/ws`;
      }
      wsUrl = wsUrl.includes('?') ? wsUrl : `${wsUrl}?storeId=shawarma`;

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isMounted) return;
          setIsConnected(true);
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);
            handleRealtimeEvent(data.action || data.type, data.payload, true);
          } catch (e) {
            console.error('Error parsing WS message:', e);
          }
        };

        ws.onclose = () => {
          if (!isMounted) return;
          setIsConnected(false);
          reconnectTimeout = setTimeout(connectWs, 3000);
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch (err) {
        reconnectTimeout = setTimeout(connectWs, 3000);
      }
    }

    connectWs();

    // Stale-while-revalidate with v2 key
    try {
      localStorage.removeItem('sn_cache_data'); // Clear legacy cache
      const cached = localStorage.getItem('sn_cache_data_v2');
      if (cached) {
        const cachedData = JSON.parse(cached);
        if (cachedData.menu) setMenu(cachedData.menu);
        if (cachedData.orders) setOrders(cachedData.orders);
        if (cachedData.deals) setDeals(cachedData.deals);
        if (cachedData.categories) setCategories(cachedData.categories);
        if (cachedData.heroBanner) setHeroBanner(cachedData.heroBanner);
        if (cachedData.storeInfo) setStoreInfo(cachedData.storeInfo);
        if (cachedData.reviews) setReviews(cachedData.reviews);
      }
    } catch (e) {}

    fetch(`${API_URL}/api/data`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.menu) setMenu(data.menu);
        if (data.orders) setOrders(data.orders);
        if (data.deals) setDeals(data.deals);
        if (data.categories) setCategories(data.categories);
        if (data.heroBanner) setHeroBanner(data.heroBanner);
        if (data.storeInfo) setStoreInfo(data.storeInfo);
        if (data.reviews) setReviews(data.reviews);
        // Cache fresh data for microsecond loading next time
        try { localStorage.setItem('sn_cache_data_v2', JSON.stringify(data)); } catch(e) {}
      })
      .catch((e) => console.log('Notice:', e.message));

    return () => {
      isMounted = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (wsRef.current) wsRef.current.close();
      if (broadcastChannelRef.current) broadcastChannelRef.current.close();
    };
  }, []);

  const handleRealtimeEvent = (type, payload, shouldBroadcastToChannel = false) => {
    switch (type) {
      case 'INIT_STATE':
        if (payload.menu) setMenu(payload.menu);
        if (payload.orders) setOrders(payload.orders);
        if (payload.deals) setDeals(payload.deals);
        if (payload.categories) setCategories(payload.categories);
        if (payload.heroBanner) setHeroBanner(payload.heroBanner);
        if (payload.storeInfo) setStoreInfo(payload.storeInfo);
        if (payload.reviews) setReviews(payload.reviews);
        break;

      case 'MENU_UPDATED':
        if (payload && typeof payload === 'object' && !Array.isArray(payload) && payload.menu) {
          setMenu(payload.menu);
          if (payload.categories) setCategories(payload.categories);
          try {
            const cached = localStorage.getItem('sn_cache_data_v2');
            const parsed = cached ? JSON.parse(cached) : {};
            localStorage.setItem('sn_cache_data_v2', JSON.stringify({ ...parsed, menu: payload.menu, categories: payload.categories || parsed.categories }));
          } catch (e) {}
        } else {
          setMenu(payload);
          try {
            const cached = localStorage.getItem('sn_cache_data_v2');
            const parsed = cached ? JSON.parse(cached) : {};
            localStorage.setItem('sn_cache_data_v2', JSON.stringify({ ...parsed, menu: payload }));
          } catch (e) {}
        }
        showToast('Live Update: Menu me badlaav hua!');
        break;

      case 'ORDER_CREATED':
        setOrders((prev) => [payload, ...prev]);
        sounds.playChime();
        showToast(`Naya Order Aaya: #${payload.id} (₹${payload.total})`);
        break;

      case 'ORDER_UPDATED':
      case 'ORDER_STATUS_CHANGED': {
        const orderId = payload?.id || payload?.orderId;
        const status = payload?.status;
        if (orderId && status) {
          setOrders((prev) =>
            prev.map((o) => (o.id === orderId ? { ...o, ...payload, status } : o))
          );
          showToast(`Order Status: #${orderId} ab "${status}" ho gaya!`);
        }
        break;
      }

      case 'PAYMENT_VERIFIED':
      case 'PAYMENT_CONFIRMED':
        setLastPaymentConfirmed(payload);
        sounds.playChime();
        showToast(`Payment Confirmed: #${payload.orderId} (₹${payload.amount || payload.order?.total || ''})!`);
        break;

      case 'REVIEW_ADDED':
        setReviews((prev) => [payload, ...prev]);
        showToast('Naya Customer Review publish hua!');
        break;

      case 'DEALS_UPDATED':
        setDeals(payload);
        try {
          const cached = localStorage.getItem('sn_cache_data_v2');
          const parsed = cached ? JSON.parse(cached) : {};
          localStorage.setItem('sn_cache_data_v2', JSON.stringify({ ...parsed, deals: payload }));
        } catch (e) {}
        showToast('Live Update: Offers update hue!');
        break;

      case 'CATEGORIES_UPDATED':
        setCategories(payload);
        try {
          const cached = localStorage.getItem('sn_cache_data_v2');
          const parsed = cached ? JSON.parse(cached) : {};
          localStorage.setItem('sn_cache_data_v2', JSON.stringify({ ...parsed, categories: payload }));
        } catch (e) {}
        showToast('Categories update ho gayi!');
        break;

      case 'HERO_UPDATED':
        setHeroBanner(payload);
        try {
          const cached = localStorage.getItem('sn_cache_data_v2');
          const parsed = cached ? JSON.parse(cached) : {};
          localStorage.setItem('sn_cache_data_v2', JSON.stringify({ ...parsed, heroBanner: payload }));
        } catch (e) {}
        showToast('Front Hero Offer update ho gaya!');
        break;

      case 'STORE_INFO_UPDATED':
        setStoreInfo(payload);
        try {
          const cached = localStorage.getItem('sn_cache_data_v2');
          const parsed = cached ? JSON.parse(cached) : {};
          localStorage.setItem('sn_cache_data_v2', JSON.stringify({ ...parsed, storeInfo: payload }));
        } catch (e) {}
        showToast('Dukan settings update ho gayi!');
        break;

      default:
        break;
    }

    if (shouldBroadcastToChannel && broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current.postMessage({ type, payload });
      } catch (err) {}
    }
  };

  const sendEvent = (type, payload) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    }

    if (broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current.postMessage({ type, payload });
      } catch (err) {}
    }

    // Optimistic local update
    switch (type) {
      case 'PLACE_ORDER': {
        const newOrder = {
          id: payload.orderId || `SN-${Math.floor(100000 + Math.random() * 900000)}`,
          customerName: payload.customerName || 'Customer',
          customerPhone: payload.customerPhone || '+91 98765-00000',
          address: payload.address || 'Address',
          items: payload.items || [],
          status: 'new',
          placedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          total: payload.grandTotal || 0,
          note: payload.note || '',
        };
        setOrders((prev) => [newOrder, ...prev]);
        break;
      }
      case 'UPDATE_ORDER_STATUS':
        setOrders((prev) =>
          prev.map((o) => (o.id === payload.orderId ? { ...o, status: payload.status } : o))
        );
        break;
      case 'ADD_MENU_ITEM':
        setMenu((prev) => [{ ...payload, id: `item-${Date.now()}`, available: true }, ...prev]);
        break;
      case 'UPDATE_MENU_ITEM':
        setMenu((prev) =>
          prev.map((it) => (it.id === payload.id ? { ...it, ...payload.updates } : it))
        );
        break;
      case 'DELETE_MENU_ITEM':
        setMenu((prev) => prev.filter((it) => it.id !== payload.id));
        break;
      case 'TOGGLE_AVAILABILITY':
        setMenu((prev) =>
          prev.map((it) => {
            if (it.id === payload.id) {
              const currentStatus = it.available !== false;
              return { ...it, available: !currentStatus };
            }
            return it;
          })
        );
        break;
      case 'ADD_REVIEW':
        setReviews((prev) => [
          {
            id: Date.now(),
            name: payload.name || 'Foodie',
            rating: payload.rating || 5,
            comment: payload.comment || '',
            dish: payload.dish || 'Shawarma',
            date: 'Just now',
          },
          ...prev,
        ]);
        break;
      case 'ADD_CATEGORY':
        setCategories((prev) => [...prev, payload]);
        break;
      case 'DELETE_CATEGORY':
        setCategories((prev) => prev.filter((c) => c.id !== payload.id));
        break;
      case 'ADD_DEAL':
        setDeals((prev) => [{ id: `deal-${Date.now()}`, ...payload }, ...prev]);
        break;
      case 'UPDATE_DEAL':
        setDeals((prev) =>
          prev.map((d) => (d.id === payload.id ? { ...d, ...payload.updates } : d))
        );
        break;
      case 'DELETE_DEAL':
        setDeals((prev) => prev.filter((d) => d.id !== payload.id));
        break;
      case 'UPDATE_HERO_BANNER':
        setHeroBanner((prev) => ({ ...prev, ...payload }));
        break;
      default:
        break;
    }
  };

  // Unified Action Methods (Automatically routes to Firebase if keys provided!)
  const placeOrder = (orderData) => {
    if (isFirebaseConfigured) {
      fbPlaceOrder(orderData);
      return;
    }

    // 1. Send via WebSocket for real-time delivery
    sendEvent('PLACE_ORDER', orderData);

    // 2. Guaranteed REST delivery to server database
    try {
      const apiUrl = API_URL ? API_URL.replace(/\/+$/, '') : '';
      fetch(`${apiUrl}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      }).then(r => r.json()).then(data => {
        if (data.success && data.order) {
          console.log('✅ [REST Order Success] Saved:', data.order.id);
        }
      }).catch(err => {
        console.warn('⚠️ REST order delivery failed:', err);
      });
    } catch (err) {
      console.warn('⚠️ REST order fetch error:', err);
    }
  };

  const updateOrderStatus = (orderId, status, otp = null, boyName = 'Store Admin') => {
    if (isFirebaseConfigured) fbUpdateOrderStatus(orderId, status);
    else sendEvent('UPDATE_ORDER_STATUS', { orderId, status, otp, boyName });
  };

  const addMenuItem = (item) => {
    if (isFirebaseConfigured) fbAddMenuItem(item);
    else sendEvent('ADD_MENU_ITEM', item);
  };

  const updateMenuItem = (id, updates) => {
    if (isFirebaseConfigured) fbUpdateMenuItem(id, updates);
    else sendEvent('UPDATE_MENU_ITEM', { id, updates });
  };

  const deleteMenuItem = (id) => {
    if (isFirebaseConfigured) fbDeleteMenuItem(id);
    else sendEvent('DELETE_MENU_ITEM', { id });
  };

  const toggleAvailability = (id) => {
    const item = menu.find((i) => i.id === id);
    if (isFirebaseConfigured) fbToggleAvailability(id, item ? item.available : true);
    else sendEvent('TOGGLE_AVAILABILITY', { id });
  };

  const addReview = (reviewData) => {
    const fullReview = {
      id: reviewData.id || `rev-${Date.now()}`,
      ...reviewData,
      date: reviewData.date || 'Just now',
      createdAt: reviewData.createdAt || new Date().toISOString(),
    };
    // Optimistic update
    setReviews((prev) => [fullReview, ...(prev || [])]);
    try {
      const cached = localStorage.getItem('sn_cache_data_v2');
      const parsed = cached ? JSON.parse(cached) : {};
      localStorage.setItem('sn_cache_data_v2', JSON.stringify({ ...parsed, reviews: [fullReview, ...(reviews || [])] }));
    } catch (e) {}

    if (isFirebaseConfigured) {
      fbAddReview(fullReview);
    } else {
      sendEvent('ADD_REVIEW', fullReview);
      try {
        fetch(`${API_URL}/api/reviews`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fullReview),
        }).catch(() => {});
      } catch (e) {}
    }
  };

  const deleteReview = (id) => {
    setReviews((prev) => (prev || []).filter((r) => r.id !== id));
    sendEvent('DELETE_REVIEW', { id });
    try {
      fetch(`${API_URL}/api/reviews/${id}`, { method: 'DELETE' }).catch(() => {});
    } catch (e) {}
  };

  const addCategory = (category) => {
    sendEvent('ADD_CATEGORY', category);
  };

  const deleteCategory = (id) => {
    sendEvent('DELETE_CATEGORY', { id });
  };

  const addDeal = (deal) => {
    sendEvent('ADD_DEAL', deal);
  };

  const updateDeal = (id, updates) => {
    sendEvent('UPDATE_DEAL', { id, updates });
  };

  const deleteDeal = (id) => {
    sendEvent('DELETE_DEAL', { id });
  };

  const updateHeroBanner = (updates) => {
    sendEvent('UPDATE_HERO_BANNER', updates);
  };

  const updateStoreInfo = (updates) => {
    sendEvent('UPDATE_STORE_INFO', updates);
  };

  const stats = {
    totalOrders: orders.length,
    newOrders: orders.filter((o) => o.status === 'new').length,
    preparingOrders: orders.filter((o) => o.status === 'preparing').length,
    outOrders: orders.filter((o) => o.status === 'out').length,
    deliveredOrders: orders.filter((o) => o.status === 'delivered').length,
    totalRevenue: orders.reduce((s, o) => s + (o.total || 0), 0),
    todayRevenue: orders
      .filter((o) => o.status === 'delivered')
      .reduce((s, o) => s + (o.total || 0), 0),
    totalMenuItems: menu.length,
    availableItems: menu.filter((i) => i.available !== false).length,
  };

  const initiateUpiPayment = async (orderData) => {
    try {
      const res = await fetch(`${API_URL}/api/payment/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
      return await res.json();
    } catch (e) {
      console.error('Error initiating UPI payment:', e);
      return { success: false, error: e.message };
    }
  };

  const submitManualUtr = async () => {
    return { success: false, message: 'Manual UTR is disabled' };
  };

  const verifyPaymentSms = async (smsText, sender = 'MANUAL-TEST') => {
    try {
      const res = await fetch(`${API_URL}/api/payment/verify-sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ smsText, sender }),
      });
      return await res.json();
    } catch (e) {
      console.error('Error verifying SMS:', e);
      return { success: false, error: e.message };
    }
  };

  return (
    <RealtimeContext.Provider
      value={{
        menu,
        orders,
        deals,
        categories,
        heroBanner,
        storeInfo,
        reviews,
        stats,
        isConnected,
        engineType,
        isFirebaseConfigured,
        lastPaymentConfirmed,
        lastPaymentConfirmation: lastPaymentConfirmed,
        initiateUpiPayment,
        submitManualUtr,
        verifyPaymentSms,
        placeOrder,
        updateOrderStatus,
        addMenuItem,
        updateMenuItem,
        deleteMenuItem,
        toggleAvailability,
        addReview,
        deleteReview,
        addCategory,
        deleteCategory,
        addDeal,
        updateDeal,
        deleteDeal,
        updateHeroBanner,
        updateStoreInfo,
      }}
    >
      {children}

      {/* Floating Real-Time Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-zinc-950 text-white px-5 py-3 rounded-2xl shadow-2xl border-2 border-[#DC2626] flex items-center gap-2.5 text-xs font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626] animate-ping" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </RealtimeContext.Provider>
  );
}

export function useRealtimeDB() {
  const ctx = useContext(RealtimeContext);
  if (!ctx) throw new Error('useRealtimeDB must be used within RealtimeProvider');
  return ctx;
}
