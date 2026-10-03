import React from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ShoppingBag, User, Store } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Navbar({ onOpenFranchise }) {
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
          className="cursor-pointer select-none text-center shrink-0 px-2" 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <div className="text-xl sm:text-2xl font-black tracking-tight text-white leading-none">
            SHAWARMA
          </div>
          <div className="text-[10px] tracking-[0.35em] font-bold text-white/80 uppercase leading-none mt-1">
            NIGHTS
          </div>
        </div>

        {/* RIGHT: Login / User Profile */}
        <div className="flex items-center justify-end flex-1 gap-2 sm:gap-3">
          
          {isAuthenticated ? (
            <button
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full bg-white text-[#DC2626] font-extrabold text-xs shadow-md hover:shadow-lg hover:scale-[1.03] transition-all cursor-pointer whitespace-nowrap"
              title="View Profile"
            >
              <div className="w-5 h-5 rounded-full bg-[#DC2626] text-white font-black text-[10px] flex items-center justify-center">
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="truncate max-w-[60px] sm:max-w-[120px]">
                {currentUser.name ? currentUser.name.split(' ')[0] : 'Profile'}
              </span>
            </button>
          ) : (
            <button
              onClick={() => openAuthModal('phone')}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full bg-white text-[#DC2626] font-extrabold text-xs shadow-md hover:shadow-lg hover:scale-[1.03] transition-all cursor-pointer whitespace-nowrap"
            >
              <User className="w-4 h-4 stroke-[2.2]" />
              <span>Login</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
