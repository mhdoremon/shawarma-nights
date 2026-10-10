import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ShoppingBag, 
  Search, 
  X, 
  Check, 
  ArrowRight, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
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
  Heart, 
  Share2, 
  Menu as MenuIcon,
  HelpCircle,
  ArrowUpRight,
  Crosshair,
  Store,
  QrCode,
  Banknote,
  Smartphone,
  Navigation,
  AlertCircle
} from 'lucide-react';
import { 
  getSkylineData, 
  validateCouponCode, 
  placeSkylineOrder,
  initiateSkylineUpiPayment,
  updateSkylineOrderStatus
} from './skylineApiClient';
import { getChuruOneSession, setChuruOneSession } from '../../utils/ssoHelper';
import UpiPaymentModal from '../../components/UpiPaymentModal';

const CHURU_POPULAR_LANDMARKS = [
  'Subhash Chowk',
  'Station Road',
  'Nai Sarak',
  'Dharamstupa / Kotwali',
  'Collectorate Road',
  'Pankha Circle',
  'Lohiya College',
  'Nature Park / Churu Club',
  'Naya Bass'
];

export default function SkylineApp() {
  // ─── STATE MANAGEMENT ──────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [storeData, setStoreData] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('men');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Customer & ChuruOne SSO Auth State
  const [currentUser, setCurrentUser] = useState(null);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  // Wishlist State
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem('slick_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Cart State
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('slick_cart') || localStorage.getItem('skyline_cart');
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

  // Checkout & Location State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [deliveryType, setDeliveryType] = useState('delivery'); // 'delivery' | 'pickup'
  const [checkoutName, setCheckoutName] = useState('');
  const [checkoutPhone, setCheckoutPhone] = useState('');
  const [houseNo, setHouseNo] = useState('');
  const [streetArea, setStreetArea] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pincode, setPincode] = useState('331001');
  const [orderLiveGps, setOrderLiveGps] = useState(null); // { lat, lng, accuracy }
  const [isCapturingGps, setIsCapturingGps] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [selectedLandmarkChip, setSelectedLandmarkChip] = useState('');
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod'); // 'cod' | 'upi'
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  // Real UPI & SmartPay Modal State
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);
  const [pendingPaymentData, setPendingPaymentData] = useState(null);

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

  // ─── INITIAL DATA LOAD & CHURUONE SSO SYNC ────────────────────
  useEffect(() => {
    document.title = "Slick • Find Your Sole Mate | Skyline Churu";

    // 1. Check for incoming redirect from ChuruOne SSO (/auth)
    try {
      const params = new URLSearchParams(window.location.search);
      const urlUserRaw = params.get('churuone_user');
      const urlToken = params.get('churuone_token');

      if (urlUserRaw) {
        const parsed = JSON.parse(decodeURIComponent(urlUserRaw));
        setCurrentUser(parsed);
        setChuruOneSession(parsed, urlToken || '');
        if (parsed.name) setCheckoutName(parsed.name);
        if (parsed.phone || parsed.phoneNumber) {
          const rawPhone = String(parsed.phone || parsed.phoneNumber).replace(/\D/g, '').slice(-10);
          setCheckoutPhone(rawPhone);
        }
        if (parsed.address) {
          setStreetArea(parsed.address);
        }
        showToast(`✦ ChuruOne SSO Verified: Welcome, ${parsed.name || 'Friend'}!`);

        // Clean query parameters from URL
        params.delete('churuone_user');
        params.delete('churuone_token');
        params.delete('account_created');
        const cleanUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : '');
        window.history.replaceState({}, document.title, cleanUrl);
      } else {
        // Check existing ChuruOne SSO session
        const session = getChuruOneSession();
        if (session && session.user) {
          setCurrentUser(session.user);
          if (session.user.name) setCheckoutName(session.user.name);
          if (session.user.phone || session.user.phoneNumber) {
            const rawPhone = String(session.user.phone || session.user.phoneNumber).replace(/\D/g, '').slice(-10);
            setCheckoutPhone(rawPhone);
          }
          if (session.user.address) {
            setStreetArea(session.user.address);
          }
        }
      }
    } catch (e) {
      console.warn('ChuruOne SSO sync error:', e);
    }

    // 2. Listen for cross-window / popup SSO completion
    const handleSsoMessage = (e) => {
      if (e.data && e.data.type === 'CHURUONE_AUTH_SUCCESS') {
        const u = e.data.user;
        if (u) {
          setCurrentUser(u);
          setChuruOneSession(u, e.data.token || '');
          if (u.name) setCheckoutName(u.name);
          if (u.phone || u.phoneNumber) {
            setCheckoutPhone(String(u.phone || u.phoneNumber).replace(/\D/g, '').slice(-10));
          }
          if (u.address) setStreetArea(u.address);
          showToast(`✦ Verified by ChuruOne: ${u.name || 'Friend'}`);
        }
      }
    };
    window.addEventListener('message', handleSsoMessage);

    // 3. Fetch live catalog data from Smart Backend
    loadStoreData();

    return () => window.removeEventListener('message', handleSsoMessage);
  }, []);

  // Save Cart to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('slick_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.warn('Cart save error:', e);
    }
  }, [cartItems]);

  // Save Wishlist to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('slick_wishlist', JSON.stringify(wishlist));
    } catch (e) {
      console.warn('Wishlist save error:', e);
    }
  }, [wishlist]);

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

  const toggleWishlist = (productId) => {
    setWishlist(prev => {
      const exists = prev.includes(productId);
      const updated = exists ? prev.filter(id => id !== productId) : [...prev, productId];
      showToast(exists ? 'Removed from wishlist' : 'Saved to wishlist ♥');
      return updated;
    });
  };

  // ─── CART CALCULATIONS ─────────────────────────────────────────
  const cartSubtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }, [cartItems]);

  const freeDeliveryThreshold = storeData?.storeInfo?.freeDeliveryThreshold ?? 999;
  const standardDeliveryFee = storeData?.storeInfo?.deliveryFee ?? 70;
  const deliveryFee = deliveryType === 'pickup' || cartSubtotal >= freeDeliveryThreshold || cartItems.length === 0 ? 0 : standardDeliveryFee;
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

  // ─── GPS & LOCATION HANDLERS ───────────────────────────────────
  const handleDetectGps = () => {
    setIsCapturingGps(true);
    setGpsError('');

    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      setIsCapturingGps(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const coords = { lat: latitude, lng: longitude, accuracy };
        setOrderLiveGps(coords);

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await res.json();
          if (data && data.address) {
            const parts = [];
            if (data.address.road) parts.push(data.address.road);
            if (data.address.suburb || data.address.neighbourhood) parts.push(data.address.suburb || data.address.neighbourhood);
            if (data.address.city || data.address.town) parts.push(data.address.city || data.address.town);
            const detectedStr = parts.length > 0 ? parts.join(', ') : data.display_name;
            setStreetArea(detectedStr);
            if (data.address.postcode) setPincode(data.address.postcode);
          }
        } catch (e) {
          console.warn('Reverse geocoding error:', e);
        }
        setIsCapturingGps(false);
        showToast('📍 Live GPS Location captured successfully!');
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setGpsError('GPS permission denied. Kripya browser me location allow karein ya exact address likhein.');
        setIsCapturingGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleSelectLandmarkChip = (lm) => {
    setSelectedLandmarkChip(lm);
    setLandmark(lm);
    if (!streetArea) {
      setStreetArea(`Near ${lm}, Churu`);
    }
  };

  const fullDeliveryAddress = useMemo(() => {
    if (deliveryType === 'pickup') {
      return 'Self Store Pickup • Subhash Chowk Flagship, Churu – 331001';
    }
    const parts = [];
    if (houseNo.trim()) parts.push(houseNo.trim());
    if (streetArea.trim()) parts.push(streetArea.trim());
    if (landmark.trim()) parts.push(`Near ${landmark.trim()}`);
    parts.push(`Churu – ${pincode || '331001'}`);
    return parts.join(', ');
  }, [deliveryType, houseNo, streetArea, landmark, pincode]);

  // ─── CART HANDLERS ─────────────────────────────────────────────
  const addToCart = (product, selectedSize, selectedColor) => {
    const size = selectedSize || (product.availableSizes && product.availableSizes[0]) || 'UK 8';
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

    showToast(`Added to Bag: ${product.name}`);
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
          text: `Discount applied: ${deal.title || code} (-₹${deal.flatDiscount || (deal.discountPercent ? `${deal.discountPercent}%` : '')})`, 
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

  // ─── CHURUONE UNIFIED SSO AUTHENTICATION ─────────────────────
  const navigateToChuruOneAuth = (mode = 'login') => {
    try {
      const currentUrl = window.location.pathname + window.location.search;
      const returnUrl = encodeURIComponent(currentUrl || '/skyline');
      window.location.href = `/auth?storeId=skyline&mode=${mode}&returnUrl=${returnUrl}`;
    } catch (e) {
      window.location.href = `/auth?storeId=skyline&mode=${mode}`;
    }
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('churuone_user');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('sn_session');
      localStorage.removeItem('sn_current_user');
      localStorage.removeItem('nash_user');
    } catch {}
    setIsAccountModalOpen(false);
    showToast('Signed out from ChuruOne session');
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
    if (deliveryType === 'delivery') {
      if (!streetArea.trim() && !orderLiveGps) {
        showToast('Please enter your street address or capture live GPS');
        return;
      }
    }

    setOrderSubmitting(true);
    try {
      const generatedDeliveryOtp = String(Math.floor(1000 + Math.random() * 9000));
      const orderPayload = {
        customer: {
          name: checkoutName.trim(),
          phone: `+91${cleanPhone}`,
          address: fullDeliveryAddress
        },
        items: cartItems.map(item => ({
          name: `${item.name} [Size: ${item.size}, Color: ${item.color}]`,
          itemId: item.id,
          unitPrice: item.price,
          qty: item.quantity,
          size: item.size,
          color: item.color
        })),
        deliveryType: deliveryType,
        address: fullDeliveryAddress,
        lat: orderLiveGps?.lat || null,
        lng: orderLiveGps?.lng || null,
        paymentMethod: paymentMethod === 'cod' ? 'COD' : 'UPI',
        paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending_upi',
        deliveryOtp: generatedDeliveryOtp,
        couponCode: appliedCoupon?.code || null,
        subtotal: cartSubtotal,
        discount: discountAmount,
        deliveryFee: deliveryFee,
        tax: 0,
        packagingCharge: 0,
        tip: 0,
        total: grandTotal,
        notes: checkoutNotes.trim(),
        source: 'slick_web'
      };

      const res = await placeSkylineOrder(orderPayload);
      if (res && (res.success || res.order)) {
        const created = res.order || res;
        
        if (paymentMethod === 'cod') {
          setConfirmedOrder(created);
          setCartItems([]);
          setAppliedCoupon(null);
          setIsCheckoutOpen(false);
          setIsCartOpen(false);
          showToast('Order Placed Successfully via Cash on Delivery!');
        } else {
          // Instant UPI & SmartPay using our Unified UpiPaymentModal Engine
          const upiPayload = {
            orderId: created.orderNumber || created.id,
            id: created.id,
            grandTotal: created.total || grandTotal,
            total: created.total || grandTotal,
            upiId: storeData?.payment?.upiId || 'skylineoutfits@upi',
            payeeName: storeData?.payment?.payeeName || 'Skyline Premium Outfits',
            customerName: checkoutName.trim(),
            customerPhone: `+91 ${cleanPhone}`,
            address: fullDeliveryAddress,
            orderGps: orderLiveGps,
            deliveryOtp: generatedDeliveryOtp,
            items: cartItems
          };
          setPendingPaymentData(upiPayload);
          setConfirmedOrder(created);
          setIsUpiModalOpen(true);
        }
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

  // ─── UPI MODAL PAYMENT SUCCESS CALLBACK ────────────────────────
  const handlePaymentSuccess = async (paymentResult) => {
    try {
      if (confirmedOrder?.id) {
        await updateSkylineOrderStatus(confirmedOrder.id, 'confirmed', 'paid');
      }
    } catch (e) {
      console.warn('Order status update error:', e);
    }
    setConfirmedOrder(prev => prev ? { ...prev, paymentStatus: 'paid', status: 'confirmed' } : null);
    setIsUpiModalOpen(false);
    setIsCheckoutOpen(false);
    setCartItems([]);
    setAppliedCoupon(null);
    showToast('✦ Payment Verified! Wardrobe Order Confirmed.');
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

  // ─── HERO & TRENDING ITEMS ────────────────────────────────────
  const heroProduct = useMemo(() => {
    return menuItems.find(item => item.id === 'slick-shoe-00') || menuItems[0] || {
      id: 'slick-shoe-00',
      name: 'Trendy Slick Pro',
      price: 3999,
      originalPrice: 6999,
      image: 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?auto=format&fit=crop&w=1000&q=85',
      badge: 'HERO EDIT'
    };
  }, [menuItems]);

  const trendingProducts = useMemo(() => {
    const candidates = menuItems.filter(item => 
      item.subCategory === 'trending' || 
      item.id === 'slick-shoe-07' || 
      item.id === 'slick-shoe-08' || 
      item.id === 'slick-shoe-09'
    );
    if (candidates.length >= 3) return candidates;
    return menuItems.slice(7, 10).length > 0 ? menuItems.slice(7, 10) : menuItems.slice(0, 3);
  }, [menuItems]);

  // ─── BEST SELLING ITEMS (6 ITEMS AS IN SCREENSHOT) ───────────
  const bestSellingProducts = useMemo(() => {
    let list = menuItems.filter(item => item.id !== 'slick-shoe-00');

    if (activeCategory === 'men') {
      list = list.filter(item => item.category === 'men' || !item.category);
    } else if (activeCategory === 'woman') {
      list = list.filter(item => item.category === 'woman');
    } else if (activeCategory === 'boy') {
      list = list.filter(item => item.category === 'boy');
    } else if (activeCategory === 'child') {
      list = list.filter(item => item.category === 'child');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(item => 
        item.name.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q))
      );
    }

    if (list.length < 6 && activeCategory === 'men') {
      return menuItems.filter(i => i.id.startsWith('slick-shoe') && i.id !== 'slick-shoe-00').slice(0, 6);
    }

    return list.slice(0, 6);
  }, [menuItems, activeCategory, searchQuery]);

  // ─── REVIEWS LIST ─────────────────────────────────────────────
  const customerReviews = useMemo(() => {
    return [
      {
        id: 'rev-1',
        name: 'Ravi Joshi',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        rating: 5,
        comment: 'The craftsmanship and cloud comfort of the Slick Pro sneakers are unmatched. Premium lightweight sole and luxurious finish.'
      },
      {
        id: 'rev-2',
        name: 'Otis Binkley',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        rating: 5,
        comment: 'Hands down the cleanest aesthetic. Perfectly complements tailored outfits and streetwear. The ChuruOne SSO seamless checkout made ordering effortless!'
      }
    ];
  }, []);

  return (
    <div className="min-h-screen bg-white text-stone-900 font-sans selection:bg-black selection:text-white antialiased">
      
      {/* ─── TOAST NOTIFICATION ───────────────────────────────────── */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-950 text-white px-5 py-3 rounded-lg shadow-2xl text-xs font-medium tracking-wide flex items-center gap-2.5 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ─── 1. MINIMALIST HEADER / NAVBAR ────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-100 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          {/* Brand Logo: Slick (as in screenshot) */}
          <div className="flex items-center gap-6">
            <a href="/skyline" className="group flex items-center gap-1.5 text-stone-950 no-underline">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tighter text-black">
                Slick
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-black group-hover:scale-150 transition-transform"></span>
            </a>

            {/* ChuruOne Network Pill */}
            <span className="hidden xl:inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-stone-400 font-medium px-2 py-0.5 rounded-full bg-stone-50 border border-stone-100">
              Skyline • Churu Flagship
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-stone-600">
            <a href="#hero" className="text-stone-950 hover:text-black transition-colors">Home</a>
            <a href="#trending" className="hover:text-black transition-colors">Shop</a>
            <a href="#bestselling" className="hover:text-black transition-colors">Collection</a>
            <a href="#reviews" className="hover:text-black transition-colors">Reviews</a>
          </nav>

          {/* Right Action Icons & Auth */}
          <div className="flex items-center gap-3 sm:gap-4">
            
            {/* Search Toggle */}
            <div className="relative">
              {isSearchOpen ? (
                <div className="flex items-center bg-stone-100 rounded-full px-3 py-1.5 text-xs w-44 sm:w-56 transition-all">
                  <Search className="w-3.5 h-3.5 text-stone-500 shrink-0 mr-2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search shoes..."
                    className="bg-transparent outline-none w-full text-xs text-stone-900"
                    autoFocus
                  />
                  <button onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} className="text-stone-400 hover:text-stone-700 ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="p-2 text-stone-700 hover:text-black transition-colors cursor-pointer"
                  title="Search"
                >
                  <Search className="w-4 h-4 stroke-[1.8]" />
                </button>
              )}
            </div>

            {/* Shopping Bag Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-stone-700 hover:text-black transition-colors cursor-pointer"
              title="Shopping Bag"
            >
              <ShoppingBag className="w-4 h-4 stroke-[1.8]" />
              {totalItemsCount > 0 && (
                <span className="absolute top-1 right-1 bg-black text-white rounded-full text-[9px] font-bold w-4 h-4 flex items-center justify-center">
                  {totalItemsCount}
                </span>
              )}
            </button>

            {/* ChuruOne SSO Authentication: Sign In & Sign Up */}
            {currentUser ? (
              <button
                onClick={() => setIsAccountModalOpen(true)}
                className="flex items-center gap-2 text-xs text-stone-800 hover:text-black py-1 px-2.5 rounded-full border border-stone-200 bg-stone-50 cursor-pointer transition-all"
                title="ChuruOne Account"
              >
                <div className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-bold">
                  {(currentUser.name || 'U')[0]}
                </div>
                <span className="hidden sm:inline font-medium max-w-[80px] truncate text-xs">
                  {currentUser.name?.split(' ')[0] || 'User'}
                </span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => navigateToChuruOneAuth('login')}
                  className="text-stone-600 hover:text-black transition-colors text-xs font-medium py-1 px-2.5 cursor-pointer"
                  title="Sign In with ChuruOne SSO"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigateToChuruOneAuth('signup')}
                  className="bg-black hover:bg-stone-800 text-white transition-all text-xs font-semibold px-3 py-1.5 rounded-full cursor-pointer shadow-xs"
                  title="Sign Up with ChuruOne SSO"
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Mobile Menu Icon */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-stone-700 hover:text-black cursor-pointer"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile Navigation Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-stone-100 bg-white px-6 py-4 space-y-3">
            <a href="#hero" onClick={() => setIsMobileMenuOpen(false)} className="block text-sm font-medium text-stone-900 py-1">Home</a>
            <a href="#trending" onClick={() => setIsMobileMenuOpen(false)} className="block text-sm font-medium text-stone-900 py-1">Shop</a>
            <a href="#bestselling" onClick={() => setIsMobileMenuOpen(false)} className="block text-sm font-medium text-stone-900 py-1">Collection</a>
            <a href="#reviews" onClick={() => setIsMobileMenuOpen(false)} className="block text-sm font-medium text-stone-900 py-1">Reviews</a>
            <button 
              onClick={() => { setIsMobileMenuOpen(false); setIsTrackerOpen(true); }}
              className="w-full text-left text-sm font-medium text-stone-600 py-1 flex items-center gap-2"
            >
              <Clock className="w-4 h-4 text-stone-400" />
              <span>Track Orders</span>
            </button>
          </div>
        )}
      </header>

      {/* ─── 2. HERO SECTION (MATCHES LEFT PANEL OF SCREENSHOT) ────── */}
      <section id="hero" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Text Column */}
          <div className="lg:col-span-5 space-y-5 text-center lg:text-left">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-stone-950 tracking-tight leading-[1.08]">
              Find Your<br />
              Sole Mate<br />
              With Us
            </h1>
            
            <p className="text-stone-500 text-sm sm:text-base font-normal leading-relaxed max-w-md mx-auto lg:mx-0">
              Lorem Ipsum Dolor Sit Amet, Consectetur Adipiscing Elit, Sed Do Eiusmod.
            </p>

            <div className="pt-2">
              <a
                href="#bestselling"
                className="inline-block bg-black text-white hover:bg-stone-800 transition-all px-8 py-3.5 rounded-md text-xs uppercase tracking-widest font-semibold shadow-md active:scale-95 no-underline cursor-pointer"
              >
                Shop Now
              </a>
            </div>
          </div>

          {/* Right Product Showcase with "ULTIMATE" Watermark */}
          <div className="lg:col-span-7">
            <div className="relative bg-[#F6F6F6] rounded-3xl p-6 sm:p-12 overflow-hidden flex items-center justify-center min-h-[380px] sm:min-h-[480px]">
              
              {/* Giant Translucent Vertical Watermark: ULTIMATE */}
              <div className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 -rotate-90 origin-center text-6xl sm:text-8xl lg:text-9xl font-black text-stone-200/90 tracking-[0.25em] select-none pointer-events-none">
                ULTIMATE
              </div>

              {/* Floating Hero White Sneaker */}
              <div 
                onClick={() => setSelectedProduct(heroProduct)}
                className="relative z-10 w-full max-w-md mx-auto cursor-pointer group"
              >
                <img
                  src={heroProduct.image}
                  alt={heroProduct.name}
                  className="w-full h-64 sm:h-80 object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-2"
                />
              </div>

              {/* Floating Badge / Card Below the Sneaker */}
              <div className="absolute bottom-6 right-6 sm:right-10 z-20 bg-white/95 backdrop-blur-md px-5 py-3 rounded-2xl border border-stone-100 shadow-xl flex items-center gap-4">
                <div>
                  <span className="block text-xs font-semibold text-stone-950 tracking-tight">
                    {heroProduct.name}
                  </span>
                  <span className="block text-xs font-mono font-medium text-stone-500 mt-0.5">
                    ₹ {heroProduct.price}.00
                  </span>
                </div>
                <button
                  onClick={() => addToCart(heroProduct)}
                  className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center hover:bg-stone-800 transition-transform active:scale-90 cursor-pointer shadow-sm"
                  title="Add to Bag"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ─── 3. SOLID BLACK BRAND STRIP (MARQUEE / PARTNERS) ─────── */}
      <section className="bg-black text-white py-5 px-4 overflow-hidden select-none">
        <div className="max-w-7xl mx-auto flex items-center justify-around flex-wrap gap-8 sm:gap-14 text-center">
          <span className="text-xl sm:text-2xl font-bold tracking-tight text-white/90 lowercase hover:text-white transition-colors cursor-default">
            ebay
          </span>
          <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-white/90 hover:text-white transition-colors cursor-default">
            amazon<span className="text-amber-400">.com</span>
          </span>
          <span className="text-xl sm:text-2xl font-black tracking-widest text-white/90 uppercase hover:text-white transition-colors cursor-default">
            AJIO
          </span>
          <span className="text-xl sm:text-2xl font-bold tracking-tight text-white/90 lowercase hover:text-white transition-colors cursor-default">
            ebay
          </span>
          <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-white/90 hover:text-white transition-colors cursor-default">
            amazon<span className="text-amber-400">.com</span>
          </span>
          <span className="text-xl sm:text-2xl font-black tracking-widest text-white/90 uppercase hover:text-white transition-colors cursor-default">
            AJIO
          </span>
        </div>
      </section>

      {/* ─── 4. OUR TRENDING SHOE / MOST POPULAR PRODUCTS ─────────── */}
      <section id="trending" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        
        {/* Section Tag */}
        <div className="text-center sm:text-left mb-3">
          <span className="text-xs uppercase tracking-[0.25em] font-semibold text-stone-400">
            — Our Trending Shoe —
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Column: Heading, description, Explore button */}
          <div className="lg:col-span-4 space-y-4 text-center sm:text-left">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-950 tracking-tight leading-tight">
              Most Popular<br />
              Products
            </h2>
            <p className="text-stone-500 text-xs sm:text-sm leading-relaxed max-w-sm mx-auto sm:mx-0">
              Lorem Ipsum Dolor Sit Amet, Consectetur Adipiscing Elit, Sed Do Eiusmod.
            </p>
            <div className="pt-2">
              <a
                href="#bestselling"
                className="inline-block bg-black text-white hover:bg-stone-800 transition-colors px-6 py-2.5 rounded-md text-xs font-semibold uppercase tracking-wider cursor-pointer no-underline"
              >
                Explore
              </a>
            </div>
          </div>

          {/* Right Column: 3 Trending Shoe Cards + Controls */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* 3-Card Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {trendingProducts.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="bg-[#F5F5F7] rounded-2xl p-5 relative group hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
                >
                  {/* Shoe Image */}
                  <div 
                    onClick={() => setSelectedProduct(item)}
                    className="h-36 sm:h-40 flex items-center justify-center cursor-pointer overflow-hidden"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="max-h-full max-w-full object-contain group-hover:scale-105 group-hover:-rotate-3 transition-transform duration-300 drop-shadow-md"
                    />
                  </div>

                  {/* Details & Circular Action Button */}
                  <div className="pt-4 flex items-end justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-stone-900 truncate max-w-[140px]">
                        {item.name}
                      </h4>
                      <p className="text-xs font-mono font-medium text-stone-600 mt-1">
                        ₹ {item.price}.00
                      </p>
                    </div>

                    <button
                      onClick={() => addToCart(item)}
                      className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center hover:bg-stone-800 transition-transform active:scale-90 cursor-pointer shadow-sm shrink-0"
                      title="Add to Bag"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Carousel Controls & Pagination Dots */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <span className="w-2 h-2 rounded-full bg-black"></span>
              <span className="w-2 h-2 rounded-full bg-stone-300"></span>
              <span className="w-2 h-2 rounded-full bg-stone-300"></span>
            </div>

          </div>

        </div>
      </section>

      {/* ─── 5. BEST SELLING SECTION (MATCHES RIGHT PANEL) ─────────── */}
      <section id="bestselling" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 border-t border-stone-100">
        
        {/* Section Header */}
        <div className="text-center space-y-4 mb-10">
          <span className="text-xs uppercase tracking-[0.25em] font-semibold text-stone-400 block">
            — Best Selling —
          </span>

          {/* Category Filter Pills (Men, Woman, Boy, Child as in screenshot) */}
          <div className="flex items-center justify-center flex-wrap gap-2 pt-2">
            {[
              { id: 'men', label: 'Men' },
              { id: 'woman', label: 'Woman' },
              { id: 'boy', label: 'Boy' },
              { id: 'child', label: 'Child' },
              { id: 'all', label: 'All' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={`px-6 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  activeCategory === tab.id
                    ? 'bg-black text-white shadow-md'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 6-Card Product Grid (3 Columns x 2 Rows as in screenshot) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {bestSellingProducts.map((product) => {
            const isWishlisted = wishlist.includes(product.id);

            return (
              <div
                key={product.id}
                className="bg-[#F6F6F6] rounded-2xl p-6 relative group hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                {/* Top Badges: [ New ] tag on left, Wishlist Heart on right */}
                <div className="flex items-center justify-between z-10">
                  <span className="bg-black text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {product.badge || 'New'}
                  </span>
                  
                  <button
                    onClick={() => toggleWishlist(product.id)}
                    className="p-1 text-stone-400 hover:text-red-500 transition-colors cursor-pointer"
                    title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                  >
                    <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : 'stroke-[1.8]'}`} />
                  </button>
                </div>

                {/* Sneaker Image */}
                <div
                  onClick={() => setSelectedProduct(product)}
                  className="h-44 sm:h-52 flex items-center justify-center my-4 cursor-pointer overflow-hidden"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="max-h-full max-w-full object-contain group-hover:scale-105 group-hover:-rotate-3 transition-transform duration-300 drop-shadow-md"
                  />
                </div>

                {/* Bottom Details & Circular Action Button */}
                <div className="flex items-end justify-between pt-2">
                  <div>
                    <h3 
                      onClick={() => setSelectedProduct(product)}
                      className="text-xs font-semibold text-stone-900 hover:text-black cursor-pointer truncate max-w-[180px]"
                    >
                      {product.name}
                    </h3>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-mono font-semibold text-stone-950">
                        ₹ {product.price}.00
                      </span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <span className="text-[11px] font-mono text-stone-400 line-through">
                          ₹ {product.originalPrice}.00
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => addToCart(product)}
                    className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center hover:bg-stone-800 transition-transform active:scale-90 cursor-pointer shadow-sm shrink-0"
                    title="Add to Bag"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>

      </section>

      {/* ─── 6. CUSTOMER REVIEW SECTION ───────────────────────────── */}
      <section id="reviews" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 border-t border-stone-100">
        
        {/* Section Tag */}
        <div className="text-center space-y-2 mb-12">
          <span className="text-xs uppercase tracking-[0.25em] font-semibold text-stone-400 block">
            — Customer Review —
          </span>
        </div>

        {/* 2 Side-by-Side Review Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {customerReviews.slice(0, 2).map((rev) => (
            <div
              key={rev.id}
              className="bg-[#F8F8F9] rounded-2xl p-6 sm:p-8 flex items-start gap-4 border border-stone-100 shadow-xs"
            >
              {/* Customer Avatar */}
              <img
                src={rev.avatar}
                alt={rev.name}
                className="w-12 h-12 rounded-xl object-cover shrink-0 shadow-sm"
              />

              {/* Review Content */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-stone-950">
                    {rev.name}
                  </h4>
                  {/* 5 Yellow Stars */}
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>

                <p className="text-xs text-stone-600 leading-relaxed font-light">
                  {rev.comment}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Carousel Pagination Dots */}
        <div className="flex items-center justify-center gap-2 pt-8">
          <span className="w-2 h-2 rounded-full bg-black"></span>
          <span className="w-2 h-2 rounded-full bg-stone-300"></span>
          <span className="w-2 h-2 rounded-full bg-stone-300"></span>
          <span className="w-2 h-2 rounded-full bg-stone-300"></span>
        </div>

      </section>

      {/* ─── 7. MINIMAL FOOTER ─────────────────────────────────────── */}
      <footer className="border-t border-stone-200 bg-[#FAFAFA] text-stone-600 text-xs py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-3">
              <span className="text-2xl font-black text-black">Slick</span>
              <p className="text-stone-500 text-xs leading-relaxed">
                By Skyline Premium Outfits. Architectural footwear and menswear studio in Churu, Rajasthan.
              </p>
              <div className="flex items-center gap-2 text-stone-800 font-medium">
                <MapPin className="w-3.5 h-3.5 text-black shrink-0" />
                <span>Subhash Chowk, Churu – 331001</span>
              </div>
            </div>

            <div className="space-y-2">
              <h5 className="font-bold text-black uppercase tracking-wider text-[11px]">Collections</h5>
              <p className="hover:text-black cursor-pointer">Slick Pro Sneakers</p>
              <p className="hover:text-black cursor-pointer">Casual Retro Runners</p>
              <p className="hover:text-black cursor-pointer">Canvas Street Lows</p>
              <p className="hover:text-black cursor-pointer">Normandy Flax Linens</p>
            </div>

            <div className="space-y-2">
              <h5 className="font-bold text-black uppercase tracking-wider text-[11px]">Customer Care</h5>
              <button onClick={() => setIsTrackerOpen(true)} className="block hover:text-black cursor-pointer text-left">
                Track Order
              </button>
              <p className="hover:text-black cursor-pointer">Delivery Policy (24h Churu Express)</p>
              <p className="hover:text-black cursor-pointer">Bespoke Fitting & Size Guide</p>
              <a href="https://wa.me/917023963189" target="_blank" rel="noreferrer" className="block text-emerald-700 hover:text-emerald-900">
                WhatsApp Concierge (+91 70239 63189)
              </a>
            </div>

            <div className="space-y-3">
              <h5 className="font-bold text-black uppercase tracking-wider text-[11px]">ChuruOne Network</h5>
              <p className="text-stone-500 text-xs leading-relaxed">
                Single Sign-On enabled across all Churu flagship outlets.
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateToChuruOneAuth('login')}
                  className="bg-black hover:bg-stone-800 text-white px-3 py-1.5 rounded-full text-[11px] font-medium cursor-pointer"
                >
                  Sign In SSO
                </button>
                <button
                  onClick={() => navigateToChuruOneAuth('signup')}
                  className="border border-stone-300 hover:border-black text-black px-3 py-1.5 rounded-full text-[11px] font-medium cursor-pointer"
                >
                  Sign Up SSO
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-stone-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-stone-500 text-[11px]">
            <span>© 2026 Slick • Skyline Premium Outfits. Powered by ChuruOne Smart Engine.</span>
            <span>All rights reserved. Designed with precision.</span>
          </div>
        </div>
      </footer>

      {/* ─── 8. PRODUCT QUICK VIEW MODAL ──────────────────────────── */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setSelectedProduct(null)} />
          
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white max-w-2xl w-full rounded-2xl shadow-2xl border border-stone-200 p-6 sm:p-8 overflow-hidden">
              
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute right-4 top-4 text-stone-400 hover:text-black p-1 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                
                {/* Product Image Preview */}
                <div className="bg-[#F6F6F6] rounded-xl p-6 flex items-center justify-center h-64">
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    className="max-h-full max-w-full object-contain drop-shadow-xl"
                  />
                </div>

                {/* Product Details & Selection */}
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-stone-400">
                      {selectedProduct.badge || 'Slick Exclusive'}
                    </span>
                    <h3 className="text-lg font-bold text-stone-950 mt-1">
                      {selectedProduct.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-base font-mono font-bold text-stone-950">
                        ₹ {selectedProduct.price}.00
                      </span>
                      {selectedProduct.originalPrice && selectedProduct.originalPrice > selectedProduct.price && (
                        <span className="text-xs font-mono text-stone-400 line-through">
                          ₹ {selectedProduct.originalPrice}.00
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-stone-600 leading-relaxed font-light">
                    {selectedProduct.description || 'Premium comfort engineering with architectural silhouette.'}
                  </p>

                  {/* Size Selector */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                      Select Size
                    </label>
                    <div className="flex items-center flex-wrap gap-2">
                      {(selectedProduct.availableSizes || ['UK 7', 'UK 8', 'UK 9', 'UK 10']).map((sz) => (
                        <button
                          key={sz}
                          onClick={() => setModalSize(sz)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                            (modalSize || selectedProduct.availableSizes?.[0]) === sz
                              ? 'bg-black text-white border-black shadow-xs'
                              : 'bg-stone-50 border-stone-200 text-stone-700 hover:border-black'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Add to Bag Button */}
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        addToCart(selectedProduct, modalSize);
                        setSelectedProduct(null);
                      }}
                      className="w-full bg-black hover:bg-stone-800 text-white py-3 rounded-xl text-xs uppercase tracking-widest font-semibold cursor-pointer shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Add to Bag</span>
                    </button>
                  </div>

                </div>

              </div>

            </div>
          </div>
        </div>
      )}

      {/* ─── 9. SHOPPING CART DRAWER ──────────────────────────────── */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setIsCartOpen(false)} />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
              
              {/* Drawer Header */}
              <div className="p-6 border-b border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-black" />
                  <h3 className="font-bold text-sm tracking-tight text-stone-950 uppercase">
                    Your Shopping Bag ({totalItemsCount})
                  </h3>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-1 text-stone-400 hover:text-black cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Free Delivery Bar */}
              <div className="bg-stone-50 px-6 py-3 border-b border-stone-100 text-xs">
                {amountNeededForFreeShip === 0 ? (
                  <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Unlocked Free Express Delivery in Churu!</span>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <span className="text-stone-600 block">
                      Add <strong className="text-black">₹{amountNeededForFreeShip}</strong> more for <strong>FREE Delivery</strong>
                    </span>
                    <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-black h-full transition-all duration-300"
                        style={{ width: `${freeShippingProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Cart Items List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cartItems.length === 0 ? (
                  <div className="text-center py-16 space-y-3">
                    <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto stroke-1" />
                    <p className="text-stone-600 text-xs">Your shopping bag is empty.</p>
                    <button
                      onClick={() => setIsCartOpen(false)}
                      className="bg-black text-white px-5 py-2 rounded-full text-xs font-semibold cursor-pointer"
                    >
                      Browse Slick Collection
                    </button>
                  </div>
                ) : (
                  cartItems.map((item) => (
                    <div
                      key={item.cartItemId}
                      className="flex items-center gap-4 bg-stone-50 rounded-xl p-3 border border-stone-100"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-contain rounded-lg bg-white p-1 shrink-0"
                      />

                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-semibold text-stone-900 truncate">
                          {item.name}
                        </h4>
                        <span className="text-[10px] text-stone-500 block">
                          Size: {item.size}
                        </span>
                        <span className="text-xs font-mono font-semibold text-stone-950 mt-1 block">
                          ₹ {item.price * item.quantity}.00
                        </span>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 bg-white rounded-lg border border-stone-200 px-2 py-1">
                        <button
                          onClick={() => updateCartQuantity(item.cartItemId, -1)}
                          className="text-stone-500 hover:text-black p-0.5 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(item.cartItemId, 1)}
                          className="text-stone-500 hover:text-black p-0.5 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeFromCart(item.cartItemId)}
                        className="text-stone-400 hover:text-red-500 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Cart Footer: Coupon & Checkout */}
              {cartItems.length > 0 && (
                <div className="p-6 border-t border-stone-100 bg-white space-y-4">
                  
                  {/* Coupon Code Input */}
                  <div className="space-y-1.5">
                    {appliedCoupon ? (
                      <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg text-xs text-emerald-800">
                        <div className="flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="font-semibold">{appliedCoupon.code}</span>
                          <span>(-₹{discountAmount})</span>
                        </div>
                        <button onClick={removeCoupon} className="text-stone-400 hover:text-stone-700 font-bold">
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponCodeInput}
                          onChange={(e) => setCouponCodeInput(e.target.value)}
                          placeholder="Promo code (e.g. NIGHT50)"
                          className="flex-1 border border-stone-200 rounded-lg px-3 py-2 text-xs uppercase outline-none focus:border-black"
                        />
                        <button
                          onClick={() => handleApplyCoupon()}
                          disabled={couponLoading}
                          className="bg-black text-white px-4 py-2 rounded-lg text-xs font-semibold uppercase cursor-pointer hover:bg-stone-800 disabled:opacity-50"
                        >
                          {couponLoading ? '...' : 'Apply'}
                        </button>
                      </div>
                    )}
                    {couponMessage.text && (
                      <span className={`text-[10px] block ${couponMessage.type === 'error' ? 'text-red-600' : 'text-emerald-700'}`}>
                        {couponMessage.text}
                      </span>
                    )}
                  </div>

                  {/* Price Calculations */}
                  <div className="space-y-1.5 text-xs text-stone-600">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-mono text-stone-900">₹ {cartSubtotal}.00</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-700 font-medium">
                        <span>Discount</span>
                        <span className="font-mono">- ₹ {discountAmount}.00</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Delivery Fee</span>
                      <span className="font-mono text-stone-900">
                        {deliveryFee === 0 ? <strong className="text-emerald-700">FREE</strong> : `₹ ${deliveryFee}.00`}
                      </span>
                    </div>
                    <div className="border-t border-stone-100 pt-2 flex justify-between text-sm font-bold text-stone-950">
                      <span>Total</span>
                      <span className="font-mono text-base">₹ {grandTotal}.00</span>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      setIsCheckoutOpen(true);
                    }}
                    className="w-full bg-black hover:bg-stone-800 text-white py-3.5 rounded-xl text-xs uppercase tracking-widest font-semibold cursor-pointer shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ─── 10. COMPREHENSIVE CHECKOUT MODAL (ADDRESS, GPS & PAYMENT) ─── */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setIsCheckoutOpen(false)} />

          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white max-w-xl w-full rounded-2xl shadow-2xl border border-stone-200 p-6 sm:p-8 space-y-6 my-8">
              
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="absolute right-4 top-4 text-stone-400 hover:text-black p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-widest text-stone-400">
                  SLICK • EXPRESS CHECKOUT SYSTEM
                </span>
                <h3 className="text-xl font-bold text-stone-950">
                  Delivery Details & Payment Method
                </h3>
              </div>

              {/* ChuruOne SSO Quick Sync Banner */}
              {currentUser ? (
                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center justify-between text-xs text-emerald-900">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold">{currentUser.name || 'Friend'}</span>
                      <span className="text-[10px] text-emerald-700 block font-mono">
                        Verified via ChuruOne SSO (+91 {currentUser.phone || checkoutPhone})
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigateToChuruOneAuth('login')}
                    className="text-[10px] text-emerald-800 hover:underline font-semibold cursor-pointer"
                  >
                    Switch User
                  </button>
                </div>
              ) : (
                <div className="bg-stone-50 border border-stone-200 p-3 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-stone-900 block">ChuruOne Unified Identity</span>
                    <span className="text-[10px] text-stone-500">Sign in to auto-fill your saved address and sync orders.</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => navigateToChuruOneAuth('login')}
                      className="border border-stone-300 text-stone-800 px-2.5 py-1 rounded-md text-[10px] font-semibold cursor-pointer hover:border-black"
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateToChuruOneAuth('signup')}
                      className="bg-black text-white px-2.5 py-1 rounded-md text-[10px] font-semibold cursor-pointer hover:bg-stone-800"
                    >
                      Sign Up
                    </button>
                  </div>
                </div>
              )}

              {/* Delivery vs Store Pickup Tabs */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-600 mb-1.5">
                  Fulfillment Mode *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDeliveryType('delivery')}
                    className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                      deliveryType === 'delivery'
                        ? 'border-black bg-black text-white shadow-sm'
                        : 'border-stone-200 text-stone-700 hover:border-stone-400 bg-stone-50'
                    }`}
                  >
                    <Truck className="w-4 h-4" />
                    <span>Home Delivery (Churu)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryType('pickup')}
                    className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                      deliveryType === 'pickup'
                        ? 'border-black bg-black text-white shadow-sm'
                        : 'border-stone-200 text-stone-700 hover:border-stone-400 bg-stone-50'
                    }`}
                  >
                    <Store className="w-4 h-4" />
                    <span>Store Pickup (Flagship)</span>
                  </button>
                </div>
              </div>

              {/* Checkout Form */}
              <form onSubmit={handlePlaceOrder} className="space-y-4">
                
                {/* Contact Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-stone-600 mb-1">
                      Recipient Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={checkoutName}
                      onChange={(e) => setCheckoutName(e.target.value)}
                      placeholder="e.g. Arjun Rathore"
                      className="w-full border border-stone-200 focus:border-black rounded-lg px-3 py-2 text-xs outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-stone-600 mb-1">
                      10-Digit Mobile Number *
                    </label>
                    <div className="flex items-center border border-stone-200 focus-within:border-black rounded-lg px-3 py-2">
                      <span className="text-xs text-stone-500 font-mono mr-2">+91</span>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        value={checkoutPhone}
                        onChange={(e) => setCheckoutPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="9829012345"
                        className="w-full bg-transparent text-xs outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Delivery Address Section (if Home Delivery) */}
                {deliveryType === 'delivery' ? (
                  <div className="space-y-3 bg-stone-50 p-4 rounded-xl border border-stone-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-black" />
                        <span>Delivery Address in Churu</span>
                      </span>

                      {/* GPS Live Location Trigger Button */}
                      <button
                        type="button"
                        onClick={handleDetectGps}
                        disabled={isCapturingGps}
                        className="bg-white border border-stone-300 hover:border-black text-black px-3 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 transition-all"
                      >
                        <Crosshair className={`w-3.5 h-3.5 text-emerald-600 ${isCapturingGps ? 'animate-spin' : ''}`} />
                        <span>{isCapturingGps ? 'Detecting GPS...' : 'Detect GPS Location'}</span>
                      </button>
                    </div>

                    {/* GPS Status / Error Message */}
                    {orderLiveGps && (
                      <div className="bg-emerald-100/70 border border-emerald-300 text-emerald-900 px-3 py-1.5 rounded-lg text-[10px] flex items-center gap-2 font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span>
                          Live GPS Verified: {orderLiveGps.lat.toFixed(4)}°N, {orderLiveGps.lng.toFixed(4)}°E (Accuracy ~{Math.round(orderLiveGps.accuracy || 10)}m)
                        </span>
                      </div>
                    )}
                    {gpsError && (
                      <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-lg text-[10px] flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{gpsError}</span>
                      </div>
                    )}

                    {/* Popular Churu Landmarks Quick Chips */}
                    <div>
                      <span className="block text-[10px] font-semibold text-stone-500 mb-1">
                        Select Nearest Landmark in Churu:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {CHURU_POPULAR_LANDMARKS.map((lm) => (
                          <button
                            key={lm}
                            type="button"
                            onClick={() => handleSelectLandmarkChip(lm)}
                            className={`text-[10px] px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                              selectedLandmarkChip === lm
                                ? 'bg-black text-white font-bold'
                                : 'bg-white border border-stone-200 text-stone-700 hover:border-black'
                            }`}
                          >
                            {lm}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Detailed Street & Landmark Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-stone-600 mb-1">
                          House / Flat / Shop No.
                        </label>
                        <input
                          type="text"
                          value={houseNo}
                          onChange={(e) => setHouseNo(e.target.value)}
                          placeholder="e.g. House No. 42, 2nd Floor"
                          className="w-full bg-white border border-stone-200 focus:border-black rounded-lg px-3 py-2 text-xs outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-stone-600 mb-1">
                          Street / Colony / Ward *
                        </label>
                        <input
                          type="text"
                          required
                          value={streetArea}
                          onChange={(e) => setStreetArea(e.target.value)}
                          placeholder="e.g. Station Road, Ward No. 12"
                          className="w-full bg-white border border-stone-200 focus:border-black rounded-lg px-3 py-2 text-xs outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-stone-600 mb-1">
                          City
                        </label>
                        <input
                          type="text"
                          readOnly
                          value="Churu, Rajasthan"
                          className="w-full bg-stone-100 border border-stone-200 rounded-lg px-3 py-2 text-xs outline-none text-stone-600 font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-stone-600 mb-1">
                          Pincode
                        </label>
                        <input
                          type="text"
                          value={pincode}
                          onChange={(e) => setPincode(e.target.value)}
                          className="w-full bg-white border border-stone-200 focus:border-black rounded-lg px-3 py-2 text-xs outline-none font-mono"
                        />
                      </div>
                    </div>

                  </div>
                ) : (
                  /* Store Pickup Info Box */
                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-xs text-emerald-950 space-y-1">
                    <div className="flex items-center gap-2 font-bold">
                      <Store className="w-4 h-4 text-emerald-700" />
                      <span>Skyline Flagship Boutique Pickup</span>
                    </div>
                    <p className="text-[11px] text-emerald-800 leading-relaxed">
                      Subhash Chowk, Station Road, Churu, Rajasthan – 331001.<br />
                      Timings: Daily 10:30 AM – 10:00 PM. Package will be ready in 30 minutes!
                    </p>
                  </div>
                )}

                {/* Delivery Notes */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-600 mb-1">
                    Wardrobe / Delivery Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={checkoutNotes}
                    onChange={(e) => setCheckoutNotes(e.target.value)}
                    placeholder="e.g. Gift box packaging, deliver after 5 PM"
                    className="w-full border border-stone-200 focus:border-black rounded-lg px-3 py-2 text-xs outline-none"
                  />
                </div>

                {/* ─── REAL PAYMENT SYSTEM SELECTION (COD vs UPI) ──── */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-600 mb-1.5">
                    Select Payment Method *
                  </label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    
                    {/* Method 1: Cash on Delivery */}
                    <div
                      onClick={() => setPaymentMethod('cod')}
                      className={`border rounded-xl p-3.5 cursor-pointer transition-all flex items-start gap-3 ${
                        paymentMethod === 'cod'
                          ? 'border-black bg-stone-50 ring-1 ring-black shadow-xs'
                          : 'border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-stone-900 text-white flex items-center justify-center shrink-0 mt-0.5">
                        <Banknote className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-stone-950 block">
                          Cash on Delivery (COD)
                        </span>
                        <span className="text-[10px] text-stone-500 block leading-tight">
                          Pay cash or scan QR upon delivery. Generates 4-digit Delivery OTP.
                        </span>
                      </div>
                    </div>

                    {/* Method 2: Instant UPI & SmartPay (Our Unified System) */}
                    <div
                      onClick={() => setPaymentMethod('upi')}
                      className={`border rounded-xl p-3.5 cursor-pointer transition-all flex items-start gap-3 ${
                        paymentMethod === 'upi'
                          ? 'border-black bg-stone-50 ring-1 ring-black shadow-xs'
                          : 'border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                        <QrCode className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-stone-950 block">
                            Instant UPI & SmartPay
                          </span>
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 rounded">
                            FAST
                          </span>
                        </div>
                        <span className="text-[10px] text-stone-500 block leading-tight">
                          GPay, PhonePe, Paytm, QR scan & Cashfree PG with auto-verify.
                        </span>
                      </div>
                    </div>

                  </div>
                </div>

                {/* UPI Live Details Notice */}
                {paymentMethod === 'upi' && (
                  <div className="bg-emerald-50/80 border border-emerald-200 p-3 rounded-xl text-xs text-emerald-950 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Unified ChuruOne Payment Gateway</span>
                      </span>
                      <span className="font-mono text-[10px] text-emerald-800 font-semibold">
                        ID: skylineoutfits@upi
                      </span>
                    </div>
                    <p className="text-[10px] text-emerald-800">
                      Order place hote hi dynamic QR Code aur GPay/PhonePe intent pop-up open hoga. Payment hone par live status auto-verify ho jayega.
                    </p>
                  </div>
                )}

                {/* Price Breakdown & Submit Button */}
                <div className="border-t border-stone-200 pt-4 space-y-3">
                  <div className="space-y-1 text-xs text-stone-600">
                    <div className="flex justify-between">
                      <span>Items Subtotal</span>
                      <span className="font-mono text-stone-900">₹ {cartSubtotal}.00</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-700 font-medium">
                        <span>Coupon Discount</span>
                        <span className="font-mono">- ₹ {discountAmount}.00</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Delivery Mode</span>
                      <span>
                        {deliveryType === 'pickup' ? (
                          <strong className="text-emerald-700">STORE PICKUP (₹0)</strong>
                        ) : deliveryFee === 0 ? (
                          <strong className="text-emerald-700">FREE HOME DISPATCH</strong>
                        ) : (
                          <span className="font-mono text-stone-900">₹ {deliveryFee}.00</span>
                        )}
                      </span>
                    </div>
                    <div className="border-t border-stone-100 pt-2 flex justify-between items-center text-sm font-bold text-stone-950">
                      <span>Grand Total</span>
                      <span className="text-lg font-mono">₹ {grandTotal}.00</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={orderSubmitting}
                    className="w-full bg-black hover:bg-stone-800 text-white py-3.5 rounded-xl text-xs uppercase tracking-widest font-semibold cursor-pointer shadow-lg active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <span>
                      {orderSubmitting 
                        ? 'Recording Order...' 
                        : paymentMethod === 'upi' 
                          ? `Pay ₹${grandTotal}.00 with Instant UPI / SmartPay` 
                          : `Confirm Order with Cash on Delivery (₹${grandTotal})`}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </form>

            </div>
          </div>
        </div>
      )}

      {/* ─── 11. CONFIRMED ORDER RECEIPT MODAL ────────────────────── */}
      {confirmedOrder && !isUpiModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setConfirmedOrder(null)} />

          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white max-w-md w-full rounded-2xl shadow-2xl border border-stone-200 p-8 text-center space-y-5">
              
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">
                  SLICK • WARDROBE DISPATCH READY
                </span>
                <h3 className="text-2xl font-black text-stone-950">
                  Order Successfully Placed!
                </h3>
                <p className="text-xs text-stone-500">
                  Thank you, {confirmedOrder.customer?.name || checkoutName}! Your order has been recorded in the Skyline smart backend.
                </p>
              </div>

              {/* Order Receipt Details */}
              <div className="bg-stone-50 rounded-xl p-4 text-xs text-stone-700 space-y-2 text-left font-mono border border-stone-200">
                <div className="flex justify-between">
                  <span className="text-stone-500">Order ID:</span>
                  <span className="font-bold text-black">{confirmedOrder.orderNumber || confirmedOrder.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Payment Status:</span>
                  <span className={`font-bold uppercase ${confirmedOrder.paymentStatus === 'paid' ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {confirmedOrder.paymentStatus === 'paid' ? 'Verified Paid ✓' : 'Pay on Delivery (COD)'}
                  </span>
                </div>
                {confirmedOrder.deliveryOtp && (
                  <div className="flex justify-between bg-amber-100/70 p-2 rounded-lg text-amber-950 font-bold border border-amber-300">
                    <span>Delivery Verification OTP:</span>
                    <span className="text-sm tracking-widest">{confirmedOrder.deliveryOtp}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-stone-500">Grand Total:</span>
                  <span className="font-bold text-black text-sm">₹ {confirmedOrder.total || grandTotal}.00</span>
                </div>
                <div className="border-t border-stone-200 pt-2 text-[11px] text-stone-600">
                  <span className="block text-stone-400 uppercase text-[9px]">Destination:</span>
                  <span className="block truncate">{confirmedOrder.address || fullDeliveryAddress}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <a
                  href={`https://wa.me/917023963189?text=Hello%20Skyline,%20I%20just%20placed%20order%20${confirmedOrder.orderNumber || confirmedOrder.id}%20for%20Rs%20${confirmedOrder.total || grandTotal}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl text-xs font-semibold uppercase tracking-wider block no-underline shadow-md"
                >
                  Confirm on WhatsApp Concierge
                </a>
                <button
                  onClick={() => setConfirmedOrder(null)}
                  className="w-full border border-stone-200 text-stone-800 hover:bg-stone-100 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Continue Shopping
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ─── 12. REAL UPI PAYMENT MODAL (UNIFIED ENGINE) ──────────── */}
      <UpiPaymentModal
        isOpen={isUpiModalOpen}
        onClose={() => setIsUpiModalOpen(false)}
        orderData={pendingPaymentData}
        paymentData={pendingPaymentData}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* ─── 13. CHURUONE SSO ACCOUNT MODAL ───────────────────────── */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setIsAccountModalOpen(false)} />

          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white max-w-sm w-full rounded-2xl shadow-2xl border border-stone-200 p-6 sm:p-8 space-y-6">
              
              <button
                onClick={() => setIsAccountModalOpen(false)}
                className="absolute right-4 top-4 text-stone-400 hover:text-black p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-widest text-stone-400">
                  CHURUONE UNIFIED SSO
                </span>
                <h3 className="text-xl font-bold text-stone-950">
                  {currentUser ? 'Your Verified Profile' : 'ChuruOne Account'}
                </h3>
              </div>

              {currentUser ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 bg-stone-50 rounded-xl p-3 border border-stone-100">
                    <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center text-sm font-bold shrink-0">
                      {(currentUser.name || 'U')[0]}
                    </div>
                    <div className="overflow-hidden">
                      <span className="font-bold text-stone-950 text-xs block truncate">
                        {currentUser.name || 'Friend'}
                      </span>
                      <span className="text-[11px] text-stone-500 block font-mono">
                        {currentUser.phone ? `+91 ${currentUser.phone}` : 'No phone linked'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Synchronized with ChuruOne Central SSO</span>
                  </div>

                  <div className="space-y-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAccountModalOpen(false);
                        navigateToChuruOneAuth('login');
                      }}
                      className="w-full bg-black hover:bg-stone-800 text-white py-2.5 rounded-xl text-xs uppercase tracking-wider font-semibold cursor-pointer"
                    >
                      Switch Account via ChuruOne
                    </button>

                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full border border-stone-300 text-stone-700 hover:bg-stone-100 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-center">
                  <p className="text-xs text-stone-600 leading-relaxed font-light">
                    You are not currently signed in. Create a new account or sign in using ChuruOne single sign-on to access saved addresses and synchronized orders.
                  </p>
                  <div className="space-y-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAccountModalOpen(false);
                        navigateToChuruOneAuth('signup');
                      }}
                      className="w-full bg-black hover:bg-stone-800 text-white py-3 rounded-xl text-xs uppercase tracking-widest font-semibold cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Create Account (Sign Up)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAccountModalOpen(false);
                        navigateToChuruOneAuth('login');
                      }}
                      className="w-full border border-stone-300 hover:border-black text-stone-800 py-2.5 rounded-xl text-xs uppercase tracking-widest font-semibold cursor-pointer"
                    >
                      Sign In to Existing Account
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ─── 14. ORDER TRACKER MODAL ──────────────────────────────── */}
      {isTrackerOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setIsTrackerOpen(false)} />

          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white max-w-lg w-full rounded-2xl shadow-2xl border border-stone-200 p-6 sm:p-8 space-y-6">
              
              <button
                onClick={() => setIsTrackerOpen(false)}
                className="absolute right-4 top-4 text-stone-400 hover:text-black p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-widest text-stone-400">
                  SLICK • REAL-TIME DISPATCH
                </span>
                <h3 className="text-xl font-bold text-stone-950">
                  Track Your Orders
                </h3>
              </div>

              <form onSubmit={handleTrackOrders} className="flex gap-2">
                <input
                  type="tel"
                  maxLength={10}
                  value={trackPhoneInput}
                  onChange={(e) => setTrackPhoneInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 10-digit mobile number"
                  className="flex-1 border border-stone-200 focus:border-black rounded-xl px-3 py-2 text-xs outline-none font-mono"
                  required
                />
                <button
                  type="submit"
                  disabled={trackingLoading}
                  className="bg-black hover:bg-stone-800 text-white px-5 py-2 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  {trackingLoading ? 'Searching...' : 'Track'}
                </button>
              </form>

              {trackedOrders.length > 0 && (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {trackedOrders.map((ord) => (
                    <div key={ord.id} className="bg-stone-50 rounded-xl p-3 border border-stone-100 text-xs space-y-1">
                      <div className="flex justify-between font-bold text-stone-900">
                        <span>Order #{ord.orderNumber || ord.id}</span>
                        <span className="uppercase text-amber-600">{ord.status || 'Confirmed'}</span>
                      </div>
                      <div className="flex justify-between text-stone-500 font-mono text-[11px]">
                        <span>Total: ₹ {ord.total}.00</span>
                        <span>{ord.createdAt ? new Date(ord.createdAt).toLocaleDateString() : 'Recent'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
