import { initializeApp, getApps } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  setDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp, 
  orderBy 
} from "firebase/firestore";
import {
  getAuth,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged
} from "firebase/auth";

import {
  SMART_CONFIG,
  getStoreData,
  getBookingsForDate,
  createSmartBooking,
  saveSmartHairstyle,
  deleteSmartHairstyle,
  saveSmartSettings,
  postSmartReview,
  connectSmartWebSocket
} from "./smartServerClient";

// ============ FIREBASE CONFIG (OPTIONAL FALLBACK) ============
export const firebaseConfig = {
  apiKey: "AIzaSyCwLQ-Wmuhz3oJBpMFMKYg4cZDbrDe3caU",
  authDomain: "nash-studio-567ea.firebaseapp.com",
  projectId: "nash-studio-567ea",
  storageBucket: "nash-studio-567ea.firebasestorage.app",
  messagingSenderId: "309119916305",
  appId: "1:309119916305:web:e1d2812b4689f375a294b0",
  measurementId: "G-BM8SE7X9WG"
};

export const isFirebaseConfigured = () => true;

let db = null;
let auth = null;
let googleProvider = null;

try {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  db = getFirestore(app);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: 'select_account' });
} catch (e) {
  console.warn("Optional Firebase warning:", e.message);
}

// Global WebSocket Event Emitter
const wsSubscribers = new Set();
if (typeof window !== "undefined") {
  connectSmartWebSocket((action, payload) => {
    wsSubscribers.forEach(cb => {
      try { cb(action, payload); } catch (e) {}
    });
  });
}

/**
 * 1. REAL-TIME LISTENER FOR CUSTOMER DATE BOOKINGS
 */
export function subscribeToBookingsForDate(dateISO, callback) {
  const loadFromSmartServer = async () => {
    try {
      const bookings = await getBookingsForDate(dateISO);
      localStorage.setItem(`bookings_${dateISO}`, JSON.stringify(bookings));
      callback(bookings);
    } catch (err) {
      // Fallback to local storage
      const raw = localStorage.getItem(`bookings_${dateISO}`);
      callback(raw ? JSON.parse(raw) : []);
    }
  };

  // Immediate initial load
  loadFromSmartServer();

  // Listen to live WebSocket events
  const onWsEvent = (action) => {
    if (action === 'ORDER_CREATED' || action === 'ORDER_UPDATED' || action === 'BOOKINGS_UPDATED') {
      loadFromSmartServer();
    }
  };
  wsSubscribers.add(onWsEvent);

  // Heartbeat refresh every 10 seconds
  const interval = setInterval(loadFromSmartServer, 10000);

  return () => {
    wsSubscribers.delete(onWsEvent);
    clearInterval(interval);
  };
}

/**
 * 2. REAL-TIME LISTENER FOR ALL BOOKINGS (STAFF DASHBOARD)
 */
export function subscribeToAllBookings(callback) {
  const loadAll = async () => {
    try {
      const bookings = await getBookingsForDate('');
      callback(bookings);
    } catch (err) {
      const all = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("bookings_")) {
          const item = JSON.parse(localStorage.getItem(key));
          if (Array.isArray(item)) all.push(...item);
        }
      }
      callback(all);
    }
  };

  loadAll();

  const onWsEvent = (action) => {
    if (action === 'ORDER_CREATED' || action === 'ORDER_UPDATED') {
      loadAll();
    }
  };
  wsSubscribers.add(onWsEvent);

  const interval = setInterval(loadAll, 10000);
  return () => {
    wsSubscribers.delete(onWsEvent);
    clearInterval(interval);
  };
}

/**
 * 3. BOOKING CREATION WITH REALTIME SMART SERVER SAVE
 */
