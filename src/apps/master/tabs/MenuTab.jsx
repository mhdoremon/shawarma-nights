import React, { useState, useMemo, useRef } from 'react';
import { useMaster } from '../context/MasterContext';
import { Plus, Search, Edit2, Trash2, X, Flame, Sparkles, Upload, Image as ImageIcon, Star, Check, Package } from 'lucide-react';
import { getImageUrl, handleImageError } from '../../../utils/imageHelper';

export default function MenuTab() {
  const { menu, categories, toggleItemAvailability, addMenuItem, updateMenuItem, deleteMenuItem, updateHeroBanner, showToast, storeInfo, storeId, capabilities } = useMaster();
  const isSalon = storeInfo?.vertical === 'salon' || (storeId || '').includes('nash');
  const isFashion = storeInfo?.vertical === 'fashion' || (storeId || '').includes('skyline');

  // Capability-driven flags with backwards-compatible fallbacks
  const hasVegNonVeg = capabilities?.catalog?.hasVegNonVeg ?? !isSalon;
  const hasSizes = capabilities?.catalog?.hasSizes ?? isFashion;
  const hasColors = capabilities?.catalog?.hasColors ?? isFashion;
  const hasLookbook = capabilities?.catalog?.hasLookbook ?? isFashion;
  const hasServiceDuration = capabilities?.catalog?.hasServiceDuration ?? isSalon;
  const hasFoodAddons = capabilities?.catalog?.hasFoodAddons ?? (!isSalon && !isFashion);

  const itemNoun = capabilities?.catalog?.itemNoun || (hasServiceDuration ? 'Service' : (hasSizes && hasColors) ? 'Product' : 'Dish');
  const itemNounPlural = capabilities?.catalog?.itemNounPlural || (hasServiceDuration ? 'Services' : (hasSizes && hasColors) ? 'Products' : 'Dishes');
  const addBtnText = `+ ADD ${itemNoun.toUpperCase()}`;

  const [activeCategory, setActiveCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [modalItem, setModalItem] = useState(null); // Item Add/Edit Modal
  const [comboModalItem, setComboModalItem] = useState(null); // Combo Meal Add/Edit Modal
  const [heroModalDish, setHeroModalDish] = useState(null); // Set Hero Offer Modal

  // Hero Offer Modal form state
  const [heroForm, setHeroForm] = useState({
    priceText: 'Starts from',
    priceValue: '179',
    badgeText: '50% OFF — NIGHT50',
    titleLine1: 'REAL',
    titleLine2: 'CHARCOAL',
    titleHighlight: 'SHAWARMA'
  });

  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  // Ready Photo Presets adapted to capability
  const photoPresets = hasServiceDuration ? [
    { name: 'Fade Haircut', url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=80' },
    { name: 'Beard Grooming', url: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&auto=format&fit=crop&q=80' },
    { name: 'Classic Scissors', url: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800&auto=format&fit=crop&q=80' },
    { name: 'Hair Color & Styling', url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop&q=80' },
    { name: 'Facial & Glow', url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&auto=format&fit=crop&q=80' },
    { name: 'Head Massage', url: 'https://images.unsplash.com/photo-1519824145371-296894a0daa9?w=800&auto=format&fit=crop&q=80' }
  ] : (hasSizes && hasColors) ? [
    { name: 'Slick Pro Sneakers', url: 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?auto=format&fit=crop&w=1000&q=85' },
    { name: 'Retro Runners', url: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80' },
    { name: 'Streetwear Lows', url: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80' },
    { name: 'Minimalist Oxford', url: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=800&q=80' },
    { name: 'Linen Shirt', url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80' },
    { name: 'Canvas Slip-on', url: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=800&q=80' }
  ] : [
    { name: 'Classic Roll', url: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=800&auto=format&fit=crop&q=80' },
    { name: 'Spicy Shawarma', url: 'https://images.unsplash.com/photo-1561651823-34feb02250e4?w=800&auto=format&fit=crop&q=80' },
    { name: 'Charcoal Platter', url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80' },
    { name: 'Loaded Fries', url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=800&auto=format&fit=crop&q=80' },
    { name: 'Crispy Wings', url: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=800&auto=format&fit=crop&q=80' },
    { name: 'Falafel Roll', url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=80' },
    { name: 'Mint Mojito', url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&auto=format&fit=crop&q=80' },
    { name: 'Cold Shake', url: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800&auto=format&fit=crop&q=80' },
    { name: 'Rumali Combo', url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=80' }
  ];

  // Persistent Custom Categories (Bug 3: Category Retention)
  const [customCategories, setCustomCategories] = useState(() => {
    try {
      const saved = localStorage.getItem(`churuone_custom_categories_${storeId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Dynamic Category List
  const allCategories = useMemo(() => {
    const set = new Set(['ALL']);
    (menu || []).forEach(dish => {
      const c = dish.category || dish.categoryId;
      if (c && typeof c === 'string') set.add(c.trim());
    });
    (categories || []).forEach(c => {
      const name = typeof c === 'string' ? c : c.name || c.id;
      if (name) set.add(name.trim());
    });
    (customCategories || []).forEach(c => {
      if (c && typeof c === 'string') set.add(c.trim());
    });
    return Array.from(set);
  }, [menu, categories, customCategories]);

  // Combined Category Suggestions for Add/Edit Modal (Retains all previously entered categories)
  const categorySuggestions = useMemo(() => {
    const set = new Set();
    const defaults = hasServiceDuration 
      ? ['haircut', 'beard', 'combo', 'packages', 'styling', 'facial', 'spa', 'massage'] 
      : (hasSizes && hasColors)
        ? ['shoes', 'sneakers', 'shirts', 'jackets', 'trousers', 'accessories']
        : ['shawarmas', 'platters', 'fries', 'combos', 'drinks', 'starters', 'rolls'];
    defaults.forEach(c => set.add(c.toLowerCase()));
    (menu || []).forEach(d => {
      const c = (d.category || d.categoryId || '').trim().toLowerCase();
      if (c) set.add(c);
    });
    (customCategories || []).forEach(c => {
      const trimmed = (c || '').trim().toLowerCase();
      if (trimmed) set.add(trimmed);
    });
    return Array.from(set);
  }, [hasServiceDuration, hasSizes, hasColors, menu, customCategories]);

  // Filtered dishes
  const filteredDishes = useMemo(() => {
    let list = Array.isArray(menu) ? [...menu] : [];

    if (activeCategory !== 'ALL') {
      const targetCat = activeCategory.toLowerCase();
      list = list.filter(dish => {
        const c = (dish.category || dish.categoryId || '').toLowerCase();
        return c === targetCat;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(dish => 
        (dish.name || '').toLowerCase().includes(q) ||
        (dish.category || '').toLowerCase().includes(q) ||
        (dish.description || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [menu, activeCategory, searchQuery]);

  // Client-side HTML5 Canvas Image Compressor (Dukandar 2: Fast mobile gallery upload)
  const compressImage = (file, maxWidth = 1200, quality = 0.82) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > maxWidth || height > maxWidth) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxWidth) / height);
              height = maxWidth;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => resolve(event.target.result);
        img.src = event.target.result;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  };

  // Handle Image File Upload (Device / Gallery)
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const compressedBase64 = await compressImage(file);
      if (!compressedBase64) throw new Error('Compression failed');

      try {
        const res = await fetch(`https://churuone-backend.onrender.com/api/upload`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-store-id': storeId
          },
          body: JSON.stringify({
            image: compressedBase64,
            filename: file.name
          })
        });
        const data = await res.json();
        if (data.success && data.url) {
          setModalItem(prev => ({ ...prev, image: data.url }));
          showToast('Image uploaded successfully!', 'success');
        } else {
          setModalItem(prev => ({ ...prev, image: compressedBase64 }));
          showToast('Image loaded from device', 'info');
        }
      } catch (err) {
        setModalItem(prev => ({ ...prev, image: compressedBase64 }));
        showToast('Image loaded from device', 'info');
      }
    } catch (err) {
      showToast('Error processing image', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle Save dish form (Create or Update)
  const handleSaveDish = async (e) => {
    e.preventDefault();
    if (!modalItem.name?.trim() || !modalItem.price) {
      showToast('Name and price are required', 'error');
      return;
    }

    // Process availableSizes
    let availableSizes = modalItem.availableSizes;
    if (typeof availableSizes === 'string') {
      availableSizes = availableSizes.split(',').map(s => s.trim()).filter(Boolean);
    }

    // Process colors
    let colors = modalItem.colors;
    if (typeof colors === 'string') {
      colors = colors.split(',').map(c => {
        const trimmed = c.trim();
        return { name: trimmed, hex: '#1A1A1A' };
      }).filter(Boolean);
    }

    // Process durationMinutes for salons & appointment services
    const durMins = modalItem.durationMinutes ? Number(modalItem.durationMinutes) : (hasServiceDuration ? 30 : null);

    // Process bread options for customization
    let breadList = Array.isArray(modalItem.breadList)
      ? modalItem.breadList.filter(b => b.name?.trim()).map(b => ({ name: b.name.trim(), price: Number(b.price) || 0 }))
      : (modalItem.options?.bread || []);

    // Process spiciness options for customization
    let spicinessList = Array.isArray(modalItem.spicinessList)
      ? modalItem.spicinessList.filter(s => typeof s === 'string' && s.trim())
      : (modalItem.options?.spiciness || []);

    // Process addons
    let addons = modalItem.addons;
    if (typeof addons === 'string' && addons.trim()) {
      addons = addons.split(',').map(a => {
        const parts = a.split(':');
        const n = (parts[0] || '').trim();
        const p = Number(parts[1]) || 20;
        return n ? { id: `addon-${n.toLowerCase().replace(/[^a-z0-9]/g, '-')}`, name: n, price: p } : null;
      }).filter(Boolean);
    }

    let addonsList = Array.isArray(modalItem.addonsList) && modalItem.addonsList.length > 0
      ? modalItem.addonsList.filter(a => a.name?.trim()).map(a => ({
          id: a.id || `addon-${a.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          name: a.name.trim(),
          price: Number(a.price) || 0
        }))
      : (Array.isArray(addons) && addons.length > 0 ? addons : (modalItem.options?.addons || []));

    const existingOptions = modalItem.options || {};
    const updatedOptions = hasFoodAddons ? {
      ...existingOptions,
      bread: breadList,
      spiciness: spicinessList,
      addons: addonsList
    } : existingOptions;

    const payload = {
      ...modalItem,
      name: modalItem.name.trim(),
      price: Number(modalItem.price) || 0,
      originalPrice: modalItem.originalPrice ? Number(modalItem.originalPrice) : 0,
      category: (modalItem.category || (hasSizes && hasColors ? 'shoes' : hasServiceDuration ? 'haircut' : 'shawarmas')).toLowerCase(),
      isVeg: hasVegNonVeg ? Boolean(modalItem.isVeg) : false,
      badge: modalItem.badge || '',
      prepTime: modalItem.prepTime || (durMins ? `${durMins} min` : '15-20 min'),
      durationMinutes: durMins,
      time: durMins || modalItem.time,
      description: modalItem.description || '',
      available: modalItem.available !== false,
      image: modalItem.image || 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=800&auto=format&fit=crop&q=80',
      availableSizes: hasSizes ? (Array.isArray(availableSizes) && availableSizes.length > 0 ? availableSizes : (modalItem.availableSizes || [])) : [],
      colors: hasColors ? (Array.isArray(colors) && colors.length > 0 ? colors : (modalItem.colors || [])) : [],
      secondaryImage: hasLookbook ? (modalItem.secondaryImage || '') : '',
      addons: hasFoodAddons ? addonsList : [],
      options: updatedOptions,
      bookingFee: hasServiceDuration ? (modalItem.bookingFee !== undefined ? Number(modalItem.bookingFee) : 50) : undefined
    };

    if (modalItem.id) {
      await updateMenuItem(modalItem.id, payload);
    } else {
      await addMenuItem(payload);
    }

    // Persist custom category so it is retained for future dishes (Bug 3)
    const cleanCat = (payload.category || '').trim().toLowerCase();
    if (cleanCat && !customCategories.includes(cleanCat)) {
      const updatedCats = [...customCategories, cleanCat];
      setCustomCategories(updatedCats);
      try {
        localStorage.setItem(`churuone_custom_categories_${storeId}`, JSON.stringify(updatedCats));
      } catch (err) {
        console.warn('Could not save category to localStorage:', err);
      }
    }

    setModalItem(null);
  };

  // Handle Save Combo Meal
  const handleSaveCombo = async (e) => {
    e.preventDefault();
    if (!comboModalItem.name?.trim() || !comboModalItem.price) {
      showToast('Combo title and price are required', 'error');
      return;
    }

    const selectedDishes = (menu || []).filter(d => (comboModalItem.selectedDishIds || []).includes(d.id));
    const origPrice = comboModalItem.originalPrice > 0 
      ? Number(comboModalItem.originalPrice)
      : selectedDishes.reduce((sum, d) => sum + (Number(d.price) || 0), 0);

    const comboPayload = {
      ...comboModalItem,
      name: comboModalItem.name.trim(),
      price: Number(comboModalItem.price),
      originalPrice: Number(origPrice),
      category: 'combos',
      isCombo: true,
      available: comboModalItem.available !== false,
      comboItems: selectedDishes.map(d => ({ id: d.id, name: d.name, price: d.price, image: d.image })),
      image: comboModalItem.image || (selectedDishes[0]?.image || 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=80'),
      description: comboModalItem.description || selectedDishes.map(d => d.name).join(' + '),
      badge: comboModalItem.badge || (origPrice > Number(comboModalItem.price) ? `SAVE ₹${origPrice - Number(comboModalItem.price)}` : 'COMBO FEAST')
    };

    if (comboModalItem.id && (menu || []).some(d => d.id === comboModalItem.id)) {
      await updateMenuItem(comboModalItem.id, comboPayload);
      showToast(`Combo "${comboPayload.name}" updated!`, 'success');
    } else {
      await addMenuItem(comboPayload);
      showToast(`Combo "${comboPayload.name}" added to menu!`, 'success');
    }

    setComboModalItem(null);
  };

  // Open Hero Offer Setup Dialog
  const openHeroOfferModal = (dish) => {
    setHeroModalDish(dish);
    setHeroForm({
      priceText: 'Starts from',
      priceValue: String(dish.price || 179),
      badgeText: dish.badge || '50% OFF — NIGHT50',
      titleLine1: 'REAL',
      titleLine2: 'CHARCOAL',
      titleHighlight: dish.name?.split(' ')?.[0]?.toUpperCase() || 'SHAWARMA'
    });
  };

  // Save Hero Offer
  const handleSaveHeroOffer = async (e) => {
    e.preventDefault();
    if (!heroModalDish) return;

    await updateHeroBanner({
      featuredItemId: heroModalDish.id,
      circleImage: heroModalDish.image,
      dishName: heroModalDish.name,
      priceText: heroForm.priceText,
      priceValue: heroForm.priceValue,
      badgeText: heroForm.badgeText,
      titleLine1: heroForm.titleLine1,
      titleLine2: heroForm.titleLine2,
      titleHighlight: heroForm.titleHighlight
    });

    setHeroModalDish(null);
    showToast(`"${heroModalDish.name}" set as Homepage Hero Offer!`, 'success');
  };

  return (
    <div className="space-y-5 pb-16">
      
      {/* Top Action & Search Bar */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 border-0">
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={hasServiceDuration ? "Search services by name or category..." : (hasSizes && hasColors) ? "Search products by name or category..." : "Search dishes by name or category..."}
              className={`w-full bg-[#FFFBF7] rounded-2xl pl-11 pr-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:bg-white focus:ring-2 ${hasServiceDuration ? 'focus:ring-[#d4af37]' : (hasSizes && hasColors) ? 'focus:ring-zinc-900' : 'focus:ring-[#DC2626]'} focus:outline-none transition-all shadow-xs border-0`}
            />
          </div>

          {/* Add New Item Button */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={() => setModalItem({ 
                name: '', 
                price: hasServiceDuration ? '499' : (hasSizes && hasColors ? '1499' : '179'), 
                originalPrice: '0',
                category: hasServiceDuration ? 'haircut' : (hasSizes && hasColors ? 'shoes' : 'shawarmas'), 
                isVeg: false,
                badge: '',
                prepTime: hasServiceDuration ? '30 min' : '15-20 min',
                available: true, 
                image: hasServiceDuration 
                  ? 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=80'
                  : (hasSizes && hasColors
                    ? 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?auto=format&fit=crop&w=1000&q=85'
                    : 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=800&auto=format&fit=crop&q=80'),
                description: '',
                availableSizes: '',
                colors: '',
                secondaryImage: '',
                addons: '',
                breadList: hasFoodAddons ? [
                  { name: 'Toasted Rumali Roti', price: 0 },
                  { name: 'Fluffy Lebanese Pita', price: 20 },
                  { name: 'Crispy Arabian Saj Bread', price: 30 }
                ] : [],
                spicinessList: hasFoodAddons ? ['Mild Herb', 'Spicy Garlic', 'Ghost Naga Fire'] : [],
                addonsList: hasFoodAddons ? [
                  { id: 'toum', name: 'Extra Garlic Toum (Famous Dip)', price: 25 },
                  { id: 'cheese', name: 'Smoked Melted Mozzarella', price: 39 },
                  { id: 'meat', name: 'Double Charcoal Grilled Meat', price: 59 },
                  { id: 'fries_inside', name: 'Crispy Fries Wrapped Inside', price: 25 }
                ] : [],
                bookingFee: hasServiceDuration ? '50' : undefined
              })}
              className={`px-5 py-3 rounded-full ${hasServiceDuration ? 'bg-[#d4af37] hover:bg-[#b8972e]' : (hasSizes && hasColors) ? 'bg-zinc-900 hover:bg-black' : 'bg-[#DC2626] hover:bg-red-700'} text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-xl shrink-0 border-0 active:scale-98 transition-all`}
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>{addBtnText}</span>
            </button>

            {/* Create Combo Meal Button (For Food Stores) */}
            {hasFoodAddons && (
              <button
                type="button"
                onClick={() => setComboModalItem({
                  name: '',
                  price: '',
                  originalPrice: 0,
                  badge: 'SAVE ₹100',
                  description: '',
                  image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=80',
                  selectedDishIds: [],
                  category: 'combos',
                  isCombo: true,
                  available: true
                })}
                className="px-5 py-3 rounded-full bg-zinc-900 hover:bg-black text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-xl shrink-0 border-0 active:scale-98 transition-all"
              >
                <Package className="w-4 h-4 text-amber-400 stroke-[2.5]" />
                <span>+ CREATE COMBO MEAL</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {allCategories.map(cat => {
            const count = cat === 'ALL'
              ? (menu?.length || 0)
              : (menu?.filter(d => (d.category || d.categoryId || '').toLowerCase() === cat.toLowerCase())?.length || 0);

            const active = activeCategory.toLowerCase() === cat.toLowerCase();

            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-black capitalize whitespace-nowrap transition-all cursor-pointer border-0 flex items-center gap-1.5 ${
                  active
                    ? 'bg-[#DC2626] text-white shadow-md'
                    : 'bg-[#FFFBF7] text-zinc-600 hover:text-zinc-900 shadow-xs'
                }`}
              >
                <span>{cat === 'ALL' ? `All ${itemNounPlural}` : cat}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  active ? 'bg-white text-[#DC2626]' : 'bg-zinc-200 text-zinc-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

      </div>

      {/* Dishes Grid */}
      {filteredDishes.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center text-zinc-400 text-sm space-y-1 shadow-lg border-0">
          <p className="font-bold text-zinc-700">No {itemNounPlural.toLowerCase()} found in category "{activeCategory}"</p>
          <p className="text-xs">Click "{addBtnText}" to add your {itemNoun.toLowerCase()} to this section.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDishes.map(dish => {
            const isAvail = dish.available !== false;
            return (
              <div
                key={dish.id}
                className={`bg-white rounded-3xl p-5 flex flex-col justify-between space-y-4 shadow-xl hover:shadow-2xl transition-all border-0 ${
                  !isAvail ? 'opacity-70' : ''
                }`}
              >
                
                {/* Dish Card Top: Image + Info */}
                <div className="flex items-start gap-3.5">
                  <img
                    src={getImageUrl(dish.image)}
                    alt={dish.name}
                    onError={handleImageError}
                    className="w-20 h-20 sm:w-22 sm:h-22 aspect-square rounded-2xl object-cover bg-zinc-100 shrink-0 shadow-sm border border-zinc-100"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700">
                        {dish.category || itemNoun}
                      </span>
                      {hasVegNonVeg && (
                        dish.isVeg ? (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
                            VEG
                          </span>
                        ) : (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-red-50 text-red-700">
                            NON-VEG
                          </span>
                        )
                      )}
                      {dish.badge && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-50 text-amber-800">
                          {dish.badge}
                        </span>
                      )}
                      {dish.isCombo && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                          <Package className="w-3 h-3 text-amber-700" />
                          <span>COMBO</span>
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-black text-zinc-900 truncate mt-1">
                      {dish.name}
                    </h4>

                    {/* Quick In-line Price Edit on Card */}
                    <div className="flex items-center gap-2 mt-1">
                      <div className="inline-flex items-center bg-[#FFFBF7] rounded-xl px-2.5 py-0.5 border border-zinc-200/80 shadow-xs focus-within:border-[#DC2626] focus-within:ring-1 focus-within:ring-[#DC2626] transition-all" title="Quick edit price directly">
                        <span className="text-xs font-black text-[#DC2626] mr-0.5">₹</span>
                        <input
                          type="number"
                          defaultValue={dish.price}
                          key={`${dish.id}-${dish.price}`}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.currentTarget.blur();
                            }
                          }}
                          onBlur={async (e) => {
                            const newPrice = Number(e.target.value);
                            if (!isNaN(newPrice) && newPrice > 0 && newPrice !== Number(dish.price)) {
                              await updateMenuItem({ ...dish, price: newPrice });
                              showToast(`Price for "${dish.name}" updated to ₹${newPrice}!`, 'success');
                            }
                          }}
                          className="w-14 text-sm font-black text-zinc-900 bg-transparent border-0 p-0 focus:outline-none"
                        />
                      </div>
                      {dish.originalPrice > 0 && (
                        <span className="text-xs text-zinc-400 line-through">
                          ₹{dish.originalPrice}
                        </span>
                      )}
                      {dish.prepTime && (
                        <span className="text-[10px] text-zinc-400 font-medium">
                          • {dish.prepTime}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                {dish.description && (
                  <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                    {dish.description}
                  </p>
                )}

                {/* BUTTON: SET ON HOMEPAGE HERO BANNER (Only when Hero Banner & Offers are toggled ON) */}
                {storeInfo?.settings?.showHeroBanner !== false && storeInfo?.settings?.showOfferCards !== false && !hasServiceDuration && (capabilities?.settings?.hasHeroBanner !== false) && (
                  <button
                    type="button"
                    onClick={() => openHeroOfferModal(dish)}
                    className="w-full py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-black flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-0"
                    title="Make this dish the Hero Offer on Homepage"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>SET AS HERO OFFER ON HOMEPAGE</span>
                  </button>
                )}

                {/* Bottom Controls: Availability Toggle + Edit/Delete */}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
                  
                  {/* Availability Toggle Switch */}
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isAvail}
                      onChange={(e) => toggleItemAvailability(dish.id, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600 relative"></div>
                    <span className={`text-[11px] font-bold ${isAvail ? 'text-emerald-700' : 'text-zinc-400'}`}>
                      {isAvail ? 'In Stock' : 'Sold Out'}
                    </span>
                  </label>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        if (dish.isCombo) {
                          setComboModalItem({
                            ...dish,
                            selectedDishIds: Array.isArray(dish.comboItems) 
                              ? dish.comboItems.map(c => c.id) 
                              : (dish.selectedDishIds || [])
                          });
                        } else {
                          setModalItem({ 
                            ...dish, 
                            breadList: dish.options?.bread || [],
                            spicinessList: dish.options?.spiciness || ['Mild Herb', 'Spicy Garlic', 'Ghost Naga Fire'],
                            addonsList: dish.options?.addons || (Array.isArray(dish.addons) ? dish.addons : []),
                            bookingFee: dish.bookingFee !== undefined ? String(dish.bookingFee) : (hasServiceDuration ? '50' : undefined) 
                          });
                        }
                      }}
                      className="p-2.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors cursor-pointer border-0"
                      title="Edit Item"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete "${dish.name}" from menu?`)) {
                          deleteMenuItem(dish.id);
                        }
                      }}
                      className="p-2.5 rounded-full bg-zinc-100 hover:bg-red-50 text-zinc-500 hover:text-red-600 transition-colors cursor-pointer border-0"
                      title="Delete Dish"
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

      {/* MODAL 1: ADD / EDIT DISH DIALOG (Full Feature Set matching Android App) */}
      {modalItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white text-zinc-900 rounded-t-[32px] sm:rounded-3xl max-w-lg w-full max-h-[92vh] sm:max-h-[88vh] flex flex-col shadow-2xl border-0 overflow-hidden">
            {/* Sticky Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-white shrink-0">
              <h3 className="text-base font-black text-zinc-900">
                {modalItem.id ? `Edit ${itemNoun}` : `Add New ${itemNoun}`}
              </h3>
              <button
                type="button"
                onClick={() => setModalItem(null)}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDish} className="flex-1 flex flex-col min-h-0">
              {/* Scrollable Form Body */}
              <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-4 space-y-4">
              
              {/* 1. PHOTO PICKER SECTION (Device Upload + Presets + URL) */}
              <div className="bg-[#FFFBF7] p-4 rounded-2xl space-y-3 border-0">
                <div className="flex items-center justify-between">
                  <label className={`block text-xs font-black ${hasServiceDuration ? 'text-[#d4af37]' : (hasSizes && hasColors) ? 'text-zinc-900' : 'text-[#DC2626]'} uppercase tracking-wider`}>
                    {itemNoun.toUpperCase()} PHOTO (GALLERY YA PRESET SE)
                  </label>
                  {isUploading && <span className="text-[10px] text-zinc-500 font-bold">Uploading...</span>}
                </div>

                <div className="flex items-center gap-3">
                  <img
                    src={modalItem.image || 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=800&auto=format&fit=crop&q=80'}
                    alt="Preview"
                    className="w-20 h-20 rounded-2xl object-cover bg-zinc-200 shrink-0 shadow-sm"
                  />

                  <div className="flex-1 space-y-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={`w-full py-2.5 px-3 rounded-full ${hasServiceDuration ? 'bg-[#d4af37] hover:bg-[#b8972e]' : (hasSizes && hasColors) ? 'bg-zinc-900 hover:bg-black' : 'bg-[#DC2626] hover:bg-red-700'} text-white font-black text-xs uppercase flex items-center justify-center gap-1.5 shadow-sm cursor-pointer border-0`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Gallery Se Upload Karein</span>
                    </button>

                    <input
                      type="text"
                      value={modalItem.image || ''}
                      onChange={(e) => setModalItem({ ...modalItem, image: e.target.value })}
                      placeholder="Live Photo URL / Link"
                      className="w-full bg-white rounded-xl px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#DC2626] shadow-2xs border-0"
                    />
                  </div>
                </div>

                {/* 1-Tap Ready Photo Presets */}
                <div>
                  <span className="text-[10px] text-zinc-500 font-bold block mb-1">
                    1-Tap Ready {itemNoun} Photo Presets:
                  </span>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {photoPresets.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setModalItem({ ...modalItem, image: preset.url })}
                        className="px-2.5 py-1 rounded-full bg-white hover:bg-zinc-100 text-zinc-700 text-[10px] font-black whitespace-nowrap shadow-2xs border-0 cursor-pointer"
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 2. ITEM NAME + QUICK CHIPS */}
              <div>
                <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
                  {itemNoun.toUpperCase()} NAME *
                </label>
                <input
                  type="text"
                  required
                  value={modalItem.name || ''}
                  onChange={(e) => setModalItem({ ...modalItem, name: e.target.value })}
                  placeholder={hasServiceDuration ? "e.g. Royal Fade Haircut & Beard Grooming" : (hasSizes && hasColors) ? "e.g. Slick Pro Streetwear Sneakers" : "e.g. Charcoal Chicken Shawarma Roll"}
                  className={`w-full bg-[#FFFBF7] rounded-2xl px-4 py-3 text-sm text-zinc-900 focus:bg-white focus:ring-2 ${hasServiceDuration ? 'focus:ring-[#d4af37]' : (hasSizes && hasColors) ? 'focus:ring-zinc-900' : 'focus:ring-[#DC2626]'} focus:outline-none transition-all shadow-xs border-0`}
                />
                <div className="flex items-center gap-1.5 overflow-x-auto pt-1.5 scrollbar-none">
                  {(hasServiceDuration
                    ? ['Fade Haircut', 'Beard Trim & Styling', 'Gold Facial', 'Head Massage', 'Hair Spa', 'Classic Shave', 'Royal Grooming Combo', 'Executive Hair + Beard Combo']
                    : (hasSizes && hasColors)
                      ? ['Slick Pro Sneakers', 'Retro Runners', 'Streetwear Lows', 'Minimalist Oxford', 'Linen Shirt', 'Canvas Slip-on']
                      : ['Classic Chicken Shawarma', 'Spicy Garlic Shawarma', 'Charcoal Platter Special', 'Loaded Cheese Fries', 'Falafel Hummus Roll', 'Mint Mojito', 'Crispy Chicken Wings']
                  ).map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setModalItem({ ...modalItem, name: n })}
                      className="px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-700 text-[10px] font-bold whitespace-nowrap border-0 cursor-pointer"
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. CATEGORY + QUICK CHIPS */}
              <div>
                <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
                  CATEGORY *
                </label>
                <input
                  type="text"
                  required
                  value={modalItem.category || ''}
                  onChange={(e) => setModalItem({ ...modalItem, category: e.target.value })}
                  placeholder={hasServiceDuration ? "haircut, beard, combo, packages, styling, facial, spa..." : (hasSizes && hasColors) ? "shoes, shirts, jackets, trousers, accessories..." : "shawarmas, platters, fries, drinks..."}
                  className={`w-full bg-[#FFFBF7] rounded-2xl px-4 py-2.5 text-sm text-zinc-900 focus:bg-white focus:ring-2 ${hasServiceDuration ? 'focus:ring-[#d4af37]' : (hasSizes && hasColors) ? 'focus:ring-zinc-900' : 'focus:ring-[#DC2626]'} focus:outline-none transition-all shadow-xs border-0`}
                />
                <div className="flex items-center gap-1.5 pt-1.5 flex-wrap">
                  {categorySuggestions.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setModalItem({ ...modalItem, category: c })}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border-0 cursor-pointer transition-all ${
                        (modalItem.category || '').toLowerCase() === c.toLowerCase()
                          ? 'bg-[#DC2626] text-white shadow-xs'
                          : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <span className="text-[10px] text-zinc-400 mt-1 block">
                  💡 Nayi category likhne par wo automatically niche options me hamesha ke liye save ho jayegi.
                </span>
              </div>

              {/* 4. FOOD TYPE (Veg / Non-Veg) - ONLY IF hasVegNonVeg */}
              {hasVegNonVeg && (
                <div>
                  <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1.5">
                    FOOD TYPE
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setModalItem({ ...modalItem, isVeg: false })}
                      className={`py-2 px-3 rounded-full text-xs font-black uppercase transition-all cursor-pointer border-0 ${
                        !modalItem.isVeg ? 'bg-red-600 text-white shadow-md' : 'bg-zinc-100 text-zinc-600'
                      }`}
                    >
                      Non-Veg
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalItem({ ...modalItem, isVeg: true })}
                      className={`py-2 px-3 rounded-full text-xs font-black uppercase transition-all cursor-pointer border-0 ${
                        modalItem.isVeg ? 'bg-emerald-600 text-white shadow-md' : 'bg-zinc-100 text-zinc-600'
                      }`}
                    >
                      100% Pure Veg
                    </button>
                  </div>
                </div>
              )}

              {/* 5. PRICES (Selling Price & Original Strike Price) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
                    SELLING PRICE (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={modalItem.price || ''}
                    onChange={(e) => setModalItem({ ...modalItem, price: e.target.value })}
                    placeholder="179"
                    className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-2.5 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
                  />
                  <div className="flex items-center gap-1 pt-1.5 flex-wrap">
                    {['99', '129', '149', '179', '199', '249'].map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setModalItem({ ...modalItem, price: p })}
                        className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 text-[10px] font-bold border-0 cursor-pointer"
                      >
                        ₹{p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
                    STRIKE PRICE (₹)
                  </label>
                  <input
                    type="number"
                    value={modalItem.originalPrice || ''}
                    onChange={(e) => setModalItem({ ...modalItem, originalPrice: e.target.value })}
                    placeholder="0 (No Strike)"
                    className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-2.5 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
                  />
                  <div className="flex items-center gap-1 pt-1.5 flex-wrap">
                    {['0', '199', '249', '299', '349'].map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setModalItem({ ...modalItem, originalPrice: p })}
                        className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 text-[10px] font-bold border-0 cursor-pointer"
                      >
                        ₹{p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 6. BADGE TAG & PREP TIME */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
                    BADGE TAG
                  </label>
                  <input
                    type="text"
                    value={modalItem.badge || ''}
                    onChange={(e) => setModalItem({ ...modalItem, badge: e.target.value })}
                    placeholder="Bestseller, Special"
                    className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-2.5 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
                  />
                  <div className="flex items-center gap-1 pt-1.5 flex-wrap">
                    {['Bestseller', 'Chef Special', 'Extra Spicy', 'Must Try'].map(b => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setModalItem({ ...modalItem, badge: b })}
                        className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 text-[9px] font-bold border-0 cursor-pointer"
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
                    {hasServiceDuration ? 'SERVICE DURATION' : 'PREP TIME'}
                  </label>
                  <input
                    type="text"
                    value={modalItem.prepTime || (hasServiceDuration ? '30 min' : '15-20 min')}
                    onChange={(e) => setModalItem({ ...modalItem, prepTime: e.target.value })}
                    placeholder={hasServiceDuration ? '30 min' : '15-20 min'}
                    className={`w-full bg-[#FFFBF7] rounded-2xl px-4 py-2.5 text-sm text-zinc-900 focus:bg-white focus:ring-2 ${hasServiceDuration ? 'focus:ring-[#d4af37]' : (hasSizes && hasColors) ? 'focus:ring-zinc-900' : 'focus:ring-[#DC2626]'} focus:outline-none transition-all shadow-xs border-0`}
                  />
                  <div className="flex items-center gap-1 pt-1.5 flex-wrap">
                    {(hasServiceDuration ? ['20 min', '30 min', '45 min', '60 min'] : ['10-15 min', '15-20 min', '20-25 min']).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setModalItem({ ...modalItem, prepTime: t })}
                        className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 text-[9px] font-bold border-0 cursor-pointer"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 7. DESCRIPTION */}
              <div>
                <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
                  DESCRIPTION
                </label>
                <textarea
                  rows={2}
                  value={modalItem.description || ''}
                  onChange={(e) => setModalItem({ ...modalItem, description: e.target.value })}
                  placeholder={hasServiceDuration ? "Service details, grooming products used..." : (hasSizes && hasColors) ? "Material, fabric, fit, styling tips..." : "Ingredients, toasted saj bread, garlic toum..."}
                  className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-2.5 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0 resize-none"
                />
              </div>

              {/* 8. STOCK AVAILABILITY CHIPS */}
              <div>
                <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1.5">
                  STOCK AVAILABILITY
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setModalItem({ ...modalItem, available: true })}
                    className={`py-2 px-3 rounded-full text-xs font-black uppercase transition-all cursor-pointer border-0 ${
                      modalItem.available !== false ? 'bg-emerald-600 text-white shadow-md' : 'bg-zinc-100 text-zinc-600'
                    }`}
                  >
                    In Stock (Uplabdh)
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalItem({ ...modalItem, available: false })}
                    className={`py-2 px-3 rounded-full text-xs font-black uppercase transition-all cursor-pointer border-0 ${
                      modalItem.available === false ? 'bg-red-600 text-white shadow-md' : 'bg-zinc-100 text-zinc-600'
                    }`}
                  >
                    Sold Out (Khatam)
                  </button>
                </div>
              </div>

              {/* 9. DYNAMIC ATTRIBUTES: SIZES, COLORS, DURATION, ADDONS */}
              {(hasSizes || hasColors || hasLookbook || hasServiceDuration || hasFoodAddons) && (
                <div className="pt-2 border-t border-zinc-100 space-y-3">
                  <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    ✦ {itemNoun} Customization & Attributes
                  </div>

                  {/* SIZES (Footwear / Apparel / Fashion) */}
                  {hasSizes && (
                    <div>
                      <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
                        AVAILABLE SIZES (Comma Separated)
                      </label>
                      <input
                        type="text"
                        value={Array.isArray(modalItem.availableSizes) ? modalItem.availableSizes.join(', ') : (modalItem.availableSizes || '')}
                        onChange={(e) => setModalItem({ ...modalItem, availableSizes: e.target.value })}
                        placeholder="e.g. UK 6, UK 7, UK 8, UK 9, UK 10 or S, M, L, XL"
                        className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-2 text-xs text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
                      />
                      <div className="flex items-center gap-1 pt-1 flex-wrap">
                        {['UK 6, UK 7, UK 8, UK 9, UK 10', 'S, M, L, XL, XXL', 'UK 7', 'UK 8', 'UK 9', 'UK 10'].map(sz => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => setModalItem({ ...modalItem, availableSizes: sz })}
                            className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 text-[9px] font-bold border-0 cursor-pointer"
                          >
                            {sz}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* COLORS (Fashion & Retail) */}
                  {hasColors && (
                    <div>
                      <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
                        COLOR SWATCHES (Comma Separated)
                      </label>
                      <input
                        type="text"
                        value={Array.isArray(modalItem.colors) ? modalItem.colors.map(c => typeof c === 'string' ? c : c.name).join(', ') : (modalItem.colors || '')}
                        onChange={(e) => setModalItem({ ...modalItem, colors: e.target.value })}
                        placeholder="e.g. Onyx Black, Glacier White, Camel Tan"
                        className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-2 text-xs text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
                      />
                      <div className="flex items-center gap-1 pt-1 flex-wrap">
                        {['Onyx Black, Glacier White', 'Navy Blue, Camel Tan', 'Pure White', 'Jet Black'].map(col => (
                          <button
                            key={col}
                            type="button"
                            onClick={() => setModalItem({ ...modalItem, colors: col })}
                            className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 text-[9px] font-bold border-0 cursor-pointer"
                          >
                            {col}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* LOOKBOOK / SECONDARY PHOTO */}
                  {hasLookbook && (
                    <div>
                      <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
                        SECONDARY / LOOKBOOK PHOTO (URL)
                      </label>
                      <input
                        type="url"
                        value={modalItem.secondaryImage || ''}
                        onChange={(e) => setModalItem({ ...modalItem, secondaryImage: e.target.value })}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-2 text-xs text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
                      />
                    </div>
                  )}

                  {/* SERVICE DURATION IN MINUTES (Salon / Appointments) */}
                  {hasServiceDuration && (
                    <div>
                      <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
                        EXACT SERVICE DURATION (Minutes for Calendar Collision) *
                      </label>
                      <input
                        type="number"
                        value={modalItem.durationMinutes || ''}
                        onChange={(e) => setModalItem({ ...modalItem, durationMinutes: e.target.value })}
                        placeholder="30"
                        className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-2 text-xs text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#d4af37] focus:outline-none transition-all shadow-xs border-0"
                      />
                      <div className="flex items-center gap-1 pt-1 flex-wrap">
                        {['15', '30', '45', '60', '90', '120'].map(m => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setModalItem({ ...modalItem, durationMinutes: m, prepTime: `${m} min` })}
                            className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 text-[9px] font-bold border-0 cursor-pointer"
                          >
                            {m} Mins
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ADVANCE BOOKING TOKEN FEE (Salon / Appointments) */}
                  {hasServiceDuration && (
                    <div>
                      <label className="block text-[11px] font-black text-[#d4af37] uppercase tracking-wider mb-1">
                        ADVANCE BOOKING TOKEN FEE (₹ FOR RESERVING THIS SERVICE) *
                      </label>
                      <input
                        type="number"
                        value={modalItem.bookingFee !== undefined ? modalItem.bookingFee : '50'}
                        onChange={(e) => setModalItem({ ...modalItem, bookingFee: e.target.value })}
                        placeholder="50"
                        className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-2 text-xs text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#d4af37] focus:outline-none transition-all shadow-xs border-0 font-bold"
                      />
                      <div className="flex items-center gap-1 pt-1 flex-wrap">
                        {['0', '30', '50', '100', '150', '200'].map(fee => (
                          <button
                            key={fee}
                            type="button"
                            onClick={() => setModalItem({ ...modalItem, bookingFee: fee })}
                            className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 text-[9px] font-bold border-0 cursor-pointer"
                          >
                            ₹{fee} {fee === '0' ? '(Free)' : 'Advance'}
                          </button>
                        ))}
                      </div>
                      <span className="text-[10px] text-zinc-500 mt-1 block">
                        Customer ko is specific service ke slot book karte waqt itna token advance jama karna hoga.
                      </span>
                    </div>
                  )}

                  {/* FOOD DISH CUSTOMIZATION STUDIO (Wrap/Bread, Spiciness, Addons) */}
                  {hasFoodAddons && (
                    <div className="space-y-4 pt-2 border-t border-zinc-100">
                      
                      {/* Section 1: Wrap / Bread Options */}
                      <div className="bg-[#FFFBF7] p-3.5 rounded-2xl border border-zinc-200/80 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="block text-[11px] font-black text-zinc-900 uppercase tracking-wider">
                              1. Wrap / Bread Options ({modalItem.breadList?.length || 0})
                            </label>
                            <p className="text-[10px] text-zinc-500">Customer ko wrap choose karne ka option milega</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const curr = Array.isArray(modalItem.breadList) ? [...modalItem.breadList] : [];
                              setModalItem({
                                ...modalItem,
                                breadList: [...curr, { name: '', price: 0 }]
                              });
                            }}
                            className="px-2.5 py-1 rounded-lg bg-zinc-900 text-white text-[10px] font-bold cursor-pointer"
                          >
                            + Add Wrap
                          </button>
                        </div>

                        {/* Bread Items List */}
                        <div className="space-y-1.5">
                          {(modalItem.breadList || []).map((bread, bIdx) => (
                            <div key={bIdx} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-zinc-200">
                              <input
                                type="text"
                                value={bread.name || ''}
                                onChange={(e) => {
                                  const updated = [...modalItem.breadList];
                                  updated[bIdx] = { ...updated[bIdx], name: e.target.value };
                                  setModalItem({ ...modalItem, breadList: updated });
                                }}
                                placeholder="e.g. Toasted Rumali Roti"
                                className="flex-1 text-xs font-bold text-zinc-900 border-0 p-0 focus:outline-none"
                              />
                              <div className="flex items-center gap-1 bg-zinc-50 px-2 py-1 rounded-lg border border-zinc-200 shrink-0">
                                <span className="text-[10px] text-zinc-500 font-bold">+₹</span>
                                <input
                                  type="number"
                                  value={bread.price ?? 0}
                                  onChange={(e) => {
                                    const updated = [...modalItem.breadList];
                                    updated[bIdx] = { ...updated[bIdx], price: Number(e.target.value) || 0 };
                                    setModalItem({ ...modalItem, breadList: updated });
                                  }}
                                  className="w-10 text-xs font-mono font-bold text-zinc-900 border-0 p-0 focus:outline-none text-right"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = modalItem.breadList.filter((_, idx) => idx !== bIdx);
                                  setModalItem({ ...modalItem, breadList: updated });
                                }}
                                className="p-1 text-zinc-400 hover:text-red-600 transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Quick Presets for Bread */}
                        <div className="flex items-center gap-1 pt-1 flex-wrap">
                          <span className="text-[10px] font-bold text-zinc-400 mr-1">Quick Add:</span>
                          {[
                            { name: 'Toasted Rumali Roti', price: 0 },
                            { name: 'Fluffy Lebanese Pita', price: 20 },
                            { name: 'Crispy Arabian Saj Bread', price: 30 },
                            { name: 'Kuboos Bread', price: 10 }
                          ].map(preset => (
                            <button
                              key={preset.name}
                              type="button"
                              onClick={() => {
                                const curr = Array.isArray(modalItem.breadList) ? [...modalItem.breadList] : [];
                                if (!curr.some(b => b.name === preset.name)) {
                                  setModalItem({ ...modalItem, breadList: [...curr, preset] });
                                }
                              }}
                              className="px-2 py-0.5 rounded-md bg-white text-zinc-700 text-[9px] font-bold border border-zinc-200 cursor-pointer hover:bg-zinc-100"
                            >
                              + {preset.name} (+₹{preset.price})
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Section 2: Spiciness Levels */}
                      <div className="bg-[#FFFBF7] p-3.5 rounded-2xl border border-zinc-200/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="block text-[11px] font-black text-zinc-900 uppercase tracking-wider flex items-center gap-1">
                              <Flame className="w-3 h-3 text-orange-500" />
                              <span>2. Spiciness Levels ({modalItem.spicinessList?.length || 0})</span>
                            </label>
                            <p className="text-[10px] text-zinc-500">Customer apni pasand ka teekhapan select karega</p>
                          </div>
                        </div>

                        {/* Active Spice Chips */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {(modalItem.spicinessList || []).map((spice, sIdx) => (
                            <span 
                              key={sIdx} 
                              className="inline-flex items-center gap-1 bg-white text-orange-800 border border-orange-200 px-2.5 py-1 rounded-xl text-xs font-bold shadow-2xs"
                            >
                              <span>{spice}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = modalItem.spicinessList.filter((_, idx) => idx !== sIdx);
                                  setModalItem({ ...modalItem, spicinessList: updated });
                                }}
                                className="text-zinc-400 hover:text-red-600 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>

                        {/* Quick Presets for Spice */}
                        <div className="flex items-center gap-1 pt-1 flex-wrap">
                          <span className="text-[10px] font-bold text-zinc-400 mr-1">Quick Add:</span>
                          {['Mild Herb', 'Spicy Garlic', 'Ghost Naga Fire', 'Medium Teekha', 'Extra Spicy'].map(sp => (
                            <button
                              key={sp}
                              type="button"
                              onClick={() => {
                                const curr = Array.isArray(modalItem.spicinessList) ? [...modalItem.spicinessList] : [];
                                if (!curr.includes(sp)) {
                                  setModalItem({ ...modalItem, spicinessList: [...curr, sp] });
                                }
                              }}
                              className="px-2 py-0.5 rounded-md bg-white text-zinc-700 text-[9px] font-bold border border-zinc-200 cursor-pointer hover:bg-zinc-100"
                            >
                              + {sp}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Section 3: Addons & Extra Toppings */}
                      <div className="bg-[#FFFBF7] p-3.5 rounded-2xl border border-zinc-200/80 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="block text-[11px] font-black text-zinc-900 uppercase tracking-wider">
                              3. Addons & Extra Toppings ({modalItem.addonsList?.length || 0})
                            </label>
                            <p className="text-[10px] text-zinc-500">Cheese, Garlic Toum, French Fries and extra meat</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const curr = Array.isArray(modalItem.addonsList) ? [...modalItem.addonsList] : [];
                              setModalItem({
                                ...modalItem,
                                addonsList: [...curr, { id: `addon-${Date.now()}`, name: '', price: 20 }]
                              });
                            }}
                            className="px-2.5 py-1 rounded-lg bg-zinc-900 text-white text-[10px] font-bold cursor-pointer"
                          >
                            + Add Addon
                          </button>
                        </div>

                        {/* Addons List */}
                        <div className="space-y-1.5">
                          {(modalItem.addonsList || []).map((addon, aIdx) => (
                            <div key={aIdx} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-zinc-200">
                              <input
                                type="text"
                                value={addon.name || ''}
                                onChange={(e) => {
                                  const updated = [...modalItem.addonsList];
                                  updated[aIdx] = { ...updated[aIdx], name: e.target.value };
                                  setModalItem({ ...modalItem, addonsList: updated });
                                }}
                                placeholder="e.g. Extra Garlic Toum"
                                className="flex-1 text-xs font-bold text-zinc-900 border-0 p-0 focus:outline-none"
                              />
                              <div className="flex items-center gap-1 bg-zinc-50 px-2 py-1 rounded-lg border border-zinc-200 shrink-0">
                                <span className="text-[10px] text-zinc-500 font-bold">+₹</span>
                                <input
                                  type="number"
                                  value={addon.price ?? 20}
                                  onChange={(e) => {
                                    const updated = [...modalItem.addonsList];
                                    updated[aIdx] = { ...updated[aIdx], price: Number(e.target.value) || 0 };
                                    setModalItem({ ...modalItem, addonsList: updated });
                                  }}
                                  className="w-10 text-xs font-mono font-bold text-zinc-900 border-0 p-0 focus:outline-none text-right"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = modalItem.addonsList.filter((_, idx) => idx !== aIdx);
                                  setModalItem({ ...modalItem, addonsList: updated });
                                }}
                                className="p-1 text-zinc-400 hover:text-red-600 transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Quick Presets for Addons */}
                        <div className="flex items-center gap-1 pt-1 flex-wrap">
                          <span className="text-[10px] font-bold text-zinc-400 mr-1">Quick Add:</span>
                          {[
                            { name: 'Extra Garlic Toum (Famous Dip)', price: 25 },
                            { name: 'Smoked Melted Mozzarella', price: 39 },
                            { name: 'Double Charcoal Grilled Meat', price: 59 },
                            { name: 'Crispy Fries Wrapped Inside', price: 25 },
                            { name: 'Extra Jalapeños & Pickles', price: 20 }
                          ].map(preset => (
                            <button
                              key={preset.name}
                              type="button"
                              onClick={() => {
                                const curr = Array.isArray(modalItem.addonsList) ? [...modalItem.addonsList] : [];
                                if (!curr.some(a => a.name === preset.name)) {
                                  setModalItem({ 
                                    ...modalItem, 
                                    addonsList: [...curr, { id: `addon-${preset.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`, ...preset }] 
                                  });
                                }
                              }}
                              className="px-2 py-0.5 rounded-md bg-white text-zinc-700 text-[9px] font-bold border border-zinc-200 cursor-pointer hover:bg-zinc-100"
                            >
                              + {preset.name.split('(')[0]} (+₹{preset.price})
                            </button>
                          ))}
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              )}

              </div>

              {/* Sticky Footer (Buttons always visible on both Mobile and PC) */}
              <div className="p-4 px-6 border-t border-zinc-100 bg-white/95 backdrop-blur-xs shrink-0 flex items-center gap-2">
                <button
                  type="submit"
                  className={`flex-1 py-3.5 rounded-full ${hasServiceDuration ? 'bg-[#d4af37] hover:bg-[#b8972e]' : (hasSizes && hasColors) ? 'bg-zinc-900 hover:bg-black' : 'bg-[#DC2626] hover:bg-red-700'} text-white font-black text-xs uppercase tracking-wider shadow-lg cursor-pointer border-0 active:scale-98 transition-all`}
                >
                  {modalItem.id ? `UPDATE ${itemNoun.toUpperCase()}` : `ADD ${itemNoun.toUpperCase()} TO ${hasServiceDuration ? 'SERVICES' : 'MENU'}`}
                </button>
                <button
                  type="button"
                  onClick={() => setModalItem(null)}
                  className="py-3.5 px-5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs cursor-pointer border-0"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 1.5: COMBO MEAL BUILDER & EDITOR */}
      {comboModalItem && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white text-zinc-900 rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border-0 overflow-hidden my-auto">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-zinc-100 flex items-center justify-between shrink-0 bg-stone-900 text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-black flex items-center justify-center font-bold">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <span>{comboModalItem.id ? 'Edit Combo Meal' : 'Create New Combo Meal'}</span>
                    <span className="text-[10px] bg-amber-400 text-black font-black px-2 py-0.5 rounded-full uppercase">
                      Bundle
                    </span>
                  </h3>
                  <p className="text-[11px] text-stone-300">Multiple dishes ko bundle karke special price par bechein</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setComboModalItem(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveCombo} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
              
              {/* Combo Title */}
              <div>
                <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
                  COMBO NAME / TITLE *
                </label>
                <input
                  type="text"
                  required
                  value={comboModalItem.name || ''}
                  onChange={(e) => setComboModalItem({ ...comboModalItem, name: e.target.value })}
                  placeholder="e.g. The Royal Duo Shawarma Feast"
                  className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-2.5 text-sm font-bold text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
                />
              </div>

              {/* Select Dishes to Bundle */}
              <div className="space-y-2 bg-[#FFFBF7] p-3.5 rounded-2xl border border-zinc-200/80">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-black text-zinc-900 uppercase tracking-wider">
                    SELECT DISHES TO BUNDLE ({(comboModalItem.selectedDishIds || []).length} SELECTED)
                  </label>
                  <span className="text-[10px] font-bold text-zinc-500">
                    Click dishes to add/remove
                  </span>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 bg-white rounded-xl border border-zinc-200">
                  {(!menu || menu.length === 0) ? (
                    <div className="text-zinc-400 text-center py-4">No dishes found in menu.</div>
                  ) : (
                    menu.filter(d => !d.isCombo || d.id === comboModalItem.id).map(dish => {
                      const isSelected = (comboModalItem.selectedDishIds || []).includes(dish.id);
                      return (
                        <div
                          key={dish.id}
                          onClick={() => {
                            const current = comboModalItem.selectedDishIds || [];
                            const next = isSelected 
                              ? current.filter(id => id !== dish.id)
                              : [...current, dish.id];
                            
                            // Auto-sum selected dishes prices
                            const selDishes = menu.filter(d => next.includes(d.id));
                            const autoOrig = selDishes.reduce((sum, d) => sum + (Number(d.price) || 0), 0);
                            
                            setComboModalItem({
                              ...comboModalItem,
                              selectedDishIds: next,
                              originalPrice: autoOrig
                            });
                          }}
                          className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all border ${
                            isSelected 
                              ? 'bg-amber-50/80 border-amber-300 shadow-2xs' 
                              : 'bg-white border-zinc-200/70 hover:bg-zinc-50'
                          }`}
                        >
                          <img
                            src={getImageUrl(dish.image)}
                            alt={dish.name}
                            onError={handleImageError}
                            className="w-10 h-10 rounded-lg object-cover bg-zinc-100 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h5 className="font-bold text-zinc-900 truncate text-xs">{dish.name}</h5>
                            <span className="text-[10px] text-zinc-400 block">{dish.category || 'Dish'}</span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-mono font-bold text-xs text-zinc-800">₹{dish.price}</span>
                            <div className={`w-4 h-4 rounded-full mt-0.5 ml-auto flex items-center justify-center border ${
                              isSelected ? 'bg-amber-500 border-amber-500 text-white' : 'border-zinc-300'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Pricing & Savings Live Math Box */}
              {(() => {
                const selectedDishes = (menu || []).filter(d => (comboModalItem.selectedDishIds || []).includes(d.id));
                const autoCalculatedOriginal = selectedDishes.reduce((sum, d) => sum + (Number(d.price) || 0), 0);
                const comboSellingPrice = Number(comboModalItem.price) || 0;
                const savings = autoCalculatedOriginal > comboSellingPrice ? autoCalculatedOriginal - comboSellingPrice : 0;
                const savingsPercent = autoCalculatedOriginal > 0 && savings > 0 
                  ? Math.round((savings / autoCalculatedOriginal) * 100) 
                  : 0;

                return (
                  <div className="grid grid-cols-2 gap-3 bg-gradient-to-r from-red-50 to-amber-50 p-3.5 rounded-2xl border border-red-200/80">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-1">
                        Combined Item Total:
                      </label>
                      <div className="text-base font-black font-mono text-zinc-700 line-through">
                        ₹{autoCalculatedOriginal}
                      </div>
                      <span className="text-[10px] text-zinc-400">Sum of selected items</span>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-[#DC2626] uppercase tracking-wider mb-1">
                        COMBO OFFER PRICE (₹) *
                      </label>
                      <input
                        type="number"
                        required
                        value={comboModalItem.price || ''}
                        onChange={(e) => setComboModalItem({ ...comboModalItem, price: e.target.value })}
                        placeholder="e.g. 349"
                        className="w-full bg-white rounded-xl px-3 py-1.5 text-sm font-black text-[#DC2626] border border-red-300 focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
                      />
                      {savings > 0 && (
                        <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full inline-block mt-1">
                          Save ₹{savings} ({savingsPercent}% OFF)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Combo Badge */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
                    COMBO BADGE (RIBBON)
                  </label>
                  <input
                    type="text"
                    value={comboModalItem.badge || ''}
                    onChange={(e) => setComboModalItem({ ...comboModalItem, badge: e.target.value })}
                    placeholder="e.g. SAVE ₹100, DUO SPECIAL"
                    className="w-full bg-[#FFFBF7] rounded-2xl px-3.5 py-2 text-xs font-bold text-zinc-900 border-0 shadow-xs focus:bg-white focus:ring-2 focus:ring-[#DC2626]"
                  />
                  <div className="flex items-center gap-1 pt-1 flex-wrap">
                    {['SAVE ₹100', 'SAVE ₹150', 'DUO SPECIAL', 'WEEKEND FEAST', 'PARTY PACK'].map(bd => (
                      <button
                        key={bd}
                        type="button"
                        onClick={() => setComboModalItem({ ...comboModalItem, badge: bd })}
                        className="px-2 py-0.5 rounded-md bg-zinc-100 text-[9px] font-bold text-zinc-700 hover:bg-zinc-200 cursor-pointer"
                      >
                        {bd}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
                    COMBO PHOTO (URL)
                  </label>
                  <input
                    type="text"
                    value={comboModalItem.image || ''}
                    onChange={(e) => setComboModalItem({ ...comboModalItem, image: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-[#FFFBF7] rounded-2xl px-3.5 py-2 text-xs text-zinc-900 border-0 shadow-xs focus:bg-white focus:ring-2 focus:ring-[#DC2626]"
                  />
                  <div className="flex items-center gap-1 pt-1 flex-wrap">
                    {[
                      { name: 'Feast 1', url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=80' },
                      { name: 'Feast 2', url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80' },
                      { name: 'Party Platter', url: 'https://images.unsplash.com/photo-1561651823-34feb02250e4?w=800&auto=format&fit=crop&q=80' }
                    ].map(im => (
                      <button
                        key={im.name}
                        type="button"
                        onClick={() => setComboModalItem({ ...comboModalItem, image: im.url })}
                        className="px-2 py-0.5 rounded-md bg-zinc-100 text-[9px] font-bold text-zinc-700 hover:bg-zinc-200 cursor-pointer"
                      >
                        {im.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Combo Description */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider">
                    COMBO DESCRIPTION
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const sel = (menu || []).filter(d => (comboModalItem.selectedDishIds || []).includes(d.id));
                      if (sel.length > 0) {
                        setComboModalItem({
                          ...comboModalItem,
                          description: sel.map(d => d.name).join(' + ')
                        });
                      }
                    }}
                    className="text-[10px] font-bold text-[#DC2626] hover:underline cursor-pointer"
                  >
                    Auto-Fill from Selected Items
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={comboModalItem.description || ''}
                  onChange={(e) => setComboModalItem({ ...comboModalItem, description: e.target.value })}
                  placeholder="e.g. 2x Sultan Shawarma + 1x Loaded Peri Peri Fries + 2x Mint Mojito"
                  className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-2 text-xs text-zinc-900 border-0 shadow-xs focus:bg-white focus:ring-2 focus:ring-[#DC2626] resize-none"
                />
              </div>

              {/* Submit & Cancel Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3.5 rounded-full bg-[#DC2626] hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider shadow-lg cursor-pointer border-0 active:scale-98 transition-all"
                >
                  {comboModalItem.id ? 'UPDATE COMBO MEAL' : 'SAVE & PUBLISH COMBO MEAL'}
                </button>
                <button
                  type="button"
                  onClick={() => setComboModalItem(null)}
                  className="py-3.5 px-5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs cursor-pointer border-0"
                >
                  Cancel
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SET HOMEPAGE HERO OFFER DIALOG (Exact Android App showSetHeroOfferDialog) */}
      {heroModalDish && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white text-zinc-900 rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-4 shadow-2xl border-0">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-base font-black text-zinc-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Homepage Hero Offer Setup</span>
                </h3>
                <p className="text-xs text-zinc-500 font-medium">Set this dish on main website hero section</p>
              </div>
              <button
                onClick={() => setHeroModalDish(null)}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Dish Preview Box */}
            <div className="flex items-center gap-3 bg-[#FFFBF7] p-3.5 rounded-2xl shadow-xs">
              <img
                src={getImageUrl(heroModalDish.image)}
                alt={heroModalDish.name}
                className="w-16 h-16 rounded-2xl object-cover bg-zinc-200 shrink-0 shadow-xs"
              />
              <div>
                <h4 className="text-sm font-black text-zinc-900">{heroModalDish.name}</h4>
                <div className="text-xs text-zinc-500 mt-0.5">
                  Menu Price: <strong className="text-zinc-900">₹{heroModalDish.price}</strong> • Rating: 4.9
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveHeroOffer} className="space-y-3.5">
              
              {/* Price Prefix + Chips */}
              <div>
                <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
                  PRICE PREFIX TEXT
                </label>
                <input
                  type="text"
                  value={heroForm.priceText}
                  onChange={(e) => setHeroForm({ ...heroForm, priceText: e.target.value })}
                  placeholder="Starts from, Special Offer"
                  className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-2.5 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
                />
                <div className="flex items-center gap-1 pt-1.5 flex-wrap">
                  {['Starts from', 'Special Offer', "Today's Deal", 'Only at', 'Limited Deal', 'Hot Deal'].map(pr => (
                    <button
                      key={pr}
                      type="button"
                      onClick={() => setHeroForm({ ...heroForm, priceText: pr })}
                      className="px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-700 text-[10px] font-bold border-0 cursor-pointer"
                    >
                      {pr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Offer Price Value */}
              <div>
                <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
                  OFFER PRICE (₹)
                </label>
                <input
                  type="text"
                  value={heroForm.priceValue}
                  onChange={(e) => setHeroForm({ ...heroForm, priceValue: e.target.value })}
                  placeholder="179"
                  className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-2.5 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
                />
              </div>

              {/* Badge Sticker Text + Chips */}
              <div>
                <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
                  BADGE TEXT
                </label>
                <input
                  type="text"
                  value={heroForm.badgeText}
                  onChange={(e) => setHeroForm({ ...heroForm, badgeText: e.target.value })}
                  placeholder="50% OFF — NIGHT50"
                  className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-2.5 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
                />
                <div className="flex items-center gap-1 pt-1.5 flex-wrap">
                  {['50% OFF — NIGHT50', 'CHEF SPECIAL', 'BESTSELLER', 'LIMITED TIME', 'HOT DEAL'].map(b => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setHeroForm({ ...heroForm, badgeText: b })}
                      className="px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-700 text-[10px] font-bold border-0 cursor-pointer"
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3.5 rounded-full bg-[#DC2626] hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider shadow-lg cursor-pointer border-0"
                >
                  SAVE & PUBLISH HERO OFFER
                </button>
                <button
                  type="button"
                  onClick={() => setHeroModalDish(null)}
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
