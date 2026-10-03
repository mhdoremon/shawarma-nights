import React, { useState, useMemo } from 'react';
import { useMaster } from '../context/MasterContext';
import { Plus, Search, Edit2, Trash2, Check, X, Image as ImageIcon, Flame } from 'lucide-react';
import { getImageUrl, handleImageError } from '../../../utils/imageHelper';

export default function MenuTab() {
  const { menu, categories, toggleItemAvailability, addMenuItem, updateMenuItem, deleteMenuItem, showToast } = useMaster();

  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalItem, setModalItem] = useState(null); // null (closed) | {} (add new) | { ...item } (edit)

  // Filtered dishes
  const filteredDishes = useMemo(() => {
    let list = Array.isArray(menu) ? [...menu] : [];

    if (activeCategory !== 'all') {
      list = list.filter(item => {
        const cat = item.category || item.categoryId || '';
        return cat.toLowerCase() === activeCategory.toLowerCase();
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(item => 
        (item.name || '').toLowerCase().includes(q) ||
        (item.description || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [menu, activeCategory, searchQuery]);

  // Handle Save dish form (Create or Update)
  const handleSaveDish = async (e) => {
    e.preventDefault();
    if (!modalItem.name?.trim() || !modalItem.price) {
      showToast('Name and price are required', 'error');
      return;
    }

    const payload = {
      ...modalItem,
      name: modalItem.name.trim(),
      price: Number(modalItem.price) || 0,
      offerPrice: modalItem.offerPrice ? Number(modalItem.offerPrice) : null,
      category: modalItem.category || 'Shawarma',
      available: modalItem.available !== false
    };

    if (modalItem.id) {
      await updateMenuItem(modalItem.id, payload);
    } else {
      await addMenuItem(payload);
    }
    setModalItem(null);
  };

  const allCategoryTabs = useMemo(() => {
    const list = ['all'];
    if (Array.isArray(categories)) {
      categories.forEach(c => {
        const name = typeof c === 'string' ? c : c.name || c.id;
        if (name && !list.includes(name)) list.push(name);
      });
    }
    return list;
  }, [categories]);

  return (
    <div className="space-y-5 pb-16">
      
      {/* Top Action & Search Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 sm:p-5 space-y-4">
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes by name or ingredient..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#DC2626] transition-colors"
            />
          </div>

          {/* Add New Dish Button */}
          <button
            onClick={() => setModalItem({ name: '', price: '', category: 'Shawarma', available: true, image: '' })}
            className="px-4 py-2.5 rounded-2xl bg-[#DC2626] hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Dish</span>
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {allCategoryTabs.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold capitalize whitespace-nowrap transition-all cursor-pointer ${
                activeCategory === cat
                  ? 'bg-[#DC2626] text-white shadow-md'
                  : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              {cat === 'all' ? 'All Dishes' : cat}
            </button>
          ))}
        </div>

      </div>

      {/* Dishes Grid */}
      {filteredDishes.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-12 text-center text-zinc-500 text-sm space-y-1">
          <p className="font-bold text-zinc-400">No dishes in this category</p>
          <p className="text-xs">Click "Add New Dish" to add your first menu item.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDishes.map(dish => {
            const isAvail = dish.available !== false;
            return (
              <div
                key={dish.id}
                className={`bg-zinc-900 border rounded-3xl p-4 flex flex-col justify-between space-y-3 transition-colors ${
                  isAvail ? 'border-zinc-800' : 'border-red-950/40 opacity-75'
                }`}
              >
                
                {/* Dish Card Top: Image + Info */}
                <div className="flex items-start gap-3">
                  <img
                    src={getImageUrl(dish.image)}
                    alt={dish.name}
                    onError={handleImageError}
                    className="w-16 h-16 rounded-2xl object-cover bg-zinc-950 shrink-0 border border-zinc-800"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300">
                        {dish.category || 'Food'}
                      </span>
                      {dish.spicy && <Flame className="w-3.5 h-3.5 text-amber-500" />}
                    </div>
                    <h4 className="text-sm font-black text-white truncate mt-1">
                      {dish.name}
                    </h4>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-sm font-black text-[#DC2626]">
                        ₹{dish.price}
                      </span>
                      {dish.offerPrice && (
                        <span className="text-xs text-zinc-500 line-through">
                          ₹{dish.offerPrice}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                {dish.description && (
                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {dish.description}
                  </p>
                )}

                {/* Bottom Controls: Availability Toggle + Edit/Delete */}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
                  
                  {/* Availability Toggle Switch */}
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isAvail}
                      onChange={(e) => toggleItemAvailability(dish.id, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4.5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-600 relative"></div>
                    <span className={`text-[11px] font-bold ${isAvail ? 'text-emerald-400' : 'text-zinc-500'}`}>
                      {isAvail ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </label>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setModalItem({ ...dish })}
                      className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      title="Edit Dish"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete "${dish.name}" from menu?`)) {
                          deleteMenuItem(dish.id);
                        }
                      }}
                      className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-red-500/40 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
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

      {/* DISH CREATE / EDIT MODAL */}
      {modalItem && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 text-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-black">
                {modalItem.id ? 'Edit Menu Dish' : 'Add New Menu Item'}
              </h3>
              <button
                onClick={() => setModalItem(null)}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDish} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Dish Name *
                </label>
                <input
                  type="text"
                  required
                  value={modalItem.name || ''}
                  onChange={(e) => setModalItem({ ...modalItem, name: e.target.value })}
                  placeholder="e.g. Charcoal Jumbo Shawarma"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#DC2626]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={modalItem.price || ''}
                    onChange={(e) => setModalItem({ ...modalItem, price: e.target.value })}
                    placeholder="179"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#DC2626]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    Original / Offer Price (₹)
                  </label>
                  <input
                    type="number"
                    value={modalItem.offerPrice || ''}
                    onChange={(e) => setModalItem({ ...modalItem, offerPrice: e.target.value })}
                    placeholder="220"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#DC2626]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={modalItem.category || ''}
                  onChange={(e) => setModalItem({ ...modalItem, category: e.target.value })}
                  placeholder="Shawarma, Burgers, Platters..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#DC2626]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Photo URL
                </label>
                <input
                  type="url"
                  value={modalItem.image || ''}
                  onChange={(e) => setModalItem({ ...modalItem, image: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#DC2626]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={modalItem.description || ''}
                  onChange={(e) => setModalItem({ ...modalItem, description: e.target.value })}
                  placeholder="Ingredients, saj bread, garlic toum..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#DC2626] resize-none"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-[#DC2626] hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider shadow-md cursor-pointer"
                >
                  {modalItem.id ? 'Save Updates' : 'Add to Menu'}
                </button>
                <button
                  type="button"
                  onClick={() => setModalItem(null)}
                  className="py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs cursor-pointer"
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
