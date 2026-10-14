import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Camera, 
  Phone, 
  Mail, 
  Calendar, 
  CheckCircle2, 
  ShoppingBag, 
  LogOut, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  MapPin, 
  Loader2, 
  Store, 
  Clock, 
  ExternalLink,
  ChevronRight,
  PackageCheck,
  Receipt
} from 'lucide-react';
import BottomNavBar from '../../components/BottomNavBar';
import { clearChuruOneSession, getChuruOneSession, subscribeToChuruOneAuth } from '../../utils/ssoHelper';

const STORE_CONFIG = {
  'shawarma': {
    name: 'Shawarma Nights',
    category: 'Food & Dining',
    icon: '🍔',
    url: '/shawarma',
    color: 'from-red-600 to-amber-600',
    accent: 'text-red-600',
    bgLight: 'bg-red-50 border-red-200'
  },
  'skyline': {
    name: 'Skyline Premium Outfits',
    category: 'Fashion & Wardrobe',
    icon: '👕',
    url: '/skyline',
    color: 'from-stone-900 to-zinc-700',
    accent: 'text-zinc-900',
    bgLight: 'bg-zinc-100 border-zinc-300'
  },
  'nash-studio': {
    name: 'Nash Studio',
    category: 'Salon & Grooming',
    icon: '✂️',
    url: '/nash',
    color: 'from-emerald-700 to-teal-900',
    accent: 'text-emerald-700',
    bgLight: 'bg-emerald-50 border-emerald-200'
  }
};

