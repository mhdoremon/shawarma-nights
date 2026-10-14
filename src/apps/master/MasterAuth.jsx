import React, { useState } from 'react';
import { useMaster } from './context/MasterContext';
import { Store, Bike, Lock, User, ArrowRight, Eye, EyeOff, Phone, AlertCircle, ArrowLeft, X, KeyRound, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MasterAuth() {
  const { loginDukandar, loginDelivery, registerDelivery } = useMaster();

  const [authRole, setAuthRole] = useState('dukandar'); // 'dukandar' | 'delivery_boy'
  const [storeIdInput, setStoreIdInput] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('storeId') || params.get('store');
    if (fromUrl) return fromUrl;
    const host = window.location.hostname.toLowerCase();
    if (host.includes('nash')) return 'nash-studio';
    if (host.includes('skyline')) return 'skyline';
    return 'shawarma';
  });

  // Strictly empty initial state for security (no hardcoded credentials)
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Delivery Boy Sub-tab: 'login' | 'register'
  const [deliveryAuthMode, setDeliveryAuthMode] = useState('login');

  // Delivery Boy Login Form State (strictly empty)
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [deliveryPassword, setDeliveryPassword] = useState('');
  const [showDeliveryPassword, setShowDeliveryPassword] = useState(false);

  // Delivery Boy Register Form State
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regVehicle, setRegVehicle] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Forgot Dukan Account Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: phone, 2: otp, 3: reveal & new password
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotRecovered, setForgotRecovered] = useState(null); // { dukanId, username, dukanName }
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  // 1. DUKANDAR LOGIN
  const handleDukandarLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    const sId = storeIdInput.trim();
    const uName = username.trim();
    const pwd = password.trim();

    if (!sId) {
      setErrorMessage('Kripya apni Dukan ID dalein. Agar nahi pata to "Forgot Dukan Account" par click karein.');
      return;
    }
    if (!uName || !pwd) {
      setErrorMessage('Kripya Username/Mobile aur Password dono dalein.');
      return;
    }

    setIsSubmitting(true);
    const res = await loginDukandar(sId, uName, pwd);
    setIsSubmitting(false);
    if (!res.success) {
      setErrorMessage(res.message || 'Dukan ID, Mobile/Username ya Password galat hai. Kripya check karein ya "Forgot Dukan Account" ka upyog karein.');
    }
  };

  // 2. DELIVERY BOY LOGIN
  const handleDeliveryLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    const phone = deliveryPhone.trim();
    const pwd = deliveryPassword.trim();

    if (!phone || !pwd) {
      setErrorMessage('Please enter registered phone number and password.');
      return;
    }

    setIsSubmitting(true);
    const res = await loginDelivery(storeIdInput.trim() || 'shawarma', phone, pwd);
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.message || 'Invalid phone or password.');
    }
  };

  // 3. DELIVERY BOY REGISTRATION
  const handleDeliveryRegister = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const name = regName.trim();
    const phone = regPhone.trim();
    const vehicle = regVehicle.trim();
    const pwd = regPassword.trim();
    const cPwd = regConfirmPassword.trim();

    if (!name || !phone || !vehicle || !pwd || !cPwd) {
      setErrorMessage('Please fill in all registration fields.');
      return;
    }

    if (phone.replace(/\D/g, '').length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (pwd !== cPwd) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (pwd.length < 4) {
      setErrorMessage('Password must be at least 4 characters long.');
      return;
    }

    setIsSubmitting(true);
    const res = await registerDelivery(storeIdInput.trim() || 'shawarma', {
      name,
      phone,
      vehicle,
      password: pwd
    });
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.message || 'Registration failed.');
    }
  };

  // FORGOT DUKAN ACCOUNT ACTIONS (MSG91 OTP Verified)
  const handleSendForgotOtp = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    const cleanP = forgotPhone.replace(/\D/g, '').slice(-10);
    if (cleanP.length !== 10) {
      setForgotError('Kripya valid 10-digit registered mobile number dalein.');
      return;
    }
    setForgotLoading(true);
    try {
      const res = await fetch('/api/auth/dukandar/forgot-password/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanP })
      });
      const data = await res.json();
      setForgotLoading(false);
      if (data.success) {
        setForgotStep(2);
        setForgotSuccess(data.message || 'OTP aapke registered number par bhej diya gaya hai.');
      } else {
        setForgotError(data.message || 'Is mobile number se koi dukan registered nahi mili.');
      }
    } catch (err) {
      setForgotLoading(false);
      setForgotError('Network error. Kripya dobara koshish karein.');
    }
  };

  const handleVerifyForgotOtp = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    const cleanP = forgotPhone.replace(/\D/g, '').slice(-10);
    const otpClean = forgotOtp.trim();
    if (!otpClean || otpClean.length < 4) {
      setForgotError('Kripya valid OTP code dalein.');
      return;
    }
    setForgotLoading(true);
    try {
      const res = await fetch('/api/auth/dukandar/forgot-password/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanP, otp: otpClean })
      });
      const data = await res.json();
      setForgotLoading(false);
      if (data.success && data.verified) {
        setForgotRecovered({
          dukanId: data.dukanId,
          username: data.username,
          phone: data.phone,
          dukanName: data.dukanName
        });
        setForgotStep(3);
        setForgotSuccess('OTP verify ho gaya! Niche aapki Dukan ID aur Username dikha diya gaya hai.');
      } else {
        setForgotError(data.message || 'Galat ya expired OTP code dalein.');
      }
    } catch (err) {
      setForgotLoading(false);
      setForgotError('Network error. Kripya dobara koshish karein.');
    }
  };

  const handleResetForgotPass = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    if (!forgotNewPassword || forgotNewPassword.length < 4) {
      setForgotError('Password kam se kam 4 aksharon ka hona chahiye.');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('Dono password aapas me match nahi ho rahe.');
      return;
    }
    setForgotLoading(true);
    try {
      const res = await fetch('/api/auth/dukandar/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: forgotPhone.replace(/\D/g, '').slice(-10),
          dukanId: forgotRecovered?.dukanId,
          newPassword: forgotNewPassword
        })
      });
      const data = await res.json();
      setForgotLoading(false);
      if (data.success) {
        // Pre-fill login form
        if (forgotRecovered?.dukanId) setStoreIdInput(forgotRecovered.dukanId.toLowerCase());
        if (forgotRecovered?.username) setUsername(forgotRecovered.username);
        setPassword(forgotNewPassword);
        setShowForgotModal(false);
        setForgotStep(1);
        setForgotPhone('');
        setForgotOtp('');
        setErrorMessage('');
        alert('Password safaltapoorvak badal diya gaya hai! Ab aap direct Sign In karein.');
      } else {
        setForgotError(data.message || 'Password update nahi ho paya.');
      }
    } catch (err) {
      setForgotLoading(false);
      setForgotError('Network error. Kripya dobara koshish karein.');
    }
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans antialiased flex flex-col justify-between p-4 sm:p-6 selection:bg-zinc-950 selection:text-white">
      
      {/* Top Bar / Back to Portal */}
      <div className="max-w-md w-full mx-auto pt-6 sm:pt-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-zinc-400 hover:text-zinc-950 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 stroke-[1.5]" />
          <span>Back to ChuruOne</span>
        </Link>
      </div>

      {/* Main Luxury Minimalist Card */}
      <div className="max-w-md w-full mx-auto my-8 border border-zinc-200 bg-white p-8 sm:p-10 shadow-sm">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-block text-[9px] font-semibold tracking-[0.25em] uppercase text-zinc-400 mb-2">
            CHURUONE MERCHANT OS
          </div>

          <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-zinc-950">
            Sign In to Store Console
          </h1>

          <p className="text-xs text-zinc-500 mt-2 leading-relaxed max-w-xs mx-auto">
            Manage live orders, catalog items, and delivery dispatch.
          </p>
        </div>

        {/* Minimal Role Switcher: [ Store Owner ] | [ Delivery Partner ] */}
        <div className="flex items-center border-b border-zinc-200 mb-6">
          <button
            type="button"
            onClick={() => {
              setAuthRole('dukandar');
              setErrorMessage('');
            }}
            className={`flex-1 pb-3 text-xs uppercase tracking-widest font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              authRole === 'dukandar'
                ? 'text-zinc-950 border-b-2 border-zinc-950 font-semibold'
                : 'text-zinc-400 hover:text-zinc-700'
            }`}
          >
            <Store className="w-3.5 h-3.5 stroke-[1.5]" />
            <span>Store Owner</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthRole('delivery_boy');
              setErrorMessage('');
            }}
            className={`flex-1 pb-3 text-xs uppercase tracking-widest font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              authRole === 'delivery_boy'
                ? 'text-zinc-950 border-b-2 border-zinc-950 font-semibold'
                : 'text-zinc-400 hover:text-zinc-700'
            }`}
          >
            <Bike className="w-3.5 h-3.5 stroke-[1.5]" />
            <span>Delivery Partner</span>
          </button>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-6 p-3.5 border border-red-200 bg-red-50 text-red-700 text-xs font-medium flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 stroke-[1.5]" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* ROLE 1: DUKANDAR / STORE OWNER LOGIN                       */}
        {/* ========================================================= */}
        {authRole === 'dukandar' ? (
          <form onSubmit={handleDukandarLogin} className="space-y-4">
            
            {/* Store Code */}
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-semibold text-zinc-500 mb-1.5">
                Store ID / Dukan Code
              </label>
              <div className="relative">
                <Store className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 stroke-[1.5]" />
                <input
                  type="text"
                  required
                  value={storeIdInput}
                  onChange={(e) => setStoreIdInput(e.target.value.toLowerCase())}
                  placeholder="e.g. shawarma, nash-studio, skyline"
                  className="w-full border border-zinc-200 focus:border-zinc-950 pl-9 pr-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 outline-none transition-colors"
                />
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                {[
                  { id: 'shawarma', label: 'Shawarma' },
                  { id: 'nash-studio', label: 'Nash Studio' },
                  { id: 'skyline', label: 'Skyline Outfits' }
                ].map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStoreIdInput(s.id)}
                    className={`text-[10px] px-2 py-0.5 border transition-all ${
                      storeIdInput === s.id
                        ? 'border-zinc-950 bg-zinc-950 text-white font-medium'
                        : 'border-zinc-200 text-zinc-500 hover:border-zinc-400'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-semibold text-zinc-500 mb-1.5">
                Owner Username or Phone
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 stroke-[1.5]" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username or mobile"
                  autoComplete="username"
                  className="w-full border border-zinc-200 focus:border-zinc-950 pl-9 pr-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 outline-none transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-semibold text-zinc-500 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 stroke-[1.5]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  className="w-full border border-zinc-200 focus:border-zinc-950 pl-9 pr-10 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5 stroke-[1.5]" /> : <Eye className="w-3.5 h-3.5 stroke-[1.5]" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-zinc-950 hover:bg-black text-white py-3.5 px-4 text-xs uppercase tracking-widest font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 mt-2"
            >
              <span>{isSubmitting ? 'Authenticating...' : 'Sign In to Console'}</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[1.5]" />
            </button>

            <div className="pt-2 text-center flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(true);
                  setForgotStep(1);
                  setForgotError('');
                  setForgotSuccess('');
                }}
                className="text-xs font-semibold text-amber-700 hover:text-amber-900 underline cursor-pointer"
              >
                Dukan ID ya Password bhool gaye? Recover karein
              </button>

              <a
                href="/auth?role=dukandar&mode=register"
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline"
              >
                Nayi dukan kholni hai? Register & Apply karein
              </a>
            </div>

          </form>
        ) : (
          /* ========================================================= */
          /* ROLE 2: DELIVERY BOY PORTAL                                */
          /* ========================================================= */
          <div className="space-y-4">
            
            {/* Delivery Sub-switcher */}
            <div className="flex items-center gap-4 text-xs uppercase tracking-wider mb-2">
              <button
                type="button"
                onClick={() => {
                  setDeliveryAuthMode('login');
                  setErrorMessage('');
                }}
                className={`pb-1 transition-colors cursor-pointer ${
                  deliveryAuthMode === 'login'
                    ? 'text-zinc-950 font-semibold border-b border-zinc-950'
                    : 'text-zinc-400 hover:text-zinc-600'
                }`}
              >
                Sign In
              </button>

              <button
                type="button"
                onClick={() => {
                  setDeliveryAuthMode('register');
                  setErrorMessage('');
                }}
                className={`pb-1 transition-colors cursor-pointer ${
                  deliveryAuthMode === 'register'
                    ? 'text-zinc-950 font-semibold border-b border-zinc-950'
                    : 'text-zinc-400 hover:text-zinc-600'
                }`}
              >
                Register Partner
              </button>
            </div>

            {deliveryAuthMode === 'login' ? (
              <form onSubmit={handleDeliveryLogin} className="space-y-4">
                
                {/* Store ID */}
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-semibold text-zinc-500 mb-1.5">
                    Store ID / Dukan Code
                  </label>
                  <div className="relative">
                    <Store className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 stroke-[1.5]" />
                    <input
                      type="text"
                      required
                      value={storeIdInput}
                      onChange={(e) => setStoreIdInput(e.target.value.toLowerCase())}
                      placeholder="e.g. shawarma"
                      className="w-full border border-zinc-200 focus:border-zinc-950 pl-9 pr-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Mobile Phone Number */}
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-semibold text-zinc-500 mb-1.5">
                    Registered Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 stroke-[1.5]" />
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={deliveryPhone}
                      onChange={(e) => setDeliveryPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="10-digit mobile number"
                      className="w-full border border-zinc-200 focus:border-zinc-950 pl-9 pr-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-semibold text-zinc-500 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 stroke-[1.5]" />
                    <input
                      type={showDeliveryPassword ? 'text' : 'password'}
                      required
                      value={deliveryPassword}
                      onChange={(e) => setDeliveryPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full border border-zinc-200 focus:border-zinc-950 pl-9 pr-10 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowDeliveryPassword(!showDeliveryPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                    >
                      {showDeliveryPassword ? <EyeOff className="w-3.5 h-3.5 stroke-[1.5]" /> : <Eye className="w-3.5 h-3.5 stroke-[1.5]" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-zinc-950 hover:bg-black text-white py-3.5 px-4 text-xs uppercase tracking-widest font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 mt-2"
                >
                  <span>{isSubmitting ? 'Authenticating...' : 'Sign In as Delivery Partner'}</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[1.5]" />
                </button>

              </form>
            ) : (
              /* REGISTRATION FORM */
              <form onSubmit={handleDeliveryRegister} className="space-y-4">
                
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-semibold text-zinc-500 mb-1.5">
                    Store ID / Dukan Code
                  </label>
                  <input
                    type="text"
                    required
                    value={storeIdInput}
                    onChange={(e) => setStoreIdInput(e.target.value.toLowerCase())}
                    placeholder="e.g. shawarma"
                    className="w-full border border-zinc-200 focus:border-zinc-950 px-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-semibold text-zinc-500 mb-1.5">
                    Partner Name
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Full name"
                    className="w-full border border-zinc-200 focus:border-zinc-950 px-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-semibold text-zinc-500 mb-1.5">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="10-digit mobile"
                    className="w-full border border-zinc-200 focus:border-zinc-950 px-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-semibold text-zinc-500 mb-1.5">
                    Vehicle Type
                  </label>
                  <select
                    value={regVehicle}
                    onChange={(e) => setRegVehicle(e.target.value)}
                    className="w-full border border-zinc-200 focus:border-zinc-950 px-3.5 py-2.5 text-xs text-zinc-900 outline-none bg-white transition-colors"
                    required
                  >
                    <option value="">Select vehicle</option>
                    <option value="bike">Motorcycle / Bike</option>
                    <option value="scooter">Scooter / Activa</option>
                    <option value="bicycle">Bicycle</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-semibold text-zinc-500 mb-1.5">
                    Set Password
                  </label>
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Minimum 4 characters"
                    className="w-full border border-zinc-200 focus:border-zinc-950 px-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-semibold text-zinc-500 mb-1.5">
                    Confirm Password
                  </label>
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full border border-zinc-200 focus:border-zinc-950 px-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 outline-none transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-zinc-950 hover:bg-black text-white py-3.5 px-4 text-xs uppercase tracking-widest font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 mt-2"
                >
                  <span>{isSubmitting ? 'Registering...' : 'Register Partner Account'}</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[1.5]" />
                </button>

              </form>
            )}

          </div>
        )}

      </div>

      {/* Footer */}
      <div className="max-w-md w-full mx-auto text-center pb-6 text-[11px] text-zinc-400">
        © 2026 ChuruOne. All rights reserved.
      </div>

      {/* FORGOT DUKAN ACCOUNT / ID / PASSWORD RECOVERY MODAL */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-zinc-200 shadow-2xl rounded-2xl max-w-md w-full p-6 sm:p-7 relative animate-in fade-in zoom-in-95 duration-200">
            
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-700 p-1.5 rounded-full hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4 stroke-[2]" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <KeyRound className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                Dukandar Account Recovery
              </span>
            </div>

            <h3 className="text-xl font-light text-zinc-950 mb-1">
              Dukan ID & Password Recover Karein
            </h3>
            <p className="text-xs text-zinc-500 mb-5 leading-relaxed">
              Apne registered mobile number par MSG91 OTP prapt karke apni Dukan ID dekhein aur naya password banayein.
            </p>

            {forgotError && (
              <div className="mb-4 p-3 border border-red-200 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 stroke-[2]" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSuccess && (
              <div className="mb-4 p-3 border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 stroke-[2]" />
                <span>{forgotSuccess}</span>
              </div>
            )}

            {/* STEP 1: ENTER REGISTERED PHONE NUMBER */}
            {forgotStep === 1 && (
              <form onSubmit={handleSendForgotOtp} className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-semibold text-zinc-500 mb-1.5">
                    Registered Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={forgotPhone}
                      onChange={(e) => setForgotPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="10-digit mobile number"
                      className="w-full border border-zinc-200 focus:border-zinc-950 pl-9 pr-3.5 py-2.5 text-xs text-zinc-900 rounded-lg outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full bg-zinc-950 hover:bg-black text-white py-3 text-xs uppercase tracking-widest font-semibold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <span>{forgotLoading ? 'Sending OTP...' : 'Send MSG91 SMS OTP'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}

            {/* STEP 2: VERIFY OTP */}
            {forgotStep === 2 && (
              <form onSubmit={handleVerifyForgotOtp} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[10px] uppercase tracking-widest font-semibold text-zinc-500">
                      Enter 6-Digit SMS OTP
                    </label>
                    <button
                      type="button"
                      onClick={() => setForgotStep(1)}
                      className="text-[10px] text-zinc-500 hover:text-zinc-900 underline"
                    >
                      Change Number
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter OTP"
                    className="w-full border border-zinc-200 focus:border-zinc-950 px-3.5 py-2.5 text-center text-sm font-mono tracking-widest text-zinc-900 rounded-lg outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-3 text-xs uppercase tracking-widest font-semibold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <span>{forgotLoading ? 'Verifying...' : 'Verify OTP & Show Dukan ID'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}

            {/* STEP 3: REVEAL CREDENTIALS & RESET PASSWORD */}
            {forgotStep === 3 && (
              <form onSubmit={handleResetForgotPass} className="space-y-4">
                
                {/* Recovered Dukan Profile Card */}
                <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 font-medium">Aapki Dukan ID:</span>
                    <span className="font-mono font-bold text-zinc-950 bg-zinc-200 px-2 py-0.5 rounded text-xs">
                      {forgotRecovered?.dukanId}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 font-medium">Dukan Name:</span>
                    <span className="font-bold text-zinc-950">{forgotRecovered?.dukanName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 font-medium">Username:</span>
                    <span className="font-mono font-semibold text-zinc-800">@{forgotRecovered?.username}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-semibold text-zinc-500 mb-1.5">
                    Naya Password Banayein
                  </label>
                  <input
                    type="password"
                    required
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    placeholder="Kam se kam 4 akshar"
                    className="w-full border border-zinc-200 focus:border-zinc-950 px-3.5 py-2 text-xs text-zinc-900 rounded-lg outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-semibold text-zinc-500 mb-1.5">
                    Confirm Naya Password
                  </label>
                  <input
                    type="password"
                    required
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full border border-zinc-200 focus:border-zinc-950 px-3.5 py-2 text-xs text-zinc-900 rounded-lg outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full bg-zinc-950 hover:bg-black text-white py-3 text-xs uppercase tracking-widest font-semibold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <span>{forgotLoading ? 'Updating Password...' : 'Save Password & Sign In'}</span>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </button>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
