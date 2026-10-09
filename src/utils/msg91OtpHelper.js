/**
 * MSG91 OTP Widget SDK Helper
 * 
 * Official integration with MSG91 OTP Widget (Widget ID: 366a696c357a333532393739).
 * Allows sending real SMS OTP using ₹50 testing wallet without ₹5,900 DLT registration.
 * 
 * Features:
 * - Direct window.initSendOTP initialization
 * - window.sendOtp("91" + phone) with 3s async readiness wait
 * - Direct HTTP API fallback to https://control.msg91.com/api/v5/widget/sendOtp if SDK blocked
 * - window.verifyOtp(otp) with direct API fallback
 * - Automatic fallback to backend SIM Gateway if MSG91 is unreachable
 */

export const MSG91_WIDGET_ID = import.meta.env.VITE_MSG91_WIDGET_ID || "366a696c357a333532393739";
export const MSG91_TOKEN_AUTH = import.meta.env.VITE_MSG91_TOKEN_AUTH || "579831T8ey9mcpYIc6ac8e57dP1";

let isInitialized = false;
let lastReqId = '';
let lastIdentifier = '';

// Restore last session reqId if available
try {
  lastReqId = localStorage.getItem('msg91_last_req_id') || '';
  lastIdentifier = localStorage.getItem('msg91_last_identifier') || '';
} catch (e) {}

let activeCallbacks = {
  onSuccess: null,
  onFailure: null,
};

/**
 * Initialize MSG91 SendOTP Widget
 * @param {Object} callbacks - { onSuccess: (data) => void, onFailure: (err) => void }
 */
export function initMsg91Widget({ onSuccess, onFailure } = {}) {
  activeCallbacks.onSuccess = onSuccess || null;
  activeCallbacks.onFailure = onFailure || null;

  if (typeof window === 'undefined') return;

  const tryInit = () => {
    if (typeof window.initSendOTP === 'function') {
      try {
        const configuration = {
          widgetId: MSG91_WIDGET_ID,
          tokenAuth: MSG91_TOKEN_AUTH,
          exposeMethods: true,
          captchaRenderId: '',
          success: (data) => {
            console.log('✅ [MSG91] Global Success:', data);
            if (data?.reqId) lastReqId = data.reqId;
            if (typeof activeCallbacks.onSuccess === 'function') {
              activeCallbacks.onSuccess(data);
            }
          },
          failure: (error) => {
            console.warn('⚠️ [MSG91] Global Failure:', error);
            if (typeof activeCallbacks.onFailure === 'function') {
              activeCallbacks.onFailure(error);
            }
          }
        };

        window.configuration = configuration;
        window.initSendOTP(configuration);
        isInitialized = true;
        console.log('🚀 [MSG91] Widget Initialized with ID:', MSG91_WIDGET_ID);
        return true;
      } catch (err) {
        console.warn('⚠️ [MSG91] initSendOTP exception:', err);
        return false;
      }
    }
    return false;
  };

  if (!tryInit()) {
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (tryInit() || attempts >= 10) {
        clearInterval(interval);
      }
    }, 300);
  }
}

/**
 * Check if MSG91 Widget methods are ready
 */
export function isMsg91Ready() {
  return typeof window !== 'undefined' && typeof window.sendOtp === 'function';
}

/**
 * Send OTP via MSG91
 * @param {string} phone - 10-digit mobile number
 * @returns {Promise<{ success: boolean, message: string, provider: string, reqId?: string }>}
 */
export async function sendOtpViaMsg91(phone) {
  const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
  if (cleanPhone.length !== 10) {
    throw new Error('Please enter a valid 10-digit mobile number.');
  }

  // Official MSG91 Spec: Country code WITHOUT + (e.g. 919999999999)
  const formattedPhone = `91${cleanPhone}`;
  lastIdentifier = formattedPhone;
  try { localStorage.setItem('msg91_last_identifier', formattedPhone); } catch (e) {}

  // Ensure widget is initialized
  if (!isInitialized && typeof window !== 'undefined' && typeof window.initSendOTP === 'function') {
    initMsg91Widget();
  }

  // Wait up to 3 seconds if widget script is still loading
  if (typeof window !== 'undefined' && typeof window.sendOtp !== 'function') {
    let waitAttempts = 0;
    while (typeof window.sendOtp !== 'function' && waitAttempts < 15) {
      await new Promise(r => setTimeout(r, 200));
      waitAttempts++;
    }
  }

  // METHOD A: Try Official Web SDK
  if (typeof window !== 'undefined' && typeof window.sendOtp === 'function') {
    try {
      console.log(`📡 [MSG91 SDK] Calling window.sendOtp with identifier: ${formattedPhone}`);
      const sdkResult = await new Promise((resolve, reject) => {
        window.sendOtp(
          formattedPhone,
          (res) => {
            console.log('📱 [MSG91 SDK] OTP Dispatched successfully:', res);
            const reqId = res?.message || res?.reqId || '';
            if (reqId) {
              lastReqId = reqId;
              try { localStorage.setItem('msg91_last_req_id', reqId); } catch (e) {}
            }
            resolve({ success: true, message: `OTP sent to ${cleanPhone}`, provider: 'msg91', reqId, data: res });
          },
          (err) => {
            console.warn('⚠️ [MSG91 SDK] sendOtp error callback:', err);
            reject(err);
          }
        );
      });
      return sdkResult;
    } catch (sdkErr) {
      console.warn('⚠️ [MSG91 SDK] SDK sendOtp failed, attempting Direct API Fallback:', sdkErr);
    }
  }

  // METHOD B: Direct REST Fallback (Direct to MSG91 Widget API)
  try {
    console.log(`📡 [MSG91 Direct API] POST https://control.msg91.com/api/v5/widget/sendOtp`);
    const response = await fetch("https://control.msg91.com/api/v5/widget/sendOtp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        widgetId: MSG91_WIDGET_ID,
        tokenAuth: MSG91_TOKEN_AUTH,
        identifier: formattedPhone
      })
    });

    const data = await response.json();
    if (data && data.type === 'success') {
      const reqId = data.message || '';
      if (reqId) {
        lastReqId = reqId;
        try { localStorage.setItem('msg91_last_req_id', reqId); } catch (e) {}
      }
      console.log(`📱 [MSG91 Direct API] OTP Dispatched successfully, reqId: ${reqId}`);
      return {
        success: true,
        message: `OTP sent to ${cleanPhone}`,
        provider: 'msg91',
        reqId,
        data
      };
    } else {
      const errMsg = data?.message || data?.errors?.[0] || 'Failed to dispatch OTP';
      throw new Error(errMsg);
    }
  } catch (apiErr) {
    console.error('❌ [MSG91] Both SDK and Direct API failed:', apiErr);
    throw apiErr;
  }
}

