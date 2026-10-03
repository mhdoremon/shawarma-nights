import React, { useState } from 'react';
import { useMaster } from '../context/MasterContext';
import { Store, CreditCard, Sparkles, Volume2, VolumeX, LogOut, Check, Sliders, DollarSign, Bell } from 'lucide-react';
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
    storeId 
  } = useMaster();

  // Store General Settings Form
  const [generalForm, setGeneralForm] = useState({
    name: storeInfo?.name || 'Shawarma Nights',
    tagline: storeInfo?.tagline || 'Original Charcoal Shawarma & Rolls',
    phone: storeInfo?.phone || '7023963189',
    address: storeInfo?.address || 'Near Railway Station, Churu, Rajasthan',
    isOpen: storeInfo?.isOpen !== false,
    deliveryFee: storeInfo?.deliveryFee ?? 30,
    freeDeliveryThreshold: storeInfo?.freeDeliveryThreshold ?? 499,
    packagingCharge: storeInfo?.packagingCharge ?? 10,
    taxPercent: storeInfo?.taxPercent ?? 5,
    upiId: storeInfo?.payment?.upiId || storeInfo?.upiId || '7023963189@paytm',
    codEnabled: storeInfo?.payment?.codEnabled !== false
  });

  // Hero Banner & Marquee Form
  const [heroForm, setHeroForm] = useState({
    titleLine1: heroBanner?.titleLine1 || 'REAL',
    titleLine2: heroBanner?.titleLine2 || 'CHARCOAL',
    titleHighlight: heroBanner?.titleHighlight || 'SHAWARMA',
    subtitle: heroBanner?.subtitle || 'Slow-turned on glowing coals. Carved fresh. Wrapped in toasted saj bread with our legendary garlic toum.',
    badgeText: heroBanner?.badgeText || '50% OFF — NIGHT50',
    marqueeText: heroBanner?.marqueeText || '★ TAP HERE TO OWN A FRANCHISE ● ★ 3-6 MONTHS ROI ● ★ HIGH CASH FLOW ● ★ TURNKEY SETUP ● ★ LIMITED CITY SLOTS AVAILABLE ★'
  });

  const handleSaveGeneral = async (e) => {
    e.preventDefault();
    await updateStoreSettings({
      name: generalForm.name,
      tagline: generalForm.tagline,
      phone: generalForm.phone,
      address: generalForm.address,
      isOpen: generalForm.isOpen,
      deliveryFee: Number(generalForm.deliveryFee),
      freeDeliveryThreshold: Number(generalForm.freeDeliveryThreshold),
      packagingCharge: Number(generalForm.packagingCharge),
      taxPercent: Number(generalForm.taxPercent),
      payment: {
        upiId: generalForm.upiId,
        codEnabled: generalForm.codEnabled
      }
    });
  };

  const handleSaveHero = async (e) => {
    e.preventDefault();
    await updateHeroBanner(heroForm);
  };

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      
      {/* Settings Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white">Store & System Configuration</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Configure Dukan branding, delivery fees, merchant UPI, hero copy and audio chimes
          </p>
        </div>

        <button
          onClick={logout}
          className="px-4 py-2 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-red-500/50 text-red-400 hover:text-red-300 text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Exit / Logout</span>
        </button>
      </div>

      {/* SECTION 1: DUKAN PROFILE & OPERATIONAL SETTINGS */}
      <form onSubmit={handleSaveGeneral} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-5">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <Store className="w-4 h-4 text-[#DC2626]" />
            <span>Dukan Operational & Billing Settings</span>
          </h3>

          {/* Dukan Open/Close Switch */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={generalForm.isOpen}
              onChange={(e) => setGeneralForm({ ...generalForm, isOpen: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600 relative"></div>
            <span className={`text-xs font-black ${generalForm.isOpen ? 'text-emerald-400' : 'text-zinc-500'}`}>
              {generalForm.isOpen ? 'STORE OPEN' : 'STORE CLOSED'}
            </span>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
              Store / Dukan Name
            </label>
            <input
              type="text"
              required
              value={generalForm.name}
              onChange={(e) => setGeneralForm({ ...generalForm, name: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#DC2626]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
              Tagline / Subtext
            </label>
            <input
              type="text"
              value={generalForm.tagline}
              onChange={(e) => setGeneralForm({ ...generalForm, tagline: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#DC2626]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
              Official Contact Phone
            </label>
            <input
              type="tel"
              value={generalForm.phone}
              onChange={(e) => setGeneralForm({ ...generalForm, phone: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#DC2626]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
              Store Address
            </label>
            <input
              type="text"
              value={generalForm.address}
              onChange={(e) => setGeneralForm({ ...generalForm, address: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#DC2626]"
            />
          </div>
        </div>

        {/* UPI & Payments */}
        <div className="pt-2 border-t border-zinc-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
            <span>Payment & Charges Setup</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                Merchant UPI ID (for QR Payments)
              </label>
              <input
                type="text"
                value={generalForm.upiId}
                onChange={(e) => setGeneralForm({ ...generalForm, upiId: e.target.value })}
                placeholder="e.g. 7023963189@paytm"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-[#DC2626]"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 mt-5">
              <span className="text-xs font-bold text-white">Accept Cash on Delivery (COD)</span>
              <input
                type="checkbox"
                checked={generalForm.codEnabled}
                onChange={(e) => setGeneralForm({ ...generalForm, codEnabled: e.target.checked })}
                className="rounded bg-zinc-900 border-zinc-700 text-[#DC2626]"
              />
            </div>
          </div>

          {/* Delivery & Packaging Fees */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                Delivery Fee (₹)
              </label>
              <input
                type="number"
                value={generalForm.deliveryFee}
                onChange={(e) => setGeneralForm({ ...generalForm, deliveryFee: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#DC2626]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                Free Delivery Above (₹)
              </label>
              <input
                type="number"
                value={generalForm.freeDeliveryThreshold}
                onChange={(e) => setGeneralForm({ ...generalForm, freeDeliveryThreshold: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#DC2626]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                Packaging Fee (₹)
              </label>
              <input
                type="number"
                value={generalForm.packagingCharge}
                onChange={(e) => setGeneralForm({ ...generalForm, packagingCharge: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#DC2626]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                Tax / GST (%)
              </label>
              <input
                type="number"
                value={generalForm.taxPercent}
                onChange={(e) => setGeneralForm({ ...generalForm, taxPercent: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#DC2626]"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3.5 rounded-2xl bg-[#DC2626] hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
        >
          <Check className="w-4 h-4 stroke-[2.5]" />
          <span>Save Store Operational Settings</span>
        </button>
      </form>

      {/* SECTION 2: HERO BANNER & MARQUEE TEXT SETTINGS */}
      <form onSubmit={handleSaveHero} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-5">
        <div className="border-b border-zinc-800 pb-3">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Homepage Hero Banner & Marquee Strip Copy</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Customize the main headline and the scrolling ticker strip at top of website
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
              Title Line 1
            </label>
            <input
              type="text"
              value={heroForm.titleLine1}
              onChange={(e) => setHeroForm({ ...heroForm, titleLine1: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#DC2626]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
              Title Line 2
            </label>
            <input
              type="text"
              value={heroForm.titleLine2}
              onChange={(e) => setHeroForm({ ...heroForm, titleLine2: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#DC2626]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
              Highlight Word
            </label>
            <input
              type="text"
              value={heroForm.titleHighlight}
              onChange={(e) => setHeroForm({ ...heroForm, titleHighlight: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#DC2626]"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
            Badge Sticker Text
          </label>
          <input
            type="text"
            value={heroForm.badgeText}
            onChange={(e) => setHeroForm({ ...heroForm, badgeText: e.target.value })}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#DC2626]"
          />
        </div>

        {/* Marquee Ticker Copy */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Scrolling Marquee Top Strip (Clickable Franchise Button)
            </label>
            <span className="text-[10px] text-zinc-500">Separate items using ● bullet</span>
          </div>
          <textarea
            rows={3}
            value={heroForm.marqueeText}
            onChange={(e) => setHeroForm({ ...heroForm, marqueeText: e.target.value })}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#DC2626] font-mono leading-relaxed"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
            Subtitle Copy
          </label>
          <textarea
            rows={2}
            value={heroForm.subtitle}
            onChange={(e) => setHeroForm({ ...heroForm, subtitle: e.target.value })}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#DC2626]"
          />
        </div>

        <button
          type="submit"
          className="w-full py-3.5 rounded-2xl bg-[#DC2626] hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
        >
          <Check className="w-4 h-4 stroke-[2.5]" />
          <span>Update Hero Banner & Marquee Strip</span>
        </button>
      </form>

      {/* SECTION 3: AUDIO NOTIFICATIONS */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Bell className="w-4 h-4 text-emerald-400" />
            <span>New Order Sound Alert</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Plays a synthesized 3-tone notification chime immediately when a new customer order arrives
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              playOrderSound();
              showToast('Test chime played!', 'info');
            }}
            className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-bold text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            Test Sound
          </button>

          <button
            type="button"
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              showToast(soundEnabled ? 'Order sound muted' : 'Order sound enabled', 'info');
            }}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              soundEnabled ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-400'
            }`}
            title={soundEnabled ? 'Mute' : 'Unmute'}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>
      </div>

    </div>
  );
}
