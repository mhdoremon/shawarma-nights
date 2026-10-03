import React, { useState } from 'react';
import { useMaster } from '../context/MasterContext';
import { Plus, Tag, Trash2, X, Percent, Check, IndianRupee, Truck, Sparkles, Edit2 } from 'lucide-react';
import { getImageUrl } from '../../../utils/imageHelper';

export default function OffersTab() {
  const { deals, menu, heroBanner, storeInfo, addDeal, toggleDealActive, deleteDeal, updateStoreSettings, updateHeroBanner, showToast } = useMaster();

  // Free delivery threshold state
  const [fdLimit, setFdLimit] = useState(String(storeInfo?.freeDeliveryThreshold ?? 499));

  // Modal states
  const [dealModalData, setDealModalData] = useState(null); // null (closed) | {} (add/edit)

  // Hero Offer Editor state
  const [heroOffer, setHeroOffer] = useState({
    featuredItemId: heroBanner?.featuredItemId || (menu?.[0]?.id || ''),
    priceText: heroBanner?.priceText || 'Starts from',
    priceValue: heroBanner?.priceValue || '179',
    badgeText: heroBanner?.badgeText || '50% OFF — NIGHT50',
    titleLine1: heroBanner?.titleLine1 || 'REAL',
    titleLine2: heroBanner?.titleLine2 || 'CHARCOAL',
    titleHighlight: heroBanner?.titleHighlight || 'SHAWARMA',
    subtitle: heroBanner?.subtitle || 'Slow-turned on glowing coals. Carved fresh. Wrapped in toasted saj bread with our legendary garlic toum.'
  });

  // Handle Save Free Delivery Limit
  const handleSaveFreeDelivery = async (e) => {
    e.preventDefault();
    const val = Number(fdLimit) || 0;
    await updateStoreSettings({ freeDeliveryThreshold: val });
    showToast(`Free Delivery Limit ₹${val} Saved & Synced!`, 'success');
  };

  // Handle Save Deal Form (Add or Edit)
  const handleSaveDeal = async (e) => {
    e.preventDefault();
    if (!dealModalData.code?.trim()) {
      showToast('Promo code is required', 'error');
      return;
    }

    const payload = {
      ...dealModalData,
      code: dealModalData.code.trim().toUpperCase(),
      title: dealModalData.title?.trim() || `${dealModalData.discountType === 'percentage' ? `${dealModalData.discountPercent}% OFF` : `₹${dealModalData.flatDiscount} OFF`}`,
      discountType: dealModalData.discountType || 'percentage',
      discountPercent: dealModalData.discountType === 'percentage' ? Number(dealModalData.discountPercent) : null,
      flatDiscount: dealModalData.discountType === 'flat' ? Number(dealModalData.flatDiscount) : null,
      maxDiscount: Number(dealModalData.maxDiscount) || null,
      minOrder: Number(dealModalData.minOrder) || 0,
      usageLimit: Number(dealModalData.usageLimit) || null,
      firstOrderOnly: Boolean(dealModalData.firstOrderOnly),
      autoApply: Boolean(dealModalData.autoApply),
      isActive: dealModalData.isActive !== false,
      active: dealModalData.active !== false
    };

    await addDeal(payload);
    setDealModalData(null);
  };

  // Handle Save Hero Offer Editor
  const handleSaveHeroOffer = async (e) => {
    e.preventDefault();
    const chosenDish = (menu || []).find(d => d.id === heroOffer.featuredItemId);

    await updateHeroBanner({
      featuredItemId: heroOffer.featuredItemId,
      circleImage: chosenDish ? chosenDish.image : heroBanner?.circleImage,
      dishName: chosenDish ? chosenDish.name : heroBanner?.dishName,
      priceText: heroOffer.priceText,
      priceValue: heroOffer.priceValue,
      badgeText: heroOffer.badgeText,
      titleLine1: heroOffer.titleLine1,
      titleLine2: heroOffer.titleLine2,
      titleHighlight: heroOffer.titleHighlight,
      subtitle: heroOffer.subtitle
    });
    showToast('Homepage Hero Offer & Banner Updated!', 'success');
  };

  // Currently selected dish in Hero Offer editor
  const selectedHeroDish = (menu || []).find(d => d.id === heroOffer.featuredItemId) || menu?.[0];

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      
      {/* 0. FREE DELIVERY THRESHOLD CARD (Prominent at top, matching Android app) */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xl space-y-4 border-0">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
            <Truck className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-base font-black text-emerald-800">FREE DELIVERY THRESHOLD (BAG LIMIT)</h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Current Limit: <strong className="text-zinc-900">₹{storeInfo?.freeDeliveryThreshold ?? 499}</strong> (Customer ke bag me is amount se upar delivery FREE hogi)
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveFreeDelivery} className="space-y-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {['199', '299', '399', '499', '599', '799', '999'].map(val => (
              <button
                key={val}
                type="button"
                onClick={() => setFdLimit(val)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border-0 cursor-pointer ${
                  fdLimit === val ? 'bg-emerald-600 text-white shadow-sm' : 'bg-[#FFFBF7] text-zinc-700 hover:bg-zinc-100 shadow-xs'
                }`}
              >
                ₹{val}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="number"
              value={fdLimit}
              onChange={(e) => setFdLimit(e.target.value)}
              placeholder="e.g. 499"
              className="flex-1 bg-[#FFFBF7] rounded-2xl px-4 py-2.5 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0 font-bold"
            />
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider shadow-md cursor-pointer border-0"
            >
              SAVE THRESHOLD
            </button>
          </div>
        </form>
      </div>

      {/* 1. PROMO CODES & DEALS SECTION */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xl space-y-5 border-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
          <div>
            <h2 className="text-xl font-black text-zinc-900">PROMO CODES & DEALS ({deals?.length || 0})</h2>
            <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
              Manage discount codes, checkout vouchers, and auto-applied offers
            </p>
          </div>

          <button
            onClick={() => setDealModalData({
              code: '',
              title: '',
              discountType: 'percentage',
              discountPercent: 50,
              flatDiscount: 50,
              maxDiscount: 100,
              minOrder: 199,
              usageLimit: 0,
              firstOrderOnly: false,
              autoApply: false,
              isActive: true,
              active: true
            })}
            className="px-5 py-3 rounded-full bg-[#DC2626] hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg hover:shadow-xl shrink-0 border-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ NEW DEAL</span>
          </button>
        </div>

        {/* Deals Cards List */}
        {(!deals || deals.length === 0) ? (
          <div className="text-center py-10 text-zinc-400 text-xs font-medium">
            No active promo deals on server. Click "+ NEW DEAL" to create one.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {deals.map(deal => {
              const isActive = deal.isActive !== false && deal.active !== false;

              return (
                <div
                  key={deal.id || deal.code}
                  className={`bg-[#FFFBF7] rounded-3xl p-5 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-all border-0 ${
                    !isActive ? 'opacity-70' : ''
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-black px-3 py-1 rounded-xl bg-zinc-900 text-white tracking-widest uppercase">
                          {deal.code}
                        </span>
                        <h3 className="text-base font-black text-zinc-900 mt-2">
                          {deal.title || 'Special Discount'}
                        </h3>
                      </div>

                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-200 text-zinc-600'
                      }`}>
                        {isActive ? 'ACTIVE' : 'PAUSED'}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-zinc-600 bg-white p-3.5 rounded-2xl shadow-2xs">
                      <div className="flex justify-between">
                        <span>Discount:</span>
                        <strong className="text-[#DC2626] font-black">
                          {deal.discountType === 'flat' ? `₹${deal.flatDiscount || 0}` : `${deal.discountPercent || 0}%`}
                          {deal.maxDiscount ? ` (Max ₹${deal.maxDiscount})` : ''}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Min Order:</span>
                        <strong className="text-zinc-900 font-bold">₹{deal.minOrder || 0}</strong>
                      </div>
                      {deal.usageLimit > 0 && (
                        <div className="flex justify-between">
                          <span>Usage:</span>
                          <span className="font-bold">{deal.usageCount || 0} / {deal.usageLimit} uses</span>
                        </div>
                      )}
                      {deal.autoApply && (
                        <div className="text-[11px] text-amber-700 font-black mt-1">
                          ⚡ Auto-applies at checkout
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-200/60">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => toggleDealActive(deal.id, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-zinc-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600 relative"></div>
                      <span className="text-[11px] font-bold text-zinc-600">
                        {isActive ? 'Live' : 'Paused'}
                      </span>
                    </label>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setDealModalData({ ...deal })}
                        className="p-2 rounded-full bg-white hover:bg-zinc-100 text-zinc-700 transition-colors shadow-2xs border-0 cursor-pointer"
                        title="Edit Deal"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete coupon "${deal.code}"?`)) {
                            deleteDeal(deal.id);
                          }
                        }}
                        className="p-2 rounded-full bg-white hover:bg-red-50 text-zinc-500 hover:text-red-600 transition-colors shadow-2xs border-0 cursor-pointer"
                        title="Delete Deal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. HOMEPAGE HERO BANNER & OFFER LIVE EDITOR (Exact match to Android App) */}
      <form onSubmit={handleSaveHeroOffer} className="bg-white rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl border-0">
        <div className="border-b border-zinc-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <h3 className="text-lg font-black text-zinc-900">HOMEPAGE HERO OFFER (MAIN BANNER LIVE EDITOR)</h3>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            Menu ki listed dishes me se hero offer chunein aur homepage ka main headline live update karein.
          </p>
        </div>

        {/* Live Active Hero Offer Box */}
        {selectedHeroDish && (
          <div className="flex items-center gap-4 bg-[#FFFBF7] p-4 rounded-2xl shadow-xs">
            <img
              src={getImageUrl(selectedHeroDish.image)}
              alt={selectedHeroDish.name}
              className="w-18 h-18 rounded-2xl object-cover bg-zinc-200 shrink-0 shadow-sm"
            />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                ACTIVE HERO OFFER DISH
              </span>
              <h4 className="text-base font-black text-zinc-900 truncate mt-1">
                {selectedHeroDish.name}
              </h4>
              <p className="text-xs text-zinc-500">
                Menu Price: <strong className="text-zinc-900">₹{selectedHeroDish.price}</strong> • Display Prefix: <strong>{heroOffer.priceText} ₹{heroOffer.priceValue}</strong>
              </p>
            </div>
          </div>
        )}

        {/* Select Featured Dish from Menu */}
        <div>
          <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1.5">
            CHOOSE HERO OFFER DISH FROM MENU
          </label>
          <select
            value={heroOffer.featuredItemId}
            onChange={(e) => {
              const d = (menu || []).find(item => item.id === e.target.value);
              setHeroOffer({
                ...heroOffer,
                featuredItemId: e.target.value,
                priceValue: d ? String(d.price) : heroOffer.priceValue,
                titleHighlight: d ? d.name?.split(' ')?.[0]?.toUpperCase() : heroOffer.titleHighlight
              });
            }}
            className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-3 text-sm text-zinc-900 font-bold focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0 cursor-pointer"
          >
            {(menu || []).map(d => (
              <option key={d.id} value={d.id}>
                {d.name} — ₹{d.price} ({d.category || 'General'})
              </option>
            ))}
          </select>
        </div>

        {/* Price Prefix + Chips */}
        <div>
          <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
            PRICE PREFIX TEXT
          </label>
          <input
            type="text"
            value={heroOffer.priceText}
            onChange={(e) => setHeroOffer({ ...heroOffer, priceText: e.target.value })}
            placeholder="Starts from, Special Offer"
            className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-2.5 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
          />
          <div className="flex items-center gap-1 pt-1.5 flex-wrap">
            {['Starts from', 'Special Offer', "Today's Deal", 'Only at', 'Limited Deal', 'Hot Deal'].map(pr => (
              <button
                key={pr}
                type="button"
                onClick={() => setHeroOffer({ ...heroOffer, priceText: pr })}
                className="px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-700 text-[10px] font-bold border-0 cursor-pointer"
              >
                {pr}
              </button>
            ))}
          </div>
        </div>

        {/* Offer Price Value & Badge Text */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
              OFFER PRICE VALUE (₹)
            </label>
            <input
              type="text"
              value={heroOffer.priceValue}
              onChange={(e) => setHeroOffer({ ...heroOffer, priceValue: e.target.value })}
              placeholder="179"
              className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-2.5 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
              BADGE TEXT
            </label>
            <input
              type="text"
              value={heroOffer.badgeText}
              onChange={(e) => setHeroOffer({ ...heroOffer, badgeText: e.target.value })}
              placeholder="50% OFF — NIGHT50"
              className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-2.5 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
            />
            <div className="flex items-center gap-1 pt-1.5 flex-wrap">
              {['50% OFF — NIGHT50', 'CHEF SPECIAL', 'BESTSELLER', 'HOT DEAL'].map(b => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setHeroOffer({ ...heroOffer, badgeText: b })}
                  className="px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-700 text-[10px] font-bold border-0 cursor-pointer"
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Headline Titles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
              TITLE LINE 1
            </label>
            <input
              type="text"
              value={heroOffer.titleLine1}
              onChange={(e) => setHeroOffer({ ...heroOffer, titleLine1: e.target.value })}
              className="w-full bg-[#FFFBF7] rounded-2xl px-3.5 py-2 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
              TITLE LINE 2
            </label>
            <input
              type="text"
              value={heroOffer.titleLine2}
              onChange={(e) => setHeroOffer({ ...heroOffer, titleLine2: e.target.value })}
              className="w-full bg-[#FFFBF7] rounded-2xl px-3.5 py-2 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
              HIGHLIGHT WORD
            </label>
            <input
              type="text"
              value={heroOffer.titleHighlight}
              onChange={(e) => setHeroOffer({ ...heroOffer, titleHighlight: e.target.value })}
              className="w-full bg-[#FFFBF7] rounded-2xl px-3.5 py-2 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
            SUBTITLE COPY
          </label>
          <textarea
            rows={2}
            value={heroOffer.subtitle}
            onChange={(e) => setHeroOffer({ ...heroOffer, subtitle: e.target.value })}
            className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-2.5 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0 resize-none"
          />
        </div>

        <button
          type="submit"
          className="w-full py-3.5 rounded-full bg-[#DC2626] hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider shadow-lg hover:shadow-xl cursor-pointer border-0 active:scale-98 transition-all"
        >
          SAVE & PUBLISH HOMEPAGE HERO OFFER
        </button>
      </form>

      {/* MODAL: ADD / EDIT PROMO DEAL */}
      {dealModalData && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white text-zinc-900 rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-4 shadow-2xl border-0">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-base font-black text-zinc-900">
                {dealModalData.id ? 'Edit Promo Deal' : 'Create New Deal'}
              </h3>
              <button
                onClick={() => setDealModalData(null)}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDeal} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
                  COUPON CODE *
                </label>
                <input
                  type="text"
                  required
                  value={dealModalData.code || ''}
                  onChange={(e) => setDealModalData({ ...dealModalData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. NIGHT50, FESTIVE100"
                  className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-3 text-sm text-zinc-900 uppercase tracking-widest font-black focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
                  OFFER TITLE
                </label>
                <input
                  type="text"
                  value={dealModalData.title || ''}
                  onChange={(e) => setDealModalData({ ...dealModalData, title: e.target.value })}
                  placeholder="e.g. 50% OFF Midnight Special"
                  className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-2.5 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
                    DISCOUNT TYPE
                  </label>
                  <select
                    value={dealModalData.discountType || 'percentage'}
                    onChange={(e) => setDealModalData({ ...dealModalData, discountType: e.target.value })}
                    className="w-full bg-[#FFFBF7] rounded-2xl px-3.5 py-2.5 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0 cursor-pointer font-bold"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Cash (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
                    {dealModalData.discountType === 'percentage' ? 'PERCENT (%)' : 'FLAT OFF (₹)'}
                  </label>
                  <input
                    type="number"
                    required
                    value={dealModalData.discountType === 'percentage' ? (dealModalData.discountPercent ?? 50) : (dealModalData.flatDiscount ?? 50)}
                    onChange={(e) => {
                      if (dealModalData.discountType === 'percentage') {
                        setDealModalData({ ...dealModalData, discountPercent: e.target.value });
                      } else {
                        setDealModalData({ ...dealModalData, flatDiscount: e.target.value });
                      }
                    }}
                    placeholder="50"
                    className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-2.5 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
                    MIN ORDER VALUE (₹)
                  </label>
                  <input
                    type="number"
                    value={dealModalData.minOrder ?? 199}
                    onChange={(e) => setDealModalData({ ...dealModalData, minOrder: e.target.value })}
                    placeholder="199"
                    className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-2.5 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
                    MAX DISCOUNT CAP (₹)
                  </label>
                  <input
                    type="number"
                    value={dealModalData.maxDiscount ?? 100}
                    onChange={(e) => setDealModalData({ ...dealModalData, maxDiscount: e.target.value })}
                    placeholder="100"
                    className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-2.5 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-zinc-700">
                  <input
                    type="checkbox"
                    checked={dealModalData.autoApply || false}
                    onChange={(e) => setDealModalData({ ...dealModalData, autoApply: e.target.checked })}
                    className="rounded text-[#DC2626] focus:ring-[#DC2626]"
                  />
                  <span>Auto-apply at checkout</span>
                </label>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3.5 rounded-full bg-[#DC2626] hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider shadow-lg cursor-pointer border-0"
                >
                  {dealModalData.id ? 'UPDATE DEAL' : 'ACTIVATE DEAL'}
                </button>
                <button
                  type="button"
                  onClick={() => setDealModalData(null)}
                  className="py-3.5 px-5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs cursor-pointer border-0"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
