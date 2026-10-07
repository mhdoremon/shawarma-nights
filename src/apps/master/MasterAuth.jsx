import React, { useState } from 'react';
import { useMaster } from './context/MasterContext';
import { Store, Bike, Lock, User, ArrowRight, Eye, EyeOff, Phone, AlertCircle, ArrowLeft } from 'lucide-react';
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

  // 1. DUKANDAR LOGIN
  const handleDukandarLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Please enter both username and password.');
      return;
    }
    setIsSubmitting(true);
    const res = await loginDukandar(storeIdInput.trim() || 'shawarma', username.trim(), password.trim());
    setIsSubmitting(false);
    if (!res.success) {
      setErrorMessage(res.message || 'Invalid username or password. Please check your credentials.');
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
                  placeholder="e.g. shawarma or nash-studio"
                  className="w-full border border-zinc-200 focus:border-zinc-950 pl-9 pr-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 outline-none transition-colors"
                />
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

    </div>
  );
}
