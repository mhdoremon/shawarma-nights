import DataLayer from '../../core/DataLayer.js';
import WebSocketHub from '../../core/WebSocketHub.js';
import { generateId, generateOtp, generateUUID, now, normalizePhone } from '../../utils/helpers.js';

export function register(req, res) {
  try {
    const { name, phone, vehicleType, vehicleNumber } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Name and phone are required' });
    }
    
    const deliveryBoys = DataLayer.read(req.storeId, 'delivery_boys') || [];
    const normPhone = normalizePhone(phone);
    
    if (deliveryBoys.find(d => d.phone === normPhone)) {
      return res.status(400).json({ success: false, message: 'Phone number already registered' });
    }
    
    const deliveryBoy = {
      id: generateId('del'),
      name,
      phone: normPhone,
      token: generateUUID(),
      status: 'active',
      location: null,
      vehicleType,
      vehicleNumber,
      createdAt: now()
    };
    
    deliveryBoys.push(deliveryBoy);
    DataLayer.writeSync(req.storeId, 'delivery_boys', deliveryBoys);
    
    return res.json({ success: true, token: deliveryBoy.token, deliveryBoy });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function login(req, res) {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ success: false, message: 'Phone required' });
    
    const deliveryBoys = DataLayer.read(req.storeId, 'delivery_boys') || [];
    const normPhone = normalizePhone(phone);
    const boy = deliveryBoys.find(d => d.phone === normPhone);
    
    if (!boy) return res.status(404).json({ success: false, message: 'Delivery partner not found' });
    
    // Simulate OTP sending
    const otp = generateOtp();
    // In real app, call comms to send OTP via SMS
    console.log(`[DELIVERY LOGIN] Store: ${req.storeId}, Phone: ${normPhone}, OTP: ${otp}`);
    
    return res.json({ success: true, message: 'OTP sent' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function getStatus(req, res) {
  try {
    const token = req.query.token;
    if (!token) return res.status(401).json({ success: false, message: 'Token required' });
    
    const deliveryBoys = DataLayer.read(req.storeId, 'delivery_boys') || [];
    const boy = deliveryBoys.find(d => d.token === token);
    if (!boy) return res.status(404).json({ success: false, message: 'Not found' });
    
    const orders = DataLayer.read(req.storeId, 'orders') || [];
    const activeOrders = orders.filter(o => o.deliveryBoyId === boy.id && o.status === 'out_for_delivery');
    
    return res.json({ success: true, deliveryBoy: boy, activeOrders });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function updateLocation(req, res) {
  try {
    const { token, lat, lng } = req.body;
    if (!token || lat === undefined || lng === undefined) {
      return res.status(400).json({ success: false, message: 'Missing parameters' });
    }
    
    const deliveryBoys = DataLayer.read(req.storeId, 'delivery_boys') || [];
    const boy = deliveryBoys.find(d => d.token === token);
    if (!boy) return res.status(404).json({ success: false, message: 'Not found' });
    
    boy.location = { lat, lng, updatedAt: now() };
    DataLayer.writeSync(req.storeId, 'delivery_boys', deliveryBoys);
    
    WebSocketHub.broadcastToAll(req.storeId, {
      action: 'DELIVERY_LOCATION_UPDATED',
      payload: { deliveryBoyId: boy.id, location: boy.location }
    });
    
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function getOrders(req, res) {
  try {
    const token = req.query.token;
    if (!token) return res.status(401).json({ success: false, message: 'Token required' });
    
    const deliveryBoys = DataLayer.read(req.storeId, 'delivery_boys') || [];
    const boy = deliveryBoys.find(d => d.token === token);
    if (!boy) return res.status(404).json({ success: false, message: 'Not found' });
    
    const orders = DataLayer.read(req.storeId, 'orders') || [];
    const activeOrders = orders.filter(o => o.deliveryBoyId === boy.id && o.status === 'out_for_delivery');
    
    return res.json({ success: true, orders: activeOrders });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function verifyOtp(req, res) {
  try {
    const { orderId, otp, token } = req.body;
    
    const deliveryBoys = DataLayer.read(req.storeId, 'delivery_boys') || [];
    const boy = deliveryBoys.find(d => d.token === token);
    if (!boy) return res.status(404).json({ success: false, message: 'Delivery partner not found' });
    
    const orders = DataLayer.read(req.storeId, 'orders') || [];
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) return res.status(404).json({ success: false, message: 'Order not found' });
    
    const order = orders[orderIndex];
    if (order.deliveryBoyId !== boy.id) {
      return res.status(403).json({ success: false, message: 'Order assigned to another partner' });
    }
    
    if (String(order.deliveryOtp) !== String(otp)) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
    
    order.status = 'delivered';
    order.deliveredAt = now();
    
    DataLayer.writeSync(req.storeId, 'orders', orders);
    
    WebSocketHub.broadcastToAll(req.storeId, {
      action: 'ORDER_UPDATED',
      payload: order
    });
    
    return res.json({ success: true, order });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
