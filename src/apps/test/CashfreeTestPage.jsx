import React, { useState } from 'react';
import { ShieldCheck, ArrowLeft, CheckCircle2, AlertCircle, Copy, Check, Code, Zap, Globe, Sparkles } from 'lucide-react';
import SmartPay from '../../services/SmartPay';

export default function CashfreeTestPage() {
  const [storeId, setStoreId] = useState('shawarma');
  const [customStoreId, setCustomStoreId] = useState('');
  const [amount, setAmount] = useState(120);
  const [phone, setPhone] = useState('7023963189');
  const [name, setName] = useState('Mehtab Hussain');
  const [loading, setLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);
  const [activeTab, setActiveTab] = useState('test'); // 'test' | 'code'
  const [copiedCode, setCopiedCode] = useState(null);

  const effectiveStoreId = storeId === 'custom' ? (customStoreId.trim() || 'my-new-brand') : storeId;

  const handlePay = async () => {
    setLoading(true);
    setPaymentResult(null);
    try {
      const res = await SmartPay.checkout({
        storeId: effectiveStoreId,
        amount: Number(amount) || 120,
        customerPhone: phone,
        customerName: name,
        onSuccess: (result) => {
          setPaymentResult({ success: true, data: result });
          setLoading(false);
        },
        onError: (err) => {
          setPaymentResult({ success: false, error: err });
          setLoading(false);
        },
        onClose: () => {
          setLoading(false);
        }
      });
      if (res && res.isPaid) {
        setPaymentResult({ success: true, data: res });
      }
    } catch (err) {
      setPaymentResult({ success: false, error: err });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(key);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const htmlCodeSnippet = `<!-- 1. Add SmartPay Script in <head> or <body> -->
<script src="https://churuone.in/smart-pay.js"></script>

<!-- 2. Call SmartPay.checkout() when customer clicks pay -->
<button onclick="payNow()">Pay ₹${amount} via UPI</button>

<script>
function payNow() {
  SmartPay.checkout({
    storeId: '${effectiveStoreId}', // Brand ID
    amount: ${amount},
    customerPhone: '7023963189',
    customerName: 'Customer Name',
    onSuccess: function(res) {
      alert('✅ Payment Verified! Order #' + res.orderId);
    }
  });
}
</script>`;

  const reactCodeSnippet = `import SmartPay from './services/SmartPay';

// Inside your checkout button handler:
const handlePayment = async () => {
  await SmartPay.checkout({
    storeId: '${effectiveStoreId}',
    amount: ${amount},
    customerPhone: '7023963189',
    customerName: 'Customer Name',
    onSuccess: (res) => {
      console.log('Payment Verified:', res);
    }
  });
};`;

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans p-4 sm:p-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        
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
            SANDBOX MODE • MULTI-BRAND
          </span>
        </div>

        {/* Title */}
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-2">
            <Zap className="w-6 h-6 stroke-[2]" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            SmartPay Universal Gateway
          </h1>
          <p className="text-xs text-zinc-400">
            Kisi bhi brand ya naye store ke liye 5 seconds me payment integration test karein.
          </p>
        </div>

        {/* Tabs: Live Test vs Code Integration */}
        <div className="grid grid-cols-2 gap-2 bg-zinc-950 p-1 rounded-2xl border border-zinc-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('test')}
            className={`py-2 rounded-xl transition-all ${
              activeTab === 'test' 
                ? 'bg-zinc-800 text-white shadow-sm' 
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            ⚡ Live Payment Test
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('code')}
            className={`py-2 rounded-xl transition-all ${
              activeTab === 'code' 
                ? 'bg-zinc-800 text-white shadow-sm' 
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            💻 5-Second Code Snippet
          </button>
        </div>

        {activeTab === 'test' ? (
          <>
            {/* Form Inputs */}
            <div className="space-y-3.5 bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-4 text-xs">
              {/* Brand Selector */}
              <div>
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Brand / Store ID (Multi-Tenant):
                </label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setStoreId('shawarma')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      storeId === 'shawarma'
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Shawarma
                  </button>
                  <button
                    type="button"
                    onClick={() => setStoreId('nash-studio')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      storeId === 'nash-studio'
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Nash Studio
                  </button>
                  <button
                    type="button"
                    onClick={() => setStoreId('custom')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      storeId === 'custom'
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    + New Brand
                  </button>
                </div>

                {storeId === 'custom' && (
                  <input
                    type="text"
                    placeholder="Enter new brand slug (e.g. pizza-paradise, fashion-hub)"
                    value={customStoreId}
                    onChange={(e) => setCustomStoreId(e.target.value)}
                    className="w-full bg-zinc-900 border border-emerald-500/50 text-white px-3.5 py-2.5 rounded-xl text-xs font-mono focus:border-emerald-500 outline-none mt-1"
                  />
                )}
              </div>

              {/* Amount */}
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

              {/* Customer Phone */}
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

              {/* Customer Name */}
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
              <button
                type="button"
                disabled={loading}
                onClick={handlePay}
                className="w-full py-4 text-sm font-black uppercase tracking-wider rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-75 flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
                <span>
                  {loading 
                    ? "Opening Gateway..." 
                    : `Pay ₹${amount} for [${effectiveStoreId}] via UPI`}
                </span>
              </button>

              <p className="text-[11px] text-zinc-400 text-center leading-relaxed">
                👆 Is button par click karte hi Cashfree ka popup khulega. Wahan UPI ya <strong>"Simulate Success"</strong> click karein.
              </p>
            </div>

            {/* Success Alert */}
            {paymentResult && paymentResult.success && (
              <div className="p-4 bg-emerald-950/60 border border-emerald-500/50 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Payment Verified! Store: [{paymentResult.data?.storeId || effectiveStoreId}]</span>
                </div>
                <p className="text-xs text-zinc-300">
                  Order auto-confirm ho gaya hai aur store payments ledger me transaction update ho chuka hai.
                </p>
                {paymentResult.data?.orderId && (
                  <div className="font-mono text-[11px] text-emerald-300">
                    Order Ref: #{paymentResult.data.orderId}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          /* CODE SNIPPET TAB */
          <div className="space-y-4 text-xs">
            {/* HTML Option */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <Globe className="w-4 h-4" />
                  <span>1. Any Website / HTML (5 Seconds Embed)</span>
                </span>
                <button
                  onClick={() => copyToClipboard(htmlCodeSnippet, 'html')}
                  className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white transition-colors"
                >
                  {copiedCode === 'html' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode === 'html' ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <pre className="font-mono text-[11px] text-zinc-300 overflow-x-auto p-2 bg-zinc-900 rounded-xl leading-relaxed whitespace-pre-wrap">
                {htmlCodeSnippet}
              </pre>
            </div>

            {/* React / Modern JS Option */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                <span className="font-bold text-teal-400 flex items-center gap-1.5">
                  <Code className="w-4 h-4" />
                  <span>2. React / Next.js SDK Call</span>
                </span>
                <button
                  onClick={() => copyToClipboard(reactCodeSnippet, 'react')}
                  className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white transition-colors"
                >
                  {copiedCode === 'react' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode === 'react' ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <pre className="font-mono text-[11px] text-zinc-300 overflow-x-auto p-2 bg-zinc-900 rounded-xl leading-relaxed whitespace-pre-wrap">
                {reactCodeSnippet}
              </pre>
            </div>
          </div>
        )}

        {/* Footer Note */}
        <div className="border-t border-zinc-800/80 pt-4 text-xs text-zinc-400 flex items-center justify-between">
          <span className="text-[11px]">ChuruOne Smart Server Payment Engine</span>
          <span className="text-[11px] text-emerald-400 font-mono font-bold">Multi-Tenant Ready</span>
        </div>

      </div>
    </div>
  );
}
