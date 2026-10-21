import React, { useState, useEffect, useMemo } from 'react';
import { useMaster } from '../context/MasterContext';
import { 
  UtensilsCrossed, 
  Search, 
  Filter, 
  Check, 
  X, 
  Eye, 
  EyeOff, 
  Store, 
  Sparkles, 
  RefreshCw, 
  Tag, 
  IndianRupee, 
  SlidersHorizontal,
  ChevronDown,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { getImageUrl } from '../../../utils/imageHelper';

export default function CityProductsTab() {
  const { 
    cityProducts, 
    isLoadingCityProducts, 
    loadCityProducts, 
    toggleProductMarketplaceVisibility, 
    showToast 
  } = useMaster();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStore, setSelectedStore] = useState('all');
  const [selectedVisibility, setSelectedVisibility] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [togglingId, setTogglingId] = useState(null);

  // Load city products on mount
  useEffect(() => {
    loadCityProducts();
  }, [loadCityProducts]);

  // Unique stores and categories
  const storesList = useMemo(() => {
    const map = new Map();
    cityProducts.forEach(p => {
      if (p.storeId && !map.has(p.storeId)) {
        map.set(p.storeId, p.storeName || p.storeId);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [cityProducts]);

  const categoriesList = useMemo(() => {
    const set = new Set();
    cityProducts.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort();
  }, [cityProducts]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return cityProducts.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        (item.name || '').toLowerCase().includes(q) ||
        (item.description || '').toLowerCase().includes(q) ||
        (item.category || '').toLowerCase().includes(q) ||
        (item.storeName || '').toLowerCase().includes(q);

      const matchesStore = selectedStore === 'all' || item.storeId === selectedStore;
      
      const isVisible = item.visibleOnChuruOne !== false && item.marketplaceVisible !== false;
      const matchesVisibility = selectedVisibility === 'all' || 
        (selectedVisibility === 'visible' && isVisible) ||
        (selectedVisibility === 'hidden' && !isVisible);

      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;

      return matchesSearch && matchesStore && matchesVisibility && matchesCategory;
    });
  }, [cityProducts, searchQuery, selectedStore, selectedVisibility, selectedCategory]);

  // Summary counts
  const totalCount = cityProducts.length;
  const visibleCount = cityProducts.filter(p => p.visibleOnChuruOne !== false && p.marketplaceVisible !== false).length;
  const hiddenCount = totalCount - visibleCount;

  // Handle visibility toggle
  const handleToggle = async (item) => {
    const currentVis = item.visibleOnChuruOne !== false && item.marketplaceVisible !== false;
    const nextVis = !currentVis;
    setTogglingId(`${item.storeId}-${item.id}`);

    try {
      await toggleProductMarketplaceVisibility(item.storeId, item.id, nextVis);
    } catch (e) {
      showToast('Toggle failed: ' + e.message, 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const getStoreBadgeColor = (sId) => {
    if (sId === 'shawarma') return 'bg-red-50 text-red-700 border-red-200';
    if (sId === 'skyline') return 'bg-zinc-900 text-white border-zinc-700';
    if (sId === 'nash-studio') return 'bg-amber-50 text-amber-800 border-amber-300';
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      
      {/* 1. TOP HEADER & EXPLANATION BANNER */}
      <div className="bg-gradient-to-r from-stone-900 via-zinc-900 to-black text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-gradient-to-l from-amber-500/20 to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400 text-stone-950 text-xs font-black uppercase tracking-wider shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ChuruOne Marketplace Catalog Power</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              CITY PRODUCTS & VISIBILITY CONTROL
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 max-w-2xl leading-relaxed">
              Dukandaro dwara list kiye gaye sabhi products yahan dekhein. Aap kisi bhi product par 
              <strong className="text-amber-300 font-bold"> "Visible on ChuruOne"</strong> toggle lagakar decide kar sakte hain ki woh ChuruOne marketplace par dikhega ya nahi. Dukandar ki apni dukan par woh hamesha live rahega.
            </p>
          </div>

          <button
            onClick={() => loadCityProducts()}
            disabled={isLoadingCityProducts}
            className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 border border-white/20 active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingCityProducts ? 'animate-spin' : ''}`} />
            <span>Sync Fresh Catalog</span>
          </button>
        </div>

        {/* Quick Stats Pill Row */}
        <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-xs rounded-2xl p-3 sm:p-4 border border-white/10">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Total Listed Products</span>
            <span className="text-xl sm:text-2xl font-black text-white">{totalCount}</span>
          </div>
          <div className="bg-emerald-500/10 backdrop-blur-xs rounded-2xl p-3 sm:p-4 border border-emerald-500/20">
            <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">Live on ChuruOne</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-400">{visibleCount}</span>
          </div>
          <div className="bg-red-500/10 backdrop-blur-xs rounded-2xl p-3 sm:p-4 border border-red-500/20">
            <span className="text-[10px] font-bold text-red-300 uppercase tracking-wider block">Hidden from ChuruOne</span>
            <span className="text-xl sm:text-2xl font-black text-red-400">{hiddenCount}</span>
          </div>
        </div>
      </div>

      {/* 2. FILTER & SEARCH CONTROLS */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xl border-0 space-y-4">
        
        {/* Search Row */}
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product name, category, or dukan name..."
            className="w-full bg-[#FFFBF7] rounded-2xl pl-11 pr-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all shadow-xs border-0"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          
          {/* Store Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-zinc-400 mr-1 flex items-center gap-1">
              <Store className="w-3.5 h-3.5" /> Dukan:
            </span>
            <button
              onClick={() => setSelectedStore('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                selectedStore === 'all'
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              All Stores ({totalCount})
            </button>
            {storesList.map(st => {
              const count = cityProducts.filter(p => p.storeId === st.id).length;
              return (
                <button
                  key={st.id}
                  onClick={() => setSelectedStore(st.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    selectedStore === st.id
                      ? 'bg-zinc-900 text-white shadow-sm'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  {st.name} ({count})
                </button>
              );
            })}
          </div>

          {/* Visibility Filter */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSelectedVisibility('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedVisibility === 'all'
                  ? 'bg-amber-500 text-stone-950 font-black shadow-xs'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedVisibility('visible')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                selectedVisibility === 'visible'
                  ? 'bg-emerald-600 text-white font-black shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Live ({visibleCount})</span>
            </button>
            <button
              onClick={() => setSelectedVisibility('hidden')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                selectedVisibility === 'hidden'
                  ? 'bg-red-600 text-white font-black shadow-xs'
                  : 'bg-red-50 text-red-800 hover:bg-red-100'
              }`}
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span>Hidden ({hiddenCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. PRODUCT CATALOG GRID / TABLE */}
      {isLoadingCityProducts && cityProducts.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center shadow-lg border-0 space-y-3">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
          <p className="text-sm font-bold text-zinc-700">Loading City Catalog...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center shadow-lg border-0 space-y-3">
          <UtensilsCrossed className="w-10 h-10 text-zinc-300 mx-auto" />
          <h3 className="text-base font-black text-zinc-900">Koi Product Nahi Mila</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Aapke diye gaye filter ya search query se match karta hua koi product nahi hai. Filter reset karke dekhein.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((item) => {
            const isVisible = item.visibleOnChuruOne !== false && item.marketplaceVisible !== false;
            const isToggling = togglingId === `${item.storeId}-${item.id}`;
            const itemPrice = Number(item.price) || 0;
            const originalPrice = Number(item.originalPrice || item.mrp) || 0;
            const discountPct = originalPrice > itemPrice 
              ? Math.round(((originalPrice - itemPrice) / originalPrice) * 100) 
              : 0;

            return (
              <div
                key={`${item.storeId}-${item.id}`}
                className={`bg-white rounded-3xl p-4 sm:p-5 shadow-lg border transition-all flex flex-col justify-between ${
                  isVisible ? 'border-zinc-200 hover:border-zinc-300' : 'border-red-200/80 bg-red-50/20'
                }`}
              >
                <div>
                  {/* Top Store Badge & Visibility Status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${getStoreBadgeColor(item.storeId)}`}>
                      {item.storeName || item.storeId}
                    </span>

                    <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                      isVisible 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {isVisible ? <Check className="w-3 h-3 stroke-[3]" /> : <X className="w-3 h-3 stroke-[3]" />}
                      <span>{isVisible ? 'Live on ChuruOne' : 'Hidden from ChuruOne'}</span>
                    </span>
                  </div>

                  {/* Thumbnail + Details */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-zinc-100 shrink-0 overflow-hidden border border-zinc-200 shadow-2xs">
                      <img
                        src={getImageUrl(item.image || item.img)}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80';
                        }}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-black text-zinc-900 leading-snug line-clamp-1">
                        {item.name}
                      </h4>
                      <p className="text-[11px] text-zinc-500 capitalize mt-0.5">
                        Category: {item.category || item.storeVertical || 'General'}
                      </p>

                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-base font-black text-zinc-900">
                          ₹{itemPrice}
                        </span>
                        {originalPrice > itemPrice && (
                          <span className="text-xs text-zinc-400 line-through font-medium">
                            ₹{originalPrice}
                          </span>
                        )}
                        {discountPct > 0 && (
                          <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md">
                            {discountPct}% OFF
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {item.description && (
                    <p className="text-xs text-zinc-500 mt-3 line-clamp-2 leading-relaxed bg-[#FFFBF7] p-2 rounded-xl">
                      {item.description}
                    </p>
                  )}
                </div>

                {/* BOTTOM ACTION: SUPER ADMIN VISIBILITY TOGGLE */}
                <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between gap-3">
                  <div className="text-[11px] text-zinc-400 font-medium">
                    {isVisible ? 'Dikh raha hai ChuruOne par' : 'Sirf dukan par dikhega'}
                  </div>

                  <button
                    onClick={() => handleToggle(item)}
                    disabled={isToggling}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95 ${
                      isVisible
                        ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md'
                    }`}
                  >
                    {isToggling ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : isVisible ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Hide From ChuruOne</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Show On ChuruOne</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
