import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight,
  ArrowUpRight,
  User,
  LogOut,
  ChevronDown,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  Clock,
  Sparkles,
  Utensils,
  Scissors,
  ShieldCheck,
  Zap,
  Store,
  BadgePercent
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
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState('terms');

  // Unified ChuruOne SSO User State
  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState('');
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef(null);

  // Set browser title
  useEffect(() => {
    document.title = "ChuruOne — Order Food & Book Salon in Churu";
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

  // The 2 authentic flagship stores
  const stores = [
    {
      id: 'shawarma',
      name: 'Shawarma Nights',
      category: 'Food Delivery & Dining',
      tagline: 'Artisanal Charcoal Kitchen',
      badge: 'Open Tonight • 6 PM - 4 AM',
      description: 'Authentic spit-roasted shawarmas, hand-kneaded fresh pita, and signature toum garlic sauce. 25-minute fast home delivery across Churu.',
      timing: '6:00 PM – 4:00 AM',
      location: 'Subhash Chowk, Churu',
      image: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=1200&q=85',
      ctaText: 'Order Food Online',
      tags: ['🔥 Charcoal Spit Roasted', '⚡ 25-Min Express Delivery', '₹ Direct In-Store Rates'],
      accentColor: 'text-rose-600',
      btnBg: 'bg-stone-900 hover:bg-black text-white'
    },
    {
      id: 'nash-studio',
      name: 'Nash Studio',
      category: 'Salon & Grooming Lounge',
      tagline: "Gentlemen's Luxury Grooming",
      badge: 'Slots Open • 11 AM - 11 PM',
      description: 'Private appointment-based grooming lounge. Precision fades, beard styling, and hair craftsmanship with zero waiting queue.',
      timing: '11:00 AM – 11:00 PM',
      location: 'Main Market, Churu',
      image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=85',
      ctaText: 'Book Salon Appointment',
      tags: ['✂️ Zero Wait Guarantee', '💈 Master Stylists', '💎 Private Suite Experience'],
      accentColor: 'text-amber-700',
      btnBg: 'bg-stone-900 hover:bg-black text-white'
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-stone-900 font-sans antialiased selection:bg-stone-900 selection:text-white">
      
      {/* ─── Clean Modern Header (Single Branding, No Top Bar Clutter) ── */}
      <header className="border-b border-stone-200/80 bg-[#FAF9F6]/95 backdrop-blur-md sticky top-0 z-50 transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-18 flex items-center justify-between">
          
          {/* Logo / Brand Mark - Refined & Crisp */}
          <Link to="/" className="flex items-center gap-2.5 group" aria-label="ChuruOne Home">
            <div className="w-8 h-8 rounded-lg bg-stone-950 text-white flex items-center justify-center font-black text-xs tracking-wider shadow-xs">
              C1
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-stone-950 uppercase leading-none">
                CHURUONE
              </span>
              <span className="text-[9px] font-mono tracking-widest text-stone-500 uppercase">
                Churu, Rajasthan
              </span>
            </div>
          </Link>

          {/* Center Navigation - Simple & Direct */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold uppercase tracking-wider text-stone-600">
            <a href="#stores" className="hover:text-stone-950 transition-colors">
              Our Stores
            </a>
            <a href="#why-us" className="hover:text-stone-950 transition-colors">
              Direct Pricing
            </a>
            <a href="#about" className="hover:text-stone-950 transition-colors">
              About
            </a>
          </nav>

          {/* Right Header Navigation & SSO Account */}
          <div className="flex items-center gap-3 sm:gap-4" ref={accountMenuRef}>
            {currentUser ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsAccountMenuOpen(prev => !prev)}
                  className="bg-white hover:bg-stone-50 text-stone-900 text-xs tracking-wider font-semibold px-3.5 py-2 rounded-full transition-all inline-flex items-center gap-2 cursor-pointer border border-stone-200 shadow-xs"
                >
                  {currentUser.picture || currentUser.photoURL ? (
                    <img 
                      src={currentUser.picture || currentUser.photoURL} 
                      alt="" 
                      className="w-4 h-4 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-stone-900 text-white flex items-center justify-center text-[9px] font-bold">
                      {(currentUser.name || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="max-w-[110px] truncate">
                    {(currentUser.name || currentUser.displayName || 'Account').split(' ')[0]}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-200 ${isAccountMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Account Dropdown */}
                <AnimatePresence>
                  {isAccountMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-64 bg-white border border-stone-200 rounded-2xl shadow-xl z-50 p-3.5 text-left"
                    >
                      <div className="pb-3 border-b border-stone-100">
                        <div className="font-bold text-sm text-stone-900 truncate">
                          {currentUser.name || currentUser.displayName || 'Customer'}
                        </div>
                        {currentUser.email && (
                          <div className="text-xs text-stone-500 font-mono truncate mt-0.5">
                            {currentUser.email}
                          </div>
                        )}
                        {(currentUser.phone || currentUser.phoneNumber) && (
                          <div className="text-xs text-stone-600 font-mono mt-0.5">
                            {currentUser.phone || currentUser.phoneNumber}
                          </div>
                        )}
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full text-left py-2 px-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center justify-between cursor-pointer"
                        >
                          <span>Sign Out</span>
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
                className="bg-stone-900 hover:bg-black text-white text-xs uppercase tracking-wider font-bold px-4 py-2 rounded-full transition-colors shadow-xs"
              >
                Sign In
              </Link>
            )}
          </div>

        </div>
      </header>

      {/* ─── Hero Section: Punchy, Clear & Stores First ──────────── */}
      <section className="pt-8 pb-10 sm:pt-14 sm:pb-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-3"
          >
            {/* Clear, unmistakable headline for both phone and PC */}
            <span className="inline-flex items-center gap-2 bg-stone-100 text-stone-700 text-[10px] sm:text-xs font-mono font-bold uppercase px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Churu City Marketplace • 0% Middleman Tax
            </span>

            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-stone-950 uppercase leading-[1.1]">
              Order Food. Book Salon.<br />Direct From Stores.
            </h1>

            <p className="text-stone-600 text-xs sm:text-base max-w-xl mx-auto font-normal leading-relaxed pt-1">
              Select one of our 2 authentic city flagships below for direct in-store pricing with zero platform markups.
            </p>
          </motion.div>

        </div>
      </section>

      {/* ─── THE 2 STORES: Primary Focus of the Website ──────────── */}
      <section id="stores" className="pb-16 sm:pb-24 max-w-6xl mx-auto px-4 sm:px-6 scroll-mt-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {stores.map((store, index) => {
            const destinationUrl = getStoreUrl(store.id);

            return (
              <motion.article
                key={store.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -6 }}
                className="group bg-white rounded-3xl overflow-hidden border border-stone-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Store Visual Viewport */}
                  <a href={destinationUrl} className="block relative h-56 sm:h-72 w-full overflow-hidden bg-stone-100">
                    <img 
                      src={store.image} 
                      alt={store.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />

                    {/* Operational Badge */}
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                      <span className="bg-stone-950/90 backdrop-blur-sm text-white text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        {store.badge}
                      </span>
                    </div>

                    <div className="absolute top-4 right-4">
                      <span className="bg-white/95 backdrop-blur-sm text-stone-800 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-xs">
                        {store.category}
                      </span>
                    </div>
                  </a>

                  {/* Store Info & Content */}
                  <div className="p-6 sm:p-7 space-y-3">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-stone-500">
                        {store.tagline}
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-stone-950 mt-0.5 group-hover:text-stone-800 transition-colors">
                        {store.name}
                      </h2>
                    </div>

                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-normal">
                      {store.description}
                    </p>

                    {/* Feature Tags with Big-feel Icon Tags */}
                    <div className="pt-2 flex flex-wrap gap-2">
                      {store.tags.map((tag, tIdx) => (
                        <span 
                          key={tIdx}
                          className="bg-stone-50 border border-stone-200/70 text-stone-700 text-[11px] font-medium px-2.5 py-1 rounded-lg"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Location & Timings */}
                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span>{store.timing}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span>{store.location}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Primary CTA Button */}
                <div className="p-6 sm:p-7 pt-0">
                  <a
                    href={destinationUrl}
                    className={`w-full ${store.btnBg} py-3.5 sm:py-4 px-6 rounded-2xl text-xs sm:text-sm uppercase tracking-wider font-bold flex items-center justify-between transition-colors shadow-xs group/btn cursor-pointer`}
                  >
                    <span>{store.ctaText}</span>
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1.5 transition-transform" />
                  </a>
                </div>
              </motion.article>
            );
          })}
        </div>
      </section>

      {/* ─── WHY CHURUONE: Big Icon Tags, Concise & Modern ───────── */}
      <section id="why-us" className="py-16 sm:py-20 bg-stone-100/70 border-t border-stone-200/90 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          
          <div className="text-center max-w-xl mx-auto mb-10 sm:mb-14">
            <span className="text-[11px] font-mono font-bold tracking-[0.25em] uppercase text-stone-500 block mb-1">
              THE DIRECT ADVANTAGE
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-stone-950 uppercase">
              Why Order Direct on ChuruOne?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            
            {/* Feature 1 */}
            <motion.div 
              whileHover={{ y: -4 }}
              className="bg-white rounded-2xl p-7 border border-stone-200/80 shadow-xs space-y-4"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700">
                <BadgePercent className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-stone-950">
                  Zero Platform Surcharge
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed font-normal">
                  Corporate delivery apps inflate food and salon bills by 20–30%. ChuruOne delivers at pure in-store counter pricing.
                </p>
              </div>
            </motion.div>

            {/* Feature 2 */}
            <motion.div 
              whileHover={{ y: -4 }}
              className="bg-white rounded-2xl p-7 border border-stone-200/80 shadow-xs space-y-4"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
                <Zap className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-stone-950">
                  Express Kitchen & Salon Sync
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed font-normal">
                  Direct live connection to Shawarma Nights spit-grill kitchen and Nash Studio stylist chairs. Fast dispatch and zero wait time.
                </p>
              </div>
            </motion.div>

            {/* Feature 3 */}
            <motion.div 
              whileHover={{ y: -4 }}
              className="bg-white rounded-2xl p-7 border border-stone-200/80 shadow-xs space-y-4"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-stone-950">
                  One Unified Account (SSO)
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed font-normal">
                  Log in once on ChuruOne. Your saved addresses, past orders, and salon appointments are synced seamlessly across both stores.
                </p>
              </div>
            </motion.div>

          </div>

        </div>
      </section>

      {/* ─── ABOUT & OFFICIAL ENTITY ─────────────────────────────── */}
      <section id="about" className="py-16 sm:py-20 bg-white border-t border-stone-200/80 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            
            {/* Left Narrative */}
            <div className="lg:col-span-7 space-y-4">
              <span className="text-[11px] font-mono font-bold tracking-[0.25em] uppercase text-stone-500 block">
                ABOUT CHURUONE
              </span>

              <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-stone-950 uppercase leading-tight">
                Direct City Commerce, Sovereign & Transparent.
              </h2>

              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-normal pt-1">
                ChuruOne is the dedicated digital marketplace connecting citizens directly with Churu&apos;s signature culinary and grooming destinations.
              </p>

              <p className="text-xs sm:text-sm text-stone-500 leading-relaxed font-normal">
                By cutting out intermediary aggregator fees, orders and appointments are served at authentic in-store pricing with instant direct settlements to local merchant accounts.
              </p>
            </div>

            {/* Right: Official Entity Card */}
            <div className="lg:col-span-5 bg-stone-50 border border-stone-200/90 rounded-2xl p-6 sm:p-7 shadow-xs space-y-5">
              <div>
                <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-stone-400 block mb-1">
                  OFFICIAL OPERATING ENTITY
                </span>
                <div className="text-base font-bold text-stone-900">
                  Vasudhaiva Kutumbakam Robotics
                </div>
              </div>

              <div className="space-y-3 text-xs text-stone-600 pt-3 border-t border-stone-200/60">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                  <span>50, Churu bhaiji chowk, Churu, Rajasthan 331001</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-stone-400 shrink-0" />
                  <a href="tel:+917023963189" className="hover:text-stone-900 font-mono transition-colors">
                    +91 70239 63189
                  </a>
                </div>
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-stone-400 shrink-0" />
                  <a href="mailto:contact@churuone.in" className="hover:text-stone-900 font-mono transition-colors">
                    contact@churuone.in
                  </a>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-200/60">
                <Link
                  to="/admin"
                  className="w-full py-3 px-4 rounded-xl bg-white hover:bg-stone-100 text-stone-900 text-xs font-bold uppercase tracking-wider flex items-center justify-between border border-stone-200 transition-colors"
                >
                  <span>Merchant OS Portal</span>
                  <ArrowRight className="w-3.5 h-3.5 text-stone-500" />
                </Link>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ─── Clean Minimalist Footer ─────────────────────────────── */}
      <footer className="border-t border-stone-200/80 bg-stone-50 py-10 sm:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-stone-600">
            <div>
              <div className="font-black tracking-tight uppercase text-stone-950 text-lg">
                CHURUONE
              </div>
              <p className="text-xs text-stone-500 mt-0.5 font-mono">
                Direct City Commerce • Churu, Rajasthan 331001
              </p>
            </div>

            <div className="flex items-center flex-wrap gap-5 text-stone-600 text-xs font-semibold uppercase tracking-wider">
              <a href="#stores" className="hover:text-stone-950 transition-colors">
                Stores
              </a>
              <a href={getStoreUrl('shawarma')} className="hover:text-stone-950 transition-colors">
                Shawarma Nights
              </a>
              <a href={getStoreUrl('nash-studio')} className="hover:text-stone-950 transition-colors">
                Nash Studio
              </a>
              <Link to="/admin" className="hover:text-stone-950 transition-colors">
                Merchant OS
              </Link>
            </div>
          </div>

          {/* All 5 Mandatory Legal Policy Links for Payment Gateway Compliance */}
          <div className="pt-5 border-t border-stone-200/70 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-stone-500">
            <div className="flex items-center flex-wrap gap-4 sm:gap-5 font-medium">
              <a href="/contact-us" className="hover:text-stone-900 transition-colors">
                Contact Us
              </a>
              <a href="/terms-and-conditions" className="hover:text-stone-900 transition-colors">
                Terms & Conditions
              </a>
              <a href="/privacy-policy" className="hover:text-stone-900 transition-colors">
                Privacy Policy
              </a>
              <a href="/refund-policy" className="hover:text-stone-900 transition-colors">
                Refund & Cancellation
              </a>
              <a href="/shipping-policy" className="hover:text-stone-900 transition-colors">
                Shipping Policy
              </a>
            </div>

            <div className="text-stone-400 text-[11px] font-mono">
              Delivery in 25–40 mins • Refunds in 5–7 business days
            </div>
          </div>

          <div className="pt-3 border-t border-stone-200/70 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-stone-400">
            <span>© 2026 ChuruOne. A unit of Vasudhaiva Kutumbakam Robotics.</span>
            <span>Registered: 50, Churu bhaiji chowk, Churu, Rajasthan 331001</span>
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
