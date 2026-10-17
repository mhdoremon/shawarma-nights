import React, { useState, useEffect } from 'react';
import { AuthProvider } from '../../context/AuthContext';
import { RealtimeProvider } from '../../context/RealtimeContext';
import { CartProvider } from '../../context/CartContext';
import Navbar from '../../components/Navbar';
import HeroBanner from '../../components/HeroBanner';
import DealBanners from '../../components/DealBanners';
import CarouselShowcase from '../../components/CarouselShowcase';
import CustomerReviews from '../../components/CustomerReviews';
import FranchiseTeaser from '../../components/FranchiseTeaser';
import FranchiseFloatingButton from '../../components/FranchiseFloatingButton';
import FranchiseModal from '../../components/FranchiseModal';
import Footer from '../../components/Footer';
import CartDrawer from '../../components/CartDrawer';
import OrderTrackerModal from '../../components/OrderTrackerModal';
import AuthModal from '../../components/AuthModal';
import ProfileDrawer from '../../components/ProfileDrawer';
import CustomizeModal from '../../components/CustomizeModal';
import FloatingCartBar from '../../components/FloatingCartBar';
import BottomNavBar from '../../components/BottomNavBar';
import { useRealtimeDB } from '../../context/RealtimeContext';
import { getStoreLiveStatus } from '../../utils/storeTimingHelper';

function StoreClosedTopBanner() {
  const { storeInfo } = useRealtimeDB();
  const status = getStoreLiveStatus(storeInfo);

  if (status.isOpen) return null;

  return (
    <div className="bg-zinc-950 text-white px-4 py-2.5 border-b border-zinc-800 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
          <span className="text-xs sm:text-sm font-black text-amber-400 uppercase tracking-wide">
            ⚠️ {status.statusBadge}: {status.reason}
          </span>
        </div>
        <div className="text-[11px] font-semibold text-zinc-300">
          Abhi order pause hain. Aap pura menu dekh sakte hain — orders dukan khulne par shuru honge!
        </div>
      </div>
    </div>
  );
}

export default function CustomerApp() {
  const [customizeItem, setCustomizeItem] = useState(null);
  const [isFranchiseOpen, setIsFranchiseOpen] = useState(false);

  useEffect(() => {
    document.title = "Shawarma Nights | Authentic Charcoal Shawarma";
    // Open franchise modal automatically if route or hash indicates franchise
    if (window.location.pathname.includes('/franchise') || window.location.hash === '#franchise') {
      setIsFranchiseOpen(true);
    }
  }, []);

  const scrollToMenu = () => {
    document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <AuthProvider>
      <RealtimeProvider>
        <CartProvider>
          <div className="min-h-screen bg-[#FFFBF7] text-zinc-900 flex flex-col justify-between selection:bg-[#DC2626] selection:text-white">
            <Navbar onOpenFranchise={() => setIsFranchiseOpen(true)} />
            <StoreClosedTopBanner />
            <main className="flex-1">
              <HeroBanner 
                onExploreMenu={scrollToMenu} 
                onSelectFeaturedDish={setCustomizeItem} 
                onOpenFranchise={() => setIsFranchiseOpen(true)}
              />
              <DealBanners />
              <div id="menu">
                <CarouselShowcase onSelectForCustomize={setCustomizeItem} />
              </div>
              <CustomerReviews />
              <FranchiseTeaser onOpenFranchise={() => setIsFranchiseOpen(true)} />
            </main>
            <Footer onOpenFranchise={() => setIsFranchiseOpen(true)} />
            <FranchiseFloatingButton onOpenFranchise={() => setIsFranchiseOpen(true)} />
            <FloatingCartBar />
            <CartDrawer />
            <OrderTrackerModal />
            <AuthModal />
            <CustomizeModal item={customizeItem} onClose={() => setCustomizeItem(null)} />
            <FranchiseModal isOpen={isFranchiseOpen} onClose={() => setIsFranchiseOpen(false)} />
            <BottomNavBar />
          </div>
        </CartProvider>
      </RealtimeProvider>
    </AuthProvider>
  );
}