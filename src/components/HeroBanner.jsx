import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import { useRealtimeDB } from '../context/RealtimeContext';
import { MENU_ITEMS } from '../data/menuData';
import { getImageUrl, handleImageError } from '../utils/imageHelper';

export default function HeroBanner({ onExploreMenu, onSelectFeaturedDish, onOpenFranchise }) {
  const { heroBanner, menu, reviews } = useRealtimeDB();

  // Live menu items with fallback to default seeded menu
  const menuList = menu && menu.length > 0 ? menu : MENU_ITEMS;

  // Determine featured item:
  // Check if heroBanner?.featuredItemId exists, or find matching menu item, or first item from menu
  const featuredItem = useMemo(() => {
    if (heroBanner?.featuredItemId) {
      const match = menuList.find(
        (item) => String(item.id) === String(heroBanner.featuredItemId)
      );
      if (match) return match;
    }
    return menuList[0] || null;
  }, [heroBanner?.featuredItemId, menuList]);

  const banner = {
    badgeText: '50% OFF — NIGHT50',
    titleLine1: 'REAL',
    titleLine2: 'CHARCOAL',
    titleHighlight: 'SHAWARMA',
    subtitle: 'Slow-turned on glowing coals. Carved fresh. Wrapped in toasted saj bread with our legendary garlic toum.',
    circleImage: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=800&q=85',
    priceText: 'Starts from',
    priceValue: '₹179',
    marqueeText: '★ TAP HERE TO OWN A FRANCHISE ● ★ 3-6 MONTHS ROI ● ★ HIGH CASH FLOW ● ★ TURNKEY SETUP ● ★ LIMITED CITY SLOTS AVAILABLE ★',
    ...heroBanner,
  };

  // Real price calculation: prioritize offer price set by dukandar in priceValue, then dish price
  const displayPrice = banner.priceValue
    ? (String(banner.priceValue).startsWith('₹') ? String(banner.priceValue) : `₹${banner.priceValue}`)
    : (featuredItem?.price ? `₹${featuredItem.price}` : '₹179');

  // Real rating calculation:
  // If featuredItem?.rating exists, use it. Else if server reviews exist, calculate average rating. Fallback to clean rating.
  const displayRating = useMemo(() => {
    if (featuredItem?.rating) {
      return `${Number(featuredItem.rating).toFixed(1)} ★`;
    }
    const reviewsList = Array.isArray(reviews) ? reviews : [];
    if (reviewsList.length > 0) {
      const avg = reviewsList.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / reviewsList.length;
      return `${avg.toFixed(1)} ★`;
    }
    if (heroBanner?.ratingText && !heroBanner.ratingText.includes('4.9')) {
      return heroBanner.ratingText;
    }
    return '4.9 ★';
  }, [featuredItem?.rating, reviews, heroBanner?.ratingText]);

  // Real review count: Never show fake "15K+ Reviews"
  const displayReviewsCount = useMemo(() => {
    if (featuredItem?.reviews) {
      const count = Number(featuredItem.reviews);
      return `${count.toLocaleString()} ${count === 1 ? 'Review' : 'Reviews'}`;
    }
    const reviewsList = Array.isArray(reviews) ? reviews : [];
    if (reviewsList.length > 0) {
      return `${reviewsList.length} ${reviewsList.length === 1 ? 'Review' : 'Reviews'}`;
    }
    if (heroBanner?.reviewsText && !heroBanner.reviewsText.toLowerCase().includes('15k')) {
      return heroBanner.reviewsText;
    }
    return 'Customer Favorite';
  }, [featuredItem?.reviews, reviews, heroBanner?.reviewsText]);

  const circleImageSrc = (featuredItem?.image)
    ? featuredItem.image
    : (banner.circleImage || 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=800&q=85');

  const marqueeItems = (banner.marqueeText || '').split('●').map((s) => s.trim()).filter(Boolean);

  const handleCircleClick = () => {
    if (onSelectFeaturedDish && featuredItem) {
      onSelectFeaturedDish(featuredItem);
    } else if (onExploreMenu) {
      onExploreMenu();
    } else {
      document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative overflow-hidden bg-[#DC2626] text-white">
      
      {/* Infinite Scrolling Marquee Top Strip */}
      <button 
        onClick={onOpenFranchise}
        className="w-full bg-zinc-900 py-2 overflow-hidden hover:bg-black transition-colors cursor-pointer group block text-left border-0 focus:outline-none"
        title="Tap to Explore Franchise Opportunities"
      >
        <div className="animate-marquee whitespace-nowrap flex items-center gap-8 text-[11px] sm:text-xs font-bold tracking-widest text-white/70 group-hover:text-white transition-colors">
          {[...Array(4)].map((_, i) => (
            <span key={i} className="flex items-center gap-8">
              {marqueeItems.map((item, idx) => (
                <React.Fragment key={idx}>
                  <span>{item}</span>
                  <span className="text-[#DC2626]">●</span>
                </React.Fragment>
              ))}
            </span>
          ))}
        </div>
      </button>

      {/* Main Hero */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-14 sm:py-20 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Left: Bold Large Typography */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9]"
            >
              {banner.titleLine1 || 'REAL'}
              <br />
              {banner.titleLine2 || 'CHARCOAL'}
              <br />
              <span className="text-zinc-900 bg-white px-3 py-0.5 rounded-xl inline-block mt-1 rotate-[-1deg]">
                {banner.titleHighlight || (featuredItem?.name ? featuredItem.name.toUpperCase() : 'SHAWARMA')}
              </span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-base sm:text-lg text-white/80 max-w-md mx-auto lg:mx-0 leading-relaxed font-medium"
            >
              {banner.subtitle}
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2"
            >
              <button
                onClick={onExploreMenu}
                className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-zinc-900 hover:bg-white hover:text-[#DC2626] text-white font-extrabold text-sm tracking-wide transition-all shadow-xl hover:shadow-2xl hover:scale-105"
              >
                <span>SEE THE MENU</span>
                <ArrowDown className="w-4.5 h-4.5 stroke-[2.5] group-hover:translate-y-0.5 transition-transform" />
              </button>

              {/* Playful Sticker Badge */}
              {banner.badgeText && (
                <div className="animate-wiggle bg-white text-[#DC2626] px-4 py-2 rounded-2xl font-black text-sm shadow-xl rotate-[-3deg] border-2 border-dashed border-[#DC2626]/30">
                  {banner.badgeText}
                </div>
              )}
            </motion.div>
          </div>

          {/* Right: Bold food visual (Interactive round offer) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-5 relative flex items-center justify-center"
          >
            <motion.div 
              onClick={handleCircleClick}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCircleClick();
                }
              }}
              title={featuredItem ? `Order / Customize ${featuredItem.name}` : 'Explore Menu'}
              aria-label={featuredItem ? `Order / Customize ${featuredItem.name}` : 'Explore Menu'}
              className="relative cursor-pointer group select-none focus:outline-none focus:ring-4 focus:ring-white/40 rounded-full"
            >
              {/* Floating ring accent behind the image */}
              <div className="absolute -inset-4 sm:-inset-6 rounded-full border-[3px] border-dashed border-white/20 animate-[spin_25s_linear_infinite] pointer-events-none" />

              <img
                src={getImageUrl(circleImageSrc)}
                alt={featuredItem?.name || "Charcoal Shawarma"}
                onError={handleImageError}
                className="w-[300px] sm:w-[380px] h-[300px] sm:h-[380px] rounded-full object-cover border-4 border-white shadow-2xl transition-transform duration-300 group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.4)]"
              />

              {/* Hover overlay hint */}
              <div className="absolute inset-0 rounded-full bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
                <span className="bg-white/95 text-zinc-900 text-xs font-black px-4 py-2 rounded-full shadow-lg backdrop-blur-sm transform -translate-y-2 group-hover:translate-y-0 transition-transform duration-200 flex items-center gap-1.5">
                  ✨ TAP TO CUSTOMIZE
                </span>
              </div>
              
              {/* Fun floating price sticker */}
              <div className="absolute -bottom-2 -right-2 sm:bottom-4 sm:right-0 bg-zinc-900 text-white px-4 py-2.5 rounded-2xl shadow-xl rotate-[6deg] animate-wiggle group-hover:rotate-[8deg] transition-transform">
                <div className="text-[10px] font-bold text-white/60 uppercase">{banner.priceText || 'Starts from'}</div>
                <div className="text-2xl font-black">{displayPrice}</div>
              </div>

              {/* Rating floating pill */}
              <div className="absolute top-2 -left-4 sm:top-6 sm:-left-6 bg-white text-zinc-900 px-3 py-2 rounded-2xl shadow-xl rotate-[-5deg] group-hover:rotate-[-3deg] transition-transform">
                <div className="text-lg font-black text-zinc-900">{displayRating}</div>
                <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">{displayReviewsCount}</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Curvy wave bottom divider */}
      <div className="relative">
        <svg className="w-full h-12 sm:h-16" viewBox="0 0 1440 60" fill="none" preserveAspectRatio="none">
          <path d="M0,0 C360,60 1080,60 1440,0 L1440,60 L0,60 Z" fill="#FFFBF7"/>
        </svg>
      </div>
    </section>
  );
}
