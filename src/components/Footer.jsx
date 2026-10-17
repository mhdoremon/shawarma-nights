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
import { getStoreLiveStatus } from '../utils/storeTimingHelper';
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

  const storeLive = getStoreLiveStatus(storeInfo);

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
          <div className="inline-flex items-center gap-2 bg-white text-[#DC2626] px-5 py-2 rounded-full text-xs font-black uppercase tracking-wider shadow-sm mb-6">
            <span className={`w-2.5 h-2.5 rounded-full ${storeLive.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            <span>{storeLive.openTillText || info.openTillText}</span>
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
              <span>{storeLive.isOpen ? 'ORDER NOW' : 'EXPLORE MENU'}</span>
            </button>
          </div>
        </motion.div>
      </section>

      {/* ====== SECTION 2: THE ARTISANAL CHARCOAL KITCHEN & FOUNDER SHOWCASE ====== */}
      <section className="bg-[#FFFBF7] text-zinc-900 py-16 sm:py-20 relative overflow-hidden border-t border-zinc-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          {/* Section Editorial Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-50 border border-red-200 text-[#DC2626] text-xs font-black uppercase tracking-widest shadow-2xs">
              <Flame className="w-3.5 h-3.5 text-[#DC2626]" />
              <span>THE REAL CHARCOAL CRAFT • CHURU ORIGINAL</span>
            </div>
            <h3 className="text-3xl sm:text-5xl font-black text-zinc-900 tracking-tight uppercase">
              BORN IN MIDNIGHT. <span className="text-[#DC2626]">CARVED OVER COALS.</span>
            </h3>
            <p className="text-zinc-600 text-xs sm:text-sm leading-relaxed font-normal">
              {info.aboutText || "Authentic charcoal-grilled slow-roasted shawarma, prepared fresh daily in Churu, Rajasthan."}
            </p>
          </div>

          {/* Three Craftsmanship Pillars Grid: Distinct Red, Black, and White Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pillar 1: Bold Red Card */}
            <div className="p-6 rounded-3xl bg-[#DC2626] text-white shadow-xl space-y-3 group hover:scale-[1.02] transition-transform">
              <div className="w-10 h-10 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                <Flame className="w-5 h-5 text-white" />
              </div>
              <h4 className="text-base font-black text-white uppercase tracking-tight">100% Glowing Charcoal Spit</h4>
              <p className="text-xs text-white/90 leading-relaxed font-normal">
                Slow-turned for hours over burning natural hardwood charcoal. Deep smoky caramelization with juicy tenderness in every single layer.
              </p>
            </div>

            {/* Pillar 2: Obsidian Black Card */}
            <div className="p-6 rounded-3xl bg-zinc-950 text-white shadow-xl space-y-3 border border-zinc-800 group hover:scale-[1.02] transition-transform">
              <div className="w-10 h-10 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
              <h4 className="text-base font-black text-white uppercase tracking-tight">Daily-Whipped Garlic Toum</h4>
              <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                Whipped fresh every morning from fresh garlic cloves, cold-pressed oil, and sea salt. Zero mayonnaise, zero commercial shortcuts.
              </p>
            </div>

            {/* Pillar 3: Clean Crisp White Card */}
            <div className="p-6 rounded-3xl bg-white text-zinc-900 shadow-md border border-zinc-200/90 space-y-3 group hover:scale-[1.02] transition-transform">
              <div className="w-10 h-10 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-[#DC2626] group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <h4 className="text-base font-black text-zinc-900 uppercase tracking-tight">Flame-Blistered Saj Dome</h4>
              <p className="text-xs text-zinc-600 leading-relaxed font-normal">
                Stretched paper-thin and flash-toasted over our inverted iron dome, wrapping the juicy cuts into golden, crackling perfection.
              </p>
            </div>
          </div>

          {/* Lower Showcase: Founder Spotlight (Black Card) + Live Operations Hub (White Card) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Founder & Craftsman Spotlight: Obsidian Black Card */}
            <div className="p-6 sm:p-7 rounded-3xl bg-zinc-950 text-white border border-zinc-800 shadow-2xl space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#DC2626] bg-red-950/60 px-3 py-1 rounded-full border border-red-500/30">
                    Master Pitmaster & Founder
                  </span>
                  <span className="text-xs font-mono text-zinc-400 bg-zinc-900 px-2.5 py-1 rounded-lg border border-zinc-800">
                    Est. {info.foundedYear}
                  </span>
                </div>
                <div>
                  <h4 className="text-xl font-black text-white tracking-tight">{info.ownerName}</h4>
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{info.ownerRole}</p>
                </div>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed italic border-l-2 border-[#DC2626] pl-3 py-0.5">
                  "{info.ownerBio}"
                </p>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
                <span className="text-xs text-zinc-400 font-semibold">Churu, Rajasthan</span>
                <button
                  onClick={onOpenFranchise}
                  className="inline-flex items-center gap-1.5 text-xs font-black text-white bg-red-600 hover:bg-red-700 px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-md"
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>Franchise Inquiries</span>
                </button>
              </div>
            </div>

            {/* Live Operational Hours & Navigation Hub: Crisp White Card */}
            <div className="p-6 sm:p-7 rounded-3xl bg-white text-zinc-900 border border-zinc-200/90 shadow-xl space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${storeLive.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                    <span className="text-xs font-black uppercase tracking-wider text-zinc-900">
                      {storeLive.statusBadge}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-semibold text-zinc-600 bg-zinc-100 px-2.5 py-1 rounded-lg">
                    {info.timing}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">Hub Kitchen Address</span>
                  <p className="text-sm font-bold text-zinc-900 leading-snug">{info.address}</p>
                  <p className="text-xs text-zinc-500">{info.locationNote}</p>
                </div>
              </div>

              {/* Social Channels Row */}
              <div className="pt-4 border-t border-zinc-100 space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">Official Social Connectivity</span>
                <div className="flex flex-wrap items-center gap-2">
                  {socials?.whatsapp && (
                    <a
                      href={getWhatsAppUrl(socials.whatsapp)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-black flex items-center gap-1.5 transition-all shadow-2xs"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WhatsApp</span>
                    </a>
                  )}

                  {socials?.instagram && (
                    <a
                      href={socials.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded-xl bg-pink-50 hover:bg-pink-100 border border-pink-200 text-pink-700 text-xs font-black flex items-center gap-1.5 transition-all shadow-2xs"
                    >
                      <Instagram className="w-3.5 h-3.5 text-pink-600" />
                      <span>Instagram</span>
                    </a>
                  )}

                  {socials?.facebook && (
                    <a
                      href={socials.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-black flex items-center gap-1.5 transition-all shadow-2xs"
                    >
                      <Facebook className="w-3.5 h-3.5 text-blue-600" />
                      <span>Facebook</span>
                    </a>
                  )}

                  {socials?.twitter && (
                    <a
                      href={socials.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-800 text-xs font-black flex items-center gap-1.5 transition-all shadow-2xs"
                    >
                      <Twitter className="w-3.5 h-3.5 text-zinc-700" />
                      <span>Twitter / X</span>
                    </a>
                  )}

                  {socials?.youtube && (
                    <a
                      href={socials.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-black flex items-center gap-1.5 transition-all shadow-2xs"
                    >
                      <Youtube className="w-3.5 h-3.5 text-red-600" />
                      <span>YouTube</span>
                    </a>
                  )}

                  <a
                    href={mapsQueryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-black flex items-center gap-1.5 transition-all shadow-2xs ml-auto"
                  >
                    <Navigation className="w-3.5 h-3.5 text-amber-400" />
                    <span>Open Maps</span>
                    <ExternalLink className="w-3 h-3 text-zinc-400" />
                  </a>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ====== SECTION 3: POWERED BY CHURUONE (Bug 8) & LEGAL POLICIES ====== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-black text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-5 border border-zinc-800">
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