export async function createBookingWithTransaction(bookingData) {
  const { dateISO, startMin, totalMinutes } = bookingData;
  const requestedEnd = startMin + totalMinutes;

  // 1. Submit directly to ChuruOne Smart Server
  try {
    const confirmed = await createSmartBooking(bookingData);
    
    // Update local cache
    const existingRaw = localStorage.getItem(`bookings_${dateISO}`);
    const existingBookings = existingRaw ? JSON.parse(existingRaw) : [];
    existingBookings.push(confirmed);
    localStorage.setItem(`bookings_${dateISO}`, JSON.stringify(existingBookings));

    return confirmed;
  } catch (err) {
    if (err.message === "SLOT_ALREADY_TAKEN") {
      throw err;
    }
    console.warn("Smart Server direct booking fallback to local:", err.message);

    // Fallback local slot check
    const existingRaw = localStorage.getItem(`bookings_${dateISO}`);
    const existingBookings = existingRaw ? JSON.parse(existingRaw) : [];

    for (const b of existingBookings) {
      const bStart = b.startMin;
      const bEnd = b.startMin + b.totalMinutes;
      if (Math.max(bStart, startMin) < Math.min(bEnd, requestedEnd)) {
        throw new Error("SLOT_ALREADY_TAKEN");
      }
    }

    const newBooking = {
      id: `local-${Date.now()}`,
      ...bookingData,
      createdAt: new Date().toISOString()
    };
    existingBookings.push(newBooking);
    localStorage.setItem(`bookings_${dateISO}`, JSON.stringify(existingBookings));
    return newBooking;
  }
}

/**
 * 4. REAL-TIME HAIRSTYLES CATALOG (CHURUONE SMART SERVER SYNC)
 */
export function subscribeToHairstyles(callback, defaultList = []) {
  const loadCatalog = async () => {
    try {
      const data = await getStoreData();
      if (data && Array.isArray(data.menu) && data.menu.length > 0) {
        const mapped = data.menu.map(item => ({
          id: item.id,
          name: item.name,
          type: item.type || (item.category?.includes('Premium') ? 'premium' : 'standard'),
          img: item.img || item.image || '/images/Soft-fade-edit.webp',
          time: item.time || item.prepTime || 30,
          price: Number(item.price) || 500,
          desc: item.desc || item.description || ''
        }));
        localStorage.setItem("nash_hairstyles_catalog", JSON.stringify(mapped));
        callback(mapped);
        return;
      }
    } catch (e) {
      // Fallback to local
    }

    const raw = localStorage.getItem("nash_hairstyles_catalog");
    if (raw) {
      try { callback(JSON.parse(raw)); return; } catch (e) {}
    }
    localStorage.setItem("nash_hairstyles_catalog", JSON.stringify(defaultList));
    callback(defaultList);
  };

  loadCatalog();

  const onWsEvent = (action) => {
    if (action === 'MENU_UPDATED') {
      loadCatalog();
    }
  };
  wsSubscribers.add(onWsEvent);

  return () => {
    wsSubscribers.delete(onWsEvent);
  };
}

export async function saveHairstyle(styleData) {
  const id = styleData.id || `hs_${Date.now()}`;
  const payload = { ...styleData, id, updatedAt: new Date().toISOString() };

  // Always update localStorage
  try {
    const raw = localStorage.getItem("nash_hairstyles_catalog");
    let list = raw ? JSON.parse(raw) : [];
    const idx = list.findIndex(h => h.id === id);
    if (idx >= 0) list[idx] = payload;
    else list.push(payload);
    localStorage.setItem("nash_hairstyles_catalog", JSON.stringify(list));
  } catch (e) {}

  // Sync to ChuruOne Smart Server
  try {
    await saveSmartHairstyle(payload);
  } catch (e) {
    console.warn("Smart Server saveHairstyle fallback:", e.message);
  }

  // Sync to Firestore if available
  if (db && isFirebaseConfigured()) {
    try { await setDoc(doc(db, "hairstyles", id), payload); } catch (e) {}
  }

  return payload;
}

export async function deleteHairstyle(styleId) {
  // Update localStorage
  try {
    const raw = localStorage.getItem("nash_hairstyles_catalog");
    let list = raw ? JSON.parse(raw) : [];
    list = list.filter(h => h.id !== styleId);
    localStorage.setItem("nash_hairstyles_catalog", JSON.stringify(list));
  } catch (e) {}

  // Delete from ChuruOne Smart Server
  try {
    await deleteSmartHairstyle(styleId);
  } catch (e) {
    console.warn("Smart Server deleteHairstyle fallback:", e.message);
  }

  // Delete from Firestore
  if (db && isFirebaseConfigured()) {
    try { await deleteDoc(doc(db, "hairstyles", styleId)); } catch (e) {}
  }
}

