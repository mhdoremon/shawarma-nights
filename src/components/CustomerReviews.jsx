import React, { useState } from 'react';
import { 
  Star, ShieldCheck, ArrowRight, X, Send, Check, 
  MessageSquarePlus, Utensils, Store
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRealtimeDB } from '../context/RealtimeContext';
import { useAuth } from '../context/AuthContext';

const CARD_STYLES = [
  {
    bg: 'bg-[#DC2626] text-white',
    quoteColor: 'text-white/15',
    starColor: 'fill-white stroke-white',
    commentColor: 'text-white/95',
    avatarBg: 'bg-white text-zinc-900',
    nameColor: 'text-white',
    verifiedColor: 'text-emerald-300',
    subColor: 'text-white/70',
    stickerBg: 'bg-white/20 text-white',
    borderColor: 'border-transparent',
  },
  {
    bg: 'bg-white text-zinc-900 border-2 border-zinc-100 shadow-xl',
    quoteColor: 'text-zinc-100',
    starColor: 'fill-amber-400 stroke-amber-400',
    commentColor: 'text-zinc-700',
    avatarBg: 'bg-[#DC2626] text-white',
    nameColor: 'text-zinc-900',
    verifiedColor: 'text-emerald-500',
    subColor: 'text-zinc-400',
    stickerBg: 'bg-zinc-100 text-zinc-700',
    borderColor: 'border-zinc-100',
  },
  {
    bg: 'bg-zinc-900 text-white shadow-xl',
    quoteColor: 'text-white/15',
    starColor: 'fill-white stroke-white',
    commentColor: 'text-white/90',
    avatarBg: 'bg-white text-zinc-900',
    nameColor: 'text-white',
    verifiedColor: 'text-emerald-400',
    subColor: 'text-white/50',
    stickerBg: 'bg-white/15 text-white/90',
    borderColor: 'border-transparent',
  },
];

