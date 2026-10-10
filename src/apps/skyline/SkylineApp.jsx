import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ShoppingBag, 
  Search, 
  SlidersHorizontal, 
  X, 
  Check, 
  ArrowRight, 
  Sparkles, 
  ChevronRight, 
  Star, 
  Phone, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  User, 
  Plus, 
  Minus, 
  Trash2, 
  ExternalLink, 
  Info, 
  CheckCircle2, 
  Tag, 
  Eye, 
  Ruler, 
  Share2, 
  Menu as MenuIcon,
  HelpCircle,
  Scissors
} from 'lucide-react';
import { 
  getSkylineData, 
  validateCouponCode, 
  placeSkylineOrder, 
  sendCustomerOtp, 
  verifyCustomerOtp 
} from './skylineApiClient';
import { getChuruOneSession, setChuruOneSession, attachSsoParams } from '../../utils/ssoHelper';

export default function SkylineApp() {
  // ─── STATE MANAGEMENT ──────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [storeData, setStoreData] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured');

  // Customer & Auth State
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authPhone, setAuthPhone] = useState('');
  const [authOtp, setAuthOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [devOtpNotice, setDevOtpNotice] = useState('');

  // Cart State
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('skyline_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMessage, setCouponMessage] = useState({ text: '', type: '' });

  // Quick View & Product Modal State
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalSize, setModalSize] = useState('');
  const [modalColor, setModalColor] = useState(null);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  // Checkout State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutName, setCheckoutName] = useState('');
  const [checkoutPhone, setCheckoutPhone] = useState('');
  const [checkoutAddress, setCheckoutAddress] = useState('');
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod'); // 'cod' | 'upi'
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  // Order Tracker State
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [trackPhoneInput, setTrackPhoneInput] = useState('');
  const [trackedOrders, setTrackedOrders] = useState([]);
  const [trackingLoading, setTrackingLoading] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // ─── INITIAL DATA LOAD & SSO SYNC ─────────────────────────────
  useEffect(() => {
    document.title = "Skyline Premium Outfits | Architectural Menswear • Churu";

    // 1. Check ChuruOne SSO session
    try {
      const session = getChuruOneSession();
      if (session && session.user) {
        setCurrentUser(session.user);
        if (session.user.name) setCheckoutName(session.user.name);
        if (session.user.phone) {
          const rawPhone = String(session.user.phone).replace(/\D/g, '').slice(-10);
          setCheckoutPhone(rawPhone);
        }
      }
    } catch (e) {
      console.warn('SSO sync error:', e);
    }

    // 2. Fetch live data from Smart Backend
    loadStoreData();
  }, []);

  // Save Cart to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('skyline_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.warn('Cart save error:', e);
    }
  }, [cartItems]);

  const loadStoreData = async () => {
    setLoading(true);
    try {
      const data = await getSkylineData();
      if (data) {
        setStoreData(data);
        setMenuItems(data.menu || []);
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error('Failed to load Skyline store data:', err);
      showToast('Connecting to store catalog...');
    } finally {
      setLoading(false);
    }
  };

  // ─── CART CALCULATIONS ─────────────────────────────────────────
  const cartSubtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }, [cartItems]);

  const freeDeliveryThreshold = storeData?.storeInfo?.freeDeliveryThreshold ?? 999;
  const standardDeliveryFee = storeData?.storeInfo?.deliveryFee ?? 70;
  const deliveryFee = cartSubtotal >= freeDeliveryThreshold || cartItems.length === 0 ? 0 : standardDeliveryFee;
  const freeShippingProgress = Math.min(100, (cartSubtotal / freeDeliveryThreshold) * 100);
  const amountNeededForFreeShip = Math.max(0, freeDeliveryThreshold - cartSubtotal);

  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discountType === 'percentage') {
      const pct = (cartSubtotal * (appliedCoupon.discountPercent || 0)) / 100;
      return appliedCoupon.maxDiscount ? Math.min(pct, appliedCoupon.maxDiscount) : pct;
    }
    if (appliedCoupon.discountType === 'flat') {
      return appliedCoupon.flatDiscount || 0;
    }
    return 0;
  }, [appliedCoupon, cartSubtotal]);

  const grandTotal = Math.max(0, cartSubtotal - discountAmount + deliveryFee);
  const totalItemsCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // ─── CART HANDLERS ─────────────────────────────────────────────
  const addToCart = (product, selectedSize, selectedColor) => {
    const size = selectedSize || (product.availableSizes && product.availableSizes[0]) || 'M';
    const color = selectedColor || (product.colors && product.colors[0]?.name) || 'Classic';
    const cartItemId = `${product.id}-${size}-${color}`;

    setCartItems(prev => {
      const existing = prev.find(item => item.cartItemId === cartItemId);
      if (existing) {
        return prev.map(item => 
          item.cartItemId === cartItemId 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, {
        cartItemId,
        id: product.id,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.image,
        size,
        color,
        quantity: 1
      }];
    });

    showToast(`Added to Bag: ${product.name} (${size})`);
    setIsCartOpen(true);
  };

  const updateCartQuantity = (cartItemId, delta) => {
    setCartItems(prev => {
      return prev.map(item => {
        if (item.cartItemId === cartItemId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const removeFromCart = (cartItemId) => {
    setCartItems(prev => prev.filter(item => item.cartItemId !== cartItemId));
  };

  // ─── COUPON VALIDATION ─────────────────────────────────────────
  const handleApplyCoupon = async (codeToTry) => {
    const code = (codeToTry || couponCodeInput).trim().toUpperCase();
    if (!code) {
      setCouponMessage({ text: 'Please enter a promo coupon code', type: 'error' });
      return;
    }
    setCouponLoading(true);
    setCouponMessage({ text: '', type: '' });

    try {
      const res = await validateCouponCode(code, cartSubtotal, currentUser?.phone || checkoutPhone);
      if (res && (res.valid || res.success)) {
        const deal = res.deal || res.coupon;
        setAppliedCoupon(deal);
        setCouponMessage({ 
          text: `Perk applied: ${deal.title || code} (-₹${deal.flatDiscount || (deal.discountPercent ? `${deal.discountPercent}%` : '')})`, 
          type: 'success' 
        });
        showToast(`Coupon applied: ${code}`);
      } else {
        setCouponMessage({ 
          text: res?.reason || res?.message || 'Invalid or expired coupon code', 
          type: 'error' 
        });
        setAppliedCoupon(null);
      }
    } catch (err) {
      setCouponMessage({ text: 'Could not validate coupon code. Please try again.', type: 'error' });
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCodeInput('');
    setCouponMessage({ text: 'Coupon removed', type: 'info' });
  };

  // ─── AUTHENTICATION (CHURUONE OTP) ────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault();
    const cleanPhone = authPhone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      setAuthError('Please enter a valid 10-digit mobile number');
      return;
    }
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await sendCustomerOtp(cleanPhone);
      if (res && res.success) {
        setOtpSent(true);
        if (res.devOtp) {
          setDevOtpNotice(`Sandbox Test OTP: ${res.devOtp}`);
        }
        showToast('OTP sent successfully to your mobile');
      } else {
        setAuthError(res?.message || 'Failed to send OTP. Please retry.');
      }
    } catch (err) {
      setAuthError('Connection error while sending OTP');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!authOtp || authOtp.length < 4) {
      setAuthError('Please enter the 4-digit verification code');
      return;
    }
    setAuthLoading(true);
    setAuthError('');
    try {
      const cleanPhone = authPhone.replace(/\D/g, '').slice(-10);
      const res = await verifyCustomerOtp(cleanPhone, authOtp);
      if (res && res.success) {
        const userData = res.user || { phone: cleanPhone, name: 'Skyline Gentleman' };
        setCurrentUser(userData);
        setChuruOneSession(userData, res.token || '');
        if (userData.name) setCheckoutName(userData.name);
        setCheckoutPhone(cleanPhone);
        setIsAuthModalOpen(false);
        showToast(`Welcome back, ${userData.name || 'Gentleman'}!`);
      } else {
        setAuthError(res?.message || 'Invalid verification code');
      }
    } catch (err) {
      setAuthError('Verification failed. Please retry.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('churuone_user');
      localStorage.removeItem('auth_token');
    } catch {}
    showToast('Signed out from Skyline');
  };

  // ─── CHECKOUT & ORDER SUBMISSION ──────────────────────────────
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!checkoutName.trim()) {
      showToast('Please enter your full name');
      return;
    }
    const cleanPhone = checkoutPhone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      showToast('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!checkoutAddress.trim()) {
      showToast('Please enter your delivery address in Churu');
      return;
    }

    setOrderSubmitting(true);
    try {
      const orderPayload = {
        customer: {
          name: checkoutName.trim(),
          phone: `+91${cleanPhone}`,
          address: checkoutAddress.trim()
        },
        items: cartItems.map(item => ({
          name: `${item.name} [Size: ${item.size}, Color: ${item.color}]`,
          itemId: item.id,
          unitPrice: item.price,
          qty: item.quantity,
          size: item.size,
          color: item.color
        })),
        deliveryType: 'delivery',
        address: checkoutAddress.trim(),
        paymentMethod: paymentMethod,
        paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending_upi',
        couponCode: appliedCoupon?.code || null,
        subtotal: cartSubtotal,
        discount: discountAmount,
        deliveryFee: deliveryFee,
        tax: 0,
        packagingCharge: 0,
        tip: 0,
        total: grandTotal,
        notes: checkoutNotes.trim(),
        source: 'skyline_web'
      };

      const res = await placeSkylineOrder(orderPayload);
      if (res && (res.success || res.order)) {
        const created = res.order || res;
        setConfirmedOrder(created);
        setCartItems([]);
        setAppliedCoupon(null);
        setIsCheckoutOpen(false);
        setIsCartOpen(false);
        showToast('Wardrobe Order Placed Successfully!');
      } else {
        showToast(res?.message || 'Order could not be placed. Please contact store.');
      }
    } catch (err) {
      console.error('Order placement failed:', err);
      showToast('Network error while placing order. Please retry.');
    } finally {
      setOrderSubmitting(false);
    }
  };

  // ─── ORDER TRACKER ────────────────────────────────────────────
  const handleTrackOrders = async (e) => {
    e.preventDefault();
    const cleanPhone = trackPhoneInput.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      showToast('Please enter a valid 10-digit mobile number');
      return;
    }
    setTrackingLoading(true);
    try {
      const data = await getSkylineData();
      const allOrders = data.orders || [];
      const matches = allOrders.filter(o => {
        const ph = String(o.customer?.phone || '').replace(/\D/g, '');
        return ph.endsWith(cleanPhone);
      });
      setTrackedOrders(matches);
      if (matches.length === 0) {
        showToast('No orders found for this mobile number');
      }
    } catch (err) {
      showToast('Failed to fetch tracking details');
    } finally {
      setTrackingLoading(false);
    }
  };

  // ─── FILTERED & SORTED CATALOG ────────────────────────────────
  const filteredProducts = useMemo(() => {
    let list = [...menuItems];

    // Category Filter
    if (activeCategory !== 'all') {
      list = list.filter(item => item.category === activeCategory);
    }

    // Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(item => 
        item.name.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.fabric && item.fabric.toLowerCase().includes(q)) ||
        (item.badge && item.badge.toLowerCase().includes(q))
      );
    }

    // Sorting
    if (sortBy === 'price-low') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return list;
  }, [menuItems, activeCategory, searchQuery, sortBy]);

  // Quick View Handler
  const openQuickView = (product) => {
    setSelectedProduct(product);
    setModalSize(product.availableSizes ? product.availableSizes[0] : 'M');
    setModalColor(product.colors ? product.colors[0] : null);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#18181B] font-sans antialiased selection:bg-[#18181B] selection:text-[#FAF9F6]">
      
      {/* ─── 1. KINETIC TICKER MARQUEE ────────────────────────────── */}
      <div className="bg-[#18181B] text-[#FAF9F6] py-2 overflow-hidden border-b border-zinc-800 text-[11px] font-medium tracking-[0.2em] uppercase select-none">
        <div className="flex whitespace-nowrap animate-marquee">
          <span className="mx-6">✦ SKYLINE PREMIUM OUTFITS ✦ CHURU FLAGSHIP AT SUBHASH CHOWK</span>
          <span className="mx-6">✦ COMPLIMENTARY EXPRESS DELIVERY ON ORDERS OVER ₹999</span>
          <span className="mx-6">✦ PURE FRENCH NORMANDY LINEN & SUPIMA COTTON</span>
          <span className="mx-6">✦ ARCHITECTURAL MENSWEAR • AUTUMN / WINTER '26 EDITORIAL</span>
          <span className="mx-6">✦ LOCAL SAME-DAY DISPATCH ACROSS CHURU</span>
          <span className="mx-6">✦ SKYLINE PREMIUM OUTFITS ✦ CHURU FLAGSHIP AT SUBHASH CHOWK</span>
          <span className="mx-6">✦ COMPLIMENTARY EXPRESS DELIVERY ON ORDERS OVER ₹999</span>
          <span className="mx-6">✦ PURE FRENCH NORMANDY LINEN & SUPIMA COTTON</span>
          <span className="mx-6">✦ ARCHITECTURAL MENSWEAR • AUTUMN / WINTER '26 EDITORIAL</span>
          <span className="mx-6">✦ LOCAL SAME-DAY DISPATCH ACROSS CHURU</span>
        </div>
      </div>

      {/* ─── 2. EDITORIAL LUXURY NAVBAR ──────────────────────────── */}
      <header className="sticky top-0 z-40 bg-[#FAF9F6]/95 backdrop-blur-md border-b border-stone-200 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Left Nav Links (Desktop) */}
          <div className="hidden md:flex items-center gap-6 text-xs uppercase tracking-[0.18em] font-medium text-stone-600">
            <button 
              onClick={() => { setActiveCategory('all'); window.scrollTo({ top: 600, behavior: 'smooth' }); }}
              className="hover:text-stone-950 transition-colors"
            >
              Collection
            </button>
            <button 
              onClick={() => { setActiveCategory('linen-shirts'); window.scrollTo({ top: 600, behavior: 'smooth' }); }}
              className="hover:text-stone-950 transition-colors"
            >
              French Linen
            </button>
            <button 
              onClick={() => { setActiveCategory('trousers'); window.scrollTo({ top: 600, behavior: 'smooth' }); }}
              className="hover:text-stone-950 transition-colors"
            >
              Gurkha Trousers
            </button>
            <button 
              onClick={() => { setActiveCategory('heritage-kurtas'); window.scrollTo({ top: 600, behavior: 'smooth' }); }}
              className="hover:text-stone-950 transition-colors"
            >
              Festive Kurtas
            </button>
          </div>

          {/* Brand Logo & Editorial Typography */}
          <div className="flex flex-col items-center cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <span className="text-2xl sm:text-3xl font-light tracking-[0.25em] uppercase text-stone-950 font-serif">
              S K Y L I N E
            </span>
            <span className="text-[9px] uppercase tracking-[0.35em] text-stone-500 font-medium -mt-0.5">
              Premium Outfits • Churu
            </span>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Order Tracker */}
            <button
              onClick={() => setIsTrackerOpen(true)}
              className="text-stone-600 hover:text-stone-950 transition-colors text-xs uppercase tracking-wider font-medium hidden sm:flex items-center gap-1.5"
              title="Track Wardrobe Order"
            >
              <Clock className="w-4 h-4 stroke-[1.5]" />
              <span className="hidden lg:inline">Track Order</span>
            </button>

            {/* ChuruOne Account SSO / Login */}
            {currentUser ? (
              <div className="relative group">
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center gap-2 text-xs uppercase tracking-wider text-stone-700 hover:text-stone-950 py-1.5 px-2.5 rounded-full border border-stone-200 bg-white/70 shadow-xs"
                >
                  <div className="w-5 h-5 rounded-full bg-stone-900 text-stone-100 flex items-center justify-center text-[10px] font-bold">
                    {(currentUser.name || 'G')[0]}
                  </div>
                  <span className="hidden md:inline font-medium max-w-[90px] truncate">
                    {currentUser.name?.split(' ')[0] || 'Account'}
                  </span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="text-stone-600 hover:text-stone-950 transition-colors text-xs uppercase tracking-wider font-medium flex items-center gap-1.5"
              >
                <User className="w-4 h-4 stroke-[1.5]" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}

            {/* Shopping Bag Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative bg-stone-950 text-white hover:bg-stone-800 transition-colors px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-none flex items-center gap-2 text-xs uppercase tracking-widest font-medium cursor-pointer shadow-xs"
            >
              <ShoppingBag className="w-4 h-4 stroke-[1.5]" />
              <span className="hidden sm:inline">Bag</span>
              {totalItemsCount > 0 && (
                <span className="inline-flex items-center justify-center bg-amber-600 text-white rounded-full text-[10px] font-bold w-5 h-5 ml-0.5">
                  {totalItemsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ─── 3. CINEMATIC LOOKBOOK HERO SECTION ──────────────────── */}
      <section className="relative bg-stone-900 text-white overflow-hidden min-h-[580px] sm:min-h-[640px] flex items-center">
        {/* Background Editorial Image with Ken-Burns Breathing Zoom */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-10000 ease-out transform scale-105 hover:scale-100 opacity-60"
          style={{ 
            backgroundImage: `url('https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=1800&q=85')` 
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950/95 via-stone-950/70 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 w-full z-10">
          <div className="max-w-2xl space-y-6">
            
            {/* Editorial Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 text-[10px] uppercase tracking-[0.25em] font-medium text-stone-200">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Autumn / Winter '26 Collection</span>
            </div>

            {/* Grand Editorial Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-light tracking-tight font-serif text-white leading-[1.08]">
              ARCHITECTURAL <br />
              <span className="italic font-normal text-amber-200">MENSWEAR</span>
            </h1>

            {/* Description */}
            <p className="text-stone-300 text-sm sm:text-base leading-relaxed font-light tracking-wide max-w-lg">
              Handcrafted pure European flax linens, structured overshirts, and bespoke festive kurta silhouettes engineered in Churu for the contemporary gentleman.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <button
                onClick={() => {
                  const target = document.getElementById('collection-grid');
                  if (target) target.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-white text-stone-950 hover:bg-stone-100 px-7 py-3.5 text-xs uppercase tracking-[0.2em] font-medium transition-all flex items-center gap-2 group shadow-lg cursor-pointer"
              >
                <span>Explore The Wardrobe</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                onClick={() => {
                  setActiveCategory('linen-shirts');
                  const target = document.getElementById('collection-grid');
                  if (target) target.scrollIntoView({ behavior: 'smooth' });
                }}
                className="border border-white/40 text-white hover:bg-white/10 px-6 py-3.5 text-xs uppercase tracking-[0.2em] font-medium transition-all backdrop-blur-xs cursor-pointer"
              >
                French Linen Drop
              </button>
            </div>

            {/* Perks Pill Grid */}
            <div className="pt-8 border-t border-white/15 grid grid-cols-2 sm:grid-cols-3 gap-4 text-stone-300 text-[11px] uppercase tracking-wider font-light">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-300 stroke-[1.5]" />
                <span>Same-Day Churu Express</span>
              </div>
              <div className="flex items-center gap-2">
                <Scissors className="w-4 h-4 text-amber-300 stroke-[1.5]" />
                <span>Bespoke Fit Adjustments</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-300 stroke-[1.5]" />
                <span>100% Tested Long-Staple Fabric</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── 4. SEARCH, FILTERS & CATEGORY MARQUEE ───────────────── */}
      <section id="collection-grid" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        
        {/* Section Title & Subheading */}
        <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
          <span className="text-[10px] uppercase tracking-[0.3em] font-semibold text-amber-700">
            CURATED CATALOGUE
          </span>
          <h2 className="text-3xl sm:text-4xl font-light font-serif tracking-tight text-stone-950">
            Selected Garments & Silhouettes
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 font-light">
            Each garment is produced in small batches with exacting attention to pattern, seam, and drape.
          </p>
        </div>

        {/* Search & Sort Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6 border-b border-stone-200">
          
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 stroke-[1.5]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by fabric, fit, or style..."
              className="w-full bg-white border border-stone-200 focus:border-stone-900 pl-10 pr-4 py-2 text-xs text-stone-900 placeholder-stone-400 outline-none transition-colors"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Categories Pill Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`whitespace-nowrap px-4 py-2 text-[11px] uppercase tracking-[0.15em] font-medium transition-all cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-stone-950 text-white shadow-xs'
                    : 'bg-white border border-stone-200 text-stone-600 hover:border-stone-400'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <span className="text-[10px] uppercase tracking-wider text-stone-500 font-medium">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-stone-200 text-xs py-1.5 px-3 text-stone-800 outline-none cursor-pointer focus:border-stone-900"
            >
              <option value="featured">Featured First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>

        {/* Results Counter */}
        <div className="pt-4 pb-6 flex items-center justify-between text-xs text-stone-500 font-light">
          <span>Showing {filteredProducts.length} pieces in collection</span>
          {activeCategory !== 'all' && (
            <button
              onClick={() => setActiveCategory('all')}
              className="text-stone-900 underline underline-offset-4 hover:text-amber-800 transition-colors"
            >
              Reset Category Filter
            </button>
          )}
        </div>

        {/* ─── 5. OUTFIT PRODUCT GRID ─────────────────────────────── */}
        {loading ? (
          <div className="py-24 text-center space-y-4">
            <div className="w-10 h-10 border-2 border-stone-900 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Loading Skyline Collection...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 text-center bg-white border border-stone-200 p-8 max-w-md mx-auto space-y-3">
            <Info className="w-8 h-8 text-stone-400 mx-auto stroke-[1.5]" />
            <h3 className="text-base font-medium text-stone-900 font-serif">No Garments Found</h3>
            <p className="text-xs text-stone-500">We couldn't find any outfits matching "{searchQuery}". Try browsing all collections.</p>
            <button
              onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
              className="bg-stone-950 text-white text-xs px-5 py-2 uppercase tracking-wider font-medium cursor-pointer"
            >
              View Full Lookbook
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickView={() => openQuickView(product)}
                onAddToCart={(size, color) => addToCart(product, size, color)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ─── 6. BESPOKE EXPERTISE / BRAND STORY BANNER ───────────── */}
      <section className="bg-stone-100 border-y border-stone-200 my-20 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Story Image */}
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=900&q=80"
                alt="Skyline Master Craftsmanship"
                className="w-full h-[420px] object-cover shadow-md"
              />
              <div className="absolute -bottom-4 -right-4 bg-stone-950 text-white p-5 max-w-xs shadow-xl hidden sm:block">
                <span className="text-[10px] uppercase tracking-[0.25em] text-amber-400 block mb-1">CHURU ATELIER</span>
                <p className="text-xs font-light leading-relaxed">
                  Tailored specifically for the desert climate using high-breathability European flax and Supima fibers.
                </p>
              </div>
            </div>

            {/* Story Text */}
            <div className="space-y-6">
              <span className="text-[10px] uppercase tracking-[0.3em] font-semibold text-amber-800">
                THE SKYLINE PHILOSOPHY
              </span>
              <h2 className="text-3xl sm:text-4xl font-light font-serif tracking-tight text-stone-950 leading-tight">
                Refined Menswear. <br />
                Without Ostentation.
              </h2>
              <p className="text-stone-600 text-sm leading-relaxed font-light">
                Founded in Churu, Skyline was created to offer gentlemen wardrobe staples that don't cut corners on fabric weight, stitching longevity, or proportion. We eschew loud synthetic logos in favor of tactile textures, subtle drapes, and structured silhouettes that speak quietly.
              </p>
              
              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-stone-900 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-medium uppercase tracking-wider text-stone-950">Pure Natural Fibers</h4>
                    <p className="text-xs text-stone-500 font-light">Zero synthetic cheap polyesters. We use 100% French linen, Supima cotton, and tussar silk.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-stone-900 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-medium uppercase tracking-wider text-stone-950">Churu Local Express Fulfillment</h4>
                    <p className="text-xs text-stone-500 font-light">Orders placed in Churu city are packed and dispatched the same day directly from Subhash Chowk.</p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <a
                  href={`https://wa.me/917023963189?text=${encodeURIComponent("Namaste Skyline Team! I would like to inquire about bespoke tailoring / custom sizing.")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 border border-stone-950 text-stone-950 hover:bg-stone-950 hover:text-white px-6 py-3 text-xs uppercase tracking-[0.2em] font-medium transition-all"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Consult Skyline Stylist via WhatsApp</span>
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── 7. VERIFIED CUSTOMER REVIEWS ────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
          <span className="text-[10px] uppercase tracking-[0.3em] font-semibold text-amber-700">
            GENTLEMEN'S ACCLAIM
          </span>
          <h2 className="text-3xl font-light font-serif tracking-tight text-stone-950">
            Endorsements from Churu
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(storeData?.reviews && storeData.reviews.length > 0 ? storeData.reviews : [
            {
              id: 'r1',
              name: 'Arjun Rathore',
              dish: 'Normandy Flax Camp-Collar Linen Shirt',
              comment: 'The French Linen Camp Collar shirt has an unbelievable drape. Living in Churu, breathable fabric is crucial. Skyline has completely redefined men\'s fashion here.',
              rating: 5,
              date: '2 days ago'
            },
            {
              id: 'r2',
              name: 'Vikram Shekhawat',
              dish: 'Milano Double-Pleated Gurkha Trousers',
              comment: 'Wore the Gurkha pleated trousers to an engagement dinner at Churu Club. Got compliments all evening. The side adjusters remove the need for belts.',
              rating: 5,
              date: '4 days ago'
            },
            {
              id: 'r3',
              name: 'Sameer Khan',
              dish: 'Supima Heavyweight 260 GSM Relaxed Tee',
              comment: 'Supima heavyweight tee is truly 260 GSM. Thick collar rib that doesn\'t bacon after washes. Express delivery arrived in 40 minutes in Churu!',
              rating: 5,
              date: '1 week ago'
            }
          ]).map((rev) => (
            <div key={rev.id} className="bg-white border border-stone-200 p-6 flex flex-col justify-between space-y-4 shadow-2xs">
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-stone-700 leading-relaxed font-light italic">
                  "{rev.comment}"
                </p>
              </div>
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                <div>
                  <span className="font-medium text-stone-950 block">{rev.name}</span>
                  <span className="text-[10px] text-stone-400 block">{rev.dish || 'Verified Purchase'}</span>
                </div>
                <span className="text-[10px] text-stone-400">{rev.date || 'Verified'}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 8. EDITORIAL FOOTER ─────────────────────────────────── */}
      <footer className="bg-stone-950 text-stone-400 text-xs border-t border-stone-800 pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-stone-800">
            
            {/* Col 1: Brand Info */}
            <div className="space-y-4">
              <span className="text-xl font-light tracking-[0.25em] text-white uppercase font-serif block">
                S K Y L I N E
              </span>
              <p className="text-stone-400 font-light leading-relaxed text-xs">
                Architectural Menswear & Bespoke Outfits. Curated French flax, structured overshirts, and festive silhouettes engineered in Churu, Rajasthan.
              </p>
              <div className="pt-2 text-[11px] text-stone-500 space-y-1">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-stone-400" />
                  <span>Subhash Chowk, Station Road, Churu (331001)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-stone-400" />
                  <span>+91 70239 63189</span>
                </div>
              </div>
            </div>

            {/* Col 2: Collections */}
            <div className="space-y-3">
              <h4 className="text-[11px] uppercase tracking-[0.2em] font-semibold text-white">Collections</h4>
              <ul className="space-y-2 text-stone-400 font-light">
                <li><button onClick={() => { setActiveCategory('linen-shirts'); window.scrollTo({ top: 600, behavior: 'smooth' }); }} className="hover:text-white transition-colors">Normandy Linen Shirts</button></li>
                <li><button onClick={() => { setActiveCategory('trousers'); window.scrollTo({ top: 600, behavior: 'smooth' }); }} className="hover:text-white transition-colors">Pleated Gurkha Trousers</button></li>
                <li><button onClick={() => { setActiveCategory('overshirts'); window.scrollTo({ top: 600, behavior: 'smooth' }); }} className="hover:text-white transition-colors">Canvas & Corduroy Jackets</button></li>
                <li><button onClick={() => { setActiveCategory('heritage-kurtas'); window.scrollTo({ top: 600, behavior: 'smooth' }); }} className="hover:text-white transition-colors">Tussar Silk Angrakhas</button></li>
                <li><button onClick={() => { setActiveCategory('tees'); window.scrollTo({ top: 600, behavior: 'smooth' }); }} className="hover:text-white transition-colors">Supima Heavyweight Tees</button></li>
              </ul>
            </div>

            {/* Col 3: Customer Care & ChuruOne */}
            <div className="space-y-3">
              <h4 className="text-[11px] uppercase tracking-[0.2em] font-semibold text-white">Concierge</h4>
              <ul className="space-y-2 text-stone-400 font-light">
                <li><button onClick={() => setIsTrackerOpen(true)} className="hover:text-white transition-colors">Track Live Order</button></li>
                <li><button onClick={() => setIsSizeGuideOpen(true)} className="hover:text-white transition-colors">Master Size Guide</button></li>
                <li><a href="/terms" target="_blank" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="/privacy" target="_blank" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="/refund" target="_blank" className="hover:text-white transition-colors">Refund & Return Protocol</a></li>
              </ul>
            </div>

            {/* Col 4: Dukandar / Merchant OS */}
            <div className="space-y-3">
              <h4 className="text-[11px] uppercase tracking-[0.2em] font-semibold text-white">Merchant Console</h4>
              <p className="text-stone-400 text-xs font-light leading-relaxed">
                Skyline store managers can log into the ChuruOne Merchant Portal to update inventories, accept orders, and adjust pricing.
              </p>
              <div className="pt-2">
                <a
                  href="/admin?storeId=skyline"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-700 text-[11px] uppercase tracking-wider font-medium transition-colors"
                >
                  <span>Dukandar Portal</span>
                  <ExternalLink className="w-3 h-3 text-stone-400" />
                </a>
              </div>
            </div>

          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-stone-500 gap-4">
            <div>
              © 2026 Skyline Premium Outfits. Powered by <a href="https://churuone.in" className="text-stone-300 hover:underline">ChuruOne Unified Smart Platform</a>.
            </div>
            <div className="flex items-center gap-6">
              <a href="/shawarma" className="hover:text-stone-300 transition-colors">Shawarma Nights</a>
              <a href="/nash" className="hover:text-stone-300 transition-colors">Nash Studio Salon</a>
              <a href="/" className="hover:text-stone-300 transition-colors">ChuruOne Marketplace</a>
            </div>
          </div>
        </div>
      </footer>

      {/* ─── 9. SLIDE-OVER LUXURY CART DRAWER ────────────────────── */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div 
            onClick={() => setIsCartOpen(false)}
            className="absolute inset-0 bg-stone-950/60 backdrop-blur-xs transition-opacity"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
              
              {/* Drawer Header */}
              <div className="px-6 py-5 border-b border-stone-200 flex items-center justify-between bg-[#FAF9F6]">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-stone-950 stroke-[1.5]" />
                  <h3 className="text-sm uppercase tracking-[0.2em] font-medium text-stone-950 font-serif">
                    Shopping Bag ({totalItemsCount})
                  </h3>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="text-stone-400 hover:text-stone-950 transition-colors p-1"
                >
                  <X className="w-5 h-5 stroke-[1.5]" />
                </button>
              </div>

              {/* Free Express Shipping Progress Bar */}
              <div className="bg-amber-50 px-6 py-3 border-b border-amber-100 text-[11px]">
                <div className="flex items-center justify-between text-stone-800 font-medium mb-1.5">
                  <span>
                    {amountNeededForFreeShip > 0
                      ? `Add ₹${amountNeededForFreeShip} more for Free Churu Delivery`
                      : '✦ You unlocked Free Express Local Delivery!'}
                  </span>
                  <span className="text-amber-800 font-semibold">{Math.round(freeShippingProgress)}%</span>
                </div>
                <div className="w-full bg-stone-200 h-1.5 overflow-hidden">
                  <div
                    className="bg-amber-600 h-full transition-all duration-300"
                    style={{ width: `${freeShippingProgress}%` }}
                  />
                </div>
              </div>

              {/* Cart Items List */}
              <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-stone-100">
                {cartItems.length === 0 ? (
                  <div className="py-20 text-center space-y-4">
                    <ShoppingBag className="w-10 h-10 text-stone-300 mx-auto stroke-[1]" />
                    <p className="text-sm font-serif text-stone-700">Your shopping bag is empty</p>
                    <p className="text-xs text-stone-400 max-w-xs mx-auto">
                      Explore our handcrafted French linen shirts, Gurkha trousers, and overshirts.
                    </p>
                    <button
                      onClick={() => setIsCartOpen(false)}
                      className="bg-stone-950 text-white text-xs px-6 py-2.5 uppercase tracking-wider font-medium cursor-pointer"
                    >
                      Start Shopping
                    </button>
                  </div>
                ) : (
                  cartItems.map((item) => (
                    <div key={item.cartItemId} className="py-4 flex gap-4">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-24 object-cover border border-stone-200 bg-stone-100 shrink-0"
                      />
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="text-xs font-medium text-stone-950 leading-tight">
                              {item.name}
                            </h4>
                            <button
                              onClick={() => removeFromCart(item.cartItemId)}
                              className="text-stone-400 hover:text-red-600 transition-colors p-0.5"
                            >
                              <Trash2 className="w-3.5 h-3.5 stroke-[1.5]" />
                            </button>
                          </div>
                          
                          {/* Size & Color details */}
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-stone-500">
                            <span className="bg-stone-100 px-2 py-0.5 text-stone-700 border border-stone-200 font-mono">
                              Size: {item.size}
                            </span>
                            <span>Color: {item.color}</span>
                          </div>
                        </div>

                        {/* Quantity and Price */}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center border border-stone-200 bg-stone-50">
                            <button
                              onClick={() => updateCartQuantity(item.cartItemId, -1)}
                              className="p-1 hover:bg-stone-200 text-stone-600 transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2.5 text-xs font-mono font-medium text-stone-950">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateCartQuantity(item.cartItemId, 1)}
                              className="p-1 hover:bg-stone-200 text-stone-600 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-semibold text-stone-950">
                              ₹{item.price * item.quantity}
                            </span>
                            {item.originalPrice && (
                              <span className="text-[10px] text-stone-400 line-through block">
                                ₹{item.originalPrice * item.quantity}
                              </span>
                            )}
                          </div>
                        </div>

                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Promo Code Box */}
              {cartItems.length > 0 && (
                <div className="px-6 py-3 border-t border-stone-200 bg-[#FAF9F6]">
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-800">
                      <div className="flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5 text-emerald-600" />
                        <div>
                          <span className="font-semibold uppercase font-mono">{appliedCoupon.code}</span>
                          <span className="text-[11px] text-emerald-700 block">
                            {couponMessage.text}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={removeCoupon}
                        className="text-stone-400 hover:text-stone-950 text-xs font-medium underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponCodeInput}
                          onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                          placeholder="Promo Code (SKYLINE100, FIRSTFIT)"
                          className="flex-1 bg-white border border-stone-200 text-xs px-3 py-2 uppercase font-mono tracking-wider outline-none focus:border-stone-950"
                        />
                        <button
                          onClick={() => handleApplyCoupon()}
                          disabled={couponLoading || !couponCodeInput.trim()}
                          className="bg-stone-950 text-white text-xs px-4 py-2 uppercase tracking-wider font-medium hover:bg-stone-800 disabled:opacity-50 cursor-pointer"
                        >
                          {couponLoading ? '...' : 'Apply'}
                        </button>
                      </div>
                      {couponMessage.text && (
                        <p className={`text-[11px] mt-1 ${couponMessage.type === 'error' ? 'text-red-600' : 'text-emerald-700'}`}>
                          {couponMessage.text}
                        </p>
                      )}
                      
                      {/* Quick Available Coupons Pills */}
                      <div className="flex items-center gap-1.5 mt-2 overflow-x-auto scrollbar-none">
                        {['SKYLINE100', 'FIRSTFIT', 'CHURU50'].map(code => (
                          <button
                            key={code}
                            onClick={() => {
                              setCouponCodeInput(code);
                              handleApplyCoupon(code);
                            }}
                            className="text-[10px] bg-stone-100 hover:bg-stone-200 border border-stone-300 px-2 py-0.5 text-stone-700 font-mono tracking-wide cursor-pointer"
                          >
                            + {code}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Cart Summary & Checkout Button */}
              {cartItems.length > 0 && (
                <div className="p-6 border-t border-stone-200 bg-white space-y-3">
                  <div className="space-y-1.5 text-xs text-stone-600">
                    <div className="flex justify-between">
                      <span>Bag Subtotal</span>
                      <span className="font-mono text-stone-900">₹{cartSubtotal}</span>
                    </div>

                    {discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-700">
                        <span>Coupon Savings</span>
                        <span className="font-mono">-₹{discountAmount}</span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span>Express Delivery in Churu</span>
                      <span className="font-mono text-stone-900">
                        {deliveryFee === 0 ? <span className="text-emerald-700 uppercase font-medium">Free</span> : `₹${deliveryFee}`}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm font-semibold text-stone-950 pt-2 border-t border-stone-100">
                      <span>Total Payable</span>
                      <span className="font-mono text-base">₹{grandTotal}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      setIsCheckoutOpen(true);
                    }}
                    className="w-full bg-stone-950 hover:bg-stone-800 text-white py-3.5 text-xs uppercase tracking-[0.2em] font-medium transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Proceed to Delivery & Payment</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <p className="text-[10px] text-center text-stone-400">
                    Complimentary size exchanges available across Churu within 48 hours.
                  </p>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ─── 10. PRODUCT QUICK-VIEW & SPECIFICATION MODAL ───────── */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs transition-opacity" onClick={() => setSelectedProduct(null)} />
          
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white max-w-3xl w-full shadow-2xl border border-stone-200 overflow-hidden my-8">
              
              {/* Close Button */}
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute right-4 top-4 z-10 bg-white/80 hover:bg-white text-stone-900 p-2 rounded-full shadow-xs transition-colors"
              >
                <X className="w-4 h-4 stroke-[1.5]" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2">
                
                {/* Product Images Split */}
                <div className="bg-stone-100 flex flex-col">
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    className="w-full h-80 sm:h-96 object-cover"
                  />
                  {selectedProduct.secondaryImage && (
                    <div className="p-3 bg-stone-50 border-t border-stone-200 flex items-center gap-2">
                      <span className="text-[10px] uppercase tracking-wider text-stone-500 font-medium">Model Styling:</span>
                      <img
                        src={selectedProduct.secondaryImage}
                        alt="Model Angle"
                        className="w-12 h-14 object-cover border border-stone-300"
                      />
                    </div>
                  )}
                </div>

                {/* Product Details & Selection */}
                <div className="p-6 sm:p-8 flex flex-col justify-between space-y-6">
                  <div className="space-y-3">
                    
                    {/* Badge */}
                    {selectedProduct.badge && (
                      <span className="inline-block text-[10px] uppercase tracking-[0.2em] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5">
                        {selectedProduct.badge}
                      </span>
                    )}

                    <h3 className="text-xl font-light font-serif text-stone-950 leading-tight">
                      {selectedProduct.name}
                    </h3>

                    {/* Price */}
                    <div className="flex items-baseline gap-3">
                      <span className="text-xl font-semibold font-mono text-stone-950">
                        ₹{selectedProduct.price}
                      </span>
                      {selectedProduct.originalPrice && (
                        <span className="text-xs text-stone-400 line-through font-mono">
                          ₹{selectedProduct.originalPrice}
                        </span>
                      )}
                      <span className="text-[10px] text-emerald-700 uppercase font-semibold">
                        Inclusive of all taxes
                      </span>
                    </div>

                    <p className="text-xs text-stone-600 leading-relaxed font-light">
                      {selectedProduct.description}
                    </p>

                    {/* Fabric Specifications */}
                    <div className="bg-stone-50 border border-stone-200 p-3 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-stone-500">Fabric Weave:</span>
                        <span className="font-medium text-stone-900">{selectedProduct.fabric || '100% Normandy Linen'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500">Silhouette Fit:</span>
                        <span className="font-medium text-stone-900">{selectedProduct.fit || 'Tailored Relaxed Cut'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500">Dispatch Timeline:</span>
                        <span className="font-medium text-emerald-700">Same Day from Subhash Chowk</span>
                      </div>
                    </div>

                    {/* Size Selector */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[11px] uppercase tracking-wider font-semibold text-stone-700">
                          Select Size:
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsSizeGuideOpen(true)}
                          className="text-[11px] text-stone-600 hover:text-stone-950 underline flex items-center gap-1 cursor-pointer"
                        >
                          <Ruler className="w-3 h-3" />
                          <span>Size Chart</span>
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(selectedProduct.availableSizes || ['S', 'M', 'L', 'XL', 'XXL']).map((sz) => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => setModalSize(sz)}
                            className={`px-3 py-1.5 text-xs font-mono font-medium border transition-all cursor-pointer ${
                              modalSize === sz
                                ? 'bg-stone-950 text-white border-stone-950'
                                : 'bg-white text-stone-800 border-stone-200 hover:border-stone-400'
                            }`}
                          >
                            {sz}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Color Swatch */}
                    {selectedProduct.colors && selectedProduct.colors.length > 0 && (
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider font-semibold text-stone-700 mb-2">
                          Color: <span className="font-normal text-stone-500">{modalColor?.name || selectedProduct.colors[0]?.name}</span>
                        </label>
                        <div className="flex items-center gap-2">
                          {selectedProduct.colors.map((c) => (
                            <button
                              key={c.name}
                              type="button"
                              onClick={() => setModalColor(c)}
                              className={`w-7 h-7 rounded-full border-2 transition-all p-0.5 cursor-pointer ${
                                (modalColor?.name || selectedProduct.colors[0]?.name) === c.name
                                  ? 'border-stone-950 scale-110 shadow-xs'
                                  : 'border-transparent hover:border-stone-300'
                              }`}
                              title={c.name}
                            >
                              <div
                                className="w-full h-full rounded-full border border-stone-200"
                                style={{ backgroundColor: c.hex }}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Add To Bag CTA */}
                  <div className="pt-4 border-t border-stone-200">
                    <button
                      onClick={() => {
                        addToCart(selectedProduct, modalSize, modalColor?.name);
                        setSelectedProduct(null);
                      }}
                      className="w-full bg-stone-950 hover:bg-stone-800 text-white py-3.5 text-xs uppercase tracking-[0.2em] font-medium transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4 stroke-[1.5]" />
                      <span>Add to Bag • ₹{selectedProduct.price}</span>
                    </button>
                  </div>

                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 11. CHECKOUT MODAL ──────────────────────────────────── */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs transition-opacity" onClick={() => !orderSubmitting && setIsCheckoutOpen(false)} />
          
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white max-w-lg w-full shadow-2xl border border-stone-200 overflow-hidden my-8">
              
              <div className="px-6 py-5 border-b border-stone-200 flex items-center justify-between bg-[#FAF9F6]">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.25em] text-stone-500 font-semibold block">
                    SKYLINE CHURU DISPATCH
                  </span>
                  <h3 className="text-base uppercase tracking-wider font-medium text-stone-950 font-serif">
                    Delivery Address & Payment
                  </h3>
                </div>
                {!orderSubmitting && (
                  <button
                    onClick={() => setIsCheckoutOpen(false)}
                    className="text-stone-400 hover:text-stone-950 p-1"
                  >
                    <X className="w-5 h-5 stroke-[1.5]" />
                  </button>
                )}
              </div>

              <form onSubmit={handlePlaceOrder} className="p-6 space-y-4">
                
                {/* Full Name */}
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-semibold text-stone-600 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={checkoutName}
                    onChange={(e) => setCheckoutName(e.target.value)}
                    placeholder="e.g. Arjun Rathore"
                    className="w-full border border-stone-200 focus:border-stone-950 px-3 py-2 text-xs text-stone-900 outline-none"
                  />
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-semibold text-stone-600 mb-1">
                    10-Digit Mobile Number * (For Delivery OTP & WhatsApp Updates)
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 border border-r-0 border-stone-200 bg-stone-50 text-xs text-stone-500 font-mono">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={checkoutPhone}
                      onChange={(e) => setCheckoutPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="98290XXXXX"
                      className="w-full border border-stone-200 focus:border-stone-950 px-3 py-2 text-xs text-stone-900 font-mono outline-none"
                    />
                  </div>
                </div>

                {/* Delivery Address */}
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-semibold text-stone-600 mb-1">
                    Delivery Address in Churu * (House / Ward / Colony / Landmark)
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={checkoutAddress}
                    onChange={(e) => setCheckoutAddress(e.target.value)}
                    placeholder="e.g. House No. 24, Near Dharm Stup, Ward 12, Station Road, Churu - 331001"
                    className="w-full border border-stone-200 focus:border-stone-950 p-2.5 text-xs text-stone-900 outline-none resize-none"
                  />
                </div>

                {/* Special Instructions / Tailoring note */}
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-semibold text-stone-600 mb-1">
                    Special Tailoring or Delivery Note (Optional)
                  </label>
                  <input
                    type="text"
                    value={checkoutNotes}
                    onChange={(e) => setCheckoutNotes(e.target.value)}
                    placeholder="e.g. Please hem trousers by 1 inch, or leave with security"
                    className="w-full border border-stone-200 focus:border-stone-950 px-3 py-2 text-xs text-stone-900 outline-none"
                  />
                </div>

                {/* Payment Method Selector */}
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-semibold text-stone-600 mb-2">
                    Payment Protocol *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cod')}
                      className={`p-3 border text-left flex flex-col justify-between transition-all cursor-pointer ${
                        paymentMethod === 'cod'
                          ? 'border-stone-950 bg-stone-50 ring-1 ring-stone-950'
                          : 'border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold uppercase text-stone-950">Cash on Delivery</span>
                        {paymentMethod === 'cod' && <Check className="w-3.5 h-3.5 text-stone-950" />}
                      </div>
                      <span className="text-[10px] text-stone-500 font-light">
                        Pay cash or UPI upon inspecting garments at your doorstep.
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('upi')}
                      className={`p-3 border text-left flex flex-col justify-between transition-all cursor-pointer ${
                        paymentMethod === 'upi'
                          ? 'border-stone-950 bg-stone-50 ring-1 ring-stone-950'
                          : 'border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold uppercase text-stone-950">UPI / QR Payment</span>
                        {paymentMethod === 'upi' && <Check className="w-3.5 h-3.5 text-stone-950" />}
                      </div>
                      <span className="text-[10px] text-stone-500 font-light">
                        Instant GPay / PhonePe transfer to skylineoutfits@upi
                      </span>
                    </button>
                  </div>
                </div>

                {/* Order Total Overview */}
                <div className="bg-[#FAF9F6] p-3 border border-stone-200 space-y-1 text-xs">
                  <div className="flex justify-between text-stone-600">
                    <span>Items Total ({totalItemsCount}):</span>
                    <span className="font-mono">₹{cartSubtotal}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Promo Savings:</span>
                      <span className="font-mono">-₹{discountAmount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-stone-600">
                    <span>Express Delivery:</span>
                    <span className="font-mono">{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold text-stone-950 pt-1 border-t border-stone-200">
                    <span>Final Amount:</span>
                    <span className="font-mono text-base">₹{grandTotal}</span>
                  </div>
                </div>

                {/* Submit CTA */}
                <button
                  type="submit"
                  disabled={orderSubmitting}
                  className="w-full bg-stone-950 hover:bg-stone-800 disabled:opacity-50 text-white py-3.5 text-xs uppercase tracking-[0.2em] font-medium transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  {orderSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Transmitting Order to Churu Hub...</span>
                    </div>
                  ) : (
                    <span>Confirm Order • ₹{grandTotal}</span>
                  )}
                </button>

              </form>

            </div>
          </div>
        </div>
      )}

      {/* ─── 12. ORDER CONFIRMATION MODAL ───────────────────────── */}
      {confirmedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs" />
          
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white max-w-md w-full shadow-2xl border border-stone-200 p-8 text-center space-y-6">
              
              <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 stroke-[1.5]" />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-[0.25em] font-semibold text-amber-700">
                  WARDROBE DISPATCH INITIATED
                </span>
                <h3 className="text-2xl font-light font-serif text-stone-950">
                  Order Successfully Placed
                </h3>
                <p className="text-xs text-stone-500 font-light">
                  Order ID: <span className="font-mono font-semibold text-stone-900">{confirmedOrder.orderNumber || confirmedOrder.id}</span>
                </p>
              </div>

              <div className="bg-[#FAF9F6] border border-stone-200 p-4 text-left text-xs space-y-1.5 font-light">
                <div className="flex justify-between">
                  <span className="text-stone-500">Recipient:</span>
                  <span className="font-medium text-stone-900">{confirmedOrder.customer?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Mobile:</span>
                  <span className="font-mono text-stone-900">{confirmedOrder.customer?.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Payment:</span>
                  <span className="uppercase font-semibold text-stone-900">{confirmedOrder.paymentMethod}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold text-stone-950 pt-2 border-t border-stone-200">
                  <span>Total Amount:</span>
                  <span className="font-mono">₹{confirmedOrder.total}</span>
                </div>
              </div>

              <div className="space-y-2">
                <a
                  href={`https://wa.me/917023963189?text=${encodeURIComponent(`Namaste Skyline! I have placed Order #${confirmedOrder.orderNumber || confirmedOrder.id} for ₹${confirmedOrder.total}. Please confirm express delivery in Churu.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white py-3 text-xs uppercase tracking-wider font-medium transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Notify Store on WhatsApp</span>
                </a>

                <button
                  onClick={() => setConfirmedOrder(null)}
                  className="w-full bg-stone-950 hover:bg-stone-800 text-white py-3 text-xs uppercase tracking-wider font-medium cursor-pointer"
                >
                  Return to Collection
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ─── 13. CHURUONE SSO / OTP LOGIN MODAL ──────────────────── */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs" onClick={() => !authLoading && setIsAuthModalOpen(false)} />
          
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white max-w-sm w-full shadow-2xl border border-stone-200 p-8 space-y-6">
              
              <button
                onClick={() => setIsAuthModalOpen(false)}
                className="absolute right-4 top-4 text-stone-400 hover:text-stone-950 p-1"
              >
                <X className="w-4 h-4 stroke-[1.5]" />
              </button>

              <div className="text-center space-y-1">
                <span className="text-[10px] uppercase tracking-[0.25em] text-stone-400 font-semibold">
                  CHURUONE UNIFIED SIGN-IN
                </span>
                <h3 className="text-xl font-light font-serif text-stone-950">
                  {currentUser ? 'Your Skyline Profile' : 'Sign In with Mobile OTP'}
                </h3>
                <p className="text-xs text-stone-500 font-light">
                  {currentUser ? 'Synchronized across all ChuruOne shops' : 'Enter your 10-digit phone to receive a quick verification code.'}
                </p>
              </div>

              {currentUser ? (
                <div className="space-y-4">
                  <div className="bg-[#FAF9F6] border border-stone-200 p-4 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-stone-500">Name:</span>
                      <span className="font-medium text-stone-900">{currentUser.name || 'Gentleman'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">Phone:</span>
                      <span className="font-mono text-stone-900">{currentUser.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">Status:</span>
                      <span className="text-emerald-700 font-medium">Synced with ChuruOne</span>
                    </div>
                  </div>

                  <button
                    onClick={handleSignOut}
                    className="w-full border border-stone-300 text-stone-700 hover:bg-stone-100 py-2.5 text-xs uppercase tracking-wider font-medium cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>
              ) : !otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-semibold text-stone-600 mb-1">
                      Mobile Number
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 border border-r-0 border-stone-200 bg-stone-50 text-xs text-stone-500 font-mono">
                        +91
                      </span>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        value={authPhone}
                        onChange={(e) => setAuthPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="98290XXXXX"
                        className="w-full border border-stone-200 focus:border-stone-950 px-3 py-2 text-xs text-stone-900 font-mono outline-none"
                      />
                    </div>
                  </div>

                  {authError && <p className="text-xs text-red-600">{authError}</p>}

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full bg-stone-950 hover:bg-stone-800 disabled:opacity-50 text-white py-3 text-xs uppercase tracking-[0.2em] font-medium transition-all cursor-pointer"
                  >
                    {authLoading ? 'Sending Verification...' : 'Send OTP Code'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-semibold text-stone-600 mb-1">
                      Enter 4-Digit OTP Code
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={authOtp}
                      onChange={(e) => setAuthOtp(e.target.value.trim())}
                      placeholder="e.g. 1234"
                      className="w-full border border-stone-200 focus:border-stone-950 px-3 py-2.5 text-center text-lg tracking-[0.4em] font-mono text-stone-900 outline-none"
                    />
                  </div>

                  {devOtpNotice && (
                    <div className="p-2 bg-amber-50 border border-amber-200 text-amber-900 text-xs font-mono text-center">
                      {devOtpNotice}
                    </div>
                  )}

                  {authError && <p className="text-xs text-red-600">{authError}</p>}

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full bg-stone-950 hover:bg-stone-800 disabled:opacity-50 text-white py-3 text-xs uppercase tracking-[0.2em] font-medium transition-all cursor-pointer"
                  >
                    {authLoading ? 'Verifying...' : 'Confirm & Sign In'}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setAuthOtp(''); }}
                    className="w-full text-stone-500 hover:text-stone-900 text-xs underline cursor-pointer"
                  >
                    Change Phone Number
                  </button>
                </form>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ─── 14. ORDER TRACKER MODAL ────────────────────────────── */}
      {isTrackerOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs" onClick={() => setIsTrackerOpen(false)} />
          
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white max-w-lg w-full shadow-2xl border border-stone-200 p-8 space-y-6">
              
              <button
                onClick={() => setIsTrackerOpen(false)}
                className="absolute right-4 top-4 text-stone-400 hover:text-stone-950 p-1"
              >
                <X className="w-4 h-4 stroke-[1.5]" />
              </button>

              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-[0.25em] text-stone-500 font-semibold">
                  LIVE STATUS TRACKER
                </span>
                <h3 className="text-2xl font-light font-serif text-stone-950">
                  Track Your Skyline Order
                </h3>
                <p className="text-xs text-stone-500 font-light">
                  Enter your mobile number to view all ongoing and previous deliveries in Churu.
                </p>
              </div>

              <form onSubmit={handleTrackOrders} className="flex gap-2">
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={trackPhoneInput}
                  onChange={(e) => setTrackPhoneInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 10-digit mobile number"
                  className="flex-1 border border-stone-200 focus:border-stone-950 px-3 py-2 text-xs font-mono outline-none"
                />
                <button
                  type="submit"
                  disabled={trackingLoading}
                  className="bg-stone-950 text-white text-xs px-5 py-2 uppercase tracking-wider font-medium hover:bg-stone-800 cursor-pointer"
                >
                  {trackingLoading ? 'Searching...' : 'Search'}
                </button>
              </form>

              {/* Order Results */}
              <div className="max-h-80 overflow-y-auto space-y-4 pt-2">
                {trackedOrders.length > 0 ? (
                  trackedOrders.map((ord) => (
                    <div key={ord.id} className="p-4 bg-[#FAF9F6] border border-stone-200 space-y-2 text-xs">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-semibold text-stone-950 font-mono">
                            #{ord.orderNumber || ord.id}
                          </span>
                          <span className="text-[10px] text-stone-400 block">
                            {new Date(ord.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 text-[10px] uppercase font-semibold tracking-wider bg-stone-200 text-stone-800">
                          {ord.status || 'Confirmed'}
                        </span>
                      </div>

                      {/* Items */}
                      <div className="text-[11px] text-stone-600 divide-y divide-stone-100">
                        {(ord.items || []).map((it, idx) => (
                          <div key={idx} className="py-1 flex justify-between">
                            <span>{it.name} x {it.qty || 1}</span>
                            <span className="font-mono">₹{(it.unitPrice || 0) * (it.qty || 1)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-stone-200 flex justify-between font-semibold text-stone-950">
                        <span>Total Paid:</span>
                        <span className="font-mono">₹{ord.total}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-xs text-stone-400 py-6">
                    Enter your phone number above to look up orders.
                  </p>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ─── 15. SIZE GUIDE MODAL ────────────────────────────────── */}
      {isSizeGuideOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs" onClick={() => setIsSizeGuideOpen(false)} />
          
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white max-w-lg w-full shadow-2xl border border-stone-200 p-8 space-y-6">
              
              <button
                onClick={() => setIsSizeGuideOpen(false)}
                className="absolute right-4 top-4 text-stone-400 hover:text-stone-950 p-1"
              >
                <X className="w-4 h-4 stroke-[1.5]" />
              </button>

              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-[0.25em] text-stone-500 font-semibold">
                  TAILORING SPECIFICATION
                </span>
                <h3 className="text-2xl font-light font-serif text-stone-950">
                  Master Measurement Guide
                </h3>
                <p className="text-xs text-stone-500 font-light">
                  Measurements are taken flat in inches. We recommend sizing true to fit for an architectural, tailored drape.
                </p>
              </div>

              {/* Shirts & Overshirts Chart */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-900">
                  Linen Shirts & Canvas Overshirts (Inches)
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-stone-200">
                    <thead className="bg-[#FAF9F6] text-stone-600 font-semibold uppercase text-[10px]">
                      <tr>
                        <th className="p-2 border">Size</th>
                        <th className="p-2 border">Chest</th>
                        <th className="p-2 border">Shoulder</th>
                        <th className="p-2 border">Length</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200 font-mono text-stone-800">
                      <tr><td className="p-2 border font-bold">S (38)</td><td className="p-2 border">39"</td><td className="p-2 border">17.5"</td><td className="p-2 border">28"</td></tr>
                      <tr><td className="p-2 border font-bold">M (40)</td><td className="p-2 border">41"</td><td className="p-2 border">18.2"</td><td className="p-2 border">29"</td></tr>
                      <tr><td className="p-2 border font-bold">L (42)</td><td className="p-2 border">43"</td><td className="p-2 border">19.0"</td><td className="p-2 border">30"</td></tr>
                      <tr><td className="p-2 border font-bold">XL (44)</td><td className="p-2 border">45"</td><td className="p-2 border">19.8"</td><td className="p-2 border">31"</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Trousers Chart */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-900">
                  Gurkha & Tailored Trousers
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-stone-200">
                    <thead className="bg-[#FAF9F6] text-stone-600 font-semibold uppercase text-[10px]">
                      <tr>
                        <th className="p-2 border">Waist</th>
                        <th className="p-2 border">Inseam</th>
                        <th className="p-2 border">Thigh</th>
                        <th className="p-2 border">Ankle Opening</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200 font-mono text-stone-800">
                      <tr><td className="p-2 border font-bold">30</td><td className="p-2 border">30"</td><td className="p-2 border">24"</td><td className="p-2 border">14.5"</td></tr>
                      <tr><td className="p-2 border font-bold">32</td><td className="p-2 border">31"</td><td className="p-2 border">25"</td><td className="p-2 border">15.0"</td></tr>
                      <tr><td className="p-2 border font-bold">34</td><td className="p-2 border">32"</td><td className="p-2 border">26"</td><td className="p-2 border">15.5"</td></tr>
                      <tr><td className="p-2 border font-bold">36</td><td className="p-2 border">32"</td><td className="p-2 border">27"</td><td className="p-2 border">16.0"</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <p className="text-[11px] text-stone-400 italic">
                * Note: In-person complimentary tailoring adjustments are provided at our Subhash Chowk store for any Churu resident.
              </p>

            </div>
          </div>
        </div>
      )}

      {/* ─── 16. TOAST FLOATING ALERT ────────────────────────────── */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-950 text-white px-5 py-3 shadow-2xl text-xs uppercase tracking-wider font-medium flex items-center gap-2.5 animate-slide-up border border-stone-700">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}

// ─── SUBCOMPONENT: PRODUCT CARD WITH DUAL-LOOK HOVER & SIZE PILLS ─
function ProductCard({ product, onQuickView, onAddToCart }) {
  const [isHovered, setIsHovered] = useState(false);
  const [selectedSize, setSelectedSize] = useState(product.availableSizes ? product.availableSizes[0] : 'M');
  const [selectedColor, setSelectedColor] = useState(product.colors ? product.colors[0] : null);

  return (
    <div 
      className="group flex flex-col justify-between bg-white border border-stone-200 transition-all duration-300 hover:shadow-lg"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Area with Double-Look Secondary Swap */}
      <div className="relative aspect-3/4 overflow-hidden bg-stone-100 cursor-pointer" onClick={onQuickView}>
        <img
          src={isHovered && product.secondaryImage ? product.secondaryImage : product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-103"
        />

        {/* Badge Pill */}
        {product.badge && (
          <div className="absolute top-3 left-3 bg-stone-950 text-white text-[9px] uppercase tracking-[0.2em] px-2.5 py-1 font-semibold shadow-xs">
            {product.badge}
          </div>
        )}

        {/* Quick View Floating Eye Button */}
        <button
          onClick={(e) => { e.stopPropagation(); onQuickView(); }}
          className="absolute bottom-3 right-3 bg-white/90 hover:bg-white text-stone-900 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
          title="Quick View Garment Specs"
        >
          <Eye className="w-4 h-4 stroke-[1.5]" />
        </button>
      </div>

      {/* Product Content Details */}
      <div className="p-5 flex flex-col justify-between flex-1 space-y-4">
        
        <div>
          {/* Fabric Line Tag */}
          <span className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-medium block mb-1">
            {product.fabric || 'Pure Natural Weave'}
          </span>

          {/* Name */}
          <h3 
            onClick={onQuickView}
            className="text-sm font-medium text-stone-950 leading-snug cursor-pointer hover:text-amber-900 transition-colors"
          >
            {product.name}
          </h3>

          {/* Price */}
          <div className="flex items-baseline gap-2.5 mt-2">
            <span className="text-sm font-semibold font-mono text-stone-950">
              ₹{product.price}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-stone-400 line-through font-mono">
                ₹{product.originalPrice}
              </span>
            )}
            {product.originalPrice && (
              <span className="text-[10px] text-amber-800 font-semibold font-mono">
                ({Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF)
              </span>
            )}
          </div>
        </div>

        {/* Size Selection Pills */}
        <div className="pt-2 border-t border-stone-100 space-y-2">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-stone-500 font-medium">
            <span>Size:</span>
            {product.colors && product.colors.length > 0 && (
              <span className="text-stone-400">{product.colors.length} shades</span>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {(product.availableSizes || ['S', 'M', 'L', 'XL']).slice(0, 5).map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={() => setSelectedSize(sz)}
                className={`text-[10px] px-2 py-0.5 border font-mono transition-all cursor-pointer ${
                  selectedSize === sz
                    ? 'border-stone-950 bg-stone-950 text-white font-medium'
                    : 'border-stone-200 text-stone-600 hover:border-stone-400'
                }`}
              >
                {sz}
              </button>
            ))}
          </div>
        </div>

        {/* Add to Bag CTA */}
        <button
          onClick={() => onAddToCart(selectedSize, selectedColor?.name)}
          className="w-full bg-stone-950 hover:bg-stone-800 text-white py-2.5 text-[11px] uppercase tracking-[0.18em] font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
        >
          <ShoppingBag className="w-3.5 h-3.5 stroke-[1.5]" />
          <span>Add To Bag</span>
        </button>

      </div>
    </div>
  );
}
