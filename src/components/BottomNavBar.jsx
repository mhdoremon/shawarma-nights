import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Store, Compass, User, LayoutDashboard, ExternalLink, Sparkles, ShoppingBag, ShieldCheck } from 'lucide-react';
import { PHONEPE_REVIEW_MODE } from '../config/siteMode';

const STORE_CATALOG = {
  'shawarma': {
    id: 'shawarma',
    shortName: 'Shawarma',
    name: 'Shawarma Nights',
    icon: '🍔',
    url: '/shawarma'
  },
  'skyline': {
    id: 'skyline',
    shortName: 'Skyline',
    name: 'Skyline Outfits',
    icon: '👕',
    url: '/skyline'
  },
  'nash': {
    id: 'nash-studio',
    shortName: 'Nash Studio',
    name: 'Nash Studio',
    icon: '✂️',
    url: '/nash'
  },
  'nash-studio': {
    id: 'nash-studio',
    shortName: 'Nash Studio',
    name: 'Nash Studio',
    icon: '✂️',
    url: '/nash'
  }
};

function resolveStoreMeta(storeId, extraName) {
  if (!storeId) return STORE_CATALOG['shawarma'];
  const s = String(storeId).toLowerCase().trim();
  if (STORE_CATALOG[s]) return STORE_CATALOG[s];

  let icon = '🏪';
  const nameLower = (extraName || storeId).toLowerCase();

  if (nameLower.includes('shawarma') || nameLower.includes('food') || nameLower.includes('cafe') || nameLower.includes('restaurant') || nameLower.includes('pizza') || nameLower.includes('burger')) {
    icon = '🍔';
  } else if (nameLower.includes('skyline') || nameLower.includes('fashion') || nameLower.includes('cloth') || nameLower.includes('outfit') || nameLower.includes('wear')) {
    icon = '👕';
  } else if (nameLower.includes('nash') || nameLower.includes('salon') || nameLower.includes('barber') || nameLower.includes('hair') || nameLower.includes('groom')) {
    icon = '✂️';
  } else if (nameLower.includes('kirana') || nameLower.includes('grocery') || nameLower.includes('mart') || nameLower.includes('store') || nameLower.includes('bazaar')) {
    icon = '🛒';
  }

  const shortName = extraName ? extraName.split(' ')[0] : (s.charAt(0).toUpperCase() + s.slice(1, 9));

  return {
    id: s,
    shortName,
    name: extraName || storeId,
    icon,
    url: `/?storeId=${s}`
  };
}

