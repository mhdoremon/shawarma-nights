import { useState, useEffect, useRef } from "react";
import {
  subscribeToBookingsForDate,
  createBookingWithTransaction,
  subscribeToHairstyles,
  subscribeToSiteSettings,
  subscribeToCustomCSS,
  isFirebaseConfigured,
  subscribeToAuth,
  loginWithGoogle,
  logoutUser,
  saveFeedback,
  saveReview,
  subscribeToReviews
} from "./firebase";
import FeedbackModal from "./FeedbackModal";
import LegalPoliciesModal from "../../components/LegalPoliciesModal";
import { getChuruOneSession, setChuruOneSession } from "../../utils/ssoHelper";
import { smartFetch } from "./smartServerClient";
import { 
  Star, 
  Moon, 
  Sun, 
  ArrowUpRight, 
  ArrowLeft, 
  X, 
  Check, 
  Lock, 
  AlertTriangle, 
  Zap, 
  Sparkles, 
  ShieldCheck,
  Calendar,
  Clock,
  Scissors,
  User as UserIcon,
  Phone,
  MapPin,
  Printer,
  Share2,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

// =========================================================================
// Set to `true`: UPI QR code advance booking token fee payment is 100% mandatory.
// Slot CANNOT be booked without paying the ₹50 token payment.
// =========================================================================
const ENABLE_ONLINE_PAYMENT = true; // MANDATORY TOKEN ADVANCE PAYMENT (₹50 FIXED)

const BUFFER = 5;
const WORK_START = 11 * 60;
const WORK_END   = 23 * 60;
const ROW_STEP   = 30;

const DEFAULT_SETTINGS = {
  studioName: "Nash Studio",
  heroTagline: "PRECISION GROOMING. BINA INTEZAAR KE.",
  heroButtonText: "",
  heroVideoUrl: "/video/hero.mp4",
  showHeroBanner: false,
  showOfferCards: false,
  showMarqueeStrip: false,
  dealsEnabled: false,
  shopWhatsapp: "917023963189",
  phoneDisplay: "+91 70239 63189",
  address: "Main Market, Churu, Rajasthan, PIN - 331001",
  monSatHours: "11:00 AM to 11:00 PM",
  sundayHours: "Closed",
  bookingFee: 50,
  upiId: "nashstudio@upi",
  accountTitle: "Nash Studio",
};

const DEFAULT_HAIRSTYLES = [
  // PREMIUM (60 min • Rs 1500)
  { id: 'hs1', name: 'Messy Spiky Undercut', type: 'premium', img: '/images/10-messy-spiky-undercut-for-men.webp', time: 60, price: 1500, desc: 'High-texture spiky top with ultra-sharp disconnected fade.' },
  { id: 'hs2', name: 'Messy Flow & Texture', type: 'premium', img: '/images/Messy_Hairstyles_For_Men_76d77f7a-be86-4de0-802f-5fd01f933356.webp', time: 60, price: 1500, desc: 'Natural flow length with textured layers and soft taper.' },
  { id: 'hs3', name: 'Royal Pompadour Fade', type: 'premium', img: '/images/hs_pompadour_fade.jpg', time: 60, price: 1500, desc: 'Voluminous high pompadour with seamless skin fade.' },
  { id: 'hs4', name: 'Classic Executive Pompadour', type: 'premium', img: '/images/images (1).jfif', time: 60, price: 1500, desc: 'Clean slicked pompadour for sharp business presentation.' },
  { id: 'hs5', name: 'Modern Slicked Back Taper', type: 'premium', img: '/images/hs_slick_back.jpg', time: 60, price: 1500, desc: 'Gloss finish swept back style with tailored side tapers.' },
  { id: 'hs6', name: 'Textured Wolf Cut', type: 'premium', img: '/images/hs_wolf_cut.jpg', time: 60, price: 1500, desc: 'Edgy modern wolf layers with textured fringe.' },
  { id: 'hs7', name: 'Scissor Sculpt & Lineup', type: 'premium', img: '/images/hs_scissor_sculpt.jpg', time: 60, price: 1500, desc: '100% precision scissor craftsmanship with hot towel finish.' },
  { id: 'hs8', name: 'Voluminous Quiff Fade', type: 'premium', img: '/images/hs_quiff_fade.jpg', time: 60, price: 1500, desc: 'Lifted textured quiff with high contrast side taper.' },
  { id: 'hs9', name: 'Executive Contour Fade', type: 'premium', img: '/images/images.jfif', time: 60, price: 1500, desc: 'Sharp silhouette contoured to head shape with beard blend.' },

  // STANDARD (30 min • Rs 800 / Rs 500)
  { id: 'hs10', name: 'Soft Taper Skin Fade', type: 'standard', img: '/images/Soft-fade-edit.webp', time: 30, price: 800, desc: 'Everyday clean skin taper with natural top finish.' },
  { id: 'hs11', name: 'Textured Crop Fade', type: 'standard', img: '/images/images (2).jfif', time: 30, price: 800, desc: 'Blunt matte crop fringe with sharp temple taper.' },
  { id: 'hs12', name: 'Military Precision Buzz', type: 'standard', img: '/images/images (3).jfif', time: 30, price: 500, desc: 'Ultra-clean uniform military buzz with edge lineup.' },
  { id: 'hs13', name: 'Clean High-Fade Buzz', type: 'standard', img: '/images/hs_buzz_cut.jpg', time: 30, price: 500, desc: 'Short buzz top blended into high bald skin fade.' },
  { id: 'hs14', name: 'Classic Low Taper Fade', type: 'standard', img: '/images/hs_taper_fade.jpg', time: 30, price: 800, desc: 'Subtle low neckline taper with neat scissor trim.' },
  { id: 'hs15', name: 'French Crop & Fringe', type: 'standard', img: '/images/hs_french_crop.jpg', time: 30, price: 800, desc: 'Structured forward fringe with faded perimeter.' },
  { id: 'hs16', name: 'Curly Top Drop Fade', type: 'standard', img: '/images/hs_curly_fade.jpg', time: 30, price: 800, desc: 'Defined natural curls paired with curving drop fade.' },
  { id: 'hs17', name: 'Classic Side Part Cut', type: 'standard', img: '/images/hs_side_part.jpg', time: 30, price: 800, desc: 'Timeless comb-over side parting with clean perimeter.' },
  { id: 'hs18', name: 'Gentleman Crew Cut', type: 'standard', img: '/images/hs_crew_cut.jpg', time: 30, price: 800, desc: 'Low-maintenance, smart and sharp everyday crew cut.' },
];

function MinimalUserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function MinimalScissorsIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="18" r="3" />
      <line x1="8.2" y1="15.8" x2="18" y2="4" />
      <line x1="15.8" y1="15.8" x2="6" y2="4" />
      <circle cx="12" cy="12" r="0.75" fill="currentColor" />
    </svg>
  );
}
const DOW = ["SUN","MON","TUE","WED","THU","FRI","SAT"];

function formatTime(hh, mm) {
  const period = hh >= 12 ? "PM" : "AM";
  let h12 = hh % 12; if (h12 === 0) h12 = 12;
  return `${h12}:${mm.toString().padStart(2, "0")} ${period}`;
}
function fmtDate(d, opts) { return d.toLocaleDateString("en-GB", opts); }

function printStandaloneTicket(b, settings = DEFAULT_SETTINGS) {
  const tw = window.open("", "_blank", "width=420,height=600");
  if (!tw) { alert("Popup blocked! Browser settings check karein."); return; }
  const tok = b.token || ("NS-" + (b.id ? b.id.slice(-6).toUpperCase() : "100000"));
  const svcHtml = `<div style="display:flex;justify-content:space-between;font-size:12px;margin:4px 0"><span>* ${b.styleName||"Grooming"}</span><span>Rs ${b.totalPrice||""}</span></div>`;
  const html = [
    "<!DOCTYPE html><html><head><meta charset='utf-8'/>",
    "<title>NASH STUDIO Ticket #" + tok + "</title>",
    "<style>*{box-sizing:border-box}body{font-family:'Courier New',monospace;width:320px;margin:15px auto;padding:18px;border:2px solid #1c1712;background:#fff;color:#1c1712}",
    ".tc{text-align:center}.brand{font-size:20px;font-weight:bold;letter-spacing:2px}.sub{font-size:10px;color:#555;margin-top:2px}",
    ".div{border-top:1px dashed #1c1712;margin:12px 0}.tbox{border:2px dashed #9c6b2e;background:#faf7f0;padding:10px;margin:10px 0;text-align:center}",
    ".tnum{font-size:24px;font-weight:bold;letter-spacing:3px;color:#7a5222;margin:4px 0}.st{font-size:11px;font-weight:bold;color:#2e7d32}",
    ".row{display:flex;justify-content:space-between;font-size:12px;margin:5px 0}.fn{font-size:10px;text-align:center;margin-top:15px;color:#555}",
    "@media print{body{border:none;margin:0 auto;width:100%}}</style></head><body>",
    "<div class='tc brand'>" + (settings.studioName || "NASH STUDIO") + "</div>",
    "<div class='tc sub'>BEARD &amp; HAIR STUDIO<br/>" + (settings.address || "Shop 12, Main Blvd, Gulberg, Lahore") + "</div>",
    "<div class='div'></div>",
    "<div class='tbox'><div style='font-size:10px;letter-spacing:1px;color:#555'>OFFICIAL BOOKING TOKEN PASS</div>",
    "<div class='tnum'>" + tok + "</div><div class='st'>RESERVED &amp; CONFIRMED</div></div>",
    "<div class='div'></div>",
    "<div class='row'><span><b>Customer:</b></span><span>" + b.name + "</span></div>",
    "<div class='row'><span><b>Mobile:</b></span><span>" + b.phone + "</span></div>",
    "<div class='row'><span><b>Date:</b></span><span>" + b.dateLabel + "</span></div>",
    "<div class='row'><span><b>Time:</b></span><span style='color:#7a5222;font-weight:bold'>" + b.timeLabel + "</span></div>",
    "<div class='row'><span><b>Tier:</b></span><span>" + (b.tier==="premium"?"Premium (60m)":"Standard (30m)") + "</span></div>",
    "<div class='div'></div>",
    "<div style='font-size:12px;font-weight:bold;margin-bottom:6px'>Services:</div>" + svcHtml,
    "<div class='div'></div>",
    "<div class='row'><span><b>Total Duration:</b></span><span>" + b.totalMinutes + " Mins</span></div>",
    "<div class='row'><span><b>Service Price:</b></span><span>Rs " + (b.totalPrice||0) + "</span></div>",
    "<div class='row' style='color:#2e7d32;font-weight:bold'><span><b>Booking Fee Paid:</b></span><span>Rs " + (b.bookingFee||50) + (b.txnId ? " (UTR: " + b.txnId + ")" : "") + "</span></div>",
    "<div class='row' style='font-size:14px;border-top:1px dashed #1c1712;padding-top:6px'><span><b>Remaining Due at Salon:</b></span><span style='color:#7a5222;font-weight:bold'>Rs " + (b.remainingDue !== undefined ? b.remainingDue : Math.max(0, (b.totalPrice||0) - (b.bookingFee||50))) + "</span></div>",
    "<div class='div'></div>",
    "<div class='fn'>Aapka slot reserve ho chuka hai.<br/>5 minute pehle tashreef layein.<br/><strong>Thank you for choosing " + (settings.studioName || "Nash Studio") + "!</strong></div>",
    "<script>window.onload=function(){window.print();}<\/script>",
    "</body></html>"
  ].join("");
  tw.document.write(html);
  tw.document.close();
}

