import React, { useState } from 'react';
import { 
  Clock, 
  MapPin, 
  ShieldCheck, 
  Flame, 
  ArrowUp, 
  Instagram, 
  Twitter, 
  Facebook, 
  Youtube, 
  Phone,
  ExternalLink,
  Navigation,
  Store,
  FileText,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useRealtimeDB } from '../context/RealtimeContext';
import { RESTAURANT_INFO } from '../data/menuData';
import LegalPoliciesModal from './LegalPoliciesModal';

export default function Footer({ onOpenFranchise }) {
  const { storeInfo } = useRealtimeDB();
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState('terms');

  const openLegalModal = (tab = 'terms') => {
    setLegalTab(tab);
    setLegalModalOpen(true);
  };

  // Dynamic Dukandar Data with robust fallbacks
  const info = {
    timing: storeInfo?.timing || RESTAURANT_INFO?.timing || 'Open Daily: 12:00 PM – 04:00 AM',
    deliveryNote: storeInfo?.deliveryNote || 'Midnight express delivery available',
    address: storeInfo?.address || RESTAURANT_INFO?.address || 'Shop 14, Food Street Avenue, Central Plaza',
    locationNote: storeInfo?.locationNote || 'Central hub kitchen',
    aboutText: storeInfo?.aboutText || 'Artisanal charcoal spit kitchen serving hand-carved rolls, loaded fries, and signature platters since midnight.',
    halalBadgeText: storeInfo?.halalBadgeText || '100% Halal Certified Fresh',
    ownerPhone: storeInfo?.socials?.whatsapp || '7023963189',
    socials: storeInfo?.socials || {
      instagram: 'https://instagram.com/shawarmanights',
      whatsapp: '919876574292',
      twitter: '',
      facebook: '',
      youtube: ''
    }
  };

  const socials = info?.socials || {};

  const getWhatsAppUrl = (val) => {
    if (!val) return '';
    const str = String(val);
    if (str.startsWith('http://') || str.startsWith('https://')) return str;
    const cleanNum = str.replace(/\D/g, '');
    return `https://wa.me/${cleanNum}`;
  };

  const mapsQueryUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(info?.address || '')}`;

  return (
    <footer className="relative bg-[#FFFBF7] text-zinc-900 overflow-hidden">

      {/* ====== SECTION 1: STILL HUNGRY? (Exact match to Image 2 - NEVER TOUCH) ====== */}
      <section className="bg-[#DC2626] text-white py-16 sm:py-24 text-center px-4 sm:px-6 relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto"
        >
          {/* Top Pill Badge (Exact match to Image 2) */}
          <div className="inline-block bg-white text-[#DC2626] px-5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-sm mb-6">
            OPEN TILL 4:00 AM
          </div>

          {/* Large Headline (Exact match to Image 2) */}
          <h2 className="text-5xl sm:text-7xl font-black text-white tracking-tight leading-none mb-4">
            STILL<br />HUNGRY?
          </h2>

          {/* Subtitle (Exact match to Image 2) */}
          <p className="text-white/95 text-sm sm:text-base max-w-md mx-auto font-normal leading-relaxed mb-8">
            Fresh charcoal shawarmas rolling out till dawn. Your midnight cravings deserve the real deal.
          </p>

          {/* Single Action Button: ORDER NOW (Solid Black Pill) */}
          <div className="flex items-center justify-center">
            <button
              onClick={() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-zinc-900 hover:bg-black text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Flame className="w-4 h-4 text-[#DC2626]" />
              <span>ORDER NOW</span>
            </button>
          </div>
        </motion.div>
      </section>

      {/* ====== SECTION 2: STORE ARCHITECTURE (PREMIUM REDESIGNED CARDS) ====== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
        
        {/* Main Hub Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          
          {/* Card 1: Brand Anchor & Direct Kitchen Hotwire (5 Cols) */}
          <motion.div 
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-5 bg-white border border-zinc-200/90 rounded-[2rem] p-7 sm:p-9 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-8"
          >
            <div className="space-y-4">
              <div>
                <div className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-950 leading-none">
                  SHAWARMA <span className="text-[#DC2626]">NIGHTS</span>
                </div>
                <div className="text-[11px] font-black tracking-widest text-[#DC2626] uppercase mt-1.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]"></span>
                  <span>Artisanal Charcoal Spit Kitchen</span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed font-normal">
                {info.aboutText}
              </p>

              {/* Halal Quality Badge */}
              {info.halalBadgeText && (
                <div className="inline-flex items-center gap-2 text-emerald-800 font-bold text-xs bg-emerald-50 px-4 py-2 rounded-full border border-emerald-200/80 shadow-2xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                  <span>{info.halalBadgeText}</span>
                </div>
              )}
            </div>

            {/* Direct Dukandar Hotwire (Socials & WhatsApp) */}
            <div className="pt-6 border-t border-zinc-100 space-y-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                Direct Kitchen Hotwire & Socials
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {socials?.whatsapp && (
                  <a
                    href={getWhatsAppUrl(socials.whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2.5 px-5 py-3 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-xs transition-all shadow-md active:scale-95 hover:scale-102"
                  >
                    <Phone className="w-4 h-4 fill-white" />
                    <span>WhatsApp Kitchen</span>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                  </a>
                )}

                {socials?.instagram && (
                  <a
                    href={socials.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-11 h-11 rounded-full bg-zinc-50 hover:bg-rose-50 text-zinc-700 hover:text-rose-600 border border-zinc-200 flex items-center justify-center transition-all hover:scale-108 active:scale-95 shadow-2xs"
                    title="Follow on Instagram"
                  >
                    <Instagram className="w-4 h-4" />
                  </a>
                )}

                {socials?.twitter && (
                  <a
                    href={socials.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-11 h-11 rounded-full bg-zinc-50 hover:bg-sky-50 text-zinc-700 hover:text-sky-600 border border-zinc-200 flex items-center justify-center transition-all hover:scale-108 active:scale-95 shadow-2xs"
                    title="Follow on Twitter / X"
                  >
                    <Twitter className="w-4 h-4" />
                  </a>
                )}

                {socials?.facebook && (
                  <a
                    href={socials.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-11 h-11 rounded-full bg-zinc-50 hover:bg-blue-50 text-zinc-700 hover:text-blue-600 border border-zinc-200 flex items-center justify-center transition-all hover:scale-108 active:scale-95 shadow-2xs"
                    title="Follow on Facebook"
                  >
                    <Facebook className="w-4 h-4" />
                  </a>
                )}

                {socials?.youtube && (
                  <a
                    href={socials.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-11 h-11 rounded-full bg-zinc-50 hover:bg-red-50 text-zinc-700 hover:text-red-600 border border-zinc-200 flex items-center justify-center transition-all hover:scale-108 active:scale-95 shadow-2xs"
                    title="Watch on YouTube"
                  >
                    <Youtube className="w-4 h-4" />
                  </a>
                )}
              </div>

              {/* Own a Franchise Quick Link */}
              <div className="pt-2">
                <button
                  onClick={onOpenFranchise}
                  className="w-full py-3.5 px-5 rounded-2xl bg-zinc-50 hover:bg-red-50/80 text-zinc-900 hover:text-[#DC2626] font-extrabold text-xs transition-all flex items-center justify-between border border-zinc-200/80 hover:border-red-200 shadow-2xs active:scale-98 cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <Store className="w-4 h-4 text-[#DC2626]" />
                    <span>Own a Franchise & Partner With Us</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-[#DC2626] group-hover:translate-x-1 transition-all" />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Card 2: The Roasting Clock & Hours (3 Cols) */}
          <motion.div 
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-3 bg-white border border-zinc-200/90 rounded-[2rem] p-7 sm:p-9 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-6"
          >
            <div className="space-y-4">
              <div className="text-xs font-black text-[#DC2626] uppercase tracking-widest flex items-center gap-2">
                <Clock className="w-4 h-4 stroke-[2.5]" />
                <span>Roasting Clock</span>
              </div>

              <div className="pt-1">
                <div className="text-xl sm:text-2xl font-black text-zinc-950 leading-tight font-mono tracking-tight">
                  {info.timing}
                </div>
                <div className="text-xs text-zinc-500 font-medium mt-1.5 leading-relaxed">
                  {info.deliveryNote}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-zinc-100 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200/80 w-fit">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Midnight Slicing</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed font-normal">
                Spits keep spinning till the last order at 4:00 AM.
              </p>
            </div>
          </motion.div>

          {/* Card 3: The Spit Outpost & Coordinates (4 Cols) */}
          <motion.div 
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-4 bg-white border border-zinc-200/90 rounded-[2rem] p-7 sm:p-9 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-6"
          >
            <div className="space-y-4">
              <div className="text-xs font-black text-[#DC2626] uppercase tracking-widest flex items-center gap-2">
                <MapPin className="w-4 h-4 stroke-[2.5]" />
                <span>The Spit Outpost</span>
              </div>

              <div className="pt-1">
                <div className="text-base sm:text-lg font-bold text-zinc-950 leading-snug">
                  {info.address}
                </div>
                <div className="text-xs text-zinc-500 font-medium mt-1.5 leading-relaxed">
                  {info.locationNote}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-zinc-100 space-y-3.5">
              <div className="text-[11px] text-zinc-400 font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                <span>10 KM Express Midnight Delivery Corridor</span>
              </div>

              <a
                href={mapsQueryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-5 rounded-full bg-zinc-950 hover:bg-black text-white font-black text-xs transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md cursor-pointer group"
              >
                <Navigation className="w-3.5 h-3.5 text-red-400 group-hover:rotate-45 transition-transform" />
                <span>Locate on Google Maps</span>
                <ExternalLink className="w-3 h-3 text-zinc-400" />
              </a>
            </div>
          </motion.div>

        </div>

        {/* Legal Policies & PhonePe Compliance Strip */}
        <div className="mt-12 pt-8 border-t border-zinc-200 flex flex-col md:flex-row items-center justify-between gap-5 text-xs text-zinc-600">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 sm:gap-6 font-semibold">
            <a
              href="/contact-us"
              className="hover:text-[#DC2626] transition-colors"
            >
              Contact Us
            </a>
            <a
              href="/terms-and-conditions"
              className="hover:text-[#DC2626] transition-colors"
            >
              Terms & Conditions
            </a>
            <a
              href="/privacy-policy"
              className="hover:text-[#DC2626] transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="/refund-policy"
              className="hover:text-[#DC2626] transition-colors font-bold text-zinc-900"
            >
              Refund & Cancellation Policy
            </a>
            <a
              href="/shipping-policy"
              className="hover:text-[#DC2626] transition-colors"
            >
              Shipping Policy
            </a>
          </div>

          <div className="text-[11px] font-mono text-zinc-600 bg-white px-4 py-2 rounded-full border border-zinc-200/90 shadow-2xs text-center">
            Approved refunds processed in 5 to 7 business days • Local delivery in 30 to 45 mins
          </div>
        </div>

        {/* Accepted Payment Modes & Bottom Strip */}
        <div className="mt-8 pt-6 border-t border-zinc-200/80 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mr-2">
              Payment Modes:
            </span>
            {['UPI (Any App)', 'Google Pay', 'PhonePe', 'Paytm', 'Cash on Delivery'].map((mode) => (
              <span 
                key={mode} 
                className="bg-white border border-zinc-200/90 text-zinc-800 px-3.5 py-1 rounded-full text-xs font-semibold shadow-2xs"
              >
                {mode}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-zinc-500 font-normal">
              © 2026 Shawarma Nights. A unit of Vasudhaiva Kutumbakam Robotics. All rights reserved.
            </span>
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="w-10 h-10 rounded-full bg-[#DC2626] hover:bg-red-700 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-md cursor-pointer shrink-0"
              title="Back to top"
            >
              <ArrowUp className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </div>

      </div>

      {/* Legal Policies Modal */}
      <LegalPoliciesModal
        isOpen={legalModalOpen}
        onClose={() => setLegalModalOpen(false)}
        initialTab={legalTab}
        entity="shawarma"
      />

    </footer>
  );
}
