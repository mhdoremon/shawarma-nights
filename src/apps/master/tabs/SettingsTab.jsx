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
  X,
  Facebook,
  Twitter,
  Youtube,
  Share2,
  Scissors,
  Image as ImageIcon
} from 'lucide-react';
import { playOrderSound } from '../utils/soundHelper';

const API_BASE = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:5000'
  : 'https://churuone-backend.onrender.com';

function parseTimeComponents(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') {
    return { hour: '11', minute: '00', period: 'AM' };
  }
  const clean = timeStr.trim().toUpperCase();
  const m = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (m) {
    let h = m[1];
    if (h.length === 1) h = `0${h}`;
    return { hour: h, minute: m[2], period: m[3] };
  }
  return { hour: '11', minute: '00', period: 'AM' };
}

function TimeSelectPicker({ value, onChange }) {
  const parts = parseTimeComponents(value);

  const handleChange = (field, newVal) => {
    const next = { ...parts, [field]: newVal };
    onChange(`${next.hour}:${next.minute} ${next.period}`);
  };

  return (
    <div className="inline-flex items-center gap-1 bg-white border border-zinc-200 rounded-xl px-2 py-1 shadow-2xs">
      <select
        value={parts.hour}
        onChange={(e) => handleChange('hour', e.target.value)}
        className="text-xs font-black text-zinc-900 bg-transparent border-0 focus:outline-none cursor-pointer py-0.5"
      >
        {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
      <span className="text-zinc-400 font-black text-xs">:</span>
      <select
        value={parts.minute}
        onChange={(e) => handleChange('minute', e.target.value)}
        className="text-xs font-bold text-zinc-800 bg-transparent border-0 focus:outline-none cursor-pointer py-0.5"
      >
        {['00', '15', '30', '45'].map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
      <select
        value={parts.period}
        onChange={(e) => handleChange('period', e.target.value)}
        className="text-xs font-black text-[#DC2626] bg-transparent border-0 focus:outline-none cursor-pointer py-0.5"
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
}

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
    sun: { isOpen: true, open: '11:00 AM', close: '11:00 PM' }
  };

  const [weeklySchedule, setWeeklySchedule] = useState(() => {
    if (storeInfo?.weeklySchedule && typeof storeInfo.weeklySchedule === 'object') {
      return { ...DEFAULT_SCHEDULE, ...storeInfo.weeklySchedule };
    }
    return DEFAULT_SCHEDULE;
  });

  const [defaultOpenTime, setDefaultOpenTime] = useState('12:00 PM');
  const [defaultCloseTime, setDefaultCloseTime] = useState('04:00 AM');

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
    timing: storeInfo?.timing || (isSalon ? 'Open All 7 Days: 11:00 AM – 11:00 PM' : 'Open Daily: 12:00 PM – 04:00 AM'),
    openTillText: storeInfo?.openTillText || 'OPEN TILL 11:00 PM',
    address: storeInfo?.address || (isSalon ? 'Shop 12, Main Boulevard, Gulberg' : 'Near Railway Station, Churu, Rajasthan'),
    phoneDisplay: storeInfo?.phoneDisplay || storeInfo?.phone || storeInfo?.settings?.phoneDisplay || (isSalon ? '0300-1234567' : '7023963189'),
    locationNote: storeInfo?.locationNote || 'Central hub kitchen with 30-45 min local delivery',
    deliveryNote: storeInfo?.deliveryNote || 'Fast delivery in 25-30 minutes across Churu city',
    halalBadgeText: storeInfo?.halalBadgeText || '',
    aboutText: storeInfo?.aboutText || (isSalon ? 'Bespoke haircuts, luxury skin fades, hot towel razor shaves, and executive beard grooming.' : 'Authentic Charcoal Shawarma grilled live with authentic Arabian Toum garlic sauce.'),
    ownerEyebrow: storeInfo?.ownerEyebrow || (isSalon ? 'THE MASTER CRAFTSMAN' : 'THE ARTISAN CHEF'),
    ownerHeadline: storeInfo?.ownerHeadline || (isSalon ? 'Artistry in Every Cut, Precision in Every Fade.' : 'Crafting Traditional Charcoal Shawarma with Passion.'),
    ownerName: storeInfo?.ownerName || (isSalon ? 'Naushad Ali' : 'Furkan & Team'),
    ownerRole: storeInfo?.ownerRole || (isSalon ? 'Master Stylist & Founder' : 'Founder & Head Chef'),
    ownerBio: storeInfo?.ownerBio || (isSalon ? 'Over 12 years of craftsmanship in bespoke fades, beard blending, and luxury gentleman grooming. Every cut is treated as an art form.' : 'Dedicated to authentic slow-roasted charcoal shawarma, hand-carved rolls, and fresh garlic toum made daily in Churu.'),
    ownerMediaUrl: storeInfo?.ownerMediaUrl || storeInfo?.ownerPhoto || storeInfo?.ownerVideo || '',
    foundedYear: storeInfo?.foundedYear || '2018',
    upiId: paymentObj.upiId || storeInfo?.upiId || (isSalon ? 'nashstudio@upi' : '7023963189@paytm'),
    payeeName: paymentObj.payeeName || (isSalon ? 'Nash Studio' : 'Shawarma Nights'),
    codEnabled: paymentObj.codEnabled !== false,
    onlineEnabled: paymentObj.onlineEnabled !== false,
    whatsapp: socialsObj.whatsapp || (isSalon ? '917023963189' : '7023963189'),
    instagram: socialsObj.instagram || (isSalon ? 'https://instagram.com/nashstudio_churu' : 'https://instagram.com/shawarmanights_churu'),
    facebook: socialsObj.facebook || '',
    twitter: socialsObj.twitter || '',
    youtube: socialsObj.youtube || '',
    isOpen: storeInfo?.isOpen !== false,
    marketplaceVisible: storeInfo?.marketplaceVisible !== false,
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
        const firstOpenDay = Object.values(storeInfo.weeklySchedule).find(s => s && s.isOpen && s.open && s.close);
        if (firstOpenDay) {
          setDefaultOpenTime(firstOpenDay.open);
          setDefaultCloseTime(firstOpenDay.close);
        }
      }

      const pay = storeInfo.payment || {};
      const soc = storeInfo.socials || {};
      setOperationalForm(prev => ({
        ...prev,
        name: storeInfo.name || storeInfo.studioName || prev.name,
        tagline: storeInfo.tagline || prev.tagline,
        heroVideoUrl: storeInfo.heroVideoUrl || prev.heroVideoUrl,
        timing: storeInfo.timing || prev.timing,
        openTillText: storeInfo.openTillText || prev.openTillText,
        address: storeInfo.address || prev.address,
        phoneDisplay: storeInfo.phoneDisplay || storeInfo.phone || storeInfo.settings?.phoneDisplay || prev.phoneDisplay,
        locationNote: storeInfo.locationNote || prev.locationNote,
        deliveryNote: storeInfo.deliveryNote || prev.deliveryNote,
        halalBadgeText: storeInfo.halalBadgeText || prev.halalBadgeText,
        aboutText: storeInfo.aboutText || prev.aboutText,
        ownerEyebrow: storeInfo.ownerEyebrow || prev.ownerEyebrow,
        ownerHeadline: storeInfo.ownerHeadline || prev.ownerHeadline,
        ownerName: storeInfo.ownerName || prev.ownerName,
        ownerRole: storeInfo.ownerRole || prev.ownerRole,
        ownerBio: storeInfo.ownerBio || prev.ownerBio,
        ownerMediaUrl: storeInfo.ownerMediaUrl || storeInfo.ownerPhoto || storeInfo.ownerVideo || prev.ownerMediaUrl || '',
        foundedYear: storeInfo.foundedYear || prev.foundedYear,
        upiId: pay.upiId || storeInfo.upiId || prev.upiId,
        payeeName: pay.payeeName || prev.payeeName,
        codEnabled: pay.codEnabled !== false,
        onlineEnabled: pay.onlineEnabled !== false,
        whatsapp: soc.whatsapp || prev.whatsapp,
        instagram: soc.instagram || prev.instagram,
        facebook: soc.facebook || prev.facebook,
        twitter: soc.twitter || prev.twitter,
        youtube: soc.youtube || prev.youtube,
        isOpen: storeInfo.isOpen !== false,
        marketplaceVisible: storeInfo.marketplaceVisible !== false,
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

  // Photo / Video file upload for Founder & Stylist card
  const [isOwnerMediaUploading, setIsOwnerMediaUploading] = useState(false);
  const handleOwnerMediaUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsOwnerMediaUploading(true);
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
          setOperationalForm(prev => ({ ...prev, ownerMediaUrl: data.url }));
          showToast('Founder photo/video uploaded successfully!', 'success');
        } else {
          setOperationalForm(prev => ({ ...prev, ownerMediaUrl: base64Data }));
          showToast('Photo/video loaded from device', 'info');
        }
      } catch (err) {
        setOperationalForm(prev => ({ ...prev, ownerMediaUrl: base64Data }));
        showToast('Photo/video loaded from device', 'info');
      } finally {
        setIsOwnerMediaUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // 3. SAVE OPERATIONAL SETTINGS
  const handleSaveOperational = async (e) => {
    e.preventDefault();

    // Dukandar 9 Rule: Enforce at least one payment method is enabled
    if (!isSalon && !operationalForm.codEnabled && !operationalForm.onlineEnabled) {
      showToast('Kam se kam ek payment method (COD ya Online UPI) active hona anivarya hai!', 'error');
      return;
    }

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
      studioName: operationalForm.name,
      storeName: operationalForm.name,
      tagline: operationalForm.tagline,
      heroTagline: operationalForm.tagline,
      heroVideoUrl: operationalForm.heroVideoUrl,
      weeklySchedule: weeklySchedule,
      timing: operationalForm.timing || autoTiming,
      openTillText: operationalForm.openTillText,
      address: operationalForm.address,
      phoneDisplay: operationalForm.phoneDisplay,
      phone: operationalForm.phoneDisplay,
      locationNote: operationalForm.locationNote,
      aboutText: operationalForm.aboutText,
      ownerEyebrow: operationalForm.ownerEyebrow,
      ownerHeadline: operationalForm.ownerHeadline,
      ownerName: operationalForm.ownerName,
      ownerRole: operationalForm.ownerRole,
      ownerBio: operationalForm.ownerBio,
      ownerMediaUrl: operationalForm.ownerMediaUrl,
      ownerPhoto: operationalForm.ownerMediaUrl,
      ownerVideo: operationalForm.ownerMediaUrl,
      foundedYear: operationalForm.foundedYear,
      isOpen: operationalForm.isOpen,
      marketplaceVisible: operationalForm.marketplaceVisible,
      payment: {
        upiId: operationalForm.upiId.trim(),
        payeeName: operationalForm.payeeName.trim(),
        autoSmsVerification: true,
        codEnabled: isSalon ? false : operationalForm.codEnabled,
        onlineEnabled: operationalForm.onlineEnabled
      },
      socials: {
        whatsapp: (operationalForm.whatsapp || '').trim(),
        instagram: (operationalForm.instagram || '').trim(),
        facebook: (operationalForm.facebook || '').trim(),
        twitter: (operationalForm.twitter || '').trim(),
        youtube: (operationalForm.youtube || '').trim()
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
    showToast(isSalon ? 'Salon Settings & Weekly Schedule Saved Live!' : 'Store Operational Details & Settings Saved Live!', 'success');
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

          <div className="flex items-center gap-4 flex-wrap">
            {/* Dukan Open/Close Switch */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={operationalForm.isOpen}
                onChange={(e) => {
                  const nextVal = e.target.checked;
                  setOperationalForm(prev => ({ ...prev, isOpen: nextVal }));
                  updateStoreSettings({ isOpen: nextVal });
                  showToast(nextVal ? '🟢 Dukan abhi LIVE OPEN kar di gayi!' : '🔴 Dukan abhi CLOSED mark kar di gayi! Website par Store Closed banner show ho gaya hai.', nextVal ? 'success' : 'warning');
                }}
                className="sr-only peer"
              />
              <div className="w-10 h-5.5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-emerald-600 relative"></div>
              <span className={`text-xs font-black ${operationalForm.isOpen ? 'text-emerald-700' : 'text-zinc-400'}`}>
                {operationalForm.isOpen ? 'STORE OPEN' : 'STORE CLOSED'}
              </span>
            </label>

            {/* ChuruOne Marketplace Visibility Toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none bg-stone-50 px-2.5 py-1 rounded-xl border border-stone-200">
              <input
                type="checkbox"
                checked={operationalForm.marketplaceVisible}
                onChange={async (e) => {
                  const nextVal = e.target.checked;
                  setOperationalForm(prev => ({ ...prev, marketplaceVisible: nextVal }));
                  try {
                    await fetch(`${API_BASE}/api/platform/stores/${storeId}/toggle-marketplace`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ visible: nextVal })
                    });
                    await updateStoreSettings({ marketplaceVisible: nextVal });
                    showToast(nextVal ? '✅ Dukan ChuruOne par LIVE kar di gayi!' : '⚪ Dukan ChuruOne se HIDE kar di gayi.', 'success');
                  } catch (err) {
                    console.error('Marketplace visibility toggle error:', err);
                    showToast('Error syncing marketplace visibility', 'error');
                  }
                }}
                className="sr-only peer"
              />
              <div className="w-10 h-5.5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-indigo-600 relative"></div>
              <span className={`text-xs font-black ${operationalForm.marketplaceVisible ? 'text-indigo-700' : 'text-zinc-400'}`}>
                {operationalForm.marketplaceVisible ? 'LIVE ON CHURUONE' : 'HIDDEN FROM CHURUONE'}
              </span>
            </label>
          </div>
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

        {/* 7-DAY WEEKLY SCHEDULE & TIMING MANAGER (With Dropdown Pickers & Auto-Sync) */}
        <div className="space-y-4 bg-[#FFFBF7] p-4 sm:p-5 rounded-2xl border border-zinc-200/70 shadow-2xs">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200/60 pb-3">
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#DC2626]" />
                <span>Weekly Working Days & Timing Manager (साप्ताहिक कार्य समय एवं अवकाश)</span>
              </h4>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Dropdown se hour, minute aur AM/PM select karein. Website ka "Open Till" text aur timings apne aap update honge.
              </p>
            </div>
          </div>

          {/* Master Store Default Timing & Auto-Sync Section */}
          <div className="p-3.5 bg-white rounded-xl border border-zinc-200/80 shadow-2xs space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-black text-zinc-900 uppercase flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#DC2626]" />
                  <span>Master Store Timings (दुकान खुलने व बंद होने का मुख्य समय)</span>
                </span>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  Opening aur closing time select karein — "Apply" dabate hi sabhi din aur "Open Till" banner auto-update ho jayenge.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setWeeklySchedule(prev => {
                    const updated = { ...prev };
                    DAYS_OF_WEEK.forEach(d => {
                      if (updated[d.key]?.isOpen) {
                        updated[d.key] = { ...updated[d.key], open: defaultOpenTime, close: defaultCloseTime };
                      }
                    });
                    return updated;
                  });
                  setOperationalForm(prev => ({
                    ...prev,
                    timing: `Open Daily: ${defaultOpenTime} – ${defaultCloseTime}`,
                    openTillText: `OPEN TILL ${defaultCloseTime}`
                  }));
                  showToast(`Sabhi working days aur "Open Till ${defaultCloseTime}" auto-sync ho gaya!`, 'success');
                }}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-black text-white text-[11px] font-black uppercase tracking-wider cursor-pointer shadow-xs transition-transform active:scale-95 border-0 whitespace-nowrap"
              >
                Apply to All Days & Sync
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-1 border-t border-zinc-100">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-zinc-600 uppercase">Khulne ka samay (Open):</span>
                <TimeSelectPicker 
                  value={defaultOpenTime} 
                  onChange={(val) => {
                    setDefaultOpenTime(val);
                    setOperationalForm(prev => ({
                      ...prev,
                      timing: `Open Daily: ${val} – ${defaultCloseTime}`
                    }));
                  }} 
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-zinc-600 uppercase">Band hone ka samay (Close):</span>
                <TimeSelectPicker 
                  value={defaultCloseTime} 
                  onChange={(val) => {
                    setDefaultCloseTime(val);
                    setOperationalForm(prev => ({
                      ...prev,
                      timing: `Open Daily: ${defaultOpenTime} – ${val}`,
                      openTillText: `OPEN TILL ${val}`
                    }));
                  }} 
                />
              </div>

              <div className="text-[11px] text-zinc-500 font-mono bg-zinc-100 px-2.5 py-1 rounded-lg">
                Auto Open Till: <strong className="text-[#DC2626]">OPEN TILL {defaultCloseTime}</strong>
              </div>
            </div>
          </div>

          {/* 7 Days Row List */}
          <div className="grid grid-cols-1 gap-2 pt-1">
            {DAYS_OF_WEEK.map(day => {
              const sched = weeklySchedule[day.key] || { isOpen: true, open: '11:00 AM', close: '11:00 PM' };
              return (
                <div
                  key={day.key}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl transition-all ${
                    sched.isOpen ? 'bg-white shadow-2xs border border-zinc-200/60' : 'bg-red-50/50 border border-red-100'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-[170px]">
                    <button
                      type="button"
                      onClick={() => {
                        const nextOpen = !sched.isOpen;
                        const nextSched = {
                          ...weeklySchedule,
                          [day.key]: { ...sched, isOpen: nextOpen }
                        };
                        setWeeklySchedule(nextSched);
                        updateStoreSettings({ weeklySchedule: nextSched });
                        showToast(`${day.label} ab ${nextOpen ? 'OPEN' : 'OFF (CLOSED)'} set kar diya gaya!`, 'info');
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
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase">From:</span>
                        <TimeSelectPicker
                          value={sched.open || '11:00 AM'}
                          onChange={(val) => {
                            setWeeklySchedule(prev => ({
                              ...prev,
                              [day.key]: { ...sched, open: val }
                            }));
                          }}
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase">To:</span>
                        <TimeSelectPicker
                          value={sched.close || '11:00 PM'}
                          onChange={(val) => {
                            setWeeklySchedule(prev => ({
                              ...prev,
                              [day.key]: { ...sched, close: val }
                            }));
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] font-bold text-red-600 flex items-center gap-1">
                      <span>Weekly Off (इस दिन दुकान बंद रहेगी)</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Store Physical Address & Customer Helpline Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          <div>
            <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#DC2626]" />
              <span>Customer Helpline Phone / Support Number</span>
            </label>
            <input
              type="text"
              value={operationalForm.phoneDisplay}
              onChange={(e) => setOperationalForm({ ...operationalForm, phoneDisplay: e.target.value })}
              placeholder={isSalon ? "e.g. 0300-1234567" : "e.g. 7023963189"}
              className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-3 text-sm text-zinc-900 font-bold focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
            />
            <span className="text-[10px] text-zinc-400 mt-1 block">
              Website ke top bar aur footer me helpline no. live update hoga.
            </span>
          </div>
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

        {/* Quality / Freshness Badge Text (Restaurant only - strictly hidden for Salon & Fashion) */}
        {hasFood && (
          <div>
            <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
              Food Quality / Freshness Badge Text
            </label>
            <input
              type="text"
              value={operationalForm.halalBadgeText}
              onChange={(e) => setOperationalForm({ ...operationalForm, halalBadgeText: e.target.value })}
              placeholder="e.g. 100% Fresh & Authentic"
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

        {/* Social Media & Customer Connection Links */}
        <div className="bg-[#FFFBF7] p-4 sm:p-5 rounded-2xl space-y-3.5 border border-zinc-200/70 shadow-2xs">
          <div className="border-b border-zinc-200/60 pb-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
              <Share2 className="w-4 h-4 text-[#DC2626]" />
              <span>Social Media & Connectivity Links (सोशल मीडिया हैंडल्स)</span>
            </h4>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Aapki dukan ke sabhi social media links yahan dalein — ye sabhi official icons ke sath website footer me live dikhenge.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
            {/* WhatsApp */}
            <div>
              <label className="block text-[10px] font-black text-zinc-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp Number</span>
              </label>
              <input
                type="text"
                value={operationalForm.whatsapp}
                onChange={(e) => setOperationalForm({ ...operationalForm, whatsapp: e.target.value })}
                placeholder={isSalon ? "e.g. 923001234567" : "e.g. 7023963189"}
                className="w-full bg-white rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 focus:ring-2 focus:ring-[#DC2626] border-0 shadow-2xs font-mono"
              />
            </div>

            {/* Instagram */}
            <div>
              <label className="block text-[10px] font-black text-zinc-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Instagram className="w-3.5 h-3.5 text-pink-600" />
                <span>Instagram Profile Link</span>
              </label>
              <input
                type="text"
                value={operationalForm.instagram}
                onChange={(e) => setOperationalForm({ ...operationalForm, instagram: e.target.value })}
                placeholder="e.g. https://instagram.com/shawarmanights_churu"
                className="w-full bg-white rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 focus:ring-2 focus:ring-[#DC2626] border-0 shadow-2xs"
              />
            </div>

            {/* Facebook */}
            <div>
              <label className="block text-[10px] font-black text-zinc-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Facebook className="w-3.5 h-3.5 text-blue-600" />
                <span>Facebook Page Link</span>
              </label>
              <input
                type="text"
                value={operationalForm.facebook}
                onChange={(e) => setOperationalForm({ ...operationalForm, facebook: e.target.value })}
                placeholder="e.g. https://facebook.com/shawarmanights"
                className="w-full bg-white rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 focus:ring-2 focus:ring-[#DC2626] border-0 shadow-2xs"
              />
            </div>

            {/* Twitter / X */}
            <div>
              <label className="block text-[10px] font-black text-zinc-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Twitter className="w-3.5 h-3.5 text-zinc-900" />
                <span>Twitter / X Profile Link</span>
              </label>
              <input
                type="text"
                value={operationalForm.twitter}
                onChange={(e) => setOperationalForm({ ...operationalForm, twitter: e.target.value })}
                placeholder="e.g. https://x.com/shawarmanights"
                className="w-full bg-white rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 focus:ring-2 focus:ring-[#DC2626] border-0 shadow-2xs"
              />
            </div>

            {/* YouTube */}
            <div>
              <label className="block text-[10px] font-black text-zinc-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Youtube className="w-3.5 h-3.5 text-red-600" />
                <span>YouTube Channel Link</span>
              </label>
              <input
                type="text"
                value={operationalForm.youtube}
                onChange={(e) => setOperationalForm({ ...operationalForm, youtube: e.target.value })}
                placeholder="e.g. https://youtube.com/@shawarmanights"
                className="w-full bg-white rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 focus:ring-2 focus:ring-[#DC2626] border-0 shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* Delivery Note & Kitchen Location Note (Food / Restaurant only) */}
        {!isSalon && hasFood && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
                "Still Hungry" Banner Open Till Text
              </label>
              <input
                type="text"
                value={operationalForm.openTillText}
                onChange={(e) => setOperationalForm({ ...operationalForm, openTillText: e.target.value })}
                placeholder="e.g. OPEN TILL 4:00 AM or OPEN TILL 2:00 AM"
                className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-3 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0 font-bold"
              />
              <span className="text-[10px] text-zinc-400 mt-1 block">
                Website ke Still Hungry section ke upar jo pill badge dikhta hai, wo yahan se dynamically update hoga.
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
                Kitchen Location Subtext / Delivery Note
              </label>
              <input
                type="text"
                value={operationalForm.locationNote}
                onChange={(e) => setOperationalForm({ ...operationalForm, locationNote: e.target.value })}
                placeholder="e.g. Central hub kitchen with 30-45 min local delivery"
                className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-3 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
              />
            </div>
          </div>
        )}

        {/* OWNER & FOUNDER PROFILE (Bug 6 & Dukandar 8) */}
        <div className="bg-[#FFFBF7] p-4 sm:p-5 rounded-2xl space-y-3.5 border-0">
          <h4 className="text-xs font-black uppercase tracking-wider text-[#DC2626] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Dukan Malik / Founder Profile (वेबसाइट पर प्रदर्शित करने हेतु)</span>
          </h4>
          <p className="text-[11px] text-zinc-500">
            Aapki dukan ke About section me malik/founder ki jankari aur craftsmanship story yahan se display hogi.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-zinc-600 uppercase mb-1">
                Section Eyebrow Subtitle (जैसे: THE MASTER CRAFTSMAN)
              </label>
              <input
                type="text"
                value={operationalForm.ownerEyebrow || ''}
                onChange={(e) => setOperationalForm({ ...operationalForm, ownerEyebrow: e.target.value })}
                placeholder={isSalon ? "THE MASTER CRAFTSMAN" : "THE ARTISAN CHEF"}
                className="w-full bg-white rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 font-bold focus:ring-2 focus:ring-[#DC2626] border-0 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-600 uppercase mb-1">
                Founder Headline (जैसे: Artistry in Every Cut, Precision in Every Fade.)
              </label>
              <input
                type="text"
                value={operationalForm.ownerHeadline || ''}
                onChange={(e) => setOperationalForm({ ...operationalForm, ownerHeadline: e.target.value })}
                placeholder={isSalon ? "Artistry in Every Cut, Precision in Every Fade." : "Crafting Traditional Charcoal Shawarma with Passion."}
                className="w-full bg-white rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 font-bold focus:ring-2 focus:ring-[#DC2626] border-0 shadow-2xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-zinc-600 uppercase mb-1">
                Owner / Founder Name
              </label>
              <input
                type="text"
                value={operationalForm.ownerName}
                onChange={(e) => setOperationalForm({ ...operationalForm, ownerName: e.target.value })}
                placeholder="e.g. Furkan & Team"
                className="w-full bg-white rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 font-bold focus:ring-2 focus:ring-[#DC2626] border-0 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-600 uppercase mb-1">
                Role / Title
              </label>
              <input
                type="text"
                value={operationalForm.ownerRole}
                onChange={(e) => setOperationalForm({ ...operationalForm, ownerRole: e.target.value })}
                placeholder="e.g. Founder & Head Chef"
                className="w-full bg-white rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 focus:ring-2 focus:ring-[#DC2626] border-0 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-600 uppercase mb-1">
                Founded Year (स्थापना वर्ष)
              </label>
              <input
                type="text"
                value={operationalForm.foundedYear}
                onChange={(e) => setOperationalForm({ ...operationalForm, foundedYear: e.target.value })}
                placeholder="e.g. 2024"
                className="w-full bg-white rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 font-bold focus:ring-2 focus:ring-[#DC2626] border-0 shadow-2xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-600 uppercase mb-1">
              Founder Story & Craftsmanship Bio (संक्षिप्त परिचय)
            </label>
            <textarea
              rows={2}
              value={operationalForm.ownerBio}
              onChange={(e) => setOperationalForm({ ...operationalForm, ownerBio: e.target.value })}
              placeholder="Dukan ke safar aur authentic recipe ke baare me 1-2 line..."
              className="w-full bg-white rounded-xl p-3 text-xs text-zinc-900 focus:ring-2 focus:ring-[#DC2626] border-0 shadow-2xs resize-none"
            />
          </div>

          {/* FOUNDER / STYLIST CARD MEDIA (PHOTO & VIDEO CUSTOMIZER) */}
          <div className="pt-3 border-t border-zinc-200/60 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <label className="block text-[11px] font-black text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-[#DC2626]" />
                  <span>FOUNDER / STYLIST CARD PHOTO YA VIDEO (कार्ड मीडिया)</span>
                </label>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  Is black badge card ke andar apni ya apne master stylist ki portrait photo ya looping video lagayein.
                </p>
              </div>
              {operationalForm.ownerMediaUrl && (
                <button
                  type="button"
                  onClick={() => setOperationalForm(prev => ({ ...prev, ownerMediaUrl: '' }))}
                  className="text-[10px] font-black text-red-600 hover:text-red-700 underline cursor-pointer border-0 bg-transparent uppercase tracking-wider"
                >
                  ✕ Remove Media (Default Gradient)
                </button>
              )}
            </div>

            {/* Live Interactive Preview of the Stylist Card */}
            <div className="relative rounded-2xl overflow-hidden border border-amber-500/40 shadow-lg bg-[#0a0d14] max-w-sm mx-auto aspect-[16/11] flex flex-col justify-end p-5">
              {operationalForm.ownerMediaUrl ? (
                (() => {
                  const lower = (operationalForm.ownerMediaUrl || '').toLowerCase();
                  const isVid = lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.mov') || lower.startsWith('data:video');
                  return isVid ? (
                    <video
                      key={operationalForm.ownerMediaUrl}
                      src={operationalForm.ownerMediaUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      key={operationalForm.ownerMediaUrl}
                      src={operationalForm.ownerMediaUrl}
                      alt="Stylist Card Preview"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  );
                })()
              ) : null}

              {/* Cinematic Vignette Overlay */}
              <div
                className="absolute inset-0 pointer-events-none z-[1]"
                style={{
                  background: operationalForm.ownerMediaUrl
                    ? "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0.2) 100%)"
                    : "radial-gradient(circle at 50% 30%, rgba(212,175,55,0.18) 0%, rgba(0,0,0,0.92) 80%)"
                }}
              />

              {/* Badge Overlay Content */}
              <div className="relative z-[2] text-left">
                <div className="w-8 h-8 rounded-full bg-amber-500/15 border border-amber-500/40 flex items-center justify-center mb-2">
                  <Scissors className="w-4 h-4 text-amber-400" />
                </div>
                <span className="text-[9px] font-extrabold tracking-widest uppercase text-amber-400 block">
                  ESTABLISHED {operationalForm.foundedYear || "2023"}
                </span>
                <h4 className="text-base font-black text-white uppercase tracking-wide font-serif leading-tight my-0.5">
                  {operationalForm.ownerName || "Naushad Ali"}
                </h4>
                <div className="text-[11px] text-zinc-300 font-semibold">
                  {operationalForm.ownerRole || "Master Stylist & Founder"}
                </div>
              </div>
            </div>

            {/* Upload Controls & URL Input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[10px] font-bold text-zinc-600 uppercase mb-1">
                  Device se Upload karein (Photo ya Video):
                </label>
                <label className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-dashed border-zinc-300 hover:border-[#DC2626] text-zinc-700 hover:text-[#DC2626] text-xs font-bold cursor-pointer transition-colors shadow-2xs">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isOwnerMediaUploading ? "Uploading File..." : "Choose Photo or Video"}</span>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleOwnerMediaUpload}
                    disabled={isOwnerMediaUploading}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-600 uppercase mb-1">
                  Ya Direct Image/Video URL enter karein:
                </label>
                <input
                  type="text"
                  value={operationalForm.ownerMediaUrl || ''}
                  onChange={(e) => setOperationalForm({ ...operationalForm, ownerMediaUrl: e.target.value })}
                  placeholder="https://... photo.jpg ya video.mp4"
                  className="w-full bg-white rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 focus:ring-2 focus:ring-[#DC2626] border-0 shadow-2xs font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* PAYMENT MODES TOGGLES (Dukandar 9: COD + Online Payment Switches) */}
        {!isSalon && (
          <div className="bg-[#FFFBF7] p-4 sm:p-5 rounded-2xl space-y-3.5 border-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-200/60 pb-3 gap-2">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-[#DC2626]" />
                  <span>Checkout Payment Methods (भुगतान विकल्प)</span>
                </h4>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Customer ko checkout par kaunse payment options dikhane hain yahan se set karein.
                </p>
              </div>

              {/* Quick 3-Mode Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setOperationalForm(prev => ({ ...prev, codEnabled: true, onlineEnabled: true }));
                    showToast('Both Payment Methods (COD + Online UPI) Enabled!', 'success');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer border-0 ${
                    operationalForm.codEnabled && operationalForm.onlineEnabled
                      ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-600'
                      : 'bg-white hover:bg-zinc-100 text-zinc-700 shadow-2xs'
                  }`}
                >
                  🟢 Dono (Both)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOperationalForm(prev => ({ ...prev, codEnabled: false, onlineEnabled: true }));
                    showToast('Sirf Online UPI/QR Payment Enabled!', 'success');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer border-0 ${
                    !operationalForm.codEnabled && operationalForm.onlineEnabled
                      ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-600'
                      : 'bg-white hover:bg-zinc-100 text-zinc-700 shadow-2xs'
                  }`}
                >
                  ⚡ Sirf Online
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOperationalForm(prev => ({ ...prev, codEnabled: true, onlineEnabled: false }));
                    showToast('Sirf Cash on Delivery (COD) Enabled!', 'success');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer border-0 ${
                    operationalForm.codEnabled && !operationalForm.onlineEnabled
                      ? 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-600'
                      : 'bg-white hover:bg-zinc-100 text-zinc-700 shadow-2xs'
                  }`}
                >
                  💵 Sirf Cash (COD)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* 1. Cash on Delivery (COD) Switch */}
              <div className={`p-3.5 rounded-xl transition-all flex items-center justify-between ${
                operationalForm.codEnabled ? 'bg-white shadow-2xs border border-emerald-100' : 'bg-zinc-100/70 opacity-75'
              }`}>
                <div>
                  <span className="text-xs font-black text-zinc-900 block">Cash on Delivery (COD)</span>
                  <span className="text-[10px] text-zinc-500">Rider ko ghar par cash bhugtan</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={operationalForm.codEnabled}
                    onChange={(e) => {
                      const nextVal = e.target.checked;
                      if (!nextVal && !operationalForm.onlineEnabled) {
                        showToast('Dono options band nahi kar sakte! Kam se kam Online UPI chalu rehna chahiye.', 'error');
                        return;
                      }
                      setOperationalForm(prev => ({ ...prev, codEnabled: nextVal }));
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5.5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-emerald-600 relative"></div>
                </label>
              </div>

              {/* 2. Online Payment (UPI / QR) Switch */}
              <div className={`p-3.5 rounded-xl transition-all flex items-center justify-between ${
                operationalForm.onlineEnabled ? 'bg-white shadow-2xs border border-emerald-100' : 'bg-zinc-100/70 opacity-75'
              }`}>
                <div>
                  <span className="text-xs font-black text-zinc-900 block">Online Payment (UPI / QR)</span>
                  <span className="text-[10px] text-zinc-500">Instant QR & Netbanking auto-verify</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={operationalForm.onlineEnabled}
                    onChange={(e) => {
                      const nextVal = e.target.checked;
                      if (!nextVal && !operationalForm.codEnabled) {
                        showToast('Dono options band nahi kar sakte! Kam se kam COD chalu rehna chahiye.', 'error');
                        return;
                      }
                      setOperationalForm(prev => ({ ...prev, onlineEnabled: nextVal }));
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5.5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-emerald-600 relative"></div>
                </label>
              </div>
            </div>
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
