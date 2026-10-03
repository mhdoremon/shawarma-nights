import React, { useState } from 'react';
import { useMaster } from '../context/MasterContext';
import { Plus, Tag, Trash2, X, Percent, Check, IndianRupee } from 'lucide-react';

export default function OffersTab() {
  const { deals, addDeal, toggleDealActive, deleteDeal, showToast } = useMaster();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    discountType: 'percentage', // 'percentage' | 'flat'
    discountPercent: 50,
    flatDiscount: 50,
    maxDiscount: 100,
    minOrder: 199,
    firstOrderOnly: false,
    autoApply: false
  });

  const handleCreateDeal = async (e) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      showToast('Promo code is required', 'error');
      return;
    }

    const newDeal = {
      code: formData.code.trim().toUpperCase(),
      title: formData.title.trim() || `${formData.discountType === 'percentage' ? `${formData.discountPercent}% OFF` : `₹${formData.flatDiscount} OFF`}`,
      discountType: formData.discountType,
      discountPercent: formData.discountType === 'percentage' ? Number(formData.discountPercent) : null,
      flatDiscount: formData.discountType === 'flat' ? Number(formData.flatDiscount) : null,
      maxDiscount: Number(formData.maxDiscount) || null,
      minOrder: Number(formData.minOrder) || 0,
      firstOrderOnly: Boolean(formData.firstOrderOnly),
      autoApply: Boolean(formData.autoApply),
      isActive: true,
      active: true,
      usageCount: 0
    };

    await addDeal(newDeal);
    setIsModalOpen(false);
    setFormData({
      code: '',
      title: '',
      discountType: 'percentage',
      discountPercent: 50,
      flatDiscount: 50,
      maxDiscount: 100,
      minOrder: 199,
      firstOrderOnly: false,
      autoApply: false
    });
  };

  return (
    <div className="space-y-5 pb-16">
      
      {/* Top Action Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white">Discounts & Promo Coupons</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Configure checkout discount codes, percentage offers, and minimum order limits
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-2xl bg-[#DC2626] hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-md shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Deal</span>
        </button>
      </div>

      {/* Deals Cards List */}
      {(!deals || deals.length === 0) ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-12 text-center text-zinc-500 text-sm space-y-1">
          <p className="font-bold text-zinc-400">No active deals found</p>
          <p className="text-xs">Click "Create New Deal" to launch your first promotional offer.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {deals.map(deal => {
            const isActive = deal.isActive !== false && deal.active !== false;

            return (
              <div
                key={deal.id || deal.code}
                className={`bg-zinc-900 border rounded-3xl p-5 flex flex-col justify-between space-y-4 transition-colors ${
                  isActive ? 'border-zinc-800' : 'border-zinc-800/40 opacity-70'
                }`}
              >
                
                {/* Deal Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-black px-3 py-1 rounded-xl bg-zinc-950 border border-zinc-800 text-white tracking-widest uppercase">
                      {deal.code}
                    </span>
                    <h3 className="text-base font-black text-white mt-2">
                      {deal.title || 'Special Discount'}
                    </h3>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {isActive ? 'Active' : 'Paused'}
                  </span>
                </div>

                {/* Deal Conditions Breakdown */}
                <div className="space-y-1 text-xs text-zinc-400 bg-zinc-950/70 p-3 rounded-2xl border border-zinc-800/50">
                  <div className="flex justify-between">
                    <span>Discount Type:</span>
                    <strong className="text-zinc-200 capitalize">{deal.discountType || 'Percentage'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Discount Value:</span>
                    <strong className="text-white">
                      {deal.discountType === 'flat' ? `₹${deal.flatDiscount || 0}` : `${deal.discountPercent || 0}%`}
                      {deal.maxDiscount ? ` (Max ₹${deal.maxDiscount})` : ''}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Min Order Required:</span>
                    <strong className="text-zinc-200">₹{deal.minOrder || 0}</strong>
                  </div>
                  {deal.autoApply && (
                    <div className="text-[11px] text-amber-400 font-bold mt-1">
                      ⚡ Auto-applies at checkout
                    </div>
                  )}
                </div>

                {/* Bottom Toggle & Delete */}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => toggleDealActive(deal.id, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4.5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-600 relative"></div>
                    <span className="text-[11px] font-bold text-zinc-400">
                      {isActive ? 'Live' : 'Paused'}
                    </span>
                  </label>

                  <button
                    onClick={() => {
                      if (window.confirm(`Delete coupon "${deal.code}"?`)) {
                        deleteDeal(deal.id);
                      }
                    }}
                    className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-red-500/40 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                    title="Delete Deal"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* CREATE DEAL MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 text-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-black">Create Promo Code</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDeal} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. NIGHT50, FESTIVE100"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white uppercase tracking-widest font-black focus:outline-none focus:border-[#DC2626]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Promo Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. 50% OFF Midnight Special"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#DC2626]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    Discount Type
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#DC2626] cursor-pointer"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Cash (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    {formData.discountType === 'percentage' ? 'Percent (1-100%)' : 'Flat Off (₹)'}
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.discountType === 'percentage' ? formData.discountPercent : formData.flatDiscount}
                    onChange={(e) => {
                      if (formData.discountType === 'percentage') {
                        setFormData({ ...formData, discountPercent: e.target.value });
                      } else {
                        setFormData({ ...formData, flatDiscount: e.target.value });
                      }
                    }}
                    placeholder="50"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#DC2626]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    Min Order Value (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.minOrder}
                    onChange={(e) => setFormData({ ...formData, minOrder: e.target.value })}
                    placeholder="199"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#DC2626]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    Max Discount Cap (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.maxDiscount}
                    onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                    placeholder="100"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#DC2626]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                  <input
                    type="checkbox"
                    checked={formData.autoApply}
                    onChange={(e) => setFormData({ ...formData, autoApply: e.target.checked })}
                    className="rounded bg-zinc-950 border-zinc-800 text-[#DC2626]"
                  />
                  <span>Auto-apply at checkout</span>
                </label>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-[#DC2626] hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider shadow-md cursor-pointer"
                >
                  Activate Deal
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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
