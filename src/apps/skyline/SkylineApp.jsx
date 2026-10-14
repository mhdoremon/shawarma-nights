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
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
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
        const u = e.data.user ? sanitizeChuruOneUser(e.data.user) : null;
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
      console.log('⚡ [Skyline Realtime Event]', action, payload);
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
      showToast('✦ Skyline orders ke liye verified mobile number anivarya hai');
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
    setConfirmedOrder({
      ...(orderToConfirm || {}),
      paymentStatus: 'paid',
      status: 'confirmed'
    });
    setPendingOrder(null);
    clearCartCompletely();
    setIsUpiModalOpen(false);
    setIsCheckoutOpen(false);
    setIsCartOpen(false);
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

  // ─── HERO & TRENDING ITEMS (CLOTHES ONLY) ──────────────────────
  const heroProduct = useMemo(() => {
    const clothes = sanitizeClothesOnly(menuItems);
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
  }, [menuItems]);

  const trendingProducts = useMemo(() => {
    const clothes = sanitizeClothesOnly(menuItems);
    const candidates = clothes.filter(item => 
      item.badge === 'BESTSELLER' || 
      item.badge === 'SIGNATURE PIECE' || 
      item.badge === 'NEW ARRIVAL' ||
      item.id === 'sky-item-01' ||
      item.id === 'sky-item-03' ||
      item.id === 'sky-jean-01'
    );
    if (candidates.length >= 3) return candidates.slice(0, 3);
    return clothes.slice(0, 3);
  }, [menuItems]);

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

  // ─── ALL PRODUCTS (CLOTHES ONLY — UNIFIED CATALOG WITHOUT CATEGORY TABS) ──
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

  // Alias for backward-compatibility in JSX
  const bestSellingProducts = allClothingProducts;

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
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-950 text-white px-5 py-3 rounded-lg shadow-2xl text-xs font-medium tracking-wide flex items-center gap-2.5 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ─── FLOATING BOTTOM BAG PILL (Appears when items in bag, doesn't interrupt shopping) ─── */}
      {cartItems.length > 0 && !isCartOpen && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-sm pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-200">
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
        </div>
      )}

      {/* ─── 1. MINIMALIST HEADER / NAVBAR ────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-100 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          {/* Brand Logo: Skyline Premium */}
          <div className="flex items-center gap-6">
            <a href="/skyline" className="group flex items-center gap-2 text-stone-950 no-underline">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tighter text-black">
                Skyline
              </span>
              <span className="text-[10px] sm:text-xs font-black tracking-widest uppercase bg-stone-950 text-white px-2 py-0.5 rounded-md">
                Premium
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-black group-hover:scale-150 transition-transform"></span>
            </a>

            {/* ChuruOne Network Pill */}
            <span className="hidden xl:inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-stone-400 font-medium px-2 py-0.5 rounded-full bg-stone-50 border border-stone-100">
              Station Road, Churu • Flagship
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
          <div className="md:hidden border-t border-stone-100 bg-white px-6 py-4 space-y-3">
            <a href="#hero" onClick={() => setIsMobileMenuOpen(false)} className="block text-sm font-medium text-stone-900 py-1">Home</a>
            <a href="#trending" onClick={() => setIsMobileMenuOpen(false)} className="block text-sm font-medium text-stone-900 py-1">Shop</a>
            <a href="#bestselling" onClick={() => setIsMobileMenuOpen(false)} className="block text-sm font-medium text-stone-900 py-1">Collection</a>
            <a href="#reviews" onClick={() => setIsMobileMenuOpen(false)} className="block text-sm font-medium text-stone-900 py-1">Reviews</a>
            <a 
              href="/master?storeId=skyline"
              className="w-full text-left text-sm font-semibold text-stone-900 py-1 flex items-center gap-2"
            >
              <Store className="w-4 h-4 text-amber-600" />
              <span>Dukan OS (Merchant Console)</span>
            </a>
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
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 text-stone-800 text-xs font-mono font-bold tracking-wider uppercase">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Churu Flagship Menswear Studio
            </span>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-stone-950 tracking-tight leading-[1.05]">
              Skyline<br />
              Premium<br />
              Outfits
            </h1>
            
            <p className="text-stone-600 text-sm sm:text-base font-normal leading-relaxed max-w-md mx-auto lg:mx-0">
              Architectural luxury menswear, Italian linen shirts, pleated Gurkha trousers, Japanese selvedge denim & bespoke outfits curated in Churu.
            </p>

            <div className="pt-2 flex items-center justify-center lg:justify-start gap-4">
              <a
                href="#bestselling"
                className="inline-block bg-black text-white hover:bg-stone-800 transition-all px-8 py-3.5 rounded-md text-xs uppercase tracking-widest font-semibold shadow-md active:scale-95 no-underline cursor-pointer"
              >
                Shop Collection
              </a>
              <a
                href="#trending"
                className="inline-block bg-stone-100 text-stone-800 hover:bg-stone-200 transition-all px-6 py-3.5 rounded-md text-xs uppercase tracking-widest font-semibold active:scale-95 no-underline cursor-pointer"
              >
                Trending
              </a>
            </div>
          </div>

          {/* Right Product Showcase with "ULTIMATE" Watermark */}
          <div className="lg:col-span-7">
            <div className="relative bg-[#F6F6F6] rounded-3xl p-6 sm:p-12 overflow-hidden flex items-center justify-center min-h-[380px] sm:min-h-[480px]">
              
              {/* Giant Translucent Vertical Watermark: SKYLINE */}
              <div className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 -rotate-90 origin-center text-6xl sm:text-8xl lg:text-9xl font-black text-stone-200/90 tracking-[0.25em] select-none pointer-events-none">
                SKYLINE
              </div>

              {/* Floating Hero Clothing Showcase */}
              <div 
                onClick={() => openProductModal(heroProduct)}
                className="relative z-10 w-full max-w-md mx-auto cursor-pointer group"
              >
                <img
                  src={heroProduct.image}
                  alt={heroProduct.name}
                  className="w-full h-72 sm:h-96 object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              {/* Floating Badge / Card Below the Showcase */}
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

      {/* ─── 3. SOLID BLACK BRAND STRIP (SKYLINE LUXURY ATTRIBUTES) ─── */}
      <section className="bg-black text-white py-5 px-4 overflow-hidden select-none">
        <div className="max-w-7xl mx-auto flex items-center justify-around flex-wrap gap-8 sm:gap-14 text-center font-mono font-bold text-xs sm:text-sm uppercase tracking-widest text-stone-300">
          <span className="text-white font-extrabold tracking-wider">SKYLINE BESPOKE</span>
          <span className="text-stone-700">✦</span>
          <span>100% ITALIAN LINEN</span>
          <span className="text-stone-700">✦</span>
          <span className="text-amber-400 font-extrabold">{PHONEPE_REVIEW_MODE ? 'TAILORED CASUAL SHIRTS' : 'RAW SELVEDGE DENIM'}</span>
          <span className="text-stone-700">✦</span>
          <span>BESPOKE HANDCRAFTED TAILORING</span>
          <span className="text-stone-700">✦</span>
          <span className="text-emerald-400 font-extrabold">CHURU SAME-DAY EXPRESS</span>
        </div>
      </section>

      {/* ─── 4. OUR TRENDING CLOTHING / MOST POPULAR PRODUCTS ─────────── */}
      <section id="trending" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        
        {/* Section Tag */}
        <div className="text-center sm:text-left mb-3">
          <span className="text-xs uppercase tracking-[0.25em] font-semibold text-stone-400">
            — Our Trending Menswear Collection —
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Column: Heading, description, Explore button */}
          <div className="lg:col-span-4 space-y-4 text-center sm:text-left">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-950 tracking-tight leading-tight">
              Most Popular<br />
              Garments
            </h2>
            <p className="text-stone-500 text-xs sm:text-sm leading-relaxed max-w-sm mx-auto sm:mx-0">
              Curated luxury essentials engineered for sharp tailoring, comfort and enduring elegance in Churu.
            </p>
            <div className="pt-2">
              <a
                href="#bestselling"
                className="inline-block bg-black text-white hover:bg-stone-800 transition-colors px-6 py-2.5 rounded-md text-xs font-semibold uppercase tracking-wider cursor-pointer no-underline"
              >
                Explore All Outfits
              </a>
            </div>
          </div>

          {/* Right Column: 3 Trending Clothing Cards + Controls */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* 3-Card Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {trendingProducts.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="bg-[#F5F5F7] rounded-2xl p-5 relative group hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
                >
                  {/* Garment Image */}
                  <div 
                    onClick={() => openProductModal(item)}
                    className="h-44 sm:h-48 flex items-center justify-center cursor-pointer overflow-hidden p-2"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-md rounded-lg"
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

      {/* ─── 5. ALL PRODUCTS SECTION (CLOTHES ONLY — UNIFIED CATALOG) ─── */}
      <section id="bestselling" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 border-t border-stone-100">
        
        {/* Section Header (No Category Pills — All Outfits Displayed Together) */}
        <div className="text-center space-y-3 mb-12">
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
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-stone-100 text-stone-800 text-xs font-mono font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Showing all {bestSellingProducts.length} premium pieces</span>
          </div>
        </div>

        {/* All Products Grid (Unified Catalog) */}
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

                {/* Garment Image */}
                <div
                  onClick={() => openProductModal(product)}
                  className="h-52 sm:h-60 flex items-center justify-center my-4 cursor-pointer overflow-hidden p-2"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-md rounded-xl"
                  />
                </div>

                {/* Bottom Details & Circular Action Button */}
                <div className="flex items-end justify-between pt-2">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="space-y-3">
              <span className="text-2xl font-black text-black">Skyline Premium</span>
              <p className="text-stone-500 text-xs leading-relaxed">
                Skyline Premium Outfits. Architectural menswear and tailored clothing studio in Churu, Rajasthan.
              </p>
              <div className="flex items-center gap-2 text-stone-800 font-medium">
                <MapPin className="w-3.5 h-3.5 text-black shrink-0" />
                <span>Station Road / Subhash Chowk, Churu – 331001</span>
              </div>
            </div>

            <div className="space-y-2">
              <h5 className="font-bold text-black uppercase tracking-wider text-[11px]">Customer Care & Policies</h5>
              <button onClick={() => setIsTrackerOpen(true)} className="block hover:text-black cursor-pointer text-left">
                Track Order
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
              <a href="https://wa.me/917023963189" target="_blank" rel="noreferrer" className="block text-emerald-700 hover:text-emerald-900 font-medium pt-1">
                WhatsApp: +91 70239 63189
              </a>
            </div>

            <div className="space-y-3">
              <h5 className="font-bold text-black uppercase tracking-wider text-[11px]">Customer Account</h5>
              <p className="text-stone-500 text-xs leading-relaxed">
                Sign in to track orders, save addresses and manage your profile.
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateToChuruOneAuth('login')}
                  className="bg-black hover:bg-stone-800 text-white px-3 py-1.5 rounded-full text-[11px] font-medium cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigateToChuruOneAuth('signup')}
                  className="border border-stone-300 hover:border-black text-black px-3 py-1.5 rounded-full text-[11px] font-medium cursor-pointer"
                >
                  Sign Up
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-stone-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-stone-500 text-[11px]">
            <span>© 2026 Skyline Premium Outfits. Legal Entity: Vasudhaiva Kutumbakam Robotics.</span>
            <span>Station Road, Churu, Rajasthan - 331001. All rights reserved.</span>
          </div>
        </div>
      </footer>

      {/* ─── 8. PRODUCT QUICK VIEW MODAL ──────────────────────────── */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => { setSelectedProduct(null); setModalActiveImage(''); setModalColor(''); setModalSize(''); }} />
          
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white max-w-2xl w-full rounded-2xl shadow-2xl border border-stone-200 p-6 sm:p-8 overflow-hidden">
              
              <button
                onClick={() => { setSelectedProduct(null); setModalActiveImage(''); setModalColor(''); setModalSize(''); }}
                className="absolute right-4 top-4 text-stone-400 hover:text-black p-1 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                
                {/* Product Image Preview & Lookbook */}
                <div className="bg-[#F6F6F6] rounded-xl p-4 flex flex-col items-center justify-center">
                  <div className="h-56 flex items-center justify-center w-full">
                    <img
                      src={modalActiveImage || selectedProduct.image}
                      alt={selectedProduct.name}
                      className="max-h-full max-w-full object-contain drop-shadow-xl transition-all duration-300"
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
                    <button
                      type="button"
                      onClick={() => {
                        addToCart(selectedProduct, modalSize, modalColor);
                        setSelectedProduct(null);
                        setModalActiveImage('');
                        setModalColor('');
                        setModalSize('');
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
                      if (!currentUser || !isUserPhoneVerified) {
                        showToast('✦ Order karne ke liye verified mobile number se sign in karein');
                        setIsCartOpen(false);
                        navigateToChuruOneAuth('login');
                        return;
                      }
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
                          Verified via Mobile OTP (+91 {currentUser.phone || checkoutPhone}) ✓
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
                        OTP Verified ✓
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
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setIsAccountModalOpen(false)} />

          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white max-w-sm w-full rounded-2xl shadow-2xl border border-stone-200 p-6 sm:p-8 space-y-6">
              
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
                      <span>Phone & SSO Verified ✓ Ready for Orders</span>
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
                  SKYLINE • REAL-TIME DISPATCH
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

      {/* ─── WRITE A REVIEW MODAL ─────────────────────────────────── */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative border border-stone-100 animate-in fade-in zoom-in duration-200">
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
          </div>
        </div>
      )}

      {/* Instagram-style Bottom Navigation Bar */}
      <BottomNavBar />

    </div>
  );
}
