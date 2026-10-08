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
  FileText
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

      {/* ====== SECTION 1: STILL HUNGRY? (Exact match to Image 2) ====== */}
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

      {/* ====== SECTION 2: STORE ARCHITECTURE (APPLE-STYLE WHITE CARDS) ====== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        
        {/* Main Hub Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          
          {/* Card 1: Brand Anchor & Direct Kitchen Hotwire (5 Cols) */}
          <div className="lg:col-span-5 bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col justify-between space-y-6">
            <div className="space-y-3.5">
              <div>
                <div className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 leading-none">
                  SHAWARMA <span className="text-red-600">NIGHTS</span>
                </div>
                <div className="text-[11px] font-bold tracking-widest text-red-600 uppercase mt-1">
                  Artisanal Charcoal Spit Kitchen
                </div>
              </div>

              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed font-normal">
                {info.aboutText}
              </p>

              {/* Halal Quality Badge */}
              {info.halalBadgeText && (
                <div className="inline-flex items-center gap-2 text-emerald-700 font-bold text-xs bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>{info.halalBadgeText}</span>
                </div>
              )}
            </div>

            {/* Direct Dukandar Hotwire (Socials & WhatsApp) */}
            <div className="pt-4 border-t border-zinc-100 space-y-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Direct Kitchen Hotwire & Socials
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {socials?.whatsapp && (
                  <a
                    href={getWhatsAppUrl(socials.whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs transition-all shadow-xs active:scale-95"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>WhatsApp Kitchen</span>
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  </a>
                )}

                {socials?.instagram && (
                  <a
                    href={socials.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-zinc-100 hover:bg-red-50 text-zinc-700 hover:text-red-600 border border-zinc-200 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
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
                    className="w-10 h-10 rounded-full bg-zinc-100 hover:bg-sky-50 text-zinc-700 hover:text-sky-600 border border-zinc-200 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
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
                    className="w-10 h-10 rounded-full bg-zinc-100 hover:bg-blue-50 text-zinc-700 hover:text-blue-600 border border-zinc-200 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
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
                    className="w-10 h-10 rounded-full bg-zinc-100 hover:bg-red-50 text-zinc-700 hover:text-red-600 border border-zinc-200 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
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
                  className="w-full py-3 px-4 rounded-full bg-[#FFFBF7] hover:bg-red-50 text-zinc-900 hover:text-[#DC2626] font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98"
                >
                  <Store className="w-3.5 h-3.5 text-[#DC2626]" />
                  <span>Own a Franchise & Partner With Us</span>
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: The Roasting Clock & Hours (3 Cols) */}
          <div className="lg:col-span-3 bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="text-xs font-bold text-red-600 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>Roasting Clock</span>
              </div>

              <div className="pt-2">
                <div className="text-xl sm:text-2xl font-black text-zinc-900 leading-tight font-mono">
                  {info.timing}
                </div>
                <div className="text-xs text-zinc-500 font-medium mt-1">
                  {info.deliveryNote}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-100 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 w-fit">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Midnight Slicing</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Spits keep spinning till the last order at 4:00 AM.
              </p>
            </div>
          </div>

          {/* Card 3: The Spit Outpost & Coordinates (4 Cols) */}
          <div className="lg:col-span-4 bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="text-xs font-bold text-red-600 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                <span>The Spit Outpost</span>
              </div>

              <div className="pt-2">
                <div className="text-base sm:text-lg font-bold text-zinc-900 leading-snug">
                  {info.address}
                </div>
                <div className="text-xs text-zinc-500 font-medium mt-1">
                  {info.locationNote}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-100 space-y-3">
              <div className="text-[11px] text-zinc-400">
                10 KM Express Midnight Delivery Corridor
              </div>

              <a
                href={mapsQueryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <Navigation className="w-3.5 h-3.5 text-red-400" />
                <span>Locate on Google Maps</span>
                <ExternalLink className="w-3 h-3 text-zinc-400" />
              </a>
            </div>
          </div>

        </div>

        {/* Legal Policies & Compliance Strip */}
        <div className="mt-8 pt-6 border-t border-zinc-200 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 sm:gap-6 font-medium">
            <button
              type="button"
              onClick={() => openLegalModal('terms')}
              className="hover:text-red-600 transition-colors cursor-pointer"
            >
              Terms & Conditions
            </button>
            <button
              type="button"
              onClick={() => openLegalModal('privacy')}
              className="hover:text-red-600 transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <button
              type="button"
              onClick={() => openLegalModal('refund')}
              className="hover:text-red-600 transition-colors cursor-pointer font-bold text-zinc-700"
            >
              Refund & Cancellation Policy
            </button>
          </div>

          <div className="text-[11px] font-mono text-zinc-400 bg-zinc-100 px-3 py-1 rounded-full border border-zinc-200 text-center">
            Orders can be cancelled within 10 minutes, refund in 2-3 days • Self-return eligible under 2–3 KM
          </div>
        </div>

        {/* Accepted Payment Modes & Bottom Strip */}
        <div className="mt-8 pt-6 border-t border-zinc-200 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mr-2">
              Payment Modes (UPI Only):
            </span>
            {['UPI (Any App)', 'Google Pay', 'PhonePe', 'Paytm', 'BHIM UPI'].map((mode) => (
              <span 
                key={mode} 
                className="bg-white border border-zinc-200 text-zinc-700 px-3 py-1 rounded-full text-xs font-medium shadow-xs"
              >
                {mode}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-zinc-500 font-medium">
              © {new Date().getFullYear()} Shawarma Nights • Sultan of Charcoal Wraps
            </span>
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="w-9 h-9 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-xs cursor-pointer"
              title="Back to top"
            >
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
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
