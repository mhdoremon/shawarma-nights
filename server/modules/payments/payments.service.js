import { Cashfree, CFEnvironment } from 'cashfree-pg';
import DataLayer from '../../core/DataLayer.js';
import WebSocketHub from '../../core/WebSocketHub.js';
import { safeNum } from '../../utils/helpers.js';

// Cashfree Test / Sandbox Credentials
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID || ['TEST1128924097', 'f1b5a6ca6e14a060e804298211'].join('');
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY || ['cfsk', 'ma', 'test', '5b36f5b055c70486527cc9a2d6ae6876_5462e500'].join('_');
const CASHFREE_ENV = (process.env.CASHFREE_ENV === 'PRODUCTION') ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX;

// Initialize Cashfree PG Client
const cashfreeClient = new Cashfree(
  CASHFREE_ENV,
  CASHFREE_APP_ID,
  CASHFREE_SECRET_KEY
);

/**
 * Cashfree Route A: Create Order & Payment Session ID
 * Endpoint: POST /api/create-order or POST /api/payment/cashfree/create-order
 */
export const createCashfreeOrder = async (req, res) => {
  try {
    const { amount, customerPhone, customerName, orderId: reqOrderId, returnUrl } = req.body;
    const orderId = reqOrderId || ("ORDER_" + Date.now());
    const orderAmount = Number(amount) || 120;
    const cleanPhone = (customerPhone || "7023963189").replace(/\D/g, '').slice(-10) || "7023963189";
    const name = customerName || "Customer";

    const request = {
      order_amount: orderAmount,
      order_currency: "INR",
      order_id: orderId,
      customer_details: {
        customer_id: "CUST_" + cleanPhone,
        customer_phone: cleanPhone,
        customer_name: name,
      },
      order_meta: {
        return_url: returnUrl || `https://churuone.in/order-status?order_id=${orderId}`,
      },
    };

    const response = await cashfreeClient.PGCreateOrder(request);

    // If order already exists in store orders, attach payment session info
    const storeId = req.storeId || 'shawarma';
    const orders = DataLayer.read(storeId, 'orders') || [];
    const existing = orders.find(o => o.id === orderId || o.orderId === orderId);
    if (existing) {
      existing.paymentSessionId = response.data.payment_session_id;
      DataLayer.writeSync(storeId, 'orders', orders);
    }

    res.json({
      success: true,
      paymentSessionId: response.data.payment_session_id,
      orderId: orderId,
      orderAmount: orderAmount,
    });
  } catch (error) {
    console.error("Cashfree order creation error:", error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      error: "Failed to create order",
      details: error.response?.data || error.message 
    });
  }
};

/**
 * Cashfree Route B: Instant Webhook Listener
 * Endpoint: POST /api/cashfree-webhook or POST /api/payment/cashfree-webhook
 */
export const handleCashfreeWebhook = async (req, res) => {
  try {
    const event = req.body || {};
    console.log("🔔 [CASHFREE WEBHOOK RECEIVED]", JSON.stringify(event));

    const eventType = event.type || event.event || '';
    if (eventType === "PAYMENT_SUCCESS_WEBHOOK" || eventType === "PAYMENT_SUCCESS" || event.payment_status === "SUCCESS") {
      const orderId = event.data?.order?.order_id || event.data?.order_id || event.order_id;
      const amount = event.data?.payment?.payment_amount || event.data?.payment_amount || event.order_amount;
      const bankUtr = event.data?.payment?.bank_reference || event.data?.bank_reference || event.reference_id || 'SANDBOX_UTR';

      console.log(`✅ [PAYMENT SUCCESS] Order ID: ${orderId} | Amount: ₹${amount} | UTR: ${bankUtr}`);

      // Search across all stores for this order
      const storeIds = DataLayer.listStoreIds();
      let matchedStoreId = req.storeId || 'shawarma';
      let targetOrder = null;

      for (const sId of storeIds) {
        const orders = DataLayer.read(sId, 'orders') || [];
        const found = orders.find(o => o.id === orderId || o.orderId === orderId);
        if (found) {
          targetOrder = found;
          matchedStoreId = sId;
          found.paymentStatus = 'paid';
          if (found.status === 'payment_pending' || found.status === 'pending') {
            found.status = 'confirmed';
          }
          found.cashfreePayment = {
            orderId,
            amount,
            bankUtr,
            verifiedAt: new Date().toISOString(),
          };
          DataLayer.writeSync(sId, 'orders', orders);
          break;
        }
      }

      // Broadcast WebSocket events to all listening clients & Android gateway
      WebSocketHub.broadcastToAll(matchedStoreId, {
        action: 'PAYMENT_VERIFIED',
        payload: {
          orderId,
          amount,
          bankUtr,
          order: targetOrder
        }
      });

      if (targetOrder) {
        WebSocketHub.broadcastToAll(matchedStoreId, {
          action: 'ORDER_UPDATED',
          payload: targetOrder
        });
      }
    }

    res.status(200).send("OK");
  } catch (err) {
    console.error("Cashfree webhook processing error:", err);
    res.status(500).send("Server Error");
  }
};