export default function CustomerProfilePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [customer, setCustomer] = useState(() => {
    try {
      const session = getChuruOneSession();
      if (session?.user) return session.user;
      return JSON.parse(localStorage.getItem('churuone_customer_user') || localStorage.getItem('churuone_user') || 'null');
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('churuone_token') || localStorage.getItem('churuone_sso_token') || '';
  });

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoMessage, setPhotoMessage] = useState({ text: '', type: 'info' });

  // Dukan-Wise Orders State
  const [selectedStoreTab, setSelectedStoreTab] = useState('all');
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [ordersByStore, setOrdersByStore] = useState({});
  const [allOrders, setAllOrders] = useState([]);

  // Reactive SSO Session Listener
  useEffect(() => {
    const unsubscribe = subscribeToChuruOneAuth((user, tok) => {
      setCustomer(user);
      if (tok) setToken(tok);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Universal Multi-Store Orders
  useEffect(() => {
    if (!customer?.phone && !customer?.email) {
      setAllOrders([]);
      setOrdersByStore({});
      return;
    }

    let isMounted = true;
    setIsLoadingOrders(true);

    const fetchOrders = async () => {
      try {
        const phone = customer.phone || customer.phoneNumber || '';
        const email = customer.email || '';
        const res = await fetch(`/api/orders/customer?phone=${encodeURIComponent(phone)}&email=${encodeURIComponent(email)}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.success) {
            setOrdersByStore(data.stores || {});
            setAllOrders(data.allOrders || []);
            setIsLoadingOrders(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Orders fetch error:', err);
      }

      // Local fallback from localStorage
      if (isMounted) {
        try {
          const churuOrders = JSON.parse(localStorage.getItem('churuone_orders') || '[]');
          const snOrders = JSON.parse(localStorage.getItem('sn_orders') || '[]');
          const combined = [...churuOrders, ...snOrders].filter(o => {
            const p = String(o.customerPhone || o.phone || o.customer?.phone || '').replace(/\D/g, '').slice(-10);
            return p === String(customer.phone).slice(-10);
          });
          setAllOrders(combined);
        } catch {}
        setIsLoadingOrders(false);
      }
    };

    fetchOrders();
    return () => { isMounted = false; };
  }, [customer?.phone, customer?.email]);

  // Handle Profile Photo Upload & Compression
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setPhotoMessage({ text: 'Kripya valid photo (JPEG, PNG, WebP) chunein.', type: 'error' });
      return;
    }

    setIsUploadingPhoto(true);
    setPhotoMessage({ text: 'Photo compress aur upload ho rahi hai...', type: 'info' });

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        try {
          // Canvas compression: max 500x500px, quality 0.82
          const canvas = document.createElement('canvas');
          const maxDim = 500;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const compressedDataUri = canvas.toDataURL('image/jpeg', 0.82);
          const phone = customer?.phone || '';

          const res = await fetch('/api/auth/customer/upload-avatar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone,
              token,
              avatarUrl: compressedDataUri
            })
          });

          const data = await res.json();
          setIsUploadingPhoto(false);

          if (data.success && data.user) {
            const updated = { ...customer, ...data.user, picture: compressedDataUri, photoURL: compressedDataUri };
            setCustomer(updated);
            localStorage.setItem('churuone_customer_user', JSON.stringify(updated));
            localStorage.setItem('churuone_user', JSON.stringify(updated));
            window.dispatchEvent(new Event('churuone_user_updated'));
            setPhotoMessage({ text: 'Profile photo safaltapoorvak update ho gayi!', type: 'success' });
          } else {
            const updated = { ...customer, picture: compressedDataUri, photoURL: compressedDataUri };
            setCustomer(updated);
            localStorage.setItem('churuone_customer_user', JSON.stringify(updated));
            localStorage.setItem('churuone_user', JSON.stringify(updated));
            window.dispatchEvent(new Event('churuone_user_updated'));
            setPhotoMessage({ text: 'Photo save ho gayi!', type: 'success' });
          }
        } catch (err) {
          setIsUploadingPhoto(false);
          setPhotoMessage({ text: 'Photo process nahi ho payi. Dobara koshish karein.', type: 'error' });
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Universal Atomic Logout: Clear all cookies, all store keys, and broadcast to all tabs
  const handleSignOut = () => {
    clearChuruOneSession();
    setCustomer(null);
    setToken('');
    setAllOrders([]);
    setOrdersByStore({});
    navigate('/');
  };

  // Filtered orders based on active store tab
  const displayedOrders = selectedStoreTab === 'all'
    ? allOrders
    : (ordersByStore[selectedStoreTab]?.orders || allOrders.filter(o => o.storeId === selectedStoreTab));

  // Compute store tab list
  const storeTabList = [
    { id: 'all', label: 'Sabhi Orders', count: allOrders.length, icon: '🛍️' },
    { 
      id: 'shawarma', 
      label: 'Shawarma Nights', 
      count: ordersByStore['shawarma']?.orders?.length || allOrders.filter(o => o.storeId === 'shawarma').length, 
      icon: '🍔' 
    },
    { 
      id: 'skyline', 
      label: 'Skyline Outfits', 
      count: ordersByStore['skyline']?.orders?.length || allOrders.filter(o => o.storeId === 'skyline').length, 
      icon: '👕' 
    },
    { 
      id: 'nash-studio', 
      label: 'Nash Studio', 
      count: ordersByStore['nash-studio']?.orders?.length || allOrders.filter(o => o.storeId === 'nash-studio' || o.storeId === 'nash').length, 
      icon: '✂️' 
    }
  ];

  const avatarUrl = customer?.picture || customer?.photoURL || customer?.avatar;
  const initials = (customer?.name || 'Customer').charAt(0).toUpperCase();

  // Helper for Order Status Badge
  const getStatusBadge = (status) => {
    const s = String(status || 'pending').toLowerCase();
    if (s === 'delivered' || s === 'completed') {
      return <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">✓ Delivered</span>;
    }
    if (s === 'out_for_delivery') {
      return <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">🛵 Out for Delivery</span>;
    }
    if (s === 'preparing' || s === 'confirmed') {
      return <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">⚡ Preparing</span>;
    }
    if (s === 'cancelled') {
      return <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-red-50 text-red-800 border border-red-200">✕ Cancelled</span>;
    }
    return <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200">⏳ Order Received</span>;
  };

  return (
    <div className="min-h-screen bg-[#FFFDF9] text-zinc-900 font-sans pb-28 selection:bg-amber-400 selection:text-zinc-950">
      
      {/* 1. TOP NAVBAR */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-zinc-200/80 px-4 py-3 sm:py-4">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-zinc-950 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-zinc-950 leading-none">
                ChuruOne Profile
              </h1>
              <p className="text-[10px] text-zinc-500 font-medium">Unified Social Commerce Account</p>
            </div>
          </div>

          <button
            onClick={() => navigate('/')}
            className="text-xs font-bold text-zinc-600 hover:text-zinc-950 px-3 py-1.5 rounded-full border border-zinc-200 hover:border-zinc-300 transition-colors cursor-pointer"
          >
            ← Shop Feed
          </button>
        </div>
      </header>

      {/* 2. MAIN CONTENT */}
      <main className="max-w-xl mx-auto px-4 py-6 space-y-6">

        {/* If user not logged in */}
        {!customer ? (
          <div className="bg-white rounded-3xl p-8 border border-zinc-200 shadow-xl text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
              <User className="w-8 h-8 stroke-[1.5]" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-zinc-950">
                Apna ChuruOne Account Kholein
              </h2>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto leading-relaxed">
                Shawarma Nights, Skyline Outfits aur Nash Studio par 1-tap shopping aur direct live orders ke liye apna customer account login karein.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-center">
              <button
                onClick={() => navigate('/auth?role=customer&mode=login')}
                className="px-6 py-3 bg-zinc-950 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Sign In Karein</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => navigate('/auth?role=customer&mode=register')}
                className="px-6 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Naya Account Banayein
              </button>
            </div>
          </div>
        ) : (
          /* Logged In Customer Profile Card */
          <>
            {/* Header / Avatar Profile Hero */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-xl flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-amber-500 via-red-500 to-amber-500" />

              {/* Avatar with Camera Trigger */}
              <div className="relative mb-3 group">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-zinc-100 ring-4 ring-amber-400/40 shadow-lg flex items-center justify-center">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={customer.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-amber-500 to-red-600 text-white flex items-center justify-center text-3xl font-black">
                      {initials}
                    </div>
                  )}
                </div>

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />

                {/* Camera Click Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Profile photo upload karein"
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-zinc-950 hover:bg-black text-white flex items-center justify-center shadow-lg border-2 border-white transition-transform active:scale-90 cursor-pointer"
                >
                  {isUploadingPhoto ? (
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* User Name & Handle */}
              <h2 className="text-xl sm:text-2xl font-black text-zinc-950 tracking-tight">
                {customer.name || 'ChuruOne Customer'}
              </h2>
              {customer.username && (
                <span className="text-xs font-mono font-semibold text-zinc-500 mt-0.5">
                  @{customer.username}
                </span>
              )}

              {/* Verified Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold mt-2.5 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified ChuruOne Customer</span>
              </div>

              {/* Quick Instagram-Style Stats Row */}
              <div className="grid grid-cols-3 gap-2 w-full max-w-sm mt-5 pt-4 border-t border-zinc-100 text-center">
                <div className="p-2 rounded-xl bg-zinc-50/80">
                  <span className="block text-base font-black text-zinc-950">{allOrders.length}</span>
                  <span className="text-[10px] text-zinc-500 font-medium">Orders Placed</span>
                </div>
                <div className="p-2 rounded-xl bg-zinc-50/80">
                  <span className="block text-base font-black text-zinc-950">{Object.keys(ordersByStore).length || 3}</span>
                  <span className="text-[10px] text-zinc-500 font-medium">Stores Available</span>
                </div>
                <div className="p-2 rounded-xl bg-zinc-50/80">
                  <span className="block text-base font-black text-zinc-950">Churu</span>
                  <span className="text-[10px] text-zinc-500 font-medium">Home City</span>
                </div>
              </div>

              {/* Photo Message Toast */}
              {photoMessage.text && (
                <div className={`mt-3 p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
                  photoMessage.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}>
                  <span>{photoMessage.text}</span>
                </div>
              )}
            </div>

            {/* Account Details Card */}
            <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-xl space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-zinc-600" />
                <span>Account Information</span>
              </h3>

              <div className="divide-y divide-zinc-100 text-xs">
                {/* Mobile */}
                <div className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-zinc-500">
                    <Phone className="w-4 h-4 text-zinc-400" />
                    <span>Mobile Number</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-zinc-900">
                    <span>+91 {customer.phone}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                </div>

                {/* Email */}
                <div className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-zinc-500">
                    <Mail className="w-4 h-4 text-zinc-400" />
                    <span>Email Address</span>
                  </div>
                  <span className="font-semibold text-zinc-900">
                    {customer.email || 'Not Linked'}
                  </span>
                </div>

                {/* Address */}
                {customer.address && (
                  <div className="py-3 flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2.5 text-zinc-500 shrink-0">
                      <MapPin className="w-4 h-4 text-zinc-400" />
                      <span>Saved Address</span>
                    </div>
                    <span className="font-medium text-zinc-700 text-right text-[11px] leading-tight max-w-[240px]">
                      {customer.address}
                    </span>
                  </div>
                )}

                {/* Unique ID */}
                <div className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-zinc-500">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>ChuruOne ID</span>
                  </div>
                  <span className="font-mono text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded text-[11px]">
                    {customer.churuOneId || customer.id || 'CUST-CHURU'}
                  </span>
                </div>
              </div>
            </div>

            {/* DUKAN-WISE ORDERS SECTION */}
            <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-zinc-600" />
                    <span>Dukan-Wise Activity ({allOrders.length})</span>
                  </h3>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Aapke sabhi dukanon ke live orders ek hi jagah</p>
                </div>

                {isLoadingOrders && (
                  <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                )}
              </div>

              {/* Instagram-Style Horizontal Store Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {storeTabList.map(tab => {
                  const isActive = selectedStoreTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setSelectedStoreTab(tab.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 border ${
                        isActive 
                          ? 'bg-zinc-950 text-white border-zinc-950 shadow-sm' 
                          : 'bg-zinc-100/80 hover:bg-zinc-200/80 text-zinc-700 border-zinc-200/60'
                      }`}
                    >
                      <span>{tab.icon}</span>
                      <span>{tab.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isActive ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-200 text-zinc-600'}`}>
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Orders List */}
              {displayedOrders.length === 0 ? (
                <div className="p-8 bg-zinc-50 rounded-2xl text-center space-y-3 border border-zinc-100">
                  <div className="w-12 h-12 rounded-full bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto text-xl">
                    🛍️
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-700">Koi order record nahi mila</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      {selectedStoreTab === 'all' 
                        ? 'ChuruOne shops se browsing shuru karein aur apna pehla order place karein!' 
                        : `${STORE_CONFIG[selectedStoreTab]?.name || 'Is dukan'} par abhi koi order nahi hai.`}
                    </p>
                  </div>
                  {selectedStoreTab !== 'all' && STORE_CONFIG[selectedStoreTab] && (
                    <button
                      onClick={() => navigate(STORE_CONFIG[selectedStoreTab].url)}
                      className="px-4 py-2 bg-zinc-950 text-white text-xs font-bold rounded-xl hover:bg-black transition-all cursor-pointer inline-flex items-center gap-1 shadow-sm"
                    >
                      <span>{STORE_CONFIG[selectedStoreTab].name} Kholein</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  {displayedOrders.map((ord, idx) => {
                    const sId = ord.storeId || 'shawarma';
                    const storeMeta = STORE_CONFIG[sId] || {
                      name: ord.storeName || 'ChuruOne Store',
                      category: 'Local Shop',
                      icon: '🛍️',
                      url: '/'
                    };

                    const orderDate = ord.createdAt 
                      ? new Date(ord.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                      : (ord.placedAt || ord.date || 'Recent');

                    const totalAmount = ord.total || ord.grandTotal || ord.amount || 0;
                    const items = Array.isArray(ord.items) ? ord.items : [];

                    return (
                      <div 
                        key={ord.id || ord.orderId || idx}
                        className="p-4 rounded-2xl border border-zinc-200/90 bg-white hover:border-zinc-300 transition-all shadow-sm space-y-3"
                      >
                        {/* Header: Store Info & Status */}
                        <div className="flex items-start justify-between gap-2 border-b border-zinc-100 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{storeMeta.icon}</span>
                            <div>
                              <span className="font-bold text-xs text-zinc-950 block leading-tight">
                                {storeMeta.name}
                              </span>
                              <span className="text-[10px] text-zinc-400 font-mono">
                                #{ord.id || ord.orderId || `ORD-${idx + 1}`} • {orderDate}
                              </span>
                            </div>
                          </div>
                          <div>
                            {getStatusBadge(ord.status)}
                          </div>
                        </div>

                        {/* Items Preview */}
                        {items.length > 0 && (
                          <div className="space-y-1 text-xs text-zinc-700 bg-zinc-50/70 p-2.5 rounded-xl border border-zinc-100">
                            {items.map((it, iIdx) => (
                              <div key={iIdx} className="flex items-center justify-between text-[11px]">
                                <span className="font-medium text-zinc-900">
                                  {it.qty || it.quantity || 1}x {it.name || it.title || 'Item'}
                                  {it.size ? ` (${it.size})` : ''}
                                  {it.selectedBread ? ` • ${it.selectedBread}` : ''}
                                </span>
                                <span className="text-zinc-500 font-mono">₹{(it.unitPrice || it.price || 0) * (it.qty || it.quantity || 1)}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Footer: Payment & Total Amount + CTA */}
                        <div className="flex items-center justify-between pt-1 text-xs">
                          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                            <Receipt className="w-3.5 h-3.5 text-zinc-400" />
                            <span className="capitalize">{ord.paymentMethod || 'Online'}</span>
                            <span>•</span>
                            <span className="font-black text-zinc-950 text-sm">₹{totalAmount}</span>
                          </div>

                          <button
                            onClick={() => navigate(storeMeta.url)}
                            className="text-[11px] font-bold text-zinc-600 hover:text-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-200 hover:border-zinc-300 transition-colors inline-flex items-center gap-1 cursor-pointer"
                          >
                            <span>Dukan Kholein</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* MASTER LOGOUT BUTTON (Unified logout across all stores) */}
            <div className="pt-2">
              <button
                onClick={handleSignOut}
                className="w-full bg-white hover:bg-red-50 text-zinc-800 hover:text-red-700 font-bold py-4 rounded-2xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer border border-zinc-200 shadow-sm"
              >
                <LogOut className="w-4 h-4 text-red-600" />
                <span>Log Out from All ChuruOne Stores</span>
              </button>
              <p className="text-[10px] text-center text-zinc-400 mt-2 font-medium">
                Log out karne par aap Shawarma Nights, Skyline aur Nash Studio sabhi se ek sath log out ho jayenge.
              </p>
            </div>
          </>
        )}

      </main>

      {/* Floating Instagram-style navigation dock */}
      <BottomNavBar />

    </div>
  );
}
