import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USED_UTRS_PATH = path.join(__dirname, 'data', 'used_utrs.json');
const PENDING_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes timeout for pending UPI orders

class PaymentVerifier {
  constructor() {
    this.pendingOrders = new Map(); // orderId -> pendingOrderObj
    this.usedUtrs = new Set();
    this.recentUnmatchedPayments = []; // Cache recent bank credit SMS that arrived before order submission
    this.loadUsedUtrs();

    // Clean up expired pending orders every 60 seconds
    setInterval(() => this.cleanupExpiredOrders(), 60000);
  }

  loadUsedUtrs() {
    try {
      if (fs.existsSync(USED_UTRS_PATH)) {
        const data = JSON.parse(fs.readFileSync(USED_UTRS_PATH, 'utf-8'));
        if (Array.isArray(data)) {
          this.usedUtrs = new Set(data);
        }
      }
    } catch (err) {
      console.warn('⚠️ [PaymentVerifier] Error loading used UTRs:', err.message);
    }
  }

  saveUsedUtrs() {
    try {
      const dataDir = path.dirname(USED_UTRS_PATH);
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      fs.writeFileSync(USED_UTRS_PATH, JSON.stringify(Array.from(this.usedUtrs), null, 2), 'utf-8');
    } catch (err) {
      console.error('❌ [PaymentVerifier] Failed to persist used UTRs:', err.message);
    }
  }

  cleanupExpiredOrders() {
    const now = Date.now();
    for (const [orderId, order] of this.pendingOrders.entries()) {
      if (now > order.expiresAt) {
        console.log(`⏰ [PaymentVerifier] Order ${orderId} expired without payment.`);
        this.pendingOrders.delete(orderId);
      }
    }

    // Keep unmatched payments cache trimmed to last 20 entries or 15 mins
    this.recentUnmatchedPayments = this.recentUnmatchedPayments.filter(
      (p) => now - p.timestamp < 15 * 60 * 1000
    );
  }

  /**
   * Register a new order awaiting UPI payment
   */
  createPendingOrder(orderData) {
    const orderId = orderData.orderId || `SN-${Math.floor(100000 + Math.random() * 900000)}`;
    const pendingObj = {
      ...orderData,
      orderId,
      deliveryOtp: orderData.deliveryOtp || String(Math.floor(1000 + Math.random() * 9000)),
      grandTotal: Number(orderData.grandTotal) || 0,
      createdAt: Date.now(),
      expiresAt: Date.now() + PENDING_TIMEOUT_MS,
      status: 'awaiting_payment',
    };

    this.pendingOrders.set(orderId, pendingObj);
    console.log(`📝 [PaymentVerifier] Registered pending UPI order: ${orderId} for ₹${pendingObj.grandTotal}`);

    // Check if a matching bank credit SMS already arrived in the last 2 minutes
    const preMatchIdx = this.recentUnmatchedPayments.findIndex((p) => {
      const amtMatch = Math.abs(p.amount - pendingObj.grandTotal) < 0.5;
      const notUsed = !this.usedUtrs.has(p.utr);
      return amtMatch && notUsed;
    });

    if (preMatchIdx > -1) {
      const preMatch = this.recentUnmatchedPayments.splice(preMatchIdx, 1)[0];
      console.log(`⚡ [PaymentVerifier] Immediate match found in recent SMS cache for ${orderId}!`);
      return this.confirmPayment(orderId, preMatch.utr, preMatch.amount, 'auto_sms_prematch');
    }

    return { success: true, pendingOrder: pendingObj };
  }

  getPendingOrder(orderId) {
    return this.pendingOrders.get(orderId) || null;
  }

  cancelPendingOrder(orderId) {
    return this.pendingOrders.delete(orderId);
  }

