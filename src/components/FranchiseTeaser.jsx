import React from 'react';
import { motion } from 'framer-motion';
import { Store, TrendingUp, ArrowRight, ShieldCheck, Clock } from 'lucide-react';
import { useRealtimeDB } from '../context/RealtimeContext';

export default function FranchiseTeaser({ onOpenFranchise }) {
  const { franchise } = useRealtimeDB();

  // If franchise is explicitly disabled by Dukandar, don't show teaser
  if (franchise?.enabled === false) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-10 shadow-xs relative overflow-hidden"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Text & Value Proposition (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-50 border border-red-200 text-[#DC2626] text-xs font-bold uppercase tracking-wider">
              <Store className="w-3.5 h-3.5" />
              <span>BUSINESS EXPANSION OPPORTUNITY</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-zinc-900 tracking-tight leading-tight">
              Bring Shawarma Nights To Your City
            </h2>

            <p className="text-sm sm:text-base text-zinc-600 leading-relaxed font-normal max-w-2xl">
              Turn your passion into a high-cashflow food business. Low capital setup, turnkey charcoal kitchen equipment, centralized secret spices supply, and complete operational training.
            </p>

            {/* 3 Quick Chips */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-50 border border-zinc-200 text-xs font-semibold text-zinc-700">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>₹3.5L Setup • 3-6 Mo ROI</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-50 border border-zinc-200 text-xs font-semibold text-zinc-700">
                <ShieldCheck className="w-3.5 h-3.5 text-[#DC2626]" />
                <span>100% Halal Charcoal Spit Concept</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-50 border border-zinc-200 text-xs font-semibold text-zinc-700">
                <Clock className="w-3.5 h-3.5 text-sky-600" />
                <span>14 Days Turnkey Launch</span>
              </div>
            </div>

          </div>

          {/* Right Action Button (4 cols) */}
          <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-center gap-3">
            <button
              onClick={onOpenFranchise}
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#DC2626] hover:bg-red-700 active:scale-95 text-white font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>EXPLORE FRANCHISE & APPLY</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
            <span className="text-[11px] text-zinc-400 text-center lg:text-right font-medium">
              Limited slots per city • Apply for your territory
            </span>
          </div>

        </div>
      </motion.div>
    </section>
  );
}
