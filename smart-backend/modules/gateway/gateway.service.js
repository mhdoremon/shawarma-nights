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
      const idx = menuData.menu.findIndex(item => item.id === data.itemId);
      if (idx !== -1) {
        menuData.menu[idx].available = data.available;
        DataLayer.writeSync(storeId, 'menu', menuData);
        WebSocketHub.broadcastToAll(storeId, { action: 'MENU_UPDATED', payload: menuData });
      }
      return true;
    }
    case 'ADD_DEAL': {
      const deals = DataLayer.read(storeId, 'deals') || [];
      const newDeal = { id: generateId(), ...data.deal };
      deals.push(newDeal);
      DataLayer.writeSync(storeId, 'deals', deals);
      WebSocketHub.broadcastToAll(storeId, { action: 'DEALS_UPDATED', payload: deals });
      return true;
    }
    case 'UPDATE_DEAL': {
      const deals = DataLayer.read(storeId, 'deals') || [];
      const idx = deals.findIndex(d => d.id === data.deal.id);
      if (idx !== -1) {
        deals[idx] = { ...deals[idx], ...data.deal };
        DataLayer.writeSync(storeId, 'deals', deals);
        WebSocketHub.broadcastToAll(storeId, { action: 'DEALS_UPDATED', payload: deals });
      }
      return true;
    }
    case 'DELETE_DEAL': {
      let deals = DataLayer.read(storeId, 'deals') || [];
      deals = deals.filter(d => d.id !== data.dealId);
      DataLayer.writeSync(storeId, 'deals', deals);
      WebSocketHub.broadcastToAll(storeId, { action: 'DEALS_UPDATED', payload: deals });
      return true;
    }
    case 'UPDATE_ORDER_STATUS': {
      const orders = DataLayer.read(storeId, 'orders') || [];
      const idx = orders.findIndex(o => o.id === data.orderId);
      if (idx !== -1) {
        orders[idx].status = data.status;
        orders[idx].updatedAt = now();
        DataLayer.writeSync(storeId, 'orders', orders);
        WebSocketHub.broadcastToAll(storeId, { action: 'ORDER_UPDATED', payload: orders[idx] });
      }
      return true;
    }
    case 'UPDATE_STORE_INFO': {
      const config = DataLayer.getStoreConfig(storeId) || {};
      config.settings = { ...config.settings, ...data.storeInfo };
      DataLayer.updateStoreConfig(storeId, config);
      WebSocketHub.broadcastToAll(storeId, { action: 'STORE_INFO_UPDATED', payload: config.settings });
      return true;
    }
    case 'UPDATE_HERO_BANNER': {
      const config = DataLayer.getStoreConfig(storeId) || {};
      config.heroBanner = { ...config.heroBanner, ...data.heroBanner };
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
    case 'SMS_SEND_FAILED': {
      console.log('SMS status update:', data);
      return true;
    }
    default:
      return false;
  }
}
