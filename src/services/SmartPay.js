/**
 * ChuruOne SmartPay Client SDK
 * Universal Plug-and-Play Payment Engine for Any Brand / Storefront.
 * 
 * Works with any storeId (e.g. 'shawarma', 'nash-studio', or any future brand).
 */

import { load } from '@cashfreepayments/cashfree-js';
import { API_URL } from '../config/api';

class SmartPaymentEngine {
  constructor() {
    this.apiBase = API_URL || '';
    this.cashfreeInstance = null;
    this.activeMode = 'sandbox'; // Default to Sandbox / Test mode
  }

  /**
   * Set API base URL explicitly if needed
   */
  setApiBase(url) {
    this.apiBase = url || '';
  }

  /**
   * Set Environment Mode ('sandbox' or 'production')
   */
  setMode(mode) {
    this.activeMode = mode === 'production' ? 'production' : 'sandbox';
  }

  /**
   * Get Cashfree SDK instance (lazy loaded & cached)
   */
  async getCashfreeSdk(mode = null) {
    const targetMode = mode || this.activeMode;
    if (!this.cashfreeInstance || this.cashfreeInstance._mode !== targetMode) {
      const instance = await load({ mode: targetMode });
      if (!instance) throw new Error("Cashfree JS SDK load nahi ho saka.");
      instance._mode = targetMode;
      this.cashfreeInstance = instance;
    }
    return this.cashfreeInstance;
  }

  /**
   * Universal 1-Line Payment Trigger for Any Brand
   * 
   * @param {Object} params
   * @param {string} params.storeId - Brand / Store identifier (e.g. 'shawarma', 'nash-studio', 'new-brand')
   * @param {number} params.amount - Order amount in INR (e.g. 199)
   * @param {string} params.customerPhone - Customer mobile number (10 digits)
   * @param {string} [params.customerName] - Customer full name
   * @param {string} [params.orderId] - Optional custom order ID
   * @param {string} [params.notes] - Optional order description or metadata
   * @param {string} [params.mode] - 'sandbox' or 'production' (defaults to 'sandbox')
   * @param {Function} [params.onSuccess] - Callback when payment is verified
   * @param {Function} [params.onError] - Callback on payment error
   * @param {Function} [params.onClose] - Callback when modal is closed
   */
  async checkout({
    storeId = 'shawarma',
    amount = 120,
    customerPhone = '7023963189',
    customerName = 'Customer',
    orderId = null,
    notes = '',
    mode = 'sandbox',
    onSuccess = null,
    onError = null,
    onClose = null,
  }) {
    const cleanPhone = String(customerPhone).replace(/\D/g, '').slice(-10) || '7023963189';
    const targetOrderId = orderId || (`${String(storeId).slice(0, 4).toUpperCase()}_${Date.now()}`);

    try {
      // 1. Create Order Session on Smart Server
      const res = await fetch(`${this.apiBase}/api/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Store-Id': storeId,
        },
        body: JSON.stringify({
          storeId,
          amount: Number(amount) || 120,
          customerPhone: cleanPhone,
          customerName: customerName || 'Customer',
          orderId: targetOrderId,
          notes: notes || `Payment for ${storeId}`,
        }),
      });

      const data = await res.json();
      if (!data.paymentSessionId) {
        throw new Error(data.error || data.details?.message || 'Cashfree payment session generate nahi ho saka.');
      }

      // 2. Load SDK & Open Modal
      const cashfree = await this.getCashfreeSdk(mode);
      await cashfree.checkout({
        paymentSessionId: data.paymentSessionId,
        redirectTarget: '_modal',
      });

      // 3. Verify Payment Status with Smart Server
      const verifyRes = await this.verify(targetOrderId, storeId);
      if (verifyRes.isPaid || verifyRes.status === 'PAID') {
        const payload = {
          success: true,
          isPaid: true,
          orderId: targetOrderId,
          amount: Number(amount),
          storeId: storeId,
          utr: verifyRes.order?.cashfreePayment?.bankUtr || verifyRes.cashfreeOrder?.payment_details?.bank_reference || 'VERIFIED',
          data: verifyRes,
        };
        if (onSuccess) onSuccess(payload);
        return payload;
      } else {
        if (onClose) onClose();
        return { success: false, isPaid: false, orderId: targetOrderId, status: verifyRes.status };
      }
    } catch (err) {
      console.error(`SmartPay error [Store: ${storeId}]:`, err);
      if (onError) onError(err);
      throw err;
    }
  }

  /**
   * Verify any Order ID for any Brand
   */
  async verify(orderId, storeId = 'shawarma') {
    try {
      const res = await fetch(`${this.apiBase}/api/payment/cashfree/verify/${encodeURIComponent(orderId)}?storeId=${encodeURIComponent(storeId)}`);
      return await res.json();
    } catch (err) {
      console.warn("SmartPay verification check warning:", err.message);
      return { success: false, isPaid: false, error: err.message };
    }
  }

  /**
   * Get Store Payment History Ledger
   */
  async getHistory(storeId = 'shawarma') {
    try {
      const res = await fetch(`${this.apiBase}/api/payment/history?storeId=${encodeURIComponent(storeId)}`);
      return await res.json();
    } catch (err) {
      return { success: false, payments: [] };
    }
  }
}

export const SmartPay = new SmartPaymentEngine();
export default SmartPay;
