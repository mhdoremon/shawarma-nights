import React, { useState, useRef } from 'react';
import { useCart } from '../context/CartContext';
import { useRealtimeDB } from '../context/RealtimeContext';
import { Tag, Check, Copy, Sparkles, ChevronLeft, ChevronRight, Gift, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DealBanners() {
  const { applyCoupon, appliedCoupon, setIsCartOpen } = useCart();
  const { deals } = useRealtimeDB();
  const [copiedCode, setCopiedCode] = useState('');
  const scrollRef = useRef(null);

  const liveDeals = deals || [];
  if (liveDeals.length === 0) return null;

  const count = liveDeals.length;

  const handleApply = (code) => {
    applyCoupon(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2500);
  };

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Card sub-component for reusability & consistent ticket design
  const DealCard = ({ deal, isHero = false }) => {
    const isApplied = appliedCoupon?.code === deal.code;
    const isCopied = copiedCode === deal.code;

    if (isHero) {
      // 1 Deal: Luxurious Full-Width Hero Banner
      return (
        <motion.div
          whileHover={{ y: -3 }}
          onClick={() => !isApplied && handleApply(deal.code)}
          className={`relative ${deal.bg || 'bg-[#DC2626]'} ${deal.text || 'text-white'} rounded-3xl p-6 sm:p-8 shadow-xl hover:shadow-2xl transition-all cursor-pointer overflow-hidden border border-white/20`}
        >
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="bg-white text-zinc-900 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-1.5 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-[#DC2626]" />
                  CODE: {deal.code}
                </span>
                {deal.minOrder && (
                  <span className="bg-zinc-900 text-white px-3 py-1 rounded-full text-xs font-bold">
                    Orders above ₹{deal.minOrder}
                  </span>
                )}
                {deal.freeDelivery && (
                  <span className="bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-black flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Free Delivery</span>
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                  {deal.title}
                </h3>
                <p className="text-base sm:text-lg mt-2 opacity-90 font-medium leading-relaxed">
                  {deal.desc}
                </p>
              </div>
            </div>

            {/* Action Button */}
            <div className="shrink-0 flex items-center md:flex-col md:items-end justify-between border-t md:border-t-0 md:border-l border-white/20 pt-4 md:pt-0 md:pl-8">
              <div className="text-left md:text-right hidden sm:block mb-3">
                <span className="text-[11px] font-extrabold uppercase tracking-widest opacity-70 block">
                  Limited Midnight Offer
                </span>
                <span className="text-xs font-medium opacity-80">
                  Tap button to auto-apply at checkout
                </span>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleApply(deal.code);
                }}
                className={`px-6 py-3.5 rounded-2xl font-black text-sm flex items-center gap-2 transition-all shadow-lg active:scale-95 ${
                  isApplied
                    ? 'bg-white text-[#DC2626] ring-4 ring-white/30'
                    : 'bg-white text-zinc-900 hover:bg-zinc-100 hover:shadow-xl'
                }`}
              >
                {isApplied ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Applied to Cart!</span>
                  </>
                ) : isCopied ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Code Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 stroke-[2]" />
                    <span>Apply Coupon Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      );
    }

    // Standard adaptive card
    return (
      <motion.div
        key={deal.code}
        whileHover={{ y: -4 }}
        onClick={() => !isApplied && handleApply(deal.code)}
        className={`relative ${deal.bg || 'bg-[#DC2626]'} ${deal.text || 'text-white'} rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-lg hover:shadow-xl transition-all cursor-pointer border border-white/10 min-h-[175px]`}
      >
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className={`${deal.tagBg || 'bg-white/20'} px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider`}>
              {deal.code}
            </span>
            {deal.minOrder && (
              <span className="text-[10px] font-bold opacity-80 bg-black/15 px-2 py-0.5 rounded-md">
                Min ₹{deal.minOrder}
              </span>
            )}
          </div>

          <h3 className="text-2xl sm:text-3xl font-black mt-3 leading-none tracking-tight">
            {deal.title}
          </h3>
          <p className="text-xs sm:text-sm mt-1.5 opacity-85 font-medium line-clamp-2">
            {deal.desc}
          </p>
        </div>

        <div className="flex items-center justify-between mt-5 pt-3 border-t border-white/15">
          <span className="text-[11px] font-bold opacity-70 uppercase tracking-wide">
            {isApplied ? 'Ready in Cart' : 'Tap to apply'}
          </span>
          {isApplied ? (
            <div className="flex items-center gap-1.5 bg-white text-[#DC2626] px-3 py-1.5 rounded-full text-xs font-black shadow-sm">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              Applied!
            </div>
          ) : (
            <div className="flex items-center gap-1 bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-full text-xs font-bold transition-all">
              <Copy className="w-3 h-3 stroke-[2]" />
              <span>Apply</span>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#DC2626] flex items-center justify-center shadow-md shadow-red-200">
            <Tag className="w-4 h-4 text-white stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-lg font-black text-zinc-900 tracking-tight flex items-center gap-2">
              <span>Offers & Deals</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-[#DC2626]">
                {count} Active
              </span>
            </h2>
            <p className="text-xs text-zinc-500 font-medium">
              Applicable directly on your charcoal cravings cart
            </p>
          </div>
        </div>

        {/* Navigation arrows for 5+ deals */}
        {count >= 5 && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => scroll('left')}
              className="w-8 h-8 rounded-full border border-zinc-200 bg-white hover:bg-zinc-100 flex items-center justify-center text-zinc-700 transition-all shadow-xs"
              title="Previous offers"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-8 h-8 rounded-full border border-zinc-200 bg-white hover:bg-zinc-100 flex items-center justify-center text-zinc-700 transition-all shadow-xs"
              title="Next offers"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* SMART ADAPTIVE CONTAINER */}
      {count === 1 ? (
        // 1 Deal: Full Width Hero
        <DealCard deal={liveDeals[0]} isHero={true} />
      ) : count === 2 ? (
        // 2 Deals: 50 / 50 Balanced Grid
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {liveDeals.map((deal) => (
            <DealCard key={deal.code} deal={deal} />
          ))}
        </div>
      ) : count === 3 ? (
        // 3 Deals: 3 Balanced Columns
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {liveDeals.map((deal) => (
            <DealCard key={deal.code} deal={deal} />
          ))}
        </div>
      ) : count === 4 ? (
        // 4 Deals: 4 Columns (or 2x2 on tablet)
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {liveDeals.map((deal) => (
            <DealCard key={deal.code} deal={deal} />
          ))}
        </div>
      ) : (
        // 5+ Deals: Smooth Scrollable Snap Track
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scrollbar-none"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {liveDeals.map((deal) => (
            <div
              key={deal.code}
              className="min-w-[280px] sm:min-w-[320px] max-w-[340px] shrink-0 snap-start"
            >
              <DealCard deal={deal} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
