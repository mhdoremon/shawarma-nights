import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Lock,
  Flame,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Radio,
  Smartphone,
  ArrowRight,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { sounds } from '../utils/soundEffects';
import { useRealtimeDB } from '../context/RealtimeContext';
import { API_URL, WS_URL } from '../config/api';

export default function UpiPaymentModal({
  isOpen,
  onClose,
  orderData,
  paymentData,
  onPaymentSuccess
}) {
  // Support both orderData and paymentData prop names seamlessly
  const effectiveData = orderData || paymentData || {};

  const {
    lastPaymentConfirmation,
    lastPaymentConfirmed,
    storeInfo
  } = useRealtimeDB?.() || {};

  // Extract critical payment parameters
  const orderId = effectiveData.orderId || effectiveData.id || 'SN-000000';
  const grandTotal = Number(effectiveData.grandTotal || effectiveData.total || 0);
  const upiId = effectiveData.upiId || storeInfo?.payment?.upiId || 'shawarmanights@upi';
  const payeeName = effectiveData.payeeName || storeInfo?.payment?.payeeName || 'Shawarma Nights';

  // Construct standard UPI intent link
  const fallbackUpiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${grandTotal.toFixed(2)}&cu=INR&tn=${encodeURIComponent(orderId)}&tr=${encodeURIComponent(orderId)}`;
  const activeUpiUrl = effectiveData.upiUrl || fallbackUpiUrl;

  // Crisp QR Code API URL
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(activeUpiUrl)}&margin=8`;

  // Local Component State
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes (600 seconds)
  const [copied, setCopied] = useState(false);
  const [showCloseWarning, setShowCloseWarning] = useState(false);
  const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(false);
  const [confirmedPayload, setConfirmedPayload] = useState(null);
  const [activeAppClicked, setActiveAppClicked] = useState(null);
  const [isOpeningCashfree, setIsOpeningCashfree] = useState(false);

  const hasConfirmedRef = useRef(false);
  const pollingIntervalRef = useRef(null);
  const wsRef = useRef(null);
  const broadcastChannelRef = useRef(null);

  const handlePayWithCashfree = async () => {
    setIsOpeningCashfree(true);
    try {
      const baseUrl = API_URL || '';
      const res = await fetch(`${baseUrl}/api/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: grandTotal || 120,
          customerPhone: (effectiveData.customerPhone || '').replace(/\D/g, '').slice(-10) || '7023963189',
          customerName: effectiveData.customerName || 'Customer',
          orderId: orderId,
        }),
      });

      const data = await res.json();
      if (!data.paymentSessionId) {
        throw new Error(data.error || data.details?.message || 'Cashfree payment session nahi mila');
      }

      const { load } = await import('@cashfreepayments/cashfree-js');
      const cashfree = await load({ mode: 'sandbox' });
      if (!cashfree) throw new Error('Cashfree JS SDK load nahi ho saka');

      await cashfree.checkout({
        paymentSessionId: data.paymentSessionId,
        redirectTarget: '_modal',
      });

      // Verify payment status after modal interaction
      try {
        const verifyRes = await fetch(`${baseUrl}/api/payment/cashfree/verify/${data.orderId}`);
        const verifyData = await verifyRes.json();
        if (verifyData.isPaid || verifyData.status === 'PAID') {
          triggerSuccessSequence(verifyData.order || verifyData || { orderId: data.orderId, amount: grandTotal });
        }
      } catch (e) {
        console.log('Verification check notice:', e.message);
      }
    } catch (err) {
      console.error('Cashfree launch error:', err);
      alert('Cashfree Gateway error: ' + (err.message || 'Check console'));
    } finally {
      setIsOpeningCashfree(false);
    }
  };

  // Trigger Celebration Sequence
  const triggerSuccessSequence = useCallback(
    (payload) => {
      if (hasConfirmedRef.current) return;
      hasConfirmedRef.current = true;

      setIsPaymentConfirmed(true);
      setConfirmedPayload(payload);

      // Play Fanfare / Chime
      try {
        if (sounds.playSuccessFanfare) {
          sounds.playSuccessFanfare();
        } else if (sounds.playChime) {
          sounds.playChime();
        }
      } catch (e) {
        console.warn('Audio play notice:', e);
      }

      // Confetti burst
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.55 },
          colors: ['#DC2626', '#10B981', '#F59E0B', '#FFFFFF']
        });
      } catch (e) {}

      // Notify caller after celebration animation (1.5 seconds)
      setTimeout(() => {
        if (onPaymentSuccess) {
          onPaymentSuccess(payload?.order || payload || effectiveData);
        }
      }, 1500);
    },
    [onPaymentSuccess, effectiveData]
  );

  // Reset state whenever modal opens for a new order
  useEffect(() => {
    if (isOpen) {
      hasConfirmedRef.current = false;
      setIsPaymentConfirmed(false);
      setConfirmedPayload(null);
      setTimeLeft(600);
      setShowCloseWarning(false);
      setActiveAppClicked(null);
    }
  }, [isOpen, orderId]);

  // 10-Minute Countdown Timer
  useEffect(() => {
    if (!isOpen || isPaymentConfirmed) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isPaymentConfirmed]);

  // Realtime Context Listener: Watch lastPaymentConfirmation / lastPaymentConfirmed
  useEffect(() => {
    const confirmation = lastPaymentConfirmation || lastPaymentConfirmed;
    if (confirmation && isOpen && !hasConfirmedRef.current) {
      const confirmedOrderId =
        confirmation.orderId ||
        confirmation.order?.id ||
        confirmation.order?.orderId ||
        confirmation.id;

      if (
        confirmedOrderId &&
        orderId &&
        (String(confirmedOrderId).trim().toLowerCase() === String(orderId).trim().toLowerCase() ||
          String(confirmedOrderId).includes(String(orderId).replace(/\D/g, '')))
      ) {
        triggerSuccessSequence(confirmation);
      }
    }
  }, [lastPaymentConfirmation, lastPaymentConfirmed, orderId, isOpen, triggerSuccessSequence]);

  // Direct BroadcastChannel & WebSocket Fallback Listeners
  useEffect(() => {
    if (!isOpen || isPaymentConfirmed) return;

    // 1. BroadcastChannel fallback
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const bc = new BroadcastChannel('sn_realtime_broadcast');
        broadcastChannelRef.current = bc;
        bc.onmessage = (e) => {
          const { type, payload } = e.data || {};
          if (type === 'PAYMENT_CONFIRMED' && payload) {
            const matchId = payload.orderId || payload.order?.id || payload.order?.orderId;
            if (matchId && String(matchId) === String(orderId)) {
              triggerSuccessSequence(payload);
            }
          }
        };
      } catch (e) {}
    }

    // 2. Direct WebSocket fallback for instant reception
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsEndpoint = WS_URL ? `${WS_URL}/ws` : `${protocol}//${window.location.host}/ws`;

    try {
      const ws = new WebSocket(wsEndpoint);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'PAYMENT_CONFIRMED' && data.payload) {
            const pId = data.payload.orderId || data.payload.order?.id || data.payload.order?.orderId;
            if (pId && String(pId) === String(orderId)) {
              triggerSuccessSequence(data.payload);
            }
          }
        } catch (err) {}
      };
    } catch (e) {}

    // 3. Periodic Status Polling Fallback (Every 3.5s)
    const pollStatus = async () => {
      if (hasConfirmedRef.current) return;
      try {
        const res = await fetch(`${API_URL}/api/payment/status/${encodeURIComponent(orderId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'confirmed') {
            triggerSuccessSequence(data);
          }
        }
      } catch (err) {}
    };

    pollingIntervalRef.current = setInterval(pollStatus, 3500);

    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      if (broadcastChannelRef.current) broadcastChannelRef.current.close();
      if (wsRef.current) wsRef.current.close();
    };
  }, [isOpen, orderId, isPaymentConfirmed, triggerSuccessSequence]);

  // Copy UPI ID handler
  const handleCopyUpiId = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(upiId);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = upiId;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      sounds.playTick?.();
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Close attempt handler with active payment safety warning
  const handleCloseAttempt = () => {
    if (isPaymentConfirmed) {
      onClose();
      return;
    }
    setShowCloseWarning(true);
  };

  // Format MM:SS for countdown timer
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <AnimatePresence>
        <motion.div
          key="modal-content"
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 text-white rounded-3xl shadow-2xl overflow-hidden my-auto select-none"
        >
          {/* TOP ACCENT GLOW BAR */}
          <div className="h-1.5 w-full bg-gradient-to-r from-red-600 via-amber-500 to-red-600" />

          {/* ================= HEADER ================= */}
          <div className="p-4 sm:p-5 border-b border-zinc-900/80 bg-zinc-950/90 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center text-white shadow-lg shadow-red-950/60 border border-red-500/30">
                <Flame className="w-5 h-5 fill-white stroke-red-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black tracking-wide text-white font-display">
                    Shawarma Nights
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-red-950/80 text-red-400 border border-red-800/60">
                    Auto-UPI
                  </span>
                </div>
                <p className="text-xs text-zinc-400 flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Instant UPI Auto-Verification</span>
                </p>
              </div>
            </div>

            <button
              onClick={handleCloseAttempt}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 border border-zinc-800/80 transition-all"
              title="Close Modal"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          {/* ================= MODAL BODY ================= */}
          <div className="p-4 sm:p-6 space-y-5 max-h-[82vh] overflow-y-auto custom-scrollbar">
            {/* SUCCESS VIEW (When payment confirmed) */}
            {isPaymentConfirmed ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-10 px-4 text-center space-y-4"
              >
                <div className="relative mx-auto w-24 h-24 rounded-full bg-emerald-950/60 border-2 border-emerald-500 flex items-center justify-center shadow-[0_0_35px_rgba(16,185,129,0.35)]">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                  >
                    <CheckCircle2 className="w-14 h-14 text-emerald-400 stroke-[2.5]" />
                  </motion.div>
                  <span className="absolute -top-1 -right-1 flex h-6 w-6">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-6 w-6 bg-emerald-500 items-center justify-center text-xs">
                      🔥
                    </span>
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-2xl font-black text-white font-display tracking-tight">
                    Payment Verified!
                  </h3>
                  <p className="text-sm font-bold text-emerald-400 flex items-center justify-center gap-1.5">
                    <span>Order Sent to Kitchen</span>
                    <Flame className="w-4 h-4 fill-emerald-400" />
                  </p>
                </div>

                <div className="max-w-xs mx-auto bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3.5 text-xs space-y-1.5 font-medium">
                  <div className="flex justify-between text-zinc-400">
                    <span>Order ID:</span>
                    <span className="font-mono font-bold text-zinc-100">#{orderId}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Amount Paid:</span>
                    <span className="font-mono font-bold text-emerald-400">₹{grandTotal}</span>
                  </div>
                  {confirmedPayload?.utr && (
                    <div className="flex justify-between text-zinc-400">
                      <span>UTR Number:</span>
                      <span className="font-mono text-zinc-300">{confirmedPayload.utr}</span>
                    </div>
                  )}
                </div>

                <p className="text-xs text-zinc-400 animate-pulse">
                  Redirecting to live order tracking...
                </p>
              </motion.div>
            ) : (
              <>
                {/* 1. EXACT AMOUNT LOCKED CARD */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-950/50 via-zinc-900 to-red-950/50 border border-red-800/40 p-4 text-center shadow-lg">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-red-400 font-bold uppercase tracking-wider mb-1">
                    <Lock className="w-3.5 h-3.5 text-red-500" />
                    <span>Exact Amount Locked to Prevent Errors</span>
                  </div>

                  <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white flex items-center justify-center gap-1">
                    <span className="text-red-500 font-sans text-3xl sm:text-4xl font-black">₹</span>
                    <span className="drop-shadow-[0_0_16px_rgba(220,38,38,0.5)]">
                      {grandTotal.toFixed(0)}
                    </span>
                    <span className="text-lg text-zinc-400 font-mono font-semibold self-end mb-1">
                      .00
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-400 mt-1">
                    Order Ref: <span className="font-mono text-zinc-200 font-bold">#{orderId}</span>
                    {effectiveData.customerName && (
                      <span className="ml-2 text-zinc-400">({effectiveData.customerName})</span>
                    )}
                  </p>
                </div>

                {/* CASHFREE GATEWAY INSTANT CHECKOUT (SANDBOX / LIVE TEST) */}
                <div className="bg-gradient-to-r from-emerald-950/70 via-zinc-900 to-emerald-950/70 border border-emerald-500/50 rounded-2xl p-4 space-y-2.5 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider font-mono">
                        Cashfree PG (Sandbox Mode)
                      </span>
                    </div>
                    <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-bold">
                      Instant Verification
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={isOpeningCashfree}
                    onClick={handlePayWithCashfree}
                    className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition-all active:scale-98 cursor-pointer disabled:opacity-75"
                  >
                    {isOpeningCashfree ? (
                      <span>Opening Cashfree Gateway...</span>
                    ) : (
                      <>
                        <span>Pay ₹{grandTotal.toFixed(0)} via Cashfree (UPI / QR / Test)</span>
                        <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-zinc-400 text-center leading-normal">
                    💡 Test karne ke liye button dabayein, popup me <strong>"Simulate Success"</strong> click karte hi order auto-paid ho jayega.
                  </p>
                </div>

                {/* 2. DYNAMIC QR CODE DISPLAY */}
                <div className="flex flex-col items-center justify-center space-y-3">
                  {/* Badge Above QR */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-semibold shadow-sm">
                    <Flame className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                    <span>Scan with any UPI Camera or App</span>
                  </div>

                  {/* QR Image Container */}
                  <div className="relative bg-white p-3.5 rounded-2xl shadow-2xl border-2 border-red-600/30 group">
                    <img
                      src={qrCodeUrl}
                      alt="Scan to Pay UPI QR Code"
                      className="w-48 h-48 sm:w-56 sm:h-56 rounded-xl object-contain mx-auto block"
                      loading="eager"
                    />

                    {/* Logo/Flame Badge in Center Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-10 h-10 rounded-xl bg-zinc-950 border-2 border-red-600 flex items-center justify-center shadow-xl">
                        <Flame className="w-5 h-5 text-red-500 fill-red-500" />
                      </div>
                    </div>
                  </div>

                  {/* Dukandar VPA with Copy Button */}
                  <div className="flex items-center justify-between gap-2 bg-zinc-900/90 border border-zinc-800 rounded-xl py-2 px-3.5 text-xs w-full max-w-sm">
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-zinc-400 font-semibold shrink-0">UPI ID:</span>
                      <span className="font-mono font-bold text-zinc-100 truncate">{upiId}</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyUpiId}
                      className="shrink-0 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-all flex items-center gap-1.5 border border-zinc-700/60"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
                          <span className="text-emerald-400 font-bold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-zinc-300" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* 3. MOBILE QUICK PAY BUTTONS (GPay, PhonePe, Paytm, BHIM) */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs font-bold text-zinc-400 px-1">
                    <span className="flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-red-500" />
                      <span>Mobile Instant Pay (Tap to Open App)</span>
                    </span>
                    <span className="text-[10px] text-zinc-500 font-normal">Direct Intent</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {/* Google Pay */}
                    <a
                      href={`gpay://upi/pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${grandTotal.toFixed(2)}&cu=INR&tn=${encodeURIComponent(orderId)}&tr=${encodeURIComponent(orderId)}`}
                      onClick={() => setActiveAppClicked('Google Pay')}
                      className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-blue-500/60 hover:bg-zinc-850 text-white transition-all shadow-sm active:scale-95 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm mb-1.5">
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.27 21.39 7.33 24 12 24z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.26C.46 8.17 0 9.99 0 12s.46 3.83 1.26 5.42l4.02-3.15z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.27 2.61 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                          />
                        </svg>
                      </div>
                      <span className="text-xs font-bold text-zinc-200 group-hover:text-white">
                        Google Pay
                      </span>
                    </a>

                    {/* PhonePe */}
                    <a
                      href={`phonepe://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${grandTotal.toFixed(2)}&cu=INR&tn=${encodeURIComponent(orderId)}&tr=${encodeURIComponent(orderId)}`}
                      onClick={() => setActiveAppClicked('PhonePe')}
                      className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-purple-500/60 hover:bg-zinc-850 text-white transition-all shadow-sm active:scale-95 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#5f259f] flex items-center justify-center shadow-sm mb-1.5">
                        <span className="text-white font-black text-sm font-sans">पे</span>
                      </div>
                      <span className="text-xs font-bold text-zinc-200 group-hover:text-white">
                        PhonePe
                      </span>
                    </a>

                    {/* Paytm */}
                    <a
                      href={`paytmmp://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${grandTotal.toFixed(2)}&cu=INR&tn=${encodeURIComponent(orderId)}&tr=${encodeURIComponent(orderId)}`}
                      onClick={() => setActiveAppClicked('Paytm')}
                      className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-cyan-500/60 hover:bg-zinc-850 text-white transition-all shadow-sm active:scale-95 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#002e6e] flex items-center justify-center shadow-sm mb-1.5">
                        <span className="text-[#00b9f5] font-black text-[11px] tracking-tighter">
                          Paytm
                        </span>
                      </div>
                      <span className="text-xs font-bold text-zinc-200 group-hover:text-white">
                        Paytm
                      </span>
                    </a>

                    {/* BHIM / Standard UPI */}
                    <a
                      href={activeUpiUrl}
                      onClick={() => setActiveAppClicked('BHIM / Any UPI')}
                      className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/60 hover:bg-zinc-850 text-white transition-all shadow-sm active:scale-95 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center shadow-sm mb-1.5">
                        <span className="text-white font-black text-[11px] tracking-wider">
                          BHIM
                        </span>
                      </div>
                      <span className="text-xs font-bold text-zinc-200 group-hover:text-white">
                        Any UPI App
                      </span>
                    </a>
                  </div>

                  {activeAppClicked && (
                    <p className="text-[11px] text-amber-400/90 text-center animate-pulse pt-0.5">
                      {activeAppClicked} khul raha hai... Payment complete hote hi order automatically confirm ho jayega!
                    </p>
                  )}
                </div>

                {/* 4. LIVE STATUS INDICATOR & COUNTDOWN TIMER */}
                <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                      </span>
                      <span className="text-xs font-bold text-zinc-200">
                        Listening for bank payment confirmation...
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-red-400 bg-red-950/60 px-2.5 py-1 rounded-lg border border-red-800/40">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatTimer(timeLeft)}</span>
                    </div>
                  </div>

                  {/* Payment Verification Info Note */}
                  <div className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800/60 flex items-start gap-2 text-zinc-400 text-[11px] leading-relaxed">
                    <Info className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span>
                      Aapke UPI app se payment complete hote hi order automatically confirm ho jayega. Window band na karein.
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ================= WARNING MODAL (On Close While Pending) ================= */}
          <AnimatePresence>
            {showCloseWarning && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/90 backdrop-blur-sm z-30 flex items-center justify-center p-4"
              >
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 max-w-sm w-full text-center space-y-3 shadow-2xl">
                  <div className="w-12 h-12 rounded-full bg-amber-950/80 border border-amber-600 text-amber-500 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <h4 className="text-base font-black text-white font-display">
                    Payment Verification in Progress!
                  </h4>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Agar aapne UPI app me paise bhej diye hain, toh kripya kuch second ruken taaki
                    payment automatically confirm ho sake.
                  </p>
                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={() => setShowCloseWarning(false)}
                      className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors"
                    >
                      Rukein (Keep Waiting)
                    </button>
                    <button
                      onClick={() => {
                        setShowCloseWarning(false);
                        onClose();
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition-colors border border-zinc-700"
                    >
                      Close Anyway
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
