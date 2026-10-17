import React from 'react';
import { motion } from 'framer-motion';
import { Package, Plus, Sparkles, Check, SlidersHorizontal, Flame, Star, Clock } from 'lucide-react';
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
    <section className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
      {/* Section Header */}
      <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-black text-white rounded-3xl p-6 sm:p-10 shadow-2xl border border-zinc-800/80 relative overflow-hidden mb-8">
        {/* Glow ambient background */}
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-[#DC2626]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -top-10 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>SPECIAL VALUE FEASTS • BADI BACHAT</span>
            </div>
            
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Midnight Combos <span className="text-[#DC2626]">&amp; Bundles</span>
            </h2>

            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              Khaas late-night cravings aur dosto ke sath feasts ke liye taiyar kiye gaye exclusive bundles. Har combo me bundled items aur instant savings!
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <div className="px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center">
              <span className="block text-xl sm:text-2xl font-black text-amber-400 font-mono">
                {combos.length}
              </span>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Live Combos
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Combos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3 }}
              className="group bg-white rounded-3xl border border-zinc-200/90 shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Image & Ribbon Banner */}
                <div className="relative h-48 sm:h-52 overflow-hidden bg-zinc-100">
                  <img
                    src={getImageUrl(combo.image)}
                    alt={combo.name}
                    onError={handleImageError}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md text-amber-300 text-[10px] font-black uppercase tracking-wider border border-amber-400/30 flex items-center gap-1.5 shadow-md">
                      <Package className="w-3 h-3 text-amber-400" />
                      <span>{combo.badge || 'COMBO MEAL'}</span>
                    </span>

                    {savings > 0 && (
                      <span className="px-2.5 py-1 rounded-full bg-[#DC2626] text-white text-[11px] font-black shadow-md">
                        SAVE ₹{savings} ({discountPct}% OFF)
                      </span>
                    )}
                  </div>

                  {/* In Bag Indicator */}
                  {inCart > 0 && (
                    <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-bold shadow-md flex items-center gap-1">
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

                {/* Card Body */}
                <div className="p-5 sm:p-6 space-y-4">
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-zinc-900 tracking-tight leading-snug">
                      {combo.name}
                    </h3>
                    {combo.description && (
                      <p className="text-xs text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
                        {combo.description}
                      </p>
                    )}
                  </div>

                  {/* EXACT INCLUDED ITEMS BREAKDOWN BOX (User requirement) */}
                  <div className="bg-[#FFFBF7] border border-amber-200/70 rounded-2xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-black text-amber-950 uppercase tracking-wider">
                      <span className="flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-[#DC2626]" />
                        <span>Included in this Feast ({included.length} items):</span>
                      </span>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Bundled
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {included.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 text-xs font-bold text-zinc-800 bg-white/80 px-2.5 py-1.5 rounded-xl border border-zinc-200/60"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626] shrink-0" />
                          <span className="flex-1 truncate">{item.name}</span>
                          {item.price > 0 && (
                            <span className="text-[10px] text-zinc-400 font-normal line-through">
                              ₹{item.price}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer: Pricing & 2 Action Buttons */}
              <div className="p-5 sm:p-6 pt-0 border-t border-zinc-100 mt-2 space-y-3">
                <div className="flex items-baseline justify-between pt-3">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl sm:text-3xl font-black text-zinc-900 font-mono">
                        ₹{curr}
                      </span>
                      {orig > curr && (
                        <span className="text-xs sm:text-sm text-zinc-400 line-through">
                          ₹{orig}
                        </span>
                      )}
                    </div>
                    {savings > 0 && (
                      <span className="text-[11px] font-bold text-emerald-600">
                        You save ₹{savings} with this deal!
                      </span>
                    )}
                  </div>
                </div>

                {/* Two Action Buttons: Customize Combo + Quick Add */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => {
                      if (onSelectForCustomize) {
                        onSelectForCustomize(combo);
                      }
                    }}
                    className="py-2.5 px-3 rounded-2xl bg-zinc-900 hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer border-0"
                    title="Customize bread, spice, and upgrades for this combo"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                    <span>Customize</span>
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => addToCart(combo)}
                    className="py-2.5 px-3 rounded-2xl bg-[#DC2626] hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg transition-all cursor-pointer border-0"
                    title="Quick add combo to cart"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Quick Add</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
