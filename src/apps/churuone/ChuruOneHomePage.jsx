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
  Check,
  LogOut,
  Phone,
  Mail,
  ChevronRight,
  Sparkles,
  Utensils,
  Scissors
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
  const [cartCount, setCartCount] = useState(2);
  const [toastMessage, setToastMessage] = useState('');

  // Unified ChuruOne SSO User State
  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState('');
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef(null);

  // Set browser title
  useEffect(() => {
    document.title = "ChuruOne | Churu ki har dukaan ab online";
  }, []);

  // Sync SSO session on mount (from URL redirect, Cookie or LocalStorage)
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
      }
    } catch (err) {
      console.warn('SSO sync warning in ChuruOneHomePage:', err);
    }
  }, []);

  // Close account dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target)) {
        setIsAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-scroll to #about if requested
  useEffect(() => {
    if (window.location.hash === '#about' || window.location.pathname.includes('/about') || window.location.pathname.includes('/contact')) {
      setTimeout(() => {
        const el = document.getElementById('about');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  }, []);

  const handleLogout = () => {
    clearChuruOneSession();
    setCurrentUser(null);
    setAuthToken('');
    setIsAccountMenuOpen(false);
  };

  const openLegalModal = (tab = 'terms') => {
    setLegalTab(tab);
    setLegalModalOpen(true);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  // Resolve store destination URL dynamically with SSO params
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

  // Categories list matching reference UI
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

  // Popular Stores
  const stores = [
    {
      id: 'shawarma',
      name: 'Shawarma Nights',
      category: 'Culinary & Charcoal Grill',
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
      category: 'Grocery & Essentials',
      rating: '4.8',
      timing: '20 min',
      image: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=80',
      destination: '#',
      tag: 'Grocery'
    },
    {
      id: 'gupta-medical',
      name: 'Gupta Medical',
      category: 'Pharmacy & Health',
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

  // Today's Deals / Trending Items (Including Shawarma Nights items & Nash Studio services)
  const products = [
    {
      id: 'sn-classic',
      name: 'Classic Chicken Shawarma',
      storeName: 'Shawarma Nights',
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
      category: 'salon',
      discount: '-15%',
      price: 149,
      mrp: 180,
      image: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=500&q=80',
      destination: getStoreUrl('nash-studio')
    },
    {
      id: 'prod-atta',
      name: 'Aashirvaad Shudh Chakki Atta',
      storeName: 'Sharma Kirana',
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
      category: 'mobiles',
      discount: '-30%',
      price: 1399,
      mrp: 1999,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80',
      destination: '#'
    }
  ];

  // Filtered lists
  const filteredProducts = products.filter(p => {
    const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
    const matchQuery = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.storeName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchQuery;
  });

  const filteredStores = stores.filter(s => {
    const matchQuery = !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchQuery;
  });

  const handleAddToCart = (item) => {
    setCartCount(prev => prev + 1);
    showToast(`Added ${item.name} to cart!`);
  };

  return (
    <div className="min-h-screen bg-[#FDFCF9] text-stone-900 font-sans antialiased selection:bg-stone-900 selection:text-white">
      
      {/* ─── Top Navbar (Exactly matching the Reference Design) ───── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-stone-200/80 transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 sm:h-20 flex items-center justify-between gap-4">
          
          {/* Left: ChuruOne Brand Logo with Bag Icon */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0" aria-label="ChuruOne Home">
            <div className="w-9 h-9 rounded-xl bg-stone-950 text-white flex items-center justify-center shadow-xs">
              <ShoppingBag className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-stone-950">
              ChuruOne
            </span>
          </Link>

          {/* Center: Global Search Bar */}
          <div className="hidden sm:flex flex-1 max-w-md mx-4">
            <div className="w-full relative flex items-center bg-stone-100/80 hover:bg-stone-100 border border-stone-200/80 rounded-full px-4 py-2 transition-all">
              <Search className="w-4 h-4 text-stone-400 shrink-0 mr-2.5" />
              <input
                type="text"
                placeholder="Search products or stores..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none font-medium"
              />
            </div>
          </div>

          {/* Right Utilities: Location, Cart, Account */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0" ref={accountMenuRef}>
            
            {/* Location Selector Pill */}
            <div className="flex items-center gap-1.5 text-stone-700 bg-stone-50 border border-stone-200/80 rounded-full px-3 py-1.5 text-xs font-semibold cursor-pointer hover:bg-stone-100 transition-colors">
              <MapPin className="w-3.5 h-3.5 text-stone-500" />
              <span>Churu</span>
              <ChevronDown className="w-3 h-3 text-stone-400" />
            </div>

            {/* Cart Icon with Counter Badge */}
            <Link 
              to={getStoreUrl('shawarma')}
              className="relative p-2 rounded-full hover:bg-stone-100 transition-colors text-stone-800"
              title="View Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-stone-950 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* User Profile / SSO Button */}
            {currentUser ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsAccountMenuOpen(prev => !prev)}
                  className="p-1.5 rounded-full hover:bg-stone-100 transition-colors flex items-center gap-1.5 text-stone-800"
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

                {/* Account Menu */}
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

      {/* ─── Mobile Search Bar (Visible on phones) ────────────────── */}
      <div className="sm:hidden px-4 pt-3 pb-1">
        <div className="flex items-center bg-stone-100/90 border border-stone-200/90 rounded-full px-4 py-2.5">
          <Search className="w-4 h-4 text-stone-400 shrink-0 mr-2.5" />
          <input
            type="text"
            placeholder="Search products or stores..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-stone-900 placeholder:text-stone-400 outline-none font-medium"
          />
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-7 space-y-10 sm:space-y-12">
        
        {/* ─── HERO BANNER (Churu ki har dukaan ab online + Real Ghantaghar) ── */}
        <section className="relative rounded-[2rem] sm:rounded-[2.5rem] bg-gradient-to-r from-stone-50 via-white to-amber-50/20 border border-stone-200/80 shadow-xs overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-12 items-center">
            
            {/* Left Content Column */}
            <div className="md:col-span-7 p-6 sm:p-10 lg:p-14 space-y-6">
              
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

              {/* Action Search Pill: Kya chahiye? */}
              <div className="relative max-w-md">
                <div className="flex items-center bg-white border border-stone-200/90 rounded-full shadow-sm p-1.5 pl-5 focus-within:border-stone-900 transition-colors">
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
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-stone-950 text-white flex items-center justify-center shrink-0 hover:bg-stone-800 transition-colors cursor-pointer shadow-xs"
                    aria-label="Search"
                  >
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>

            </div>

            {/* Right: Real Churu Ghantaghar Photo */}
            <div className="md:col-span-5 h-64 sm:h-80 md:h-[380px] relative overflow-hidden flex items-end justify-center md:justify-end">
              <img
                src="/images/churu-ghantaghar.jpg"
                alt="Churu Ghanta Ghar"
                className="w-full h-full object-cover object-center md:rounded-r-[2.5rem]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent md:hidden" />
            </div>

          </div>
        </section>

        {/* ─── CATEGORY ICONS CAROUSEL / ROW ───────────────────────── */}
        <section className="overflow-x-auto no-scrollbar py-2">
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

        {/* ─── TODAY'S DEALS / PRODUCTS (Shawarma & Nash Studio Items) ─ */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-950">
                Today&apos;s Deals
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Shawarma Nights dishes, Nash Studio grooming & daily essentials
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
            {filteredProducts.map((prod) => (
              <div
                key={prod.id}
                className="group bg-white rounded-2xl overflow-hidden border border-stone-200/80 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Product Imagery Frame */}
                  <a href={prod.destination} className="block relative h-36 sm:h-40 w-full overflow-hidden bg-stone-100">
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />

                    {/* Discount Pill */}
                    <span className="absolute top-2 left-2 bg-stone-950 text-white text-[10px] font-black px-2 py-0.5 rounded-md">
                      {prod.discount}
                    </span>
                  </a>

                  {/* Product Details */}
                  <div className="p-3 sm:p-3.5 space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 truncate">
                      {prod.storeName}
                    </div>
                    <a href={prod.destination} className="block">
                      <h4 className="font-bold text-xs sm:text-sm text-stone-950 line-clamp-1 group-hover:text-stone-700">
                        {prod.name}
                      </h4>
                    </a>
                  </div>
                </div>

                {/* Pricing & Add Button */}
                <div className="p-3 sm:p-3.5 pt-0 flex items-center justify-between">
                  <div>
                    <div className="font-black text-sm sm:text-base text-stone-950">
                      ₹{prod.price}
                    </div>
                    {prod.mrp && (
                      <div className="text-[10px] sm:text-xs text-stone-400 line-through">
                        ₹{prod.mrp}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddToCart(prod)}
                    className="w-8 h-8 rounded-full bg-stone-950 hover:bg-stone-800 text-white flex items-center justify-center transition-colors cursor-pointer shadow-xs active:scale-95"
                    title="Add item"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>

              </div>
            ))}
          </div>
        </section>

        {/* ─── OFFICIAL ENTITY & ABOUT SECTION ─────────────────────── */}
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
                Zero middleman commissions. 100% direct merchant payments with express 20–30 minute local city delivery.
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

      {/* ─── Footer: Compliance & Policy Links ───────────────────── */}
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
              Delivery in 20–35 mins • Refunds processed in 5–7 business days
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
