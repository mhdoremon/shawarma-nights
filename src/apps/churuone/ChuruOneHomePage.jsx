import React, { useState, useEffect, useRef } from 'react';
import { 
  Search,
  ShoppingBag,
  ShoppingCart,
  MapPin,
  LayoutGrid,
  Percent,
  Milk,
  Carrot,
  Croissant,
  Sandwich,
  User,
  ChevronDown,
  ArrowRight,
  Star,
  Clock,
  Plus,
  Minus,
  Trash2,
  Check,
  LogOut,
  Phone,
  Mail,
  X,
  Calendar,
  Sparkles,
  Utensils,
  Scissors,
  CheckCircle2,
  Navigation,
  CreditCard,
  QrCode,
  Tag,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Store,
  RotateCcw,
  Lock,
  Shirt,
  Footprints,
  Zap,
  LocateFixed,
  Share2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import LegalPoliciesModal from '../../components/LegalPoliciesModal';
import BottomNavBar from '../../components/BottomNavBar';
import UpiPaymentModal from '../../components/UpiPaymentModal';

import { 
  getChuruOneSession, 
  setChuruOneSession, 
  clearChuruOneSession, 
  attachSsoParams,
  sanitizeChuruOneUser,
  subscribeToChuruOneAuth
} from '../../utils/ssoHelper';
import { getStoreLiveStatus, extractStoreHours } from '../../utils/storeTimingHelper';
import { 
  CHURU_LANDMARKS, 
  calculateDistanceKm, 
  findNearestLandmark, 
  isStoreServingLocation, 
  getSavedCustomerLocation, 
  saveCustomerLocation 
} from '../../utils/geoHelper';

// Popular Churu Landmarks for Fast Accurate City Delivery
export const CHURU_POPULAR_LANDMARKS = [
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

export const FALLBACK_STORE_IMAGE = 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=600&q=80';
export const FALLBACK_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=500&q=80';

// ─── LARGE MINIMAL LINE ICONS FOR FASHION CATEGORIES ─────────────────
function CategoryLineIcon({ categoryId, className = "w-7 h-7 sm:w-8 sm:h-8" }) {
  const common = `${className} shrink-0 stroke-[1.8]`;
  switch (categoryId) {
    case 'all':
      return <Sparkles className={common} />;
    case 'food':
      return <Utensils className={common} />;
    case 'fashion':
      return <Shirt className={common} />;
    case 'salon':
      return <Scissors className={common} />;
    case 'shirts':
      return <Shirt className={common} />;
    case 'pants':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={common}>
          <path d="M5 4h14v2.5l-1.5 13.5h-4l-1.5-8-1.5 8h-4L5 6.5V4z" />
          <path d="M12 4v3" />
          <path d="M5 6.5h14" />
        </svg>
      );
    case 'jeans':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={common}>
          <path d="M5 4h14v2.5l-1.5 13.5h-4l-1.5-8-1.5 8h-4L5 6.5V4z" />
          <path d="M5 6.5h14" />
          <path d="M7 9.5c0 1.2 1.3 2 2.5 2" />
          <path d="M17 9.5c0 1.2-1.3 2-2.5 2" />
          <circle cx="12" cy="5.25" r="0.6" fill="currentColor" />
        </svg>
      );
    case 'tshirts':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={common}>
          <path d="M8 3h8l2.5 4.5-3 1.5V20H8.5V9L5.5 7.5 8 3z" />
          <path d="M10 3a2 2 0 0 0 4 0" />
        </svg>
      );
    case 'jackets':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={common}>
          <path d="M6 4h12l3 5-3 2v8a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-8L3 9l3-5z" />
          <path d="M12 4v16" />
          <path d="M6 4l6 7 6-7" />
        </svg>
      );
    case 'deals':
      return <Tag className={common} />;
    default:
      return <Sparkles className={common} />;
  }
}

// Fallback Real Stores (Shawarma Nights, Skyline Premium Outfits, Nash Studio, Gupta Kirana)
const FALLBACK_REAL_STORES = [
  {
    id: 'shawarma',
    name: 'Shawarma Nights',
    vertical: 'food',
    category: 'Charcoal Kitchen & Dining • Shawarmas, Platters & Rolls',
    rating: '4.8',
    timing: '20-25 min',
    image: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=600&q=80',
    destination: '/shawarma',
    tag: 'Food Delivery',
    isOpen: true,
    address: 'Near Subhash Chowk, Churu',
    phone: '7023963189',
    freeDeliveryThreshold: 299,
    upiId: '7023963189@fam',
    payeeName: 'Shawarma Nights Churu',
    isFlagshipBrand: true,
    isCityWide: true
  },
  {
    id: 'skyline',
    name: 'Skyline Premium Outfits',
    vertical: 'fashion',
    category: 'Luxury Menswear • Shirts, Pants, Jeans, Kurtas & Jackets',
    rating: '4.9',
    timing: 'Same Day Dispatch',
    image: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=600&q=80',
    destination: '/skyline',
    tag: 'Fashion & Outfits',
    isOpen: true,
    address: 'Station Road, Churu, Rajasthan',
    phone: '7023963189',
    freeDeliveryThreshold: 499,
    upiId: '7023963189@fam',
    payeeName: 'Skyline Premium Outfits',
    isFlagshipBrand: true,
    isCityWide: true
  },
  {
    id: 'nash-studio',
    name: 'Nash Studio',
    vertical: 'salon',
    category: 'Salon & Luxury Grooming • Haircuts, Beard & Facials',
    rating: '4.9',
    timing: '15 min slot',
    image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80',
    destination: '/nash',
    tag: 'Salon Booking',
    isOpen: true,
    address: 'Main Market, Opp. Kotwali, Churu',
    phone: '7023963189',
    freeDeliveryThreshold: 0,
    upiId: '7023963189@fam',
    payeeName: 'Nash Studio Churu',
    isFlagshipBrand: true,
    isCityWide: true
  },
  {
    id: 'gupta-kirana-nayabass',
    name: 'Gupta Kirana & Daily Needs',
    vertical: 'mohalla_kirana',
    category: 'Mohalla Kirana • Dairy, Staples, Spices & 15-Min Express',
    rating: '4.9',
    timing: '15 min express',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
    destination: '/churuone?store=gupta-kirana-nayabass',
    tag: '15 Min Express',
    isOpen: true,
    address: 'Shop No. 4, Main Market, Naya Bass, Churu',
    phone: '7023963189',
    freeDeliveryThreshold: 199,
    upiId: '7023963189@fam',
    payeeName: 'Gupta Kirana Store',
    isMohallaStore: true,
    isFlagshipBrand: false,
    mohalla: 'Naya Bass',
    nearestLandmark: 'naya_bass',
    lat: 28.2932,
    lng: 74.9620,
    radiusKm: 1.5,
    expressDeliveryMins: 15
  }
];

// API Base resolution for ChuruOne Marketplace
const CHURUONE_API_BASE = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:5000'
  : 'https://churuone-backend.onrender.com';

// Category icon resolver inspired by Lovable quick-commerce design
function getCategoryIcon(catId) {
  switch (String(catId || '').toLowerCase()) {
    case 'all': return LayoutGrid;
    case 'deals':
    case 'combos':
    case 'combo': return Percent;
    case 'grocery':
    case 'kirana':
    case 'dairy': return Milk;
    case 'food': return Sandwich;
    case 'fashion':
    case 'shirts':
    case 'pants': return Shirt;
    case 'salon': return Scissors;
    default: return Sparkles;
  }
}

