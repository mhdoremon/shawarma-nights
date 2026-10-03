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

export const MasterProvider = ({ children }) => {
  const [storeId, setStoreId] = useState(() => localStorage.getItem('churuone_master_store_id') || 'shawarma');
  const [token, setToken] = useState(() => localStorage.getItem('churuone_master_token') || '');
  const [role, setRole] = useState(() => localStorage.getItem('churuone_master_role') || 'dukandar'); // 'dukandar' | 'delivery_boy'
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('churuone_master_user') || 'null');
    } catch {
      return null;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(token));
  const [isConnected, setIsConnected] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState(0); // 0 to 8
  const [toast, setToast] = useState(null); // { message, type: 'info'|'success'|'error' }

  // Store Realtime Data States
  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [deals, setDeals] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [franchise, setFranchise] = useState({
    enabled: true,
    investmentRange: '₹3.5L – ₹6.5L',
    roiMonths: '3 to 6 Months',
    grossMargin: '50% – 60%',
    setupDays: '14 Days'
  });
  const [franchiseInquiries, setFranchiseInquiries] = useState([]);
  const [storeInfo, setStoreInfo] = useState({});
  const [heroBanner, setHeroBanner] = useState({});
  const [smsLogs, setSmsLogs] = useState([]);
  const [assignedOrders, setAssignedOrders] = useState([]);

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
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    showToast('Logged out successfully', 'info');
  }, [showToast]);

  // REST API fetch wrapper with store ID and auth token headers
  const apiFetch = useCallback(async (endpoint, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      'x-store-id': storeId,
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });
    return res.json();
  }, [storeId, token]);

  // Send message through WebSocket or fallback to HTTP
  const sendWs = useCallback((payload) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
      return true;
    }
    return false;
  }, []);

  // Fetch initial state via REST fallback
  const fetchInitialDataViaRest = useCallback(async () => {
    try {
      // 1. Catalog & Store
      const storeRes = await fetch(`${API_BASE}/api/data?storeId=${storeId}`).catch(() => null);
      if (storeRes && storeRes.ok) {
        const data = await storeRes.json();
        if (data.menu) setMenu(data.menu);
        if (data.categories) setCategories(data.categories);
        if (data.deals) setDeals(data.deals);
        if (data.storeInfo) setStoreInfo(data.storeInfo);
        if (data.heroBanner) setHeroBanner(data.heroBanner);
        if (data.reviews) setReviews(data.reviews);
      }

      // 2. Orders
      const ordersRes = await apiFetch('/api/orders').catch(() => null);
      if (ordersRes && Array.isArray(ordersRes)) {
        setOrders(ordersRes);
      } else if (ordersRes?.orders) {
        setOrders(ordersRes.orders);
      }

      // 3. Customers (admin only)
      const custRes = await apiFetch('/api/auth/admin/customers').catch(() => null);
      if (custRes?.customers) setCustomers(custRes.customers);

      // 4. Franchise
      const franRes = await apiFetch('/api/franchise/config').catch(() => null);
      if (franRes?.config) setFranchise(franRes.config);
      if (franRes?.inquiries) setFranchiseInquiries(franRes.inquiries);

    } catch (err) {
      console.warn('Initial data REST fetch error:', err);
    }
  }, [apiFetch, storeId]);

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
              if (payload.menu) setMenu(payload.menu);
              if (payload.categories) setCategories(payload.categories);
              if (payload.orders) setOrders(payload.orders);
              if (payload.deals) setDeals(payload.deals);
              if (payload.customers) setCustomers(payload.customers);
              if (payload.reviews) setReviews(payload.reviews);
              if (payload.franchise) setFranchise(payload.franchise);
              if (payload.franchiseInquiries) setFranchiseInquiries(payload.franchiseInquiries);
              if (payload.storeInfo) setStoreInfo(payload.storeInfo);
              if (payload.heroBanner) setHeroBanner(payload.heroBanner);
              break;
            }

            case 'ORDER_CREATED': {
              const newOrder = payload.order || payload;
              setOrders(prev => {
                const exists = prev.some(o => o.id === newOrder.id);
                if (exists) return prev;
                return [newOrder, ...prev];
              });
              if (soundEnabled) playOrderSound();
              showToast(`🔔 Naya Order Aaya! #${newOrder.orderNumber || newOrder.id?.slice(-4)} (₹${newOrder.total || newOrder.grandTotal})`, 'success');
              break;
            }

            case 'ORDER_UPDATED':
            case 'ORDER_STATUS_CHANGED': {
              const updatedOrder = payload.order || payload;
              setOrders(prev => prev.map(o => o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o));
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
      const res = await fetch(`${API_BASE}/api/auth/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': targetStoreId
        },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success && data.token) {
        saveAuthSession(targetStoreId, data.token, 'dukandar', { username, storeId: targetStoreId });
        showToast('ChuruOne Dukandar Login Successful!', 'success');
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Invalid credentials' };
      }
    } catch (err) {
      return { success: false, message: err.message || 'Server connection error' };
    }
  };

  // 2. DELIVERY BOY LOGIN
  const loginDelivery = async (targetStoreId, phone, otp) => {
    try {
      const res = await fetch(`${API_BASE}/api/delivery/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': targetStoreId
        },
        body: JSON.stringify({ phone, otp })
      });
      const data = await res.json();
      if (data.success && data.token) {
        saveAuthSession(targetStoreId, data.token, 'delivery_boy', data.deliveryBoy || { phone });
        showToast('Delivery Partner Logged In!', 'success');
        return { success: true };
      }
      return { success: false, message: data.message || 'Invalid OTP' };
    } catch (err) {
      return { success: false, message: err.message || 'Network error' };
    }
  };

  // 3. UPDATE ORDER STATUS
  const updateOrderStatus = async (orderId, newStatus, deliveryBoyId = null) => {
    playClickSound();
    // 1. Optimistic local update
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus, deliveryBoyId } : o));

    // 2. Send via WebSocket
    const sentWs = sendWs({
      action: 'UPDATE_ORDER_STATUS',
      type: 'UPDATE_ORDER_STATUS',
      orderId,
      status: newStatus,
      deliveryBoyId
    });

    // 3. REST Fallback
    try {
      await apiFetch('/api/orders/update-status', {
        method: 'POST',
        body: JSON.stringify({ orderId, status: newStatus, deliveryBoyId })
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

    await apiFetch('/api/catalog/items', {
      method: 'POST',
      body: JSON.stringify(item)
    }).catch(err => console.warn('Add item error:', err));
    showToast(`"${item.name}" added to menu!`, 'success');
  };

  const updateMenuItem = async (itemId, updates) => {
    playClickSound();
    setMenu(prev => prev.map(item => item.id === itemId ? { ...item, ...updates } : item));

    sendWs({ action: 'UPDATE_MENU_ITEM', item: { id: itemId, ...updates } });

    await apiFetch(`/api/catalog/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }).catch(err => console.warn('Update item error:', err));
    showToast(`Dish updated successfully`, 'success');
  };

  const deleteMenuItem = async (itemId) => {
    playClickSound();
    setMenu(prev => prev.filter(item => item.id !== itemId));

    sendWs({ action: 'DELETE_MENU_ITEM', itemId });

    await apiFetch(`/api/catalog/items/${itemId}`, {
      method: 'DELETE'
    }).catch(err => console.warn('Delete item error:', err));
    showToast('Dish removed from menu', 'info');
  };

  // 5. DEALS / OFFERS ACTIONS
  const addDeal = async (dealData) => {
    playClickSound();
    const deal = { ...dealData, id: dealData.id || `deal-${Date.now()}`, isActive: true };
    setDeals(prev => [...prev, deal]);

    sendWs({ action: 'ADD_DEAL', deal });

    await apiFetch('/api/deals/item', {
      method: 'POST',
      body: JSON.stringify(deal)
    }).catch(err => console.warn('Add deal error:', err));
    showToast(`Promo Code ${deal.code} created!`, 'success');
  };

  const toggleDealActive = (dealId, isActive) => {
    playClickSound();
    setDeals(prev => prev.map(d => d.id === dealId ? { ...d, isActive, active: isActive } : d));

    sendWs({ action: 'UPDATE_DEAL', deal: { id: dealId, isActive, active: isActive } });

    apiFetch('/api/deals/item', {
      method: 'POST',
      body: JSON.stringify({ id: dealId, isActive, active: isActive })
    }).catch(err => console.warn('Toggle deal error:', err));
  };

  const deleteDeal = async (dealId) => {
    playClickSound();
    setDeals(prev => prev.filter(d => d.id !== dealId));

    sendWs({ action: 'DELETE_DEAL', dealId });

    await apiFetch(`/api/deals/item/${dealId}`, {
      method: 'DELETE'
    }).catch(err => console.warn('Delete deal error:', err));
    showToast('Promo deal removed', 'info');
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

  return (
    <MasterContext.Provider value={{
      storeId,
      setStoreId,
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
      deals,
      customers,
      reviews,
      franchise,
      franchiseInquiries,
      storeInfo,
      heroBanner,
      smsLogs,
      assignedOrders,
      // Actions
      loginDukandar,
      loginDelivery,
      logout,
      updateOrderStatus,
      toggleItemAvailability,
      addMenuItem,
      updateMenuItem,
      deleteMenuItem,
      addDeal,
      toggleDealActive,
      deleteDeal,
      updateFranchiseConfig,
      updateFranchiseInquiryStatus,
      updateStoreSettings,
      updateHeroBanner,
      updateUpiId,
      simulatePaymentSms,
      sendTestSms,
      verifyDeliveryOtp,
      refreshData: fetchInitialDataViaRest
    }}>
      {children}
    </MasterContext.Provider>
  );
};
