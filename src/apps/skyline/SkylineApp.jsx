import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  AlertCircle,
  Zap,
  SlidersHorizontal,
  Layers,
  Copy,
  Gift,
  Package,
  Compass,
  Instagram,
  MessageCircle
} from 'lucide-react';
import { 
  getSkylineData, 
  validateCouponCode, 
  placeSkylineOrder,
  initiateSkylineUpiPayment,
  updateSkylineOrderStatus,
  submitProductReview,
  connectSkylineWebSocket
} from './skylineApiClient';
import { 
  getChuruOneSession, 
  setChuruOneSession, 
  clearChuruOneSession, 
  sanitizeChuruOneUser, 
  subscribeToChuruOneAuth 
} from '../../utils/ssoHelper';
import UpiPaymentModal from '../../components/UpiPaymentModal';
import BottomNavBar from '../../components/BottomNavBar';
import { PHONEPE_REVIEW_MODE } from '../../config/siteMode';

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

export const PHONEPE_THREE_PRODUCTS = [
  {
    id: "sky-item-02",
    name: "Striped Riviera Mandarin Linen Shirt",
    category: "shirts",
    subCategory: "linen-shirts",
    price: 1849,
    originalPrice: 2999,
    prepTime: "Same Day Dispatch",
    isVeg: true,
    badge: "NEW ARRIVAL",
    description: "Band-collar shirt featuring subtle vertical chalk stripes. Breathable open-weave construction designed to keep you cool under the desert sun.",
    fabric: "85% Belgian Linen, 15% Mulberry Silk",
    fit: "Classic Clean Cut",
    image: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=800&q=80",
    secondaryImage: "https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=800&q=80",
    availableSizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Chalk Riviera Stripe", hex: "#EAE7DC" },
      { name: "Indigo Stripe", hex: "#2E4057" }
    ],
    rating: 4.9,
    reviews: 62,
    available: true
  },
  {
    id: "sky-item-01",
    name: "Normandy Flax Camp-Collar Linen Shirt",
    category: "shirts",
    subCategory: "linen-shirts",
    price: 1699,
    originalPrice: 2799,
    prepTime: "Same Day Dispatch",
    isVeg: true,
    badge: "BESTSELLER",
    description: "Woven from 100% Normandy long-staple flax linen. Enzyme garment-washed for a naturally breathable, relaxed drape with real mother-of-pearl buttons.",
    fabric: "100% French Normandy Flax Linen (180 GSM)",
    fit: "Tailored Relaxed Resort Fit",
    image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80",
    secondaryImage: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80",
    availableSizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Ecru Sand", hex: "#E8E2D5" },
      { name: "Sage Green", hex: "#768271" },
      { name: "Obsidian Black", hex: "#1C1C1E" }
    ],
    rating: 4.9,
    reviews: 84,
    available: true
  },
  {
    id: "sky-shirt-07",
    name: "Luxury Matte Black Tailored Casual Shirt",
    category: "shirts",
    subCategory: "casual-shirts",
    price: 1799,
    originalPrice: 2999,
    prepTime: "Same Day Dispatch",
    badge: "NIGHT EDIT",
    description: "Deep pigment jet black poplin cotton with modern spread collar, streamlined French placket, dinner & evening occasion ready.",
    fabric: "100% Mercerized Combed Cotton Poplin",
    fit: "Tailored Slim Fit",
    image: "https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=800&q=80",
    availableSizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Jet Pitch Black", hex: "#0D0D0D" }
    ],
    rating: 4.9,
    reviews: 73,
    available: true
  }
];

function sanitizeClothesOnly(items) {
  if (PHONEPE_REVIEW_MODE) {
    const targetKeys = [
      'striped riviera mandarin linen shirt',
      'normandy flax camp-collar linen shirt',
      'luxury matte black tailored casual shirt'
    ];
    if (Array.isArray(items) && items.length > 0) {
      const matched = items.filter(it => 
        it && it.name && targetKeys.some(k => it.name.toLowerCase().trim() === k || it.name.toLowerCase().includes(k))
      );
      if (matched.length >= 2) return matched;
    }
    return PHONEPE_THREE_PRODUCTS;
  }

  if (!Array.isArray(items)) return [];
  return items.filter(it => 
    it &&
    it.category !== 'footwear' &&
    it.subCategory !== 'sneakers' &&
    !String(it.id || '').toLowerCase().startsWith('slick-shoe') &&
    !/shoe|sneaker|footwear/i.test(it.name || '')
  );
}

