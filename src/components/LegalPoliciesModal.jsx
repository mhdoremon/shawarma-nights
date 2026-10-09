import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  FileText, 
  RotateCcw, 
  Truck, 
  Phone, 
  Mail, 
  Building2, 
  ExternalLink 
} from 'lucide-react';
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

  const currentPolicy = policyData[activeTab] || policyData.terms;

  const tabs = [
    { id: 'contact', label: 'Contact Us', route: '/contact-us', icon: Phone },
    { id: 'terms', label: 'Terms & Conditions', route: '/terms-and-conditions', icon: FileText },
    { id: 'privacy', label: 'Privacy Policy', route: '/privacy-policy', icon: ShieldCheck },
    { id: 'refund', label: 'Refund & Cancellation', route: '/refund-policy', icon: RotateCcw },
    { id: 'shipping', label: 'Shipping Policy', route: '/shipping-policy', icon: Truck },
  ];

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
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[10px] font-mono tracking-[0.25em] uppercase font-bold text-zinc-400">
                OFFICIAL POLICIES
              </span>
              <span className="text-zinc-300">•</span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-600">
                {policyData.legalEntity}
              </span>
              <span className="text-zinc-300">•</span>
              <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-600">
                PhonePe Compliant
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

        {/* Tab Navigation (5 Compliance Tabs) */}
        <div className="flex items-center border-b border-zinc-200 bg-white px-5 sm:px-6 overflow-x-auto gap-2 sm:gap-5 text-xs uppercase tracking-wider font-semibold">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3.5 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'border-zinc-950 text-zinc-950 font-bold'
                    : 'border-transparent text-zinc-400 hover:text-zinc-700 font-medium'
                }`}
              >
                <Icon className="w-3.5 h-3.5 stroke-[1.5]" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Special Highlight Callout for Contact Tab */}
        {activeTab === 'contact' && (
          <div className="bg-zinc-100 border-b border-zinc-200 px-5 sm:px-6 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-zinc-900" />
              <span className="font-semibold text-zinc-900">
                Legal Entity: {policyData.legalEntity} • Proprietor: {policyData.proprietor}
              </span>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">
              Operating Hours: {policyData.operatingHours}
            </span>
          </div>
        )}

        {/* Special Highlight Callout for Refund / Cancellation */}
        {activeTab === 'refund' && (
          <div className="bg-zinc-950 text-white px-5 sm:px-6 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-semibold tracking-wide">
                Approved refunds will be processed within 5 to 7 business days to original payment method.
              </span>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-mono font-bold">
              5 TO 7 DAYS
            </span>
          </div>
        )}

        {/* Special Highlight Callout for Privacy */}
        {activeTab === 'privacy' && (
          <div className="bg-zinc-950 text-white px-5 sm:px-6 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold tracking-wide">
                Payments processed securely via RBI-authorized payment gateways (PhonePe). Zero card/PIN storage.
              </span>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-mono font-bold">
              RBI COMPLIANT
            </span>
          </div>
        )}

        {/* Special Highlight Callout for Shipping */}
        {activeTab === 'shipping' && (
          <div className="bg-zinc-950 text-white px-5 sm:px-6 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold tracking-wide">
                Local delivery in 30 to 45 minutes in Churu city. Shipping charges displayed at checkout.
              </span>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-mono font-bold">
              30-45 MINS
            </span>
          </div>
        )}

        {/* Scrollable Policy Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6 text-sm leading-relaxed text-zinc-700">
          
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 flex-wrap gap-2">
            <span className="text-base sm:text-lg font-bold text-zinc-950">
              {currentPolicy.title}
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              Effective Date: {currentPolicy.effectiveDate || 'October 1, 2026'}
            </span>
          </div>

          <div className="space-y-6">
            {currentPolicy.sections && currentPolicy.sections.map((sec, idx) => (
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
              <div className="text-zinc-400 text-[11px] font-mono mt-0.5">Hours: {policyData.operatingHours}</div>
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
        <div className="p-4 sm:p-5 border-t border-zinc-200 bg-zinc-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500">
          <span className="text-center sm:text-left">
            © 2026 ChuruOne. A unit of Vasudhaiva Kutumbakam Robotics. All rights reserved.
          </span>
          <div className="flex items-center gap-3">
            <a
              href={`/${activeTab === 'contact' ? 'contact-us' : activeTab === 'terms' ? 'terms-and-conditions' : activeTab === 'privacy' ? 'privacy-policy' : activeTab === 'refund' ? 'refund-policy' : 'shipping-policy'}`}
              className="px-3.5 py-1.5 border border-zinc-300 hover:border-zinc-900 text-zinc-700 hover:text-zinc-950 font-medium transition-colors"
            >
              Open Full Page
            </a>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-zinc-950 hover:bg-black text-white text-xs uppercase tracking-widest font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
