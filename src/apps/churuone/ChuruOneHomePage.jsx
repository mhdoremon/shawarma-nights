import React, { useState, useEffect, useRef } from 'react';
import { 
  Search,
  ShoppingBag,
  ShoppingCart,
  MapPin,
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
  CheckCircle2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import LegalPoliciesModal from '../../components/LegalPoliciesModal';
import { 
  getChuruOneSession, 
  setChuruOneSession, 
  clearChuruOneSession, 
  attachSsoParams 
} from '../../utils/ssoHelper';

export default function ChuruOneHomePage() {
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState('terms');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [toastMessage, setToastMessage] = useState('');

  // Real-time live activity notification cycle (Macro-animation)
  const [activityIndex, setActivityIndex] = useState(0);
  const liveActivities = [
    { text: "Rahul in Subhash Chowk ordered Classic Chicken Shawarma", time: "Just now", icon: "🌯" },
    { text: "Aman booked a Skin Fade & Beard Sculpt at Nash Studio", time: "1m ago", icon: "✂️" },
    { text: "Sharma Kirana order dispatched to Nai Sadak", time: "3m ago", icon: "🧺" },
    { text: "2x Charcoal Jumbo Rolls ordered in Churu", time: "Just now", icon: "🔥" }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActivityIndex(prev => (prev + 1) % liveActivities.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Unified ChuruOne SSO User State
  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState('');
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef(null);

  // ─── CHURUONE NATIVE CART SYSTEM (For Deliverable Goods) ─────────
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState([
    {
      id: 'sn-classic',
      name: 'Classic Chicken Shawarma',
      storeName: 'Shawarma Nights',
      price: 149,
      mrp: 180,
      image: 'https://images.unsplash.com/photo-1561651823-34feb02250e4?auto=format&fit=crop&w=300&q=80',
      qty: 1
    },
    {
      id: 'prod-milk',
      name: 'Amul Taaza Toned Milk (1L)',
      storeName: 'Sharma Kirana',
      price: 54,
      mrp: 60,
      image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=300&q=80',
      qty: 1
    }
  ]);

  // ─── NASH STUDIO SALON APPOINTMENT BOOKING SYSTEM ───────────────
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [bookingDate, setBookingDate] = useState('Today');
  const [bookingTime, setBookingTime] = useState('4:00 PM');
  const [bookingCustomerName, setBookingCustomerName] = useState('');
  const [bookingCustomerPhone, setBookingCustomerPhone] = useState('');
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  // Set browser title
  useEffect(() => {
    document.title = "ChuruOne | Churu ki har dukaan ab online";
  }, []);

  // Sync SSO session on mount
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlUserRaw = params.get('churuone_user');
      const urlToken = params.get('churuone_token');

      if (urlUserRaw) {
        const parsed = JSON.parse(decodeURIComponent(urlUserRaw));
        setCurrentUser(parsed);
        setAuthToken(urlToken || '');
        setChuruOneSession(parsed, urlToken || '');
        if (parsed.name) setBookingCustomerName(parsed.name);
        if (parsed.phone) setBookingCustomerPhone(parsed.phone);

        params.delete('churuone_user');
        params.delete('churuone_token');
        params.delete('account_created');
        const cleanUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : '');
        window.history.replaceState({}, document.title, cleanUrl);
        return;
      }

      const session = getChuruOneSession();
      if (session && session.user) {
        setCurrentUser(session.user);
        setAuthToken(session.token || '');
        if (session.user.name) setBookingCustomerName(session.user.name);
        if (session.user.phone) setBookingCustomerPhone(session.user.phone);
      }
    } catch (err) {
      console.warn('SSO sync warning in ChuruOneHomePage:', err);
    }
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
    }

    if (currentUser) {
      return attachSsoParams(base, currentUser, authToken);
    }
    return base;
  };

  // Cart operations
  const addToCart = (product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, {
        id: product.id,
        name: product.name,
        storeName: product.storeName,
        price: product.price,
        mrp: product.mrp,
        image: product.image,
        qty: 1
      }];
    });
    showToast(`Added ${product.name} to cart!`);
    setIsCartOpen(true);
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

  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.qty, 0);

  // Booking handlers
  const openBookingModal = (service) => {
    setSelectedService(service);
    setBookingConfirmed(false);
    setIsBookingModalOpen(true);
  };

  const handleConfirmBooking = (e) => {
    e.preventDefault();
    if (!bookingCustomerName || !bookingCustomerPhone) {
      showToast('Please enter your name and phone number');
      return;
    }
    setBookingConfirmed(true);
  };

  // Categories list
  const categories = [
    { id: 'all', name: 'All', emoji: '🌟' },
    { id: 'food', name: 'Food & Shawarma', emoji: '🌯' },
    { id: 'salon', name: 'Salon & Grooming', emoji: '✂️' },
    { id: 'grocery', name: 'Grocery', emoji: '🧺' },
    { id: 'medicines', name: 'Medicines', emoji: '💊' },
    { id: 'fruits', name: 'Fruits & Veg', emoji: '🍌' },
    { id: 'snacks', name: 'Snacks', emoji: '🍟' },
    { id: 'mobiles', name: 'Mobiles', emoji: '🎧' },
    { id: 'fashion', name: 'Fashion', emoji: '👕' },
    { id: 'home', name: 'Home', emoji: '🍲' },
    { id: 'gifts', name: 'Gifts', emoji: '🎁' }
  ];

  // Stores
  const stores = [
    {
      id: 'shawarma',
      name: 'Shawarma Nights',
      category: 'Charcoal Kitchen & Dining',
      rating: '4.8',
      timing: '20 min',
      image: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=600&q=80',
      destination: getStoreUrl('shawarma'),
      tag: 'Food Delivery'
    },
    {
      id: 'nash-studio',
      name: 'Nash Studio',
      category: 'Salon & Luxury Grooming',
      rating: '4.9',
      timing: '15 min',
      image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80',
      destination: getStoreUrl('nash-studio'),
      tag: 'Salon Booking'
    },
    {
      id: 'sharma-kirana',
      name: 'Sharma Kirana',
      category: 'Grocery & Daily Essentials',
      rating: '4.8',
      timing: '20 min',
      image: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=80',
      destination: '#',
      tag: 'Grocery'
    },
    {
      id: 'gupta-medical',
      name: 'Gupta Medical',
      category: 'Pharmacy & Healthcare',
      rating: '4.7',
      timing: '25 min',
      image: 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?auto=format&fit=crop&w=600&q=80',
      destination: '#',
      tag: 'Medicines'
    },
    {
      id: 'churu-fresh-fruits',
      name: 'Churu Fresh Fruits',
      category: 'Daily Farm Fresh',
      rating: '4.9',
      timing: '15 min',
      image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=600&q=80',
      destination: '#',
      tag: 'Fruits & Veg'
    },
    {
      id: 'rajasthan-fashion',
      name: 'Rajasthan Fashion',
      category: 'Clothing & Traditional',
      rating: '4.6',
      timing: '30 min',
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80',
      destination: '#',
      tag: 'Fashion'
    },
    {
      id: 'tech-world',
      name: 'Tech World',
      category: 'Electronics & Mobiles',
      rating: '4.8',
      timing: '25 min',
      image: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=600&q=80',
      destination: '#',
      tag: 'Mobiles'
    }
  ];

  // Today's Deals / Items (Food & Products vs Salon Services)
  const items = [
    {
      id: 'sn-classic',
      name: 'Classic Chicken Shawarma',
      storeName: 'Shawarma Nights',
      type: 'product',
      category: 'food',
      discount: '-20%',
      price: 149,
      mrp: 180,
      image: 'https://images.unsplash.com/photo-1561651823-34feb02250e4?auto=format&fit=crop&w=500&q=80',
      destination: getStoreUrl('shawarma')
    },
    {
      id: 'nash-fade',
      name: 'Precision Skin Fade & Style',
      storeName: 'Nash Studio',
      type: 'service',
      category: 'salon',
      discount: '-20%',
      price: 199,
      mrp: 250,
      image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=500&q=80',
      destination: getStoreUrl('nash-studio')
    },
    {
      id: 'sn-jumbo',
      name: 'Charcoal Spit Jumbo Roll',
      storeName: 'Shawarma Nights',
      type: 'product',
      category: 'food',
      discount: '-15%',
      price: 199,
      mrp: 240,
      image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=500&q=80',
      destination: getStoreUrl('shawarma')
    },
    {
      id: 'nash-beard',
      name: 'Royal Beard Sculpt & Hot Towel',
      storeName: 'Nash Studio',
      type: 'service',
      category: 'salon',
      discount: '-15%',
      price: 149,
      mrp: 180,
      image: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=500&q=80',
      destination: getStoreUrl('nash-studio')
    },
    {
      id: 'prod-atta',
      name: 'Aashirvaad Shudh Chakki Atta (5kg)',
      storeName: 'Sharma Kirana',
      type: 'product',
      category: 'grocery',
      discount: '-20%',
      price: 320,
      mrp: 400,
      image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=500&q=80',
      destination: '#'
    },
    {
      id: 'prod-banana',
      name: 'Fresh Robusta Bananas (1 Dozen)',
      storeName: 'Churu Fresh Fruits',
      type: 'product',
      category: 'fruits',
      discount: '-15%',
      price: 40,
      mrp: 47,
      image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=500&q=80',
      destination: '#'
    },
    {
      id: 'prod-milk',
      name: 'Amul Taaza Toned Milk (1L)',
      storeName: 'Sharma Kirana',
      type: 'product',
      category: 'grocery',
      discount: '-10%',
      price: 54,
      mrp: 60,
      image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=500&q=80',
      destination: '#'
    },
    {
      id: 'prod-redmi',
      name: 'Redmi 12 5G (Moonstone Silver)',
      storeName: 'Tech World',
      type: 'product',
      category: 'mobiles',
      discount: '-25%',
      price: 11999,
      mrp: 15999,
      image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=500&q=80',
      destination: '#'
    },
    {
      id: 'prod-boat',
      name: 'boAt Rockerz Bluetooth Headphones',
      storeName: 'Tech World',
      type: 'product',
      category: 'mobiles',
      discount: '-30%',
      price: 1399,
      mrp: 1999,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80',
      destination: '#'
    }
  ];

  const filteredItems = items.filter(item => {
    const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
    const matchQuery = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.storeName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchQuery;
  });

  const filteredStores = stores.filter(s => {
    const matchQuery = !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchQuery;
  });

  return (
    <div className="min-h-screen bg-[#FDFCF9] text-stone-900 font-sans antialiased selection:bg-stone-900 selection:text-white">
      
      {/* ─── Ultra-Clean Header (NO Top Search Bar) ───────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80 transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 sm:h-20 flex items-center justify-between">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0" aria-label="ChuruOne Home">
            <div className="w-9 h-9 rounded-xl bg-stone-950 text-white flex items-center justify-center shadow-xs">
              <ShoppingBag className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-stone-950">
              ChuruOne
            </span>
          </Link>

          {/* Right Utilities: Cart Drawer Trigger, User Profile */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0" ref={accountMenuRef}>
            
            {/* Native ChuruOne Cart Icon Button */}
            <button 
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 rounded-full hover:bg-stone-100 transition-colors text-stone-800 cursor-pointer"
              title="Open ChuruOne Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-stone-950 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            {/* SSO Profile Pill */}
            {currentUser ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsAccountMenuOpen(prev => !prev)}
                  className="p-1.5 rounded-full hover:bg-stone-100 transition-colors flex items-center gap-1.5 text-stone-800 cursor-pointer"
                >
                  {currentUser.picture || currentUser.photoURL ? (
                    <img 
                      src={currentUser.picture || currentUser.photoURL} 
                      alt="" 
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-stone-900 text-white flex items-center justify-center text-xs font-bold">
                      {(currentUser.name || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <ChevronDown className={`w-3 h-3 text-stone-400 transition-transform ${isAccountMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isAccountMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.98 }}
                      className="absolute right-0 mt-2 w-60 bg-white border border-stone-200 rounded-2xl shadow-xl z-50 p-3.5 text-left"
                    >
                      <div className="pb-3 border-b border-stone-100">
                        <div className="font-bold text-sm text-stone-900 truncate">
                          {currentUser.name || currentUser.displayName || 'Customer'}
                        </div>
                        {currentUser.phone && (
                          <div className="text-xs text-stone-500 font-mono mt-0.5">
                            {currentUser.phone}
                          </div>
                        )}
                      </div>
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full text-left py-2 px-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center justify-between cursor-pointer"
                        >
                          <span>Sign Out</span>
                          <LogOut className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link 
                to="/auth" 
                className="p-2 rounded-full hover:bg-stone-100 transition-colors text-stone-800"
                title="Sign In"
              >
                <User className="w-5 h-5" />
              </Link>
            )}

          </div>

        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-10 sm:space-y-12">
        
        {/* ─── HERO BANNER (Seamlessly Blended Churu Lal Ghantaghar + Overlay Search) ── */}
        <section className="relative rounded-[2.5rem] bg-gradient-to-r from-stone-50 via-white to-amber-50/20 border border-stone-200/80 shadow-xs overflow-hidden min-h-[380px] sm:min-h-[420px] md:min-h-[460px] flex items-center">
          
          {/* Beautifully Faded Real Churu Lal Ghantaghar Image (Seamlessly Embedded into UI) */}
          <div className="absolute right-0 top-0 bottom-0 w-full md:w-[64%] lg:w-[60%] h-full pointer-events-none select-none overflow-hidden flex items-center justify-end">
            <motion.img
              animate={{ scale: [1, 1.05, 1], y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 16, ease: "easeInOut" }}
              src="/images/churu-ghantaghar.jpg"
              alt="Real Churu Lal Ghanta Ghar Dharm Stup"
              className="w-full h-full object-cover object-center"
              style={{
                maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.1) 10%, rgba(0,0,0,0.85) 35%, black 65%)',
                WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.1) 10%, rgba(0,0,0,0.85) 35%, black 65%)'
              }}
            />
            {/* Ambient Blend Gradient Layers */}
            <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-white via-white/40 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white/80 via-white/30 to-transparent" />
            <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-white/60 to-transparent" />
          </div>

          {/* Left Content Area + Search Bar Overlaid Direct Onto Photo */}
          <div className="relative z-20 w-full p-6 sm:p-10 lg:p-14 space-y-6 max-w-2xl">
            
            <motion.h1 
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-stone-950 leading-[1.08]"
            >
              Churu ki<br />
              har dukaan<br />
              ab online
            </motion.h1>

            {/* OVERLAPPING FLOATING SEARCH BAR (Physically sits across the photo) */}
            <div className="relative z-30 max-w-xl w-full pt-2">
              <div className="flex items-center bg-white/95 backdrop-blur-md border border-stone-200/90 shadow-xl hover:shadow-2xl rounded-full p-2.5 pl-6 focus-within:border-stone-900 focus-within:ring-2 focus-within:ring-stone-900/10 transition-all">
                <Search className="w-5 h-5 text-stone-400 shrink-0 mr-3" />
                <input
                  type="text"
                  placeholder="Kya chahiye?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-sm sm:text-base text-stone-900 placeholder:text-stone-400 outline-none font-medium"
                />
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('stores-grid');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-stone-950 hover:bg-black text-white flex items-center justify-center shrink-0 shadow-md cursor-pointer transition-transform active:scale-95"
                  aria-label="Search"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>

          </div>

        </section>

        {/* ─── LIVE KINETIC MARQUEE STREAM (Macro Animation) ───────── */}
        <div className="py-3 border-y border-stone-200/80 bg-gradient-to-r from-stone-50 via-white to-stone-50 overflow-hidden whitespace-nowrap select-none rounded-2xl shadow-2xs">
          <div className="flex gap-8 items-center animate-marquee w-max text-xs font-mono font-bold uppercase tracking-wider text-stone-800">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-8">
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  LIVE ORDERS DISPATCHING
                </span>
                <span className="text-stone-300">✦</span>
                <span>0% PLATFORM COMMISSIONS</span>
                <span className="text-stone-300">✦</span>
                <span className="text-amber-800 font-sans font-bold">SHAWARMA NIGHTS • 25 MIN EXPRESS</span>
                <span className="text-stone-300">✦</span>
                <span>DIRECT IN-STORE PRICING</span>
                <span className="text-stone-300">✦</span>
                <span className="text-indigo-800 font-sans font-bold">NASH STUDIO • PRIVATE APPOINTMENTS</span>
                <span className="text-stone-300">✦</span>
                <span>INSTANT UPI SETTLEMENTS</span>
                <span className="text-stone-300">✦</span>
              </div>
            ))}
          </div>
        </div>

        {/* ─── CATEGORY SQUIRCLE ROW ───────────────────────────────── */}
        <section className="overflow-x-auto no-scrollbar py-1">
          <div className="flex items-center gap-3 sm:gap-4 w-max min-w-full">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex flex-col items-center justify-center gap-2 p-3 sm:p-3.5 rounded-2xl transition-all cursor-pointer min-w-[76px] sm:min-w-[88px] ${
                    isSelected 
                      ? 'bg-stone-950 text-white shadow-md' 
                      : 'bg-white hover:bg-stone-50 text-stone-700 border border-stone-200/80 shadow-2xs'
                  }`}
                >
                  <span className="text-2xl sm:text-3xl select-none">
                    {cat.emoji}
                  </span>
                  <span className="text-[11px] sm:text-xs font-semibold whitespace-nowrap">
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ─── POPULAR STORES ROW ──────────────────────────────────── */}
        <section id="stores-grid" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-950">
              Popular Stores
            </h2>
            <a 
              href="#stores-grid" 
              className="text-xs sm:text-sm font-semibold text-stone-600 hover:text-stone-950 flex items-center gap-1 transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
            {filteredStores.map((store) => (
              <a
                key={store.id}
                href={store.destination}
                className="group bg-white rounded-2xl overflow-hidden border border-stone-200/80 shadow-2xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="h-32 sm:h-36 w-full overflow-hidden bg-stone-100 relative">
                    <img
                      src={store.image}
                      alt={store.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                    <div className="absolute top-2 left-2">
                      <span className="bg-stone-950/80 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {store.tag}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 sm:p-3.5 space-y-1">
                    <h3 className="font-bold text-xs sm:text-sm text-stone-950 group-hover:text-stone-800 truncate">
                      {store.name}
                    </h3>
                    <div className="flex items-center justify-between text-[11px] text-stone-500">
                      <span className="flex items-center gap-1 font-semibold text-amber-600">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        {store.rating}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-stone-400" />
                        {store.timing}
                      </span>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* ─── TODAY'S DEALS & SERVICES (Separating Products vs Booking) ── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-950">
                Today&apos;s Deals & Services
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Food & grocery go to cart • Salon grooming slots book directly
              </p>
            </div>
            <a 
              href="#deals" 
              className="text-xs sm:text-sm font-semibold text-stone-600 hover:text-stone-950 flex items-center gap-1 transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="group bg-white rounded-2xl overflow-hidden border border-stone-200/80 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Item Image */}
                  <div className="relative h-36 sm:h-40 w-full overflow-hidden bg-stone-100">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />

                    {/* Discount Pill */}
                    <span className="absolute top-2 left-2 bg-stone-950 text-white text-[10px] font-black px-2 py-0.5 rounded-md">
                      {item.discount}
                    </span>

                    {/* Service vs Delivery Tag */}
                    <span className={`absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      item.type === 'service' 
                        ? 'bg-amber-100 text-amber-900 border border-amber-200' 
                        : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                    }`}>
                      {item.type === 'service' ? 'Salon Slot' : 'Delivery'}
                    </span>
                  </div>

                  {/* Item Info */}
                  <div className="p-3 sm:p-3.5 space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 truncate">
                      {item.storeName}
                    </div>
                    <h4 className="font-bold text-xs sm:text-sm text-stone-950 line-clamp-1 group-hover:text-stone-700">
                      {item.name}
                    </h4>
                  </div>
                </div>

                {/* Pricing & Intelligent Action Button */}
                <div className="p-3 sm:p-3.5 pt-0 flex items-center justify-between">
                  <div>
                    <div className="font-black text-sm sm:text-base text-stone-950">
                      ₹{item.price}
                    </div>
                    {item.mrp && (
                      <div className="text-[10px] sm:text-xs text-stone-400 line-through">
                        ₹{item.mrp}
                      </div>
                    )}
                  </div>

                  {item.type === 'service' ? (
                    /* Salon Service: Book Appointment Button */
                    <button
                      type="button"
                      onClick={() => openBookingModal(item)}
                      className="bg-amber-800 hover:bg-amber-900 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-full flex items-center gap-1 transition-colors cursor-pointer shadow-xs active:scale-95"
                      title="Book Salon Appointment"
                    >
                      <Scissors className="w-3 h-3" />
                      <span>Book</span>
                    </button>
                  ) : (
                    /* Deliverable Product: Add to Cart Button */
                    <button
                      type="button"
                      onClick={() => addToCart(item)}
                      className="w-8 h-8 rounded-full bg-stone-950 hover:bg-stone-800 text-white flex items-center justify-center transition-colors cursor-pointer shadow-xs active:scale-95"
                      title="Add to ChuruOne Cart"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  )}
                </div>

              </div>
            ))}
          </div>
        </section>

        {/* ─── OFFICIAL ENTITY & ABOUT ──────────────────────────────── */}
        <section id="about" className="pt-8 pb-4 border-t border-stone-200/80">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start bg-white rounded-3xl p-6 sm:p-9 border border-stone-200/80 shadow-2xs">
            
            <div className="md:col-span-7 space-y-3">
              <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-stone-400 block">
                ABOUT CHURUONE MARKETPLACE
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-stone-950 tracking-tight">
                Churu ki Apni Digital Market. Direct Store Pricing.
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-normal">
                ChuruOne connects citizens directly with verified local businesses — including Shawarma Nights for artisanal charcoal dining and Nash Studio for private salon grooming, plus local kirana and pharmacies.
              </p>
              <p className="text-xs text-stone-500 leading-relaxed font-normal">
                Zero middleman commissions. Direct merchant payments with express 20–30 minute local city delivery.
              </p>
            </div>

            <div className="md:col-span-5 bg-stone-50 rounded-2xl p-5 border border-stone-200/70 space-y-3.5">
              <div>
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-stone-400 block">
                  OFFICIAL OPERATING ENTITY
                </span>
                <div className="font-bold text-sm text-stone-950 mt-0.5">
                  Vasudhaiva Kutumbakam Robotics
                </div>
              </div>

              <div className="text-xs text-stone-600 space-y-2 pt-2 border-t border-stone-200/60 font-medium">
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                  <span>50, Churu bhaiji chowk, Churu, Rajasthan 331001</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <a href="tel:+917023963189" className="hover:text-stone-900 font-mono">
                    +91 70239 63189
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <a href="mailto:contact@churuone.in" className="hover:text-stone-900 font-mono">
                    contact@churuone.in
                  </a>
                </div>
              </div>

              <div className="pt-2 border-t border-stone-200/60">
                <Link
                  to="/admin"
                  className="w-full py-2.5 px-3.5 rounded-xl bg-white hover:bg-stone-100 text-stone-900 text-xs font-bold uppercase tracking-wider flex items-center justify-between border border-stone-200 transition-colors"
                >
                  <span>Merchant OS Portal</span>
                  <ArrowRight className="w-3 h-3 text-stone-500" />
                </Link>
              </div>
            </div>

          </div>
        </section>

      </main>

      {/* ─── CHURUONE NATIVE SLIDE-OVER CART DRAWER ───────────────── */}
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

            {/* Slide-over panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between z-10"
            >
              {/* Cart Header */}
              <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
                <div className="flex items-center gap-2.5">
                  <ShoppingCart className="w-5 h-5 text-stone-900" />
                  <h3 className="font-extrabold text-base text-stone-950">
                    My ChuruOne Cart ({cartCount})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="p-1.5 rounded-full hover:bg-stone-200 transition-colors text-stone-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Cart Items List */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {cartItems.length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto" />
                    <p className="text-stone-500 text-sm font-medium">Aapka cart khali hai</p>
                    <button
                      type="button"
                      onClick={() => setIsCartOpen(false)}
                      className="text-xs font-bold text-stone-900 underline uppercase"
                    >
                      Dukano se shopping karein
                    </button>
                  </div>
                ) : (
                  cartItems.map((item) => (
                    <div 
                      key={item.id}
                      className="flex items-center gap-3.5 p-3 rounded-2xl border border-stone-200/80 bg-stone-50/50"
                    >
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-16 h-16 rounded-xl object-cover shrink-0 bg-stone-200"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold uppercase text-stone-400 block truncate">
                          {item.storeName}
                        </span>
                        <h4 className="font-bold text-xs sm:text-sm text-stone-950 truncate">
                          {item.name}
                        </h4>
                        <div className="font-black text-sm text-stone-950 mt-1">
                          ₹{item.price * item.qty}
                        </div>
                      </div>

                      {/* Quantity Controller */}
                      <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-full px-2 py-1">
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.id, -1)}
                          className="w-5 h-5 flex items-center justify-center text-stone-600 hover:text-stone-950"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold min-w-[14px] text-center">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.id, 1)}
                          className="w-5 h-5 flex items-center justify-center text-stone-600 hover:text-stone-950"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="p-1 text-stone-400 hover:text-rose-600 transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Cart Footer & Checkout */}
              {cartItems.length > 0 && (
                <div className="p-5 border-t border-stone-200 bg-stone-50 space-y-3">
                  <div className="space-y-1.5 text-xs text-stone-600">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-semibold text-stone-900">₹{cartTotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Fee</span>
                      <span className="text-emerald-700 font-semibold">FREE (Churu City)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Platform Fee</span>
                      <span className="text-stone-900 font-semibold">₹0 (Zero Markup)</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-stone-200 font-black text-sm text-stone-950">
                      <span>Total Amount</span>
                      <span>₹{cartTotal}</span>
                    </div>
                  </div>

                  <a
                    href={getStoreUrl('shawarma')}
                    className="w-full bg-stone-950 hover:bg-black text-white py-3.5 px-5 rounded-2xl text-xs sm:text-sm uppercase font-bold flex items-center justify-between transition-colors shadow-sm cursor-pointer"
                  >
                    <span>Order Now (Direct Dispatch)</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              )}
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
                    Appointment Confirmed!
                  </h4>
                  <p className="text-xs sm:text-sm text-stone-600 max-w-sm mx-auto">
                    Aapka slot <strong>{selectedService.name}</strong> ke liye <strong>{bookingDate} at {bookingTime}</strong> book ho gaya hai.
                  </p>
                  <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-left text-xs space-y-1.5 font-mono">
                    <div><strong>Customer:</strong> {bookingCustomerName} ({bookingCustomerPhone})</div>
                    <div><strong>Studio:</strong> Nash Studio Gentlemen Lounge</div>
                    <div><strong>Amount:</strong> ₹{selectedService.price} (Pay at Studio)</div>
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
                      src={selectedService.image} 
                      alt="" 
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
                        ₹{selectedService.price} <span className="text-xs text-stone-400 line-through font-normal">₹{selectedService.mrp}</span>
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
      <footer className="border-t border-stone-200/80 bg-white py-10 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-stone-600">
            <div>
              <div className="font-black text-lg tracking-tight uppercase text-stone-950">
                ChuruOne
              </div>
              <p className="text-xs text-stone-500 mt-0.5 font-mono">
                Churu ki har dukaan ab online • Rajasthan 331001
              </p>
            </div>

            <div className="flex items-center flex-wrap gap-5 text-stone-600 text-xs font-semibold">
              <a href="#stores-grid" className="hover:text-stone-950 transition-colors">
                Popular Stores
              </a>
              <a href={getStoreUrl('shawarma')} className="hover:text-stone-950 transition-colors">
                Shawarma Nights
              </a>
              <a href={getStoreUrl('nash-studio')} className="hover:text-stone-950 transition-colors">
                Nash Studio
              </a>
              <Link to="/admin" className="hover:text-stone-950 transition-colors">
                Merchant OS
              </Link>
            </div>
          </div>

          {/* All 5 Mandatory Legal Policy Links for Payment Gateway Compliance */}
          <div className="pt-4 border-t border-stone-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-stone-500">
            <div className="flex items-center flex-wrap gap-4 sm:gap-5 font-medium">
              <a href="/contact-us" className="hover:text-stone-900 transition-colors">
                Contact Us
              </a>
              <a href="/terms-and-conditions" className="hover:text-stone-900 transition-colors">
                Terms & Conditions
              </a>
              <a href="/privacy-policy" className="hover:text-stone-900 transition-colors">
                Privacy Policy
              </a>
              <a href="/refund-policy" className="hover:text-stone-900 transition-colors">
                Refund & Cancellation
              </a>
              <a href="/shipping-policy" className="hover:text-stone-900 transition-colors">
                Shipping Policy
              </a>
            </div>

            <div className="text-stone-400 text-[11px] font-mono">
              Delivery in 20–35 mins • Refunds in 5–7 business days
            </div>
          </div>

          <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-stone-400">
            <span>© 2026 ChuruOne. A unit of Vasudhaiva Kutumbakam Robotics. All rights reserved.</span>
            <span>50, Churu bhaiji chowk, Churu, Rajasthan 331001</span>
          </div>

        </div>
      </footer>

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

      {/* ─── FLOATING LIVE SOCIAL PROOF ACTIVITY TICKER (Macro Animation) ── */}
      <div className="fixed bottom-6 left-6 z-40 hidden sm:block pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={activityIndex}
            initial={{ opacity: 0, y: 25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="bg-white/95 backdrop-blur-md border border-stone-200/90 shadow-xl rounded-full px-4 py-2.5 flex items-center gap-3 text-xs max-w-sm pointer-events-auto"
          >
            <span className="text-base select-none">{liveActivities[activityIndex].icon}</span>
            <div className="flex flex-col min-w-0 pr-1">
              <span className="font-semibold text-stone-900 truncate">
                {liveActivities[activityIndex].text}
              </span>
              <span className="text-[10px] text-stone-400 font-mono">
                {liveActivities[activityIndex].time}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

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