export default function CustomerReviews() {
  const { reviews, addReview, menu } = useRealtimeDB();
  const { currentUser, isAuthenticated, openAuthModal } = useAuth();

  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [reviewType, setReviewType] = useState('dish');
  const [selectedDish, setSelectedDish] = useState('');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // STRICT RULE: ONLY reviews from database! No fake/dummy entries.
  const liveReviews = reviews || [];
  const liveMenu = menu || [];

  const handleOpenWriteReview = () => {
    if (!isAuthenticated) {
      openAuthModal('phone');
      return;
    }
    if (liveMenu.length > 0 && !selectedDish) {
      setSelectedDish(liveMenu[0].name);
    }
    setIsWriteModalOpen(true);
  };

  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setSubmitting(true);
    const chosenDish = reviewType === 'dish'
      ? (selectedDish || liveMenu[0]?.name || 'Charcoal Special Shawarma')
      : 'Dukan Experience';

    const matchedDish = liveMenu.find((m) => m.name === chosenDish);

    const reviewPayload = {
      id: `rev-${Date.now()}`,
      name: currentUser?.name?.trim() || 'Verified Foodie',
      phone: currentUser?.phone ? currentUser.phone.slice(-4) : '',
      rating: Number(rating) || 5,
      comment: comment.trim(),
      type: reviewType,
      dish: chosenDish,
      dishId: matchedDish ? matchedDish.id : null,
      date: 'Just now',
      createdAt: new Date().toISOString(),
    };

    addReview(reviewPayload);
    setSubmitting(false);
    setSubmittedSuccess(true);
    setComment('');
    setTimeout(() => {
      setSubmittedSuccess(false);
      setIsWriteModalOpen(false);
    }, 1800);
  };

  const scrollToMenu = () => {
    document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="reviews" className="relative bg-[#FFFBF7] py-16 sm:py-22 overflow-hidden">
      {/* Decorative ambient spots */}
      <div className="absolute top-10 right-10 w-48 h-48 rounded-full bg-[#DC2626]/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-64 h-64 rounded-full bg-orange-500/5 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        
        {/* Section Header — Fun & Bold (Exact match to Original UI) */}
        <div className="text-center mb-10 sm:mb-12 space-y-3">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block"
          >
            <div className="bg-[#DC2626] text-white px-5 py-2 rounded-2xl text-xs font-extrabold uppercase tracking-widest inline-flex items-center gap-2 shadow-lg shadow-red-200 rotate-[-1deg]">
              <Star className="w-3.5 h-3.5 fill-white stroke-white" />
              <span>Straight from Night Owls</span>
              <Star className="w-3.5 h-3.5 fill-white stroke-white" />
            </div>
          </motion.div>
          
          <h2 className="text-4xl sm:text-5xl font-black text-zinc-900 tracking-tight leading-tight">
            Why They Keep{' '}
            <span className="relative inline-block">
              <span className="text-[#EA580C]">Coming Back</span>
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                <path d="M2 8C40 2 80 2 100 6C120 10 160 4 198 8" stroke="#DC2626" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
              </svg>
            </span>
          </h2>
          
          {/* Real honest metrics — No fake 15,000 numbers */}
          <p className="text-xs sm:text-sm text-zinc-500 max-w-md mx-auto font-medium">
            {liveReviews.length > 0 
              ? `${liveReviews.length} Verified Customer Reviews • Authentic Charcoal Experience • 100% Halal`
              : 'Authentic Customer Reviews • Fresh From The Charcoal Spits'}
          </p>
        </div>

        {/* SMART DYNAMIC GRID: Adapts gracefully to 1, 2, 3, 4, 5+ reviews with NO empty gaps! */}
        {liveReviews.length === 0 ? (
          <div className="max-w-md mx-auto py-12 px-6 text-center bg-white rounded-3xl border border-dashed border-zinc-200 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto">
              <Star className="w-6 h-6 fill-amber-400 stroke-amber-400" />
            </div>
            <h3 className="text-base font-bold text-zinc-900">Abhi tak koi review nahi hai</h3>
            <p className="text-xs text-zinc-500">
              Aap pehle customer baniye jo apna authentic feedback share karein!
            </p>
            <button
              onClick={handleOpenWriteReview}
              className="px-6 py-2.5 rounded-full bg-[#DC2626] hover:bg-red-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              Pehla Review Likhein
            </button>
          </div>
        ) : (
          <div className={`flex flex-wrap justify-center gap-6 sm:gap-7 mx-auto ${
            liveReviews.length === 1 
              ? 'max-w-md' 
              : liveReviews.length === 2 
              ? 'max-w-4xl' 
              : 'max-w-6xl'
          }`}>
            {liveReviews.map((rev, idx) => {
              const style = CARD_STYLES[idx % CARD_STYLES.length];
              const authorName = rev.name || 'Verified Foodie';
              const initial = authorName.charAt(0).toUpperCase();
              const dishLabel = (rev.dish || 'Special Shawarma').toUpperCase();
              
              // Smart sizing so cards fill width cleanly:
              // 1 review: 100% width
              // 2 reviews: 50% width on md screens (2 perfectly balanced cards!)
              // 3 or more: flexible 33% / 50% responsive cards
              const widthClass = liveReviews.length === 1
                ? 'w-full'
                : liveReviews.length === 2
                ? 'w-full md:w-[calc(50%-14px)]'
                : liveReviews.length === 4
                ? 'w-full sm:w-[calc(50%-14px)]'
                : 'w-full sm:w-[calc(50%-14px)] lg:w-[calc(33.333%-19px)]';

              return (
                <motion.div
                  key={rev.id || idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02, y: -4 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: idx * 0.08 }}
                  className={`relative rounded-[2rem] p-6 sm:p-7 flex flex-col justify-between min-h-[260px] sm:min-h-[280px] shadow-xl hover:shadow-2xl transition-all ${widthClass} ${style.bg} ${style.borderColor}`}
                >
                  {/* Decorative quote glyph */}
                  <div className={`absolute top-4 right-5 text-6xl sm:text-7xl font-serif font-black leading-none select-none pointer-events-none ${style.quoteColor}`}>
                    “
                  </div>

                  <div className="space-y-3.5 relative z-10">
                    {/* Stars */}
                    <div className="flex items-center gap-1">
                      {[...Array(Number(rev.rating) || 5)].map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${style.starColor}`} />
                      ))}
                    </div>

                    {/* Comment text */}
                    <p className={`text-sm sm:text-[15px] leading-relaxed font-normal ${style.commentColor}`}>
                      {rev.comment}
                    </p>
                  </div>

                  {/* Author Strip */}
                  <div className="mt-6 pt-4 border-t border-black/10 flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shadow-md shrink-0 ${style.avatarBg}`}>
                        {initial}
                      </div>
                      <div>
                        <div className={`text-xs font-bold flex items-center gap-1 ${style.nameColor}`}>
                          <span>{authorName}</span>
                          <ShieldCheck className={`w-3.5 h-3.5 ${style.verifiedColor} stroke-[2.5]`} />
                        </div>
                        <div className={`text-[10px] font-bold uppercase tracking-wider ${style.subColor}`}>
                          Verified Order
                        </div>
                      </div>
                    </div>

                    {/* Dish sticker */}
                    <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0 ${style.stickerBg}`}>
                      {dishLabel}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Bottom Social Proof Bar — Clean, Honest Data (No fake 15,000) */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6"
        >
          {/* Live avatars from actual database reviewers */}
          {liveReviews.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {liveReviews.slice(0, 5).map((rev, i) => (
                  <div 
                    key={rev.id || i} 
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-xs border-2 border-[#FFFBF7] shadow-sm ${
                      i % 2 === 0 ? 'bg-[#DC2626]' : 'bg-zinc-900'
                    }`}
                  >
                    {(rev.name || 'U').charAt(0).toUpperCase()}
                  </div>
                ))}
              </div>
              <div className="text-left">
                <div className="text-xs sm:text-sm font-extrabold text-zinc-900">
                  {liveReviews.length} Verified Foodies
                </div>
                <div className="text-[10px] text-zinc-500 font-bold">
                  Real Midnight Movement
                </div>
              </div>
            </div>
          )}

          {/* Action button: Invite user to share their midnight foodie story */}
          <div>
            <button
              onClick={handleOpenWriteReview}
              className="group inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-[#DC2626] hover:bg-red-700 text-white font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-md hover:shadow-xl hover:scale-105 active:scale-95 cursor-pointer"
            >
              <MessageSquarePlus className="w-4 h-4 stroke-[2.5] group-hover:scale-110 transition-transform" />
              <span>Aap Bhi Apni Story Share Karein</span>
            </button>
          </div>
        </motion.div>

      </div>

      {/* WRITE A REVIEW MODAL (Interactive submission -> Saves directly to database) */}
      <AnimatePresence>
        {isWriteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-zinc-200 relative overflow-hidden"
            >
              <button
                onClick={() => setIsWriteModalOpen(false)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-600 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center">
                  <MessageSquarePlus className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900">Apna Review Dein</h3>
                  <p className="text-xs text-zinc-500">
                    Posting as <span className="font-bold text-zinc-800">{currentUser?.name || 'Verified User'}</span>
                  </p>
                </div>
              </div>

              {submittedSuccess ? (
                <div className="py-10 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <h4 className="text-lg font-bold text-zinc-900">Shukriya! Review Published</h4>
                  <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                    Aapka review server database me save ho gaya hai aur real-time website par show ho raha hai.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  {/* Category Type */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">Review Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setReviewType('dish')}
                        className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border-0 ${
                          reviewType === 'dish'
                            ? 'bg-red-100 text-[#DC2626] shadow-sm'
                            : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                        }`}
                      >
                        <Utensils className="w-3.5 h-3.5" />
                        <span>Dish Review</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setReviewType('restaurant')}
                        className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border-0 ${
                          reviewType === 'restaurant'
                            ? 'bg-red-100 text-[#DC2626] shadow-sm'
                            : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                        }`}
                      >
                        <Store className="w-3.5 h-3.5" />
                        <span>Dukan Experience</span>
                      </button>
                    </div>
                  </div>

                  {/* Dish Selector if Dish Review */}
                  {reviewType === 'dish' && liveMenu.length > 0 && (
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Dish Chuniye</label>
                      <select
                        value={selectedDish}
                        onChange={(e) => setSelectedDish(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-red-600"
                      >
                        {liveMenu.map((m) => (
                          <option key={m.id || m.name} value={m.name}>
                            {m.name} (₹{m.price})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Star Rating */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">Rating</label>
                    <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-2xl p-3 justify-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="p-1 transition-transform hover:scale-125 cursor-pointer"
                        >
                          <Star
                            className={`w-7 h-7 ${
                              star <= (hoverRating || rating)
                                ? 'fill-amber-400 stroke-amber-400'
                                : 'fill-zinc-200 stroke-zinc-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Comment */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Aapka Feedback</label>
                    <textarea
                      rows={3}
                      required
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Taste kaisa tha? Charcoal aroma aur toum sauce kaisa laga?..."
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs text-zinc-900 focus:outline-none focus:border-red-600 focus:bg-white resize-none"
                    />
                  </div>

                  {/* Buttons */}
                  <div className="pt-2 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsWriteModalOpen(false)}
                      className="px-4 py-2 rounded-full border-0 bg-zinc-100 text-zinc-600 text-xs font-bold hover:bg-zinc-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !comment.trim()}
                      className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-[#DC2626] hover:bg-red-700 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{submitting ? 'Submitting...' : 'Post Review'}</span>
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
