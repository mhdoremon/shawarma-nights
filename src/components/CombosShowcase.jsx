import React from 'react';
import { motion } from 'framer-motion';
import { Package, Plus, Sparkles, Check, SlidersHorizontal, Star, Clock } from 'lucide-react';
import { useRealtimeDB } from '../context/RealtimeContext';
import { useCart } from '../context/CartContext';
import { MENU_ITEMS } from '../data/menuData';
import { getImageUrl, handleImageError } from '../utils/imageHelper';

export default function CombosShowcase({ onSelectForCustomize }) {
  const { menu } = useRealtimeDB();
  const { cart, addToCart } = useCart();

  // Combine live menu or fallback to static MENU_ITEMS
  const allDishes = (menu && menu.length > 0) ? menu : MENU_ITEMS;

  // Filter combo items (isCombo === true or category === 'combos')
  const combos = (allDishes || []).filter(
    (item) => item && item.available !== false && (item.isCombo === true || item.category === 'combos')
  );

  if (!combos || combos.length === 0) {
    return null;
  }

  // Helper to check quantity in cart
  const getCartQty = (id) =>
    cart.filter((ci) => ci.itemId === id).reduce((sum, ci) => sum + ci.quantity, 0);

  // Helper to extract or parse included items
  const getIncludedItems = (combo) => {
    if (Array.isArray(combo.comboItems) && combo.comboItems.length > 0) {
      return combo.comboItems;
    }
    if (combo.description && combo.description.includes('+')) {
      return combo.description.split('+').map((s, idx) => ({
        id: `parsed-${idx}`,
        name: s.trim(),
        price: null
      }));
    }
    return [
      { id: '1', name: combo.name, price: combo.price }
    ];
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-8">
      {/* Clean Section Header (No big black box) */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-[#DC2626] text-xs font-black uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Value Feasts • बड़ी बचत</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-zinc-900 tracking-tight">
            Combo <span className="text-[#DC2626]">Meals</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 font-medium mt-0.5">
            Handcrafted feasts bundled with extra savings
          </p>
        </div>
        <div className="text-xs font-bold text-zinc-500 bg-white px-3.5 py-1.5 rounded-full border border-zinc-200 shadow-2xs self-start sm:self-end">
          {combos.length} {combos.length === 1 ? 'Combo available' : 'Combos available'}
        </div>
      </div>

      {/* Combos Grid - Compact Cards Matching FoodCard.jsx dimensions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {combos.map((combo) => {
          const inCart = getCartQty(combo.id);
          const included = getIncludedItems(combo);
          const orig = Number(combo.originalPrice) || 0;
          const curr = Number(combo.price) || 0;
          const savings = orig > curr ? orig - curr : 0;
          const discountPct = orig > curr ? Math.round((savings / orig) * 100) : 0;

          return (
            <motion.div
              key={combo.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.25 }}
              className="group bg-white rounded-3xl border border-zinc-200/90 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Top Image Container */}
                <div className="relative h-44 sm:h-48 overflow-hidden bg-zinc-100">
                  <img
                    src={getImageUrl(combo.image)}
                    alt={combo.name}
                    onError={handleImageError}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/25" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md text-amber-300 text-[10px] font-black uppercase tracking-wider border border-amber-400/30 flex items-center gap-1 shadow-sm">
                      <Package className="w-3 h-3 text-amber-400" />
                      <span>{combo.badge || 'COMBO MEAL'}</span>
                    </span>

                    {savings > 0 && (
                      <span className="px-2.5 py-1 rounded-full bg-[#DC2626] text-white text-[10px] font-black shadow-sm">
                        SAVE ₹{savings} ({discountPct}% OFF)
                      </span>
                    )}
                  </div>

                  {/* In-Cart Indicator */}
                  {inCart > 0 && (
                    <div className="absolute bottom-3 right-3 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-bold shadow-md flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>{inCart} in bag</span>
                    </div>
                  )}

                  {/* Rating & Prep Time */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-2 text-[11px] text-white font-bold drop-shadow-md">
                    <span className="flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-xs">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{combo.rating || 4.9}</span>
                    </span>
                    <span className="flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-xs">
                      <Clock className="w-3 h-3" />
                      <span>{combo.prepTime || '15-20 min'}</span>
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4 sm:p-4.5 space-y-2">
                  <div>
                    <h3 className="text-base font-extrabold text-zinc-900 group-hover:text-[#DC2626] transition-colors line-clamp-1">
                      {combo.name}
                    </h3>
                    {combo.description && (
                      <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1 leading-relaxed">
                        {combo.description}
                      </p>
                    )}
                  </div>

                  {/* Compact Included Items Pill Strip */}
                  <div className="bg-amber-50/90 border border-amber-200/80 rounded-xl px-2.5 py-1.5 flex items-center gap-1.5 text-[11px] text-amber-950 font-medium">
                    <Package className="w-3.5 h-3.5 text-[#DC2626] shrink-0" />
                    <span className="font-bold shrink-0">Includes:</span>
                    <span className="truncate text-zinc-700">
                      {included.map((i) => i.name).join(' • ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer: Pricing & Action Buttons */}
              <div className="p-4 sm:p-4.5 pt-0 border-t border-zinc-100 mt-2">
                <div className="flex items-center justify-between pt-3">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-black text-zinc-900 font-mono">
                        ₹{curr}
                      </span>
                      {orig > curr && (
                        <span className="text-xs text-zinc-400 line-through">
                          ₹{orig}
                        </span>
                      )}
                    </div>
                    {savings > 0 && (
                      <span className="text-[10px] font-bold text-emerald-600 block">
                        Save ₹{savings} with deal
                      </span>
                    )}
                  </div>

                  {/* Action Buttons: Customize & Quick Add */}
                  <div className="flex items-center gap-1.5">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => onSelectForCustomize && onSelectForCustomize(combo)}
                      className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-black text-white font-bold text-xs flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                      title="Customize combo bread, spice & addons"
                    >
                      <SlidersHorizontal className="w-3 h-3 text-amber-400" />
                      <span>Customize</span>
                    </motion.button>

                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => addToCart(combo)}
                      className="px-3 py-1.5 rounded-xl bg-[#DC2626] hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                      title="Quick add combo to cart"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Add</span>
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