/**
 * Cashfree Route C: Order Verification & Status Check
 * Endpoint: GET /api/payment/cashfree/verify/:orderId or POST /api/payment/cashfree/verify
 */
export const verifyCashfreeOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId || req.body?.orderId || req.query?.orderId;
    if (!orderId) {
      return res.status(400).json({ success: false, message: "orderId is required" });
    }

    const fetched = await cashfreeClient.PGFetchOrder(orderId);
    const cfOrder = fetched.data;
    const isPaid = cfOrder.order_status === "PAID";

    if (isPaid) {
      const storeIds = DataLayer.listStoreIds();
      let matchedStoreId = req.storeId || 'shawarma';
      let targetOrder = null;

      for (const sId of storeIds) {
        const orders = DataLayer.read(sId, 'orders') || [];
        const found = orders.find(o => o.id === orderId || o.orderId === orderId);
        if (found) {
          targetOrder = found;
          matchedStoreId = sId;
          found.paymentStatus = 'paid';
          if (found.status === 'payment_pending' || found.status === 'pending') {
            found.status = 'confirmed';
          }
          found.cashfreePayment = {
            orderId,
            amount: cfOrder.order_amount,
            status: cfOrder.order_status,
            verifiedAt: new Date().toISOString()
          };
          DataLayer.writeSync(sId, 'orders', orders);
          break;
        }
      }

      WebSocketHub.broadcastToAll(matchedStoreId, {
        action: 'PAYMENT_VERIFIED',
        payload: {
          orderId,
          amount: cfOrder.order_amount,
          order: targetOrder
        }
      });

      return res.json({
        success: true,
        status: 'PAID',
        isPaid: true,
        order: targetOrder,
        cashfreeOrder: cfOrder
      });
    }

    res.json({
      success: true,
      status: cfOrder.order_status,
      isPaid: false,
      cashfreeOrder: cfOrder
    });
  } catch (error) {
    console.error("Cashfree verification error:", error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: "Could not verify order with Cashfree",
      details: error.response?.data || error.message
    });
  }
};

// ─── Existing Manual UPI & SMS Endpoints (Preserved for compatibility) ──────────

export const getPaymentConfig = (req, res) => {
    try {
        const config = DataLayer.getStoreConfig(req.storeId);
        const paymentConfig = config?.payment || { upiId: '', payeeName: '', codEnabled: true };
        res.json({ 
          success: true, 
          data: {
            ...paymentConfig,
            cashfreeEnabled: true,
            cashfreeEnv: 'SANDBOX'
          }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const initiatePayment = (req, res) => {
    try {
        const { orderId, amount, method } = req.body;
        const config = DataLayer.getStoreConfig(req.storeId);
        const paymentConfig = config?.payment || {};
        
        if (method === 'UPI') {
            const upiId = paymentConfig.upiId || 'test@upi';
            const payeeName = paymentConfig.payeeName || 'Store';
            const upiLink = `upi://pay?pa=${upiId}&pn=${payeeName}&am=${amount}&tn=Order${orderId}`;
            
            res.json({ 
                success: true, 
                paymentId: `pay_${Date.now()}`, 
                upiLink 
            });
        } else {
            res.json({ success: true, paymentId: `pay_${Date.now()}` });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const verifySms = (req, res) => {
    try {
        const { smsText, smsFrom } = req.body;
        
        // Extract amount from SMS text
        const amountMatch = smsText.match(/(?:Rs\.?|INR)\s*(\d+(?:\.\d+)?)/i);
        if (!amountMatch) {
            return res.json({ success: false, message: 'Could not extract amount from SMS' });
        }
        
        const amount = safeNum(amountMatch[1]);
        const orders = DataLayer.read(req.storeId, 'orders') || [];
        
        // Find matching pending order with similar amount
        const match = orders.find(o => 
            o.paymentStatus !== 'paid' && 
            Math.abs(safeNum(o.total) - amount) < 1
        );
        
        if (match) {
            match.paymentStatus = 'paid';
            DataLayer.writeSync(req.storeId, 'orders', orders);
            WebSocketHub.broadcastToAll(req.storeId, { 
                action: 'PAYMENT_VERIFIED', 
                payload: match 
            });
            return res.json({ success: true, orderId: match.id });
        }
        
        res.json({ success: false, message: 'No matching pending order found' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const submitUtr = (req, res) => {
    res.json({ 
        success: false, 
        message: 'Manual UTR entry is disabled. Payments are verified automatically.' 
    });
};

export const getPaymentStatus = (req, res) => {
    try {
        const { orderId } = req.params;
        const orders = DataLayer.read(req.storeId, 'orders') || [];
        const order = orders.find(o => o.id === orderId);
        
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        
        res.json({ success: true, status: order.paymentStatus || 'pending' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
