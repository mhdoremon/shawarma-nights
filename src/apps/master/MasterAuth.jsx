import React, { useState } from 'react';
import { useMaster } from './context/MasterContext';
import { Store, Bike, Lock, User, KeyRound, ArrowRight, ShieldCheck, Sparkles, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MasterAuth() {
  const { loginDukandar, loginDelivery, showToast } = useMaster();

  const [authRole, setAuthRole] = useState('dukandar'); // 'dukandar' | 'delivery_boy'
  const [storeIdInput, setStoreIdInput] = useState('shawarma');
  const [username, setUsername] = useState('Shawarma_Nights');
  const [password, setPassword] = useState('Pvv9yyy8c1');
  const [showPassword, setShowPassword] = useState(false);
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [deliveryOtp, setDeliveryOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDukandarLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      showToast('Please enter both username and password', 'error');
      return;
    }
    setIsSubmitting(true);
    const res = await loginDukandar(storeIdInput.trim() || 'shawarma', username.trim(), password.trim());
    setIsSubmitting(false);
    if (!res.success) {
      showToast(res.message || 'Login failed', 'error');
    }
  };

  const handleDeliveryLogin = async (e) => {
    e.preventDefault();
    if (!deliveryPhone.trim()) {
      showToast('Please enter delivery partner mobile number', 'error');
      return;
    }
    if (!otpSent) {
      // Simulate/Send OTP
      setOtpSent(true);
      showToast('OTP sent to phone: 1234', 'info');
      return;
    }
    setIsSubmitting(true);
    const res = await loginDelivery(storeIdInput.trim() || 'shawarma', deliveryPhone.trim(), deliveryOtp.trim() || '1234');
    setIsSubmitting(false);
    if (!res.success) {
      showToast(res.message || 'Invalid delivery credentials', 'error');
    }
  };

  const fillDemoCreds = () => {
    setStoreIdInput('shawarma');
    setUsername('Shawarma_Nights');
    setPassword('Pvv9yyy8c1');
    showToast('Shawarma Nights master credentials filled!', 'info');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-between selection:bg-[#DC2626] selection:text-white font-sans p-4 sm:p-6">
      
      {/* Top Brand Banner */}
      <div className="max-w-md w-full mx-auto text-center pt-6 sm:pt-10 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-bold text-zinc-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>ChuruOne Smart Cloud (Live Cluster)</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center justify-center gap-2">
          <span className="text-[#DC2626]">CHURU</span>
          <span>ONE</span>
        </h1>
        <p className="text-xs text-zinc-400 font-medium">
          Universal Store & Delivery Master Operating System
        </p>
      </div>

      {/* Auth Card Container */}
      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full mx-auto bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl my-6"
      >
        {/* Dual Role Segmented Control (Exact Android App Style) */}
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-zinc-950 border border-zinc-800 mb-6">
          <button
            type="button"
            onClick={() => setAuthRole('dukandar')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black tracking-wider uppercase transition-all cursor-pointer ${
              authRole === 'dukandar' 
                ? 'bg-[#DC2626] text-white shadow-md' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Dukandar</span>
          </button>

          <button
            type="button"
            onClick={() => setAuthRole('delivery_boy')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black tracking-wider uppercase transition-all cursor-pointer ${
              authRole === 'delivery_boy' 
                ? 'bg-[#DC2626] text-white shadow-md' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Bike className="w-4 h-4" />
            <span>Delivery Boy</span>
          </button>
        </div>

        {/* ROLE 1: DUKANDAR LOGIN FORM */}
        {authRole === 'dukandar' ? (
          <form onSubmit={handleDukandarLogin} className="space-y-4">
            
            {/* Store ID input */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                Store ID / Dukan Code
              </label>
              <div className="relative">
                <Store className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={storeIdInput}
                  onChange={(e) => setStoreIdInput(e.target.value)}
                  placeholder="e.g. shawarma"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#DC2626] transition-colors"
                />
              </div>
              <span className="text-[10px] text-zinc-500 block mt-1">Default dukan: <strong>shawarma</strong></span>
            </div>

            {/* Username input */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                Owner Username or Phone
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. Shawarma_Nights or 7023963189"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#DC2626] transition-colors"
                />
              </div>
            </div>

            {/* Password input */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter store password"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl pl-10 pr-11 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#DC2626] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#DC2626] hover:bg-red-700 active:scale-98 text-white font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50 mt-2"
            >
              <span>{isSubmitting ? 'Authenticating...' : 'Login to Dukandar OS'}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>

            {/* One-Click Demo Credentials */}
            <div className="pt-2">
              <button
                type="button"
                onClick={fillDemoCreds}
                className="w-full py-2 px-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Fill Shawarma Nights Credentials</span>
              </button>
            </div>

          </form>
        ) : (
          /* ROLE 2: DELIVERY BOY LOGIN FORM */
          <form onSubmit={handleDeliveryLogin} className="space-y-4">
            
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                Store ID
              </label>
              <div className="relative">
                <Store className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={storeIdInput}
                  onChange={(e) => setStoreIdInput(e.target.value)}
                  placeholder="e.g. shawarma"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#DC2626] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                Delivery Boy Mobile Phone
              </label>
              <input
                type="tel"
                required
                value={deliveryPhone}
                onChange={(e) => setDeliveryPhone(e.target.value)}
                placeholder="e.g. +91 7023963189"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#DC2626] transition-colors"
              />
            </div>

            {otpSent && (
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Verification Code (OTP)
                </label>
                <input
                  type="text"
                  required
                  value={deliveryOtp}
                  onChange={(e) => setDeliveryOtp(e.target.value)}
                  placeholder="Enter 4-digit OTP"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#DC2626] transition-colors text-center tracking-widest font-black"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#DC2626] hover:bg-red-700 active:scale-98 text-white font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50 mt-2"
            >
              <span>{otpSent ? (isSubmitting ? 'Verifying...' : 'Verify OTP & Start Shift') : 'Send Rider OTP'}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>

          </form>
        )}

      </motion.div>

      {/* Footer Info */}
      <div className="max-w-md w-full mx-auto text-center pb-4 text-zinc-600 text-xs space-y-1">
        <div className="flex items-center justify-center gap-1.5 font-bold text-zinc-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Protected by ChuruOne Multi-Tenant Architecture</span>
        </div>
        <p>© 2026 ChuruOne Technologies. Realtime Gateway Synced.</p>
      </div>

    </div>
  );
}
