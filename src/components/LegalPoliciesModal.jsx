import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, FileText, RotateCcw, Building2, Phone, Mail, ArrowUpRight } from 'lucide-react';
import { LEGAL_POLICIES } from '../data/legalPoliciesData';

export default function LegalPoliciesModal({ 
  isOpen, 
  onClose, 
  initialTab = 'terms', 
  entity = 'churuone' 
}) {
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  if (!isOpen) return null;

  // Resolve entity data (fallback to churuone)
  const key = entity.includes('nash') ? 'nash-studio' : (entity.includes('shawarma') ? 'shawarma' : 'churuone');
  const policyData = LEGAL_POLICIES[key] || LEGAL_POLICIES.churuone;

  const currentPolicy = activeTab === 'terms' 
    ? policyData.terms 
    : (activeTab === 'privacy' ? policyData.privacy : policyData.refund);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      
      {/* Modal Container */}
      <div 
        className="w-full max-w-3xl max-h-[90vh] bg-white border border-zinc-200 flex flex-col shadow-2xl text-zinc-900 font-sans overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header Bar */}
        <div className="p-5 sm:p-6 border-b border-zinc-200 flex items-start justify-between bg-zinc-50/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono tracking-[0.25em] uppercase font-bold text-zinc-400">
                OFFICIAL POLICIES
              </span>
              <span className="text-zinc-300">•</span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-600">
                {policyData.legalEntity}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950">
              {policyData.brandName} Legal Directory
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {policyData.tagline}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-500 hover:text-zinc-950 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4 stroke-[2]" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-zinc-200 bg-white px-5 sm:px-6 overflow-x-auto gap-2 sm:gap-6 text-xs uppercase tracking-wider font-semibold">
          <button
            onClick={() => setActiveTab('terms')}
            className={`py-3.5 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'terms'
                ? 'border-zinc-950 text-zinc-950 font-bold'
                : 'border-transparent text-zinc-400 hover:text-zinc-700 font-medium'
            }`}
          >
            <FileText className="w-3.5 h-3.5 stroke-[1.5]" />
            <span>Terms & Conditions</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`py-3.5 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'privacy'
                ? 'border-zinc-950 text-zinc-950 font-bold'
                : 'border-transparent text-zinc-400 hover:text-zinc-700 font-medium'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 stroke-[1.5]" />
            <span>Privacy Policy</span>
          </button>

          <button
            onClick={() => setActiveTab('refund')}
            className={`py-3.5 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'refund'
                ? 'border-zinc-950 text-zinc-950 font-bold'
                : 'border-transparent text-zinc-400 hover:text-zinc-700 font-medium'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5 stroke-[1.5]" />
            <span>Refund & Cancellation</span>
          </button>
        </div>

        {/* Highlight Callout for Refund / Cancellation */}
        {activeTab === 'refund' && (
          <div className="bg-zinc-950 text-white px-5 sm:px-6 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-semibold tracking-wide">
                {key === 'nash-studio'
                  ? 'Cancellations eligible up to 1 hr prior • Token refund processed in 2-3 business days'
                  : 'Orders can be cancelled within 10 minutes • Refund processed in 2-3 business days'}
              </span>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-mono">
              DIRECT UPI BANK SETTLEMENT
            </span>
          </div>
        )}

        {/* Scrollable Policy Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6 text-sm leading-relaxed text-zinc-700">
          
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <span className="text-base sm:text-lg font-bold text-zinc-950">
              {currentPolicy.title}
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              Last Updated: {policyData.lastUpdated}
            </span>
          </div>

          <div className="space-y-6">
            {currentPolicy.sections.map((sec, idx) => (
              <div key={idx} className="space-y-2">
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-950">
                  {sec.heading}
                </h3>
                <p className="text-xs sm:text-[13px] text-zinc-600 whitespace-pre-line leading-relaxed">
                  {sec.content}
                </p>
              </div>
            ))}
          </div>

          {/* Contact & Legal Desk Box */}
          <div className="mt-8 p-4 border border-zinc-200 bg-zinc-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
            <div>
              <div className="font-bold text-zinc-900 mb-0.5">{policyData.legalEntity}</div>
              <div className="text-zinc-500">{policyData.address}</div>
            </div>
            <div className="flex items-center flex-wrap gap-4 text-zinc-700 font-medium">
              <a href={`tel:${policyData.phone.replace(/[^0-9]/g, '')}`} className="flex items-center gap-1 hover:text-black">
                <Phone className="w-3.5 h-3.5 text-zinc-400" />
                <span>{policyData.phone}</span>
              </a>
              <a href={`mailto:${policyData.email}`} className="flex items-center gap-1 hover:text-black">
                <Mail className="w-3.5 h-3.5 text-zinc-400" />
                <span>{policyData.email}</span>
              </a>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between text-xs text-zinc-500">
          <span>© 2026 {policyData.brandName}. All rights reserved.</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-zinc-950 hover:bg-black text-white text-xs uppercase tracking-widest font-semibold transition-colors cursor-pointer"
          >
            I Understand & Close
          </button>
        </div>

      </div>

    </div>
  );
}
