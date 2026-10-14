import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Store, Compass, User, LayoutDashboard, ExternalLink, Sparkles, ShoppingBag } from 'lucide-react';

export default function BottomNavBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname.toLowerCase();
  const params = new URLSearchParams(location.search);
  const storeParam = (params.get('storeId') || params.get('store') || '').toLowerCase();

  // Dukandar session detection
  const [dukandar, setDukandar] = useState(null);
  // Customer session detection
  const [customer, setCustomer] = useState(null);

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
    };

    readSessions();
    window.addEventListener('storage', readSessions);
    // Custom event to update navbar instantly when user uploads avatar or logs in
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
  const isFeedActive = (path === '/' || path === '' || path === '/churuone' || path === '/shawarma' || path === '/skyline' || path === '/nash' || Boolean(storeParam)) && !path.startsWith('/explore') && !path.startsWith('/profile') && !path.startsWith('/master') && !path.startsWith('/admin') && !path.startsWith('/auth');
  const isExploreActive = path.startsWith('/explore');
  const isProfileActive = path.startsWith('/profile') || (path.startsWith('/auth') && !dukandar);
  const isDashboardActive = path.startsWith('/master') || path.startsWith('/admin') || path.startsWith('/dukandar');

  // Customer Avatar source
  const customerAvatar = customer?.picture || customer?.photoURL || customer?.avatar;
  const customerInitials = (customer?.name || 'U').charAt(0).toUpperCase();

  // Open Dukandar Live Website
  const handleOpenMyDukan = () => {
    if (!dukandar) return;
    const targetSlug = (dukandar.storeSlug || dukandar.storeId || dukandar.dukanId || '').toLowerCase();
    
    // If pending review, direct to website preview with note
    if (dukandar.status === 'pending_review') {
      if (path.startsWith('/master')) {
        alert('Aapki dukan abhi technical review me hai. ChuruOne tech team aapki custom website taiyar kar rahi hai.');
      } else {
        navigate(`/master?storeId=${targetSlug}`);
      }
      return;
    }

    // If active store
    if (targetSlug === 'shawarma') {
      navigate('/shawarma');
    } else if (targetSlug === 'skyline') {
      navigate('/skyline');
    } else if (targetSlug === 'nash' || targetSlug === 'nash-studio') {
      navigate('/nash');
    } else {
      navigate(`/?storeId=${targetSlug}`);
    }
  };

  return (
    <div className="fixed bottom-3 inset-x-0 z-50 flex justify-center pointer-events-none px-3 sm:px-4">
      <nav 
        aria-label="Bottom Navigation"
        className="pointer-events-auto w-full max-w-md bg-zinc-950/90 backdrop-blur-2xl border border-white/10 rounded-full px-3 py-2 shadow-[0_12px_40px_rgba(0,0,0,0.55)] ring-1 ring-white/5 flex items-center justify-between transition-all"
      >
        {/* ========================================================= */}
        {/* TAB 1: FEED / SHOPS MARKETPLACE                           */}
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
        {/* DUKANDAR SPECIAL: APNI DUKAN (LIVE STORE VIEW BUTTON)     */}
        {/* ========================================================= */}
        {dukandar && (
          <button
            onClick={handleOpenMyDukan}
            title="Apni live dukan website dekhein"
            className="flex-1 flex flex-col items-center justify-center py-0.5 px-2 cursor-pointer transition-all active:scale-95 group"
          >
            <div className="bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 text-white px-3 py-1 rounded-full shadow-lg shadow-orange-500/30 flex items-center gap-1.5 border border-white/20">
              <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="text-[10px] font-black tracking-tight uppercase whitespace-nowrap">
                Apni Dukan
              </span>
            </div>
            <span className="text-[9px] text-zinc-400 mt-0.5 group-hover:text-zinc-200 transition-colors">
              Live View
            </span>
          </button>
        )}

        {/* ========================================================= */}
        {/* TAB 3: DUKANDAR DASHBOARD OR CUSTOMER PROFILE              */}
        {/* ========================================================= */}
        {dukandar ? (
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
      </nav>
    </div>
  );
}
