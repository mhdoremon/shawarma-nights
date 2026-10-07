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
  Star
} from 'lucide-react';
import { Link } from 'react-router-dom';

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
          
          {/* Logo / Brand Name */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-none bg-zinc-950 flex items-center justify-center text-white font-medium text-xs tracking-widest">
              C1
            </div>
            <div className="flex flex-col">
              <span className="text-sm sm:text-base font-semibold tracking-[0.2em] uppercase text-zinc-950">
                CHURUONE
              </span>
              <span className="text-[9px] uppercase tracking-[0.25em] text-zinc-400 font-medium -mt-0.5">
                CITY DIRECTORY
              </span>
            </div>
          </Link>

          {/* Clean Navigation Links */}
          <div className="flex items-center gap-4 sm:gap-6">
            <Link 
              to="/admin" 
              className="text-xs tracking-wider uppercase font-medium text-zinc-500 hover:text-zinc-950 transition-colors flex items-center gap-1.5"
            >
              <Store className="w-3.5 h-3.5 stroke-[1.5]" />
              <span className="hidden sm:inline">Merchant</span> Portal
            </Link>

            <Link 
              to="/auth" 
              className="border border-zinc-900 text-zinc-950 hover:bg-zinc-950 hover:text-white text-xs uppercase tracking-widest font-medium px-4 py-2 transition-colors inline-block"
            >
              Create your ChuruOne account
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Quiet Luxury Hero Section ──────────────────────────── */}
      <section className="pt-16 pb-12 sm:pt-24 sm:pb-16 border-b border-zinc-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="text-[10px] sm:text-[11px] font-medium tracking-[0.3em] uppercase text-zinc-400">
              CHURU, RAJASTHAN
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-light tracking-tight text-zinc-950 leading-[1.15]">
            Curated Local Establishments.
          </h1>

          <p className="mt-4 sm:mt-5 text-sm sm:text-base text-zinc-500 max-w-xl mx-auto font-normal leading-relaxed">
            Direct digital ordering and salon booking from premier local stores. Transparent pricing with zero aggregator commission.
          </p>

          {/* Minimal Search & Filter Strip */}
          <div className="mt-8 sm:mt-10 max-w-lg mx-auto">
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
          </div>

        </div>
      </section>

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
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
                      <span className="bg-zinc-950 text-white text-[9px] uppercase tracking-[0.2em] font-medium px-2 py-0.5">
                        OPEN NOW
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
        </div>

        {filteredStores.length === 0 && (
          <div className="border border-zinc-200 p-12 text-center my-8">
            <Store className="w-6 h-6 text-zinc-400 mx-auto mb-2 stroke-[1.5]" />
            <h3 className="text-sm font-medium text-zinc-800">No establishments match your search</h3>
            <p className="text-xs text-zinc-400 mt-1">Try another keyword or reset the category filter.</p>
          </div>
        )}
      </section>

      {/* ─── Compact Editorial Summary / About the Network ─────── */}
      <section className="py-16 bg-white border-t border-zinc-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          
          <div className="max-w-2xl mb-12">
            <span className="text-[10px] font-medium tracking-[0.3em] uppercase text-zinc-400 block mb-2">
              ABOUT THE NETWORK
            </span>
            <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-zinc-950">
              Direct City Commerce.
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 mt-2 font-normal leading-relaxed">
              ChuruOne provides dedicated digital commerce infrastructure for local merchants, eliminating aggregator commission markups while preserving customer privacy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="border-t border-zinc-200 pt-5">
              <span className="text-[10px] tracking-widest uppercase font-semibold text-zinc-900 block mb-1">
                01 / DIRECT STOREFRONTS
              </span>
              <p className="text-xs text-zinc-500 leading-relaxed mt-2">
                Each verified partner operates their own official web store with direct menus, custom rules, and zero intermediary fees.
              </p>
            </div>

            <div className="border-t border-zinc-200 pt-5">
              <span className="text-[10px] tracking-widest uppercase font-semibold text-zinc-900 block mb-1">
                02 / DIRECT BANK UPI
              </span>
              <p className="text-xs text-zinc-500 leading-relaxed mt-2">
                Orders and advance booking tokens settle directly into merchant UPI accounts. Clean, instant, and middleman-free.
              </p>
            </div>

            <div className="border-t border-zinc-200 pt-5">
              <span className="text-[10px] tracking-widest uppercase font-semibold text-zinc-900 block mb-1">
                03 / UNIFIED SINGLE SIGN-ON
              </span>
              <p className="text-xs text-zinc-500 leading-relaxed mt-2">
                One unified ChuruOne identity seamlessly links across all city stores for hassle-free order tracking and appointment history.
              </p>
            </div>
          </div>

          {/* Minimal Merchant Portal Row */}
          <div className="mt-12 pt-8 border-t border-zinc-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xs uppercase tracking-wider font-semibold text-zinc-950">
                Operating a store in Churu?
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Manage orders, configure catalog items, and view live analytics through the Merchant OS.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/admin"
                className="text-xs uppercase tracking-widest font-medium text-zinc-900 hover:text-black border-b border-zinc-900 pb-0.5 transition-colors"
              >
                Open Merchant Portal →
              </Link>
            </div>
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
