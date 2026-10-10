import React, { useState } from "react";
import SmartPay from "../services/SmartPay";
import { ShieldCheck, ArrowRight } from "lucide-react";

/**
 * Universal SmartPay Button Component
 * Drop-in component for any brand website (Shawarma, Nash Studio, or any new shop).
 */
export default function SmartPayButton({
  storeId = "shawarma",
  amount = 120,
  phone = "7023963189",
  customerName = "Customer",
  orderId = null,
  notes = "",
  mode = "sandbox",
  onSuccess = null,
  onError = null,
  onClose = null,
  className = "",
  children = null,
}) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await SmartPay.checkout({
        storeId,
        amount,
        customerPhone: phone,
        customerName,
        orderId,
        notes,
        mode,
        onSuccess: (res) => {
          setLoading(false);
          if (onSuccess) onSuccess(res);
        },
        onError: (err) => {
          setLoading(false);
          if (onError) onError(err);
        },
        onClose: () => {
          setLoading(false);
          if (onClose) onClose();
        },
      });
    } catch (e) {
      setLoading(false);
    }
  };

  if (children) {
    return (
      <button
        type="button"
        disabled={loading}
        onClick={handleClick}
        className={className}
      >
        {loading ? "Opening Smart Gateway..." : children}
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={handleClick}
      className={`w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm tracking-wide shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99] disabled:opacity-75 ${className}`}
    >
      <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
      <span>{loading ? "Opening Gateway..." : `Pay ₹${amount} via UPI (Instant)`}</span>
      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
    </button>
  );
}
