import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { sounds } from '../utils/soundEffects';

export default function FloatingCartBar() {
  const { cart, itemsCount, grandTotal, isCartOpen, setIsCartOpen, activeTracking } = useCart();

  // Hide if cart is empty or cart drawer / tracker is currently active
  if (itemsCount === 0 || isCartOpen || activeTracking) return null;

  const handleOpenBag = () => {
    sounds.playTick?.();
    setIsCartOpen(true);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 80, opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', damping: 22, stiffness: 280 }}
        className="fixed bottom-4 sm:bottom-6 left-0 right-0 z-40 px-4 pointer-events-none flex justify-center"
      >
        <div 
          onClick={handleOpenBag}
          className="pointer-events-auto cursor-pointer w-full max-w-md bg-zinc-950/95 text-white backdrop-blur-md px-4 py-3 sm:py-3.5 rounded-2xl shadow-2xl border border-zinc-800 hover:border-[#DC2626] transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-between group"
        >
          {/* Left: Bag count & Total Price */}
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-[#DC2626] text-white flex items-center justify-center shadow-md">
              <ShoppingBag className="w-5 h-5 stroke-[2.2]" />
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white text-[#DC2626] font-black text-[10px] flex items-center justify-center shadow-sm">
                {itemsCount}
              </span>
            </div>
            <div>
              <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                {itemsCount} {itemsCount === 1 ? 'item' : 'items'} in Bag
              </div>
              <div className="text-base sm:text-lg font-black text-white font-mono">
                ₹{grandTotal}
              </div>
            </div>
          </div>

          {/* Right: View Bag CTA Button */}
          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-[#DC2626] group-hover:text-red-400 bg-white/10 group-hover:bg-white/15 px-3.5 py-2 rounded-xl transition-all">
            <span>View Bag</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5] group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
