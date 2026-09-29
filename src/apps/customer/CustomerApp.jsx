import React, { useState } from 'react';
import { AuthProvider } from '../../context/AuthContext';
import { RealtimeProvider } from '../../context/RealtimeContext';
import { CartProvider } from '../../context/CartContext';
import Navbar from '../../components/Navbar';
import HeroBanner from '../../components/HeroBanner';
import DealBanners from '../../components/DealBanners';
import CarouselShowcase from '../../components/CarouselShowcase';
import CustomerReviews from '../../components/CustomerReviews';
import Footer from '../../components/Footer';
import CartDrawer from '../../components/CartDrawer';
import OrderTrackerModal from '../../components/OrderTrackerModal';
import AuthModal from '../../components/AuthModal';
import ProfileDrawer from '../../components/ProfileDrawer';
import CustomizeModal from '../../components/CustomizeModal';
import FloatingCartBar from '../../components/FloatingCartBar';

export default function CustomerApp() {
  const [customizeItem, setCustomizeItem] = useState(null);

  const scrollToMenu = () => {
    document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <AuthProvider>
      <RealtimeProvider>
        <CartProvider>
          <div className="min-h-screen bg-[#FFFBF7] text-zinc-900 flex flex-col justify-between selection:bg-[#DC2626] selection:text-white">
            <ProfileDrawer />
            <Navbar />
            <main className="flex-1">
              <HeroBanner 
                onExploreMenu={scrollToMenu} 
                onSelectFeaturedDish={setCustomizeItem} 
              />
              <DealBanners />
              <div id="menu">
                <CarouselShowcase onSelectForCustomize={setCustomizeItem} />
              </div>
              <CustomerReviews />
            </main>
            <Footer />
            <FloatingCartBar />
            <CartDrawer />
            <OrderTrackerModal />
            <AuthModal />
            <CustomizeModal item={customizeItem} onClose={() => setCustomizeItem(null)} />
          </div>
        </CartProvider>
      </RealtimeProvider>
    </AuthProvider>
  );
}