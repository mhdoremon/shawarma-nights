import React from 'react';
import { Star, Clock, Flame, Plus, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { getImageUrl, handleImageError } from '../utils/imageHelper';

export default function FoodCard({ item, onSelectForCustomize }) {
  const { cart, addToCart } = useCart();

  // Check if this item is in the cart
  const inCartQty = cart
    .filter((ci) => ci.itemId === item.id)
    .reduce((sum, ci) => sum + ci.quantity, 0);

  const hasOptions = item.options && (item.options.bread || item.options.addons);

  const handleAction = () => {
    if (hasOptions) {
      onSelectForCustomize(item);
    } else {
      addToCart(item);
    }
  };

  const discountPercent = item.originalPrice 
    ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100) 
    : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25 }}
      className="group relative bg-charcoal-900/90 border border-white/5 hover:border-brand-500/30 rounded-3xl overflow-hidden flex flex-col justify-between shadow-xl transition-all duration-300"
    >
      {/* Top Image & Badges Container */}
      <div className="relative w-full h-48 sm:h-52 overflow-hidden bg-charcoal-950">
        <img
          src={getImageUrl(item.image)}
          alt={item.name}
          onError={handleImageError}
          loading="lazy"
          className="w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-500"
        />

        {/* Gradient shadow overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900 via-transparent to-black/40" />

        {/* Veg / Non-Veg Indicator & Bestseller Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          {/* Veg/Non-veg box */}
          <div className={`w-5 h-5 rounded-md border flex items-center justify-center bg-charcoal-950 ${
            item.isVeg ? 'border-emerald-500' : 'border-rose-500'
          }`}>
            <span className={`w-2.5 h-2.5 rounded-full ${item.isVeg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          </div>

          {/* Badge */}
          {item.badge && (
            <span className="px-2 py-0.5 rounded-full bg-brand-600 text-[10px] font-black uppercase tracking-wider text-white shadow-md flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-300" />
              {item.badge}
            </span>
          )}
        </div>

        {/* Prep Time Tag */}
        <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-charcoal-950 text-zinc-300 text-[10px] font-semibold flex items-center gap-1 border border-white/10">
          <Clock className="w-3 h-3 text-brand-400" />
          <span>{item.prepTime}</span>
        </div>

        {/* In-Cart Quick Badge */}
        {inCartQty > 0 && (
          <div className="absolute bottom-2 right-3 px-2.5 py-0.5 rounded-full bg-emerald-500/90 text-white font-bold text-[11px] shadow-lg flex items-center gap-1">
            <Check className="w-3 h-3" />
            <span>{inCartQty} in cart</span>
          </div>
        )}
      </div>

      {/* Dish Information */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Rating & Spice */}
          <div className="flex items-center justify-between text-xs mb-1.5">
            <div className="flex items-center gap-1 text-amber-400 font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span>{item.rating}</span>
              <span className="text-zinc-500 font-normal">({item.reviews})</span>
            </div>

            {item.spiceLevel && (
              <span className="text-[11px] text-zinc-400 flex items-center gap-1 font-medium">
                <Flame className="w-3 h-3 text-red-500" />
                <span>{item.spiceLevel}</span>
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-base font-extrabold text-white group-hover:text-brand-400 transition-colors line-clamp-1 font-display">
            {item.name}
          </h3>

          {/* Description */}
          <p className="text-xs text-zinc-400 mt-1.5 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Pricing & Add Button */}
        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-black text-white">₹{item.price}</span>
              {item.originalPrice && (
                <span className="text-xs text-zinc-500 line-through">₹{item.originalPrice}</span>
              )}
            </div>
            {discountPercent > 0 && (
              <span className="text-[10px] font-bold text-emerald-400 block">
                {discountPercent}% OFF
              </span>
            )}
          </div>

          {/* Domino's / McDonald's Style Action Button */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handleAction}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
              hasOptions
                ? 'bg-charcoal-800 hover:bg-brand-600 text-white border border-brand-500/40 hover:border-brand-500 hover:shadow-glow-sm'
                : 'bg-brand-600 hover:bg-brand-500 text-white hover:shadow-glow'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{hasOptions ? 'Customize' : 'Add'}</span>
          </motion.button>
        </div>

      </div>
    </motion.div>
  );
}
