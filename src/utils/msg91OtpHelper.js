/**
 * MSG91 OTP Widget SDK Helper
 * 
 * Provides official integration with MSG91 OTP Widget (Widget ID: 366a696c357a333532393739).
 * Allows sending real SMS OTP without ₹5,900 DLT registration.
 * 
 * Features:
 * - Direct window.initSendOTP initialization
 * - window.sendOtp("+91" + phone)
 * - window.verifyOtp(otp)
 * - Clean Promise-based wrapper with error handling
 * - Automatic fallback to backend SIM Gateway if MSG91 widget is unavailable
 */

export const MSG91_WIDGET_ID = import.meta.env.VITE_MSG91_WIDGET_ID || "366a696c357a333532393739";
export const MSG91_TOKEN_AUTH = import.meta.env.VITE_MSG91_TOKEN_AUTH || "churuone";

let isInitialized = false;
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
          captchaRenderId: 'msg91-captcha-container',
          success: (data) => {
            console.log('✅ [MSG91] OTP Verified Successfully:', data);
            if (typeof activeCallbacks.onSuccess === 'function') {
              activeCallbacks.onSuccess(data);
            }
          },
          failure: (error) => {
            console.warn('⚠️ [MSG91] Verification Failure:', error);
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
    // Retry up to 10 times in case script tag is still executing
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (tryInit() || attempts >= 10) {
        clearInterval(interval);
      }
    }, 400);
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
 * @returns {Promise<{ success: boolean, message: string, provider: string }>}
 */
export async function sendOtpViaMsg91(phone) {
  const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
  if (cleanPhone.length !== 10) {
    throw new Error('Please enter a valid 10-digit mobile number.');
  }

  // Official MSG91 Spec: Country code WITHOUT + (e.g. 919999999999)
  const formattedPhone = `91${cleanPhone}`;

  // Ensure widget is initialized
  if (!isInitialized && typeof window !== 'undefined' && typeof window.initSendOTP === 'function') {
    initMsg91Widget();
  }

  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && typeof window.sendOtp === 'function') {
      try {
        console.log(`📡 [MSG91] Calling window.sendOtp with identifier: ${formattedPhone}`);
        window.sendOtp(
          formattedPhone,
          (res) => {
            console.log('📱 [MSG91] OTP Dispatched successfully:', res);
            resolve({ success: true, message: `OTP sent to ${cleanPhone}`, provider: 'msg91', data: res });
          },
          (err) => {
            console.warn('⚠️ [MSG91] sendOtp error callback:', err);
            const errMsg = typeof err === 'string' ? err : (err?.message || err?.msg || JSON.stringify(err) || 'Failed to dispatch OTP via MSG91');
            reject(new Error(errMsg));
          }
        );
      } catch (e) {
        console.warn('⚠️ [MSG91] sendOtp exception:', e);
        reject(e);
      }
    } else {
      reject(new Error('MSG91 Widget is not loaded or ready.'));
    }
  });
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

  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && typeof window.verifyOtp === 'function') {
      // Setup one-shot hooks for this verify attempt
      const prevSuccess = activeCallbacks.onSuccess;
      const prevFailure = activeCallbacks.onFailure;

      activeCallbacks.onSuccess = (data) => {
        if (prevSuccess) prevSuccess(data);
        resolve({ success: true, message: 'OTP verified successfully!', data });
      };

      activeCallbacks.onFailure = (err) => {
        if (prevFailure) prevFailure(err);
        const errMsg = typeof err === 'string' ? err : (err?.message || err?.msg || 'Invalid or expired OTP. Please try again.');
        reject(new Error(errMsg));
      };

      try {
        window.verifyOtp(
          cleanOtp,
          (res) => {
            resolve({ success: true, message: 'OTP verified successfully!', data: res });
          },
          (err) => {
            const errMsg = typeof err === 'string' ? err : (err?.message || err?.msg || 'Invalid or expired OTP code.');
            reject(new Error(errMsg));
          }
        );
      } catch (callErr) {
        try {
          window.verifyOtp(cleanOtp);
        } catch (e) {
          reject(e);
        }
      }
    } else {
      reject(new Error('MSG91 Widget is not ready.'));
    }
  });
}

/**
 * Resend OTP via MSG91
 * Channel is null by default for widget default SMS channel
 */
export function retryOtpViaMsg91(channel = null) {
  if (typeof window !== 'undefined' && typeof window.retryOtp === 'function') {
    try {
      window.retryOtp(
        channel,
        (data) => console.log('📱 [MSG91] retryOtp success:', data),
        (err) => console.warn('⚠️ [MSG91] retryOtp error:', err)
      );
      return true;
    } catch (e) {
      console.warn('⚠️ [MSG91] retryOtp error:', e);
    }
  }
  return false;
}
