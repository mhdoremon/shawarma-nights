import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { ArrowLeft, CheckCircle2, ShieldCheck, Sparkles, Smartphone, Mail, User, AlertCircle } from 'lucide-react';
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

  // Auth State
  const [step, setStep] = useState(1); // 1: Google login, 2: Profile complete (phone mandatory)
  const [googleUser, setGoogleUser] = useState(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Auto-finish if already logged in via ChuruOne session
  useEffect(() => {
    try {
      const existingRaw = localStorage.getItem('churuone_user') || localStorage.getItem('nash_user');
      if (existingRaw) {
        const parsed = JSON.parse(existingRaw);
        if (parsed && parsed.phoneNumber && searchParams.get('auto') === '1') {
          completeAndRedirect(parsed, localStorage.getItem('auth_token') || '');
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

      // Check if user already exists on ChuruOne Smart Server with a phone number
      try {
        const checkRes = await fetch(`/api/auth/me?email=${encodeURIComponent(gEmail)}&storeId=${storeId}`);
        if (checkRes.ok) {
          const data = await checkRes.json();
          if (data.success && data.user && data.user.phone) {
            // Already registered with phone -> complete immediately!
            await finalizeServerSession({
              googleId: user.uid,
              email: gEmail,
              name: data.user.name || gName,
              picture: gPic,
              phone: data.user.phone,
              storeId
            });
            return;
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

    setLoading(true);
    setErrorMsg('');

    try {
      await finalizeServerSession({
        googleId: googleUser?.uid || `churu_${Date.now()}`,
        email: email || googleUser?.email || '',
        name: fullName.trim(),
        picture: googleUser?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName.trim())}`,
        phone: cleanPhone,
        storeId
      });
    } catch (err) {
      setErrorMsg(err.message || "Profile save karne me error aaya.");
      setLoading(false);
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
      phoneVerified: false // Saved on record, ready for later verification if needed
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

            {/* MANDATORY MOBILE NUMBER (NO OTP REQUIRED) */}
            <div style={{marginBottom: 20}}>
              {isShawarma && (
                <div style={{
                  background: 'rgba(220, 38, 38, 0.12)',
                  border: '1px solid rgba(220, 38, 38, 0.35)',
                  borderRadius: 10,
                  padding: '10px 12px',
                  marginBottom: 12,
                  fontSize: 11,
                  color: '#fca5a5',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  textAlign: 'left'
                }}>
                  <AlertCircle size={16} color="#ef4444" style={{flexShrink: 0}} />
                  <span><b>Delivery Rule:</b> Shawarma Nights delivery partner isi number par call karega. Kripya apna sahi 10-digit mobile number enter karein.</span>
                </div>
              )}
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6}}>
                <label style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#d4af37',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em'
                }}>
                  Mobile Number (Mandatory) *
                </label>
                <span style={{fontSize: 10, color: 'rgba(255,255,255,0.4)'}}>No OTP Needed</span>
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
                {isShawarma
                  ? '* Food order verification aur rider tracking ke liye mobile number aniwarya hai.'
                  : '* Booking confirmation & appointment status ke liye mobile number mandatory hai.'}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || phone.replace(/\D/g, '').length !== 10}
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
              {loading ? "SAVING CHURUONE PROFILE..." : `COMPLETE & CONTINUE TO ${storeId.includes('nash') ? 'NASH STUDIO' : 'STORE'} →`}
            </button>
          </form>
        )}
      </div>

      <div style={{marginTop: 20, fontSize: 11, color: 'rgba(255,255,255,0.35)'}}>
        © ChuruOne Platform • Single Identity for all Smart Stores
      </div>
    </div>
  );
}
