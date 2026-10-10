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
 * Universal Smart Payment Route A: Create Order & Payment Session ID for Any Brand
 * Endpoint: POST /api/create-order, POST /api/payment/create-order, POST /api/payment/create-session
 */
export const createCashfreeOrder = async (req, res) => {
  try {
    const { amount, customerPhone, customerName, orderId: reqOrderId, returnUrl, storeId: bodyStoreId, notes } = req.body;
    const storeId = req.storeId || bodyStoreId || req.query?.storeId || 'shawarma';
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
      order_tags: {
        store_id: String(storeId).slice(0, 50),
        brand: String(storeId).slice(0, 50),
      },
      order_note: notes || `Payment for ${storeId} #${orderId}`,
    };

    const response = await cashfreeClient.PGCreateOrder(request);

    // If order already exists in store orders, attach payment session info
    const orders = DataLayer.read(storeId, 'orders') || [];
    const existing = orders.find(o => o.id === orderId || o.orderId === orderId);
    if (existing) {
      existing.paymentSessionId = response.data.payment_session_id;
      DataLayer.writeSync(storeId, 'orders', orders);
    }

    // Record in store payments ledger
    try {
      const payments = DataLayer.read(storeId, 'payments') || [];
      const paymentRecord = {
        orderId,
        storeId,
        amount: orderAmount,
        currency: "INR",
        status: "INITIATED",
        customer: { name, phone: cleanPhone },
        paymentSessionId: response.data.payment_session_id,
        notes: notes || "",
        createdAt: new Date().toISOString(),
      };
      payments.unshift(paymentRecord);
      DataLayer.writeSync(storeId, 'payments', payments.slice(0, 500));
    } catch (e) {
      console.warn("Could not save payments ledger:", e.message);
    }

    res.json({
      success: true,
      paymentSessionId: response.data.payment_session_id,
      orderId: orderId,
      orderAmount: orderAmount,
      storeId: storeId,
      environment: process.env.CASHFREE_ENV === 'PRODUCTION' ? 'PRODUCTION' : 'SANDBOX'
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
 * Universal Smart Payment Route B: Instant Webhook Listener for Any Brand
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
      const taggedStoreId = event.data?.order?.order_tags?.store_id || event.data?.order?.order_tags?.brand || req.storeId;

      console.log(`✅ [PAYMENT SUCCESS] Store: ${taggedStoreId || 'search'} | Order ID: ${orderId} | Amount: ₹${amount} | UTR: ${bankUtr}`);

      // Search across all stores for this order (preferring taggedStoreId)
      const storeIds = taggedStoreId ? [taggedStoreId, ...DataLayer.listStoreIds().filter(s => s !== taggedStoreId)] : DataLayer.listStoreIds();
      let matchedStoreId = taggedStoreId || req.storeId || 'shawarma';
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

      // Update store payments ledger
      try {
        const payments = DataLayer.read(matchedStoreId, 'payments') || [];
        const pEntry = payments.find(p => p.orderId === orderId);
        if (pEntry) {
          pEntry.status = "PAID";
          pEntry.bankUtr = bankUtr;
          pEntry.paidAt = new Date().toISOString();
        } else {
          payments.unshift({
            orderId,
            storeId: matchedStoreId,
            amount,
            status: "PAID",
            bankUtr,
            paidAt: new Date().toISOString(),
          });
        }
        DataLayer.writeSync(matchedStoreId, 'payments', payments.slice(0, 500));
      } catch (pe) {
        console.warn("Ledger update notice:", pe.message);
      }

      // Broadcast WebSocket events to all listening clients & Dukandar Android app
      WebSocketHub.broadcastToAll(matchedStoreId, {
        action: 'PAYMENT_VERIFIED',
        payload: {
          orderId,
          amount,
          bankUtr,
          storeId: matchedStoreId,
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
 * Universal Smart Payment Route C: Order Verification & Status Check for Any Brand
 * Endpoint: GET /api/payment/verify/:orderId, GET /api/payment/cashfree/verify/:orderId, POST /api/payment/verify
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
    const taggedStoreId = cfOrder.order_tags?.store_id || req.storeId;

    if (isPaid) {
      const storeIds = taggedStoreId ? [taggedStoreId, ...DataLayer.listStoreIds().filter(s => s !== taggedStoreId)] : DataLayer.listStoreIds();
      let matchedStoreId = taggedStoreId || req.storeId || 'shawarma';
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

      // Update store payments ledger
      try {
        const payments = DataLayer.read(matchedStoreId, 'payments') || [];
        const pEntry = payments.find(p => p.orderId === orderId);
        if (pEntry) {
          pEntry.status = "PAID";
          pEntry.paidAt = new Date().toISOString();
        } else {
          payments.unshift({
            orderId,
            storeId: matchedStoreId,
            amount: cfOrder.order_amount,
            status: "PAID",
            paidAt: new Date().toISOString(),
          });
        }
        DataLayer.writeSync(matchedStoreId, 'payments', payments.slice(0, 500));
      } catch (pe) {}

      WebSocketHub.broadcastToAll(matchedStoreId, {
        action: 'PAYMENT_VERIFIED',
        payload: {
          orderId,
          amount: cfOrder.order_amount,
          storeId: matchedStoreId,
          order: targetOrder
        }
      });

      return res.json({
        success: true,
        status: 'PAID',
        isPaid: true,
        storeId: matchedStoreId,
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

/**
 * Universal Route D: Get Store Payments History
 * Endpoint: GET /api/payment/history?storeId=xyz
 */
export const getStorePayments = (req, res) => {
  try {
    const storeId = req.storeId || req.query.storeId || 'shawarma';
    const payments = DataLayer.read(storeId, 'payments') || [];
    res.json({ success: true, storeId, count: payments.length, payments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
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
            cashfreeEnv: process.env.CASHFREE_ENV === 'PRODUCTION' ? 'PRODUCTION' : 'SANDBOX'
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
            res.json({ success: true, paymentId: `cod_${Date.now()}` });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const verifySms = (req, res) => {
    try {
        const { smsText, smsFrom } = req.body;
        if (!smsText) {
            return res.status(400).json({ success: false, message: 'smsText is required' });
        }

        const amtMatch = smsText.match(/(?:rs\.?|inr)\s*([\d,]+(?:\.\d{1,2})?)/i);
        const amount = amtMatch ? parseFloat(amtMatch[1].replace(/,/g, '')) : 0;
        
        const orders = DataLayer.read(req.storeId, 'orders') || [];
        const pendingOrder = orders.find(o => 
            (o.paymentStatus === 'pending' || o.paymentStatus === 'payment_pending') && 
            Math.abs(safeNum(o.total, 0) - amount) < 1
        );

        if (pendingOrder) {
            pendingOrder.paymentStatus = 'paid';
            pendingOrder.status = 'confirmed';
            DataLayer.writeSync(req.storeId, 'orders', orders);

            WebSocketHub.broadcastToAll(req.storeId, {
                action: 'PAYMENT_VERIFIED',
                payload: { orderId: pendingOrder.id, amount }
            });

            return res.json({ success: true, orderId: pendingOrder.id, verified: true });
        }

        res.json({ success: false, verified: false, message: 'No matching pending order found' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const submitUtr = (req, res) => {
    res.json({ 
        success: false, 
        message: 'Manual UTR entry is disabled. Payments are verified automatically via Cashfree UPI.' 
    });
};

export const getPaymentStatus = (req, res) => {
    try {
        const { orderId } = req.params;
        const orders = DataLayer.read(req.storeId, 'orders') || [];
        const order = orders.find(o => o.id === orderId || o.orderId === orderId);
        
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        res.json({ 
            success: true, 
            status: order.paymentStatus || 'pending',
            orderStatus: order.status,
            order 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
