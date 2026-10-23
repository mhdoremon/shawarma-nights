import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, LayoutGrid, MessageSquare, User, LayoutDashboard, ShieldCheck } from 'lucide-react';
import { PHONEPE_REVIEW_MODE } from '../config/siteMode';

const STORE_CATALOG = {
  'shawarma': { id: 'shawarma', shortName: 'Shawarma', name: 'Shawarma Nights', url: '/shawarma' },
  'skyline':  { id: 'skyline',  shortName: 'Skyline',  name: 'Skyline Outfits', url: '/skyline' },
  'nash':        { id: 'nash-studio', shortName: 'Nash', name: 'Nash Studio', url: '/nash' },
  'nash-studio': { id: 'nash-studio', shortName: 'Nash', name: 'Nash Studio', url: '/nash' },
};

export function isChuruOnePlatformId(id) {
  if (!id) return true;
  const s = String(id).toLowerCase().trim();
  return (
    s === 'churuone' || 
    s === 'churu-one' || 
    s === 'churu_one' || 
    s === 'marketplace' || 
    s === 'platform' || 
    s === 'all' || 
    s === 'hub'
  );
}

function resolveStoreMeta(storeId) {
  if (!storeId || isChuruOnePlatformId(storeId)) return null;
  const s = String(storeId).toLowerCase().trim();
  if (STORE_CATALOG[s]) return STORE_CATALOG[s];
  // Mohalla stores are part of Feed and do NOT get an extra store button in navbar
  return null;
}

/* ─── NAV PILL BUTTON ──────────────────────────────────────────── */
function NavBtn({ icon: Icon, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer
        ${active
          ? 'bg-stone-100 px-5 py-2.5 gap-2 text-stone-900'
          : 'p-2.5 text-stone-500 hover:text-stone-800 hover:bg-stone-50'
        }
      `}
    >
      <Icon
        className={`transition-all ${active ? 'w-[18px] h-[18px] stroke-[2.2]' : 'w-[20px] h-[20px] stroke-[1.7]'}`}
      />
      {active && (
        <span className="text-[12px] font-semibold tracking-tight whitespace-nowrap">{label}</span>
      )}
    </button>
  );
}

/* ─── AVATAR PILL BUTTON ────────────────────────────────────────── */
function AvatarBtn({ customer, active, onClick }) {
  const avatar = customer?.picture || customer?.photoURL || customer?.avatar;
  const label = customer ? (customer.name ? customer.name.split(' ')[0] : 'Profile') : 'Login';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer
        ${active
          ? 'bg-stone-100 px-4 py-2 gap-2 text-stone-900'
          : 'p-2.5 text-stone-500 hover:text-stone-800 hover:bg-stone-50'
        }
      `}
    >
      {avatar ? (
        <img
          src={avatar}
          alt={customer?.name || 'Profile'}
          className={`rounded-full object-cover transition-all ${active ? 'w-5 h-5 ring-2 ring-stone-300' : 'w-[20px] h-[20px]'}`}
        />
      ) : (
        <User className={`transition-all ${active ? 'w-[18px] h-[18px] stroke-[2.2]' : 'w-[20px] h-[20px] stroke-[1.7]'}`} />
      )}
      {active && (
        <span className="text-[12px] font-semibold tracking-tight whitespace-nowrap">{label}</span>
      )}
    </button>
  );
}

