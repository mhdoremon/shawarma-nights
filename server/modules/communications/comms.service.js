import WebSocketHub from '../../core/WebSocketHub.js';
import DataLayer from '../../core/DataLayer.js';

/**
 * Send SMS via store's Android SMS gateway
 */
export function sendSms(storeId, phone, message) {
  WebSocketHub.broadcastToGateway(storeId, {
    action: 'SEND_SMS',
    phone,
    message
  });
}

/**
 * Send order confirmation notification
 */
export function notifyOrderConfirmed(storeId, order) {
  const msg = `Order #${order.orderNumber} confirmed! Total: ₹${order.total}. Track: ${getTrackingUrl(storeId, order.id)}`;
  sendSms(storeId, order.customer?.phone, msg);
}

/**
 * Send delivery dispatched notification
 */
export function notifyOrderDispatched(storeId, order) {
  const msg = `Order #${order.orderNumber} is out for delivery! Your delivery partner is on the way.`;
  sendSms(storeId, order.customer?.phone, msg);
}

/**
 * Send OTP via SMS
 */
export function sendOtpSms(storeId, phone, otp) {
  sendSms(storeId, phone, `Your verification code is: ${otp}. Valid for 5 minutes.`);
}

function getTrackingUrl(storeId, orderId) {
  return `https://${storeId}.churuone.in/track/${orderId}`;
}

export function getStatus(req, res) {
  try {
    // Basic status check for the communications gateway
    return res.json({ success: true, status: 'Gateway active' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function testSms(req, res) {
  try {
    const { phone, message } = req.body;
    if (!phone || !message) {
      return res.status(400).json({ success: false, message: 'Phone and message required' });
    }
    
    sendSms(req.storeId, phone, message);
    return res.json({ success: true, message: 'Test SMS queued to gateway' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
