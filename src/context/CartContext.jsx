import React, { createContext, useContext, useState, useEffect } from 'react';
import { PROMO_CODES, RESTAURANT_INFO } from '../data/menuData';
import { sounds } from '../utils/soundEffects';
import { useRealtimeDB } from './RealtimeContext';
import { API_URL, getStoreId } from '../config/api';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { placeOrder, orders, deals, storeInfo } = useRealtimeDB();

  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('sn_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [appliedCoupon, setAppliedCoupon] = useState(() => {
    try {
      const saved = localStorage.getItem('sn_coupon');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  
  const [activeTracking, setActiveTracking] = useState(() => {
    try {
      const saved = localStorage.getItem('sn_active_tracking');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [deliveryType, setDeliveryType] = useState('delivery');
  const [userAddress, setUserAddress] = useState('');

  // Sync active tracking with real-time orders updates from Dukandar
  useEffect(() => {
    if (activeTracking && orders.length > 0) {
      const liveOrder = orders.find((o) => o.id === activeTracking.orderId);
      if (liveOrder) {
        let stepIndex = 0;
        if (liveOrder.status === 'new') stepIndex = 0;
        else if (liveOrder.status === 'preparing') stepIndex = 1;
        else if (liveOrder.status === 'out' || liveOrder.status === 'out_for_delivery') stepIndex = 3;
        else if (liveOrder.status === 'delivered') stepIndex = 4;

        const needsOtpSync = liveOrder.deliveryOtp && !activeTracking.deliveryOtp;
        if (activeTracking.step !== stepIndex || activeTracking.status !== liveOrder.status || needsOtpSync) {
          setActiveTracking((prev) => ({
            ...prev,
            status: liveOrder.status,
            step: stepIndex,
            deliveryOtp: liveOrder.deliveryOtp || prev?.deliveryOtp,
          }));
        }
      }
    }
  }, [orders, activeTracking]);

  useEffect(() => {
    try {
      localStorage.setItem('sn_cart', JSON.stringify(cart));
    } catch (e) {
      console.warn(e);
    }
  }, [cart]);

  useEffect(() => {
    try {
      if (activeTracking) {
        localStorage.setItem('sn_active_tracking', JSON.stringify(activeTracking));
      } else {
        localStorage.removeItem('sn_active_tracking');
      }
    } catch (e) {
      console.warn(e);
    }
  }, [activeTracking]);

  useEffect(() => {
    try {
      if (appliedCoupon) {
        localStorage.setItem('sn_coupon', JSON.stringify(appliedCoupon));
      } else {
        localStorage.removeItem('sn_coupon');
      }
    } catch (e) {
      console.warn(e);
    }
  }, [appliedCoupon]);

  const addToCart = (item, customization = null, shouldOpenCart = false) => {
    sounds.playPop();

    const bread = customization?.bread || (item.options?.bread ? item.options.bread[0] : null);
    const spiciness =
      customization?.spiciness || (item.options?.spiciness ? item.options.spiciness[0] : 'Standard');
    const addons = customization?.addons || [];
    const quantity = customization?.quantity || 1;

    const breadCost = bread?.price || 0;
    const addonsCost = addons.reduce((sum, a) => sum + (a.price || 0), 0);
    const unitPrice = Number(item.price || 0) + Number(breadCost || 0) + Number(addonsCost || 0);

    const addonIds = addons.map((a) => a.id).sort().join(',');
    const lineId = `${item.id}-${bread?.name || 'def'}-${spiciness}-${addonIds}`;

    setCart((prev) => {
      const existingIdx = prev.findIndex((ci) => ci.lineId === lineId);
      if (existingIdx > -1) {
        const copy = [...prev];
        copy[existingIdx].quantity += quantity;
        return copy;
      }
      return [
        ...prev,
        {
          lineId,
          itemId: item.id,
          name: item.name,
          image: item.image,
          unitPrice,
          basePrice: item.price,
          quantity,
          isVeg: item.isVeg,
          bread,
          spiciness,
          addons,
        },
      ];
    });

    // Only open cart drawer if explicitly requested (default is false so user can keep browsing)
    if (shouldOpenCart) {
      setIsCartOpen(true);
    }
  };

  const updateQuantity = (lineId, delta) => {
    sounds.playTick();
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.lineId === lineId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (lineId) => {
    sounds.playTick();
    setCart((prev) => prev.filter((item) => item.lineId !== lineId));
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
  };

  const itemsCount = cart.reduce((total, i) => total + i.quantity, 0);
  const subtotal = cart.reduce((total, i) => total + i.unitPrice * i.quantity, 0);

  let discount = 0;
  let freeItemName = null;
  if (appliedCoupon && subtotal >= (appliedCoupon.minOrder || 0)) {
    const type = appliedCoupon.discountType || appliedCoupon.type;
    if (type === 'percentage' || appliedCoupon.discountPercent) {
      const percent = appliedCoupon.discountValue || appliedCoupon.value || appliedCoupon.discountPercent;
      const calculated = (subtotal * percent) / 100;
      discount = Math.min(calculated, appliedCoupon.maxCap || appliedCoupon.maxDiscount || Infinity);
    } else if (type === 'flat' || appliedCoupon.flatDiscount) {
      discount = appliedCoupon.discountValue || appliedCoupon.value || appliedCoupon.flatDiscount;
    } else if (type === 'bogo') {
      if (itemsCount >= 2) {
        let cheapest = cart[0]?.unitPrice || 0;
        for (let item of cart) {
          if (item.unitPrice < cheapest) cheapest = item.unitPrice;
        }
        discount = cheapest;
      }
    } else if (type === 'freeItem') {
      freeItemName = appliedCoupon.freeItemName || 'Surprise Free Item';
    }
  }

  const freeDeliveryThreshold = (storeInfo?.freeDeliveryThreshold !== undefined && storeInfo?.freeDeliveryThreshold !== null && !isNaN(storeInfo.freeDeliveryThreshold))
    ? Number(storeInfo.freeDeliveryThreshold)
    : RESTAURANT_INFO.freeDeliveryThreshold;

  const qualifiesForFreeDelivery =
    subtotal >= freeDeliveryThreshold || (appliedCoupon && (appliedCoupon.discountType === 'freeDelivery' || appliedCoupon.type === 'freeDelivery' || appliedCoupon.freeDelivery));
  const deliveryFee =
    deliveryType === 'takeaway' || itemsCount === 0 || qualifiesForFreeDelivery
      ? 0
      : RESTAURANT_INFO.baseDeliveryFee;
  const amountForFreeDelivery = qualifiesForFreeDelivery ? 0 : Math.max(0, freeDeliveryThreshold - subtotal);

  const taxableAmount = Math.max(0, subtotal - discount);
  const isTaxEnabled = storeInfo?.taxesAndCharges?.enabled === true;
  const taxPercent = isTaxEnabled ? Number(storeInfo?.taxesAndCharges?.taxPercent || 0) : 0;
  const packagingCharge = (isTaxEnabled && itemsCount > 0) ? Number(storeInfo?.taxesAndCharges?.packagingCharge || 0) : 0;
  const taxes = (isTaxEnabled && itemsCount > 0 && (taxPercent > 0 || packagingCharge > 0))
    ? Math.round((taxableAmount * taxPercent) / 100) + packagingCharge
    : 0;
  const grandTotal = Math.max(0, taxableAmount + deliveryFee + taxes);

  useEffect(() => {
    if (subtotal > 0) {
      const timer = setTimeout(() => {
        const activeStoreId = getStoreId();
        fetch(`${API_URL}/api/coupon/best?subtotal=${subtotal}&phone=&storeId=${encodeURIComponent(activeStoreId)}`, {
          headers: { 'x-store-id': activeStoreId }
        })
          .then(res => res.json())
          .then(data => {
            if (data.success && (data.coupon || data.deal)) {
              setAppliedCoupon(data.coupon || data.deal);
            }
          })
          .catch(() => {});
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [subtotal]);

  const applyCoupon = async (codeStr) => {
    const code = (codeStr || '').trim().toUpperCase();
    if (!code) return { success: false, message: 'Kripya promo code enter karein.' };

    try {
      const activeStoreId = getStoreId();
      const itemCategories = [...new Set(cart.map(c => c.category || 'all'))];
      const res = await fetch(`${API_URL}/api/coupon/validate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-store-id': activeStoreId
        },
        body: JSON.stringify({ code, subtotal, phone: '', itemCategories, storeId: activeStoreId })
      });
      const data = await res.json();
      const isValid = Boolean(data.success || data.valid);
      const couponObj = data.coupon || data.deal;

      if (isValid && couponObj) {
        setAppliedCoupon(couponObj);
        sounds.playChime();
        return { success: true, message: `Hooray! Coupon "${code}" applied successfully.` };
      } else {
        return { success: false, message: data.message || data.reason || 'Invalid promo code.' };
      }
    } catch (e) {
      const liveDeal = (deals || []).find((d) => (d.code || '').trim().toUpperCase() === code);
      const coupon = liveDeal || PROMO_CODES[code];

      if (!coupon) {
        return { success: false, message: 'Invalid promo code. Kripya valid offer code dalein!' };
      }

      const minOrder = coupon.minOrder || 0;
      if (subtotal < minOrder) {
        return { success: false, message: `Yeh coupon sirf ₹${minOrder} ya usse zyada ke order par lagu hoga.` };
      }

      setAppliedCoupon(coupon);
      sounds.playChime();
      return { success: true, message: `Hooray! Coupon "${code}" applied successfully.` };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    sounds.playTick();
  };

  const startOrderTracking = (orderMeta = {}) => {
    const orderId = orderMeta.orderId || ('SN-' + Math.floor(100000 + Math.random() * 900000));
    const paymentMethod = orderMeta.paymentMethod || 'COD';
    const paymentStatus = orderMeta.paymentStatus || (paymentMethod === 'UPI' ? 'paid' : 'pending_cash');
    const utr = orderMeta.utr || null;
    const deliveryOtp = orderMeta.deliveryOtp || String(Math.floor(1000 + Math.random() * 9000));

    const trackingObj = {
      orderId,
      items: orderMeta.items || [...cart],
      grandTotal: orderMeta.grandTotal || grandTotal,
      deliveryAddress: orderMeta.address || userAddress,
      deliveryType,
      placedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      estimatedArrival: '18 - 24 Mins',
      step: 0,
      status: 'new',
      paymentMethod,
      paymentStatus,
      utr,
      deliveryOtp,
    };

    // Broadcast to real-time database if not already placed by server verifier
    if (!orderMeta.skipPlaceOrder) {
      placeOrder({
        orderId,
        customerName: orderMeta.customerName || 'Online Customer',
        customerPhone: orderMeta.customerPhone || '+91 98765-43210',
        address: orderMeta.address || userAddress,
        items: (orderMeta.items || cart).map((c) => ({
          name: c.name,
          qty: c.quantity || c.qty,
          unitPrice: c.unitPrice,
        })),
        grandTotal: orderMeta.grandTotal || grandTotal,
        note: orderMeta.note || '',
        paymentMethod,
        paymentStatus,
        utr,
        deliveryOtp,
        orderGps: orderMeta.orderGps || null,
      });
    }

    setActiveTracking(trackingObj);
    setIsTrackerOpen(true);
    clearCart();
    setIsCartOpen(false);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        itemsCount,
        subtotal,
        discount,
        freeItemName,
        deliveryFee,
        taxes,
        grandTotal,
        freeDeliveryThreshold,
        amountForFreeDelivery,
        qualifiesForFreeDelivery,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        isCartOpen,
        setIsCartOpen,
        isTrackerOpen,
        setIsTrackerOpen,
        deliveryType,
        setDeliveryType,
        userAddress,
        setUserAddress,
        activeTracking,
        setActiveTracking,
        startOrderTracking,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