/* ─── MAIN COMPONENT ───────────────────────────────────────────── */
export default function BottomNavBar({ hidden = false }) {
  if (hidden) return null;

  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname.toLowerCase();
  const params = new URLSearchParams(location.search);
  const storeParam = (params.get('storeId') || params.get('store') || '').toLowerCase();
  const isSocialBypass = params.get('mode') === 'social' || params.get('view') === 'social' || params.get('social') === '1';
  const isPhonePeReview = PHONEPE_REVIEW_MODE && !isSocialBypass;

  const [dukandar, setDukandar] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [activeShop, setActiveShop] = useState(() => {
    if (isPhonePeReview) return STORE_CATALOG['skyline'];
    try {
      localStorage.removeItem('churuone_active_shop');
      const saved = JSON.parse(sessionStorage.getItem('churuone_active_shop') || 'null');
      if (saved && saved.id && STORE_CATALOG[saved.id]) return saved;
    } catch {}
    return null;
  });

  const currentShop = useMemo(() => {
    if (isPhonePeReview) return STORE_CATALOG['skyline'];
    if (path.startsWith('/skyline') || path.startsWith('/outfits') || storeParam === 'skyline') return STORE_CATALOG['skyline'];
    if (path.startsWith('/nash') || path.startsWith('/salon') || storeParam === 'nash' || storeParam === 'nash-studio') return STORE_CATALOG['nash-studio'];
    if (path.startsWith('/shawarma') || path.startsWith('/sn') || storeParam === 'shawarma') return STORE_CATALOG['shawarma'];
    if (storeParam && STORE_CATALOG[storeParam]) return STORE_CATALOG[storeParam];
    if (activeShop && STORE_CATALOG[activeShop.id]) return activeShop;
    return null;
  }, [path, storeParam, activeShop, isPhonePeReview]);

  useEffect(() => {
    let detected = null;
    if (path.startsWith('/skyline') || storeParam === 'skyline') detected = STORE_CATALOG['skyline'];
    else if (path.startsWith('/nash') || storeParam === 'nash' || storeParam === 'nash-studio') detected = STORE_CATALOG['nash-studio'];
    else if (path.startsWith('/shawarma') || storeParam === 'shawarma') detected = STORE_CATALOG['shawarma'];
    else if (storeParam && STORE_CATALOG[storeParam]) detected = STORE_CATALOG[storeParam];

    if (detected) {
      setActiveShop(detected);
      try { sessionStorage.setItem('churuone_active_shop', JSON.stringify(detected)); } catch {}
    } else if (path === '/' || path === '' || isChuruOnePlatformId(storeParam) || (storeParam && !STORE_CATALOG[storeParam])) {
      // Feed or mohalla store -> clear activeShop so duplicate pill never shows
      setActiveShop(null);
      try { sessionStorage.removeItem('churuone_active_shop'); } catch {}
    }
  }, [path, storeParam]);

  useEffect(() => {
    const readSessions = () => {
      try {
        const dToken = localStorage.getItem('churuone_master_token');
        const dUser = JSON.parse(localStorage.getItem('churuone_master_user') || 'null');
        setDukandar(dToken && dUser ? dUser : null);
      } catch { setDukandar(null); }
      try {
        const cUser = JSON.parse(localStorage.getItem('churuone_customer_user') || localStorage.getItem('churuone_user') || 'null');
        setCustomer(cUser);
      } catch { setCustomer(null); }
      try {
        const savedShop = JSON.parse(sessionStorage.getItem('churuone_active_shop') || 'null');
        if (savedShop?.id && STORE_CATALOG[savedShop.id]) setActiveShop(savedShop);
        else setActiveShop(null);
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

  // Hide on test/policy pages
  if (path.startsWith('/test-') || path.startsWith('/policies')) return null;

  // Active state flags
  const isCurrentShopActive = Boolean(currentShop && (
    (currentShop.id === 'shawarma'    && (path.startsWith('/shawarma') || storeParam === 'shawarma')) ||
    (currentShop.id === 'skyline'     && (path.startsWith('/skyline')  || storeParam === 'skyline'))  ||
    (currentShop.id === 'nash-studio' && (path.startsWith('/nash')     || storeParam === 'nash' || storeParam === 'nash-studio')) ||
    (storeParam && storeParam === currentShop.id)
  ));
  const isDukandarAuth  = path.startsWith('/auth') && (params.get('role') === 'dukandar' || params.get('type') === 'dukandar');
  const isFeedActive    = (path === '/' || path === '' || path === '/churuone') && !isCurrentShopActive && !path.startsWith('/explore') && !path.startsWith('/profile') && !path.startsWith('/master') && !path.startsWith('/auth');
  const isExploreActive = path.startsWith('/explore');
  const isProfileActive = path.startsWith('/profile') || (path.startsWith('/auth') && !isDukandarAuth && !dukandar);
  const isDashboardActive = path.startsWith('/master') || path.startsWith('/admin') || path.startsWith('/dukandar') || isDukandarAuth;

  /* ── PHONEPE REVIEW MODE (ultra-clean 3-tab) ─────────────────── */
  if (isPhonePeReview) {
    return (
      <div className="fixed bottom-4 inset-x-0 z-50 flex justify-center pointer-events-none px-4">
        <nav
          aria-label="Bottom Navigation"
          className="pointer-events-auto flex items-center gap-1 bg-white rounded-full px-2 py-2 shadow-[0_4px_32px_rgba(0,0,0,0.12)] border border-stone-100"
        >
          <NavBtn icon={Home}        label="Home"     active={path === '/' || path.startsWith('/skyline')} onClick={() => navigate('/')} />
          <NavBtn icon={ShieldCheck} label="Policies" active={path.startsWith('/terms') || path.startsWith('/privacy')} onClick={() => navigate('/terms-and-conditions')} />
          <AvatarBtn customer={customer} active={isProfileActive} onClick={() => customer ? navigate('/profile') : navigate('/auth?role=customer&mode=login')} />
        </nav>
      </div>
    );
  }

  /* ── STANDARD MODE ──────────────────────────────────────────────── */
  return (
    <div className="fixed bottom-4 inset-x-0 z-50 flex justify-center pointer-events-none px-4">
      <nav
        aria-label="Bottom Navigation"
        className="pointer-events-auto flex items-center gap-1 bg-white rounded-full px-2 py-2 shadow-[0_4px_32px_rgba(0,0,0,0.12)] border border-stone-100"
      >
        {/* Feed / Home */}
        <NavBtn
          icon={Home}
          label="Feed"
          active={isFeedActive}
          onClick={() => navigate('/')}
        />

        {/* Explore / All Stores */}
        <NavBtn
          icon={LayoutGrid}
          label="Explore"
          active={isExploreActive}
          onClick={() => navigate('/explore')}
        />

        {/* Active Dukan (dynamic — only shown once a store is visited) */}
        {currentShop && (
          <NavBtn
            icon={MessageSquare}
            label={currentShop.shortName}
            active={isCurrentShopActive}
            onClick={() => navigate(currentShop.url)}
          />
        )}

        {/* Dukandar Dashboard OR Customer Profile / Login */}
        {(dukandar || isDashboardActive) ? (
          <NavBtn
            icon={LayoutDashboard}
            label="Dashboard"
            active={isDashboardActive}
            onClick={() => navigate('/master')}
          />
        ) : (
          <AvatarBtn
            customer={customer}
            active={isProfileActive}
            onClick={() => customer ? navigate('/profile') : navigate('/auth?role=customer&mode=login')}
          />
        )}
      </nav>
    </div>
  );
}
