import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  Flame, 
  Sparkles, 
  Bike, 
  PackageCheck, 
  Phone, 
  MapPin, 
  Clock, 
  X, 
  RotateCcw,
  ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCart } from '../context/CartContext';
import { sounds } from '../utils/soundEffects';

const TRACKER_STEPS = [
  {
    id: 0,
    title: 'Order Confirmed',
    subtitle: 'Kitchen ticket printed & ingredients prepped',
    icon: CheckCircle2,
  },
  {
    id: 1,
    title: 'Charcoal Spit Slicing',
    subtitle: 'Slow-roasted succulent meat shaved fresh from glowing coals',
    icon: Flame,
  },
  {
    id: 2,
    title: 'Toum Saucing & Rolling',
    subtitle: 'Wrapped in hot bread with Lebanese garlic toum & crunchy pickles',
    icon: Sparkles,
  },
  {
    id: 3,
    title: 'Out for Delivery',
    subtitle: 'Rider is speeding towards your doorstep in an insulated thermal bag',
    icon: Bike,
  },
  {
    id: 4,
    title: 'Delivered Hot & Steaming',
    subtitle: 'Enjoy your fresh meal. Dip in extra garlic toum for maximum flavor!',
    icon: PackageCheck,
  },
];

export default function OrderTrackerModal() {
  const { activeTracking, isTrackerOpen, setIsTrackerOpen } = useCart();
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (activeTracking) {
      const newStep = activeTracking.step || 0;
      if (newStep === 4 && currentStep < 4) {
        triggerDeliveredCelebration();
      }
      setCurrentStep(newStep);
    }
  }, [activeTracking]);

  const triggerDeliveredCelebration = () => {
    sounds.playSuccessFanfare();
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#dc2626', '#10b981', '#f59e0b', '#000000']
    });
  };

  if (!isTrackerOpen || !activeTracking) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white border border-zinc-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-zinc-100 text-zinc-800">
              {activeTracking.orderId}
            </span>
            <span className="text-xs font-bold text-zinc-900">
              Live Order Tracker
            </span>
          </div>

          <button
            onClick={() => setIsTrackerOpen(false)}
            className="p-1 rounded-full text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition-all"
            title="Minimize Tracker"
          >
            <X className="w-5 h-5 stroke-[2]" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-6">
          
          {/* Status Box */}
          <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-red-600 stroke-[2]" />
              <div>
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Estimated Arrival
                </div>
                <div className="text-sm font-extrabold text-zinc-900">
                  {currentStep === 4 ? 'Delivered' : '18 - 24 Mins'}
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Total Paid
              </div>
              <div className="text-sm font-black text-red-600 font-mono">
                ₹{activeTracking.grandTotal}
              </div>
            </div>
          </div>

          {/* Secure Delivery Confirmation OTP Box */}
          {activeTracking.deliveryOtp && currentStep < 4 && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-400/60 shadow-xs flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-700 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-4 h-4 text-amber-700" />
                  </div>
                  <span className="text-xs font-black text-amber-950 uppercase tracking-wider">
                    Delivery Confirmation OTP
                  </span>
                </div>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-200/70 border border-amber-300 px-2 py-0.5 rounded-full">
                  Rider ko dein
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 bg-white/90 p-3 rounded-xl border border-amber-200 shadow-inner">
                <div>
                  <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                    Aapka Secret Delivery Code
                  </div>
                  <div className="text-2xl sm:text-3xl font-black font-mono tracking-widest text-[#DC2626]">
                    {activeTracking.deliveryOtp}
                  </div>
                </div>

                <div className="text-right text-[11px] text-stone-600 font-medium max-w-[200px] leading-snug">
                  Order prapt hone ke baad delivery partner ko yeh OTP batayein.
                </div>
              </div>

              {activeTracking.paymentMethod === 'COD' && (
                <div className="text-[11px] font-bold text-amber-900 bg-amber-100/60 px-2.5 py-1.5 rounded-lg flex items-center justify-between">
                  <span>💵 Cash On Delivery Collectible:</span>
                  <span className="font-mono font-black text-[#DC2626]">₹{activeTracking.grandTotal}</span>
                </div>
              )}
            </div>
          )}

          {/* Stepper Timeline */}
          <div className="relative pl-7 space-y-6 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200">
            {TRACKER_STEPS.map((step, idx) => {
              const isPast = currentStep > idx;
              const isCurrent = currentStep === idx;
              const Icon = step.icon;

              return (
                <div key={step.id} className="relative flex items-start gap-3.5">
                  {/* Step Dot */}
                  <div
                    className={`absolute -left-7 w-7 h-7 rounded-full flex items-center justify-center border transition-all ${
                      isPast
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-red-600 border-red-600 text-white shadow-sm'
                        : 'bg-white border-zinc-300 text-zinc-400'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 stroke-[2.2]" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4
                        className={`text-xs font-bold ${
                          isPast
                            ? 'text-emerald-700'
                            : isCurrent
                            ? 'text-zinc-900'
                            : 'text-zinc-400'
                        }`}
                      >
                        {step.title}
                      </h4>
                      {isCurrent && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-red-100 text-red-700 uppercase tracking-wider">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">
                      {step.subtitle}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Rider Card */}
          {currentStep >= 3 && (
            <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                  <Bike className="w-5 h-5 stroke-[2]" />
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-900">Aman Khan (Delivery Partner)</div>
                  <div className="text-[11px] text-zinc-500">Yamaha FZ • Rating 4.9</div>
                </div>
              </div>

              <a
                href="tel:9876543210"
                onClick={(e) => { e.preventDefault(); alert("Calling Delivery Partner (+91 98765-43210)..."); }}
                className="p-2 rounded-full bg-white border border-zinc-200 text-zinc-700 hover:text-red-600 hover:border-red-600 transition-all"
              >
                <Phone className="w-4 h-4 stroke-[2]" />
              </a>
            </div>
          )}

          {/* Controls */}
          <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-semibold text-zinc-500">
                {currentStep === 4 ? 'Order Complete' : 'Live kitchen sync'}
              </span>
            </div>

            <button
              onClick={() => setIsTrackerOpen(false)}
              className="px-5 py-2 rounded-full bg-zinc-900 hover:bg-[#DC2626] text-white font-bold transition-all shadow-sm cursor-pointer"
            >
              {currentStep === 4 ? 'Close' : 'Minimize Tracker'}
            </button>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