/**
 * Verify OTP via MSG91
 * @param {string} otp - 4 to 6 digit verification code
 * @returns {Promise<{ success: boolean, message: string, data?: any }>}
 */
export async function verifyOtpViaMsg91(otp) {
  const cleanOtp = String(otp).trim();
  if (!cleanOtp) {
    throw new Error('Please enter the OTP code.');
  }

  // Wait briefly if verifyOtp is still bootstrapping
  if (typeof window !== 'undefined' && typeof window.verifyOtp !== 'function') {
    let waitAttempts = 0;
    while (typeof window.verifyOtp !== 'function' && waitAttempts < 10) {
      await new Promise(r => setTimeout(r, 200));
      waitAttempts++;
    }
  }

  // METHOD A: Try Official Web SDK
  if (typeof window !== 'undefined' && typeof window.verifyOtp === 'function') {
    try {
      const sdkVerify = await new Promise((resolve, reject) => {
        window.verifyOtp(
          cleanOtp,
          (res) => {
            console.log('✅ [MSG91 SDK] OTP verified callback:', res);
            resolve({ success: true, message: 'OTP verified successfully!', data: res });
          },
          (err) => {
            console.warn('⚠️ [MSG91 SDK] verifyOtp error callback:', err);
            const errMsg = typeof err === 'string' ? err : (err?.message || err?.msg || 'Invalid or expired OTP code.');
            reject(new Error(errMsg));
          },
          lastReqId || null
        );
      });
      return sdkVerify;
    } catch (sdkErr) {
      console.warn('⚠️ [MSG91 SDK] verifyOtp failed, checking Direct API Fallback:', sdkErr.message);
    }
  }

  // METHOD B: Direct REST Fallback
  try {
    const payload = {
      widgetId: MSG91_WIDGET_ID,
      tokenAuth: MSG91_TOKEN_AUTH,
      otp: cleanOtp
    };
    if (lastReqId) payload.reqId = lastReqId;
    if (lastIdentifier) payload.identifier = lastIdentifier;

    console.log(`📡 [MSG91 Direct API] POST https://control.msg91.com/api/v5/widget/verifyOtp`);
    const response = await fetch("https://control.msg91.com/api/v5/widget/verifyOtp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (data && data.type === 'success') {
      console.log('✅ [MSG91 Direct API] OTP verified successfully:', data);
      return { success: true, message: 'OTP verified successfully!', data };
    } else {
      const errMsg = data?.message || (data?.errors && data.errors[0]) || 'Invalid or expired OTP code.';
      throw new Error(errMsg);
    }
  } catch (apiErr) {
    console.error('❌ [MSG91] Verification failed:', apiErr);
    throw apiErr;
  }
}

/**
 * Resend OTP via MSG91
 * Channel is null by default for widget default SMS channel
 */
export async function retryOtpViaMsg91(channel = null) {
  if (typeof window !== 'undefined' && typeof window.retryOtp === 'function') {
    try {
      window.retryOtp(
        channel,
        (data) => console.log('📱 [MSG91 SDK] retryOtp success:', data),
        (err) => console.warn('⚠️ [MSG91 SDK] retryOtp error:', err),
        lastReqId || null
      );
      return true;
    } catch (e) {
      console.warn('⚠️ [MSG91 SDK] retryOtp exception:', e);
    }
  }

  // Direct API fallback
  try {
    const res = await fetch("https://control.msg91.com/api/v5/widget/retryOtp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        widgetId: MSG91_WIDGET_ID,
        tokenAuth: MSG91_TOKEN_AUTH,
        reqId: lastReqId,
        retryChannel: channel
      })
    });
    const data = await res.json();
    return data && data.type === 'success';
  } catch (err) {
    return false;
  }
}
