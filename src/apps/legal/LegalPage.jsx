import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ShieldCheck, 
  FileText, 
  RotateCcw, 
  Truck, 
  Phone, 
  Mail, 
  Building2, 
  MapPin, 
  Clock, 
  User, 
  CheckCircle2 
} from 'lucide-react';
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
    if (path.includes('/contact')) return 'contact';
    if (path.includes('/privacy')) return 'privacy';
    if (path.includes('/refund') || path.includes('/cancellation')) return 'refund';
    if (path.includes('/shipping') || path.includes('/delivery')) return 'shipping';
    if (path.includes('/terms')) return 'terms';
    const tabParam = params.get('tab');
    if (tabParam && ['contact', 'terms', 'privacy', 'refund', 'shipping'].includes(tabParam)) {
      return tabParam;
    }
    return 'terms';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

  useEffect(() => {
    setActiveTab(getInitialTab());
  }, [location.pathname, location.search]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    const routes = {
      contact: '/contact-us',
      terms: '/terms-and-conditions',
      privacy: '/privacy-policy',
      refund: '/refund-policy',
      shipping: '/shipping-policy',
    };
    navigate(routes[newTab] || '/terms-and-conditions');
  };

  const policyData = LEGAL_POLICIES[entity] || LEGAL_POLICIES.churuone;
  const currentPolicy = policyData[activeTab] || policyData.terms;

  // Return home URL
  const getHomeUrl = () => {
    if (isNash) return host.includes('localhost') ? '/nash' : 'https://nash.churuone.in';
    if (isShawarma) return host.includes('localhost') ? '/' : 'https://shawarma.churuone.in';
    return '/';
  };

  const tabs = [
    { id: 'contact', label: 'Contact Us', route: '/contact-us', icon: Phone },
    { id: 'terms', label: 'Terms & Conditions', route: '/terms-and-conditions', icon: FileText },
    { id: 'privacy', label: 'Privacy Policy', route: '/privacy-policy', icon: ShieldCheck },
    { id: 'refund', label: 'Refund & Cancellation', route: '/refund-policy', icon: RotateCcw },
    { id: 'shipping', label: 'Shipping Policy', route: '/shipping-policy', icon: Truck },
  ];

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
              Verified Legal Policy • PhonePe Compliant
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 w-full flex-1">
        
        {/* Brand Banner */}
        <div className="mb-10 text-center sm:text-left border-b border-zinc-200 pb-8">
          <div className="flex items-center gap-2 mb-2 justify-center sm:justify-start flex-wrap">
            <span className="text-[10px] font-mono tracking-[0.3em] uppercase font-bold text-zinc-500">
              {policyData.legalEntity}
            </span>
            <span className="text-zinc-300">•</span>
            <span className="text-[10px] font-mono tracking-[0.2em] uppercase font-bold text-emerald-600">
              PHONEPE COMPLIANT
            </span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-zinc-950">
            {policyData.brandName} Legal Desk
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-2 max-w-xl">
            {policyData.tagline}
          </p>
        </div>

        {/* Tab Navigation with Bot-Crawlable Standard HTML Anchor Tags */}
        <div className="flex items-center border-b border-zinc-200 gap-2 sm:gap-6 overflow-x-auto text-xs uppercase tracking-wider font-semibold mb-8 pb-px">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <a
                key={tab.id}
                href={tab.route}
                onClick={(e) => {
                  e.preventDefault();
                  handleTabChange(tab.id);
                }}
                className={`pb-4 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-zinc-950 text-zinc-950 font-bold'
                    : 'border-transparent text-zinc-400 hover:text-zinc-700'
                }`}
              >
                <Icon className="w-4 h-4 stroke-[1.5]" />
                <span>{tab.label}</span>
              </a>
            );
          })}
        </div>

        {/* 1. Contact Us Special Highlight Card: Verbatim Entity Details */}
        {activeTab === 'contact' && (
          <div className="mb-8 p-6 border-2 border-zinc-950 bg-zinc-50 shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-zinc-950" />
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-950">
                Official Business & Legal Entity Information
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
              <div className="p-3.5 bg-white border border-zinc-200">
                <span className="text-[10px] text-zinc-400 font-mono uppercase block font-semibold">Legal Entity Name</span>
                <span className="font-bold text-zinc-950 text-sm">{policyData.legalEntity}</span>
              </div>
              <div className="p-3.5 bg-white border border-zinc-200">
                <span className="text-[10px] text-zinc-400 font-mono uppercase block font-semibold">Trade / Brand Name</span>
                <span className="font-bold text-zinc-950 text-sm">{policyData.tradeName || policyData.brandName}</span>
              </div>
              <div className="p-3.5 bg-white border border-zinc-200">
                <span className="text-[10px] text-zinc-400 font-mono uppercase block font-semibold">Proprietor</span>
                <span className="font-bold text-zinc-950 text-sm">{policyData.proprietor}</span>
              </div>
              <div className="p-3.5 bg-white border border-zinc-200">
                <span className="text-[10px] text-zinc-400 font-mono uppercase block font-semibold">Official Support Email</span>
                <a href={`mailto:${policyData.email}`} className="font-bold text-blue-600 hover:underline text-sm block">
                  {policyData.email}
                </a>
                {policyData.secondaryEmail && (
                  <span className="text-[11px] text-zinc-500 font-mono block mt-0.5">Alt: {policyData.secondaryEmail}</span>
                )}
              </div>
              <div className="p-3.5 bg-white border border-zinc-200">
                <span className="text-[10px] text-zinc-400 font-mono uppercase block font-semibold">Official Support Phone</span>
                <a href={`tel:${policyData.phone.replace(/[^0-9]/g, '')}`} className="font-bold text-zinc-950 text-sm hover:underline">
                  {policyData.phone}
                </a>
              </div>
              <div className="p-3.5 bg-white border border-zinc-200">
                <span className="text-[10px] text-zinc-400 font-mono uppercase block font-semibold">Operating & Customer Support Hours</span>
                <span className="font-bold text-zinc-950 text-sm">{policyData.operatingHours}</span>
              </div>
              <div className="p-3.5 bg-white border border-zinc-200 md:col-span-2">
                <span className="text-[10px] text-zinc-400 font-mono uppercase block font-semibold">Registered Operating Address</span>
                <span className="font-bold text-zinc-950 text-sm">{policyData.address}</span>
              </div>
            </div>
          </div>
        )}

        {/* 2. Privacy Policy Special Highlight Box: RBI & PhonePe Verbatim Clause */}
        {activeTab === 'privacy' && (
          <div className="mb-8 p-5 border border-zinc-900 bg-zinc-950 text-white space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400 font-bold">
                RBI-AUTHORIZED PAYMENT GATEWAY SECURITY (PHONEPE)
              </span>
            </div>
            <p className="text-xs sm:text-sm font-semibold tracking-wide leading-relaxed text-zinc-100">
              Payments are processed securely via RBI-authorized payment gateways (PhonePe). ChuruOne does not store customer UPI PINs, card numbers, or sensitive financial passwords. We never sell personal data to third parties.
            </p>
          </div>
        )}

        {/* 3. Refund & Cancellation Special Highlight Box: 5 to 7 Business Days Verbatim Clause */}
        {activeTab === 'refund' && (
          <div className="mb-8 p-5 border border-zinc-900 bg-zinc-950 text-white space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400 font-bold">
                  MANDATORY REFUND & CANCELLATION TIMELINE
                </span>
              </div>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 text-[10px] font-mono font-bold tracking-wider uppercase">
                5 TO 7 BUSINESS DAYS
              </span>
            </div>
            <p className="text-xs sm:text-sm font-semibold tracking-wide leading-relaxed text-zinc-100">
              Approved refunds will be processed within 5 to 7 business days and automatically credited back to the customer's original payment method (Bank Account / UPI / Card).
            </p>
            <div className="pt-2 border-t border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-zinc-300 gap-2">
              <span>• Orders can be cancelled before preparation/dispatch or within 10 minutes of placing the order.</span>
              <span>• Refund Contact: <a href={`mailto:${policyData.email}`} className="text-emerald-400 underline">{policyData.email}</a> / <a href={`tel:${policyData.phone.replace(/[^0-9]/g, '')}`} className="text-emerald-400 underline">{policyData.phone}</a></span>
            </div>
          </div>
        )}

        {/* 4. Shipping & Delivery Special Highlight Box: 30 to 45 Minutes Verbatim Clause */}
        {activeTab === 'shipping' && (
          <div className="mb-8 p-5 border border-zinc-900 bg-zinc-950 text-white space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400 font-bold">
                  LOCAL DELIVERY TIMELINES & CHARGES
                </span>
              </div>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 text-[10px] font-mono font-bold tracking-wider uppercase">
                30 TO 45 MINUTES
              </span>
            </div>
            <p className="text-xs sm:text-sm font-semibold tracking-wide leading-relaxed text-zinc-100">
              Local food and grocery orders are delivered within 30 to 45 minutes in Churu city. Standard digital / catalog services are fulfilled instantly.
            </p>
            <div className="pt-2 border-t border-zinc-800 text-xs text-zinc-300">
              <span>• Shipping charges are transparently displayed during checkout before payment.</span>
            </div>
          </div>
        )}

        {/* Policy Body */}
        <div className="space-y-8 text-zinc-800">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 flex-wrap gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-950">
              {currentPolicy.title}
            </h2>
            <span className="text-xs text-zinc-400 font-mono">
              Effective Date: {currentPolicy.effectiveDate || 'October 1, 2026'}
            </span>
          </div>

          <div className="space-y-8">
            {currentPolicy.sections && currentPolicy.sections.map((sec, idx) => (
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

          {/* Contact Support Desk Banner */}
          <div className="mt-12 p-6 border border-zinc-200 bg-zinc-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 text-xs">
            <div>
              <div className="text-sm font-bold text-zinc-950">
                {policyData.legalEntity} • Support Desk
              </div>
              <div className="text-zinc-500 mt-1 font-normal">
                {policyData.address}
              </div>
              <div className="text-zinc-400 mt-0.5 font-mono text-[11px]">
                Operating Hours: {policyData.operatingHours}
              </div>
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

      {/* Global Footer with Mandatory Compliance Anchor Links & Copyright */}
      <footer className="border-t border-zinc-200 bg-white py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-zinc-500">
          <div className="text-center md:text-left">
            <span className="font-semibold text-zinc-800">
              © 2026 ChuruOne. A unit of Vasudhaiva Kutumbakam Robotics. All rights reserved.
            </span>
            <div className="text-[11px] text-zinc-400 mt-1">
              50, Churu bhaiji chowk, Churu, Rajasthan, PIN - 331001 • Support: Mehtabh864@gmail.com | +91 7023963189
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 font-medium text-zinc-600">
            <a 
              href="/contact-us" 
              onClick={(e) => { e.preventDefault(); handleTabChange('contact'); }} 
              className="hover:text-black hover:underline transition-colors"
            >
              Contact Us
            </a>
            <a 
              href="/terms-and-conditions" 
              onClick={(e) => { e.preventDefault(); handleTabChange('terms'); }} 
              className="hover:text-black hover:underline transition-colors"
            >
              Terms & Conditions
            </a>
            <a 
              href="/privacy-policy" 
              onClick={(e) => { e.preventDefault(); handleTabChange('privacy'); }} 
              className="hover:text-black hover:underline transition-colors"
            >
              Privacy Policy
            </a>
            <a 
              href="/refund-policy" 
              onClick={(e) => { e.preventDefault(); handleTabChange('refund'); }} 
              className="hover:text-black hover:underline transition-colors"
            >
              Refund & Cancellation
            </a>
            <a 
              href="/shipping-policy" 
              onClick={(e) => { e.preventDefault(); handleTabChange('shipping'); }} 
              className="hover:text-black hover:underline transition-colors"
            >
              Shipping Policy
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}