export default function ChuruOneHomePage() {
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState('terms');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [toastMessage, setToastMessage] = useState('');

  // ─── HYPER-LOCAL MOHALLA & GEO STATE ─────────────────────────────
  const [marketplaceView, setMarketplaceView] = useState('mohalla'); // 'mohalla' (15-Min Express) | 'flagship' (City Brands)
  const [customerLocation, setCustomerLocation] = useState(() => getSavedCustomerLocation());
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsError, setGpsError] = useState('');

  const handleDetectGps = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }
    setIsDetectingGps(true);
    setGpsError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const nearest = findNearestLandmark(latitude, longitude);
        const newLoc = {
          landmarkId: nearest.id,
          name: nearest.name,
          lat: latitude,
          lng: longitude,
          distanceToLandmarkKm: nearest.distanceKm,
          isGpsVerified: true
        };
        setCustomerLocation(newLoc);
        saveCustomerLocation(newLoc);
        setIsDetectingGps(false);
        setIsLocationModalOpen(false);
        setToastMessage(`📍 GPS Location Verified: Near ${nearest.name}`);
        setTimeout(() => setToastMessage(''), 3000);
      },
      (err) => {
        console.warn('GPS detection failed:', err);
        setGpsError('Could not detect GPS location. Please select your nearest landmark below.');
        setIsDetectingGps(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSelectLandmark = (landmark) => {
    const newLoc = {
      landmarkId: landmark.id,
      name: landmark.name,
      lat: landmark.lat,
      lng: landmark.lng,
      isGpsVerified: false
    };
    setCustomerLocation(newLoc);
    saveCustomerLocation(newLoc);
    setIsLocationModalOpen(false);
    setToastMessage(`📍 Delivering to: ${landmark.name}`);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // ─── DYNAMIC MARKETPLACE DATA (Real Stores & Live Products Feed) ──
  const [stores, setStores] = useState(FALLBACK_REAL_STORES);
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([
    { id: 'all', name: 'All Collection' },
    { id: 'grocery', name: 'Daily & Kirana' },
    { id: 'food', name: 'Shawarma & Food' },
    { id: 'fashion', name: 'Fashion & Outfits' },
    { id: 'salon', name: 'Salon Grooming' },
    { id: 'deals', name: 'Deals & Coupons' }
  ]);
  const [deals, setDeals] = useState([]);
  const [platformData, setPlatformData] = useState(null);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);

  // ─── STORE VISIBILITY ENGINE (Managed via Backend & AI Controller) ─
  const isStoreVisible = (storeId) => {
    const clean = String(storeId || '').toLowerCase().trim();
    const st = stores.find(s => String(s.id || '').toLowerCase().trim() === clean);
    if (st && (st.marketplaceVisible === false || st.hiddenFromMarketplace === true)) return false;
    // If feed loaded and store is not in active stores list returned by backend, it's hidden
    if (!isLoadingFeed && !st) return false;
    return true;
  };

  // Clean up any legacy local storage override
  useEffect(() => {
    try {
      localStorage.removeItem('churuone_store_visibility');
    } catch {
      // ignore
    }
  }, []);

  // ─── DYNAMIC LANDMARKS & REGISTERED MOHALLA AREAS ───────────────────
  const dynamicLandmarks = useMemo(() => {
    const list = [...CHURU_LANDMARKS];
    const knownIds = new Set(list.map(l => l.id.toLowerCase()));
    const knownNames = new Set(list.map(l => l.name.toLowerCase()));

    (stores || []).forEach(s => {
      const area = (s.mohalla || s.areaName || '').trim();
      if (area && !knownNames.has(area.toLowerCase())) {
        const id = area.toLowerCase().replace(/[^a-z0-9]/g, '_');
        if (!knownIds.has(id)) {
          knownIds.add(id);
          knownNames.add(area.toLowerCase());
          list.push({
            id,
            name: area,
            lat: Number(s.lat || s.geo?.lat) || 28.2915,
            lng: Number(s.lng || s.geo?.lng) || 74.9662,
            label: `${area} (Mohalla Area)`,
            isCustomMohalla: true
          });
        }
      }
    });

    return list;
  }, [stores]);

  const dynamicPopularLandmarks = useMemo(() => {
    const names = new Set(CHURU_POPULAR_LANDMARKS);
    (stores || []).forEach(s => {
      const area = (s.mohalla || s.areaName || '').trim();
      if (area) names.add(area);
    });
    return Array.from(names);
  }, [stores]);

  // Unified ChuruOne SSO User State
  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState('');
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef(null);

  // ─── CHURUONE NATIVE CART SYSTEM (Empty initially, zero dummy data) ─
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('churuone_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('churuone_cart', JSON.stringify(cartItems));
    } catch {
      // ignore
    }
  }, [cartItems]);

  // Cart Coupon State
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');

  // ─── CHURUONE CHECKOUT MODAL STATE ───────────────────────────────
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [selectedLandmark, setSelectedLandmark] = useState('Subhash Chowk');
  const [orderNotes, setOrderNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi' (SmartPay QR) | 'cod'
  const [orderGps, setOrderGps] = useState(null);
  const [isCapturingGps, setIsCapturingGps] = useState(false);
  const [gpsStatusText, setGpsStatusText] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // ─── UNIFIED PAYMENT SYSTEM & AUTH GATING STATE ─────────────────
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);
  const [pendingPaymentData, setPendingPaymentData] = useState(null);
  const [pendingOrder, setPendingOrder] = useState(null);
  const [pendingStoreId, setPendingStoreId] = useState('shawarma');
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);
  const [authPromptTitle, setAuthPromptTitle] = useState('ChuruOne Login Required');
  const [authPromptMessage, setAuthPromptMessage] = useState('');
  const [authPromptRedirectMode, setAuthPromptRedirectMode] = useState('login');
  const [authPromptRequirePhone, setAuthPromptRequirePhone] = useState(false);

  // Computed Auth & Phone OTP Verification Status
  const cleanUserPhone = String(currentUser?.phone || currentUser?.phoneNumber || '').replace(/\D/g, '').slice(-10);
  const isUserLoggedIn = Boolean(currentUser && (currentUser.id || currentUser.phone || currentUser.email || currentUser.name));
  const isUserPhoneVerified = Boolean(
    isUserLoggedIn && 
    (currentUser.phoneVerified === true || currentUser.isPhoneAuth === true || currentUser.isPhoneVerified === true) && 
    cleanUserPhone.length === 10
  );

  const navigateToChuruOneAuth = (mode = 'login', requirePhoneOtp = false) => {
    try {
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      const phoneParam = requirePhoneOtp ? '&requirePhoneOtp=true' : '';
      window.location.href = `/auth?mode=${mode}&returnUrl=${returnUrl}${phoneParam}`;
    } catch {
      window.location.href = `/auth?mode=${mode}`;
    }
  };

  // Order Confirmation State
  const [orderSuccessData, setOrderSuccessData] = useState(null);

  // ─── NASH STUDIO SALON APPOINTMENT BOOKING SYSTEM ───────────────
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [bookingDate, setBookingDate] = useState('Today');
  const [bookingTime, setBookingTime] = useState('4:00 PM');
  const [bookingCustomerName, setBookingCustomerName] = useState('');
  const [bookingCustomerPhone, setBookingCustomerPhone] = useState('');
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [bookingOrderResult, setBookingOrderResult] = useState(null);

  // Set browser title
  useEffect(() => {
    document.title = "ChuruOne • Churu Ki Apni Digital Market";
  }, []);

  // ─── FETCH REAL MARKETPLACE FEED (CDRA-v1 Backend Algorithm) ─────
  useEffect(() => {
    let isMounted = true;
    async function loadFeed() {
      try {
        setIsLoadingFeed(true);
        const res = await fetch(`${CHURUONE_API_BASE}/api/platform/marketplace`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (isMounted && data.success) {
          if (Array.isArray(data.stores)) {
            setStores(data.stores);
          }
          if (Array.isArray(data.items)) {
            const validItems = data.items.filter(it => 
              it.category !== 'footwear' &&
              !it.id?.startsWith('slick-shoe') &&
              !/shoe|sneaker|footwear/i.test(it.name || '')
            );
            setItems(validItems);

            if (Array.isArray(data.categories) && data.categories.length > 0) {
              setCategories(data.categories);
            }
          }
          if (Array.isArray(data.deals)) {
            setDeals(data.deals);
          }
          if (data.platform) {
            setPlatformData(data.platform);
          }
        }
      } catch (err) {
        console.warn('Marketplace feed fallback loaded (local or offline mode):', err);
      } finally {
        if (isMounted) setIsLoadingFeed(false);
      }
    }
    loadFeed();
    const pollTimer = setInterval(loadFeed, 20000);
    return () => {
      isMounted = false;
      clearInterval(pollTimer);
    };
  }, []);

  // Sync SSO session on mount & subscribe to cross-app auth changes
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlUserRaw = params.get('churuone_user');
      const urlToken = params.get('churuone_token');

      if (urlUserRaw) {
        let parsed = null;
        try {
          const decoded = decodeURIComponent(urlUserRaw);
          parsed = JSON.parse(decoded.startsWith('%') ? decodeURIComponent(decoded) : decoded);
        } catch (e) {
          try { parsed = JSON.parse(urlUserRaw); } catch (e2) {}
        }

        if (parsed) {
          const sUser = sanitizeChuruOneUser(parsed);
          // Preserve full avatar from localStorage if available
          const existingSession = getChuruOneSession();
          if (existingSession?.user?.picture && (!sUser.picture || sUser.picture.includes('dicebear'))) {
            sUser.picture = existingSession.user.picture;
            sUser.photoURL = existingSession.user.photoURL || existingSession.user.picture;
          }
          setCurrentUser(sUser);
          setAuthToken(urlToken || '');
          setChuruOneSession(sUser, urlToken || '');
          if (sUser.name) {
            setBookingCustomerName(sUser.name);
            setCustomerName(sUser.name);
          }
          if (sUser.phone) {
            setBookingCustomerPhone(sUser.phone);
            setCustomerPhone(sUser.phone);
          }
        }

        params.delete('churuone_user');
        params.delete('churuone_token');
        params.delete('account_created');
        const cleanUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : '');
        window.history.replaceState({}, document.title, cleanUrl);
        return;
      }

      const session = getChuruOneSession();
      if (session && session.user) {
        const sUser = sanitizeChuruOneUser(session.user);
        setCurrentUser(sUser);
        setAuthToken(session.token || '');
        if (sUser.name) {
          setBookingCustomerName(sUser.name);
          setCustomerName(sUser.name);
        }
        if (sUser.phone) {
          setBookingCustomerPhone(sUser.phone);
          setCustomerPhone(sUser.phone);
        }
      }
    } catch (err) {
      console.warn('SSO sync warning in ChuruOneHomePage:', err);
    }

    // Cross-app reactive Single Sign-On listener
    const unsubscribeSso = subscribeToChuruOneAuth((user, token) => {
      if (user) {
        const sUser = sanitizeChuruOneUser(user);
        setCurrentUser(sUser);
        setAuthToken(token || '');
        if (sUser.name) {
          setBookingCustomerName(sUser.name);
          setCustomerName(sUser.name);
        }
        if (sUser.phone) {
          setBookingCustomerPhone(sUser.phone);
          setCustomerPhone(sUser.phone);
        }
      } else {
        setCurrentUser(null);
        setAuthToken('');
      }
    });

    return () => unsubscribeSso();
  }, []);

  // Close account dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target)) {
        setIsAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    clearChuruOneSession();
    setCurrentUser(null);
    setAuthToken('');
    setIsAccountMenuOpen(false);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const getStoreUrl = (storeId) => {
    let base = `/?storeId=${storeId}`;
    if (storeId === 'shawarma') {
      base = '/shawarma';
    } else if (storeId === 'nash-studio') {
      base = '/nash';
    } else if (storeId === 'skyline') {
      base = '/skyline';
    }

    if (currentUser) {
      return attachSsoParams(base, currentUser, authToken);
    }
    return base;
  };

  // ─── CART OPERATIONS ──────────────────────────────────────────────
  const addToCart = (product, isPreOrder = false, nextOpenTime = null) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      const rawStoreId = product.storeId || 'shawarma';
      const storeNameMap = {
        shawarma: 'Shawarma Nights',
        skyline: 'Skyline Premium Outfits',
        'nash-studio': 'Nash Studio'
      };
      return [...prev, {
        id: product.id,
        storeId: rawStoreId,
        storeName: product.storeName || storeNameMap[rawStoreId] || 'Churu Store',
        storeVertical: product.storeVertical || (rawStoreId === 'skyline' ? 'fashion' : 'food'),
        name: product.name,
        price: Number(product.price) || 0,
        mrp: Number(product.originalPrice || product.mrp) || Math.round((Number(product.price) || 0) * 1.25),
        image: product.image,
        qty: 1,
        isPreOrder,
        nextOpenTime
      }];
    });
    if (isPreOrder) {
      showToast(`Pre-order added! Will be fulfilled when store opens ${nextOpenTime ? `at ${nextOpenTime}` : 'tomorrow'}.`, 'info');
    } else {
      showToast(`Added ${product.name} to bag!`);
    }
    // Do not auto-open cart drawer: let customer shop smoothly without interruption!
  };

  const updateCartQty = (id, delta) => {
    setCartItems(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const newQty = item.qty + delta;
          return newQty > 0 ? { ...item, qty: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const removeFromCart = (id) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCartItems([]);
    setAppliedCoupon(null);
  };

  // Cart Calculations
  const cartSubtotal = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const cartMrpTotal = cartItems.reduce((sum, item) => sum + (item.mrp * item.qty), 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.qty, 0);

  // Coupon Logic
  const handleApplyCoupon = (e) => {
    e.preventDefault();
    setCouponError('');
    const cleanCode = couponInput.trim().toUpperCase();
    if (!cleanCode) return;

    if (cleanCode === 'NIGHT50' || cleanCode === 'CHURU50' || cleanCode === 'FIRSTORDER') {
      const discount = Math.min(50, Math.round(cartSubtotal * 0.2));
      setAppliedCoupon({ code: cleanCode, discount, desc: '₹50 Flat Welcome Discount' });
      showToast(`Coupon ${cleanCode} applied! Saved ₹${discount}`);
      setCouponInput('');
    } else if (cleanCode === 'FREE') {
      setAppliedCoupon({ code: cleanCode, discount: 40, desc: 'Free Delivery Bonus' });
      showToast('Coupon FREE applied!');
      setCouponInput('');
    } else {
      setCouponError('Invalid coupon code. Try NIGHT50 or CHURU50');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError('');
    showToast('Coupon removed');
  };

  const couponDiscount = appliedCoupon ? appliedCoupon.discount : 0;
  const deliveryFee = 0; // Free express delivery across Churu City
  const finalCartTotal = Math.max(0, cartSubtotal - couponDiscount + deliveryFee);
  const cartTotal = finalCartTotal;
  const totalSavings = (cartMrpTotal - cartSubtotal) + couponDiscount;

  // ─── GPS CAPTURE ENGINE ───────────────────────────────────────────
  const handleCaptureGPS = () => {
    setIsCapturingGps(true);
    setGpsStatusText('Locating via satellite...');
    if (!navigator.geolocation) {
      setGpsStatusText('GPS not supported by your browser');
      setIsCapturingGps(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = Math.round(pos.coords.accuracy);
        setOrderGps({
          lat,
          lng,
          accuracy,
          mapsUrl: `https://maps.google.com/?q=${lat},${lng}`
        });
        setGpsStatusText(`GPS Captured: ${lat.toFixed(4)}, ${lng.toFixed(4)} (±${accuracy}m)`);
        setIsCapturingGps(false);
      },
      (err) => {
        console.warn('GPS error:', err);
        setGpsStatusText('Permission denied. Please select your nearest landmark below.');
        setIsCapturingGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // ─── MULTI-STORE ORDER PLACEMENT FLOW ────────────────────────────
  const handleProceedToCheckout = () => {
    if (cartItems.length === 0) return;

    // 1. Mandatory Login Check (Bina login ke order block)
    if (!isUserLoggedIn) {
      showToast('🔒 Order karne ke liye ChuruOne account me login hona aniwarya hai.');
      setAuthPromptTitle('ChuruOne Account Login Required');
      setAuthPromptMessage('Order complete karne ke liye pehle apna ChuruOne account login karein. Aap Google ya Mobile OTP se 1-click login kar sakte hain.');
      setAuthPromptRedirectMode('login');
      setAuthPromptRequirePhone(false);
      setIsAuthPromptOpen(true);
      return;
    }

    // 2. Mandatory Phone Verification for Home Delivery Items
    if (!isUserPhoneVerified) {
      showToast('📱 Home delivery ke liye verified mobile number aniwarya hai.');
      setAuthPromptTitle('Mobile Verification Required');
      setAuthPromptMessage('Churu City home delivery dispatch aur rider direct verification ke liye aapka mobile number OTP verified hona aniwarya hai.');
      setAuthPromptRedirectMode('verify_phone');
      setAuthPromptRequirePhone(true);
      setIsAuthPromptOpen(true);
      return;
    }

    setIsCartOpen(false);
    setIsCheckoutModalOpen(true);
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    // 1. Strict Login Check
    if (!isUserLoggedIn) {
      showToast('🔒 Order place karne ke liye ChuruOne account login hona aniwarya hai.');
      setIsCheckoutModalOpen(false);
      navigateToChuruOneAuth('login');
      return;
    }

    // 2. Strict Phone Verification Check for Home Delivery
    if (!isUserPhoneVerified) {
      showToast('📱 Home delivery orders ke liye mobile number OTP verify hona aniwarya hai.');
      setIsCheckoutModalOpen(false);
      navigateToChuruOneAuth('verify_phone', true);
      return;
    }

    if (!customerName.trim()) {
      showToast('Please enter your full name');
      return;
    }
    const cleanPhone = customerPhone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      showToast('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!deliveryAddress.trim() && !selectedLandmark) {
      showToast('Please enter your street address or landmark');
      return;
    }

    setIsSubmittingOrder(true);
    try {
      // Group items by store for accurate multi-store order dispatch
      const itemsByStore = {};
      cartItems.forEach(item => {
        const sId = item.storeId || 'shawarma';
        if (!itemsByStore[sId]) itemsByStore[sId] = [];
        itemsByStore[sId].push(item);
      });

      const orderResults = [];

      for (const [storeId, storeItems] of Object.entries(itemsByStore)) {
        const storeSubtotal = storeItems.reduce((sum, it) => sum + (it.price * it.qty), 0);
        const storeDiscount = appliedCoupon ? Math.round(couponDiscount * (storeSubtotal / (cartSubtotal || 1))) : 0;
        const storeTotal = Math.max(0, storeSubtotal - storeDiscount);

        const fullAddress = `${deliveryAddress ? deliveryAddress + ' • ' : ''}Near ${selectedLandmark}, Churu, Rajasthan`;

        const isOnline = paymentMethod === 'upi';
        const payload = {
          storeId,
          customer: {
            name: customerName.trim(),
            phone: `+91${cleanPhone}`,
            email: currentUser?.email || ''
          },
          customerName: customerName.trim(),
          customerPhone: `+91${cleanPhone}`,
          phoneVerified: isUserPhoneVerified,
          authenticated: isUserLoggedIn,
          customerToken: authToken || currentUser?.token || '',
          items: storeItems.map(it => ({
            id: it.id,
            name: it.name,
            price: it.price,
            unitPrice: it.price,
            qty: it.qty,
            image: it.image
          })),
          deliveryType: 'delivery',
          address: fullAddress,
          landmark: selectedLandmark,
          orderGps,
          lat: orderGps?.lat,
          lng: orderGps?.lng,
          paymentMethod: isOnline ? 'upi' : 'cod',
          paymentStatus: isOnline ? 'pending_upi' : 'pending',
          status: isOnline ? 'payment_pending' : 'confirmed',
          couponCode: appliedCoupon?.code || null,
          channel: 'churuone',
          fromChuruOne: true,
          discount: storeDiscount,
          subtotal: storeSubtotal,
          total: storeTotal,
          totalPrice: storeTotal,
          notes: orderNotes ? orderNotes.trim() : ''
        };

        const res = await fetch(`/api/orders?storeId=${storeId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-store-id': storeId,
            ...(authToken ? { 'x-auth-token': authToken } : {})
          },
          body: JSON.stringify(payload)
        });

        const data = await res.json().catch(() => ({}));
        if (data.success && data.order) {
          orderResults.push({ storeId, order: data.order });
        } else if (res.status === 401 || data.requireAuth) {
          showToast('🔒 Order karne ke liye login aniwarya hai');
          setIsCheckoutModalOpen(false);
          navigateToChuruOneAuth('login');
          return;
        } else if (res.status === 403 || data.requirePhoneOtp) {
          showToast('📱 Home delivery ke liye verified phone number aniwarya hai');
          setIsCheckoutModalOpen(false);
          navigateToChuruOneAuth('verify_phone', true);
          return;
        } else {
          // Fallback order creation
          orderResults.push({
            storeId,
            order: {
              id: `ORD-${Date.now().toString().slice(-6)}`,
              orderNumber: `CHURU-${Math.floor(1000 + Math.random() * 9000)}`,
              total: storeTotal,
              status: isOnline ? 'payment_pending' : 'confirmed',
              paymentStatus: isOnline ? 'pending_upi' : 'pending',
              customer: { name: customerName, phone: cleanPhone }
            }
          });
        }
      }

      const primaryStoreResult = orderResults[0] || {};
      const primaryOrder = primaryStoreResult.order || {};
      const primaryStoreId = primaryStoreResult.storeId || 'shawarma';
      const primaryStore = stores.find(s => s.id === primaryStoreId) || {};

      // ─── IF CASH ON DELIVERY (COD) ───
      if (paymentMethod === 'cod') {
        setOrderSuccessData({
          orderNumber: primaryOrder.orderNumber || primaryOrder.id || 'CHURU-SUCCESS',
          ordersCount: orderResults.length,
          itemsCount: cartCount,
          totalAmount: finalCartTotal,
          paymentMethod: 'Cash on Delivery (COD)',
          paymentStatus: 'Pending (Cash to Rider)',
          customerName: customerName.trim(),
          customerPhone: cleanPhone,
          address: `${deliveryAddress ? deliveryAddress + ', ' : ''}Near ${selectedLandmark}, Churu`,
          estimatedTime: '20-30 Mins Express Dispatch'
        });

        clearCart();
        setIsCheckoutModalOpen(false);
        showToast('Order placed successfully via Cash on Delivery!');
      } else {
        // ─── IF INSTANT UPI / SMARTPAY (UNIFIED PAYMENT SYSTEM) ───
        // DO NOT confirm order yet! Open Unified UpiPaymentModal Engine!
        const upiPayload = {
          orderId: primaryOrder.orderNumber || primaryOrder.id || `CHURU-${Date.now().toString().slice(-6)}`,
          id: primaryOrder.id || primaryOrder.orderNumber,
          storeId: primaryStoreId,
          storeName: primaryStore.name || 'ChuruOne Marketplace',
          grandTotal: finalCartTotal,
          total: finalCartTotal,
          upiId: primaryStore.upiId || '7023963189@fam',
          payeeName: primaryStore.payeeName || primaryStore.name || 'ChuruOne Marketplace',
          customerName: customerName.trim(),
          customerPhone: `+91 ${cleanPhone}`,
          address: `${deliveryAddress ? deliveryAddress + ' • ' : ''}Near ${selectedLandmark}, Churu`,
          orderGps,
          items: cartItems
        };

        setPendingPaymentData(upiPayload);
        setPendingOrder(primaryOrder);
        setPendingStoreId(primaryStoreId);
        setIsCheckoutModalOpen(false);
        setIsUpiModalOpen(true);
      }
    } catch (err) {
      console.error('Order placement error:', err);
      showToast('Server issue. Kripya punah prayas karein.');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // ─── UPI MODAL PAYMENT SUCCESS CALLBACK ───────────────────────────
  const handlePaymentSuccess = async (paymentResult) => {
    const orderToConfirm = pendingOrder;
    try {
      if (orderToConfirm?.id) {
        const sId = pendingStoreId || 'shawarma';
        await fetch('/api/orders/update-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-store-id': sId,
            ...(authToken ? { 'x-auth-token': authToken } : {})
          },
          body: JSON.stringify({
            orderId: orderToConfirm.id,
            status: 'confirmed',
            paymentStatus: 'paid',
            storeId: sId,
            utr: paymentResult?.utr || null
          })
        }).catch(() => {});
      }
    } catch (e) {
      console.warn('Order status update error:', e);
    }

    const cleanPhone = (customerPhone || currentUser?.phone || '').replace(/\D/g, '').slice(-10);
    setOrderSuccessData({
      orderNumber: orderToConfirm?.orderNumber || orderToConfirm?.id || pendingPaymentData?.orderId || 'CHURU-SUCCESS',
      ordersCount: 1,
      itemsCount: cartCount,
      totalAmount: finalCartTotal,
      paymentMethod: 'Instant UPI (Auto-Paid ✓)',
      paymentStatus: 'PAID',
      customerName: customerName.trim() || currentUser?.name || 'Customer',
      customerPhone: cleanPhone,
      address: `${deliveryAddress ? deliveryAddress + ', ' : ''}Near ${selectedLandmark}, Churu`,
      estimatedTime: '20-30 Mins Express Dispatch'
    });

    clearCart();
    setIsUpiModalOpen(false);
    setPendingPaymentData(null);
    setPendingOrder(null);
    showToast('Payment verified successfully! Order confirmed.');
  };

  // ─── SALON BOOKING HANDLERS (Nash Studio) ─────────────────────────
  const openBookingModal = (service) => {
    // 1. Mandatory Login Check (Bina login ke booking allow nahi)
    if (!isUserLoggedIn) {
      showToast('🔒 Salon appointment book karne ke liye pehle login karein.');
      setAuthPromptTitle('Login Required for Salon Booking');
      setAuthPromptMessage('Nash Studio me appointment slot reserve karne ke liye pehle apna ChuruOne account login karein.');
      setAuthPromptRedirectMode('login');
      setAuthPromptRequirePhone(false);
      setIsAuthPromptOpen(true);
      return;
    }

    setSelectedService(service);
    setBookingConfirmed(false);
    setBookingOrderResult(null);
    if (currentUser?.name && !bookingCustomerName) setBookingCustomerName(currentUser.name);
    if (currentUser?.phone && !bookingCustomerPhone) setBookingCustomerPhone(currentUser.phone);
    setIsBookingModalOpen(true);
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();

    // 1. Strict Login Check
    if (!isUserLoggedIn) {
      showToast('🔒 Appointment book karne ke liye pehle login karein.');
      setIsBookingModalOpen(false);
      navigateToChuruOneAuth('login');
      return;
    }

    if (!bookingCustomerName.trim() || !bookingCustomerPhone.trim()) {
      showToast('Please enter your name and phone number');
      return;
    }
    const cleanPhone = bookingCustomerPhone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      showToast('Please enter a valid 10-digit mobile number');
      return;
    }

    // NOTE: For Salon Booking, phone verification is NOT mandatory! (As instructed: "aur booking wale me no. verification jruri nhi")
    try {
      const res = await fetch('/api/orders?storeId=nash-studio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': 'nash-studio',
          ...(authToken ? { 'x-auth-token': authToken } : {})
        },
        body: JSON.stringify({
          storeId: 'nash-studio',
          channel: 'churuone',
          fromChuruOne: true,
          customer: { name: bookingCustomerName.trim(), phone: `+91${cleanPhone}` },
          customerName: bookingCustomerName.trim(),
          customerPhone: `+91${cleanPhone}`,
          phoneVerified: false, // NOT mandatory for bookings
          authenticated: isUserLoggedIn,
          customerToken: authToken || currentUser?.token || '',
          items: [{
            id: selectedService.id,
            name: selectedService.name,
            price: selectedService.price,
            unitPrice: selectedService.price,
            qty: 1,
            durationMinutes: selectedService.durationMinutes || 30
          }],
          deliveryType: 'booking',
          dateISO: new Date().toISOString().split('T')[0],
          timeSlot: `${bookingDate} at ${bookingTime}`,
          total: selectedService.price,
          totalPrice: selectedService.price,
          paymentMethod: 'pay_at_salon'
        })
      });
      const data = await res.json().catch(() => ({}));
      setBookingOrderResult(data.order || { orderNumber: `NASH-${Math.floor(1000 + Math.random() * 9000)}` });
    } catch {
      setBookingOrderResult({ orderNumber: `NASH-${Math.floor(1000 + Math.random() * 9000)}` });
    }

    setBookingConfirmed(true);
  };

  // ─── FILTERING LOGIC (Mohalla Geo-Isolation & Flagship Dual Engine) ──
  const servingMohallaStores = (stores || []).filter(s => {
    const sId = String(s.id || '').toLowerCase().trim();
    if (!isStoreVisible(sId)) return false;

    // Flagship brands are exempt from radius and handled in Flagship view
    const isFlagship = Boolean(
      s.isFlagshipBrand || 
      s.isCityWide || 
      ['shawarma', 'skyline', 'nash-studio'].includes(sId)
    );
    if (isFlagship) return false;

    const serveRes = isStoreServingLocation(s, customerLocation?.lat, customerLocation?.lng, customerLocation?.landmarkId);
    return serveRes.serving === true;
  }).map(s => {
    const dist = s.lat && s.lng && customerLocation?.lat && customerLocation?.lng
      ? calculateDistanceKm(customerLocation.lat, customerLocation.lng, s.lat, s.lng)
      : (s.radiusKm || 1.2);
    return { ...s, calculatedDistanceKm: dist };
  });

  const servingMohallaStoreIds = new Set(servingMohallaStores.map(s => String(s.id || '').toLowerCase().trim()));

  const filteredStores = (stores || []).filter(s => {
    const sId = String(s.id || '').toLowerCase().trim();
    if (!isStoreVisible(sId)) return false;

    const isFlagship = Boolean(
      s.isFlagshipBrand || 
      s.isCityWide || 
      ['shawarma', 'skyline', 'nash-studio'].includes(sId)
    );

    if (marketplaceView === 'flagship') {
      if (!isFlagship) return false;
    } else {
      // In Mohalla view: show only mohalla stores serving customer radius
      if (isFlagship) return false;
      if (!servingMohallaStoreIds.has(sId)) return false;
    }

    const q = searchQuery.toLowerCase().trim();
    const matchQuery = !q || 
      s.name.toLowerCase().includes(q) || 
      (s.category && s.category.toLowerCase().includes(q)) ||
      (s.mohalla && s.mohalla.toLowerCase().includes(q));
    return matchQuery;
  }).map(s => {
    if (marketplaceView === 'mohalla') {
      const found = servingMohallaStores.find(ms => String(ms.id || '').toLowerCase().trim() === String(s.id || '').toLowerCase().trim());
      return found || s;
    }
    return s;
  });

  const filteredItems = (items || []).filter(item => {
    const sId = String(item.storeId || '').toLowerCase().trim();
    if (!isStoreVisible(sId)) return false;

    const isFlagshipItem = ['shawarma', 'skyline', 'nash-studio'].includes(sId);
    if (marketplaceView === 'flagship') {
      if (!isFlagshipItem && item.isMohallaProduct) return false;
    } else {
      // In Mohalla view: only show mohalla store items or daily essentials
      if (isFlagshipItem) return false;
      if (item.storeId && !servingMohallaStoreIds.has(sId)) return false;
    }

    // Multi-vertical category matching (handles grocery, combos, food, fashion, salon, and granular categories)
    let matchCat = true;
    if (selectedCategory === 'all') {
      matchCat = true;
    } else if (selectedCategory === 'deals') {
      matchCat = (item.originalPrice || 0) > item.price;
    } else if (selectedCategory === 'combos') {
      matchCat = Boolean(item.isCombo || item.category === 'combos');
    } else if (selectedCategory === 'grocery' || selectedCategory === 'kirana' || selectedCategory === 'daily') {
      matchCat = item.category === 'grocery' || item.isMohallaProduct || 
        ['dairy', 'bakery', 'staples', 'oil & ghee', 'spices', 'snacks', 'beverages', 'hygiene'].includes(item.category) || 
        ['dairy', 'bakery', 'staples', 'oil & ghee', 'spices', 'snacks', 'beverages', 'hygiene'].includes(item.subCategory);
    } else if (selectedCategory === 'food') {
      matchCat = item.storeVertical === 'food' || item.category === 'food' || ['shawarmas', 'platters', 'fries'].includes(item.category);
    } else if (selectedCategory === 'fashion') {
      matchCat = item.storeVertical === 'fashion' || item.category === 'fashion' || ['shirts', 'pants', 'jeans', 'tshirts', 'jackets'].includes(item.category);
    } else if (selectedCategory === 'salon') {
      matchCat = item.storeVertical === 'salon' || item.category === 'salon';
    } else {
      matchCat = item.category === selectedCategory;
    }

    const q = searchQuery.toLowerCase().trim();
    const matchQuery = !q || 
      item.name.toLowerCase().includes(q) || 
      (item.category && item.category.toLowerCase().includes(q)) ||
      (item.storeName && item.storeName.toLowerCase().includes(q)) ||
      (item.description && item.description.toLowerCase().includes(q));
    return matchCat && matchQuery;
  });

  // Extract all high-value combos for the featured showcase
  const comboItems = (items || []).filter(item => {
    const sId = String(item.storeId || '').toLowerCase().trim();
    if (!isStoreVisible(sId)) return false;
    return item.isCombo || item.category === 'combos';
  });

  // ─── CALCULATED DYNAMIC DELIVERY TIME & BRAND NAME ──────────────
  const nearestMohallaStore = servingMohallaStores[0] || null;
  const calculatedDistanceKm = nearestMohallaStore?.calculatedDistanceKm ?? 0.8;
  
  // High-precision Urban ETA: 6 mins packing + 4 mins per km (assuming ~15 km/h urban speed in Churu)
  const dynamicDeliveryMins = marketplaceView === 'mohalla'
    ? Math.max(10, Math.min(25, Math.round(6 + (calculatedDistanceKm * 4))))
    : 25;

  const brandName = platformData?.branding?.heroTitle || platformData?.settings?.storeName || platformData?.name || 'ChuruOne';

  return (
    <div className="w-full min-h-screen bg-[#f9faf9] font-sans text-stone-900 antialiased selection:bg-emerald-900 selection:text-white">
      
      {/* ─── LOVABLE EMERALD QUICK-COMMERCE HERO HEADER ─────────────── */}
      <header className="relative w-full overflow-hidden rounded-b-[2rem] md:rounded-b-3xl bg-gradient-to-br from-[#165b40] via-[#124d35] to-[#0c3826] px-4 sm:px-8 lg:px-12 xl:px-16 pb-6 pt-5 md:pb-8 md:pt-7 text-white shadow-lg">
        {/* Ambient Warm Golden Glow Circles */}
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-20 h-48 w-48 rounded-full bg-emerald-400/10 blur-3xl" />

        <div className="w-full max-w-6xl mx-auto">
          <div className="relative flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-amber-300">
                <Zap className="h-3.5 w-3.5 fill-current text-amber-300" />
                <span>{dynamicDeliveryMins} MIN DELIVERY</span>
              </div>
              
              {/* Clickable Address / Mohalla Location Picker */}
              <button 
                type="button"
                onClick={() => setIsLocationModalOpen(true)}
                className="mt-1.5 flex items-center gap-1.5 font-black text-2xl md:text-3xl font-display leading-tight text-white hover:text-amber-200 transition-colors cursor-pointer text-left"
                title="Click to detect GPS or change area"
              >
                <span>{customerLocation?.name || 'Subhash Chowk'}</span>
                <ChevronDown className="h-5 w-5 opacity-70 shrink-0" />
              </button>

              <div className="mt-0.5 flex items-center gap-1 text-xs text-emerald-100/80 font-medium">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-300" />
                <span>{brandName}, Churu</span>
              </div>
            </div>

            {/* Right: Cart Button with Golden Badge */}
            <button 
              type="button"
              onClick={() => setIsCartOpen(true)}
              aria-label="Cart" 
              className="relative grid h-12 w-12 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/15 backdrop-blur-md hover:bg-white/20 active:scale-95 transition-all cursor-pointer shadow-sm"
            >
              <ShoppingBag className="h-5 w-5 text-white" />
              {cartCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-amber-400 px-1 text-[11px] font-black text-stone-950 shadow-md">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

          {/* Search Bar + Switcher container */}
          <div className="w-full">
            {/* Search Bar */}
            <label className="relative mt-5 flex items-center gap-3 rounded-2xl bg-white px-4 py-3.5 text-stone-900 shadow-sm ring-1 ring-black/5 hover:ring-black/10 focus-within:ring-2 focus-within:ring-emerald-400 transition-all cursor-text">
              <Search className="h-5 w-5 text-stone-400 shrink-0" />
              <input 
                type="text"
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                placeholder="Search milk, atta, bread, shawarma…" 
                className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-stone-400 text-stone-950" 
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </label>

            {/* 2-Way Switcher: Mohalla Express vs City Brands */}
            <div className="relative mt-4 grid grid-cols-2 gap-1.5 rounded-2xl bg-white/10 p-1.5 ring-1 ring-white/15 backdrop-blur-sm">
              <button
                type="button"
                onClick={() => {
                  setMarketplaceView('mohalla');
                  setSelectedCategory('all');
                }}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all cursor-pointer ${
                  marketplaceView === 'mohalla' 
                    ? 'bg-white text-stone-950 shadow-md font-black' 
                    : 'text-white/80 hover:text-white hover:bg-white/5'
                }`}
              >
                <Store className={`h-4 w-4 shrink-0 ${marketplaceView === 'mohalla' ? 'text-emerald-700' : 'text-emerald-200'}`} />
                <span className="leading-tight">
                  <span className="block text-[13px] font-bold">Mohalla Express</span>
                  <span className="block text-[11px] opacity-70 font-mono">{calculatedDistanceKm} km</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMarketplaceView('flagship');
                  setSelectedCategory('all');
                }}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all cursor-pointer ${
                  marketplaceView === 'flagship' 
                    ? 'bg-white text-stone-950 shadow-md font-black' 
                    : 'text-white/80 hover:text-white hover:bg-white/5'
                }`}
              >
                <Sparkles className={`h-4 w-4 shrink-0 ${marketplaceView === 'flagship' ? 'text-amber-600' : 'text-amber-200'}`} />
                <span className="leading-tight">
                  <span className="block text-[13px] font-bold">City Brands</span>
                  <span className="block text-[11px] opacity-70 font-mono">City-wide</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ─── LOVABLE SPLIT BODY: LEFT SIDEBAR CATEGORIES + MAIN CATALOG ── */}
      <div className="w-full max-w-full flex gap-2 sm:gap-4 lg:gap-6 pb-32 pt-4 px-2 sm:px-6 lg:px-8 xl:px-12">
        
        {/* Left Sticky Vertical Category Rail */}
        <aside className="no-scrollbar sticky top-4 h-[calc(100vh-2rem)] w-[72px] sm:w-[78px] shrink-0 overflow-y-auto pl-1">
          <nav className="flex flex-col gap-1.5 sm:gap-2">
            {categories.map((c) => {
              const active = selectedCategory === c.id;
              const IconComp = getCategoryIcon(c.id);
              const cleanName = (c.name || '').replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();

              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(c.id);
                    const el = document.getElementById('catalog-grid');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`relative flex flex-col items-center gap-1.5 rounded-2xl py-2.5 sm:py-3 px-1 text-[11px] font-bold transition-all cursor-pointer ${
                    active 
                      ? 'bg-white text-emerald-800 shadow-sm border border-stone-200/80 scale-[1.02]' 
                      : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-emerald-600" />
                  )}
                  <span className={`grid h-10 w-10 place-items-center rounded-xl transition-colors ${
                    active 
                      ? 'bg-emerald-700 text-white shadow-xs' 
                      : 'bg-stone-100 text-stone-600'
                  }`}>
                    <IconComp className="h-5 w-5" />
                  </span>
                  <span className="truncate max-w-[65px] text-center leading-tight">
                    {cleanName}
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Right Main Catalog Area */}
        <main className="flex-1 pr-1 sm:pr-2 space-y-4">
          
          {/* Active Category Header + Item Count */}
          <div className="flex items-baseline justify-between pt-1">
            <h1 className="font-black text-xl text-stone-950 tracking-tight font-display">
              {selectedCategory === 'all' 
                ? (marketplaceView === 'mohalla' ? 'Mohalla Essentials' : 'City Brands') 
                : (categories.find((c) => c.id === selectedCategory)?.name || 'Products')}
            </h1>
            <span className="text-xs text-stone-400 font-mono">
              {filteredItems.length} items
            </span>
          </div>

          {/* In City Brands View: Show 3 Flagship Store Cards Strip */}
          {marketplaceView === 'flagship' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pb-2">
              {[
                { id: 'shawarma', name: 'Shawarma Nights', category: 'Charcoal Kitchen & Dining', timing: '20-25 mins', url: getStoreUrl('shawarma'), tag: 'Food Delivery' },
                { id: 'skyline', name: 'Skyline Outfits', category: 'Luxury Menswear & Outfits', timing: 'Same Day Dispatch', url: getStoreUrl('skyline'), tag: 'Bespoke Apparel' },
                { id: 'nash-studio', name: 'Nash Studio', category: 'Salon & Grooming Services', timing: '15 min slot', url: getStoreUrl('nash-studio'), tag: 'Salon Booking' }
              ].map(store => (
                <a
                  key={store.id}
                  href={store.url}
                  className="bg-white hover:bg-stone-50 rounded-2xl p-3 border border-stone-200/80 shadow-2xs transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                      {store.tag}
                    </span>
                    <h4 className="font-extrabold text-xs sm:text-sm text-stone-950 group-hover:text-emerald-700 transition-colors">
                      {store.name}
                    </h4>
                    <p className="text-[10px] text-stone-500">
                      {store.category}
                    </p>
                  </div>
                  <div className="text-stone-400 group-hover:text-stone-950 transition-colors p-1">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </a>
              ))}
            </div>
          )}

          {/* In Mohalla View: Notice or Referral if unserved */}
          {marketplaceView === 'mohalla' && servingMohallaStores.length === 0 && (
            <div className="bg-white rounded-2xl p-6 border border-amber-200 text-center space-y-3 shadow-2xs my-2">
              <div className="w-12 h-12 bg-amber-50 text-amber-700 rounded-xl flex items-center justify-center mx-auto">
                <Store className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-stone-900">
                  Aapke Mohalle ({customerLocation?.name || 'Churu'}) me abhi dukan live nahi hai
                </h3>
                <p className="text-xs text-stone-500 max-w-md mx-auto">
                  Apne paas ke kirana ya daily needs wale dukandar ko ChuruOne se jodein aur apne area me 15-min express delivery shuru karein.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `Namaste! ChuruOne par apne mohalle ${customerLocation?.name} ki dukan register karein aur 15 minute express delivery shuru karein: https://churuone.in/master/auth`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>WhatsApp par Dukandar ko Jodein</span>
                </a>
                <button
                  type="button"
                  onClick={() => setIsLocationModalOpen(true)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs cursor-pointer transition-colors"
                >
                  Dusra Area Chunein
                </button>
              </div>
            </div>
          )}

          {/* Product Cards Grid with Lovable Card Style & Stepper */}
          <div id="catalog-grid" className="grid grid-cols-2 gap-2.5 sm:gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 3xl:grid-cols-8">
            {isLoadingFeed && items.length === 0 ? (
              [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                <div key={n} className="flex flex-col rounded-2xl bg-white p-2 shadow-2xs border border-stone-200 animate-pulse space-y-2">
                  <div className="aspect-square w-full rounded-xl bg-stone-100" />
                  <div className="h-3 bg-stone-100 rounded w-1/2" />
                  <div className="h-4 bg-stone-100 rounded w-3/4" />
                  <div className="h-8 bg-stone-100 rounded-xl w-full" />
                </div>
              ))
            ) : filteredItems.length === 0 ? (
              <div className="col-span-full p-10 text-center bg-white rounded-2xl border border-stone-200 space-y-2">
                <ShoppingBag className="w-8 h-8 text-stone-300 mx-auto" />
                <h4 className="font-bold text-sm text-stone-800">No products match your filter</h4>
                <p className="text-xs text-stone-400">Try changing search query or category</p>
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                  className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                >
                  Reset filters
                </button>
              </div>
            ) : (
              filteredItems.map((p) => {
                const cartEntry = cartItems.find(ci => ci.id === p.id);
                const n = cartEntry ? cartEntry.qty : 0;
                const hasDiscount = p.originalPrice && p.originalPrice > p.price;
                const discountAmount = hasDiscount ? p.originalPrice - p.price : 0;

                return (
                  <article key={p.id} className="flex flex-col rounded-2xl bg-white p-2 shadow-sm border border-stone-200/80 hover:shadow-md transition-shadow">
                    <div className="relative overflow-hidden rounded-xl bg-stone-100">
                      <img 
                        src={p.image || FALLBACK_PRODUCT_IMAGE} 
                        alt={p.name} 
                        loading="lazy" 
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_PRODUCT_IMAGE; }}
                        className="aspect-square w-full object-cover group-hover:scale-104 transition-transform duration-300" 
                      />
                      {hasDiscount && (
                        <span className="absolute left-1.5 top-1.5 rounded-md bg-emerald-700 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-2xs">
                          ₹{discountAmount} off
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-1 flex-col px-1 pt-2">
                      <span className="text-[11px] text-stone-400 font-medium">{p.unit || ''}</span>
                      <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug text-stone-900">{p.name}</h3>
                      
                      <div className="mt-auto flex items-end justify-between pt-2">
                        <div className="leading-none">
                          <div className="font-display text-base font-bold text-stone-950">₹{p.price}</div>
                          {hasDiscount && (
                            <div className="mt-0.5 text-[11px] text-stone-400 line-through">₹{p.originalPrice}</div>
                          )}
                        </div>

                        {p.type === 'service' ? (
                          <button 
                            type="button" 
                            onClick={() => openBookingModal(p)} 
                            className="h-8 px-2.5 rounded-xl bg-stone-900 text-white font-bold text-xs flex items-center gap-1 active:scale-95 transition cursor-pointer"
                          >
                            <Scissors className="h-3.5 w-3.5" /> Book
                          </button>
                        ) : n === 0 ? (
                          <button 
                            type="button" 
                            onClick={() => addToCart(p)} 
                            aria-label="Add"
                            className="grid h-8 w-8 place-items-center rounded-xl border border-emerald-600/30 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition active:scale-90 shadow-2xs cursor-pointer"
                          >
                            <Plus className="h-4 w-4 stroke-[2.5]" />
                          </button>
                        ) : (
                          <div className="flex h-8 items-center rounded-xl bg-emerald-700 text-white shadow-2xs px-0.5">
                            <button type="button" onClick={() => updateCartQty(p.id, -1)} aria-label="Remove" className="px-1.5 hover:opacity-80 cursor-pointer">
                              <Minus className="h-3.5 w-3.5 stroke-[2.5]" />
                            </button>
                            <span className="w-4 text-center text-xs font-bold font-mono">{n}</span>
                            <button type="button" onClick={() => updateCartQty(p.id, 1)} aria-label="Add more" className="px-1.5 hover:opacity-80 cursor-pointer">
                              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </main>
      </div>

      {/* ─── CHURUONE SLIDE-OVER BAG / CART DRAWER ────────────────── */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            />

            {/* Slide-out Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-w-md bg-white h-full shadow-2xl z-10 flex flex-col justify-between"
            >
              {/* Drawer Header */}
              <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-stone-950" />
                  <h3 className="font-extrabold text-base text-stone-950">
                    Your ChuruOne Bag
                  </h3>
                  <span className="bg-stone-950 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                    {cartCount}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {cartItems.length > 0 && (
                    <button
                      type="button"
                      onClick={clearCart}
                      className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 px-2 py-1"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsCartOpen(false)}
                    className="p-1.5 rounded-full hover:bg-stone-200 text-stone-600 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {cartItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-16">
                    <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
                      <ShoppingBag className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-stone-900 text-base">Your Bag is Empty</h4>
                      <p className="text-xs text-stone-500 max-w-xs">
                        Browse shirts, pants, jeans and jackets from Skyline Outfits and tap Add to place items in your bag.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCartOpen(false)}
                      className="bg-stone-950 text-white text-xs font-bold py-2.5 px-5 rounded-xl cursor-pointer"
                    >
                      Start Shopping
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Free City Delivery Progress Indicator */}
                    <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs flex items-center gap-2 text-emerald-900 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>Free Express Delivery across Churu City unlocked!</span>
                    </div>

                    {/* Cart Items List */}
                    <div className="space-y-3">
                      {cartItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3.5 p-3 rounded-2xl border border-stone-200 bg-stone-50/50 hover:bg-stone-50 transition-colors"
                        >
                          <img
                            src={item.image || FALLBACK_PRODUCT_IMAGE}
                            alt=""
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
                            }}
                            className="w-14 h-14 rounded-xl object-cover bg-stone-200 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-800 block truncate">
                              {item.storeName}
                            </span>
                            <h4 className="font-bold text-xs text-stone-950 truncate">
                              {item.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="font-black text-xs text-stone-950">
                                ₹{item.price}
                              </span>
                              {item.mrp && item.mrp > item.price && (
                                <span className="text-[10px] text-stone-400 line-through">
                                  ₹{item.mrp}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Stepper (+ / -) */}
                          <div className="flex items-center gap-1.5 bg-white border border-stone-200 rounded-xl p-1 shadow-2xs">
                            <button
                              type="button"
                              onClick={() => updateCartQty(item.id, -1)}
                              className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-stone-100 text-stone-600 transition-colors cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-black text-xs text-stone-950 px-1 font-mono">
                              {item.qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateCartQty(item.id, 1)}
                              className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-stone-100 text-stone-600 transition-colors cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            className="text-stone-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Promo Coupon Section */}
                    <div className="pt-2">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1.5 flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5 text-stone-600" />
                        Apply Coupon Voucher
                      </div>
                      {appliedCoupon ? (
                        <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-xl">
                          <div>
                            <div className="font-bold text-xs text-amber-900 flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              {appliedCoupon.code} applied!
                            </div>
                            <span className="text-[10px] text-amber-700">
                              {appliedCoupon.desc} (-₹{appliedCoupon.discount})
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveCoupon}
                            className="text-xs font-bold text-rose-600 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={handleApplyCoupon} className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Try NIGHT50 or CHURU50"
                            value={couponInput}
                            onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                            className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-mono uppercase text-stone-900 outline-none focus:border-stone-950"
                          />
                          <button
                            type="submit"
                            className="bg-stone-950 hover:bg-black text-white px-4 py-2 rounded-xl text-xs font-bold uppercase cursor-pointer"
                          >
                            Apply
                          </button>
                        </form>
                      )}
                      {couponError && (
                        <p className="text-[11px] text-rose-600 font-medium mt-1">
                          {couponError}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Cart Footer & Checkout Button */}
              {cartItems.length > 0 && (
                <div className="p-5 border-t border-stone-200 bg-stone-50 space-y-3">
                  <div className="space-y-1.5 text-xs text-stone-600 font-medium">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-semibold text-stone-900 font-mono">₹{cartSubtotal}</span>
                    </div>
                    {couponDiscount > 0 && (
                      <div className="flex justify-between text-emerald-700">
                        <span>Coupon Discount</span>
                        <span className="font-semibold font-mono">-₹{couponDiscount}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Delivery Fee</span>
                      <span className="text-emerald-700 font-semibold">FREE (Churu City)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Platform Commission</span>
                      <span className="text-stone-900 font-semibold font-mono">₹0 (Zero Markup)</span>
                    </div>
                    {totalSavings > 0 && (
                      <div className="flex justify-between text-amber-800 text-[11px] font-bold">
                        <span>Total City Savings</span>
                        <span className="font-mono">₹{totalSavings}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-stone-200 font-black text-base text-stone-950">
                      <span>Total Payable</span>
                      <span className="font-mono">₹{finalCartTotal}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleProceedToCheckout}
                    className="w-full bg-stone-950 hover:bg-black text-white py-3.5 px-5 rounded-2xl text-xs sm:text-sm uppercase font-bold flex items-center justify-between transition-colors shadow-sm cursor-pointer active:scale-98"
                  >
                    <span>Proceed to Checkout</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono">₹{finalCartTotal}</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── FULL CHECKOUT MODAL (Customer Details, GPS & Payment) ─── */}
      <AnimatePresence>
        {isCheckoutModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCheckoutModalOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl z-10 overflow-hidden border border-stone-200 max-h-[90vh] flex flex-col justify-between"
            >
              {/* Checkout Header */}
              <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-700" />
                  <div>
                    <h3 className="font-extrabold text-base text-stone-950">
                      Churu Express Checkout
                    </h3>
                    <span className="text-[11px] font-mono text-stone-500 uppercase">
                      Direct Dispatch • 20–30 Mins in Churu
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCheckoutModalOpen(false)}
                  className="p-1.5 rounded-full hover:bg-stone-200 text-stone-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Checkout Form */}
              <form onSubmit={handlePlaceOrder} className="p-6 space-y-4 overflow-y-auto flex-1">
                
                {/* 1. Customer Contact Details */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                      1. Contact Information
                    </span>
                    {isUserPhoneVerified ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        OTP Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        <AlertCircle className="w-3 h-3 text-amber-600" />
                        Verification Required
                      </span>
                    )}
                  </div>

                  {/* Verification Notice Banner */}
                  {!isUserPhoneVerified && (
                    <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-2xl flex items-start justify-between gap-3 text-left">
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                          <span>Mobile Number Not Verified</span>
                        </div>
                        <p className="text-[11px] text-amber-800 leading-normal">
                          Home delivery rider dispatch aur safety ke liye mobile number OTP verify hona mandatory hai.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigateToChuruOneAuth('verify_phone', true)}
                        className="shrink-0 bg-amber-900 hover:bg-black text-white text-[11px] font-bold px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                      >
                        Verify OTP
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold uppercase text-stone-600 block mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rahul Sharma"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 outline-none focus:border-stone-950 font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold uppercase text-stone-600 block mb-1">
                        Phone (for rider call & OTP) *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="10-digit mobile"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 outline-none focus:border-stone-950 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Popular Landmark Picker Chips */}
                <div className="space-y-2 pt-2 border-t border-stone-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                      2. Select Nearest Churu Landmark *
                    </span>
                    <span className="text-[10px] text-amber-800 font-semibold">
                      Churu City
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {dynamicPopularLandmarks.map(lm => (
                      <button
                        key={lm}
                        type="button"
                        onClick={() => setSelectedLandmark(lm)}
                        className={`text-xs px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer font-medium ${
                          selectedLandmark === lm
                            ? 'bg-stone-950 text-white border-stone-950 shadow-xs'
                            : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {lm}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Address & Live GPS */}
                <div className="space-y-3 pt-2 border-t border-stone-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                      3. House / Flat & Street
                    </span>
                    <button
                      type="button"
                      onClick={handleCaptureGPS}
                      disabled={isCapturingGps}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200 cursor-pointer transition-colors"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>{isCapturingGps ? 'Locating...' : 'Detect Live GPS'}</span>
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Ghar / Shop No, Gali ya Mohalla (e.g. Ward No. 12)"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 outline-none focus:border-stone-950 font-medium"
                  />

                  {gpsStatusText && (
                    <div className="text-[11px] text-stone-500 font-mono bg-stone-50 p-2 rounded-xl border border-stone-200 flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-emerald-700 shrink-0" />
                      <span className="truncate">{gpsStatusText}</span>
                    </div>
                  )}

                  <input
                    type="text"
                    placeholder="Special delivery notes (e.g. Call when reaching gate)"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-xs text-stone-900 outline-none focus:border-stone-950 font-medium"
                  />
                </div>

                {/* 4. Payment Selection */}
                <div className="space-y-2 pt-2 border-t border-stone-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block mb-1">
                      4. Payment Method
                    </span>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-mono">
                      Unified Payment System
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('upi')}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                        paymentMethod === 'upi'
                          ? 'bg-amber-900 text-white border-amber-900 shadow-md ring-2 ring-amber-700/50'
                          : 'bg-stone-50 text-stone-800 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      <div className="font-bold text-xs flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Instant UPI QR</span>
                        </div>
                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-full ${
                          paymentMethod === 'upi' ? 'bg-amber-700 text-amber-100' : 'bg-stone-200 text-stone-600'
                        }`}>
                          Fastest
                        </span>
                      </div>
                      <span className={`text-[10px] block mt-0.5 ${paymentMethod === 'upi' ? 'text-amber-200' : 'text-stone-500'}`}>
                        PhonePe, GPay, Paytm, QR
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cod')}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        paymentMethod === 'cod'
                          ? 'bg-stone-950 text-white border-stone-950 shadow-md ring-2 ring-stone-800/50'
                          : 'bg-stone-50 text-stone-800 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      <div className="font-bold text-xs flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Cash on Delivery</span>
                      </div>
                      <span className={`text-[10px] block mt-0.5 ${paymentMethod === 'cod' ? 'text-stone-300' : 'text-stone-500'}`}>
                        Pay cash to rider at doorstep
                      </span>
                    </button>
                  </div>
                </div>

                {/* Submit Order Button */}
                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={isSubmittingOrder}
                    className="w-full bg-stone-950 hover:bg-black text-white text-xs uppercase font-bold tracking-wider py-4 px-5 rounded-2xl flex items-center justify-between shadow-md transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <span>
                      {isSubmittingOrder 
                        ? 'Processing...' 
                        : (paymentMethod === 'upi' ? `Proceed to Pay via UPI (₹${finalCartTotal})` : `Confirm Order via COD (₹${finalCartTotal})`)}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── REAL ORDER CONFIRMATION SCREEN ─────────────────────────── */}
      <AnimatePresence>
        {orderSuccessData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOrderSuccessData(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl z-10 overflow-hidden border border-stone-200 p-7 text-center space-y-4"
            >
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <span className="text-[11px] font-mono font-bold tracking-widest text-emerald-700 uppercase">
                  ORDER DISPATCH CONFIRMED
                </span>
                <h4 className="text-2xl font-black text-stone-950 mt-1">
                  ChuruOne Order Placed!
                </h4>
                <p className="text-xs text-stone-600 mt-1">
                  Aapka order receive ho gaya hai aur dukan se dispatch process shuru ho gaya hai.
                </p>
              </div>

              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-left text-xs space-y-2 font-mono">
                <div className="flex justify-between">
                  <span className="text-stone-500">Order ID:</span>
                  <span className="font-bold text-stone-900">{orderSuccessData.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Amount:</span>
                  <span className="font-bold text-stone-900">₹{orderSuccessData.totalAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Payment:</span>
                  <span className="font-bold text-emerald-800">{orderSuccessData.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Estimated Delivery:</span>
                  <span className="font-bold text-amber-800">{orderSuccessData.estimatedTime}</span>
                </div>
                <div className="pt-2 border-t border-stone-200 text-[11px] text-stone-600">
                  <strong>Delivery To:</strong> {orderSuccessData.customerName} • {orderSuccessData.address}
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setOrderSuccessData(null)}
                  className="w-full bg-stone-950 text-white text-xs font-bold py-3.5 px-4 rounded-xl text-center uppercase tracking-wider hover:bg-black transition-colors cursor-pointer shadow-xs"
                >
                  Done & Continue Shopping
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── DEDICATED SALON APPOINTMENT BOOKING MODAL (Nash Studio) ─── */}
      <AnimatePresence>
        {isBookingModalOpen && selectedService && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBookingModalOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl z-10 overflow-hidden border border-stone-200"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50">
                <div className="flex items-center gap-2">
                  <Scissors className="w-5 h-5 text-amber-800" />
                  <div>
                    <h3 className="font-extrabold text-base text-stone-950">
                      Book Salon Appointment
                    </h3>
                    <span className="text-[11px] font-mono text-stone-500 uppercase">
                      Nash Studio • Main Market, Churu
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBookingModalOpen(false)}
                  className="p-1.5 rounded-full hover:bg-stone-200 text-stone-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {bookingConfirmed ? (
                /* Booking Success Screen */
                <div className="p-8 text-center space-y-4">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="text-xl font-black text-stone-950">
                    Appointment Slot Reserved!
                  </h4>
                  <p className="text-xs sm:text-sm text-stone-600 max-w-sm mx-auto">
                    Aapka slot <strong>{selectedService.name}</strong> ke liye <strong>{bookingDate} at {bookingTime}</strong> book ho gaya hai.
                  </p>
                  <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-left text-xs space-y-1.5 font-mono">
                    <div><strong>Customer:</strong> {bookingCustomerName} ({bookingCustomerPhone})</div>
                    <div><strong>Studio:</strong> Nash Studio Gentlemen Lounge</div>
                    <div><strong>Amount:</strong> ₹{selectedService.price} (Pay at Studio)</div>
                    <div><strong>Status:</strong> Slot Confirmed ✓</div>
                  </div>
                  <div className="pt-2 flex gap-3">
                    <a
                      href={getStoreUrl('nash-studio')}
                      className="flex-1 bg-stone-950 text-white text-xs font-bold py-3 px-4 rounded-xl text-center uppercase tracking-wider"
                    >
                      Open Nash Studio
                    </a>
                    <button
                      type="button"
                      onClick={() => setIsBookingModalOpen(false)}
                      className="flex-1 bg-stone-100 text-stone-800 text-xs font-bold py-3 px-4 rounded-xl text-center uppercase tracking-wider"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                /* Booking Form */
                <form onSubmit={handleConfirmBooking} className="p-6 space-y-5">
                  {/* Selected Service Card */}
                  <div className="flex items-center gap-3.5 p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl">
                    <img 
                      src={selectedService.image || FALLBACK_PRODUCT_IMAGE} 
                      alt="" 
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
                      }}
                      className="w-14 h-14 rounded-xl object-cover bg-amber-100" 
                    />
                    <div className="flex-1">
                      <span className="text-[10px] font-bold uppercase text-amber-800">
                        Selected Service
                      </span>
                      <h4 className="font-bold text-sm text-stone-950">
                        {selectedService.name}
                      </h4>
                      <div className="text-sm font-black text-stone-900 mt-0.5">
                        ₹{selectedService.price} <span className="text-xs text-stone-400 line-through font-normal">₹{selectedService.originalPrice || selectedService.mrp}</span>
                      </div>
                    </div>
                  </div>

                  {/* Select Date */}
                  <div>
                    <label className="text-xs font-bold uppercase text-stone-500 block mb-2">
                      Choose Day
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Today', 'Tomorrow', 'Day After'].map(day => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => setBookingDate(day)}
                          className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            bookingDate === day 
                              ? 'bg-stone-950 text-white border-stone-950 shadow-xs' 
                              : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Select Time Slot */}
                  <div>
                    <label className="text-xs font-bold uppercase text-stone-500 block mb-2">
                      Available Slot
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {['11:30 AM', '1:00 PM', '2:30 PM', '4:00 PM', '5:30 PM', '7:00 PM', '8:30 PM'].map(time => (
                        <button
                          key={time}
                          type="button"
                          onClick={() => setBookingTime(time)}
                          className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                            bookingTime === time 
                              ? 'bg-amber-900 text-white border-amber-900 shadow-xs' 
                              : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Customer Details */}
                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="text-[11px] font-bold uppercase text-stone-500 block mb-1">
                        Your Full Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rahul Sharma"
                        value={bookingCustomerName}
                        onChange={(e) => setBookingCustomerName(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 outline-none focus:border-stone-950"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold uppercase text-stone-500 block mb-1">
                        Phone Number (for confirmation SMS)
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 9876543210"
                        value={bookingCustomerPhone}
                        onChange={(e) => setBookingCustomerPhone(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 outline-none focus:border-stone-950 font-mono"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full bg-stone-950 hover:bg-black text-white text-xs uppercase font-bold tracking-wider py-3.5 px-4 rounded-xl flex items-center justify-between shadow-xs transition-colors cursor-pointer"
                    >
                      <span>Confirm Slot (₹{selectedService.price} - Pay at Salon)</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── FOOTER & LEGAL LINKS ─────────────────────────────────── */}
      <footer className="border-t border-stone-200/90 bg-white py-12 mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
          
          {/* Top Row: Mission & Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start pb-8 border-b border-stone-100">
            <div className="md:col-span-6 space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-black text-xl tracking-tight uppercase text-stone-950">
                  {brandName}
                </span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  VERIFIED LOCAL COMMERCE
                </span>
              </div>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-normal max-w-md">
                Churu ki apni digital market. Direct store pricing, zero commission markup, aur 15–25 minute local city delivery.
              </p>
            </div>

            <div className="md:col-span-6 grid grid-cols-3 gap-3 font-mono text-center">
              <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                <span className="text-xl font-black text-stone-950 block">0%</span>
                <span className="text-stone-500 text-[10px] block mt-0.5">Middleman Commission</span>
              </div>
              <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                <span className="text-xl font-black text-stone-950 block">15m</span>
                <span className="text-stone-500 text-[10px] block mt-0.5">Express Dispatch</span>
              </div>
              <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                <span className="text-xl font-black text-stone-950 block">UPI</span>
                <span className="text-stone-500 text-[10px] block mt-0.5">Direct SmartPay</span>
              </div>
            </div>
          </div>

          {/* Middle Row: Quick Navigation & Verified Stores */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-stone-600">
            <div className="flex items-center flex-wrap gap-4 font-semibold">
              <button 
                type="button" 
                onClick={() => { setMarketplaceView('mohalla'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="hover:text-stone-950 cursor-pointer"
              >
                Mohalla Express
              </button>
              <button 
                type="button" 
                onClick={() => { setMarketplaceView('flagship'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="hover:text-stone-950 cursor-pointer"
              >
                City Brands
              </button>
              <a href={getStoreUrl('shawarma')} className="hover:text-stone-950">
                Shawarma Nights
              </a>
              <a href={getStoreUrl('skyline')} className="hover:text-stone-950">
                Skyline Outfits
              </a>
              <a href={getStoreUrl('nash-studio')} className="hover:text-stone-950">
                Nash Studio
              </a>
              <Link to="/master/auth" className="text-emerald-700 hover:text-emerald-800 font-bold">
                Dukandar Master Portal →
              </Link>
            </div>

            <div className="text-stone-400 text-xs">
              Delivering to <span className="font-semibold text-stone-700">{customerLocation?.name || 'Churu'}</span>
            </div>
          </div>

          {/* Bottom Row: Legal Policy Links & Official Registration */}
          <div className="pt-4 border-t border-stone-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-stone-500">
            <div className="flex items-center flex-wrap gap-4 font-medium">
              <button type="button" onClick={() => { setLegalTab('terms'); setLegalModalOpen(true); }} className="hover:text-stone-900 cursor-pointer">
                Terms & Conditions
              </button>
              <button type="button" onClick={() => { setLegalTab('privacy'); setLegalModalOpen(true); }} className="hover:text-stone-900 cursor-pointer">
                Privacy Policy
              </button>
              <button type="button" onClick={() => { setLegalTab('refund'); setLegalModalOpen(true); }} className="hover:text-stone-900 cursor-pointer">
                Refund & Cancellation
              </button>
              <button type="button" onClick={() => { setLegalTab('shipping'); setLegalModalOpen(true); }} className="hover:text-stone-900 cursor-pointer">
                Shipping & Delivery
              </button>
              <button type="button" onClick={() => { setLegalTab('contact'); setLegalModalOpen(true); }} className="hover:text-stone-900 cursor-pointer">
                Contact Us
              </button>
            </div>

            <div className="text-stone-400 text-[11px] font-mono">
              © 2026 ChuruOne. Verified Local Q-Commerce • Churu, Rajasthan 331001
            </div>
          </div>

        </div>
      </footer>

      {/* ─── FLOATING AMBER CART BAR (above nav, appears when items in bag) ── */}
      <AnimatePresence>
        {cartCount > 0 && !isCartOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="fixed bottom-[80px] inset-x-0 z-[60] flex justify-center px-4 pointer-events-none"
          >
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="pointer-events-auto w-full max-w-sm flex items-center justify-between rounded-2xl bg-amber-400 hover:bg-amber-300 active:scale-[0.98] px-5 py-3 shadow-xl transition-all cursor-pointer"
            >
              <span className="text-sm font-black text-stone-950">{cartCount} item{cartCount > 1 ? 's' : ''} · ₹{finalCartTotal}</span>
              <span className="flex items-center gap-1.5 text-sm font-black text-stone-950">
                View Bag <ShoppingBag className="h-4 w-4 stroke-[2.5]" />
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── UNIVERSAL BOTTOM NAV (white pill) ───────────────────── */}
      <BottomNavBar />

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50 bg-stone-950 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2"
          >
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── UNIFIED PAYMENT SYSTEM MODAL (ChuruOne Unified Engine) ─── */}
      {isUpiModalOpen && pendingPaymentData && (
        <UpiPaymentModal
          isOpen={isUpiModalOpen}
          onClose={() => {
            setIsUpiModalOpen(false);
            setPendingPaymentData(null);
            setPendingOrder(null);
            showToast('Payment poora nahi hua. Items bag me surakshit hain.');
          }}
          orderData={pendingPaymentData}
          paymentData={pendingPaymentData}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* ─── MANDATORY AUTH & PHONE OTP PROMPT MODAL ─── */}
      <AnimatePresence>
        {isAuthPromptOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAuthPromptOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl z-10 overflow-hidden border border-stone-200 p-6 sm:p-7 text-center space-y-4"
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto shadow-inner ${
                authPromptRequirePhone ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-700'
              }`}>
                {authPromptRequirePhone ? <Phone className="w-7 h-7" /> : <Lock className="w-7 h-7" />}
              </div>

              <div>
                <span className="text-[10px] font-mono font-bold tracking-widest text-amber-800 uppercase">
                  {authPromptRequirePhone ? 'HOME DELIVERY VERIFICATION' : 'CHURUONE AUTHENTICATION'}
                </span>
                <h4 className="text-xl font-black text-stone-950 mt-1">
                  {authPromptTitle}
                </h4>
                <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                  {authPromptMessage}
                </p>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAuthPromptOpen(false);
                    navigateToChuruOneAuth(authPromptRedirectMode, authPromptRequirePhone);
                  }}
                  className="w-full bg-stone-950 hover:bg-black text-white text-xs uppercase font-bold tracking-wider py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <span>{authPromptRequirePhone ? 'Verify Mobile via SMS OTP' : 'Continue with 1-Click Login'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsAuthPromptOpen(false)}
                  className="w-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold py-2.5 px-4 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── INTERACTIVE GEO-LOCATION SELECTOR MODAL ───────────── */}
      <AnimatePresence>
        {isLocationModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLocationModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 z-10 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-stone-900">
                      Delivering to Churu
                    </h3>
                    <p className="text-[11px] text-stone-500 font-medium">
                      Select your neighborhood for 15-min express delivery
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsLocationModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center cursor-pointer transition-colors border-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Live GPS Detection Button */}
              <div className="space-y-1.5">
                <button
                  type="button"
                  disabled={isDetectingGps}
                  onClick={handleDetectGps}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:shadow-lg cursor-pointer transition-all border-0 disabled:opacity-60"
                >
                  <LocateFixed className={`w-4 h-4 ${isDetectingGps ? 'animate-spin' : ''}`} />
                  <span>
                    {isDetectingGps ? 'Detecting Live Coordinates...' : '🎯 Detect My Live GPS Location'}
                  </span>
                </button>

                {gpsError && (
                  <div className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{gpsError}</span>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-stone-400 py-1">
                <div className="flex-1 h-px bg-stone-200" />
                <span>Ya Churu Ka Landmark Chunein</span>
                <div className="flex-1 h-px bg-stone-200" />
              </div>

              {/* Predefined & Registered Mohalla Landmarks Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {dynamicLandmarks.map(lm => {
                  const isSelected = (customerLocation?.landmarkId === lm.id) || (customerLocation?.name === lm.name);
                  return (
                    <button
                      key={lm.id}
                      type="button"
                      onClick={() => handleSelectLandmark(lm)}
                      className={`p-3 rounded-2xl text-left border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-500 shadow-xs'
                          : lm.isCustomMohalla
                            ? 'bg-emerald-50/40 hover:bg-emerald-50 border-emerald-200/70'
                            : 'bg-stone-50/80 hover:bg-stone-100 border-stone-200/80'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-stone-900 truncate flex items-center gap-1.5">
                          <span>{lm.name}</span>
                          {lm.isCustomMohalla && (
                            <span className="text-[9px] bg-emerald-600 text-white font-bold px-1.5 py-0.2 rounded-full uppercase">
                              🏡 Mohalla
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-stone-500 truncate">
                          {lm.label?.includes('(') ? lm.label.split('(')[1]?.replace(')', '') : 'Churu Area'}
                        </div>
                      </div>
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      ) : (
                        <MapPin className={`w-3.5 h-3.5 shrink-0 ${lm.isCustomMohalla ? 'text-emerald-600' : 'text-stone-400'}`} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Footer Note */}
              <div className="bg-stone-50 p-3 rounded-2xl border border-stone-100 text-[11px] text-stone-500 text-center leading-relaxed">
                Location select hote hi pass ke mohalla dukandar microsecond me filter ho jayenge.
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Legal Policies Modal */}
      <LegalPoliciesModal
        isOpen={legalModalOpen}
        onClose={() => setLegalModalOpen(false)}
        initialTab={legalTab}
        entity="churuone"
      />

    </div>
  );
}
