import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Phone, 
  ShieldCheck, 
  Lock, 
  MapPin, 
  Navigation, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  KeyRound
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal() {
  const {
    currentUser,
    isAuthModalOpen,
    closeAuthModal,
    openAuthModal,
    activeStep,
    pendingPhone,
    sendPhoneOtp,
    verifyPhoneOtp,
    registerUserProfile,
    loginWithGoogle,
    handleChuruOneSSO,
    fetchCurrentGPSLocation,
    isSendingOtp,
  } = useAuth();

  // Local Form States
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [statusMessage, setStatusMessage] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Security & Rate Limiting States
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [isLockedOut, setIsLockedOut] = useState(false);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  // Profile Form States
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [gpsCoords, setGpsCoords] = useState(null);

  // Pre-fill fields if user already authenticated via Google
  useEffect(() => {
    if (currentUser) {
      if (currentUser.name && !fullName) setFullName(currentUser.name);
      if (currentUser.email && !email) setEmail(currentUser.email);
      if (currentUser.address && !address) setAddress(currentUser.address);
      if (currentUser.phone && !phoneNumber) setPhoneNumber(String(currentUser.phone).replace(/\D/g, '').slice(-10));
    }
  }, [currentUser, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  // Handle Phone Submit (Real SMS OTP)
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (cooldownSeconds > 0 || isLockedOut) return;
    setStatusMessage(null);
    const targetPhone = phoneNumber || pendingPhone;
    const res = await sendPhoneOtp(targetPhone);
    if (!res.success) {
      if (res.lockedOut) {
        setIsLockedOut(true);
      }
      if (res.cooldown) {
        setCooldownSeconds(res.cooldown);
      }
      setStatusMessage({ type: 'error', text: res.message });
    } else {
      setStatusMessage({ type: 'success', text: `SMS OTP bhej diya gaya hai!` });
      setCooldownSeconds(30);
    }
  };

  // Handle OTP Verify
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otpInput.length !== 6 || isLockedOut) return;
    setIsVerifying(true);
    setStatusMessage(null);

    const res = await verifyPhoneOtp(otpInput);
    setIsVerifying(false);

    if (!res.success) {
      if (res.lockedOut) {
        setIsLockedOut(true);
      }
      if (res.attemptsLeft !== undefined) {
        setAttemptsLeft(res.attemptsLeft);
      }
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  // Handle GPS Location Fetch
  const handleGetLocation = async () => {
    setIsLocating(true);
    setStatusMessage(null);
    try {
      const coords = await fetchCurrentGPSLocation();
      setGpsCoords(coords);
      setAddress((prev) => prev || `GPS Location: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
      setStatusMessage({ 
        type: 'success', 
        text: `GPS Location captured: [${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}]` 
      });
    } catch (err) {
      setStatusMessage({ 
        type: 'error', 
        text: 'Location permission enable karein ya address manually dalein' 
      });
    } finally {
      setIsLocating(false);
    }
  };

  // Handle Complete Registration
  const handleCompleteRegistration = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !address.trim()) {
      setStatusMessage({ type: 'error', text: 'Naam aur Delivery Address zaroori hai' });
      return;
    }

    const fullDeliveryAddress = landmark ? `${address.trim()} (Landmark: ${landmark.trim()})` : address.trim();

    const res = await registerUserProfile({
      name: fullName.trim(),
      email: email.trim(),
      address: fullDeliveryAddress,
      gpsCoords,
    });

    if (!res.success) {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="bg-white border border-stone-200 rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="p-5 pb-4 border-b border-stone-100 bg-[#FFFDF9]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#DC2626] flex items-center justify-center text-white shadow-sm">
                <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-base font-black text-stone-900 leading-none">
                  Shawarma Nights Access
                </h3>
                <p className="text-[11px] text-stone-400 font-bold mt-1">
                  Fast Phone OTP & Verified Profile
                </p>
              </div>
            </div>

            <button
              onClick={closeAuthModal}
              className="p-1.5 rounded-full text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition-all"
            >
              <X className="w-5 h-5 stroke-[2]" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 text-xs">
          
          {/* Status Message alert banner */}
          {statusMessage && (
            <div className={`p-3 rounded-xl ${
              statusMessage.type === 'error'
                ? 'bg-red-50 text-[#DC2626] border border-red-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              <div className="flex items-center gap-2">
                {statusMessage.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                )}
                <span className="font-semibold">{statusMessage.text}</span>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 1: LOGIN (CHURUONE UNIFIED SSO + DIRECT PHONE OTP) */}
          {/* ============================================================ */}
          {activeStep === 'phone' && (
            <div className="space-y-4">
              {currentUser ? (
                /* USER ALREADY SIGNED IN VIA GOOGLE: PROMPT PHONE OTP VERIFICATION */
                <div className="bg-[#FFFBF7] border border-amber-300 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span>Signed in as {currentUser.name || 'Foodie'}</span>
                  </div>
                  <p className="text-[11px] text-stone-600 leading-relaxed">
                    Shawarma food delivery aur live order tracking ke liye apna 10-digit mobile number OTP verify karein.
                  </p>
                </div>
              ) : (
                /* PRIMARY OPTION: CHURUONE UNIFIED ID GOOGLE SSO */
                <div className="bg-[#FFFBF7] border border-[#d4af37]/40 rounded-2xl p-4 text-center space-y-3 shadow-xs">
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#d4af37]/15 text-[#996515] text-[10px] font-black uppercase tracking-wider">
                    ★ Recommended Unified Login
                  </div>
                  <div className="text-sm font-black text-stone-900 leading-tight">
                    Sign In with ChuruOne ID
                  </div>
                  <p className="text-[11px] text-stone-500 leading-relaxed">
                    1-Click me Google se sign in karein. Sabhi ChuruOne stores ke orders ek hi jagah track karein.
                  </p>

                  {/* MANDATORY MOBILE NUMBER NOTICE */}
                  <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-left flex items-start gap-2 text-[11px] text-red-900 leading-normal">
                    <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-stone-900">Mobile Number Verification Zaroori Hai:</strong> Shawarma food delivery aur live GPS order tracking ke liye valid mobile number OTP verify hona aniwarya hai.
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleChuruOneSSO}
                    className="w-full py-3 rounded-xl bg-stone-900 hover:bg-black text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2.5 transition-all hover:scale-[1.01]"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.7-.06-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span>Continue with ChuruOne ID (Google)</span>
                  </button>
                </div>
              )}

              {/* DIVIDER if not already logged in */}
              {!currentUser && (
                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-stone-200"></div>
                  <span className="flex-shrink mx-3 text-stone-400 text-[10px] font-bold uppercase tracking-wider">
                    Ya Phir Direct Phone OTP
                  </span>
                  <div className="flex-grow border-t border-stone-200"></div>
                </div>
              )}

              {/* Phone OTP Form */}
              <form onSubmit={handleSendOtp} className="space-y-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Mobile Number</label>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1.5 bg-stone-100 border border-stone-200 rounded-xl px-3 py-2 text-stone-700 font-bold">
                      <span className="text-[11px] font-bold text-stone-500">IN</span>
                      <span>+91</span>
                    </div>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder="98765 43210"
                      className="flex-1 bg-stone-50 border border-stone-200 focus:border-[#DC2626] rounded-xl px-3.5 py-2 text-sm text-stone-900 font-mono font-bold focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSendingOtp || phoneNumber.length !== 10}
                  className="w-full py-3 rounded-2xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.01] disabled:opacity-50"
                >
                  <Phone className={`w-4 h-4 ${isSendingOtp ? 'animate-bounce' : ''}`} />
                  <span>{isSendingOtp ? 'SMS Bheja Ja Raha Hai...' : 'Send 6-Digit Real SMS OTP'}</span>
                </button>
              </form>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 2: 6-DIGIT OTP VERIFICATION */}
          {/* ============================================================ */}
          {activeStep === 'otp' && (
            <div className="space-y-4">
              <div>
                <div className="text-sm font-black text-stone-900">OTP Enter Karein</div>
                <p className="text-stone-500 text-[11px] mt-0.5">
                  Humne <strong>+91 {pendingPhone}</strong> par 6-digit verification code bheja hai.
                </p>
              </div>

              {/* Security Lockout Banner */}
              {isLockedOut && (
                <div className="p-3.5 bg-red-50 border-2 border-red-300 rounded-2xl text-red-900 space-y-1">
                  <div className="flex items-center gap-2 font-black text-xs">
                    <Lock className="w-4 h-4 text-red-600 shrink-0" />
                    <span>Security Lockout: 3 Failed Attempts</span>
                  </div>
                  <p className="text-[11px] text-red-700 leading-relaxed">
                    Is number par 3 baar galat OTP dala gaya. Anti-hack protection ke tehat ye number 15 minute ke liye block hai.
                  </p>
                </div>
              )}

              {/* Remaining Attempts Warning */}
              {attemptsLeft < 3 && !isLockedOut && (
                <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] font-bold text-center flex items-center justify-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Warning: Sirf {attemptsLeft} koshish baaki hai.</span>
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="space-y-3">
                <div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    disabled={isLockedOut}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="• • • • • •"
                    className="w-full text-center tracking-[0.4em] font-mono text-xl font-black bg-stone-50 border-2 border-stone-200 focus:border-[#DC2626] rounded-2xl py-3 text-stone-900 focus:outline-none disabled:opacity-50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isVerifying || otpInput.length !== 6 || isLockedOut}
                  className="w-full py-3 rounded-2xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-extrabold text-xs shadow-md transition-all hover:scale-[1.01] disabled:opacity-50"
                >
                  {isVerifying ? 'Verifying SMS Code...' : 'Verify OTP & Continue'}
                </button>
              </form>

              {/* Resend and Change Number options */}
              <div className="flex items-center justify-between text-[11px] pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={(e) => handleSendOtp(e)}
                  disabled={isSendingOtp || cooldownSeconds > 0 || isLockedOut}
                  className="text-[#DC2626] font-bold hover:underline disabled:opacity-50 disabled:no-underline"
                >
                  {cooldownSeconds > 0 
                    ? `Resend OTP (${cooldownSeconds}s)` 
                    : isSendingOtp 
                    ? 'Bhej rahe hain...' 
                    : 'Resend OTP'}
                </button>

                <button
                  type="button"
                  onClick={() => openAuthModal('phone')}
                  className="text-stone-400 hover:text-stone-800 font-bold hover:underline"
                >
                  ← Number Badlein
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 3: FULL PROFILE REGISTRATION (FIRST TIME ONLY) */}
          {/* ============================================================ */}
          {activeStep === 'register' && (
            <form onSubmit={handleCompleteRegistration} className="space-y-3">
              <div>
                <div className="text-sm font-black text-stone-900">Apni Profile Banayein</div>
                <p className="text-stone-500 text-[11px] mt-0.5">
                  Ye details aapke delivery address aur rider contact ke liye save hongi.
                </p>
              </div>

              {/* Verified Phone Badge */}
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <span className="text-emerald-800 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>+91 {pendingPhone}</span>
                </span>
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-600 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                  Verified
                </span>
              </div>

              {/* Full Name */}
              <div>
                <label className="font-bold text-stone-700 block mb-1">Aapka Poora Naam *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Sameer Siddiqui"
                  className="w-full bg-stone-50 border border-stone-200 focus:border-[#DC2626] rounded-xl px-3.5 py-2 text-stone-900 focus:outline-none font-bold"
                />
              </div>

              {/* Email (Optional) */}
              <div>
                <label className="font-bold text-stone-700 block mb-1">Email (Optional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. sameer@gmail.com"
                  className="w-full bg-stone-50 border border-stone-200 focus:border-[#DC2626] rounded-xl px-3.5 py-2 text-stone-900 focus:outline-none"
                />
              </div>

              {/* Delivery Address */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-stone-700">Delivery Address *</label>
                  
                  {/* GPS Location Button */}
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={isLocating}
                    className="text-[11px] font-extrabold text-[#DC2626] hover:underline inline-flex items-center gap-1"
                  >
                    <Navigation className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
                    <span>{isLocating ? 'Detecting GPS...' : 'Use Current GPS'}</span>
                  </button>
                </div>
                
                <textarea
                  rows={2}
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Flat / House No., Street, Area, Colony..."
                  className="w-full bg-stone-50 border border-stone-200 focus:border-[#DC2626] rounded-xl px-3.5 py-2 text-stone-900 focus:outline-none resize-none leading-relaxed"
                />
              </div>

              {/* Landmark */}
              <div>
                <label className="font-bold text-stone-700 block mb-1">Landmark (Pehchan)</label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g. Near HDFC Bank / Metro Pillar 42"
                  className="w-full bg-stone-50 border border-stone-200 focus:border-[#DC2626] rounded-xl px-3.5 py-2 text-stone-900 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-extrabold text-xs shadow-md transition-all mt-2"
              >
                Complete Profile & Start Ordering
              </button>
            </form>
          )}

        </div>
      </motion.div>
    </div>
  );
}
