import React, { useState, useMemo, useEffect } from 'react';
import { useMaster } from '../context/MasterContext';
import { 
  Star, 
  Trash2, 
  Plus, 
  Utensils, 
  X, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Store, 
  Filter, 
  Search, 
  Check, 
  RefreshCw,
  Sparkles,
  MessageSquare
} from 'lucide-react';

export default function ReviewsTab() {
  const { 
    reviews, 
    showToast, 
    storeId, 
    capabilities, 
    deleteReview,
    cityReviewsData,
    isLoadingCityReviews,
    loadCityReviews,
    toggleStoreReviewPermission
  } = useMaster();

  const isMarketplace = storeId === 'churuone' || capabilities?.storeType === 'marketplace' || capabilities?.vertical === 'marketplace';
  const isSalon = !isMarketplace && ((storeId || '').includes('nash') || capabilities?.vertical === 'salon');

  // Super Admin view states
  const [subTab, setSubTab] = useState('permissions'); // 'permissions' | 'platform' | 'partner_stores'
  const [selectedStoreFilter, setSelectedStoreFilter] = useState('all');
  const [selectedRatingFilter, setSelectedRatingFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [togglingStore, setTogglingStore] = useState(null);

  // Merchant add review modal state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newReview, setNewReview] = useState({
    name: '',
    rating: 5,
    comment: '',
    dish: isSalon ? 'Classic Precision Haircut' : 'Charcoal Special Shawarma'
  });

  // Load city reviews when Super Admin enters
  useEffect(() => {
    if (isMarketplace && loadCityReviews) {
      loadCityReviews();
    }
  }, [isMarketplace, loadCityReviews]);

  // Handle store permission toggle
  const handleTogglePermission = async (targetStoreId, currentCanEdit) => {
    setTogglingStore(targetStoreId);
    try {
      await toggleStoreReviewPermission(targetStoreId, !currentCanEdit);
    } catch (e) {
      showToast('Permission update failed: ' + e.message, 'error');
    } finally {
      setTogglingStore(null);
    }
  };

  // Partner store reviews combined with store filter
  const allStoreReviews = useMemo(() => {
    if (!cityReviewsData?.storeReviews) return reviews || [];
    return cityReviewsData.storeReviews;
  }, [cityReviewsData, reviews]);

  const filteredStoreReviews = useMemo(() => {
    return allStoreReviews.filter(rev => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        (rev.name || '').toLowerCase().includes(q) ||
        (rev.comment || '').toLowerCase().includes(q) ||
        (rev.dish || rev.item || '').toLowerCase().includes(q);

      const matchesStore = selectedStoreFilter === 'all' || rev.storeId === selectedStoreFilter;
      const matchesRating = selectedRatingFilter === 'all' || Number(rev.rating) === Number(selectedRatingFilter);

      return matchesSearch && matchesStore && matchesRating;
    });
  }, [allStoreReviews, searchQuery, selectedStoreFilter, selectedRatingFilter]);

  // Average rating
  const avgRating = useMemo(() => {
    const list = Array.isArray(reviews) ? reviews : [];
    if (list.length === 0) return '4.9';
    const sum = list.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
    return (sum / list.length).toFixed(1);
  }, [reviews]);

  const handleDeleteReview = async (reviewId, targetStoreId = storeId) => {
    if (!window.confirm('Delete this review permanently?')) return;
    try {
      if (deleteReview) {
        await deleteReview(reviewId, targetStoreId);
      } else {
        await fetch(`https://churuone-backend.onrender.com/api/reviews/${reviewId}`, {
          method: 'DELETE',
          headers: { 'x-store-id': targetStoreId }
        });
        showToast('Review deleted', 'info');
      }
      if (isMarketplace && loadCityReviews) {
        loadCityReviews();
      }
    } catch (err) {
      showToast('Delete error: ' + err.message, 'error');
    }
  };

  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!newReview.name?.trim() || !newReview.comment?.trim()) {
      showToast('Name and comment required', 'error');
      return;
    }

    try {
      await fetch(`https://churuone-backend.onrender.com/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': storeId
        },
        body: JSON.stringify({
          name: newReview.name.trim(),
          rating: Number(newReview.rating),
          comment: newReview.comment.trim(),
          dish: newReview.dish.trim()
        })
      });
      showToast('Review posted successfully', 'success');
      setIsAddOpen(false);
      setNewReview({ name: '', rating: 5, comment: '', dish: isSalon ? 'Classic Precision Haircut' : 'Charcoal Special Shawarma' });
    } catch (err) {
      showToast('Error posting review', 'error');
    }
  };

  // ─── SUPER ADMIN VIEW ───
  if (isMarketplace) {
    const permissions = cityReviewsData?.permissions || {
      shawarma: true,
      skyline: true,
      'nash-studio': true
    };

    const storesList = [
      { id: 'shawarma', name: 'Shawarma Nights', vertical: 'Charcoal Kitchen & Dining', badge: '🌯 Food' },
      { id: 'skyline', name: 'Skyline Premium Outfits', vertical: 'Luxury Menswear & Bespoke Apparel', badge: '👔 Fashion' },
      { id: 'nash-studio', name: 'Nash Studio', vertical: 'Salon, Barbershop & Luxury Grooming', badge: '✂️ Salon' }
    ];

    return (
      <div className="space-y-6 pb-20 max-w-7xl mx-auto font-sans">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-stone-900 via-zinc-900 to-black text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-gradient-to-l from-amber-500/20 to-transparent pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400 text-stone-950 text-xs font-black uppercase tracking-wider shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Super Admin Trust & Moderation</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                REVIEWS & MERCHANT MODERATION RIGHTS
              </h2>
              <p className="text-xs sm:text-sm text-stone-300 max-w-2xl leading-relaxed">
                Yahan se aap tay kar sakte hain ki dukandaro ko reviews edit/delete karne ka right dena hai ya nahi. Customer feedback authentic rahe isliye aap merchant permission lock kar sakte hain, aur ChuruOne aur sabhi dukanon ke reviews moderate kar sakte hain.
              </p>
            </div>

            <button
              onClick={() => loadCityReviews()}
              disabled={isLoadingCityReviews}
              className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/20 active:scale-95 shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingCityReviews ? 'animate-spin' : ''}`} />
              <span>Sync All Reviews</span>
            </button>
          </div>
        </div>

        {/* 1. DUKANDAR REVIEWS EDIT PERMISSION MANAGEMENT CARDS */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xl border-0 space-y-4">
          <div>
            <h3 className="text-base font-black text-zinc-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-500" />
              <span>Dukandar Review Permissions (Merchant Moderation Rights)</span>
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Agar permission OFF kar di jaye, toh dukandar apne portal se kisi customer ka review delete nahi kar sakega.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {storesList.map(st => {
              const canEdit = permissions[st.id] !== false;
              const isToggling = togglingStore === st.id;

              return (
                <div 
                  key={st.id} 
                  className={`p-5 rounded-3xl border transition-all flex flex-col justify-between ${
                    canEdit 
                      ? 'bg-emerald-50/30 border-emerald-200' 
                      : 'bg-zinc-50 border-zinc-200'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-zinc-900">{st.name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-zinc-700 border border-zinc-200">
                        {st.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 line-clamp-1">{st.vertical}</p>

                    <div className="pt-2">
                      <span className={`text-[11px] font-black px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 ${
                        canEdit 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-zinc-200 text-zinc-700'
                      }`}>
                        {canEdit ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                        <span>{canEdit ? 'Can Edit Reviews (ON)' : 'Permission Locked (OFF)'}</span>
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-200/60 flex items-center justify-between">
                    <span className="text-[11px] text-zinc-400 font-medium">Merchant Rights:</span>
                    <button
                      onClick={() => handleTogglePermission(st.id, canEdit)}
                      disabled={isToggling}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm active:scale-95 ${
                        canEdit
                          ? 'bg-zinc-900 text-white hover:bg-black'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                    >
                      {isToggling ? 'Updating...' : canEdit ? 'Lock Permission' : 'Grant Permission'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. SUB-TABS: CHURUONE REVIEWS VS ALL PARTNER STORES REVIEWS */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xl border-0 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSubTab('permissions')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  subTab === 'permissions'
                    ? 'bg-zinc-900 text-white shadow-sm'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                👑 ChuruOne Platform Reviews ({cityReviewsData?.platformReviews?.length || 0})
              </button>
              <button
                onClick={() => setSubTab('partner_stores')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  subTab === 'partner_stores'
                    ? 'bg-amber-500 text-stone-950 shadow-sm'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                🏬 Partner Stores Universal Inspector ({allStoreReviews.length})
              </button>
            </div>

            {subTab === 'partner_stores' && (
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedStoreFilter}
                  onChange={(e) => setSelectedStoreFilter(e.target.value)}
                  className="bg-[#FFFBF7] text-xs font-bold px-3 py-1.5 rounded-xl border border-zinc-200 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Stores</option>
                  <option value="shawarma">Shawarma Nights</option>
                  <option value="skyline">Skyline Outfits</option>
                  <option value="nash-studio">Nash Studio</option>
                </select>

                <select
                  value={selectedRatingFilter}
                  onChange={(e) => setSelectedRatingFilter(e.target.value)}
                  className="bg-[#FFFBF7] text-xs font-bold px-3 py-1.5 rounded-xl border border-zinc-200 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Stars</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="2">2 Stars</option>
                  <option value="1">1 Star</option>
                </select>
              </div>
            )}
          </div>

          {/* SubTab 1: Platform Reviews */}
          {subTab === 'permissions' && (
            <div className="space-y-4">
              <div className="text-xs text-zinc-500">
                ChuruOne marketplace homepage aur central shopping experience par aane wale reviews.
              </div>

              {(!cityReviewsData?.platformReviews || cityReviewsData.platformReviews.length === 0) ? (
                <div className="py-12 text-center text-zinc-400 text-xs">
                  Abhi ChuruOne platform par koi review nahi hai.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cityReviewsData.platformReviews.map(rev => (
                    <div key={rev.id || Math.random()} className="bg-[#FFFBF7] rounded-3xl p-5 border border-zinc-200/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-black text-zinc-900">{rev.name}</h4>
                          <span className="text-[10px] text-zinc-400">{rev.date || 'Recent'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full text-xs font-black">
                          <span>{rev.rating || 5}</span>
                          <Star className="w-3 h-3 fill-amber-500" />
                        </div>
                      </div>

                      <p className="text-xs text-zinc-700 leading-relaxed italic bg-white p-3 rounded-2xl shadow-2xs">
                        "{rev.comment}"
                      </p>

                      <div className="pt-2 border-t border-zinc-200/60 flex justify-end">
                        <button
                          onClick={() => handleDeleteReview(rev.id, 'churuone')}
                          className="p-2 rounded-full bg-zinc-100 hover:bg-red-50 text-zinc-500 hover:text-red-600 transition-colors cursor-pointer"
                          title="Delete Review"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SubTab 2: Partner Stores Universal Inspector */}
          {subTab === 'partner_stores' && (
            <div className="space-y-4">
              {filteredStoreReviews.length === 0 ? (
                <div className="py-12 text-center text-zinc-400 text-xs">
                  Diye gaye filter criteria ke anusar koi review nahi mila.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredStoreReviews.map(rev => (
                    <div key={rev.id || Math.random()} className="bg-white rounded-3xl p-5 border border-zinc-200 shadow-md space-y-3 flex flex-col justify-between">
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 block mb-1">
                              {rev.storeName || rev.storeId || 'Partner Store'}
                            </span>
                            <h4 className="text-xs font-black text-zinc-900">{rev.name}</h4>
                            <span className="text-[10px] text-zinc-400">{rev.date || 'Recent review'}</span>
                          </div>

                          <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full text-xs font-black">
                            <span>{rev.rating || 5}</span>
                            <Star className="w-3 h-3 fill-amber-500" />
                          </div>
                        </div>

                        {rev.dish && (
                          <div className="text-[10px] font-bold text-zinc-500 bg-zinc-50 px-2 py-1 rounded-xl">
                            Item: {rev.dish}
                          </div>
                        )}

                        <p className="text-xs text-zinc-700 leading-relaxed italic bg-[#FFFBF7] p-3 rounded-2xl">
                          "{rev.comment}"
                        </p>
                      </div>

                      <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
                        <span className="text-[10px] text-zinc-400">Super Admin Override</span>
                        <button
                          onClick={() => handleDeleteReview(rev.id, rev.storeId)}
                          className="p-2 rounded-full bg-zinc-100 hover:bg-red-50 text-zinc-500 hover:text-red-600 transition-colors cursor-pointer"
                          title="Delete/Moderate Review"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    );
  }

  // ─── STANDARD MERCHANT REVIEWS VIEW (FOR REGULAR SHOPS) ───
  return (
    <div className="space-y-5 pb-16">
      
      {/* Top Rating Summary */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-0">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex flex-col items-center justify-center shrink-0 shadow-xs">
            <span className="text-2xl font-black leading-none">{avgRating}</span>
            <div className="flex text-amber-500 mt-1">
              <Star className="w-3 h-3 fill-amber-500" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-black text-zinc-900">Customer Reviews & Ratings</h2>
            <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
              Verified customer feedback and ratings ({reviews?.length || 0} reviews)
            </p>
          </div>
        </div>

        {!isSalon && (
          <button
            onClick={() => setIsAddOpen(true)}
            className="px-5 py-3 rounded-full bg-[#DC2626] hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg hover:shadow-xl shrink-0 border-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Manual Review</span>
          </button>
        )}
      </div>

      {/* Reviews Grid */}
      {(!reviews || reviews.length === 0) ? (
        <div className="bg-white rounded-3xl p-12 text-center text-zinc-400 text-sm space-y-1 shadow-lg border-0">
          <p className="font-bold text-zinc-700">No reviews yet</p>
          <p className="text-xs">Customers ordering or booking through website can leave verified reviews.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reviews.map(rev => (
            <div
              key={rev.id || Math.random()}
              className="bg-white rounded-3xl p-6 flex flex-col justify-between space-y-4 shadow-xl hover:shadow-2xl transition-all border-0"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-black text-zinc-900">
                      {rev.name || 'Verified Customer'}
                    </h4>
                    <span className="text-[11px] text-zinc-400 font-medium">
                      {rev.date || 'Recent review'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full font-black text-xs shadow-xs">
                    <span>{rev.rating || 5}</span>
                    <Star className="w-3 h-3 fill-amber-500" />
                  </div>
                </div>

                {rev.comment?.trim() ? (
                  <p className="text-xs text-zinc-600 leading-relaxed italic bg-[#FFFBF7] p-3.5 rounded-2xl shadow-xs">
                    "{rev.comment.trim()}"
                  </p>
                ) : null}

                {rev.dish && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 text-[11px] text-zinc-700 font-bold">
                    <Utensils className="w-3 h-3 text-[#DC2626]" />
                    <span>{rev.dish}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-zinc-100 flex justify-end">
                <button
                  onClick={() => handleDeleteReview(rev.id)}
                  className="p-2.5 rounded-full bg-zinc-100 hover:bg-red-50 text-zinc-500 hover:text-red-600 transition-colors cursor-pointer"
                  title="Delete Review"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD REVIEW MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white text-zinc-900 rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-4 shadow-2xl border-0">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-base font-black text-zinc-900">Add Customer Review</h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddReview} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={newReview.name}
                  onChange={(e) => setNewReview({ ...newReview, name: e.target.value })}
                  placeholder="e.g. Aman Verma"
                  className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-3 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
                  Rating Stars
                </label>
                <select
                  value={newReview.rating}
                  onChange={(e) => setNewReview({ ...newReview, rating: Number(e.target.value) })}
                  className="w-full bg-[#FFFBF7] rounded-2xl px-3.5 py-3 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0 cursor-pointer font-bold"
                >
                  <option value={5}>5 Stars - Excellent Taste</option>
                  <option value={4}>4 Stars - Very Good</option>
                  <option value={3}>3 Stars - Average</option>
                  <option value={2}>2 Stars - Below Expectations</option>
                  <option value={1}>1 Star - Poor</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
                  Dish / Experience Tag
                </label>
                <input
                  type="text"
                  value={newReview.dish}
                  onChange={(e) => setNewReview({ ...newReview, dish: e.target.value })}
                  placeholder="e.g. Charcoal Jumbo Shawarma"
                  className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-3 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
                  Review Comment *
                </label>
                <textarea
                  rows={3}
                  required
                  value={newReview.comment}
                  onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                  placeholder="Authentic smoky taste, crispy saj bread..."
                  className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-3 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3.5 rounded-full bg-[#DC2626] hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider shadow-lg cursor-pointer border-0"
                >
                  Submit Review
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
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
