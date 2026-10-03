import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Flame, Plus, Minus, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { getImageUrl, handleImageError } from '../utils/imageHelper';

export default function CustomizeModal({ item, onClose }) {
  const { addToCart } = useCart();

  const [selectedBread, setSelectedBread] = useState(null);
  const [selectedSpiciness, setSelectedSpiciness] = useState('');
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (item) {
      if (item.options?.bread?.length) {
        setSelectedBread(item.options.bread[0]);
      } else {
        setSelectedBread(null);
      }

      if (item.options?.spiciness?.length) {
        setSelectedSpiciness(item.options.spiciness[0]);
      } else {
        setSelectedSpiciness('Standard');
      }

      setSelectedAddons([]);
      setQuantity(1);
    }
  }, [item]);

  if (!item) return null;

  const breadPrice = selectedBread?.price || 0;
  const addonsPrice = selectedAddons.reduce((sum, a) => sum + (a.price || 0), 0);
  const unitPrice = item.price + breadPrice + addonsPrice;
  const totalPrice = unitPrice * quantity;

  const toggleAddon = (addon) => {
    setSelectedAddons((prev) => {
      const exists = prev.some((a) => a.id === addon.id);
      if (exists) {
        return prev.filter((a) => a.id !== addon.id);
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
                <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">
                  Customize
                </span>
                <h2 className="text-base sm:text-lg font-bold text-zinc-900 leading-snug">
                  {item.name}
                </h2>
                <div className="text-xs font-semibold text-zinc-500 mt-0.5">
                  Base: ₹{item.price}
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-all"
            >
              <X className="w-5 h-5 stroke-[2]" />
            </button>
          </div>

          {/* Options */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">

            {/* Bread Selection */}
            {item.options?.bread && (
              <div>
                <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-2.5">
                  1. Choose Wrap / Bread
                </h4>

                <div className="space-y-2">
                  {item.options.bread.map((bread) => {
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
            {item.options?.spiciness && (
              <div>
                <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 stroke-[2] text-red-600" />
                  <span>2. Spice Level</span>
                </h4>

                <div className="grid grid-cols-3 gap-2">
                  {item.options.spiciness.map((spice) => {
                    const isSelected = selectedSpiciness === spice;
                    return (
                      <button
                        key={spice}
                        onClick={() => setSelectedSpiciness(spice)}
                        className={`p-2.5 rounded-xl border text-center transition-all text-xs font-medium ${
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
            {item.options?.addons && (
              <div>
                <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 stroke-[2] text-amber-500" />
                  <span>3. Extra Dips & Toppings</span>
                </h4>

                <div className="space-y-2">
                  {item.options.addons.map((addon) => {
                    const isSelected = selectedAddons.some((a) => a.id === addon.id);
                    return (
                      <div
                        key={addon.id}
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
                className="text-zinc-500 hover:text-zinc-900 p-0.5"
              >
                <Minus className="w-3.5 h-3.5 stroke-[2]" />
              </button>
              <span className="font-bold text-xs text-zinc-900 w-4 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="text-zinc-500 hover:text-zinc-900 p-0.5"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2]" />
              </button>
            </div>

            <button
              onClick={handleConfirmAdd}
              className="flex-1 py-3 px-5 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm tracking-wide transition-all flex items-center justify-between shadow-sm"
            >
              <span>Add to Order</span>
              <span>₹{totalPrice}</span>
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
