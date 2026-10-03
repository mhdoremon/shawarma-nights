import React, { useState, useMemo } from 'react';
import { useMaster } from '../context/MasterContext';
import { 
  Bike, 
  Phone, 
  MessageCircle, 
  MapPin, 
  CheckCircle2, 
  LogOut, 
  X, 
  Navigation, 
  RefreshCw, 
  Check, 
  AlertTriangle,
  Lock,
  Compass
} from 'lucide-react';

export default function DeliveryPartnerView() {
  const { 
    orders, 
    user, 
    logout, 
    updateOrderStatus, 
    verifyDeliveryOtp, 
    showToast,
    isConnected,
    refreshData 
  } = useMaster();

  const [filterTab, setFilterTab] = useState('ACTIVE'); // 'ACTIVE' | 'DELIVERED' | 'ALL'
  
  // Delivery OTP Modal State
  const [otpModalOrder, setOtpModalOrder] = useState(null);
  const [deliveryOtpInput, setDeliveryOtpInput] = useState('');
  const [cashConfirmed, setCashConfirmed] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const riderName = user?.name || user?.phone || 'Delivery Partner';
  const riderPhone = user?.phone || '';
  const riderVehicle = user?.vehicleType || 'Two-Wheeler';

  // Order counts
  const allOrdersList = Array.isArray(orders) ? orders : [];
  
  const activeOrdersCount = allOrdersList.filter(o => {
    const s = (o.status || 'new').toLowerCase();
    return s === 'preparing' || s === 'out_for_delivery' || s === 'ready' || s === 'out' || s === 'new';
  }).length;

  const deliveredOrdersCount = allOrdersList.filter(o => {
    const s = (o.status || '').toLowerCase();
    return s === 'delivered';
  }).length;

  // Filtered orders based on selected tab
  const displayOrders = useMemo(() => {
    if (filterTab === 'ACTIVE') {
      return allOrdersList.filter(o => {
        const s = (o.status || 'new').toLowerCase();
        return s === 'preparing' || s === 'out_for_delivery' || s === 'ready' || s === 'out' || s === 'new';
      });
    } else if (filterTab === 'DELIVERED') {
      return allOrdersList.filter(o => (o.status || '').toLowerCase() === 'delivered');
    }
    return allOrdersList;
  }, [allOrdersList, filterTab]);

  // Handle Verify OTP Submission
  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    if (!deliveryOtpInput.trim()) {
      setErrorMessage('Kripya 4-digit Delivery OTP enter karein');
      return;
    }

    const isPaid = otpModalOrder.paymentStatus === 'paid' || otpModalOrder.paymentMethod === 'UPI';
    const total = Number(otpModalOrder.total || otpModalOrder.grandTotal || 0);

    if (!isPaid && !cashConfirmed) {
      setErrorMessage(`Kripya pehle confirm karein ki aapne ₹${total} Cash le liya hai`);
      return;
    }

    setIsVerifying(true);
    setErrorMessage('');

    const res = await verifyDeliveryOtp(otpModalOrder.id, deliveryOtpInput.trim());
    setIsVerifying(false);

    if (res.success) {
      showToast(`Order #${otpModalOrder.orderNumber || otpModalOrder.id?.slice(-4)} successfully delivered!`, 'success');
      setOtpModalOrder(null);
      setDeliveryOtpInput('');
      setCashConfirmed(false);
    } else {
      setErrorMessage(res.message || 'Galat OTP! Customer se unka 4-digit OTP poochhein.');
    }
  };

  const openGoogleMaps = (address, lat, lng) => {
    let dest = address;
    if (lat && lng) {
      dest = `${lat},${lng}`;
    }
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#FFFBF7] text-zinc-900 p-4 sm:p-6 space-y-5 max-w-2xl mx-auto pb-24 font-sans">
      
      {/* 1. TOP HEADER CARD */}
      <div className="bg-white rounded-3xl p-6 shadow-xl space-y-4 border-0">
        
        {/* Top Row: Brand & Online Status */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-[#DC2626] tracking-wide">
              🛵 SHAWARMA EXPRESS
            </h2>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-0.5">
              DELIVERY PARTNER CONSOLE
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
              isConnected ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              {isConnected ? 'LIVE ONLINE' : 'RECONNECTING...'}
            </span>

            <button
              onClick={() => {
                refreshData();
                showToast('Orders sync ho rahe hain...', 'info');
              }}
              className="p-2 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-colors cursor-pointer border-0"
              title="Sync Orders"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Rider Profile Row */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
          <div>
            <h3 className="text-sm font-black text-zinc-900 flex items-center gap-1.5">
              <span>👤 {riderName}</span>
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5 font-medium">
              🛵 {riderVehicle} {riderPhone && `• 📞 ${riderPhone}`}
            </p>
          </div>

          <button
            onClick={() => {
              if (window.confirm('Kya aap delivery console se logout karna chahte hain?')) {
                logout();
              }
            }}
            className="px-3.5 py-1.5 rounded-full bg-red-50 hover:bg-red-100 text-red-600 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer border-0 flex items-center gap-1"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>LOGOUT</span>
          </button>
        </div>

        {/* Live GPS Radar Pill */}
        <div className="p-3 rounded-2xl bg-[#FFFBF7] flex items-center gap-2 text-xs font-bold text-emerald-700 shadow-xs">
          <Compass className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>📍 Rider GPS Radar: Active • Nearest-First Engine Ready</span>
        </div>

      </div>

      {/* 2. FILTER TABS ROW: ACTIVE / DELIVERED / ALL */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setFilterTab('ACTIVE')}
          className={`px-4 py-2 rounded-full text-xs font-black whitespace-nowrap transition-all cursor-pointer border-0 ${
            filterTab === 'ACTIVE'
              ? 'bg-[#DC2626] text-white shadow-md'
              : 'bg-white text-zinc-600 hover:bg-zinc-100 shadow-sm'
          }`}
        >
          🛵 ACTIVE ({activeOrdersCount})
        </button>

        <button
          onClick={() => setFilterTab('DELIVERED')}
          className={`px-4 py-2 rounded-full text-xs font-black whitespace-nowrap transition-all cursor-pointer border-0 ${
            filterTab === 'DELIVERED'
              ? 'bg-[#DC2626] text-white shadow-md'
              : 'bg-white text-zinc-600 hover:bg-zinc-100 shadow-sm'
          }`}
        >
          ✅ DELIVERED ({deliveredOrdersCount})
        </button>

        <button
          onClick={() => setFilterTab('ALL')}
          className={`px-4 py-2 rounded-full text-xs font-black whitespace-nowrap transition-all cursor-pointer border-0 ${
            filterTab === 'ALL'
              ? 'bg-[#DC2626] text-white shadow-md'
              : 'bg-white text-zinc-600 hover:bg-zinc-100 shadow-sm'
          }`}
        >
          📋 ALL ({allOrdersList.length})
        </button>
      </div>

      {/* 3. ORDER CARDS LIST */}
      {displayOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center space-y-2 shadow-xl border-0">
          <div className="text-3xl">🎉</div>
          <h4 className="text-base font-black text-zinc-900">KOI ORDER PENDING NAHI HAI</h4>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
            Sabhi orders deliver ho chuke hain ya kitchen se dispatch hone ka intezaar hai. Aap online hain — naya order aate hi turant yahan live update hoga!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayOrders.map((order, index) => {
            const customerName = order.customer?.name || order.customerName || 'Customer';
            const customerPhone = order.customer?.phone || order.customerPhone || '';
            const orderNum = order.orderNumber || order.id?.slice(-5) || 'ORD';
            const status = (order.status || 'new').toLowerCase();
            const total = Number(order.total || order.grandTotal || 0);
            const items = Array.isArray(order.items) ? order.items : [];
            const isPaid = order.paymentStatus === 'paid' || order.paymentMethod === 'UPI';
            const isFirstActive = index === 0 && (status === 'preparing' || status === 'out_for_delivery' || status === 'ready');

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl p-6 space-y-4 shadow-xl border-0"
              >
                
                {/* Nearest-First Proximity Badge */}
                {isFirstActive && (
                  <div className="w-full py-2 px-3 rounded-2xl bg-emerald-600 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-sm">
                    <span>🟢 NEXT DELIVERY: Sabse Pass (Nearest Customer First!)</span>
                  </div>
                )}

                {/* Header: Order ID & Status Pill */}
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-base font-black text-zinc-900">
                      #{orderNum}
                    </h4>
                    <p className="text-[11px] text-zinc-400 font-bold mt-0.5">
                      Ordered at {order.placedAt || 'Just now'}
                    </p>
                  </div>

                  <div>
                    {status === 'out_for_delivery' || status === 'out' ? (
                      <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase bg-amber-50 text-amber-700">
                        🛵 OUT FOR DELIVERY
                      </span>
                    ) : status === 'preparing' || status === 'ready' ? (
                      <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase bg-amber-50 text-amber-700">
                        🟡 IN KITCHEN (READY)
                      </span>
                    ) : status === 'delivered' ? (
                      <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase bg-emerald-50 text-emerald-700">
                        ✅ DELIVERED
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase bg-red-50 text-red-700">
                        NEW ORDER
                      </span>
                    )}
                  </div>
                </div>

                {/* Customer Info & Direct Call Buttons */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FFFBF7] shadow-xs">
                  <div>
                    <div className="text-sm font-black text-zinc-900">
                      👤 {customerName}
                    </div>
                    <div className="text-xs text-zinc-500 font-bold mt-0.5">
                      📞 {customerPhone || 'No phone provided'}
                    </div>
                  </div>

                  {customerPhone && (
                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${customerPhone}`}
                        className="px-3.5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 shadow-sm transition-all"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>CALL</span>
                      </a>
                      <a
                        href={`https://wa.me/${customerPhone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                        title="WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Delivery Address Box */}
                {order.address && (
                  <div className="p-3.5 rounded-2xl bg-[#FFFBF7] shadow-xs space-y-1 text-xs">
                    <div className="flex items-start gap-1.5 text-zinc-800">
                      <MapPin className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
                      <span className="font-bold leading-relaxed">{order.address}</span>
                    </div>
                    {order.lat && order.lng && (
                      <p className="text-[11px] font-mono text-sky-600 pl-5">
                        🛰️ Captured GPS: {order.lat}, {order.lng}
                      </p>
                    )}
                  </div>
                )}

                {/* 1-Tap Google Maps Navigation Button */}
                {order.address && (
                  <button
                    type="button"
                    onClick={() => openGoogleMaps(order.address, order.lat, order.lng)}
                    className="w-full py-3 rounded-full bg-sky-600 hover:bg-sky-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg transition-all border-0"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>OPEN GOOGLE MAPS NAVIGATION (DIRECTIONS)</span>
                  </button>
                )}

                {/* Items Breakdown */}
                {items.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-[#FFFBF7] shadow-xs space-y-1 text-xs">
                    <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block mb-1">
                      ITEMS ORDERED:
                    </span>
                    {items.map((it, i) => (
                      <div key={i} className="flex justify-between text-zinc-700">
                        <span>• {it.name} x{it.qty || 1}</span>
                        <span className="font-bold text-zinc-900">₹{(it.unitPrice || it.price || 0) * (it.qty || 1)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Payment Collection Badge */}
                <div>
                  {isPaid ? (
                    <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-800 space-y-0.5 shadow-xs">
                      <div className="text-xs font-black text-emerald-700">
                        ✅ ONLINE PAID (₹0 to Collect)
                      </div>
                      <p className="text-[11px] text-emerald-600 font-medium">
                        Customer ne UPI se online payment kar diya hai. Cash nahi lena.
                      </p>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-2xl bg-amber-50 text-amber-900 space-y-0.5 shadow-xs">
                      <div className="text-xs font-black text-amber-700">
                        💵 CASH ON DELIVERY: ₹{total} COLLECT KAREIN!
                      </div>
                      <p className="text-[11px] text-amber-800 font-medium">
                        Customer se ₹{total} cash collect karein aur dukan par jama karein.
                      </p>
                    </div>
                  )}
                </div>

                {/* 1-Tap Action Workflow Progression Buttons */}
                <div className="pt-1 space-y-2">
                  
                  {/* Status: Preparing / Ready / New */}
                  {(status === 'preparing' || status === 'ready' || status === 'new') && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          updateOrderStatus(order.id, 'out_for_delivery');
                          showToast(`Order #${orderNum} Picked Up! Out for delivery.`, 'success');
                        }}
                        className="w-full py-3.5 rounded-full bg-[#DC2626] hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-xl transition-all border-0"
                      >
                        <Bike className="w-4 h-4 stroke-[2.2]" />
                        <span>PICK UP & OUT FOR DELIVERY</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setOtpModalOrder(order);
                          setDeliveryOtpInput('');
                          setCashConfirmed(false);
                          setErrorMessage('');
                        }}
                        className="w-full py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all border-0"
                      >
                        <Lock className="w-4 h-4" />
                        <span>VERIFY OTP & COMPLETE DELIVERY (ग्राहक OTP डालें)</span>
                      </button>
                    </>
                  )}

                  {/* Status: Out For Delivery */}
                  {(status === 'out_for_delivery' || status === 'out') && (
                    <button
                      type="button"
                      onClick={() => {
                        setOtpModalOrder(order);
                        setDeliveryOtpInput('');
                        setCashConfirmed(false);
                        setErrorMessage('');
                      }}
                      className="w-full py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-xl transition-all border-0"
                    >
                      <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                      <span>VERIFY OTP & DELIVER (डिलीवरी पूरी करें)</span>
                    </button>
                  )}

                  {/* Status: Delivered */}
                  {status === 'delivered' && (
                    <div className="w-full py-2.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-black text-center flex items-center justify-center gap-1.5">
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      <span>DELIVERED SUCCESSFULLY</span>
                    </div>
                  )}

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* DELIVERY CONFIRMATION OTP MODAL */}
      {otpModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white text-zinc-900 rounded-3xl max-w-sm w-full p-6 sm:p-7 space-y-4 shadow-2xl border-0">
            
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-base font-black text-emerald-700 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-emerald-600" />
                  <span>DELIVERY CONFIRMATION OTP</span>
                </h3>
                <p className="text-xs text-zinc-400 font-bold">
                  Order #{otpModalOrder.orderNumber || otpModalOrder.id?.slice(-4)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOtpModalOrder(null)}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-600 border-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-500 leading-relaxed">
              Customer ko deliver karne ke baad unse 4-digit Delivery OTP lekar yahan enter karein.
            </p>

            {/* If COD, Show Cash Collection Checkbox */}
            {otpModalOrder.paymentStatus !== 'paid' && otpModalOrder.paymentMethod !== 'UPI' && (
              <div className="p-3.5 rounded-2xl bg-amber-50 text-amber-900 space-y-2 border-0">
                <div className="text-xs font-black text-amber-800">
                  💵 CASH ON DELIVERY: ₹{Number(otpModalOrder.total || otpModalOrder.grandTotal || 0)}
                </div>
                <label className="flex items-start gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={cashConfirmed}
                    onChange={(e) => setCashConfirmed(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 mt-0.5"
                  />
                  <span className="text-xs font-black text-amber-900">
                    Haan, customer se ₹{Number(otpModalOrder.total || otpModalOrder.grandTotal || 0)} Cash le liya hai.
                  </span>
                </label>
              </div>
            )}

            <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-black text-zinc-500 uppercase tracking-wider mb-1 text-center">
                  CUSTOMER DELIVERY OTP (4 DIGITS)
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  maxLength={6}
                  value={deliveryOtpInput}
                  onChange={(e) => setDeliveryOtpInput(e.target.value)}
                  placeholder="• • • •"
                  className="w-full bg-[#FFFBF7] rounded-2xl py-3 text-center text-2xl font-black text-zinc-900 tracking-widest font-mono focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all shadow-xs border-0"
                />
              </div>

              {errorMessage && (
                <div className="p-3 rounded-2xl bg-red-50 text-red-700 text-xs font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="flex-1 py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider shadow-lg hover:shadow-xl transition-all border-0 cursor-pointer disabled:opacity-50"
                >
                  {isVerifying ? 'VERIFYING...' : 'VERIFY OTP & COMPLETE DELIVERY'}
                </button>
                <button
                  type="button"
                  onClick={() => setOtpModalOrder(null)}
                  className="py-3.5 px-5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs border-0 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
