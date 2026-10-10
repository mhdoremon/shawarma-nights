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
  Zap
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
    document.title = "CHURUONE — Sovereign City Commerce";
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
      num: '01',
      name: 'Shawarma Nights',
      category: 'Culinary & Dining',
      tagline: 'Artisanal Charcoal Spit Kitchen',
      description: 'Slow-roasted spit shawarmas, freshly rolled pita, and authentic garlic toum. Open late-night with express 25-minute delivery across Churu.',
      timing: '6:00 PM – 4:00 AM',
      location: 'Subhash Chowk, Churu',
      image: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=1400&q=85',
      ctaText: 'Order Shawarma',
      icon: Utensils,
      status: 'Open Tonight',
      perk: '25-Min Express Delivery'
    },
    {
      id: 'nash-studio',
      num: '02',
      name: 'Nash Studio',
      category: 'Salon & Grooming',
      tagline: "Gentlemen's Grooming Lounge",
      description: 'Private appointment-based grooming lounge. Precision skin fades, beard sculpting, and premium hair craftsmanship with zero waiting queue.',
      timing: '11:00 AM – 11:00 PM',
      location: 'Main Market, Churu',
      image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1400&q=85',
      ctaText: 'Book Appointment',
      icon: Scissors,
      status: 'Booking Active',
      perk: 'Zero Wait Guaranteed'
    }
  ];

  // Letters array for kinetic brand typography reveal
  const brandWord = "CHURUONE";

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-stone-900 font-sans antialiased selection:bg-stone-900 selection:text-white relative">
      
      {/* ─── Top Architectural Utility Bar ──────────────────────── */}
      <div className="border-b border-stone-200/60 bg-[#FAF9F5] text-[11px] font-mono tracking-wider text-stone-500 py-2 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="uppercase font-semibold text-stone-700">Churu, Rajasthan (331001)</span>
          </div>
          <div className="hidden md:flex items-center gap-6 uppercase">
            <span>Direct In-Store Pricing</span>
            <span>•</span>
            <span>0% Platform Commission</span>
            <span>•</span>
            <span>Single Sign-On</span>
          </div>
          <div>
            <a href="#about" className="hover:text-stone-900 underline underline-offset-2 transition-colors">
              Official Registry
            </a>
          </div>
        </div>
      </div>

      {/* ─── Main Brand Header ────────────────────────────────────── */}
      <header className="border-b border-stone-200/80 bg-[#FAF9F5]/90 backdrop-blur-md sticky top-0 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          
          {/* Logo / Brand Mark */}
          <Link to="/" className="flex items-center gap-3 group" aria-label="ChuruOne Home">
            <div className="w-8 h-8 rounded-lg bg-stone-900 text-white flex items-center justify-center font-black text-sm tracking-tight shadow-xs">
              C1
            </div>
            <span className="font-black text-xl sm:text-2xl tracking-[-0.03em] text-stone-950 uppercase">
              CHURUONE
            </span>
          </Link>

          {/* Quick Nav Anchors */}
          <nav className="hidden lg:flex items-center gap-8 text-xs font-semibold uppercase tracking-wider text-stone-600">
            <a href="#flagships" className="hover:text-stone-950 transition-colors">
              Flagship Stores
            </a>
            <a href="#principles" className="hover:text-stone-950 transition-colors">
              Principles
            </a>
            <a href="#about" className="hover:text-stone-950 transition-colors">
              About & Entity
            </a>
          </nav>

          {/* Right Header: SSO Account */}
          <div className="flex items-center gap-4 sm:gap-6" ref={accountMenuRef}>
            {currentUser ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsAccountMenuOpen(prev => !prev)}
                  className="bg-white hover:bg-stone-50 text-stone-900 text-xs tracking-wider font-semibold px-4 py-2 rounded-full transition-all inline-flex items-center gap-2.5 cursor-pointer border border-stone-200/90 shadow-xs"
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
                  <span className="max-w-[120px] truncate">
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
                      className="absolute right-0 mt-2 w-64 bg-white border border-stone-200 rounded-2xl shadow-xl z-50 p-4 text-left"
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
                className="bg-stone-900 hover:bg-black text-white text-xs uppercase tracking-wider font-bold px-5 py-2.5 rounded-full transition-colors shadow-xs"
              >
                Sign In
              </Link>
            )}
          </div>

        </div>
      </header>

      {/* ─── Monumental Hero with Kinetic Brand Typography ──────── */}
      <section className="pt-12 sm:pt-20 pb-16 sm:pb-24 overflow-hidden border-b border-stone-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          
          {/* Top Label & Rotating Kinetic Seal */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8 sm:mb-12">
            <div>
              <span className="text-[11px] font-mono font-bold tracking-[0.3em] uppercase text-stone-500 block">
                [ DIGITAL CITY DIRECTORY & SOVEREIGN COMMERCE ]
              </span>
              <p className="text-sm text-stone-600 font-medium mt-1">
                Rajasthan&apos;s direct merchant network for verified culinary & grooming flagships.
              </p>
            </div>

            {/* Kinetic Rotating Circular Emblem */}
            <div className="relative flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 24, ease: "linear" }}
                className="w-24 h-24 sm:w-28 sm:h-28"
              >
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <path
                    id="circlePath"
                    d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0"
                    fill="none"
                  />
                  <text className="text-[8.5px] uppercase tracking-[0.24em] font-extrabold fill-stone-800">
                    <textPath href="#circlePath" startOffset="0%">
                      ✦ CHURUONE ✦ SOVEREIGN LOCAL COMMERCE ✦ EST 2026 ✦
                    </textPath>
                  </text>
                </svg>
              </motion.div>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-2.5 h-2.5 rounded-full bg-stone-950" />
              </div>
            </div>
          </div>

          {/* MONUMENTAL KINETIC BRAND TYPOGRAPHY: CHURUONE */}
          <div className="py-2 sm:py-6 overflow-hidden">
            <motion.h1 
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.045, delayChildren: 0.1 }
                }
              }}
              className="text-[15vw] sm:text-[14.5vw] md:text-[14vw] lg:text-[13vw] font-black tracking-[-0.05em] leading-[0.8] text-stone-950 uppercase select-none flex justify-between w-full"
              aria-label="CHURUONE"
            >
              {brandWord.split("").map((letter, index) => (
                <span key={index} className="inline-block overflow-hidden pb-2">
                  <motion.span
                    variants={{
                      hidden: { y: "115%", opacity: 0 },
                      visible: { 
                        y: "0%", 
                        opacity: 1, 
                        transition: { type: "spring", damping: 14, stiffness: 100 } 
                      }
                    }}
                    className="inline-block"
                  >
                    {letter}
                  </motion.span>
                </span>
              ))}
            </motion.h1>
          </div>

          {/* Hero Bottom Narrative Grid */}
          <div className="mt-8 sm:mt-12 pt-8 border-t border-stone-200 flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="max-w-xl">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900">
                Two Iconic Local Establishments. Zero Platform Fees. Direct Merchant Billing.
              </h2>
              <p className="mt-3 text-sm text-stone-600 leading-relaxed font-normal">
                ChuruOne bypasses corporate delivery aggregator commissions. Every order and booking is settled straight to verified city shops at real counter prices.
              </p>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <a
                href="#flagships"
                className="bg-stone-900 hover:bg-black text-white text-xs uppercase tracking-wider font-bold px-6 py-4 rounded-2xl inline-flex items-center gap-3 transition-colors shadow-xs"
              >
                <span>Explore The 2 Flagships</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#about"
                className="bg-white hover:bg-stone-100 text-stone-900 text-xs uppercase tracking-wider font-bold px-6 py-4 rounded-2xl inline-flex items-center gap-2 border border-stone-200 transition-colors"
              >
                <span>About Entity</span>
              </a>
            </div>
          </div>

        </div>
      </section>

      {/* ─── Kinetic Infinite Marquee Stream ─────────────────────── */}
      <div className="py-5 sm:py-6 border-b border-stone-200/90 bg-[#F4F1EA] overflow-hidden whitespace-nowrap select-none">
        <div className="flex gap-10 items-center animate-marquee w-max">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-10 text-lg sm:text-2xl font-black uppercase tracking-tight text-stone-950">
              <span className="text-stone-900">CHURUONE</span>
              <span className="text-stone-400 font-light">✦</span>
              <span className="text-stone-600 font-mono text-sm tracking-widest font-bold">SHAWARMA NIGHTS</span>
              <span className="text-stone-400 font-light">✦</span>
              <span className="text-stone-900">0% COMMISSIONS</span>
              <span className="text-stone-400 font-light">✦</span>
              <span className="text-stone-600 font-mono text-sm tracking-widest font-bold">NASH STUDIO</span>
              <span className="text-stone-400 font-light">✦</span>
              <span className="text-stone-900">DIRECT PRICING</span>
              <span className="text-stone-400 font-light">✦</span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── The Two Flagship Portals (Architectural Showcase) ────── */}
      <section id="flagships" className="py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-6 scroll-mt-20">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-16">
          <div>
            <span className="text-[11px] font-mono font-bold tracking-[0.28em] uppercase text-stone-500 block mb-2">
              CURATED DIRECTORY
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-stone-950 uppercase">
              The Flagship Destinations
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 max-w-md font-normal leading-relaxed">
            Directly owned and operated storefronts equipped with real-time merchant kitchen and appointment scheduling dispatch.
          </p>
        </div>

        {/* The 2 Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
          {stores.map((store, index) => {
            const destinationUrl = getStoreUrl(store.id);
            const Icon = store.icon;

            return (
              <motion.article
                key={store.id}
                initial={{ opacity: 0, y: 35 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -8 }}
                className="group relative rounded-[2.5rem] overflow-hidden bg-white border border-stone-200/90 shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col justify-between"
              >
                {/* Architectural Corner Registration Marks */}
                <div className="absolute top-4 right-4 z-10 text-xs font-mono font-bold text-stone-400 select-none">
                  + {store.num}
                </div>

                <div>
                  {/* Cinematic Imagery Frame */}
                  <a 
                    href={destinationUrl} 
                    className="block relative h-72 sm:h-96 w-full overflow-hidden bg-stone-100"
                  >
                    <img 
                      src={store.image} 
                      alt={store.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />

                    {/* Operational Badge Pill */}
                    <div className="absolute top-5 left-5 flex items-center gap-2">
                      <span className="bg-stone-950 text-white text-[10px] uppercase tracking-wider font-bold px-3.5 py-1.5 rounded-full shadow-md flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        {store.status}
                      </span>
                      <span className="bg-white/95 backdrop-blur-md text-stone-800 text-[10px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-full shadow-xs">
                        {store.category}
                      </span>
                    </div>
                  </a>

                  {/* Card Editorial Body */}
                  <div className="p-7 sm:p-10">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-stone-500 text-xs font-mono tracking-wider uppercase">
                        <Icon className="w-4 h-4 text-stone-700" />
                        <span>{store.tagline}</span>
                      </div>
                      <h3 className="text-3xl sm:text-4xl font-black tracking-tight text-stone-950 group-hover:text-stone-800 transition-colors pt-1">
                        {store.name}
                      </h3>
                    </div>

                    <p className="text-sm sm:text-base text-stone-600 leading-relaxed mt-4 font-normal">
                      {store.description}
                    </p>

                    {/* Operational Metadata Bar */}
                    <div className="mt-8 pt-6 border-t border-stone-100 grid grid-cols-2 gap-4 text-xs text-stone-600">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-stone-400 shrink-0" />
                        <span className="font-medium">{store.timing}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-stone-400 shrink-0" />
                        <span className="font-medium">{store.location}</span>
                      </div>
                      <div className="col-span-2 flex items-center gap-2 text-emerald-700 font-semibold pt-1">
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                        <span>{store.perk}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Monumental Action Trigger */}
                <div className="p-7 sm:p-10 pt-0">
                  <a
                    href={destinationUrl}
                    className="w-full bg-stone-900 hover:bg-black text-white py-4 sm:py-5 px-6 rounded-2xl text-xs sm:text-sm uppercase tracking-wider font-bold flex items-center justify-between transition-colors shadow-xs group/btn cursor-pointer"
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

      {/* ─── Architectural Principles (Why ChuruOne) ─────────────── */}
      <section id="principles" className="py-20 sm:py-28 bg-[#F4F1EA] border-t border-stone-200/90 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          
          <div className="max-w-2xl mb-14">
            <span className="text-[11px] font-mono font-bold tracking-[0.25em] uppercase text-stone-500 block mb-2">
              FOUNDATIONAL ARCHITECTURE
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-stone-950 uppercase leading-tight">
              The Sovereign City Model
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Pillar 01 */}
            <div className="bg-white rounded-3xl p-8 border border-stone-200/80 shadow-xs space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-900 font-mono font-bold text-sm">
                01
              </div>
              <h3 className="text-lg font-bold text-stone-950">
                Direct Counter Pricing
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-normal">
                Third-party delivery apps inflate menu costs by 20–30%. ChuruOne guarantees exact in-store dining and salon prices with zero middleman surcharge.
              </p>
            </div>

            {/* Pillar 02 */}
            <div className="bg-white rounded-3xl p-8 border border-stone-200/80 shadow-xs space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-900 font-mono font-bold text-sm">
                02
              </div>
              <h3 className="text-lg font-bold text-stone-950">
                Single Sign-On (SSO)
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-normal">
                Authenticate once on ChuruOne. Your identity, delivery coordinates, and loyalty tier transition seamlessly between Shawarma Nights and Nash Studio.
              </p>
            </div>

            {/* Pillar 03 */}
            <div className="bg-white rounded-3xl p-8 border border-stone-200/80 shadow-xs space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-900 font-mono font-bold text-sm">
                03
              </div>
              <h3 className="text-lg font-bold text-stone-950">
                Direct Merchant Settlement
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-normal">
                UPI and card payments settle instantly to merchant accounts via Cashfree & PhonePe gateways, providing complete financial sovereignty to local business.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ─── Clean Editorial About & Entity Section ───────────────── */}
      <section id="about" className="py-20 sm:py-28 bg-[#FAF9F5] border-t border-stone-200/80 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            
            {/* Left: Platform Narrative */}
            <div className="lg:col-span-7 space-y-5">
              <span className="text-[11px] font-mono font-bold tracking-[0.25em] uppercase text-stone-500 block">
                ABOUT CHURUONE
              </span>

              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-stone-950 uppercase leading-tight">
                Direct City Commerce, Sovereign & Transparent.
              </h2>

              <p className="text-sm sm:text-base text-stone-600 leading-relaxed font-normal pt-2">
                ChuruOne is the dedicated digital platform connecting citizens directly with Churu&apos;s signature culinary and grooming destinations.
              </p>

              <p className="text-xs sm:text-sm text-stone-500 leading-relaxed font-normal">
                By eliminating third-party platform markups, orders and appointments are served at authentic in-store pricing with instant direct settlements to local merchant accounts.
              </p>
            </div>

            {/* Right: Official Entity & Contact Card */}
            <div className="lg:col-span-5 bg-white border border-stone-200/90 rounded-3xl p-7 sm:p-9 shadow-sm space-y-6">
              <div>
                <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-stone-400 block mb-1">
                  OFFICIAL OPERATING ENTITY
                </span>
                <div className="text-lg font-bold text-stone-900">
                  Vasudhaiva Kutumbakam Robotics
                </div>
              </div>

              <div className="space-y-3.5 text-xs text-stone-600 pt-4 border-t border-stone-100">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                  <span>50, Churu bhaiji chowk, Churu, Rajasthan 331001</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-stone-400 shrink-0" />
                  <a href="tel:+917023963189" className="hover:text-stone-900 font-mono transition-colors">
                    +91 70239 63189
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-stone-400 shrink-0" />
                  <a href="mailto:contact@churuone.in" className="hover:text-stone-900 font-mono transition-colors">
                    contact@churuone.in
                  </a>
                </div>
              </div>

              <div className="pt-4 border-t border-stone-100">
                <Link
                  to="/admin"
                  className="w-full py-3.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-900 text-xs font-bold uppercase tracking-wider flex items-center justify-between transition-colors cursor-pointer"
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-xs text-stone-600">
            <div>
              <div className="font-black tracking-[-0.03em] uppercase text-stone-950 text-xl">
                CHURUONE
              </div>
              <p className="text-xs text-stone-500 mt-1 font-mono">
                Direct City Commerce • Churu, Rajasthan 331001
              </p>
            </div>

            <div className="flex items-center flex-wrap gap-6 text-stone-600 text-xs font-semibold uppercase tracking-wider">
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

          {/* Clean Legal Policy Links (All 5 mandatory PhonePe & Cashfree compliance links) */}
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
              Delivery in 25–40 mins • Refunds processed in 5–7 business days
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
