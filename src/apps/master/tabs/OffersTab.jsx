import React, { useState, useEffect } from 'react';
import { useMaster } from '../context/MasterContext';
import { Plus, Tag, Trash2, X, Percent, Check, IndianRupee, Truck, Sparkles, Edit2, Video, Upload, Play, Package, Clock, Gift } from 'lucide-react';
import { getImageUrl } from '../../../utils/imageHelper';

export default function OffersTab() {
  const { 
    deals, 
    menu, 
    heroBanner, 
    storeInfo, 
    storeId, 
    capabilities, 
    addDeal, 
    toggleDealActive, 
    deleteDeal, 
    addMenuItem, 
    updateMenuItem, 
    deleteMenuItem, 
    toggleItemAvailability, 
    updateStoreSettings, 
    updateHeroBanner, 
    showToast 
  } = useMaster();

  const isMarketplace = storeId === 'churuone' || capabilities?.storeType === 'marketplace' || capabilities?.vertical === 'marketplace';
  const isSalon = !isMarketplace && (capabilities?.vertical === 'salon' || (storeId || '').includes('nash') || storeInfo?.vertical === 'salon' || capabilities?.catalog?.hasServiceDuration);
  const isFashion = !isMarketplace && Boolean(capabilities?.catalog?.hasSizes || storeInfo?.vertical === 'fashion' || (storeId || '').includes('skyline'));
  const hasFreeDelivery = !isSalon && (capabilities?.settings?.hasFreeDeliveryThreshold ?? true);

  // Free delivery threshold state
  const [fdLimit, setFdLimit] = useState(String(storeInfo?.freeDeliveryThreshold ?? 499));

  // Modal states
  const [dealModalData, setDealModalData] = useState(null); // null (closed) | {} (add/edit)
  const [comboModalData, setComboModalData] = useState(null); // null (closed) | {} (add/edit combo package)

  // Filter combo packages from menu catalog
  const availableCombos = (menu || []).filter(item => 
    item && (item.isCombo === true || item.categoryId === 'cat_combo' || item.category === 'Combo Packages' || item.category === 'combos' || item.category === 'combo' || (item.category && item.category.toLowerCase().includes('combo')))
  );

  // Hero Offer Editor state
  const [heroOffer, setHeroOffer] = useState({
    studioName: storeInfo?.name || storeInfo?.storeName || storeInfo?.studioName || (isMarketplace ? 'ChuruOne Platform & Marketplace' : isSalon ? 'Nash Studio' : isFashion ? 'Skyline Outfits' : 'Shawarma Nights'),
    featuredItemId: heroBanner?.featuredItemId || (menu?.[0]?.id || ''),
    priceText: heroBanner?.priceText || (isFashion ? 'Starting at' : isSalon ? 'Starts from' : 'Starts from'),
    priceValue: heroBanner?.priceValue || (isSalon ? '500' : isFashion ? '1799' : '179'),
    badgeText: heroBanner?.badgeText || (isSalon ? 'VIP GROOMING LOUNGE' : isFashion ? 'CHURU FLAGSHIP' : isMarketplace ? 'CHURU SOCIAL COMMERCE' : '50% OFF — NIGHT50'),
    titleLine1: heroBanner?.titleLine1 || (isSalon ? 'PRECISION' : isFashion ? 'SKYLINE' : isMarketplace ? 'SOCIAL' : 'REAL'),
    titleLine2: heroBanner?.titleLine2 || (isSalon ? 'GROOMING' : isFashion ? 'PREMIUM' : isMarketplace ? 'COMMERCE' : 'CHARCOAL'),
    titleHighlight: heroBanner?.titleHighlight || (isMarketplace ? 'CHURUONE' : isSalon ? 'NASH STUDIO' : isFashion ? 'OUTFITS' : 'SHAWARMA'),
    subtitle: heroBanner?.subtitle || storeInfo?.tagline || (isSalon ? 'PRECISION GROOMING. BINA INTEZAAR KE.' : isFashion ? 'Architectural luxury menswear, Italian linen shirts, pleated Gurkha trousers, Japanese selvedge denim & bespoke outfits curated in Churu.' : 'Slow-turned on glowing coals. Carved fresh. Wrapped in toasted saj bread with our legendary garlic toum.'),
    heroVideoUrl: heroBanner?.heroVideoUrl || storeInfo?.heroVideoUrl || '/video/hero.mp4',
    heroButtonText: heroBanner?.heroButtonText || storeInfo?.heroButtonText || (isFashion ? 'SHOP COLLECTION' : isSalon ? 'EXPLORE STYLES & BOOK' : 'ORDER NOW'),
    marqueeText: heroBanner?.marqueeText || (isFashion ? 'SKYLINE BESPOKE • 100% ITALIAN LINEN • BESPOKE HANDCRAFTED TAILORING • CHURU SAME-DAY EXPRESS • ARCHITECTURAL SILHOUETTES' : '★ TAP HERE TO OWN A FRANCHISE ● ★ 3-6 MONTHS ROI ● ★ HIGH CASH FLOW ● ★ TURNKEY SETUP ● ★ LIMITED CITY SLOTS AVAILABLE ★'),
    trendingTag: heroBanner?.trendingTag || '— Our Trending Menswear Collection —',
    trendingTitle: heroBanner?.trendingTitle || 'Most Popular\nGarments',
    trendingSubtitle: heroBanner?.trendingSubtitle || 'Curated luxury essentials engineered for sharp tailoring, comfort and enduring elegance in Churu.',
    trendingItemIds: Array.isArray(heroBanner?.trendingItemIds) ? heroBanner.trendingItemIds : []
  });

  useEffect(() => {
    if (storeInfo || heroBanner) {
      setHeroOffer(prev => ({
        ...prev,
        studioName: storeInfo?.name || storeInfo?.studioName || prev.studioName,
        subtitle: heroBanner?.subtitle || storeInfo?.tagline || prev.subtitle,
        heroVideoUrl: heroBanner?.heroVideoUrl || storeInfo?.heroVideoUrl || prev.heroVideoUrl,
        heroButtonText: heroBanner?.heroButtonText || storeInfo?.heroButtonText || prev.heroButtonText,
        titleHighlight: heroBanner?.titleHighlight || storeInfo?.name || prev.titleHighlight,
        marqueeText: heroBanner?.marqueeText || prev.marqueeText,
        trendingTag: heroBanner?.trendingTag || prev.trendingTag,
        trendingTitle: heroBanner?.trendingTitle || prev.trendingTitle,
        trendingSubtitle: heroBanner?.trendingSubtitle || prev.trendingSubtitle,
        trendingItemIds: Array.isArray(heroBanner?.trendingItemIds) ? heroBanner.trendingItemIds : prev.trendingItemIds,
        featuredItemId: heroBanner?.featuredItemId || prev.featuredItemId,
        badgeText: heroBanner?.badgeText || prev.badgeText,
        titleLine1: heroBanner?.titleLine1 || prev.titleLine1,
        titleLine2: heroBanner?.titleLine2 || prev.titleLine2
      }));
    }
  }, [storeInfo, heroBanner]);

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
          setHeroOffer(prev => ({ ...prev, heroVideoUrl: data.url }));
          showToast('Hero background video uploaded successfully!', 'success');
        } else {
          setHeroOffer(prev => ({ ...prev, heroVideoUrl: base64Data }));
          showToast('Video loaded from device', 'info');
        }
      } catch (err) {
        setHeroOffer(prev => ({ ...prev, heroVideoUrl: base64Data }));
        showToast('Video loaded from device', 'info');
      } finally {
        setIsVideoUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

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
      expiry: dealModalData.expiry || null,
      autoApply: Boolean(dealModalData.autoApply),
      isCombo: Boolean(dealModalData.isCombo),
      applicableTo: dealModalData.applicableTo || 'all',
      applicableDishIds: Array.isArray(dealModalData.applicableDishIds) ? dealModalData.applicableDishIds : [],
      isActive: dealModalData.isActive !== false,
      active: dealModalData.active !== false
    };

    await addDeal(payload);
    setDealModalData(null);
  };

  // Handle Save Salon Combo Package
  const handleSaveSalonCombo = async (e) => {
    e.preventDefault();
    if (!comboModalData.name?.trim() || !comboModalData.price) {
      showToast('Combo Package name and price are required', 'error');
      return;
    }

    const selectedServices = (menu || []).filter(d => (comboModalData.selectedDishIds || []).includes(d.id));
    const autoDuration = selectedServices.reduce((sum, d) => sum + (Number(d.time || d.durationMinutes || d.prepTime) || 30), 0);
    const autoOrigPrice = selectedServices.reduce((sum, d) => sum + (Number(d.price) || 0), 0);

    const payload = {
      ...comboModalData,
      name: comboModalData.name.trim(),
      price: Number(comboModalData.price),
      originalPrice: comboModalData.originalPrice > 0 ? Number(comboModalData.originalPrice) : autoOrigPrice,
      time: Number(comboModalData.time || autoDuration || 60),
      durationMinutes: Number(comboModalData.time || autoDuration || 60),
      prepTime: Number(comboModalData.time || autoDuration || 60),
      category: 'Combo Packages',
      categoryId: 'cat_combo',
      type: 'premium',
      isCombo: true,
      badge: comboModalData.badge || 'VIP COMBO',
      available: comboModalData.available !== false,
      image: comboModalData.image || (selectedServices[0]?.image || selectedServices[0]?.img || '/images/hs_scissor_sculpt.jpg'),
      img: comboModalData.image || (selectedServices[0]?.image || selectedServices[0]?.img || '/images/hs_scissor_sculpt.jpg'),
      comboItems: selectedServices.map(s => ({
        id: s.id,
        name: s.name,
        price: s.price,
        time: s.time || s.durationMinutes || s.prepTime || 30
      })),
      description: comboModalData.description || selectedServices.map(s => s.name).join(' + '),
      desc: comboModalData.description || selectedServices.map(s => s.name).join(' + ')
    };

    if (comboModalData.id) {
      await updateMenuItem(comboModalData.id, payload);
      showToast(`Combo Package "${payload.name}" updated!`, 'success');
    } else {
      await addMenuItem(payload);
      showToast(`New Combo Package "${payload.name}" created!`, 'success');
    }
    setComboModalData(null);
  };

  // Currently selected dish in Hero Offer editor
  const handleSaveHeroOffer = async (e) => {
    e.preventDefault();
    const chosenDish = (menu || []).find(d => d.id === heroOffer.featuredItemId);

    const bannerPayload = {
      featuredItemId: heroOffer.featuredItemId,
      circleImage: chosenDish ? chosenDish.image : heroBanner?.circleImage,
      dishName: chosenDish ? chosenDish.name : heroBanner?.dishName,
      priceText: heroOffer.priceText,
      priceValue: heroOffer.priceValue,
      badgeText: heroOffer.badgeText,
      titleLine1: heroOffer.titleLine1,
      titleLine2: heroOffer.titleLine2,
      titleHighlight: heroOffer.studioName || heroOffer.titleHighlight,
      subtitle: heroOffer.subtitle,
      heroVideoUrl: heroOffer.heroVideoUrl,
      heroButtonText: heroOffer.heroButtonText,
      marqueeText: heroOffer.marqueeText,
      trendingTag: heroOffer.trendingTag,
      trendingTitle: heroOffer.trendingTitle,
      trendingSubtitle: heroOffer.trendingSubtitle,
      trendingItemIds: heroOffer.trendingItemIds
    };

    await updateHeroBanner(bannerPayload);
    if (isSalon) {
      const sName = (heroOffer.studioName || heroOffer.titleHighlight || 'Nash Studio').trim();
      await updateStoreSettings({
        name: sName,
        studioName: sName,
        storeName: sName,
        tagline: heroOffer.subtitle,
        heroTagline: heroOffer.subtitle,
        heroButtonText: heroOffer.heroButtonText,
        heroVideoUrl: heroOffer.heroVideoUrl
      });
    } else if (isFashion) {
      await updateStoreSettings({
        marqueeText: heroOffer.marqueeText,
        tagline: heroOffer.subtitle
      });
    }
    showToast(isSalon ? 'Salon Video Hero Banner & Studio Branding Updated!' : 'Homepage Hero Offer & Banner Updated!', 'success');
  };

  // Currently selected dish in Hero Offer editor
  const selectedHeroDish = (menu || []).find(d => d.id === heroOffer.featuredItemId) || menu?.[0];

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      
      {/* 0. FREE DELIVERY THRESHOLD CARD (Only for delivery-enabled stores) */}
      {hasFreeDelivery && (
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
      )}



      {/* 1. VIP PACKAGES & COMBOS SECTION (Salon & Fashion stores) */}
      {(isSalon || isFashion) && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xl space-y-5 border-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-xs font-black uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>{isSalon ? 'Bespoke Packages • बंडल कॉम्बो' : 'Curated Outfits • बंडल कॉम्बो'}</span>
              </div>
              <h2 className="text-xl font-black text-zinc-900">
                {isSalon 
                  ? `VIP SALON PACKAGES & COMBOS (${availableCombos.length})` 
                  : `CURATED WARDROBE SETS & COMBOS (${availableCombos.length})`}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
                {isSalon 
                  ? 'Haircut + Daadi + Shave + Facial ke multi-service package bundles yahan se banayein aur website par live showcase karein.'
                  : 'Shirt + Trouser + Jacket ke coordinated outfits & matching sets yahan se banayein aur website par live showcase karein.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setComboModalData({
                name: '',
                price: isFashion ? 2999 : 599,
                originalPrice: isFashion ? 4499 : 850,
                time: 50,
                badge: isFashion ? 'CURATED ENSEMBLE' : 'BESTSELLER COMBO',
                selectedDishIds: [],
                image: isFashion ? (menu?.[0]?.image || '') : '/images/hs_scissor_sculpt.jpg',
                description: '',
                available: true
              })}
              className="px-5 py-3 rounded-full bg-amber-500 hover:bg-amber-600 text-black font-black text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg hover:shadow-xl shrink-0 border-0"
            >
              <Package className="w-4 h-4 stroke-[2.5]" />
              <span>{isSalon ? '+ CREATE NEW COMBO PACKAGE' : '+ CREATE WARDROBE COMBO SET'}</span>
            </button>
          </div>

          {/* Combos Grid */}
          {availableCombos.length === 0 ? (
            <div className="text-center py-12 text-zinc-400 text-xs font-medium bg-[#FFFBF7] rounded-3xl p-8 border-2 border-dashed border-zinc-200">
              <Package className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
              <p className="font-bold text-zinc-600 text-sm">
                {isSalon ? 'Koi bhi Combo Package listed nahi hai' : 'Koi bhi Wardrobe Combo Set listed nahi hai'}
              </p>
              <p className="mt-1">
                {isSalon 
                  ? '"+ CREATE NEW COMBO PACKAGE" button daba kar Daadi + Haircut ya Royal Grooming bundle banayein.'
                  : '"+ CREATE WARDROBE COMBO SET" button daba kar Shirt + Trouser ya 2-Piece Ensemble bundle banayein.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {availableCombos.map(combo => {
                const isAvail = combo.available !== false;
                const orig = Number(combo.originalPrice) || 0;
                const curr = Number(combo.price) || 0;
                const savings = orig > curr ? orig - curr : 0;
                const discountPct = orig > curr ? Math.round((savings / orig) * 100) : 0;
                const dur = Number(combo.time || combo.durationMinutes || combo.prepTime || 50);

                let incItems = [];
                if (Array.isArray(combo.comboItems) && combo.comboItems.length > 0) {
                  incItems = combo.comboItems.map(i => typeof i === 'string' ? i : i.name);
                } else if (combo.description && combo.description.includes('+')) {
                  incItems = combo.description.split('+').map(s => s.trim());
                } else if (combo.desc && combo.desc.includes('+')) {
                  incItems = combo.desc.split('+').map(s => s.trim());
                } else {
                  incItems = [combo.name];
                }

                return (
                  <div
                    key={combo.id}
                    className={`bg-[#FFFBF7] rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between border-0 ${
                      !isAvail ? 'opacity-70' : ''
                    }`}
                  >
                    <div>
                      {/* Image header */}
                      <div className="relative h-36 bg-zinc-200 overflow-hidden">
                        <img
                          src={getImageUrl(combo.image || combo.img)}
                          alt={combo.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.src = '/images/hs_scissor_sculpt.jpg'; }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
                        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded-full bg-black/80 backdrop-blur-xs text-amber-300 text-[10px] font-black uppercase tracking-wider border border-amber-400/30 flex items-center gap-1 shadow-xs">
                            <Package className="w-3 h-3 text-amber-400" />
                            <span>{combo.badge || 'VIP COMBO'}</span>
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-zinc-900/80 backdrop-blur-xs text-white text-[10px] font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-400" />
                            <span>{dur} MINS</span>
                          </span>
                        </div>
                        {savings > 0 && (
                          <div className="absolute bottom-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black shadow-xs">
                            SAVE ₹{savings} ({discountPct}% OFF)
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-3">
                        <div>
                          <h3 className="text-base font-black text-zinc-900 line-clamp-1">
                            {combo.name}
                          </h3>
                          <p className="text-xs text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
                            {combo.desc || combo.description || 'Bespoke multi-service grooming package.'}
                          </p>
                        </div>

                        {/* Bundled Items pills */}
                        <div className="bg-amber-50/80 rounded-2xl p-2.5 border border-amber-200/60 space-y-1">
                          <span className="text-[10px] font-black uppercase text-amber-900 tracking-wider block">
                            Included Services ({incItems.length}):
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {incItems.map((item, idx) => (
                              <span key={idx} className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-800 bg-white px-2 py-0.5 rounded-md shadow-2xs">
                                <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                                <span>{item}</span>
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Price */}
                        <div className="flex items-baseline justify-between pt-1">
                          <div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-lg font-black text-zinc-900 font-mono">₹{curr}</span>
                              {orig > curr && (
                                <span className="text-xs text-zinc-400 line-through">₹{orig}</span>
                              )}
                            </div>
                            <span className="text-[10px] text-zinc-500 font-bold">Bundle Package Price</span>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            isAvail ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-200 text-zinc-600'
                          }`}>
                            {isAvail ? 'ACTIVE' : 'OUT OF STOCK'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 pt-2 border-t border-zinc-100 flex items-center justify-between gap-2">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isAvail}
                          onChange={(e) => toggleItemAvailability(combo.id, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4 bg-zinc-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600 relative"></div>
                        <span className="text-xs font-bold text-zinc-600">Available</span>
                      </label>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const curDishIds = Array.isArray(combo.comboItems)
                              ? combo.comboItems.map(i => i.id).filter(Boolean)
                              : [];
                            setComboModalData({
                              id: combo.id,
                              name: combo.name,
                              price: combo.price,
                              originalPrice: combo.originalPrice || 0,
                              time: dur,
                              badge: combo.badge || 'VIP COMBO',
                              selectedDishIds: curDishIds,
                              image: combo.image || combo.img || '/images/hs_scissor_sculpt.jpg',
                              description: combo.desc || combo.description || '',
                              available: isAvail
                            });
                          }}
                          className="p-2 rounded-xl bg-white hover:bg-zinc-100 text-zinc-700 shadow-xs cursor-pointer border-0"
                          title="Edit Combo Package"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-zinc-600" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Kya aap "${combo.name}" package ko delete karna chahte hain?`)) {
                              deleteMenuItem(combo.id);
                            }
                          }}
                          className="p-2 rounded-xl bg-white hover:bg-red-50 text-red-500 shadow-xs cursor-pointer border-0"
                          title="Delete Combo Package"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. PROMO CODES & DEALS SECTION */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xl space-y-5 border-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
          <div>
            <h2 className="text-xl font-black text-zinc-900">
              {isSalon ? `PROMO VOUCHER CODES (${deals?.length || 0})` : `PROMO CODES & DEALS (${deals?.length || 0})`}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
              {isSalon ? 'Manage salon appointment checkout discount promo vouchers (e.g. NASH20, ROYAL100)' : 'Manage discount codes, checkout vouchers, and auto-applied offers'}
            </p>
          </div>

          <button
            onClick={() => setDealModalData({
              code: isSalon ? 'NASH20' : '',
              title: isSalon ? 'Special Grooming Voucher' : '',
              discountType: isSalon ? 'percentage' : 'percentage',
              discountPercent: 20,
              flatDiscount: 100,
              maxDiscount: 200,
              minOrder: 499,
              usageLimit: 0,
              firstOrderOnly: false,
              autoApply: false,
              isCombo: false,
              applicableTo: 'all',
              applicableDishIds: [],
              isActive: true,
              active: true
            })}
            className="px-5 py-3 rounded-full bg-[#DC2626] hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg hover:shadow-xl shrink-0 border-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{isSalon ? '+ NEW PROMO VOUCHER' : '+ NEW DEAL'}</span>
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
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-black px-3 py-1 rounded-xl bg-zinc-900 text-white tracking-widest uppercase">
                            {deal.code}
                          </span>
                          {deal?.isCombo && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300">
                              COMBO PACKAGE
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-black text-zinc-900 mt-2">
                          {deal.title || (deal?.isCombo ? 'Special Combo Package' : 'Special Discount')}
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
                      <div className="flex justify-between items-center text-[11px] pt-1.5 border-t border-zinc-100">
                        <span className="text-zinc-500 font-medium">Applies on:</span>
                        <span className="font-bold text-zinc-800 text-[11px] truncate max-w-[170px]" title={
                          (!deal.applicableTo || deal.applicableTo === 'all' || !deal.applicableDishIds?.length)
                            ? 'All Dishes & Combos'
                            : deal.applicableTo === 'single'
                              ? (menu?.find(d => d.id === deal.applicableDishIds[0])?.name || '1 Specific Dish')
                              : `${deal.applicableDishIds.length} Selected Dishes`
                        }>
                          {(!deal.applicableTo || deal.applicableTo === 'all' || !deal.applicableDishIds?.length)
                            ? 'All Menu Dishes'
                            : deal.applicableTo === 'single'
                              ? (menu?.find(d => d.id === deal.applicableDishIds[0])?.name || '1 Specific Dish')
                              : `${deal.applicableDishIds.length} Dishes Selected`
                          }
                        </span>
                      </div>
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
                        onClick={() => setDealModalData({ 
                          ...deal,
                          applicableTo: deal.applicableTo || (deal.applicableDishIds?.length ? (deal.applicableDishIds.length === 1 ? 'single' : 'multiple') : 'all'),
                          applicableDishIds: Array.isArray(deal.applicableDishIds) ? deal.applicableDishIds : []
                        })}
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

      {/* 2. HOMEPAGE HERO BANNER & OFFER LIVE EDITOR (Restaurant food dish offer) */}
      {!isSalon && (
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
          <div className="flex items-center gap-4 bg-[#FFFBF7] p-4 rounded-2xl shadow-xs border border-zinc-100">
            <div className="w-20 h-20 sm:w-24 sm:h-24 max-w-[80px] max-h-[80px] sm:max-w-[96px] sm:max-h-[96px] aspect-square rounded-2xl overflow-hidden shrink-0 bg-zinc-200 shadow-sm border border-zinc-200 flex items-center justify-center">
              <img
                src={getImageUrl(selectedHeroDish.image)}
                alt={selectedHeroDish.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-800 inline-block">
                ACTIVE HERO OFFER DISH
              </span>
              <h4 className="text-base font-black text-zinc-900 truncate mt-1">
                {selectedHeroDish.name}
              </h4>
              <p className="text-xs text-zinc-500 mt-0.5">
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

        {/* CTA Button Text */}
        <div>
          <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
            CTA BUTTON TEXT
          </label>
          <input
            type="text"
            value={heroOffer.heroButtonText || ''}
            onChange={(e) => setHeroOffer({ ...heroOffer, heroButtonText: e.target.value })}
            placeholder={isFashion ? "SHOP COLLECTION" : isSalon ? "EXPLORE STYLES & BOOK" : "ORDER NOW"}
            className="w-full bg-[#FFFBF7] rounded-2xl px-3.5 py-2 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
          />
          <div className="flex items-center gap-1.5 pt-1.5 flex-wrap">
            {(isFashion 
              ? ['SHOP COLLECTION', 'EXPLORE PIECES', 'VIEW LOOKBOOK', 'BESPOKE TAILORING'] 
              : isSalon 
                ? ['EXPLORE STYLES & BOOK', 'BOOK APPOINTMENT', 'VIEW SALON SERVICES']
                : ['ORDER NOW', 'EXPLORE MENU', 'HOT DEALS', 'VIEW OFFERS']
            ).map(cta => (
              <button
                key={cta}
                type="button"
                onClick={() => setHeroOffer({ ...heroOffer, heroButtonText: cta })}
                className="px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-700 text-[10px] font-bold border-0 cursor-pointer"
              >
                {cta}
              </button>
            ))}
          </div>
        </div>

        {/* Salon Video Hero Fields */}
        {isSalon && (
          <div className="pt-2 border-t border-zinc-100">
            <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
              HERO BACKGROUND VIDEO URL / PATH
            </label>
            <input
              type="text"
              value={heroOffer.heroVideoUrl || ''}
              onChange={(e) => setHeroOffer({ ...heroOffer, heroVideoUrl: e.target.value })}
              placeholder="/video/hero.mp4"
              className="w-full bg-[#FFFBF7] rounded-2xl px-3.5 py-2 text-xs text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0 font-mono"
            />
            <div className="flex items-center gap-1.5 mt-1.5">
              <button
                type="button"
                onClick={() => setHeroOffer({ ...heroOffer, heroVideoUrl: '/video/hero.mp4' })}
                className="px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-700 text-[10px] font-bold border-0 cursor-pointer"
              >
                Reset Default Video (/video/hero.mp4)
              </button>
            </div>
          </div>
        )}

        {/* Chalne Wali Patti (Running Marquee Ribbon Ticker) */}
        <div className="pt-3 border-t border-zinc-100 space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-[11px] font-black text-zinc-900 uppercase tracking-wider">
              चलने वाली पट्टी (RUNNING TICKER RIBBON / MARQUEE TEXT)
            </label>
            <span className="text-[10px] text-zinc-400 font-mono">Bullet (•) se text divide karein</span>
          </div>
          <textarea
            rows={2}
            value={heroOffer.marqueeText || ''}
            onChange={(e) => setHeroOffer({ ...heroOffer, marqueeText: e.target.value })}
            placeholder="SKYLINE BESPOKE • 100% ITALIAN LINEN • BESPOKE HANDCRAFTED TAILORING • CHURU SAME-DAY EXPRESS"
            className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-2.5 text-xs text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
          />
          <div className="flex items-center gap-1.5 flex-wrap">
            {(isFashion ? [
              'SKYLINE BESPOKE • 100% ITALIAN LINEN • BESPOKE HANDCRAFTED TAILORING • CHURU SAME-DAY EXPRESS • ARCHITECTURAL SILHOUETTES',
              '100% FRENCH LINEN • SELVEDGE DENIM • GURKHA TROUSERS • BESPOKE ATELIER • CHURU SUBHASH CHOWK'
            ] : [
              '★ TAP HERE TO OWN A FRANCHISE ● ★ 3-6 MONTHS ROI ● ★ HIGH CASH FLOW ● ★ TURNKEY SETUP ● ★ LIMITED CITY SLOTS AVAILABLE ★',
              '🔥 AUTHENTIC CHARCOAL SHAWARMA • 🍗 FRESH HAND-CARVED CHICKEN • 🧄 HOMEMADE GARLIC TOUM • 🚀 25 MIN EXPRESS DELIVERY'
            ]).map((preset, pIdx) => (
              <button
                key={pIdx}
                type="button"
                onClick={() => setHeroOffer({ ...heroOffer, marqueeText: preset })}
                className="px-2.5 py-1 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[10px] font-bold border-0 cursor-pointer truncate max-w-xs"
              >
                Preset {pIdx + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Most Popular / Trending Collection Editor */}
        {isFashion && (
          <div className="pt-4 border-t border-zinc-100 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-black" />
              <h4 className="text-xs font-black text-zinc-900 uppercase tracking-wider">
                MOST POPULAR GARMENTS SECTION (TRENDING COLLECTION)
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
                  SECTION TOP TAG
                </label>
                <input
                  type="text"
                  value={heroOffer.trendingTag || ''}
                  onChange={(e) => setHeroOffer({ ...heroOffer, trendingTag: e.target.value })}
                  placeholder="— Our Trending Menswear Collection —"
                  className="w-full bg-[#FFFBF7] rounded-2xl px-3.5 py-2 text-xs text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
                  SECTION TITLE (ENTER KEY SE LINE BREAK HOGA)
                </label>
                <input
                  type="text"
                  value={heroOffer.trendingTitle || ''}
                  onChange={(e) => setHeroOffer({ ...heroOffer, trendingTitle: e.target.value })}
                  placeholder="Most Popular\nGarments"
                  className="w-full bg-[#FFFBF7] rounded-2xl px-3.5 py-2 text-xs text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
                SECTION SUBTITLE
              </label>
              <textarea
                rows={2}
                value={heroOffer.trendingSubtitle || ''}
                onChange={(e) => setHeroOffer({ ...heroOffer, trendingSubtitle: e.target.value })}
                placeholder="Curated luxury essentials engineered for sharp tailoring, comfort and enduring elegance in Churu."
                className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-2 text-xs text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0 resize-none"
              />
            </div>

            {/* Checklist of featured trending garments */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1.5">
                <span>Select Products to Showcase in Trending (3-4 Items):</span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {heroOffer.trendingItemIds?.length || 0} items selected
                </span>
              </div>
              <div className="max-h-52 overflow-y-auto space-y-1 p-2.5 bg-[#FFFBF7] rounded-2xl border border-zinc-200/60">
                {(menu || []).filter(item => !item?.isCombo).map(item => {
                  const isChecked = (heroOffer.trendingItemIds || []).includes(item.id);
                  return (
                    <label 
                      key={item.id}
                      className={`flex items-center justify-between p-2 rounded-xl cursor-pointer text-xs transition-colors ${
                        isChecked ? 'bg-black text-white' : 'hover:bg-white text-zinc-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const current = heroOffer.trendingItemIds || [];
                            const next = e.target.checked
                              ? [...current, item.id]
                              : current.filter(id => id !== item.id);
                            setHeroOffer({ ...heroOffer, trendingItemIds: next });
                          }}
                          className="rounded text-black focus:ring-black w-4 h-4 cursor-pointer"
                        />
                        <span className="font-bold truncate">{item.name}</span>
                      </div>
                      <span className={`font-mono font-bold shrink-0 text-xs ${isChecked ? 'text-stone-300' : 'text-zinc-500'}`}>
                        ₹{item.price}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          className="w-full py-3.5 rounded-full bg-[#DC2626] hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider shadow-lg hover:shadow-xl cursor-pointer border-0 active:scale-98 transition-all"
        >
          SAVE & PUBLISH HOMEPAGE HERO OFFER
        </button>
      </form>
      )}

      {/* MODAL: ADD / EDIT PROMO DEAL */}
      {dealModalData && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden animate-in fade-in duration-200">
          <div className="bg-white text-zinc-900 rounded-t-[32px] sm:rounded-3xl max-w-lg w-full max-h-[92vh] sm:max-h-[88vh] flex flex-col shadow-2xl border-0 overflow-hidden">
            {/* Sticky Header */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-zinc-100 bg-white shrink-0">
              <h3 className="text-base font-black text-zinc-900">
                {dealModalData.id 
                  ? (dealModalData.isCombo ? 'Edit Combo Package' : 'Edit Promo Deal') 
                  : (isSalon ? 'Create New Salon Package / Deal' : 'Create New Deal')}
              </h3>
              <button
                type="button"
                onClick={() => setDealModalData(null)}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDeal} className="flex-1 flex flex-col min-h-0">
              {/* Scrollable Form Body */}
              <div className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6 py-4 space-y-4">
              {/* 1-Tap Quick Salon Presets */}
              {isSalon && (
                <div className="bg-[#FFFBF7] p-3 rounded-2xl border-0">
                  <span className="text-[10px] text-zinc-600 font-black uppercase tracking-wider block mb-1.5">
                    ⚡ 1-Tap Salon Presets (Packages & Deals):
                  </span>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {[
                      { code: 'ROYALCOMBO', title: 'Royal Grooming Combo', desc: 'Haircut + Hot Towel Shave + Beard Blend', type: 'flat', flat: 200, min: 1200, isCombo: true },
                      { code: 'NASH20', title: '20% OFF — First Appointment', desc: 'Flat 20% discount on any premium haircut or grooming service', type: 'percentage', pct: 20, max: 300, min: 500, isCombo: false },
                      { code: 'ROYAL100', title: '₹100 Flat Off — Royal Grooming', desc: 'Save ₹100 on appointments above ₹1000', type: 'flat', flat: 100, min: 1000, isCombo: false },
                      { code: 'VIPGROOM', title: 'VIP Grooming Package — ₹300 Off', desc: 'Complete luxury head-to-beard bespoke package', type: 'flat', flat: 300, min: 1500, isCombo: true },
                    ].map(p => (
                      <button
                        key={p.code}
                        type="button"
                        onClick={() => setDealModalData(prev => ({
                          ...prev,
                          code: p.code,
                          title: p.title,
                          desc: p.desc,
                          discountType: p.type,
                          discountPercent: p.pct || null,
                          flatDiscount: p.flat || null,
                          minOrder: p.min,
                          maxDiscount: p.max || p.flat || null,
                          isCombo: p.isCombo,
                          autoApply: p.isCombo
                        }))}
                        className="px-3 py-1.5 rounded-full bg-white hover:bg-amber-100 text-amber-900 text-[10px] font-black whitespace-nowrap border border-amber-300 shadow-2xs cursor-pointer"
                      >
                        {p.code} ({p.title.split('—')[0]})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
                  COUPON CODE *
                </label>
                <input
                  type="text"
                  required
                  value={dealModalData.code || ''}
                  onChange={(e) => setDealModalData({ ...dealModalData, code: e.target.value.toUpperCase() })}
                  placeholder={isSalon ? "e.g. ROYALCOMBO, NASH20" : "e.g. NIGHT50, FESTIVE100"}
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
                    EXPIRY DATE (VALID TILL)
                  </label>
                  <input
                    type="date"
                    value={dealModalData.expiry ? dealModalData.expiry.split('T')[0] : ''}
                    onChange={(e) => setDealModalData({ ...dealModalData, expiry: e.target.value })}
                    className="w-full bg-[#FFFBF7] rounded-2xl px-3.5 py-2 text-xs text-zinc-900 font-bold focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
                    USAGE LIMIT (TOTAL USES)
                  </label>
                  <input
                    type="number"
                    value={dealModalData.usageLimit || ''}
                    onChange={(e) => setDealModalData({ ...dealModalData, usageLimit: e.target.value })}
                    placeholder="e.g. 100 (Blank = No Limit)"
                    className="w-full bg-[#FFFBF7] rounded-2xl px-3.5 py-2 text-xs text-zinc-900 font-bold focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
                  />
                </div>
              </div>

              {/* OFFER APPLICABILITY SELECTOR (All vs Single vs Multiple Dishes/Combos) */}
              <div className="space-y-2.5 bg-[#FFFBF7] p-4 rounded-2xl border border-zinc-200/80 shadow-2xs">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-black text-zinc-800 uppercase tracking-wider">
                    OFFER APPLICABILITY (Kis Dish / Combo par lagu hoga?)
                  </label>
                  <span className="text-[10px] font-bold text-zinc-500">
                    {(dealModalData.applicableTo || 'all') === 'all' 
                      ? 'Storewide Offer' 
                      : dealModalData.applicableTo === 'single' 
                        ? '1 Specific Dish' 
                        : `${dealModalData.applicableDishIds?.length || 0} Dishes Selected`}
                  </span>
                </div>

                {/* 3-way radio pills */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDealModalData({ ...dealModalData, applicableTo: 'all', applicableDishIds: [] })}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer ${
                      (dealModalData.applicableTo || 'all') === 'all'
                        ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                        : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                    }`}
                  >
                    All Dishes
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const firstId = menu?.[0]?.id || '';
                      setDealModalData({ 
                        ...dealModalData, 
                        applicableTo: 'single', 
                        applicableDishIds: dealModalData.applicableDishIds?.[0] ? [dealModalData.applicableDishIds[0]] : (firstId ? [firstId] : []) 
                      });
                    }}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer ${
                      dealModalData.applicableTo === 'single'
                        ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                        : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                    }`}
                  >
                    Single Dish
                  </button>

                  <button
                    type="button"
                    onClick={() => setDealModalData({ 
                      ...dealModalData, 
                      applicableTo: 'multiple', 
                      applicableDishIds: dealModalData.applicableDishIds || [] 
                    })}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer ${
                      dealModalData.applicableTo === 'multiple'
                        ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                        : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                    }`}
                  >
                    Multiple Dishes
                  </button>
                </div>

                {/* Single Dish Selector */}
                {dealModalData.applicableTo === 'single' && (
                  <div className="pt-1.5 space-y-1">
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                      Select Applicable Dish or Combo:
                    </label>
                    <select
                      value={dealModalData.applicableDishIds?.[0] || ''}
                      onChange={(e) => setDealModalData({ ...dealModalData, applicableDishIds: [e.target.value] })}
                      className="w-full bg-white rounded-xl px-3.5 py-2.5 text-xs font-bold text-zinc-900 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#DC2626] cursor-pointer"
                    >
                      {(menu || []).filter(Boolean).map(dish => (
                        <option key={dish.id} value={dish.id}>
                          {dish?.isCombo ? '🍱 [COMBO] ' : ''}{dish.name} (₹{dish.price})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Multiple Dishes Checklist */}
                {dealModalData.applicableTo === 'multiple' && (
                  <div className="pt-1.5 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                      <span>Check Dishes / Combos for this Offer:</span>
                      <button
                        type="button"
                        onClick={() => {
                          const allIds = (menu || []).map(d => d.id);
                          const isAllSelected = dealModalData.applicableDishIds?.length === allIds.length;
                          setDealModalData({ ...dealModalData, applicableDishIds: isAllSelected ? [] : allIds });
                        }}
                        className="text-[#DC2626] hover:underline cursor-pointer"
                      >
                        {dealModalData.applicableDishIds?.length === (menu || []).length ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-1 p-2 bg-white rounded-xl border border-zinc-200">
                      {(!menu || menu.length === 0) ? (
                        <div className="text-zinc-400 text-xs text-center py-2">No menu dishes found.</div>
                      ) : (
                        menu.map(dish => {
                          const isSelected = (dealModalData.applicableDishIds || []).includes(dish.id);
                          return (
                            <label 
                              key={dish.id} 
                              className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer text-xs transition-colors ${
                                isSelected ? 'bg-red-50/70 border border-red-200/60' : 'hover:bg-zinc-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  const current = dealModalData.applicableDishIds || [];
                                  const next = e.target.checked 
                                    ? [...current, dish.id]
                                    : current.filter(id => id !== dish.id);
                                  setDealModalData({ ...dealModalData, applicableDishIds: next });
                                }}
                                className="rounded text-[#DC2626] focus:ring-[#DC2626] w-4 h-4 cursor-pointer"
                              />
                              <div className="flex-1 min-w-0">
                                <span className="font-bold text-zinc-900 block truncate">
                                  {dish.name}
                                </span>
                              </div>
                              {dish?.isCombo && (
                                <span className="text-[9px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded uppercase">
                                  Combo
                                </span>
                              )}
                              <span className="text-zinc-500 font-mono font-bold text-xs shrink-0">
                                ₹{dish.price}
                              </span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-zinc-700">
                  <input
                    type="checkbox"
                    checked={dealModalData.autoApply || false}
                    onChange={(e) => setDealModalData({ ...dealModalData, autoApply: e.target.checked })}
                    className="rounded text-[#DC2626] focus:ring-[#DC2626]"
                  />
                  <span>Auto-apply at checkout</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-zinc-700">
                  <input
                    type="checkbox"
                    checked={dealModalData.firstOrderOnly || false}
                    onChange={(e) => setDealModalData({ ...dealModalData, firstOrderOnly: e.target.checked })}
                    className="rounded text-[#DC2626] focus:ring-[#DC2626]"
                  />
                  <span>First Order Only (Naye Grahak)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-zinc-700">
                  <input
                    type="checkbox"
                    checked={dealModalData.isCombo || false}
                    onChange={(e) => setDealModalData({ ...dealModalData, isCombo: e.target.checked })}
                    className="rounded text-[#DC2626] focus:ring-[#DC2626]"
                  />
                  <span className="text-amber-800">Special Combo Package (Website hero / packages cards me dikhega)</span>
                </label>
              </div>
              </div>

              {/* Sticky Footer Action Buttons */}
              <div className="p-4 sm:px-6 border-t border-zinc-100 bg-zinc-50 shrink-0 flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3.5 rounded-full bg-[#DC2626] hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider shadow-lg cursor-pointer border-0 active:scale-98 transition-all"
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

      {/* 4. SALON COMBO PACKAGE CREATOR / EDITOR MODAL */}
      {comboModalData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 sm:px-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-zinc-900">
                    {comboModalData.id ? 'EDIT VIP COMBO PACKAGE' : 'CREATE VIP COMBO PACKAGE'}
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Multiple salon services ko ek package me bundle karein aur discounted price set karein
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setComboModalData(null)}
                className="w-8 h-8 rounded-full bg-zinc-200 hover:bg-zinc-300 flex items-center justify-center text-zinc-600 transition-all cursor-pointer border-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveSalonCombo} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              {/* Package Title */}
              <div>
                <label className="text-xs font-black uppercase text-zinc-700 tracking-wider block mb-1.5">
                  Combo Package Name *
                </label>
                <input
                  type="text"
                  required
                  value={comboModalData.name || ''}
                  onChange={(e) => setComboModalData({ ...comboModalData, name: e.target.value })}
                  placeholder="e.g. Haircut + Beard Styling Combo"
                  className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-3 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all shadow-xs border-0 font-bold"
                />
              </div>

              {/* Service Multi-Select Checkboxes */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-black uppercase text-zinc-700 tracking-wider">
                    Select Services to Bundle ({comboModalData.selectedDishIds?.length || 0} Selected)
                  </label>
                  <span className="text-[11px] text-amber-700 font-bold">
                    Auto-calculates duration & MRP
                  </span>
                </div>

                <div className="max-h-44 overflow-y-auto space-y-1.5 bg-[#FFFBF7] p-2.5 rounded-2xl border border-zinc-200/80">
                  {((menu || []).filter(item => !item.isCombo && item.categoryId !== 'cat_combo' && item.category !== 'Combo Packages')).length === 0 ? (
                    <div className="text-center py-4 text-zinc-400 text-xs">
                      Salon menu me abhi koi single services nahi hain.
                    </div>
                  ) : (
                    (menu || [])
                      .filter(item => !item.isCombo && item.categoryId !== 'cat_combo' && item.category !== 'Combo Packages')
                      .map((service) => {
                        const isSelected = (comboModalData.selectedDishIds || []).includes(service.id);
                        return (
                          <label
                            key={service.id}
                            className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs transition-all ${
                              isSelected ? 'bg-amber-100/90 text-amber-950 font-bold shadow-2xs' : 'bg-white hover:bg-zinc-100 text-zinc-700'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  const currentIds = comboModalData.selectedDishIds || [];
                                  const nextIds = e.target.checked
                                    ? [...currentIds, service.id]
                                    : currentIds.filter(id => id !== service.id);
                                  
                                  const nextServices = (menu || []).filter(d => nextIds.includes(d.id));
                                  const calcDuration = nextServices.reduce((sum, d) => sum + (Number(d.time || d.durationMinutes || d.prepTime) || 30), 0);
                                  const calcOrigPrice = nextServices.reduce((sum, d) => sum + (Number(d.price) || 0), 0);

                                  setComboModalData({
                                    ...comboModalData,
                                    selectedDishIds: nextIds,
                                    time: calcDuration > 0 ? calcDuration : comboModalData.time,
                                    originalPrice: calcOrigPrice > 0 ? calcOrigPrice : comboModalData.originalPrice,
                                    description: nextServices.map(d => d.name).join(' + ')
                                  });
                                }}
                                className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                              />
                              <span className="truncate">{service.name}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] text-zinc-500 font-medium">⏱️ {service.time || service.durationMinutes || 30}m</span>
                              <span className="font-mono font-bold text-zinc-900">₹{service.price}</span>
                            </div>
                          </label>
                        );
                      })
                  )}
                </div>
              </div>

              {/* Pricing & Duration row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-black uppercase text-zinc-700 tracking-wider block mb-1">
                    Combo Offer Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={comboModalData.price || ''}
                    onChange={(e) => setComboModalData({ ...comboModalData, price: e.target.value })}
                    placeholder="e.g. 599"
                    className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-2.5 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all shadow-xs border-0 font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-black uppercase text-zinc-700 tracking-wider block mb-1">
                    Original MRP (₹)
                  </label>
                  <input
                    type="number"
                    value={comboModalData.originalPrice || ''}
                    onChange={(e) => setComboModalData({ ...comboModalData, originalPrice: e.target.value })}
                    placeholder="e.g. 850"
                    className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-2.5 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all shadow-xs border-0 font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-black uppercase text-zinc-700 tracking-wider block mb-1">
                    Duration (Minutes) *
                  </label>
                  <input
                    type="number"
                    required
                    value={comboModalData.time || ''}
                    onChange={(e) => setComboModalData({ ...comboModalData, time: e.target.value })}
                    placeholder="e.g. 50"
                    className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-2.5 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all shadow-xs border-0 font-bold"
                  />
                </div>
              </div>

              {/* Badge Selection */}
              <div>
                <label className="text-xs font-black uppercase text-zinc-700 tracking-wider block mb-1.5">
                  Combo Package Badge
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {['BESTSELLER COMBO', 'ROYAL VIP', 'BEARD SPECIAL', 'FAMILY DUO', 'SAVE ₹200', 'SPECIAL OFFER'].map(b => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setComboModalData({ ...comboModalData, badge: b })}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all border-0 cursor-pointer ${
                        comboModalData.badge === b ? 'bg-amber-500 text-black shadow-xs' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Image Selection */}
              <div>
                <label className="text-xs font-black uppercase text-zinc-700 tracking-wider block mb-1.5">
                  Package Photo
                </label>
                <div className="flex items-center gap-2 mb-2">
                  {[
                    { label: 'Scissor & Cut', url: '/images/hs_scissor_sculpt.jpg' },
                    { label: 'Beard & Fade', url: '/images/hs_razor_fade.jpg' },
                    { label: 'Trend Cut', url: '/images/10-messy-spiky-undercut-for-men.webp' },
                    { label: 'Pompadour', url: '/images/hs_pompadour_fade.jpg' },
                  ].map(preset => (
                    <button
                      key={preset.url}
                      type="button"
                      onClick={() => setComboModalData({ ...comboModalData, image: preset.url })}
                      className={`flex-1 p-1 rounded-xl border text-[11px] font-bold cursor-pointer transition-all ${
                        comboModalData.image === preset.url ? 'border-amber-500 bg-amber-50 text-amber-900' : 'border-zinc-200 bg-white text-zinc-600'
                      }`}
                    >
                      <img src={preset.url} alt={preset.label} className="w-full h-12 object-cover rounded-lg mb-1" />
                      <span className="block truncate">{preset.label}</span>
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={comboModalData.image || ''}
                  onChange={(e) => setComboModalData({ ...comboModalData, image: e.target.value })}
                  placeholder="Or enter custom image URL"
                  className="w-full bg-[#FFFBF7] rounded-xl px-3 py-2 text-xs text-zinc-900 font-mono border-0 shadow-2xs"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-black uppercase text-zinc-700 tracking-wider block mb-1">
                  Description / Inclusions
                </label>
                <textarea
                  rows={2}
                  value={comboModalData.description || ''}
                  onChange={(e) => setComboModalData({ ...comboModalData, description: e.target.value })}
                  placeholder="e.g. Signature Precision Haircut + Razor Beard Lineup & Hot Towel Finish."
                  className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-2.5 text-xs text-zinc-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all shadow-xs border-0"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-zinc-100 flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3.5 rounded-full bg-amber-500 hover:bg-amber-600 text-black font-black text-xs uppercase tracking-wider shadow-lg cursor-pointer border-0 active:scale-98 transition-all"
                >
                  {comboModalData.id ? 'UPDATE COMBO PACKAGE' : 'SAVE COMBO PACKAGE'}
                </button>
                <button
                  type="button"
                  onClick={() => setComboModalData(null)}
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
