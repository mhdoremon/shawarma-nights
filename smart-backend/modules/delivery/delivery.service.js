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

const deliveryOtpStore = new Map();

export function login(req, res) {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ success: false, message: 'Phone required' });
    
    const deliveryBoys = DataLayer.read(req.storeId, 'delivery_boys') || [];
    const normPhone = normalizePhone(phone);
    const boy = deliveryBoys.find(d => d.phone === normPhone);
    
    if (!boy) return res.status(404).json({ success: false, message: 'Delivery partner not found' });
    
    const otp = generateOtp(6);
    deliveryOtpStore.set(`${req.storeId}:${normPhone}`, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });

    const formattedPhone = normPhone.startsWith('+91') ? normPhone : (normPhone.length === 10 ? `+91${normPhone}` : normPhone);
    const smsPayload = {
      action: 'SEND_SMS',
      requestId: generateUUID(),
      phone: formattedPhone,
      message: `Shawarma Nights Delivery Partner Login OTP: ${otp}. Valid for 5 minutes.`
    };
    const sent = WebSocketHub.broadcastToGateway(req.storeId, smsPayload);
    if (!sent) {
      WebSocketHub.queueGatewaySms(req.storeId, smsPayload);
    }

    console.log(`[DELIVERY LOGIN] Store: ${req.storeId}, Phone: ${normPhone}, OTP: ${otp}`);
    
    return res.json({ success: true, message: 'OTP sent', devOtp: otp, token: boy.token });
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
    if (!orderId || !otp) return res.status(400).json({ success: false, message: 'Order ID and OTP are required' });
    
    const orders = DataLayer.read(req.storeId, 'orders') || [];
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) return res.status(404).json({ success: false, message: 'Order not found' });
    
    const order = orders[orderIndex];
    
    // Verify the delivery OTP
    if (String(order.deliveryOtp) !== String(otp)) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
    
    // If token is provided, verify it's a valid delivery boy
    if (token) {
      const deliveryBoys = DataLayer.read(req.storeId, 'delivery_boys') || [];
      const boy = deliveryBoys.find(d => d.token === token);
      if (boy && order.deliveryBoyId && order.deliveryBoyId !== boy.id) {
        return res.status(403).json({ success: false, message: 'Order assigned to another partner' });
      }
    }
    
    // Mark as delivered
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
