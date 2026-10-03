import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
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
        className="relative bg-white rounded-[2.5rem] p-7 sm:p-12 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.07)] hover:shadow-[0_28px_65px_-15px_rgba(0,0,0,0.12)] transition-all duration-300 overflow-hidden"
      >
        {/* Subtle decorative background typography accent */}
        <div className="absolute -bottom-6 -right-6 text-8xl sm:text-9xl font-black text-zinc-900/[0.03] select-none pointer-events-none tracking-tighter leading-none">
          GROW
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center relative z-10">
          
          {/* Left: Value Proposition & Stats (8 cols) */}
          <div className="lg:col-span-8 space-y-5">
            
            {/* Solid Sticker Badge (Matching Hero Style — Zero Outline, Zero Glassy) */}
            <div className="inline-block bg-zinc-900 text-white px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm rotate-[-1deg]">
              FRANCHISE EXPANSION
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-zinc-900 tracking-tight leading-[1.05]">
              Bring Shawarma Nights To Your City
            </h2>

            <p className="text-sm sm:text-base text-zinc-600 leading-relaxed font-normal max-w-2xl">
              Turn your passion into a high-cashflow food business. Low capital setup, turnkey charcoal kitchen equipment, centralized secret spices supply, and complete operational training.
            </p>

            {/* Clean Elevated 3D Metric Blocks (Zero Borders, Clean Solid Style) */}
            <div className="grid grid-cols-3 gap-3 pt-2 max-w-xl">
              <div className="bg-[#FFFBF7] rounded-2xl p-3.5 sm:p-4 text-center sm:text-left shadow-xs">
                <div className="text-sm sm:text-lg font-black text-zinc-900">
                  {franchise?.investmentRange?.split('–')[0]?.trim() || '₹3.5L'}
                </div>
                <div className="text-[10px] sm:text-xs font-bold text-zinc-500 mt-0.5">
                  Setup Capital
                </div>
              </div>

              <div className="bg-[#FFFBF7] rounded-2xl p-3.5 sm:p-4 text-center sm:text-left shadow-xs">
                <div className="text-sm sm:text-lg font-black text-[#DC2626]">
                  {franchise?.roiMonths || '3–6 Months'}
                </div>
                <div className="text-[10px] sm:text-xs font-bold text-zinc-500 mt-0.5">
                  Payback ROI
                </div>
              </div>

              <div className="bg-[#FFFBF7] rounded-2xl p-3.5 sm:p-4 text-center sm:text-left shadow-xs">
                <div className="text-sm sm:text-lg font-black text-zinc-900">
                  {franchise?.grossMargin || '50%–60%'}
                </div>
                <div className="text-[10px] sm:text-xs font-bold text-zinc-500 mt-0.5">
                  Gross Margin
                </div>
              </div>
            </div>

          </div>

          {/* Right: Big Punchy Action Button (4 cols) */}
          <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-center gap-3">
            <button
              onClick={onOpenFranchise}
              className="w-full sm:w-auto px-8 py-4.5 rounded-full bg-[#DC2626] hover:bg-red-700 active:scale-95 text-white font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-xl hover:shadow-2xl hover:scale-105 flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <span>EXPLORE FRANCHISE & APPLY</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
            <span className="text-[11px] text-zinc-400 text-center lg:text-right font-medium">
              Limited territory slots available
            </span>
          </div>

        </div>
      </motion.div>
    </section>
  );
}
