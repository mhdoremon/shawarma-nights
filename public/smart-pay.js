/**
 * ⚡ ChuruOne SmartPay Universal Web SDK v1.0
 * Instant Plug-and-Play UPI Payment Gateway for ANY Website or Brand.
 * 
 * ============================================================================
 * QUICK INTEGRATION IN 5 SECONDS:
 * 
 * 1. Add this script tag to your HTML <head> or <body>:
 *    <script src="https://churuone.in/smart-pay.js"></script>
 * 
 * 2. Call SmartPay.checkout() anywhere in your JavaScript:
 *    SmartPay.checkout({
 *      storeId: 'your-brand-slug',   // e.g. 'shawarma', 'nash-studio', 'my-shop'
 *      amount: 199,                   // Amount in INR
 *      customerPhone: '7023963189',   // 10-digit mobile number
 *      customerName: 'Customer Name',
 *      onSuccess: function(res) {
 *        alert('Payment Verified! Order: ' + res.orderId);
 *      }
 *    });
 * ============================================================================
 */

(function (window) {
  'use strict';

  var host = window.location.hostname;
  var isLocal = host === 'localhost' || host === '127.0.0.1';
  var API_BASE = isLocal
    ? (window.location.port === '5001' ? 'http://localhost:5001' : '')
    : 'https://churuone.in';

  var SmartPay = {
    version: '1.0.0',
    apiBase: API_BASE,

    // Dynamically load official Cashfree JS SDK
    loadCashfreeSdk: function () {
      return new Promise(function (resolve, reject) {
        if (window.Cashfree) {
          return resolve(window.Cashfree);
        }
        var script = document.createElement('script');
        script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
        script.async = true;
        script.onload = function () {
          if (window.Cashfree) {
            resolve(window.Cashfree);
          } else {
            reject(new Error('Cashfree SDK failed to initialize'));
          }
        };
        script.onerror = function () {
          reject(new Error('Could not load Cashfree SDK script from CDN'));
        };
        document.head.appendChild(script);
      });
    },

    /**
     * Trigger 1-Click Payment Checkout
     * 
     * @param {Object} options
     * @param {string} options.storeId - Store / Brand slug (default: 'shawarma')
     * @param {number} options.amount - Order amount in INR (default: 120)
     * @param {string} options.customerPhone - Customer 10-digit phone
     * @param {string} [options.customerName] - Customer name
     * @param {string} [options.orderId] - Custom order identifier
     * @param {string} [options.notes] - Order description
     * @param {string} [options.mode] - 'sandbox' or 'production' (default: 'sandbox')
     * @param {Function} [options.onSuccess] - Callback when payment is verified
     * @param {Function} [options.onError] - Callback on failure
     * @param {Function} [options.onClose] - Callback when modal is closed
     */
    checkout: async function (options) {
      options = options || {};
      var storeId = options.storeId || options.brand || 'shawarma';
      var amount = Number(options.amount) || 120;
      var rawPhone = options.customerPhone || options.phone || '7023963189';
      var phone = String(rawPhone).replace(/\D/g, '').slice(-10) || '7023963189';
      var name = options.customerName || options.name || 'Customer';
      var orderId = options.orderId || (String(storeId).slice(0, 4).toUpperCase() + '_' + Date.now());
      var onSuccess = options.onSuccess || function () {};
      var onError = options.onError || function (err) { alert('Payment Error: ' + (err.message || err)); };
      var onClose = options.onClose || function () {};

      try {
        // 1. Create Order Session via Smart Server API
        var createUrl = (SmartPay.apiBase || '') + '/api/create-order';
        var sessionRes = await fetch(createUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Store-Id': storeId,
          },
          body: JSON.stringify({
            storeId: storeId,
            amount: amount,
            customerPhone: phone,
            customerName: name,
            orderId: orderId,
            notes: options.notes || ('SmartPay payment for ' + storeId),
          }),
        });

        var sessionData = await sessionRes.json();
        if (!sessionData.paymentSessionId) {
          throw new Error(sessionData.error || sessionData.details?.message || 'Cashfree session creation failed');
        }

        // 2. Load SDK & Initialize
        await SmartPay.loadCashfreeSdk();
        var cashfree = window.Cashfree({
          mode: options.mode || 'sandbox',
        });

        // 3. Open Cashfree Popup Checkout Modal
        await cashfree.checkout({
          paymentSessionId: sessionData.paymentSessionId,
          redirectTarget: '_modal',
        });

        // 4. Verify Payment Status with Smart Server
        var verifyUrl = (SmartPay.apiBase || '') + '/api/payment/cashfree/verify/' + encodeURIComponent(orderId) + '?storeId=' + encodeURIComponent(storeId);
        var verifyRes = await fetch(verifyUrl);
        var verifyData = await verifyRes.json();

        if (verifyData.isPaid || verifyData.status === 'PAID') {
          var successPayload = {
            success: true,
            isPaid: true,
            orderId: orderId,
            amount: amount,
            storeId: storeId,
            utr: verifyData.order?.cashfreePayment?.bankUtr || verifyData.cashfreeOrder?.payment_details?.bank_reference || 'VERIFIED',
            data: verifyData,
          };
          onSuccess(successPayload);
          return successPayload;
        } else {
          if (onClose) onClose();
          return { success: false, isPaid: false, orderId: orderId, status: verifyData.status };
        }
      } catch (err) {
        console.error('SmartPay Execution Error:', err);
        onError(err);
        throw err;
      }
    },

    // Verify an existing order
    verify: async function (orderId, storeId) {
      storeId = storeId || 'shawarma';
      var url = (SmartPay.apiBase || '') + '/api/payment/cashfree/verify/' + encodeURIComponent(orderId) + '?storeId=' + encodeURIComponent(storeId);
      var res = await fetch(url);
      return await res.json();
    },
  };

  window.SmartPay = SmartPay;
})(typeof window !== 'undefined' ? window : this);
