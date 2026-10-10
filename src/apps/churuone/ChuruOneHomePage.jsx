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
  Sparkles
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

  // The 2 authentic flagship stores of ChuruOne
  const stores = [
    {
      id: 'shawarma',
      name: 'Shawarma Nights',
      category: 'Culinary & Dining',
      tagline: 'Artisanal Charcoal Kitchen',
      description: 'Slow-roasted spit shawarmas, freshly baked pita, and signature garlic toum. Open late-night with express 25-minute delivery across Churu.',
      timing: '6:00 PM – 4:00 AM',
      location: 'Subhash Chowk, Churu',
      image: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=1400&q=85',
      ctaText: 'Order Shawarma'
    },
    {
      id: 'nash-studio',
      name: 'Nash Studio',
      category: 'Salon & Grooming',
      tagline: "Gentlemen's Grooming Lounge",
      description: 'Private appointment-based grooming lounge. Precision skin fades, beard sculpting, and luxury hair craftsmanship with zero wait-time.',
      timing: '11:00 AM – 11:00 PM',
      location: 'Main Market, Churu',
      image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1400&q=85',
      ctaText: 'Book Appointment'
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-stone-900 font-sans antialiased selection:bg-stone-900 selection:text-white">
      
      {/* ─── Minimalist Brand Header ─────────────────────────────── */}
      <header className="border-b border-stone-200/70 bg-[#FAF9F5]/90 backdrop-blur-md sticky top-0 z-50 transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 sm:h-20 flex items-center justify-between">
          
          {/* Logo / Brand Mark */}
          <Link to="/" className="flex items-center gap-3 group" aria-label="ChuruOne Home">
            <span className="font-extrabold text-lg sm:text-xl tracking-[0.22em] text-stone-950 uppercase">
              CHURUONE
            </span>
          </Link>

          {/* Right Header Navigation & SSO Account */}
          <div className="flex items-center gap-5 sm:gap-7" ref={accountMenuRef}>
            <a
              href="#about"
              className="text-xs uppercase tracking-wider font-semibold text-stone-600 hover:text-stone-950 transition-colors hidden sm:inline-block"
            >
              About
            </a>
            
            {currentUser ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsAccountMenuOpen(prev => !prev)}
                  className="bg-white hover:bg-stone-50 text-stone-900 text-xs tracking-wider font-semibold px-3.5 py-2 rounded-full transition-all inline-flex items-center gap-2 cursor-pointer border border-stone-200/80 shadow-xs"
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
                  <span className="max-w-[100px] truncate">
                    {(currentUser.name || currentUser.displayName || 'Account').split(' ')[0]}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-200 ${isAccountMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Ultra-Clean Account Dropdown */}
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

      {/* ─── Hero Section (Bold, Editorial & Breathable) ─────────── */}
      <section className="pt-16 pb-12 sm:pt-24 sm:pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="text-[11px] font-mono font-bold tracking-[0.28em] uppercase text-stone-500 block mb-3">
              CHURU, RAJASTHAN
            </span>

            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-stone-950 uppercase leading-[1.05]">
              Two Iconic Brands.<br />Direct to You.
            </h1>

            <p className="mt-5 text-sm sm:text-base text-stone-600 max-w-lg mx-auto font-normal leading-relaxed">
              Authentic charcoal dining and precision gentlemen&apos;s grooming. Direct in-store pricing with zero platform markups.
            </p>
          </motion.div>

        </div>
      </section>

      {/* ─── The Two Flagship Showcase Cards (The Centerpiece) ───── */}
      <section className="pb-24 sm:pb-32 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
          {stores.map((store, index) => {
            const destinationUrl = getStoreUrl(store.id);

            return (
              <motion.div
                key={store.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -6 }}
                className="group relative rounded-[2.2rem] overflow-hidden bg-white border border-stone-200/80 shadow-xs hover:shadow-2xl transition-all duration-500 flex flex-col justify-between"
              >
                <div>
                  {/* Imagery Viewport */}
                  <a 
                    href={destinationUrl} 
                    className="block relative h-72 sm:h-84 w-full overflow-hidden bg-stone-100"
                  >
                    <img 
                      src={store.image} 
                      alt={store.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />

                    {/* Category Label Pill */}
                    <div className="absolute top-5 left-5">
                      <span className="bg-white/95 backdrop-blur-md text-stone-800 text-[10px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-full shadow-xs">
                        {store.category}
                      </span>
                    </div>
                  </a>

                  {/* Card Content Body */}
                  <div className="p-7 sm:p-9">
                    <div className="space-y-1">
                      <h2 className="text-3xl font-extrabold tracking-tight text-stone-950 group-hover:text-stone-800 transition-colors">
                        {store.name}
                      </h2>
                      <p className="text-xs font-semibold tracking-wider uppercase text-amber-800">
                        {store.tagline}
                      </p>
                    </div>

                    <p className="text-sm text-stone-600 leading-relaxed mt-4 font-normal">
                      {store.description}
                    </p>

                    <div className="mt-6 pt-5 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500 font-medium">
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

                {/* Primary Action Button */}
                <div className="p-7 sm:p-9 pt-0">
                  <a
                    href={destinationUrl}
                    className="w-full bg-stone-900 hover:bg-black text-white py-4 px-6 rounded-2xl text-xs uppercase tracking-wider font-bold flex items-center justify-between transition-colors shadow-xs group/btn cursor-pointer"
                  >
                    <span>{store.ctaText}</span>
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </a>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ─── Clean Editorial About Section ───────────────────────── */}
      <section id="about" className="py-20 sm:py-28 bg-[#F4F1EA] border-t border-stone-200/80 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            
            {/* Left: Platform Narrative */}
            <div className="lg:col-span-7 space-y-4">
              <span className="text-[11px] font-mono font-bold tracking-[0.25em] uppercase text-stone-500 block">
                ABOUT CHURUONE
              </span>

              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-950 leading-tight">
                Direct City Commerce, Sovereign & Transparent.
              </h2>

              <p className="text-sm sm:text-base text-stone-600 leading-relaxed font-normal pt-2">
                ChuruOne is the dedicated digital platform connecting citizens directly with Churu&apos;s signature culinary and grooming destinations.
              </p>

              <p className="text-xs sm:text-sm text-stone-500 leading-relaxed font-normal">
                By removing middleman aggregator commissions, orders and appointments are served at authentic in-store pricing with instant direct settlements to local merchant accounts.
              </p>
            </div>

            {/* Right: Official Entity & Contact Card */}
            <div className="lg:col-span-5 bg-white border border-stone-200 rounded-3xl p-7 sm:p-8 shadow-xs space-y-6">
              <div>
                <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-stone-400 block mb-1">
                  OFFICIAL ENTITY
                </span>
                <div className="text-base font-bold text-stone-900">
                  Vasudhaiva Kutumbakam Robotics
                </div>
              </div>

              <div className="space-y-3 text-xs text-stone-600 pt-3 border-t border-stone-100">
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

              <div className="pt-4 border-t border-stone-100">
                <Link
                  to="/admin"
                  className="w-full py-3 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-900 text-xs font-bold uppercase tracking-wider flex items-center justify-between transition-colors"
                >
                  <span>Merchant OS Portal</span>
                  <ArrowRight className="w-3.5 h-3.5 text-stone-500" />
                </Link>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ─── Minimalist Clean Footer ─────────────────────────────── */}
      <footer className="border-t border-stone-200/80 bg-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-xs text-stone-600">
            <div>
              <div className="font-extrabold tracking-[0.18em] uppercase text-stone-950 text-base">
                CHURUONE
              </div>
              <p className="text-xs text-stone-500 mt-1">
                Direct City Commerce • Churu, Rajasthan
              </p>
            </div>

            <div className="flex items-center flex-wrap gap-5 text-stone-600 text-xs font-semibold uppercase tracking-wider">
              <a href="#about" className="hover:text-stone-950 transition-colors">
                About
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

          {/* Clean Legal Policy Links */}
          <div className="pt-6 border-t border-stone-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-stone-500">
            <div className="flex items-center flex-wrap gap-4 sm:gap-6 font-medium">
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
              Delivery in 30–45 mins • Refunds processed in 5–7 business days
            </div>
          </div>

          <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-stone-400">
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
