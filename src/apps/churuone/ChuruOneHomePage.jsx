import React, { useState } from 'react';
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
  User
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function ChuruOneHomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Resolve store destination URL dynamically based on environment
  const getStoreUrl = (storeId) => {
    const isLocal = typeof window !== 'undefined' && (
      window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.includes('.onrender.com')
    );

    if (storeId === 'shawarma') {
      return isLocal ? '/?storeId=shawarma' : 'https://shawarma.churuone.in';
    }
    if (storeId === 'nash-studio') {
      return isLocal ? '/?storeId=nash-studio' : 'https://nash.churuone.in';
    }
    return `/?storeId=${storeId}`;
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
    <div className="min-h-screen bg-white text-zinc-900 font-sans antialiased selection:bg-zinc-900 selection:text-white">
      
      {/* ─── Top Brand Navigation Bar ────────────────────────────── */}
      <header className="border-b border-zinc-200 bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          
          {/* Logo / Brand Mark (Minimal C1 only) */}
          <Link to="/" className="flex items-center group" aria-label="ChuruOne Home">
            <div className="w-8 h-8 rounded-none bg-zinc-950 flex items-center justify-center text-white font-medium text-xs tracking-widest hover:bg-black transition-colors">
              C1
            </div>
          </Link>

          {/* Clean Action Button */}
          <div className="flex items-center gap-4">
            <Link 
              to="/auth" 
              className="bg-zinc-950 hover:bg-black text-white text-xs uppercase tracking-widest font-medium px-4 py-2 transition-colors inline-flex items-center gap-2"
            >
              <User className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>Create</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Quiet Luxury Hero Section with Continuous Dynamic Motion ─ */}
      <section className="relative overflow-hidden pt-16 pb-12 sm:pt-20 sm:pb-16 border-b border-zinc-100">
        
        {/* Continuous Ambient Architectural Accents (Slow Infinite Rotation) */}
        <motion.div
          className="absolute -top-10 right-4 sm:right-16 pointer-events-none opacity-20 hidden md:block"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 45, ease: "linear" }}
        >
          <svg width="110" height="110" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="0.75" strokeDasharray="3 3" className="text-zinc-900" />
            <path d="M50 8V92M8 50H92" stroke="currentColor" strokeWidth="0.5" className="text-zinc-900" />
            <circle cx="50" cy="50" r="4" fill="currentColor" className="text-zinc-900" />
          </svg>
        </motion.div>

        <motion.div
          className="absolute -bottom-8 left-4 sm:left-16 pointer-events-none opacity-20 hidden md:block"
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 55, ease: "linear" }}
        >
          <svg width="95" height="95" viewBox="0 0 100 100" fill="none">
            <rect x="18" y="18" width="64" height="64" stroke="currentColor" strokeWidth="0.75" strokeDasharray="4 4" className="text-zinc-900" />
            <circle cx="50" cy="50" r="24" stroke="currentColor" strokeWidth="0.5" className="text-zinc-900" />
            <path d="M50 20L50 80" stroke="currentColor" strokeWidth="0.5" className="text-zinc-900" />
          </svg>
        </motion.div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center z-10">
          
          {/* Continuous Live Radar Status Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-zinc-200 bg-white mb-5 shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
            </span>
            <span className="text-[9px] uppercase tracking-[0.25em] font-semibold text-zinc-700">
              LIVE CITY DIRECTORY • CHURU REALTIME
            </span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-zinc-950 leading-[1.12]">
              Curated Local Establishments.
            </h1>

            {/* CHURUONE & CITY DIRECTORY positioned right below the curated line */}
            <div className="mt-3.5 sm:mt-4 flex flex-col items-center justify-center">
              <span className="text-sm sm:text-base font-bold tracking-[0.28em] uppercase text-zinc-950">
                CHURUONE
              </span>
              <span className="text-[10px] sm:text-xs font-semibold tracking-[0.35em] uppercase text-zinc-400 mt-1">
                CITY DIRECTORY
              </span>
            </div>
          </motion.div>

          {/* Minimal Search & Filter Strip */}
          <motion.div 
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 sm:mt-10 max-w-lg mx-auto"
          >
            <div className="border border-zinc-200 bg-white p-2 flex items-center gap-2 focus-within:border-zinc-900 transition-colors">
              <Search className="w-4 h-4 text-zinc-400 ml-2 shrink-0 stroke-[1.5]" />
              <input
                type="text"
                placeholder="Search establishment or service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none py-1"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="text-[10px] uppercase font-semibold text-zinc-400 hover:text-zinc-900 px-2 tracking-wider"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Subtle Filter Tabs */}
            <div className="flex items-center justify-center gap-6 mt-6">
              {[
                { id: 'all', label: 'All Partners' },
                { id: 'dining', label: 'Dining' },
                { id: 'salon', label: 'Salon & Grooming' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`text-xs uppercase tracking-widest pb-1 transition-all ${
                    selectedCategory === tab.id
                      ? 'text-zinc-950 font-semibold border-b border-zinc-950'
                      : 'text-zinc-400 font-normal hover:text-zinc-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </motion.div>

        </div>
      </section>

      {/* ─── Continuous Infinite Live Marquee Ticker ──────────────── */}
      <div className="w-full overflow-hidden border-b border-zinc-200 bg-zinc-50/75 py-2.5">
        <motion.div
          className="flex items-center gap-8 whitespace-nowrap text-[10px] sm:text-[11px] font-semibold tracking-[0.25em] uppercase text-zinc-500"
          animate={{ x: [0, -1080] }}
          transition={{ repeat: Infinity, ease: "linear", duration: 25 }}
        >
          {[
            'SHAWARMA NIGHTS • DINING',
            'DIRECT UPI SETTLEMENT',
            'NASH STUDIO • GROOMING',
            'ZERO COMMISSION',
            'CHURUONE VERIFIED NETWORK',
            'DIRECT STORE ORDERS',
            'REALTIME DUKANDAR SYNC',
            'SHAWARMA NIGHTS • DINING',
            'DIRECT UPI SETTLEMENT',
            'NASH STUDIO • GROOMING',
            'ZERO COMMISSION',
            'CHURUONE VERIFIED NETWORK',
            'DIRECT STORE ORDERS',
            'REALTIME DUKANDAR SYNC'
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-8 shrink-0">
              <span>{item}</span>
              <span className="text-zinc-300 font-light select-none">/</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ─── Establishments Grid (Pure Editorial Luxury) ─────────── */}
      <section className="py-16 sm:py-20 max-w-6xl mx-auto px-4 sm:px-6">
        
        <div className="flex items-center justify-between mb-8 pb-3 border-b border-zinc-100">
          <span className="text-[11px] uppercase tracking-[0.25em] font-medium text-zinc-400">
            ACTIVE STORES ({filteredStores.length})
          </span>
          <span className="text-xs text-zinc-500 font-normal">
            Direct Delivery & Slot Reservation
          </span>
        </div>

        {/* Store Cards Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12"
        >
          {filteredStores.map((store) => {
            const destinationUrl = getStoreUrl(store.id);

            return (
              <div 
                key={store.id}
                className="border border-zinc-200 bg-white flex flex-col justify-between group hover:border-zinc-400 transition-colors"
              >
                <div>
                  {/* Image Viewport */}
                  <a 
                    href={destinationUrl} 
                    className="block relative h-64 sm:h-72 w-full overflow-hidden bg-zinc-100"
                  >
                    <img 
                      src={store.image} 
                      alt={store.name} 
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500 ease-out"
                    />

                    {/* Minimalist Monochrome Tag Overlay */}
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                      <span className="bg-zinc-950 text-white text-[9px] uppercase tracking-[0.2em] font-medium px-2 py-0.5 flex items-center gap-1.5">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                        </span>
                        <span>OPEN NOW</span>
                      </span>
                      <span className="bg-white border border-zinc-200 text-zinc-900 text-[9px] uppercase tracking-[0.2em] font-medium px-2 py-0.5">
                        {store.categoryLabel}
                      </span>
                    </div>

                    <div className="absolute bottom-4 right-4 bg-white border border-zinc-200 px-2 py-0.5 text-[11px] font-semibold text-zinc-950 flex items-center gap-1">
                      <Star className="w-3 h-3 fill-zinc-950 text-zinc-950" />
                      <span>{store.rating}</span>
                    </div>
                  </a>

                  {/* Editorial Body */}
                  <div className="p-6 sm:p-7">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-xl sm:text-2xl font-light tracking-tight text-zinc-950">
                          {store.name}
                        </h2>
                        <p className="text-xs text-zinc-600 font-medium mt-1">
                          {store.tagline}
                        </p>
                      </div>

                      <a 
                        href={destinationUrl} 
                        className="text-zinc-400 group-hover:text-zinc-950 transition-colors p-1"
                        aria-label={`Open ${store.name}`}
                      >
                        <ArrowUpRight className="w-5 h-5 stroke-[1.5]" />
                      </a>
                    </div>

                    <p className="text-xs text-zinc-500 leading-relaxed mt-3 line-clamp-2">
                      {store.description}
                    </p>

                    {/* Metadata Line */}
                    <div className="mt-5 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 stroke-[1.5] text-zinc-400" />
                        <span>{store.timing}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 stroke-[1.5] text-zinc-400" />
                        <span>{store.location}</span>
                      </div>
                      <div>
                        <span>{store.minOrder}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Direct Action Link */}
                <div className="p-6 sm:p-7 pt-0">
                  <a
                    href={destinationUrl}
                    className="w-full bg-zinc-950 hover:bg-black text-white py-3.5 px-4 text-xs uppercase tracking-[0.18em] font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    <span>{store.ctaText}</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[1.5]" />
                  </a>
                </div>
              </div>
            );
          })}
        </motion.div>

        {filteredStores.length === 0 && (
          <div className="border border-zinc-200 p-12 text-center my-8">
            <Store className="w-6 h-6 text-zinc-400 mx-auto mb-2 stroke-[1.5]" />
            <h3 className="text-sm font-medium text-zinc-800">No establishments match your search</h3>
            <p className="text-xs text-zinc-400 mt-1">Try another keyword or reset the category filter.</p>
          </div>
        )}
      </section>

      {/* ─── Elevated Editorial About Section ───────────────────── */}
      <section className="py-20 sm:py-24 bg-[#FAFAFA] border-t border-zinc-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          
          {/* Section Header */}
          <div className="max-w-2xl mb-14">
            <span className="text-[10px] font-semibold tracking-[0.3em] uppercase text-zinc-400 block mb-2">
              01 / PLATFORM ARCHITECTURE
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-zinc-950">
              Direct City Commerce Protocol.
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 mt-3 font-normal leading-relaxed">
              ChuruOne provides dedicated digital commerce infrastructure for premier local merchants, eliminating third-party aggregator markups while offering authentic in-store pricing to citizens.
            </p>
          </div>

          {/* 3 Luxury Architectural Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            
            <div className="border border-zinc-200 bg-white p-7 sm:p-8 flex flex-col justify-between hover:border-zinc-400 transition-colors shadow-2xs">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[11px] font-mono tracking-widest text-zinc-400 font-semibold">
                    01
                  </span>
                  <span className="text-[9px] uppercase tracking-[0.2em] font-semibold text-zinc-950 bg-zinc-100 px-2.5 py-1">
                    0% Commission
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold tracking-tight text-zinc-950">
                  Authentic Direct Stores
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed mt-2.5">
                  Each verified partner operates their own official digital store with transparent menus, original recipes, and zero aggregator price inflation.
                </p>
              </div>
              <div className="mt-6 pt-5 border-t border-zinc-100 flex items-center gap-2 text-[11px] font-medium text-zinc-400">
                <Store className="w-3.5 h-3.5 stroke-[1.5]" />
                <span>True In-Store Rates</span>
              </div>
            </div>

            <div className="border border-zinc-200 bg-white p-7 sm:p-8 flex flex-col justify-between hover:border-zinc-400 transition-colors shadow-2xs">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[11px] font-mono tracking-widest text-zinc-400 font-semibold">
                    02
                  </span>
                  <span className="text-[9px] uppercase tracking-[0.2em] font-semibold text-zinc-950 bg-zinc-100 px-2.5 py-1">
                    Direct UPI Settle
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold tracking-tight text-zinc-950">
                  Instant Bank Settlement
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed mt-2.5">
                  100% of order totals and advance booking tokens settle straight into verified merchant bank accounts without third-party delay.
                </p>
              </div>
              <div className="mt-6 pt-5 border-t border-zinc-100 flex items-center gap-2 text-[11px] font-medium text-zinc-400">
                <Smartphone className="w-3.5 h-3.5 stroke-[1.5]" />
                <span>Zero Escrow Intermediaries</span>
              </div>
            </div>

            <div className="border border-zinc-200 bg-white p-7 sm:p-8 flex flex-col justify-between hover:border-zinc-400 transition-colors shadow-2xs">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[11px] font-mono tracking-widest text-zinc-400 font-semibold">
                    03
                  </span>
                  <span className="text-[9px] uppercase tracking-[0.2em] font-semibold text-zinc-950 bg-zinc-100 px-2.5 py-1">
                    Universal SSO
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold tracking-tight text-zinc-950">
                  Unified Citizen Identity
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed mt-2.5">
                  One master ChuruOne account securely connects food delivery, salon appointments, and future municipal services with complete privacy.
                </p>
              </div>
              <div className="mt-6 pt-5 border-t border-zinc-100 flex items-center gap-2 text-[11px] font-medium text-zinc-400">
                <ShieldCheck className="w-3.5 h-3.5 stroke-[1.5]" />
                <span>Privacy-First Architecture</span>
              </div>
            </div>

          </div>

          {/* Minimalist Trust & Status Strip */}
          <div className="mt-12 py-6 px-6 sm:px-8 border border-zinc-200 bg-white flex flex-wrap items-center justify-between gap-4 text-xs text-zinc-600 font-medium">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Direct Store Ordering</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
              <span>Zero Aggregator Commission</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
              <span>Direct Merchant UPI</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Realtime Dukandar Sync</span>
            </div>
          </div>

          {/* Minimal Merchant Access Link */}
          <div className="mt-12 pt-8 border-t border-zinc-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xs uppercase tracking-wider font-semibold text-zinc-950">
                Operating a store or salon in Churu?
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Manage orders, configure menus, and track appointments via Dukandar Portal.
              </p>
            </div>

            <a
              href="/admin"
              className="text-xs uppercase tracking-widest font-semibold text-zinc-900 hover:text-black border-b border-zinc-900 pb-0.5 transition-colors inline-flex items-center gap-1.5"
            >
              <span>Access Dukandar Portal</span>
              <ArrowRight className="w-3 h-3 stroke-[1.5]" />
            </a>
          </div>

        </div>
      </section>

      {/* ─── Architectural Minimal Footer ───────────────────────── */}
      <footer className="border-t border-zinc-200 bg-white py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 text-xs text-zinc-400">
          <div>
            <div className="font-semibold tracking-widest uppercase text-zinc-900">
              CHURUONE
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              Churu, Rajasthan 331001 • Direct Commerce Infrastructure
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-5 text-zinc-500 text-[11px] font-medium uppercase tracking-wider">
            <a href={getStoreUrl('shawarma')} className="hover:text-zinc-950 transition-colors">
              Shawarma Nights
            </a>
            <a href={getStoreUrl('nash-studio')} className="hover:text-zinc-950 transition-colors">
              Nash Studio
            </a>
            <Link to="/admin" className="hover:text-zinc-950 transition-colors">
              Merchant OS
            </Link>
            <Link to="/auth" className="hover:text-zinc-950 transition-colors">
              Account
            </Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
