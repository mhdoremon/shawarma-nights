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

  // Set browser title
  useEffect(() => {
    document.title = "ChuruOne | City Directory & Local Commerce";
  }, []);

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

  // Only the authentic, active city partners
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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased selection:bg-slate-900 selection:text-white">
      
      {/* ─── Top Brand Navigation Bar ────────────────────────────── */}
      <header className="border-b border-slate-200/90 bg-white/95 backdrop-blur-md sticky top-0 z-50 transition-all shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          
          {/* Logo / Brand Mark */}
          <Link to="/" className="flex items-center gap-3 group" aria-label="ChuruOne Home">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-mono font-bold text-xs sm:text-sm shadow-xs group-hover:bg-slate-800 transition-colors">
              C1
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm sm:text-base tracking-[0.16em] text-slate-950 uppercase leading-none">
                CHURUONE
              </span>
              <span className="text-[9px] uppercase tracking-[0.24em] text-slate-500 font-mono mt-1 leading-none">
                CITY HUB
              </span>
            </div>
          </Link>

          {/* Action Buttons & Unified Account Pill */}
          <div className="flex items-center gap-4 sm:gap-6 relative" ref={accountMenuRef}>
            <a
              href="#about"
              className="text-xs uppercase tracking-wider font-semibold text-slate-600 hover:text-slate-950 transition-colors hidden sm:inline-flex items-center gap-1.5"
            >
              <span>About & Services</span>
            </a>
            
            {currentUser ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsAccountMenuOpen(prev => !prev)}
                  className="bg-slate-100 hover:bg-slate-200/80 text-slate-900 text-xs tracking-wider font-semibold px-3.5 py-2 rounded-xl transition-all inline-flex items-center gap-2.5 cursor-pointer border border-slate-200 shadow-xs"
                >
                  {currentUser.picture || currentUser.photoURL ? (
                    <img 
                      src={currentUser.picture || currentUser.photoURL} 
                      alt="" 
                      className="w-4 h-4 rounded-full object-cover ring-1 ring-slate-300"
                    />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[9px] font-bold">
                      {(currentUser.name || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="max-w-[120px] truncate text-slate-800">
                    {(currentUser.name || currentUser.displayName || 'Account').split(' ')[0]}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${isAccountMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Light Clean Account Dropdown */}
                <AnimatePresence>
                  {isAccountMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2.5 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-4 text-left"
                    >
                      <div className="pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-1.5 mb-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-700 font-bold">
                            ChuruOne Unified ID
                          </span>
                        </div>
                        <div className="font-bold text-sm text-slate-900 truncate">
                          {currentUser.name || currentUser.displayName || 'Customer'}
                        </div>
                        {currentUser.email && (
                          <div className="text-xs text-slate-500 font-mono truncate mt-0.5">
                            {currentUser.email}
                          </div>
                        )}
                        {(currentUser.phone || currentUser.phoneNumber) && (
                          <div className="text-xs text-slate-600 font-mono mt-0.5">
                            📱 {currentUser.phone || currentUser.phoneNumber}
                          </div>
                        )}
                      </div>

                      <div className="py-2.5 text-[11px] text-slate-500 leading-relaxed">
                        Aapka yeh unified profile Shawarma Nights aur Nash Studio par directly synced hai.
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full text-left py-2 px-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors flex items-center justify-between cursor-pointer"
                        >
                          <span>Sign Out from ChuruOne</span>
                          <LogOut className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link 
                to="/auth" 
                className="bg-slate-900 hover:bg-black text-white text-xs uppercase tracking-wider font-bold px-4 py-2.5 rounded-xl transition-colors shadow-xs flex items-center gap-2"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ─── Hero Section (Clean, Spacious Light Theme) ───────────── */}
      <section className="bg-white border-b border-slate-200/80 pt-14 pb-12 sm:pt-20 sm:pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          
          {/* Live Status Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-200 bg-emerald-50 mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[11px] uppercase tracking-wider font-semibold text-emerald-800">
              Churu City Marketplace • Verified Network
            </span>
          </div>

          {/* Clean Strong Typography */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-950 uppercase leading-none">
            CHURUONE
          </h1>

          <div className="flex items-center justify-center gap-3 mt-3">
            <span className="h-[1px] w-12 bg-slate-200"></span>
            <span className="text-xs sm:text-sm font-semibold tracking-[0.25em] uppercase text-slate-500">
              DIRECT CITY COMMERCE
            </span>
            <span className="h-[1px] w-12 bg-slate-200"></span>
          </div>

          <p className="mt-4 text-sm sm:text-base text-slate-600 max-w-xl mx-auto font-normal leading-relaxed">
            Order authentic meals, book salon grooming, and support verified local businesses at direct in-store rates with zero aggregator commission.
          </p>

          {/* Clean Search & Filter Bar */}
          <div className="mt-8 sm:mt-10 max-w-xl mx-auto">
            <div className="relative rounded-2xl bg-slate-50 border border-slate-200/90 p-2 flex items-center gap-2 focus-within:bg-white focus-within:border-slate-900 focus-within:ring-2 focus-within:ring-slate-900/10 shadow-xs transition-all">
              <Search className="w-4 h-4 text-slate-400 ml-2.5 shrink-0" />
              <input
                type="text"
                placeholder="Search food, dining, or salon services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none py-1.5"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 px-3 py-1 rounded-lg bg-slate-200/80 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Clean Category Filter Tabs */}
            <div className="flex items-center justify-center gap-2 sm:gap-3 mt-5">
              {[
                { id: 'all', label: 'All Partners' },
                { id: 'dining', label: 'Culinary & Dining' },
                { id: 'salon', label: 'Salon & Grooming' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`text-xs uppercase tracking-wider px-4 py-2 rounded-xl transition-colors cursor-pointer ${
                    selectedCategory === tab.id
                      ? 'bg-slate-900 text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200 font-medium'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ─── Subtle Live Ticker Strip ─────────────────────────────── */}
      <div className="w-full overflow-hidden border-b border-slate-200 bg-slate-100/70 py-2.5">
        <motion.div
          className="flex items-center gap-8 whitespace-nowrap text-[10px] sm:text-[11px] font-mono font-semibold tracking-widest uppercase text-slate-600"
          animate={{ x: [0, -1080] }}
          transition={{ repeat: Infinity, ease: "linear", duration: 28 }}
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
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                <span>{item}</span>
              </span>
              <span className="text-slate-300 font-light select-none">/</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ─── Establishments Grid (Clean, Tactile Light Cards) ──────── */}
      <section className="py-14 sm:py-20 max-w-6xl mx-auto px-4 sm:px-6">
        
        <div className="flex items-center justify-between mb-8 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-slate-900" />
            <span className="text-xs uppercase tracking-widest font-mono font-bold text-slate-800">
              ACTIVE HUBS ({filteredStores.length})
            </span>
          </div>
          <span className="text-xs text-slate-500">
            Direct Delivery & Slot Reservation
          </span>
        </div>

        {/* Store Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredStores.map((store) => {
            const destinationUrl = getStoreUrl(store.id);

            return (
              <div 
                key={store.id}
                className="group rounded-2xl overflow-hidden border border-slate-200 bg-white hover:border-slate-300 transition-all duration-300 hover:shadow-xl shadow-xs flex flex-col justify-between"
              >
                <div>
                  <a 
                    href={destinationUrl} 
                    className="block relative h-60 sm:h-68 w-full overflow-hidden bg-slate-100"
                  >
                    <img 
                      src={store.image} 
                      alt={store.name} 
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500 ease-out"
                    />

                    <div className="absolute top-4 left-4 flex items-center gap-2">
                      <span className="bg-white/95 backdrop-blur-md border border-slate-200 text-emerald-800 text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full shadow-xs flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span>OPEN NOW</span>
                      </span>

                      <span className="bg-white/95 backdrop-blur-md border border-slate-200 text-slate-700 text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full shadow-xs">
                        {store.categoryLabel}
                      </span>
                    </div>

                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md border border-slate-200 px-2.5 py-1 rounded-full text-xs font-bold text-slate-900 flex items-center gap-1.5 shadow-xs">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                      <span>{store.rating}</span>
                    </div>
                  </a>

                  <div className="p-6 sm:p-7">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-950 group-hover:text-slate-800 transition-colors">
                          {store.name}
                        </h2>
                        <p className="text-xs text-amber-800 font-semibold mt-1">
                          {store.tagline}
                        </p>
                      </div>

                      <a 
                        href={destinationUrl} 
                        className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 group-hover:text-slate-950 group-hover:bg-slate-200 transition-colors shrink-0"
                        aria-label={`Open ${store.name}`}
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </a>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-2.5 line-clamp-2">
                      {store.description}
                    </p>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{store.timing}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[130px]">{store.location}</span>
                      </div>
                      <div className="font-mono text-xs text-slate-900 font-bold">
                        {store.minOrder}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 sm:p-7 pt-0">
                  <a
                    href={destinationUrl}
                    className="w-full bg-slate-900 hover:bg-black text-white py-3.5 px-5 rounded-xl text-xs uppercase tracking-wider font-bold flex items-center justify-center gap-2 transition-colors shadow-xs"
                  >
                    <span>{store.ctaText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {filteredStores.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center my-8 shadow-xs">
            <Store className="w-8 h-8 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-900">No establishments match your search</h3>
            <p className="text-xs text-slate-500 mt-1">Try another keyword or reset the category filter.</p>
          </div>
        )}
      </section>

      {/* ─── Clean About Section ──────────────────────────────────── */}
      <section id="about" className="py-16 sm:py-20 bg-slate-50 border-t border-slate-200/80 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          
          <div className="max-w-2xl mb-10">
            <span className="text-[11px] font-mono font-bold tracking-widest uppercase text-slate-500 block mb-1">
              CITY PLATFORM
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950">
              City Commerce, Direct & Transparent.
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2.5 leading-relaxed font-normal">
              ChuruOne connects citizens directly with verified local businesses — guaranteeing zero middleman markups, direct instant bank settlements, and genuine in-store pricing.
            </p>
          </div>

          {/* 3 Clean Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full inline-block mb-3.5">
                  0% Commission
                </span>
                <h3 className="text-base sm:text-lg font-bold tracking-tight text-slate-950">
                  Authentic Direct Pricing
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mt-2">
                  Menus and salon services are priced identically to walk-in rates with zero aggregator commission fees.
                </p>
              </div>
              <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500 font-medium">
                <Store className="w-3.5 h-3.5 text-amber-700" />
                <span>Genuine Local Rates</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full inline-block mb-3.5">
                  Direct Bank Settle
                </span>
                <h3 className="text-base sm:text-lg font-bold tracking-tight text-slate-950">
                  Instant UPI Settlement
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mt-2">
                  Customer payments and token advances settle directly into merchant bank accounts without third-party escrow delay.
                </p>
              </div>
              <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500 font-medium">
                <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Zero Escrow Intermediaries</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full inline-block mb-3.5">
                  Universal SSO
                </span>
                <h3 className="text-base sm:text-lg font-bold tracking-tight text-slate-950">
                  Unified Citizen Identity
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mt-2">
                  One master ChuruOne ID securely connects dining delivery, salon bookings, and merchant portal access.
                </p>
              </div>
              <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Privacy-First Architecture</span>
              </div>
            </div>

          </div>

          {/* Clean Merchant & Contact Row */}
          <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
            <div className="flex items-center flex-wrap gap-4 text-slate-600">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>Churu, Rajasthan 331001</span>
              </span>
              <span className="text-slate-300">•</span>
              <a href="tel:+917023963189" className="hover:text-slate-900 transition-colors flex items-center gap-1.5 font-mono">
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                <span>+91 70239 63189</span>
              </a>
              <span className="text-slate-300">•</span>
              <a href="mailto:contact@churuone.in" className="hover:text-slate-900 transition-colors flex items-center gap-1.5 font-mono">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span>contact@churuone.in</span>
              </a>
            </div>

            <Link
              to="/admin"
              className="text-xs uppercase tracking-wider font-bold text-slate-900 hover:text-black transition-colors inline-flex items-center gap-1.5 shrink-0"
            >
              <span>Merchant OS Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>
      </section>

      {/* ─── Minimalist Clean Light Footer ────────────────────────── */}
      <footer className="border-t border-slate-200 bg-white py-12 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-xs text-slate-600">
            <div>
              <div className="font-black tracking-[0.16em] uppercase text-slate-950 text-base">
                CHURUONE
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Direct City Commerce Protocol • Churu, Rajasthan
              </p>
            </div>

            <div className="flex items-center flex-wrap gap-5 text-slate-600 text-xs font-semibold uppercase tracking-wider">
              <a href="#about" className="hover:text-slate-950 transition-colors">
                About
              </a>
              <a href={getStoreUrl('shawarma')} className="hover:text-slate-950 transition-colors">
                Shawarma Nights
              </a>
              <a href={getStoreUrl('nash-studio')} className="hover:text-slate-950 transition-colors">
                Nash Studio
              </a>
              <Link to="/admin" className="hover:text-slate-950 transition-colors">
                Merchant OS
              </Link>
              <Link to="/auth" className="hover:text-slate-950 transition-colors">
                Account
              </Link>
            </div>
          </div>

          {/* Clean Legal Policy Row */}
          <div className="pt-6 border-t border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center flex-wrap gap-4 sm:gap-6 font-medium">
              <a href="/contact-us" className="hover:text-slate-900 transition-colors">
                Contact Us
              </a>
              <a href="/terms-and-conditions" className="hover:text-slate-900 transition-colors">
                Terms & Conditions
              </a>
              <a href="/privacy-policy" className="hover:text-slate-900 transition-colors">
                Privacy Policy
              </a>
              <a href="/refund-policy" className="hover:text-slate-900 transition-colors">
                Refund & Cancellation
              </a>
              <a href="/shipping-policy" className="hover:text-slate-900 transition-colors">
                Shipping Policy
              </a>
            </div>

            <div className="text-slate-500 text-[11px] font-mono">
              Delivery in 30-45 mins • Refunds processed in 5-7 business days
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
            <span>© 2026 ChuruOne. A unit of Vasudhaiva Kutumbakam Robotics. All rights reserved.</span>
            <span>Registered Address: 50, Churu bhaiji chowk, Churu, Rajasthan 331001</span>
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