export default function App() {
  const [hairstyles, setHairstyles] = useState(DEFAULT_HAIRSTYLES);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [user, setUser] = useState(null);
  const [customCss, setCustomCss] = useState("");

  useEffect(() => {
    const unsubH = subscribeToHairstyles((list) => {
      if (Array.isArray(list) && list.length > 0) setHairstyles(list);
    }, DEFAULT_HAIRSTYLES);

    const unsubS = subscribeToSiteSettings((s) => {
      if (s && typeof s === "object") setSettings(prev => ({ ...prev, ...s }));
    }, DEFAULT_SETTINGS);

    const unsubAuth = subscribeToAuth((u) => {
      setUser(u);
    });

    // Subscribe to live custom CSS from Firebase
    const unsubCSS = subscribeToCustomCSS((css) => {
      setCustomCss(css || "");
    });

    return () => {
      if (typeof unsubH === "function") unsubH();
      if (typeof unsubS === "function") unsubS();
      if (typeof unsubAuth === "function") unsubAuth();
      if (typeof unsubCSS === "function") unsubCSS();
    };
  }, []);

  // Inject custom CSS into the document <head> whenever it changes
  useEffect(() => {
    let styleEl = document.getElementById("nash-custom-css-inject");
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "nash-custom-css-inject";
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = customCss;
  }, [customCss]);

  return <SiteView hairstyles={hairstyles} settings={settings} user={user} setUser={setUser} />;
}

function Reveal({ children, delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(28px)",
      transition: `opacity 0.65s cubic-bezier(.4,0,.2,1) ${delay}ms, transform 0.65s cubic-bezier(.4,0,.2,1) ${delay}ms`,
    }}>{children}</div>
  );
}

