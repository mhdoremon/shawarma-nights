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
  shopWhatsapp: "923001234567",
  phoneDisplay: "0300-1234567",
  address: "Shop 12, Main Boulevard, Gulberg, Lahore",
  monSatHours: "11:00 AM to 11:00 PM",
  sundayHours: "Closed",
  bookingFee: 50,
  upiId: "nashstudio@upi",
  accountTitle: "Nash Studio",
};

const DEFAULT_HAIRSTYLES = [
  // PREMIUM (60 min â€¢ Rs 1500)
  { id: 'hs1', name: 'Messy Spiky Undercut', type: 'premium', img: '/images/10-messy-spiky-undercut-for-men.webp', time: 60, price: 1500, desc: 'High-texture spiky top with ultra-sharp disconnected fade.' },
  { id: 'hs2', name: 'Messy Flow & Texture', type: 'premium', img: '/images/Messy_Hairstyles_For_Men_76d77f7a-be86-4de0-802f-5fd01f933356.webp', time: 60, price: 1500, desc: 'Natural flow length with textured layers and soft taper.' },
  { id: 'hs3', name: 'Royal Pompadour Fade', type: 'premium', img: '/images/hs_pompadour_fade.jpg', time: 60, price: 1500, desc: 'Voluminous high pompadour with seamless skin fade.' },
  { id: 'hs4', name: 'Classic Executive Pompadour', type: 'premium', img: '/images/images (1).jfif', time: 60, price: 1500, desc: 'Clean slicked pompadour for sharp business presentation.' },
  { id: 'hs5', name: 'Modern Slicked Back Taper', type: 'premium', img: '/images/hs_slick_back.jpg', time: 60, price: 1500, desc: 'Gloss finish swept back style with tailored side tapers.' },
  { id: 'hs6', name: 'Textured Wolf Cut', type: 'premium', img: '/images/hs_wolf_cut.jpg', time: 60, price: 1500, desc: 'Edgy modern wolf layers with textured fringe.' },
  { id: 'hs7', name: 'Scissor Sculpt & Lineup', type: 'premium', img: '/images/hs_scissor_sculpt.jpg', time: 60, price: 1500, desc: '100% precision scissor craftsmanship with hot towel finish.' },
  { id: 'hs8', name: 'Voluminous Quiff Fade', type: 'premium', img: '/images/hs_quiff_fade.jpg', time: 60, price: 1500, desc: 'Lifted textured quiff with high contrast side taper.' },
  { id: 'hs9', name: 'Executive Contour Fade', type: 'premium', img: '/images/images.jfif', time: 60, price: 1500, desc: 'Sharp silhouette contoured to head shape with beard blend.' },

  // STANDARD (30 min â€¢ Rs 800 / Rs 500)
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
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function MinimalScissorsIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="18" r="3" />
      <line x1="8.2" y1="15.8" x2="18" y2="4" />
      <line x1="15.8" y1="15.8" x2="6" y2="4" />
      <circle cx="12" cy="12" r="0.75" fill="#ffffff" />
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
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState('terms');

  const openLegalModal = (tab = 'terms') => {
    setLegalTab(tab);
    setLegalModalOpen(true);
  };

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

/* FloatingParticles removed â€” clean design */

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
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("nash_theme") || "light";
  });
  const bookRef = useRef(null);

  useEffect(() => {
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

  async function confirmBooking() {
    if (!user) {
      alert("Kripya pehle Google account se Sign In karein.");
      return;
    }
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
    const currentUserObj = user;
    if (!slot) { alert("Slot select karein."); return; }
    if (!txnId.trim() || txnId.trim().length < 4) {
      alert("⚠️ Mandatory Token Payment: Nash Studio me slot book karne ke liye ₹50 Token advance pay karna aniwarya hai. Kripya ₹50 UPI pay karein aur 12-digit UTR number enter karein. Bina Token payment ke booking sambhav nahi hai.");
      return;
    }
    setSaving(true);
    const d = dates[dateIndex];
    const bookingToken = "NS-" + Math.floor(100000 + Math.random() * 900000);
    const activeBookingFee = 50;
    const activeRemainingDue = Math.max(0, totalPrice - 50);
    const activePaymentStatus = "Token Paid (₹50 Advance)";
    const activePaymentMethod = "UPI Token Advance (₹50)";
    const activeTxnId = txnId.trim();

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
    return `https://wa.me/${settings.shopWhatsapp || "923001234567"}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div style={S.body}>
      <style>{GLOBAL_CSS}</style>
      
      {/* NAV */}
      <nav style={S.navBugatti}>
        <div style={S.navSide} onClick={user ? undefined : handleGoogleAuth} title={user ? user.displayName : "Sign In"}>
          <MinimalUserIcon />
        </div>
        <div style={{...S.navSide, justifyContent:"flex-end"}} onClick={scrollToBook} title="Book Hairstyle / Grooming">
          <MinimalScissorsIcon />
        </div>
      </nav>

      {/* HERO */}
      <section style={S.bugattiHero}>
        <video src={settings.heroVideoUrl || "/video/hero.mp4"} style={S.bugattiImg} autoPlay loop muted playsInline onError={(e) => { e.target.style.display='none'; const img = document.createElement('img'); img.src='/images/hero_fallback.jpg'; Object.assign(img.style, {position:'absolute',inset:'0',width:'100%',height:'100%',objectFit:'cover',opacity:'1'}); e.target.parentNode.insertBefore(img, e.target); }} />
        <div style={{position:'absolute',inset:0,background:'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, transparent 40%, rgba(0,0,0,0.25) 100%)',zIndex:5,pointerEvents:'none'}} />
        <div style={S.bugattiTitle}>{settings.studioName || "Nash Studio"}</div>
      </section>

      {/* SMART MODULAR WIRE: PROMOTIONAL HERO BANNER (TOGGLED OFF BY DEFAULT, CAN BE ACTIVATED FROM DUKANDAR OS) */}
      {settings.showHeroBanner && (
        <section className="nash-promotional-hero-banner" style={{background:"var(--surface)", borderBottom:"1px solid var(--line)", padding:"40px 20px", textAlign:"center"}}>
          <div style={{maxWidth:800, margin:"0 auto"}}>
            <span style={{fontSize:11, fontWeight:700, letterSpacing:"0.15em", textTransform:"uppercase", color:"#d4af37", background:"rgba(212,175,55,0.1)", padding:"4px 12px", borderRadius:20}}>
              {settings.heroTagline || "EXCLUSIVE SALON PROMOTION"}
            </span>
            <h1 style={{fontFamily:"var(--display)", fontSize:"clamp(24px, 4vw, 36px)", fontWeight:800, color:"var(--paper)", marginTop:12, textTransform:"uppercase"}}>
              {settings.studioName || "NASH STUDIO"}
            </h1>
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

      {/* SMART MODULAR WIRE: SPECIAL OFFER CARDS (TOGGLED OFF BY DEFAULT, CAN BE ACTIVATED FROM DUKANDAR OS) */}
      {settings.showOfferCards && (
        <section className="nash-promotional-offers" style={{background:"var(--ink)", borderBottom:"1px solid var(--line)", padding:"30px 20px"}}>
          <div style={{maxWidth:1100, margin:"0 auto"}}>
            <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16}}>
              <span style={{fontSize:12, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--paper)"}}>
                ★ SPECIAL SALON PACKAGES & DEALS
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

      {/* HAIRSTYLE SELECTION & BOOKING SECTION */}
      <section id="book" ref={bookRef} style={{...S.section, borderBottom:"1px solid var(--line)"}}>
        <div style={S.wrap}>
          {done ? (
            <div style={S.bookPanel}>
              <div style={S.bookBody}>
                <div style={S.tokenPassCard} className="nash-pass-reveal">
                  <div style={S.passHeader}>
                    <div>
                      <div style={S.passBrand}>{settings.studioName || "NASH STUDIO"}</div>
                      <div style={S.passSub}>CONFIRMED PASS</div>
                    </div>
                    <div style={S.passBadge}>ACTIVE</div>
                  </div>

                  <div style={S.tokenBox}>
                    <span style={S.tokenLabel}>TOKEN PASS</span>
                    <strong style={S.tokenVal}>{done.token||("NS-"+(done.id?done.id.slice(-6).toUpperCase():"100000"))}</strong>
                  </div>

                  <div style={S.confirmDetail}>
                    {[
                      ["Customer", done.name],
                      ["Mobile", done.phone],
                      ["Date", done.dateLabel],
                      ["Time", done.timeLabel],
                      ["Service", done.styleName],
                      ["Tier", done.tier === "premium" ? "Premium (60 min)" : "Standard (30 min)"],
                      ["Service Total", `Rs ${done.totalPrice || 0}`],
                      ...(ENABLE_ONLINE_PAYMENT ? [
                        ["Booking Fee Paid", `Rs ${done.bookingFee || 50} (UTR: ${done.txnId || "Verified"})`],
                        ["Remaining at Salon", `Rs ${done.remainingDue !== undefined ? done.remainingDue : Math.max(0, (done.totalPrice||0) - (done.bookingFee||50))}`]
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
                            color: isPaid ? "#25D366" : "var(--paper)",
                            fontWeight: isDue || isPaid ? 700 : 500,
                            fontSize: isDue ? 15 : 13
                          }}>{v}</b>
                        </div>
                      );
                    })}
                  </div>

                  <div style={S.passActions}>
                    <a href={getWaLink(done)} target="_blank" rel="noopener noreferrer" style={S.btnWhatsApp}>
                      SHARE ON WHATSAPP
                    </a>
                    <button style={S.btnPrint} onClick={() => printStandaloneTicket(done, settings)}>
                      PRINT TICKET
                    </button>
                    <button style={{...S.btnGhostBtn, marginTop:8}} onClick={resetBooking}>
                      + NEW BOOKING
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : step === 1 ? (
            /* STEP 1: OPEN LUXURY HAIRSTYLE SELECTION (NO ENCLOSING BOX) */
            <div className="nash-expand-anim">
              <div style={{marginBottom:40}}>
                <h2 style={{fontFamily:"var(--display)",fontSize:"clamp(28px,5vw,42px)",fontWeight:800,letterSpacing:"0.12em",color:"var(--paper)",textTransform:"uppercase",margin:0}}>Styles</h2>
              </div>

              {/* CATEGORY SWITCHER & LIVE SEARCH BAR */}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:16,marginBottom:32}}>
                <div style={{display:"flex",gap:0}}>
                  {[
                    {key:"all",label:"All"},
                    {key:"premium",label:"Premium"},
                    {key:"standard",label:"Standard"},
                  ].map(tab => {
                    const isSel = filterT === tab.key;
                    return (
                      <button key={tab.key}
                        onClick={() => setFilterT(tab.key)}
                        style={{
                          background:"transparent",
                          color:isSel ? "var(--paper)" : "var(--muted)",
                          border:"none",
                          borderBottom:isSel ? "2px solid var(--paper)" : "2px solid transparent",
                          padding:"8px 20px",
                          fontSize:11,
                          fontWeight:isSel ? 700 : 500,
                          letterSpacing:"0.15em",
                          cursor:"pointer",
                          transition:"all 0.4s cubic-bezier(.16,1,.3,1)",
                          textTransform:"uppercase",
                        }}>
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                <div style={{position:"relative",minWidth:220}}>
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQ}
                    onChange={e => setSearchQ(e.target.value)}
                    style={{
                      width:"100%",
                      background:"transparent",
                      border:"none",
                      borderBottom:"1px solid var(--line)",
                      color:"var(--paper)",
                      padding:"8px 0",
                      fontSize:12,
                      fontFamily:"var(--body)",
                      outline:"none",
                      letterSpacing:"0.05em"
                    }}
                  />
                  {searchQ && (
                    <button onClick={() => setSearchQ("")} style={{position:"absolute",right:0,top:"50%",transform:"translateY(-50%)",background:"transparent",border:"none",color:"var(--muted)",cursor:"pointer",fontSize:11}}>âœ•</button>
                  )}
                </div>
              </div>

              {/* HAIRSTYLES GRID */}
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
                    <div style={{textAlign:"center",padding:"60px 20px",color:"var(--muted)"}}>
                      <p style={{fontSize:14}}>No results for "{searchQ}"</p>
                      <button onClick={() => { setSearchQ(""); setFilterT("all"); }} style={{marginTop:16,...S.btnGhostBtn}}>View All</button>
                    </div>
                  );
                }

                return (
                  <>
                    <div style={S.hsGrid}>
                      {itemsToDisplay.map(h => {
                        const isPrem = h.type === "premium";
                        return (
                          <div key={h.id}
                            className="nash-hs-hover"
                            onClick={() => { setSelectedStyle(h); goStep(2); }}
                            style={{
                              background:"var(--surface)",
                              overflow:"hidden",
                              display:"flex",
                              flexDirection:"column",
                              border:"1px solid var(--line)"
                            }}>
                            <div style={{position:"relative", height:320, overflow:"hidden", background:"var(--card-img-bg, #000)"}}>
                              <img src={h.img} alt={h.name} style={{width:"100%", height:"100%", objectFit:"cover", opacity: 0.95}} />
                              
                              {/* MINIMAL TIER TAG */}
                              <div style={{position:"absolute", top:14, right:14}}>
                                <span style={{
                                  background: isPrem ? "var(--prem-badge-bg)" : "var(--std-badge-bg)",
                                  color: isPrem ? "var(--prem-badge-color)" : "var(--std-badge-color)",
                                  fontSize:9,
                                  fontWeight:700,
                                  padding:"4px 10px",
                                  letterSpacing:"0.15em",
                                  textTransform:"uppercase",
                                  backdropFilter:"blur(8px)",
                                  border: "1px solid var(--line)"
                                }}>
                                  {isPrem ? "PREMIUM" : "STANDARD"}
                                </span>
                              </div>
                            </div>

                            {/* STYLE NAME */}
                            <div style={{padding:"22px 20px 20px", flexGrow:1, display:"flex", alignItems:"center"}}>
                              <h3 style={{fontFamily:"var(--display)", fontSize:16, fontWeight:700, color:"var(--paper)", letterSpacing:"0.06em", margin:0, textTransform:"uppercase", lineHeight:1.3}}>{h.name}</h3>
                            </div>

                            {/* DARK BLACK PRICE STRIP (PATTI) */}
                            <div style={{
                              background:"#000000",
                              color:"#ffffff",
                              padding:"14px 20px",
                              display:"flex",
                              justifyContent:"space-between",
                              alignItems:"center",
                              borderTop:"1px solid rgba(255,255,255,0.1)"
                            }}>
                              <div style={{fontFamily:"var(--body)", fontSize:14, fontWeight:700, color:"#ffffff", letterSpacing:"0.05em"}}>
                                Rs {Number(h.price||0).toLocaleString()} <span style={{fontSize:11, color:"rgba(255,255,255,0.65)", fontWeight:400}}>â€¢ {h.time}m</span>
                              </div>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* EXPLORE ALL TOGGLE BUTTON */}
                    {filtered.length > 6 && !expandedGallery && !isSearching && filterT === "all" && (
                      <div style={{textAlign:"center", marginTop:40}}>
                        <button
                          onClick={() => setExpandedGallery(true)}
                          style={{
                            background: "transparent",
                            color: "var(--paper)",
                            border: "1px solid var(--line)",
                            padding: "14px 36px",
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: "0.25em",
                            textTransform: "uppercase",
                            cursor: "pointer",
                            transition: "all 0.4s"
                          }}
                          className="nash-btn-confirm">
                          VIEW ALL {filtered.length} STYLES
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          ) : (
            /* STEP 2 & 3: TIME SLOT & CONFIRMATION */
            <div style={S.bookPanel}>
              {/* SELECTED STYLE HEADER */}
              <div style={{padding:"20px 28px", borderBottom:"1px solid var(--line)", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12}}>
                <div style={{display:"flex", alignItems:"center", gap:16}}>
                  {selectedStyle?.img && (
                    <img src={selectedStyle.img} alt={selectedStyle.name} style={{width:40, height:40, objectFit:"cover"}} />
                  )}
                  <div>
                    <div style={{fontSize:15, fontWeight:700, color:"var(--paper)", letterSpacing:"0.06em", textTransform:"uppercase"}}>{selectedStyle?.name}</div>
                    <div style={{fontSize:11, color:"var(--muted)", marginTop:2}}>Rs {selectedStyle?.price} â€¢ {selectedStyle?.time}m session</div>
                  </div>
                </div>
                <button onClick={() => goStep(1)} style={{background:"transparent", border:"none", color:"var(--muted)", fontSize:11, letterSpacing:"0.15em", cursor:"pointer", textTransform:"uppercase", padding:"6px 0", transition:"color 0.3s"}} onMouseEnter={e => e.target.style.color="var(--paper)"} onMouseLeave={e => e.target.style.color="var(--muted)"}>
                  â† CHANGE
                </button>
              </div>

              <div style={S.bookBody}>
                {step === 2 && (
                  <TimeStep dates={dates} dateIndex={dateIndex} setDateIndex={setDateIndex} totalMinutes={totalMinutes} slot={slot} setSlot={setSlot} realtimeBookings={realtimeBookings} onNext={() => goStep(3)} />
                )}

                {step === 3 && (
                  <div className="nash-expand-anim">
                    {/* BOOKING SUMMARY */}
                    <div style={S.summaryBox}>
                      {[
                        ["Style", selectedStyle?.name],
                        ["Category", selectedStyle?.type === "premium" ? "Premium" : "Standard"],
                        ["Date", fmtDate(dates[dateIndex], {weekday:"short",day:"numeric",month:"short"})],
                        ["Time", slot ? slot.label : "--"],
                        ["Duration", `${totalMinutes} min`],
                        ...(ENABLE_ONLINE_PAYMENT ? [
                          ["Service Price", `Rs ${totalPrice}`],
                          ["Online Booking Fee (Pay Now)", `Rs ${bookingFee}`],
                          ["Remaining Due at Salon", `Rs ${remainingDue}`]
                        ] : [
                          ["Total Price (Pay in Person at Salon)", `Rs ${totalPrice}`]
                        ])
                      ].map(([k,v]) => {
                        const isPayNow = k.includes("Booking Fee") || k.includes("Total Price");
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
                              ...(isPayNow ? {color:"var(--paper)", fontWeight:800, fontSize:15} : {}),
                              ...(isRemain ? {color:"var(--muted)"} : {})
                            }}>{v}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* =========================================================================
                        MANDATORY ₹50 ONLINE TOKEN ADVANCE PAYMENT (ALWAYS VISIBLE AT STEP 3)
                        ========================================================================= */}
                    <div style={{
                      background: "rgba(212, 175, 55, 0.05)",
                      border: "1px solid rgba(212, 175, 55, 0.35)",
                      borderRadius: 8,
                      padding: "24px 20px",
                      marginBottom: 20
                    }}>
                      <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14}}>
                        <span style={{...S.fieldLabel, margin: 0, color: "var(--paper)", fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center", gap: 6}}>
                          🔒 Mandatory Token Advance: ₹50 Fixed
                        </span>
                        <span style={{
                          fontSize: 9, 
                          background: "#d4af37", 
                          color: "#000000", 
                          fontWeight: 900, 
                          padding: "4px 8px", 
                          borderRadius: 4,
                          letterSpacing: "0.15em", 
                          textTransform: "uppercase"
                        }}>
                          REQUIRED
                        </span>
                      </div>

                      <div style={{
                        background: "rgba(220, 38, 38, 0.12)",
                        border: "1px solid rgba(220, 38, 38, 0.35)",
                        borderRadius: 6,
                        padding: "10px 12px",
                        marginBottom: 16,
                        fontSize: 11,
                        color: "#fca5a5",
                        lineHeight: 1.5
                      }}>
                        ⚠️ <b>Nash Studio Booking Rule:</b> Bina ₹50 Token payment ke slot book nahi ho sakta. Booking cancel karne par token money refund nahi hoga kyunki sirf seat confirm karne ke liye nominal token charge kiya jata hai. Kripya ₹50 pay karein aur 12-digit UTR enter karein.
                      </div>

                      <p style={{fontSize: 12, color: "var(--muted)", marginBottom: 18, lineHeight: 1.5}}>
                        GPay, PhonePe, Paytm ya kisi bhi UPI app se ₹50 scan karein. Haircut ke baad bache hue <b>₹{remainingDue}</b> aap salon me cash ya UPI se de sakte hain.
                      </p>

                      <div style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 14,
                        padding: "20px",
                        background: "var(--surface)",
                        border: "1px solid var(--line)",
                        borderRadius: 6,
                        marginBottom: 20
                      }}>
                        {/* DYNAMIC UPI QR CODE (FIXED TO ₹50) */}
                        <div style={{background: "#ffffff", padding: 12, borderRadius: 6, display: "inline-block", border: "1px solid var(--line)", boxShadow: "0 4px 12px rgba(0,0,0,0.3)"}}>
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`upi://pay?pa=${settings.upiId||"nashstudio@upi"}&pn=${encodeURIComponent(settings.studioName||"Nash Studio")}&am=50&cu=INR`)}`}
                            alt="Token Payment QR Code (Rs 50)"
                            style={{width: 160, height: 160, display: "block"}}
                          />
                        </div>
                        <span style={{fontSize: 11, fontWeight: 700, color: "#d4af37", letterSpacing: "0.08em"}}>
                          SCAN TO PAY ₹50 TOKEN
                        </span>

                        <div style={{textAlign: "center", width: "100%"}}>
                          <div style={{fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4}}>Nash Studio UPI ID</div>
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 10,
                            background: "var(--surface-hover)",
                            padding: "8px 14px",
                            border: "1px solid var(--line)",
                            maxWidth: 280,
                            margin: "0 auto",
                            borderRadius: 4
                          }}>
                            <span style={{fontFamily: "var(--mono)", fontSize: 12, fontWeight: 700, color: "var(--paper)"}}>{settings.upiId || "nashstudio@upi"}</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(settings.upiId || "nashstudio@upi");
                                setCopiedUpi(true);
                                setTimeout(() => setCopiedUpi(false), 2000);
                              }}
                              style={{background: "transparent", border: "none", color: "#d4af37", fontSize: 11, fontWeight: 700, cursor: "pointer", textDecoration: "underline"}}
                            >
                              {copiedUpi ? "COPIED!" : "COPY"}
                            </button>
                          </div>

                          {/* MOBILE UPI APP LAUNCHER */}
                          <div style={{marginTop: 12}}>
                            <a
                              href={`upi://pay?pa=${settings.upiId||"nashstudio@upi"}&pn=${encodeURIComponent(settings.studioName||"Nash Studio")}&am=50&cu=INR`}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                fontSize: 11,
                                color: "#d4af37",
                                fontWeight: 700,
                                textDecoration: "underline",
                                letterSpacing: "0.04em"
                              }}
                            >
                              ⚡ Tap to Open UPI App (₹50 Pay)
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* TRANSACTION ID INPUT (MANDATORY) */}
                      <div>
                        <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6}}>
                          <label style={{...S.fieldLabel, margin: 0}}>
                            12-Digit Transaction ID / UTR Number *
                          </label>
                          <span style={{fontSize: 10, color: txnId.trim().length >= 4 ? "#34A853" : "#f87171", fontWeight: 700}}>
                            {txnId.trim().length >= 4 ? "✓ Entered" : "Required"}
                          </span>
                        </div>
                        <input
                          style={{
                            ...S.input, 
                            marginBottom: 6,
                            borderColor: !txnId.trim() ? "rgba(220, 38, 38, 0.5)" : "rgba(52, 168, 83, 0.6)"
                          }}
                          type="text"
                          required
                          placeholder="e.g. 482910394820 (From Payment Receipt)"
                          value={txnId}
                          onChange={e => setTxnId(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                        />
                        <span style={{fontSize: 11, color: "var(--muted)", display: "block"}}>
                          UPI receipt (GPay / PhonePe / Paytm) se 12-digit UTR/Ref number yahan enter karein.
                        </span>
                      </div>
                    </div>

                    {/* =========================================================================
                        CUSTOMER DETAILS & AUTHENTICATION
                        ========================================================================= */}
                    {!user ? (
                      /* USER IS NOT LOGGED IN -> REQUIRE GOOGLE SIGN IN */
                      <div style={{
                        textAlign: "center",
                        padding: "24px 20px",
                        background: "var(--surface)",
                        border: "1px solid var(--line)",
                        borderRadius: 8,
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
                            borderRadius: 4
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
                      /* USER IS LOGGED IN -> ENTER DETAILS */
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

                    {/* CONFIRMATION / ACTION BUTTON */}
                    <button 
                      style={{
                        ...S.btnConfirm,
                        background: (!user || !txnId.trim() || txnId.trim().length < 4) ? "rgba(212, 175, 55, 0.4)" : S.btnConfirm.background,
                        color: (!user || !txnId.trim() || txnId.trim().length < 4) ? "rgba(0,0,0,0.6)" : S.btnConfirm.color,
                        cursor: saving ? "wait" : (!user ? "pointer" : (!txnId.trim() ? "not-allowed" : "pointer"))
                      }} 
                      className="nash-btn-confirm" 
                      onClick={!user ? handleGoogleAuth : confirmBooking} 
                      disabled={saving || (Boolean(user) && (!txnId.trim() || txnId.trim().length < 4))}
                    >
                      {saving 
                        ? "CONFIRMING APPOINTMENT..." 
                        : !user
                        ? "1. SIGN IN WITH GOOGLE TO CONFIRM (₹50 TOKEN)"
                        : !txnId.trim() || txnId.trim().length < 4
                        ? "ENTER ₹50 UPI UTR / TXN ID TO CONFIRM"
                        : "CONFIRM APPOINTMENT (₹50 TOKEN PAID) →"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* STORIES SECTION */}
      <section style={{...S.section, borderBottom:"1px solid var(--line)"}}>
        <div style={S.wrap}>
          <Reveal>
            <div style={{marginBottom:40}}>
              <h2 style={{fontFamily:"var(--display)",fontSize:"clamp(28px,5vw,42px)",fontWeight:800,letterSpacing:"0.12em",color:"var(--paper)",textTransform:"uppercase",margin:0}}>Stories</h2>
            </div>
          </Reveal>

          {/* EXISTING STORIES */}
          {reviews.length > 0 ? (
            <Reveal delay={100}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:20,marginBottom:36}}>
                {reviews.slice(0, 6).map((r, idx) => (
                  <div key={r.id || idx} style={{
                    background:"var(--surface)",
                    border:"1px solid var(--line)",
                    padding:"24px 22px",
                    display:"flex",
                    flexDirection:"column",
                    gap:14,
                  }}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
                      <div style={{fontFamily:"var(--display)",fontSize:15,fontWeight:700,color:"var(--paper)",letterSpacing:"0.04em",textTransform:"uppercase"}}>{r.name}</div>
                      <div style={{display:"flex",gap:2}}>
                        {[1,2,3,4,5].map(s => (
                          <span key={s} style={{fontSize:13,color:s <= (r.rating||0) ? "var(--star-color, #E5A93B)" : "var(--star-empty, var(--line))"}}>â˜…</span>
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

          {/* WRITE A STORY BUTTON / FORM */}
          <Reveal delay={200}>
            <div>
              {!showReviewForm ? (
                <button
                  onClick={() => {
                    if (user && user.displayName) setReviewName(user.displayName);
                    setShowReviewForm(true);
                  }}
                  style={{
                    background:"transparent",
                    color:"var(--paper)",
                    border:"1px solid var(--line)",
                    padding:"14px 32px",
                    fontSize:10,
                    fontWeight:700,
                    letterSpacing:"0.25em",
                    textTransform:"uppercase",
                    cursor:"pointer",
                    transition:"all 0.4s"
                  }}
                  className="nash-btn-confirm"
                >
                  SHARE YOUR STORY
                </button>
              ) : (
                <div style={{
                  maxWidth:440,
                  background:"var(--surface)",
                  border:"1px solid var(--line)",
                  padding:"32px 28px",
                  textAlign:"left",
                }} className="nash-expand-anim">
                  {/* Star rating */}
                  <div style={{marginBottom:24}}>
                    <div style={{display:"flex",gap:8}}>
                      {[1,2,3,4,5].map(s => (
                        <span
                          key={s}
                          onClick={() => setReviewRating(s)}
                          onMouseEnter={() => setReviewHover(s)}
                          onMouseLeave={() => setReviewHover(0)}
                          style={{
                            fontSize:24,
                            cursor:"pointer",
                            color: s <= (reviewHover || reviewRating) ? "var(--star-color, #E5A93B)" : "var(--star-empty, var(--line))",
                            transition:"color 0.15s",
                            display:"inline-block",
                          }}
                        >â˜…</span>
                      ))}
                    </div>
                  </div>

                  {/* Name input */}
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={reviewName}
                    onChange={e => setReviewName(e.target.value)}
                    style={S.input}
                  />

                  {/* Comment textarea */}
                  <textarea
                    placeholder="Your story / experience..."
                    value={reviewComment}
                    onChange={e => setReviewComment(e.target.value)}
                    rows={3}
                    style={{
                      ...S.input,
                      resize:"none",
                      marginBottom:20,
                    }}
                  />

                  {/* Action buttons */}
                  <div style={{display:"flex",gap:10}}>
                    <button
                      onClick={handleSubmitReview}
                      disabled={reviewSaving}
                      style={{...S.btnConfirm, flex:1}}
                    >
                      {reviewSaving ? "SAVING..." : "SUBMIT"}
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

      {/* FOOTER */}
      <section style={{...S.section, borderBottom:"none", padding:"80px 0 40px"}}>
        <div style={S.wrap}>
          <Reveal>
            <div style={S.footGrid}>
              <div>
                <div style={S.footBrand}>{settings.studioName || "NASH STUDIO"}</div>
                <p style={S.footAddr}>{settings.address || "Shop 12, Main Boulevard, Gulberg, Lahore"}</p>
              </div>
              <div style={S.footHours}>
                <div>Mon-Sat â€¢ {settings.monSatHours || "11:00 AM to 11:00 PM"}</div>
                <div>Sunday â€¢ {settings.sundayHours || "Closed"}</div>
                <div>{settings.phoneDisplay || "0300-1234567"}</div>
              </div>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:16, borderTop:"1px solid var(--line)", paddingTop:20}}>
                <div style={{display:"flex", alignItems:"center", gap:16}}>
                  <a
                    href="https://churuone.in/admin?storeId=nash-studio"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{...S.footOwnerBtn, textDecoration:"none", display:"inline-flex", alignItems:"center", gap:4}}
                  >
                    Dukandar Login â†—
                  </a>

                  {/* BOTTOM THEME TOGGLE BUTTON */}
                  <button
                    onClick={toggleTheme}
                    style={{
                      background: "transparent",
                      border: "1px solid var(--line)",
                      color: "var(--paper)",
                      padding: "7px 16px",
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      transition: "all 0.3s"
                    }}
                    className="nash-btn-confirm"
                  >
                    {theme === "dark" ? "â˜€ï¸ Day Mode (White)" : "ðŸŒ™ Night Mode (Dark)"}
                  </button>
                </div>

                {user && (
                  <div style={{fontSize:11, color:"var(--muted)", display:"flex", alignItems:"center", gap:10}}>
                    <span>{user.displayName}</span>
                    <span>•</span>
                    <button onClick={handleLogout} style={{background:"transparent", border:"none", color:"var(--muted)", cursor:"pointer", fontSize:11, textDecoration:"underline"}} onMouseEnter={e => e.target.style.color="var(--paper)"} onMouseLeave={e => e.target.style.color="var(--muted)"}>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>

              {/* LEGAL POLICIES STRIP */}
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:14, borderTop:"1px solid var(--line)", paddingTop:16, marginTop:8}}>
                <div style={{display:"flex", alignItems:"center", flexWrap:"wrap", gap:14, fontSize:11, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.1em"}}>
                  <button onClick={() => openLegalModal('terms')} style={{background:"transparent", border:"none", color:"var(--muted)", cursor:"pointer", fontSize:11, padding:0}} onMouseEnter={e => e.target.style.color="var(--paper)"} onMouseLeave={e => e.target.style.color="var(--muted)"}>
                    Terms & Conditions
                  </button>
                  <span>•</span>
                  <button onClick={() => openLegalModal('privacy')} style={{background:"transparent", border:"none", color:"var(--muted)", cursor:"pointer", fontSize:11, padding:0}} onMouseEnter={e => e.target.style.color="var(--paper)"} onMouseLeave={e => e.target.style.color="var(--muted)"}>
                    Privacy Policy
                  </button>
                  <span>•</span>
                  <button onClick={() => openLegalModal('refund')} style={{background:"transparent", border:"none", color:"var(--muted)", cursor:"pointer", fontSize:11, padding:0, fontWeight:700}} onMouseEnter={e => e.target.style.color="var(--paper)"} onMouseLeave={e => e.target.style.color="var(--muted)"}>
                    Refund & Cancellation
                  </button>
                </div>
                <div style={{fontSize:10, color:"var(--muted)", fontFamily:"var(--body)", letterSpacing:"0.05em"}}>
                  No refund on booking cancellation (only ₹50 token money charged to reserve slot)
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <div style={S.stickyCta} className="nash-sticky-cta">
        <button style={S.stickyCall} onClick={() => window.location.href=`tel:${(settings.shopWhatsapp||"03001234567").replace(/[^0-9]/g,"")}`}>Call</button>
        <button style={S.stickyBook} onClick={scrollToBook} className="nash-cta-btn">Book</button>
      </div>

      {/* FLOATING SYSTEM TOAST */}
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
          <span>{toast.type === "error" ? "⚠️" : "✓"}</span>
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
        <span style={S.fieldLabel}>Select Date</span>
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
        <span style={S.fieldLabel}>Select Time</span>
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
        CONTINUE
      </button>
    </div>
  );
}

const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Alex+Brush&family=Inter:wght@200;300;400;500;600;700;800;900&display=swap');
:root{
  --ink:#F6F8FA;
  --surface:#FFFFFF;
  --surface-hover:#EDF2F7;
  --paper:#0A0F1A;
  --muted:#5B6B7F;
  --line:#E2E8F0;
  --display:"Inter",sans-serif;
  --body:"Inter",sans-serif;
  --card-shadow:0 12px 36px rgba(0,0,0,0.06);
  --prem-badge-bg:#0A0F1A;
  --prem-badge-color:#ffffff;
  --std-badge-bg:rgba(255, 255, 255, 0.95);
  --std-badge-color:#0A0F1A;
  --nav-bg:rgba(246,248,250,0.95);
  --star-color:#E5A93B;
  --star-empty:#CBD5E1;
}

body[data-theme="light"]{
  --ink:#F6F8FA;
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
  --nav-bg:rgba(246,248,250,0.95);
  --star-color:#E5A93B;
  --star-empty:#CBD5E1;
}

body[data-theme="dark"]{
  --ink:#050A12;
  --surface:#0C1220;
  --surface-hover:#131C30;
  --paper:#ffffff;
  --muted:#6C7D93;
  --line:#162234;
  --card-shadow:0 20px 60px rgba(0,0,0,0.7);
  --prem-badge-bg:#ffffff;
  --prem-badge-color:#000000;
  --std-badge-bg:rgba(5, 10, 18, 0.85);
  --std-badge-color:#ffffff;
  --nav-bg:rgba(5,10,18,0.95);
  --star-color:#E5A93B;
  --star-empty:#162234;
}

*{box-sizing:border-box;margin:0;padding:0;}
html{scroll-behavior:smooth;}
body{background:var(--ink);color:var(--paper);font-family:var(--body);-webkit-font-smoothing:antialiased;transition:background 0.35s ease, color 0.35s ease;}
::selection{background:var(--paper);color:var(--ink);}
::-webkit-scrollbar{width:4px;height:4px;}
::-webkit-scrollbar-track{background:var(--ink);}
::-webkit-scrollbar-thumb{background:var(--line);border-radius:0;}
::-webkit-scrollbar-thumb:hover{background:var(--muted);}

/* Premium Animations */
@keyframes nashReveal{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}
@keyframes nashFadeIn{from{opacity:0;}to{opacity:1;}}
@keyframes nashScaleIn{from{opacity:0;transform:scale(0.97);}to{opacity:1;transform:scale(1);}}
@keyframes nashSpin{to{transform:rotate(360deg);}}

.nash-expand-anim{animation:nashReveal 0.5s cubic-bezier(.16,1,.3,1);}
.nash-pass-reveal{animation:nashScaleIn 0.6s cubic-bezier(.16,1,.3,1);}
.nash-spinner{width:24px;height:24px;border-radius:50%;border:2px solid var(--line);border-top-color:var(--paper);animation:nashSpin 0.6s linear infinite;margin:0 auto;}

/* Card hover â€” buttery lift */
.nash-hs-hover{cursor:pointer;position:relative;transition:transform 0.5s cubic-bezier(.16,1,.3,1),box-shadow 0.5s cubic-bezier(.16,1,.3,1),border-color 0.4s;}
.nash-hs-hover img{transition:transform 6s cubic-bezier(0.05,1,0.3,1);}
.nash-hs-hover:hover{transform:translateY(-6px);box-shadow:var(--card-shadow);border-color:var(--paper) !important;}
.nash-hs-hover:hover img{transform:scale(1.05);}

/* Button hovers */
.nash-btn-confirm{transition:all 0.4s cubic-bezier(.16,1,.3,1) !important;}
.nash-btn-confirm:not(:disabled):hover{opacity:0.85 !important;transform:translateY(-1px);}
.nash-cta-btn{transition:all 0.4s cubic-bezier(.16,1,.3,1) !important;}
.nash-cta-btn:hover{opacity:0.85 !important;transform:translateY(-1px);}
.nash-date-chip{transition:all 0.3s cubic-bezier(.16,1,.3,1) !important;}
.nash-date-chip:not(:disabled):hover{border-color:var(--paper) !important;}
.nash-slot-hover{transition:all 0.3s cubic-bezier(.16,1,.3,1) !important;}
.nash-slot-hover:hover{border-color:var(--paper) !important;background:var(--surface-hover) !important;}
.nash-btn-ghost-hover{transition:all 0.4s cubic-bezier(.16,1,.3,1);}
.nash-btn-ghost-hover:hover{background:var(--surface-hover) !important;}
.nash-grid-row-hover:hover{background:rgba(255,255,255,0.03) !important;}

/* ==========================================================================
   DESKTOP ONLY STYLES (min-width: 861px)
   ========================================================================== */
@media (min-width: 861px) {
  .nash-sticky-cta {
    display: none !important; /* Hide mobile bottom CTA on PC completely */
  }
  .nash-dash-nav-wrap {
    max-width: 1100px;
    margin: 0 auto;
    padding: 18px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
  }
  .nash-dash-top-bar {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .nash-dash-tabs {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .nash-dash-tab-btn {
    white-space: nowrap;
    font-size: 11px;
    font-weight: 700;
    padding: 8px 18px;
    border-radius: 4px;
    cursor: pointer;
    letter-spacing: 0.08em;
    transition: all 0.3s;
  }
}

/* ==========================================================================
   MOBILE & TABLET STYLES (max-width: 860px)
   ========================================================================== */
@media (max-width: 860px) {
  .nash-sticky-cta {
    display: flex !important; /* Show mobile bottom CTA bar on phone only */
  }
  .nash-dash-nav-wrap {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    padding: 12px 14px;
    gap: 10px;
  }
  .nash-dash-top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }
  .nash-dash-tabs {
    display: flex;
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 4px;
    gap: 6px;
    scrollbar-width: none;
  }
  .nash-dash-tabs::-webkit-scrollbar {
    display: none;
  }
  .nash-dash-tab-btn {
    white-space: nowrap;
    flex-shrink: 0;
    padding: 7px 12px;
    font-size: 10.5px;
    font-weight: 700;
    border-radius: 4px;
  }
}
`;

const S = {
  hsGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:20},
  navBugatti:{position:"absolute",top:0,left:0,right:0,zIndex:100,display:"flex",justifyContent:"space-between",alignItems:"center",padding:"36px 44px",color:"#ffffff"},
  navSide:{display:"flex",alignItems:"center",gap:10,cursor:"pointer",color:"#ffffff",opacity:0.85,transition:"all 0.3s"},
  navCenterBugatti:{fontFamily:"var(--display)",fontSize:22,fontWeight:800,letterSpacing:"0.3em",textTransform:"uppercase",textAlign:"center",position:"absolute",left:"50%",transform:"translateX(-50%)",color:"#ffffff"},
  bagIcon:{width:14,height:16,border:"1px solid rgba(255,255,255,0.6)",position:"relative"},
  bagIconHandle:{position:"absolute",top:-4,left:3,width:6,height:4,borderTop:"1px solid rgba(255,255,255,0.6)",borderLeft:"1px solid rgba(255,255,255,0.6)",borderRight:"1px solid rgba(255,255,255,0.6)"},
  bugattiHero:{position:"relative",width:"100%",height:"100vh",background:"#000000",overflow:"hidden",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",paddingTop:0},
  bugattiImg:{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",opacity:1},
  bugattiTitle:{fontFamily:"'Alex Brush', cursive",fontSize:"clamp(72px,13vw,140px)",fontWeight:400,color:"#ffffff",zIndex:10,lineHeight:1.1,letterSpacing:"normal",textTransform:"none",textShadow:"0 10px 40px rgba(0,0,0,0.85)",marginTop:10},
  bugattiSub:{fontFamily:"var(--body)",fontSize:11,color:"rgba(255,255,255,0.85)",letterSpacing:"0.4em",textTransform:"uppercase",zIndex:10,marginTop:16,textAlign:"center",textShadow:"0 2px 10px rgba(0,0,0,0.8)"},
  bugattiBtn:{marginTop:36,zIndex:10,background:"rgba(0,0,0,0.3)",color:"#ffffff",border:"1px solid rgba(255,255,255,0.6)",padding:"16px 48px",fontSize:10,fontWeight:700,letterSpacing:"0.3em",textTransform:"uppercase",cursor:"pointer",backdropFilter:"blur(8px)",boxShadow:"0 4px 20px rgba(0,0,0,0.5)",transition:"all 0.5s cubic-bezier(.16,1,.3,1)"},

  body:{background:"var(--ink)",color:"var(--paper)",fontFamily:"var(--body)",minHeight:"100vh",paddingBottom:76,transition:"background 0.35s ease, color 0.35s ease"},
  wrap:{maxWidth:1100,margin:"0 auto",padding:"0 24px"},
  wrap_nav:{maxWidth:1100,margin:"0 auto",padding:"0 28px",display:"grid",gridTemplateColumns:"1fr auto 1fr",alignItems:"center",height:80},
  nav:{position:"sticky",top:0,zIndex:50,background:"var(--nav-bg)",backdropFilter:"blur(24px)",borderBottom:"1px solid var(--line)",transition:"all 0.4s"},
  brandNash:{fontFamily:"var(--display)",fontSize:22,letterSpacing:"0.3em",fontWeight:800,color:"var(--paper)"},
  navCta:{background:"var(--paper)",color:"var(--ink)",fontWeight:700,padding:"10px 24px",fontSize:11,border:"none",cursor:"pointer",letterSpacing:"0.15em",textTransform:"uppercase"},
  section:{padding:"100px 0"},
  sectionHead:{marginBottom:48},
  eyebrow:{fontFamily:"var(--body)",fontSize:11,letterSpacing:"0.3em",textTransform:"uppercase",color:"var(--muted)",marginBottom:16},
  sectionH2:{fontFamily:"var(--display)",fontWeight:800,fontSize:"clamp(32px,6vw,48px)",margin:0,letterSpacing:"0.08em",color:"var(--paper)",textTransform:"uppercase"},
  sectionP:{marginTop:16,color:"var(--muted)",fontSize:14,maxWidth:500,lineHeight:1.7,fontWeight:300},
  bookPanel:{background:"var(--surface)",overflow:"hidden"},
  bookBody:{padding:"36px 28px 44px"},
  fieldGroup:{marginBottom:36},
  fieldLabel:{fontFamily:"var(--body)",fontSize:11,letterSpacing:"0.2em",textTransform:"uppercase",color:"var(--muted)",marginBottom:16,display:"block",fontWeight:600},
  dateStrip:{display:"flex",gap:8,overflowX:"auto",paddingBottom:8},
  dateChip:{flexShrink:0,width:56,padding:"14px 0",textAlign:"center",border:"1px solid var(--line)",background:"transparent",color:"var(--paper)",cursor:"pointer"},
  dateChipSelected:{borderColor:"var(--paper)",background:"var(--paper)",color:"var(--ink)",fontWeight:700},
  dateChipDisabled:{opacity:0.15,cursor:"not-allowed"},
  dow:{fontFamily:"var(--body)",fontSize:9,color:"var(--muted)",display:"block",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.1em"},
  dnum:{fontFamily:"var(--display)",fontSize:20,fontWeight:700},
  slotGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(90px,1fr))",gap:6},
  slot:{padding:"12px 4px",textAlign:"center",border:"1px solid var(--line)",background:"transparent",color:"var(--paper)",fontFamily:"var(--body)",fontSize:12,cursor:"pointer",transition:"all 0.3s"},
  slotSelected:{borderColor:"var(--paper)",background:"var(--paper)",color:"var(--ink)",fontWeight:700},
  slotTaken:{opacity:0.15,textDecoration:"line-through",cursor:"not-allowed"},
  slotNote:{fontSize:12,color:"var(--muted)",marginTop:14,lineHeight:1.6},
  summaryBox:{background:"var(--surface)",padding:"20px 24px",marginBottom:24,border:"1px solid var(--line)"},
  summaryRow:{display:"flex",justifyContent:"space-between",fontSize:14,padding:"8px 0",color:"var(--muted)"},
  summaryTotal:{borderTop:"1px solid var(--line)",marginTop:8,paddingTop:12,fontWeight:700,color:"var(--paper)"},
  srKey:{color:"var(--muted)"},
  srVal:{fontFamily:"var(--body)",color:"var(--paper)",fontWeight:600},
  input:{width:"100%",background:"var(--surface)",border:"1px solid var(--line)",color:"var(--paper)",padding:"16px 20px",fontSize:14,fontFamily:"var(--body)",marginBottom:14,transition:"border-color 0.4s",outline:"none"},
  formRow:{display:"flex",flexDirection:"column"},
  btnConfirm:{width:"100%",background:"var(--paper)",color:"var(--ink)",fontWeight:700,padding:"18px",fontSize:12,border:"none",cursor:"pointer",textTransform:"uppercase",letterSpacing:"0.2em"},
  btnDisabled:{background:"var(--surface)",color:"var(--muted)",cursor:"not-allowed",border:"1px solid var(--line)"},
  btnGhostBtn:{background:"transparent",color:"var(--paper)",fontWeight:600,padding:"14px 24px",fontSize:11,border:"1px solid var(--line)",cursor:"pointer",letterSpacing:"0.2em",textTransform:"uppercase"},
  tokenPassCard:{background:"var(--surface)",color:"var(--paper)",padding:40,border:"1px solid var(--line)"},
  passHeader:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:32},
  passBrand:{fontFamily:"var(--display)",fontSize:22,fontWeight:800,letterSpacing:"0.2em",color:"var(--paper)",textTransform:"uppercase"},
  passSub:{fontFamily:"var(--body)",fontSize:10,color:"var(--muted)",letterSpacing:"0.3em",textTransform:"uppercase"},
  passBadge:{background:"var(--paper)",color:"var(--ink)",fontSize:9,fontWeight:700,padding:"5px 12px",letterSpacing:"0.15em",textTransform:"uppercase"},
  tokenBox:{padding:32,textAlign:"center",marginBottom:28,background:"var(--surface-hover)",border:"1px dashed var(--line)"},
  tokenLabel:{display:"block",fontFamily:"var(--body)",fontSize:10,color:"var(--muted)",textTransform:"uppercase",letterSpacing:"0.25em"},
  tokenVal:{display:"block",fontFamily:"var(--display)",fontSize:42,color:"var(--paper)",letterSpacing:"0.25em",margin:"16px 0",fontWeight:800},
  tokenNote:{display:"block",fontSize:11,color:"var(--muted)"},
  confirmDetail:{padding:"20px 0",fontSize:14,lineHeight:2},
  cdRow:{display:"flex",justifyContent:"space-between",padding:"6px 0",color:"var(--muted)",borderBottom:"1px solid var(--line)"},
  passActions:{marginTop:36,display:"flex",flexDirection:"column",gap:10},
  btnWhatsApp:{display:"block",width:"100%",textAlign:"center",background:"#25D366",color:"#ffffff",fontWeight:700,padding:"16px",fontSize:11,textDecoration:"none",textTransform:"uppercase",letterSpacing:"0.2em"},
  btnPrint:{width:"100%",background:"transparent",color:"var(--paper)",fontWeight:600,padding:"16px",fontSize:11,border:"1px solid var(--line)",cursor:"pointer",textTransform:"uppercase",letterSpacing:"0.2em"},
  footGrid:{display:"flex",flexDirection:"column",gap:28},
  footBrand:{fontFamily:"var(--display)",fontSize:22,fontWeight:800,letterSpacing:"0.3em",color:"var(--paper)",textTransform:"uppercase"},
  footAddr:{fontSize:13,color:"var(--muted)",marginTop:10,lineHeight:1.8},
  footHours:{fontFamily:"var(--body)",fontSize:12,color:"var(--muted)",lineHeight:2.2},
  footOwnerBtn:{background:"transparent",border:"none",padding:"8px 0",fontSize:11,color:"var(--muted)",cursor:"pointer",fontWeight:400,letterSpacing:"0.1em",transition:"color 0.3s"},
  stickyCta:{position:"fixed",bottom:0,left:0,right:0,zIndex:60,background:"var(--nav-bg)",backdropFilter:"blur(24px)",borderTop:"1px solid var(--line)",padding:"12px 16px",display:"flex",gap:8},
  stickyCall:{flex:1,border:"1px solid var(--line)",background:"transparent",color:"var(--paper)",padding:14,fontWeight:600,fontSize:11,cursor:"pointer",textTransform:"uppercase",letterSpacing:"0.15em"},
  stickyBook:{flex:1,border:"none",background:"var(--paper)",color:"var(--ink)",padding:14,fontWeight:700,fontSize:11,cursor:"pointer",textTransform:"uppercase",letterSpacing:"0.15em"},
  loginWrap:{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:20,position:"relative",overflow:"hidden",background:"var(--surface)"},
  loginBox:{width:"100%",maxWidth:400,border:"1px solid var(--line)",padding:44,background:"var(--surface)",position:"relative",zIndex:1},
  /* Admin dashboard styles preserved */
  dashDateTabs:{display:"flex",gap:12,overflowX:"auto",paddingBottom:8,marginBottom:32},
  dashDateTab:{flexShrink:0,minWidth:68,padding:"12px 8px",textAlign:"center",border:"1px solid var(--line)",background:"var(--surface)",color:"var(--paper)",cursor:"pointer",position:"relative",display:"flex",flexDirection:"column",alignItems:"center",gap:4,borderRadius:4},
  dashDateTabSelected:{borderColor:"var(--paper)",background:"var(--surface-hover)",boxShadow:"0 0 0 1px var(--paper)"},
  dashDateTabSunday:{opacity:0.25,cursor:"not-allowed"},
  dashTabDow:{fontFamily:"var(--body)",fontSize:10,color:"var(--muted)",textTransform:"uppercase",letterSpacing:"0.1em"},
  dashTabDate:{fontFamily:"var(--display)",fontSize:20,fontWeight:700,color:"var(--paper)"},
  dashTabBadge:{position:"absolute",top:-8,right:-8,background:"var(--paper)",color:"var(--ink)",fontSize:10,fontWeight:700,padding:"2px 6px",borderRadius:10},
  dashTabClosed:{fontFamily:"var(--body)",fontSize:9,color:"#ff4d4d",letterSpacing:"0.1em",textTransform:"uppercase"},
  dashDayHeader:{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:16,marginBottom:24},
  dashDayTitle:{fontFamily:"var(--display)",fontSize:24,fontWeight:700,color:"var(--paper)",letterSpacing:"-0.01em"},
  dashDayStats:{display:"flex",gap:12,flexWrap:"wrap"},
  dashStatPill:{fontFamily:"var(--body)",fontSize:11,fontWeight:600,padding:"6px 14px",background:"var(--surface)",color:"var(--paper)",border:"1px solid var(--line)",letterSpacing:"0.1em",textTransform:"uppercase",borderRadius:20},
  timeGrid:{border:"1px solid var(--line)",background:"var(--surface)",overflow:"hidden"},
  timeGridHeader:{display:"grid",gridTemplateColumns:"100px 100px 1fr",background:"var(--surface-hover)",color:"var(--muted)",fontFamily:"var(--body)",fontSize:10,letterSpacing:"0.15em",textTransform:"uppercase",padding:"14px 0",borderBottom:"1px solid var(--line)"},
  timeGridHeaderTime:{padding:"0 20px",borderRight:"1px solid var(--line)"},
  timeGridHeaderStatus:{padding:"0 20px",borderRight:"1px solid var(--line)"},
  timeGridHeaderDetails:{padding:"0 20px"},
  timeGridRow:{display:"grid",gridTemplateColumns:"100px 100px 1fr",borderBottom:"1px solid var(--line)",minHeight:56,alignItems:"stretch",transition:"background 0.3s"},
  timeGridHourMark:{borderTop:"2px solid var(--line)"},
  timeGridRowFree:{background:"transparent"},
  timeGridRowBooked:{background:"var(--surface-hover)"},
  timeGridRowPremium:{background:"var(--surface-hover)"},
  timeGridTimeCol:{padding:"12px 20px",borderRight:"1px solid var(--line)",display:"flex",flexDirection:"column",justifyContent:"center",position:"relative"},
  timeGridTimeLabel:{fontFamily:"var(--body)",fontSize:12,color:"var(--muted)",letterSpacing:"0.05em"},
  timeGridHourLabel:{fontWeight:700,color:"var(--paper)",fontSize:14},
  timeGridHourDot:{display:"none"},
  timeGridStatusCol:{padding:"12px 20px",borderRight:"1px solid var(--line)",display:"flex",alignItems:"center",justifyContent:"flex-start"},
  timeGridDetailsCol:{padding:"12px 20px",display:"flex",alignItems:"flex-start",flexDirection:"column",justifyContent:"center"},
  statusBadgeFree:{fontFamily:"var(--body)",fontSize:10,fontWeight:500,color:"var(--muted)",background:"var(--surface-hover)",padding:"4px 10px",letterSpacing:"0.1em",textTransform:"uppercase"},
  statusBadgeStd:{fontFamily:"var(--body)",fontSize:10,fontWeight:600,color:"var(--paper)",background:"var(--surface-hover)",border:"1px solid var(--line)",padding:"4px 10px",letterSpacing:"0.1em",textTransform:"uppercase"},
  statusBadgePremium:{fontFamily:"var(--body)",fontSize:10,fontWeight:700,color:"var(--ink)",background:"var(--paper)",padding:"4px 10px",letterSpacing:"0.1em",textTransform:"uppercase"},
  statusLiveLabel:{fontFamily:"var(--body)",fontSize:9,color:"#ff4d4d",letterSpacing:"0.15em",textTransform:"uppercase"},
  gridCustName:{fontFamily:"var(--display)",fontSize:16,fontWeight:700,color:"var(--paper)",letterSpacing:"0.02em"},
  gridTokenBadge:{fontFamily:"var(--body)",fontSize:10,fontWeight:600,color:"var(--paper)",background:"var(--surface)",padding:"3px 8px",border:"1px solid var(--line)"},
  gridDuration:{fontFamily:"var(--body)",fontSize:11,color:"var(--muted)",background:"var(--surface)",padding:"3px 8px",border:"1px solid var(--line)"},
  gridContinued:{fontFamily:"var(--body)",fontSize:11,color:"var(--muted)",fontStyle:"italic"},
  gridFreeSlot:{fontFamily:"var(--body)",fontSize:12,color:"var(--muted)"},
  gridExpandDetails:{marginTop:12,padding:"16px 20px",background:"var(--surface-hover)",border:"1px solid var(--line)",fontSize:14},
  gridExpandRow:{display:"flex",gap:12,padding:"6px 0",borderBottom:"1px dashed var(--line)",justifyContent:"space-between",color:"var(--muted)"},
  gridWaBtn:{background:"#25D366",color:"#ffffff",border:"none",padding:"10px 18px",fontSize:11,fontWeight:700,cursor:"pointer",letterSpacing:"0.1em",textTransform:"uppercase"},
  gridPrintBtn:{background:"var(--paper)",color:"var(--ink)",border:"none",padding:"10px 18px",fontSize:11,fontWeight:700,cursor:"pointer",letterSpacing:"0.1em",textTransform:"uppercase"},
};
