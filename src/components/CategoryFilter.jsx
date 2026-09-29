import React from 'react';
import { CATEGORIES } from '../data/menuData';
import { motion } from 'framer-motion';
import { Flame, Sparkles } from 'lucide-react';

export default function CategoryFilter({ 
  selectedCategory, 
  setSelectedCategory,
  dietaryFilter,
  setDietaryFilter,
}) {
  return (
    <div className="sticky top-28 sm:top-24 z-30 bg-[#09090b] border-b border-white/5 py-4 transition-all shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
        
        {/* Horizontal Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none no-scrollbar">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all select-none ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-glow'
                    : 'bg-charcoal-900 border border-white/5 text-zinc-400 hover:text-white hover:border-white/20'
                }`}
              >
                <span className="text-base">{cat.icon}</span>
                <span>{cat.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-white/5 text-zinc-500'
                }`}>
                  {cat.count}
                </span>

                {isActive && (
                  <motion.div
                    layoutId="activeCategoryIndicator"
                    className="absolute -bottom-1 left-4 right-4 h-0.5 bg-brand-400 rounded-full"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Dietary and Quick Filters */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            
            {/* All */}
            <button
              onClick={() => setDietaryFilter('all')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                dietaryFilter === 'all'
                  ? 'bg-white/20 text-white border border-white/30'
                  : 'bg-white/5 text-zinc-400 hover:text-white border border-transparent'
              }`}
            >
              All Items
            </button>

            {/* Non-Veg */}
            <button
              onClick={() => setDietaryFilter('non-veg')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                dietaryFilter === 'non-veg'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : 'bg-white/5 text-zinc-400 hover:text-white border border-transparent'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
              Non-Veg (Chicken & Lamb)
            </button>

            {/* Pure Veg */}
            <button
              onClick={() => setDietaryFilter('veg')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                dietaryFilter === 'veg'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-white/5 text-zinc-400 hover:text-white border border-transparent'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              Pure Veg (Paneer / Falafel)
            </button>

            {/* Spicy */}
            <button
              onClick={() => setDietaryFilter('spicy')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                dietaryFilter === 'spicy'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-white/5 text-zinc-400 hover:text-white border border-transparent'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              Spicy Picks
            </button>

          </div>

          <div className="hidden sm:flex items-center gap-1 text-[11px] text-zinc-500">
            <Sparkles className="w-3 h-3 text-brand-500" />
            <span>Freshly Rolled to Order</span>
          </div>
        </div>

      </div>
    </div>
  );
}
