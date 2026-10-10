import React, { useState } from 'react';
import { ShieldCheck, ArrowLeft, CheckCircle2, AlertCircle, RefreshCw, Smartphone } from 'lucide-react';
import CashfreePayButton from '../../components/CashfreePayButton';

export default function CashfreeTestPage() {
  const [amount, setAmount] = useState(120);
  const [phone, setPhone] = useState('7023963189');
  const [name, setName] = useState('Mehtab Hussain');
  const [testLog, setTestLog] = useState([]);
  const [paymentResult, setPaymentResult] = useState(null);

  const addLog = (msg, type = 'info') => {
    setTestLog(prev => [
      ...prev,
      { time: new Date().toLocaleTimeString(), msg, type }
    ]);
  };

  const handleSuccess = (res) => {
    setPaymentResult({ success: true, data: res });
    addLog(`✅ Payment Verified Successfully! Order status: PAID`, 'success');
  };

  const handleError = (err) => {
    setPaymentResult({ success: false, error: err });
    addLog(`❌ Payment Error: ${err.message || err}`, 'error');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans p-4 sm:p-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <a 
            href="/" 
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Website par wapas jayein</span>
          </a>
          <span className="text-[10px] uppercase font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2.5 py-0.5 rounded-full">
            SANDBOX MODE
          </span>
        </div>

        {/* Title */}
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-2">
            <ShieldCheck className="w-6 h-6 stroke-[2]" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Cashfree Gateway Test Lab
          </h1>
          <p className="text-xs text-zinc-400">
            Real paise nahi katenge. Test mode me direct UPI & Simulate Success check karein.
          </p>
        </div>

        {/* Form Inputs */}
        <div className="space-y-3.5 bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-4 text-xs">
          <div>
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
              Test Amount (₹):
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value) || 1)}
              className="w-full bg-zinc-900 border border-zinc-750 text-white px-3.5 py-2.5 rounded-xl text-sm font-mono focus:border-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
              Customer Mobile Number:
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-750 text-white px-3.5 py-2.5 rounded-xl text-sm font-mono focus:border-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
              Customer Name:
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-750 text-white px-3.5 py-2.5 rounded-xl text-sm focus:border-emerald-500 outline-none"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="space-y-2">
          <CashfreePayButton
            amount={amount}
            phone={phone}
            customerName={name}
            onSuccess={handleSuccess}
            onError={handleError}
            className="w-full py-4 text-sm font-black uppercase tracking-wider rounded-2xl shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all"
          >
            Pay ₹{amount} via Cashfree (Open Test Popup)
          </CashfreePayButton>

          <p className="text-[11px] text-zinc-400 text-center leading-relaxed">
            👆 Is button par click karte hi Cashfree ka popup khulega. Wahan UPI ya <strong>"Simulate Success"</strong> click karein.
          </p>
        </div>

        {/* Success Alert */}
        {paymentResult && paymentResult.success && (
          <div className="p-4 bg-emerald-950/60 border border-emerald-500/50 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5" />
              <span>Payment Success Verified!</span>
            </div>
            <p className="text-xs text-zinc-300">
              Cashfree ne payment confirm kar di hai aur order backend me automatically paid ho gaya hai.
            </p>
          </div>
        )}

        {/* Testing Guide Steps */}
        <div className="border-t border-zinc-800/80 pt-4 text-xs text-zinc-400 space-y-2">
          <div className="font-bold text-zinc-300 uppercase tracking-wider text-[11px]">
            🧪 Test Karne Ke 3 Aasan Steps:
          </div>
          <ol className="list-decimal list-inside space-y-1 text-zinc-400 pl-1 leading-relaxed">
            <li>Upar diye gaye <strong>"Pay via Cashfree"</strong> button par click karein.</li>
            <li>Screen par Cashfree popup open hoga jisme test UPI options honge.</li>
            <li>Cashfree screen par green color ka <strong>"Simulate Success"</strong> button dabayein.</li>
          </ol>
        </div>

      </div>
    </div>
  );
}