function SiteView({ hairstyles, settings, user, setUser }) {
  const [step, setStep] = useState(1);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [searchQ, setSearchQ] = useState("");
  const [filterT, setFilterT] = useState("all");
  const [expandedGallery, setExpandedGallery] = useState(false);
  const [dateIndex, setDateIndex] = useState(0);
  const [slot, setSlot] = useState(null);
  const [name, setName] = useState(user ? (user.displayName || user.name) : "");
  const [phone, setPhone] = useState(user?.phoneNumber || user?.phone || "");
  const [done, setDone] = useState(null);
  const [saving, setSaving] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [domainNotice, setDomainNotice] = useState(null);
  const [toast, setToast] = useState(null);
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState('terms');

  const openLegalModal = (tab = 'terms') => {
    setLegalTab(tab);
    setLegalModalOpen(true);
  };

  function showToast(msg, type = "success") {
    setToast({ msg, type, id: Date.now() });
    setTimeout(() => setToast(null), 3500);
  }

  // 1. Listen for ChuruOne SSO Return Parameters & postMessage
  useEffect(() => {
    // Check URL parameters from ChuruOne SSO redirect
    const params = new URLSearchParams(window.location.search);
    const ssoUserRaw = params.get('churuone_user');
    const ssoToken = params.get('churuone_token');
    if (ssoUserRaw) {
      try {
        const parsed = JSON.parse(decodeURIComponent(ssoUserRaw));
        setUser(parsed);
        if (parsed.displayName || parsed.name) setName(parsed.displayName || parsed.name);
        if (parsed.phoneNumber || parsed.phone) setPhone(parsed.phoneNumber || parsed.phone);
        localStorage.setItem("nash_user", JSON.stringify(parsed));
        if (ssoToken) localStorage.setItem("auth_token", ssoToken);

        // Clean URL parameters without page reload
        params.delete('churuone_user');
        params.delete('churuone_token');
        const cleanUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : '');
        window.history.replaceState({}, document.title, cleanUrl);

        showToast(`Welcome ${parsed.displayName || parsed.name}! ChuruOne ID connected.`, "success");
      } catch (e) {
        console.warn("SSO payload parse warning:", e);
      }
    } else {
      // Check cross-domain SSO cookie or local session
      try {
        const session = getChuruOneSession();
        if (session && session.user) {
          const sUser = session.user;
          setUser(sUser);
          if (sUser.displayName || sUser.name) setName(sUser.displayName || sUser.name);
          if (sUser.phoneNumber || sUser.phone) setPhone(sUser.phoneNumber || sUser.phone);
          if (session.token) localStorage.setItem("auth_token", session.token);
        }
      } catch (e) {}
    }

    // Listen for postMessage from popup SSO window
    const handleAuthMessage = (event) => {
      if (event.data && event.data.type === 'CHURUONE_AUTH_SUCCESS') {
        const { user: ssoUser, token } = event.data;
        if (ssoUser) {
          setUser(ssoUser);
          if (ssoUser.displayName || ssoUser.name) setName(ssoUser.displayName || ssoUser.name);
          if (ssoUser.phoneNumber || ssoUser.phone) setPhone(ssoUser.phoneNumber || ssoUser.phone);
          localStorage.setItem("nash_user", JSON.stringify(ssoUser));
          if (token) localStorage.setItem("auth_token", token);
          showToast(`Welcome ${ssoUser.displayName || ssoUser.name}! ChuruOne ID connected.`, "success");
        }
      }
    };

    window.addEventListener('message', handleAuthMessage);
    return () => window.removeEventListener('message', handleAuthMessage);
  }, []);

  const [realtimeBookings, setRealtimeBookings] = useState([]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackTimeouts, setFeedbackTimeouts] = useState([]);
  const [txnId, setTxnId] = useState("");
  const [isOpeningCashfree, setIsOpeningCashfree] = useState(false);
  const [cashfreePaid, setCashfreePaid] = useState(false);
  const [cashfreeTxnId, setCashfreeTxnId] = useState("");
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("nash_theme") || "dark";
  });
  const bookRef = useRef(null);

  useEffect(() => {
    document.title = "Nash Studio | Men's Grooming Lounge";
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("nash_theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme(prev => prev === "dark" ? "light" : "dark");
  }

  // Review states
  const [reviews, setReviews] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSaving, setReviewSaving] = useState(false);

  // Subscribe to reviews
  useEffect(() => {
    const unsub = subscribeToReviews(setReviews);
    return () => { if (typeof unsub === "function") unsub(); };
  }, []);

  // Auto-fill name and phone if user logs in
  useEffect(() => {
    if (user) {
      if ((user.displayName || user.name) && !name) {
        setName(user.displayName || user.name);
      }
      if ((user.phoneNumber || user.phone) && !phone) {
        setPhone(user.phoneNumber || user.phone);
      }
    }
  }, [user]);

  // Restore pending booking state if returning from SSO
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("nash_pending_booking");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.styleId && Array.isArray(hairstyles)) {
          const found = hairstyles.find(h => h.id === parsed.styleId);
          if (found) {
            setSelectedStyle(found);
            if (typeof parsed.dateIndex === "number") setDateIndex(parsed.dateIndex);
            if (parsed.slot) setSlot(parsed.slot);
            if (parsed.txnId) setTxnId(parsed.txnId);
            if (parsed.step) setStep(parsed.step);
          }
        }
      }
    } catch (e) {
      console.warn("Could not restore pending booking:", e);
    }
  }, [hairstyles]);

  function handleChuruOneSSO() {
    try {
      sessionStorage.setItem("nash_pending_booking", JSON.stringify({
        step: 3,
        styleId: selectedStyle?.id,
        dateIndex,
        slot,
        txnId
      }));
    } catch (e) {}
    const isLocal = window.location.hostname === 'localhost';
    const base = isLocal ? '' : 'https://churuone.in';
    const returnUrl = window.location.href;
    const ssoUrl = `${base}/auth?storeId=nash-studio&returnUrl=${encodeURIComponent(returnUrl)}`;
    window.location.href = ssoUrl;
  }

  async function handleGoogleAuth() {
    // Direct redirect to ChuruOne Universal Single Sign-On Portal
    handleChuruOneSSO();
  }

  async function handleLogout() {
    await logoutUser();
    setUser(null);
    setShowUserMenu(false);
  }

  const dates = Array.from({ length: 10 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i); return d;
  });
  const selectedDateISO = dates[dateIndex] ? dates[dateIndex].toISOString().slice(0, 10) : "";

  useEffect(() => {
    if (!selectedDateISO) return;
    const unsub = subscribeToBookingsForDate(selectedDateISO, setRealtimeBookings);
    return () => { if (typeof unsub === "function") unsub(); };
  }, [selectedDateISO]);

  const workMinutes = selectedStyle ? selectedStyle.time : 0;
  const totalMinutes = workMinutes > 0 ? workMinutes + BUFFER : 0;
  const totalPrice = selectedStyle ? selectedStyle.price : 0;
  const tier = selectedStyle ? selectedStyle.type : "standard";

  const bookingFee = 50; // Fixed ₹50 Token Advance Payment
  const remainingDue = Math.max(0, totalPrice - bookingFee);

  function scrollToBook() { bookRef.current?.scrollIntoView({ behavior: "smooth" }); }
  function goStep(n) { setStep(n); setTimeout(() => bookRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50); }

  async function handlePayWithCashfree() {
    if (!name.trim()) {
      alert("Kripya pehle apna naam darj karein.");
      return;
    }
    const contactPhone = (phone || user?.phoneNumber || user?.phone || "").trim();
    const cleanDigits = contactPhone.replace(/\D/g, '').slice(-10);
    if (!contactPhone || cleanDigits.length < 10) {
      alert("Kripya apna 10-digit mobile number zaroor darj karein.");
      return;
    }
    if (!slot) {
      alert("Slot select karein.");
      return;
    }

    setIsOpeningCashfree(true);
    try {
      const orderId = "NS_APPT_" + Date.now();
      const res = await smartFetch('/api/create-order', {
        method: 'POST',
        body: JSON.stringify({
          amount: 50,
          customerPhone: cleanDigits || '7023963189',
          customerName: name.trim() || 'Client',
          orderId: orderId,
        })
      });

      if (!res.paymentSessionId) {
        throw new Error(res.error || res.details?.message || "Cashfree payment session generate nahi ho saka.");
      }

      const { load } = await import('@cashfreepayments/cashfree-js');
      const cashfree = await load({ mode: 'sandbox' });
      if (!cashfree) throw new Error("Cashfree SDK load nahi ho saka.");

      await cashfree.checkout({
        paymentSessionId: res.paymentSessionId,
        redirectTarget: '_modal',
      });

      // Verify payment after modal closes
      try {
        const verifyRes = await smartFetch(`/api/payment/cashfree/verify/${res.orderId}`);
        if (verifyRes.isPaid || verifyRes.status === 'PAID') {
          const verifiedId = verifyRes.paymentId || res.orderId;
          setCashfreePaid(true);
          setCashfreeTxnId(verifiedId);
          setTxnId(verifiedId);
          await confirmBooking(verifiedId);
        }
      } catch (ve) {
        console.warn("Cashfree verification warning:", ve);
      }
    } catch (err) {
      console.error("Cashfree booking error:", err);
      alert("Cashfree Gateway Error: " + (err.message || "Failed to open gateway"));
    } finally {
      setIsOpeningCashfree(false);
    }
  }

  async function confirmBooking(verifiedTxnId = null) {
    if (!name.trim()) { 
      alert("Kripya apna naam zaroor darj karein."); 
      return; 
    }
    const contactPhone = (phone || user?.phoneNumber || user?.phone || "").trim();
    const cleanDigits = contactPhone.replace(/\D/g, '').slice(-10);
    if (!contactPhone || cleanDigits.length < 10) { 
      alert("Kripya apna 10-digit mobile number zaroor darj karein (Appointment confirmation ke liye zaroori hai)."); 
      return; 
    }
    const contactEmail = (user?.email || "").trim();
    const currentUserObj = user || { uid: 'guest_' + cleanDigits, name: name.trim(), email: contactEmail, phone: contactPhone };
    if (!slot) { alert("Slot select karein."); return; }
    
    const activeTxn = verifiedTxnId || cashfreeTxnId || txnId.trim();
    if (!activeTxn || activeTxn.length < 4) {
      await handlePayWithCashfree();
      return;
    }
    setSaving(true);
    const d = dates[dateIndex];
    const bookingToken = "NS-" + Math.floor(100000 + Math.random() * 900000);
    const activeBookingFee = 50;
    const activeRemainingDue = Math.max(0, totalPrice - 50);
    const activePaymentStatus = "Token Paid (₹50 Advance - Cashfree)";
    const activePaymentMethod = "Cashfree UPI (₹50 Token)";
    const activeTxnId = activeTxn;

    const payload = {
      token: bookingToken,
      name: name.trim(),
      phone: contactPhone || (contactEmail ? contactEmail : "Walk-in"),
      email: contactEmail,
      userEmail: contactEmail,
      userUid: currentUserObj?.uid || currentUserObj?.id || "",
      tier,
      styleName: selectedStyle.name,
      totalPrice,
      bookingFee: activeBookingFee,
      remainingDue: activeRemainingDue,
      paymentMethod: activePaymentMethod,
      paymentStatus: activePaymentStatus,
      txnId: activeTxnId,
      dateISO: d.toISOString().slice(0, 10),
      dateLabel: fmtDate(d, { weekday: "long", day: "numeric", month: "long" }),
      timeLabel: slot.label,
      startMin: slot.startMin,
      workMinutes,
      totalMinutes,
    };
    try {
      const confirmed = await createBookingWithTransaction(payload);
      setDone(confirmed);
      // Schedule reminder notifications
      const bookingStart = new Date(d);
      bookingStart.setHours(Math.floor(slot.startMin / 60), slot.startMin % 60, 0, 0);
      const now = new Date();
      const reminders = [60, 30, 15, 5].map(min => min * 60 * 1000);
      const timeoutIds = [];
      reminders.forEach(offset => {
        const notifyTime = new Date(bookingStart.getTime() - offset);
        const delay = notifyTime - now;
        if (delay > 0) {
          const id = setTimeout(() => {
            const title = "Nash Studio Booking Reminder";
            const body = `Your appointment is in ${offset / 60000} minutes. Please arrive on time.`;
            const link = window.location.href;
            if ("Notification" in window) {
              if (Notification.permission === "granted") {
                const n = new Notification(title, { body, data: { url: link } });
                n.onclick = () => { window.open(link, "_blank"); };
              } else if (Notification.permission !== "denied") {
                Notification.requestPermission().then(p => {
                  if (p === "granted") {
                    const n = new Notification(title, { body, data: { url: link } });
                    n.onclick = () => { window.open(link, "_blank"); };
                  } else { alert(body); }
                });
              } else { alert(body); }
            } else { alert(body); }
          }, delay);
          timeoutIds.push(id);
        }
      });
      setFeedbackTimeouts(timeoutIds);
      setShowFeedback(true);
    } catch (e) {
      if (e.message === "SLOT_ALREADY_TAKEN") { alert("Ye slot book ho chuka hai. Koi dusra chunein."); setSlot(null); setStep(3); }
      else alert("Error: " + (e.message || "Unknown"));
    } finally { setSaving(false); }
  }

  function resetBooking() { setStep(1); setSelectedStyle(null); setDateIndex(0); setSlot(null); setName(""); setPhone(""); setTxnId(""); setDone(null); }

  async function handleSubmitReview() {
    if (reviewRating === 0) { alert("Please select a star rating."); return; }
    if (!reviewName.trim()) { alert("Apna naam likhein."); return; }
    setReviewSaving(true);
    try {
      await saveReview({
        name: reviewName.trim(),
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      setReviewName("");
      setReviewRating(0);
      setReviewComment("");
      setShowReviewForm(false);
    } catch (e) {
      alert("Review save nahi ho saka. Dubara try karein.");
    } finally {
      setReviewSaving(false);
    }
  }

  const getWaLink = (b) => {
    const msg = `*${(settings.studioName||"NASH STUDIO").toUpperCase()} - BOOKING PASS*\nToken: ${b.token||b.id}\nCustomer: ${b.name}\nDate: ${b.dateLabel}\nTime: ${b.timeLabel}\nStyle: ${b.styleName}\nTotal: Rs ${b.totalPrice}`;
    return `https://wa.me/${settings.shopWhatsapp || "917023963189"}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div style={S.body}>
      <style>{GLOBAL_CSS}</style>
      
      {/* ─── High-Fashion Sticky Navigation Bar ────────────────── */}
      <nav style={S.navStickyHeader}>
        <div style={S.wrapNav}>
          {/* User Sign In / Profile */}
          <div 
            style={S.navIconBtn} 
            onClick={user ? undefined : handleGoogleAuth} 
            title={user ? (user.displayName || user.name) : "Sign In with ChuruOne ID"}
          >
            {user ? (
              <div style={{display:"flex", alignItems:"center", gap:8}}>
                <img 
                  src={user.photoURL || user.picture || "/images/hero_fallback.jpg"} 
                  alt="" 
                  style={{width:24, height:24, borderRadius:"50%", border:"1px solid rgba(255,255,255,0.2)"}} 
                />
                <span style={{fontSize:11, fontWeight:600, color:"var(--paper)", display:"none", textTransform:"uppercase", letterSpacing:"0.1em"}} className="nash-user-name">
                  {(user.displayName || user.name || "User").split(" ")[0]}
                </span>
              </div>
            ) : (
              <div style={{display:"flex", alignItems:"center", gap:6}}>
                <MinimalUserIcon />
                <span style={{fontSize:10, fontWeight:700, letterSpacing:"0.15em", textTransform:"uppercase", color:"var(--paper)"}}>ID</span>
              </div>
            )}
          </div>

          {/* Centered Brand Mark */}
          <div style={S.navBrandText} onClick={() => window.scrollTo({top:0, behavior:"smooth"})}>
            <span>{settings.studioName || "NASH STUDIO"}</span>
          </div>

          {/* Right Actions: Theme Toggle & Book Button */}
          <div style={{display:"flex", alignItems:"center", gap:12}}>
            <button 
              onClick={toggleTheme} 
              style={S.themeToggleBtn}
              title={theme === "dark" ? "Switch to Day Mode" : "Switch to Night Mode"}
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? <Sun size={15} strokeWidth={2} /> : <Moon size={15} strokeWidth={2} />}
            </button>

            <button 
              onClick={scrollToBook} 
              style={S.navBookBtn}
              title="Reserve Appointment"
            >
              <Scissors size={14} strokeWidth={2} />
              <span>BOOK</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ─── Video Hero Section (Strictly Preserving Video Player) ─── */}
      <section style={S.heroContainer}>
        {/* MANDATORY VIDEO ELEMENT - PRESERVED EXACTLY */}
        <video 
          src={settings.heroVideoUrl || "/video/hero.mp4"} 
          style={S.heroVideo} 
          autoPlay 
          loop 
          muted 
          playsInline 
          onError={(e) => { 
            e.target.style.display='none'; 
            const img = document.createElement('img'); 
            img.src='/images/hero_fallback.jpg'; 
            Object.assign(img.style, {position:'absolute',inset:'0',width:'100%',height:'100%',objectFit:'cover',opacity:'1'}); 
            e.target.parentNode.insertBefore(img, e.target); 
          }} 
        />
        
        {/* Cinematic Vignette & Ambient Radial Overlays */}
        <div style={S.heroOverlay} />

        {/* Hero Content Stack */}
        <div style={S.heroContent}>
          <div style={S.heroPill}>
            <span style={S.heroPing}></span>
            <span style={S.heroPillText}>VIP GROOMING LOUNGE • CHURU</span>
          </div>

          <h1 style={S.heroStudioTitle}>
            {settings.studioName || "Nash Studio"}
          </h1>

          <p style={S.heroTaglineText}>
            {settings.heroTagline || "PRECISION GROOMING. ZERO WAIT TIME."}
          </p>

          <div style={S.heroActionRow}>
            <button onClick={scrollToBook} style={S.heroPrimaryBtn}>
              <span>EXPLORE STYLES & BOOK</span>
              <ArrowUpRight size={15} strokeWidth={2} />
            </button>
          </div>

          <div style={S.heroMetaStrip}>
            <span style={S.heroMetaItem}>
              <Clock size={12} strokeWidth={1.5} />
              <span>{settings.monSatHours || "11:00 AM - 11:00 PM"}</span>
            </span>
            <span style={S.heroMetaDivider}>•</span>
            <span style={S.heroMetaItem}>
              <ShieldCheck size={12} strokeWidth={1.5} />
              <span>₹50 Token Slot Lock</span>
            </span>
            <span style={S.heroMetaDivider}>•</span>
            <span style={S.heroMetaItem}>
              <MapPin size={12} strokeWidth={1.5} />
              <span>Main Market, Churu</span>
            </span>
          </div>
        </div>
      </section>

      {/* SMART MODULAR WIRE: PROMOTIONAL HERO BANNER (TOGGLED FROM DUKANDAR OS) */}
      {settings.showHeroBanner && (
        <section className="nash-promotional-hero-banner" style={{background:"var(--surface)", borderBottom:"1px solid var(--line)", padding:"40px 20px", textAlign:"center"}}>
          <div style={{maxWidth:800, margin:"0 auto"}}>
            <span style={{fontSize:11, fontWeight:700, letterSpacing:"0.15em", textTransform:"uppercase", color:"#d4af37", background:"rgba(212,175,55,0.1)", padding:"4px 12px", borderRadius:20}}>
              {settings.heroTagline || "EXCLUSIVE SALON PROMOTION"}
            </span>
            <h2 style={{fontFamily:"var(--display)", fontSize:"clamp(24px, 4vw, 36px)", fontWeight:800, color:"var(--paper)", marginTop:12, textTransform:"uppercase"}}>
              {settings.studioName || "NASH STUDIO"}
            </h2>
            <p style={{color:"var(--muted)", fontSize:14, maxWidth:500, margin:"10px auto 20px", lineHeight:1.6}}>
              {settings.aboutText || "Precision haircuts, skin fades, and luxury grooming crafted for gentlemen."}
            </p>
            {settings.heroButtonText && (
              <button onClick={scrollToBook} style={{background:"var(--paper)", color:"var(--ink)", border:"none", padding:"12px 28px", borderRadius:4, fontWeight:700, fontSize:12, letterSpacing:"0.1em", cursor:"pointer", textTransform:"uppercase"}}>
                {settings.heroButtonText}
              </button>
            )}
          </div>
        </section>
      )}

      {/* SMART MODULAR WIRE: SPECIAL OFFER CARDS (TOGGLED FROM DUKANDAR OS) */}
      {settings.showOfferCards && (
        <section className="nash-promotional-offers" style={{background:"var(--ink)", borderBottom:"1px solid var(--line)", padding:"30px 20px"}}>
          <div style={{maxWidth:1100, margin:"0 auto"}}>
            <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16}}>
              <span style={{fontSize:12, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--paper)", display:"inline-flex", alignItems:"center", gap:6}}>
                <Sparkles size={14} color="#d4af37" />
                <span>SPECIAL SALON PACKAGES & DEALS</span>
              </span>
              <span style={{fontSize:11, color:"#d4af37", fontWeight:600}}>Limited Slots</span>
            </div>
            <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))", gap:16}}>
              <div style={{background:"var(--surface)", border:"1px solid var(--line)", borderRadius:8, padding:20}}>
                <span style={{fontSize:10, fontWeight:700, background:"rgba(212,175,55,0.15)", color:"#d4af37", padding:"3px 8px", borderRadius:4}}>COMBO OFFER</span>
                <h3 style={{fontSize:16, fontWeight:700, color:"var(--paper)", margin:"8px 0 4px"}}>Royal Grooming Combo</h3>
                <p style={{fontSize:12, color:"var(--muted)", margin:0}}>Haircut + Hot Towel Razor Shave + Beard Blend</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── HAIRSTYLE SELECTION & BOOKING SECTION ────────────────── */}
      <section id="book" ref={bookRef} style={{...S.section, borderBottom:"1px solid var(--line)"}}>
        <div style={S.wrap}>
          
          {done ? (
            /* ─── LUXURY VIP BOARDING PASS CONFIRMATION CARD ────────── */
            <div style={S.bookPanel}>
              <div style={S.bookBody}>
                <div style={S.tokenPassCard} className="nash-pass-reveal">
                  
                  {/* Pass Top Branding */}
                  <div style={S.passHeader}>
                    <div>
                      <div style={S.passBrand}>{settings.studioName || "NASH STUDIO"}</div>
                      <div style={S.passSub}>EXCLUSIVE APPOINTMENT TOKEN</div>
                    </div>
                    <div style={S.passBadge}>CONFIRMED ✓</div>
                  </div>

                  {/* Perforated Divider */}
                  <div style={S.ticketPerforation}></div>

                  {/* Main Token Display Box */}
                  <div style={S.tokenBox}>
                    <span style={S.tokenLabel}>OFFICIAL ENTRY TOKEN</span>
                    <strong style={S.tokenVal}>
                      {done.token || ("NS-" + (done.id ? done.id.slice(-6).toUpperCase() : "100000"))}
                    </strong>
                    <span style={S.tokenNote}>Show this pass or mention token at the reception desk</span>
                  </div>

                  {/* Detailed Specs Table */}
                  <div style={S.confirmDetail}>
                    {[
                      ["Customer", done.name],
                      ["Mobile", done.phone],
                      ["Date", done.dateLabel],
                      ["Time Slot", done.timeLabel],
                      ["Chosen Style", done.styleName],
                      ["Session Tier", done.tier === "premium" ? "Premium (60 min)" : "Standard (30 min)"],
                      ["Total Value", `Rs ${done.totalPrice || 0}`],
                      ...(ENABLE_ONLINE_PAYMENT ? [
                        ["Advance Paid", `Rs ${done.bookingFee || 50} (Ref: ${done.txnId || "Verified"})`],
                        ["Remaining Due at Salon", `Rs ${done.remainingDue !== undefined ? done.remainingDue : Math.max(0, (done.totalPrice||0) - (done.bookingFee||50))}`]
                      ] : [
                        ["Payment Method", "Pay in Person at Salon"]
                      ])
                    ].map(([k, v]) => {
                      const isPaid = k.includes("Paid");
                      const isDue = k.includes("Remaining");
                      return (
                        <div key={k} style={{
                          ...S.cdRow,
                          ...(isDue ? {borderTop:"1px dashed var(--line)", marginTop:6, paddingTop:8} : {})
                        }}>
                          <span>{k}</span>
                          <b style={{
                            color: isPaid ? "#10b981" : isDue ? "#d4af37" : "var(--paper)",
                            fontWeight: isDue || isPaid ? 700 : 500,
                            fontSize: isDue ? 14 : 13
                          }}>{v}</b>
                        </div>
                      );
                    })}
                  </div>

                  {/* Ticket Action Buttons */}
                  <div style={S.passActions}>
                    <a href={getWaLink(done)} target="_blank" rel="noopener noreferrer" style={S.btnWhatsApp}>
                      <Share2 size={16} />
                      <span>SHARE PASS ON WHATSAPP</span>
                    </a>
                    
                    <div style={{display:"flex", gap:10}}>
                      <button style={{...S.btnPrint, flex:1}} onClick={() => printStandaloneTicket(done, settings)}>
                        <Printer size={15} />
                        <span>PRINT TICKET</span>
                      </button>
                      <button style={{...S.btnGhostBtn, flex:1}} onClick={resetBooking}>
                        <span>+ NEW BOOKING</span>
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          ) : step === 1 ? (
            /* ─── STEP 1: EDITORIAL HAIRSTYLE GALLERY ───────────────── */
            <div className="nash-expand-anim">
              
              {/* Section Header */}
              <div style={{marginBottom:36}}>
                <span style={S.eyebrow}>
                  01 / CURATED GROOMING CATALOGUE
                </span>
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-end", flexWrap:"wrap", gap:12}}>
                  <h2 style={S.sectionH2}>Hairstyles & Cuts</h2>
                  <span style={{fontSize:12, color:"var(--muted)", fontVariantNumeric:"tabular-nums"}}>
                    {hairstyles.length} Handcrafted Designs Available
                  </span>
                </div>
              </div>

              {/* Category Switcher & Search Bar */}
              <div style={S.filterBar}>
                <div style={S.filterPillGroup}>
                  {[
                    {key:"all",label:"All Styles"},
                    {key:"premium",label:"Premium (60m)"},
                    {key:"standard",label:"Standard (30m)"},
                  ].map(tab => {
                    const isSel = filterT === tab.key;
                    return (
                      <button key={tab.key}
                        onClick={() => setFilterT(tab.key)}
                        style={{
                          background: isSel ? "var(--paper)" : "transparent",
                          color: isSel ? "var(--ink)" : "var(--muted)",
                          border: "none",
                          padding: "8px 18px",
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: isSel ? 700 : 500,
                          letterSpacing: "0.1em",
                          cursor: "pointer",
                          transition: "all 0.3s cubic-bezier(.16,1,.3,1)",
                          textTransform: "uppercase",
                        }}>
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                <div style={S.searchWrapper}>
                  <input
                    type="text"
                    placeholder="Search cut, fade or quiff..."
                    value={searchQ}
                    onChange={e => setSearchQ(e.target.value)}
                    style={S.searchInput}
                  />
                  {searchQ && (
                    <button 
                      onClick={() => setSearchQ("")} 
                      style={S.searchClearBtn}
                      title="Clear Search"
                    >
                      <X size={14} strokeWidth={2} />
                    </button>
                  )}
                </div>
              </div>

              {/* Hairstyle Cards Grid */}
              {(() => {
                const filtered = hairstyles.filter(h => {
                  const matchCat = filterT === "all" || h.type === filterT;
                  const matchSearch = !searchQ.trim() || h.name.toLowerCase().includes(searchQ.toLowerCase()) || (h.desc && h.desc.toLowerCase().includes(searchQ.toLowerCase()));
                  return matchCat && matchSearch;
                });

                const isSearching = searchQ.trim().length > 0;
                const itemsToDisplay = (expandedGallery || isSearching || filterT !== "all") ? filtered : filtered.slice(0, 6);

                if (filtered.length === 0) {
                  return (
                    <div style={{textAlign:"center",padding:"60px 20px",color:"var(--muted)", background:"var(--surface)", border:"1px solid var(--line)", borderRadius:12}}>
                      <Scissors size={28} style={{margin:"0 auto 12px", color:"var(--muted)"}} />
                      <p style={{fontSize:14, fontWeight:600}}>No hairstyles found matching "{searchQ}"</p>
                      <button onClick={() => { setSearchQ(""); setFilterT("all"); }} style={{marginTop:16,...S.btnGhostBtn}}>View All Styles</button>
                    </div>
                  );
                }

                return (
                  <>
                    <div style={S.hsGrid}>
                      {itemsToDisplay.map(h => {
                        const isPrem = h.type === "premium";
                        return (
                          <div 
                            key={h.id}
                            className="nash-hs-hover"
                            onClick={() => { setSelectedStyle(h); goStep(2); }}
                            style={S.hsCard}
                          >
                            <div style={S.hsImgViewport}>
                              <img src={h.img} alt={h.name} style={S.hsImg} />
                              
                              {/* Tier Badge */}
                              <div style={S.hsBadgeOverlay}>
                                <span style={{
                                  background: isPrem ? "rgba(0,0,0,0.85)" : "rgba(255,255,255,0.9)",
                                  color: isPrem ? "#d4af37" : "#0A0F1A",
                                  fontSize: 9,
                                  fontWeight: 800,
                                  padding: "4px 10px",
                                  borderRadius: 4,
                                  letterSpacing: "0.15em",
                                  textTransform: "uppercase",
                                  backdropFilter: "blur(8px)",
                                  border: isPrem ? "1px solid rgba(212,175,55,0.3)" : "1px solid rgba(0,0,0,0.1)"
                                }}>
                                  {isPrem ? "PREMIUM • 60M" : "STANDARD • 30M"}
                                </span>
                              </div>
                            </div>

                            {/* Card Body */}
                            <div style={S.hsCardBody}>
                              <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8}}>
                                <h3 style={S.hsCardTitle}>{h.name}</h3>
                                <div style={S.hsCardPrice}>Rs {Number(h.price||0).toLocaleString()}</div>
                              </div>
                              <p style={S.hsCardDesc}>{h.desc}</p>
                            </div>

                            {/* Action Strip */}
                            <div style={S.hsCardStrip}>
                              <span style={S.hsCardSessionLabel}>
                                {h.time} min bespoke session
                              </span>
                              <div style={S.hsCardCtaPill}>
                                <span>SELECT</span>
                                <ChevronRight size={13} strokeWidth={2.5} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* View All Toggle */}
                    {filtered.length > 6 && !expandedGallery && !isSearching && filterT === "all" && (
                      <div style={{textAlign:"center", marginTop:40}}>
                        <button
                          onClick={() => setExpandedGallery(true)}
                          style={S.btnExpandAll}
                          className="nash-btn-confirm"
                        >
                          SHOW ALL {filtered.length} STYLES
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          ) : (
            /* ─── STEP 2 & 3: INTERACTIVE BOOKING STEPPER ───────────── */
            <div style={S.bookPanel}>
              
              {/* Stepper Header Strip */}
              <div style={S.stepperNavStrip}>
                <div style={{display:"flex", alignItems:"center", gap:14}}>
                  {selectedStyle?.img && (
                    <img 
                      src={selectedStyle.img} 
                      alt={selectedStyle.name} 
                      style={{width:44, height:44, objectFit:"cover", borderRadius:8, border:"1px solid var(--line)"}} 
                    />
                  )}
                  <div>
                    <div style={{fontSize:15, fontWeight:800, color:"var(--paper)", letterSpacing:"0.04em", textTransform:"uppercase"}}>
                      {selectedStyle?.name}
                    </div>
                    <div style={{fontSize:11, color:"var(--muted)", marginTop:2}}>
                      Rs {selectedStyle?.price} • {selectedStyle?.time} mins craftsmanship
                    </div>
                  </div>
                </div>

                {/* Step indicator pills */}
                <div style={{display:"flex", alignItems:"center", gap:8}}>
                  <div style={step === 2 ? S.stepPillActive : S.stepPillDone} onClick={() => goStep(2)}>
                    <span>1. DATE & TIME</span>
                  </div>
                  <ChevronRight size={12} color="var(--muted)" />
                  <div style={step === 3 ? S.stepPillActive : S.stepPillInactive}>
                    <span>2. CONFIRM & TOKEN</span>
                  </div>
                  <button 
                    onClick={() => goStep(1)} 
                    style={S.changeStyleBtn}
                    title="Change hairstyle"
                  >
                    <ArrowLeft size={13} strokeWidth={2} />
                    <span>CHANGE STYLE</span>
                  </button>
                </div>
              </div>

              {/* Stepper Body */}
              <div style={S.bookBody}>
                {step === 2 && (
                  <TimeStep 
                    dates={dates} 
                    dateIndex={dateIndex} 
                    setDateIndex={setDateIndex} 
                    totalMinutes={totalMinutes} 
                    slot={slot} 
                    setSlot={setSlot} 
                    realtimeBookings={realtimeBookings} 
                    onNext={() => goStep(3)} 
                  />
                )}

                {step === 3 && (
                  <div className="nash-expand-anim">
                    
                    {/* Booking Breakdown Table */}
                    <div style={S.summaryBox}>
                      <div style={{fontSize:11, fontWeight:700, letterSpacing:"0.15em", textTransform:"uppercase", color:"var(--muted)", marginBottom:14}}>
                        APPOINTMENT SUMMARY
                      </div>
                      {[
                        ["Hairstyle", selectedStyle?.name],
                        ["Service Tier", selectedStyle?.type === "premium" ? "Premium (60m)" : "Standard (30m)"],
                        ["Date", fmtDate(dates[dateIndex], {weekday:"short",day:"numeric",month:"short"})],
                        ["Reserved Slot", slot ? slot.label : "--"],
                        ["Estimated Time", `${totalMinutes} min session`],
                        ...(ENABLE_ONLINE_PAYMENT ? [
                          ["Service Total Price", `Rs ${totalPrice}`],
                          ["Fixed Token Advance (Pay Now)", `Rs ${bookingFee}`],
                          ["Remaining Due at Salon", `Rs ${remainingDue}`]
                        ] : [
                          ["Total Price (Pay at Salon)", `Rs ${totalPrice}`]
                        ])
                      ].map(([k,v]) => {
                        const isPayNow = k.includes("Advance") || k.includes("Pay Now");
                        const isRemain = k.includes("Remaining");
                        return (
                          <div key={k} style={{
                            ...S.summaryRow,
                            ...(isPayNow ? {color:"var(--paper)", fontWeight:700, borderTop:"1px solid var(--line)", marginTop:8, paddingTop:10} : {}),
                            ...(isRemain ? {color:"var(--muted)", fontSize:12, paddingBottom:4} : {})
                          }}>
                            <span style={isPayNow ? {color:"var(--paper)", fontWeight:700} : S.srKey}>{k}</span>
                            <span style={{
                              ...S.srVal,
                              ...(isPayNow ? {color:"#10b981", fontWeight:800, fontSize:15} : {}),
                              ...(isRemain ? {color:"var(--muted)"} : {})
                            }}>{v}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Cashfree Payment Gateway Box */}
                    <div style={{
                      background: "linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(12, 18, 32, 0.95) 100%)",
                      border: cashfreePaid ? "1px solid #10b981" : "1px solid rgba(212, 175, 55, 0.35)",
                      borderRadius: 14,
                      padding: "24px 22px",
                      marginBottom: 24,
                      boxShadow: "0 10px 36px rgba(0,0,0,0.5)"
                    }}>
                      <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14}}>
                        <span style={{color: "var(--paper)", fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center", gap: 8}}>
                          <ShieldCheck size={16} color={cashfreePaid ? "#10b981" : "#d4af37"} />
                          <span>Mandatory Token Advance: ₹50 Fixed</span>
                        </span>
                        <span style={{
                          fontSize: 9, 
                          background: cashfreePaid ? "#10b981" : "#d4af37", 
                          color: "#000000", 
                          fontWeight: 900, 
                          padding: "4px 8px", 
                          borderRadius: 4,
                          letterSpacing: "0.15em", 
                          textTransform: "uppercase"
                        }}>
                          {cashfreePaid ? "VERIFIED ✓" : "REQUIRED"}
                        </span>
                      </div>

                      {cashfreePaid ? (
                        <div style={{
                          background: "rgba(16, 185, 129, 0.15)",
                          border: "1px solid rgba(16, 185, 129, 0.4)",
                          borderRadius: 8,
                          padding: "16px",
                          textAlign: "center"
                        }}>
                          <div style={{fontSize: 14, fontWeight: 800, color: "#10b981", marginBottom: 4}}>
                            ✓ ₹50 Token Advance Paid & Verified
                          </div>
                          <div style={{fontSize: 11, color: "var(--paper)", fontFamily: "monospace"}}>
                            Cashfree Txn Ref: #{cashfreeTxnId}
                          </div>
                          <div style={{fontSize: 11, color: "var(--muted)", marginTop: 6}}>
                            Remaining balance ₹{remainingDue} appointment ke baad salon par pay karein.
                          </div>
                        </div>
                      ) : (
                        <>
                          <div style={{
                            background: "rgba(255, 255, 255, 0.03)",
                            border: "1px solid rgba(255, 255, 255, 0.08)",
                            borderRadius: 8,
                            padding: "12px 14px",
                            marginBottom: 16,
                            fontSize: 11,
                            color: "var(--muted)",
                            lineHeight: 1.5
                          }}>
                            💡 <b>Instant Auto-Verification:</b> GPay, PhonePe, Paytm ya UPI se ₹50 advance pay karein. Cashfree popup screen par hi open hoga aur payment hote hi slot turant lock ho jayega.
                          </div>

                          <button
                            type="button"
                            disabled={isOpeningCashfree}
                            onClick={handlePayWithCashfree}
                            style={{
                              width: "100%",
                              padding: "16px",
                              borderRadius: 10,
                              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                              color: "#ffffff",
                              fontWeight: 800,
                              fontSize: 13,
                              letterSpacing: "0.08em",
                              textTransform: "uppercase",
                              border: "none",
                              cursor: isOpeningCashfree ? "wait" : "pointer",
                              boxShadow: "0 6px 20px rgba(16, 185, 129, 0.35)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 8,
                              transition: "all 0.2s ease"
                            }}
                          >
                            {isOpeningCashfree ? "Opening Cashfree Gateway..." : "⚡ Pay ₹50 via Cashfree (UPI / QR / Test)"}
                          </button>

                          <div style={{fontSize: 10, color: "var(--muted)", textAlign: "center", marginTop: 10}}>
                            RBI-Authorized Cashfree Payment Gateway • 100% Secure SSL 256-bit Encrypted
                          </div>
                        </>
                      )}
                    </div>

                    {/* Customer Identity / Authentication */}
                    {!user ? (
                      <div style={{
                        textAlign: "center",
                        padding: "24px 20px",
                        background: "var(--surface)",
                        border: "1px solid var(--line)",
                        borderRadius: 12,
                        marginBottom: 20
                      }} className="nash-expand-anim">
                        <div style={{
                          fontFamily: "var(--display)",
                          fontSize: 14,
                          fontWeight: 700,
                          color: "var(--paper)",
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          marginBottom: 6
                        }}>
                          Sign In with Google / ChuruOne ID
                        </div>
                        <p style={{
                          fontSize: 12,
                          color: "var(--muted)",
                          maxWidth: 380,
                          margin: "0 auto 16px",
                          lineHeight: 1.5
                        }}>
                          Appointment confirm karne aur slot lock karne ke liye Google account se sign in karein.
                        </p>

                        <button
                          type="button"
                          onClick={handleGoogleAuth}
                          disabled={googleLoading}
                          style={{
                            width: "100%",
                            maxWidth: 360,
                            background: "var(--paper)",
                            color: "var(--ink)",
                            fontWeight: 700,
                            padding: "14px 20px",
                            fontSize: 11,
                            border: "1px solid var(--line)",
                            cursor: googleLoading ? "wait" : "pointer",
                            textTransform: "uppercase",
                            letterSpacing: "0.15em",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 12,
                            transition: "all 0.3s",
                            borderRadius: 8
                          }}
                          className="nash-btn-confirm"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"/>
                            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                          </svg>
                          {googleLoading ? "OPENING CHURUONE AUTH..." : "CONTINUE WITH GOOGLE"}
                        </button>
                      </div>
                    ) : (
                      <div className="nash-expand-anim" style={{marginBottom: 20}}>
                        <div style={S.fieldGroup}>
                          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14, padding:"10px 14px", background:"rgba(255,255,255,0.04)", borderRadius:8, border:"1px solid var(--line)"}}>
                            <div style={{display:"flex", alignItems:"center", gap:10}}>
                              <img src={user.photoURL || user.picture || "/images/hero_fallback.jpg"} alt="" style={{width:32, height:32, borderRadius:"50%"}} />
                              <div>
                                <div style={{fontWeight:700, fontSize:12, color:"var(--paper)"}}>{user.displayName || user.name}</div>
                                <div style={{fontSize:10, color:"var(--muted)"}}>{user.email || user.phoneNumber || "ChuruOne Verified"}</div>
                              </div>
                            </div>
                            <span style={{fontSize:10, background:"rgba(52, 168, 83, 0.15)", color:"#34A853", padding:"3px 8px", borderRadius:12, fontWeight:700}}>
                              ✓ LOGGED IN
                            </span>
                          </div>

                          <div style={S.formRow}>
                            <input style={S.input} type="text" placeholder="Full Name *" value={name} onChange={e => setName(e.target.value)} required />
                            <input style={S.input} type="tel" placeholder="10-Digit Mobile Number (Mandatory) *" value={phone} onChange={e => setPhone(e.target.value)} required />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Final Confirmation Button */}
                    <button 
                      style={{
                        ...S.btnConfirm,
                        background: cashfreePaid ? "#10b981" : S.btnConfirm.background,
                        color: cashfreePaid ? "#ffffff" : S.btnConfirm.color,
                        cursor: (saving || isOpeningCashfree) ? "wait" : "pointer"
                      }} 
                      className="nash-btn-confirm" 
                      onClick={cashfreePaid ? () => confirmBooking(cashfreeTxnId) : handlePayWithCashfree} 
                      disabled={saving || isOpeningCashfree}
                    >
                      {saving 
                        ? "CONFIRMING APPOINTMENT..." 
                        : isOpeningCashfree
                        ? "OPENING GATEWAY..."
                        : cashfreePaid
                        ? "CONFIRM APPOINTMENT (₹50 TOKEN VERIFIED) ✓"
                        : "PAY ₹50 VIA CASHFREE & CONFIRM APPOINTMENT"}
                    </button>

                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </section>

      {/* ─── STORIES & CLIENT REVIEWS SECTION ─────────────────────── */}
      <section style={{...S.section, borderBottom:"1px solid var(--line)"}}>
        <div style={S.wrap}>
          <Reveal>
            <div style={{marginBottom:40}}>
              <span style={S.eyebrow}>02 / CLIENT TESTIMONIALS</span>
              <h2 style={S.sectionH2}>Client Stories</h2>
            </div>
          </Reveal>

          {/* Existing Stories */}
          {reviews.length > 0 ? (
            <Reveal delay={100}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:20,marginBottom:36}}>
                {reviews.slice(0, 6).map((r, idx) => (
                  <div key={r.id || idx} style={S.reviewCard}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
                      <div style={{fontFamily:"var(--display)",fontSize:15,fontWeight:700,color:"var(--paper)",letterSpacing:"0.04em",textTransform:"uppercase"}}>{r.name}</div>
                      <div style={{display:"flex",gap:3,alignItems:"center"}}>
                        {[1,2,3,4,5].map(s => (
                          <Star 
                            key={s} 
                            size={14} 
                            fill={s <= (r.rating || 0) ? "#E5A93B" : "none"} 
                            color={s <= (r.rating || 0) ? "#E5A93B" : "var(--star-empty, #CBD5E1)"}
                            strokeWidth={1.5}
                          />
                        ))}
                      </div>
                    </div>
                    {r.comment && (
                      <p style={{fontFamily:"var(--body)",fontSize:13,color:"var(--muted)",lineHeight:1.6,margin:0,fontWeight:300}}>"{r.comment}"</p>
                    )}
                  </div>
                ))}
              </div>
            </Reveal>
          ) : null}

          {/* Submit Review CTA */}
          <Reveal delay={200}>
            <div>
              {!showReviewForm ? (
                <button
                  onClick={() => {
                    if (user && user.displayName) setReviewName(user.displayName);
                    setShowReviewForm(true);
                  }}
                  style={S.btnGhostBtn}
                  className="nash-btn-confirm"
                >
                  SHARE YOUR STORY
                </button>
              ) : (
                <div style={S.reviewFormBox} className="nash-expand-anim">
                  {/* Star Rating Inputs */}
                  <div style={{marginBottom:20}}>
                    <div style={{display:"flex",gap:8,alignItems:"center"}}>
                      {[1,2,3,4,5].map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setReviewRating(s)}
                          onMouseEnter={() => setReviewHover(s)}
                          onMouseLeave={() => setReviewHover(0)}
                          style={{background:"transparent",border:"none",padding:0,cursor:"pointer",lineHeight:0}}
                        >
                          <Star 
                            size={24} 
                            fill={s <= (reviewHover || reviewRating) ? "#E5A93B" : "none"} 
                            color={s <= (reviewHover || reviewRating) ? "#E5A93B" : "var(--star-empty, #CBD5E1)"}
                            strokeWidth={1.5}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <input
                    type="text"
                    placeholder="Your Name *"
                    value={reviewName}
                    onChange={e => setReviewName(e.target.value)}
                    style={S.input}
                  />

                  <textarea
                    placeholder="Your styling experience with Nash Studio..."
                    value={reviewComment}
                    onChange={e => setReviewComment(e.target.value)}
                    rows={3}
                    style={{...S.input, resize:"none", marginBottom:20}}
                  />

                  <div style={{display:"flex", gap:10}}>
                    <button
                      onClick={handleSubmitReview}
                      disabled={reviewSaving}
                      style={{...S.btnConfirm, flex:1}}
                    >
                      {reviewSaving ? "SAVING..." : "SUBMIT STORY"}
                    </button>
                    <button
                      onClick={() => { setShowReviewForm(false); setReviewRating(0); setReviewComment(""); setReviewName(""); }}
                      style={{...S.btnGhostBtn, padding:"14px 20px"}}
                    >
                      CANCEL
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Reveal>

        </div>
      </section>

      {/* ─── EDITORIAL LUXURY STUDIO FOOTER ───────────────────────── */}
      <footer style={S.footer}>
        <div style={S.wrap}>
          <div style={S.footerGrid}>
            <div>
              <div style={S.footBrand}>{settings.studioName || "NASH STUDIO"}</div>
              <p style={S.footAddr}>{settings.address || "Main Market, Churu, Rajasthan 331001"}</p>
              <div style={{marginTop:12, fontSize:12, color:"var(--muted)"}}>
                Unified Partner of <strong style={{color:"var(--paper)"}}>ChuruOne Network</strong>
              </div>
            </div>

            <div style={S.footHours}>
              <div><strong style={{color:"var(--paper)"}}>Mon-Sat:</strong> {settings.monSatHours || "11:00 AM to 11:00 PM"}</div>
              <div><strong style={{color:"var(--paper)"}}>Sunday:</strong> {settings.sundayHours || "Closed"}</div>
              <div><strong style={{color:"var(--paper)"}}>Helpline:</strong> {settings.phoneDisplay || "+91 70239 63189"}</div>
            </div>

            <div style={S.footerBottomRow}>
              <div style={{display:"flex", alignItems:"center", gap:16}}>
                <a
                  href="https://churuone.in/admin?storeId=nash-studio"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{...S.footOwnerBtn, textDecoration:"none", display:"inline-flex", alignItems:"center", gap:6}}
                >
                  <span>Dukandar OS Login</span>
                  <ArrowUpRight size={13} strokeWidth={2} />
                </a>

                {/* Day / Night Theme Button */}
                <button
                  onClick={toggleTheme}
                  style={S.footThemeBtn}
                  className="nash-btn-confirm"
                >
                  {theme === "dark" ? (
                    <>
                      <Sun size={13} strokeWidth={2} />
                      <span>Day Mode</span>
                    </>
                  ) : (
                    <>
                      <Moon size={13} strokeWidth={2} />
                      <span>Night Mode</span>
                    </>
                  )}
                </button>
              </div>

              {user && (
                <div style={{fontSize:11, color:"var(--muted)", display:"flex", alignItems:"center", gap:10}}>
                  <span>Logged in as <b>{user.displayName || user.name}</b></span>
                  <span>•</span>
                  <button onClick={handleLogout} style={{background:"transparent", border:"none", color:"var(--muted)", cursor:"pointer", fontSize:11, textDecoration:"underline"}} onMouseEnter={e => e.target.style.color="var(--paper)"} onMouseLeave={e => e.target.style.color="var(--muted)"}>
                    Sign Out
                  </button>
                </div>
              )}
            </div>

            {/* Legal Policies Strip (PhonePe Compliant) */}
            <div style={S.footerLegalStrip}>
              <div style={{display:"flex", alignItems:"center", flexWrap:"wrap", gap:14, fontSize:11, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.1em"}}>
                <button onClick={() => openLegalModal('terms')} style={S.legalLinkBtn}>
                  Terms & Conditions
                </button>
                <span>•</span>
                <button onClick={() => openLegalModal('privacy')} style={S.legalLinkBtn}>
                  Privacy Policy
                </button>
                <span>•</span>
                <button onClick={() => openLegalModal('refund')} style={{...S.legalLinkBtn, fontWeight:700}}>
                  Refund & Cancellation
                </button>
              </div>

              <div style={{fontSize:10, color:"var(--muted)", fontFamily:"var(--body)", letterSpacing:"0.05em"}}>
                No refund on booking cancellation (only ₹50 token money charged to reserve slot)
              </div>
            </div>

            <div style={{fontSize:11, color:"var(--muted)", borderTop:"1px solid var(--line)", paddingTop:16, marginTop:8}}>
              © 2026 Nash Studio. Powered by ChuruOne • A unit of Vasudhaiva Kutumbakam Robotics.
            </div>

          </div>
        </div>
      </footer>

      {/* Floating Sticky Mobile CTA */}
      <div style={S.stickyCta} className="nash-sticky-cta">
        <button style={S.stickyCall} onClick={() => window.location.href=`tel:${(settings.shopWhatsapp||"917023963189").replace(/[^0-9]/g,"")}`}>Call Salon</button>
        <button style={S.stickyBook} onClick={scrollToBook} className="nash-cta-btn">Book Appointment</button>
      </div>

      {/* Floating System Toast */}
      {toast && (
        <div style={{
          position: "fixed",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          background: toast.type === "error" ? "#dc2626" : "#1a1714",
          color: "#ffffff",
          border: "1px solid #d4af37",
          borderRadius: 12,
          padding: "12px 24px",
          fontSize: 12,
          fontWeight: 600,
          zIndex: 999999,
          display: "flex",
          alignItems: "center",
          gap: 10,
          boxShadow: "0 10px 30px rgba(0,0,0,0.6)"
        }}>
          {toast.type === "error" ? <AlertTriangle size={15} color="#ffffff" /> : <Check size={15} color="#34A853" />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Legal Policies Modal */}
      <LegalPoliciesModal
        isOpen={legalModalOpen}
        onClose={() => setLegalModalOpen(false)}
        initialTab={legalTab}
        entity="nash-studio"
      />
    </div>
  );
}

function SectionHead({ eyebrow, title, sub }) {
  return (
    <div style={S.sectionHead}>
      <div style={S.eyebrow}>{eyebrow}</div>
      <h2 style={S.sectionH2}>{title}</h2>
      <p style={S.sectionP}>{sub}</p>
    </div>
  );
}

function TimeStep({ dates, dateIndex, setDateIndex, totalMinutes, slot, setSlot, realtimeBookings, onNext }) {
  const slots = [];
  for (let t = WORK_START; t + totalMinutes <= WORK_END; t += 15) {
    let blocked = false;
    for (const b of realtimeBookings) {
      if (Math.max(b.startMin, t) < Math.min(b.startMin + b.totalMinutes, t + totalMinutes)) { blocked = true; break; }
    }
    slots.push({ t, label: formatTime(Math.floor(t/60), t%60), blocked });
  }
  return (
    <div>
      <div style={S.fieldGroup}>
        <span style={S.fieldLabel}>Select Appointment Date</span>
        <div style={S.dateStrip}>
          {dates.map((d, i) => {
            const isSun = d.getDay() === 0, sel = i === dateIndex;
            return (
              <button key={i} style={{...S.dateChip,...(sel?S.dateChipSelected:{}),...(isSun?S.dateChipDisabled:{})}}
                disabled={isSun} onClick={() => { setDateIndex(i); setSlot(null); }} className="nash-date-chip">
                <span style={S.dow}>{DOW[d.getDay()]}</span>
                <span style={sel ? { ...S.dnum, color: "var(--ink)" } : { ...S.dnum, color: "var(--paper)" }}>{d.getDate()}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div style={S.fieldGroup}>
        <span style={S.fieldLabel}>Select Slot (Every 15 Mins)</span>
        <div style={S.slotGrid}>
          {slots.map((s, i) => (
            <button key={i} disabled={s.blocked}
              style={{...S.slot,...(s.blocked?S.slotTaken:{}),...(slot&&slot.startMin===s.t?S.slotSelected:{})}}
              className={!s.blocked?"nash-slot-hover":""}
              onClick={() => setSlot({label:s.label,startMin:s.t})}>
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <button style={!slot?{...S.btnConfirm,...S.btnDisabled}:S.btnConfirm} className="nash-btn-confirm" disabled={!slot} onClick={onNext}>
        CONTINUE TO TOKEN LOCK
      </button>
    </div>
  );
}

const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;800;900&family=Inter:wght@200;300;400;500;600;700;800;900&display=swap');
:root{
  --ink:#080C14;
  --surface:#0F1626;
  --surface-hover:#151F34;
  --paper:#FFFFFF;
  --muted:#8C9DB5;
  --line:#1E2B42;
  --display:"Cinzel",Georgia,serif;
  --body:"Inter",sans-serif;
  --card-shadow:0 16px 40px rgba(0,0,0,0.5);
  --prem-badge-bg:#000000;
  --prem-badge-color:#d4af37;
  --std-badge-bg:rgba(255, 255, 255, 0.95);
  --std-badge-color:#0A0F1A;
  --nav-bg:rgba(8,12,20,0.85);
  --star-color:#E5A93B;
  --star-empty:#1E2B42;
}

body[data-theme="light"]{
  --ink:#F5F7FA;
  --surface:#FFFFFF;
  --surface-hover:#EDF2F7;
  --paper:#0A0F1A;
  --muted:#5B6B7F;
  --line:#E2E8F0;
  --card-shadow:0 12px 36px rgba(0,0,0,0.06);
  --prem-badge-bg:#0A0F1A;
  --prem-badge-color:#ffffff;
  --std-badge-bg:rgba(255, 255, 255, 0.95);
  --std-badge-color:#0A0F1A;
  --nav-bg:rgba(255,255,255,0.85);
  --star-color:#E5A93B;
  --star-empty:#CBD5E1;
}

body[data-theme="dark"]{
  --ink:#080C14;
  --surface:#0F1626;
  --surface-hover:#151F34;
  --paper:#FFFFFF;
  --muted:#8C9DB5;
  --line:#1E2B42;
  --card-shadow:0 20px 60px rgba(0,0,0,0.7);
  --prem-badge-bg:#000000;
  --prem-badge-color:#d4af37;
  --std-badge-bg:rgba(15, 22, 38, 0.85);
  --std-badge-color:#ffffff;
  --nav-bg:rgba(8,12,20,0.85);
  --star-color:#E5A93B;
  --star-empty:#1E2B42;
}

*{box-sizing:border-box;margin:0;padding:0;}
html{scroll-behavior:smooth;}
body{background:var(--ink);color:var(--paper);font-family:var(--body);-webkit-font-smoothing:antialiased;transition:background 0.35s ease, color 0.35s ease;}
::selection{background:#d4af37;color:#000000;}
::-webkit-scrollbar{width:4px;height:4px;}
::-webkit-scrollbar-track{background:var(--ink);}
::-webkit-scrollbar-thumb{background:var(--line);border-radius:0;}
::-webkit-scrollbar-thumb:hover{background:var(--muted);}

/* Premium Animations */
@keyframes nashReveal{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}
@keyframes nashFadeIn{from{opacity:0;}to{opacity:1;}}
@keyframes nashScaleIn{from{opacity:0;transform:scale(0.97);}to{opacity:1;transform:scale(1);}}
@keyframes nashSpin{to{transform:rotate(360deg);}}
@keyframes pulseGlow{0%,100%{opacity:0.6;}50%{opacity:1;}}

.nash-expand-anim{animation:nashReveal 0.5s cubic-bezier(.16,1,.3,1);}
.nash-pass-reveal{animation:nashScaleIn 0.6s cubic-bezier(.16,1,.3,1);}
.nash-spinner{width:24px;height:24px;border-radius:50%;border:2px solid var(--line);border-top-color:var(--paper);animation:nashSpin 0.6s linear infinite;margin:0 auto;}

/* Card hover - buttery lift */
.nash-hs-hover{cursor:pointer;position:relative;transition:transform 0.5s cubic-bezier(.16,1,.3,1),box-shadow 0.5s cubic-bezier(.16,1,.3,1),border-color 0.4s;}
.nash-hs-hover img{transition:transform 6s cubic-bezier(0.05,1,0.3,1);}
.nash-hs-hover:hover{transform:translateY(-6px);box-shadow:var(--card-shadow);border-color:#d4af37 !important;}
.nash-hs-hover:hover img{transform:scale(1.05);}

/* Button hovers */
.nash-btn-confirm{transition:all 0.4s cubic-bezier(.16,1,.3,1) !important;}
.nash-btn-confirm:not(:disabled):hover{opacity:0.9 !important;transform:translateY(-1px);}
.nash-cta-btn{transition:all 0.4s cubic-bezier(.16,1,.3,1) !important;}
.nash-cta-btn:hover{opacity:0.9 !important;transform:translateY(-1px);}
.nash-date-chip{transition:all 0.3s cubic-bezier(.16,1,.3,1) !important;}
.nash-date-chip:not(:disabled):hover{border-color:var(--paper) !important;}
.nash-slot-hover{transition:all 0.3s cubic-bezier(.16,1,.3,1) !important;}
.nash-slot-hover:hover{border-color:var(--paper) !important;background:var(--surface-hover) !important;}
.nash-btn-ghost-hover{transition:all 0.4s cubic-bezier(.16,1,.3,1);}
.nash-btn-ghost-hover:hover{background:var(--surface-hover) !important;}

@media (min-width: 861px) {
  .nash-sticky-cta {
    display: none !important;
  }
}

@media (max-width: 860px) {
  .nash-sticky-cta {
    display: flex !important;
  }
}
`;

const S = {
  body:{background:"var(--ink)",color:"var(--paper)",fontFamily:"var(--body)",minHeight:"100vh",paddingBottom:76,transition:"background 0.35s ease, color 0.35s ease"},
  wrap:{maxWidth:1120,margin:"0 auto",padding:"0 24px"},
  
  // Sticky Nav
  navStickyHeader:{position:"sticky",top:0,zIndex:100,background:"var(--nav-bg)",backdropFilter:"blur(20px)",borderBottom:"1px solid var(--line)",transition:"all 0.3s"},
  wrapNav:{maxWidth:1120,margin:"0 auto",padding:"0 20px",display:"flex",justifyContent:"space-between",alignItems:"center",height:68},
  navIconBtn:{display:"flex",alignItems:"center",gap:8,cursor:"pointer",padding:"6px 12px",borderRadius:20,border:"1px solid var(--line)",background:"rgba(255,255,255,0.03)"},
  navBrandText:{fontFamily:"var(--display)",fontSize:18,fontWeight:800,letterSpacing:"0.22em",textTransform:"uppercase",cursor:"pointer",color:"var(--paper)"},
  themeToggleBtn:{width:36,height:36,borderRadius:18,border:"1px solid var(--line)",background:"transparent",color:"var(--paper)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"},
  navBookBtn:{background:"var(--paper)",color:"var(--ink)",fontWeight:800,padding:"8px 18px",fontSize:11,border:"none",borderRadius:20,cursor:"pointer",letterSpacing:"0.12em",textTransform:"uppercase",display:"flex",alignItems:"center",gap:6},

  // Video Hero
  heroContainer:{position:"relative",width:"100%",minHeight:"85vh",background:"#05080E",overflow:"hidden",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"80px 20px"},
  heroVideo:{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",opacity:0.85},
  heroOverlay:{position:"absolute",inset:0,background:"linear-gradient(to bottom, rgba(5,8,14,0.4) 0%, rgba(5,8,14,0.7) 60%, rgba(5,8,14,0.98) 100%)",zIndex:5,pointerEvents:"none"},
  heroContent:{position:"relative",zIndex:10,textAlign:"center",maxWidth:860,display:"flex",flexDirection:"column",alignItems:"center"},
  heroPill:{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(12px)",border:"1px solid rgba(212,175,55,0.4)",padding:"6px 16px",borderRadius:20,marginBottom:20},
  heroPing:{width:6,height:6,borderRadius:"50%",background:"#d4af37",boxShadow:"0 0 10px #d4af37"},
  heroPillText:{fontSize:10,fontWeight:700,letterSpacing:"0.25em",textTransform:"uppercase",color:"#d4af37"},
  heroStudioTitle:{fontFamily:"var(--display)",fontSize:"clamp(46px,9vw,96px)",fontWeight:900,color:"#ffffff",lineHeight:1.05,letterSpacing:"0.06em",textTransform:"uppercase",textShadow:"0 12px 40px rgba(0,0,0,0.9)"},
  heroTaglineText:{fontSize:"clamp(12px,2vw,15px)",color:"rgba(255,255,255,0.85)",letterSpacing:"0.25em",textTransform:"uppercase",marginTop:16,maxWidth:600,fontWeight:400,lineHeight:1.6},
  heroActionRow:{marginTop:32,display:"flex",gap:16,alignItems:"center"},
  heroPrimaryBtn:{background:"#ffffff",color:"#080C14",padding:"16px 36px",borderRadius:30,fontWeight:800,fontSize:11,letterSpacing:"0.18em",textTransform:"uppercase",border:"none",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:8,boxShadow:"0 10px 30px rgba(0,0,0,0.6)",transition:"all 0.3s"},
  heroMetaStrip:{marginTop:36,display:"flex",alignItems:"center",gap:14,flexWrap:"wrap",justifyContent:"center",color:"rgba(255,255,255,0.6)",fontSize:11,letterSpacing:"0.08em"},
  heroMetaItem:{display:"inline-flex",alignItems:"center",gap:6},
  heroMetaDivider:{opacity:0.4},

  // Sections
  section:{padding:"90px 0"},
  sectionH2:{fontFamily:"var(--display)",fontWeight:800,fontSize:"clamp(28px,5vw,42px)",margin:0,letterSpacing:"0.06em",color:"var(--paper)",textTransform:"uppercase"},
  eyebrow:{fontSize:11,letterSpacing:"0.25em",textTransform:"uppercase",color:"#d4af37",marginBottom:12,display:"block",fontWeight:700},

  // Filter Bar
  filterBar:{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:16,marginBottom:36,paddingBottom:20,borderBottom:"1px solid var(--line)"},
  filterPillGroup:{display:"flex",gap:8,flexWrap:"wrap"},
  searchWrapper:{position:"relative",minWidth:240},
  searchInput:{width:"100%",background:"var(--surface)",border:"1px solid var(--line)",color:"var(--paper)",padding:"10px 16px",borderRadius:20,fontSize:12,outline:"none"},
  searchClearBtn:{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"transparent",border:"none",color:"var(--muted)",cursor:"pointer"},

  // Hairstyle Grid
  hsGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:24},
  hsCard:{background:"var(--surface)",borderRadius:16,overflow:"hidden",display:"flex",flexDirection:"column",border:"1px solid var(--line)",boxShadow:"var(--card-shadow)"},
  hsImgViewport:{position:"relative",height:300,overflow:"hidden",background:"#000000"},
  hsImg:{width:"100%",height:"100%",objectFit:"cover",opacity:0.95},
  hsBadgeOverlay:{position:"absolute",top:14,right:14},
  hsCardBody:{padding:"20px",flexGrow:1,display:"flex",flexDirection:"column",justifyContent:"space-between"},
  hsCardTitle:{fontFamily:"var(--display)",fontSize:16,fontWeight:800,color:"var(--paper)",letterSpacing:"0.04em",textTransform:"uppercase",margin:0,lineHeight:1.3},
  hsCardPrice:{fontSize:15,fontWeight:800,color:"#d4af37",fontVariantNumeric:"tabular-nums"},
  hsCardDesc:{fontSize:12,color:"var(--muted)",lineHeight:1.5,marginTop:8,fontWeight:300},
  hsCardStrip:{background:"rgba(0,0,0,0.2)",padding:"14px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",borderTop:"1px solid var(--line)"},
  hsCardSessionLabel:{fontSize:11,color:"var(--muted)",fontWeight:500},
  hsCardCtaPill:{fontSize:10,fontWeight:800,letterSpacing:"0.15em",color:"var(--paper)",display:"flex",alignItems:"center",gap:4},
  btnExpandAll:{background:"transparent",color:"var(--paper)",border:"1px solid var(--line)",padding:"14px 36px",borderRadius:24,fontSize:10,fontWeight:700,letterSpacing:"0.2em",textTransform:"uppercase",cursor:"pointer"},

  // Booking Flow
  bookPanel:{background:"var(--surface)",borderRadius:20,overflow:"hidden",border:"1px solid var(--line)",boxShadow:"var(--card-shadow)"},
  stepperNavStrip:{padding:"22px 28px",borderBottom:"1px solid var(--line)",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:16,background:"rgba(255,255,255,0.02)"},
  stepPillActive:{fontSize:11,fontWeight:800,letterSpacing:"0.15em",color:"#d4af37",cursor:"pointer"},
  stepPillDone:{fontSize:11,fontWeight:700,letterSpacing:"0.15em",color:"var(--paper)",cursor:"pointer"},
  stepPillInactive:{fontSize:11,fontWeight:500,letterSpacing:"0.15em",color:"var(--muted)"},
  changeStyleBtn:{background:"transparent",border:"none",color:"var(--muted)",fontSize:11,letterSpacing:"0.12em",cursor:"pointer",textTransform:"uppercase",display:"inline-flex",alignItems:"center",gap:6},
  bookBody:{padding:"36px 28px 44px"},
  fieldGroup:{marginBottom:32},
  fieldLabel:{fontSize:11,letterSpacing:"0.2em",textTransform:"uppercase",color:"var(--muted)",marginBottom:14,display:"block",fontWeight:700},

  // Date and Slot Pickers
  dateStrip:{display:"flex",gap:10,overflowX:"auto",paddingBottom:10},
  dateChip:{flexShrink:0,width:60,padding:"14px 0",textAlign:"center",borderRadius:12,border:"1px solid var(--line)",background:"var(--surface)",color:"var(--paper)",cursor:"pointer"},
  dateChipSelected:{borderColor:"#d4af37",background:"#d4af37",color:"#000000",fontWeight:800},
  dateChipDisabled:{opacity:0.2,cursor:"not-allowed"},
  dow:{fontSize:9,color:"inherit",display:"block",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.1em"},
  dnum:{fontSize:20,fontWeight:800},
  slotGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(96px,1fr))",gap:8},
  slot:{padding:"12px 6px",textAlign:"center",borderRadius:10,border:"1px solid var(--line)",background:"transparent",color:"var(--paper)",fontSize:12,cursor:"pointer",transition:"all 0.25s"},
  slotSelected:{borderColor:"#d4af37",background:"#d4af37",color:"#000000",fontWeight:800},
  slotTaken:{opacity:0.2,textDecoration:"line-through",cursor:"not-allowed"},

  // Summary Table
  summaryBox:{background:"rgba(255,255,255,0.02)",borderRadius:14,padding:"22px 24px",marginBottom:24,border:"1px solid var(--line)"},
  summaryRow:{display:"flex",justifyContent:"space-between",fontSize:13,padding:"7px 0",color:"var(--muted)"},
  srKey:{color:"var(--muted)"},
  srVal:{color:"var(--paper)",fontWeight:600},
  input:{width:"100%",background:"var(--surface)",border:"1px solid var(--line)",borderRadius:10,color:"var(--paper)",padding:"16px 20px",fontSize:14,marginBottom:14,outline:"none"},
  formRow:{display:"flex",flexDirection:"column"},
  btnConfirm:{width:"100%",background:"var(--paper)",color:"var(--ink)",fontWeight:800,padding:"18px",fontSize:12,borderRadius:12,border:"none",cursor:"pointer",textTransform:"uppercase",letterSpacing:"0.15em",boxShadow:"0 8px 24px rgba(0,0,0,0.4)"},
  btnDisabled:{background:"var(--line)",color:"var(--muted)",cursor:"not-allowed"},
  btnGhostBtn:{background:"transparent",color:"var(--paper)",fontWeight:700,padding:"14px 24px",fontSize:11,borderRadius:10,border:"1px solid var(--line)",cursor:"pointer",letterSpacing:"0.15em",textTransform:"uppercase"},

  // Boarding Pass
  tokenPassCard:{background:"var(--surface)",borderRadius:20,color:"var(--paper)",padding:36,border:"1px solid var(--line)",boxShadow:"var(--card-shadow)"},
  passHeader:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24},
  passBrand:{fontFamily:"var(--display)",fontSize:22,fontWeight:800,letterSpacing:"0.18em",color:"var(--paper)",textTransform:"uppercase"},
  passSub:{fontSize:10,color:"#d4af37",letterSpacing:"0.25em",textTransform:"uppercase",marginTop:3},
  passBadge:{background:"#10b981",color:"#ffffff",fontSize:9,fontWeight:800,padding:"5px 12px",borderRadius:20,letterSpacing:"0.15em",textTransform:"uppercase"},
  ticketPerforation:{borderTop:"2px dashed var(--line)",margin:"20px 0"},
  tokenBox:{padding:28,textAlign:"center",marginBottom:24,borderRadius:12,background:"rgba(212,175,55,0.06)",border:"1px solid rgba(212,175,55,0.3)"},
  tokenLabel:{display:"block",fontSize:10,color:"#d4af37",textTransform:"uppercase",letterSpacing:"0.25em",fontWeight:700},
  tokenVal:{display:"block",fontFamily:"var(--display)",fontSize:40,color:"var(--paper)",letterSpacing:"0.2em",margin:"12px 0",fontWeight:900},
  tokenNote:{display:"block",fontSize:11,color:"var(--muted)"},
  confirmDetail:{padding:"16px 0",fontSize:13,lineHeight:2},
  cdRow:{display:"flex",justifyContent:"space-between",padding:"6px 0",color:"var(--muted)",borderBottom:"1px solid var(--line)"},
  passActions:{marginTop:28,display:"flex",flexDirection:"column",gap:12},
  btnWhatsApp:{display:"flex",alignItems:"center",justifyContent:"center",gap:8,width:"100%",textAlign:"center",background:"#25D366",color:"#ffffff",fontWeight:800,padding:"16px",borderRadius:12,fontSize:12,textDecoration:"none",textTransform:"uppercase",letterSpacing:"0.15em",boxShadow:"0 6px 20px rgba(37,211,102,0.3)"},
  btnPrint:{background:"transparent",color:"var(--paper)",fontWeight:700,padding:"14px",borderRadius:10,fontSize:11,border:"1px solid var(--line)",cursor:"pointer",textTransform:"uppercase",letterSpacing:"0.15em",display:"inline-flex",alignItems:"center",justifyContent:"center",gap:8},

  // Reviews
  reviewCard:{background:"var(--surface)",borderRadius:14,border:"1px solid var(--line)",padding:"24px 22px",display:"flex",flexDirection:"column",gap:14},
  reviewFormBox:{maxWidth:440,background:"var(--surface)",borderRadius:16,border:"1px solid var(--line)",padding:"32px 28px",textAlign:"left"},

  // Footer
  footer:{background:"var(--ink)",borderTop:"1px solid var(--line)",padding:"80px 0 40px"},
  footerGrid:{display:"flex",flexDirection:"column",gap:28},
  footBrand:{fontFamily:"var(--display)",fontSize:22,fontWeight:800,letterSpacing:"0.25em",color:"var(--paper)",textTransform:"uppercase"},
  footAddr:{fontSize:13,color:"var(--muted)",marginTop:8,lineHeight:1.7},
  footHours:{fontSize:12,color:"var(--muted)",lineHeight:2.2},
  footerBottomRow:{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:16,borderTop:"1px solid var(--line)",paddingTop:20},
  footOwnerBtn:{background:"transparent",border:"none",padding:"8px 0",fontSize:11,color:"var(--muted)",cursor:"pointer",letterSpacing:"0.1em"},
  footThemeBtn:{background:"transparent",border:"1px solid var(--line)",color:"var(--paper)",padding:"8px 18px",borderRadius:20,fontSize:10,fontWeight:700,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:8,letterSpacing:"0.12em",textTransform:"uppercase"},
  footerLegalStrip:{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:14,borderTop:"1px solid var(--line)",paddingTop:16,marginTop:8},
  legalLinkBtn:{background:"transparent",border:"none",color:"var(--muted)",cursor:"pointer",fontSize:11,padding:0},

  // Mobile Sticky CTA
  stickyCta:{position:"fixed",bottom:0,left:0,right:0,zIndex:90,background:"var(--nav-bg)",backdropFilter:"blur(20px)",borderTop:"1px solid var(--line)",padding:"12px 16px",display:"flex",gap:10},
  stickyCall:{flex:1,border:"1px solid var(--line)",borderRadius:10,background:"transparent",color:"var(--paper)",padding:14,fontWeight:700,fontSize:11,cursor:"pointer",textTransform:"uppercase",letterSpacing:"0.12em"},
  stickyBook:{flex:1,border:"none",borderRadius:10,background:"#d4af37",color:"#000000",padding:14,fontWeight:800,fontSize:11,cursor:"pointer",textTransform:"uppercase",letterSpacing:"0.12em"},
};