  /**
   * Regex Parser for Indian Bank & Merchant UPI SMS
   * Extracts amount and UTR from any standard bank notification
   */
  parseBankSms(smsText) {
    if (!smsText || typeof smsText !== 'string') return null;

    const text = smsText.replace(/[\r\n]+/g, ' ').trim();

    // 1. Must be a CREDIT / DEPOSITED / RECEIVED notification (Reject debits)
    const isCredit = /(?:credited|credit|received|deposited|deposited to|transferred to|added to|payment received)/i.test(text);
    const isDebit = /(?:debited|spent|paid to|withdrawn|sent)/i.test(text);

    if (!isCredit && isDebit) {
      console.log('ℹ️ [PaymentVerifier] Ignoring debit SMS.');
      return null;
    }

    // 2. Extract Amount (Handles Rs., INR, ₹ formats like Rs. 389.00 or INR 389 or Rs 389)
    const amountPatterns = [
      /(?:rs\.?|inr|₹)\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
      /(?:credited|received|deposited)\s+(?:with|by|for)?\s*(?:rs\.?|inr|₹)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
      /([0-9,]+(?:\.[0-9]{1,2})?)\s*(?:rs\.?|inr|₹)/i,
    ];

    let extractedAmount = null;
    for (const pattern of amountPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const cleanAmt = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(cleanAmt) && cleanAmt > 0) {
          extractedAmount = cleanAmt;
          break;
        }
      }
    }

    if (!extractedAmount) {
      return null;
    }

    // 3. Extract 12-Digit UTR / UPI Reference Number / RRN
    const utrPatterns = [
      /(?:utr|rrn|upi ref(?:erence)?(?: no)?|ref no|txn id|transaction id)[:\s#]*([0-9]{12})/i,
      /(?:upi\/|ref:?)\s*([0-9]{12})/i,
      /\b([0-9]{12})\b/, // any standalone 12-digit number
    ];

    let extractedUtr = null;
    for (const pattern of utrPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        extractedUtr = match[1];
        break;
      }
    }

    // If no 12-digit UTR found, try to capture any 8-16 alphanumeric reference ID
    if (!extractedUtr) {
      const fallbackMatch = text.match(/(?:ref|txn|id)[:\s]*([A-Za-z0-9]{8,16})/i);
      if (fallbackMatch && fallbackMatch[1]) {
        extractedUtr = fallbackMatch[1];
      }
    }

    return {
      amount: extractedAmount,
      utr: extractedUtr || `SMS-${Date.now()}`,
      rawText: text,
      timestamp: Date.now(),
    };
  }

  /**
   * Process an incoming SMS received from Dukandar's Phone / App
   */
  processIncomingPaymentSms({ smsText, sender = '' }) {
    console.log(`📱 [PaymentVerifier] Processing SMS from [${sender}]: "${smsText.slice(0, 70)}..."`);
    
    const parsed = this.parseBankSms(smsText);
    if (!parsed) {
      console.log('ℹ️ [PaymentVerifier] SMS does not contain credit/UPI amount.');
      return { success: false, reason: 'NOT_A_CREDIT_SMS' };
    }

    console.log(`💰 [PaymentVerifier] Extracted Credit: ₹${parsed.amount} | UTR: ${parsed.utr}`);

    // Check if this UTR was already used to prevent replay attacks
    if (this.usedUtrs.has(parsed.utr)) {
      console.warn(`🚨 [PaymentVerifier] Replay Attack Blocked: UTR ${parsed.utr} already redeemed!`);
      return { success: false, reason: 'UTR_ALREADY_USED', utr: parsed.utr };
    }

    // Match with pending orders
    let matchedOrderId = null;
    for (const [orderId, order] of this.pendingOrders.entries()) {
      // Amount must match exactly (tolerance of 0.50 for rounding)
      const amountMatches = Math.abs(order.grandTotal - parsed.amount) < 0.5;
      if (amountMatches) {
        matchedOrderId = orderId;
        break;
      }
    }

    if (matchedOrderId) {
      return this.confirmPayment(matchedOrderId, parsed.utr, parsed.amount, 'auto_sms');
    }

    // If no pending order matched yet, cache in recent unmatched payments for 15 mins
    this.recentUnmatchedPayments.push(parsed);
    console.log(`⏳ [PaymentVerifier] No matching order for ₹${parsed.amount} yet. Cached in memory.`);
    return { success: false, reason: 'NO_MATCHING_PENDING_ORDER', parsed };
  }

  /**
   * Manual 12-digit UTR Verification - Disabled
   */
  verifyManualUtr() {
    return {
      success: false,
      reason: 'MANUAL_UTR_DISABLED',
      message: 'Manual UTR entry is disabled. Payments are verified automatically.'
    };
  }

  /**
   * Finalize payment confirmation
   */
  confirmPayment(orderId, utr, amount, verificationType) {
    const pendingOrder = this.pendingOrders.get(orderId);
    if (!pendingOrder) {
      return { success: false, reason: 'ORDER_NOT_FOUND' };
    }

    // Record UTR permanently
    if (utr && utr.length >= 10) {
      this.usedUtrs.add(utr);
      this.saveUsedUtrs();
    }

    // Remove from pending
    this.pendingOrders.delete(orderId);

    const confirmedOrder = {
      ...pendingOrder,
      status: 'new', // sent to kitchen
      paymentStatus: 'paid',
      paymentMethod: 'UPI',
      deliveryOtp: pendingOrder.deliveryOtp || String(Math.floor(1000 + Math.random() * 9000)),
      utr: utr || 'VERIFIED-UPI',
      paidAmount: amount || pendingOrder.grandTotal,
      verificationType,
      paidAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    console.log(`✅ [PaymentVerifier] Order ${orderId} confirmed via ${verificationType}! UTR: ${utr}`);

    return {
      success: true,
      orderId,
      order: confirmedOrder,
      utr,
      amount,
      verificationType,
    };
  }
}

export const paymentVerifier = new PaymentVerifier();
export default paymentVerifier;
