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
    name: storeInfo?.name || 'SHAWARMA NIGHTS',
    timing: storeInfo?.timing || RESTAURANT_INFO?.timing || 'Open Daily: 12:00 PM – 04:00 AM',
    openTillText: storeInfo?.openTillText || storeInfo?.timing || 'OPEN TILL 4:00 AM',
    deliveryNote: storeInfo?.deliveryNote || 'Midnight express delivery available',
    address: storeInfo?.address || RESTAURANT_INFO?.address || 'Shop 14, Food Street Avenue, Central Plaza',
    locationNote: storeInfo?.locationNote || 'Central hub kitchen',
    aboutText: storeInfo?.aboutText || 'Artisanal charcoal spit kitchen serving hand-carved rolls, loaded fries, and signature platters since midnight.',
    ownerName: storeInfo?.ownerName || 'Furkan & Team',
    ownerRole: storeInfo?.ownerRole || 'Founder & Head Chef',
    ownerBio: storeInfo?.ownerBio || 'Dedicated to authentic slow-roasted charcoal shawarma, hand-carved rolls, and fresh garlic toum made daily in Churu.',
    foundedYear: storeInfo?.foundedYear || '2024',
    ownerPhone: storeInfo?.socials?.whatsapp || '7023963189',
    socials: storeInfo?.socials || {
      instagram: 'https://instagram.com/shawarmanights',
      whatsapp: '7023963189',
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

      {/* ====== SECTION 1: STILL HUNGRY? (Dynamic Timing - Bug 5) ====== */}
      <section className="bg-[#DC2626] text-white py-16 sm:py-24 text-center px-4 sm:px-6 relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto"
        >
          {/* Top Pill Badge (Dynamic: connected to Dukandar Portal timing) */}
          <div className="inline-block bg-white text-[#DC2626] px-5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-sm mb-6">
            {info.openTillText ? info.openTillText.toUpperCase() : `OPEN • ${info.timing}`.toUpperCase()}
          </div>

          {/* Large Headline */}
          <h2 className="text-5xl sm:text-7xl font-black text-white tracking-tight leading-none mb-4">
            STILL<br />HUNGRY?
          </h2>

          {/* Subtitle */}
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

      {/* ====== SECTION 2: STORE ARCHITECTURE & FOUNDER SHOWCASE (Bug 6) ====== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
        
        {/* Main Hub Grid: 4 Dynamic Aesthetic Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1: Brand Story & Kitchen Action */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="text-xl font-black tracking-tight text-zinc-950">
                SHAWARMA <span className="text-[#DC2626]">NIGHTS</span>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed">
                {info.aboutText || "Authentic charcoal-grilled slow-roasted shawarma, prepared fresh daily in Churu, Rajasthan."}
              </p>
            </div>

            <div className="pt-4 border-t border-zinc-100 space-y-2.5">
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

          {/* Card 2: Founder & Master Craftsman Showcase (Bug 6) */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="text-xs font-bold text-[#DC2626] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>The Story & Founder</span>
              </div>
              <div>
                <h4 className="text-base font-black text-zinc-950">{info.ownerName}</h4>
                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide">{info.ownerRole}</p>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed">
                {info.ownerBio}
              </p>
            </div>

            <div className="pt-4 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
              <span className="font-semibold text-zinc-700">Hand-crafted in Churu</span>
              <span className="font-mono text-[11px] bg-zinc-100 px-2 py-0.5 rounded-md font-bold">Est. {info.foundedYear}</span>
            </div>
          </div>

          {/* Card 3: Kitchen Operating Hours */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="text-xs font-bold text-[#DC2626] uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Operating Hours</span>
              </div>
              <div className="text-xl font-black text-zinc-950 font-mono tracking-tight">
                {info.timing}
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">
                {info.deliveryNote}
              </p>
            </div>

            <div className="pt-4 border-t border-zinc-100 flex items-center gap-2 text-xs text-zinc-600">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold">Midnight Express Active</span>
            </div>
          </div>

          {/* Card 4: Kitchen Location & Navigation */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="text-xs font-bold text-[#DC2626] uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>Kitchen Location</span>
              </div>
              <div className="text-xs font-semibold text-zinc-900 leading-snug">
                {info.address}
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">
                {info.locationNote}
              </p>
            </div>

            <div className="pt-4 border-t border-zinc-100">
              <a
                href={mapsQueryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-black text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Navigation className="w-3.5 h-3.5 text-red-400" />
                <span>Open in Maps</span>
                <ExternalLink className="w-3 h-3 text-zinc-400" />
              </a>
            </div>
          </div>

        </div>

        {/* ====== SECTION 3: POWERED BY CHURUONE (Bug 8) ====== */}
        <div className="mt-12 p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-black text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-5 border border-zinc-800">
          <div className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center font-black text-lg text-white border border-white/20 shrink-0">
              C1
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black tracking-wider uppercase text-white">ChuruOne Hyperlocal Commerce</span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#DC2626] text-white">
                  Official Store
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed max-w-xl">
                Churu's official direct-to-consumer digital commerce engine. Connecting verified local food joints, designers, and creators with lightning-fast 30-minute delivery.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto">
            <a
              href="/explore"
              className="flex-1 md:flex-none px-5 py-2.5 rounded-full bg-white text-zinc-900 hover:bg-zinc-100 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md"
            >
              <span>Explore Churu Stores</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
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
