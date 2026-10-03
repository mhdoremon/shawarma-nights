import React, { useState } from 'react';
import { 
  Search, 
  X, 
  Flame, 
  Clock, 
  Plus, 
  Check, 
  Sparkles, 
  Utensils, 
  Layers, 
  UtensilsCrossed, 
  Package, 
  Coffee,
  SlidersHorizontal,
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useRealtimeDB } from '../context/RealtimeContext';
import { getImageUrl, handleImageError } from '../utils/imageHelper';

// Pure line-art icon mapper
const iconMap = {
  Utensils: Utensils,
  Flame: Flame,
  Sparkles: Sparkles,
  Layers: Layers,
  UtensilsCrossed: UtensilsCrossed,
  Package: Package,
  Coffee: Coffee,
};

export default function MenuSection({ onSelectForCustomize }) {
  const { cart, addToCart } = useCart();
  const { menu, categories, reviews } = useRealtimeDB();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dietaryFilter, setDietaryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Pure live menu from server (Zero mock data fallback)
  const liveMenu = menu || [];

  const DEFAULT_CATEGORIES = [
    { id: 'shawarmas', name: 'Signature Shawarmas', iconKey: 'Flame' },
    { id: 'platters', name: 'Charcoal Platters', iconKey: 'UtensilsCrossed' },
    { id: 'fries', name: 'Loaded Fries', iconKey: 'Layers' },
    { id: 'wings', name: 'Crispy Wings', iconKey: 'Sparkles' },
    { id: 'combos', name: 'Midnight Combos', iconKey: 'Package' },
    { id: 'beverages', name: 'Cold Drinks & Shakes', iconKey: 'Coffee' },
  ];

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

  const dynamicCategories = [
    { id: 'all', name: 'All Dishes', count: liveMenu.length, iconKey: 'Utensils' },
    ...allCategoryList.map((cat) => ({
      ...cat,
      count: liveMenu.filter((i) => i.category === cat.id).length,
    })),
  ];

  const filteredItems = liveMenu.filter((item) => {
    // Category
    if (selectedCategory !== 'all' && item.category !== selectedCategory) {
      return false;
    }

    // Dietary
    if (dietaryFilter === 'non-veg' && item.isVeg) return false;
    if (dietaryFilter === 'veg' && !item.isVeg) return false;
    if (dietaryFilter === 'spicy') {
      const sp = (item.spiceLevel || '').toLowerCase();
      if (!sp.includes('spic') && !sp.includes('fire') && !sp.includes('hot')) {
        return false;
      }
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchCat = item.category.toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchCat) return false;
    }

    return true;
  });

  return (
    <section id="menu" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      
      {/* 1. Search Bar Located Right at the Start of the Menu */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-zinc-400 absolute left-4 pointer-events-none stroke-[2]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search shawarma, fries, platters, or wings..."
            className="w-full bg-zinc-50 hover:bg-zinc-100/70 focus:bg-white border border-zinc-200 focus:border-red-600 rounded-full pl-11 pr-10 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-red-600 transition-all shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 text-zinc-400 hover:text-zinc-700 p-1"
            >
              <X className="w-3.5 h-3.5 stroke-[2]" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Clean Minimal Line Categories Rail */}
      <div className="border-b border-zinc-200/80 pb-4 mb-6">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {dynamicCategories.map((cat) => {
            const IconComponent = iconMap[cat.iconKey] || Utensils;
            const isActive = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all select-none border ${
                  isActive
                    ? 'bg-red-600 text-white border-red-600 shadow-sm'
                    : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300 hover:text-zinc-900'
                }`}
              >
                <IconComponent className="w-3.5 h-3.5 stroke-[2]" />
                <span>{cat.name}</span>
                <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-500'
                }`}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* 3. Subtle Line Dietary Filter */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 font-medium hidden sm:inline">Filter:</span>
            
            <button
              onClick={() => setDietaryFilter('all')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                dietaryFilter === 'all'
                  ? 'bg-zinc-900 text-white border-zinc-900'
                  : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300'
              }`}
            >
              All
            </button>

            <button
              onClick={() => setDietaryFilter('non-veg')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                dietaryFilter === 'non-veg'
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-600 inline-block" />
              Non-Veg
            </button>

            <button
              onClick={() => setDietaryFilter('veg')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                dietaryFilter === 'veg'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
              Pure Veg
            </button>

            <button
              onClick={() => setDietaryFilter('spicy')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                dietaryFilter === 'spicy'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300'
              }`}
            >
              <Flame className="w-3 h-3 stroke-[2] text-amber-600" />
              Spicy
            </button>
          </div>

          <span className="text-xs text-zinc-400 font-medium">
            Showing {filteredItems.length} items
          </span>
        </div>
      </div>

      {/* 4. Innovative Aesthetic Food Presentation */}
      {liveMenu.length === 0 ? (
        <div className="py-20 text-center space-y-3 bg-stone-50 rounded-3xl border-2 border-dashed border-stone-200 p-8 my-6">
          <div className="w-14 h-14 rounded-2xl bg-white border border-stone-200 flex items-center justify-center mx-auto shadow-xs text-stone-500">
            <UtensilsCrossed className="w-7 h-7 stroke-[1.75]" />
          </div>
          <h3 className="text-lg font-black text-stone-900">Kitchen Ready Hai!</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
            Database se sabhi items live sync hote hain. Naye items add hote hi yahan real-time me show honge!
          </p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
            <Search className="w-5 h-5 stroke-[2]" />
          </div>
          <h3 className="text-base font-bold text-zinc-800">No dishes found</h3>
          <p className="text-xs text-zinc-500 max-w-xs mx-auto">
            Try searching for another dish or reset your filters.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setDietaryFilter('all');
            }}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full text-xs font-bold transition-all"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {filteredItems.map((item) => {
            const isOutOfStock = item.available === false;
            const hasOptions = item.options && (item.options.bread || item.options.addons);
            const inCartQty = cart
              .filter((ci) => ci.itemId === item.id)
              .reduce((sum, ci) => sum + ci.quantity, 0);

            const dishReviews = (reviews || []).filter(
              (r) => r.dishId === item.id || (r.dish && r.dish.toLowerCase() === item.name.toLowerCase())
            );
            const hasDishReviews = dishReviews.length > 0;
            const computedRating = hasDishReviews
              ? (dishReviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) / dishReviews.length).toFixed(1)
              : (item.rating || 5.0);
            const computedReviewsCount = hasDishReviews ? dishReviews.length : (item.reviews || 0);

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
                className={`group relative rounded-2xl p-4 flex gap-4 items-center justify-between transition-all duration-200 border ${
                  isOutOfStock
                    ? 'bg-stone-50/80 border-stone-200 opacity-60 grayscale-[35%]'
                    : 'bg-white border-zinc-200/90 hover:border-red-600/50 hover:shadow-sm'
                }`}
              >
                {/* Left: Dish Information */}
                <div className="flex-1 min-w-0 pr-2 space-y-1.5">
                  
                  {/* Veg / Non-Veg Indicator & Badge & Rating */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center ${
                      item.isVeg ? 'border-emerald-600' : 'border-red-600'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-emerald-600' : 'bg-red-600'}`} />
                    </div>

                    {isOutOfStock ? (
                      <span className="text-[10px] font-black bg-stone-200 text-stone-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Out of Stock
                      </span>
                    ) : item.badge ? (
                      <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">
                        {item.badge}
                      </span>
                    ) : null}

                    {/* Live Dynamic Dish Rating */}
                    <div className="flex items-center gap-1 text-[11px] font-bold text-zinc-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60 shadow-2xs">
                      <Star className="w-3 h-3 fill-amber-400 stroke-amber-400" />
                      <span>{computedRating}</span>
                      {computedReviewsCount > 0 && (
                        <span className="text-zinc-400 font-normal text-[10px]">({computedReviewsCount})</span>
                      )}
                    </div>

                    {item.prepTime && (
                      <span className="text-[11px] text-zinc-400 flex items-center gap-1 ml-auto sm:ml-0 font-medium">
                        <Clock className="w-3 h-3 stroke-[1.75]" />
                        {item.prepTime}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className={`text-sm sm:text-base font-bold transition-colors truncate ${
                    isOutOfStock ? 'text-stone-500 line-through decoration-stone-400' : 'text-zinc-900 group-hover:text-red-600'
                  }`}>
                    {item.name}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Price & Action */}
                  <div className="flex items-center justify-between pt-1.5">
                    <div className="flex items-baseline gap-1.5">
                      <span className={`text-base font-extrabold font-display ${isOutOfStock ? 'text-stone-500' : 'text-red-600'}`}>
                        ₹{item.price}
                      </span>
                      {item.originalPrice && (
                        <span className="text-xs text-zinc-400 line-through">
                          ₹{item.originalPrice}
                        </span>
                      )}
                    </div>

                    {/* Button */}
                    {isOutOfStock ? (
                      <button
                        disabled
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-stone-300 bg-stone-100 text-stone-400 text-xs font-bold cursor-not-allowed"
                      >
                        <span>Sold Out</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (hasOptions) {
                            onSelectForCustomize(item);
                          } else {
                            addToCart(item);
                          }
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-red-600 text-red-600 hover:bg-red-600 hover:text-white text-xs font-bold transition-all shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>{hasOptions ? 'Customize' : 'Add'}</span>
                        {inCartQty > 0 && (
                          <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">
                            {inCartQty}
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Right: Dish Photo */}
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden shrink-0 bg-zinc-100 border border-zinc-100">
                  <img
                    src={getImageUrl(item.image)}
                    alt={item.name}
                    onError={handleImageError}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-stone-900/50 flex items-center justify-center p-1">
                      <span className="bg-white/95 text-stone-900 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-xs">
                        Unavailable
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

    </section>
  );
}
