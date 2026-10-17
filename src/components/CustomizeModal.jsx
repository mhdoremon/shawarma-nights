import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Flame, Plus, Minus, Sparkles, Package } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { getImageUrl, handleImageError } from '../utils/imageHelper';

export default function CustomizeModal({ item, onClose }) {
  const { addToCart } = useCart();

  const [selectedBread, setSelectedBread] = useState(null);
  const [selectedSpiciness, setSelectedSpiciness] = useState('');
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [quantity, setQuantity] = useState(1);

  const isCombo = Boolean(item?.isCombo || item?.category === 'combos');

  // Smart options for combos if Dukandar hasn't explicitly set them
  const comboDefaultBread = [
    { name: 'Toasted Rumali Roti (Included)', price: 0 },
    { name: 'Fluffy Lebanese Pita', price: 20 },
    { name: 'Crispy Arabian Saj Bread', price: 30 }
  ];
  const comboDefaultSpiciness = ['Mild Herb', 'Spicy Garlic', 'Ghost Naga Fire'];
  const comboDefaultAddons = [
    { id: 'combo_toum', name: 'Extra Garlic Toum (Famous Dip)', price: 25 },
    { id: 'combo_cheese', name: 'Add Melted Mozzarella to Wraps', price: 49 },
    { id: 'combo_fries', name: 'Upgrade to Cheesy Loaded Fries', price: 39 },
    { id: 'combo_drink', name: 'Add Extra Chilled Mint Mojito Drink', price: 49 }
  ];

  const breadOptions = (item?.options?.bread && item.options.bread.length > 0)
    ? item.options.bread
    : (isCombo ? comboDefaultBread : []);

  const spicinessOptions = (item?.options?.spiciness && item.options.spiciness.length > 0)
    ? item.options.spiciness
    : (isCombo ? comboDefaultSpiciness : []);

  const availableAddons = (item?.options?.addons && item.options.addons.length > 0)
    ? item.options.addons
    : (Array.isArray(item?.addons) && item.addons.length > 0)
    ? item.addons
    : (isCombo ? comboDefaultAddons : []);

  useEffect(() => {
    if (item) {
      if (breadOptions.length) {
        setSelectedBread(breadOptions[0]);
      } else {
        setSelectedBread(null);
      }

      if (spicinessOptions.length) {
        setSelectedSpiciness(spicinessOptions[0]);
      } else {
        setSelectedSpiciness('Standard');
      }

      setSelectedAddons([]);
      setQuantity(1);
    }
  }, [item]);

  if (!item) return null;

  // Extract included dishes for combo
  const includedItems = Array.isArray(item.comboItems) && item.comboItems.length > 0
    ? item.comboItems
    : (item.description && item.description.includes('+')
      ? item.description.split('+').map((s, i) => ({ id: `inc-${i}`, name: s.trim() }))
      : [{ id: '1', name: item.name }]);

  const breadPrice = selectedBread?.price || 0;
  const addonsPrice = selectedAddons.reduce((sum, a) => sum + (Number(a.price) || 0), 0);
  const unitPrice = (Number(item.price) || 0) + breadPrice + addonsPrice;
  const totalPrice = unitPrice * quantity;

  const toggleAddon = (addon) => {
    const key = addon.id || addon.name;
    setSelectedAddons((prev) => {
      const exists = prev.some((a) => (a.id || a.name) === key);
      if (exists) {
        return prev.filter((a) => (a.id || a.name) !== key);
      } else {
        return [...prev, addon];
      }
    });
  };

  const handleConfirmAdd = () => {
    addToCart(item, {
      bread: selectedBread,
      spiciness: selectedSpiciness,
      addons: selectedAddons,
      quantity,
      isCombo,
      comboItems: includedItems,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60">
        
        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white border border-zinc-200 rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-zinc-100 flex items-start justify-between">
            <div className="flex gap-3">
              <img
                src={getImageUrl(item.image)}
                alt={item.name}
                onError={handleImageError}
                className="w-16 h-16 rounded-xl object-cover border border-zinc-100 shrink-0"
              />
              <div>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  isCombo ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-red-50 text-red-600'
                }`}>
                  {isCombo ? '🍱 COMBO FEAST CUSTOMIZER' : 'Customize'}
                </span>
                <h2 className="text-base sm:text-lg font-bold text-zinc-900 leading-snug mt-1">
                  {item.name}
                </h2>
                <div className="text-xs font-semibold text-zinc-500 mt-0.5 flex items-center gap-2">
                  <span>Base: ₹{item.price}</span>
                  {item.originalPrice > item.price && (
                    <span className="text-emerald-600 font-bold">
                      (Save ₹{item.originalPrice - item.price})
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-all cursor-pointer"
            >
              <X className="w-5 h-5 stroke-[2]" />
            </button>
          </div>

          {/* Options Body */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">

            {/* Combo Included Items Breakdown Box */}
            {isCombo && (
              <div className="p-3.5 rounded-2xl bg-[#FFFBF7] border border-amber-200/80 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-black text-amber-950 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-[#DC2626]" />
                    <span>Included in this Combo ({includedItems.length} items):</span>
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                    Bundled • शामिल है
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-1.5 pt-1">
                  {includedItems.map((inc, i) => (
                    <div
                      key={inc.id || i}
                      className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-zinc-200/80 shadow-2xs text-xs font-bold text-zinc-800"
                    >
                      <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                      <span className="flex-1 truncate">{inc.name}</span>
                      {inc.price > 0 && (
                        <span className="text-[10px] text-zinc-400 line-through font-normal">
                          ₹{inc.price}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bread Selection */}
            {breadOptions.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-2.5">
                  {isCombo ? '1. Choose Wrap / Bread for Shawarmas:' : '1. Choose Wrap / Bread'}
                </h4>

                <div className="space-y-2">
                  {breadOptions.map((bread) => {
                    const isSelected = selectedBread?.name === bread.name;
                    return (
                      <div
                        key={bread.name}
                        onClick={() => setSelectedBread(bread)}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? 'border-red-600 bg-red-50/50 text-zinc-900 font-medium'
                            : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-red-600 bg-red-600' : 'border-zinc-300'
                          }`}>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <span>{bread.name}</span>
                        </div>
                        <span className="font-semibold text-zinc-500">
                          {bread.price === 0 ? 'Free' : `+₹${bread.price}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Spice Preference */}
            {spicinessOptions.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 stroke-[2] text-red-600" />
                  <span>{isCombo ? '2. Spice Level for Combo:' : '2. Spice Level'}</span>
                </h4>

                <div className="grid grid-cols-3 gap-2">
                  {spicinessOptions.map((spice) => {
                    const isSelected = selectedSpiciness === spice;
                    return (
                      <button
                        key={spice}
                        onClick={() => setSelectedSpiciness(spice)}
                        className={`p-2.5 rounded-xl border text-center transition-all text-xs font-medium cursor-pointer ${
                          isSelected
                            ? 'border-red-600 bg-red-50 text-red-700 font-bold'
                            : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'
                        }`}
                      >
                        {spice}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Extra Addons */}
            {availableAddons.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 stroke-[2] text-amber-500" />
                  <span>{isCombo ? '3. Addons & Upgrades for this Combo:' : '3. Extra Dips & Toppings'}</span>
                </h4>

                <div className="space-y-2">
                  {availableAddons.map((addon, aIdx) => {
                    const key = addon.id || addon.name || `addon-${aIdx}`;
                    const isSelected = selectedAddons.some((a) => (a.id || a.name) === (addon.id || addon.name));
                    return (
                      <div
                        key={key}
                        onClick={() => toggleAddon(addon)}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? 'border-red-600 bg-red-50/50 text-zinc-900 font-medium'
                            : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                            isSelected ? 'border-red-600 bg-red-600 text-white' : 'border-zinc-300'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span>{addon.name}</span>
                        </div>
                        <span className="font-semibold text-red-600">
                          +₹{addon.price}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

          {/* Sticky Bottom Actions */}
          <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 bg-white border border-zinc-200 rounded-full px-3 py-1.5">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="text-zinc-500 hover:text-zinc-900 p-0.5 cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5 stroke-[2]" />
              </button>
              <span className="font-bold text-xs text-zinc-900 w-4 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="text-zinc-500 hover:text-zinc-900 p-0.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2]" />
              </button>
            </div>

            <button
              onClick={handleConfirmAdd}
              className="flex-1 py-3 px-5 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm tracking-wide transition-all flex items-center justify-between shadow-sm cursor-pointer border-0"
            >
              <span>{isCombo ? 'Add Combo Feast to Bag' : 'Add to Order'}</span>
              <span>₹{totalPrice}</span>
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
