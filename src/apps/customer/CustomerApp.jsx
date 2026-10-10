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
            <ProfileDrawer />
            <Navbar onOpenFranchise={() => setIsFranchiseOpen(true)} />
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
          </div>
        </CartProvider>
      </RealtimeProvider>
    </AuthProvider>
  );
}