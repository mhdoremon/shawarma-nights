import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowUpRight, 
  Search, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  Store, 
  Smartphone, 
  ArrowRight,
  SlidersHorizontal,
  Star,
  User,
  LogOut,
  ChevronDown,
  CheckCircle2,
  Phone,
  Mail,
  Sparkles,
  Zap,
  Building2,
  ExternalLink,
  ShieldAlert,
  Compass
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import LegalPoliciesModal from '../../components/LegalPoliciesModal';
import { 
  getChuruOneSession, 
  setChuruOneSession, 
  clearChuruOneSession, 
  attachSsoParams 
} from '../../utils/ssoHelper';

export default function ChuruOneHomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState('terms');

  // Unified ChuruOne SSO User State
  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState('');
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef(null);

  // Sync SSO session on mount (from URL redirect, Cookie or LocalStorage)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlUserRaw = params.get('churuone_user');
      const urlToken = params.get('churuone_token');

      if (urlUserRaw) {
        const parsed = JSON.parse(decodeURIComponent(urlUserRaw));
        setCurrentUser(parsed);
        setAuthToken(urlToken || '');
        setChuruOneSession(parsed, urlToken || '');

        // Clean query params from URL without refreshing
        params.delete('churuone_user');
        params.delete('churuone_token');
        params.delete('account_created');
        const cleanUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : '');
        window.history.replaceState({}, document.title, cleanUrl);
        return;
      }

      // Check existing cross-domain session
      const session = getChuruOneSession();
      if (session && session.user) {
        setCurrentUser(session.user);
        setAuthToken(session.token || '');
      }
    } catch (err) {
      console.warn('SSO sync warning in ChuruOneHomePage:', err);
    }
  }, []);

  // Close account dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target)) {
        setIsAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-scroll to #about section if URL path or hash contains about/contact
  useEffect(() => {
    if (window.location.hash === '#about' || window.location.pathname.includes('/about') || window.location.pathname.includes('/contact')) {
      setTimeout(() => {
        const el = document.getElementById('about');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  }, []);

  const handleLogout = () => {
    clearChuruOneSession();
    setCurrentUser(null);
    setAuthToken('');
    setIsAccountMenuOpen(false);
  };

  const openLegalModal = (tab = 'terms') => {
    setLegalTab(tab);
    setLegalModalOpen(true);
  };

  // Resolve store destination URL dynamically based on environment with SSO params
  const getStoreUrl = (storeId) => {
    const isLocal = typeof window !== 'undefined' && (
      window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.includes('.onrender.com')
    );

    let base = `/?storeId=${storeId}`;
    if (storeId === 'shawarma') {
      base = '/shawarma';
    } else if (storeId === 'nash-studio') {
      base = '/nash';
    }

    if (currentUser) {
      return attachSsoParams(base, currentUser, authToken);
    }
    return base;
  };

  // Only the authentic, active city partners (no dummy upcoming data)
  const stores = [
    {
      id: 'shawarma',
      name: 'Shawarma Nights',
      category: 'dining',
      categoryLabel: 'Culinary & Dining',
      tagline: 'Authentic Charcoal Shawarma, Gourmet Burgers & Lebanese Wraps',
      description: 'Slow-roasted charcoal meats, freshly baked pita, and signature garlic toum crafted daily in Churu.',
      timing: '20–25 Min Delivery',
      minOrder: '₹99 Min Order',
      rating: '4.9',
      reviews: '1,200+ orders',
      location: 'Subhash Chowk, Churu',
      image: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=1200&q=85',
      ctaText: 'View Menu & Order'
    },
    {
      id: 'nash-studio',
      name: 'Nash Studio',
      category: 'salon',
      categoryLabel: 'Salon & Grooming',
      tagline: 'Precision Grooming, Luxury Skin Fades & Beard Sculpting',
      description: 'Private appointment-based grooming lounge for gentlemen. Zero wait-time with advance slot reservations.',
      timing: 'Appointment Booking',
      minOrder: '₹50 Token Advance',
      rating: '4.9',
      reviews: '450+ appointments',
      location: 'Main Market, Churu',
      image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=85',
      ctaText: 'Reserve Appointment'
    }
  ];

  const filteredStores = stores.filter(store => {
    const matchesCategory = selectedCategory === 'all' || store.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      store.name.toLowerCase().includes(q) || 
      store.tagline.toLowerCase().includes(q) ||
      store.description.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#07090E] text-zinc-100 font-sans antialiased selection:bg-amber-400 selection:text-black">
      
      {/* ─── Ambient Glow Gradients (Apple / Vercel Aesthetic) ────── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-[300px] left-1/2 -translate-x-1/2 w-[800px] sm:w-[1200px] h-[600px] bg-gradient-to-b from-blue-600/10 via-purple-600/5 to-transparent blur-[140px] opacity-70" />
        <div className="absolute top-[35%] -left-[200px] w-[500px] h-[500px] bg-amber-500/5 blur-[120px] rounded-full" />
        <div className="absolute top-[60%] -right-[200px] w-[600px] h-[600px] bg-emerald-500/5 blur-[140px] rounded-full" />
        {/* Subtle grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.7) 1px, transparent 0)`,
            backgroundSize: '36px 36px'
          }}
        />
      </div>

      {/* ─── Top Brand Navigation Bar (Glassmorphic) ──────────────── */}
      <header className="border-b border-white/[0.07] bg-[#07090E]/80 backdrop-blur-2xl sticky top-0 z-50 transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between relative z-10">
          
          {/* Logo / Brand Mark (Iconic C1 Badge) */}
          <Link to="/" className="flex items-center gap-3.5 group" aria-label="ChuruOne Home">
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-950 p-[1px] shadow-lg shadow-black/50 group-hover:scale-105 transition-all duration-300">
              <div className="w-full h-full rounded-[11px] bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10 group-hover:border-amber-400/40 transition-colors">
                <span className="font-mono font-black text-xs sm:text-sm tracking-wider text-white group-hover:text-amber-300 transition-colors">
                  C1
                </span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm sm:text-base tracking-[0.2em] text-white uppercase group-hover:text-zinc-200 transition-colors leading-none">
                CHURUONE
              </span>
              <span className="text-[9px] uppercase tracking-[0.28em] text-zinc-400 font-mono mt-1 leading-none">
                CITY HUB
              </span>
            </div>
          </Link>

          {/* Action Buttons & Unified Account Pill */}
          <div className="flex items-center gap-4 sm:gap-6 relative" ref={accountMenuRef}>
            <a
              href="#about"
              className="text-xs uppercase tracking-widest font-semibold text-zinc-400 hover:text-white transition-colors hidden sm:inline-flex items-center gap-1.5"
            >
              <span>About & Contact</span>
            </a>
            
            {currentUser ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsAccountMenuOpen(prev => !prev)}
                  className="bg-zinc-900/90 hover:bg-zinc-800/90 text-white text-xs tracking-wider font-medium px-3.5 py-2 rounded-xl transition-all inline-flex items-center gap-2.5 cursor-pointer border border-white/10 hover:border-white/20 shadow-lg shadow-black/40"
                >
                  {currentUser.picture || currentUser.photoURL ? (
                    <img 
                      src={currentUser.picture || currentUser.photoURL} 
                      alt="" 
                      className="w-4 h-4 rounded-full object-cover ring-1 ring-white/20"
                    />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-amber-500 to-amber-200 flex items-center justify-center text-[9px] font-bold text-black">
                      {(currentUser.name || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="font-semibold max-w-[120px] truncate text-zinc-200">
                    {(currentUser.name || currentUser.displayName || 'Account').split(' ')[0]}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${isAccountMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dark Luxury Account Dropdown */}
                <AnimatePresence>
                  {isAccountMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.16, ease: "easeOut" }}
                      className="absolute right-0 mt-2.5 w-72 bg-[#0E131F]/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl shadow-black/80 z-50 p-4 text-left"
                    >
                      <div className="pb-3 border-b border-white/10">
                        <div className="flex items-center gap-2 mb-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400 font-bold">
                            ChuruOne Unified ID
                          </span>
                        </div>
                        <div className="font-bold text-sm text-white truncate">
                          {currentUser.name || currentUser.displayName || 'Customer'}
                        </div>
                        {currentUser.email && (
                          <div className="text-xs text-zinc-400 font-mono truncate mt-0.5">
                            {currentUser.email}
                          </div>
                        )}
                        {(currentUser.phone || currentUser.phoneNumber) && (
                          <div className="text-xs text-amber-300/90 font-mono mt-0.5">
                            📱 {currentUser.phone || currentUser.phoneNumber}
                          </div>
                        )}
                      </div>

                      <div className="py-3 text-[11px] text-zinc-400 leading-relaxed">
                        Aapka yeh unified profile Shawarma Nights aur Nash Studio par directly synced hai.
                      </div>

                      <div className="pt-2 border-t border-white/10">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full text-left py-2 px-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors flex items-center justify-between cursor-pointer"
                        >
                          <span>Sign Out from ChuruOne</span>
                          <LogOut className="w-3.5 h-3.5 stroke-[2]" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link 
                to="/auth" 
                className="relative group rounded-xl p-[1px] overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-200 rounded-xl transition-all duration-300 group-hover:opacity-90 opacity-70" />
                <div className="relative bg-[#0E131F] rounded-[11px] px-4 py-2 flex items-center gap-2 transition-all duration-300 group-hover:bg-opacity-80">
                  <User className="w-3.5 h-3.5 text-amber-300 stroke-[2]" />
                  <span className="text-xs uppercase tracking-widest font-semibold text-white">Sign In</span>
                </div>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ─── Hero Section with Modern Apple/Vercel Dark Aesthetic ─── */}
      <section className="relative overflow-hidden pt-16 pb-12 sm:pt-24 sm:pb-20 border-b border-white/[0.06] z-10">
        
        {/* Subtle Decorative Geometry */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-r from-amber-500/10 via-rose-500/5 to-blue-500/10 blur-[100px] pointer-events-none rounded-full" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center z-10">
          
          {/* Continuous Live Radar Status Badge */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/40 backdrop-blur-md mb-6 shadow-lg shadow-emerald-950/40"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] uppercase tracking-[0.25em] font-mono font-semibold text-emerald-300">
              CHURU DIRECTORY • LIVE NETWORK
            </span>
          </motion.div>

          {/* Keyframes for Continuous Brand Shimmer */}
          <style>{`
            @keyframes churuDarkShimmer {
              0% { background-position: 0% center; }
              100% { background-position: 200% center; }
            }
          `}</style>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Main Brand Title */}
            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
              className="inline-block"
            >
              <h1 
                className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tight uppercase leading-none select-none"
                style={{
                  background: 'linear-gradient(90deg, #FFFFFF 0%, #E2E8F0 25%, #94A3B8 50%, #E2E8F0 75%, #FFFFFF 100%)',
                  backgroundSize: '200% auto',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  animation: 'churuDarkShimmer 6s linear infinite'
                }}
              >
                CHURUONE
              </h1>
            </motion.div>

            {/* City Directory Subtitle */}
            <div className="flex items-center justify-center gap-3 mt-4 sm:mt-5">
              <span className="h-[1px] w-8 sm:w-16 bg-gradient-to-r from-transparent via-amber-400/40 to-transparent"></span>
              <span className="text-xs sm:text-sm font-semibold tracking-[0.35em] uppercase text-zinc-400">
                DIRECT CITY COMMERCE
              </span>
              <span className="h-[1px] w-8 sm:w-16 bg-gradient-to-r from-transparent via-amber-400/40 to-transparent"></span>
            </div>

            <p className="mt-4 text-xs sm:text-base text-zinc-400 max-w-xl mx-auto font-normal leading-relaxed">
              Direct store ordering, authentic in-store pricing & zero-aggregator markups. Discover Churu&apos;s finest culinary and grooming hubs.
            </p>
          </motion.div>

          {/* Premium Search & Filter Bar */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 sm:mt-12 max-w-xl mx-auto"
          >
            <div className="relative rounded-2xl bg-zinc-900/70 border border-white/10 backdrop-blur-xl p-2 flex items-center gap-2 focus-within:border-amber-400/60 focus-within:ring-2 focus-within:ring-amber-400/20 shadow-2xl shadow-black/80 transition-all">
              <Search className="w-4 h-4 text-zinc-400 ml-2.5 shrink-0 stroke-[2]" />
              <input
                type="text"
                placeholder="Search establishment, dining, or salon..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none py-1.5"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="text-[10px] uppercase font-semibold text-zinc-400 hover:text-white px-3 py-1 rounded-lg bg-white/5 tracking-wider transition-colors"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Modern Pill Filter Tabs */}
            <div className="flex items-center justify-center gap-2 sm:gap-3 mt-6">
              {[
                { id: 'all', label: 'All Partners' },
                { id: 'dining', label: 'Culinary & Dining' },
                { id: 'salon', label: 'Salon & Grooming' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`text-xs uppercase tracking-wider px-3.5 py-1.5 rounded-xl transition-all duration-200 cursor-pointer ${
                    selectedCategory === tab.id
                      ? 'bg-white text-zinc-950 font-bold shadow-md shadow-white/10'
                      : 'text-zinc-400 hover:text-white bg-white/[0.03] border border-white/[0.05] hover:border-white/10'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </motion.div>

        </div>
      </section>

      {/* ─── Continuous Live Marquee Ticker ───────────────────────── */}
      <div className="w-full overflow-hidden border-b border-white/[0.06] bg-white/[0.02] backdrop-blur-md py-3 relative z-10">
        <motion.div
          className="flex items-center gap-8 whitespace-nowrap text-[10px] sm:text-[11px] font-mono font-semibold tracking-[0.25em] uppercase text-zinc-400"
          animate={{ x: [0, -1080] }}
          transition={{ repeat: Infinity, ease: "linear", duration: 25 }}
        >
          {[
            'SHAWARMA NIGHTS • CHARCOAL GRILL',
            'DIRECT UPI SETTLEMENT',
            'NASH STUDIO • LUXURY GROOMING',
            '0% AGGREGATOR COMMISSION',
            'CHURUONE VERIFIED NETWORK',
            'DIRECT KITCHEN SYNC',
            'REALTIME DUKANDAR OS',
            'SHAWARMA NIGHTS • CHARCOAL GRILL',
            'DIRECT UPI SETTLEMENT',
            'NASH STUDIO • LUXURY GROOMING',
            '0% AGGREGATOR COMMISSION',
            'CHURUONE VERIFIED NETWORK',
            'DIRECT KITCHEN SYNC',
            'REALTIME DUKANDAR OS'
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-8 shrink-0">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80"></span>
                <span>{item}</span>
              </span>
              <span className="text-zinc-700 font-light select-none">/</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ─── Establishments Grid (High-End Dark Editorial) ────────── */}
      <section className="py-16 sm:py-24 max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        
        <div className="flex items-center justify-between mb-8 pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <Compass className="w-4 h-4 text-amber-400" />
            <span className="text-xs uppercase tracking-[0.25em] font-mono font-semibold text-zinc-300">
              ACTIVE HUBS ({filteredStores.length})
            </span>
          </div>
          <span className="text-xs text-zinc-400 font-mono">
            Direct Delivery & Slot Reservation
          </span>
        </div>

        {/* Store Cards Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10"
        >
          {filteredStores.map((store) => {
            const destinationUrl = getStoreUrl(store.id);

            return (
              <div 
                key={store.id}
                className="group relative rounded-3xl overflow-hidden border border-white/[0.08] bg-[#0E131F]/60 backdrop-blur-xl hover:border-white/20 transition-all duration-500 hover:shadow-2xl hover:shadow-black/80 flex flex-col justify-between"
              >
                <div>
                  {/* Image Viewport with Rich Overlay */}
                  <a 
                    href={destinationUrl} 
                    className="block relative h-64 sm:h-72 w-full overflow-hidden bg-zinc-950"
                  >
                    <img 
                      src={store.image} 
                      alt={store.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out opacity-90 group-hover:opacity-100"
                    />

                    {/* Gradient Shade on Image */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0E131F] via-transparent to-black/40" />

                    {/* Overlay Badges */}
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                      <span className="bg-black/70 backdrop-blur-md border border-emerald-500/40 text-emerald-300 text-[9px] uppercase tracking-[0.2em] font-mono font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
                        </span>
                        <span>OPEN NOW</span>
                      </span>
                      <span className="bg-black/70 backdrop-blur-md border border-white/10 text-zinc-300 text-[9px] uppercase tracking-[0.2em] font-medium px-2.5 py-1 rounded-full">
                        {store.categoryLabel}
                      </span>
                    </div>

                    <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-md border border-white/15 px-2.5 py-1 rounded-full text-xs font-semibold text-amber-300 flex items-center gap-1.5 shadow-lg">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="font-mono">{store.rating}</span>
                    </div>
                  </a>

                  {/* Editorial Body */}
                  <div className="p-6 sm:p-8">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white group-hover:text-amber-300 transition-colors">
                          {store.name}
                        </h2>
                        <p className="text-xs text-amber-200/80 font-medium mt-1">
                          {store.tagline}
                        </p>
                      </div>

                      <a 
                        href={destinationUrl} 
                        className="w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:bg-white/10 transition-all shrink-0"
                        aria-label={`Open ${store.name}`}
                      >
                        <ArrowUpRight className="w-5 h-5 stroke-[2]" />
                      </a>
                    </div>

                    <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mt-3 line-clamp-2">
                      {store.description}
                    </p>

                    {/* Metadata Badges */}
                    <div className="mt-6 pt-5 border-t border-white/[0.08] flex items-center justify-between text-xs text-zinc-400 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span className="font-mono text-[11px]">{store.timing}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span className="truncate max-w-[130px]">{store.location}</span>
                      </div>
                      <div className="font-mono text-[11px] text-amber-300/90 font-semibold">
                        {store.minOrder}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Direct Action Link */}
                <div className="p-6 sm:p-8 pt-0">
                  <a
                    href={destinationUrl}
                    className="w-full bg-white hover:bg-amber-400 hover:text-black text-zinc-950 py-3.5 px-5 rounded-2xl text-xs uppercase tracking-[0.18em] font-bold flex items-center justify-center gap-2 transition-all duration-300 shadow-xl shadow-black/50"
                  >
                    <span>{store.ctaText}</span>
                    <ArrowRight className="w-4 h-4 stroke-[2]" />
                  </a>
                </div>
              </div>
            );
          })}
        </motion.div>

        {filteredStores.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-zinc-900/40 backdrop-blur-xl p-12 text-center my-8">
            <Store className="w-8 h-8 text-zinc-500 mx-auto mb-3 stroke-[1.5]" />
            <h3 className="text-base font-semibold text-white">No establishments match your search</h3>
            <p className="text-xs text-zinc-400 mt-1">Try another keyword or reset the category filter.</p>
          </div>
        )}
      </section>

      {/* ─── Elevated Editorial About Section (Dark Luxury) ───────── */}
      <section id="about" className="py-20 sm:py-28 bg-[#05070B] border-t border-white/[0.08] scroll-mt-20 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          
          {/* Section Header */}
          <div className="max-w-2xl mb-14">
            <span className="text-[10px] font-mono font-semibold tracking-[0.3em] uppercase text-amber-400/90 block mb-2.5">
              01 / PLATFORM ARCHITECTURE & ABOUT US
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              Direct City Commerce Protocol.
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-4 leading-relaxed font-normal">
              ChuruOne provides dedicated digital commerce infrastructure for premier local merchants, eliminating third-party aggregator markups while offering authentic in-store pricing to citizens.
            </p>
          </div>

          {/* 3 Luxury Architectural Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            
            <div className="rounded-3xl border border-white/[0.08] bg-[#0E131F]/50 backdrop-blur-xl p-7 sm:p-8 flex flex-col justify-between hover:border-amber-400/30 transition-all duration-300 shadow-xl shadow-black/40">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-xs font-mono tracking-widest text-zinc-400 font-bold">
                    01
                  </span>
                  <span className="text-[10px] uppercase font-mono tracking-[0.2em] font-semibold text-amber-300 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-full">
                    0% Commission
                  </span>
                </div>
                <h3 className="text-lg font-bold tracking-tight text-white">
                  Authentic Direct Stores
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed mt-2.5">
                  Each verified partner operates their own official digital store with transparent menus, original recipes, and zero aggregator price inflation.
                </p>
              </div>
              <div className="mt-8 pt-5 border-t border-white/[0.08] flex items-center gap-2 text-xs font-medium text-zinc-400">
                <Store className="w-4 h-4 text-amber-400" />
                <span>True In-Store Rates</span>
              </div>
            </div>

            <div className="rounded-3xl border border-white/[0.08] bg-[#0E131F]/50 backdrop-blur-xl p-7 sm:p-8 flex flex-col justify-between hover:border-emerald-400/30 transition-all duration-300 shadow-xl shadow-black/40">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-xs font-mono tracking-widest text-zinc-400 font-bold">
                    02
                  </span>
                  <span className="text-[10px] uppercase font-mono tracking-[0.2em] font-semibold text-emerald-300 bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-1 rounded-full">
                    Direct UPI Settle
                  </span>
                </div>
                <h3 className="text-lg font-bold tracking-tight text-white">
                  Instant Bank Settlement
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed mt-2.5">
                  100% of order totals and advance booking tokens settle straight into verified merchant bank accounts without third-party escrow delay.
                </p>
              </div>
              <div className="mt-8 pt-5 border-t border-white/[0.08] flex items-center gap-2 text-xs font-medium text-zinc-400">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span>Zero Escrow Intermediaries</span>
              </div>
            </div>

            <div className="rounded-3xl border border-white/[0.08] bg-[#0E131F]/50 backdrop-blur-xl p-7 sm:p-8 flex flex-col justify-between hover:border-purple-400/30 transition-all duration-300 shadow-xl shadow-black/40">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-xs font-mono tracking-widest text-zinc-400 font-bold">
                    03
                  </span>
                  <span className="text-[10px] uppercase font-mono tracking-[0.2em] font-semibold text-purple-300 bg-purple-400/10 border border-purple-400/20 px-2.5 py-1 rounded-full">
                    Universal SSO
                  </span>
                </div>
                <h3 className="text-lg font-bold tracking-tight text-white">
                  Unified Citizen Identity
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed mt-2.5">
                  One master ChuruOne account securely connects food delivery, salon appointments, and future municipal services with complete privacy.
                </p>
              </div>
              <div className="mt-8 pt-5 border-t border-white/[0.08] flex items-center gap-2 text-xs font-medium text-zinc-400">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span>Privacy-First Architecture</span>
              </div>
            </div>

          </div>

          {/* Minimalist Trust & Status Strip */}
          <div className="mt-12 py-5 px-6 sm:px-8 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-md flex flex-wrap items-center justify-between gap-4 text-xs text-zinc-400 font-medium">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-zinc-300 font-semibold">Direct Store Ordering</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>Zero Aggregator Commission</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              <span>Direct Merchant UPI</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Realtime Dukandar Sync</span>
            </div>
          </div>

          {/* ─── Official Desk & Direct Contact Card (PhonePe Compliant) ─── */}
          <div className="mt-12 rounded-3xl border border-white/10 bg-gradient-to-br from-[#0F1424] via-[#0B0F19] to-[#07090E] p-7 sm:p-10 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
              <div>
                <span className="text-[10px] font-mono font-semibold tracking-[0.25em] uppercase text-amber-400/90 block mb-1.5">
                  OFFICIAL DESK & LEGAL ENTITY DETAILS
                </span>
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  ChuruOne Headquarters & Support Desk
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 mt-2 max-w-xl leading-relaxed">
                  Owned and operated by <strong className="text-zinc-200 font-semibold">Vasudhaiva Kutumbakam Robotics</strong> (Proprietor: <strong className="text-zinc-200 font-semibold">Mehtab Hussain</strong>). For citizen inquiries, merchant onboarding, or order assistance, connect directly with our Churu operations desk.
                </p>
                <div className="mt-4 space-y-1.5 text-xs text-zinc-400">
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-zinc-300 font-medium">50, Churu bhaiji chowk, Churu, Rajasthan, PIN - 331001</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-zinc-400 font-mono text-[11px]">
                    <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Operating Hours: 10:00 AM - 10:00 PM (Monday to Sunday)</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 sm:gap-5">
                <a
                  href="mailto:Mehtabh864@gmail.com"
                  className="group flex items-center gap-3.5 px-5 py-4 rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/10 hover:border-amber-400/40 transition-all text-xs font-semibold text-white shadow-lg"
                >
                  <Mail className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                  <div className="text-left">
                    <span className="text-[10px] text-zinc-400 block font-mono font-normal uppercase tracking-wider">Official Email</span>
                    <span className="font-mono text-zinc-200">Mehtabh864@gmail.com</span>
                  </div>
                </a>

                <a
                  href="tel:+917023963189"
                  className="group flex items-center gap-3.5 px-5 py-4 rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/10 hover:border-emerald-400/40 transition-all text-xs font-semibold text-white shadow-lg"
                >
                  <Phone className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <div className="text-left">
                    <span className="text-[10px] text-zinc-400 block font-mono font-normal uppercase tracking-wider">Direct Helpline</span>
                    <span className="font-mono text-zinc-200">+91 70239 63189</span>
                  </div>
                </a>
              </div>
            </div>
          </div>

          {/* Minimal Merchant Access Link */}
          <div className="mt-12 pt-8 border-t border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xs uppercase tracking-wider font-semibold text-white">
                Operating a store or salon in Churu?
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Manage orders, configure menus, and track appointments via Dukandar Portal.
              </p>
            </div>

            <a
              href="/admin"
              className="text-xs uppercase tracking-widest font-semibold text-amber-300 hover:text-amber-200 border-b border-amber-400/40 pb-0.5 transition-colors inline-flex items-center gap-2"
            >
              <span>Access Dukandar Portal</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2]" />
            </a>
          </div>

        </div>
      </section>

      {/* ─── Architectural Dark Luxury Footer ─────────────────────── */}
      <footer className="border-t border-white/[0.08] bg-[#040609] py-14 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 text-xs text-zinc-400">
            <div>
              <div className="font-black tracking-[0.25em] uppercase text-white text-base flex items-center gap-2">
                <span>CHURUONE</span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-amber-300 border border-white/10">v2.0</span>
              </div>
              <p className="text-xs text-zinc-400 mt-1.5">
                Churu, Rajasthan 331001 • Direct Commerce Infrastructure
              </p>
              <div className="flex items-center flex-wrap gap-4 mt-3 text-xs text-zinc-300">
                <a href="mailto:contact@churuone.in" className="inline-flex items-center gap-1.5 hover:text-amber-300 font-mono transition-colors">
                  <Mail className="w-3.5 h-3.5 text-zinc-400" />
                  <span>contact@churuone.in</span>
                </a>
                <span className="text-zinc-600">•</span>
                <a href="tel:+917023963189" className="inline-flex items-center gap-1.5 hover:text-amber-300 font-mono transition-colors">
                  <Phone className="w-3.5 h-3.5 text-zinc-400" />
                  <span>+91 70239 63189</span>
                </a>
              </div>
            </div>

            <div className="flex items-center flex-wrap gap-6 text-zinc-400 text-xs font-medium uppercase tracking-wider">
              <a href="#about" className="hover:text-white transition-colors">
                About & Contact
              </a>
              <a href={getStoreUrl('shawarma')} className="hover:text-white transition-colors">
                Shawarma Nights
              </a>
              <a href={getStoreUrl('nash-studio')} className="hover:text-white transition-colors">
                Nash Studio
              </a>
              <Link to="/admin" className="hover:text-white transition-colors">
                Merchant OS
              </Link>
              <Link to="/auth" className="hover:text-white transition-colors">
                Account
              </Link>
            </div>
          </div>

          {/* Legal Compliance Policy Links with Bot-Crawlable Standard Anchor Tags */}
          <div className="pt-6 border-t border-white/[0.08] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-zinc-400">
            <div className="flex items-center flex-wrap gap-4 sm:gap-6 font-medium">
              <a 
                href="/contact-us" 
                className="hover:text-amber-300 transition-colors"
              >
                Contact Us
              </a>
              <a 
                href="/terms-and-conditions" 
                className="hover:text-amber-300 transition-colors"
              >
                Terms & Conditions
              </a>
              <a 
                href="/privacy-policy" 
                className="hover:text-amber-300 transition-colors"
              >
                Privacy Policy
              </a>
              <a 
                href="/refund-policy" 
                className="hover:text-amber-300 transition-colors"
              >
                Refund & Cancellation
              </a>
              <a 
                href="/shipping-policy" 
                className="hover:text-amber-300 transition-colors"
              >
                Shipping Policy
              </a>
            </div>

            <div className="text-zinc-400 text-[11px] font-mono">
              Approved refunds processed in 5 to 7 business days • Delivery in 30 to 45 mins
            </div>
          </div>

          <div className="pt-4 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
            <span>© 2026 ChuruOne. A unit of Vasudhaiva Kutumbakam Robotics. All rights reserved.</span>
            <span className="font-mono text-[11px]">Registered Address: 50, Churu bhaiji chowk, Churu, Rajasthan, PIN - 331001</span>
          </div>
        </div>
      </footer>

      {/* Legal Policies Modal */}
      <LegalPoliciesModal
        isOpen={legalModalOpen}
        onClose={() => setLegalModalOpen(false)}
        initialTab={legalTab}
        entity="churuone"
      />

    </div>
  );
}
