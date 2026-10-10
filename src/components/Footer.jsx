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

      {/* ====== SECTION 2: STORE ARCHITECTURE (MINIMAL LUXURY 3-CARD LAYOUT) ====== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
        
        {/* Main Hub Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Brand Anchor & Direct Kitchen (Col 1) */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-7 shadow-xs flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="text-xl sm:text-2xl font-black tracking-tight text-zinc-950">
                SHAWARMA <span className="text-[#DC2626]">NIGHTS</span>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed">
                {info.aboutText || "Authentic charcoal-grilled slow-roasted shawarma, prepared fresh daily in Churu, Rajasthan."}
              </p>
              {info.halalBadgeText && (
                <div className="inline-flex items-center gap-1.5 text-emerald-700 font-medium text-xs bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{info.halalBadgeText}</span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-zinc-100 space-y-3">
              {socials?.whatsapp && (
                <a
                  href={getWhatsAppUrl(socials.whatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  <Phone className="w-3.5 h-3.5 fill-white" />
                  <span>WhatsApp Kitchen</span>
                </a>
              )}

              <button
                onClick={onOpenFranchise}
                className="w-full py-2.5 px-4 rounded-xl bg-zinc-50 hover:bg-zinc-100 text-zinc-800 font-semibold text-xs transition-colors flex items-center justify-between border border-zinc-200/80 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Store className="w-3.5 h-3.5 text-[#DC2626]" />
                  <span>Franchise Inquiries</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
              </button>
            </div>
          </div>

          {/* Card 2: Kitchen Hours (Col 2) */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-7 shadow-xs flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="text-xs font-bold text-[#DC2626] uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Operating Hours</span>
              </div>
              <div className="text-2xl font-black text-zinc-950 font-mono tracking-tight">
                {info.timing || "6:00 PM – 4:00 AM"}
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">
                {info.deliveryNote || "Open all 7 days for direct delivery & takeout."}
              </p>
            </div>

            <div className="pt-4 border-t border-zinc-100 flex items-center gap-2 text-xs text-zinc-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Midnight Delivery Active</span>
            </div>
          </div>

          {/* Card 3: Location (Col 3) */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-7 shadow-xs flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="text-xs font-bold text-[#DC2626] uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>Kitchen Location</span>
              </div>
              <div className="text-sm font-semibold text-zinc-900 leading-snug">
                {info.address || "Station Road, Churu, Rajasthan 331001"}
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">
                {info.locationNote || "Central Churu kitchen with 30-45 min local delivery."}
              </p>
            </div>

            <div className="pt-4 border-t border-zinc-100">
              <a
                href={mapsQueryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-black text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Navigation className="w-3.5 h-3.5 text-red-400" />
                <span>Open in Google Maps</span>
                <ExternalLink className="w-3 h-3 text-zinc-400" />
              </a>
            </div>
          </div>

        </div>

        {/* Clean Legal Policies Strip */}
        <div className="mt-10 pt-6 border-t border-zinc-200/80 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-600">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 sm:gap-6 font-medium">
            <a href="/contact-us" className="hover:text-[#DC2626] transition-colors">
              Contact Us
            </a>
            <a href="/terms-and-conditions" className="hover:text-[#DC2626] transition-colors">
              Terms & Conditions
            </a>
            <a href="/privacy-policy" className="hover:text-[#DC2626] transition-colors">
              Privacy Policy
            </a>
            <a href="/refund-policy" className="hover:text-[#DC2626] transition-colors">
              Refund & Cancellation
            </a>
            <a href="/shipping-policy" className="hover:text-[#DC2626] transition-colors">
              Shipping Policy
            </a>
          </div>

          <div className="text-[11px] font-mono text-zinc-500 text-center">
            Delivery: 30-45 mins • Refunds processed in 5-7 business days
          </div>
        </div>

        {/* Bottom Minimal Copyright & Up Button */}
        <div className="mt-6 pt-4 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-zinc-500">
          <span>© 2026 Shawarma Nights. A unit of Vasudhaiva Kutumbakam Robotics.</span>
          <div className="flex items-center gap-4">
            <span className="font-mono text-zinc-400">Accepted: UPI, Cash on Delivery</span>
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="w-8 h-8 rounded-full bg-zinc-200 hover:bg-zinc-300 text-zinc-700 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title="Back to top"
            >
              <ArrowUp className="w-3.5 h-3.5" />
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
