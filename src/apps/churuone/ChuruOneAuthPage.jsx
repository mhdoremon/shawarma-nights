import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { ArrowLeft, CheckCircle2, ShieldCheck, User, AlertCircle, Phone, ArrowRight } from 'lucide-react';
import { firebaseConfig } from '../nash/firebase';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

const STORE_NAMES = {
  'nash-studio': 'Nash Studio',
  'nash': 'Nash Studio',
  'shawarma': 'Shawarma Nights',
  'shawarma-nights': 'Shawarma Nights'
};

export default function ChuruOneAuthPage() {
  const [searchParams] = useState(() => new URLSearchParams(window.location.search));
  // DO NOT default to 'nash-studio'. If no storeId is provided, this is directly ChuruOne's account portal!
  const storeId = (searchParams.get('storeId') || searchParams.get('store') || '').toLowerCase().trim();
  const rawReturnUrl = searchParams.get('returnUrl') || searchParams.get('redirect') || '';

  const isStoreContext = Boolean(storeId);
  const storeDisplayName = STORE_NAMES[storeId] || (storeId ? 'Partner Store' : '');
  const isShawarma = storeId.includes('shawarma') || storeId === 'shawarma-nights';

  // Calculate destination URL
  function getDestinationUrl() {
    if (rawReturnUrl) return rawReturnUrl;
    if (storeId.includes('nash')) {
      return window.location.hostname.includes('localhost') ? '/nash' : 'https://nash.churuone.in';
    }
    if (storeId.includes('shawarma')) {
      return window.location.hostname.includes('localhost') ? '/' : 'https://shawarma.churuone.in';
    }
    return '/'; // Default to ChuruOne homepage
  }

  const destination = getDestinationUrl();

  // Store Phone OTP Policy (Default: Shawarma/food requires phone OTP, general ChuruOne / salon does not)
  const [storePolicyRequireOtp, setStorePolicyRequireOtp] = useState(() => {
    const param = searchParams.get('requirePhoneOtp');
    if (param === '1' || param === 'true') return true;
    if (param === '0' || param === 'false') return false;
    return isShawarma;
  });

  // Background store config check (only if storeId is provided)
  useEffect(() => {
    if (!storeId) return;
    fetch(`/api/store-info?storeId=${storeId}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.settings && typeof data.settings.requirePhoneOtp === 'boolean') {
          if (!searchParams.get('requirePhoneOtp')) {
            setStorePolicyRequireOtp(data.settings.requirePhoneOtp);
          }
        }
      })
      .catch(() => {});
  }, [storeId]);

  // Auth State
  const [step, setStep] = useState(1); // 1: Google login, 2: Profile & Phone, 3: Real SMS OTP Verify
  const [googleUser, setGoogleUser] = useState(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Real SMS OTP States
  const [otpInput, setOtpInput] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [devOtp, setDevOtp] = useState(null);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown(c => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Auto-finish if already logged in via ChuruOne session
  useEffect(() => {
    try {
      const existingRaw = localStorage.getItem('churuone_user') || localStorage.getItem('nash_user');
      if (existingRaw) {
        const parsed = JSON.parse(existingRaw);
        if (parsed && (parsed.phoneNumber || parsed.phone) && searchParams.get('auto') === '1') {
          if (!storePolicyRequireOtp || parsed.phoneVerified) {
            completeAndRedirect(parsed, localStorage.getItem('auth_token') || '');
          }
        }
      }
    } catch (e) {}
  }, []);

  async function handleGoogleSignIn() {
    setLoading(true);
    setErrorMsg('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const gEmail = user.email || '';
      const gName = user.displayName || gEmail.split('@')[0] || 'User';
      const gPic = user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(gName)}`;

      setGoogleUser({
        uid: user.uid,
        email: gEmail,
        displayName: gName,
        photoURL: gPic
      });
      setFullName(gName);
      setEmail(gEmail);

      // Check if user already exists on ChuruOne Smart Server with a verified phone number
      try {
        const queryParam = storeId ? `?storeId=${storeId}` : '';
        const checkRes = await fetch(`/api/auth/google${queryParam}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            googleId: user.uid,
            email: gEmail,
            name: gName,
            picture: gPic,
            storeId: storeId || 'churuone'
          })
        });

        const checkData = await checkRes.json();
        if (checkData.success && checkData.user) {
          const sUser = checkData.user;
          const userPhone = sUser.phone || sUser.phoneNumber;

          if (userPhone && (!storePolicyRequireOtp || sUser.phoneVerified)) {
            const verifiedPayload = {
              ...sUser,
              displayName: sUser.name || gName,
              photoURL: sUser.picture || gPic,
              authProvider: 'google',
              phone: userPhone,
              phoneNumber: userPhone
            };
            setSuccessMsg("Account verified! Redirecting...");
            setTimeout(() => {
              completeAndRedirect(verifiedPayload, checkData.token || '');
            }, 600);
            return;
          }

          if (userPhone) {
            setPhone(userPhone);
          }
        }
      } catch (err) {
        console.warn("Backend pre-check skipped, moving to profile step:", err);
      }

      setStep(2);
    } catch (err) {
      console.error("ChuruOne Google Sign-In Error:", err);
      if (err.code === "auth/popup-closed-by-user") {
        setErrorMsg("Google login popup was closed.");
      } else if (err.code === "auth/popup-blocked") {
        setErrorMsg("Browser blocked the Google popup. Please allow popups for churuone.in.");
      } else {
        setErrorMsg(err.message || "Google sign-in error occurred.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleProfileSubmit(e) {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      setErrorMsg("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!fullName.trim()) {
      setErrorMsg("Please enter your full name.");
      return;
    }

    if (!storePolicyRequireOtp) {
      // General ChuruOne Account or Salon: does not require SMS OTP
      setLoading(true);
      setErrorMsg('');
      try {
        await finalizeServerSession({
          googleId: googleUser?.uid || `churu_${Date.now()}`,
          email: email || googleUser?.email || '',
          name: fullName.trim(),
          picture: googleUser?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName.trim())}`,
          phone: cleanPhone,
          phoneVerified: false,
          storeId: storeId || 'churuone'
        });
      } catch (err) {
        setErrorMsg(err.message || "Failed to save profile.");
        setLoading(false);
      }
      return;
    }

    // Food delivery (Shawarma Nights): requires SMS OTP verification via Dukandar App Gateway
    await requestPhoneOtp(cleanPhone);
  }

  async function requestPhoneOtp(targetPhone) {
    setIsSendingOtp(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: targetPhone, storeId: storeId || 'shawarma' })
      });
      const data = await res.json();
      if (!data.success) {
        setErrorMsg(data.message || 'OTP dispatch failed. Please try again.');
        setIsSendingOtp(false);
        return;
      }

      setCooldown(30);
      if (data.devOtp) setDevOtp(data.devOtp);
      setStep(3);
      setSuccessMsg(`SMS OTP sent to +91 ${targetPhone}`);
    } catch (err) {
      setErrorMsg(err.message || 'Could not connect to server.');
    } finally {
      setIsSendingOtp(false);
    }
  }

  async function handleVerifyOtpSubmit(e) {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const cleanOtp = otpInput.trim();
    if (cleanOtp.length < 4) {
      setErrorMsg("Please enter the complete verification code.");
      return;
    }

    setIsVerifyingOtp(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, otp: cleanOtp, storeId: storeId || 'shawarma' })
      });
      const data = await res.json();
      if (!data.success) {
        setErrorMsg(data.message || 'Invalid OTP code. Please try again.');
        setIsVerifyingOtp(false);
        return;
      }

      await finalizeServerSession({
        googleId: googleUser?.uid || `churu_${Date.now()}`,
        email: email || googleUser?.email || '',
        name: fullName.trim(),
        picture: googleUser?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName.trim())}`,
        phone: cleanPhone,
        phoneVerified: true,
        storeId: storeId || 'shawarma'
      });
    } catch (err) {
      setErrorMsg(err.message || 'Verification failed. Please try again.');
      setIsVerifyingOtp(false);
    }
  }

  async function finalizeServerSession(payload) {
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.message || 'Server authentication failed');
    }

    const verifiedUser = {
      ...data.user,
      phoneNumber: payload.phone,
      phone: payload.phone,
      displayName: payload.name,
      name: payload.name,
      email: payload.email,
      photoURL: payload.picture,
      picture: payload.picture,
      authProvider: 'google',
      phoneVerified: Boolean(payload.phoneVerified)
    };

    localStorage.setItem('churuone_user', JSON.stringify(verifiedUser));
    localStorage.setItem('nash_user', JSON.stringify(verifiedUser));
    localStorage.setItem('sn_session', JSON.stringify(verifiedUser));
    localStorage.setItem('sn_current_user', JSON.stringify(verifiedUser));
    if (data.token) localStorage.setItem('auth_token', data.token);

    const redirectTarget = isStoreContext ? storeDisplayName : 'ChuruOne';
    setSuccessMsg(`Welcome, ${payload.name}! Redirecting to ${redirectTarget}...`);
    setTimeout(() => {
      completeAndRedirect(verifiedUser, data.token || '');
    }, 600);
  }

  function completeAndRedirect(userObj, token) {
    // If inside popup window, message opener
    if (window.opener && !window.opener.closed) {
      try {
        window.opener.postMessage({
          type: 'CHURUONE_AUTH_SUCCESS',
          token,
          user: userObj
        }, '*');
        window.close();
        return;
      } catch (e) {}
    }

    if (rawReturnUrl) {
      const url = new URL(rawReturnUrl, window.location.origin);
      url.searchParams.set('churuone_token', token);
      url.searchParams.set('churuone_user', encodeURIComponent(JSON.stringify(userObj)));
      window.location.href = url.toString();
      return;
    }

    if (isStoreContext) {
      const redirectUrl = new URL(destination, window.location.origin);
      redirectUrl.searchParams.set('churuone_token', token);
      redirectUrl.searchParams.set('churuone_user', encodeURIComponent(JSON.stringify(userObj)));
      window.location.href = redirectUrl.toString();
      return;
    }

    // Direct ChuruOne Registration -> redirect to ChuruOne home
    window.location.href = `/?account_created=1&churuone_user=${encodeURIComponent(JSON.stringify(userObj))}`;
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans antialiased flex flex-col justify-between p-4 sm:p-6 selection:bg-zinc-950 selection:text-white">
      
      {/* Top Header / Back Link */}
      <div className="max-w-md w-full mx-auto pt-6 sm:pt-10">
        <a
          href={isStoreContext ? destination : '/'}
          className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-zinc-400 hover:text-zinc-950 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 stroke-[1.5]" />
          <span>{isStoreContext ? `Back to ${storeDisplayName}` : 'Back to ChuruOne'}</span>
        </a>
      </div>

      {/* Main Luxury Minimalist Card */}
      <div className="max-w-md w-full mx-auto my-8 border border-zinc-200 bg-white p-8 sm:p-10 shadow-sm">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-block text-[9px] font-semibold tracking-[0.25em] uppercase text-zinc-400 mb-2">
            {isStoreContext ? 'CHURUONE SINGLE SIGN-ON' : 'CHURUONE UNIFIED ID'}
          </div>

          <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-zinc-950">
            {isStoreContext ? `Sign In to ${storeDisplayName}` : 'Create your ChuruOne account'}
          </h1>

          <p className="text-xs text-zinc-500 mt-2 leading-relaxed max-w-xs mx-auto">
            {isStoreContext 
              ? `Authenticating securely for ${storeDisplayName}.`
              : 'One verified account across all ChuruOne stores and services.'}
          </p>
        </div>

        {/* Error / Success Notifications */}
        {errorMsg && (
          <div className="mb-6 p-3.5 border border-red-200 bg-red-50 text-red-700 text-xs font-medium flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 stroke-[1.5]" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-3.5 border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-medium flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 stroke-[1.5]" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* STEP 1: GOOGLE AUTHENTICATION */}
        {step === 1 && (
          <div>
            {isShawarma && (
              <div className="mb-6 p-3.5 border border-zinc-200 bg-zinc-50 text-zinc-700 text-xs leading-relaxed">
                <span className="font-semibold text-zinc-950 block mb-0.5">Mobile Verification Required</span>
                Shawarma Nights food delivery requires a verified 10-digit mobile number for dispatch.
              </div>
            )}

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-white hover:bg-zinc-50 border border-zinc-300 hover:border-zinc-950 text-zinc-900 py-3.5 px-4 text-xs uppercase tracking-widest font-medium flex items-center justify-center gap-3 transition-colors cursor-pointer disabled:opacity-50"
            >
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span>{loading ? "Authenticating..." : "Continue with Google"}</span>
            </button>

            <div className="mt-8 pt-6 border-t border-zinc-100 flex items-center justify-center gap-2 text-[11px] text-zinc-400">
              <ShieldCheck className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>Zero-Password Secure Protocol</span>
            </div>
          </div>
        )}

        {/* STEP 2: PROFILE & MOBILE NUMBER */}
        {step === 2 && (
          <form onSubmit={handleProfileSubmit} className="space-y-5">
            {/* User Verified Card */}
            <div className="p-3.5 border border-zinc-200 bg-zinc-50 flex items-center gap-3">
              <img
                src={googleUser?.photoURL}
                alt=""
                className="w-9 h-9 rounded-full object-cover border border-zinc-200"
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-zinc-950 truncate">
                  {googleUser?.displayName}
                </div>
                <div className="text-[11px] text-zinc-500 truncate">
                  {googleUser?.email}
                </div>
              </div>
              <span className="text-[9px] uppercase tracking-wider font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5">
                Verified
              </span>
            </div>

            {/* Name Input */}
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-semibold text-zinc-500 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Your full name"
                className="w-full border border-zinc-200 focus:border-zinc-950 px-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 outline-none transition-colors"
              />
            </div>

            {/* Phone Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] uppercase tracking-widest font-semibold text-zinc-500">
                  Mobile Number {storePolicyRequireOtp ? '(OTP Required)' : '(Mandatory)'}
                </label>
                <span className="text-[10px] text-zinc-400">10 Digits</span>
              </div>
              <div className="flex">
                <span className="inline-flex items-center px-3 border border-r-0 border-zinc-200 bg-zinc-50 text-xs text-zinc-500 font-medium">
                  +91
                </span>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="9876543210"
                  className="w-full border border-zinc-200 focus:border-zinc-950 px-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || isSendingOtp}
              className="w-full bg-zinc-950 hover:bg-black text-white py-3.5 px-4 text-xs uppercase tracking-widest font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 mt-2"
            >
              <span>
                {loading || isSendingOtp 
                  ? "Saving Profile..." 
                  : storePolicyRequireOtp 
                  ? "Send SMS Verification Code →" 
                  : "Complete & Continue →"}
              </span>
            </button>
          </form>
        )}

        {/* STEP 3: SMS OTP VERIFICATION (Only when required) */}
        {step === 3 && (
          <form onSubmit={handleVerifyOtpSubmit} className="space-y-5">
            <div className="text-center">
              <span className="text-xs text-zinc-500">
                Verification code dispatched to: <strong className="text-zinc-950">+91 {phone}</strong>
              </span>
            </div>

            {devOtp && (
              <div className="p-2.5 border border-dashed border-zinc-300 text-center text-xs font-mono text-zinc-600">
                DEV OTP: <strong>{devOtp}</strong>
              </div>
            )}

            <div>
              <input
                type="text"
                required
                maxLength={6}
                value={otpInput}
                onChange={e => setOtpInput(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 6-digit code"
                className="w-full border border-zinc-200 focus:border-zinc-950 text-center tracking-[0.3em] font-mono text-lg py-3 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isVerifyingOtp}
              className="w-full bg-zinc-950 hover:bg-black text-white py-3.5 px-4 text-xs uppercase tracking-widest font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              <span>{isVerifyingOtp ? "Verifying..." : "Verify & Finish"}</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[1.5]" />
            </button>

            <div className="text-center pt-2">
              {cooldown > 0 ? (
                <span className="text-[11px] text-zinc-400">Resend code in {cooldown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={() => requestPhoneOtp(phone)}
                  className="text-xs uppercase tracking-wider font-semibold text-zinc-900 hover:text-black border-b border-zinc-900 pb-0.5 cursor-pointer"
                >
                  Resend Verification Code
                </button>
              )}
            </div>
          </form>
        )}

      </div>

      {/* Footer */}
      <div className="max-w-md w-full mx-auto text-center pb-6 text-[11px] text-zinc-400">
        © 2026 ChuruOne. All rights reserved.
      </div>

    </div>
  );
}
