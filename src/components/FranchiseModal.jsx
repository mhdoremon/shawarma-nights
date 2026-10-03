import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Store, 
  TrendingUp, 
  Award, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  Phone, 
  MapPin, 
  ArrowRight, 
  Send, 
  Building2, 
  Sparkles,
  DollarSign,
  FileText,
  Check
} from 'lucide-react';
import { useRealtimeDB } from '../context/RealtimeContext';

export default function FranchiseModal({ isOpen, onClose }) {
  const { franchise, submitFranchiseInquiry } = useRealtimeDB();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    city: '',
    budget: '₹3.5 Lakhs – ₹5 Lakhs',
    experience: false,
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const data = franchise || {};
  const directPhone = data.directPhone || '7023963189';
  const whatsappPhone = data.whatsappPhone || '917023963189';

  const cleanWaNumber = String(whatsappPhone).replace(/\D/g, '');
  const whatsappLink = `https://wa.me/${cleanWaNumber}?text=${encodeURIComponent(
    'Hello Shawarma Nights Team! I am interested in opening a franchise in my city. Please share franchise deck and expansion details.'
  )}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.name.trim() || !formData.phone.trim()) {
      setErrorMessage('Please enter your full name and 10-digit mobile number.');
      return;
    }

    const cleanNum = formData.phone.replace(/[^\d+]/g, '');
    if (cleanNum.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsSubmitting(true);
    const result = await submitFranchiseInquiry({
      name: formData.name.trim(),
      phone: cleanNum,
      city: formData.city.trim(),
      budget: formData.budget,
      experience: formData.experience,
      notes: formData.notes.trim()
    });
    setIsSubmitting(false);

    if (result.success) {
      setIsSubmitted(true);
    } else {
      setErrorMessage(result.message || 'Failed to submit application. Please call or WhatsApp us directly.');
    }
  };

  const resetForm = () => {
    setIsSubmitted(false);
    setFormData({
      name: '',
      phone: '',
      city: '',
      budget: '₹3.5 Lakhs – ₹5 Lakhs',
      experience: false,
      notes: ''
    });
    setErrorMessage('');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-start justify-center p-2 sm:p-4 md:p-6">
        
        {/* Main Clean Modal Container (Solid Crisp Elevated 3D Card, Zero Blur) */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-4xl bg-[#FFFBF7] rounded-[2.5rem] shadow-[0_30px_90px_-20px_rgba(0,0,0,0.35)] overflow-hidden my-4 sm:my-8 text-zinc-900"
        >
          
          {/* Top Header Bar */}
          <div className="sticky top-0 z-20 bg-white shadow-xs px-5 sm:px-8 py-4.5 flex items-center justify-between border-b border-zinc-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#DC2626] text-white flex items-center justify-center shadow-sm">
                <Store className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <div className="text-sm sm:text-base font-black tracking-tight text-zinc-900 leading-tight">
                  SHAWARMA NIGHTS
                </div>
                <div className="text-[10px] font-bold tracking-widest text-[#DC2626] uppercase">
                  FRANCHISE EXPANSION PROGRAM
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 flex items-center justify-center transition-all cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4 stroke-[2.2]" />
            </button>
          </div>

          {/* Modal Content Scroll Area */}
          <div className="p-5 sm:p-8 md:p-10 space-y-10 sm:space-y-12">
            
            {/* HERO SECTION */}
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <div className="inline-block bg-zinc-900 text-white px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm rotate-[-1deg]">
                EXPANSION PARTNERSHIP 2026
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-zinc-900 tracking-tight leading-tight">
                Own India&apos;s Next High-Traffic Charcoal Shawarma Outpost
              </h1>

              <p className="text-sm sm:text-base text-zinc-600 leading-relaxed font-normal">
                {data.subheadline || "Join India's fastest growing midnight charcoal shawarma network. Proven high-volume unit economics, turnkey kitchen setup, and 100% proprietary spice & sauce supply."}
              </p>
            </div>

            {/* 4 KEY METRICS (Solid Elevated 3D Metric Cards, Zero Outline) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              
              <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)]">
                <div className="w-8 h-8 rounded-xl bg-red-50 text-[#DC2626] flex items-center justify-center mb-3">
                  <DollarSign className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Investment</div>
                <div className="text-base sm:text-xl font-black text-zinc-900 mt-0.5">{data.investmentRange || '₹3.5L – ₹6.5L'}</div>
                <div className="text-[11px] text-zinc-500 mt-1">Low Initial Capex</div>
              </div>

              <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)]">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                  <TrendingUp className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Payback ROI</div>
                <div className="text-base sm:text-xl font-black text-zinc-900 mt-0.5">{data.roiMonths || '3 to 6 Months'}</div>
                <div className="text-[11px] text-zinc-500 mt-1">Fast Capital Recovery</div>
              </div>

              <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)]">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                  <Award className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Gross Margin</div>
                <div className="text-base sm:text-xl font-black text-zinc-900 mt-0.5">{data.grossMargin || '50% – 60%'}</div>
                <div className="text-[11px] text-zinc-500 mt-1">High Daily Cash Flow</div>
              </div>

              <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)]">
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-3">
                  <Clock className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Setup Time</div>
                <div className="text-base sm:text-xl font-black text-zinc-900 mt-0.5">{data.setupDays || '14 Days'}</div>
                <div className="text-[11px] text-zinc-500 mt-1">Turnkey Launch</div>
              </div>

            </div>

            {/* 2 FRANCHISE FORMATS (Model A vs Model B) */}
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-xs font-bold tracking-widest text-[#DC2626] uppercase">STORE FORMATS</div>
                <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 mt-1">Choose Your Franchise Model</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-2">
                
                {/* Format 1: Express Kiosk */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_12px_35px_-8px_rgba(0,0,0,0.06)] hover:shadow-[0_18px_45px_-8px_rgba(0,0,0,0.1)] transition-all flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black px-3.5 py-1.5 rounded-xl bg-zinc-900 text-white uppercase tracking-wider">
                        FORMAT 1
                      </span>
                      <span className="text-xl font-black text-[#DC2626]">₹3.5 Lakhs</span>
                    </div>

                    <div>
                      <h3 className="text-xl font-black text-zinc-900">Express Kiosk / Cloud Outpost</h3>
                      <p className="text-xs text-zinc-500 mt-1">
                        Space: 120 – 250 Sq Ft • Ideal for food streets, midnight takeaway & online deliveries.
                      </p>
                    </div>

                    <div className="space-y-2.5 pt-2 border-t border-zinc-100">
                      {[
                        'Minimal 2-person staff requirement',
                        'Heavy-duty compact charcoal spit rotisserie',
                        'Lowest monthly commercial rent overhead',
                        'Fastest breakeven (90 to 120 days)'
                      ].map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs text-zinc-700">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setFormData(prev => ({ ...prev, budget: '₹3.5 Lakhs (Express Kiosk)' }));
                      document.getElementById('franchise-form')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="w-full py-3.5 px-4 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <span>Apply for Express Kiosk</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Format 2: High Street Dine-in */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_12px_35px_-8px_rgba(0,0,0,0.06)] hover:shadow-[0_18px_45px_-8px_rgba(0,0,0,0.1)] transition-all flex flex-col justify-between space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-[#DC2626] text-white text-[10px] font-black px-4 py-1 rounded-bl-xl uppercase tracking-wider">
                    FLAGSHIP
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black px-3.5 py-1.5 rounded-xl bg-red-50 text-[#DC2626] uppercase tracking-wider">
                        FORMAT 2
                      </span>
                      <span className="text-xl font-black text-[#DC2626]">₹6.5 Lakhs</span>
                    </div>

                    <div>
                      <h3 className="text-xl font-black text-zinc-900">High-Street Dine-In Cafe</h3>
                      <p className="text-xs text-zinc-500 mt-1">
                        Space: 350 – 800 Sq Ft • Live charcoal spit theater, 16-32 seats & full menu experience.
                      </p>
                    </div>

                    <div className="space-y-2.5 pt-2 border-t border-zinc-100">
                      {[
                        'Front-facing live charcoal rotisserie visual attraction',
                        'Seating for 16 to 32 guests with signature ambiance',
                        'Full menu: Shawarma, loaded fries, platters & shakes',
                        'Highest Average Order Value (AOV)'
                      ].map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs text-zinc-700">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setFormData(prev => ({ ...prev, budget: '₹6.5 Lakhs (High-Street Cafe)' }));
                      document.getElementById('franchise-form')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="w-full py-3.5 px-4 rounded-full bg-[#DC2626] hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95"
                  >
                    <span>Apply for Flagship Cafe</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            </div>

            {/* WHAT YOU GET (Turnkey Partner Support) */}
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-xs font-bold tracking-widest text-[#DC2626] uppercase">360° PARTNER SUPPORT</div>
                <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 mt-1">Everything You Need To Win</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                {[
                  {
                    icon: Store,
                    title: 'Turnkey Kitchen Setup',
                    desc: 'Full layout planning, charcoal rotisserie spits, exhaust hood, and commercial kitchen machinery.'
                  },
                  {
                    icon: ShieldCheck,
                    title: 'Secret Spice & Toum Supply',
                    desc: 'Direct centralized supply of authentic marination spices and signature garlic toum base.'
                  },
                  {
                    icon: Award,
                    title: 'Staff & Chef SOP Training',
                    desc: '7-day complete master training for pitmasters and counter staff with standardized recipes.'
                  },
                  {
                    icon: Building2,
                    title: 'Smart POS & Delivery Setup',
                    desc: 'Pre-configured cloud billing software, customer SMS alerts, and Swiggy / Zomato onboarding.'
                  },
                  {
                    icon: DollarSign,
                    title: 'Zero Royalty Initial Growth',
                    desc: 'Zero royalties or low fixed terms in initial months so you recoup capital rapidly.'
                  },
                  {
                    icon: Sparkles,
                    title: 'Launch & Influencer Push',
                    desc: 'Hyperlocal social campaigns, food blogger invites, and launch collateral for day-1 crowd.'
                  }
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className="bg-white rounded-2xl p-5 shadow-[0_8px_25px_-5px_rgba(0,0,0,0.04)] space-y-2">
                      <div className="w-8 h-8 rounded-lg bg-red-50 text-[#DC2626] flex items-center justify-center">
                        <Icon className="w-4 h-4 stroke-[2.2]" />
                      </div>
                      <h4 className="text-sm font-black text-zinc-900">{item.title}</h4>
                      <p className="text-xs text-zinc-600 leading-relaxed">{item.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* INQUIRY FORM & DIRECT CALL SECTION */}
            <div id="franchise-form" className="bg-white rounded-3xl p-6 sm:p-10 shadow-[0_15px_45px_-10px_rgba(0,0,0,0.07)] space-y-8">
              
              <div className="text-center max-w-xl mx-auto space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                  <Check className="w-3.5 h-3.5" />
                  <span>DIRECT EXPANSION DESK</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-zinc-900">
                  Submit Franchise Application
                </h3>
                <p className="text-xs sm:text-sm text-zinc-500">
                  Fill in your details below and our team will get in touch with the complete franchise brochure & unit economics.
                </p>
              </div>

              {isSubmitted ? (
                <div className="text-center py-10 space-y-4 max-w-md mx-auto">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="text-xl font-black text-zinc-900">Application Received!</h4>
                  <p className="text-xs sm:text-sm text-zinc-600">
                    Thank you, <strong>{formData.name}</strong>. Our franchise expansion director will review your proposed location ({formData.city || 'your city'}) and call you within 24 hours.
                  </p>
                  <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                    >
                      <Phone className="w-4 h-4" />
                      <span>Chat on WhatsApp Directly</span>
                    </a>
                    <button
                      onClick={resetForm}
                      className="w-full sm:w-auto px-6 py-3 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs uppercase tracking-wider transition-all"
                    >
                      Submit Another Inquiry
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl mx-auto">
                  
                  {errorMessage && (
                    <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-[#DC2626] text-xs font-bold text-center">
                      {errorMessage}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rahul Sharma"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3.5 rounded-2xl bg-[#FFFBF7] text-zinc-900 text-sm focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs"
                      />
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                        Mobile Number (+91) *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 7023963189"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3.5 rounded-2xl bg-[#FFFBF7] text-zinc-900 text-sm focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* City / State */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                        Proposed City / Location *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Churu, Jaipur, Sikar"
                        value={formData.city}
                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-4 py-3.5 rounded-2xl bg-[#FFFBF7] text-zinc-900 text-sm focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs"
                      />
                    </div>

                    {/* Budget Dropdown */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                        Investment Capacity
                      </label>
                      <select
                        value={formData.budget}
                        onChange={e => setFormData({ ...formData, budget: e.target.value })}
                        className="w-full px-4 py-3.5 rounded-2xl bg-[#FFFBF7] text-zinc-900 text-sm focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all cursor-pointer shadow-xs"
                      >
                        <option value="₹3.5 Lakhs (Express Kiosk)">₹3.5 Lakhs (Express Kiosk)</option>
                        <option value="₹6.5 Lakhs (High-Street Cafe)">₹6.5 Lakhs (High-Street Cafe)</option>
                        <option value="₹8 Lakhs – ₹12 Lakhs (Multi-Unit)">₹8 Lakhs – ₹12 Lakhs (Multi-Unit)</option>
                      </select>
                    </div>
                  </div>

                  {/* Prior Experience Toggle */}
                  <div className="p-4 rounded-2xl bg-[#FFFBF7] shadow-xs flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-zinc-900">Prior Food / Restaurant Experience?</div>
                      <div className="text-[11px] text-zinc-500">Not mandatory — we provide 100% training & SOPs</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, experience: false })}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                          !formData.experience ? 'bg-zinc-900 text-white shadow-xs' : 'bg-zinc-200 text-zinc-600'
                        }`}
                      >
                        No
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, experience: true })}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                          formData.experience ? 'bg-[#DC2626] text-white shadow-xs' : 'bg-zinc-200 text-zinc-600'
                        }`}
                      >
                        Yes
                      </button>
                    </div>
                  </div>

                  {/* Additional Notes */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                      Specific Location or Comments (Optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Have a 200 sq ft rented space on main market road..."
                      value={formData.notes}
                      onChange={e => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-[#FFFBF7] text-zinc-900 text-sm focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all resize-none shadow-xs"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 px-6 rounded-full bg-[#DC2626] hover:bg-red-700 active:scale-[0.99] text-white font-black text-sm uppercase tracking-wider shadow-xl hover:shadow-2xl hover:scale-[1.01] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <span>Submitting Application...</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>SUBMIT FRANCHISE APPLICATION</span>
                      </>
                    )}
                  </button>

                  {/* Direct Contact Bar */}
                  <div className="pt-4 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500">
                    <div className="flex items-center gap-2">
                      <span>Prefer instant discussion?</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <a
                        href={whatsappLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-bold text-emerald-600 hover:text-emerald-700"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>WhatsApp: +{cleanWaNumber}</span>
                      </a>
                      <span>•</span>
                      <a
                        href={`tel:${directPhone}`}
                        className="inline-flex items-center gap-1.5 font-bold text-zinc-800 hover:text-zinc-900"
                      >
                        <Phone className="w-3.5 h-3.5 text-red-600" />
                        <span>Call: {directPhone}</span>
                      </a>
                    </div>
                  </div>

                </form>
              )}

            </div>

          </div>

          {/* Bottom Close Bar */}
          <div className="bg-white border-t border-zinc-100 px-6 py-4 text-center">
            <button
              onClick={onClose}
              className="text-xs font-black text-zinc-500 hover:text-[#DC2626] transition-colors uppercase tracking-wider cursor-pointer"
            >
              ← Back to Shawarma Nights Menu
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