export async function resetHairstylesToDefault(defaultList) {
  localStorage.setItem("nash_hairstyles_catalog", JSON.stringify(defaultList));
  for (const item of defaultList) {
    try { await saveSmartHairstyle(item); } catch (e) {}
  }
  return defaultList;
}

/**
 * 5. REAL-TIME STUDIO SETTINGS (CHURUONE SMART SERVER SYNC)
 */
export function subscribeToSiteSettings(callback, defaultSettings) {
  const loadSettings = async () => {
    try {
      const data = await getStoreData();
      if (data && data.storeInfo) {
        const s = {
          ...defaultSettings,
          ...data.storeInfo,
          studioName: data.storeInfo.name || data.storeInfo.studioName || defaultSettings.studioName,
          address: data.storeInfo.address || defaultSettings.address,
          phoneDisplay: data.storeInfo.phoneDisplay || defaultSettings.phoneDisplay,
          shopWhatsapp: data.storeInfo.whatsapp || data.storeInfo.shopWhatsapp || defaultSettings.shopWhatsapp,
          bookingFee: data.storeInfo.bookingFee !== undefined ? data.storeInfo.bookingFee : defaultSettings.bookingFee,
          upiId: data.storeInfo.upiId || defaultSettings.upiId
        };
        localStorage.setItem("nash_studio_settings", JSON.stringify(s));
        callback(s);
        return;
      }
    } catch (e) {}

    const raw = localStorage.getItem("nash_studio_settings");
    if (raw) {
      try { callback(JSON.parse(raw)); return; } catch (e) {}
    }
    localStorage.setItem("nash_studio_settings", JSON.stringify(defaultSettings));
    callback(defaultSettings);
  };

  loadSettings();

  const onWsEvent = (action) => {
    if (action === 'STORE_INFO_UPDATED') {
      loadSettings();
    }
  };
  wsSubscribers.add(onWsEvent);

  return () => {
    wsSubscribers.delete(onWsEvent);
  };
}

export async function saveSiteSettings(settingsData) {
  const payload = { ...settingsData, updatedAt: new Date().toISOString() };
  localStorage.setItem("nash_studio_settings", JSON.stringify(payload));

  // Sync to ChuruOne Smart Server
  try {
    await saveSmartSettings(payload);
  } catch (e) {
    console.warn("Smart Server saveSiteSettings fallback:", e.message);
  }

  // Sync to Firestore
  if (db && isFirebaseConfigured()) {
    try { await setDoc(doc(db, "settings", "general"), payload); } catch (e) {}
  }
  return payload;
}

/**
 * 6. CUSTOM CSS — LIVE WEBSITE STYLING
 */
export function subscribeToCustomCSS(callback) {
  const LS_KEY = "nash_custom_css";
  const loadCSS = async () => {
    try {
      const data = await getStoreData();
      if (data && data.storeInfo && data.storeInfo.customCSS !== undefined) {
        const css = data.storeInfo.customCSS || "";
        localStorage.setItem(LS_KEY, css);
        callback(css);
        return;
      }
    } catch (e) {}

    const raw = localStorage.getItem(LS_KEY);
    callback(raw || "");
  };

  loadCSS();

  const onWsEvent = (action) => {
    if (action === 'STORE_INFO_UPDATED') {
      loadCSS();
    }
  };
  wsSubscribers.add(onWsEvent);

  return () => {
    wsSubscribers.delete(onWsEvent);
  };
}

