import { useState, useEffect, useRef } from "react";
import {
  subscribeToBookingsForDate,
  subscribeToAllBookings,
  createBookingWithTransaction,
  subscribeToHairstyles,
  saveHairstyle,
  deleteHairstyle,
  resetHairstylesToDefault,
  subscribeToSiteSettings,
  saveSiteSettings,
  subscribeToCustomCSS,
  saveCustomCSS,
  isFirebaseConfigured,
  subscribeToAuth,
  loginWithGoogle,
  loginDirectCustomer,
  logoutUser,
  saveFeedback,
  saveReview,
  subscribeToReviews
} from "./firebase";
import FeedbackModal from "./FeedbackModal";


// =========================================================================
// ONLINE ADVANCE PAYMENT SYSTEM TOGGLE
// Set this to `true` to re-enable UPI QR code advance booking fee payment.
// Set this to `false` (current) to allow 100% direct booking with 0 advance fee.
// =========================================================================
const ENABLE_ONLINE_PAYMENT = false; // <<< CHANGE TO `true` TO ACTIVATE UPI ADVANCE PAYMENT

const BUFFER = 5;
const OWNER_PASSWORD = "nash2024";
const WORK_START = 11 * 60;
const WORK_END   = 23 * 60;
const ROW_STEP   = 30;

const DEFAULT_SETTINGS = {
  studioName: "Nash Studio",
  heroTagline: "PRECISION GROOMING. BINA INTEZAAR KE.",
  heroButtonText: "",
  heroVideoUrl: "/video/hero.mp4",
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
  const [view, setView] = useState("site");
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

  return view === "dashboard"
    ? <DevAdminDashboard onBack={() => setView("site")} hairstyles={hairstyles} settings={settings} customCss={customCss} />
    : <SiteView onOwner={() => setView("dashboard")} hairstyles={hairstyles} settings={settings} user={user} setUser={setUser} />;
}

/* FloatingParticles removed — clean design */

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

