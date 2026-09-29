import React, { useState, useEffect } from 'react';
import { 
  Search, X, Flame, Clock, Plus, Star, Sparkles, 
  Utensils, Layers, UtensilsCrossed, Package, Coffee,
  ChevronLeft, ChevronRight, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CATEGORIES as DEFAULT_CATEGORIES, MENU_ITEMS } from '../data/menuData';
import { useCart } from '../context/CartContext';
import { useRealtimeDB } from '../context/RealtimeContext';

const iconMap = {
  Utensils, Flame, Sparkles, Layers, UtensilsCrossed, Package, Coffee,
};

export default function CarouselShowcase({ onSelectForCustomize }) {
  const { cart, addToCart } = useCart();
  const { menu, categories } = useRealtimeDB();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dietaryFilter, setDietaryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [centerIdx, setCenterIdx] = useState(0);

  // Live menu from server, fallback to default seed items
  const liveMenu = menu && menu.length > 0 ? menu : MENU_ITEMS;

  // Combine categories dynamically
  const baseCategories = categories && categories.length > 0 ? categories : DEFAULT_CATEGORIES;
  const menuCategories = Array.from(new Set(liveMenu.map((i) => i.category).filter(Boolean)));
  const allCategoryList = [...baseCategories];
  menuCategories.forEach((catId) => {
    if (!allCategoryList.find((c) => c.id === catId)) {
      const formattedName = catId
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      allCategoryList.push({ id: catId, name: formattedName, iconKey: 'Utensils' });
    }
  });

  const filteredItems = liveMenu.filter((item) => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (dietaryFilter === 'non-veg' && item.isVeg) return false;
    if (dietaryFilter === 'veg' && !item.isVeg) return false;
    if (dietaryFilter === 'spicy') {
      const sp = (item.spiceLevel || '').toLowerCase();
      if (!sp.includes('spic') && !sp.includes('fire') && !sp.includes('hot')) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (
        !item.name.toLowerCase().includes(q) &&
        !(item.description || '').toLowerCase().includes(q) &&
        !(item.category || '').toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  const total = filteredItems.length;

  useEffect(() => {
    setCenterIdx(0);
  }, [selectedCategory, dietaryFilter, searchQuery, liveMenu.length]);

  const go = (dir) => {
    if (total === 0) return;
    setCenterIdx((p) => (p + dir + total) % total);
  };

  const getItem = (offset) => {
    if (total === 0) return null;
    return filteredItems[(centerIdx + offset + total) % total];
  };

  const discountPercent = (item) =>
    item.originalPrice ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100) : 0;

  const cartQty = (id) =>
    cart.filter((ci) => ci.itemId === id).reduce((s, ci) => s + ci.quantity, 0);

  const handleAdd = (item) => {
    if (item.available === false) return;
    const hasOpt = item.options && (item.options.bread || item.options.addons);
    if (hasOpt && onSelectForCustomize) {
      onSelectForCustomize(item);
    } else {
      addToCart(item);
    }
  };

  return (
    <section id="menu" className="max-w-7xl mx-auto px-4 sm:px-8 py-10 sm:py-16">
      
      {/* Section Title (Exact match to Image 1) */}
      <div className="text-center mb-8">
        <h2 className="text-3xl sm:text-5xl font-black text-zinc-900 tracking-tight">
          Swipe Through <span className="text-[#EA580C]">Deliciousness</span>
        </h2>
      </div>

      {/* Search Input (Centered rounded container) */}
      <div className="max-w-md mx-auto mb-7">
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2 stroke-[2]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search shawarma, fries, wings..."
            className="w-full bg-white border border-zinc-200 focus:border-[#DC2626] rounded-2xl pl-11 pr-10 py-3 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none transition-all shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 cursor-pointer"
            >
              <X className="w-4 h-4 stroke-[2]" />
            </button>
          )}
        </div>
      </div>

      {/* Row 1: Category Chips (Exact match to Image 1) */}
      <div className="flex items-center justify-start md:justify-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-2">
        {allCategoryList.map((cat) => {
          const Icon = iconMap[cat.iconKey] || Utensils;
          const active = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                active
                  ? 'bg-[#DC2626] text-white border-[#DC2626] shadow-sm'
                  : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-300 hover:text-zinc-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5 stroke-[2]" />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Row 2: Dietary Filter Pills (Exact match to Image 1) */}
      <div className="flex items-center justify-start md:justify-center gap-2 mb-8">
        {[
          { key: 'all', label: 'All', color: 'bg-zinc-900' },
          { key: 'non-veg', label: 'Non-Veg', color: 'bg-[#DC2626]' },
          { key: 'veg', label: 'Pure Veg', color: 'bg-emerald-600' },
          { key: 'spicy', label: 'Spicy', color: 'bg-orange-500' },
        ].map((d) => {
          const active = dietaryFilter === d.key;
          return (
            <button
              key={d.key}
              onClick={() => setDietaryFilter(d.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                active
                  ? `${d.color} text-white border-transparent shadow-xs`
                  : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300'
              }`}
            >
              {d.key !== 'all' && d.key !== 'spicy' && <span className={`w-2 h-2 rounded-full ${d.color}`} />}
              {d.key === 'spicy' && <Flame className="w-3 h-3 text-orange-500" />}
              <span>{d.label}</span>
            </button>
          );
        })}
      </div>

      {/* ===== THE COVERFLOW 3D CAROUSEL (Image 1) ===== */}
      {total === 0 ? (
        <div className="py-16 text-center space-y-4 bg-white rounded-3xl border border-dashed border-zinc-200 p-8">
          <Search className="w-8 h-8 text-zinc-300 mx-auto stroke-[1.5]" />
          <h3 className="text-lg font-bold text-zinc-800">No dishes found</h3>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setDietaryFilter('all');
            }}
            className="px-5 py-2 bg-[#DC2626] hover:bg-red-700 text-white rounded-full text-xs font-bold transition-all cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <>
          <div className="relative w-full flex items-center justify-center gap-3 sm:gap-6 min-h-[460px] sm:min-h-[500px]">
            {/* Left Arrow Button */}
            <button
              onClick={() => go(-1)}
              className="hidden sm:flex shrink-0 w-11 h-11 rounded-full bg-white border border-zinc-200 hover:border-[#DC2626] text-zinc-600 hover:text-[#DC2626] items-center justify-center transition-all shadow-md hover:shadow-lg z-30 cursor-pointer"
              title="Previous Dish"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
            </button>

            {/* Cards Stage */}
            <div className="relative flex items-center justify-center w-full max-w-4xl">
              {/* Left Peek Card */}
              {total > 1 &&
                (() => {
                  const item = getItem(-1);
                  if (!item) return null;
                  return (
                    <motion.div
                      key={`L-${item.id}`}
                      onClick={() => go(-1)}
                      className="absolute left-0 w-[220px] sm:w-[260px] hidden md:block cursor-pointer z-10 opacity-60 hover:opacity-85 transition-opacity"
                      initial={{ opacity: 0, x: -50 }}
                      animate={{ opacity: 0.6, x: 0, scale: 0.88 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="bg-white rounded-3xl overflow-hidden shadow-md border border-zinc-100">
                        <img src={item.image} alt={item.name} className="w-full h-36 object-cover" />
                        <div className="p-3">
                          <div className="text-xs font-bold text-zinc-800 truncate">{item.name}</div>
                          <div className="text-xs font-bold text-zinc-500 mt-0.5">₹{item.price}</div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })()}

              {/* ====== CENTER HERO CARD (Pixel Match to Image 1) ====== */}
              {(() => {
                const item = getItem(0);
                if (!item) return null;
                const dp = discountPercent(item) || 20; // Default discount badge like image if originalPrice not provided
                const inCart = cartQty(item.id);
                const isOutOfStock = item.available === false;
                const hasOpt = item.options && (item.options.bread || item.options.addons);

                return (
                  <motion.div
                    key={`C-${item.id}`}
                    layout
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.15}
                    onDragEnd={(e, { offset }) => {
                      if (offset.x < -60) go(1);
                      else if (offset.x > 60) go(-1);
                    }}
                    className={`relative w-[92vw] sm:w-[410px] md:w-[430px] bg-white rounded-3xl shadow-xl border border-zinc-100 overflow-hidden z-20 cursor-grab active:cursor-grabbing ${
                      isOutOfStock ? 'opacity-80' : ''
                    }`}
                  >
                    {/* Hero Image & Overlay Badges */}
                    <div className="relative h-56 sm:h-64 overflow-hidden bg-zinc-100">
                      <img
                        src={item.image}
                        alt={item.name}
                        className={`w-full h-full object-cover ${isOutOfStock ? 'grayscale contrast-75' : ''}`}
                      />

                      {/* Top Left Veg/Non-Veg Mark (Image 1) */}
                      <div className="absolute top-3.5 left-3.5">
                        <div className="w-5 h-5 rounded-md bg-white/95 border border-zinc-200 flex items-center justify-center shadow-xs">
                          <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center ${
                            item.isVeg ? 'border-emerald-600' : 'border-[#DC2626]'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              item.isVeg ? 'bg-emerald-600' : 'bg-[#DC2626]'
                            }`} />
                          </div>
                        </div>
                      </div>

                      {/* Top Right Bestseller Badge (Image 1) */}
                      <div className="absolute top-3.5 right-3.5">
                        <div className="bg-black text-white px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider shadow-md">
                          {item.badge || 'BESTSELLER'}
                        </div>
                      </div>

                      {/* Bottom Left Discount Ribbon (Image 1) */}
                      <div className="absolute bottom-3 left-3 bg-[#DC2626] text-white px-2.5 py-1 rounded-md text-xs font-black shadow-md">
                        {dp}% OFF
                      </div>

                      {/* In Cart Indicator */}
                      {inCart > 0 && (
                        <div className="absolute bottom-3 right-3 bg-emerald-600 text-white px-2.5 py-1 rounded-md text-[11px] font-bold shadow-md">
                          {inCart} in bag
                        </div>
                      )}
                    </div>

                    {/* Card Body (Image 1) */}
                    <div className="p-5 sm:p-6 space-y-3 text-left">
                      {/* Rating & Prep Time */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1 font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
                          <span className="text-amber-700 font-bold">{item.rating || 4.9}</span>
                          <span className="text-zinc-400 font-normal">({item.reviews || 1420})</span>
                        </div>

                        <div className="flex items-center gap-1 text-zinc-500 font-medium">
                          <Clock className="w-3.5 h-3.5 stroke-[2]" />
                          <span>{item.prepTime || '15-20 min'}</span>
                        </div>
                      </div>

                      {/* Dish Title */}
                      <h3 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight leading-tight">
                        {item.name}
                      </h3>

                      {/* Description */}
                      <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed line-clamp-2">
                        {item.description}
                      </p>

                      {/* Spicy pill badge (Image 1) */}
                      <div>
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-700 bg-orange-50 border border-orange-200/60 px-2.5 py-0.5 rounded-full">
                          <Flame className="w-3 h-3 text-orange-500" />
                          <span>{item.spiceLevel || 'Spicy'}</span>
                        </span>
                      </div>

                      {/* Price & Action Button (Image 1) */}
                      <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl sm:text-3xl font-black text-zinc-900 font-mono">
                            ₹{item.price}
                          </span>
                          {item.originalPrice ? (
                            <span className="text-xs sm:text-sm text-zinc-400 line-through">
                              ₹{item.originalPrice}
                            </span>
                          ) : (
                            <span className="text-xs sm:text-sm text-zinc-400 line-through">
                              ₹{Math.round(item.price * 1.25)}
                            </span>
                          )}
                        </div>

                        {isOutOfStock ? (
                          <div className="px-5 py-2.5 rounded-full bg-zinc-100 text-zinc-400 font-bold text-xs">
                            Unavailable
                          </div>
                        ) : (
                          <motion.button
                            whileTap={{ scale: 0.94 }}
                            onClick={() => handleAdd(item)}
                            className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#DC2626] hover:bg-red-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
                          >
                            <Plus className="w-4 h-4 stroke-[3]" />
                            <span>{hasOpt ? 'Customize' : 'Add'}</span>
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })()}

              {/* Right Peek Card */}
              {total > 1 &&
                (() => {
                  const item = getItem(1);
                  if (!item) return null;
                  return (
                    <motion.div
                      key={`R-${item.id}`}
                      onClick={() => go(1)}
                      className="absolute right-0 w-[220px] sm:w-[260px] hidden md:block cursor-pointer z-10 opacity-60 hover:opacity-85 transition-opacity"
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 0.6, x: 0, scale: 0.88 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="bg-white rounded-3xl overflow-hidden shadow-md border border-zinc-100">
                        <img src={item.image} alt={item.name} className="w-full h-36 object-cover" />
                        <div className="p-3">
                          <div className="text-xs font-bold text-zinc-800 truncate">{item.name}</div>
                          <div className="text-xs font-bold text-zinc-500 mt-0.5">₹{item.price}</div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })()}
            </div>

            {/* Right Arrow Button */}
            <button
              onClick={() => go(1)}
              className="hidden sm:flex shrink-0 w-11 h-11 rounded-full bg-white border border-zinc-200 hover:border-[#DC2626] text-zinc-600 hover:text-[#DC2626] items-center justify-center transition-all shadow-md hover:shadow-lg z-30 cursor-pointer"
              title="Next Dish"
            >
              <ChevronRight className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          {/* Mobile Swipe Buttons */}
          <div className="flex sm:hidden items-center justify-center gap-6 mt-4">
            <button
              onClick={() => go(-1)}
              className="w-10 h-10 rounded-full bg-white border border-zinc-200 text-zinc-700 flex items-center justify-center shadow-xs"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
            </button>
            <span className="text-xs font-bold text-zinc-500 font-mono">
              {centerIdx + 1} / {total}
            </span>
            <button
              onClick={() => go(1)}
              className="w-10 h-10 rounded-full bg-white border border-zinc-200 text-zinc-700 flex items-center justify-center shadow-xs"
            >
              <ChevronRight className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          {/* Pagination Indicator Dots (Exact match to Image 1) */}
          <div className="flex items-center justify-center gap-1.5 mt-6">
            {filteredItems.slice(0, 15).map((item, idx) => (
              <button
                key={item.id || idx}
                onClick={() => setCenterIdx(idx)}
                className={`rounded-full transition-all cursor-pointer ${
                  centerIdx === idx ? 'w-7 h-2 bg-[#DC2626]' : 'w-2 h-2 bg-zinc-300 hover:bg-zinc-400'
                }`}
              />
            ))}
          </div>

          {/* Hint text (Exact match to Image 1) */}
          <p className="text-center text-xs text-zinc-400 mt-2.5 font-medium">
            Drag to explore • Tap side cards to focus
          </p>
        </>
      )}
    </section>
  );
}
