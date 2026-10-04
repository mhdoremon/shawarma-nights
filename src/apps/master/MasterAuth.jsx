import React, { useState } from 'react';
import { useMaster } from './context/MasterContext';
import { Store, Bike, Lock, User, ArrowRight, ShieldCheck, Sparkles, Eye, EyeOff, Phone, KeyRound } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MasterAuth() {
  const { loginDukandar, loginDelivery, registerDelivery, showToast } = useMaster();

  const [authRole, setAuthRole] = useState('dukandar'); // 'dukandar' | 'delivery_boy'
  const [storeIdInput, setStoreIdInput] = useState('shawarma');

  // Dukandar Form State
  const [username, setUsername] = useState('Shawarma_Nights');
  const [password, setPassword] = useState('Pvv9yyy8c1');
  const [showPassword, setShowPassword] = useState(false);

  // Delivery Boy Sub-tab: 'login' | 'register'
  const [deliveryAuthMode, setDeliveryAuthMode] = useState('login');

  // Delivery Boy Login Form State
  const [deliveryPhone, setDeliveryPhone] = useState('7427050263');
  const [deliveryPassword, setDeliveryPassword] = useState('Pvv9yyy8c1');
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
      setErrorMessage('Username aur password dono enter karein!');
      return;
    }
    setIsSubmitting(true);
    const res = await loginDukandar(storeIdInput.trim() || 'shawarma', username.trim(), password.trim());
    setIsSubmitting(false);
    if (!res.success) {
      setErrorMessage(res.message || 'Login failed! Kripya sahi credentials dalein.');
    }
  };

  // 2. DELIVERY BOY LOGIN (Phone + Password matching Android app)
  const handleDeliveryLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    const phone = deliveryPhone.trim();
    const pwd = deliveryPassword.trim();

    if (!phone || !pwd) {
      setErrorMessage('Registered mobile number aur password dono dalein!');
      return;
    }

    setIsSubmitting(true);
    const res = await loginDelivery(storeIdInput.trim() || 'shawarma', phone, pwd);
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.message || 'Galat phone number ya password! Kripya sahi credentials dalein.');
    }
  };

  // 3. DELIVERY BOY REGISTRATION (matching Android app)
  const handleDeliveryRegister = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const name = regName.trim();
    const phone = regPhone.trim();
    const vehicle = regVehicle.trim();
    const pwd = regPassword.trim();
    const cPwd = regConfirmPassword.trim();

    if (!name || !phone || !vehicle || !pwd || !cPwd) {
      setErrorMessage('Sabhi fields bharein!');
      return;
    }

    if (phone.replace(/\D/g, '').length < 10) {
      setErrorMessage('Valid 10-digit mobile number dalein!');
      return;
    }

    if (pwd !== cPwd) {
      setErrorMessage('Dono passwords match nahi ho rahe!');
      return;
    }

    if (pwd.length < 4) {
      setErrorMessage('Password kam se kam 4 characters ka hona chahiye!');
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
      setErrorMessage(res.message || 'Registration failed!');
    }
  };

  // Quick Demo Autofills
  const fillDemoDukandar = () => {
    setStoreIdInput('shawarma');
    setUsername('Shawarma_Nights');
    setPassword('Pvv9yyy8c1');
    setErrorMessage('');
    showToast('Shawarma Nights Dukandar credentials filled!', 'info');
  };

  const fillDemoRider = () => {
    setStoreIdInput('shawarma');
    setDeliveryPhone('7427050263');
    setDeliveryPassword('Pvv9yyy8c1');
    setErrorMessage('');
    showToast('Demo Delivery Partner credentials filled!', 'info');
  };

  return (
    <div className="min-h-screen bg-[#FFFBF7] text-zinc-900 flex flex-col justify-between selection:bg-[#DC2626] selection:text-white font-sans p-4 sm:p-6">
      
      {/* Top Brand Banner */}
      <div className="max-w-md w-full mx-auto text-center pt-8 sm:pt-12 space-y-2.5">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white shadow-sm text-xs font-bold text-zinc-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>ChuruOne Smart Cloud Active</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 flex items-center justify-center gap-2">
          <span className="text-[#DC2626]">CHURU</span>
          <span>ONE</span>
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 font-medium">
          Universal Store & Delivery Master Operating System
        </p>
      </div>

      {/* Auth Card Container */}
      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full mx-auto bg-white rounded-[2rem] p-6 sm:p-8 shadow-xl my-6 border-0"
      >
        {/* Main Role Switcher: [ Dukandar ] | [ Delivery Boy ] */}
        <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-zinc-100 mb-6">
          <button
            type="button"
            onClick={() => {
              setAuthRole('dukandar');
              setErrorMessage('');
            }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black tracking-wider uppercase transition-all cursor-pointer border-0 ${
              authRole === 'dukandar' 
                ? 'bg-[#DC2626] text-white shadow-md' 
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Dukandar</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthRole('delivery_boy');
              setErrorMessage('');
            }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black tracking-wider uppercase transition-all cursor-pointer border-0 ${
              authRole === 'delivery_boy' 
                ? 'bg-[#DC2626] text-white shadow-md' 
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Bike className="w-4 h-4" />
            <span>Delivery Boy</span>
          </button>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-red-50 text-red-700 text-xs font-bold border-0">
            {errorMessage}
          </div>
        )}

        {/* ========================================================= */}
        {/* ROLE 1: DUKANDAR LOGIN FORM                               */}
        {/* ========================================================= */}
        {authRole === 'dukandar' ? (
          <form onSubmit={handleDukandarLogin} className="space-y-4">
            
            {/* Store ID input */}
            <div>
              <label className="block text-xs font-black text-zinc-700 uppercase tracking-wider mb-1.5">
                Store ID / Dukan Code
              </label>
              <div className="relative">
                <Store className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={storeIdInput}
                  onChange={(e) => setStoreIdInput(e.target.value.toLowerCase())}
                  placeholder="e.g. shawarma"
                  className="w-full bg-[#FFFBF7] rounded-2xl pl-10 pr-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
                />
              </div>
              <span className="text-[11px] text-zinc-400 block mt-1">Default dukan: <strong>shawarma</strong></span>
            </div>

            {/* Username input */}
            <div>
              <label className="block text-xs font-black text-zinc-700 uppercase tracking-wider mb-1.5">
                Owner Username or Phone
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. Shawarma_Nights or 7023963189"
                  className="w-full bg-[#FFFBF7] rounded-2xl pl-10 pr-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
                />
              </div>
            </div>

            {/* Password input */}
            <div>
              <label className="block text-xs font-black text-zinc-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter store password"
                  className="w-full bg-[#FFFBF7] rounded-2xl pl-10 pr-11 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 border-0 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-full bg-[#DC2626] hover:bg-red-700 active:scale-98 text-white font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-xl disabled:opacity-50 mt-2 border-0"
            >
              <span>{isSubmitting ? 'Authenticating...' : 'Login to Dukandar OS'}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>

            {/* One-Click Demo Credentials */}
            <div className="pt-2">
              <button
                type="button"
                onClick={fillDemoDukandar}
                className="w-full py-2.5 px-3 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border-0"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Fill Shawarma Nights Credentials</span>
              </button>
            </div>

          </form>
        ) : (
          /* ========================================================= */
          /* ROLE 2: DELIVERY BOY PORTAL (Exact Android App Pattern)    */
          /* ========================================================= */
          <div className="space-y-4">
            
            {/* Delivery Sub-switcher: [ 🔐 LOGIN ]  |  [ 📝 REGISTER NEW PARTNER ] */}
            <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-zinc-100">
              <button
                type="button"
                onClick={() => {
                  setDeliveryAuthMode('login');
                  setErrorMessage('');
                }}
                className={`py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-all cursor-pointer border-0 ${
                  deliveryAuthMode === 'login'
                    ? 'bg-[#DC2626] text-white shadow-sm'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                🔐 LOGIN
              </button>

              <button
                type="button"
                onClick={() => {
                  setDeliveryAuthMode('register');
                  setErrorMessage('');
                }}
                className={`py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-all cursor-pointer border-0 ${
                  deliveryAuthMode === 'register'
                    ? 'bg-[#DC2626] text-white shadow-sm'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                📝 REGISTER PARTNER
              </button>
            </div>

            {/* ---------------------------------------------------- */}
            {/* SUB-VIEW A: DELIVERY BOY LOGIN (Phone + Password)     */}
            {/* ---------------------------------------------------- */}
            {deliveryAuthMode === 'login' ? (
              <form onSubmit={handleDeliveryLogin} className="space-y-4 pt-1">
                
                <div>
                  <h3 className="text-sm font-black text-zinc-900">
                    🛵 DELIVERY PARTNER LOGIN
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Apna registered mobile number aur password dalein.
                  </p>
                </div>

                {/* Store ID */}
                <div>
                  <label className="block text-xs font-black text-zinc-700 uppercase tracking-wider mb-1.5">
                    Store ID / Dukan Code
                  </label>
                  <div className="relative">
                    <Store className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={storeIdInput}
                      onChange={(e) => setStoreIdInput(e.target.value.toLowerCase())}
                      placeholder="e.g. shawarma"
                      className="w-full bg-[#FFFBF7] rounded-2xl pl-10 pr-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
                    />
                  </div>
                </div>

                {/* Mobile Phone Number */}
                <div>
                  <label className="block text-xs font-black text-zinc-700 uppercase tracking-wider mb-1.5">
                    Registered Mobile Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={deliveryPhone}
                      onChange={(e) => setDeliveryPhone(e.target.value)}
                      placeholder="10-digit mobile number"
                      className="w-full bg-[#FFFBF7] rounded-2xl pl-10 pr-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label className="block text-xs font-black text-zinc-700 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showDeliveryPassword ? 'text' : 'password'}
                      required
                      value={deliveryPassword}
                      onChange={(e) => setDeliveryPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#FFFBF7] rounded-2xl pl-10 pr-11 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
                    />
                    <button
                      type="button"
                      onClick={() => setShowDeliveryPassword(!showDeliveryPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 border-0 cursor-pointer"
                    >
                      {showDeliveryPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 rounded-full bg-[#DC2626] hover:bg-red-700 active:scale-98 text-white font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-xl disabled:opacity-50 mt-2 border-0"
                >
                  <span>{isSubmitting ? 'Logging in...' : '🔓 LOGIN AS DELIVERY PARTNER'}</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>

                {/* Quick Demo Rider Login Button */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={fillDemoRider}
                    className="w-full py-2.5 px-3 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border-0"
                  >
                    <Bike className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Fill Demo Partner (7427050263 / Pvv9yyy8c1)</span>
                  </button>
                </div>

              </form>
            ) : (
              /* ---------------------------------------------------- */
              /* SUB-VIEW B: REGISTER NEW DELIVERY PARTNER            */
              /* ---------------------------------------------------- */
              <form onSubmit={handleDeliveryRegister} className="space-y-3.5 pt-1">
                
                <div>
                  <h3 className="text-sm font-black text-zinc-900">
                    📝 REGISTER NEW DELIVERY PARTNER
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Naye delivery partner ka registration karein. Har rider ka apna account rahega.
                  </p>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-2.5 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
                  />
                </div>

                {/* Mobile Phone Number */}
                <div>
                  <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
                    Mobile Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-2.5 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
                  />
                </div>

                {/* Vehicle Type & Number */}
                <div>
                  <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
                    Vehicle Type & Number
                  </label>
                  <input
                    type="text"
                    required
                    value={regVehicle}
                    onChange={(e) => setRegVehicle(e.target.value)}
                    placeholder="e.g. Hero Splendor RJ-18-AB-1234"
                    className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-2.5 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
                  />
                </div>

                {/* Create Password */}
                <div>
                  <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
                    Create Password
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#FFFBF7] rounded-2xl px-4 pr-11 py-2.5 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 border-0 cursor-pointer"
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-2.5 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 rounded-full bg-[#DC2626] hover:bg-red-700 active:scale-98 text-white font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-xl disabled:opacity-50 mt-2 border-0"
                >
                  <span>{isSubmitting ? 'Registering...' : '🚀 REGISTER & START DELIVERIES'}</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>

              </form>
            )}

          </div>
        )}

      </motion.div>

      {/* Footer Info */}
      <div className="max-w-md w-full mx-auto text-center pb-6 text-zinc-500 text-xs space-y-1">
        <div className="flex items-center justify-center gap-1.5 font-bold text-zinc-600">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Protected by ChuruOne Multi-Tenant Architecture</span>
        </div>
        <p>© 2026 ChuruOne Technologies. Realtime Gateway Synced.</p>
      </div>

    </div>
  );
}
