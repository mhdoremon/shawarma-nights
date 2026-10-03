import React from 'react';
import { motion } from 'framer-motion';
import { Store, ArrowUpRight } from 'lucide-react';
import { useRealtimeDB } from '../context/RealtimeContext';

export default function FranchiseFloatingButton({ onOpenFranchise }) {
  const { franchise } = useRealtimeDB();

  if (franchise?.enabled === false) return null;

  return (
    <div className="fixed bottom-5 left-4 sm:left-6 z-30">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onOpenFranchise}
        className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white text-zinc-900 shadow-xl hover:shadow-2xl transition-all cursor-pointer group"
        title="Explore Franchise Opportunities"
      >
        <div className="w-5 h-5 rounded-full bg-[#DC2626] text-white flex items-center justify-center shadow-xs">
          <Store className="w-3 h-3 stroke-[2.5]" />
        </div>
        <span className="text-xs font-black tracking-tight">Own a Franchise</span>
      </motion.button>
    </div>
  );
}
