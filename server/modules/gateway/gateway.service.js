import DataLayer from '../../core/DataLayer.js';
import WebSocketHub from '../../core/WebSocketHub.js';
import { generateId, now } from '../../utils/helpers.js';

export function handleGatewayMessage(data, ws, storeId, source) {
  const action = data.action || data.type;
  switch (action) {
    case 'GET_INITIAL_STATE': {
      const menuData = DataLayer.read(storeId, 'menu') || { menu: [], categories: [] };
      const orders = DataLayer.read(storeId, 'orders') || [];
      const deals = DataLayer.read(storeId, 'deals') || [];
      const storeConfig = DataLayer.getStoreConfig(storeId) || {};
      WebSocketHub.sendTo(ws, {
        action: 'INIT_STATE',
        payload: { 
          menu: menuData.menu || [], 
          categories: menuData.categories || [], 
          orders, 
          deals, 
          storeInfo: storeConfig.settings || {}, 
          heroBanner: storeConfig.heroBanner || {} 
        }
      });
      return true;
    }
    case 'ADD_MENU_ITEM': {
      const menuData = DataLayer.read(storeId, 'menu') || { menu: [], categories: [] };
      const newItem = { id: generateId(), ...data.item };
      menuData.menu.push(newItem);
      DataLayer.writeSync(storeId, 'menu', menuData);
      WebSocketHub.broadcastToAll(storeId, { action: 'MENU_UPDATED', payload: menuData });
      return true;
    }
    case 'UPDATE_MENU_ITEM': {
      const menuData = DataLayer.read(storeId, 'menu') || { menu: [], categories: [] };
      const idx = menuData.menu.findIndex(item => item.id === data.item.id);
      if (idx !== -1) {
        menuData.menu[idx] = { ...menuData.menu[idx], ...data.item };
        DataLayer.writeSync(storeId, 'menu', menuData);
        WebSocketHub.broadcastToAll(storeId, { action: 'MENU_UPDATED', payload: menuData });
      }
      return true;
    }
    case 'DELETE_MENU_ITEM': {
      const menuData = DataLayer.read(storeId, 'menu') || { menu: [], categories: [] };
      menuData.menu = menuData.menu.filter(item => item.id !== data.itemId);
      DataLayer.writeSync(storeId, 'menu', menuData);
      WebSocketHub.broadcastToAll(storeId, { action: 'MENU_UPDATED', payload: menuData });
      return true;
    }
    case 'TOGGLE_AVAILABILITY': {
      const menuData = DataLayer.read(storeId, 'menu') || { menu: [], categories: [] };
      const targetId = data.itemId || data.id || data.payload?.id || data.payload?.itemId;
      const targetAvailable = data.isAvailable !== undefined ? data.isAvailable : (data.available !== undefined ? data.available : data.payload?.available);
      const idx = menuData.menu.findIndex(item => String(item.id) === String(targetId));
      if (idx !== -1) {
        menuData.menu[idx].available = Boolean(targetAvailable);
        menuData.menu[idx].updatedAt = now();
        DataLayer.writeSync(storeId, 'menu', menuData);
        WebSocketHub.broadcastToAll(storeId, { action: 'MENU_UPDATED', payload: menuData });
      }
      return true;
    }
    case 'ADD_DEAL': {
      const deals = DataLayer.read(storeId, 'deals') || [];
      const dealObj = data.deal || data.payload || {};
      const newDeal = { id: dealObj.id || generateId('deal'), ...dealObj };
      deals.push(newDeal);
      DataLayer.writeSync(storeId, 'deals', deals);
      WebSocketHub.broadcastToAll(storeId, { action: 'DEALS_UPDATED', payload: deals });
      return true;
    }
    case 'UPDATE_DEAL': {
      const deals = DataLayer.read(storeId, 'deals') || [];
      const dealObj = data.deal || data.payload || {};
      const idx = deals.findIndex(d => String(d.id) === String(dealObj.id));
      if (idx !== -1) {
        deals[idx] = { ...deals[idx], ...dealObj };
        DataLayer.writeSync(storeId, 'deals', deals);
        WebSocketHub.broadcastToAll(storeId, { action: 'DEALS_UPDATED', payload: deals });
      }
      return true;
    }
    case 'DELETE_DEAL': {
      let deals = DataLayer.read(storeId, 'deals') || [];
      const targetDealId = data.dealId || data.id || data.payload?.id;
      deals = deals.filter(d => String(d.id) !== String(targetDealId));
      DataLayer.writeSync(storeId, 'deals', deals);
      WebSocketHub.broadcastToAll(storeId, { action: 'DEALS_UPDATED', payload: deals });
      return true;
    }
    case 'UPDATE_ORDER_STATUS': {
      const orders = DataLayer.read(storeId, 'orders') || [];
      const orderId = data.orderId || data.id || data.payload?.orderId || data.payload?.id;
      const status = data.status || data.payload?.status;
      const idx = orders.findIndex(o => String(o.id) === String(orderId));
      if (idx !== -1) {
        orders[idx].status = status;
        orders[idx].updatedAt = now();
        DataLayer.writeSync(storeId, 'orders', orders);
        WebSocketHub.broadcastToAll(storeId, { action: 'ORDER_UPDATED', payload: orders[idx] });
      }
      return true;
    }
    case 'UPDATE_STORE_INFO': {
      const config = DataLayer.getStoreConfig(storeId) || {};
      const updates = data.storeInfo || data.payload || {};
      config.settings = { ...(config.settings || {}), ...updates };
      if (updates.payment) config.payment = { ...(config.payment || {}), ...updates.payment };
      if (updates.socials) config.socials = { ...(config.socials || {}), ...updates.socials };
      if (updates.taxesAndCharges) config.taxesAndCharges = { ...(config.taxesAndCharges || {}), ...updates.taxesAndCharges };
      DataLayer.updateStoreConfig(storeId, config);
      const combined = {
        ...(config.settings || {}),
        payment: config.payment || {},
        socials: config.socials || {},
        taxesAndCharges: config.taxesAndCharges || {}
      };
      WebSocketHub.broadcastToAll(storeId, { action: 'STORE_INFO_UPDATED', payload: combined });
      return true;
    }
    case 'UPDATE_HERO_BANNER': {
      const config = DataLayer.getStoreConfig(storeId) || {};
      const hero = data.heroBanner || data.payload || {};
      config.heroBanner = { ...(config.heroBanner || {}), ...hero };
      DataLayer.updateStoreConfig(storeId, config);
      WebSocketHub.broadcastToAll(storeId, { action: 'HERO_UPDATED', payload: config.heroBanner });
      return true;
    }
    case 'UPDATE_UPI_ID': {
      const config = DataLayer.getStoreConfig(storeId) || {};
      config.payment = config.payment || {};
      config.payment.upiId = data.upiId;
      DataLayer.updateStoreConfig(storeId, config);
      WebSocketHub.broadcastToAll(storeId, { action: 'UPI_ID_UPDATED', payload: data.upiId });
      return true;
    }
    case 'PAYMENT_SMS_RECEIVED': {
      console.log('Payment SMS received:', data.smsText);
      const orders = DataLayer.read(storeId, 'orders') || [];
      const smsText = data.smsText.toLowerCase();
      const match = smsText.match(/(?:rs\.?|inr)\s*(\d+(?:\.\d+)?)/i);
      if (match) {
        const amount = parseFloat(match[1]);
        const orderIdx = orders.findIndex(o => o.status === 'pending' && Math.abs(o.total - amount) < 1);
        if (orderIdx !== -1) {
          orders[orderIdx].status = 'preparing';
          orders[orderIdx].paymentStatus = 'paid';
          orders[orderIdx].updatedAt = now();
          DataLayer.writeSync(storeId, 'orders', orders);
          WebSocketHub.broadcastToAll(storeId, { action: 'ORDER_UPDATED', payload: orders[orderIdx] });
        }
      }
      return true;
    }
    case 'SMS_SENT_CONFIRMATION':
    case 'SMS_SEND_FAILED':
    case 'SMS_RESULT': {
      console.log(`📱 [SMS ${action}] Store: ${storeId}, Phone: ${data.phone || 'unknown'}, Success: ${data.success}, RequestId: ${data.requestId || 'none'}`);
      return true;
    }
    case 'PLACE_ORDER': {
      const orders = DataLayer.read(storeId, 'orders') || [];
      const payload = data.payload || data;
      const orderId = payload.orderId || payload.id || `SN-${Math.floor(100000 + Math.random() * 900000)}`;
      const deliveryOtp = String(Math.floor(1000 + Math.random() * 9000));
      
      const newOrder = {
        id: orderId,
        customerName: payload.customerName || (payload.customer?.name) || 'Online Customer',
        customerPhone: payload.customerPhone || (payload.customer?.phone) || '+91 98765-00000',
        address: payload.address || 'Delivery Address',
        items: payload.items || [],
        status: payload.status || 'new',
        placedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        total: payload.grandTotal || payload.total || 0,
        note: payload.note || payload.notes || '',
        paymentMethod: payload.paymentMethod || 'COD',
        paymentStatus: payload.paymentStatus || (payload.paymentMethod === 'UPI' ? 'paid' : 'pending_cash'),
        utr: payload.utr || null,
        couponCode: payload.couponCode || null,
        discountApplied: payload.discountApplied || payload.discount || 0,
        deliveryOtp: payload.deliveryOtp || deliveryOtp,
        createdAt: now(),
        updatedAt: now()
      };

      orders.unshift(newOrder);
      DataLayer.writeSync(storeId, 'orders', orders);

      // Broadcast to both customer web and Android phone gateway
      WebSocketHub.broadcastToAll(storeId, { action: 'ORDER_CREATED', type: 'ORDER_CREATED', payload: newOrder, order: newOrder });
      
      // Also reply back to sender
      WebSocketHub.sendTo(ws, { action: 'ORDER_CONFIRMED', type: 'ORDER_CONFIRMED', order: newOrder, payload: newOrder });
      return true;
    }
    default:
      return false;
  }
}
