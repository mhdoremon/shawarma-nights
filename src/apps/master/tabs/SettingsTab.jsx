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
    user
  } = useMaster();

  // Switch Store Dialog Modal State
  const [showSwitchStoreModal, setShowSwitchStoreModal] = useState(false);
  const [targetStoreInput, setTargetStoreInput] = useState(storeId || 'shawarma');

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
  const isSalon = storeInfo?.vertical === 'salon' || (storeId || '').includes('nash');

  const [operationalForm, setOperationalForm] = useState({
    name: storeInfo?.name || (isSalon ? 'Nash Studio' : 'Shawarma Nights'),
    tagline: storeInfo?.tagline || (isSalon ? 'PRECISION GROOMING. BINA INTEZAAR KE.' : 'Original Charcoal Shawarma & Rolls'),
    heroTagline: storeInfo?.heroTagline || (isSalon ? 'PRECISION GROOMING. BINA INTEZAAR KE.' : ''),
    heroButtonText: storeInfo?.heroButtonText || (isSalon ? 'BOOK APPOINTMENT NOW' : ''),
    heroVideoUrl: storeInfo?.heroVideoUrl || '/video/hero.mp4',
    bookingFee: storeInfo?.bookingFee !== undefined ? String(storeInfo.bookingFee) : '50',
    monSatHours: storeInfo?.monSatHours || '11:00 AM to 11:00 PM',
    sundayHours: storeInfo?.sundayHours || 'Closed',
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

      const pay = storeInfo.payment || {};
      const soc = storeInfo.socials || {};
      setOperationalForm(prev => ({
        ...prev,
        name: storeInfo.name || prev.name,
        tagline: storeInfo.tagline || prev.tagline,
        heroTagline: storeInfo.heroTagline || prev.heroTagline,
        heroButtonText: storeInfo.heroButtonText || prev.heroButtonText,
        heroVideoUrl: storeInfo.heroVideoUrl || prev.heroVideoUrl,
        bookingFee: storeInfo.bookingFee !== undefined ? String(storeInfo.bookingFee) : prev.bookingFee,
        monSatHours: storeInfo.monSatHours || prev.monSatHours,
        sundayHours: storeInfo.sundayHours || prev.sundayHours,
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
    await updateStoreSettings({
      name: operationalForm.name,
      tagline: operationalForm.tagline,
      heroTagline: operationalForm.heroTagline,
      heroButtonText: operationalForm.heroButtonText,
      heroVideoUrl: operationalForm.heroVideoUrl,
      bookingFee: Number(operationalForm.bookingFee) || 50,
      monSatHours: operationalForm.monSatHours,
      sundayHours: operationalForm.sundayHours,
      timing: operationalForm.timing,
      address: operationalForm.address,
      deliveryNote: operationalForm.deliveryNote,
      halalBadgeText: operationalForm.halalBadgeText,
      aboutText: operationalForm.aboutText,
      isOpen: operationalForm.isOpen,
      deliveryFee: Number(operationalForm.deliveryFee),
      showHeroBanner,
      showOfferCards,
      showMarqueeStrip: showHeroBanner,
      dealsEnabled: showOfferCards,
      payment: {
        upiId: operationalForm.upiId.trim(),
        payeeName: operationalForm.payeeName.trim(),
        autoSmsVerification: true,
        codEnabled: operationalForm.codEnabled
      },
      socials: {
        whatsapp: operationalForm.whatsapp.trim(),
        instagram: operationalForm.instagram.trim()
      }
    });
    showToast(isSalon ? 'Salon Settings & Hero Video Saved Live!' : 'Store Operational Details & UPI Saved!', 'success');
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

  // 5. SWITCH STORE ACTION
  const handleSwitchStore = () => {
    const cleanId = (targetStoreInput || 'shawarma').trim().toLowerCase();
    switchStoreId(cleanId);
    setShowSwitchStoreModal(false);
    refreshData();
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

      {/* CARD 1: ACTIVE DUKAN / STORE ID SWITCHER */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xl space-y-4 border-0">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-[#DC2626] flex items-center gap-2">
              <Store className="w-4 h-4 text-[#DC2626]" />
              <span>ACTIVE DUKAN / STORE ID</span>
            </h3>
            <p className="text-sm font-bold text-zinc-800 mt-1">
              Connected Store: <span className="font-mono text-[#DC2626] bg-red-50 px-2 py-0.5 rounded-lg font-black">[{storeId}]</span>
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">
              Website, real-time gateway and customer orders are live synced to this store ID
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowSwitchStoreModal(true)}
            className="px-5 py-2.5 rounded-full bg-sky-600 hover:bg-sky-700 text-white font-black text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer border-0 shrink-0"
          >
            SWITCH DUKAN / STORE ID (बदलें)
          </button>
        </div>
      </div>

      {/* CARD 2: SERVER CONNECTION & WI-FI IP */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xl space-y-4 border-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-500 flex items-center gap-2">
              <Wifi className="w-4 h-4 text-sky-600" />
              <span>SERVER CONNECTION & WI-FI IP</span>
            </h3>
            <div className="flex items-center gap-2 mt-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="text-sm font-black text-zinc-900">
                {isConnected ? 'Connected | Gateway SIM Active' : 'Retrying / Offline Fallback Active'}
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5 font-mono">
              Server Host: https://churuone-backend.onrender.com
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              refreshData();
              showToast('Syncing orders and catalog with server...', 'info');
            }}
            className="px-5 py-2.5 rounded-full bg-[#DC2626] hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer border-0 shrink-0 self-start sm:self-center"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>RECONNECT / REFRESH CONNECTION</span>
          </button>
        </div>
      </div>

      {/* CARD: SMART MODULAR FEATURE CONNECTIONS (MODULE TOGGLES) */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xl space-y-5 border-0">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3.5">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-[#DC2626] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#DC2626]" />
              <span>SMART FEATURE CONNECTIONS (स्मार्ट ऑन / ऑफ़ टॉगल)</span>
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              Website aur portal par kaunse modules connect karne hain aur kaunse band rakhne hain yahan se 1-click me control karein
            </p>
          </div>
          <span className="text-[10px] px-2.5 py-1 rounded-full bg-zinc-100 font-mono font-bold text-zinc-600 uppercase">
            Store: [{storeId}]
          </span>
        </div>

        <div className="space-y-3">
          
          {/* TOGGLE 1: HERO PROMOTIONAL BANNER & MARQUEE */}
          <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-[#FFFBF7] shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-zinc-900">
                  Homepage Hero Promotional Banner & Marquee Strip
                </span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${showHeroBanner ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-200 text-zinc-600'}`}>
                  {showHeroBanner ? '🟢 ON (CONNECTED)' : '🔴 OFF (TOGGLED OFF)'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Website ke main header par restaurant-style bada banner aur offer strip chalana ya band rakhna. (Nash Studio ke liye filhal band rakha gaya hai).
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                checked={showHeroBanner}
                onChange={async (e) => {
                  const val = e.target.checked;
                  setShowHeroBanner(val);
                  await updateStoreSettings({ showHeroBanner: val, showMarqueeStrip: val });
                  showToast(val ? 'Hero Banner Connection Toggled ON' : 'Hero Banner Connection Toggled OFF', val ? 'success' : 'info');
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#DC2626]"></div>
            </label>
          </div>

          {/* TOGGLE 2: SPECIAL OFFER CARDS & DEALS */}
          <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-[#FFFBF7] shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-zinc-900">
                  Special Offer Cards & Deals Module
                </span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${showOfferCards ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-200 text-zinc-600'}`}>
                  {showOfferCards ? '🟢 ON (CONNECTED)' : '🔴 OFF (TOGGLED OFF)'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Website par discount offer cards, coupon codes (`NIGHT50`) aur deals card dikhana ya band rakhna. (Nash Studio ke liye filhal band rakha gaya hai).
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                checked={showOfferCards}
                onChange={async (e) => {
                  const val = e.target.checked;
                  setShowOfferCards(val);
                  await updateStoreSettings({ showOfferCards: val, dealsEnabled: val });
                  showToast(val ? 'Offers & Deals Connection Toggled ON' : 'Offer Cards Connection Toggled OFF', val ? 'success' : 'info');
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#DC2626]"></div>
            </label>
          </div>

        </div>
      </div>

      {/* CARD 3: FREE DELIVERY THRESHOLD */}
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

      {/* CARD 4: TAXES & CHARGES (GST & PACKAGING CONTROLS) */}
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

        {/* Hero Tagline / Slogan & CTA Button Text */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
              Hero Tagline / Slogan (वेबसाइट स्लोगन)
            </label>
            <input
              type="text"
              value={operationalForm.heroTagline}
              onChange={(e) => setOperationalForm({ ...operationalForm, heroTagline: e.target.value })}
              placeholder={isSalon ? "e.g. PRECISION GROOMING. BINA INTEZAAR KE." : "e.g. Authentic Charcoal Shawarma"}
              className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-3 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
              Hero CTA Button Text (मुख्य बटन का नाम)
            </label>
            <input
              type="text"
              value={operationalForm.heroButtonText}
              onChange={(e) => setOperationalForm({ ...operationalForm, heroButtonText: e.target.value })}
              placeholder={isSalon ? "e.g. BOOK APPOINTMENT NOW" : "e.g. ORDER NOW"}
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
              placeholder="e.g. 7023963189@paytm"
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
              placeholder="e.g. Shawarma Nights"
              className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-3 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
            />
          </div>
        </div>

        {/* Working Hours & Store Kitchen Address */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
              Store Working Hours (Timings)
            </label>
            <input
              type="text"
              value={operationalForm.timing}
              onChange={(e) => setOperationalForm({ ...operationalForm, timing: e.target.value })}
              placeholder={isSalon ? "Mon-Sat: 11:00 AM – 11:00 PM | Sun: Closed" : "Open Daily: 12:00 PM – 04:00 AM"}
              className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-3 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
            />
          </div>

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
        </div>

        {/* Advance Chair Booking Fee (₹) & Day-Wise Timings */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
              Advance Chair Booking Fee (₹)
            </label>
            <input
              type="number"
              value={operationalForm.bookingFee}
              onChange={(e) => setOperationalForm({ ...operationalForm, bookingFee: e.target.value })}
              placeholder="50"
              className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-3 text-sm text-zinc-900 font-bold focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
            />
            <span className="text-[10px] text-zinc-500 mt-1 block">Salon slot book karte waqt customer se li jane wali fee</span>
          </div>

          <div>
            <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
              Mon-Sat Hours
            </label>
            <input
              type="text"
              value={operationalForm.monSatHours}
              onChange={(e) => setOperationalForm({ ...operationalForm, monSatHours: e.target.value })}
              placeholder="11:00 AM to 11:00 PM"
              className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-3 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
              Sunday Hours
            </label>
            <input
              type="text"
              value={operationalForm.sundayHours}
              onChange={(e) => setOperationalForm({ ...operationalForm, sundayHours: e.target.value })}
              placeholder="Closed"
              className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-3 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
            />
          </div>
        </div>

        {/* Delivery Note & Halal Badge Text */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          <div>
            <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
              Halal Badge Text
            </label>
            <input
              type="text"
              value={operationalForm.halalBadgeText}
              onChange={(e) => setOperationalForm({ ...operationalForm, halalBadgeText: e.target.value })}
              placeholder="100% Halal Certified Fresh"
              className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-3 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
            />
          </div>
        </div>

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
              placeholder="e.g. 7023963189"
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
              placeholder="e.g. https://instagram.com/shawarmanights_churu"
              className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-3 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
            />
          </div>
        </div>

        {/* Accept Cash on Delivery Switch */}
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

        <button
          type="submit"
          className="w-full py-3.5 rounded-full bg-[#DC2626] hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-xl border-0"
        >
          <Check className="w-4 h-4 stroke-[2.5]" />
          <span>SAVE & SYNC TO SERVER</span>
        </button>
      </form>

      {/* CARD: HERO BACKGROUND VIDEO MANAGER (SALON / SHOWCASE SITES) */}
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

      {/* CARD 6: HOMEPAGE HERO BANNER & MARQUEE STRIP COPY */}
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

      {/* CARD 7: KITCHEN ORDER CHIME AUDIO TEST */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xl space-y-4 border-0">
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-zinc-500 flex items-center gap-2">
            <Bell className="w-4 h-4 text-emerald-600" />
            <span>KITCHEN ORDER CHIME AUDIO TEST</span>
          </h3>
          <p className="text-xs text-zinc-500 mt-1">
            Plays a synthesized 3-tone notification chime immediately when a new customer order arrives
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              playOrderSound();
              showToast('Test kitchen chime played!', 'info');
            }}
            className="px-5 py-2.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-xs font-black text-zinc-800 transition-colors cursor-pointer border-0"
          >
            TEST KITCHEN ALERT CHIME
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

      {/* SWITCH STORE ID MODAL */}
      {showSwitchStoreModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 sm:p-7 space-y-4 shadow-2xl border-0">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-base font-black text-zinc-900 flex items-center gap-2">
                <Store className="w-4 h-4 text-[#DC2626]" />
                <span>Switch Store / Dukan ID</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowSwitchStoreModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-600 border-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-500">
              Enter the Store ID of the shop you want to manage (e.g. shawarma, pizza, fashion):
            </p>

            <div className="flex items-center gap-1.5 flex-wrap">
              {['shawarma', 'pizza', 'burger', 'fashion'].map(id => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTargetStoreInput(id)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all border-0 ${
                    targetStoreInput === id ? 'bg-[#DC2626] text-white' : 'bg-[#FFFBF7] text-zinc-600'
                  }`}
                >
                  {id}
                </button>
              ))}
            </div>

            <input
              type="text"
              autoFocus
              value={targetStoreInput}
              onChange={(e) => setTargetStoreInput(e.target.value.toLowerCase())}
              placeholder="store id (lowercase)"
              className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-3 text-sm text-zinc-900 font-mono focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSwitchStore}
                className="flex-1 py-3 rounded-full bg-sky-600 hover:bg-sky-700 text-white font-black text-xs uppercase tracking-wider shadow-md border-0 cursor-pointer"
              >
                Switch & Connect
              </button>
              <button
                type="button"
                onClick={() => setShowSwitchStoreModal(false)}
                className="py-3 px-5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs border-0 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