export default function BottomNavBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname.toLowerCase();
  const params = new URLSearchParams(location.search);
  const storeParam = (params.get('storeId') || params.get('store') || '').toLowerCase();
  const isSocialBypass = params.get('mode') === 'social' || params.get('view') === 'social' || params.get('social') === '1';
  const isPhonePeReview = PHONEPE_REVIEW_MODE && !isSocialBypass;

  // Dukandar session detection
  const [dukandar, setDukandar] = useState(null);
  // Customer session detection
  const [customer, setCustomer] = useState(null);

  // Active / Most Recently Visited Shop (persisted per session)
  const [activeShop, setActiveShop] = useState(() => {
    if (isPhonePeReview) return STORE_CATALOG['skyline'];
    try {
      // Clear legacy localStorage cache that forced Shawarma on fresh visit
      localStorage.removeItem('churuone_active_shop');
      const saved = JSON.parse(sessionStorage.getItem('churuone_active_shop') || 'null');
      if (saved && saved.id) return saved;
    } catch {}
    return null; // Strictly null initially -> Navbar has only 3 tabs on fresh load!
  });

  // Dynamically resolve currently open shop based on URL/Route & Master Context
  const currentShop = useMemo(() => {
    if (isPhonePeReview) return STORE_CATALOG['skyline'];

    // 1. Direct path check for known flagship stores:
    if (path.startsWith('/skyline') || path.startsWith('/outfits') || storeParam === 'skyline' || storeParam === 'skyline-outfits') {
      return STORE_CATALOG['skyline'];
    }
    if (path.startsWith('/nash') || path.startsWith('/salon') || storeParam === 'nash' || storeParam === 'nash-studio') {
      return STORE_CATALOG['nash-studio'];
    }
    if (path.startsWith('/shawarma') || path.startsWith('/sn') || storeParam === 'shawarma' || storeParam === 'shawarma-nights') {
      return STORE_CATALOG['shawarma'];
    }

    // 2. Query param for any custom store:
    if (storeParam) {
      return resolveStoreMeta(storeParam);
    }

    // 3. Inside Master Console (/master, /admin, /dukandar):
    if (path.startsWith('/master') || path.startsWith('/admin') || path.startsWith('/dukandar')) {
      if (dukandar?.storeId) {
        return resolveStoreMeta(dukandar.storeId, dukandar.dukanName);
      }
    }

    // 4. Fallback to activeShop ONLY if a shop was already visited in this session:
    if (activeShop) return activeShop;

    // Fresh open / Feed / Explore before any shop visit: strictly null (3 tabs in navbar)
    return null;
  }, [path, storeParam, dukandar?.storeId, dukandar?.dukanName, activeShop, isPhonePeReview]);

  // Track and save shop visits whenever a shop route is visited
  useEffect(() => {
    let detected = null;
    if (path.startsWith('/skyline') || path.startsWith('/outfits') || storeParam === 'skyline' || storeParam === 'skyline-outfits') {
      detected = STORE_CATALOG['skyline'];
    } else if (path.startsWith('/nash') || path.startsWith('/salon') || storeParam === 'nash' || storeParam === 'nash-studio') {
      detected = STORE_CATALOG['nash-studio'];
    } else if (path.startsWith('/shawarma') || path.startsWith('/sn') || storeParam === 'shawarma' || storeParam === 'shawarma-nights') {
      detected = STORE_CATALOG['shawarma'];
    } else if (storeParam) {
      detected = resolveStoreMeta(storeParam);
    } else if (path.startsWith('/master') || path.startsWith('/admin') || path.startsWith('/dukandar')) {
      if (dukandar?.storeId) {
        detected = resolveStoreMeta(dukandar.storeId, dukandar.dukanName);
      }
    }

    if (detected) {
      setActiveShop(detected);
      try {
        sessionStorage.setItem('churuone_active_shop', JSON.stringify(detected));
      } catch {}
    }
  }, [path, storeParam, dukandar?.storeId]);

  useEffect(() => {
    const readSessions = () => {
      try {
        const dToken = localStorage.getItem('churuone_master_token');
        const dUser = JSON.parse(localStorage.getItem('churuone_master_user') || 'null');
        if (dToken && dUser) {
          setDukandar(dUser);
        } else {
          setDukandar(null);
        }
      } catch {
        setDukandar(null);
      }

      try {
        const cUser = JSON.parse(localStorage.getItem('churuone_customer_user') || localStorage.getItem('churuone_user') || 'null');
        setCustomer(cUser);
      } catch {
        setCustomer(null);
      }

      try {
        const savedShop = JSON.parse(sessionStorage.getItem('churuone_active_shop') || 'null');
        if (savedShop && savedShop.id) setActiveShop(savedShop);
      } catch {}
    };

    readSessions();
    window.addEventListener('storage', readSessions);
    window.addEventListener('churuone_user_updated', readSessions);
    return () => {
      window.removeEventListener('storage', readSessions);
      window.removeEventListener('churuone_user_updated', readSessions);
    };
  }, [location.pathname]);

  // Hide on legal and test pages if desired, but keep on main routes
  if (path.startsWith('/test-') || path.startsWith('/policies')) {
    return null;
  }

  // Active state checks
  const isCurrentShopActive = Boolean(
    currentShop && (
      (currentShop.id === 'shawarma' && (path.startsWith('/shawarma') || path.startsWith('/sn') || storeParam === 'shawarma')) ||
      (currentShop.id === 'skyline' && (path.startsWith('/skyline') || path.startsWith('/outfits') || storeParam === 'skyline')) ||
      (currentShop.id === 'nash-studio' && (path.startsWith('/nash') || path.startsWith('/salon') || storeParam === 'nash' || storeParam === 'nash-studio')) ||
      (storeParam && storeParam === currentShop.id)
    )
  );

  const isDukandarAuth = path.startsWith('/auth') && (params.get('role') === 'dukandar' || params.get('type') === 'dukandar');
  const isFeedActive = (path === '/' || path === '' || path === '/churuone') && !isCurrentShopActive && !path.startsWith('/explore') && !path.startsWith('/profile') && !path.startsWith('/master') && !path.startsWith('/admin') && !path.startsWith('/dukandar') && !path.startsWith('/auth');
  const isExploreActive = path.startsWith('/explore');
  const isProfileActive = path.startsWith('/profile') || (path.startsWith('/auth') && !isDukandarAuth && !dukandar);
  const isDashboardActive = path.startsWith('/master') || path.startsWith('/admin') || path.startsWith('/dukandar') || isDukandarAuth;

  // Customer Avatar source
  const customerAvatar = customer?.picture || customer?.photoURL || customer?.avatar;

  return (
    <div className="fixed bottom-3 inset-x-0 z-50 flex justify-center pointer-events-none px-3 sm:px-4">
      <nav 
        aria-label="Bottom Navigation"
        className="pointer-events-auto w-full max-w-md bg-zinc-950/92 backdrop-blur-2xl border border-white/10 rounded-full px-3 py-2 shadow-[0_12px_40px_rgba(0,0,0,0.55)] ring-1 ring-white/5 flex items-center justify-between transition-all"
      >
        {/* ========================================================= */}
        {/* PHONEPE REVIEW MODE: CLEAN 3-TAB FASHION BRAND DOCK       */}
        {/* ========================================================= */}
        {isPhonePeReview ? (
          <>
            {/* TAB 1: SKYLINE STORE */}
            <button
              onClick={() => navigate('/')}
              className={`flex-1 flex flex-col items-center justify-center py-1 transition-all rounded-full cursor-pointer relative ${
                (path === '/' || path.startsWith('/skyline') || path.startsWith('/outfits')) ? 'text-amber-400 font-bold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="relative">
                <span className="text-base leading-none block">👕</span>
                {(path === '/' || path.startsWith('/skyline') || path.startsWith('/outfits')) && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-amber-400 rounded-full shadow-[0_0_8px_#f59e0b]" />
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">Skyline</span>
            </button>

            {/* TAB 2: POLICIES */}
            <button
              onClick={() => navigate('/terms-and-conditions')}
              className={`flex-1 flex flex-col items-center justify-center py-1 transition-all rounded-full cursor-pointer relative ${
                (path.startsWith('/terms') || path.startsWith('/privacy') || path.startsWith('/refund') || path.startsWith('/shipping') || path.startsWith('/contact')) ? 'text-amber-400 font-bold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="relative">
                <ShieldCheck className="w-5 h-5 stroke-[1.8]" />
                {(path.startsWith('/terms') || path.startsWith('/privacy') || path.startsWith('/refund') || path.startsWith('/shipping') || path.startsWith('/contact')) && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-amber-400 rounded-full shadow-[0_0_8px_#f59e0b]" />
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">Policies</span>
            </button>

            {/* TAB 3: ACCOUNT / PROFILE */}
            <button
              onClick={() => {
                if (customer) {
                  navigate('/profile');
                } else {
                  navigate('/auth?role=customer&mode=login');
                }
              }}
              className={`flex-1 flex flex-col items-center justify-center py-1 transition-all rounded-full cursor-pointer relative ${
                isProfileActive ? 'text-amber-400 font-bold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="relative">
                {customerAvatar ? (
                  <img
                    src={customerAvatar}
                    alt={customer?.name || 'Profile'}
                    className={`w-5 h-5 rounded-full object-cover ring-1.5 transition-all ${
                      isProfileActive ? 'ring-amber-400 scale-110' : 'ring-zinc-600'
                    }`}
                  />
                ) : (
                  <User className={`w-5 h-5 transition-transform ${isProfileActive ? 'scale-110 stroke-[2.5]' : 'stroke-[1.8]'}`} />
                )}
                {isProfileActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-amber-400 rounded-full shadow-[0_0_8px_#f59e0b]" />
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">
                {customer ? (customer.name ? customer.name.split(' ')[0] : 'Profile') : 'Login'}
              </span>
            </button>
          </>
        ) : (
          <>
            {/* ========================================================= */}
            {/* TAB 1: FEED / ALL SHOPS MARKETPLACE                        */}
            {/* ========================================================= */}
            <button
              onClick={() => navigate('/')}
              className={`flex-1 flex flex-col items-center justify-center py-1 transition-all rounded-full cursor-pointer relative ${
                isFeedActive ? 'text-amber-400 font-bold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="relative">
                <Store className={`w-5 h-5 transition-transform ${isFeedActive ? 'scale-110 stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {isFeedActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-amber-400 rounded-full shadow-[0_0_8px_#f59e0b]" />
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">Feed</span>
            </button>

            {/* ========================================================= */}
            {/* TAB 2: EXPLORE / SEARCH (ALL SHOPS & PRODUCTS)             */}
            {/* ========================================================= */}
            <button
              onClick={() => navigate('/explore')}
              className={`flex-1 flex flex-col items-center justify-center py-1 transition-all rounded-full cursor-pointer relative ${
                isExploreActive ? 'text-amber-400 font-bold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="relative">
                <Compass className={`w-5 h-5 transition-transform ${isExploreActive ? 'scale-110 stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {isExploreActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-amber-400 rounded-full shadow-[0_0_8px_#f59e0b]" />
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">Explore</span>
            </button>

            {/* ========================================================= */}
            {/* TAB 3: ACTIVE DUKAN SWITCHER (NEXT TO PROFILE)            */}
            {/* ========================================================= */}
            {currentShop && (
              <button
                onClick={() => navigate(currentShop.url)}
                title={`${currentShop.name} par jayein`}
                className={`flex-1 flex flex-col items-center justify-center py-1 transition-all rounded-full cursor-pointer relative ${
                  isCurrentShopActive ? 'text-amber-400 font-bold' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div className="relative">
                  <span className={`text-base leading-none transition-transform block ${isCurrentShopActive ? 'scale-125' : 'scale-100 opacity-90'}`}>
                    {currentShop.icon || '🏪'}
                  </span>
                  {isCurrentShopActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-amber-400 rounded-full shadow-[0_0_8px_#f59e0b]" />
                  )}
                </div>
                <span className="text-[10px] tracking-tight mt-0.5 truncate max-w-[65px]">
                  {currentShop.shortName || currentShop.name}
                </span>
              </button>
            )}

            {/* ========================================================= */}
            {/* TAB 4: DUKANDAR DASHBOARD OR CUSTOMER PROFILE              */}
            {/* ========================================================= */}
            {(dukandar || isDashboardActive) ? (
              <button
                onClick={() => navigate('/master')}
                className={`flex-1 flex flex-col items-center justify-center py-1 transition-all rounded-full cursor-pointer relative ${
                  isDashboardActive ? 'text-amber-400 font-bold' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div className="relative">
                  <LayoutDashboard className={`w-5 h-5 transition-transform ${isDashboardActive ? 'scale-110 stroke-[2.5]' : 'stroke-[1.8]'}`} />
                  {isDashboardActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-amber-400 rounded-full shadow-[0_0_8px_#f59e0b]" />
                  )}
                </div>
                <span className="text-[10px] tracking-tight mt-0.5">Dashboard</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  if (customer) {
                    navigate('/profile');
                  } else {
                    navigate('/auth?role=customer&mode=login');
                  }
                }}
                className={`flex-1 flex flex-col items-center justify-center py-1 transition-all rounded-full cursor-pointer relative ${
                  isProfileActive ? 'text-amber-400 font-bold' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div className="relative">
                  {customerAvatar ? (
                    <img
                      src={customerAvatar}
                      alt={customer?.name || 'Profile'}
                      className={`w-5 h-5 rounded-full object-cover ring-1.5 transition-all ${
                        isProfileActive ? 'ring-amber-400 scale-110' : 'ring-zinc-600'
                      }`}
                    />
                  ) : (
                    <User className={`w-5 h-5 transition-transform ${isProfileActive ? 'scale-110 stroke-[2.5]' : 'stroke-[1.8]'}`} />
                  )}
                  {isProfileActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-amber-400 rounded-full shadow-[0_0_8px_#f59e0b]" />
                  )}
                </div>
                <span className="text-[10px] tracking-tight mt-0.5">
                  {customer ? (customer.name ? customer.name.split(' ')[0] : 'Profile') : 'Login'}
                </span>
              </button>
            )}
          </>
        )}
      </nav>
    </div>
  );
}