export default function SkylineApp() {
  // ─── STATE MANAGEMENT ──────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [storeData, setStoreData] = useState(null);
  const [heroBanner, setHeroBanner] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [heroActiveAngle, setHeroActiveAngle] = useState('primary'); // 'primary' | 'secondary'
  const [copiedCouponCode, setCopiedCouponCode] = useState('');
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
  const [modalColor, setModalColor] = useState('');
  const [modalActiveImage, setModalActiveImage] = useState('');

  const openProductModal = (product) => {
    if (!product) return;
    setSelectedProduct(product);
    setModalSize(product.availableSizes?.[0] || product.sizes?.[0] || 'M');
    const defaultColor = product.colors?.[0];
    setModalColor(typeof defaultColor === 'object' ? defaultColor.name : (defaultColor || 'Classic'));
    setModalActiveImage(product.image || '');
  };

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
  const [pendingOrder, setPendingOrder] = useState(null);

  // Real UPI & SmartPay Modal State
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);
  const [pendingPaymentData, setPendingPaymentData] = useState(null);

  // Order Tracker State
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [trackPhoneInput, setTrackPhoneInput] = useState('');
  const [trackedOrders, setTrackedOrders] = useState([]);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [recentOrder, setRecentOrder] = useState(() => {
    try {
      const saved = localStorage.getItem('skyline_recent_order');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Write Review Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [newReviewName, setNewReviewName] = useState('');
  const [newReviewSubmitting, setNewReviewSubmitting] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // ─── INITIAL DATA LOAD & CHURUONE SSO SYNC ────────────────────
  useEffect(() => {
    document.title = "Skyline Premium • Luxury Menswear & Outfits | Churu";

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
        showToast(`ChuruOne SSO Verified: Welcome, ${parsed.name || 'Friend'}!`);

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
        const u = e.data.user ? sanitizeChuruOneUser(e.data.user) : null;
        if (u) {
          setCurrentUser(u);
          setChuruOneSession(u, e.data.token || '');
          if (u.name) setCheckoutName(u.name);
          if (u.phone || u.phoneNumber) {
            setCheckoutPhone(String(u.phone || u.phoneNumber).replace(/\D/g, '').slice(-10));
          }
          if (u.address) setStreetArea(u.address);
          showToast(`Verified by ChuruOne: ${u.name || 'Friend'}`);
        }
      }
    };
    window.addEventListener('message', handleSsoMessage);

    // 3. Cross-app reactive Single Sign-On listener: "Aik ID me login mtlb sab website me login"
    const unsubscribeSso = subscribeToChuruOneAuth((user) => {
      if (user) {
        const sUser = sanitizeChuruOneUser(user);
        setCurrentUser(sUser);
        if (sUser.name) setCheckoutName(sUser.name);
        if (sUser.phone || sUser.phoneNumber) {
          setCheckoutPhone(String(sUser.phone || sUser.phoneNumber).replace(/\D/g, '').slice(-10));
        }
        if (sUser.address) setStreetArea(sUser.address);
      } else {
        setCurrentUser(null);
      }
    });

    // 4. Fetch live catalog data from Smart Backend
    loadStoreData();

    // 5. Connect real-time WebSocket for instant live sync when Dukandar updates
    const unsubWs = connectSkylineWebSocket((action, payload) => {
      console.log('[Skyline Realtime Event]', action, payload);
      if (action === 'MENU_UPDATED') {
        if (payload?.menu && Array.isArray(payload.menu)) {
          setMenuItems(sanitizeClothesOnly(payload.menu));
        } else if (Array.isArray(payload)) {
          setMenuItems(sanitizeClothesOnly(payload));
        } else {
          loadStoreData();
        }
      } else if (action === 'STORE_INFO_UPDATED') {
        if (payload) {
          setStoreData(prev => ({ ...prev, storeInfo: payload }));
        } else {
          loadStoreData();
        }
      } else if (action === 'DEALS_UPDATED') {
        if (payload) {
          setStoreData(prev => ({ ...prev, deals: payload }));
        } else {
          loadStoreData();
        }
      } else if (action === 'HERO_UPDATED' || action === 'UPDATE_HERO_BANNER') {
        const heroData = payload?.heroBanner || payload;
        if (heroData) {
          setHeroBanner(prev => ({ ...(prev || {}), ...heroData }));
        } else {
          loadStoreData();
        }
      } else if (action === 'ORDER_UPDATED' || action === 'ORDER_STATUS_CHANGED') {
        const orderId = payload?.id || payload?.orderId;
        const status = payload?.status;
        if (orderId && status) {
          setConfirmedOrder(prev => prev && prev.id === orderId ? { ...prev, status } : prev);
        }
      }
    });

    return () => {
      window.removeEventListener('message', handleSsoMessage);
      unsubscribeSso();
      if (typeof unsubWs === 'function') unsubWs();
    };
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
        if (data.heroBanner) setHeroBanner(data.heroBanner);
        setMenuItems(sanitizeClothesOnly(data.menu || []));
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
      showToast(exists ? 'Removed from wishlist' : 'Saved to wishlist');
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
  const cartTotal = grandTotal;
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
        showToast('Live GPS Location captured successfully!');
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
    if (!product) return;
    const size = selectedSize || 
      (Array.isArray(product.availableSizes) && product.availableSizes[0]) || 
      (Array.isArray(product.sizes) && product.sizes[0]) || 
      'M';
    const color = selectedColor || 
      (Array.isArray(product.colors) ? (typeof product.colors[0] === 'string' ? product.colors[0] : product.colors[0]?.name) : null) || 
      'Classic';
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
        name: product.name || 'Skyline Outfits',
        price: Number(product.price) || 0,
        originalPrice: Number(product.originalPrice) || Number(product.price) || 0,
        image: product.image || (Array.isArray(product.images) && product.images[0]) || '',
        size,
        color,
        quantity: 1
      }];
    });

    showToast(`Added to Bag: ${product.name || 'Item'}`);
    // Cart is not auto-opened on add so user can continue shopping smoothly
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

  const clearCartCompletely = () => {
    setCartItems([]);
    setAppliedCoupon(null);
    try {
      localStorage.setItem('slick_cart', '[]');
      localStorage.removeItem('skyline_cart');
    } catch (e) {
      console.warn('Cart clear error:', e);
    }
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
  const isUserPhoneVerified = Boolean(
    currentUser &&
    currentUser.isPhoneAuth === true &&
    String(currentUser.phone || currentUser.phoneNumber || '').replace(/\D/g, '').slice(-10).length === 10
  );

  const navigateToChuruOneAuth = (mode = 'login') => {
    try {
      const currentUrl = window.location.pathname + window.location.search;
      const returnUrl = encodeURIComponent(currentUrl || '/skyline');
      window.location.href = `/auth?storeId=skyline&mode=${mode}&returnUrl=${returnUrl}&requirePhoneOtp=true`;
    } catch (e) {
      window.location.href = `/auth?storeId=skyline&mode=${mode}&requirePhoneOtp=true`;
    }
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    clearChuruOneSession();
    setIsAccountModalOpen(false);
    showToast('Signed out from ChuruOne session');
  };

  // ─── CHECKOUT & ORDER SUBMISSION ──────────────────────────────
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!currentUser || !isUserPhoneVerified) {
      showToast('Skyline orders ke liye verified mobile number anivarya hai');
      setIsCheckoutOpen(false);
      navigateToChuruOneAuth('login');
      return;
    }
    if (!checkoutName.trim()) {
      showToast('Please enter your full name');
      return;
    }
    const cleanPhone = String(currentUser.phone || checkoutPhone).replace(/\D/g, '').slice(-10);
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
        source: 'slick_web',
        customerToken: currentUser?.token || localStorage.getItem('auth_token') || '',
        authToken: currentUser?.token || localStorage.getItem('auth_token') || '',
        phoneVerified: Boolean(currentUser?.phoneVerified || cleanPhone.length === 10),
        userEmail: currentUser?.email || '',
        authProvider: currentUser?.authProvider || 'churuone',
        authenticated: true
      };

      const res = await placeSkylineOrder(orderPayload);
      if (res && (res.success || res.order)) {
        const created = res.order || res;
        
        if (paymentMethod === 'cod') {
          setConfirmedOrder(created);
          const recentData = {
            id: created.id,
            orderNumber: created.orderNumber,
            total: created.total || grandTotal,
            status: created.status || 'confirmed',
            paymentStatus: 'pending',
            phone: cleanPhone,
            items: cartItems,
            deliveryOtp: created.deliveryOtp || generatedDeliveryOtp,
            address: fullDeliveryAddress,
            createdAt: new Date().toISOString()
          };
          setRecentOrder(recentData);
          try { localStorage.setItem('skyline_recent_order', JSON.stringify(recentData)); } catch (e) {}
          clearCartCompletely();
          setIsCheckoutOpen(false);
          setIsCartOpen(false);
          showToast('Order Placed Successfully via Cash on Delivery!');
        } else {
          // Instant UPI & SmartPay using our Unified UpiPaymentModal Engine
          const upiPayload = {
            orderId: created.orderNumber || created.id,
            id: created.id,
            storeId: 'skyline',
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
          setPendingOrder(created); // DO NOT set confirmedOrder yet! Wait for verified payment
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
    const orderToConfirm = pendingOrder || confirmedOrder;
    try {
      if (orderToConfirm?.id) {
        await updateSkylineOrderStatus(orderToConfirm.id, 'confirmed', 'paid');
      }
    } catch (e) {
      console.warn('Order status update error:', e);
    }
    const updatedOrder = {
      ...(orderToConfirm || {}),
      paymentStatus: 'paid',
      status: 'confirmed'
    };
    setConfirmedOrder(updatedOrder);
    const recentData = {
      id: updatedOrder.id,
      orderNumber: updatedOrder.orderNumber,
      total: updatedOrder.total || grandTotal,
      status: 'confirmed',
      paymentStatus: 'paid',
      phone: String(updatedOrder.customer?.phone || currentUser?.phone || checkoutPhone).replace(/\D/g, '').slice(-10),
      items: updatedOrder.items || cartItems,
      deliveryOtp: updatedOrder.deliveryOtp,
      address: updatedOrder.address || fullDeliveryAddress,
      createdAt: new Date().toISOString()
    };
    setRecentOrder(recentData);
    try { localStorage.setItem('skyline_recent_order', JSON.stringify(recentData)); } catch (e) {}
    setPendingOrder(null);
    clearCartCompletely();
    setIsUpiModalOpen(false);
    setIsCheckoutOpen(false);
    setIsCartOpen(false);
    showToast('Payment Verified! Wardrobe Order Confirmed.');
  };

  // ─── ORDER TRACKER ────────────────────────────────────────────
  const openDirectOrderTracker = async (specificOrder = null) => {
    setIsTrackerOpen(true);
    const targetPhone = specificOrder?.phone || currentUser?.phone || recentOrder?.phone || trackPhoneInput;
    if (targetPhone) {
      const cleanPhone = String(targetPhone).replace(/\D/g, '').slice(-10);
      if (cleanPhone.length === 10) {
        setTrackPhoneInput(cleanPhone);
        setTrackingLoading(true);
        try {
          const data = await getSkylineData();
          const allOrders = data.orders || [];
          const matches = allOrders.filter(o => {
            const ph = String(o.customer?.phone || '').replace(/\D/g, '');
            const matchById = specificOrder && (String(o.id) === String(specificOrder.id) || (o.orderNumber && String(o.orderNumber) === String(specificOrder.orderNumber)));
            return ph.endsWith(cleanPhone) || matchById;
          });
          if (matches.length > 0) {
            setTrackedOrders(matches);
          } else if (specificOrder) {
            setTrackedOrders([specificOrder]);
          } else {
            setTrackedOrders([]);
            showToast('No active orders found for this account');
          }
        } catch (err) {
          if (specificOrder) setTrackedOrders([specificOrder]);
        } finally {
          setTrackingLoading(false);
        }
        return;
      }
    }
    if (specificOrder) {
      setTrackedOrders([specificOrder]);
    }
  };

  const handleTrackOrders = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
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

  // Auto-fetch orders when tracker modal opens if phone or recent order is known
  useEffect(() => {
    if (isTrackerOpen && trackedOrders.length === 0) {
      const ph = currentUser?.phone || recentOrder?.phone;
      if (ph) {
        openDirectOrderTracker(recentOrder);
      }
    }
  }, [isTrackerOpen, currentUser?.phone, recentOrder]);

  // ─── HERO & TRENDING ITEMS (CLOTHES ONLY) ──────────────────────
  const heroProduct = useMemo(() => {
    const clothes = sanitizeClothesOnly(menuItems);
    if (heroBanner?.featuredItemId) {
      const found = clothes.find(item => item.id === heroBanner.featuredItemId);
      if (found) return found;
    }
    return clothes.find(item => item.id === 'sky-item-01') || clothes[0] || {
      id: 'sky-item-01',
      name: 'Normandy Flax Camp-Collar Linen Shirt',
      category: 'shirts',
      price: 1699,
      originalPrice: 2799,
      image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80',
      badge: 'HERO EDIT',
      description: 'Woven from 100% Normandy long-staple flax linen. Naturally breathable, relaxed drape with mother-of-pearl buttons.'
    };
  }, [menuItems, heroBanner]);

  const trendingProducts = useMemo(() => {
    const clothes = sanitizeClothesOnly(menuItems);
    if (Array.isArray(heroBanner?.trendingItemIds) && heroBanner.trendingItemIds.length > 0) {
      const selected = clothes.filter(item => heroBanner.trendingItemIds.includes(item.id));
      if (selected.length > 0) return selected;
    }
    const candidates = clothes.filter(item => 
      item.isTrending === true ||
      item.badge === 'BESTSELLER' || 
      item.badge === 'SIGNATURE PIECE' || 
      item.badge === 'NEW ARRIVAL' ||
      item.id === 'sky-item-01' ||
      item.id === 'sky-item-03' ||
      item.id === 'sky-jean-01'
    );
    if (candidates.length >= 3) return candidates.slice(0, 4);
    return clothes.slice(0, 4);
  }, [menuItems, heroBanner]);

  // Dynamic Chalne Wali Patti (Running Marquee Ribbon)
  const marqueeItems = useMemo(() => {
    const raw = heroBanner?.marqueeText || storeData?.storeInfo?.marqueeText;
    if (raw && typeof raw === 'string' && raw.trim()) {
      const cleaned = raw.replace(/[✦⚡♥✓📍🔥🎉✨]/g, '').trim();
      const parts = cleaned.split(/[•|,\n]/).map(p => p.trim()).filter(Boolean);
      if (parts.length > 0) return parts;
    }
    return [
      'SKYLINE BESPOKE',
      '100% ITALIAN LINEN',
      PHONEPE_REVIEW_MODE ? 'TAILORED CASUAL SHIRTS' : 'RAW SELVEDGE DENIM',
      'BESPOKE HANDCRAFTED TAILORING',
      'CHURU SAME-DAY EXPRESS',
      'ARCHITECTURAL SILHOUETTES',
      'GENUINE MOTHER-OF-PEARL BUTTONS'
    ];
  }, [heroBanner, storeData?.storeInfo]);

  // Wardrobe Combos & Coordinated Sets (from Menu catalog)
  const wardrobeCombos = useMemo(() => {
    const all = menuItems || [];
    return all.filter(item => 
      item && (
        item.isCombo === true ||
        item.categoryId === 'cat_combo' ||
        item.category === 'combos' ||
        item.category === 'combo' ||
        (item.category && item.category.toLowerCase().includes('combo'))
      )
    );
  }, [menuItems]);

  // Active Promo Deals & Coupons (from Deals catalog)
  const activeDeals = useMemo(() => {
    return (storeData?.deals || []).filter(d => d && d.isActive !== false && d.active !== false);
  }, [storeData?.deals]);

  // ─── SUBMIT LIVE CUSTOMER REVIEW ─────────────────────────────
  const handleReviewSubmit = async (e) => {
    e?.preventDefault();
    const finalName = (newReviewName || currentUser?.name || '').trim();
    if (!finalName) {
      showToast('Please enter your name');
      return;
    }
    if (!newReviewComment.trim()) {
      showToast('Please write your review/experience');
      return;
    }
    setNewReviewSubmitting(true);
    try {
      const reviewPayload = {
        name: finalName,
        phone: currentUser?.phone || checkoutPhone || '',
        rating: newReviewRating,
        comment: newReviewComment.trim(),
        dish: 'Skyline Clothing Collection',
        type: 'store'
      };
      const res = await submitProductReview(reviewPayload);
      if (res && res.success) {
        showToast('Review submitted successfully! Dhanyawad.');
        setShowReviewModal(false);
        setNewReviewComment('');
        if (res.review) {
          setStoreData(prev => ({
            ...prev,
            reviews: [res.review, ...(prev?.reviews || [])]
          }));
        }
      } else {
        showToast('Review submission failed');
      }
    } catch (err) {
      console.error('Review submit error:', err);
      showToast('Review submit error: ' + (err.message || 'Network error'));
    } finally {
      setNewReviewSubmitting(false);
    }
  };

  // ─── ALL PRODUCTS (CLOTHES ONLY — UNIFIED CATALOG WITH CATEGORY FILTER) ──
  const allClothingProducts = useMemo(() => {
    let list = sanitizeClothesOnly(menuItems);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(item => 
        (item.name && item.name.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q)) ||
        (item.fabric && item.fabric.toLowerCase().includes(q))
      );
    }

    return list;
  }, [menuItems, searchQuery]);

  const availableCategories = useMemo(() => {
    const clothes = sanitizeClothesOnly(menuItems);
    const catMap = { all: clothes.length };
    clothes.forEach(item => {
      const cat = item.category || 'other';
      catMap[cat] = (catMap[cat] || 0) + 1;
    });

    const categoryLabels = {
      all: 'All Pieces',
      shirts: 'Linen & Shirts',
      pants: 'Trousers & Chinos',
      jackets: 'Jackets & Blazers',
      ethnic: 'Kurtas & Ethnic',
      jeans: 'Selvedge Denims',
      tshirts: 'Polos & Tees'
    };

    const keys = Object.keys(catMap);
    return keys.map(k => ({
      id: k,
      name: categoryLabels[k] || (k.charAt(0).toUpperCase() + k.slice(1)),
      count: catMap[k]
    }));
  }, [menuItems]);

  const bestSellingProducts = useMemo(() => {
    if (selectedCategory === 'all') return allClothingProducts;
    return allClothingProducts.filter(item => item.category === selectedCategory);
  }, [allClothingProducts, selectedCategory]);

  // ─── REVIEWS LIST (CLOTHING ONLY) ─────────────────────────────
  const customerReviews = useMemo(() => {
    if (storeData?.reviews && storeData.reviews.length > 0) {
      const cleanRevs = storeData.reviews.filter(r => 
        !r.dishId?.startsWith('slick-shoe') &&
        !/sneaker|shoe|slick pro/i.test(r.comment || '') &&
        !/sneaker|shoe/i.test(r.dish || '')
      );
      if (cleanRevs.length > 0) return cleanRevs;
    }
    return [
      {
        id: 'rev-1',
        name: 'Arjun Rathore',
        rating: 5,
        comment: 'The French Normandy Linen Shirt has an unbelievable drape and feel. Skyline has completely upgraded menswear in Churu!'
      },
      {
        id: 'rev-2',
        name: 'Vikram Shekhawat',
        rating: 5,
        comment: 'The double-pleated Gurkha trousers fit like a dream. Sharp tailored silhouettes and high-grade fabric. Seamless Churu express delivery!'
      }
    ];
  }, [storeData?.reviews]);

  return (
    <div className="min-h-screen bg-white text-stone-900 font-sans selection:bg-black selection:text-white antialiased">
      
      {/* ─── TOAST NOTIFICATION ───────────────────────────────────── */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-50 bg-stone-950 text-white px-5 py-3 rounded-xl shadow-2xl text-xs font-medium tracking-wide flex items-center gap-2.5 border border-stone-800"
          >
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── FLOATING BOTTOM BAG PILL (Appears when items in bag) ─── */}
      {/* ─── FLOATING BOTTOM BAG PILL (Appears when items in bag) ─── */}
      <AnimatePresence>
        {cartItems.length > 0 && !isCartOpen && (
          <div className="fixed bottom-24 inset-x-0 mx-auto z-40 w-[92%] max-w-sm pointer-events-none flex justify-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="w-full pointer-events-auto"
            >
              <div
                onClick={() => setIsCartOpen(true)}
                className="bg-black text-white rounded-full px-5 py-3.5 shadow-2xl border border-stone-800 flex items-center justify-between cursor-pointer hover:bg-stone-900 transition-all active:scale-98"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center font-black text-xs">
                    {totalItemsCount}
                  </div>
                  <div>
                    <span className="text-xs font-bold block">
                      {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'} in bag
                    </span>
                    <span className="text-[11px] text-stone-400 font-mono">
                      Subtotal: ₹ {cartSubtotal}.00
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                  <span>View Bag</span>
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── 1. MINIMALIST HEADER / NAVBAR (SOLID LUXURY LIGHT) ────── */}
      <header className="sticky top-0 z-50 bg-white border-b border-stone-200 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between bg-white">
          
          {/* Brand Logo: Dynamic from Dukandar Portal */}
          <div className="flex items-center gap-6">
            <a href="/skyline" className="group flex items-center gap-2 text-stone-950 no-underline">
              {(() => {
                const brand = storeData?.storeInfo?.name || storeData?.storeInfo?.storeName || 'Skyline Premium';
                const parts = brand.trim().split(' ');
                const mainName = parts[0] || 'Skyline';
                const subBadge = parts.slice(1).join(' ') || 'Premium';
                return (
                  <>
                    <span className="text-2xl sm:text-3xl font-extrabold tracking-tighter text-black">
                      {mainName}
                    </span>
                    <span className="text-[10px] sm:text-xs font-black tracking-widest uppercase bg-stone-950 text-white px-2 py-0.5 rounded-md">
                      {subBadge}
                    </span>
                  </>
                );
              })()}
              <span className="w-1.5 h-1.5 rounded-full bg-black group-hover:scale-150 transition-transform"></span>
            </a>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-stone-600">
            <a href="#hero" className="text-stone-950 hover:text-black transition-colors font-semibold">Home</a>
            <a href="#trending" className="hover:text-black transition-colors">Trending</a>
            <a href="#combos" className="hover:text-black transition-colors">Offers & Sets</a>
            <a href="#bestselling" className="hover:text-black transition-colors">Collection</a>
            <a href="#about" className="hover:text-black transition-colors">About Atelier</a>
            <a href="#reviews" className="hover:text-black transition-colors">Reviews</a>
          </nav>

          {/* Right Action Icons & Auth */}
          <div className="flex items-center gap-3 sm:gap-4">
            
            {/* Search Toggle */}
            <div className="relative">
              {isSearchOpen ? (
                <div className="flex items-center bg-stone-100 rounded-full px-3 py-1.5 text-xs w-44 sm:w-56 transition-all border border-stone-200">
                  <Search className="w-3.5 h-3.5 text-stone-500 shrink-0 mr-2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search shirts, trousers, jeans..."
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

            {/* Shopping Bag Button with Spring Scale */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-stone-700 hover:text-black transition-colors cursor-pointer"
              title="Shopping Bag"
            >
              <ShoppingBag className="w-4 h-4 stroke-[1.8]" />
              <AnimatePresence>
                {totalItemsCount > 0 && (
                  <motion.span
                    key={totalItemsCount}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    className="absolute top-1 right-1 bg-black text-white rounded-full text-[9px] font-bold w-4 h-4 flex items-center justify-center"
                  >
                    {totalItemsCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Dukandar Portal */}
            <a
              href="/master?storeId=skyline"
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-900 hover:bg-black text-white text-[11px] font-bold transition-all shadow-xs"
              title="Skyline Merchant OS"
            >
              <Store className="w-3.5 h-3.5 text-amber-400" />
              <span>Dukan OS</span>
            </a>

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
          <div className="md:hidden border-t border-stone-200 bg-white px-6 py-4 space-y-3 shadow-lg">
            <a href="#hero" onClick={() => setIsMobileMenuOpen(false)} className="block text-sm font-medium text-stone-900 py-1">Home</a>
            <a href="#trending" onClick={() => setIsMobileMenuOpen(false)} className="block text-sm font-medium text-stone-900 py-1">Trending</a>
            <a href="#combos" onClick={() => setIsMobileMenuOpen(false)} className="block text-sm font-medium text-stone-900 py-1">Offers & Sets</a>
            <a href="#bestselling" onClick={() => setIsMobileMenuOpen(false)} className="block text-sm font-medium text-stone-900 py-1">Collection</a>
            <a href="#about" onClick={() => setIsMobileMenuOpen(false)} className="block text-sm font-medium text-stone-900 py-1">About Atelier</a>
            <a href="#reviews" onClick={() => setIsMobileMenuOpen(false)} className="block text-sm font-medium text-stone-900 py-1">Reviews</a>
            <a 
              href="/master?storeId=skyline"
              className="w-full text-left text-sm font-semibold text-stone-900 py-1 flex items-center gap-2"
            >
              <Store className="w-4 h-4 text-amber-600" />
              <span>Dukan OS (Merchant Console)</span>
            </a>
            <button 
              onClick={() => { setIsMobileMenuOpen(false); openDirectOrderTracker(recentOrder); }}
              className="w-full text-left text-sm font-medium text-stone-600 py-1 flex items-center gap-2 cursor-pointer"
            >
              <Clock className="w-4 h-4 text-stone-400" />
              <span>Track Orders</span>
            </button>
          </div>
        )}
      </header>

      {/* ─── 2. KINETIC EDITORIAL HERO SECTION ──────────────────────── */}
      <section id="hero" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Text Column with Kinetic Typography */}
          <div className="lg:col-span-5 space-y-5 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 text-stone-800 text-xs font-mono font-bold tracking-wider uppercase border border-stone-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {heroBanner?.badgeText || 'Churu Flagship Menswear Studio'}
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-stone-950 tracking-tight leading-[1.05]"
            >
              {heroBanner?.titleLine1 || 'Skyline'}<br />
              {heroBanner?.titleLine2 || 'Premium'}<br />
              {heroBanner?.titleHighlight || 'Outfits'}
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="text-stone-600 text-sm sm:text-base font-normal leading-relaxed max-w-md mx-auto lg:mx-0"
            >
              {heroBanner?.subtitle || 'Architectural luxury menswear, Italian linen shirts, pleated Gurkha trousers, Japanese selvedge denim & bespoke outfits curated in Churu.'}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="pt-2 flex items-center justify-center lg:justify-start gap-4"
            >
              <motion.a
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                href="#bestselling"
                className="inline-block bg-black text-white hover:bg-stone-800 transition-all px-8 py-3.5 rounded-md text-xs uppercase tracking-widest font-semibold shadow-md no-underline cursor-pointer"
              >
                {heroBanner?.heroButtonText || 'Shop Collection'}
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                href="#trending"
                className="inline-block bg-stone-100 text-stone-800 hover:bg-stone-200 transition-all px-6 py-3.5 rounded-md text-xs uppercase tracking-widest font-semibold no-underline cursor-pointer border border-stone-200"
              >
                Trending
              </motion.a>
            </motion.div>
          </div>

          {/* Right Product Showcase with Levitating Garment & Architectural Watermark */}
          <div className="lg:col-span-7">
            <div className="relative bg-[#F6F6F8] rounded-3xl p-6 sm:p-12 overflow-hidden flex items-center justify-center min-h-[380px] sm:min-h-[480px] border border-stone-200/80">
              
              {/* Giant Translucent Vertical Watermark: SKYLINE */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 -rotate-90 origin-center text-6xl sm:text-8xl lg:text-9xl font-black text-stone-200/90 tracking-[0.25em] select-none pointer-events-none"
              >
                SKYLINE
              </motion.div>

              {/* Multi-angle Pill Switcher in Hero (If secondary image available) */}
              {heroProduct.secondaryImage && (
                <div className="absolute top-5 left-5 z-20 flex items-center gap-1.5 bg-white border border-stone-200 rounded-full p-1 shadow-xs">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setHeroActiveAngle('primary'); }}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                      heroActiveAngle === 'primary' ? 'bg-black text-white shadow-xs' : 'text-stone-600 hover:text-black'
                    }`}
                  >
                    01 Angle
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setHeroActiveAngle('secondary'); }}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                      heroActiveAngle === 'secondary' ? 'bg-black text-white shadow-xs' : 'text-stone-600 hover:text-black'
                    }`}
                  >
                    02 Studio
                  </button>
                </div>
              )}

              {/* Floating Levitating Hero Garment */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                whileHover={{ scale: 1.04 }}
                onClick={() => openProductModal(heroProduct)}
                className="relative z-10 w-full max-w-md mx-auto cursor-pointer group select-none"
              >
                <img
                  src={heroActiveAngle === 'secondary' && heroProduct.secondaryImage ? heroProduct.secondaryImage : heroProduct.image}
                  alt={heroProduct.name}
                  className="w-full h-72 sm:h-96 object-contain drop-shadow-2xl transition-all duration-500"
                />
              </motion.div>

              {/* Floating Solid White Badge Below the Showcase */}
              <motion.div
                whileHover={{ y: -2 }}
                className="absolute bottom-6 right-6 sm:right-10 z-20 bg-white px-5 py-3 rounded-2xl border border-stone-200 shadow-xl flex items-center gap-4"
              >
                <div>
                  <span className="block text-xs font-semibold text-stone-950 tracking-tight">
                    {heroProduct.name}
                  </span>
                  <span className="block text-xs font-mono font-medium text-stone-500 mt-0.5">
                    ₹ {heroProduct.price}.00
                  </span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => addToCart(heroProduct)}
                  className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center hover:bg-stone-800 transition-colors cursor-pointer shadow-sm"
                  title="Add to Bag"
                >
                  <Plus className="w-4 h-4" />
                </motion.button>
              </motion.div>

            </div>
          </div>

        </div>
      </section>

      {/* ─── 3. INFINITE LUXURY MARQUEE RIBBON (NO EMOJIS, SEAMLESS LOOP) ─── */}
      <section className="bg-black text-white py-4 overflow-hidden select-none border-y border-stone-900">
        <div className="flex whitespace-nowrap overflow-hidden">
          <motion.div
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            className="flex items-center gap-10 text-xs sm:text-sm font-mono font-bold uppercase tracking-widest shrink-0"
          >
            {[1, 2].map((iteration) => (
              <React.Fragment key={iteration}>
                {marqueeItems.map((item, mIdx) => (
                  <React.Fragment key={`${iteration}-${mIdx}`}>
                    <span className={mIdx % 2 === 0 ? "text-white font-extrabold tracking-wider" : "text-stone-300"}>
                      {item}
                    </span>
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-stone-600" />
                  </React.Fragment>
                ))}
              </React.Fragment>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── 4. OUR TRENDING CLOTHING / MOST POPULAR PRODUCTS ─────────── */}
      <section id="trending" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        
        {/* Section Tag */}
        <div className="text-center sm:text-left mb-3">
          <span className="text-xs uppercase tracking-[0.25em] font-semibold text-stone-400">
            {heroBanner?.trendingTag || '— Our Trending Menswear Collection —'}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Column: Heading, description, Explore button */}
          <div className="lg:col-span-4 space-y-4 text-center sm:text-left">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-950 tracking-tight leading-tight">
              {heroBanner?.trendingTitle ? (
                heroBanner.trendingTitle.includes('\n') ? (
                  heroBanner.trendingTitle.split('\n').map((line, i) => (
                    <React.Fragment key={i}>{line}<br /></React.Fragment>
                  ))
                ) : (
                  heroBanner.trendingTitle
                )
              ) : (
                <>Most Popular<br />Garments</>
              )}
            </h2>
            <p className="text-stone-500 text-xs sm:text-sm leading-relaxed max-w-sm mx-auto sm:mx-0">
              {heroBanner?.trendingSubtitle || 'Curated luxury essentials engineered for sharp tailoring, comfort and enduring elegance in Churu.'}
            </p>
            <div className="pt-2">
              <a
                href="#bestselling"
                className="inline-block bg-black text-white hover:bg-stone-800 transition-colors px-6 py-2.5 rounded-md text-xs font-semibold uppercase tracking-wider cursor-pointer no-underline active:scale-95 shadow-sm"
              >
                Explore All Outfits
              </a>
            </div>
          </div>

          {/* Right Column: Trending Clothing Cards */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {trendingProducts.map((item, idx) => {
                return (
                  <motion.div
                    key={item.id || idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: idx * 0.1 }}
                    whileHover={{ y: -6 }}
                    className="bg-[#F5F5F7] rounded-2xl p-5 relative group transition-shadow duration-300 hover:shadow-xl border border-stone-200/60 flex flex-col justify-between overflow-hidden"
                  >
                    {/* Top Badges */}
                    <div className="flex items-center justify-between z-10 mb-2">
                      <span className="bg-black text-white text-[9px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {item.badge || 'Trending'}
                      </span>
                      <span className="text-[10px] font-mono text-stone-400 font-semibold">
                        0{idx + 1}
                      </span>
                    </div>

                    {/* Garment Image with Dual-Angle Crossfade on Hover */}
                    <div 
                      onClick={() => openProductModal(item)}
                      className="relative h-44 sm:h-48 flex items-center justify-center cursor-pointer overflow-hidden p-2 select-none"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className={`max-h-full max-w-full object-contain transition-all duration-500 drop-shadow-md rounded-lg ${
                          item.secondaryImage ? 'group-hover:opacity-0 group-hover:scale-105' : 'group-hover:scale-105'
                        }`}
                      />
                      {item.secondaryImage && (
                        <img
                          src={item.secondaryImage}
                          alt={`${item.name} studio angle`}
                          className="absolute inset-0 m-auto max-h-full max-w-full object-contain opacity-0 group-hover:opacity-100 transition-all duration-500 drop-shadow-md rounded-lg group-hover:scale-105"
                        />
                      )}
                    </div>

                    {/* Sliding Quick View Action on Card Hover */}
                    <div className="absolute inset-x-4 bottom-16 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 flex items-center gap-2 z-20 pointer-events-none group-hover:pointer-events-auto">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); openProductModal(item); }}
                        className="flex-1 bg-white hover:bg-stone-50 text-stone-900 border border-stone-200 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-md flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Quick View</span>
                      </button>
                    </div>

                    {/* Details & Circular Action Button */}
                    <div className="pt-3 flex items-end justify-between border-t border-stone-200/60 mt-2">
                      <div>
                        <h4 
                          onClick={() => openProductModal(item)}
                          className="text-xs font-semibold text-stone-900 hover:text-black cursor-pointer truncate max-w-[140px]"
                        >
                          {item.name}
                        </h4>
                        <p className="text-xs font-mono font-medium text-stone-600 mt-0.5">
                          ₹ {item.price}.00
                        </p>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => addToCart(item)}
                        className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center hover:bg-stone-800 transition-transform cursor-pointer shadow-sm shrink-0"
                        title="Add to Bag"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </div>

          </div>

        </div>
      </section>

      {/* ─── 4.5 EXCLUSIVE OFFERS & CURATED WARDROBE SETS ─── */}
      <section id="combos" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 border-t border-stone-100">
        
        {/* Section Header */}
        <div className="text-center space-y-3 mb-12">
          <span className="text-xs uppercase tracking-[0.25em] font-semibold text-stone-400 block">
            — Exclusive Privileges & Sets —
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-stone-950 tracking-tight">
            Offers & Wardrobe Ensembles
          </h2>
          <p className="text-stone-500 text-xs sm:text-sm max-w-lg mx-auto">
            Curated multi-piece luxury outfits and exclusive boutique vouchers tailored for Churu patrons.
          </p>
        </div>

        {/* Part A: Active Promotional Vouchers */}
        <div className="mb-14">
          <div className="flex items-center gap-2 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-black" />
            <h3 className="text-xs font-mono font-bold tracking-widest uppercase text-stone-900">
              Active Boutique Vouchers ({activeDeals.length > 0 ? activeDeals.length : 2})
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {(activeDeals.length > 0 ? activeDeals : [
              {
                code: 'SKYLINE10',
                title: 'Welcome Privilege',
                discountType: 'percentage',
                discountPercent: 10,
                maxDiscount: 500,
                minOrder: 1499,
                description: 'Enjoy 10% off on your luxury wardrobe curation'
              },
              {
                code: 'FIRST100',
                title: 'Atelier Inaugural',
                discountType: 'flat',
                flatDiscount: 100,
                minOrder: 999,
                description: 'Flat ₹100 off on your first handcrafted order'
              }
            ]).map((deal, dIdx) => {
              const isCopied = copiedCouponCode === deal.code;
              const discountLabel = deal.discountType === 'flat' 
                ? `₹${deal.flatDiscount || 100} OFF` 
                : `${deal.discountPercent || 10}% OFF`;

              return (
                <motion.div
                  key={deal.code || dIdx}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: dIdx * 0.08 }}
                  className="bg-[#F6F6F8] rounded-2xl p-5 border border-stone-200/70 flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow relative overflow-hidden"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono font-bold px-3 py-1 rounded-md bg-black text-white tracking-widest uppercase">
                        {deal.code}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-stone-900 bg-white px-2.5 py-0.5 rounded-full border border-stone-200 shadow-2xs">
                        {discountLabel}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-stone-950">
                        {deal.title || 'Exclusive Privileges'}
                      </h4>
                      <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
                        {deal.description || (deal.minOrder ? `Applicable on orders above ₹${deal.minOrder}` : 'Valid across complete collection')}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-stone-200/60 flex items-center justify-between gap-3">
                    <span className="text-[11px] font-mono text-stone-500">
                      {deal.minOrder ? `Min Bag: ₹${deal.minOrder}` : 'No minimum order'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          navigator.clipboard.writeText(deal.code);
                        } catch (e) {}
                        setCopiedCouponCode(deal.code);
                        setCouponCodeInput(deal.code);
                        showToast(`Coupon ${deal.code} copied! Applied in cart.`);
                        setTimeout(() => setCopiedCouponCode(''), 3000);
                      }}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider bg-white hover:bg-stone-100 text-stone-900 border border-stone-300 shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                          <span className="text-emerald-700 font-bold">Applied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-stone-600" />
                          <span>Copy Code</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Part B: Curated Wardrobe Combos & Coordinated Sets */}
        {wardrobeCombos.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-black" />
              <h3 className="text-xs font-mono font-bold tracking-widest uppercase text-stone-900">
                Curated Wardrobe Combos ({wardrobeCombos.length})
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wardrobeCombos.map((combo, cIdx) => {
                const origPrice = Number(combo.originalPrice) || 0;
                const price = Number(combo.price) || 0;
                const savings = origPrice > price ? origPrice - price : 0;
                const discountPct = origPrice > price ? Math.round((savings / origPrice) * 100) : 0;

                let includedItems = [];
                if (Array.isArray(combo.comboItems) && combo.comboItems.length > 0) {
                  includedItems = combo.comboItems.map(i => typeof i === 'string' ? i : i.name);
                } else if (combo.description && combo.description.includes('+')) {
                  includedItems = combo.description.split('+').map(s => s.trim());
                } else if (combo.desc && combo.desc.includes('+')) {
                  includedItems = combo.desc.split('+').map(s => s.trim());
                } else {
                  includedItems = [combo.name];
                }

                return (
                  <motion.div
                    key={combo.id || cIdx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: cIdx * 0.08 }}
                    className="bg-[#F6F6F8] rounded-2xl p-6 border border-stone-200/70 flex flex-col justify-between hover:shadow-xl transition-shadow relative overflow-hidden group"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="bg-black text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          {combo.badge || 'Curated Ensemble'}
                        </span>
                        {savings > 0 && (
                          <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                            Save ₹{savings} ({discountPct}% OFF)
                          </span>
                        )}
                      </div>

                      {/* Combo Imagery */}
                      <div
                        onClick={() => openProductModal(combo)}
                        className="relative h-48 sm:h-52 flex items-center justify-center my-3 cursor-pointer overflow-hidden p-2 select-none"
                      >
                        <img
                          src={combo.image}
                          alt={combo.name}
                          className="max-h-full max-w-full object-contain transition-transform duration-500 drop-shadow-md rounded-xl group-hover:scale-105"
                        />
                      </div>

                      {/* Title & Description */}
                      <h4 
                        onClick={() => openProductModal(combo)}
                        className="text-sm font-bold text-stone-950 hover:text-black cursor-pointer truncate"
                      >
                        {combo.name}
                      </h4>
                      <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                        {combo.description || combo.desc || 'Handcrafted matching luxury ensemble, curated for sharp tailoring and comfort.'}
                      </p>

                      {/* Included Garments Chips */}
                      <div className="mt-3.5 bg-white rounded-xl p-3 border border-stone-200/60 space-y-1.5">
                        <span className="text-[10px] font-mono font-bold uppercase text-stone-600 tracking-wider block">
                          Included in Ensemble ({includedItems.length}):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {includedItems.map((itName, idx) => (
                            <span 
                              key={idx}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-800 bg-stone-100 px-2.5 py-0.5 rounded-md"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-stone-600" />
                              <span>{itName}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Pricing & CTA */}
                    <div className="pt-4 mt-4 border-t border-stone-200/60 flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm sm:text-base font-mono font-bold text-stone-950">
                            ₹ {price}.00
                          </span>
                          {origPrice > price && (
                            <span className="text-xs font-mono text-stone-400 line-through">
                              ₹ {origPrice}.00
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-stone-500">
                          Complete Set Price
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => addToCart(combo)}
                        className="px-4 py-2 rounded-lg bg-black hover:bg-stone-800 text-white text-xs font-semibold uppercase tracking-wider shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Set to Bag</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

      </section>

      {/* ─── 5. ALL PRODUCTS SECTION (CLOTHES ONLY — UNIFIED CATALOG WITH CATEGORY FILTER) ─── */}
      <section id="bestselling" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 border-t border-stone-100">
        
        {/* Section Header */}
        <div className="text-center space-y-3 mb-10">
          <span className="text-xs uppercase tracking-[0.25em] font-semibold text-stone-400 block">
            — Complete Collection —
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-stone-950 tracking-tight">
            Skyline Premium Outfits
          </h2>
          <p className="text-stone-500 text-xs sm:text-sm max-w-lg mx-auto">
            {PHONEPE_REVIEW_MODE 
              ? "Handcrafted French linen & luxury tailored casual shirts — ready for same-day dispatch."
              : "Pure French linen shirts, pleated Gurkha trousers, authentic Japanese selvedge denim, kurtas & jackets — all garments in one place."}
          </p>

          {/* Interactive Luxury Category Switcher with Framer Motion Sliding Pill */}
          {availableCategories.length > 1 && (
            <div className="pt-4 flex items-center justify-center flex-wrap gap-2">
              {availableCategories.map(cat => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`relative px-4 py-2 rounded-full text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer select-none ${
                      isActive ? 'text-white' : 'text-stone-600 hover:text-black bg-stone-100'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeCatalogPill"
                        className="absolute inset-0 bg-black rounded-full z-0"
                        transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      <span>{cat.name}</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${isActive ? 'bg-stone-800 text-stone-200' : 'bg-stone-200 text-stone-700'}`}>
                        {cat.count}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-stone-100 text-stone-800 text-xs font-mono font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Showing {bestSellingProducts.length} premium pieces</span>
          </div>
        </div>

        {/* All Products Grid with Dual-Angle Crossfade & Micro-Interactions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {bestSellingProducts.map((product, pIdx) => {
            const isWishlisted = wishlist.includes(product.id);

            return (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: (pIdx % 3) * 0.08 }}
                whileHover={{ y: -6 }}
                className="bg-[#F6F6F8] rounded-2xl p-6 relative group transition-shadow duration-300 hover:shadow-xl border border-stone-200/60 flex flex-col justify-between overflow-hidden"
              >
                {/* Top Badges */}
                <div className="flex items-center justify-between z-10 mb-1">
                  <span className="bg-black text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {product.badge || 'New'}
                  </span>
                  
                  <span className="text-[10px] font-mono text-stone-400 font-semibold">
                    0{pIdx + 1}
                  </span>
                </div>

                {/* Garment Image with Dual-Angle Crossfade on Hover */}
                <div
                  onClick={() => openProductModal(product)}
                  className="relative h-52 sm:h-60 flex items-center justify-center my-3 cursor-pointer overflow-hidden p-2 select-none"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className={`max-h-full max-w-full object-contain transition-all duration-500 drop-shadow-md rounded-xl ${
                      product.secondaryImage ? 'group-hover:opacity-0 group-hover:scale-105' : 'group-hover:scale-105'
                    }`}
                  />
                  {product.secondaryImage && (
                    <img
                      src={product.secondaryImage}
                      alt={`${product.name} studio angle`}
                      className="absolute inset-0 m-auto max-h-full max-w-full object-contain opacity-0 group-hover:opacity-100 transition-all duration-500 drop-shadow-md rounded-xl group-hover:scale-105"
                    />
                  )}
                </div>

                {/* Sliding Quick Action Pill on Hover */}
                <div className="absolute inset-x-6 bottom-[88px] opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 transition-all duration-300 flex items-center gap-2 z-20 pointer-events-none group-hover:pointer-events-auto">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); openProductModal(product); }}
                    className="flex-1 bg-white hover:bg-stone-50 text-stone-900 border border-stone-200 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Quick View</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                    className="bg-black hover:bg-stone-800 text-white px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider shadow-md flex items-center justify-center gap-1 cursor-pointer active:scale-95 transition-all"
                    title="Add to Bag"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Color Swatch Dots Preview */}
                {product.colors && product.colors.length > 0 && (
                  <div className="flex items-center gap-1.5 mb-2">
                    {product.colors.slice(0, 4).map((c, cIdx) => {
                      const cHex = typeof c === 'object' && c.hex ? c.hex : '#111827';
                      const cName = typeof c === 'object' && c.name ? c.name : c;
                      return (
                        <span
                          key={cIdx}
                          title={cName}
                          className="w-2.5 h-2.5 rounded-full border border-stone-300 shadow-2xs"
                          style={{ backgroundColor: cHex }}
                        />
                      );
                    })}
                    {product.colors.length > 4 && (
                      <span className="text-[10px] text-stone-400 font-mono">+{product.colors.length - 4}</span>
                    )}
                  </div>
                )}

                {/* Bottom Details & Circular Action Button */}
                <div className="flex items-end justify-between pt-2 border-t border-stone-200/60">
                  <div>
                    <h3 
                      onClick={() => openProductModal(product)}
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

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    type="button"
                    onClick={() => addToCart(product)}
                    className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center hover:bg-stone-800 transition-transform cursor-pointer shadow-sm shrink-0"
                    title="Add to Bag"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </motion.button>
                </div>

              </motion.div>
            );
          })}
        </div>

      </section>

      {/* ─── 5.5 ABOUT THE ATELIER & MASTER TAILOR ─────────────────── */}
      <section id="about" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 border-t border-stone-100">
        
        {/* Section Header */}
        <div className="text-center space-y-3 mb-14">
          <span className="text-xs uppercase tracking-[0.25em] font-semibold text-stone-400 block">
            {storeData?.storeInfo?.ownerEyebrow || '— The Atelier Heritage —'}
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-stone-950 tracking-tight">
            {storeData?.storeInfo?.ownerHeadline || 'Architectural Tailoring & Craftsmanship'}
          </h2>
          <p className="text-stone-500 text-xs sm:text-sm max-w-xl mx-auto">
            {storeData?.storeInfo?.aboutText || 'Founded in Churu with a philosophy of uncompromising fabric quality, handcrafted tailoring, and architectural menswear silhouettes.'}
          </p>
        </div>

        {/* Master Tailor Profile & Atelier Features */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[#F6F6F8] rounded-3xl p-6 sm:p-10 border border-stone-200/70">
          
          {/* Left Column: Portrait & Founder Info */}
          <div className="lg:col-span-5 flex flex-col items-center sm:items-start text-center sm:text-left space-y-4">
            <div className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-2xl overflow-hidden bg-stone-200 border-2 border-stone-300 shadow-md">
              <img
                src={storeData?.storeInfo?.ownerMediaUrl || storeData?.storeInfo?.ownerPhoto || 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80'}
                alt={storeData?.storeInfo?.ownerName || 'Master Tailor'}
                className="w-full h-full object-cover"
              />
            </div>

            <div>
              <span className="inline-block text-[11px] font-mono uppercase tracking-widest text-stone-500 font-bold">
                {storeData?.storeInfo?.ownerRole || 'Founder & Master Stylist'}
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-stone-950 mt-1">
                {storeData?.storeInfo?.ownerName || 'Skyline Atelier Guild'}
              </h3>
            </div>

            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              {storeData?.storeInfo?.ownerBio || 'With decades of dedicated sartorial precision, every garment in Skyline is cut from authentic French and Italian linens, Japanese raw selvedge denim, and finished with mother-of-pearl buttons.'}
            </p>
          </div>

          {/* Right Column: Boutique Specifications & Multi-Channel Contact */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* 1. Flagship Boutique Location */}
            <div className="bg-white rounded-2xl p-5 border border-stone-200/70 flex flex-col justify-between space-y-3 shadow-xs">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-stone-400">
                  <MapPin className="w-3.5 h-3.5 text-black shrink-0" />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
                    Flagship Boutique Location
                  </span>
                </div>
                <h4 className="text-sm font-bold text-stone-900 leading-snug">
                  {storeData?.storeInfo?.address || 'Subhash Chowk, Station Road, Churu, Rajasthan – 331001'}
                </h4>
                <p className="text-xs text-stone-500 leading-relaxed">
                  {storeData?.storeInfo?.locationNote || 'Central showroom & tailoring fitting rooms in the heart of Churu city.'}
                </p>
              </div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(storeData?.storeInfo?.address || 'Subhash Chowk, Station Road, Churu')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-stone-900 hover:text-black uppercase tracking-wider underline decoration-stone-300 hover:decoration-black no-underline"
              >
                <span>Open in Google Maps</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* 2. Dynamic Atelier Hours */}
            <div className="bg-white rounded-2xl p-5 border border-stone-200/70 flex flex-col justify-between space-y-3 shadow-xs">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-stone-400">
                    <Clock className="w-3.5 h-3.5 text-black shrink-0" />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
                      Atelier Hours
                    </span>
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                    storeData?.storeInfo?.isOpen !== false ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
                  }`}>
                    {storeData?.storeInfo?.isOpen !== false ? '● Open Today' : '○ Closed Today'}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-stone-900">
                  {storeData?.storeInfo?.timing || (storeData?.storeInfo?.openTillText ? `Open Daily • ${storeData?.storeInfo?.openTillText}` : 'Mon–Sun: 10:30 AM – 10:00 PM')}
                </h4>
                <p className="text-xs text-stone-500 leading-relaxed">
                  {storeData?.storeInfo?.openTillText ? `Store timings: ${storeData.storeInfo.openTillText}. Bespoke trials & collection trials available.` : 'Open all 7 days for custom bespoke trials, measurements and collection pick-ups.'}
                </p>
              </div>
              <div className="text-[10px] font-mono text-stone-400">
                Weekly Schedule Synced with Dukandar Portal
              </div>
            </div>

            {/* 3. Concierge & Multi-Channel Contact (Full Width) */}
            <div className="sm:col-span-2 bg-stone-900 text-white rounded-2xl p-5 space-y-3 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-stone-800 pb-2.5">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400 block">
                    Direct Atelier Assistance & Concierge
                  </span>
                  <h4 className="text-sm sm:text-base font-bold text-white mt-0.5">
                    Connect With Our Master Stylists
                  </h4>
                </div>
                <span className="text-[11px] text-stone-400 font-mono">
                  Instant Support 7 Days a Week
                </span>
              </div>

              {/* Dynamic Contact Action Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                {/* 1. Call Now */}
                <a
                  href={`tel:${String(storeData?.storeInfo?.phone || storeData?.storeInfo?.phoneDisplay || '7023963189').replace(/\D/g, '').slice(-10)}`}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white text-stone-950 hover:bg-stone-100 text-xs font-bold uppercase tracking-wider transition-all no-underline shadow-xs active:scale-98"
                >
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <span>Call: {String(storeData?.storeInfo?.phoneDisplay || storeData?.storeInfo?.phone || '7023963189')}</span>
                </a>

                {/* 2. WhatsApp Concierge */}
                <a
                  href={`https://wa.me/91${String(storeData?.storeInfo?.phone || storeData?.storeInfo?.phoneDisplay || '7023963189').replace(/\D/g, '').slice(-10)}?text=Hello%20Skyline%20Atelier,%20I%20would%20like%20to%20inquire%20about%20a%20garment%20or%20order.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider transition-all no-underline shadow-xs active:scale-98"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp Concierge</span>
                </a>

                {/* 3. Instagram Direct / Profile */}
                <a
                  href={storeData?.storeInfo?.socials?.instagram || storeData?.storeInfo?.instagram || 'https://instagram.com/churuone'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white text-xs font-bold uppercase tracking-wider transition-all no-underline shadow-xs active:scale-98"
                >
                  <Instagram className="w-4 h-4" />
                  <span>Instagram Direct</span>
                </a>
              </div>
            </div>

          </div>

        </div>

      </section>

      {/* ─── 6. CUSTOMER REVIEW SECTION ───────────────────────────── */}
      <section id="reviews" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 border-t border-stone-100">
        
        {/* Section Tag & Write Review Action */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10 max-w-4xl mx-auto">
          <div className="text-center sm:text-left space-y-1">
            <span className="text-xs uppercase tracking-[0.25em] font-semibold text-stone-400 block">
              — Customer Review —
            </span>
            <h3 className="text-xl sm:text-2xl font-extrabold text-stone-950 tracking-tight">
              Community Voices & Testimonials
            </h3>
          </div>
          <button
            onClick={() => {
              if (currentUser?.name) setNewReviewName(currentUser.name);
              setShowReviewModal(true);
            }}
            className="px-6 py-2.5 rounded-full text-xs font-semibold bg-black text-white hover:bg-stone-800 transition-all flex items-center gap-2 cursor-pointer shadow-sm shrink-0"
          >
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>Write a Review</span>
          </button>
        </div>

        {/* Dynamic Reviews Grid (Photos Removed) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {customerReviews.slice(0, 4).map((rev) => (
            <div
              key={rev.id}
              className="bg-[#F8F8F9] rounded-2xl p-6 sm:p-7 flex flex-col justify-between border border-stone-100 shadow-xs hover:border-stone-200 transition-all space-y-3"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="truncate">
                    <h4 className="text-sm font-bold text-stone-950 truncate flex items-center gap-1.5">
                      <span>{rev.name}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100 shrink-0" title="Verified Buyer" />
                    </h4>
                    {rev.date && (
                      <span className="text-[10px] text-stone-400 font-light block">
                        {rev.date}
                      </span>
                    )}
                  </div>
                  {/* Yellow Stars */}
                  <div className="flex items-center gap-0.5 text-amber-400 shrink-0">
                    {[...Array(Math.min(5, Math.max(1, Number(rev.rating) || 5)))].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>

                <p className="text-xs text-stone-600 leading-relaxed font-light break-words">
                  "{rev.comment}"
                </p>
              </div>

              {rev.dish && (
                <div className="pt-2.5 border-t border-stone-200/60 flex items-center gap-1.5 text-[11px] text-stone-500 font-medium">
                  <Tag className="w-3 h-3 text-stone-400 shrink-0" />
                  <span className="truncate">Purchased: {rev.dish}</span>
                </div>
              )}
            </div>
          ))}
        </div>

      </section>

      {/* ─── 7. MINIMAL FOOTER ─────────────────────────────────────── */}
      <footer className="border-t border-stone-200 bg-[#FAFAFA] text-stone-600 text-xs py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-3">
              <span className="text-2xl font-black text-black">
                {storeData?.storeInfo?.name || storeData?.storeInfo?.storeName || 'Skyline Premium'}
              </span>
              <p className="text-stone-500 text-xs leading-relaxed">
                {storeData?.storeInfo?.aboutText || 'Architectural menswear and tailored clothing studio in Churu, Rajasthan.'}
              </p>
              <div className="flex items-center gap-2 text-stone-800 font-medium">
                <MapPin className="w-3.5 h-3.5 text-black shrink-0" />
                <span>{storeData?.storeInfo?.address || 'Station Road / Subhash Chowk, Churu – 331001'}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h5 className="font-bold text-black uppercase tracking-wider text-[11px]">Customer Care & Policies</h5>
              <button onClick={() => openDirectOrderTracker(recentOrder)} className="block hover:text-black cursor-pointer text-left font-semibold">
                Track Live Order
              </button>
              <a href="/contact-us" className="block hover:text-black transition-colors">
                Contact Us
              </a>
              <a href="/terms-and-conditions" className="block hover:text-black transition-colors">
                Terms & Conditions
              </a>
              <a href="/privacy-policy" className="block hover:text-black transition-colors">
                Privacy Policy
              </a>
              <a href="/refund-policy" className="block hover:text-black transition-colors">
                Refund & Cancellation Policy
              </a>
              <a href="/shipping-policy" className="block hover:text-black transition-colors">
                Shipping & Delivery Policy
              </a>
            </div>
          </div>

          <div className="border-t border-stone-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-stone-500 text-[11px]">
            <span>© 2026 {storeData?.storeInfo?.name || 'Skyline Premium Outfits'}. Legal Entity: Vasudhaiva Kutumbakam Robotics.</span>
            <span>Station Road, Churu, Rajasthan - 331001. All rights reserved.</span>
          </div>
        </div>
      </footer>

      {/* ─── 8. PRODUCT QUICK VIEW MODAL (WITH SPRING ANIMATION & DUAL-ANGLE LOOKBOOK) ─── */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60"
              onClick={() => { setSelectedProduct(null); setModalActiveImage(''); setModalColor(''); setModalSize(''); }}
            />
            
            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 15 }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                className="relative bg-white max-w-2xl w-full rounded-2xl shadow-2xl border border-stone-200 p-6 sm:p-8 overflow-hidden z-10"
              >
                
                <button
                  onClick={() => { setSelectedProduct(null); setModalActiveImage(''); setModalColor(''); setModalSize(''); }}
                  className="absolute right-4 top-4 text-stone-400 hover:text-black p-1.5 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                  
                  {/* Product Image Preview & Lookbook */}
                  <div className="bg-[#F6F6F8] rounded-xl p-4 flex flex-col items-center justify-center border border-stone-200/60">
                    <div className="h-56 flex items-center justify-center w-full">
                      <motion.img
                        key={modalActiveImage || selectedProduct.image}
                        initial={{ opacity: 0.6, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        src={modalActiveImage || selectedProduct.image}
                        alt={selectedProduct.name}
                        className="max-h-full max-w-full object-contain drop-shadow-xl"
                      />
                    </div>
                    {selectedProduct.secondaryImage && (
                      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-stone-200 w-full justify-center">
                        <button
                          type="button"
                          onClick={() => setModalActiveImage(selectedProduct.image)}
                          className={`w-11 h-11 rounded-lg border-2 overflow-hidden p-0.5 bg-white cursor-pointer transition-all ${
                            (!modalActiveImage || modalActiveImage === selectedProduct.image)
                              ? 'border-black ring-1 ring-black'
                              : 'border-stone-200 hover:border-stone-400 opacity-60 hover:opacity-100'
                          }`}
                          title="Primary Angle"
                        >
                          <img src={selectedProduct.image} alt="Primary" className="w-full h-full object-contain" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setModalActiveImage(selectedProduct.secondaryImage)}
                          className={`w-11 h-11 rounded-lg border-2 overflow-hidden p-0.5 bg-white cursor-pointer transition-all ${
                            modalActiveImage === selectedProduct.secondaryImage
                              ? 'border-black ring-1 ring-black'
                              : 'border-stone-200 hover:border-stone-400 opacity-60 hover:opacity-100'
                          }`}
                          title="Lookbook / Alternate Angle"
                        >
                          <img src={selectedProduct.secondaryImage} alt="Secondary" className="w-full h-full object-contain" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Product Details & Selection */}
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-stone-400">
                        {selectedProduct.badge || 'Skyline Exclusive'}
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

                    {/* Color Swatch Selector */}
                    {selectedProduct.colors && selectedProduct.colors.length > 0 && (
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                          Color / Shade: <span className="text-black font-extrabold">{modalColor || (typeof selectedProduct.colors[0] === 'object' ? selectedProduct.colors[0].name : selectedProduct.colors[0])}</span>
                        </label>
                        <div className="flex items-center flex-wrap gap-2">
                          {selectedProduct.colors.map((c, idx) => {
                            const cName = typeof c === 'string' ? c : (c.name || 'Classic');
                            const cHex = typeof c === 'object' && c.hex ? c.hex : '#111827';
                            const isSelected = (modalColor || (typeof selectedProduct.colors[0] === 'string' ? selectedProduct.colors[0] : selectedProduct.colors[0]?.name)) === cName;
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setModalColor(cName)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-black text-white border-black shadow-xs'
                                    : 'bg-stone-50 border-stone-200 text-stone-700 hover:border-black'
                                }`}
                              >
                                <span
                                  className="w-3.5 h-3.5 rounded-full border border-white/50 shrink-0"
                                  style={{ backgroundColor: cHex }}
                                />
                                <span>{cName}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Size Selector */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                        Select Size
                      </label>
                      <div className="flex items-center flex-wrap gap-2">
                        {(selectedProduct.availableSizes || selectedProduct.sizes || ['S', 'M', 'L', 'XL', 'XXL']).map((sz) => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => setModalSize(sz)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                              (modalSize || (selectedProduct.availableSizes || selectedProduct.sizes)?.[0] || 'M') === sz
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
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        type="button"
                        onClick={() => {
                          addToCart(selectedProduct, modalSize, modalColor);
                          setSelectedProduct(null);
                          setModalActiveImage('');
                          setModalColor('');
                          setModalSize('');
                        }}
                        className="w-full bg-black hover:bg-stone-800 text-white py-3 rounded-xl text-xs uppercase tracking-widest font-semibold cursor-pointer shadow-md transition-all flex items-center justify-center gap-2"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>Add to Bag</span>
                      </motion.button>
                    </div>

                  </div>

                </div>

              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── 9. SHOPPING CART DRAWER (WITH SLIDE-IN SPRING MOTION) ─── */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50"
              onClick={() => setIsCartOpen(false)}
            />

            <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="w-screen max-w-md bg-white border-l border-stone-200 shadow-2xl flex flex-col justify-between z-10"
              >
                
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
                  {/* Recent / Active Order Quick Track in Bag */}
                  {recentOrder && (
                    <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-xs text-stone-900">
                          <Package className="w-4 h-4 text-black" />
                          <span>Active Order #{recentOrder.orderNumber || recentOrder.id?.slice(-5) || recentOrder.id}</span>
                        </div>
                        <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                          {(recentOrder.status || 'Confirmed').replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-stone-500 font-mono">
                        <span>Total: ₹{recentOrder.total || recentOrder.grandTotal}.00</span>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCartOpen(false);
                            openDirectOrderTracker(recentOrder);
                          }}
                          className="font-bold text-black flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          <span>Track Live Order</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {cartItems.length === 0 ? (
                    <div className="text-center py-16 space-y-3">
                      <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto stroke-1" />
                      <p className="text-stone-600 text-xs">Your shopping bag is empty.</p>
                      <button
                        onClick={() => setIsCartOpen(false)}
                        className="bg-black text-white px-5 py-2 rounded-full text-xs font-semibold cursor-pointer"
                      >
                        Browse Skyline Collection
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
                            <Plus className="w-3.5 h-3.5" />
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
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        if (!currentUser || !isUserPhoneVerified) {
                          showToast('Order karne ke liye verified mobile number se sign in karein');
                          setIsCartOpen(false);
                          navigateToChuruOneAuth('login');
                          return;
                        }
                        setIsCartOpen(false);
                        setIsCheckoutOpen(true);
                      }}
                      className="w-full bg-black hover:bg-stone-800 text-white py-3.5 rounded-xl text-xs uppercase tracking-widest font-semibold cursor-pointer shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <span>Proceed to Checkout</span>
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>

                  </div>
                )}

              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── 10. COMPREHENSIVE CHECKOUT MODAL (ADDRESS, GPS & PAYMENT) ─── */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60"
              onClick={() => setIsCheckoutOpen(false)}
            />

            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative bg-white max-w-xl w-full rounded-2xl shadow-2xl border border-stone-200 p-6 sm:p-8 space-y-6 my-8"
              >
                
                <button
                  onClick={() => setIsCheckoutOpen(false)}
                  className="absolute right-4 top-4 text-stone-400 hover:text-black p-1 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-widest text-stone-400">
                  SKYLINE • EXPRESS CHECKOUT SYSTEM
                </span>
                <h3 className="text-xl font-bold text-stone-950">
                  Delivery Details & Payment Method
                </h3>
              </div>

              {/* ChuruOne SSO Authentication Gate & Verification */}
              {!isUserPhoneVerified ? (
                <div className="bg-stone-50 border border-stone-200 p-6 sm:p-8 rounded-2xl text-center space-y-4 my-2">
                  <div className="w-14 h-14 rounded-full bg-black text-white flex items-center justify-center mx-auto shadow-md">
                    <ShieldCheck className="w-7 h-7 text-amber-400" />
                  </div>
                  
                  {!currentUser ? (
                    <>
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-stone-400">
                          MOBILE NUMBER AUTHENTICATION REQUIRED
                        </span>
                        <h4 className="text-xl font-bold text-stone-950">
                          Sign In to Place Your Order
                        </h4>
                        <p className="text-xs text-stone-600 max-w-sm mx-auto leading-relaxed">
                          Skyline Premium Outfits requires verified mobile authentication to coordinate sizing and doorstep delivery in Churu.
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3 pt-2 max-w-xs mx-auto">
                        <button
                          type="button"
                          onClick={() => {
                            setIsCheckoutOpen(false);
                            navigateToChuruOneAuth('login');
                          }}
                          className="w-full bg-black hover:bg-stone-800 text-white py-3 rounded-xl text-xs uppercase tracking-wider font-semibold cursor-pointer shadow-md"
                        >
                          Sign In
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCheckoutOpen(false);
                            navigateToChuruOneAuth('signup');
                          }}
                          className="w-full border border-stone-300 hover:border-black text-stone-800 py-3 rounded-xl text-xs uppercase tracking-wider font-semibold cursor-pointer"
                        >
                          Create Account
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full inline-block">
                          STEP 2: MOBILE OTP REQUIRED
                        </span>
                        <h4 className="text-xl font-bold text-stone-950">
                          Verify Your Mobile Number
                        </h4>
                        <p className="text-xs text-stone-600 max-w-sm mx-auto leading-relaxed">
                          Aapka account ({currentUser.email || currentUser.name}) connected hai, lekin Skyline par order placement ke liye 10-digit mobile number OTP verify hona mandatory hai.
                        </p>
                      </div>
                      <div className="pt-2 max-w-xs mx-auto">
                        <button
                          type="button"
                          onClick={() => {
                            setIsCheckoutOpen(false);
                            navigateToChuruOneAuth('login');
                          }}
                          className="w-full bg-black hover:bg-stone-800 text-white py-3 rounded-xl text-xs uppercase tracking-wider font-semibold cursor-pointer shadow-md flex items-center justify-center gap-2"
                        >
                          <span>Verify Mobile Number via OTP →</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center justify-between text-xs text-emerald-900">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-bold">{currentUser.name || 'Friend'}</span>
                        <span className="text-[10px] text-emerald-700 block font-mono">
                          Verified via Mobile OTP (+91 {currentUser.phone || checkoutPhone})
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
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] uppercase font-bold text-stone-600">
                        10-Digit Mobile Number *
                      </label>
                      <span className="text-[9px] uppercase tracking-wider font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                        OTP Verified
                      </span>
                    </div>
                    <div className="flex items-center border border-emerald-300 bg-stone-50 rounded-lg px-3 py-2">
                      <span className="text-xs text-stone-500 font-mono mr-2 font-bold">+91</span>
                      <input
                        type="tel"
                        required
                        readOnly
                        maxLength={10}
                        value={currentUser?.phone || checkoutPhone}
                        className="w-full bg-transparent text-xs outline-none font-mono font-bold text-stone-900"
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
                </>
              )}

              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── 11. CONFIRMED ORDER RECEIPT MODAL ────────────────────── */}
      <AnimatePresence>
        {confirmedOrder && !isUpiModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60"
              onClick={() => setConfirmedOrder(null)}
            />

            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative bg-white max-w-md w-full rounded-2xl shadow-2xl border border-stone-200 p-8 text-center space-y-5"
              >
                
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">
                    SKYLINE • WARDROBE DISPATCH READY
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
                      {confirmedOrder.paymentStatus === 'paid' ? 'Verified Paid' : 'Pay on Delivery (COD)'}
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
                  <button
                    type="button"
                    onClick={() => {
                      const o = confirmedOrder;
                      setConfirmedOrder(null);
                      openDirectOrderTracker(o);
                    }}
                    className="w-full bg-black hover:bg-stone-800 text-white py-3 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-98"
                  >
                    <Package className="w-4 h-4" />
                    <span>Track This Order Live</span>
                  </button>
                  <a
                    href={`https://wa.me/917023963189?text=Hello%20Skyline,%20I%20just%20placed%20order%20${confirmedOrder.orderNumber || confirmedOrder.id}%20for%20Rs%20${confirmedOrder.total || grandTotal}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider block text-center no-underline shadow-xs"
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

              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── 12. REAL UPI PAYMENT MODAL (UNIFIED ENGINE) ──────────── */}
      {isUpiModalOpen && (
        <UpiPaymentModal
          isOpen={isUpiModalOpen}
          onClose={() => {
            setIsUpiModalOpen(false);
            setPendingOrder(null);
            setPendingPaymentData(null);
            showToast('Payment was not completed. Items remain in your bag.');
          }}
          orderData={pendingPaymentData}
          paymentData={pendingPaymentData}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* ─── 13. CHURUONE SSO ACCOUNT MODAL ───────────────────────── */}
      <AnimatePresence>
        {isAccountModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60"
              onClick={() => setIsAccountModalOpen(false)}
            />

            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative bg-white max-w-sm w-full rounded-2xl shadow-2xl border border-stone-200 p-6 sm:p-8 space-y-6"
              >
                
                <button
                  onClick={() => setIsAccountModalOpen(false)}
                  className="absolute right-4 top-4 text-stone-400 hover:text-black p-1 cursor-pointer"
                >
                  <X className="w-5 h-5" />
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

                    {isUserPhoneVerified ? (
                      <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Phone & SSO Verified • Ready for Orders</span>
                      </div>
                    ) : (
                      <div className="bg-amber-50 border-2 border-amber-300 p-3 rounded-lg text-xs text-amber-950 space-y-2">
                        <div className="flex items-center gap-1.5 font-bold text-amber-900">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Mobile Verification Mandatory</span>
                        </div>
                        <p className="text-[11px] text-amber-800 leading-normal">
                          Skyline par order place karne ke liye mobile number OTP verify hona anivarya hai.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAccountModalOpen(false);
                            navigateToChuruOneAuth('login');
                          }}
                          className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer"
                        >
                          Verify Mobile OTP Now →
                        </button>
                      </div>
                    )}

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

              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── 14. ORDER TRACKER MODAL ──────────────────────────────── */}
      <AnimatePresence>
        {isTrackerOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60"
              onClick={() => setIsTrackerOpen(false)}
            />

            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative bg-white max-w-lg w-full rounded-2xl shadow-2xl border border-stone-200 p-6 sm:p-8 space-y-6"
              >
                
                <button
                  onClick={() => setIsTrackerOpen(false)}
                  className="absolute right-4 top-4 text-stone-400 hover:text-black p-1 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-stone-400">
                    SKYLINE • REAL-TIME DISPATCH
                  </span>
                  <h3 className="text-xl font-bold text-stone-950">
                    Live Order Tracker
                  </h3>
                  {(currentUser?.phone || recentOrder?.phone) && (
                    <p className="text-xs text-stone-500">
                      Tracking orders for: <strong className="text-stone-900">+91 {currentUser?.phone || recentOrder?.phone}</strong>
                    </p>
                  )}
                </div>

                {trackingLoading ? (
                  <div className="py-8 text-center text-xs text-stone-500 flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                    <span>Checking live order status...</span>
                  </div>
                ) : trackedOrders.length > 0 ? (
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {trackedOrders.map((ord) => {
                      const st = (ord.status || 'confirmed').toLowerCase();
                      const statusColor = st === 'delivered' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : st === 'out_for_delivery' ? 'text-sky-700 bg-sky-50 border-sky-200' : 'text-amber-700 bg-amber-50 border-amber-200';
                      return (
                        <div key={ord.id} className="bg-stone-50 rounded-2xl p-4 border border-stone-200 text-xs space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-stone-950">Order #{ord.orderNumber || ord.id?.slice(-5) || ord.id}</span>
                            <span className={`text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full border ${statusColor}`}>
                              {st === 'preparing' ? 'PACKING' : st.replace(/_/g, ' ')}
                            </span>
                          </div>

                          {Array.isArray(ord.items) && ord.items.length > 0 && (
                            <div className="text-[11px] text-stone-600 border-t border-stone-200/60 pt-1.5 space-y-0.5 font-mono">
                              {ord.items.map((it, idx) => (
                                <div key={idx} className="flex justify-between">
                                  <span>{it.qty || 1}x {it.name}</span>
                                  <span>₹{(it.unitPrice || it.price || 0) * (it.qty || 1)}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {ord.deliveryOtp && (
                            <div className="flex items-center justify-between bg-amber-100/60 p-2.5 rounded-xl text-amber-950 text-xs font-bold border border-amber-200">
                              <span>Delivery Verification OTP:</span>
                              <span className="font-mono tracking-widest text-sm bg-white px-2 py-0.5 rounded shadow-xs">{ord.deliveryOtp}</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-stone-500 font-mono text-[11px] pt-1 border-t border-stone-200/60">
                            <span>Total: ₹ {ord.total || ord.grandTotal}.00</span>
                            <span>{ord.createdAt ? new Date(ord.createdAt).toLocaleDateString() : 'Active'}</span>
                          </div>
                        </div>
                      );
                    })}

                    <div className="pt-2 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setTrackedOrders([]);
                          setTrackPhoneInput('');
                        }}
                        className="text-[11px] text-stone-500 hover:text-black underline cursor-pointer"
                      >
                        Search with different mobile number
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleTrackOrders} className="space-y-3">
                    <p className="text-xs text-stone-600">
                      Enter your 10-digit mobile number to track active and previous orders.
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="tel"
                        maxLength={10}
                        value={trackPhoneInput}
                        onChange={(e) => setTrackPhoneInput(e.target.value.replace(/\D/g, ''))}
                        placeholder="10-digit mobile number"
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
                    </div>
                  </form>
                )}

              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── WRITE A REVIEW MODAL ─────────────────────────────────── */}
      <AnimatePresence>
        {showReviewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60"
              onClick={() => setShowReviewModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative border border-stone-100 z-10"
            >
              <button
                onClick={() => setShowReviewModal(false)}
                className="absolute right-5 top-5 text-stone-400 hover:text-black p-1.5 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1 mb-6">
                <span className="text-[10px] uppercase font-bold tracking-widest text-stone-400">
                  SKYLINE • COMMUNITY FEEDBACK
                </span>
                <h3 className="text-xl font-bold text-stone-950">
                  Write a Review
                </h3>
                <p className="text-xs text-stone-500 font-light">
                  Share your experience with Skyline Outfits & tailored clothing craftsmanship.
                </p>
              </div>

              <form onSubmit={handleReviewSubmit} className="space-y-4">
                {/* Star Rating Picker */}
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-2">
                    Your Rating
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewReviewRating(star)}
                        className="p-1 cursor-pointer transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= newReviewRating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-stone-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-stone-700 ml-2">
                      {newReviewRating} / 5 Stars
                    </span>
                  </div>
                </div>

                {/* Customer Name */}
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={newReviewName}
                    onChange={(e) => setNewReviewName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full border border-stone-200 focus:border-black rounded-xl px-3.5 py-2.5 text-xs outline-none transition-colors"
                    required
                  />
                </div>

                {/* Review Comment */}
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Your Review / Experience
                  </label>
                  <textarea
                    rows={4}
                    value={newReviewComment}
                    onChange={(e) => setNewReviewComment(e.target.value)}
                    placeholder="Tell us what you liked about the material, comfort, or delivery..."
                    className="w-full border border-stone-200 focus:border-black rounded-xl p-3 text-xs outline-none transition-colors resize-none"
                    required
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(false)}
                    className="flex-1 border border-stone-200 hover:bg-stone-50 text-stone-700 py-3 rounded-xl text-xs uppercase tracking-wider font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={newReviewSubmitting}
                    className="flex-1 bg-black hover:bg-stone-800 text-white py-3 rounded-xl text-xs uppercase tracking-widest font-semibold cursor-pointer shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{newReviewSubmitting ? 'Posting...' : 'Submit Review'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Instagram-style Bottom Navigation Bar */}
      <BottomNavBar />

    </div>
  );
}
