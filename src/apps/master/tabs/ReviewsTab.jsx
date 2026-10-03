import React, { useState, useMemo } from 'react';
import { useMaster } from '../context/MasterContext';
import { Star, Trash2, Plus, Utensils, X } from 'lucide-react';

export default function ReviewsTab() {
  const { reviews, showToast, storeId } = useMaster();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newReview, setNewReview] = useState({
    name: '',
    rating: 5,
    comment: '',
    dish: 'Charcoal Special Shawarma'
  });

  // Calculate average rating
  const avgRating = useMemo(() => {
    const list = Array.isArray(reviews) ? reviews : [];
    if (list.length === 0) return '4.9';
    const sum = list.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
    return (sum / list.length).toFixed(1);
  }, [reviews]);

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
      setNewReview({ name: '', rating: 5, comment: '', dish: 'Charcoal Special Shawarma' });
    } catch (err) {
      showToast('Error posting review', 'error');
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await fetch(`https://churuone-backend.onrender.com/api/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: { 'x-store-id': storeId }
      });
      showToast('Review deleted', 'info');
    } catch (err) {
      showToast('Delete error', 'error');
    }
  };

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
              Verified customer feedback and culinary ratings ({reviews?.length || 0} reviews)
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-5 py-3 rounded-full bg-[#DC2626] hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg hover:shadow-xl shrink-0 border-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Manual Review</span>
        </button>
      </div>

      {/* Reviews Grid */}
      {(!reviews || reviews.length === 0) ? (
        <div className="bg-white rounded-3xl p-12 text-center text-zinc-400 text-sm space-y-1 shadow-lg border-0">
          <p className="font-bold text-zinc-700">No reviews yet</p>
          <p className="text-xs">Customers ordering through website can leave verified reviews.</p>
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

                <p className="text-xs text-zinc-600 leading-relaxed italic bg-[#FFFBF7] p-3.5 rounded-2xl shadow-xs">
                  "{rev.comment}"
                </p>

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
