import React, { useState, useEffect } from 'react';
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
  Clock,
  AlertCircle,
  Phone,
  MessageSquare,
  X,
  Check,
  Lock,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Tab Components
import DashboardTab from './tabs/DashboardTab';
import OrdersTab from './tabs/OrdersTab';
import CityOrdersLedgerTab from './tabs/CityOrdersLedgerTab';
import MenuTab from './tabs/MenuTab';
import CityProductsTab from './tabs/CityProductsTab';
import PartnerStoresTab from './tabs/PartnerStoresTab';
import OffersTab from './tabs/OffersTab';
import CustomersTab from './tabs/CustomersTab';
import ReviewsTab from './tabs/ReviewsTab';
import FranchiseTab from './tabs/FranchiseTab';
import SettingsTab from './tabs/SettingsTab';
import DeliveryPartnerView from './views/DeliveryPartnerView';
import BottomNavBar from '../../components/BottomNavBar';

export default function MasterLayout() {
  const { 
    role, 
    storeId, 
    storeInfo, 
    capabilities,
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
    cityProducts,
    reviews, 
    franchiseInquiries,
    toast,
    updateStoreSettings,
    showToast,
    isSuperAdmin,
    switchStoreId,
    platformStores
  } = useMaster();

  // If logged in as Delivery Boy, show Delivery Partner View directly
  if (role === 'delivery_boy') {
    return <DeliveryPartnerView />;
  }

  const isApprovedServer = storeInfo?.status === 'active' || storeInfo?.status === 'approved';
  const isRejected = !isApprovedServer && (
    storeInfo?.status === 'rejected' ||
    user?.status === 'rejected' ||
    (() => {
      try {
        const u = JSON.parse(localStorage.getItem('churuone_master_user') || '{}');
        return u.status === 'rejected';
      } catch { return false; }
    })()
  );
  const isPendingReview = !isApprovedServer && !isRejected && (
    storeInfo?.status === 'pending_review' || 
    user?.status === 'pending_review' ||
    (() => {
      try {
        const u = JSON.parse(localStorage.getItem('churuone_master_user') || '{}');
        return u.status === 'pending_review';
      } catch { return false; }
    })()
  );

  // Synchronize localStorage user status if approved on server
  useEffect(() => {
    if (isApprovedServer) {
      try {
        const u = JSON.parse(localStorage.getItem('churuone_master_user') || '{}');
        if (u && u.status === 'pending_review') {
          u.status = 'active';
          localStorage.setItem('churuone_master_user', JSON.stringify(u));
        }
      } catch {}
    }
  }, [isApprovedServer]);

  const [showReviewModal, setShowReviewModal] = useState(false);

  const isMarketplace = storeId === 'churuone' || capabilities?.storeType === 'marketplace' || capabilities?.vertical === 'marketplace';
  const isSalon = !isMarketplace && (capabilities?.orders?.hasAppointments ?? (storeInfo?.vertical === 'salon' || (storeId || '').includes('nash')));
  const hasAppointments = !isMarketplace && (capabilities?.orders?.hasAppointments ?? isSalon);
  const hasFranchise = !isMarketplace && (capabilities?.settings?.hasFranchise ?? (!isSalon));
  const catalogTabLabel = isMarketplace ? 'Partner Stores' : (capabilities?.catalog?.itemNounPlural || (hasAppointments ? 'Services' : 'Menu'));

  // Active / pending orders count
  const activeOrdersCount = (orders || []).filter(o => 
    ['new', 'pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'dispatched'].includes(o.status)
  ).length;

  const tabsConfig = isMarketplace ? [
    { id: 0, label: 'Platform Dashboard', icon: LayoutDashboard },
    { id: 1, label: 'City Orders Ledger', icon: ShoppingBag, badge: activeOrdersCount, highlightBadge: activeOrdersCount > 0 },
    { id: 2, label: 'City Products Catalog', icon: UtensilsCrossed, badge: cityProducts?.length || 0 },
    { id: 6, label: 'Partner Stores', icon: Store },
    { id: 3, label: 'Platform Offers & Combos', icon: Tag, badge: deals?.length || 0 },
    { id: 4, label: 'Customers CRM', icon: Users, badge: customers?.length || 0 },
    { id: 5, label: 'Reviews & Permissions', icon: Star, badge: reviews?.length || 0 },
    { id: 8, label: 'Platform Settings', icon: Settings },
  ] : [
    { id: 0, label: (isPendingReview || isRejected) ? 'Dashboard & Status' : 'Dashboard', icon: LayoutDashboard },
    { id: 1, label: hasAppointments ? 'Bookings' : 'Orders', icon: ShoppingBag, badge: activeOrdersCount, highlightBadge: activeOrdersCount > 0, isLocked: (isPendingReview || isRejected) },
    { id: 2, label: catalogTabLabel, icon: UtensilsCrossed, badge: menu?.length || 0, isLocked: (isPendingReview || isRejected) },
    { id: 3, label: hasAppointments ? 'Packages & Offers' : 'Offers', icon: Tag, badge: deals?.length || 0, isLocked: (isPendingReview || isRejected) },
    { id: 4, label: hasAppointments ? 'Clients' : 'Customers', icon: Users, badge: customers?.length || 0, isLocked: (isPendingReview || isRejected) },
    { id: 5, label: 'Reviews', icon: Star, badge: reviews?.length || 0, isLocked: (isPendingReview || isRejected) },
    ...(hasFranchise ? [{ id: 7, label: 'Franchise', icon: Building2, badge: franchiseInquiries?.length || 0, highlightBadge: franchiseInquiries?.length > 0, isLocked: (isPendingReview || isRejected) }] : []),
    { id: 8, label: 'Settings', icon: Settings, isLocked: false },
  ];

  return (
    <div className="min-h-screen bg-[#FFFBF7] text-zinc-900 font-sans selection:bg-[#DC2626] selection:text-white flex flex-col pb-24">
      
      {/* 1. TOP BRAND NAVBAR */}
      <header className={`sticky top-0 z-40 ${
        isMarketplace 
          ? 'bg-gradient-to-r from-stone-950 via-zinc-900 to-black border-b border-stone-800' 
          : isSalon 
            ? 'bg-zinc-950 border-b border-zinc-800' 
            : 'bg-[#DC2626]'
      } text-white shadow-md px-4 sm:px-6 py-3`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          
          {/* Left: Brand + Active Store Switcher / Badge */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 cursor-pointer select-none" onClick={() => setActiveTab(0)}>
              <span className="text-base sm:text-lg font-black tracking-tight text-white">CHURUONE</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                isMarketplace
                  ? 'bg-amber-400 text-stone-950 font-black'
                  : isSalon 
                    ? 'bg-[#d4af37] text-zinc-950 font-black' 
                    : 'bg-zinc-900 text-white font-extrabold'
              } uppercase tracking-wider ml-1`}>
                {isMarketplace ? 'SUPER ADMIN' : isSalon ? 'SALON OS' : 'MASTER OS'}
              </span>
            </div>

            {/* Store Switcher: Interactive dropdown for Super Admin, static for regular merchants */}
            {isSuperAdmin ? (
              <div className="relative flex items-center">
                <select
                  value={storeId}
                  onChange={(e) => switchStoreId(e.target.value)}
                  className="bg-white text-zinc-900 text-xs font-black px-3.5 py-1.5 rounded-full shadow-md cursor-pointer border border-zinc-200 focus:outline-none pr-7 appearance-none max-w-[190px] sm:max-w-none truncate"
                >
                  <option value="churuone">👑 ChuruOne Platform</option>
                  {(platformStores || [])
                    .filter(s => (s.id || s.slug) !== 'churuone')
                    .map(s => {
                      const sid = s.id || s.slug;
                      const icon = s.vertical === 'food' ? '🌯' : s.vertical === 'fashion' ? '👔' : s.vertical === 'salon' ? '✂️' : '🏪';
                      const label = s.name || sid;
                      const suffix = s.isMohallaStore && s.mohalla ? ` (${s.mohalla})` : '';
                      return (
                        <option key={sid} value={sid}>
                          {icon} {label}{suffix}
                        </option>
                      );
                    })}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-600 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-zinc-900 text-xs font-black shadow-sm">
                <Store className={`w-3.5 h-3.5 ${isSalon ? 'text-[#d4af37]' : 'text-[#DC2626]'}`} />
                <span className="capitalize">{storeInfo?.name || storeInfo?.storeName || storeId}</span>
              </div>
            )}

            {/* Store Status / Live Toggle */}
            {isPendingReview ? (
              <span className="inline-flex items-center gap-1 text-[11px] bg-amber-400 text-amber-950 font-black px-3 py-1 rounded-full uppercase shadow-xs">
                <Clock className="w-3 h-3 animate-pulse" /> Review Stage (24h)
              </span>
            ) : isMarketplace ? (
              <button
                type="button"
                onClick={() => {
                  const nextOpen = !(storeInfo?.isOpen !== false);
                  updateStoreSettings({ isOpen: nextOpen });
                  showToast(
                    nextOpen ? '🟢 ChuruOne Platform abhi LIVE OPEN kar diya gaya!' : '🔴 ChuruOne Platform abhi PAUSED mark kar diya gaya!',
                    nextOpen ? 'success' : 'warning'
                  );
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black shadow-sm transition-all cursor-pointer border-0 active:scale-95 ${
                  storeInfo?.isOpen !== false
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                }`}
                title={storeInfo?.isOpen !== false ? 'Click to Pause Platform' : 'Click to Resume Platform'}
              >
                <span className={`w-2 h-2 rounded-full ${storeInfo?.isOpen !== false ? 'bg-white animate-pulse' : 'bg-white'}`} />
                <span>{storeInfo?.isOpen !== false ? 'PLATFORM LIVE' : 'PLATFORM PAUSED'}</span>
              </button>
            ) : (!storeInfo?.marketplaceVisible || !storeInfo?.isSetupComplete) && !['shawarma', 'skyline', 'nash-studio'].includes(storeId) ? (
              <button
                type="button"
                onClick={() => {
                  setActiveTab(0);
                  showToast('Dukan abhi marketplace par hidden hai. Pehle Dashboard par jakar Setup poora karein aur Go Live dabayein.', 'info');
                }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black shadow-sm bg-amber-400 hover:bg-amber-500 text-amber-950 transition-all cursor-pointer border-0 active:scale-95"
                title="Dukan abhi offline hai: Setup poora karke Go Live dabayein"
              >
                <span className="w-2 h-2 rounded-full bg-amber-950 animate-pulse" />
                <span>SETUP IN PROGRESS (OFFLINE)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  const nextOpen = !(storeInfo?.isOpen !== false);
                  updateStoreSettings({ isOpen: nextOpen });
                  showToast(
                    nextOpen ? '🟢 Dukan abhi LIVE OPEN kar di gayi! Website par Store Open ho gaya hai.' : '🔴 Dukan abhi CLOSED mark kar di gayi! Website par Store Closed banner show ho gaya hai.',
                    nextOpen ? 'success' : 'warning'
                  );
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black shadow-sm transition-all cursor-pointer border-0 active:scale-95 ${
                  storeInfo?.isOpen !== false
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                }`}
                title={storeInfo?.isOpen !== false ? 'Click to Pause/Close' : 'Click to Open/Resume'}
              >
                <span className={`w-2 h-2 rounded-full ${storeInfo?.isOpen !== false ? 'bg-white animate-pulse' : 'bg-white'}`} />
                <span>{storeInfo?.isOpen !== false ? 'DUKAN OPEN' : 'DUKAN CLOSED (CLICK TO OPEN)'}</span>
              </button>
            )}
          </div>

          {/* Right: Explore Feed + Cloud Connection Indicator + Sound + Refresh + Logout */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* ChuruOne Explore & Stores Shortcut */}
            <a
              href="/explore"
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all shadow-xs"
              title="Explore ChuruOne City Feed & Partner Stores"
            >
              <span>🌐 Explore Feed</span>
            </a>

            {/* Live Connection Pill */}
            <div className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-black shadow-sm ${
              isConnected 
                ? 'bg-emerald-600 text-white' 
                : 'bg-amber-500 text-white'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-white animate-pulse' : 'bg-zinc-200'}`} />
              <span className="hidden xs:inline">{isConnected ? 'Cloud Live' : 'Reconnecting...'}</span>
            </div>

            {/* Sound Mute/Unmute */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-full shadow-sm transition-all cursor-pointer ${
                soundEnabled 
                  ? 'bg-white text-zinc-900 hover:bg-zinc-100' 
                  : 'bg-zinc-900 text-white'
              }`}
              title={soundEnabled ? 'Mute Order Alerts' : 'Unmute Order Alerts'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Manual Refresh */}
            <button
              onClick={refreshData}
              className="p-2 rounded-full bg-white text-zinc-900 hover:bg-zinc-100 shadow-sm transition-all cursor-pointer"
              title="Refresh Store Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Always Available Logout Button */}
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
              title="Dukandar Portal Se Logout Karein"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Logout</span>
            </button>
          </div>

        </div>
      </header>

      {/* 2. HORIZONTAL 9-TAB NAVIGATION CHIP BAR (Clean Solid Pills, Zero Glassy) */}
      <nav className="sticky top-[52px] sm:top-[56px] z-30 bg-[#FFFBF7] border-b border-zinc-200/80 px-4 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto scrollbar-none">
          {tabsConfig.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;

            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer shrink-0 border-0 ${
                  isActive 
                    ? 'bg-[#DC2626] text-white shadow-md scale-[1.02]' 
                    : 'bg-white text-zinc-700 hover:text-zinc-900 shadow-xs hover:shadow-sm'
                }`}
              >
                <Icon className="w-3.5 h-3.5 stroke-[2.2]" />
                <span>{t.label}</span>
                {t.isLocked && (
                  <Lock className="w-3 h-3 text-amber-500 shrink-0" />
                )}
                {t.badge !== undefined && t.badge > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    isActive 
                      ? 'bg-white text-[#DC2626]' 
                      : t.highlightBadge 
                        ? 'bg-[#DC2626] text-white' 
                        : 'bg-zinc-100 text-zinc-600'
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
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 pb-32 sm:pb-36">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 0 ? (
              <DashboardTab />
            ) : activeTab === 8 ? (
              <SettingsTab />
            ) : (isPendingReview || isRejected) ? (
              <LockedTabPreview tabId={activeTab} setActiveTab={setActiveTab} onLogout={logout} isRejected={isRejected} />
            ) : (
              <>
                {activeTab === 1 && (isMarketplace ? <CityOrdersLedgerTab /> : <OrdersTab />)}
                {activeTab === 2 && (isMarketplace ? <CityProductsTab /> : <MenuTab />)}
                {activeTab === 6 && <PartnerStoresTab />}
                {activeTab === 3 && <OffersTab />}
                {activeTab === 4 && <CustomersTab />}
                {activeTab === 5 && <ReviewsTab />}
                {activeTab === 7 && <FranchiseTab />}
                {activeTab === 8 && <SettingsTab />}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Review Modal Popup for Newly Registered Merchants */}
      <AnimatePresence>
        {showReviewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-zinc-200 relative text-center"
            >
              <button
                onClick={() => setShowReviewModal(false)}
                className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-zinc-700 rounded-full hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-4 shadow-xs">
                <Clock className="w-7 h-7 animate-pulse" />
              </div>

              <span className="text-[10px] font-mono uppercase bg-amber-100 text-amber-900 px-3 py-1 rounded-full font-bold">
                Request In Review
              </span>

              <h3 className="text-xl font-black text-zinc-950 mt-3">
                Aapka Dukan Account Ban Gaya Hai!
              </h3>

              <p className="text-xs text-zinc-600 mt-2 leading-relaxed">
                Aapki dukan ki application praapt ho gayi hai. Hamari tech team jald hi aapki dukan ki custom website banakar aapke is dashboard se link kar degi.
              </p>

              {/* Timeline */}
              <div className="mt-4 p-3.5 bg-zinc-50 rounded-2xl border border-zinc-100 text-left space-y-2 text-xs">
                <div className="flex items-center gap-2 text-emerald-700 font-bold">
                  <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">✓</span>
                  <span>1. Dukan Application & Digital Contract Signed</span>
                </div>
                <div className="flex items-center gap-2 text-amber-700 font-bold">
                  <Clock className="w-4 h-4 shrink-0 text-amber-600 animate-pulse" />
                  <span>2. Custom Website Creation (In Progress)</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-400 font-medium">
                  <div className="w-4 h-4 rounded-full border-2 border-zinc-300 shrink-0" />
                  <span>3. Portal Unlock & Live Launch</span>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-2">
                <a
                  href="https://wa.me/917023963189?text=Namaste%20ChuruOne%2C%20meri%20dukan%20ki%20request%20in%20review%20hai"
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>WhatsApp Contact</span>
                </a>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2.5 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Dashboard Dekhein
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. REALTIME TOAST NOTIFICATION POPUP */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-6 right-6 z-50 max-w-sm rounded-2xl p-4 text-xs font-black shadow-xl flex items-center gap-3 border-0 ${
              toast.type === 'success' 
                ? 'bg-zinc-900 text-white' 
                : toast.type === 'error'
                  ? 'bg-red-600 text-white'
                  : 'bg-zinc-900 text-white'
            }`}
          >
            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              toast.type === 'success' ? 'bg-emerald-400 animate-ping' : toast.type === 'error' ? 'bg-white' : 'bg-[#DC2626]'
            }`} />
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
 
      {/* 5. BOTTOM NAVIGATION DOCK (Feed, Explore, Store, Dashboard) */}
      <BottomNavBar />

    </div>
  );
}

function LockedTabPreview({ tabId, setActiveTab, onLogout, isRejected }) {
  const tabNames = {
    1: 'Live Orders & KOT Printing',
    2: 'Menu & Product Catalog Editor',
    3: 'Promotional Offers & Deals',
    4: 'Customers CRM & Database',
    5: 'Customer Reviews Moderation',
    6: 'Android SMS Gateway & SIM Sync',
    7: 'Franchise Inquiries',
    8: 'Store Operational Settings'
  };
  const title = tabNames[tabId] || 'Yeh Feature';

  return (
    <div className={`max-w-2xl mx-auto my-8 p-6 sm:p-8 bg-white rounded-3xl border shadow-xl text-center ${
      isRejected ? 'border-red-300' : 'border-amber-200/90'
    }`}>
      <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm ${
        isRejected ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
      }`}>
        <Lock className={`w-8 h-8 ${isRejected ? 'text-red-600' : 'text-amber-700'}`} />
      </div>
      <span className={`text-[11px] font-mono uppercase px-3 py-1 rounded-full font-bold ${
        isRejected ? 'bg-red-100 text-red-900' : 'bg-amber-100 text-amber-900'
      }`}>
        {isRejected ? '⚠️ Action Required / Rejected' : 'Application Under Review'}
      </span>
      <h3 className="text-xl font-black text-zinc-950 mt-3">
        {title} Abhi Locked Hai
      </h3>
      <p className="text-xs text-zinc-600 mt-2 max-w-md mx-auto leading-relaxed">
        {isRejected 
          ? 'Aapki application me sudhaar ki aavashyakta hai. Kripya Dashboard tab par jakar Super Admin ka note padhein aur application re-apply karein.' 
          : 'Aapki dukan ki custom website abhi hamari tech team banakar link kar rahi hai. 24 ghante ke andar website live hote hi aapka yeh section unlock ho jayega.'}
      </p>
      
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => setActiveTab(0)}
          className="px-5 py-2.5 bg-zinc-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
        >
          ← Dashboard Par Jayein
        </button>
        {onLogout && (
          <button
            onClick={onLogout}
            className="px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout Account</span>
          </button>
        )}
        <a
          href="/explore"
          className="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          🌐 ChuruOne Live Feed
        </a>
      </div>
    </div>
  );
}

