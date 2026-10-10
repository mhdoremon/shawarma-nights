import React, { useState } from "react";
import { load } from "@cashfreepayments/cashfree-js";
import { API_URL } from "../config/api";

export default function CashfreePayButton({ 
  amount = 120, 
  phone = "7023963189", 
  customerName = "Mehtab Hussain",
  orderId = null,
  onSuccess = null,
  onError = null,
  className = "",
  children = null
}) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const baseUrl = API_URL || '';
      const endpoint = `${baseUrl}/api/create-order`;

      // 1. Apne backend se session mangwayein
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(amount) || 120,
          customerPhone: phone || "7023963189",
          customerName: customerName || "Mehtab Hussain",
          orderId: orderId || `ORDER_${Date.now()}`,
        }),
      });

      const data = await res.json();
      if (!data.paymentSessionId) {
        throw new Error(data.error || data.details?.message || "Session ID nahi mili!");
      }

      // 2. Cashfree SDK Sandbox mode me load karein
      const cashfree = await load({ mode: "sandbox" });
      if (!cashfree) {
        throw new Error("Cashfree SDK load nahi ho saka");
      }

      // 3. Screen par Popup Modal kholein
      await cashfree.checkout({
        paymentSessionId: data.paymentSessionId,
        redirectTarget: "_modal", // Screen par hi UPI / QR popup khulega
      });

      // 4. Modal complete ya close hone ke baad live verification check
      try {
        const verifyRes = await fetch(`${baseUrl}/api/payment/cashfree/verify/${data.orderId}`);
        const verifyData = await verifyRes.json();
        if (verifyData.isPaid || verifyData.status === 'PAID') {
          if (onSuccess) onSuccess(verifyData);
        }
      } catch (verr) {
        console.log("Auto-verification note:", verr.message);
      }

    } catch (err) {
      console.error("Payment error:", err);
      alert(`Payment window error: ${err.message || 'Check console'}`);
      if (onError) onError(err);
    } finally {
      setLoading(false);
    }
  };

  if (children) {
    return (
      <button
        onClick={handlePayment}
        disabled={loading}
        className={className}
      >
        {loading ? "Opening Gateway..." : children}
      </button>
    );
  }

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className={`inline-flex items-center justify-center gap-2 font-bold px-6 py-3.5 rounded-xl text-sm transition-all shadow-md cursor-pointer disabled:opacity-75 ${className}`}
      style={{
        backgroundColor: "#10b981",
        color: "#ffffff",
      }}
    >
      {loading ? (
        <span>Opening Gateway...</span>
      ) : (
        <span>Pay ₹{amount} via UPI (Cashfree Test)</span>
      )}
    </button>
  );
}
