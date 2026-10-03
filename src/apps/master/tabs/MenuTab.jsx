import React, { useState, useMemo } from 'react';
import { useMaster } from '../context/MasterContext';
import { Plus, Search, Edit2, Trash2, X, Flame } from 'lucide-react';
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
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 border-0">
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes by name or category..."
              className="w-full bg-[#FFFBF7] rounded-2xl pl-11 pr-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
            />
          </div>

          {/* Add New Dish Button */}
          <button
            onClick={() => setModalItem({ name: '', price: '', category: 'Shawarma', available: true, image: '' })}
            className="px-5 py-3 rounded-full bg-[#DC2626] hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-xl shrink-0 border-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add New Dish</span>
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {allCategoryTabs.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-black capitalize whitespace-nowrap transition-all cursor-pointer border-0 ${
                activeCategory === cat
                  ? 'bg-[#DC2626] text-white shadow-md'
                  : 'bg-[#FFFBF7] text-zinc-600 hover:text-zinc-900 shadow-xs'
              }`}
            >
              {cat === 'all' ? 'All Dishes' : cat}
            </button>
          ))}
        </div>

      </div>

      {/* Dishes Grid */}
      {filteredDishes.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center text-zinc-400 text-sm space-y-1 shadow-lg border-0">
          <p className="font-bold text-zinc-700">No dishes found in this category</p>
          <p className="text-xs">Click "Add New Dish" to add your first menu item.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDishes.map(dish => {
            const isAvail = dish.available !== false;
            return (
              <div
                key={dish.id}
                className={`bg-white rounded-3xl p-5 flex flex-col justify-between space-y-4 shadow-xl hover:shadow-2xl transition-all border-0 ${
                  !isAvail ? 'opacity-75' : ''
                }`}
              >
                
                {/* Dish Card Top: Image + Info */}
                <div className="flex items-start gap-3.5">
                  <img
                    src={getImageUrl(dish.image)}
                    alt={dish.name}
                    onError={handleImageError}
                    className="w-16 h-16 rounded-2xl object-cover bg-zinc-100 shrink-0 shadow-xs border-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700">
                        {dish.category || 'Food'}
                      </span>
                      {dish.spicy && <Flame className="w-3.5 h-3.5 text-[#DC2626]" />}
                    </div>
                    <h4 className="text-sm font-black text-zinc-900 truncate mt-1">
                      {dish.name}
                    </h4>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-base font-black text-[#DC2626]">
                        ₹{dish.price}
                      </span>
                      {dish.offerPrice && (
                        <span className="text-xs text-zinc-400 line-through">
                          ₹{dish.offerPrice}
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

                {/* Bottom Controls: Availability Toggle + Edit/Delete */}
                <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
                  
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
                      {isAvail ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </label>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setModalItem({ ...dish })}
                      className="p-2.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors cursor-pointer"
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
                      className="p-2.5 rounded-full bg-zinc-100 hover:bg-red-50 text-zinc-500 hover:text-red-600 transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white text-zinc-900 rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-4 shadow-2xl border-0">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-base font-black text-zinc-900">
                {modalItem.id ? 'Edit Menu Dish' : 'Add New Menu Item'}
              </h3>
              <button
                onClick={() => setModalItem(null)}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDish} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
                  Dish Name *
                </label>
                <input
                  type="text"
                  required
                  value={modalItem.name || ''}
                  onChange={(e) => setModalItem({ ...modalItem, name: e.target.value })}
                  placeholder="e.g. Charcoal Jumbo Shawarma"
                  className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-3 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={modalItem.price || ''}
                    onChange={(e) => setModalItem({ ...modalItem, price: e.target.value })}
                    placeholder="179"
                    className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-3 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
                    Offer Price (₹)
                  </label>
                  <input
                    type="number"
                    value={modalItem.offerPrice || ''}
                    onChange={(e) => setModalItem({ ...modalItem, offerPrice: e.target.value })}
                    placeholder="220"
                    className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-3 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={modalItem.category || ''}
                  onChange={(e) => setModalItem({ ...modalItem, category: e.target.value })}
                  placeholder="Shawarma, Burgers, Platters..."
                  className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-3 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
                  Photo URL
                </label>
                <input
                  type="url"
                  value={modalItem.image || ''}
                  onChange={(e) => setModalItem({ ...modalItem, image: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-3 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={modalItem.description || ''}
                  onChange={(e) => setModalItem({ ...modalItem, description: e.target.value })}
                  placeholder="Ingredients, saj bread, garlic toum..."
                  className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-3 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3.5 rounded-full bg-[#DC2626] hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider shadow-lg cursor-pointer border-0"
                >
                  {modalItem.id ? 'Save Updates' : 'Add to Menu'}
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

    </div>
  );
}
