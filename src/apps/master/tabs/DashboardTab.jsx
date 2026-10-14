import React, { useMemo, useState } from 'react';
import { useMaster } from '../context/MasterContext';
import { TrendingUp, ShoppingBag, Clock, CheckCircle2, IndianRupee, Store, Plus, Tag, Users, Building2, ShieldCheck, Lock, Phone, MessageSquare, ExternalLink, AlertTriangle, Copy, Check } from 'lucide-react';

export default function DashboardTab() {
  const { orders, menu, deals, customers, franchiseInquiries, setActiveTab, storeInfo, storeId, capabilities, user } = useMaster();
  const [copiedId, setCopiedId] = useState(false);

  const handleCopyDukanId = (id) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2200);
    }
  };

  const isPendingReview = storeInfo?.status === 'pending_review' || 
    user?.status === 'pending_review' ||
    (() => {
      try {
        const u = JSON.parse(localStorage.getItem('churuone_master_user') || '{}');
        return u.status === 'pending_review';
      } catch { return false; }
    })();

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

  const isSalon = capabilities?.orders?.hasAppointments ?? (storeInfo?.vertical === 'salon' || (storeId || '').includes('nash'));
  const isFashion = capabilities?.catalog?.hasSizes ?? (storeInfo?.vertical === 'fashion' || (storeId || '').includes('skyline'));
  const hasAppointments = capabilities?.orders?.hasAppointments ?? isSalon;
  const hasFranchise = capabilities?.settings?.hasFranchise ?? (!isSalon);
  const showOffers = storeInfo?.settings?.showOfferCards !== false && (!hasAppointments || storeInfo?.settings?.dealsEnabled === true);

  const storeDisplayName = storeInfo?.name || storeInfo?.studioName || (isSalon ? 'Nash Studio' : isFashion ? 'Skyline Outfits' : 'Shawarma Nights');
  const orderNoun = hasAppointments ? 'Booking' : 'Order';
  const orderNounPlural = hasAppointments ? 'Bookings' : 'Orders';
  const itemNoun = capabilities?.catalog?.itemNoun || (hasAppointments ? 'Service' : isFashion ? 'Product' : 'Dish');
  const itemNounPlural = capabilities?.catalog?.itemNounPlural || (hasAppointments ? 'Services' : isFashion ? 'Products' : 'Dishes');

  // Metrics calculation
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

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner / Store State */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-0">
        <div>
          <div className="inline-block bg-zinc-900 text-white px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm mb-2">
            TERMINAL ACTIVE
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 leading-tight">
            {storeDisplayName}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Realtime Dukan Terminal • ChuruOne Universal Backend Connected
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
