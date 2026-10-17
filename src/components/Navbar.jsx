import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useRealtimeDB } from '../context/RealtimeContext';
import { getStoreLiveStatus } from '../utils/storeTimingHelper';
import { ShoppingBag, User, Store } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Navbar({ onOpenFranchise }) {
  const { storeInfo } = useRealtimeDB();
  const storeLive = getStoreLiveStatus(storeInfo);
  const { 
    itemsCount, 
    grandTotal, 
    setIsCartOpen, 
  } = useCart();

  const {
    currentUser,
    isAuthenticated,
    openAuthModal,
    setIsProfileOpen,
  } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full shadow-sm bg-[#DC2626]">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 sm:h-[68px] flex items-center justify-between">
        
        {/* LEFT: Bag button (Cart trigger) */}
        <div className="flex items-center justify-start flex-1">
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full bg-white text-[#DC2626] font-extrabold text-xs shadow-md hover:shadow-lg hover:scale-[1.03] transition-all cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 stroke-[2.2]" />
            <span>{itemsCount === 0 ? 'Bag' : `₹${grandTotal}`}</span>
            {itemsCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-zinc-900 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-[#DC2626]"
              >
                {itemsCount}
              </motion.span>
            )}
          </motion.button>
        </div>

        {/* CENTER: Brand Logo (SHAWARMA NIGHTS) */}
        <div 
          className="cursor-pointer select-none text-center shrink-0 px-2 flex flex-col items-center" 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <div className="text-xl sm:text-2xl font-black tracking-tight text-white leading-none">
            SHAWARMA
          </div>
          <div className="text-[10px] tracking-[0.35em] font-bold text-white/80 uppercase leading-none mt-1">
            NIGHTS
          </div>
          <div className="inline-flex items-center gap-1 px-2 py-0.5 mt-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-black/25 text-white/95">
            <span className={`w-1.5 h-1.5 rounded-full ${storeLive.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-amber-300'}`} />
            <span>{storeLive.isOpen ? (storeInfo?.openTillText || 'OPEN TILL 4 AM') : 'CLOSED NOW'}</span>
          </div>
        </div>

        {/* RIGHT: Dukan Portal & Customer Account */}
        <div className="flex items-center justify-end flex-1 gap-1.5 sm:gap-2">
          
          {/* Dukandar Portal / Master OS Link */}
          <a
            href="/master?storeId=shawarma"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full bg-zinc-950 hover:bg-black text-white font-black text-[10px] sm:text-xs uppercase tracking-wider shadow-md hover:shadow-lg hover:scale-[1.03] transition-all cursor-pointer whitespace-nowrap border border-white/20"
            title="Dukandar Master Portal"
          >
            <Store className="w-3.5 h-3.5 text-amber-400 stroke-[2.2]" />
            <span className="hidden xs:inline">Dukan OS</span>
          </a>

          {/* Customer Profile / Login */}
          {isAuthenticated ? (
            <a
              href="/profile"
              className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full bg-white text-[#DC2626] font-extrabold text-xs shadow-md hover:shadow-lg hover:scale-[1.03] transition-all cursor-pointer whitespace-nowrap"
              title="ChuruOne Universal Profile"
            >
              <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#DC2626] text-white font-black text-[9px] sm:text-[10px] flex items-center justify-center">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="hidden sm:inline truncate max-w-[80px]">
                {currentUser?.name ? currentUser.name.split(' ')[0] : 'Profile'}
              </span>
            </a>
          ) : (
            <a
              href="/auth?role=customer&mode=login&storeId=shawarma"
              className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full bg-white text-[#DC2626] font-extrabold text-xs shadow-md hover:shadow-lg hover:scale-[1.03] transition-all cursor-pointer whitespace-nowrap"
            >
              <User className="w-3.5 h-3.5 stroke-[2.2]" />
              <span className="hidden xs:inline">Login</span>
            </a>
          )}

        </div>

      </div>
    </header>
  );
}
