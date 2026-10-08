import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  ArrowRight, 
  Tag, 
  Check, 
  Bike, 
  AlertCircle,
  Clock,
  ExternalLink,
  Flame,
  MapPin,
  QrCode,
  ShieldCheck,
  Banknote
} from 'lucide-react';
import UpiPaymentModal from './UpiPaymentModal';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useRealtimeDB } from '../context/RealtimeContext';
import { RESTAURANT_INFO } from '../data/menuData';
import { getImageUrl, handleImageError } from '../utils/imageHelper';

// =========================================================================
// PAYMENT MODE TOGGLE:
// Set to `false` per store requirement: UPI is dummy/simulated, so show
// Cash on Delivery (COD) as the active payment method.
// (UPI code is preserved intact below for future live PG activation)
// =========================================================================
const ENABLE_UPI = false;

export default function CartDrawer({ onOpenTracker }) {
  const { currentUser, isAuthenticated, openAuthModal, updateUserProfile } = useAuth();
  const { deals, initiateUpiPayment, storeInfo, updateStoreInfo } = useRealtimeDB();
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    discount,
    deliveryFee,
    taxes,
    grandTotal,
    freeDeliveryThreshold,
    amountForFreeDelivery,
    qualifiesForFreeDelivery,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    deliveryType,
    userAddress,
    setUserAddress,
    activeTracking,
    setIsTrackerOpen,
    startOrderTracking,
  } = useCart();

  const [activeTab, setActiveTab] = useState('cart'); // 'cart' or 'orders'
  const [couponInput, setCouponInput] = useState('');
  const [couponFeedback, setCouponFeedback] = useState(null);

  // Direct UPI vs Cash On Delivery (COD)
  const [paymentMethod, setPaymentMethod] = useState(ENABLE_UPI ? 'upi' : 'cod'); // 'upi' or 'cod'
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);
  const [pendingPaymentData, setPendingPaymentData] = useState(null);
  const [isInitiatingPayment, setIsInitiatingPayment] = useState(false);

  // Location Modal State
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [isCapturingGps, setIsCapturingGps] = useState(false);
  const [orderLiveGps, setOrderLiveGps] = useState(null);
  const [landmark, setLandmark] = useState('');
  const [gpsError, setGpsError] = useState('');
  const [manualAddress, setManualAddress] = useState('');

  // Strictly validate phone OTP verification status
  const cleanUserPhone = (currentUser?.phone || currentUser?.phoneNumber || '').replace(/\D/g, '').slice(-10);
  const isPhoneOtpVerified = Boolean(currentUser?.phoneVerified && cleanUserPhone.length === 10);

  const handleCaptureGPS = () => {
    setIsCapturingGps(true);
    setGpsError('');
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser");
      setIsCapturingGps(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const gpsData = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy),
          time: new Date().toLocaleTimeString(),
          mapsUrl: `https://maps.google.com/?q=${position.coords.latitude},${position.coords.longitude}`,
        };
        setOrderLiveGps(gpsData);
        setIsCapturingGps(false);
      },
      (error) => {
        setGpsError("GPS permission zaroori hai! Kripya browser me location allow karein ya niche complete exact address likhein.");
        setIsCapturingGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleConfirmLocation = async () => {
    if (!orderLiveGps) return;
    const locString = `GPS: ${orderLiveGps.lat.toFixed(5)}, ${orderLiveGps.lng.toFixed(5)} (±${orderLiveGps.accuracy}m) [${orderLiveGps.mapsUrl}]${landmark ? ' | ' + landmark : ''}`;
    
    setUserAddress(locString);
    if (isAuthenticated) {
      await updateUserProfile({ address: locString });
    }
    setShowLocationPrompt(false);
    
    // Automatically trigger proceedWithOrder via handleProceedCheckout
    setTimeout(() => {
      handleProceedCheckout(locString, orderLiveGps);
    }, 100);
  };

  const handleSaveManualAddress = async () => {
    if (!manualAddress.trim()) return;
    setUserAddress(manualAddress);
    if (isAuthenticated) {
      await updateUserProfile({ address: manualAddress });
    }
    // We still need GPS, but we can close prompt if they just wanted to update profile? 
    // Wait, let's keep it simple: if they provide manual address, we will require GPS anyway if they try to checkout.
    setShowLocationPrompt(false);
    setManualAddress('');
  };

  if (!isCartOpen) return null;

  const handleApplyCoupon = async (e) => {
    e?.preventDefault();
    if (!couponInput.trim()) return;
    const res = await applyCoupon(couponInput);
    setCouponFeedback(res);
    if (res.success) {
      setCouponInput('');
    }
  };

  const handleProceedCheckout = async (overrideAddress = null, gpsOverride = null) => {
    if (!isAuthenticated) {
      openAuthModal('phone');
      return;
    }

    const cleanUserPhone = (currentUser?.phone || currentUser?.phoneNumber || '').replace(/\D/g, '').slice(-10);
    const isPhoneOtpVerified = Boolean(currentUser?.phoneVerified && cleanUserPhone.length === 10);
    if (!isPhoneOtpVerified) {
      alert("⚠️ Shawarma Nights food delivery ke liye mobile number OTP verify hona aniwarya hai. Kripya apna number verify karein.");
      openAuthModal('phone');
      return;
    }

    const currentAddr = (typeof overrideAddress === 'string' ? overrideAddress : null) || (currentUser?.address || userAddress || '').trim();
    const activeGps = (gpsOverride && !gpsOverride.nativeEvent) ? gpsOverride : orderLiveGps;

    if (deliveryType === 'delivery' && !activeGps) {
      setShowLocationPrompt(true);
      return;
    }

    const generatedDeliveryOtp = String(Math.floor(1000 + Math.random() * 9000));

    if (paymentMethod === 'cod') {
      startOrderTracking({
        customerName: currentUser.name,
        customerPhone: `+91 ${currentUser.phone}`,
        address: currentAddr,
        paymentMethod: 'COD',
        orderGps: activeGps,
        deliveryOtp: generatedDeliveryOtp,
      });
      return;
    }

    setIsInitiatingPayment(true);
    const orderId = `SN-${Math.floor(100000 + Math.random() * 900000)}`;
    const itemsPayload = cart.map((c) => ({
      name: c.name,
      qty: c.quantity || 1,
      unitPrice: c.unitPrice,
    }));

    try {
      const res = await initiateUpiPayment({
        orderId,
        grandTotal,
        customerName: currentUser.name,
        customerPhone: `+91 ${currentUser.phone}`,
        address: currentAddr,
        items: itemsPayload,
        orderGps: activeGps,
        deliveryOtp: generatedDeliveryOtp,
      });

      if (res && res.success) {
        setPendingPaymentData({
          orderId: res.orderId || orderId,
          grandTotal: res.grandTotal || grandTotal,
          upiUrl: res.upiUrl,
          upiId: res.upiId,
          payeeName: res.payeeName,
          items: cart,
          customerName: currentUser.name,
          customerPhone: `+91 ${currentUser.phone}`,
          address: currentAddr,
          orderGps: activeGps,
          deliveryOtp: res.deliveryOtp || generatedDeliveryOtp,
        });
        setIsUpiModalOpen(true);
      } else {
        setPendingPaymentData({
          orderId,
          grandTotal,
          items: cart,
          customerName: currentUser.name,
          customerPhone: `+91 ${currentUser.phone}`,
          address: currentAddr,
          orderGps: activeGps,
          deliveryOtp: generatedDeliveryOtp,
        });
        setIsUpiModalOpen(true);
      }
    } catch (err) {
      console.error('Error initiating UPI payment:', err);
      setPendingPaymentData({
        orderId,
        grandTotal,
        items: cart,
        customerName: currentUser.name,
        customerPhone: `+91 ${currentUser.phone}`,
        address: currentAddr,
        orderGps: activeGps,
        deliveryOtp: generatedDeliveryOtp,
      });
      setIsUpiModalOpen(true);
    } finally {
      setIsInitiatingPayment(false);
    }
  };

  const handleUpiPaymentSuccess = (confirmedOrder) => {
    setIsUpiModalOpen(false);
    startOrderTracking({
      orderId: confirmedOrder?.orderId || pendingPaymentData?.orderId,
      customerName: currentUser?.name,
      customerPhone: `+91 ${currentUser?.phone}`,
      address: currentUser?.address || userAddress,
      paymentMethod: 'UPI',
      paymentStatus: 'paid',
      utr: confirmedOrder?.utr || 'VERIFIED-UPI',
      skipPlaceOrder: true,
      orderGps: pendingPaymentData?.orderGps || orderLiveGps,
      deliveryOtp: confirmedOrder?.deliveryOtp || pendingPaymentData?.deliveryOtp,
    });
  };

  const effectiveThreshold = (freeDeliveryThreshold !== undefined && freeDeliveryThreshold !== null && !isNaN(freeDeliveryThreshold))
    ? Number(freeDeliveryThreshold)
    : (storeInfo?.freeDeliveryThreshold !== undefined && storeInfo?.freeDeliveryThreshold !== null && !isNaN(storeInfo.freeDeliveryThreshold)
        ? Number(storeInfo.freeDeliveryThreshold)
        : (RESTAURANT_INFO.freeDeliveryThreshold ?? 350));

  const freeDeliveryProgress = qualifiesForFreeDelivery || effectiveThreshold <= 0
    ? 100
    : Math.min(100, Math.round((subtotal / effectiveThreshold) * 100));

  const getStatusText = (status) => {
    switch (status) {
      case 'new':
        return 'Order Confirmed (Kitchen me print hua)';
      case 'preparing':
        return 'Charcoal Spit Par Grill Ho Raha Hai';
      case 'out':
        return 'Rider Nikal Chuka Hai (On the way)';
      case 'delivered':
        return 'Delivered Hot & Steaming';
      default:
        return 'Order Received';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Dark backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-black/60 transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 26, stiffness: 260 }}
          className="w-screen max-w-md bg-white border-l border-zinc-200 shadow-2xl flex flex-col justify-between"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-zinc-100 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#DC2626] flex items-center justify-center text-white">
                  <ShoppingBag className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h2 className="text-base font-black text-zinc-900 font-display">
                    Customer Bag & Orders
                  </h2>
                  <p className="text-[11px] text-zinc-400 font-medium">
                    {cart.length > 0 ? `${cart.length} items in bag` : 'Fast Midnight Delivery'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {cart.length > 0 && activeTab === 'cart' && (
                  <button
                    onClick={clearCart}
                    className="text-xs text-zinc-400 hover:text-[#DC2626] transition-colors px-1"
                  >
                    Clear
                  </button>
                )}
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition-all"
                >
                  <X className="w-5 h-5 stroke-[2]" />
                </button>
              </div>
            </div>

            {/* Sub-tabs: Current Bag vs Placed Orders */}
            <div className="flex gap-2 mt-4 pt-1">
              <button
                onClick={() => setActiveTab('cart')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                  activeTab === 'cart'
                    ? 'bg-[#DC2626] text-white border-[#DC2626] shadow-sm'
                    : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Current Bag ({cart.reduce((s, i) => s + i.quantity, 0)})</span>
              </button>

              <button
                onClick={() => setActiveTab('orders')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                  activeTab === 'orders'
                    ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                    : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Active Orders {activeTracking ? '(1 Live)' : ''}</span>
              </button>
            </div>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
            
            {/* TAB 1: CURRENT BAG */}
            {activeTab === 'cart' && (
              <>
                {/* Free Delivery Bar */}
                {cart.length > 0 && (
                  <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200/80">
                    <div className="flex items-center justify-between text-xs font-medium mb-1.5 text-zinc-700">
                      <span className="flex items-center gap-1.5">
                        <Bike className="w-3.5 h-3.5 text-[#DC2626] stroke-[2]" />
                        {qualifiesForFreeDelivery ? (
                          <span className="text-emerald-700 font-bold">FREE Delivery Unlocked!</span>
                        ) : (
                          <span>
                            Add <strong className="text-zinc-900">₹{amountForFreeDelivery}</strong> more for Free Delivery
                          </span>
                        )}
                      </span>
                      <span className={`font-mono text-[11px] ${qualifiesForFreeDelivery ? 'text-emerald-700 font-bold' : 'text-zinc-400'}`}>
                        {freeDeliveryProgress}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${freeDeliveryProgress}%` }}
                        className={`h-full rounded-full transition-all duration-300 ${
                          qualifiesForFreeDelivery ? 'bg-emerald-600' : 'bg-[#DC2626]'
                        }`}
                      />
                    </div>
                  </div>
                )}

                {/* Empty Cart State */}
                {cart.length === 0 ? (
                  <div className="h-full py-16 flex flex-col items-center justify-center text-center space-y-3">
                    <div className="w-16 h-16 rounded-3xl bg-red-50 text-[#DC2626] flex items-center justify-center">
                      <ShoppingBag className="w-8 h-8 stroke-[1.75]" />
                    </div>
                    <h3 className="text-base font-black text-zinc-900">Aapka bag abhi khali hai</h3>
                    <p className="text-xs text-zinc-500 max-w-xs leading-relaxed">
                      Menu me jakar sizzling shawarma ya loaded fries ko bag me add karein.
                    </p>
                    <button
                      onClick={() => setIsCartOpen(false)}
                      className="mt-2 px-6 py-2.5 rounded-full bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-xs shadow-md transition-all"
                    >
                      Browse Delicious Menu
                    </button>
                  </div>
                ) : (
                  /* Cart Items List */
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div
                        key={item.lineId}
                        className="p-3.5 rounded-2xl border border-zinc-200/90 bg-white space-y-2.5 shadow-2xs hover:border-[#DC2626]/40 transition-all"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex gap-3">
                            <img
                              src={getImageUrl(item.image)}
                              alt={item.name}
                              onError={handleImageError}
                              className="w-14 h-14 rounded-xl object-cover shrink-0 border border-zinc-100"
                            />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${item.isVeg ? 'bg-emerald-600' : 'bg-[#DC2626]'}`} />
                                <h4 className="font-bold text-zinc-900 text-xs">
                                  {item.name}
                                </h4>
                              </div>

                              <div className="flex flex-wrap gap-1 mt-1 text-[10px] text-zinc-500">
                                {item.bread && (
                                  <span className="bg-zinc-100 px-1.5 py-0.5 rounded font-medium">
                                    {item.bread.name}
                                  </span>
                                )}
                                {item.spiciness && (
                                  <span className="bg-zinc-100 px-1.5 py-0.5 rounded font-medium">
                                    {item.spiciness}
                                  </span>
                                )}
                                {item.addons?.map((a) => (
                                  <span key={a.id} className="bg-red-50 text-[#DC2626] px-1.5 py-0.5 rounded font-bold">
                                    +{a.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => removeFromCart(item.lineId)}
                            className="text-zinc-400 hover:text-[#DC2626] p-1 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5 stroke-[2]" />
                          </button>
                        </div>

                        {/* Quantity controls and price */}
                        <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
                          <div className="text-zinc-400 text-xs font-semibold">
                            ₹{item.unitPrice} <span className="text-[10px]">each</span>
                          </div>

                          <div className="flex items-center gap-2.5">
                            <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-full px-2 py-0.5">
                              <button
                                onClick={() => updateQuantity(item.lineId, -1)}
                                className="text-zinc-500 hover:text-zinc-900 p-0.5"
                              >
                                <Minus className="w-3 h-3 stroke-[2.5]" />
                              </button>
                              <span className="font-black text-xs text-zinc-900 w-4 text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.lineId, 1)}
                                className="text-zinc-500 hover:text-zinc-900 p-0.5"
                              >
                                <Plus className="w-3 h-3 stroke-[2.5]" />
                              </button>
                            </div>

                            <span className="font-black text-sm text-zinc-900 w-16 text-right font-display">
                              ₹{item.unitPrice * item.quantity}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Promo Code Box */}
                {cart.length > 0 && (
                  <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700">
                      <Tag className="w-3.5 h-3.5 text-[#DC2626] stroke-[2]" />
                      <span>Promo Code</span>
                    </div>

                    {appliedCoupon ? (
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                          <div>
                            <div className="font-mono font-bold text-emerald-800 text-xs">
                              {appliedCoupon.code}
                            </div>
                            <div className="text-[10px] text-emerald-600">{appliedCoupon.label}</div>
                          </div>
                        </div>
                        <button
                          onClick={removeCoupon}
                          className="text-xs text-[#DC2626] hover:underline font-semibold"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleApplyCoupon} className="flex gap-2">
                        <input
                          type="text"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                          placeholder="e.g. NIGHT50"
                          className="flex-1 bg-white border border-zinc-200 rounded-xl px-3 py-1.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#DC2626] font-mono uppercase"
                        />
                        <button
                          type="submit"
                          className="px-4 py-1.5 rounded-xl bg-zinc-900 hover:bg-[#DC2626] text-white font-bold text-xs transition-all"
                        >
                          Apply
                        </button>
                      </form>
                    )}

                    {couponFeedback && !appliedCoupon && (
                      <p className={`text-[11px] flex items-center gap-1 ${couponFeedback.success ? 'text-emerald-600' : 'text-red-600'}`}>
                        <AlertCircle className="w-3 h-3 shrink-0 stroke-[2]" />
                        {couponFeedback.message}
                      </p>
                    )}

                    {!appliedCoupon && (deals || []).length > 0 && (
                      <div className="space-y-2 pt-2">
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Available Offers:</span>
                        <div className="flex flex-col gap-2">
                          {(deals || []).map((deal) => {
                            const isLocked = subtotal < (deal.minOrder || 0);
                            const progress = isLocked ? Math.min(100, Math.round((subtotal / (deal.minOrder || 1)) * 100)) : 100;
                            return (
                              <div
                                key={deal.id || deal.code}
                                className={`border rounded-xl p-3 flex flex-col gap-2 transition-all ${isLocked ? 'bg-zinc-50 border-zinc-200 opacity-80' : 'bg-white border-emerald-200 shadow-sm'}`}
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex items-center gap-2">
                                    <div className="bg-red-50 text-[#DC2626] font-mono font-bold text-xs px-2 py-1 rounded border border-red-100 flex items-center gap-1">
                                      <Tag className="w-3 h-3" />
                                      {deal.code}
                                    </div>
                                    {deal.isFirstOrder && (
                                      <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded">NEW USER</span>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    disabled={isLocked}
                                    onClick={async () => {
                                      setCouponInput(deal.code);
                                      const res = await applyCoupon(deal.code);
                                      setCouponFeedback(res);
                                    }}
                                    className={`text-xs font-bold px-3 py-1 rounded-full transition-all ${isLocked ? 'bg-zinc-200 text-zinc-500 cursor-not-allowed' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'}`}
                                  >
                                    {isLocked ? 'Locked' : 'Apply'}
                                  </button>
                                </div>
                                <div className="text-xs text-zinc-700 font-medium">
                                  {deal.title}
                                </div>
                                {isLocked ? (
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] text-zinc-500 font-medium">
                                      <span>Add ₹{(deal.minOrder - subtotal).toFixed(2)} more to unlock</span>
                                      <span>{progress}%</span>
                                    </div>
                                    <div className="w-full h-1 bg-zinc-200 rounded-full overflow-hidden">
                                      <div style={{ width: `${progress}%` }} className="h-full bg-zinc-400 rounded-full" />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Offer Unlocked
                                  </div>
                                )}
                                {deal.expiresAt && (
                                  <div className="text-[9px] text-zinc-400 flex items-center gap-1 mt-1">
                                    <Clock className="w-2.5 h-2.5" /> Expires {new Date(deal.expiresAt).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Bill Summary */}
                {cart.length > 0 && (
                  <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-2">
                    <h4 className="font-bold text-xs text-zinc-800 uppercase tracking-wider">
                      Bill Summary
                    </h4>

                    <div className="space-y-1.5 text-zinc-500 text-xs">
                      <div className="flex justify-between">
                        <span>Item Total</span>
                        <span className="text-zinc-900 font-medium">₹{subtotal}</span>
                      </div>

                      {discount > 0 && (
                        <div className="flex justify-between text-emerald-600 font-medium">
                          <span>Discount ({appliedCoupon?.code})</span>
                          <span>-₹{discount}</span>
                        </div>
                      )}

                      <div className="flex justify-between">
                        <span>Delivery Partner Fee</span>
                        <span>
                          {deliveryFee === 0 ? (
                            <span className="text-emerald-600 font-bold">FREE</span>
                          ) : (
                            <span className="text-zinc-900 font-medium">₹{deliveryFee}</span>
                          )}
                        </span>
                      </div>

                      {taxes > 0 && (
                        <div className="flex justify-between">
                          <span>Taxes & Charges {storeInfo?.taxesAndCharges?.taxPercent ? `(${storeInfo.taxesAndCharges.taxPercent}%)` : ''}</span>
                          <span className="text-zinc-900 font-medium">₹{taxes}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-zinc-200 flex justify-between items-baseline text-sm font-black text-zinc-900">
                      <span>To Pay</span>
                      <span className="text-xl text-[#DC2626] font-mono font-black">₹{grandTotal}</span>
                    </div>
                  </div>
                )}
                {/* Delivery Address & Verification Card */}
                <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-2">
                  {isAuthenticated ? (
                    isPhoneOtpVerified ? (
                      <>
                        <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                          <span>Delivery Details:</span>
                          <span className="text-emerald-600 font-extrabold flex items-center gap-1">
                            <Check className="w-3 h-3 stroke-[3]" />
                            <span>Phone OTP Verified</span>
                          </span>
                        </div>
                        <div className="font-bold text-zinc-900 text-xs">{currentUser.name} (+91 {currentUser.phone})</div>
                      </>
                    ) : (
                      <div className="flex items-center justify-between p-2.5 bg-red-50 border border-red-200 rounded-xl">
                        <div>
                          <div className="font-extrabold text-xs text-red-900">⚠️ Phone Not Verified!</div>
                          <div className="text-[10px] text-red-700">Food delivery ke liye SMS OTP verify karein</div>
                        </div>
                        <button
                          onClick={() => openAuthModal('phone')}
                          className="px-3.5 py-1.5 rounded-xl bg-[#DC2626] text-white font-extrabold text-xs shadow-xs hover:bg-[#B91C1C]"
                        >
                          Verify OTP
                        </button>
                      </div>
                    )
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-extrabold text-xs text-amber-900">Phone Number Required</div>
                        <div className="text-[10px] text-amber-700">Rider contact & live tracking</div>
                      </div>
                      <button
                        onClick={() => openAuthModal('phone')}
                        className="px-3 py-1.5 rounded-xl bg-[#DC2626] text-white font-bold text-xs shadow-xs hover:bg-[#B91C1C]"
                      >
                        Login
                      </button>
                    </div>
                  )}

                  {/* Address Section */}
                  {(() => {
                    return orderLiveGps ? (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5">
                        <div className="text-xs font-black text-emerald-800 flex items-center gap-1.5">
                          <Check className="w-4 h-4 stroke-[3]" />
                          🟢 Order Live GPS Captured
                        </div>
                        <div className="text-[10px] text-emerald-700 font-medium">
                          📍 {orderLiveGps.lat.toFixed(5)}, {orderLiveGps.lng.toFixed(5)}
                        </div>
                        <a href={orderLiveGps.mapsUrl} target="_blank" rel="noreferrer" className="text-[10px] text-blue-600 hover:underline font-bold">
                          [View on Google Maps]
                        </a>
                      </div>
                    ) : (
                      <button onClick={() => setShowLocationPrompt(true)} className="w-full text-left flex items-start gap-2 p-2 bg-orange-50 border border-orange-200 rounded-lg cursor-pointer hover:bg-orange-100 transition-colors">
                        <span className="text-orange-700 font-bold text-[11px]">⚠️ Live GPS Required: Order karne ke waqt aapki live location li jayegi.</span>
                      </button>
                    );
                  })()}
                </div>

                {/* Payment Option Selector - Cash on Delivery (Active) vs UPI (Preserved) */}
                <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    <span>Payment Mode</span>
                    <span className="text-emerald-600 font-extrabold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>{ENABLE_UPI ? 'Direct UPI Only • 100% Safe' : 'Cash on Delivery (COD) Active'}</span>
                    </span>
                  </div>

                  {ENABLE_UPI ? (
                    <div className="p-3.5 rounded-xl border-2 border-[#DC2626] bg-red-50/40 text-left relative flex items-center justify-between shadow-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#DC2626] text-white flex items-center justify-center shrink-0 shadow-xs">
                          <QrCode className="w-5 h-5 stroke-[2.2]" />
                        </div>
                        <div>
                          <div className="font-black text-xs text-zinc-900 leading-tight flex items-center gap-2">
                            Direct UPI / Instant QR
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              Auto-Verify
                            </span>
                          </div>
                          <div className="text-[10px] text-zinc-500 mt-0.5 leading-snug">
                            Google Pay, PhonePe, Paytm, BHIM, Cred (Any UPI App)
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl border-2 border-emerald-600 bg-emerald-50/40 text-left relative flex items-center justify-between shadow-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <Banknote className="w-5 h-5 stroke-[2.2]" />
                        </div>
                        <div>
                          <div className="font-black text-xs text-zinc-900 leading-tight flex items-center gap-2">
                            Cash on Delivery (COD)
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              Pay at Doorstep
                            </span>
                          </div>
                          <div className="text-[10px] text-zinc-500 mt-0.5 leading-snug">
                            Ghar par order deliver hone ke waqt delivery rider ko cash dein
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* TAB 2: ACTIVE PLACED ORDERS & STATUS */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                {activeTracking ? (
                  <div className="p-4 rounded-2xl bg-white border-2 border-[#DC2626] shadow-md space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black bg-red-50 text-[#DC2626] px-2 py-0.5 rounded">
                          {activeTracking.orderId}
                        </span>
                        <span className="text-zinc-400 text-[11px]">{activeTracking.placedAt}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                        Live Tracking
                      </span>
                    </div>

                    <div>
                      <div className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Live Status:</div>
                      <div className="text-sm font-black text-zinc-900 mt-0.5 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        <span>{getStatusText(activeTracking.status)}</span>
                      </div>
                    </div>

                    {/* Items ordered */}
                    <div className="bg-zinc-50 rounded-xl p-2.5 space-y-1 text-xs">
                      {activeTracking.items?.map((it, idx) => (
                        <div key={idx} className="flex justify-between text-zinc-700">
                          <span><strong>{it.quantity || it.qty}x</strong> {it.name}</span>
                          <span className="font-mono">₹{(it.unitPrice || 0) * (it.quantity || it.qty || 1)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center text-xs font-bold text-zinc-800 pt-1">
                      <span>Total Amount Paid:</span>
                      <span className="text-base text-[#DC2626] font-mono font-black">₹{activeTracking.grandTotal}</span>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => {
                          setIsCartOpen(false);
                          setIsTrackerOpen(true);
                        }}
                        className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-[#DC2626] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Live Animated Tracker Kholein</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-16 text-center space-y-3">
                    <Clock className="w-12 h-12 text-zinc-300 mx-auto" />
                    <h3 className="text-sm font-bold text-zinc-700">Koi active order nahi hai</h3>
                    <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                      Jab aap koi order place karenge, wo yahan live tracking ke sath dikhega.
                    </p>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Checkout Footer Button */}
          {cart.length > 0 && activeTab === 'cart' && (
            <div className="p-4 bg-white border-t border-zinc-200">
              <button
                disabled={isInitiatingPayment}
                onClick={handleProceedCheckout}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-black text-sm tracking-wide shadow-lg shadow-red-200 flex items-center justify-between transition-all disabled:opacity-75"
              >
                <div className="text-left">
                  <div className="text-[10px] uppercase font-bold text-red-200">Total Payable</div>
                  <div className="text-base font-extrabold font-mono">₹{grandTotal}</div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span>
                    {isInitiatingPayment
                      ? (ENABLE_UPI ? 'Generating UPI...' : 'Placing Order...')
                      : !isAuthenticated
                      ? (ENABLE_UPI ? 'Login & Pay with UPI' : 'Login & Place COD Order')
                      : !isPhoneOtpVerified
                      ? 'Verify Phone to Order'
                      : (ENABLE_UPI ? 'Pay via UPI / QR' : 'Place Order (Cash on Delivery)')}
                  </span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </div>
              </button>
            </div>
          )}

        </motion.div>
      </div>

      {/* Location Modal */}
      {showLocationPrompt && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white w-full max-w-md rounded-3xl p-5 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-black text-zinc-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#DC2626]" />
                📍 Live GPS Delivery Location Aniwarya Hai (Mandatory)
              </h3>
              <button onClick={() => setShowLocationPrompt(false)} className="p-1 text-zinc-400 hover:bg-zinc-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-zinc-500 mb-5">
              Rider seedha aapke paas pahuche, iske liye order karte waqt ki exact live GPS location aniwarya hai.
            </p>

            <div className="space-y-4">
              {/* Option A: GPS */}
              {!orderLiveGps ? (
                <>
                  <button
                    onClick={handleCaptureGPS}
                    disabled={isCapturingGps}
                    className="w-full p-3 rounded-2xl bg-blue-50 text-blue-700 font-bold text-sm flex items-center justify-center gap-2 border border-blue-200 hover:bg-blue-100 transition-all"
                  >
                    {isCapturingGps ? (
                      <span>🛰️ Satellite se live GPS coordinates liye ja rahe hain...</span>
                    ) : (
                      <span>📍 Meri Live Location Capture Karein (Live GPS)</span>
                    )}
                  </button>
                  {gpsError && (
                    <div className="text-xs font-bold text-red-600 bg-red-50 p-2 rounded-lg border border-red-200 text-center">
                      {gpsError}
                    </div>
                  )}
                </>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
                  <div className="text-sm font-black text-emerald-800 flex items-center gap-1.5">
                    <Check className="w-4 h-4 stroke-[3]" />
                    ✅ Live Location Capture Ho Gayi!
                  </div>
                  <div className="text-[11px] text-emerald-700 font-medium">
                    📍 GPS Coordinates: {orderLiveGps.lat.toFixed(5)}, {orderLiveGps.lng.toFixed(5)} (±{orderLiveGps.accuracy}m)
                  </div>
                  <div className="text-[11px] text-emerald-700 font-medium">
                    🕒 Time: {orderLiveGps.time}
                  </div>
                  <a href={orderLiveGps.mapsUrl} target="_blank" rel="noreferrer" className="text-[11px] text-blue-600 hover:underline font-bold">
                    [Google Maps par dekhein]
                  </a>
                </div>
              )}

              {/* Landmark Input */}
              <input
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="Ghar/Flat No, Floor ya Landmark (Optional)"
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#DC2626]"
              />

              <button
                onClick={handleConfirmLocation}
                disabled={!orderLiveGps}
                className="w-full py-3.5 rounded-xl bg-zinc-900 text-white font-black text-sm hover:bg-[#DC2626] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Location & Proceed to Order 🔥
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* UPI Payment Modal (Locked Amount, Dynamic QR & Bank SMS Auto-Verification) */}
      <UpiPaymentModal
        isOpen={isUpiModalOpen}
        onClose={() => setIsUpiModalOpen(false)}
        orderData={pendingPaymentData}
        onPaymentSuccess={handleUpiPaymentSuccess}
      />
    </div>
  );
}