function SiteView({ onOwner, hairstyles, settings, user, setUser }) {
  const [step, setStep] = useState(1);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [searchQ, setSearchQ] = useState("");
  const [filterT, setFilterT] = useState("all");
  const [expandedGallery, setExpandedGallery] = useState(false);
  const [dateIndex, setDateIndex] = useState(0);
  const [slot, setSlot] = useState(null);
  const [name, setName] = useState(user ? user.displayName : "");
  const [phone, setPhone] = useState(user?.phoneNumber || "");
  const [done, setDone] = useState(null);
  const [saving, setSaving] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
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

  // Auto-fill name if user logs in
  useEffect(() => {
    if (user && user.displayName && !name) {
      setName(user.displayName);
    }
  }, [user]);

  async function handleGoogleAuth() {
    setAuthLoading(true);
    try {
      const u = await loginWithGoogle();
      if (u) {
        setUser(u);
        if (u.displayName) setName(u.displayName);
      }
    } catch (err) {
      alert(err.message || "Google sign-in fail ho gaya.");
    } finally {
      setAuthLoading(false);
    }
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

  const bookingFee = Number(settings.bookingFee || 50);
  const remainingDue = Math.max(0, totalPrice - bookingFee);

  function scrollToBook() { bookRef.current?.scrollIntoView({ behavior: "smooth" }); }
  function goStep(n) { setStep(n); setTimeout(() => bookRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50); }

  async function confirmBooking() {
    if (!name.trim() || !phone.trim()) { 
      alert("Naam aur mobile number zaroor darj karein."); 
      return; 
    }
    if (!user) {
      const directUser = loginDirectCustomer(name.trim(), phone.trim());
      setUser(directUser);
    }
    if (!slot) { alert("Slot select karein."); return; }
    if (ENABLE_ONLINE_PAYMENT && !txnId.trim()) {
      alert("Please UPI / Online Payment ka Transaction ID / UTR number enter karein.");
      return;
    }
    setSaving(true);
    const d = dates[dateIndex];
    const bookingToken = "NS-" + Math.floor(100000 + Math.random() * 900000);
    const activeBookingFee = ENABLE_ONLINE_PAYMENT ? Number(settings.bookingFee || 50) : 0;
    const activeRemainingDue = Math.max(0, totalPrice - activeBookingFee);
    const activePaymentStatus = ENABLE_ONLINE_PAYMENT ? "Paid Advance" : "Pay at Salon";
    const activePaymentMethod = ENABLE_ONLINE_PAYMENT ? "UPI / Online QR" : "Pay in Person at Salon";
    const activeTxnId = ENABLE_ONLINE_PAYMENT ? txnId.trim() : "Pay at Salon";

    const payload = {
      token: bookingToken,
      name: name.trim(),
      phone: phone.trim(),
      userEmail: user.email || "",
      userUid: user.uid || "",
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
                    <button onClick={() => setSearchQ("")} style={{position:"absolute",right:0,top:"50%",transform:"translateY(-50%)",background:"transparent",border:"none",color:"var(--muted)",cursor:"pointer",fontSize:11}}>✕</button>
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
                                Rs {Number(h.price||0).toLocaleString()} <span style={{fontSize:11, color:"rgba(255,255,255,0.65)", fontWeight:400}}>• {h.time}m</span>
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
                    <div style={{fontSize:11, color:"var(--muted)", marginTop:2}}>Rs {selectedStyle?.price} • {selectedStyle?.time}m session</div>
                  </div>
                </div>
                <button onClick={() => goStep(1)} style={{background:"transparent", border:"none", color:"var(--muted)", fontSize:11, letterSpacing:"0.15em", cursor:"pointer", textTransform:"uppercase", padding:"6px 0", transition:"color 0.3s"}} onMouseEnter={e => e.target.style.color="var(--paper)"} onMouseLeave={e => e.target.style.color="var(--muted)"}>
                  ← CHANGE
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

                    {!user ? (
                      /* STEP 3 AUTH GATE: SIGN IN WITH GOOGLE OR FAST NAME & PHONE */
                      <div style={{
                        textAlign: "center",
                        padding: "32px 20px",
                        background: "var(--surface)",
                        border: "1px solid var(--line)",
                        marginBottom: 20
                      }} className="nash-expand-anim">
                        <div style={{
                          fontFamily: "var(--display)",
                          fontSize: 16,
                          fontWeight: 700,
                          color: "var(--paper)",
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          marginBottom: 8
                        }}>
                          Sign In to Confirm Appointment
                        </div>
                        <p style={{
                          fontSize: 12,
                          color: "var(--muted)",
                          maxWidth: 360,
                          margin: "0 auto 20px",
                          lineHeight: 1.6
                        }}>
                          Choose Google Sign-In or quickly enter your Name & Mobile Number below to get your Token Pass.
                        </p>

                        <button
                          type="button"
                          onClick={handleGoogleAuth}
                          disabled={authLoading}
                          style={{
                            width: "100%",
                            maxWidth: 340,
                            background: "var(--paper)",
                            color: "var(--ink)",
                            fontWeight: 700,
                            padding: "16px 24px",
                            fontSize: 11,
                            border: "1px solid var(--line)",
                            cursor: "pointer",
                            textTransform: "uppercase",
                            letterSpacing: "0.15em",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 12,
                            transition: "all 0.3s",
                            marginBottom: 20
                          }}
                          className="nash-btn-confirm"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"/>
                            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                          </svg>
                          {authLoading ? "CONNECTING..." : "SIGN IN WITH GOOGLE"}
                        </button>

                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          margin: "0 auto 20px",
                          maxWidth: 340
                        }}>
                          <div style={{flex: 1, height: 1, background: "var(--line)"}} />
                          <span style={{fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.15em"}}>OR FAST SIGN IN</span>
                          <div style={{flex: 1, height: 1, background: "var(--line)"}} />
                        </div>

                        <div style={{maxWidth: 340, margin: "0 auto", textAlign: "left"}}>
                          <input
                            style={{...S.input, marginBottom: 10}}
                            type="text"
                            placeholder="Your Full Name *"
                            value={name}
                            onChange={e => setName(e.target.value)}
                          />
                          <input
                            style={{...S.input, marginBottom: 14}}
                            type="tel"
                            placeholder="Mobile Number (e.g. 03001234567) *"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!name.trim() || !phone.trim()) {
                                alert("Naam aur mobile number zaroor enter karein.");
                                return;
                              }
                              const u = loginDirectCustomer(name.trim(), phone.trim());
                              setUser(u);
                            }}
                            style={{
                              width: "100%",
                              background: "var(--surface-hover)",
                              color: "var(--paper)",
                              border: "1px solid var(--line)",
                              padding: "14px",
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: "pointer",
                              letterSpacing: "0.15em",
                              textTransform: "uppercase"
                            }}
                          >
                            CONTINUE WITH NAME & MOBILE →
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* USER IS LOGGED IN -> ENTER DETAILS & BOOK APPOINTMENT */
                      <div className="nash-expand-anim">
                        <div style={S.fieldGroup}>
                          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14}}>
                            <span style={{...S.fieldLabel, margin:0}}>Customer Details</span>
                            <span style={{fontSize:11, color:"var(--muted)", display:"flex", alignItems:"center", gap:8}}>
                              <span style={{color:"#25D366", fontSize:12}}>●</span>
                              {user.displayName}
                            </span>
                          </div>

                          <div style={S.formRow}>
                            <input style={S.input} type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} />
                            <input style={S.input} type="tel" placeholder="Mobile Number (e.g. 03001234567)" value={phone} onChange={e => setPhone(e.target.value)} />
                          </div>
                        </div>

                        {/* =========================================================================
                            ONLINE ADVANCE PAYMENT GATEWAY COMPONENT (CURRENTLY DISABLED)
                            To re-enable: Set `ENABLE_ONLINE_PAYMENT = true` at top of App.jsx
                            This section contains Dynamic UPI QR Code, UPI ID Copy, Mobile Intent,
                            and 12-digit UTR verification.
                            ========================================================================= */}
                        {ENABLE_ONLINE_PAYMENT && (
                          <div style={{
                            background:"rgba(255,255,255,0.02)",
                            border:"1px solid var(--line)",
                            padding:"28px 24px",
                            marginBottom:24
                          }}>
                            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16}}>
                              <span style={{...S.fieldLabel, margin:0, color:"var(--paper)", fontSize:12, fontWeight:700}}>
                                Pay Booking Fee: Rs {bookingFee}
                              </span>
                              <span style={{fontSize:9, background:"var(--prem-badge-bg)", color:"var(--prem-badge-color)", fontWeight:800, padding:"3px 8px", letterSpacing:"0.15em", textTransform:"uppercase"}}>
                                ADVANCE
                              </span>
                            </div>

                            <p style={{fontSize:12, color:"var(--muted)", marginBottom:20, lineHeight:1.5}}>
                              Scan the QR code with any UPI app (GPay, PhonePe, Paytm) or transfer to the UPI ID. Once paid, enter your 12-digit Transaction ID (UTR) below to generate your Token Pass.
                            </p>

                            <div style={{
                              display:"flex",
                              flexDirection: "column",
                              alignItems: "center",
                              gap: 16,
                              padding: "20px",
                              background: "var(--surface)",
                              border: "1px solid var(--line)",
                              marginBottom: 20
                            }}>
                              {/* DYNAMIC UPI QR CODE */}
                              <div style={{background:"#ffffff", padding:12, borderRadius:4, display:"inline-block", border:"1px solid var(--line)"}}>
                                <img
                                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`upi://pay?pa=${settings.upiId||"nashstudio@upi"}&pn=${encodeURIComponent(settings.studioName||"Nash Studio")}&am=${bookingFee}&cu=INR`)}`}
                                  alt="Payment QR Code"
                                  style={{width:160, height:160, display:"block"}}
                                />
                              </div>

                              <div style={{textAlign:"center", width:"100%"}}>
                                <div style={{fontSize:11, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:4}}>UPI ID</div>
                                <div style={{
                                  display:"flex",
                                  alignItems:"center",
                                  justifyContent:"center",
                                  gap:10,
                                  background:"var(--surface-hover)",
                                  padding:"8px 14px",
                                  border:"1px solid var(--line)",
                                  maxWidth:280,
                                  margin:"0 auto"
                                }}>
                                  <span style={{fontFamily:"var(--mono)", fontSize:12, fontWeight:600, color:"var(--paper)"}}>{settings.upiId || "nashstudio@upi"}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(settings.upiId || "nashstudio@upi");
                                      setCopiedUpi(true);
                                      setTimeout(() => setCopiedUpi(false), 2000);
                                    }}
                                    style={{background:"transparent", border:"none", color:"var(--paper)", fontSize:11, cursor:"pointer", textDecoration:"underline"}}
                                  >
                                    {copiedUpi ? "COPIED!" : "COPY"}
                                  </button>
                                </div>

                                {/* MOBILE UPI APP LAUNCHER */}
                                <div style={{marginTop:12}}>
                                  <a
                                    href={`upi://pay?pa=${settings.upiId||"nashstudio@upi"}&pn=${encodeURIComponent(settings.studioName||"Nash Studio")}&am=${bookingFee}&cu=INR`}
                                    style={{
                                      fontSize:11,
                                      color:"var(--paper)",
                                      textDecoration:"underline",
                                      letterSpacing:"0.05em",
                                      fontWeight:600
                                    }}
                                  >
                                    ⚡ Tap to Pay via UPI App (Mobile)
                                  </a>
                                </div>
                              </div>
                            </div>

                            {/* TRANSACTION ID INPUT */}
                            <div>
                              <label style={{...S.fieldLabel, marginBottom:8}}>
                                Transaction ID / UTR Number *
                              </label>
                              <input
                                style={{...S.input, marginBottom:4}}
                                type="text"
                                placeholder="e.g. 12-digit UTR (482910394820)"
                                value={txnId}
                                onChange={e => setTxnId(e.target.value)}
                              />
                              <span style={{fontSize:11, color:"var(--muted)", display:"block", marginTop:4}}>
                                Payment receipt se UTR number ya Reference ID yahan enter karein.
                              </span>
                            </div>
                          </div>
                        )}

                        <button style={S.btnConfirm} className="nash-btn-confirm" onClick={confirmBooking} disabled={saving}>
                          {saving ? "CONFIRMING APPOINTMENT..." : (ENABLE_ONLINE_PAYMENT ? `CONFIRM BOOKING (RS ${bookingFee} PAID)` : "CONFIRM APPOINTMENT")}
                        </button>
                      </div>
                    )}
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
                          <span key={s} style={{fontSize:13,color:s <= (r.rating||0) ? "var(--star-color, #E5A93B)" : "var(--star-empty, var(--line))"}}>★</span>
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
                        >★</span>
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
                <div>Mon-Sat • {settings.monSatHours || "11:00 AM to 11:00 PM"}</div>
                <div>Sunday • {settings.sundayHours || "Closed"}</div>
                <div>{settings.phoneDisplay || "0300-1234567"}</div>
              </div>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:16, borderTop:"1px solid var(--line)", paddingTop:20}}>
                <div style={{display:"flex", alignItems:"center", gap:16}}>
                  <button onClick={onOwner} style={S.footOwnerBtn}>
                    Staff Portal
                  </button>

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
                    {theme === "dark" ? "☀️ Day Mode (White)" : "🌙 Night Mode (Dark)"}
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
            </div>
          </Reveal>
        </div>
      </section>

      <div style={S.stickyCta} className="nash-sticky-cta">
        <button style={S.stickyCall} onClick={() => window.location.href=`tel:${(settings.shopWhatsapp||"03001234567").replace(/[^0-9]/g,"")}`}>Call</button>
        <button style={S.stickyBook} onClick={scrollToBook} className="nash-cta-btn">Book</button>
      </div>
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

