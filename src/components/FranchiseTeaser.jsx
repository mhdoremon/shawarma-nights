import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, TrendingUp, ShieldCheck, ChevronRight } from 'lucide-react';
import { useRealtimeDB } from '../context/RealtimeContext';

export default function FranchiseTeaser({ onOpenFranchise }) {
  const { franchise } = useRealtimeDB();

  // If franchise is explicitly disabled by Dukandar, don't show teaser
  if (franchise?.enabled === false) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative bg-gradient-to-br from-white via-zinc-50/50 to-orange-50/30 rounded-[2.5rem] p-7 sm:p-12 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.08)] hover:shadow-[0_28px_65px_-15px_rgba(0,0,0,0.14)] transition-all duration-300 overflow-hidden border border-zinc-200/80"
      >
        {/* Subtle decorative background typography accent */}
        <div className="absolute -bottom-6 -right-6 text-8xl sm:text-9xl font-black text-zinc-900/[0.03] select-none pointer-events-none tracking-tighter leading-none">
          GROW
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center relative z-10">
          
          {/* Left: Value Proposition & Stats (8 cols) */}
          <div className="lg:col-span-8 space-y-5">
            
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 bg-zinc-950 text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>FRANCHISE EXPANSION PROTOCOL</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-zinc-950 tracking-tight leading-[1.05]">
              Bring Shawarma Nights To Your City
            </h2>

            <p className="text-sm sm:text-base text-zinc-600 leading-relaxed font-normal max-w-2xl">
              Turn your passion into a high-cashflow food business. Low capital setup, turnkey charcoal kitchen equipment, centralized secret spices supply, and complete operational training.
            </p>

            {/* Clean Elevated Metric Blocks */}
            <div className="grid grid-cols-3 gap-3 pt-2 max-w-xl">
              <div className="bg-white rounded-2xl p-4 text-center sm:text-left shadow-sm border border-zinc-200/80 hover:border-zinc-300 transition-colors">
                <div className="text-base sm:text-xl font-black text-zinc-950 font-mono">
                  {franchise?.investmentRange?.split('–')[0]?.trim() || '₹3.5L'}
                </div>
                <div className="text-[10px] sm:text-xs font-bold text-zinc-500 mt-1 uppercase tracking-wider">
                  Setup Capital
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 text-center sm:text-left shadow-sm border border-zinc-200/80 hover:border-red-200 transition-colors">
                <div className="text-base sm:text-xl font-black text-[#DC2626] font-mono">
                  {franchise?.roiMonths || '3–6 Months'}
                </div>
                <div className="text-[10px] sm:text-xs font-bold text-zinc-500 mt-1 uppercase tracking-wider">
                  Payback ROI
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 text-center sm:text-left shadow-sm border border-zinc-200/80 hover:border-emerald-200 transition-colors">
                <div className="text-base sm:text-xl font-black text-emerald-600 font-mono">
                  {franchise?.grossMargin || '50%–60%'}
                </div>
                <div className="text-[10px] sm:text-xs font-bold text-zinc-500 mt-1 uppercase tracking-wider">
                  Gross Margin
                </div>
              </div>
            </div>

          </div>

          {/* Right: Action Button & Territory Note (4 cols) */}
          <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-center gap-3">
            <button
              onClick={onOpenFranchise}
              className="w-full sm:w-auto px-8 py-4.5 rounded-full bg-[#DC2626] hover:bg-red-700 active:scale-95 text-white font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-2 cursor-pointer group"
            >
              <span>EXPLORE FRANCHISE & APPLY</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <span className="text-[11px] text-zinc-500 text-center lg:text-right font-medium">
              ⚡ Limited territory slots available in Rajasthan
            </span>
          </div>

        </div>
      </motion.div>
    </section>
  );
}
