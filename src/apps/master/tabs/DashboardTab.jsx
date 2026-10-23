import React, { useMemo, useState, useEffect } from 'react';
import { useMaster } from '../context/MasterContext';
import { 
  TrendingUp, 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  IndianRupee, 
  Store, 
  Plus, 
  Tag, 
  Users, 
  Building2, 
  ShieldCheck, 
  Lock, 
  Phone, 
  MessageSquare, 
  ExternalLink, 
  AlertTriangle, 
  Copy, 
  Check,
  Flame,
  ThumbsDown,
  BarChart3,
  Calendar,
  RefreshCw,
  Sparkles,
  Layers,
  Eye,
  ArrowUpRight,
  Package,
  ArrowRight
} from 'lucide-react';
import { getImageUrl } from '../../../utils/imageHelper';

export default function DashboardTab() {
  const { 
    orders, 
    menu, 
    deals, 
    customers, 
    franchiseInquiries, 
    setActiveTab, 
    storeInfo, 
    storeId, 
    capabilities, 
    user,
    cityProducts,
    isHistoricalOrdersLoaded,
    isLoadingHistoricalOrders,
    loadHistoricalOrders,
    refreshData,
    updateStoreSettings,
    showToast
  } = useMaster();
  const [copiedId, setCopiedId] = useState(false);

  const handleCopyDukanId = (id) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2200);
    }
  };

  const isApprovedServer = storeInfo?.status === 'active' || storeInfo?.status === 'approved';
  const isPendingReview = !isApprovedServer && (
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

  // If application is pending review, show DUKAN ID CARD, 24-HR REVIEW NOTICE, DETAILS, AND STORE EXPLORER
  if (isPendingReview) {
    const dukanTitle = user?.dukanName || storeInfo?.name || `Dukan ${String(storeId || '').toUpperCase()}`;
    const dukanCode = String(user?.dukanId || storeId || 'DKN').toUpperCase();
    const owner = user?.ownerName || storeInfo?.owner?.name || 'Registered Merchant';
    const father = user?.fatherName || storeInfo?.owner?.fatherName || '-';
    const phone = user?.phone || storeInfo?.owner?.phone || '-';
    const username = user?.username || storeInfo?.owner?.username || '-';
    const bType = String(user?.businessType || storeInfo?.type || storeInfo?.vertical || 'retail');

    return (
      <div className="space-y-6 pb-12 max-w-5xl mx-auto">
        
        {/* 1. Permanent Dukan ID Card with Copy Button */}
        <div className="p-6 sm:p-8 bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white rounded-3xl shadow-xl relative overflow-hidden">
          <div className="absolute right-4 top-4 opacity-10 pointer-events-none">
            <Lock className="w-36 h-36" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-mono tracking-widest uppercase bg-black/30 px-3 py-1 rounded-full font-bold">
                PERMANENT & SECURE DUKAN ID
              </span>
              <span className="flex items-center gap-1.5 text-xs font-bold bg-white/20 px-3 py-1 rounded-full">
                <Lock className="w-3.5 h-3.5" /> Under Technical Review
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 my-3">
              <div>
                <div className="text-3xl sm:text-5xl font-mono font-black tracking-wider text-white drop-shadow-sm">
                  {dukanCode}
                </div>
                <div className="text-xs text-amber-100 font-semibold mt-1">
                  Store: {dukanTitle} • Category: {bType.toUpperCase()}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleCopyDukanId(dukanCode)}
                className="px-4 py-2.5 bg-white text-zinc-950 rounded-2xl text-xs font-extrabold flex items-center gap-2 shadow-md hover:bg-zinc-100 transition-all cursor-pointer active:scale-95 shrink-0"
              >
                {copiedId ? <Check className="w-4 h-4 text-emerald-600 stroke-[3]" /> : <Copy className="w-4 h-4" />}
                <span>{copiedId ? 'ID Copied!' : 'Copy Dukan ID'}</span>
              </button>
            </div>

            <p className="text-xs text-amber-100/95 leading-relaxed font-medium mt-3 bg-black/20 p-3.5 rounded-2xl border border-white/10">
              ⚠️ <strong>Unforgettable ID Warning:</strong> Yeh aapki dukan ki permanent aur secure Master ID hai. Isko sambhal kar rakhein kyunki website linking, staff access aur dashboard login isi ID se hogi. Is ID ko anjaan vyakti ke saath share na karein.
            </p>
          </div>
        </div>

        {/* 2. 24-Hour Review Notice Box */}
        <div className="p-5 sm:p-6 bg-amber-50 border-2 border-amber-300 rounded-3xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="inline-block bg-amber-200 text-amber-950 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider mb-1">
                24-Hour Activation Timeline
              </div>
              <h3 className="text-lg font-black text-zinc-950">
                Aapki Application Review Ho Rahi Hai
              </h3>
              <p className="text-xs text-zinc-700 mt-1 max-w-xl leading-relaxed">
                Hum 24 ghante ke andar aapse contact karenge aur aapki website banakar aapko denge. Kripya wait karein. Website activate hote hi aapka pura portal unlock ho jayega aur aap online orders accept kar sakenge.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
            <a
              href={`https://wa.me/917023963189?text=Namaste%20ChuruOne%20Team%2C%20meri%20dukan%20application%20ID%20${dukanCode}%20ka%20status%20bataiye`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 md:flex-none px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp Helpline</span>
            </a>
            <a
              href="tel:7023963189"
              className="px-4 py-2.5 bg-zinc-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <Phone className="w-4 h-4" />
              <span>Call Team</span>
            </a>
          </div>
        </div>

        {/* 3. Submitted Merchant Profile Grid */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-zinc-200">
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-2">
            <Store className="w-4 h-4 text-zinc-600" />
            <span>Aapki Registered Dukan Ki Jankari</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200">
              <span className="text-zinc-400 font-semibold uppercase text-[10px] block mb-1">Dukan Code</span>
              <span className="text-sm font-mono font-black text-zinc-900">{dukanCode}</span>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200">
              <span className="text-zinc-400 font-semibold uppercase text-[10px] block mb-1">Dukan Ka Naam</span>
              <span className="text-sm font-bold text-zinc-900">{dukanTitle}</span>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200">
              <span className="text-zinc-400 font-semibold uppercase text-[10px] block mb-1">Category / Vertical</span>
              <span className="text-sm font-bold text-zinc-900 capitalize">{bType}</span>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200">
              <span className="text-zinc-400 font-semibold uppercase text-[10px] block mb-1">Dukandar Ka Naam</span>
              <span className="text-sm font-bold text-zinc-900">{owner}</span>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200">
              <span className="text-zinc-400 font-semibold uppercase text-[10px] block mb-1">Pita Ka Naam</span>
              <span className="text-sm font-bold text-zinc-900">{father}</span>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200">
              <span className="text-zinc-400 font-semibold uppercase text-[10px] block mb-1">Registered Mobile</span>
              <div className="flex items-center gap-1.5 text-sm font-bold text-zinc-900">
                <span>+91 {phone}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200">
              <span className="text-zinc-400 font-semibold uppercase text-[10px] block mb-1">Merchant Username</span>
              <span className="text-sm font-mono font-bold text-zinc-900">@{username}</span>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200">
              <span className="text-zinc-400 font-semibold uppercase text-[10px] block mb-1">Digital Contract Status</span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Signed & E-Verified
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200">
              <span className="text-zinc-400 font-semibold uppercase text-[10px] block mb-1">Portal Security</span>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> 100% Isolated Tenant
              </span>
            </div>
          </div>
        </div>

        {/* 4. 4-Stage Store Launch Roadmap */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-zinc-200">
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-6 flex items-center gap-2">
            <Clock className="w-4 h-4 text-zinc-600" />
            <span>Website Launch Progress</span>
          </h3>

          <div className="space-y-4">
            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950">
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                ✓
              </div>
              <div>
                <h4 className="font-bold text-xs text-emerald-950">Stage 1: Registration & Agreement Submission</h4>
                <p className="text-[11px] text-emerald-800 mt-0.5">Aapne dukan details submit ki aur digital agreement OTP verify kiya.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950">
              <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0 animate-pulse">
                2
              </div>
              <div>
                <h4 className="font-bold text-xs text-amber-950">Stage 2: Technical Review & Store Architecture (In Progress)</h4>
                <p className="text-[11px] text-amber-800 mt-0.5">ChuruOne technical team aapki category ({bType}) ke anusar data containers setup kar rahi hai.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-500">
              <div className="w-7 h-7 rounded-full bg-zinc-300 text-zinc-600 flex items-center justify-center font-bold text-xs shrink-0">
                <Lock className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-zinc-700">Stage 3: Custom Website Coding & Domain Linking</h4>
                <p className="text-[11px] text-zinc-500 mt-0.5">Shawarma Nights aur Skyline Outfits ki tarah aapki dukan ki custom frontend website banayi jayegi.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-500">
              <div className="w-7 h-7 rounded-full bg-zinc-300 text-zinc-600 flex items-center justify-center font-bold text-xs shrink-0">
                <Lock className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-zinc-700">Stage 4: Master OS Full Control Unlock</h4>
                <p className="text-[11px] text-zinc-500 mt-0.5">Website complete hote hi aapka catalog edit, orders, coupons, aur payments setting yahin unlock ho jayenge.</p>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Live Store Previews & Platform Feed */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-zinc-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-base font-black text-zinc-950 flex items-center gap-2">
                <span>🌐 ChuruOne Live Partner Stores & Feed</span>
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Aapki website banne ke dauran, aap ChuruOne ke baki live stores aur city feed explore kar sakte hain:
              </p>
            </div>
            <a
              href="/explore"
              className="px-3.5 py-1.5 bg-zinc-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5"
            >
              <span>Explore All Feed</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Store 1: Skyline Outfits */}
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 hover:border-zinc-400 transition-all flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase bg-zinc-200 text-zinc-800 px-2 py-0.5 rounded-full font-bold">
                  Fashion & Footwear
                </span>
                <h4 className="font-extrabold text-sm text-zinc-900 mt-2">Skyline Premium Outfits</h4>
                <p className="text-xs text-zinc-500 mt-1">
                  Luxury menswear, bespoke apparel, size selector aur automated checkout.
                </p>
              </div>
              <a
                href="/skyline"
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white border border-zinc-300 text-zinc-900 hover:bg-zinc-100 text-xs font-bold transition-all shadow-2xs"
              >
                <span>View Store Website</span>
                <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
              </a>
            </div>

            {/* Store 2: Shawarma Nights */}
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 hover:border-zinc-400 transition-all flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-bold">
                  Food & Dining
                </span>
                <h4 className="font-extrabold text-sm text-zinc-900 mt-2">Shawarma Nights Flagship</h4>
                <p className="text-xs text-zinc-500 mt-1">
                  Live menu, addon customize modal, thermal KOT receipt generator aur live GPS tracking.
                </p>
              </div>
              <a
                href="/shawarma"
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white border border-zinc-300 text-zinc-900 hover:bg-zinc-100 text-xs font-bold transition-all shadow-2xs"
              >
                <span>View Store Website</span>
                <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
              </a>
            </div>

            {/* Store 3: Nash Studio */}
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 hover:border-zinc-400 transition-all flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                  Salon & Services
                </span>
                <h4 className="font-extrabold text-sm text-zinc-900 mt-2">Nash Studio Salon</h4>
                <p className="text-xs text-zinc-500 mt-1">
                  Online appointment scheduling, slot booking, stylist assignment aur advance token payment.
                </p>
              </div>
              <a
                href="/nash"
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white border border-zinc-300 text-zinc-900 hover:bg-zinc-100 text-xs font-bold transition-all shadow-2xs"
              >
                <span>View Store Website</span>
                <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
              </a>
            </div>
          </div>
        </div>

        {/* Security & Isolation Notice */}
        <div className="p-5 rounded-2xl bg-zinc-900 text-white flex items-start gap-3.5 shadow-lg">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed text-zinc-300">
            <span className="font-bold text-white block mb-1">Strict Multi-Tenant Security Guaranteed:</span>
            Aapki dukan ka portal 100% isolated hai. Kisi dusre dukandar ka data aapke portal par kabhi nahi aayega, aur na hi koi dusra aapka data dekh sakta hai. Jab tak technical review poora hokar website approve nahi hoti, catalog aur settings edit features locked rahenge.
          </div>
        </div>
      </div>
    );
  }

  const isMarketplace = storeId === 'churuone' || capabilities?.storeType === 'marketplace' || capabilities?.vertical === 'marketplace';
  const isSalon = !isMarketplace && (capabilities?.orders?.hasAppointments ?? (storeInfo?.vertical === 'salon' || (storeId || '').includes('nash')));
  const isFashion = !isMarketplace && (capabilities?.catalog?.hasSizes ?? (storeInfo?.vertical === 'fashion' || (storeId || '').includes('skyline')));
  const hasAppointments = !isMarketplace && (capabilities?.orders?.hasAppointments ?? isSalon);
  const hasFranchise = !isMarketplace && (capabilities?.settings?.hasFranchise ?? (!isSalon));
  const showOffers = !isMarketplace && storeInfo?.settings?.showOfferCards !== false && (!hasAppointments || storeInfo?.settings?.dealsEnabled === true);

  const storeDisplayName = storeInfo?.name || storeInfo?.storeName || storeInfo?.studioName || (isMarketplace ? 'ChuruOne Platform & Marketplace' : isSalon ? 'Nash Studio' : isFashion ? 'Skyline Outfits' : 'Shawarma Nights');
  const orderNoun = hasAppointments ? 'Booking' : isMarketplace ? 'City Order' : 'Order';
  const orderNounPlural = hasAppointments ? 'Bookings' : isMarketplace ? 'City Orders' : 'Orders';
  const itemNoun = capabilities?.catalog?.itemNoun || (hasAppointments ? 'Service' : isFashion ? 'Product' : isMarketplace ? 'Partner Store' : 'Dish');
  const itemNounPlural = capabilities?.catalog?.itemNounPlural || (hasAppointments ? 'Services' : isFashion ? 'Products' : isMarketplace ? 'Partner Stores' : 'Dishes');

  // ─── SUPER ADMIN: MARKETPLACE EXECUTIVE ANALYTICS ───
  const marketplaceAnalytics = useMemo(() => {
    if (!isMarketplace) return null;
    const list = Array.isArray(orders) ? orders : [];
    const validOrders = list.filter(o => o.status !== 'cancelled' && o.status !== 'rejected');

    const churuoneOrders = validOrders.filter(o => o.channel === 'churuone' || o.fromChuruOne === true);
    const storefrontOrders = validOrders.filter(o => o.channel !== 'churuone' && !o.fromChuruOne);

    const churuoneRevenue = churuoneOrders.reduce((sum, o) => sum + (Number(o.total || o.grandTotal || o.totalPrice) || 0), 0);
    const storefrontRevenue = storefrontOrders.reduce((sum, o) => sum + (Number(o.total || o.grandTotal || o.totalPrice) || 0), 0);
    const totalRevenue = churuoneRevenue + storefrontRevenue;

    // Time-of-day slots for ChuruOne orders
    const timeSlots = [
      { key: 'morning', label: 'Morning', hours: '6 AM - 12 PM', count: 0, revenue: 0, color: 'text-amber-500', bg: 'bg-amber-50 border-amber-200' },
      { key: 'afternoon', label: 'Afternoon', hours: '12 PM - 5 PM', count: 0, revenue: 0, color: 'text-orange-500', bg: 'bg-orange-50 border-orange-200' },
      { key: 'evening', label: 'Evening', hours: '5 PM - 9 PM', count: 0, revenue: 0, color: 'text-indigo-500', bg: 'bg-indigo-50 border-indigo-200' },
      { key: 'night', label: 'Late Night', hours: '9 PM - 4 AM', count: 0, revenue: 0, color: 'text-purple-500', bg: 'bg-purple-50 border-purple-200' }
    ];

    churuoneOrders.forEach(o => {
      const d = o.createdAt || o.placedAt || o.timestamp ? new Date(o.createdAt || o.placedAt || o.timestamp) : new Date();
      const h = d.getHours();
      const rev = Number(o.total || o.grandTotal || o.totalPrice) || 0;

      if (h >= 6 && h < 12) {
        timeSlots[0].count += 1;
        timeSlots[0].revenue += rev;
      } else if (h >= 12 && h < 17) {
        timeSlots[1].count += 1;
        timeSlots[1].revenue += rev;
      } else if (h >= 17 && h < 21) {
        timeSlots[2].count += 1;
        timeSlots[2].revenue += rev;
      } else {
        timeSlots[3].count += 1;
        timeSlots[3].revenue += rev;
      }
    });

    // Store breakdown
    const storeMap = {
      shawarma: { name: 'Shawarma Nights', vertical: 'food', badge: '🌯 Food Delivery', directOrders: 0, directRev: 0, churuoneOrders: 0, churuoneRev: 0 },
      skyline: { name: 'Skyline Premium Outfits', vertical: 'fashion', badge: '👔 Fashion & Footwear', directOrders: 0, directRev: 0, churuoneOrders: 0, churuoneRev: 0 },
      'nash-studio': { name: 'Nash Studio', vertical: 'salon', badge: '✂️ Salon & Grooming', directOrders: 0, directRev: 0, churuoneOrders: 0, churuoneRev: 0 }
    };

    validOrders.forEach(o => {
      const sId = o.storeId || 'shawarma';
      if (!storeMap[sId]) {
        storeMap[sId] = { name: o.storeName || sId, vertical: 'general', badge: '🏬 Partner Store', directOrders: 0, directRev: 0, churuoneOrders: 0, churuoneRev: 0 };
      }
      const rev = Number(o.total || o.grandTotal || o.totalPrice) || 0;
      if (o.channel === 'churuone' || o.fromChuruOne === true) {
        storeMap[sId].churuoneOrders += 1;
        storeMap[sId].churuoneRev += rev;
      } else {
        storeMap[sId].directOrders += 1;
        storeMap[sId].directRev += rev;
      }
    });

    // Product frequency and sales calculation
    const salesMap = new Map();
    validOrders.forEach(o => {
      if (Array.isArray(o.items)) {
        o.items.forEach(it => {
          const key = it.id || it.name;
          const current = salesMap.get(key) || {
            id: key,
            name: it.name,
            storeId: o.storeId,
            storeName: o.storeName,
            units: 0,
            revenue: 0,
            image: it.image
          };
          const qty = Number(it.quantity || it.qty || 1);
          const price = Number(it.price || 0);
          current.units += qty;
          current.revenue += (price * qty);
          salesMap.set(key, current);
        });
      }
    });

    const orderedProducts = Array.from(salesMap.values()).sort((a, b) => b.units - a.units);
    const topProducts = orderedProducts.slice(0, 5);

    // Identify Slow / "Bekr" (low velocity or 0 sales) products from catalog
    const allKnown = (cityProducts && cityProducts.length > 0) ? cityProducts : [];
    const slowProducts = allKnown
      .map(p => {
        const stats = salesMap.get(p.id) || salesMap.get(p.name);
        return {
          id: p.id,
          name: p.name,
          storeId: p.storeId,
          storeName: p.storeName,
          category: p.category,
          price: p.price,
          image: p.image || p.img,
          units: stats?.units || 0,
          revenue: stats?.revenue || 0
        };
      })
      .sort((a, b) => a.units - b.units)
      .slice(0, 5);

    return {
      churuoneOrdersCount: churuoneOrders.length,
      churuoneRevenue,
      storefrontOrdersCount: storefrontOrders.length,
      storefrontRevenue,
      totalRevenue,
      totalOrdersCount: validOrders.length,
      timeSlots,
      stores: Object.entries(storeMap).map(([id, d]) => ({ id, ...d })),
      topProducts,
      slowProducts
    };
  }, [isMarketplace, orders, cityProducts]);

  // Metrics calculation for normal stores
  const metrics = useMemo(() => {
    const list = Array.isArray(orders) ? orders : [];
    const totalOrders = list.length;
    
    // Revenue sum from non-cancelled orders
    const totalRevenue = list
      .filter(o => o.status !== 'cancelled' && o.status !== 'rejected')
      .reduce((sum, o) => sum + (Number(o.total || o.grandTotal || o.totalPrice) || 0), 0);

    const activeOrders = list.filter(o => 
      ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'payment_pending', 'in_chair', 'booked'].includes(o.status)
    ).length;

    const deliveredOrders = list.filter(o => o.status === 'delivered' || o.status === 'completed').length;
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / (deliveredOrders || totalOrders || 1)) : 0;

    return { totalOrders, totalRevenue, activeOrders, deliveredOrders, avgOrderValue };
  }, [orders]);

  // Recent 6 orders
  const recentOrders = useMemo(() => {
    const list = Array.isArray(orders) ? [...orders] : [];
    return list.slice(0, 6);
  }, [orders]);

  // ─── IF MARKETPLACE (CHURUONE SUPER ADMIN), RENDER PLATFORM COMMAND CENTER ───
  if (isMarketplace && marketplaceAnalytics) {
    const ma = marketplaceAnalytics;
    return (
      <div className="space-y-6 pb-16 max-w-7xl mx-auto font-sans">
        
        {/* Top Header Card */}
        <div className="bg-gradient-to-r from-stone-900 via-zinc-900 to-black text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-gradient-to-l from-amber-500/20 to-transparent pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400 text-stone-950 text-xs font-black uppercase tracking-wider shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Super Admin Central Terminal</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                CHURUONE PLATFORM & ECOSYSTEM DASHBOARD
              </h2>
              <p className="text-xs sm:text-sm text-stone-300 max-w-2xl leading-relaxed">
                Platform-wide sales metrics, time-of-day orders velocity, dukan-wise cross-channel performance, aur catalog insights.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => refreshData()}
                className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/20 active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Sync</span>
              </button>

              {!isHistoricalOrdersLoaded ? (
                <button
                  onClick={() => loadHistoricalOrders()}
                  disabled={isLoadingHistoricalOrders}
                  className="px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95"
                >
                  {isLoadingHistoricalOrders ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                  <span>Load All Archive</span>
                </button>
              ) : (
                <span className="px-4 py-2.5 rounded-2xl bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                  ✓ Full Archive
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 1. SALES VIA CHURUONE VS TOTAL ECOSYSTEM SALES (DUAL COMMAND TILES) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          
          {/* Card A: Sales Via ChuruOne Marketplace Page */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xl border-2 border-amber-200/80 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono tracking-widest uppercase bg-amber-100 text-amber-950 px-3 py-1 rounded-full font-black">
                  👑 CHURUONE MARKETPLACE SALES
                </span>
                <span className="text-xs font-bold text-zinc-400">
                  churu.one feed checkout
                </span>
              </div>

              <div className="flex items-baseline gap-3 my-2">
                <span className="text-3xl sm:text-4xl font-black text-zinc-950">
                  ₹{ma.churuoneRevenue.toLocaleString()}
                </span>
                <span className="text-sm font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full">
                  {ma.churuoneOrdersCount} orders placed
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Gross sales generated directly through ChuruOne marketplace checkout.
              </p>
            </div>

            {/* Time of Day Velocity Breakdown */}
            <div className="pt-4 border-t border-zinc-100 space-y-3">
              <span className="text-[11px] font-black text-zinc-400 uppercase tracking-wider block">
                🕒 Time-of-Day Order Velocity (Din me kis time orders aa rahe hain)
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {ma.timeSlots.map((slot) => (
                  <div key={slot.key} className={`p-3 rounded-2xl border ${slot.bg} text-center`}>
                    <span className="text-[10px] font-bold text-zinc-500 block">{slot.label}</span>
                    <span className="text-[9px] text-zinc-400 block mb-1">{slot.hours}</span>
                    <span className="text-lg font-black text-zinc-900 block">{slot.count}</span>
                    <span className="text-[10px] font-bold text-zinc-600 block">₹{slot.revenue}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card B: Total Platform Ecosystem Gross Sales */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xl border border-zinc-200 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono tracking-widest uppercase bg-emerald-100 text-emerald-950 px-3 py-1 rounded-full font-black">
                  🌐 TOTAL ECOSYSTEM PLATFORM SALES
                </span>
                <span className="text-xs font-bold text-zinc-400">
                  ChuruOne + All Direct Storefronts
                </span>
              </div>

              <div className="flex items-baseline gap-3 my-2">
                <span className="text-3xl sm:text-4xl font-black text-zinc-950">
                  ₹{ma.totalRevenue.toLocaleString()}
                </span>
                <span className="text-sm font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                  {ma.totalOrdersCount} total platform orders
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Combined gross transaction volume across Shawarma Nights, Skyline Outfits, Nash Studio, and ChuruOne.
              </p>
            </div>

            {/* Direct vs ChuruOne Ratio */}
            <div className="pt-4 border-t border-zinc-100 space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-amber-800">👑 ChuruOne: ₹{ma.churuoneRevenue.toLocaleString()} ({ma.totalRevenue > 0 ? Math.round((ma.churuoneRevenue / ma.totalRevenue) * 100) : 0}%)</span>
                <span className="text-zinc-600">🏬 Direct Stores: ₹{ma.storefrontRevenue.toLocaleString()} ({ma.totalRevenue > 0 ? Math.round((ma.storefrontRevenue / ma.totalRevenue) * 100) : 0}%)</span>
              </div>

              <div className="w-full bg-zinc-100 h-3 rounded-full overflow-hidden flex">
                <div 
                  className="bg-amber-400 h-full transition-all" 
                  style={{ width: `${ma.totalRevenue > 0 ? Math.round((ma.churuoneRevenue / ma.totalRevenue) * 100) : 0}%` }}
                />
                <div 
                  className="bg-zinc-800 h-full transition-all" 
                  style={{ width: `${ma.totalRevenue > 0 ? Math.round((ma.storefrontRevenue / ma.totalRevenue) * 100) : 100}%` }}
                />
              </div>
            </div>
          </div>

        </div>

        {/* 2. DUKAN-WISE SALES CLASSIFICATION */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border-0 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-black text-zinc-900 flex items-center gap-2">
                <Store className="w-5 h-5 text-amber-500" />
                <span>Dukan-Wise Sales Classification</span>
              </h3>
              <p className="text-xs text-zinc-500">
                Har dukan ki direct storefront sales vs ChuruOne page ke through aane wali sales ka alag-alag hisab.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Partner Store</th>
                  <th className="py-3 px-4">Direct Storefront Sales</th>
                  <th className="py-3 px-4">ChuruOne Page Sales</th>
                  <th className="py-3 px-4">Total Combined Sales</th>
                  <th className="py-3 px-4">Share of Platform</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-medium">
                {ma.stores.map((st) => {
                  const combinedRev = st.directRev + st.churuoneRev;
                  const combinedOrders = st.directOrders + st.churuoneOrders;
                  const sharePct = ma.totalRevenue > 0 ? Math.round((combinedRev / ma.totalRevenue) * 100) : 0;

                  return (
                    <tr key={st.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="py-4 px-4 font-black text-zinc-900">
                        <div className="text-sm font-black">{st.name}</div>
                        <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">{st.badge}</div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-bold text-zinc-900 text-sm">₹{st.directRev.toLocaleString()}</div>
                        <div className="text-[11px] text-zinc-500">{st.directOrders} direct orders</div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-black text-amber-800 text-sm">₹{st.churuoneRev.toLocaleString()}</div>
                        <div className="text-[11px] text-amber-900">{st.churuoneOrders} ChuruOne orders</div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-black text-emerald-700 text-base">₹{combinedRev.toLocaleString()}</div>
                        <div className="text-[11px] text-zinc-500">{combinedOrders} total orders</div>
                      </td>

                      <td className="py-4 px-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-black bg-zinc-100 text-zinc-800">
                          {sharePct}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. PRODUCT ANALYTICS: TOP BESTSELLERS VS TOP "BEKR" (SLOWEST) PRODUCTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          
          {/* Left: Top Best-Selling Products */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xl border-0 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-zinc-900 flex items-center gap-2">
                  <Flame className="w-5 h-5 text-red-500" />
                  <span>Top Best-Selling Products</span>
                </h3>
                <p className="text-xs text-zinc-500">Sabse zyada bikne wale items aur unki demand</p>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-red-50 text-red-700 px-2.5 py-1 rounded-full">
                🔥 Hot Demand
              </span>
            </div>

            {ma.topProducts.length === 0 ? (
              <div className="py-8 text-center text-zinc-400 text-xs">
                Abhi koi product sales record nahi hai.
              </div>
            ) : (
              <div className="space-y-2.5 pt-1">
                {ma.topProducts.map((p, idx) => (
                  <div key={p.id || idx} className="p-3.5 rounded-2xl bg-[#FFFBF7] flex items-center justify-between gap-3 border border-zinc-100">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-black shrink-0">
                        {idx + 1}
                      </span>
                      <div>
                        <h4 className="text-xs font-black text-zinc-900 line-clamp-1">{p.name}</h4>
                        <span className="text-[10px] text-zinc-500 capitalize">{p.storeName || p.storeId}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-emerald-700 block">{p.units} units sold</span>
                      <span className="text-[11px] font-bold text-zinc-600">₹{p.revenue.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Top "Bekr" / Slowest Selling Products */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xl border-0 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-zinc-900 flex items-center gap-2">
                  <ThumbsDown className="w-5 h-5 text-zinc-400" />
                  <span>Slowest / "Top Bekr" Products</span>
                </h3>
                <p className="text-xs text-zinc-500">Dukandaro dwara listed items jin par orders nahi aa rahe</p>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-zinc-100 text-zinc-600 px-2.5 py-1 rounded-full">
                Needs Attention
              </span>
            </div>

            {ma.slowProducts.length === 0 ? (
              <div className="py-8 text-center text-zinc-400 text-xs">
                Sabhi products acchi tarah sell ho rahe hain.
              </div>
            ) : (
              <div className="space-y-2.5 pt-1">
                {ma.slowProducts.map((p, idx) => (
                  <div key={p.id || idx} className="p-3.5 rounded-2xl bg-zinc-50 flex items-center justify-between gap-3 border border-zinc-200">
                    <div>
                      <h4 className="text-xs font-black text-zinc-900 line-clamp-1">{p.name}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-zinc-500 capitalize">{p.storeName || p.storeId}</span>
                        <span className="text-[10px] font-bold text-zinc-700">• ₹{p.price}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md inline-block mb-1">
                        {p.units} sold (0 velocity)
                      </span>
                      <button
                        onClick={() => setActiveTab(3)}
                        className="text-[10px] font-black text-amber-800 hover:underline block cursor-pointer"
                      >
                        Create Promo Offer →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner / Store State */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-0">
        <div>
          <div className="inline-block bg-zinc-900 text-white px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm mb-2">
            {isMarketplace ? 'SUPER ADMIN TERMINAL' : 'TERMINAL ACTIVE'}
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 leading-tight">
            {storeDisplayName}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            {isMarketplace 
              ? 'Central Multi-Store Command Hub • Live City Network Status' 
              : hasAppointments 
                ? 'Salon Appointments & Client Operations' 
                : isFashion 
                  ? 'Bespoke Apparel & Footwear Operations' 
                  : 'Realtime Dukan Terminal • ChuruOne Universal Backend Connected'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab(1)}
            className={`px-5 py-3 rounded-full ${isSalon ? 'bg-zinc-900 hover:bg-black text-[#d4af37]' : 'bg-[#DC2626] hover:bg-red-700 text-white'} text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg hover:shadow-xl cursor-pointer active:scale-95 border-0`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Manage {orderNounPlural} ({metrics.activeOrders})</span>
          </button>
        </div>
      </div>

      {/* Onboarding & Setup Progress Wizard Card (shown when store is approved but not yet live) */}
      {(!storeInfo?.marketplaceVisible || !storeInfo?.isSetupComplete) && !isMarketplace && (
        <div className="bg-gradient-to-br from-emerald-900 via-stone-900 to-black text-white rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-emerald-500/30 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 uppercase tracking-wider">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Application Approved by Admin
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white mt-2">
                  Apni Dukan Setup Karein & ChuruOne Par Live Aayein!
                </h3>
                <p className="text-xs sm:text-sm text-stone-300 mt-1 max-w-2xl leading-relaxed">
                  Super Admin ne aapki dukan approve kar di hai. Marketplace par customers ko dukan dikhane se pehle bas yeh aasan steps poore karein:
                </p>
              </div>

              {/* Status Badge */}
              <div className="px-4 py-2 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-2 shrink-0">
                <Clock className="w-4 h-4 animate-pulse" />
                <span>Setup in Progress (Dukan Abhi Hidden Hai)</span>
              </div>
            </div>

            {/* 3 Step Setup Checklist */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              
              {/* Step 1: Catalog / Inventory */}
              <div className={`p-4 rounded-2xl border transition-all ${
                (menu?.length || 0) > 0 
                  ? 'bg-emerald-950/40 border-emerald-500/40' 
                  : 'bg-white/5 border-white/10'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-stone-400">STEP 1</span>
                  {(menu?.length || 0) > 0 ? (
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500 text-black">
                      Done ({menu.length} Items)
                    </span>
                  ) : (
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-300">
                      Baki Hai
                    </span>
                  )}
                </div>
                <h4 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-emerald-400" />
                  <span>Products Add Karein</span>
                </h4>
                <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                  Master Smart Inventory se 1-Click mein daily needs items dukan me dalein.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab(2)}
                  className="mt-3 w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>{(menu?.length || 0) > 0 ? 'Edit Products' : '+ Add Products'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Step 2: Pricing & Timing */}
              <div className="p-4 rounded-2xl border bg-white/5 border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-stone-400">STEP 2</span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-stone-700 text-stone-300">
                    Optional / Auto
                  </span>
                </div>
                <h4 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-amber-400" />
                  <span>Price & Timing Check</span>
                </h4>
                <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                  Apni selling price ya discount verify karein. Default market rate set hai.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab(2)}
                  className="mt-3 w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Review Rates</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Step 3: Go Live Button */}
              <div className="p-4 rounded-2xl border bg-emerald-500/10 border-emerald-500/40 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-emerald-400">FINAL STEP</span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500 text-black">
                      Ready
                    </span>
                  </div>
                  <h4 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>ChuruOne Par Live Karein</span>
                  </h4>
                  <p className="text-xs text-stone-300 mt-1 leading-relaxed">
                    Customers ko dukan show karne ke liye button dabayein.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    if ((menu?.length || 0) === 0) {
                      if (!window.confirm('Aapki dukan me abhi koi product add nahi hai. Kya aap bina product ke dukan live karna chahte hain? Hum recommend karte hain pehle Smart Inventory se items add karein.')) {
                        setActiveTab(2);
                        return;
                      }
                    }
                    await updateStoreSettings({
                      marketplaceVisible: true,
                      isOpen: true,
                      isSetupComplete: true
                    });
                    showToast('🎉 Badhaai ho! Aapki dukan ChuruOne marketplace par LIVE ho chuki hai!', 'success');
                  }}
                  className="mt-3 w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-500 text-black text-xs font-black shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Sparkles className="w-4 h-4 text-black" />
                  <span>🚀 Dukan Live Karein (Go Live)</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Live Store Status Ribbon (shown when store is already live) */}
      {storeInfo?.marketplaceVisible && !isMarketplace && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-600" />
            </span>
            <span className="font-extrabold text-emerald-950">Aapki Dukan ChuruOne Marketplace Par LIVE Hai</span>
            <span className="text-emerald-700 hidden sm:inline">• Allotted Mohalle ke customers aapka saman order kar sakte hain</span>
          </div>
          <button
            type="button"
            onClick={async () => {
              await updateStoreSettings({ marketplaceVisible: false });
              showToast('Dukan marketplace par pause kar di gayi hai.', 'info');
            }}
            className="px-3.5 py-1.5 bg-white hover:bg-stone-100 border border-stone-300 rounded-xl text-xs font-bold text-stone-700 cursor-pointer shadow-2xs"
          >
            Pause Store (Go Offline)
          </button>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Stat 1: Total Revenue */}
        <div className="bg-white rounded-2xl p-5 shadow-lg border-0 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[11px] font-black text-zinc-500 uppercase tracking-wider">Gross Sales</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <IndianRupee className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-zinc-900">
            ₹{metrics.totalRevenue.toLocaleString()}
          </div>
          <div className="text-[11px] text-zinc-500 mt-2 flex items-center gap-1 font-medium">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>All recorded {orderNounPlural.toLowerCase()}</span>
          </div>
        </div>

        {/* Stat 2: Active Orders / Bookings */}
        <div className="bg-white rounded-2xl p-5 shadow-lg border-0 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[11px] font-black text-zinc-500 uppercase tracking-wider">Active Queue</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600">
            {metrics.activeOrders}
          </div>
          <div className="text-[11px] text-zinc-500 mt-2 font-medium">
            {hasAppointments ? 'Upcoming / In-Chair' : 'Pending or in-kitchen'}
          </div>
        </div>

        {/* Stat 3: Total Orders / Bookings */}
        <div className="bg-white rounded-2xl p-5 shadow-lg border-0 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[11px] font-black text-zinc-500 uppercase tracking-wider">Total {orderNounPlural}</span>
            <div className={`w-8 h-8 rounded-xl ${isSalon ? 'bg-zinc-100 text-[#d4af37]' : 'bg-red-50 text-[#DC2626]'} flex items-center justify-center`}>
              <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-zinc-900">
            {metrics.totalOrders}
          </div>
          <div className="text-[11px] text-zinc-500 mt-2 font-medium">
            {metrics.deliveredOrders} {hasAppointments ? 'completed successfully' : 'delivered successfully'}
          </div>
        </div>

        {/* Stat 4: Average Ticket (AOV) */}
        <div className="bg-white rounded-2xl p-5 shadow-lg border-0 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[11px] font-black text-zinc-500 uppercase tracking-wider">Avg {orderNoun}</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-zinc-900">
            ₹{metrics.avgOrderValue}
          </div>
          <div className="text-[11px] text-zinc-500 mt-2 font-medium">
            Calculated per {orderNoun.toLowerCase()}
          </div>
        </div>

      </div>

      {/* Quick Action Shortcuts */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">
          Quick Dukandar Shortcuts
        </h3>
        <div className={`grid grid-cols-2 ${hasFranchise && showOffers ? 'sm:grid-cols-4' : 'sm:grid-cols-3'} gap-3`}>
          <button
            onClick={() => setActiveTab(2)}
            className="p-4 rounded-2xl bg-white shadow-md hover:shadow-xl text-left transition-all cursor-pointer border-0 group active:scale-95"
          >
            <div className={`w-9 h-9 rounded-xl ${isSalon ? 'bg-amber-50 text-[#d4af37]' : 'bg-red-50 text-[#DC2626]'} flex items-center justify-center mb-2.5`}>
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div className="text-xs font-black text-zinc-900">Add {itemNoun}</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">{menu?.length || 0} {itemNounPlural.toLowerCase()} live</div>
          </button>

          {showOffers && (
            <button
              onClick={() => setActiveTab(3)}
              className="p-4 rounded-2xl bg-white shadow-md hover:shadow-xl text-left transition-all cursor-pointer border-0 group active:scale-95"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2.5">
                <Tag className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div className="text-xs font-black text-zinc-900">Manage Deals</div>
              <div className="text-[11px] text-zinc-500 mt-0.5">{deals?.length || 0} active coupons</div>
            </button>
          )}

          <button
            onClick={() => setActiveTab(4)}
            className="p-4 rounded-2xl bg-white shadow-md hover:shadow-xl text-left transition-all cursor-pointer border-0 group active:scale-95"
          >
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-2.5">
              <Users className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div className="text-xs font-black text-zinc-900">{hasAppointments ? 'Client Base' : 'Customer Base'}</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">{customers?.length || 0} registered</div>
          </button>

          {hasFranchise && (
            <button
              onClick={() => setActiveTab(7)}
              className="p-4 rounded-2xl bg-white shadow-md hover:shadow-xl text-left transition-all cursor-pointer border-0 group active:scale-95"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2.5">
                <Building2 className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div className="text-xs font-black text-zinc-900">Franchise Desk</div>
              <div className="text-[11px] text-zinc-500 mt-0.5">{franchiseInquiries?.length || 0} leads pending</div>
            </button>
          )}
        </div>
      </div>

      {/* Live Recent Orders / Bookings Feed */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-4 border-0">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-zinc-900">Live {orderNounPlural} Stream</h3>
            <p className="text-xs text-zinc-500">Auto-updates instantly as customers reserve {orderNounPlural.toLowerCase()}</p>
          </div>
          <button
            onClick={() => setActiveTab(1)}
            className={`text-xs font-black ${isSalon ? 'text-[#d4af37]' : 'text-[#DC2626]'} hover:underline cursor-pointer uppercase tracking-wider`}
          >
            View All ({metrics.totalOrders}) →
          </button>
        </div>

        {recentOrders.length === 0 ? (
          <div className="text-center py-10 text-zinc-400 text-xs font-medium">
            {hasAppointments 
              ? 'Abhi koi booking nahi hai. Nayi booking aane par yahan live show hogi.' 
              : 'Abhi koi order nahi hai. Naye order aane par yahan live show honge.'}
          </div>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((ord) => {
              const statusBadgeStyle = {
                confirmed: 'bg-emerald-50 text-emerald-700',
                completed: 'bg-emerald-50 text-emerald-700',
                in_chair: 'bg-indigo-50 text-indigo-700',
                booked: 'bg-emerald-50 text-emerald-700',
                preparing: 'bg-amber-50 text-amber-700',
                out_for_delivery: 'bg-sky-50 text-sky-700',
                delivered: 'bg-zinc-100 text-zinc-600',
                cancelled: 'bg-red-50 text-red-700'
              }[ord.status] || 'bg-zinc-100 text-zinc-700';

              const orderRefId = ord.token || (ord.orderNumber ? ord.orderNumber.replace(/^(SN|NS)-/, '') : ord.id?.slice(-4));
              const itemsText = Array.isArray(ord.items) && ord.items.length > 0
                ? ord.items.map(i => `${i.qty || 1}x ${i.name}`).join(', ')
                : (ord.styleName || ord.serviceName || ord.services?.map(s => s.name).join(', ') || 'Service / Order item');

              return (
                <div
                  key={ord.id}
                  onClick={() => setActiveTab(1)}
                  className="bg-[#FFFBF7] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs hover:shadow-md transition-all cursor-pointer border-0"
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-xs flex items-center justify-center text-xs font-black text-zinc-900 shrink-0">
                      #{orderRefId}
                    </div>
                    <div>
                      <div className="text-sm font-black text-zinc-900 flex items-center gap-2">
                        <span>{ord.customer?.name || ord.customerName || ord.name || 'Customer'}</span>
                        <span className="text-xs text-zinc-500 font-normal">
                          • {ord.customer?.phone || ord.customerPhone || ord.phone || ''}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-600 mt-0.5 line-clamp-1">
                        {itemsText}
                        {ord.slot ? ` • Slot: ${typeof ord.slot === 'object' ? ord.slot.label : ord.slot}` : ''}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <span className="text-base font-black text-zinc-900">
                      ₹{ord.total || ord.grandTotal || ord.totalPrice || 0}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${statusBadgeStyle}`}>
                      {ord.status || 'Pending'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
