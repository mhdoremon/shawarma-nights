import React, { useState, useEffect } from 'react';
import { useMaster } from '../context/MasterContext';
import { 
  Store, 
  CreditCard, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  LogOut, 
  Check, 
  Bell, 
  Wifi, 
  RefreshCw, 
  Truck, 
  Receipt, 
  ShieldCheck, 
  MapPin, 
  Clock, 
  Phone, 
  Instagram, 
  MessageCircle,
  HelpCircle,
  Video,
  Play,
  Upload,
  X
} from 'lucide-react';
import { playOrderSound } from '../utils/soundHelper';

export default function SettingsTab() {
  const { 
    storeInfo, 
    heroBanner, 
    updateStoreSettings, 
    updateHeroBanner, 
    soundEnabled, 
    setSoundEnabled, 
    logout, 
    showToast,
    storeId,
    switchStoreId,
    isConnected,
    refreshData,
    capabilities,
    user
  } = useMaster();

  // Domain Capability-driven feature guards (Strict separation for Salon vs Fashion vs Food)
  const isSalon = capabilities?.orders?.hasAppointments ?? (storeInfo?.vertical === 'salon' || (storeId || '').includes('nash'));
  const isFashion = capabilities?.catalog?.hasSizes ?? (storeInfo?.vertical === 'fashion' || (storeId || '').includes('skyline'));
  const hasFood = !isSalon && !isFashion && (capabilities?.storeType === 'restaurant' || capabilities?.vertical === 'restaurant');
  const hasFreeDeliveryThreshold = !isSalon && Boolean(capabilities?.settings?.hasFreeDeliveryThreshold ?? true);
  const hasDeliveryFee = !isSalon && Boolean(capabilities?.settings?.hasDeliveryFee ?? hasFreeDeliveryThreshold);
  const hasTaxesAndPackaging = !isSalon && Boolean(capabilities?.settings?.hasTaxesAndPackaging ?? true);
  const hasHeroBannerFeature = !isSalon && Boolean(capabilities?.settings?.hasHeroBanner ?? true);
  const hasHeroVideo = Boolean(capabilities?.settings?.hasHeroVideo || isSalon);

  // 7-Day Interactive Weekly Schedule Editor
  const DAYS_OF_WEEK = [
    { key: 'mon', label: 'Monday (सोमवार)' },
    { key: 'tue', label: 'Tuesday (मंगलवार)' },
    { key: 'wed', label: 'Wednesday (बुधवार)' },
    { key: 'thu', label: 'Thursday (गुरुवार)' },
    { key: 'fri', label: 'Friday (शुक्रवार)' },
    { key: 'sat', label: 'Saturday (शनिवार)' },
    { key: 'sun', label: 'Sunday (रविवार)' }
  ];

  const DEFAULT_SCHEDULE = {
    mon: { isOpen: true, open: '11:00 AM', close: '11:00 PM' },
    tue: { isOpen: true, open: '11:00 AM', close: '11:00 PM' },
    wed: { isOpen: true, open: '11:00 AM', close: '11:00 PM' },
    thu: { isOpen: true, open: '11:00 AM', close: '11:00 PM' },
    fri: { isOpen: true, open: '11:00 AM', close: '11:00 PM' },
    sat: { isOpen: true, open: '11:00 AM', close: '11:00 PM' },
    sun: { isOpen: false, open: '11:00 AM', close: '11:00 PM' }
  };

  const [weeklySchedule, setWeeklySchedule] = useState(() => {
    if (storeInfo?.weeklySchedule && typeof storeInfo.weeklySchedule === 'object') {
      return { ...DEFAULT_SCHEDULE, ...storeInfo.weeklySchedule };
    }
    return DEFAULT_SCHEDULE;
  });

  // Free Delivery Threshold State
  const [freeDeliveryInput, setFreeDeliveryInput] = useState(
    storeInfo?.freeDeliveryThreshold !== undefined ? String(storeInfo.freeDeliveryThreshold) : '350'
  );

  // Taxes & Charges State
  const tcObj = storeInfo?.taxesAndCharges || {};
  const [taxEnabled, setTaxEnabled] = useState(Boolean(tcObj.enabled || storeInfo?.taxEnabled));
  const [taxPercentInput, setTaxPercentInput] = useState(
    String(tcObj.taxPercent ?? storeInfo?.taxPercent ?? 5)
  );
  const [packagingChargeInput, setPackagingChargeInput] = useState(
    String(tcObj.packagingCharge ?? storeInfo?.packagingCharge ?? 10)
  );

  // Store General & Operational Info Form
  const paymentObj = storeInfo?.payment || {};
  const socialsObj = storeInfo?.socials || {};

  const [operationalForm, setOperationalForm] = useState({
    name: storeInfo?.name || storeInfo?.studioName || (isSalon ? 'Nash Studio' : isFashion ? 'Skyline Outfits' : 'Shawarma Nights'),
    tagline: storeInfo?.tagline || (isSalon ? 'PRECISION GROOMING. BINA INTEZAAR KE.' : 'Original Charcoal Shawarma & Rolls'),
    heroVideoUrl: storeInfo?.heroVideoUrl || '/video/hero.mp4',
    timing: storeInfo?.timing || (isSalon ? 'Mon-Sat: 11:00 AM – 11:00 PM | Sun: Closed' : 'Open Daily: 12:00 PM – 04:00 AM'),
    address: storeInfo?.address || (isSalon ? 'Shop 12, Main Boulevard, Gulberg' : 'Near Railway Station, Churu, Rajasthan'),
    deliveryNote: storeInfo?.deliveryNote || 'Fast delivery in 25-30 minutes across Churu city',
    halalBadgeText: storeInfo?.halalBadgeText || '100% Halal Certified Fresh',
    aboutText: storeInfo?.aboutText || (isSalon ? 'Bespoke haircuts, luxury skin fades, hot towel razor shaves, and executive beard grooming.' : 'Authentic Charcoal Shawarma grilled live with authentic Arabian Toum garlic sauce.'),
    upiId: paymentObj.upiId || storeInfo?.upiId || (isSalon ? 'nashstudio@upi' : '7023963189@paytm'),
    payeeName: paymentObj.payeeName || (isSalon ? 'Nash Studio' : 'Shawarma Nights'),
    codEnabled: paymentObj.codEnabled !== false,
    whatsapp: socialsObj.whatsapp || (isSalon ? '923001234567' : '7023963189'),
    instagram: socialsObj.instagram || (isSalon ? 'https://instagram.com/nashstudio' : 'https://instagram.com/shawarmanights_churu'),
    isOpen: storeInfo?.isOpen !== false,
    deliveryFee: storeInfo?.deliveryFee ?? 30
  });

  // Smart Modular Feature Connections (Toggled OFF by default for salon / Nash Studio)
  const [showHeroBanner, setShowHeroBanner] = useState(
    storeInfo?.settings?.showHeroBanner !== undefined
      ? Boolean(storeInfo.settings.showHeroBanner)
      : (!isSalon)
  );

  const [showOfferCards, setShowOfferCards] = useState(
    storeInfo?.settings?.showOfferCards !== undefined
      ? Boolean(storeInfo.settings.showOfferCards)
      : (!isSalon)
  );

  // Hero Banner & Marquee Form
  const [heroForm, setHeroForm] = useState({
    titleLine1: heroBanner?.titleLine1 || 'REAL',
    titleLine2: heroBanner?.titleLine2 || 'CHARCOAL',
    titleHighlight: heroBanner?.titleHighlight || 'SHAWARMA',
    subtitle: heroBanner?.subtitle || 'Slow-turned on glowing coals. Carved fresh. Wrapped in toasted saj bread with our legendary garlic toum.',
    badgeText: heroBanner?.badgeText || '50% OFF — NIGHT50',
    marqueeText: heroBanner?.marqueeText || '★ TAP HERE TO OWN A FRANCHISE ● ★ 3-6 MONTHS ROI ● ★ HIGH CASH FLOW ● ★ TURNKEY SETUP ● ★ LIMITED CITY SLOTS AVAILABLE ★'
  });

  // Sync state if storeInfo updates
  useEffect(() => {
    if (storeInfo) {
      if (storeInfo.freeDeliveryThreshold !== undefined) {
        setFreeDeliveryInput(String(storeInfo.freeDeliveryThreshold));
      }
      const tc = storeInfo.taxesAndCharges || {};
      if (tc.enabled !== undefined) setTaxEnabled(Boolean(tc.enabled));
      if (tc.taxPercent !== undefined) setTaxPercentInput(String(tc.taxPercent));
      if (tc.packagingCharge !== undefined) setPackagingChargeInput(String(tc.packagingCharge));

      if (storeInfo.settings?.showHeroBanner !== undefined) {
        setShowHeroBanner(Boolean(storeInfo.settings.showHeroBanner));
      } else if (isSalon) {
        setShowHeroBanner(false);
      }

      if (storeInfo.settings?.showOfferCards !== undefined) {
        setShowOfferCards(Boolean(storeInfo.settings.showOfferCards));
      } else if (isSalon) {
        setShowOfferCards(false);
      }

      if (storeInfo.weeklySchedule && typeof storeInfo.weeklySchedule === 'object') {
        setWeeklySchedule(prev => ({ ...prev, ...storeInfo.weeklySchedule }));
      }

      const pay = storeInfo.payment || {};
      const soc = storeInfo.socials || {};
      setOperationalForm(prev => ({
        ...prev,
        name: storeInfo.name || storeInfo.studioName || prev.name,
        tagline: storeInfo.tagline || prev.tagline,
        heroVideoUrl: storeInfo.heroVideoUrl || prev.heroVideoUrl,
        timing: storeInfo.timing || prev.timing,
        address: storeInfo.address || prev.address,
        deliveryNote: storeInfo.deliveryNote || prev.deliveryNote,
        halalBadgeText: storeInfo.halalBadgeText || prev.halalBadgeText,
        aboutText: storeInfo.aboutText || prev.aboutText,
        upiId: pay.upiId || storeInfo.upiId || prev.upiId,
        payeeName: pay.payeeName || prev.payeeName,
        codEnabled: pay.codEnabled !== false,
        whatsapp: soc.whatsapp || prev.whatsapp,
        instagram: soc.instagram || prev.instagram,
        isOpen: storeInfo.isOpen !== false,
        deliveryFee: storeInfo.deliveryFee ?? prev.deliveryFee
      }));
    }
  }, [storeInfo]);

  useEffect(() => {
    if (heroBanner) {
      setHeroForm({
        titleLine1: heroBanner.titleLine1 || 'REAL',
        titleLine2: heroBanner.titleLine2 || 'CHARCOAL',
        titleHighlight: heroBanner.titleHighlight || 'SHAWARMA',
        subtitle: heroBanner.subtitle || 'Slow-turned on glowing coals. Carved fresh. Wrapped in toasted saj bread with our legendary garlic toum.',
        badgeText: heroBanner.badgeText || '50% OFF — NIGHT50',
        marqueeText: heroBanner.marqueeText || '★ TAP HERE TO OWN A FRANCHISE ● ★ 3-6 MONTHS ROI ● ★ HIGH CASH FLOW ● ★ TURNKEY SETUP ● ★ LIMITED CITY SLOTS AVAILABLE ★'
      });
    }
  }, [heroBanner]);

  // 1. SAVE FREE DELIVERY THRESHOLD
  const handleSaveFreeDelivery = async (e) => {
    e.preventDefault();
    const val = Number(freeDeliveryInput) || 0;
    await updateStoreSettings({
      freeDeliveryThreshold: val
    });
    showToast(`Free Delivery Limit ₹${val} Saved & Synced!`, 'success');
  };

  // 2. SAVE TAXES & CHARGES
  const handleSaveTaxes = async (e) => {
    e.preventDefault();
    const taxNum = Number(taxPercentInput) || 0;
    const packNum = Number(packagingChargeInput) || 0;

    await updateStoreSettings({
      taxesAndCharges: {
        enabled: taxEnabled,
        taxPercent: taxNum,
        packagingCharge: packNum
      },
      // Flat properties for fallback
      taxPercent: taxNum,
      packagingCharge: packNum,
      taxEnabled: taxEnabled
    });
    showToast('Taxes & Packaging Charges Saved & Synced!', 'success');
  };

  // Video file upload for salon hero background
  const [isVideoUploading, setIsVideoUploading] = useState(false);
  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsVideoUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result;
      try {
        const res = await fetch(`https://churuone-backend.onrender.com/api/upload`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-store-id': storeId
          },
          body: JSON.stringify({
            image: base64Data,
            filename: file.name
          })
        });
        const data = await res.json();
        if (data.success && data.url) {
          setOperationalForm(prev => ({ ...prev, heroVideoUrl: data.url }));
          showToast('Hero background video uploaded successfully!', 'success');
        } else {
          setOperationalForm(prev => ({ ...prev, heroVideoUrl: base64Data }));
          showToast('Video loaded from device', 'info');
        }
      } catch (err) {
        setOperationalForm(prev => ({ ...prev, heroVideoUrl: base64Data }));
        showToast('Video loaded from device', 'info');
      } finally {
        setIsVideoUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // 3. SAVE OPERATIONAL SETTINGS
  const handleSaveOperational = async (e) => {
    e.preventDefault();

    // Auto-generate timing string for backwards compatibility
    const openDays = DAYS_OF_WEEK.filter(d => weeklySchedule[d.key]?.isOpen);
    const closedDays = DAYS_OF_WEEK.filter(d => !weeklySchedule[d.key]?.isOpen);
    let autoTiming = '';
    if (closedDays.length === 0) {
      autoTiming = 'Open All 7 Days: 11:00 AM – 11:00 PM';
    } else if (closedDays.length === 1 && closedDays[0].key === 'sun') {
      autoTiming = 'Mon-Sat: 11:00 AM – 11:00 PM | Sun: Closed';
    } else {
      autoTiming = `${openDays.map(d => d.label.split(' ')[0]).join(', ')} Open | ${closedDays.map(d => d.label.split(' ')[0]).join(', ')} Closed`;
    }

    const payload = {
      name: operationalForm.name,
      tagline: operationalForm.tagline,
      heroVideoUrl: operationalForm.heroVideoUrl,
      weeklySchedule: weeklySchedule,
      timing: operationalForm.timing || autoTiming,
      address: operationalForm.address,
      aboutText: operationalForm.aboutText,
      isOpen: operationalForm.isOpen,
      payment: {
        upiId: operationalForm.upiId.trim(),
        payeeName: operationalForm.payeeName.trim(),
        autoSmsVerification: true,
        codEnabled: isSalon ? false : operationalForm.codEnabled
      },
      socials: {
        whatsapp: operationalForm.whatsapp.trim(),
        instagram: operationalForm.instagram.trim()
      }
    };

    if (hasDeliveryFee || hasFreeDeliveryThreshold) {
      payload.deliveryFee = Number(operationalForm.deliveryFee) || 0;
      payload.deliveryNote = operationalForm.deliveryNote;
    }
    if (hasFood) {
      payload.halalBadgeText = operationalForm.halalBadgeText;
    }

    await updateStoreSettings(payload);
    showToast(isSalon ? 'Salon Settings & Weekly Schedule Saved Live!' : 'Store Operational Details & UPI Saved!', 'success');
  };

  // 4. SAVE HERO & MARQUEE COPY
  const handleSaveHero = async (e) => {
    e.preventDefault();
    await updateHeroBanner({
      ...heroForm,
      enabled: showHeroBanner
    });
    await updateStoreSettings({
      showHeroBanner,
      showMarqueeStrip: showHeroBanner
    });
    showToast('Homepage Hero Banner & Marquee Strip Saved!', 'success');
  };

  const fdThresholdPresets = [199, 249, 299, 349, 399, 499];
  const taxPresets = [
    { label: '0%', val: '0' },
    { label: '5% GST', val: '5' },
    { label: '12%', val: '12' },
    { label: '18%', val: '18' }
  ];
  const packagingPresets = [
    { label: '₹0', val: '0' },
    { label: '₹10', val: '10' },
    { label: '₹20', val: '20' },
    { label: '₹30', val: '30' }
  ];

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto font-sans">
      
      {/* Settings Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-0">
        <div>
          <h2 className="text-xl font-black text-zinc-900 tracking-tight">DUKAN SETTINGS & BRAND INFO</h2>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            Manage merchant UPI, timings, address & customer-facing information
          </p>
        </div>

        <button
          onClick={logout}
          className="px-5 py-2.5 rounded-full bg-zinc-100 hover:bg-red-50 text-zinc-700 hover:text-red-600 text-xs font-black flex items-center gap-2 cursor-pointer transition-colors border-0"
        >
          <LogOut className="w-4 h-4" />
          <span>Exit / Logout</span>
        </button>
      </div>

      {/* CARD 3: FREE DELIVERY THRESHOLD */}
      {hasFreeDeliveryThreshold && (
        <form onSubmit={handleSaveFreeDelivery} className="bg-white rounded-3xl p-6 sm:p-7 shadow-xl space-y-4 border-0">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-[#DC2626] flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#DC2626]" />
              <span>FREE DELIVERY THRESHOLD (फ्री डिलीवरी लिमिट)</span>
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              Current Limit: <strong className="text-zinc-900 font-black">₹{freeDeliveryInput}</strong> (Customer ke bag me is amount se upar delivery FREE hogi)
            </p>
          </div>

          {/* Quick Amount Suggestion Chips */}
          <div>
            <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-2">
              Quick Threshold Chips:
            </label>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {fdThresholdPresets.map(preset => {
                const active = String(preset) === String(freeDeliveryInput);
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setFreeDeliveryInput(String(preset))}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all cursor-pointer border-0 ${
                      active
                        ? 'bg-[#DC2626] text-white shadow-sm'
                        : 'bg-[#FFFBF7] text-zinc-700 hover:bg-zinc-100 shadow-xs'
                    }`}
                  >
                    ₹{preset}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Input */}
          <div>
            <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
              Custom Threshold Amount (₹)
            </label>
            <input
              type="number"
              value={freeDeliveryInput}
              onChange={(e) => setFreeDeliveryInput(e.target.value)}
              placeholder="e.g. 350"
              className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-3 text-sm text-zinc-900 font-bold focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-full bg-[#DC2626] hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-xl transition-all border-0"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>SAVE THRESHOLD (वेबसाइट पर सेव करें)</span>
          </button>
        </form>
      )}

      {/* CARD 4: TAXES & CHARGES (GST & PACKAGING CONTROLS) */}
      {hasTaxesAndPackaging && (
        <form onSubmit={handleSaveTaxes} className="bg-white rounded-3xl p-6 sm:p-7 shadow-xl space-y-5 border-0">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-[#DC2626] flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#DC2626]" />
              <span>TAXES & CHARGES (टैक्स व पैकेजिंग चार्ज)</span>
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              Customer se GST Tax ya Packaging Charge lena hai ya nahi yahan se on/off aur set karein.
            </p>
          </div>

          {/* Toggle Status Chips: OFF vs ON */}
          <div>
            <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-2">
              Tax & Charges Status:
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTaxEnabled(false)}
                className={`px-5 py-2.5 rounded-full text-xs font-black transition-all cursor-pointer border-0 ${
                  !taxEnabled
                    ? 'bg-red-600 text-white shadow-md'
                    : 'bg-[#FFFBF7] text-zinc-600 hover:bg-zinc-100 shadow-xs'
                }`}
              >
                🔴 OFF (टैक्स बंद)
              </button>
              <button
                type="button"
                onClick={() => setTaxEnabled(true)}
                className={`px-5 py-2.5 rounded-full text-xs font-black transition-all cursor-pointer border-0 ${
                  taxEnabled
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-[#FFFBF7] text-zinc-600 hover:bg-zinc-100 shadow-xs'
                }`}
              >
                🟢 ON (टैक्स चालू)
              </button>
            </div>
          </div>

          {/* GST / Tax Percentage */}
          <div className="space-y-2">
            <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider">
              GST / Tax Percentage (%):
            </label>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {taxPresets.map(preset => {
                const active = String(preset.val) === String(taxPercentInput);
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setTaxPercentInput(preset.val)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all cursor-pointer border-0 ${
                      active
                        ? 'bg-[#DC2626] text-white shadow-sm'
                        : 'bg-[#FFFBF7] text-zinc-700 hover:bg-zinc-100 shadow-xs'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
            <input
              type="number"
              step="0.1"
              value={taxPercentInput}
              onChange={(e) => setTaxPercentInput(e.target.value)}
              placeholder="Tax % (e.g. 5)"
              className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-3 text-sm text-zinc-900 font-bold focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
            />
          </div>

          {/* Extra Packaging Charge */}
          <div className="space-y-2">
            <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider">
              Extra Packaging Charge (₹):
            </label>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {packagingPresets.map(preset => {
                const active = String(preset.val) === String(packagingChargeInput);
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setPackagingChargeInput(preset.val)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all cursor-pointer border-0 ${
                      active
                        ? 'bg-[#DC2626] text-white shadow-sm'
                        : 'bg-[#FFFBF7] text-zinc-700 hover:bg-zinc-100 shadow-xs'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
            <input
              type="number"
              value={packagingChargeInput}
              onChange={(e) => setPackagingChargeInput(e.target.value)}
              placeholder="Packaging ₹ (e.g. 10)"
              className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-3 text-sm text-zinc-900 font-bold focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-full bg-[#DC2626] hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-xl transition-all border-0"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>SAVE TAXES & CHARGES (सेव करें)</span>
          </button>
        </form>
      )}

      {/* CARD 5: DUKAN OPERATIONAL & SOCIAL INFO FORM */}
      <form onSubmit={handleSaveOperational} className="bg-white rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl border-0">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3.5">
          <h3 className="text-base font-black text-zinc-900 flex items-center gap-2">
            <Store className="w-4 h-4 text-[#DC2626]" />
            <span>Store Operational & Social Info</span>
          </h3>

          {/* Dukan Open/Close Switch */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={operationalForm.isOpen}
              onChange={(e) => setOperationalForm({ ...operationalForm, isOpen: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-10 h-5.5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-emerald-600 relative"></div>
            <span className={`text-xs font-black ${operationalForm.isOpen ? 'text-emerald-700' : 'text-zinc-400'}`}>
              {operationalForm.isOpen ? 'STORE OPEN' : 'STORE CLOSED'}
            </span>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
              Store / Dukan Name
            </label>
            <input
              type="text"
              required
              value={operationalForm.name}
              onChange={(e) => setOperationalForm({ ...operationalForm, name: e.target.value })}
              className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-3 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
              Tagline / Subtext
            </label>
            <input
              type="text"
              value={operationalForm.tagline}
              onChange={(e) => setOperationalForm({ ...operationalForm, tagline: e.target.value })}
              className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-3 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
            />
          </div>
        </div>

        {/* UPI Payments & Payee Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div>
            <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
              Merchant UPI ID (VPA)
            </label>
            <input
              type="text"
              required
              value={operationalForm.upiId}
              onChange={(e) => setOperationalForm({ ...operationalForm, upiId: e.target.value })}
              placeholder={isSalon ? "e.g. nashstudio@upi" : "e.g. 7023963189@paytm"}
              className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-3 text-sm text-zinc-900 font-mono focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
              UPI Payee Merchant Name
            </label>
            <input
              type="text"
              required
              value={operationalForm.payeeName}
              onChange={(e) => setOperationalForm({ ...operationalForm, payeeName: e.target.value })}
              placeholder={isSalon ? "e.g. Nash Studio" : "e.g. Shawarma Nights"}
              className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-3 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
            />
          </div>
        </div>

        {/* 7-DAY WEEKLY SCHEDULE & HOLIDAY MANAGER */}
        <div className="space-y-3 bg-[#FFFBF7] p-4 sm:p-5 rounded-2xl border-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200/60 pb-3">
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#DC2626]" />
                <span>Weekly Working Days & Holiday Schedule (साप्ताहिक कार्य दिवस एवं अवकाश)</span>
              </h4>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Har din ka open/close timing aur weekly off tay karein. Jis din OFF hoga, us din customer appointment/booking band rahegi.
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold text-zinc-500 uppercase">Quick Timings:</span>
              {[
                { label: '11 AM - 11 PM', o: '11:00 AM', c: '11:00 PM' },
                { label: '10 AM - 10 PM', o: '10:00 AM', c: '10:00 PM' },
                { label: '9 AM - 9 PM', o: '09:00 AM', c: '09:00 PM' }
              ].map(preset => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setWeeklySchedule(prev => {
                      const updated = { ...prev };
                      DAYS_OF_WEEK.forEach(d => {
                        if (updated[d.key]?.isOpen) {
                          updated[d.key] = { ...updated[d.key], open: preset.o, close: preset.c };
                        }
                      });
                      return updated;
                    });
                  }}
                  className="px-2 py-0.5 rounded-md bg-white hover:bg-zinc-100 text-zinc-700 text-[10px] font-bold shadow-2xs border-0 cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2.5 pt-1">
            {DAYS_OF_WEEK.map(day => {
              const sched = weeklySchedule[day.key] || { isOpen: true, open: '11:00 AM', close: '11:00 PM' };
              return (
                <div
                  key={day.key}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl transition-all ${
                    sched.isOpen ? 'bg-white shadow-2xs' : 'bg-red-50/50 border border-red-100'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-[170px]">
                    <button
                      type="button"
                      onClick={() => {
                        setWeeklySchedule(prev => ({
                          ...prev,
                          [day.key]: { ...sched, isOpen: !sched.isOpen }
                        }));
                      }}
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border-0 ${
                        sched.isOpen
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-red-600 text-white shadow-2xs'
                      }`}
                    >
                      {sched.isOpen ? '🟢 OPEN' : '🔴 CLOSED (OFF)'}
                    </button>
                    <span className={`text-xs font-black ${sched.isOpen ? 'text-zinc-900' : 'text-red-700'}`}>
                      {day.label}
                    </span>
                  </div>

                  {sched.isOpen ? (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase">From:</span>
                        <input
                          type="text"
                          value={sched.open || '11:00 AM'}
                          onChange={(e) => {
                            const val = e.target.value;
                            setWeeklySchedule(prev => ({
                              ...prev,
                              [day.key]: { ...sched, open: val }
                            }));
                          }}
                          placeholder="11:00 AM"
                          className="w-24 bg-[#FFFBF7] rounded-lg px-2.5 py-1 text-xs text-zinc-900 font-bold focus:bg-white focus:ring-1 focus:ring-[#DC2626] border-0"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase">To:</span>
                        <input
                          type="text"
                          value={sched.close || '11:00 PM'}
                          onChange={(e) => {
                            const val = e.target.value;
                            setWeeklySchedule(prev => ({
                              ...prev,
                              [day.key]: { ...sched, close: val }
                            }));
                          }}
                          placeholder="11:00 PM"
                          className="w-24 bg-[#FFFBF7] rounded-lg px-2.5 py-1 text-xs text-zinc-900 font-bold focus:bg-white focus:ring-1 focus:ring-[#DC2626] border-0"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] font-bold text-red-600 flex items-center gap-1">
                      <span>Weekly Off (इस दिन सैलून/दुकान बंद रहेगी)</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Store Physical Address */}
        <div>
          <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
            Store Physical Address
          </label>
          <input
            type="text"
            value={operationalForm.address}
            onChange={(e) => setOperationalForm({ ...operationalForm, address: e.target.value })}
            placeholder={isSalon ? "Shop 12, Main Boulevard, Gulberg" : "Near Railway Station, Churu, Rajasthan"}
            className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-3 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
          />
        </div>

        {/* Delivery Note (Delivery / Food stores only - strictly hidden for Salon) */}
        {!isSalon && (hasFreeDeliveryThreshold || hasDeliveryFee) && (
          <div>
            <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
              Delivery Note
            </label>
            <input
              type="text"
              value={operationalForm.deliveryNote}
              onChange={(e) => setOperationalForm({ ...operationalForm, deliveryNote: e.target.value })}
              placeholder="Fast delivery in 25-30 minutes"
              className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-3 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
            />
          </div>
        )}

        {/* Halal / Quality Badge Text (Restaurant only - strictly hidden for Salon & Fashion) */}
        {hasFood && (
          <div>
            <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
              Halal / Food Quality Badge Text
            </label>
            <input
              type="text"
              value={operationalForm.halalBadgeText}
              onChange={(e) => setOperationalForm({ ...operationalForm, halalBadgeText: e.target.value })}
              placeholder="100% Halal Certified Fresh"
              className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-3 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
            />
          </div>
        )}

        {/* About Store Description */}
        <div>
          <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
            About Store Description
          </label>
          <textarea
            rows={2}
            value={operationalForm.aboutText}
            onChange={(e) => setOperationalForm({ ...operationalForm, aboutText: e.target.value })}
            className="w-full bg-[#FFFBF7] rounded-2xl p-3.5 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0 resize-none"
          />
        </div>

        {/* WhatsApp & Instagram Contact */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
              WhatsApp Contact Number
            </label>
            <input
              type="text"
              value={operationalForm.whatsapp}
              onChange={(e) => setOperationalForm({ ...operationalForm, whatsapp: e.target.value })}
              placeholder={isSalon ? "e.g. 923001234567" : "e.g. 7023963189"}
              className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-3 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
              Instagram Profile Link
            </label>
            <input
              type="text"
              value={operationalForm.instagram}
              onChange={(e) => setOperationalForm({ ...operationalForm, instagram: e.target.value })}
              placeholder={isSalon ? "e.g. https://instagram.com/nashstudio" : "e.g. https://instagram.com/shawarmanights_churu"}
              className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-3 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
            />
          </div>
        </div>

        {/* Accept Cash on Delivery Switch (Delivery stores only - strictly hidden for Salon) */}
        {!isSalon && (
          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#FFFBF7] shadow-xs">
            <div>
              <span className="text-xs font-black text-zinc-900 block">Accept Cash on Delivery (COD)</span>
              <span className="text-[11px] text-zinc-500">Enable or disable cash payment option at checkout</span>
            </div>
            <input
              type="checkbox"
              checked={operationalForm.codEnabled}
              onChange={(e) => setOperationalForm({ ...operationalForm, codEnabled: e.target.checked })}
              className="w-4 h-4 rounded text-[#DC2626] focus:ring-[#DC2626]"
            />
          </div>
        )}

        <button
          type="submit"
          className="w-full py-3.5 rounded-full bg-[#DC2626] hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-xl border-0"
        >
          <Check className="w-4 h-4 stroke-[2.5]" />
          <span>SAVE & SYNC TO SERVER</span>
        </button>
      </form>

      {/* CARD: HERO BACKGROUND VIDEO MANAGER (SALON / SHOWCASE SITES) */}
      {hasHeroVideo && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl border-0">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3.5">
            <div>
              <h3 className="text-base font-black text-zinc-900 flex items-center gap-2">
                <Video className="w-5 h-5 text-indigo-600" />
                <span>Hero Background Video Manager (हीरो वीडियो मैनेजर)</span>
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Website header me chalne wali background video set karein ya phone/device se upload karein
              </p>
            </div>
            {operationalForm.heroVideoUrl && (
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 fill-emerald-600" /> Live Video Set
              </span>
            )}
          </div>

          {/* Video Player Live Preview */}
          <div className="relative rounded-2xl overflow-hidden bg-black aspect-video max-h-56 w-full flex items-center justify-center border border-zinc-200 shadow-inner">
            {operationalForm.heroVideoUrl ? (
              <video
                key={operationalForm.heroVideoUrl}
                src={operationalForm.heroVideoUrl}
                autoPlay
                muted
                loop
                playsInline
                controls
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-zinc-400 text-xs flex flex-col items-center gap-2">
                <Video className="w-8 h-8 opacity-40" />
                <span>Koi video URL set nahi hai</span>
              </div>
            )}
            <div className="absolute bottom-2 left-3 right-3 bg-black/60 backdrop-blur-xs text-white/90 px-3 py-1.5 rounded-lg text-[11px] font-mono truncate flex items-center justify-between">
              <span className="truncate">Active Video: {operationalForm.heroVideoUrl || 'None'}</span>
            </div>
          </div>

          {/* Video Controls & Inputs */}
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
                Video Direct URL / File Path
              </label>
              <input
                type="text"
                value={operationalForm.heroVideoUrl}
                onChange={(e) => setOperationalForm({ ...operationalForm, heroVideoUrl: e.target.value })}
                placeholder="e.g. /video/hero.mp4 ya koi bhi direct .mp4 link"
                className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-3 text-sm text-zinc-900 font-mono focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none transition-all shadow-xs border-0"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-3">
                <label className="px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors shadow-xs">
                  <Upload className="w-4 h-4" />
                  <span>{isVideoUploading ? 'Uploading Video...' : 'Upload Video From Device (डिवाइस से चुनें)'}</span>
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    onChange={handleVideoUpload}
                    className="hidden"
                    disabled={isVideoUploading}
                  />
                </label>
              </div>

              <button
                type="button"
                onClick={() => {
                  setOperationalForm(prev => ({ ...prev, heroVideoUrl: '/video/hero.mp4' }));
                  showToast('Reset to default /video/hero.mp4', 'info');
                }}
                className="px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors border-0 self-start sm:self-auto"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Default Video (डिफ़ॉल्ट रीसेट)</span>
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveOperational}
            className="w-full py-3.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-xl border-0"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>SAVE HERO VIDEO LIVE TO SERVER</span>
          </button>
        </div>
      )}

      {/* CARD 6: HOMEPAGE HERO BANNER & MARQUEE STRIP COPY */}
      {hasHeroBannerFeature && (
        <form onSubmit={handleSaveHero} className="bg-white rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl border-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-100 pb-3.5 gap-2">
            <div>
              <h3 className="text-base font-black text-zinc-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Homepage Hero Banner & Marquee Strip Copy</span>
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Customize the main headline and the scrolling ticker strip at top of website
              </p>
            </div>
            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider self-start sm:self-auto ${
              showHeroBanner
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-zinc-100 text-zinc-600'
            }`}>
              {showHeroBanner ? '🟢 Banner Active On Site' : '🔴 Banner Toggled Off'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
                Title Line 1
              </label>
              <input
                type="text"
                value={heroForm.titleLine1}
                onChange={(e) => setHeroForm({ ...heroForm, titleLine1: e.target.value })}
                className="w-full bg-[#FFFBF7] rounded-2xl px-3.5 py-2.5 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
                Title Line 2
              </label>
              <input
                type="text"
                value={heroForm.titleLine2}
                onChange={(e) => setHeroForm({ ...heroForm, titleLine2: e.target.value })}
                className="w-full bg-[#FFFBF7] rounded-2xl px-3.5 py-2.5 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
                Highlight Word
              </label>
              <input
                type="text"
                value={heroForm.titleHighlight}
                onChange={(e) => setHeroForm({ ...heroForm, titleHighlight: e.target.value })}
                className="w-full bg-[#FFFBF7] rounded-2xl px-3.5 py-2.5 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
              Badge Sticker Text
            </label>
            <input
              type="text"
              value={heroForm.badgeText}
              onChange={(e) => setHeroForm({ ...heroForm, badgeText: e.target.value })}
              className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-3 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
            />
          </div>

          {/* Marquee Ticker Copy */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider">
                Scrolling Marquee Top Strip (Clickable Franchise Button)
              </label>
              <span className="text-[10px] text-zinc-400">Separate items using ● bullet</span>
            </div>
            <textarea
              rows={3}
              value={heroForm.marqueeText}
              onChange={(e) => setHeroForm({ ...heroForm, marqueeText: e.target.value })}
              className="w-full bg-[#FFFBF7] rounded-2xl p-4 text-xs text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0 font-mono leading-relaxed resize-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
              Subtitle Copy
            </label>
            <textarea
              rows={2}
              value={heroForm.subtitle}
              onChange={(e) => setHeroForm({ ...heroForm, subtitle: e.target.value })}
              className="w-full bg-[#FFFBF7] rounded-2xl p-3.5 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0 resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-full bg-[#DC2626] hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-xl border-0"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>UPDATE HERO BANNER & MARQUEE STRIP</span>
          </button>
        </form>
      )}

      {/* CARD 7: ORDER / APPOINTMENT NOTIFICATION CHIME AUDIO TEST */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xl space-y-4 border-0">
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-zinc-500 flex items-center gap-2">
            <Bell className="w-4 h-4 text-emerald-600" />
            <span>{isSalon ? 'APPOINTMENT NOTIFICATION CHIME AUDIO TEST' : 'ORDER NOTIFICATION CHIME AUDIO TEST'}</span>
          </h3>
          <p className="text-xs text-zinc-500 mt-1">
            Plays a synthesized 3-tone notification chime immediately when a new customer {isSalon ? 'appointment' : 'order'} arrives
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              playOrderSound();
              showToast(isSalon ? 'Test booking chime played!' : 'Test order chime played!', 'info');
            }}
            className="px-5 py-2.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-xs font-black text-zinc-800 transition-colors cursor-pointer border-0"
          >
            TEST {isSalon ? 'BOOKING' : 'ALERT'} CHIME
          </button>

          <button
            type="button"
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              showToast(soundEnabled ? 'Order sound muted' : 'Order sound enabled', 'info');
            }}
            className={`px-4 py-2.5 rounded-full text-xs font-black transition-colors cursor-pointer flex items-center gap-1.5 border-0 ${
              soundEnabled ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-400'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>{soundEnabled ? 'Sound Active' : 'Sound Muted'}</span>
          </button>
        </div>
      </div>

      {/* CARD 8: DUKANDAR ACCOUNT ACCESS / LOGOUT */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xl space-y-4 border-0">
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-zinc-500 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#DC2626]" />
            <span>DUKANDAR ACCOUNT ACCESS</span>
          </h3>
          <p className="text-xs text-zinc-600 mt-1 font-bold">
            Logged in as: <span className="text-zinc-900">{user?.username || 'Master Admin'}</span>
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">
            Is device se logout karne ke baad kisi bhi phone se Master Password ke sath login kiya ja sakta hai.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (window.confirm('Kya aap Dukandar Portal se logout karna chahte hain?')) {
              logout();
            }
          }}
          className="w-full py-3.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg transition-all border-0"
        >
          <LogOut className="w-4 h-4" />
          <span>LOGOUT DUKANDAR ACCOUNT</span>
        </button>
      </div>

    </div>
  );
}