export async function saveCustomCSS(cssString) {
  const LS_KEY = "nash_custom_css";
  localStorage.setItem(LS_KEY, cssString);

  try {
    await saveSmartSettings({ customCSS: cssString });
  } catch (e) {
    console.warn("Smart Server saveCustomCSS fallback:", e.message);
  }

  if (db && isFirebaseConfigured()) {
    try {
      await setDoc(doc(db, "settings", "customCSS"), {
        css: cssString,
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {}
  }
}

// 7. FEEDBACK & REVIEWS
export async function saveFeedback(feedback) {
  try {
    await postSmartReview({
      name: feedback.name || "Customer",
      phone: feedback.phone || "",
      rating: feedback.rating || 5,
      comment: feedback.comment || "",
      type: "feedback"
    });
  } catch (e) {}
  return true;
}

export async function saveReview(review) {
  try {
    await postSmartReview(review);
    const raw = localStorage.getItem("nash_reviews");
    const list = raw ? JSON.parse(raw) : [];
    list.unshift({ ...review, id: `rev-${Date.now()}` });
    localStorage.setItem("nash_reviews", JSON.stringify(list));
  } catch (e) {
    const raw = localStorage.getItem("nash_reviews");
    const list = raw ? JSON.parse(raw) : [];
    list.unshift({ ...review, id: `local-${Date.now()}` });
    localStorage.setItem("nash_reviews", JSON.stringify(list));
  }
  return true;
}

export function subscribeToReviews(callback) {
  const loadReviews = async () => {
    try {
      const data = await getStoreData();
      if (data && Array.isArray(data.reviews) && data.reviews.length > 0) {
        localStorage.setItem("nash_reviews", JSON.stringify(data.reviews));
        callback(data.reviews);
        return;
      }
    } catch (e) {}

    const raw = localStorage.getItem("nash_reviews");
    callback(raw ? JSON.parse(raw) : []);
  };

  loadReviews();

  const onWsEvent = (action) => {
    if (action === 'REVIEW_ADDED') {
      loadReviews();
    }
  };
  wsSubscribers.add(onWsEvent);

  return () => {
    wsSubscribers.delete(onWsEvent);
  };
}

/**
 * 8. AUTHENTICATION (GOOGLE + 1-TAP GUEST/DIRECT LOGIN)
 */
export function subscribeToAuth(callback) {
  if (auth) {
    getRedirectResult(auth).then((result) => {
      if (result && result.user) {
        const user = result.user;
        const uData = {
          uid: user.uid,
          displayName: user.displayName || user.email?.split("@")[0] || "User",
          email: user.email || "",
          photoURL: user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.displayName||"N")}`,
          phoneNumber: user.phoneNumber || ""
        };
        localStorage.setItem("nash_user", JSON.stringify(uData));
        callback(uData);
      }
    }).catch(() => {});

    return onAuthStateChanged(auth, (user) => {
      if (user) {
        const uData = {
          uid: user.uid,
          displayName: user.displayName || user.email?.split("@")[0] || "User",
          email: user.email || "",
          photoURL: user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.displayName||"N")}`,
          phoneNumber: user.phoneNumber || ""
        };
        localStorage.setItem("nash_user", JSON.stringify(uData));
        callback(uData);
      } else {
        const localRaw = localStorage.getItem("nash_user");
        if (localRaw) {
          try { callback(JSON.parse(localRaw)); } catch(e) { callback(null); }
        } else {
          callback(null);
        }
      }
    });
  }

  const localRaw = localStorage.getItem("nash_user");
  if (localRaw) {
    try { callback(JSON.parse(localRaw)); } catch(e) { callback(null); }
  } else {
    callback(null);
  }
  return () => {};
}

export async function loginWithGoogle() {
  if (auth && googleProvider) {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const uData = {
        uid: user.uid,
        displayName: user.displayName || user.email?.split("@")[0] || "User",
        email: user.email || "",
        photoURL: user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.displayName||"N")}`,
        phoneNumber: user.phoneNumber || ""
      };
      localStorage.setItem("nash_user", JSON.stringify(uData));
      return uData;
    } catch (err) {
      console.warn("Google popup fallback:", err.message);
    }
  }
  // Fast direct customer login if Google is disabled or blocked
  const guestName = prompt("Apna Naam darj karein:") || "Salon Customer";
  const guestPhone = prompt("Apna Mobile Number darj karein:") || "9829012345";
  return loginDirectCustomer(guestName, guestPhone);
}

export function loginDirectCustomer(customerName, customerPhone) {
  const uData = {
    uid: `cust_${Date.now()}`,
    displayName: customerName || "Customer",
    email: "",
    photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(customerName||"C")}`,
    phoneNumber: customerPhone || ""
  };
  localStorage.setItem("nash_user", JSON.stringify(uData));
  return uData;
}

export async function logoutUser() {
  if (auth) {
    try { await signOut(auth); } catch (e) {}
  }
  localStorage.removeItem("nash_user");
}
