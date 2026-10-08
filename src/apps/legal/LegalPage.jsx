import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, FileText, RotateCcw, Phone, Mail, Building2, ExternalLink } from 'lucide-react';
import { LEGAL_POLICIES } from '../../data/legalPoliciesData';

export default function LegalPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const host = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';
  const path = location.pathname.toLowerCase();
  const params = new URLSearchParams(location.search);
  const storeParam = (params.get('storeId') || params.get('store') || '').toLowerCase();

  // Detect entity
  const isNash = host.startsWith('nash.') || storeParam.includes('nash') || path.includes('/nash');
  const isShawarma = host.startsWith('shawarma.') || storeParam.includes('shawarma') || path.includes('/shawarma');
  const entity = isNash ? 'nash-studio' : (isShawarma ? 'shawarma' : 'churuone');

  // Detect active tab from path or query
  const getInitialTab = () => {
    if (path.includes('/privacy')) return 'privacy';
    if (path.includes('/refund') || path.includes('/cancellation')) return 'refund';
    if (params.get('tab') === 'privacy') return 'privacy';
    if (params.get('tab') === 'refund') return 'refund';
    return 'terms';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

  useEffect(() => {
    setActiveTab(getInitialTab());
  }, [location.pathname, location.search]);

  const policyData = LEGAL_POLICIES[entity] || LEGAL_POLICIES.churuone;
  const currentPolicy = activeTab === 'terms' 
    ? policyData.terms 
    : (activeTab === 'privacy' ? policyData.privacy : policyData.refund);

  // Return home URL
  const getHomeUrl = () => {
    if (isNash) return host.includes('localhost') ? '/nash' : 'https://nash.churuone.in';
    if (isShawarma) return host.includes('localhost') ? '/' : 'https://shawarma.churuone.in';
    return '/';
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans antialiased selection:bg-zinc-950 selection:text-white flex flex-col justify-between">
      
      {/* Top Header */}
      <header className="border-b border-zinc-200 bg-white sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <a
            href={getHomeUrl()}
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-zinc-600 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2]" />
            <span>Return to {policyData.brandName}</span>
          </a>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-[11px] uppercase tracking-wider font-bold text-zinc-400">
              Verified Legal Policy
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 w-full flex-1">
        
        {/* Brand Banner */}
        <div className="mb-10 text-center sm:text-left border-b border-zinc-200 pb-8">
          <span className="text-[10px] font-mono tracking-[0.3em] uppercase font-bold text-zinc-400 block mb-2">
            {policyData.legalEntity} • OFFICIAL COMPLIANCE
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-zinc-950">
            {policyData.brandName} Legal Desk
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-2 max-w-xl">
            {policyData.tagline}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-zinc-200 gap-3 sm:gap-8 overflow-x-auto text-xs uppercase tracking-wider font-semibold mb-8">
          <button
            onClick={() => setActiveTab('terms')}
            className={`pb-4 border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'terms'
                ? 'border-zinc-950 text-zinc-950 font-bold'
                : 'border-transparent text-zinc-400 hover:text-zinc-700'
            }`}
          >
            <FileText className="w-4 h-4 stroke-[1.5]" />
            <span>Terms & Conditions</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`pb-4 border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'privacy'
                ? 'border-zinc-950 text-zinc-950 font-bold'
                : 'border-transparent text-zinc-400 hover:text-zinc-700'
            }`}
          >
            <ShieldCheck className="w-4 h-4 stroke-[1.5]" />
            <span>Privacy Policy</span>
          </button>

          <button
            onClick={() => setActiveTab('refund')}
            className={`pb-4 border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'refund'
                ? 'border-zinc-950 text-zinc-950 font-bold'
                : 'border-transparent text-zinc-400 hover:text-zinc-700'
            }`}
          >
            <RotateCcw className="w-4 h-4 stroke-[1.5]" />
            <span>Refund & Cancellation</span>
          </button>
        </div>

        {/* Refund & Cancellation Special Highlight Box */}
        {activeTab === 'refund' && (
          <div className="mb-8 p-5 border border-zinc-900 bg-zinc-950 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className={`text-[10px] uppercase font-mono tracking-widest ${entity === 'nash-studio' ? 'text-amber-400' : 'text-emerald-400'} font-bold block`}>
                CANCELLATION & REFUND GUARANTEE
              </span>
              <p className="text-xs sm:text-sm font-semibold tracking-wide">
                {entity === 'nash-studio'
                  ? 'No refund on booking cancellation (only token money ₹50 charged to reserve slot)'
                  : 'Orders can be cancelled within 10 minutes (Refund in 2-3 business days) • 2–3 KM Self-Return eligible'}
              </p>
            </div>
            <div className="shrink-0 bg-white/10 px-3 py-1 text-[11px] font-mono tracking-wider text-zinc-300 border border-white/20">
              {entity === 'nash-studio' ? 'NOMINAL ₹50 TOKEN' : 'DIRECT UPI ONLY'}
            </div>
          </div>
        )}

        {/* Policy Body */}
        <div className="space-y-8 text-zinc-800">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-950">
              {currentPolicy.title}
            </h2>
            <span className="text-xs text-zinc-400 font-mono">
              Effective Date: {currentPolicy.effectiveDate}
            </span>
          </div>

          <div className="space-y-8">
            {currentPolicy.sections.map((sec, idx) => (
              <div key={idx} className="space-y-2">
                <h3 className="text-sm sm:text-base font-bold uppercase tracking-wider text-zinc-950">
                  {sec.heading}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 whitespace-pre-line leading-relaxed font-normal">
                  {sec.content}
                </p>
              </div>
            ))}
          </div>

          {/* Contact Support Desk */}
          <div className="mt-12 p-6 border border-zinc-200 bg-zinc-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 text-xs">
            <div>
              <div className="text-sm font-bold text-zinc-950">{policyData.legalEntity} Legal Support</div>
              <div className="text-zinc-500 mt-1">{policyData.address}</div>
            </div>
            <div className="flex items-center flex-wrap gap-4 text-zinc-700 font-semibold">
              <a href={`tel:${policyData.phone.replace(/[^0-9]/g, '')}`} className="flex items-center gap-1.5 hover:text-black">
                <Phone className="w-4 h-4 text-zinc-500" />
                <span>{policyData.phone}</span>
              </a>
              <a href={`mailto:${policyData.email}`} className="flex items-center gap-1.5 hover:text-black">
                <Mail className="w-4 h-4 text-zinc-500" />
                <span>{policyData.email}</span>
              </a>
            </div>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
          <span>© 2026 {policyData.brandName}. All rights reserved.</span>
          <div className="flex items-center gap-6 text-zinc-500 font-medium">
            <button onClick={() => setActiveTab('terms')} className="hover:text-black cursor-pointer">Terms</button>
            <button onClick={() => setActiveTab('privacy')} className="hover:text-black cursor-pointer">Privacy</button>
            <button onClick={() => setActiveTab('refund')} className="hover:text-black cursor-pointer">Refunds</button>
          </div>
        </div>
      </footer>

    </div>
  );
}