/**
 * ====================================================================
 * DEVELOPER / STUDIO ADMIN CMS DASHBOARD
 * Live Management of:
 * 1. Hairstyles & Pricing (Add, Edit, Delete, Photos)
 * 2. Site Content & Settings (Studio Info, WhatsApp, Timings, Hero)
 * 3. Daily Bookings & Schedule Management
 * 4. Custom CSS Code Editor (Live UI Customization)
 * ====================================================================
 */
function DevAdminDashboard({ onBack, hairstyles, settings, customCss }) {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [activeTab, setActiveTab] = useState("hairstyles"); // 'hairstyles' | 'settings' | 'bookings' | 'customcss'
  const [toast, setToast] = useState("");

  // Custom CSS Editor states
  const [customCssCode, setCustomCssCode] = useState("");
  const [customCssSaving, setCustomCssSaving] = useState(false);
  const [cssPreviewOpen, setCssPreviewOpen] = useState(false);

  // Booking schedule states
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));

  // Hairstyle form / modal states
  const [editingStyle, setEditingStyle] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState("premium");
  const [formPrice, setFormPrice] = useState(1500);
  const [formTime, setFormTime] = useState(60);
  const [formDesc, setFormDesc] = useState("");
  const [formImg, setFormImg] = useState("");

  // Settings form states
  const [settName, setSettName] = useState(settings.studioName || "Nash Studio");
  const [settTagline, setSettTagline] = useState(settings.heroTagline || "PRECISION GROOMING. BINA INTEZAAR KE.");
  const [settBtnText, setSettBtnText] = useState(settings.heroButtonText || "DISCOVER PURE BEAUTY");
  const [settVideoUrl, setSettVideoUrl] = useState(settings.heroVideoUrl || "/video/hero.mp4");
  const [settWa, setSettWa] = useState(settings.shopWhatsapp || "923001234567");
  const [settPhone, setSettPhone] = useState(settings.phoneDisplay || "0300-1234567");
  const [settAddress, setSettAddress] = useState(settings.address || "Shop 12, Main Boulevard, Gulberg, Lahore");
  const [settMonSat, setSettMonSat] = useState(settings.monSatHours || "11:00 AM to 11:00 PM");
  const [settSun, setSettSun] = useState(settings.sundayHours || "Closed");
  const [settBookingFee, setSettBookingFee] = useState(settings.bookingFee || 50);
  const [settUpiId, setSettUpiId] = useState(settings.upiId || "nashstudio@upi");
  const [settAccTitle, setSettAccTitle] = useState(settings.accountTitle || "Nash Studio");

  useEffect(() => {
    setSettName(settings.studioName || "Nash Studio");
    setSettTagline(settings.heroTagline || "PRECISION GROOMING. BINA INTEZAAR KE.");
    setSettBtnText(settings.heroButtonText || "DISCOVER PURE BEAUTY");
    setSettVideoUrl(settings.heroVideoUrl || "/video/hero.mp4");
    setSettWa(settings.shopWhatsapp || "923001234567");
    setSettPhone(settings.phoneDisplay || "0300-1234567");
    setSettAddress(settings.address || "Shop 12, Main Boulevard, Gulberg, Lahore");
    setSettMonSat(settings.monSatHours || "11:00 AM to 11:00 PM");
    setSettSun(settings.sundayHours || "Closed");
    setSettBookingFee(settings.bookingFee || 50);
    setSettUpiId(settings.upiId || "nashstudio@upi");
    setSettAccTitle(settings.accountTitle || "Nash Studio");
  }, [settings]);

  useEffect(() => {
    if (!authed) return;
    setLoading(true);
    const unsub = subscribeToAllBookings((all) => { setBookings(all); setLoading(false); });
    return () => { if (typeof unsub === "function") unsub(); };
  }, [authed]);

  // Sync CSS from parent prop whenever it changes (live Firebase updates)
  useEffect(() => {
    setCustomCssCode(customCss || "");
  }, [customCss]);

  async function handleSaveCustomCSS() {
    setCustomCssSaving(true);
    try {
      await saveCustomCSS(customCssCode);
      showToast("🎨 Custom CSS live website par apply ho gayi!");
    } catch (e) {
      showToast("⚠️ CSS save karne mein error aa gaya.");
    } finally {
      setCustomCssSaving(false);
    }
  }

  function handleClearCustomCSS() {
    if (confirm("Kya aap saari Custom CSS hata dena chahte hain? Website default design par wapas aa jayegi.")) {
      setCustomCssCode("");
      saveCustomCSS("").then(() => showToast("🗑️ Custom CSS clear kar di gayi."));
    }
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  }

  function login(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (pw === OWNER_PASSWORD) { setAuthed(true); setErr(""); }
    else setErr("Password ghalat hai. (Default: nash2024)");
  }

  // --- HAIRSTYLE ACTIONS ---
  function openAddModal() {
    setEditingStyle(null);
    setFormName("");
    setFormType("premium");
    setFormPrice(1500);
    setFormTime(60);
    setFormDesc("");
    setFormImg("/images/10-messy-spiky-undercut-for-men.webp");
    setIsModalOpen(true);
  }

  function openEditModal(h) {
    setEditingStyle(h);
    setFormName(h.name || "");
    setFormType(h.type || "premium");
    setFormPrice(h.price || 1500);
    setFormTime(h.time || 60);
    setFormDesc(h.desc || "");
    setFormImg(h.img || "");
    setIsModalOpen(true);
  }

  async function handleSaveStyle(e) {
    e.preventDefault();
    if (!formName.trim()) { alert("Hairstyle name zaroori hai!"); return; }
    
    const payload = {
      id: editingStyle ? editingStyle.id : `hs_${Date.now()}`,
      name: formName.trim(),
      type: formType,
      price: Number(formPrice) || 0,
      time: Number(formTime) || (formType === "premium" ? 60 : 30),
      desc: formDesc.trim(),
      img: formImg.trim() || "/images/Soft-fade-edit.webp"
    };

    await saveHairstyle(payload);
    setIsModalOpen(false);
    showToast(editingStyle ? "✅ Style details live update ho gayi hain!" : "✨ Nayi Hairstyle live add ho gayi!");
  }

  async function handleDeleteStyle(h) {
    if (confirm(`Kya aap waqai "${h.name}" ko website se delete karna chahte hain?`)) {
      await deleteHairstyle(h.id);
      showToast("🗑️ Hairstyle delete kar di gayi.");
    }
  }

  async function handleQuickPriceChange(h, newPrice) {
    const p = Number(newPrice);
    if (!isNaN(p) && p > 0) {
      await saveHairstyle({ ...h, price: p });
      showToast(`💰 ${h.name} ki price Rs ${p} update ho gayi!`);
    }
  }

  async function handleResetCatalog() {
    if (confirm("Kya aap default 18 curated hairstyles wapas restore karna chahte hain?")) {
      await resetHairstylesToDefault(DEFAULT_HAIRSTYLES);
      showToast("↺ Default catalog restore ho gaya!");
    }
  }

  function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormImg(reader.result);
      };
      reader.readAsDataURL(file);
    }
  }

  // --- SETTINGS ACTIONS ---
  function handleVideoUpload(e) {
    const file = e.target.files[0];
    if (file) {
      const videoBlobUrl = URL.createObjectURL(file);
      setSettVideoUrl(videoBlobUrl);
      showToast("🎥 Video upload ho gayi (Preview niche dekhein)!");
    }
  }

  async function handleSaveSettings(e) {
    e.preventDefault();
    const payload = {
      studioName: settName.trim() || "Nash Studio",
      heroTagline: settTagline.trim(),
      heroButtonText: settBtnText.trim(),
      heroVideoUrl: settVideoUrl.trim() || "/video/hero.mp4",
      shopWhatsapp: settWa.trim(),
      phoneDisplay: settPhone.trim(),
      address: settAddress.trim(),
      monSatHours: settMonSat.trim(),
      sundayHours: settSun.trim(),
      bookingFee: Number(settBookingFee) || 50,
      upiId: settUpiId.trim() || "nashstudio@upi",
      accountTitle: settAccTitle.trim() || "Nash Studio",
    };

    await saveSiteSettings(payload);
    showToast("💾 Studio Settings & Payment info live update ho gayi hain!");
  }

  if (!authed) {
    return (
      <div style={S.body}>
        <style>{GLOBAL_CSS}</style>
        <div style={S.loginWrap}>
          <div style={S.loginBox}>
            <div style={{textAlign:"center", marginBottom:28}}>
              <div style={{fontFamily:"var(--display)", fontSize:20, fontWeight:700, letterSpacing:"0.25em", color:"var(--paper)", textTransform:"uppercase"}}>NASH STUDIO</div>
              <div style={{fontSize:10, color:"var(--muted)", letterSpacing:"0.3em", textTransform:"uppercase", marginTop:8}}>STAFF PORTAL</div>
            </div>
            
            <form onSubmit={login}>
              <input 
                style={{...S.input, marginBottom:16}} 
                type="password" 
                placeholder="Access Password" 
                value={pw}
                onChange={e => setPw(e.target.value)} 
                autoFocus
              />
              {err && <p style={{color:"#ff4d4d", fontSize:11, marginTop:-8, marginBottom:16, textAlign:"center"}}>{err}</p>}
              <button type="submit" style={S.btnConfirm} className="nash-btn-confirm">
                ENTER DASHBOARD
              </button>
            </form>

            <button onClick={onBack} style={{...S.btnGhostBtn, marginTop:12, width:"100%", textAlign:"center"}}>
              ← BACK TO SITE
            </button>
            <p style={{fontSize:11, color:"var(--muted)", marginTop:20, textAlign:"center", letterSpacing:"0.05em"}}>Default Password: <code style={{color:"var(--paper)", background:"var(--surface-hover)", padding:"2px 6px", border:"1px solid var(--line)"}}>nash2024</code></p>

            {/* ChuruOne Master Dukandar OS Link */}
            <div style={{marginTop:24, paddingTop:16, borderTop:"1px solid var(--line)", textAlign:"center"}}>
              <div style={{fontSize:10, color:"#d4af37", fontWeight:700, letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:8}}>
                CHURU ONE MERCHANT OS
              </div>
              <a 
                href="https://churuone.in/admin?storeId=nash-studio" 
                target="_blank" 
                rel="noreferrer"
                style={{
                  display:"flex",
                  alignItems:"center",
                  justifyContent:"center",
                  gap:8,
                  padding:"10px 14px",
                  borderRadius:6,
                  background:"linear-gradient(135deg, #1e3a8a, #2563eb)",
                  color:"#ffffff",
                  fontSize:11,
                  fontWeight:700,
                  letterSpacing:"0.05em",
                  textDecoration:"none",
                  boxShadow:"0 2px 10px rgba(37,99,235,0.3)"
                }}
              >
                <span>🚀 OPEN CHURUONE MASTER PORTAL</span>
              </a>
              <div style={{fontSize:10, color:"var(--muted)", marginTop:8, lineHeight:1.4}}>
                Store ID: <strong style={{color:"var(--paper)"}}>nash-studio</strong> • User: <strong style={{color:"var(--paper)"}}>nash_studio</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const dateTabs = Array.from({ length: 10 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i); return d.toISOString().slice(0, 10);
  });

  const filteredBookings = bookings.filter(b => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const tok = (b.token || ("NS-" + (b.id ? b.id.slice(-6).toUpperCase() : ""))).toLowerCase();
    return (b.name && b.name.toLowerCase().includes(q)) || (b.phone && b.phone.includes(q)) || tok.includes(q);
  });

  const dayBookings = filteredBookings.filter(b => b.dateISO === selectedDate);
  const fa = isFirebaseConfigured();

  return (
    <div style={S.body}>
      <style>{GLOBAL_CSS}</style>

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div style={{
          position:"fixed", top:24, right:24, zIndex:9999,
          background:"var(--paper)", color:"var(--ink)", padding:"14px 24px",
          border:"1px solid var(--line)", fontWeight:700, fontSize:13, letterSpacing:"0.05em",
          boxShadow:"0 10px 40px rgba(0,0,0,0.3)", animation:"nashPassReveal 0.3s ease-out"
        }}>
          {toast}
        </div>
      )}

      {/* ADMIN HEADER */}
      <nav style={S.nav}>
        <div className="nash-dash-nav-wrap">
          {/* Top Row: Brand & Status + Live Site Button */}
          <div className="nash-dash-top-bar">
            <div style={{display:"flex", alignItems:"center", gap:10}}>
              <div style={S.brandNash}>NASH</div>
              <span style={{fontSize:10, background:"var(--paper)", color:"var(--ink)", padding:"3px 8px", fontWeight:700, letterSpacing:"0.1em", borderRadius:2}}>CMS</span>
              <span style={{fontSize:10, color:"#2e7d32", background:"var(--surface-hover)", border:"1px solid var(--line)", padding:"3px 8px", borderRadius:4, fontFamily:"var(--mono)"}}>
                🟢 ChuruOne Smart Server
              </span>
            </div>

            <div style={{display:"flex", alignItems:"center", gap:8}}>
              <a 
                href="https://churuone.in/admin?storeId=nash-studio" 
                target="_blank" 
                rel="noreferrer"
                style={{
                  ...S.btnGhostBtn, 
                  padding:"6px 12px", 
                  fontSize:10, 
                  background:"#1e3a8a", 
                  color:"#ffffff", 
                  border:"none",
                  textDecoration:"none",
                  fontWeight:700,
                  display:"inline-flex",
                  alignItems:"center",
                  gap:4
                }}
              >
                <span>ChuruOne Master OS ↗</span>
              </a>
              <button style={{...S.btnGhostBtn, padding:"6px 14px", fontSize:10}} onClick={onBack}>
                ← Live Site
              </button>
            </div>
          </div>

          {/* CMS TABS (Scrollable on Mobile) */}
          <div className="nash-dash-tabs">
            {[
              { id: "hairstyles", label: `💈 Hairstyles (${hairstyles.length})` },
              { id: "settings", label: "⚙️ Studio Settings" },
              { id: "bookings", label: `📅 Schedule (${bookings.length})` },
              { id: "customcss", label: "🎨 Custom CSS" },
            ].map(tab => {
              const isSel = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="nash-dash-tab-btn"
                  style={{
                    background: isSel ? "var(--paper)" : "var(--surface)",
                    color: isSel ? "var(--ink)" : "var(--muted)",
                    border: isSel ? "1px solid var(--paper)" : "1px solid var(--line)",
                  }}>
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* DASHBOARD BODY */}
      <div style={{...S.wrap, padding:"36px 20px 80px"}}>

        {/* TAB 1: HAIRSTYLES & PRICING MANAGER */}
        {activeTab === "hairstyles" && (
          <div className="nash-expand-anim">
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:16, marginBottom:28, borderBottom:"1px solid var(--line)", paddingBottom:20}}>
              <div>
                <h2 style={{fontFamily:"var(--display)", fontSize:28, fontWeight:700, color:"var(--paper)", margin:0}}>Hairstyles & Live Pricing Manager</h2>
                <p style={{color:"var(--muted)", fontSize:13, marginTop:6}}>Yahan se aap kisi bhi cutting ka rate, photo, category ya naam direct live website par change kar sakte hain.</p>
              </div>

              <div style={{display:"flex", gap:10}}>
                <button onClick={openAddModal} style={{background:"var(--paper)", color:"var(--ink)", border:"none", padding:"12px 24px", fontWeight:700, fontSize:11, letterSpacing:"0.15em", cursor:"pointer", borderRadius:4, textTransform:"uppercase"}} className="nash-btn-confirm">
                  ➕ Add New Hairstyle
                </button>
                <button onClick={handleResetCatalog} style={{background:"transparent", color:"var(--muted)", border:"1px solid var(--line)", padding:"12px 18px", fontSize:11, cursor:"pointer", borderRadius:4, textTransform:"uppercase"}}>
                  ↺ Restore Defaults
                </button>
              </div>
            </div>

            {/* STYLES LIST */}
            <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(320px, 1fr))", gap:20}}>
              {hairstyles.map((h) => {
                const isPrem = h.type === "premium";
                return (
                  <div key={h.id} style={{background:"var(--surface)", border:"1px solid var(--line)", borderRadius:6, overflow:"hidden", display:"flex", flexDirection:"column", justifyContent:"space-between", padding:16}}>
                    <div style={{display:"flex", gap:16}}>
                      <img src={h.img} alt={h.name} style={{width:80, height:80, objectFit:"cover", borderRadius:4, border:"1px solid var(--line)", flexShrink:0}} />
                      <div style={{flexGrow:1}}>
                        <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start"}}>
                          <span style={{
                            background: isPrem ? "var(--prem-badge-bg)" : "var(--std-badge-bg)",
                            color: isPrem ? "var(--prem-badge-color)" : "var(--std-badge-color)",
                            border: "1px solid var(--line)",
                            fontSize: 9, fontWeight: 700, padding: "3px 8px", letterSpacing: "0.1em", textTransform: "uppercase", borderRadius: 2
                          }}>
                            {isPrem ? "✦ PREMIUM (60m)" : "STANDARD (30m)"}
                          </span>
                          <button onClick={() => handleDeleteStyle(h)} title="Delete style" style={{background:"transparent", border:"none", color:"#ff4d4d", cursor:"pointer", fontSize:14}}>🗑️</button>
                        </div>
                        <h3 style={{fontFamily:"var(--display)", fontSize:16, fontWeight:700, color:"var(--paper)", marginTop:8, margin:"8px 0 4px"}}>{h.name}</h3>
                        <p style={{fontSize:11, color:"var(--muted)", lineHeight:1.4, margin:0}}>{h.desc || "No description."}</p>
                      </div>
                    </div>

                    {/* LIVE PRICE & EDIT CONTROLS */}
                    <div style={{marginTop:16, paddingTop:12, borderTop:"1px solid var(--line)", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                      <div style={{display:"flex", alignItems:"center", gap:8}}>
                        <span style={{fontSize:12, color:"var(--muted)", fontWeight:500}}>Price:</span>
                        <div style={{display:"flex", alignItems:"center", gap:4}}>
                          <span style={{fontSize:12, color:"var(--paper)", fontWeight:700}}>Rs</span>
                          <input
                            type="number"
                            defaultValue={h.price}
                            onBlur={(e) => handleQuickPriceChange(h, e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") handleQuickPriceChange(h, e.target.value); }}
                            style={{
                              width: 80,
                              background: "var(--surface-hover)",
                              border: "1px solid var(--line)",
                              color: "var(--paper)",
                              padding: "4px 8px",
                              fontSize: 13,
                              fontWeight: 700,
                              borderRadius: 3,
                              outline: "none"
                            }}
                          />
                        </div>
                      </div>

                      <button onClick={() => openEditModal(h)} style={{background:"transparent", border:"1px solid var(--line)", color:"var(--paper)", padding:"6px 14px", fontSize:10, fontWeight:600, letterSpacing:"0.1em", cursor:"pointer", borderRadius:3, textTransform:"uppercase"}}>
                        ✏️ Edit All
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: STUDIO SETTINGS & CONTACT */}
        {activeTab === "settings" && (
          <div className="nash-expand-anim" style={{maxWidth:760, margin:"0 auto"}}>
            <div style={{marginBottom:28, borderBottom:"1px solid var(--line)", paddingBottom:16}}>
              <h2 style={{fontFamily:"var(--display)", fontSize:28, fontWeight:700, color:"var(--paper)", margin:0}}>Studio Info, Hero Video & Site Settings</h2>
              <p style={{color:"var(--muted)", fontSize:13, marginTop:6}}>Yahan se aap website ki Premium Background Video, Brand Name, WhatsApp number aur saari details live change kar sakte hain.</p>
            </div>

            <form onSubmit={handleSaveSettings} style={{display:"flex", flexDirection:"column", gap:24}}>
              
              {/* HERO BACKGROUND VIDEO CMS SECTION */}
              <div style={{background:"var(--surface)", border:"1px solid var(--line)", borderRadius:8, padding:24}}>
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:8}}>
                  <div>
                    <label style={{...S.fieldLabel, margin:0, fontSize:13, color:"var(--paper)", display:"flex", alignItems:"center", gap:8}}>
                      🎥 Hero Background Video (Live Changer)
                    </label>
                    <span style={{fontSize:11, color:"var(--muted)", marginTop:4, display:"block"}}>
                      Website ke front-end par jo luxury background video play hoti hai usse yahan se badlein.
                    </span>
                  </div>
                  <span style={{fontSize:10, background:"var(--paper)", color:"var(--ink)", fontWeight:700, padding:"3px 8px", letterSpacing:"0.1em", borderRadius:2}}>
                    LIVE HERO MEDIA
                  </span>
                </div>

                {/* LIVE VIDEO PREVIEW */}
                <div style={{position:"relative", width:"100%", height:200, background:"#000000", borderRadius:6, overflow:"hidden", border:"1px solid var(--line)", marginBottom:16}}>
                  <video
                    key={settVideoUrl}
                    src={settVideoUrl || "/video/hero.mp4"}
                    style={{width:"100%", height:"100%", objectFit:"cover"}}
                    autoPlay loop muted playsInline
                  />
                  <div style={{position:"absolute", top:10, left:10, background:"rgba(0,0,0,0.75)", color:"#ffffff", padding:"4px 10px", fontSize:10, fontWeight:600, letterSpacing:"0.1em", borderRadius:4, backdropFilter:"blur(4px)"}}>
                    LIVE PREVIEW
                  </div>
                  <div style={{position:"absolute", bottom:10, left:10, right:10, background:"rgba(0,0,0,0.65)", color:"#ffffff", padding:"6px 10px", fontSize:11, borderRadius:4, textOverflow:"ellipsis", overflow:"hidden", whiteSpace:"nowrap", fontFamily:"var(--mono)"}}>
                    URL: {settVideoUrl || "/video/hero.mp4"}
                  </div>
                </div>

                {/* VIDEO URL & UPLOAD CONTROLS */}
                <div style={{display:"flex", flexDirection:"column", gap:12}}>
                  <div>
                    <label style={{fontSize:11, color:"var(--paper)", fontWeight:600, display:"block", marginBottom:6, letterSpacing:"0.05em"}}>
                      Video URL / File Path:
                    </label>
                    <input
                      style={{...S.input, marginBottom:8, fontSize:13}}
                      type="text"
                      value={settVideoUrl}
                      onChange={e => setSettVideoUrl(e.target.value)}
                      placeholder="e.g. /video/hero.mp4 ya koi bhi direct .mp4 link"
                    />
                  </div>

                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12, paddingTop:8, borderTop:"1px solid var(--line)"}}>
                    <div style={{display:"flex", alignItems:"center", gap:8}}>
                      <span style={{fontSize:11, color:"var(--muted)"}}>Ya Phone/PC se Video File chunein:</span>
                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime"
                        onChange={handleVideoUpload}
                        style={{fontSize:11, color:"var(--paper)"}}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => { setSettVideoUrl("/video/hero.mp4"); showToast("↺ Default video select ho gayi!"); }}
                      style={{background:"transparent", border:"1px solid var(--line)", color:"var(--muted)", padding:"6px 12px", fontSize:10, cursor:"pointer", borderRadius:3, textTransform:"uppercase"}}>
                      ↺ Reset Default Video
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label style={S.fieldLabel}>Studio Brand Name</label>
                <input style={S.input} type="text" value={settName} onChange={e => setSettName(e.target.value)} placeholder="e.g. Nash Studio" />
              </div>

              <div>
                <label style={S.fieldLabel}>Hero Tagline / Slogan</label>
                <input style={S.input} type="text" value={settTagline} onChange={e => setSettTagline(e.target.value)} placeholder="e.g. PRECISION GROOMING. BINA INTEZAAR KE." />
              </div>

              <div>
                <label style={S.fieldLabel}>Hero Button Text</label>
                <input style={S.input} type="text" value={settBtnText} onChange={e => setSettBtnText(e.target.value)} placeholder="e.g. DISCOVER PURE BEAUTY" />
              </div>

              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:16}}>
                <div>
                  <label style={S.fieldLabel}>Shop WhatsApp (without +)</label>
                  <input style={S.input} type="text" value={settWa} onChange={e => setSettWa(e.target.value)} placeholder="923001234567" />
                </div>
                <div>
                  <label style={S.fieldLabel}>Display Contact Number</label>
                  <input style={S.input} type="text" value={settPhone} onChange={e => setSettPhone(e.target.value)} placeholder="0300-1234567" />
                </div>
              </div>

              <div>
                <label style={S.fieldLabel}>Shop Physical Address</label>
                <input style={S.input} type="text" value={settAddress} onChange={e => setSettAddress(e.target.value)} placeholder="Shop 12, Main Boulevard, Gulberg, Lahore" />
              </div>

              {/* ONLINE PAYMENT & BOOKING FEE SETTINGS */}
              <div style={{background:"var(--surface)", border:"1px solid var(--line)", borderRadius:8, padding:24}}>
                <label style={{...S.fieldLabel, margin:0, fontSize:13, color:"var(--paper)", display:"flex", alignItems:"center", gap:8, marginBottom:16}}>
                  💳 Online Payment & Booking Fee Settings
                </label>
                <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16}}>
                  <div>
                    <label style={S.fieldLabel}>Advance Booking Fee (Rs)</label>
                    <input style={S.input} type="number" value={settBookingFee} onChange={e => setSettBookingFee(e.target.value)} placeholder="50" />
                    <span style={{fontSize:11, color:"var(--muted)"}}>Customer ko slot book karte waqt ye fee pay karni hogi.</span>
                  </div>
                  <div>
                    <label style={S.fieldLabel}>UPI ID / Payment ID</label>
                    <input style={S.input} type="text" value={settUpiId} onChange={e => setSettUpiId(e.target.value)} placeholder="nashstudio@upi" />
                    <span style={{fontSize:11, color:"var(--muted)"}}>Aapka GPay / PhonePe / Paytm / Bank UPI handle.</span>
                  </div>
                </div>
                <div>
                  <label style={S.fieldLabel}>Payment Account / Business Title</label>
                  <input style={S.input} type="text" value={settAccTitle} onChange={e => setSettAccTitle(e.target.value)} placeholder="Nash Studio" />
                </div>
              </div>

              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:16}}>
                <div>
                  <label style={S.fieldLabel}>Mon-Sat Timings</label>
                  <input style={S.input} type="text" value={settMonSat} onChange={e => setSettMonSat(e.target.value)} placeholder="11:00 AM to 11:00 PM" />
                </div>
                <div>
                  <label style={S.fieldLabel}>Sunday Timings</label>
                  <input style={S.input} type="text" value={settSun} onChange={e => setSettSun(e.target.value)} placeholder="Closed" />
                </div>
              </div>

              <button type="submit" style={{...S.btnConfirm, padding:"18px", marginTop:10}} className="nash-btn-confirm">
                💾 Save All Settings Live
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: BOOKINGS & APPOINTMENT SCHEDULE */}
        {activeTab === "bookings" && (
          <div className="nash-expand-anim">
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:16, marginBottom:24}}>
              <div>
                <h2 style={{fontFamily:"var(--display)", fontSize:28, fontWeight:700, color:"var(--paper)", margin:0}}>Customer Bookings & Schedule</h2>
                <p style={{color:"var(--muted)", fontSize:13, marginTop:6}}>Live synchronized appointments with token verification.</p>
              </div>
            </div>

            <div style={{marginBottom:20}}>
              <input
                style={{...S.input, fontSize:14, padding:"12px 16px", borderColor:"var(--line)", background:"var(--surface)", color:"var(--paper)", marginBottom:0}}
                type="text" placeholder="Search customer (Token ID / Mobile / Naam)..."
                value={search} onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div style={S.dashDateTabs}>
              {dateTabs.map(iso => {
                const d = new Date(iso + "T00:00:00");
                const isSun = d.getDay() === 0, isSel = iso === selectedDate;
                const cnt = filteredBookings.filter(b => b.dateISO === iso).length;
                return (
                  <button key={iso}
                    style={{...S.dashDateTab,...(isSel?S.dashDateTabSelected:{}),...(isSun?S.dashDateTabSunday:{})}}
                    className="nash-date-chip" onClick={() => !isSun && setSelectedDate(iso)} disabled={isSun}>
                    <span style={S.dashTabDow}>{DOW[d.getDay()]}</span>
                    <span style={S.dashTabDate}>{d.getDate()}</span>
                    {cnt>0 && <span style={S.dashTabBadge}>{cnt}</span>}
                    {isSun && <span style={S.dashTabClosed}>Closed</span>}
                  </button>
                );
              })}
            </div>

            {!loading && (
              <>
                <div style={S.dashDayHeader}>
                  <span style={S.dashDayTitle}>
                    {new Date(selectedDate+"T00:00:00").toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
                  </span>
                  <div style={S.dashDayStats}>
                    <span style={S.dashStatPill}>Total Booked: {dayBookings.length}</span>
                    <span style={{...S.dashStatPill, color:"var(--ink)", background:"var(--paper)"}}>✦ Premium: {dayBookings.filter(b=>b.tier==="premium").length}</span>
                  </div>
                </div>
                <DashboardTimeGrid bookings={dayBookings} settings={settings} />
              </>
            )}

            {loading && (
              <div style={{textAlign:"center", padding:60}}>
                <div className="nash-spinner" />
                <p style={{color:"var(--muted)", marginTop:16}}>Appointments load ho rahi hain...</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: CUSTOM CSS CODE EDITOR */}
        {activeTab === "customcss" && (
          <div className="nash-expand-anim">

            {/* Header */}
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:16, marginBottom:28, borderBottom:"1px solid var(--line)", paddingBottom:20}}>
              <div>
                <h2 style={{fontFamily:"var(--display)", fontSize:28, fontWeight:700, color:"var(--paper)", margin:0}}>🎨 Custom CSS Editor</h2>
                <p style={{color:"var(--muted)", fontSize:13, marginTop:6}}>
                  Yahan apna CSS code likhein — Save karte hi <strong style={{color:"var(--paper)"}}>puri website ka UI live update</strong> ho jayega. Koi reload ki zaroorat nahi.
                </p>
              </div>
              <div style={{display:"flex", gap:10, flexWrap:"wrap"}}>
                <button
                  onClick={handleSaveCustomCSS}
                  disabled={customCssSaving}
                  style={{background:"var(--paper)", color:"var(--ink)", border:"none", padding:"12px 24px", fontWeight:700, fontSize:11, letterSpacing:"0.15em", cursor: customCssSaving ? "wait" : "pointer", borderRadius:4, textTransform:"uppercase", opacity: customCssSaving ? 0.7 : 1}}
                  className="nash-btn-confirm"
                >
                  {customCssSaving ? "⏳ Saving..." : "💾 Save & Apply Live"}
                </button>
                <button
                  onClick={handleClearCustomCSS}
                  style={{background:"transparent", color:"var(--muted)", border:"1px solid var(--line)", padding:"12px 18px", fontSize:11, cursor:"pointer", borderRadius:4, textTransform:"uppercase"}}
                >
                  🗑️ Clear All CSS
                </button>
              </div>
            </div>

            {/* Info Banner */}
            <div style={{background:"rgba(212,175,55,0.08)", border:"1px solid rgba(212,175,55,0.25)", borderRadius:6, padding:"14px 20px", marginBottom:24, display:"flex", gap:14, alignItems:"flex-start"}}>
              <span style={{fontSize:20}}>💡</span>
              <div>
                <p style={{color:"var(--paper)", fontWeight:700, fontSize:13, margin:"0 0 4px"}}>Kaise Kaam Karta Hai?</p>
                <p style={{color:"var(--muted)", fontSize:12, margin:0, lineHeight:1.6}}>
                  Niche CSS code likhein (e.g. <code style={{background:"var(--surface-hover)", padding:"1px 5px", borderRadius:2, color:"var(--paper)"}}>body {"{"} background: red {"}"}</code>). 
                  <strong style={{color:"var(--paper)"}}> "Save & Apply Live"</strong> dabayen — Firebase mein save hoga aur <strong style={{color:"var(--paper)"}}>turant</strong> website par apply ho jayega. Sab visitors ko bhi nayi design nazar aayegi!
                </p>
              </div>
            </div>

            {/* Quick Snippet Buttons */}
            <div style={{marginBottom:12}}>
              <p style={{color:"var(--muted)", fontSize:11, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:8}}>Quick Snippets (click to insert):</p>
              <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
                {[
                  { label:"🌈 Background Color", snippet:"body {\n  background-color: #1a1a2e;\n}\n" },
                  { label:"🔤 Font Change", snippet:":root {\n  --display: 'Georgia', serif;\n}\n" },
                  { label:"🎨 Button Color", snippet:".nash-btn-confirm {\n  background: #e63946 !important;\n}\n" },
                  { label:"📐 Card Style", snippet:".nash-card {\n  border-radius: 16px !important;\n  box-shadow: 0 8px 32px rgba(0,0,0,0.3);\n}\n" },
                  { label:"🔆 Hero Overlay", snippet:".nash-hero-overlay {\n  background: rgba(0,0,0,0.6) !important;\n}\n" },
                ].map(s => (
                  <button
                    key={s.label}
                    onClick={() => setCustomCssCode(prev => prev + (prev && !prev.endsWith("\n") ? "\n" : "") + s.snippet)}
                    style={{background:"var(--surface-hover)", color:"var(--paper)", border:"1px solid var(--line)", padding:"6px 12px", fontSize:11, cursor:"pointer", borderRadius:4, transition:"all 0.2s"}}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "var(--paper)"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "var(--line)"}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Code Editor Area */}
            <div style={{position:"relative", borderRadius:6, overflow:"hidden", border:"1px solid var(--line)", marginBottom:20}}>
              {/* Editor Top Bar */}
              <div style={{background:"var(--surface-hover)", padding:"8px 16px", display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"1px solid var(--line)"}}>
                <div style={{display:"flex", gap:8, alignItems:"center"}}>
                  <span style={{width:10, height:10, borderRadius:"50%", background:"#ff5f57", display:"inline-block"}}></span>
                  <span style={{width:10, height:10, borderRadius:"50%", background:"#febc2e", display:"inline-block"}}></span>
                  <span style={{width:10, height:10, borderRadius:"50%", background:"#28c840", display:"inline-block"}}></span>
                  <span style={{marginLeft:8, fontFamily:"var(--mono)", fontSize:11, color:"var(--muted)"}}>custom-styles.css</span>
                </div>
                <span style={{fontFamily:"var(--mono)", fontSize:11, color:"var(--muted)"}}>
                  {customCssCode.length} chars · {customCssCode.split("\n").length} lines
                </span>
              </div>
              {/* Textarea */}
              <textarea
                value={customCssCode}
                onChange={e => setCustomCssCode(e.target.value)}
                placeholder={`/* Yahan apna custom CSS likhein */\n\n/* Misaal: */\nbody {\n  background-color: #0d0d0d;\n}\n\n.nash-hero-section {\n  min-height: 80vh;\n}\n\n/* Aap koi bhi CSS property change kar sakte hain! */`}
                spellCheck={false}
                style={{
                  width:"100%",
                  minHeight:380,
                  background:"#0d1117",
                  color:"#e6edf3",
                  fontFamily:"'Fira Code', 'Cascadia Code', 'Courier New', monospace",
                  fontSize:13,
                  lineHeight:1.7,
                  padding:"20px",
                  border:"none",
                  outline:"none",
                  resize:"vertical",
                  boxSizing:"border-box",
                  tabSize:2,
                }}
                onKeyDown={e => {
                  // Tab key inserts 2 spaces instead of leaving the textarea
                  if (e.key === "Tab") {
                    e.preventDefault();
                    const start = e.target.selectionStart;
                    const end = e.target.selectionEnd;
                    const newVal = customCssCode.substring(0, start) + "  " + customCssCode.substring(end);
                    setCustomCssCode(newVal);
                    setTimeout(() => { e.target.selectionStart = e.target.selectionEnd = start + 2; }, 0);
                  }
                  // Ctrl+S saves
                  if ((e.ctrlKey || e.metaKey) && e.key === "s") {
                    e.preventDefault();
                    handleSaveCustomCSS();
                  }
                }}
              />
            </div>

            {/* Keyboard shortcuts hint */}
            <p style={{color:"var(--muted)", fontSize:11, marginBottom:20, letterSpacing:"0.05em"}}>
              ⌨️ <strong>Ctrl+S</strong> se seedha save karein · <strong>Tab</strong> key = 2 spaces indent
            </p>

            {/* Live Preview Toggle */}
            <div style={{borderTop:"1px solid var(--line)", paddingTop:20}}>
              <button
                onClick={() => setCssPreviewOpen(p => !p)}
                style={{background:"var(--surface-hover)", color:"var(--paper)", border:"1px solid var(--line)", padding:"10px 20px", fontSize:11, cursor:"pointer", borderRadius:4, textTransform:"uppercase", letterSpacing:"0.1em", display:"flex", alignItems:"center", gap:8, fontWeight:700}}
              >
                <span style={{transition:"transform 0.3s", display:"inline-block", transform: cssPreviewOpen ? "rotate(90deg)" : "rotate(0deg)"}}>▶</span>
                {cssPreviewOpen ? "Preview Band Karein" : "👁️ Live Preview Dekhein (Current Site)"}
              </button>

              {cssPreviewOpen && (
                <div style={{marginTop:16, borderRadius:6, overflow:"hidden", border:"1px solid var(--line)", position:"relative"}} className="nash-expand-anim">
                  <div style={{background:"var(--surface-hover)", padding:"8px 16px", borderBottom:"1px solid var(--line)", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                    <span style={{fontSize:11, color:"var(--muted)", fontFamily:"var(--mono)"}}>🌐 Live Site Preview (aapki saved CSS apply hai)</span>
                    <span style={{fontSize:11, color:"var(--muted)"}}>↗ Pura dekhne k liye Live Site button use karein</span>
                  </div>
                  <iframe
                    src="/"
                    title="Live Site Preview"
                    style={{width:"100%", height:520, border:"none", background:"#fff"}}
                    sandbox="allow-scripts allow-same-origin"
                  />
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* ADD / EDIT HAIRSTYLE MODAL */}
      {isModalOpen && (
        <div style={{
          position:"fixed", inset:0, zIndex:9999, background:"rgba(0,0,0,0.75)", backdropFilter:"blur(10px)",
          display:"flex", alignItems:"center", justifyContent:"center", padding:20
        }}>
          <div style={{
            background:"var(--surface)", border:"1px solid var(--line)", borderRadius:6,
            width:"100%", maxWidth:560, padding:32, maxHeight:"90vh", overflowY:"auto", boxShadow:"var(--card-shadow)"
          }} className="nash-expand-anim">
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24, borderBottom:"1px solid var(--line)", paddingBottom:16}}>
              <h3 style={{fontFamily:"var(--display)", fontSize:22, fontWeight:700, color:"var(--paper)", margin:0}}>
                {editingStyle ? `Edit: ${editingStyle.name}` : "Add New Hairstyle"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{background:"transparent", border:"none", color:"var(--muted)", fontSize:18, cursor:"pointer"}}>✕</button>
            </div>

            <form onSubmit={handleSaveStyle} style={{display:"flex", flexDirection:"column", gap:16}}>
              <div>
                <label style={S.fieldLabel}>Hairstyle Name *</label>
                <input style={S.input} type="text" value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. Royal Skin Fade Pompadour" required />
              </div>

              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:16}}>
                <div>
                  <label style={S.fieldLabel}>Category / Tier</label>
                  <select
                    value={formType}
                    onChange={e => {
                      const t = e.target.value;
                      setFormType(t);
                      setFormTime(t === "premium" ? 60 : 30);
                      if (!editingStyle) setFormPrice(t === "premium" ? 1500 : 800);
                    }}
                    style={{...S.input, background:"var(--surface)", color:"var(--paper)", cursor:"pointer"}}>
                    <option value="premium">✦ Premium (60 Min)</option>
                    <option value="standard">Standard (30 Min)</option>
                  </select>
                </div>
                <div>
                  <label style={S.fieldLabel}>Price (Rs) *</label>
                  <input style={S.input} type="number" value={formPrice} onChange={e => setFormPrice(e.target.value)} placeholder="1500" required />
                </div>
              </div>

              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:16}}>
                <div>
                  <label style={S.fieldLabel}>Duration (Minutes)</label>
                  <input style={S.input} type="number" value={formTime} onChange={e => setFormTime(e.target.value)} placeholder="60" />
                </div>
                <div>
                  <label style={S.fieldLabel}>Short Description</label>
                  <input style={S.input} type="text" value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="e.g. Sharp silhouette with beard blend" />
                </div>
              </div>

              {/* PHOTO UPLOAD & URL */}
              <div>
                <label style={S.fieldLabel}>Hairstyle Photo</label>
                <div style={{display:"flex", gap:16, alignItems:"center", marginBottom:12}}>
                  {formImg && (
                    <img src={formImg} alt="Preview" style={{width:70, height:70, objectFit:"cover", borderRadius:4, border:"1px solid var(--line)"}} />
                  )}
                  <div style={{flexGrow:1}}>
                    <input style={{...S.input, marginBottom:8, fontSize:12}} type="text" value={formImg} onChange={e => setFormImg(e.target.value)} placeholder="Enter Image URL or Path (/images/...)" />
                    <div style={{display:"flex", alignItems:"center", gap:8}}>
                      <span style={{fontSize:11, color:"var(--muted)"}}>Ya File Upload Karein:</span>
                      <input type="file" accept="image/*" onChange={handleImageUpload} style={{fontSize:11, color:"var(--paper)"}} />
                    </div>
                  </div>
                </div>
              </div>

              <div style={{display:"flex", gap:12, marginTop:16}}>
                <button type="submit" style={{...S.btnConfirm, flex:1}} className="nash-btn-confirm">
                  💾 {editingStyle ? "Update Style Live" : "Add to Live Website"}
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{...S.btnGhostBtn, padding:"16px 24px"}}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

function DashboardTimeGrid({ bookings, settings }) {
  const [expandedId, setExpandedId] = useState(null);
  const rows = [];
  for (let t = WORK_START; t < WORK_END; t += ROW_STEP) {
    const label = formatTime(Math.floor(t/60), t%60);
    let occupying = null, isStart = false;
    for (const b of bookings) {
      const bS = b.startMin, bE = b.startMin + (b.totalMinutes||30);
      if (bS <= t && bE > t) {
        occupying = b;
        isStart = bS >= t - ROW_STEP + 1 && bS <= t;
        break;
      }
    }
    rows.push({ t, label, booking: occupying, isStart });
  }
  return (
    <div style={S.timeGrid}>
      <div style={S.timeGridHeader}>
        <div style={S.timeGridHeaderTime}>Waqt</div>
        <div style={S.timeGridHeaderStatus}>Status</div>
        <div style={S.timeGridHeaderDetails}>Customer / Details</div>
      </div>
      {rows.map((row) => {
        const isBooked = !!row.booking;
        const b = row.booking;
        const isPrem = b && b.tier === "premium";
        const tok = b ? (b.token || ("NS-" + (b.id ? b.id.slice(-6).toUpperCase() : "------"))) : null;
        const rowId = b ? (b.id || b.token) : null;
        const isExp = rowId && expandedId === rowId;
        const isHour = row.t % 60 === 0;
        return (
          <div key={row.t}
            style={{...S.timeGridRow,...(isHour?S.timeGridHourMark:{}),...(isBooked?(isPrem?S.timeGridRowPremium:S.timeGridRowBooked):S.timeGridRowFree),cursor:isBooked?"pointer":"default"}}
            className={isBooked?"nash-grid-row-hover":""}
            onClick={() => { if (b) setExpandedId(isExp ? null : rowId); }}>
            <div style={S.timeGridTimeCol}>
              <span style={{...S.timeGridTimeLabel,...(isHour?S.timeGridHourLabel:{})}}>{row.label}</span>
              {isHour && <span style={S.timeGridHourDot} />}
            </div>
            <div style={S.timeGridStatusCol}>
              {isBooked ? (
                <div style={{display:"flex",flexDirection:"column",gap:3}}>
                  <span style={isPrem?S.statusBadgePremium:S.statusBadgeStd}>{isPrem?"PREMIUM":"STD"}</span>
                  {row.isStart && <span style={S.statusLiveLabel}>BOOKED</span>}
                </div>
              ) : <span style={S.statusBadgeFree}>FREE</span>}
            </div>
            <div style={S.timeGridDetailsCol}>
              {isBooked && row.isStart ? (
                <div style={{width:"100%"}}>
                  <div style={S.gridCustName}>{b.name}</div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:4}}>
                    <span style={S.gridTokenBadge}>{tok}</span>
                    <span style={S.gridDuration}>{b.totalMinutes} min</span>
                  </div>
                  {isExp && (
                    <div style={S.gridExpandDetails} className="nash-expand-anim" onClick={e => e.stopPropagation()}>
                      <div style={S.gridExpandRow}><span>Mobile:</span><a href={`tel:${b.phone}`} style={{color:"var(--paper)",fontWeight:700,textDecoration:"none"}}>{b.phone}</a></div>
                      <div style={S.gridExpandRow}><span>Style / Service:</span><b style={{color:"var(--paper)"}}>{b.styleName || "--"} ({b.tier==="premium"?"✦ Premium":"Standard"})</b></div>
                      <div style={S.gridExpandRow}><span>Total Service Bill:</span><b style={{color:"var(--paper)",fontSize:14,fontWeight:700}}>Rs {b.totalPrice||"--"}</b></div>
                      <div style={S.gridExpandRow}><span style={{color:"#25D366"}}>Advance Booking Fee:</span><b style={{color:"#25D366"}}>Rs {b.bookingFee||50} {b.txnId ? `(UTR: ${b.txnId})` : "(Paid)"}</b></div>
                      <div style={S.gridExpandRow}><span style={{color:"#D97706", fontWeight:600}}>Remaining Due at Salon:</span><b style={{color:"#D97706", fontSize:15, fontWeight:700}}>Rs {b.remainingDue !== undefined ? b.remainingDue : Math.max(0, (b.totalPrice||0) - (b.bookingFee||50))}</b></div>
                      <div style={{display:"flex",gap:8,marginTop:12}}>
                        <button style={S.gridWaBtn} onClick={() => {
                          const msg = `Hi ${b.name}, ${settings?.studioName || "Nash Studio"} slot (${b.timeLabel}) Token ${tok} confirm hai! Advance Rs ${b.bookingFee||50} received. Remaining at salon: Rs ${b.remainingDue !== undefined ? b.remainingDue : Math.max(0, (b.totalPrice||0) - (b.bookingFee||50))}.`;
                          window.open(`https://wa.me/${(b.phone||"").replace(/[^0-9]/g,"")}?text=${encodeURIComponent(msg)}`,"_blank");
                        }}>WhatsApp</button>
                        <button style={S.gridPrintBtn} onClick={() => printStandaloneTicket(b, settings)}>Print Ticket</button>
                      </div>
                    </div>
                  )}
                </div>
              ) : isBooked && !row.isStart ? (
                <span style={S.gridContinued}>{b.name} ka session jari...</span>
              ) : (
                <span style={S.gridFreeSlot}>Available</span>
              )}
            </div>
          </div>
        );
      })}
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

/* Card hover — buttery lift */
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
