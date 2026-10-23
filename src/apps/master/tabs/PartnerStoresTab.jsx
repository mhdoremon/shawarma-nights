import React, { useState, useEffect } from 'react';
import { useMaster } from '../context/MasterContext';
import { 
  Store, 
  ExternalLink, 
  Eye, 
  EyeOff, 
  Check, 
  Sparkles, 
  RefreshCw, 
  Search, 
  ArrowRight, 
  MapPin, 
  Phone, 
  Star, 
  ShieldCheck, 
  Layers, 
  AlertCircle,
  Clock,
  ShoppingBag,
  Scissors,
  Utensils,
  Shirt,
  Sliders,
  CheckCircle2,
  Lock,
  User,
  X,
  XCircle,
  ThumbsUp,
  ThumbsDown,
  Navigation,
  Trash2
} from 'lucide-react';

const API_BASE = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:5000'
  : 'https://churuone-backend.onrender.com';

export default function PartnerStoresTab() {
  const { 
    switchStoreId, 
    showToast, 
    toggleStoreMarketplaceVisibility, 
    isSuperAdmin,
    storeInfo: currentStoreInfo,
    refreshPlatformStores
  } = useMaster();

  const [stores, setStores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVertical, setSelectedVertical] = useState('all');
  const [selectedStatusTab, setSelectedStatusTab] = useState('all'); // 'all', 'active', 'band'
  const [togglingId, setTogglingId] = useState(null);
  const [updatingRadiusId, setUpdatingRadiusId] = useState(null);
  const [changingStatusId, setChangingStatusId] = useState(null);

  // Super Admin Change Store Operational Status (Active / Suspended / Deactivated)
  const handleUpdateStoreStatus = async (storeId, nextStatus, note = '') => {
    try {
      setChangingStatusId(storeId);
      const token = localStorage.getItem('churuone_master_token') || 'super-admin-churuone-master-token-2026';
      const res = await fetch(`${API_BASE}/api/platform/stores/${storeId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus, note })
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          nextStatus === 'active'
            ? `🟢 ${storeId.toUpperCase()} ko wapas ACTIVE kar diya gaya hai!`
            : `🔴 ${storeId.toUpperCase()} ko BAND / SUSPEND kar diya gaya hai.`,
          nextStatus === 'active' ? 'success' : 'info'
        );
        setStores(prev => prev.map(s => (s.id === storeId || s.slug === storeId) ? { ...s, status: nextStatus, isOpen: nextStatus === 'active', marketplaceVisible: nextStatus === 'active' } : s));
        loadPlatformStores();
      } else {
        showToast(data.message || 'Status update failed', 'error');
      }
    } catch (err) {
      showToast('Network error: ' + err.message, 'error');
    } finally {
      setChangingStatusId(null);
    }
  };

  const [deletingStoreId, setDeletingStoreId] = useState(null);

  // Super Admin Permanently Delete Store from Platform & Database
  const handleDeleteStore = async (storeId, storeName) => {
    const confirmation = window.prompt(
      `⚠️ PERMANENT DELETE WARNING!\nKya aap sach me "${storeName || storeId}" ko poori tarah system aur database se delete karna chahte hain?\n\nConfirm karne ke liye type karein: DELETE`
    );
    if (!confirmation || confirmation.trim().toUpperCase() !== 'DELETE') {
      if (confirmation) showToast('Deletion cancelled. "DELETE" type karna zaroori tha.', 'info');
      return;
    }

    try {
      setDeletingStoreId(storeId);
      const token = localStorage.getItem('churuone_master_token') || 'super-admin-churuone-master-token-2026';
      const res = await fetch(`${API_BASE}/api/platform/stores/${storeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        showToast(`🗑️ Store "${storeName || storeId}" poori tarah delete ho gaya!`, 'success');
        setStores(prev => prev.filter(s => s.id !== storeId && s.slug !== storeId && s.dukanId !== storeId));
        loadPlatformStores();
      } else {
        showToast(data.message || 'Delete failed', 'error');
      }
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    } finally {
      setDeletingStoreId(null);
    }
  };

  // Super Admin Radius Reward & Expansion for Top Performing Mohalla Stores
  const handleUpdateRadius = async (storeId, delta) => {
    setUpdatingRadiusId(storeId);
    let targetRadius = 1.5;

    setStores(prev => prev.map(s => {
      if (s.id === storeId) {
        const cur = Number(s.radiusKm || 1.5);
        const next = Math.max(0.5, Math.min(10.0, Math.round((cur + delta) * 10) / 10));
        targetRadius = next;
        return { ...s, radiusKm: next };
      }
      return s;
    }));

    try {
      const token = localStorage.getItem('churuone_master_token') || 'super-admin-churuone-master-token-2026';
      await fetch(`${API_BASE}/api/store-info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': storeId,
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          radiusKm: targetRadius,
          settings: {
            deliveryRadius: targetRadius
          }
        })
      });
      showToast(`🏆 ${storeId.toUpperCase()} Delivery Radius expanded to ${targetRadius} km!`, 'success');
    } catch (err) {
      showToast(`Radius updated locally to ${targetRadius} km`, 'info');
    } finally {
      setUpdatingRadiusId(null);
    }
  };

  // Platform Marquee ribbon quick state
  const [marqueeInput, setMarqueeInput] = useState(
    currentStoreInfo?.branding?.marqueeText ||
    '★ LIVE ORDERS DISPATCHING ACROSS CHURU • SHAWARMA NIGHTS 25 MIN EXPRESS • SKYLINE BESPOKE APPAREL • NASH STUDIO PRIVATE SALON • 0% COMMISSION DIRECT PRICING ★'
  );
  const [isSavingMarquee, setIsSavingMarquee] = useState(false);

  // Fetch all registered partner stores from platform feed
  const loadPlatformStores = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE}/api/platform/marketplace?all=true`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.stores)) {
        setStores(data.stores);
        if (data.platform?.branding?.marqueeText) {
          setMarqueeInput(data.platform.branding.marqueeText);
        }
      }
    } catch (err) {
      console.warn('Failed to load platform stores feed:', err);
      // Fallback core stores if offline
      setStores([
        {
          id: 'shawarma',
          name: 'Shawarma Nights',
          vertical: 'food',
          category: 'Charcoal Kitchen & Dining • Shawarmas, Platters & Rolls',
          rating: '4.8',
          timing: '20-25 min',
          destination: '/shawarma',
          tag: 'Food Delivery',
          isOpen: true,
          address: 'Near Subhash Chowk, Churu',
          phone: '7023963189',
          freeDeliveryThreshold: 299,
          marketplaceVisible: true
        },
        {
          id: 'skyline',
          name: 'Skyline Premium Outfits',
          vertical: 'fashion',
          category: 'Luxury Menswear • Shirts, Pants, Jeans, Kurtas & Jackets',
          rating: '4.9',
          timing: 'Same Day Dispatch',
          destination: '/skyline',
          tag: 'Fashion & Outfits',
          isOpen: true,
          address: 'Station Road, Churu, Rajasthan',
          phone: '7023963189',
          freeDeliveryThreshold: 499,
          marketplaceVisible: true
        },
        {
          id: 'nash-studio',
          name: 'Nash Studio',
          vertical: 'salon',
          category: 'Salon & Luxury Grooming • Haircuts, Beard & Facials',
          rating: '4.9',
          timing: '15 min slot',
          destination: '/nash',
          tag: 'Salon Booking',
          isOpen: true,
          address: 'Main Market, Opp. Kotwali, Churu',
          phone: '7023963189',
          freeDeliveryThreshold: 0,
          marketplaceVisible: true
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Mohalla Store Onboarding & Review State
  const [pendingApps, setPendingApps] = useState([]);
  const [isLoadingApps, setIsLoadingApps] = useState(false);
  const [actingAppId, setActingAppId] = useState(null);
  const [editRadius, setEditRadius] = useState({});

  // Super Admin Mandatory Rejection Reason & Note State
  const REJECTION_PRESETS = [
    { 
      id: 'address_unclear', 
      label: '📍 दुकान का पता या मोहल्ला/लैंडमार्क स्पष्ट नहीं है (Shop address / Landmark unclear)', 
      defaultNote: 'Aapki dukan ka pata ya landmark saaf nahi hai. Kripya apna sahi mohalla aur landmark select karke dobara apply karein.' 
    },
    { 
      id: 'outside_service', 
      label: '🛵 दुकान का क्षेत्र वर्तमान डिलीवरी नेटवर्क से बाहर है (Area outside delivery zone)', 
      defaultNote: 'Aapki dukan ka area hamare current 15-min delivery radius se bahar hai. Kripya apna sahi nazdeeki landmark select karein.' 
    },
    { 
      id: 'incomplete_contact', 
      label: '📞 दुकानदार या संपर्क विवरण अधूरा / अमान्य है (Incomplete / Invalid Details)', 
      defaultNote: 'Aapke phone number ya dukan ke naam me kami hai. Kripya dukan ka sahi naam aur sampark sutra update karein.' 
    },
    { 
      id: 'duplicate_test', 
      label: '🧪 डुप्लीकेट या टेस्टिंग हेतु बनाई गई एप्लीकेशन (Duplicate / Test application)', 
      defaultNote: 'Yeh application testing ya duplicate pratit ho rahi hai. Kripya sahi vyaparik jankari ke sath re-apply karein.' 
    },
    { 
      id: 'wrong_category', 
      label: '📦 गलत व्यापार श्रेणी या अनुपयुक्त उत्पाद (Incorrect Business Category)', 
      defaultNote: 'Aapne galat category select ki hai. Kripya apni dukan ke anusaar uchit business type select karein.' 
    },
    { 
      id: 'other', 
      label: '✏️ अन्य कारण (Other / Custom reason)', 
      defaultNote: '' 
    }
  ];

  const [rejectModalApp, setRejectModalApp] = useState(null);
  const [selectedReasonPreset, setSelectedReasonPreset] = useState('address_unclear');
  const [rejectionCustomNote, setRejectionCustomNote] = useState('');

  const loadPendingApps = async () => {
    try {
      setIsLoadingApps(true);
      const token = localStorage.getItem('churuone_master_token') || 'super-admin-churuone-master-token-2026';
      const res = await fetch(`${API_BASE}/api/auth/admin/mohalla/pending`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && Array.isArray(data.applications)) {
        setPendingApps(data.applications);
      }
    } catch (err) {
      console.warn('Pending apps error:', err);
    } finally {
      setIsLoadingApps(false);
    }
  };

  const handleReviewApp = async (dukanId, action, customRadius, customMohalla, customLandmark, customAdminNote) => {
    try {
      setActingAppId(dukanId);
      const token = localStorage.getItem('churuone_master_token') || 'super-admin-churuone-master-token-2026';
      const res = await fetch(`${API_BASE}/api/auth/admin/mohalla/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          dukanId,
          action,
          radiusKm: customRadius || 1.5,
          mohalla: customMohalla,
          nearestLandmark: customLandmark,
          adminNote: customAdminNote || (action === 'approve' ? 'Approved by ChuruOne Super Admin' : 'Application rejected by admin')
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          action === 'approve' 
            ? '🟢 Mohalla Dukan approve ho gayi & area allot ho gaya! Dukandar dashboard unlock ho chuka hai.' 
            : '🔴 Application reject kar di gayi aur reason applicant ko bhej diya gaya.', 
          'success'
        );
        loadPendingApps();
        loadPlatformStores();
        if (typeof refreshPlatformStores === 'function') refreshPlatformStores();
      } else {
        showToast(data.message || 'Error processing application', 'error');
      }
    } catch (err) {
      showToast('Network error: ' + err.message, 'error');
    } finally {
      setActingAppId(null);
    }
  };

  useEffect(() => {
    loadPlatformStores();
    loadPendingApps();
  }, []);

  // 1-Click Toggle Store Visibility on ChuruOne Marketplace
  const handleToggleVisibility = async (storeId, currentVisibility) => {
    setTogglingId(storeId);
    const nextVisibility = !currentVisibility;

    // Optimistic UI update
    setStores(prev => prev.map(s => s.id === storeId ? { ...s, marketplaceVisible: nextVisibility } : s));

    try {
      const res = await toggleStoreMarketplaceVisibility(storeId, nextVisibility);
      if (res && res.success) {
        showToast(
          nextVisibility 
            ? `🟢 ${storeId.toUpperCase()} ab ChuruOne Marketplace par LIVE dikh raha hai!` 
            : `🔴 ${storeId.toUpperCase()} ko ChuruOne Marketplace se HIDE kar diya gaya hai.`,
          nextVisibility ? 'success' : 'info'
        );
      }
    } catch (err) {
      // Revert on error
      setStores(prev => prev.map(s => s.id === storeId ? { ...s, marketplaceVisible: currentVisibility } : s));
      showToast('Visibility update failed: ' + err.message, 'error');
    } finally {
      setTogglingId(null);
    }
  };

  // Save Platform Marquee Ribbon
  const handleSaveMarquee = async (e) => {
    e.preventDefault();
    setIsSavingMarquee(true);
    try {
      const token = localStorage.getItem('churuone_master_token') || 'super-admin-churuone-master-token-2026';
      const res = await fetch(`${API_BASE}/api/store-info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': 'churuone',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          branding: {
            marqueeText: marqueeInput.trim()
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('ChuruOne Live Kinetic Ticker Ribbon saved & synced!', 'success');
      } else {
        showToast(data.message || 'Failed to save marquee text', 'error');
      }
    } catch (err) {
      showToast('Network error saving marquee text', 'error');
    } finally {
      setIsSavingMarquee(false);
    }
  };

  // Filter stores
  const filteredStores = stores.filter(st => {
    const matchesQuery = !searchQuery.trim() || 
      st.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.mohalla?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesVertical = selectedVertical === 'all' || st.vertical === selectedVertical;

    const isBand = st.status === 'deactivated' || st.status === 'suspended';
    const isRejected = st.status === 'rejected';
    const isPending = st.status === 'pending_review' || st.status === 'pending';
    const isActive = (st.status === 'active' || st.status === 'approved' || !st.status) && !isBand && !isRejected && !isPending;

    const matchesStatus = 
      selectedStatusTab === 'all' ? true :
      selectedStatusTab === 'active' ? isActive :
      selectedStatusTab === 'band' ? isBand :
      selectedStatusTab === 'rejected' ? isRejected : true;

    return matchesQuery && matchesVertical && matchesStatus;
  });

  const totalStores = stores.length;
  const rejectedCount = stores.filter(s => s.status === 'rejected').length;
  const bandCount = stores.filter(s => s.status === 'deactivated' || s.status === 'suspended').length;
  const activeCount = stores.filter(s => (s.status === 'active' || s.status === 'approved' || !s.status) && s.status !== 'deactivated' && s.status !== 'suspended' && s.status !== 'rejected' && s.status !== 'pending_review' && s.status !== 'pending').length;
  const liveCount = stores.filter(s => (s.status === 'active' || s.status === 'approved' || !s.status) && s.status !== 'deactivated' && s.status !== 'suspended' && s.status !== 'rejected' && s.marketplaceVisible !== false).length;
  const hiddenCount = Math.max(0, totalStores - liveCount - bandCount - rejectedCount);

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans">
      
      {/* 1. HEADER & SUMMARY METRICS BANNER */}
      <div className="bg-gradient-to-r from-stone-900 via-zinc-900 to-black text-white rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-gradient-to-l from-[#DC2626]/20 to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400 text-stone-950 text-xs font-black uppercase tracking-wider shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>ChuruOne Platform Owner Control</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              PARTNER STORES & MARKETPLACE DIRECTORY
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 max-w-2xl leading-relaxed">
              Control which partner stores appear on ChuruOne Homepage (<a href="/" target="_blank" rel="noreferrer" className="text-amber-300 underline font-semibold">churu.one</a>), toggle instant visibility, review operational status, and manage stores in 1-Click.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-full bg-white hover:bg-stone-100 text-stone-950 text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg transition-transform active:scale-95 no-underline"
            >
              <span>View ChuruOne Live</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              type="button"
              onClick={loadPlatformStores}
              className="p-2.5 rounded-full bg-stone-800 hover:bg-stone-700 text-white transition-colors cursor-pointer border border-stone-700 shadow-sm"
              title="Refresh Partner Stores Feed"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* 4 Summary Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-stone-800/80">
          <div className="bg-stone-800/60 backdrop-blur-xs p-4 rounded-2xl border border-stone-700/60 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400 font-bold block">
                Total Partner Hubs
              </span>
              <span className="text-2xl font-black text-white mt-0.5 block">
                {totalStores}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-stone-700 text-stone-200 flex items-center justify-center font-black">
              <Store className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-emerald-950/40 backdrop-blur-xs p-4 rounded-2xl border border-emerald-800/40 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold block">
                Live on ChuruOne
              </span>
              <span className="text-2xl font-black text-emerald-300 mt-0.5 block">
                {liveCount} Stores
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-900/60 text-emerald-400 flex items-center justify-center font-black">
              <Eye className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-amber-950/40 backdrop-blur-xs p-4 rounded-2xl border border-amber-800/40 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
                In Setup / Draft
              </span>
              <span className="text-2xl font-black text-amber-300 mt-0.5 block">
                {hiddenCount} Stores
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-900/60 text-amber-400 flex items-center justify-center font-black">
              <EyeOff className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-red-950/40 backdrop-blur-xs p-4 rounded-2xl border border-red-800/40 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-red-400 font-bold block">
                Band Dukanein
              </span>
              <span className="text-2xl font-black text-red-300 mt-0.5 block">
                {bandCount} Stores
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-900/60 text-red-400 flex items-center justify-center font-black">
              <Lock className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. CHURUONE LIVE TICKER RIBBON QUICK CUSTOMIZER */}
      <div className="bg-white rounded-3xl p-6 shadow-xl border border-stone-200/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className="text-base font-black text-stone-900 uppercase tracking-tight">
                ChuruOne Top Ticker Ribbon ("Patti")
              </h3>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Yeh text ChuruOne homepage ke top me dynamic moving ribbon me 24/7 run hota hai.
            </p>
          </div>
          <span className="text-[10px] font-mono uppercase font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
            Live Stream Ribbon
          </span>
        </div>

        <form onSubmit={handleSaveMarquee} className="space-y-3">
          <textarea
            rows={2}
            value={marqueeInput}
            onChange={(e) => setMarqueeInput(e.target.value)}
            placeholder="Type marquee announcement text here..."
            className="w-full text-xs font-mono p-3 rounded-2xl border border-stone-200 focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-none leading-relaxed text-stone-800 bg-stone-50/50"
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] text-stone-400 font-mono">
              ★ Separators jaise • ya ✦ ka use karein.
            </span>
            <button
              type="submit"
              disabled={isSavingMarquee}
              className="px-5 py-2 rounded-full bg-stone-900 hover:bg-black text-white text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              {isSavingMarquee ? 'Saving Ribbon...' : 'Save Ticker Ribbon'}
            </button>
          </div>
        </form>
      </div>

      {/* 2.5 PENDING MOHALLA STORE APPLICATIONS (Super Admin Onboarding Queue) */}
      <div className="bg-white rounded-3xl p-6 shadow-xl border border-stone-200/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-stone-900 uppercase tracking-tight">
                  Mohalla Dukan Onboarding & Verification
                </h3>
                {pendingApps.length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white font-mono font-bold text-xs">
                    {pendingApps.length} PENDING
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Naye mohalla dukandar yahan register apply karte hain. Unka area & radius verify karke 1-Click me dukan open karein.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadPendingApps}
            className="self-start sm:self-auto px-4 py-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingApps ? 'animate-spin' : ''}`} />
            <span>Check Requests</span>
          </button>
        </div>

        {/* Application Cards */}
        {pendingApps.length === 0 ? (
          <div className="p-6 bg-stone-50 rounded-2xl border border-stone-200/70 text-center space-y-1">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
            <h4 className="font-bold text-xs text-stone-800">Sabhi Mohalla Applications Reviewed Hain</h4>
            <p className="text-[11px] text-stone-500">
              Koi nayi dukan approval ke liye pending nahi hai. Naye dukandar /auth?role=dukandar se apply kar sakte hain.
            </p>
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            {pendingApps.map(app => {
              const dId = app.dukanId || app.storeSlug;
              const isActing = actingAppId === dId;
              const requestedRadius = editRadius[dId] !== undefined ? editRadius[dId] : (app.mohallaData?.radiusKm || app.radiusKm || 1.2);
              const mohallaAreaName = app.mohallaData?.areaName || app.mohallaData?.mohalla || app.mohalla || (app.mohallaData?.nearestLandmark ? app.mohallaData.nearestLandmark.replace(/_/g, ' ') : 'Subhash Chowk');
              const nearestLandmarkKey = app.mohallaData?.nearestLandmark || app.nearestLandmark || 'subhash_chowk';
              const hasGps = Boolean(app.mohallaData?.lat || app.lat);

              return (
                <div
                  key={dId}
                  className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-950 uppercase">
                        {dId}
                      </span>
                      <h4 className="font-black text-sm text-stone-900">
                        {app.dukanName}
                      </h4>
                      <span className="text-[10px] bg-white border border-stone-200 px-2 py-0.5 rounded-full font-bold text-stone-600 uppercase">
                        {app.businessType || 'mohalla_kirana'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs text-stone-600">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-stone-400" />
                        <span>Owner: <strong>{app.ownerName}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-stone-400" />
                        <a href={`tel:${app.phone}`} className="text-emerald-700 font-mono font-bold hover:underline">
                          +91 {app.phone}
                        </a>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-stone-400" />
                        <span>Area: <strong className="capitalize">{mohallaAreaName}</strong></span>
                      </div>
                    </div>

                    {hasGps && (
                      <div className="text-[11px] font-mono text-emerald-800 bg-emerald-100/70 inline-block px-2.5 py-0.5 rounded-lg">
                        📍 GPS Captured: {app.mohallaData?.lat || app.lat}, {app.mohallaData?.lng || app.lng}
                      </div>
                    )}
                  </div>

                  {/* Right Actions: Radius Alotment + Approve / Reject Buttons */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-amber-200">
                    <div className="flex flex-col gap-1 min-w-[130px]">
                      <div className="flex items-center justify-between text-[11px] font-bold text-stone-700">
                        <span>Allotted Radius:</span>
                        <span className="font-mono text-emerald-700 font-black">{requestedRadius} km</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="5.0"
                        step="0.1"
                        value={requestedRadius}
                        onChange={(e) => setEditRadius(prev => ({ ...prev, [dId]: parseFloat(e.target.value) }))}
                        className="accent-emerald-700 h-1.5 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isActing}
                        onClick={() => handleReviewApp(dId, 'approve', requestedRadius, mohallaAreaName, nearestLandmarkKey)}
                        className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Approve & Allot</span>
                      </button>

                      <button
                        type="button"
                        disabled={isActing}
                        onClick={() => {
                          setRejectModalApp(app);
                          setSelectedReasonPreset(REJECTION_PRESETS[0].id);
                          setRejectionCustomNote(REJECTION_PRESETS[0].defaultNote);
                        }}
                        className="px-3 py-2 rounded-xl bg-red-100 hover:bg-red-200 active:scale-95 text-red-700 font-bold text-xs uppercase transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1 shadow-xs"
                        title="Reject Application with Required Reason"
                      >
                        <X className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. SEARCH & VERTICAL CATEGORY & STATUS FILTER PILLS */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-lg border border-stone-200/80 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search partner store by name, id, category, or location..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-2xl bg-stone-50 border border-stone-200 focus:border-stone-900 outline-none transition-colors"
            />
          </div>

          {/* Operational Status Filter Tabs (Active vs Band Dukanein) */}
          <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-2xl self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setSelectedStatusTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border-0 ${
                selectedStatusTab === 'all'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Sabhi ({totalStores})
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatusTab('active')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border-0 flex items-center gap-1 ${
                selectedStatusTab === 'active'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span>🟢 Active</span>
              <span className="text-[10px] opacity-80">({activeCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatusTab('band')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border-0 flex items-center gap-1 ${
                selectedStatusTab === 'band'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span>⏸️ Band Dukanein</span>
              <span className="text-[10px] opacity-80">({bandCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatusTab('rejected')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border-0 flex items-center gap-1 ${
                selectedStatusTab === 'rejected'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span>🚫 Rejected</span>
              <span className="text-[10px] opacity-80">({rejectedCount})</span>
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-1 border-t border-stone-100">
          {[
            { id: 'all', label: 'All Verticals', icon: Layers },
            { id: 'mohalla_kirana', label: 'Mohalla Kirana', icon: Store },
            { id: 'food', label: 'Food', icon: Utensils },
            { id: 'fashion', label: 'Fashion', icon: Shirt },
            { id: 'salon', label: 'Salon', icon: Scissors }
          ].map(cat => {
            const Icon = cat.icon;
            const active = selectedVertical === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedVertical(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap border-0 ${
                  active 
                    ? 'bg-stone-900 text-white shadow-xs' 
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. PARTNER STORES DIRECTORY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredStores.map(store => {
          const isVisible = store.marketplaceVisible !== false;
          const isToggling = togglingId === store.id;
          const isMohalla = store.isMohallaStore || store.vertical === 'mohalla_kirana' || store.type === 'mohalla_kirana' || (store.id || '').includes('kirana');
          const isFlagship = Boolean(
            store.isFlagshipBrand || 
            store.isCityWide || 
            ['shawarma', 'skyline', 'nash-studio'].includes(store.id || store.slug)
          );
          const isBand = store.status === 'deactivated' || store.status === 'suspended';
          const isRejected = store.status === 'rejected';
          const isSuspended = store.status === 'suspended';

          const verticalBadge = 
            isMohalla ? { label: 'Mohalla Kirana', bg: 'bg-emerald-100 text-emerald-900', icon: Store } :
            store.vertical === 'food' ? { label: 'Food Delivery', bg: 'bg-amber-100 text-amber-900', icon: Utensils } :
            store.vertical === 'salon' ? { label: 'Salon Booking', bg: 'bg-purple-100 text-purple-900', icon: Scissors } :
            { label: 'Fashion & Outfits', bg: 'bg-blue-100 text-blue-900', icon: Shirt };

          const IconComponent = verticalBadge.icon;

          return (
            <div
              key={store.id}
              className={`bg-white rounded-3xl p-5 shadow-xl border transition-all flex flex-col justify-between space-y-4 relative ${
                isRejected
                  ? 'border-rose-300 bg-rose-50/25'
                  : isBand 
                    ? 'border-red-300 bg-red-50/30' 
                    : isVisible ? 'border-stone-200/90 hover:border-stone-400' : 'border-amber-200 bg-amber-50/20 opacity-90'
              }`}
            >
              {/* Top Row: Vertical Badge + Marketplace Visibility Switch / Band Badge */}
              <div className="flex items-center justify-between gap-2">
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${verticalBadge.bg}`}>
                  <IconComponent className="w-3 h-3" />
                  <span>{verticalBadge.label}</span>
                </div>

                {isBand ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-600 text-white">
                    <Lock className="w-3 h-3" />
                    <span>{isSuspended ? 'BLOCKED' : 'BAND'}</span>
                  </span>
                ) : isRejected ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white">
                    <AlertTriangle className="w-3 h-3" />
                    <span>REJECTED</span>
                  </span>
                ) : (
                  /* 1-Click Visibility Toggle Button */
                  <button
                    type="button"
                    disabled={isToggling}
                    onClick={() => handleToggleVisibility(store.id, isVisible)}
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border-0 shadow-2xs ${
                      isVisible 
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                        : 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                    }`}
                    title={isVisible ? 'Click to hide from ChuruOne' : 'Click to make live on ChuruOne'}
                  >
                    {isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    <span>{isToggling ? 'Updating...' : (isVisible ? 'LIVE ON CHURUONE' : 'HIDDEN FROM CHURUONE')}</span>
                  </button>
                )}
              </div>

              {/* Rejected Notice with 1-Click Re-approve & Delete */}
              {isRejected && (
                <div className="p-3 bg-rose-100/90 border border-rose-300 rounded-2xl flex items-center justify-between gap-2 text-xs font-bold text-rose-950">
                  <div className="flex items-center gap-1.5 min-w-0 pr-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-700 shrink-0" />
                    <span className="truncate">Rejected: {store.adminNote || store.rejectionReason || 'Application rejected'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      disabled={changingStatusId === store.id}
                      onClick={() => handleUpdateStoreStatus(store.id, 'active')}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs border-0"
                    >
                      {changingStatusId === store.id ? 'Approving...' : '🟢 Re-Approve'}
                    </button>
                    {!isFlagship && (
                      <button
                        type="button"
                        disabled={deletingStoreId === store.id}
                        onClick={() => handleDeleteStore(store.id, store.name)}
                        className="p-1 rounded-lg bg-red-200 hover:bg-red-300 text-red-800 transition-colors cursor-pointer border-0"
                        title="Delete Store"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Band Status Notice with 1-Click Re-activate & Delete */}
              {isBand && (
                <div className="p-3 bg-red-100/90 border border-red-300 rounded-2xl flex items-center justify-between gap-2 text-xs font-bold text-red-950">
                  <div className="flex items-center gap-1.5 min-w-0 pr-1">
                    <Lock className="w-3.5 h-3.5 text-red-700 shrink-0" />
                    <span className="truncate">{isSuspended ? 'Super Admin dwara Blocked' : 'Dukandar dwara Deactivated'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      disabled={changingStatusId === store.id}
                      onClick={() => handleUpdateStoreStatus(store.id, 'active')}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs border-0"
                    >
                      {changingStatusId === store.id ? 'Opening...' : '🟢 Wapas Kholen'}
                    </button>
                    {!isFlagship && (
                      <button
                        type="button"
                        disabled={deletingStoreId === store.id}
                        onClick={() => handleDeleteStore(store.id, store.name)}
                        className="p-1 rounded-lg bg-red-200 hover:bg-red-300 text-red-800 transition-colors cursor-pointer border-0"
                        title="Delete Store"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Store Identity */}
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-base font-black text-stone-900 leading-tight">
                    {store.name}
                  </h4>
                  <span className="text-[10px] font-mono font-bold bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full shrink-0">
                    ID: {store.id}
                  </span>
                </div>

                <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                  {store.category || store.tagline || 'Verified merchant partner in Churu city.'}
                </p>
              </div>

              {/* Operational Metrics & Contact Details */}
              <div className="bg-stone-50 p-3 rounded-2xl space-y-2 border border-stone-100 text-xs text-stone-600">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-stone-400">Products:</span>
                  <span className={`text-[11px] font-bold ${store.itemCount > 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {store.itemCount > 0 ? `📦 ${store.itemCount} items` : '🛠️ Setup in progress (0 items)'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-stone-400">Live Status:</span>
                  <span className={`text-[11px] font-bold ${isBand ? 'text-red-600' : store.isOpen !== false ? 'text-emerald-700' : 'text-red-600'}`}>
                    {isBand ? '🔴 Band' : store.isOpen !== false ? '🟢 Open Now' : '🔴 Closed'}
                  </span>
                </div>
                
                {/* Location Details: Mohalla, Landmark, Radius, GPS */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-stone-400">Allotted Area:</span>
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 truncate max-w-[170px]">
                    🏡 {store.mohalla || store.areaName || 'Churu Area'}
                  </span>
                </div>

                {store.nearestLandmark && (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-stone-400">Landmark:</span>
                    <span className="text-[11px] font-medium text-stone-700 capitalize">
                      {store.nearestLandmark.replace(/_/g, ' ')}
                    </span>
                  </div>
                )}

                {store.lat && store.lng ? (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-emerald-900">GPS Pin:</span>
                    <a
                      href={`https://www.google.com/maps?q=${store.lat},${store.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] font-mono font-bold text-emerald-700 hover:underline inline-flex items-center gap-1"
                      title="View exact shop coordinates on Google Maps"
                    >
                      <Navigation className="w-3 h-3 text-emerald-600" />
                      <span>{store.lat}, {store.lng} ↗</span>
                    </a>
                  </div>
                ) : null}

                {/* Mohalla Specific Delivery Radius & Reward Expansion Control */}
                {isMohalla ? (
                  <div className="flex items-center justify-between pt-1 border-t border-stone-200">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-900">Delivery Radius:</span>
                      <div className="text-[10px] text-stone-400">Reward top dukandar</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                        {store.radiusKm || 1.5} km
                      </span>
                      <button
                        type="button"
                        disabled={updatingRadiusId === store.id || (store.radiusKm || 1.5) <= 0.5}
                        onClick={() => handleUpdateRadius(store.id, -0.5)}
                        className="w-5 h-5 rounded bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs flex items-center justify-center cursor-pointer disabled:opacity-40 border-0"
                        title="Decrease radius"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        disabled={updatingRadiusId === store.id || (store.radiusKm || 1.5) >= 10.0}
                        onClick={() => handleUpdateRadius(store.id, +0.5)}
                        className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] flex items-center justify-center gap-0.5 cursor-pointer shadow-xs border-0 active:scale-95"
                        title="Reward Top Performing Dukandar (+0.5 km radius)"
                      >
                        <span>+0.5km</span>
                        <span>🏆</span>
                      </button>
                    </div>
                  </div>
                ) : isFlagship ? (
                  <div className="flex items-center justify-between pt-1 border-t border-stone-200">
                    <span className="text-[10px] uppercase font-bold text-amber-800">Coverage:</span>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      👑 100% City-Wide (Flagship Exemption)
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-stone-400">Order Promise:</span>
                    <span className="text-[11px] font-mono font-bold text-stone-900">
                      {store.timing || '20-25 mins'}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons: 1-Click Manage in Dukandar OS + View Website + Prominent Permanent Band / Delete */}
              <div className="pt-2 border-t border-stone-100 space-y-2">
                {/* Primary Row: Manage + Open Store Website */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => switchStoreId(store.id)}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer border-0"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Manage in 1-Click</span>
                  </button>

                  <a
                    href={store.destination || `/${store.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-xl border border-stone-200 hover:border-stone-900 text-stone-700 hover:text-stone-900 transition-colors shrink-0"
                    title="Open Store Website"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                {/* Secondary Row: Prominent Super Admin Controls (Permanent Band / Delete) */}
                {!isFlagship && (
                  <div className="flex items-center gap-2 pt-1">
                    {isBand ? (
                      <>
                        <button
                          type="button"
                          disabled={changingStatusId === store.id}
                          onClick={() => handleUpdateStoreStatus(store.id, 'active')}
                          className="flex-1 py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer border-0 disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{changingStatusId === store.id ? 'Opening...' : '🟢 Dukan Wapas Kholen'}</span>
                        </button>
                        <button
                          type="button"
                          disabled={deletingStoreId === store.id}
                          onClick={() => handleDeleteStore(store.id, store.name)}
                          className="py-2 px-3 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer border border-red-300 disabled:opacity-50 shrink-0"
                          title="Permanently Delete Store from Platform"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{deletingStoreId === store.id ? 'Deleting...' : 'Delete'}</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          disabled={changingStatusId === store.id}
                          onClick={() => {
                            if (window.confirm(`Kya aap "${store.name}" (${store.id}) ko PERMANENTLY BAND / BLOCK karna chahte hain? Iska customer access aur dukan login turant ruk jayega aur yeh 'Band Dukanein' me move ho jayegi.`)) {
                              handleUpdateStoreStatus(store.id, 'suspended', 'Blocked by Super Admin from Partner Stores Tab');
                            }
                          }}
                          className="flex-1 py-2 px-3 rounded-xl bg-red-50 hover:bg-red-100 border border-red-300 text-red-700 hover:text-red-900 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
                        >
                          <Lock className="w-3.5 h-3.5 text-red-600" />
                          <span>{changingStatusId === store.id ? 'Band Ho Rahi Hai...' : '🚫 Dukan Permanent Band Karein'}</span>
                        </button>
                        <button
                          type="button"
                          disabled={deletingStoreId === store.id}
                          onClick={() => handleDeleteStore(store.id, store.name)}
                          className="p-2 rounded-xl bg-stone-100 hover:bg-red-100 border border-stone-200 hover:border-red-300 text-stone-500 hover:text-red-700 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                          title="Permanently Delete Store from Platform"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredStores.length === 0 && (
        <div className="bg-white rounded-3xl p-12 text-center border border-stone-200/80 shadow-md space-y-3">
          <Store className="w-10 h-10 text-stone-400 mx-auto" />
          <h4 className="text-base font-bold text-stone-900">Koi Partner Store Nahi Mila</h4>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Aapke search query ke anusaar koi store match nahi hua. Search clear karein ya filters badlein.
          </p>
        </div>
      )}

      {/* 4. MANDATORY APPLICATION REJECTION REASON MODAL */}
      {rejectModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-red-200 relative">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                <h3 className="text-base font-black text-stone-900">Application Rejection & Correction Note</h3>
              </div>
              <button
                type="button"
                onClick={() => setRejectModalApp(null)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-4 space-y-4">
              {/* Applicant Summary */}
              <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900">{rejectModalApp.dukanName || 'Mohalla Dukan'}</span>
                  <span className="font-mono bg-stone-200 text-stone-800 px-2 py-0.5 rounded font-black text-[10px]">
                    {rejectModalApp.dukanId}
                  </span>
                </div>
                <div className="text-stone-600">
                  Owner: {rejectModalApp.ownerName || '-'} • Phone: {rejectModalApp.phone || '-'}
                </div>
                <div className="text-stone-500 text-[11px]">
                  Area: {rejectModalApp.mohallaData?.areaName || rejectModalApp.mohalla || '-'} ({rejectModalApp.mohallaData?.nearestLandmark || rejectModalApp.nearestLandmark || '-'})
                </div>
              </div>

              {/* Standard Reason Dropdown */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  1. Reason Category Chunein (Select Standard Preset):
                </label>
                <select
                  value={selectedReasonPreset}
                  onChange={(e) => {
                    const presetId = e.target.value;
                    setSelectedReasonPreset(presetId);
                    const found = REJECTION_PRESETS.find(p => p.id === presetId);
                    if (found) {
                      setRejectionCustomNote(found.defaultNote);
                    }
                  }}
                  className="w-full text-xs p-2.5 rounded-xl bg-stone-50 border border-stone-300 font-semibold text-stone-900 focus:border-red-500 focus:outline-none cursor-pointer"
                >
                  {REJECTION_PRESETS.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mandatory Rejection Note Textarea */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center justify-between">
                  <span>2. Dukandar Ke Liye Spasht Note / Nirdesh (Mandatory Note):</span>
                  <span className="text-[10px] text-red-600 font-bold">*Required</span>
                </label>
                <textarea
                  rows={4}
                  value={rejectionCustomNote}
                  onChange={(e) => setRejectionCustomNote(e.target.value)}
                  placeholder="Applicant ko spasht likhein ki unhe apni application me kya sudharna hai (e.g. sahi landmark chunein, dukan ka sahi naam darj karein)..."
                  className="w-full text-xs p-3 rounded-2xl bg-stone-50 border border-stone-300 text-stone-900 focus:border-red-500 focus:outline-none resize-none leading-relaxed"
                />
                <div className="text-[10px] text-stone-500 mt-1">
                  ℹ️ Yeh note applicant ke dukandar dashboard me laal alert card ke roop me dikhai dega aur unhe ise sudharne ka button milega.
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setRejectModalApp(null)}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs uppercase cursor-pointer"
              >
                Radd Karein (Cancel)
              </button>
              <button
                type="button"
                disabled={!rejectionCustomNote.trim() || actingAppId === rejectModalApp.dukanId}
                onClick={async () => {
                  if (!rejectionCustomNote.trim()) {
                    showToast('Kripya rejection ka karan spasht likhein!', 'error');
                    return;
                  }
                  await handleReviewApp(
                    rejectModalApp.dukanId,
                    'reject',
                    null,
                    null,
                    null,
                    rejectionCustomNote.trim()
                  );
                  setRejectModalApp(null);
                }}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black text-xs uppercase tracking-wider cursor-pointer shadow-md disabled:opacity-50 flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                <span>Confirm Reject & Send Note</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
