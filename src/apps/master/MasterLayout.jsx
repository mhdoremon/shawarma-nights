import React from 'react';
import { useMaster } from './context/MasterContext';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  UtensilsCrossed, 
  Tag, 
  Users, 
  Star, 
  Smartphone, 
  Building2, 
  Settings, 
  Volume2, 
  VolumeX, 
  RefreshCw, 
  LogOut,
  Store,
  Wifi,
  WifiOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Tab Components
import DashboardTab from './tabs/DashboardTab';
import OrdersTab from './tabs/OrdersTab';
import MenuTab from './tabs/MenuTab';
import OffersTab from './tabs/OffersTab';
import CustomersTab from './tabs/CustomersTab';
import ReviewsTab from './tabs/ReviewsTab';
import SmsGatewayTab from './tabs/SmsGatewayTab';
import FranchiseTab from './tabs/FranchiseTab';
import SettingsTab from './tabs/SettingsTab';
import DeliveryPartnerView from './views/DeliveryPartnerView';

export default function MasterLayout() {
  const { 
    role, 
    storeId, 
    storeInfo, 
    isConnected, 
    soundEnabled, 
    setSoundEnabled, 
    activeTab, 
    setActiveTab, 
    logout, 
    refreshData, 
    orders, 
    menu, 
    deals, 
    customers, 
    reviews, 
    franchiseInquiries,
    toast 
  } = useMaster();

  // If logged in as Delivery Boy, show Delivery Partner View directly
  if (role === 'delivery_boy') {
    return <DeliveryPartnerView />;
  }

  // Active / pending orders count
  const activeOrdersCount = (orders || []).filter(o => 
    ['pending', 'confirmed', 'preparing', 'out_for_delivery'].includes(o.status)
  ).length;

  const tabsConfig = [
    { id: 0, label: 'Dashboard', icon: LayoutDashboard },
    { id: 1, label: 'Orders', icon: ShoppingBag, badge: activeOrdersCount, highlightBadge: activeOrdersCount > 0 },
    { id: 2, label: 'Menu', icon: UtensilsCrossed, badge: menu?.length || 0 },
    { id: 3, label: 'Offers', icon: Tag, badge: deals?.length || 0 },
    { id: 4, label: 'Customers', icon: Users, badge: customers?.length || 0 },
    { id: 5, label: 'Reviews', icon: Star, badge: reviews?.length || 0 },
    { id: 6, label: 'SMS Gateway', icon: Smartphone },
    { id: 7, label: 'Franchise', icon: Building2, badge: franchiseInquiries?.length || 0, highlightBadge: franchiseInquiries?.length > 0 },
    { id: 8, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-[#DC2626] selection:text-white flex flex-col">
      
      {/* 1. TOP MASTER BAR */}
      <header className="sticky top-0 z-40 bg-zinc-900 border-b border-zinc-800 shadow-md px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          
          {/* Left: Brand + Active Store Pill */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => setActiveTab(0)}>
              <span className="text-sm sm:text-base font-black text-[#DC2626]">CHURU</span>
              <span className="text-sm sm:text-base font-black text-white">ONE</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-zinc-800 text-zinc-300 font-bold uppercase tracking-wider ml-1">
                MASTER OS
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-950 border border-zinc-800 text-xs font-bold text-zinc-300">
              <Store className="w-3.5 h-3.5 text-[#DC2626]" />
              <span className="capitalize">{storeInfo?.name || storeId}</span>
            </div>
          </div>

          {/* Right: Cloud Connection Indicator + Sound + Refresh + Logout */}
          <div className="flex items-center gap-2">
            
            {/* Live Connection Pill */}
            <div className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold border transition-colors ${
              isConnected 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="hidden xs:inline">{isConnected ? 'Cloud Live' : 'Reconnecting...'}</span>
            </div>

            {/* Sound Mute/Unmute */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                soundEnabled 
                  ? 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:text-white' 
                  : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}
              title={soundEnabled ? 'Mute Order Alerts' : 'Unmute Order Alerts'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Manual Refresh */}
            <button
              onClick={refreshData}
              className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Refresh Store Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
              title="Logout from Master OS"
            >
              <LogOut className="w-4 h-4" />
            </button>

          </div>

        </div>
      </header>

      {/* 2. HORIZONTAL 9-TAB NAVIGATION CHIP BAR (Exact Android App Layout) */}
      <nav className="sticky top-[57px] sm:top-[61px] z-30 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800/80 px-4 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto scrollbar-none">
          {tabsConfig.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;

            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-2xl text-xs font-extrabold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  isActive 
                    ? 'bg-[#DC2626] text-white shadow-lg scale-[1.02]' 
                    : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850 border border-zinc-850'
                }`}
              >
                <Icon className="w-3.5 h-3.5 stroke-[2.2]" />
                <span>{t.label}</span>
                {t.badge !== undefined && t.badge > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    isActive 
                      ? 'bg-white text-zinc-900' 
                      : t.highlightBadge 
                        ? 'bg-[#DC2626] text-white' 
                        : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* 3. MAIN TAB CONTENT CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 0 && <DashboardTab />}
            {activeTab === 1 && <OrdersTab />}
            {activeTab === 2 && <MenuTab />}
            {activeTab === 3 && <OffersTab />}
            {activeTab === 4 && <CustomersTab />}
            {activeTab === 5 && <ReviewsTab />}
            {activeTab === 6 && <SmsGatewayTab />}
            {activeTab === 7 && <FranchiseTab />}
            {activeTab === 8 && <SettingsTab />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 4. REALTIME TOAST NOTIFICATION POPUP */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-6 right-6 z-50 max-w-sm rounded-2xl p-4 text-xs font-black shadow-2xl border flex items-center gap-3 ${
              toast.type === 'success' 
                ? 'bg-zinc-900 text-emerald-400 border-emerald-500/40 shadow-emerald-950/40' 
                : toast.type === 'error'
                  ? 'bg-zinc-900 text-red-400 border-red-500/40 shadow-red-950/40'
                  : 'bg-zinc-900 text-white border-zinc-700 shadow-zinc-950/50'
            }`}
          >
            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              toast.type === 'success' ? 'bg-emerald-400 animate-ping' : toast.type === 'error' ? 'bg-red-400' : 'bg-[#DC2626]'
            }`} />
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
