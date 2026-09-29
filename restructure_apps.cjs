const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const appsDir = path.join(srcDir, 'apps');
const customerDir = path.join(appsDir, 'customer');
const adminDir = path.join(appsDir, 'admin');

// Create directories
[appsDir, customerDir, adminDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// 1. App.jsx Rewrite
const appCode = `
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import CustomerApp from './apps/customer/CustomerApp';
import AdminApp from './apps/admin/AdminApp';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<CustomerApp />} />
        <Route path="/secret-dukandar-portal-2026/*" element={<AdminApp />} />
      </Routes>
    </BrowserRouter>
  );
}
`;
fs.writeFileSync(path.join(srcDir, 'App.jsx'), appCode.trim(), 'utf8');

// 2. CustomerApp.jsx
const customerAppCode = `
import React from 'react';
import { AuthProvider } from '../../context/AuthContext';
import { RealtimeProvider } from '../../context/RealtimeContext';
import { CartProvider } from '../../context/CartContext';
import Navbar from '../../components/Navbar';
import HeroBanner from '../../components/HeroBanner';
import DealBanners from '../../components/DealBanners';
import MenuSection from '../../components/MenuSection';
import Footer from '../../components/Footer';
import CartDrawer from '../../components/CartDrawer';
import OrderTrackerModal from '../../components/OrderTrackerModal';
import AuthModal from '../../components/AuthModal';
import ProfileDrawer from '../../components/ProfileDrawer';

export default function CustomerApp() {
  const scrollToMenu = () => {
    document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <AuthProvider>
      <RealtimeProvider>
        <CartProvider>
          <div className="min-h-screen bg-[#FFFBF7] text-zinc-900 flex flex-col justify-between selection:bg-[#DC2626] selection:text-white">
            <ProfileDrawer />
            <Navbar />
            <main className="flex-1">
              <HeroBanner onExploreMenu={scrollToMenu} />
              <DealBanners />
              <div id="menu">
                <MenuSection />
              </div>
            </main>
            <Footer />
            <CartDrawer />
            <OrderTrackerModal />
            <AuthModal />
          </div>
        </CartProvider>
      </RealtimeProvider>
    </AuthProvider>
  );
}
`;
fs.writeFileSync(path.join(customerDir, 'CustomerApp.jsx'), customerAppCode.trim(), 'utf8');

// 3. AdminApp.jsx (Completely separate UI)
const adminAppCode = `
import React, { useState, useEffect } from 'react';
import { ChefHat, ShieldCheck, ArrowRight, Lock, KeyRound } from 'lucide-react';
import { API_URL } from '../../config/api';

export default function AdminApp() {
  const [isRegistered, setIsRegistered] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('admin_token'));
  
  useEffect(() => {
    fetch(\`\${API_URL}/api/admin/status\`)
      .then(res => res.json())
      .then(data => setIsRegistered(data.isRegistered))
      .catch(err => console.error(err));
  }, []);

  if (isRegistered === null) return <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center font-mono">LOADING VAULT...</div>;

  if (!token) {
    return isRegistered ? <AdminLogin onLogin={t => setToken(t)} /> : <AdminSetup onSetupComplete={() => setIsRegistered(true)} />;
  }

  // Loaded Admin Dashboard
  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3 text-[#DC2626]">
            <ChefHat className="w-8 h-8" />
            <h1 className="text-2xl font-black tracking-widest uppercase">Shawarma Nights Command Center</h1>
          </div>
          <button onClick={() => { setToken(null); localStorage.removeItem('admin_token'); }} className="px-4 py-2 bg-white/5 hover:bg-red-500/20 text-red-500 rounded-lg text-sm font-bold transition-all border border-red-500/20">
            LOCK VAULT
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h2 className="font-black text-lg mb-4 text-zinc-400 uppercase tracking-widest">Live Orders</h2>
            <div className="text-zinc-600 text-sm">Real-time orders will appear here...</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h2 className="font-black text-lg mb-4 text-zinc-400 uppercase tracking-widest">Menu Manager</h2>
            <div className="text-zinc-600 text-sm">Stock management will appear here...</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h2 className="font-black text-lg mb-4 text-zinc-400 uppercase tracking-widest">Customer DB</h2>
            <div className="text-zinc-600 text-sm">Registered customers and history...</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// Component: Admin Setup (One-Time)
// ----------------------------------------------------
function AdminSetup({ onSetupComplete }) {
  const [formData, setFormData] = useState({ username: '', password: '', ownerPhone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(\`\${API_URL}/api/admin/setup\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        onSetupComplete();
      } else setError(data.message);
    } catch (err) {
      setError('Network Error');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-red-500/30 rounded-3xl p-8 shadow-[0_0_50px_-12px_rgba(220,38,38,0.25)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-orange-500"></div>
        <div className="flex justify-center mb-6 text-red-500"><ShieldCheck className="w-12 h-12" /></div>
        <h2 className="text-2xl font-black text-white text-center uppercase tracking-widest mb-2">Master Registration</h2>
        <p className="text-zinc-400 text-xs text-center mb-8">ONE-TIME SETUP. This locks the system permanently to your credentials.</p>
        
        {error && <div className="bg-red-500/10 text-red-500 border border-red-500/20 p-3 rounded-lg text-xs font-bold mb-4">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Admin Username</label>
            <input required type="text" onChange={e => setFormData({...formData, username: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:border-red-500 focus:outline-none" placeholder="admin" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Master Password</label>
            <input required type="password" onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:border-red-500 focus:outline-none" placeholder="••••••••" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Owner Phone (For 2FA OTP)</label>
            <input required type="tel" maxLength={10} onChange={e => setFormData({...formData, ownerPhone: e.target.value.replace(/\\D/g, '')})} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:border-red-500 focus:outline-none" placeholder="9876543210" />
          </div>
          <button disabled={loading} type="submit" className="w-full py-4 mt-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-lg flex items-center justify-center gap-2">
            LOCK SYSTEM <Lock className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// Component: Admin Login (2FA)
// ----------------------------------------------------
function AdminLogin({ onLogin }) {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [phonePreview, setPhonePreview] = useState('');
  const [error, setError] = useState('');

  const handleStep1 = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(\`\${API_URL}/api/admin/login\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success && data.requireOtp) {
        setPhonePreview(data.ownerPhonePreview);
        setStep(2);
        setError('');
      } else setError(data.message);
    } catch (err) { setError('Network Error'); }
  };

  const handleStep2 = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(\`\${API_URL}/api/admin/verify\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('admin_token', data.token);
        onLogin(data.token);
      } else setError(data.message);
    } catch (err) { setError('Network Error'); }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-8 relative overflow-hidden">
        <div className="flex justify-center mb-6 text-zinc-600"><KeyRound className="w-10 h-10" /></div>
        <h2 className="text-xl font-black text-white text-center uppercase tracking-widest mb-6">Vault Access</h2>
        
        {error && <div className="bg-red-500/10 text-red-500 border border-red-500/20 p-3 rounded-lg text-xs font-bold mb-4">{error}</div>}
        
        {step === 1 ? (
          <form onSubmit={handleStep1} className="space-y-4">
            <input required type="text" onChange={e => setFormData({...formData, username: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:border-red-500 focus:outline-none" placeholder="Admin ID" />
            <input required type="password" onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:border-red-500 focus:outline-none" placeholder="Password" />
            <button type="submit" className="w-full py-4 bg-white hover:bg-zinc-200 text-black rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2">Verify <ArrowRight className="w-4 h-4" /></button>
          </form>
        ) : (
          <form onSubmit={handleStep2} className="space-y-4">
            <div className="text-xs text-center text-zinc-400 mb-4">A 2FA code was sent to the master phone<br/><strong className="text-white">{phonePreview}</strong></div>
            <input required type="text" maxLength={6} onChange={e => setOtp(e.target.value.replace(/\\D/g, ''))} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-center tracking-[0.5em] text-xl text-white focus:border-red-500 focus:outline-none" placeholder="000000" />
            <button type="submit" className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-sm uppercase tracking-widest">Confirm & Login</button>
          </form>
        )}
      </div>
    </div>
  );
}
`;
fs.writeFileSync(path.join(adminDir, 'AdminApp.jsx'), adminAppCode.trim(), 'utf8');

console.log('App split into Customer and Admin successful!');
