import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { ArrowLeft, CheckCircle2, ShieldCheck, Sparkles, Smartphone, Mail, User, AlertCircle, KeyRound, RefreshCw, Lock } from 'lucide-react';
import { firebaseConfig } from '../nash/firebase';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

const STORE_NAMES = {
  'nash-studio': 'Nash Studio (Salon & Grooming)',
  'nash': 'Nash Studio (Salon & Grooming)',
  'shawarma': 'Shawarma Nights (Food & Dining)',
  'shawarma-nights': 'Shawarma Nights (Food & Dining)'
};

export default function ChuruOneAuthPage() {
  const [searchParams] = useState(() => new URLSearchParams(window.location.search));
  const storeId = (searchParams.get('storeId') || searchParams.get('store') || 'nash-studio').toLowerCase().trim();
  const rawReturnUrl = searchParams.get('returnUrl') || searchParams.get('redirect') || '';

  // Calculate destination URL
  function getDestinationUrl() {
    if (rawReturnUrl) return rawReturnUrl;
    if (storeId.includes('nash')) {
      return window.location.hostname.includes('localhost') ? '/nash' : 'https://nash.churuone.in';
    }
    if (storeId.includes('shawarma')) {
      return window.location.hostname.includes('localhost') ? '/' : 'https://shawarma.churuone.in';
    }
    return '/';
  }

  const destination = getDestinationUrl();
  const storeDisplayName = STORE_NAMES[storeId] || 'Partner Store';
  const isShawarma = storeId.includes('shawarma') || storeId === 'shawarma-nights';

  // Store Phone OTP Policy (Default: Shawarma/food requires phone OTP, Salon does not)
  const [storePolicyRequireOtp, setStorePolicyRequireOtp] = useState(() => {
    const param = searchParams.get('requirePhoneOtp');
    if (param === '1' || param === 'true') return true;
    if (param === '0' || param === 'false') return false;
    return isShawarma;
  });

  // Background store config check
  useEffect(() => {
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
        const checkRes = await fetch(`/api/auth/me?email=${encodeURIComponent(gEmail)}&storeId=${storeId}`);
        if (checkRes.ok) {
          const data = await checkRes.json();
          if (data.success && data.user && data.user.phone) {
            if (!storePolicyRequireOtp || data.user.phoneVerified) {
              // Already registered and verified -> complete immediately!
              await finalizeServerSession({
                googleId: user.uid,
                email: gEmail,
                name: data.user.name || gName,
                picture: gPic,
                phone: data.user.phone,
                phoneVerified: Boolean(data.user.phoneVerified),
                storeId
              });
              return;
            } else {
              setPhone(data.user.phone);
            }
          }
        }
      } catch (checkErr) {
        // Continue to Step 2
      }

      // Move to Step 2: Collect mandatory phone number
      setStep(2);
    } catch (err) {
      console.error("ChuruOne Google Sign-In Error:", err);
      if (err.code === "auth/popup-closed-by-user") {
        setErrorMsg("Google login popup band kar diya gaya tha.");
      } else if (err.code === "auth/popup-blocked") {
        setErrorMsg("Browser ne Google popup block kar diya. Kripya popups allow karein.");
      } else {
        setErrorMsg(err.message || "Google sign-in me problem aayi.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleProfileSubmit(e) {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      setErrorMsg("Kripya 10-digit ka valid mobile number enter karein.");
      return;
    }
    if (!fullName.trim()) {
      setErrorMsg("Kripya apna naam zaroor enter karein.");
      return;
    }

    if (!storePolicyRequireOtp) {
      // Store does NOT require phone verification (e.g. Salon / Nash Studio)
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
          storeId
        });
      } catch (err) {
        setErrorMsg(err.message || "Profile save karne me error aaya.");
        setLoading(false);
      }
      return;
    }

    // Store REQUIRES Real Phone OTP verification (e.g. Shawarma Nights food delivery)
    await requestPhoneOtp(cleanPhone);
  }

  async function requestPhoneOtp(targetPhone) {
    setIsSendingOtp(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: targetPhone, storeId })
      });
      const data = await res.json();
      if (!data.success) {
        setErrorMsg(data.message || 'OTP send fail ho gaya. Kripya dobara try karein.');
        setIsSendingOtp(false);
        return;
      }

      setCooldown(30);
      if (data.devOtp) setDevOtp(data.devOtp);
      setStep(3); // Go to OTP verification step!
      setSuccessMsg(`SMS OTP dispatched via Dukandar App Gateway to +91 ${targetPhone}`);
    } catch (err) {
      setErrorMsg(err.message || 'Server se connect nahi ho paya.');
    } finally {
      setIsSendingOtp(false);
    }
  }

  async function handleVerifyOtpSubmit(e) {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const cleanOtp = otpInput.trim();
    if (cleanOtp.length !== 6) {
      setErrorMsg("Kripya 6-digit ka sahi OTP enter karein.");
      return;
    }

    setIsVerifyingOtp(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, otp: cleanOtp, storeId })
      });
      const data = await res.json();
      if (!data.success) {
        setErrorMsg(data.message || 'Galat OTP! Kripya dobara try karein.');
        setIsVerifyingOtp(false);
        return;
      }

      // OTP is 100% verified! Finalize session with phoneVerified: true!
      await finalizeServerSession({
        googleId: googleUser?.uid || `churu_${Date.now()}`,
        email: email || googleUser?.email || '',
        name: fullName.trim(),
        picture: googleUser?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName.trim())}`,
        phone: cleanPhone,
        phoneVerified: true,
        storeId
      });
    } catch (err) {
      setErrorMsg(err.message || 'Verification fail hua. Kripya check karein.');
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

    setSuccessMsg(`Login safal raha! ${storeDisplayName} par redirect ho rahe hain...`);
    setTimeout(() => {
      completeAndRedirect(verifiedUser, data.token || '');
    }, 600);
  }

  function completeAndRedirect(userObj, token) {
    // If opened inside popup window, message opener
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

    // Direct redirect back with SSO parameters
    const redirectUrl = new URL(destination, window.location.origin);
    redirectUrl.searchParams.set('churuone_token', token);
    redirectUrl.searchParams.set('churuone_user', encodeURIComponent(JSON.stringify(userObj)));
    window.location.href = redirectUrl.toString();
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 50% 20%, #1f1a14 0%, #0c0a08 100%)',
      color: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      boxSizing: 'border-box'
    }}>
      {/* Return to website link */}
      <div style={{maxWidth: 440, width: '100%', marginBottom: 16}}>
        <a
          href={destination}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: 'rgba(255,255,255,0.6)',
            fontSize: 12,
            textDecoration: 'none',
            letterSpacing: '0.05em'
          }}
        >
          <ArrowLeft size={14} /> Wapas jayein: {storeDisplayName}
        </a>
      </div>

      {/* Main ChuruOne SSO Card */}
      <div style={{
        maxWidth: 440,
        width: '100%',
        background: 'rgba(24, 20, 16, 0.95)',
        border: '1px solid rgba(212, 175, 55, 0.25)',
        borderRadius: 20,
        padding: '36px 28px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
        backdropFilter: 'blur(16px)',
        boxSizing: 'border-box'
      }}>
        {/* ChuruOne Branding Header */}
        <div style={{textAlign: 'center', marginBottom: 28}}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 12px',
            borderRadius: 20,
            background: 'rgba(212, 175, 55, 0.12)',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            fontSize: 10,
            fontWeight: 800,
            color: '#d4af37',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: 12
          }}>
            <Sparkles size={12} /> CHURUONE UNIFIED ID
          </div>
          <h1 style={{
            fontSize: 22,
            fontWeight: 800,
            margin: '0 0 6px',
            letterSpacing: '0.04em',
            color: '#ffffff'
          }}>
            Single Sign-On Portal
          </h1>
          <p style={{
            fontSize: 12,
            color: 'rgba(255,255,255,0.6)',
            margin: 0,
            lineHeight: 1.5
          }}>
            Continuing to <strong style={{color: '#d4af37'}}>{storeDisplayName}</strong>
          </p>
        </div>

        {/* Error / Success Banners */}
        {errorMsg && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid #ef4444',
            borderRadius: 10,
            padding: '12px 14px',
            fontSize: 12,
            color: '#fca5a5',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <AlertCircle size={16} style={{shrink: 0}} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div style={{
            background: 'rgba(34, 197, 94, 0.12)',
            border: '1px solid #22c55e',
            borderRadius: 10,
            padding: '12px 14px',
            fontSize: 12,
            color: '#86efac',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <CheckCircle2 size={16} style={{shrink: 0}} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* STEP 1: GOOGLE SIGN-IN */}
        {step === 1 && (
          <div>
            {/* SPECIAL NOTICE FOR SHAWARMA NIGHTS: MANDATORY MOBILE VERIFICATION */}
            {isShawarma && (
              <div style={{
                background: 'rgba(220, 38, 38, 0.14)',
                border: '1px solid rgba(220, 38, 38, 0.45)',
                borderRadius: 12,
                padding: '12px 14px',
                marginBottom: 20,
                fontSize: 12,
                color: '#fca5a5',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                lineHeight: 1.5,
                textAlign: 'left'
              }}>
                <AlertCircle size={20} color="#ef4444" style={{flexShrink: 0, marginTop: 1}} />
                <div>
                  <strong style={{color: '#ffffff', display: 'block', fontSize: 13, marginBottom: 2}}>
                    ⚠️ Mobile Number Verification Zaroori Hai!
                  </strong>
                  Shawarma Nights food delivery aur live order tracking ke liye Google sign-in ke turant baad aapka valid 10-digit mobile number enter karna aniwarya hai.
                </div>
              </div>
            )}

            <p style={{
              fontSize: 13,
              color: 'rgba(255,255,255,0.8)',
              textAlign: 'center',
              lineHeight: 1.6,
              marginBottom: 24
            }}>
              Apne official Google account se 1-click me authenticate karein. ChuruOne ID aapke account aur orders ko surakshit rakhta hai.
            </p>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              style={{
                width: '100%',
                background: '#ffffff',
                color: '#1f1f1f',
                border: 'none',
                borderRadius: 12,
                padding: '15px 20px',
                fontSize: 13,
                fontWeight: 700,
                cursor: loading ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
                transition: 'all 0.2s',
                letterSpacing: '0.02em'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              {loading ? "OPENING GOOGLE..." : "CONTINUE WITH GOOGLE"}
            </button>

            <div style={{
              marginTop: 24,
              paddingTop: 16,
              borderTop: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontSize: 11,
              color: 'rgba(255,255,255,0.45)'
            }}>
              <ShieldCheck size={14} color="#d4af37" />
              <span>ChuruOne Zero-Password High Security Protocol</span>
            </div>
          </div>
        )}

        {/* STEP 2: PROFILE COMPLETION (MANDATORY MOBILE NUMBER, NO OTP) */}
        {step === 2 && (
          <form onSubmit={handleProfileSubmit}>
            {/* Google Identity Verified Badge */}
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 14,
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 20
            }}>
              <img
                src={googleUser?.photoURL}
                alt=""
                style={{width: 40, height: 40, borderRadius: '50%', border: '2px solid #4285F4'}}
              />
              <div style={{flex: 1, minWidth: 0}}>
                <div style={{fontSize: 13, fontWeight: 700, color: '#ffffff', truncate: true}}>
                  {googleUser?.displayName}
                </div>
                <div style={{fontSize: 11, color: 'rgba(255,255,255,0.6)', truncate: true}}>
                  {googleUser?.email}
                </div>
              </div>
              <span style={{
                background: 'rgba(52, 168, 83, 0.15)',
                color: '#34A853',
                fontSize: 10,
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 12,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}>
                <CheckCircle2 size={11} /> VERIFIED
              </span>
            </div>

            <div style={{marginBottom: 16}}>
              <label style={{
                display: 'block',
                fontSize: 11,
                fontWeight: 700,
                color: 'rgba(255,255,255,0.7)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 6
              }}>
                Full Name *
              </label>
              <div style={{position: 'relative'}}>
                <User size={15} style={{position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)'}} />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Aapka Poora Naam"
                  style={{
                    width: '100%',
                    padding: '13px 14px 13px 40px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 10,
                    color: '#ffffff',
                    fontSize: 13,
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* MANDATORY MOBILE NUMBER & POLICY ADAPTATION */}
            <div style={{marginBottom: 20}}>
              {storePolicyRequireOtp ? (
                <div style={{
                  background: 'rgba(220, 38, 38, 0.14)',
                  border: '1px solid rgba(220, 38, 38, 0.45)',
                  borderRadius: 12,
                  padding: '12px 14px',
                  marginBottom: 14,
                  fontSize: 11,
                  color: '#fca5a5',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  textAlign: 'left',
                  lineHeight: 1.5
                }}>
                  <AlertCircle size={18} color="#ef4444" style={{flexShrink: 0, marginTop: 1}} />
                  <div>
                    <strong style={{color: '#ffffff', display: 'block', fontSize: 12, marginBottom: 2}}>
                      SMS OTP Verification Aniwarya Hai!
                    </strong>
                    {storeDisplayName} par order lene ke liye mobile verification zaroori hai. Dukandar Android App Gateway aapke mobile par SMS OTP bhejega.
                  </div>
                </div>
              ) : (
                <p style={{fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: '0 0 12px', lineHeight: 1.4}}>
                  Booking confirmation aur updates ke liye aapka mobile number add kiya ja raha hai. OTP verification zaroori nahi hai.
                </p>
              )}

              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6}}>
                <label style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#d4af37',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em'
                }}>
                  {storePolicyRequireOtp ? "Mobile Number (OTP Required) *" : "Mobile Number (Mandatory) *"}
                </label>
                <span style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: storePolicyRequireOtp ? '#f87171' : 'rgba(255,255,255,0.4)',
                  background: storePolicyRequireOtp ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                  padding: storePolicyRequireOtp ? '2px 6px' : '0',
                  borderRadius: 6
                }}>
                  {storePolicyRequireOtp ? "SMS OTP via App Gateway" : "No OTP Needed"}
                </span>
              </div>
              <div style={{display: 'flex', gap: 8}}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0 12px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#ffffff'
                }}>
                  +91
                </span>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 7023963189"
                  style={{
                    flex: 1,
                    padding: '13px 14px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 10,
                    color: '#ffffff',
                    fontSize: 14,
                    letterSpacing: '0.05em',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                />
              </div>
              <p style={{fontSize: 10, color: 'rgba(255,255,255,0.45)', margin: '6px 0 0', lineHeight: 1.4}}>
                {storePolicyRequireOtp
                  ? '* Food order verification aur rider tracking ke liye mobile number OTP verify hona aniwarya hai.'
                  : '* Booking confirmation & appointment status ke liye mobile number mandatory hai.'}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || isSendingOtp || phone.replace(/\D/g, '').length !== 10}
              style={{
                width: '100%',
                background: phone.replace(/\D/g, '').length === 10 ? 'linear-gradient(135deg, #d4af37 0%, #aa8010 100%)' : 'rgba(255,255,255,0.1)',
                color: phone.replace(/\D/g, '').length === 10 ? '#000000' : 'rgba(255,255,255,0.4)',
                border: 'none',
                borderRadius: 12,
                padding: '15px 20px',
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                cursor: phone.replace(/\D/g, '').length === 10 ? 'pointer' : 'not-allowed',
                transition: 'all 0.25s',
                boxShadow: phone.replace(/\D/g, '').length === 10 ? '0 4px 18px rgba(212, 175, 55, 0.35)' : 'none'
              }}
            >
              {isSendingOtp
                ? "SENDING SMS OTP..."
                : storePolicyRequireOtp
                  ? "SEND VERIFICATION SMS OTP →"
                  : loading
                    ? "SAVING CHURUONE PROFILE..."
                    : `COMPLETE & CONTINUE TO ${storeDisplayName.toUpperCase()} →`}
            </button>
          </form>
        )}

        {/* STEP 3: REAL SMS OTP VERIFICATION (POWERED BY DUKANDAR APP GATEWAY) */}
        {step === 3 && (
          <form onSubmit={handleVerifyOtpSubmit}>
            {/* Mobile Header Info */}
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 14,
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16
            }}>
              <div>
                <div style={{fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em'}}>
                  Verifying Number
                </div>
                <div style={{fontSize: 14, fontWeight: 800, color: '#ffffff', letterSpacing: '0.04em'}}>
                  +91 {phone.replace(/\D/g, '').slice(-10)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep(2)}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(212, 175, 55, 0.4)',
                  color: '#d4af37',
                  padding: '5px 10px',
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Change Number
              </button>
            </div>

            {/* Dukandar App Gateway Status Notice */}
            <div style={{
              background: 'rgba(59, 130, 246, 0.12)',
              border: '1px solid rgba(59, 130, 246, 0.35)',
              borderRadius: 12,
              padding: '12px 14px',
              marginBottom: 18,
              fontSize: 11,
              color: '#93c5fd',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              lineHeight: 1.5,
              textAlign: 'left'
            }}>
              <ShieldCheck size={18} color="#60a5fa" style={{flexShrink: 0, marginTop: 1}} />
              <div>
                <strong style={{color: '#ffffff', display: 'block', fontSize: 12, marginBottom: 2}}>
                  Dukandar Android App SMS Gateway
                </strong>
                SMS OTP Dukandar SIM Gateway ke dwara aapke mobile number par dispatch kiya gaya hai.
              </div>
            </div>

            {/* Dev Test OTP Notice (if available) */}
            {devOtp && (
              <div style={{
                background: 'rgba(234, 179, 8, 0.15)',
                border: '1px dashed #eab308',
                borderRadius: 10,
                padding: '8px 12px',
                marginBottom: 16,
                fontSize: 11,
                color: '#fef08a',
                textAlign: 'center'
              }}>
                🔑 <b>Dev Test OTP:</b> <span style={{fontFamily: 'monospace', fontSize: 14, fontWeight: 800}}>{devOtp}</span>
              </div>
            )}

            {/* OTP Input Field */}
            <div style={{marginBottom: 20}}>
              <label style={{
                display: 'block',
                fontSize: 11,
                fontWeight: 700,
                color: 'rgba(255,255,255,0.7)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 8,
                textAlign: 'center'
              }}>
                Enter 6-Digit SMS OTP
              </label>
              <input
                type="text"
                autoFocus
                required
                maxLength={6}
                value={otpInput}
                onChange={e => setOtpInput(e.target.value.replace(/\D/g, ''))}
                placeholder="• • • • • •"
                style={{
                  width: '100%',
                  padding: '14px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(212, 175, 55, 0.4)',
                  borderRadius: 12,
                  color: '#ffffff',
                  fontSize: 24,
                  fontWeight: 800,
                  letterSpacing: '0.35em',
                  textAlign: 'center',
                  fontFamily: 'monospace',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
            </div>

            {/* Verify Submit Button */}
            <button
              type="submit"
              disabled={isVerifyingOtp || otpInput.trim().length !== 6}
              style={{
                width: '100%',
                background: otpInput.trim().length === 6 ? 'linear-gradient(135deg, #d4af37 0%, #aa8010 100%)' : 'rgba(255,255,255,0.1)',
                color: otpInput.trim().length === 6 ? '#000000' : 'rgba(255,255,255,0.4)',
                border: 'none',
                borderRadius: 12,
                padding: '15px 20px',
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                cursor: otpInput.trim().length === 6 ? 'pointer' : 'not-allowed',
                transition: 'all 0.25s',
                boxShadow: otpInput.trim().length === 6 ? '0 4px 18px rgba(212, 175, 55, 0.35)' : 'none',
                marginBottom: 16
              }}
            >
              {isVerifyingOtp ? "VERIFYING SMS OTP..." : "VERIFY OTP & CONTINUE →"}
            </button>

            {/* Resend OTP */}
            <div style={{textAlign: 'center', fontSize: 11}}>
              {cooldown > 0 ? (
                <span style={{color: 'rgba(255,255,255,0.45)'}}>
                  Resend SMS OTP in <b>{cooldown}s</b>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => requestPhoneOtp(phone.replace(/\D/g, '').slice(-10))}
                  disabled={isSendingOtp}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#d4af37',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  {isSendingOtp ? "Sending new OTP..." : "Resend SMS OTP"}
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      <div style={{marginTop: 20, fontSize: 11, color: 'rgba(255,255,255,0.35)'}}>
        © ChuruOne Platform • Single Identity for all Smart Stores
      </div>
    </div>
  );
}
