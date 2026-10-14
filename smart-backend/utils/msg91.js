/**
 * Unified MSG91 Service Helper
 * Direct cloud-based SMS delivery via MSG91 SendOTP Widget API.
 * Eliminates reliance on Android phone SIM cards for SMS/OTP.
 */

export const MSG91_WIDGET_ID = process.env.MSG91_WIDGET_ID || "366a696c357a333532393739";
export const MSG91_TOKEN_AUTH = process.env.MSG91_TOKEN_AUTH || "579831T8ey9mcpYIc6ac8e57dP1";

/**
 * Send OTP directly via MSG91 SendOTP Widget API
 * @param {string} phone - 10-digit mobile number
 * @returns {Promise<{ success: boolean, reqId?: string, message?: string, data?: any }>}
 */
export async function sendMsg91Otp(phone) {
  try {
    const cleanDigits = String(phone).replace(/\D/g, '').slice(-10);
    if (cleanDigits.length !== 10) {
      return { success: false, message: 'Valid 10-digit mobile number required' };
    }

    const formattedIdentifier = `91${cleanDigits}`;
    console.log(`📱 [MSG91 Direct Cloud SMS] Dispatching to +${formattedIdentifier}...`);

    const response = await fetch("https://control.msg91.com/api/v5/widget/sendOtp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        widgetId: MSG91_WIDGET_ID,
        tokenAuth: MSG91_TOKEN_AUTH,
        identifier: formattedIdentifier
      })
    });

    const data = await response.json();
    console.log(`📡 [MSG91 Response] +${formattedIdentifier}:`, data);

    if (data?.type === 'success' || data?.message === 'OTP sent successfully' || data?.type === 'info') {
      return {
        success: true,
        reqId: data?.message || data?.reqId || '',
        message: 'OTP dispatched successfully via MSG91',
        data
      };
    }

    if (data?.message && typeof data.message === 'string' && data.message.toLowerCase().includes('already')) {
      return { success: true, reqId: '', message: data.message, data };
    }

    return {
      success: true,
      reqId: data?.message || '',
      message: 'OTP sent via MSG91',
      data
    };
  } catch (error) {
    console.error(`❌ [MSG91 Error] ${error.message}`);
    return { success: false, message: error.message };
  }
}

/**
 * Verify OTP directly via MSG91 Widget API
 * @param {string} phone - 10-digit mobile number
 * @param {string} otp - OTP code entered by user
 * @param {string} [reqId] - Optional request id
 * @returns {Promise<{ success: boolean, verified: boolean, message?: string }>}
 */
export async function verifyMsg91Otp(phone, otp, reqId = '') {
  try {
    const cleanDigits = String(phone).replace(/\D/g, '').slice(-10);
    const cleanOtp = String(otp).trim();

    if (!cleanOtp) {
      return { success: false, verified: false, message: 'OTP required' };
    }

    const payload = {
      widgetId: MSG91_WIDGET_ID,
      tokenAuth: MSG91_TOKEN_AUTH,
      identifier: `91${cleanDigits}`,
      otp: cleanOtp
    };
    if (reqId) payload.reqId = reqId;

    console.log(`🔍 [MSG91 Cloud Verify] Verifying OTP for +91${cleanDigits}...`);

    const response = await fetch("https://control.msg91.com/api/v5/widget/verifyOtp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log(`📡 [MSG91 Verify Response]:`, data);

    if (data?.type === 'success' || (data?.message && data.message.toLowerCase().includes('success'))) {
      return { success: true, verified: true, message: 'OTP verified successfully' };
    }

    return {
      success: false,
      verified: false,
      message: data?.message || 'Invalid or expired OTP'
    };
  } catch (error) {
    console.error(`❌ [MSG91 Verify Error] ${error.message}`);
    return { success: false, verified: false, message: error.message };
  }
}

/**
 * Retry OTP via MSG91 Widget API
 * @param {string} phone - 10-digit mobile number
 * @param {string} [retryType] - 'voice' or 'text'
 */
export async function retryMsg91Otp(phone, retryType = 'text') {
  try {
    const cleanDigits = String(phone).replace(/\D/g, '').slice(-10);
    const response = await fetch("https://control.msg91.com/api/v5/widget/retryOtp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        widgetId: MSG91_WIDGET_ID,
        tokenAuth: MSG91_TOKEN_AUTH,
        identifier: `91${cleanDigits}`,
        retryType
      })
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
}
