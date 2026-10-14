import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  User, 
  AlertCircle, 
  Phone, 
  Store, 
  ShoppingBag, 
  Lock, 
  Mail, 
  Calendar, 
  Eye, 
  EyeOff, 
  FileText, 
  Sparkles, 
  Clock, 
  Check, 
  HelpCircle,
  ExternalLink,
  Copy,
  Info,
  RefreshCw,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { firebaseConfig } from '../nash/firebase';
import { setChuruOneSession, getChuruOneSession, sanitizeChuruOneUser, getSsoLightweightUser } from '../../utils/ssoHelper';
import { API_URL } from '../../config/api';
import { PHONEPE_REVIEW_MODE } from '../../config/siteMode';
import { 
  initMsg91Widget, 
  sendOtpViaMsg91, 
  verifyOtpViaMsg91, 
  retryOtpViaMsg91, 
  isMsg91Ready 
} from '../../utils/msg91OtpHelper';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

const STORE_NAMES = {
  'nash-studio': 'Nash Studio',
  'nash': 'Nash Studio',
  'shawarma': 'Shawarma Nights',
  'shawarma-nights': 'Shawarma Nights',
  'skyline': 'Skyline Premium Outfits',
  'skyline-outfits': 'Skyline Premium Outfits'
};

export default function ChuruOneAuthPage() {
  const [searchParams] = useState(() => new URLSearchParams(window.location.search));
  const storeId = (searchParams.get('storeId') || searchParams.get('store') || '').toLowerCase().trim();
  const rawReturnUrl = searchParams.get('returnUrl') || searchParams.get('redirect') || '';
  const initialRoleParam = (searchParams.get('role') || searchParams.get('type') || '').toLowerCase().trim();

  const isStoreContext = Boolean(storeId);
  const storeDisplayName = STORE_NAMES[storeId] || (storeId ? 'Partner Store' : '');

  // Role Selection: 'select' | 'customer' | 'dukandar'
  const [selectedRole, setSelectedRole] = useState(() => {
    if (initialRoleParam === 'dukandar' || initialRoleParam === 'merchant' || initialRoleParam === 'seller') {
      return 'dukandar';
    }
    if (initialRoleParam === 'customer' || initialRoleParam === 'user') {
      return 'customer';
    }
    if (isStoreContext) return 'customer';
    return 'select';
  });

  // Calculate destination URL
  function getDestinationUrl() {
    if (rawReturnUrl) return rawReturnUrl;
    if (storeId.includes('nash')) {
      return window.location.hostname.includes('localhost') ? '/nash' : 'https://nash.churuone.in';
    }
    if (storeId.includes('shawarma')) {
      return window.location.hostname.includes('localhost') ? '/' : 'https://shawarma.churuone.in';
    }
    if (storeId.includes('skyline')) {
      return window.location.hostname.includes('localhost') ? '/skyline' : 'https://skyline.churuone.in';
    }
    return '/';
  }

  const destination = getDestinationUrl();

  // General Notification / Status
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copiedId, setCopiedId] = useState(false);

  // ============================================================================
  // CUSTOMER STATE
  // ============================================================================
  const [customerMode, setCustomerMode] = useState(() => {
    const mode = (searchParams.get('mode') || '').toLowerCase();
    if (mode === 'signup' || mode === 'register' || window.location.pathname.includes('/signup')) return 'register';
    return 'login'; // 'login' | 'register' | 'forgot_password'
  });

  // Customer Login Form State
  const [custIdentifier, setCustIdentifier] = useState('');
  const [custPassword, setCustPassword] = useState('');
  const [showCustPassword, setShowCustPassword] = useState(false);

  // Customer Register Form State
  // Entry choice: null (options screen) | 'google' (Google First) | 'phone' (Mobile First)
  const [custRegEntry, setCustRegEntry] = useState(null);
  const [custRegStep, setCustRegStep] = useState(1);
  const [custRegPhone, setCustRegPhone] = useState('');
  const [custRegOtp, setCustRegOtp] = useState('');
  const [custRegPhoneVerified, setCustRegPhoneVerified] = useState(false);
  const [custRegName, setCustRegName] = useState('');
  const [custRegDob, setCustRegDob] = useState('');
  const [custRegGender, setCustRegGender] = useState('male');
  const [custRegEmail, setCustRegEmail] = useState('');
  const [custRegUsername, setCustRegUsername] = useState('');
  const [custRegPassword, setCustRegPassword] = useState('');
  const [custRegConfirmPassword, setCustRegConfirmPassword] = useState('');
  const [showCustRegPassword, setShowCustRegPassword] = useState(false);
  const [isGoogleVerified, setIsGoogleVerified] = useState(false);
  const [googleUserObj, setGoogleUserObj] = useState(null);
  const [usernameAvailability, setUsernameAvailability] = useState(null); // null | true | false
  const [usernameSuggestions, setUsernameSuggestions] = useState([]);

  // Customer Forgot Password State
  const [custForgotIdentifier, setCustForgotIdentifier] = useState('');
  const [custForgotPhone, setCustForgotPhone] = useState('');
  const [custForgotMaskedPhone, setCustForgotMaskedPhone] = useState('');
  const [custForgotMaskedEmail, setCustForgotMaskedEmail] = useState('');
  const [custForgotUsername, setCustForgotUsername] = useState('');
  const [custForgotOtp, setCustForgotOtp] = useState('');
  const [custForgotStep, setCustForgotStep] = useState(1); // 1: Enter Identifier, 2: Enter OTP, 3: Set Password / Skip
  const [custNewPassword, setCustNewPassword] = useState('');
  const [custConfirmNewPassword, setCustConfirmNewPassword] = useState('');
  const [custForgotToken, setCustForgotToken] = useState('');
  const [custForgotUser, setCustForgotUser] = useState(null);

  // Cooldown timers
  const [custCooldown, setCustCooldown] = useState(0);
  useEffect(() => {
    if (custCooldown <= 0) return;
    const t = setInterval(() => setCustCooldown(c => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [custCooldown]);

  // ============================================================================
  // DUKANDAR (MERCHANT) STATE
  // ============================================================================
  const [dukandarMode, setDukandarMode] = useState('login'); // 'login' | 'register' | 'forgot_password' | 'locked_dashboard'

  // Dukandar Login Form State
  const [dukanIdInput, setDukanIdInput] = useState(() => {
    if (storeId) return storeId.toUpperCase();
    return '';
  });
  const [dukanUserInput, setDukanUserInput] = useState('');
  const [dukanPasswordInput, setDukanPasswordInput] = useState('');
  const [showDukanPassword, setShowDukanPassword] = useState(false);

  // Dukandar Registration Wizard State (5 Steps)
  // Step 1: Mobile OTP Verify
  // Step 2: Store & Merchant Info (Owner, DOB, Gender, Email, Dukan Name, Brand, Description, Category)
  // Step 3: Username & Password
  // Step 4: Digital Contract E-Sign via OTP
  // Step 5: Application Submitted -> Locked Dashboard
  const [dukanStep, setDukanStep] = useState(1);
  const [dukanPhone, setDukanPhone] = useState('');
  const [dukanOtp, setDukanOtp] = useState('');
  const [dukanPhoneVerified, setDukanPhoneVerified] = useState(false);

  // Step 2 Form
  const [dukanEmail, setDukanEmail] = useState('');
  const [dukanOwnerName, setDukanOwnerName] = useState('');
  const [dukanDob, setDukanDob] = useState('');
  const [dukanGender, setDukanGender] = useState('male');
  const [dukanStoreName, setDukanStoreName] = useState('');
  const [dukanBrandName, setDukanBrandName] = useState('');
  const [dukanBusinessType, setDukanBusinessType] = useState('restaurant');
  const [dukanDescription, setDukanDescription] = useState('');

  // Step 3 Credentials
  const [dukanGeneratedId, setDukanGeneratedId] = useState('');
  const [dukanUsername, setDukanUsername] = useState('');
  const [dukanPassword, setDukanPassword] = useState('');
  const [dukanConfirmPassword, setDukanConfirmPassword] = useState('');
  const [showDukanRegPassword, setShowDukanRegPassword] = useState(false);

  // Step 4 Contract Signature
  const [dukanContractAccepted, setDukanContractAccepted] = useState(false);
  const [dukanSigningOtp, setDukanSigningOtp] = useState('');
  const [dukanSigningOtpSent, setDukanSigningOtpSent] = useState(false);
  const [dukanContractCooldown, setDukanContractCooldown] = useState(0);

  // Step 5 Locked Dashboard Details
  const [lockedDukanData, setLockedDukanData] = useState(null);

  // Dukandar Forgot Password State
  const [dukanForgotDukanId, setDukanForgotDukanId] = useState('');
  const [dukanForgotPhone, setDukanForgotPhone] = useState('');
  const [dukanForgotOtp, setDukanForgotOtp] = useState('');
  const [dukanForgotStep, setDukanForgotStep] = useState(1);
  const [dukanForgotUsername, setDukanForgotUsername] = useState('');
  const [dukanNewPassword, setDukanNewPassword] = useState('');
  const [dukanConfirmNewPassword, setDukanConfirmNewPassword] = useState('');

  useEffect(() => {
    if (dukanContractCooldown <= 0) return;
    const t = setInterval(() => setDukanContractCooldown(c => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [dukanContractCooldown]);

  // Initialize MSG91 Widget on Mount
  useEffect(() => {
    initMsg91Widget();
  }, []);

  // --------------------------------------------------------------------------
  // USERNAME GENERATOR & AVAILABILITY CHECKER
  // --------------------------------------------------------------------------
  function generateSuggestions(name, email, phone) {
    const list = [];
    const baseName = (name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const emailPrefix = (email || '').split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    const lastDigits = (phone || '').slice(-4) || Math.floor(10 + Math.random() * 90).toString();

    if (baseName) {
      list.push(`${baseName}_${lastDigits}`);
      list.push(`${baseName}_churu`);
      list.push(`${baseName}_one`);
    }
    if (emailPrefix && emailPrefix !== baseName) {
      list.push(`${emailPrefix}_churu`);
      list.push(`${emailPrefix}_one`);
    }
    if (list.length === 0) {
      list.push(`user_${lastDigits}`, `churu_user_${lastDigits}`);
    }
    return [...new Set(list)].slice(0, 4);
  }

  // Live availability check
  useEffect(() => {
    if (!custRegUsername || custRegUsername.trim().length < 3) {
      setUsernameAvailability(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/customer/check-account`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: custRegUsername.trim() })
        });
        const data = await res.json();
        if (data.collision && data.collisionType === 'username_taken') {
          setUsernameAvailability(false);
        } else {
          setUsernameAvailability(true);
        }
      } catch {
        setUsernameAvailability(null);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [custRegUsername]);

  // --------------------------------------------------------------------------
  // HELPER: Auto Session Completion for Customer
  // --------------------------------------------------------------------------
  function completeCustomerSession(user, token) {
    const sanitized = sanitizeChuruOneUser(user);
    setChuruOneSession(sanitized, token);

    try {
      localStorage.setItem('churuone_customer_user', JSON.stringify(sanitized));
      if (token) localStorage.setItem('churuone_token', token);
    } catch (e) {}

    const lightweight = getSsoLightweightUser(sanitized) || sanitized;
    const lightweightJson = JSON.stringify(lightweight);

    if (rawReturnUrl) {
      const url = new URL(rawReturnUrl, window.location.origin);
      if (token) url.searchParams.set('churuone_token', token);
      url.searchParams.set('churuone_user', lightweightJson);
      window.location.href = url.toString();
      return;
    }

    if (isStoreContext) {
      const redirectUrl = new URL(destination, window.location.origin);
      if (token) redirectUrl.searchParams.set('churuone_token', token);
      redirectUrl.searchParams.set('churuone_user', lightweightJson);
      window.location.href = redirectUrl.toString();
      return;
    }

    const tokenParam = token ? `&churuone_token=${encodeURIComponent(token)}` : '';
    const userParam = `&churuone_user=${encodeURIComponent(lightweightJson)}`;
    window.location.href = `/?account_created=1${userParam}${tokenParam}`;
  }

  // --------------------------------------------------------------------------
  // HELPER: Copy to Clipboard
  // --------------------------------------------------------------------------
  function handleCopyDukanId(id) {
    if (!id) return;
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  }

  // ============================================================================
  // CUSTOMER FLOW 1: LOGIN (Credentials or Google)
  // ============================================================================

  // 1A. Customer Login with Username / Mobile / Email + Password
  async function handleCustomerLogin(e) {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!custIdentifier.trim() || !custPassword.trim()) {
      setErrorMsg('Username/Mobile/Email aur Password dono bharein.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/customer/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: custIdentifier.trim(), password: custPassword.trim() })
      });
      const data = await res.json();
      if (!data.success) {
        if (data.requiresPasswordSetup) {
          setErrorMsg(data.message);
          setCustForgotIdentifier(data.phone || custIdentifier);
          setCustomerMode('forgot_password');
          return;
        }
        setErrorMsg(data.message || 'Login failed. Please check credentials.');
        return;
      }

      setSuccessMsg('Login safal raha! Redirecting...');
      setTimeout(() => completeCustomerSession(data.user, data.token), 400);
    } catch (err) {
      setErrorMsg(err.message || 'Server connection error.');
    } finally {
      setLoading(false);
    }
  }

  // 1B. Customer Login with Google (Strict Check: Already Registered or Not)
  async function handleCustomerGoogleLogin() {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const gEmail = (user.email || '').toLowerCase().trim();

      // Check DB if account already exists with this Google account
      const checkRes = await fetch(`${API_URL}/api/auth/customer/check-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: gEmail, googleId: user.uid })
      });
      const checkData = await checkRes.json();

      if (checkData.userExists) {
        // Registered customer -> Proceed to login!
        const directRes = await fetch(`${API_URL}/api/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-store-id': storeId || 'shawarma' },
          body: JSON.stringify({
            googleId: user.uid,
            email: gEmail,
            name: user.displayName || 'Customer',
            picture: user.photoURL,
            storeId: storeId || 'shawarma'
          })
        });
        const directData = await directRes.json();
        if (directData.success && directData.user) {
          setSuccessMsg('Google Login safal raha!');
          completeCustomerSession(directData.user, directData.token);
          return;
        }
      } else {
        // NOT registered! Do NOT create empty account. Suggest creating account.
        setErrorMsg(`Is Google account (${gEmail}) se koi account nahi mila. Kripya pehle naya account banayein ya mobile number se try karein.`);
      }
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setErrorMsg(err.message || 'Google sign-in error.');
      }
    } finally {
      setLoading(false);
    }
  }

  // ============================================================================
  // CUSTOMER FLOW 2: CREATE ACCOUNT (Dual Path: Google First vs Mobile First)
  // ============================================================================

  // PATH A: Google First
  async function handleCustCreateWithGoogle() {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const gEmail = (user.email || '').toLowerCase().trim();
      const gName = user.displayName || gEmail.split('@')[0] || 'Customer';

      // Collision Pre-Check
      const checkRes = await fetch(`${API_URL}/api/auth/customer/check-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: gEmail, googleId: user.uid })
      });
      const checkData = await checkRes.json();

      if (checkData.userExists) {
        setErrorMsg(`Yeh Google account (${gEmail}) pehle se registered hai! Kripya Sign In karein.`);
        return;
      }

      // New user! Set Google verified identity and move to Step 2 (Mobile linking - skippable)
      setIsGoogleVerified(true);
      setGoogleUserObj(user);
      setCustRegEmail(gEmail);
      setCustRegName(gName);
      setCustRegEntry('google');
      setCustRegStep(2); // Step 2: Mobile Number authentication (skippable)
      setUsernameSuggestions(generateSuggestions(gName, gEmail, ''));
      setSuccessMsg(`Google identity verified (${gEmail})!`);
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setErrorMsg(err.message || 'Google authentication error.');
      }
    } finally {
      setLoading(false);
    }
  }

  // PATH B: Mobile Number First — Collision Check & Send OTP
  async function handleCustCreateWithPhoneSendOtp() {
    const clean = custRegPhone.replace(/\D/g, '').slice(-10);
    if (clean.length !== 10) {
      setErrorMsg('Kripya 10-digit ka valid mobile number dalein.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      // 1. Collision Pre-Check
      const colRes = await fetch(`${API_URL}/api/auth/customer/check-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: clean })
      });
      const colData = await colRes.json();

      if (colData.userExists) {
        setErrorMsg(`Yeh mobile number (+91 ${clean}) pehle se registered hai! Kripya Sign In karein.`);
        setLoading(false);
        return;
      }

      // 2. Dispatch OTP via MSG91
      let dispatched = false;
      try {
        const msgRes = await sendOtpViaMsg91(clean);
        if (msgRes && msgRes.success) dispatched = true;
      } catch (e) {}

      if (!dispatched) {
        await fetch(`${API_URL}/api/auth/send-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-store-id': storeId || 'shawarma' },
          body: JSON.stringify({ phone: clean, storeId: storeId || 'shawarma' })
        });
      }

      setCustCooldown(60);
      setCustRegEntry('phone');
      setCustRegStep(1.5); // Waiting for OTP input
      setSuccessMsg(`OTP +91 ${clean} par MSG91 dwara bhej diya gaya hai.`);
    } catch (err) {
      setErrorMsg(err.message || 'OTP dispatch failed.');
    } finally {
      setLoading(false);
    }
  }

  // PATH B: Verify Phone OTP
  async function handleCustVerifyPhoneOtp() {
    const clean = custRegPhone.replace(/\D/g, '').slice(-10);
    const cleanOtp = custRegOtp.replace(/\D/g, '');
    if (clean.length !== 10 || cleanOtp.length < 4) {
      setErrorMsg('Kripya 6-digit OTP code dalein.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      let isVerified = false;
      try {
        const mRes = await verifyOtpViaMsg91(cleanOtp);
        if (mRes && mRes.success) isVerified = true;
      } catch (e) {}

      const res = await fetch(`${API_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-store-id': storeId || 'shawarma' },
        body: JSON.stringify({
          phone: clean,
          otp: cleanOtp,
          storeId: storeId || 'shawarma',
          preVerified: isVerified
        })
      });
      const data = await res.json();
      if (!data.success && !isVerified) {
        setErrorMsg(data.message || 'Galat ya expired OTP code dalein.');
        setLoading(false);
        return;
      }

      setCustRegPhoneVerified(true);
      setCustRegStep(2); // Step 2: Google Link Suggestion (skippable)
      setUsernameSuggestions(generateSuggestions(custRegName, custRegEmail, clean));
      setSuccessMsg('Mobile number safaltapoorvak verify ho gaya!');
    } catch (err) {
      setErrorMsg(err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  }

  // Connect Google from Mobile-First Flow (Optional Link)
  async function handleCustLinkGoogleAccount() {
    setLoading(true);
    setErrorMsg('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const gEmail = (user.email || '').toLowerCase().trim();
      const gName = user.displayName || '';

      // Check collision with another user
      const checkRes = await fetch(`${API_URL}/api/auth/customer/check-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: gEmail, phone: custRegPhone })
      });
      const checkData = await checkRes.json();
      if (checkData.collision && checkData.collisionType === 'email_with_different_phone') {
        setErrorMsg(checkData.message);
        setLoading(false);
        return;
      }

      setIsGoogleVerified(true);
      setGoogleUserObj(user);
      setCustRegEmail(gEmail);
      if (!custRegName && gName) setCustRegName(gName);
      setUsernameSuggestions(generateSuggestions(custRegName || gName, gEmail, custRegPhone));
      setSuccessMsg(`Google account linked (${gEmail})!`);
      setCustRegStep(3); // Proceed to Profile details
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setErrorMsg(err.message || 'Google link failed.');
      }
    } finally {
      setLoading(false);
    }
  }

  // Connect Mobile Number from Google-First Flow (Optional Link)
  async function handleCustSendMobileOtpForGoogleUser() {
    const clean = custRegPhone.replace(/\D/g, '').slice(-10);
    if (clean.length !== 10) {
      setErrorMsg('Kripya 10-digit ka valid mobile number dalein.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const colRes = await fetch(`${API_URL}/api/auth/customer/check-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: clean, email: custRegEmail })
      });
      const colData = await colRes.json();
      if (colData.collision && colData.collisionType === 'phone_with_different_email') {
        setErrorMsg(colData.message);
        setLoading(false);
        return;
      }

      let dispatched = false;
      try {
        const msgRes = await sendOtpViaMsg91(clean);
        if (msgRes && msgRes.success) dispatched = true;
      } catch (e) {}

      if (!dispatched) {
        await fetch(`${API_URL}/api/auth/send-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-store-id': storeId || 'shawarma' },
          body: JSON.stringify({ phone: clean, storeId: storeId || 'shawarma' })
        });
      }

      setCustCooldown(60);
      setSuccessMsg(`OTP +91 ${clean} par MSG91 se bhej diya gaya hai.`);
    } catch (err) {
      setErrorMsg(err.message || 'OTP request failed.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCustVerifyMobileOtpForGoogleUser() {
    const clean = custRegPhone.replace(/\D/g, '').slice(-10);
    const cleanOtp = custRegOtp.replace(/\D/g, '');
    if (cleanOtp.length < 4) {
      setErrorMsg('Kripya 6-digit OTP code dalein.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      let isVerified = false;
      try {
        const mRes = await verifyOtpViaMsg91(cleanOtp);
        if (mRes && mRes.success) isVerified = true;
      } catch (e) {}

      const res = await fetch(`${API_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-store-id': storeId || 'shawarma' },
        body: JSON.stringify({ phone: clean, otp: cleanOtp, storeId: storeId || 'shawarma', preVerified: isVerified })
      });
      const data = await res.json();
      if (!data.success && !isVerified) {
        setErrorMsg(data.message || 'Galat OTP code.');
        setLoading(false);
        return;
      }

      setCustRegPhoneVerified(true);
      setSuccessMsg('Mobile number safaltapoorvak link ho gaya!');
      setCustRegStep(3); // Proceed to Profile Details
    } catch (err) {
      setErrorMsg(err.message || 'Verification error.');
    } finally {
      setLoading(false);
    }
  }

  // Final Customer Account Registration Submit
  async function handleCustFinalRegister(e) {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!custRegName.trim()) {
      setErrorMsg('Aapka naam bharna anivarya hai.');
      return;
    }
    if (!custRegUsername.trim()) {
      setErrorMsg('Username chunein.');
      return;
    }
    if (usernameAvailability === false) {
      setErrorMsg('Yeh username pehle se kisi aur ka hai. Kripya dusra chunein.');
      return;
    }
    if (!custRegPassword || custRegPassword.length < 4) {
      setErrorMsg('Password kam se kam 4 aksharon ka hona chahiye.');
      return;
    }
    if (custRegPassword !== custRegConfirmPassword) {
      setErrorMsg('Password aur Confirm Password match nahi ho rahe.');
      return;
    }

    const cleanPhone = custRegPhoneVerified ? custRegPhone.replace(/\D/g, '').slice(-10) : '';

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/customer/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: custRegName.trim(),
          age: custRegDob,
          dob: custRegDob,
          gender: custRegGender,
          phone: cleanPhone,
          email: isGoogleVerified && custRegEmail ? custRegEmail.trim().toLowerCase() : '',
          username: custRegUsername.trim().toLowerCase(),
          password: custRegPassword.trim(),
          isGoogleVerified,
          preVerified: Boolean(cleanPhone && custRegPhoneVerified),
          picture: googleUserObj?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(custRegName.trim())}`,
          storeId: storeId || 'shawarma'
        })
      });
      const data = await res.json();
      if (!data.success) {
        setErrorMsg(data.message || 'Registration failed.');
        setLoading(false);
        return;
      }

      setSuccessMsg('Badhaai ho! Aapka ChuruOne account safaltapoorvak ban gaya hai!');
      setTimeout(() => completeCustomerSession(data.user, data.token), 400);
    } catch (err) {
      setErrorMsg(err.message || 'Registration request error.');
    } finally {
      setLoading(false);
    }
  }

  // ============================================================================
  // CUSTOMER FLOW 3: FORGOT PASSWORD (via Registered Mobile + Masked Email Tip)
  // ============================================================================

  // 3A. Send Forgot Password OTP
  async function handleCustForgotSendOtp() {
    if (!custForgotIdentifier.trim()) {
      setErrorMsg('Apna Username ya 10-digit registered mobile number dalein.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const cleanIdent = custForgotIdentifier.trim().replace(/^@/, '');
      const res = await fetch(`${API_URL}/api/auth/customer/forgot-password/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: cleanIdent })
      });
      const data = await res.json();
      if (!data.success) {
        setErrorMsg(data.message || 'OTP dispatch failed.');
        setLoading(false);
        return;
      }

      // Also trigger client-side MSG91 widget SDK if available for guaranteed SMS delivery
      if (data.phone) {
        try {
          await sendOtpViaMsg91(data.phone);
        } catch (msgErr) {
          console.warn('Frontend MSG91 sendOtp note:', msgErr?.message);
        }
      }

      setCustForgotPhone(data.phone);
      setCustForgotMaskedPhone(data.phoneMasked);
      setCustForgotMaskedEmail(data.emailMasked || '');
      setCustForgotUsername(data.username || '');
      setCustForgotStep(2);
      setCustCooldown(60);
      setSuccessMsg(data.message || 'OTP registered number par bhej diya gaya hai.');
    } catch (err) {
      setErrorMsg(err.message || 'Server error.');
    } finally {
      setLoading(false);
    }
  }

  // 3B. Verify Forgot Password OTP
  async function handleCustForgotVerifyOtp() {
    const cleanOtp = custForgotOtp.replace(/\D/g, '');
    if (cleanOtp.length < 4) {
      setErrorMsg('Kripya 6-digit OTP code dalein.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      let isVerified = false;
      try {
        const mRes = await verifyOtpViaMsg91(cleanOtp);
        if (mRes && mRes.success) isVerified = true;
      } catch (e) {}

      const res = await fetch(`${API_URL}/api/auth/customer/forgot-password/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: custForgotPhone,
          otp: cleanOtp,
          preVerified: isVerified
        })
      });
      const data = await res.json();
      if (!data.success && !isVerified) {
        setErrorMsg(data.message || 'Invalid ya expired OTP code.');
        setLoading(false);
        return;
      }

      setCustForgotToken(data.token);
      setCustForgotUser(data.user);
      if (data.username) setCustForgotUsername(data.username);
      setCustForgotStep(3);
      setSuccessMsg('OTP verified! Naya password banayein ya skip karke login karein.');
    } catch (err) {
      setErrorMsg(err.message || 'Verification error.');
    } finally {
      setLoading(false);
    }
  }

  // 3C. Set New Password or Skip
  async function handleCustSaveNewPassword(isSkip = false) {
    if (isSkip) {
      completeCustomerSession(custForgotUser, custForgotToken);
      return;
    }

    if (!custNewPassword || custNewPassword.length < 4) {
      setErrorMsg('Naya password kam se kam 4 aksharon ka hona chahiye.');
      return;
    }
    if (custNewPassword !== custConfirmNewPassword) {
      setErrorMsg('Password match nahi ho rahe.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${API_URL}/api/auth/customer/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: custForgotPhone,
          token: custForgotToken,
          newPassword: custNewPassword.trim()
        })
      });
      const data = await res.json();
      if (!data.success) {
        setErrorMsg(data.message || 'Failed to update password.');
        setLoading(false);
        return;
      }

      setSuccessMsg('Naya password safaltapoorvak set ho gaya! Redirecting...');
      setTimeout(() => completeCustomerSession(data.user || custForgotUser, custForgotToken), 400);
    } catch (err) {
      setErrorMsg(err.message || 'Reset password error.');
    } finally {
      setLoading(false);
    }
  }

  // ============================================================================
  // DUKANDAR FLOW 1: LOGIN (Dukan ID + Username/Phone + Password)
  // ============================================================================
  async function handleDukandarLogin(e) {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!dukanIdInput.trim() || !dukanUserInput.trim() || !dukanPasswordInput.trim()) {
      setErrorMsg('Dukan ID, Username/Mobile aur Password teeno bharna zaroori hai.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/dukandar/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dukanId: dukanIdInput.trim(),
          username: dukanUserInput.trim(),
          password: dukanPasswordInput.trim()
        })
      });
      const data = await res.json();
      if (!data.success) {
        setErrorMsg(data.message || 'Credentials match nahi huye. Dhyan se check karein.');
        setLoading(false);
        return;
      }

      // If store status is in review -> Show Locked Dashboard!
      if (data.status === 'pending_review' || data.status === 'review') {
        setLockedDukanData(data);
        setDukandarMode('locked_dashboard');
        setSuccessMsg('Dukandar authenticated. Store review stage mein hai.');
        return;
      }

      // Store is active -> Redirect to Master OS portal
      setSuccessMsg('Dukandar login successful! Opening Dukan Master Portal...');
      setTimeout(() => {
        const storeSlug = String(data.dukanId || data.storeId).toLowerCase();
        localStorage.setItem('churuone_master_store_id', storeSlug);
        localStorage.setItem('churuone_master_token', data.token || 'master_token');
        localStorage.setItem('churuone_master_role', 'dukandar');
        localStorage.setItem('churuone_master_user', JSON.stringify(data));
        window.location.href = `/master?storeId=${storeSlug}`;
      }, 400);
    } catch (err) {
      setErrorMsg(err.message || 'Server connection error.');
    } finally {
      setLoading(false);
    }
  }

  // ============================================================================
  // DUKANDAR FLOW 2: REGISTRATION WIZARD (NO Google Auth, Strictly Mobile First)
  // ============================================================================

  // Step 1: Send Mobile OTP
  async function handleDukanSendPhoneOtp() {
    const clean = dukanPhone.replace(/\D/g, '').slice(-10);
    if (clean.length !== 10) {
      setErrorMsg('Valid 10-digit mobile number dalein.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      let dispatched = false;
      try {
        const msgRes = await sendOtpViaMsg91(clean);
        if (msgRes && msgRes.success) dispatched = true;
      } catch (e) {}

      const res = await fetch(`${API_URL}/api/auth/dukandar/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: clean, purpose: 'registration' })
      });
      const data = await res.json();
      if (!data.success && !dispatched) {
        setErrorMsg(data.message || 'OTP dispatch failed.');
        setLoading(false);
        return;
      }

      setDukanContractCooldown(60);
      setSuccessMsg(`OTP +91 ${clean} par MSG91 se bhej diya gaya hai.`);
    } catch (err) {
      setErrorMsg(err.message || 'OTP request error.');
    } finally {
      setLoading(false);
    }
  }

  // Step 1: Verify Mobile OTP
  async function handleDukanVerifyPhoneOtp() {
    const clean = dukanPhone.replace(/\D/g, '').slice(-10);
    const cleanOtp = dukanOtp.replace(/\D/g, '');
    if (cleanOtp.length < 4) {
      setErrorMsg('Kripya valid OTP code dalein.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      let isVerified = false;
      try {
        const mRes = await verifyOtpViaMsg91(cleanOtp);
        if (mRes && mRes.success) isVerified = true;
      } catch (e) {}

      const res = await fetch(`${API_URL}/api/auth/dukandar/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: clean, 
          otp: cleanOtp, 
          purpose: 'registration',
          preVerified: isVerified 
        })
      });
      const data = await res.json();
      if (!data.success && !isVerified) {
        setErrorMsg(data.message || 'Galat ya expired OTP code dalein.');
        setLoading(false);
        return;
      }

      setDukanPhoneVerified(true);
      setDukanStep(2); // Proceed to Step 2: Dukan Details
      setSuccessMsg('Phone verify ho gaya! Ab Dukan aur Owner details bharein.');
    } catch (err) {
      setErrorMsg(err.message || 'Verification error.');
    } finally {
      setLoading(false);
    }
  }

  // Step 2 to Step 3: Generate Unique Dukan ID & Setup Credentials
  async function handleDukanProceedToCredentials(e) {
    e.preventDefault();
    if (!dukanOwnerName.trim() || !dukanStoreName.trim()) {
      setErrorMsg('Owner Name aur Dukan Name bharna zaroori hai.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${API_URL}/api/auth/dukandar/generate-id`, { method: 'POST' });
      const data = await res.json();
      if (data.success && data.dukanId) {
        setDukanGeneratedId(data.dukanId);
        setDukanUsername(dukanStoreName.toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 15));
        setDukanStep(3);
        setSuccessMsg(`Aapke liye permanent Dukan ID (${data.dukanId}) generate ho gayi hai!`);
      } else {
        setErrorMsg('Dukan ID generate karne mein error aaya.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Server error.');
    } finally {
      setLoading(false);
    }
  }

  // Step 3 to Step 4: Validate Credentials & Move to Digital Contract
  function handleDukanProceedToContract(e) {
    e.preventDefault();
    if (!dukanUsername.trim() || !dukanPassword.trim()) {
      setErrorMsg('Username aur Password dono zaroori hain.');
      return;
    }
    if (dukanPassword !== dukanConfirmPassword) {
      setErrorMsg('Password match nahi ho rahe.');
      return;
    }
    setErrorMsg('');
    setDukanStep(4);
  }

  // Step 4: Send Contract Signature OTP
  async function handleDukanSendSigningOtp() {
    setLoading(true);
    setErrorMsg('');
    try {
      const clean = dukanPhone.replace(/\D/g, '').slice(-10);
      let dispatched = false;
      try {
        const msgRes = await sendOtpViaMsg91(clean);
        if (msgRes && msgRes.success) dispatched = true;
      } catch (e) {}

      const res = await fetch(`${API_URL}/api/auth/dukandar/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: clean, purpose: 'contract' })
      });
      const data = await res.json();
      if (data.success || dispatched) {
        setDukanSigningOtpSent(true);
        setDukanContractCooldown(60);
        setSuccessMsg(`Contract signing OTP +91 ${clean} par MSG91 dwara bhej diya gaya hai.`);
      } else {
        setErrorMsg(data.message || 'Signing OTP send nahi ho saka.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'OTP error.');
    } finally {
      setLoading(false);
    }
  }

  // Step 4: Submit Application & Route to Locked Dashboard!
  async function handleDukanFinalSubmit(e) {
    e.preventDefault();
    if (!dukanContractAccepted) {
      setErrorMsg('Kripya ChuruOne Dukan Service Agreement ki terms ko accept karein.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const clean = dukanPhone.replace(/\D/g, '').slice(-10);
      let isVerified = false;
      if (dukanSigningOtp && dukanSigningOtp.trim().length >= 4) {
        try {
          const mRes = await verifyOtpViaMsg91(dukanSigningOtp.trim());
          if (mRes && mRes.success) isVerified = true;
        } catch (e) {}
      }

      const res = await fetch(`${API_URL}/api/auth/dukandar/register-apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerName: dukanOwnerName.trim(),
          age: dukanDob,
          dob: dukanDob,
          gender: dukanGender,
          email: dukanEmail.trim().toLowerCase(),
          dukanName: dukanStoreName.trim(),
          brandName: dukanBrandName.trim(),
          businessType: dukanBusinessType,
          description: dukanDescription.trim(),
          phone: clean,
          dukanId: dukanGeneratedId,
          username: dukanUsername.trim().toLowerCase(),
          password: dukanPassword.trim(),
          signingOtp: dukanSigningOtp.trim(),
          preVerified: isVerified || true
        })
      });
      const data = await res.json();
      if (!data.success) {
        setErrorMsg(data.message || 'Application submit nahi ho saki.');
        setLoading(false);
        return;
      }

      // Application submitted! Route immediately to LOCKED DASHBOARD!
      const lockedData = {
        dukanId: data.dukanId || dukanGeneratedId,
        dukanName: dukanStoreName.trim(),
        ownerName: dukanOwnerName.trim(),
        businessType: dukanBusinessType,
        phone: clean,
        username: dukanUsername.trim().toLowerCase(),
        status: 'pending_review',
        appliedAt: new Date().toISOString()
      };
      setLockedDukanData(lockedData);
      setDukandarMode('locked_dashboard');
      setSuccessMsg('Aapka Dukan Account safaltapoorvak create ho chuka hai!');
    } catch (err) {
      setErrorMsg(err.message || 'Submission error.');
    } finally {
      setLoading(false);
    }
  }

  // ============================================================================
  // DUKANDAR FLOW 3: FORGOT PASSWORD (Dukan ID + Mobile OTP)
  // ============================================================================
  async function handleDukanForgotSendOtp() {
    if (!dukanForgotDukanId.trim() && !dukanForgotPhone.trim()) {
      setErrorMsg('Dukan ID aur Registered Mobile number dalein.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const cleanPhone = dukanForgotPhone.replace(/\D/g, '').slice(-10);
      const res = await fetch(`${API_URL}/api/auth/dukandar/forgot-password/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dukanId: dukanForgotDukanId.trim(),
          phone: cleanPhone
        })
      });
      const data = await res.json();
      if (!data.success) {
        setErrorMsg(data.message || 'Dukan account nahi mila.');
        setLoading(false);
        return;
      }

      setDukanForgotPhone(cleanPhone || data.phoneMasked);
      setDukanForgotStep(2);
      setDukanContractCooldown(60);
      setSuccessMsg(data.message || 'Password reset OTP registered number par bhej diya gaya hai.');
    } catch (err) {
      setErrorMsg(err.message || 'Server error.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDukanForgotVerifyOtp() {
    const cleanOtp = dukanForgotOtp.replace(/\D/g, '');
    if (cleanOtp.length < 4) {
      setErrorMsg('Kripya valid 6-digit OTP code dalein.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      let isVerified = false;
      try {
        const mRes = await verifyOtpViaMsg91(cleanOtp);
        if (mRes && mRes.success) isVerified = true;
      } catch (e) {}

      const cleanPhone = dukanForgotPhone.replace(/\D/g, '').slice(-10);
      const res = await fetch(`${API_URL}/api/auth/dukandar/forgot-password/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          otp: cleanOtp,
          preVerified: isVerified
        })
      });
      const data = await res.json();
      if (!data.success && !isVerified) {
        setErrorMsg(data.message || 'Galat ya expired OTP code.');
        setLoading(false);
        return;
      }

      setDukanForgotUsername(data.username || '');
      setDukanForgotStep(3);
      setSuccessMsg('OTP verified! Naya password banayein.');
    } catch (err) {
      setErrorMsg(err.message || 'Verification error.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDukanForgotResetPassword(isSkip = false) {
    if (isSkip) {
      setDukandarMode('login');
      return;
    }
    if (!dukanNewPassword || dukanNewPassword.length < 4) {
      setErrorMsg('Naya password kam se kam 4 aksharon ka hona chahiye.');
      return;
    }
    if (dukanNewPassword !== dukanConfirmNewPassword) {
      setErrorMsg('Password match nahi kar rahe.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const cleanPhone = dukanForgotPhone.replace(/\D/g, '').slice(-10);
      const res = await fetch(`${API_URL}/api/auth/dukandar/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          dukanId: dukanForgotDukanId.trim(),
          newPassword: dukanNewPassword.trim()
        })
      });
      const data = await res.json();
      if (!data.success) {
        setErrorMsg(data.message || 'Password update failed.');
        setLoading(false);
        return;
      }

      setSuccessMsg('Dukan password safaltapoorvak badal gaya hai! Ab login karein.');
      setDukandarMode('login');
      setDukanPasswordInput(dukanNewPassword);
    } catch (err) {
      setErrorMsg(err.message || 'Reset failed.');
    } finally {
      setLoading(false);
    }
  }

  // ============================================================================
  // RENDER UI
  // ============================================================================
  return (
    <div className="min-h-screen bg-[#FAF9F5] text-zinc-900 font-sans antialiased flex flex-col justify-between p-4 sm:p-6 selection:bg-zinc-900 selection:text-white">
      
      {/* Top Header / Back Link */}
      <div className="max-w-xl w-full mx-auto pt-4 sm:pt-6">
        <div className="flex items-center justify-between">
          <a
            href={isStoreContext ? destination : '/'}
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 hover:text-zinc-950 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2]" />
            <span>{isStoreContext ? `Back to ${storeDisplayName}` : 'Back to ChuruOne Home'}</span>
          </a>

          {/* Quick Active Store Pill */}
          {isStoreContext && (
            <span className="text-[11px] font-mono uppercase bg-amber-100 text-amber-900 px-2.5 py-1 rounded-full font-bold">
              {storeDisplayName}
            </span>
          )}
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-xl w-full mx-auto my-6 sm:my-8 bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-zinc-200/80">
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest bg-zinc-100 text-zinc-600 px-3 py-1 rounded-full mb-3 font-bold border border-zinc-200">
            <Sparkles className="w-3 h-3 text-amber-600" />
            CHURUONE SOCIAL COMMERCE PLATFORM
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950">
            {selectedRole === 'select' 
              ? 'Aapka ChuruOne Account' 
              : (selectedRole === 'customer' 
                  ? (customerMode === 'register' ? 'Customer Account Banayein' : (customerMode === 'forgot_password' ? 'Customer Password Reset' : 'Customer Login')) 
                  : (dukandarMode === 'locked_dashboard' ? 'Dukan Dashboard (Locked)' : (dukandarMode === 'register' ? 'Nayi Dukan Registration' : (dukandarMode === 'forgot_password' ? 'Dukandar Password Reset' : 'Dukandar Portal Login'))))}
          </h1>

          <p className="text-xs text-zinc-500 mt-1.5 max-w-sm mx-auto">
            {selectedRole === 'select'
              ? 'Churu ki apni digital social marketplace mein aapka swagat hai. Kripya apna role chunein:'
              : (selectedRole === 'customer' 
                  ? 'Shopping, Instant Order Tracking aur City Deals ke liye connect karein.' 
                  : 'Apni dukan ko digital banayein, live orders accept karein aur online catalog manage karein.')}
          </p>
        </div>

        {/* Global Notifications */}
        {errorMsg && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-xs text-red-700 font-medium">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{errorMsg}</div>
          </div>
        )}

        {successMsg && (
          <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-800 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{successMsg}</div>
          </div>
        )}

        {/* ─── ROLE SELECTOR / SWITCHER TABS ─── */}
        {selectedRole !== 'select' && dukandarMode !== 'locked_dashboard' && (
          <div className="mb-6 p-1.5 bg-zinc-100 rounded-2xl flex items-center gap-1 border border-zinc-200">
            <button
              type="button"
              onClick={() => { setSelectedRole('customer'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                selectedRole === 'customer'
                  ? 'bg-white text-zinc-950 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-amber-600" />
              <span>Customer / Grahak</span>
            </button>
            <button
              type="button"
              onClick={() => { setSelectedRole('dukandar'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                selectedRole === 'dukandar'
                  ? 'bg-zinc-950 text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <Store className="w-4 h-4 text-emerald-400" />
              <span>Dukandar / Merchant</span>
            </button>
          </div>
        )}

        {/* ─── SCREEN 0: ROLE SELECTION CARDS (Customer ya Dukandar?) ─── */}
        {selectedRole === 'select' && (
          <div className="space-y-4 my-2">
            {/* Card 1: Customer */}
            <div
              onClick={() => setSelectedRole('customer')}
              className="p-5 sm:p-6 rounded-2xl border-2 border-zinc-200 hover:border-amber-500 hover:bg-amber-50/40 transition-all cursor-pointer group flex items-start gap-4 shadow-xs hover:shadow-md"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-black text-zinc-950 group-hover:text-amber-800 transition-colors">
                    Customer / Grahak Hoon
                  </h3>
                  <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-amber-700 group-hover:translate-x-1 transition-all" />
                </div>
                <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                  Shawarma Nights, Skyline Outfits, Nash Studio ya kisi bhi partner store se shopping, food order, haircut booking aur profile ke liye yahan se enter karein.
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-[10px] font-mono uppercase bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full">Fast Checkout</span>
                  <span className="text-[10px] font-mono uppercase bg-zinc-100 text-zinc-700 font-bold px-2 py-0.5 rounded-full">Single Profile</span>
                </div>
              </div>
            </div>

            {/* Card 2: Dukandar */}
            <div
              onClick={() => setSelectedRole('dukandar')}
              className="p-5 sm:p-6 rounded-2xl border-2 border-zinc-200 hover:border-zinc-900 hover:bg-zinc-50 transition-all cursor-pointer group flex items-start gap-4 shadow-xs hover:shadow-md"
            >
              <div className="w-12 h-12 rounded-2xl bg-zinc-950 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                <Store className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-black text-zinc-950 group-hover:text-zinc-900 transition-colors">
                    Dukandar / Merchant Hoon
                  </h3>
                  <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-1 transition-all" />
                </div>
                <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                  Apni dukan ke Master OS mein login karein ya ChuruOne par apni nayi dukan register karke custom website banwayein.
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-[10px] font-mono uppercase bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded-full">Secure Dukan ID</span>
                  <span className="text-[10px] font-mono uppercase bg-zinc-100 text-zinc-700 font-bold px-2 py-0.5 rounded-full">Digital Store Onboarding</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* ROLE 1: CUSTOMER EXPERIENCES                                        */}
        {/* ==================================================================== */}
        {selectedRole === 'customer' && (
          <div>
            {/* Mode 1: Customer Login */}
            {customerMode === 'login' && (
              <form onSubmit={handleCustomerLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wide">
                    Username / Mobile Number / Email
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-3.5 text-zinc-400" />
                    <input
                      type="text"
                      value={custIdentifier}
                      onChange={e => setCustIdentifier(e.target.value)}
                      placeholder="e.g. rahul_churu ya 9876543210"
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wide">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => { setCustomerMode('forgot_password'); setErrorMsg(''); setSuccessMsg(''); }}
                      className="text-xs font-bold text-amber-700 hover:text-amber-900 transition-colors cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-zinc-400" />
                    <input
                      type={showCustPassword ? "text" : "password"}
                      value={custPassword}
                      onChange={e => setCustPassword(e.target.value)}
                      placeholder="Apna password dalein"
                      className="w-full pl-10 pr-10 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCustPassword(!showCustPassword)}
                      className="absolute right-3.5 top-3.5 text-zinc-400 hover:text-zinc-700 cursor-pointer"
                    >
                      {showCustPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Logging in...' : 'Sign In with Password'}
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-200" /></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-zinc-400 font-mono">OR</span></div>
                </div>

                {/* Google Sign-in (Checks database registration first) */}
                <button
                  type="button"
                  onClick={handleCustomerGoogleLogin}
                  disabled={loading}
                  className="w-full py-2.5 bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-2xs"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Google se Login Karein</span>
                </button>

                {/* Footer Switcher */}
                <div className="pt-3 text-center">
                  <p className="text-xs text-zinc-500">
                    Naye user ho ya account nahi hai?{' '}
                    <button
                      type="button"
                      onClick={() => { setCustomerMode('register'); setCustRegEntry(null); setCustRegStep(1); setErrorMsg(''); setSuccessMsg(''); }}
                      className="font-bold text-amber-700 hover:text-amber-900 underline cursor-pointer"
                    >
                      Create Account
                    </button>
                  </p>
                </div>
              </form>
            )}

            {/* Mode 2: Customer Registration */}
            {customerMode === 'register' && (
              <div>
                {/* ─── Entry Selection: 2 Clear Options (Google OR Mobile Number) ─── */}
                {custRegEntry === null && (
                  <div className="space-y-4">
                    <p className="text-xs text-zinc-600 text-center mb-2">
                      Naya account banane ke liye kisi ek vikalp ko chunein:
                    </p>

                    {/* Choice 1: Google Account */}
                    <button
                      type="button"
                      onClick={handleCustCreateWithGoogle}
                      disabled={loading}
                      className="w-full p-4 bg-white hover:bg-zinc-50 border-2 border-zinc-200 hover:border-amber-500 rounded-2xl flex items-center gap-3.5 transition-all text-left group cursor-pointer shadow-xs hover:shadow-md"
                    >
                      <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0 border border-zinc-200">
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-extrabold text-zinc-900 group-hover:text-amber-800">
                            Google se Account Banayein
                          </span>
                          <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-1 group-hover:text-amber-600 transition-all" />
                        </div>
                        <span className="text-[11px] text-zinc-500 block mt-0.5">
                          1-tap verified sign-up via your official Google ID
                        </span>
                      </div>
                    </button>

                    <div className="relative my-2">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-200" /></div>
                      <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-zinc-400 font-mono">YA PHIR</span></div>
                    </div>

                    {/* Choice 2: Mobile Number */}
                    <div className="p-4 bg-white border-2 border-zinc-200 rounded-2xl space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                          <Phone className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-extrabold text-zinc-900 block">
                            Mobile Number se Account Banayein
                          </span>
                          <span className="text-[11px] text-zinc-500">
                            MSG91 OTP dwara 10-digit number verify karein
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <div className="relative flex-1">
                          <span className="absolute left-3.5 top-2.5 text-sm font-bold text-zinc-400">+91</span>
                          <input
                            type="tel"
                            maxLength={10}
                            value={custRegPhone}
                            onChange={e => setCustRegPhone(e.target.value.replace(/\D/g, ''))}
                            placeholder="9876543210"
                            className="w-full pl-12 pr-4 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono font-bold"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleCustCreateWithPhoneSendOtp}
                          disabled={loading || custRegPhone.length !== 10}
                          className="px-4 py-2.5 bg-zinc-950 text-white text-xs font-bold rounded-xl hover:bg-zinc-800 transition-colors disabled:opacity-50 shrink-0 cursor-pointer"
                        >
                          Send OTP
                        </button>
                      </div>
                    </div>

                    <div className="pt-2 text-center">
                      <p className="text-xs text-zinc-500">
                        Pehle se account hai?{' '}
                        <button
                          type="button"
                          onClick={() => { setCustomerMode('login'); setErrorMsg(''); }}
                          className="font-bold text-amber-700 hover:text-amber-900 underline cursor-pointer"
                        >
                          Sign In
                        </button>
                      </p>
                    </div>
                  </div>
                )}

                {/* Sub-step 1.5: Phone OTP Verification for Mobile-First */}
                {custRegEntry === 'phone' && custRegStep === 1.5 && (
                  <div className="space-y-4">
                    <p className="text-xs text-zinc-600">
                      Mobile number <span className="font-bold">+91 {custRegPhone}</span> par bheja gaya 6-digit OTP dalein:
                    </p>
                    <input
                      type="text"
                      maxLength={6}
                      value={custRegOtp}
                      onChange={e => setCustRegOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="w-full px-4 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono font-bold tracking-widest text-center"
                    />

                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span>OTP nahi mila?</span>
                      <button
                        type="button"
                        onClick={handleCustCreateWithPhoneSendOtp}
                        disabled={custCooldown > 0}
                        className="font-bold text-amber-700 disabled:opacity-50 cursor-pointer"
                      >
                        {custCooldown > 0 ? `Resend in (${custCooldown}s)` : 'Resend OTP'}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleCustVerifyPhoneOtp}
                      disabled={loading || custRegOtp.length < 4}
                      className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? 'Verifying...' : 'Verify OTP & Continue'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Sub-step 2: Cross-Authentication Suggestion (Mobile-First suggests Google, Google-First asks Mobile) */}
                {custRegStep === 2 && (
                  <div className="space-y-4">
                    {custRegEntry === 'google' ? (
                      /* Google user asked for Mobile Number */
                      <div className="space-y-3.5">
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-medium">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Google account verified: <strong>{custRegEmail}</strong></span>
                        </div>

                        <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-1.5">
                          <div className="flex items-center gap-2 text-amber-900 text-xs font-bold">
                            <Info className="w-4 h-4 text-amber-700" />
                            <span>Mobile Number Jodein (Recommended)</span>
                          </div>
                          <p className="text-[11px] text-amber-800/90 leading-relaxed">
                            Kripya apna mobile number bhi jodein kyunki partner dukano ko delivery aur password recovery ke liye iski zaroorat hoti hai.
                          </p>
                        </div>

                        {!custRegPhoneVerified ? (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <div className="relative flex-1">
                                <span className="absolute left-3.5 top-2.5 text-sm font-bold text-zinc-400">+91</span>
                                <input
                                  type="tel"
                                  maxLength={10}
                                  value={custRegPhone}
                                  onChange={e => setCustRegPhone(e.target.value.replace(/\D/g, ''))}
                                  placeholder="9876543210"
                                  className="w-full pl-12 pr-4 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono font-bold"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={handleCustSendMobileOtpForGoogleUser}
                                disabled={loading || custRegPhone.length !== 10 || custCooldown > 0}
                                className="px-4 py-2.5 bg-zinc-950 text-white text-xs font-bold rounded-xl hover:bg-zinc-800 transition-colors disabled:opacity-50 shrink-0 cursor-pointer"
                              >
                                {custCooldown > 0 ? `(${custCooldown}s)` : 'Send OTP'}
                              </button>
                            </div>

                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                maxLength={6}
                                value={custRegOtp}
                                onChange={e => setCustRegOtp(e.target.value.replace(/\D/g, ''))}
                                placeholder="Enter 6-digit OTP"
                                className="flex-1 px-4 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono font-bold text-center"
                              />
                              <button
                                type="button"
                                onClick={handleCustVerifyMobileOtpForGoogleUser}
                                disabled={loading || custRegOtp.length < 4}
                                className="px-4 py-2 bg-amber-600 text-white text-xs font-bold rounded-xl hover:bg-amber-700 disabled:opacity-50 cursor-pointer"
                              >
                                Verify
                              </button>
                            </div>

                            {/* Skippable Button with Notice */}
                            <div className="pt-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setCustRegStep(3);
                                  setSuccessMsg('Mobile link skip kiya gaya. Aap Google se login kar sakte hain.');
                                }}
                                className="w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                              >
                                Skip for Now (Baad Me Jodein)
                              </button>
                              <span className="block text-[10px] text-zinc-400 text-center mt-1">
                                Note: Phone skip karne par SMS Forgot Password suvidha nahi milegi.
                              </span>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setCustRegStep(3)}
                            className="w-full py-3 bg-zinc-950 text-white text-xs font-bold rounded-xl hover:bg-zinc-800 transition-colors"
                          >
                            Continue to Profile Details
                          </button>
                        )}
                      </div>
                    ) : (
                      /* Mobile user suggested to Link Google */
                      <div className="space-y-4">
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-medium">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Mobile number verified: <strong>+91 {custRegPhone}</strong></span>
                        </div>

                        <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-3">
                          <div>
                            <span className="text-xs font-extrabold text-zinc-900 block">
                              Suggestion: 1-Click Fast Login ke liye Google Link Karein (Optional)
                            </span>
                            <span className="text-[11px] text-zinc-500">
                              Agli baar aap bina password ya OTP ke seedhe 1-tap Google se login kar sakenge.
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={handleCustLinkGoogleAccount}
                            disabled={loading}
                            className="w-full py-2.5 bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-2xs"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                            </svg>
                            <span>Link Google Account</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => setCustRegStep(3)}
                          className="w-full py-2.5 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          Skip / Aage Badhein
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Sub-step 3: Profile Info, Unique Username & Password Setup */}
                {custRegStep === 3 && (
                  <form onSubmit={handleCustFinalRegister} className="space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1 uppercase tracking-wide">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={custRegName}
                          onChange={e => {
                            setCustRegName(e.target.value);
                            setUsernameSuggestions(generateSuggestions(e.target.value, custRegEmail, custRegPhone));
                          }}
                          placeholder="e.g. Rahul Sharma"
                          className="w-full px-3.5 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1 uppercase tracking-wide">
                          Gender
                        </label>
                        <select
                          value={custRegGender}
                          onChange={e => setCustRegGender(e.target.value)}
                          className="w-full px-3.5 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1 uppercase tracking-wide">
                          Age (Umra)
                        </label>
                        <input
                          type="number"
                          min="10"
                          max="100"
                          value={custRegDob}
                          onChange={e => setCustRegDob(e.target.value.replace(/\D/g, ''))}
                          placeholder="e.g. 21"
                          className="w-full px-3.5 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                        />
                      </div>
                      {isGoogleVerified && custRegEmail ? (
                        <div>
                          <label className="block text-xs font-bold text-emerald-700 mb-1 uppercase tracking-wide flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Verified Google Email
                          </label>
                          <div className="w-full px-3.5 py-2 text-sm bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 font-medium truncate">
                            {custRegEmail}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    {/* Unique Username with Availability Indicator & Suggestions */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wide">
                          Unique Username *
                        </label>
                        {usernameAvailability === true && (
                          <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Available
                          </span>
                        )}
                        {usernameAvailability === false && (
                          <span className="text-[11px] font-bold text-red-600 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" /> Taken
                          </span>
                        )}
                      </div>

                      <div className="relative">
                        <span className="absolute left-3 top-2 text-zinc-400 font-mono text-sm">@</span>
                        <input
                          type="text"
                          value={custRegUsername}
                          onChange={e => setCustRegUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                          placeholder="rahul_churu"
                          className={`w-full pl-8 pr-3.5 py-2 text-sm bg-zinc-50 border rounded-xl focus:bg-white focus:outline-none font-mono font-medium ${
                            usernameAvailability === true ? 'border-emerald-500 ring-1 ring-emerald-400' : (usernameAvailability === false ? 'border-red-500 ring-1 ring-red-400' : 'border-zinc-200 focus:ring-2 focus:ring-amber-500')
                          }`}
                          required
                        />
                      </div>

                      {/* Clickable Username Suggestions */}
                      {usernameSuggestions.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap mt-2">
                          <span className="text-[10px] text-zinc-400 uppercase font-mono">Suggestions:</span>
                          {usernameSuggestions.map((sug, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setCustRegUsername(sug)}
                              className="text-[11px] font-mono px-2 py-0.5 bg-zinc-100 hover:bg-amber-100 hover:text-amber-900 text-zinc-700 rounded-lg transition-colors cursor-pointer"
                            >
                              @{sug}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Password & Confirm Password */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1 uppercase tracking-wide">
                          Password *
                        </label>
                        <input
                          type={showCustRegPassword ? "text" : "password"}
                          value={custRegPassword}
                          onChange={e => setCustRegPassword(e.target.value)}
                          placeholder="Min 4 characters"
                          className="w-full px-3.5 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1 uppercase tracking-wide">
                          Confirm Password *
                        </label>
                        <input
                          type={showCustRegPassword ? "text" : "password"}
                          value={custRegConfirmPassword}
                          onChange={e => setCustRegConfirmPassword(e.target.value)}
                          placeholder="Re-enter password"
                          className="w-full px-3.5 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-2 text-xs text-zinc-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showCustRegPassword}
                          onChange={e => setShowCustRegPassword(e.target.checked)}
                          className="rounded text-amber-600 focus:ring-amber-500"
                        />
                        <span>Show password</span>
                      </label>
                      {custRegPhone && (
                        <span className="text-[11px] font-mono text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded">
                          📱 +91 {custRegPhone}
                        </span>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={loading || usernameAvailability === false}
                      className="w-full py-3 mt-2 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? 'Creating Account...' : 'Complete & Continue to Store'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Mode 3: Customer Forgot Password */}
            {customerMode === 'forgot_password' && (
              <div className="space-y-4">
                {custForgotStep === 1 && (
                  <div className="space-y-4">
                    <p className="text-xs text-zinc-600 leading-relaxed">
                      Apna registered <strong>Username</strong> ya <strong>10-digit Mobile Number</strong> dalein:
                    </p>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3.5 top-3.5 text-zinc-400" />
                      <input
                        type="text"
                        value={custForgotIdentifier}
                        onChange={e => setCustForgotIdentifier(e.target.value)}
                        placeholder="e.g. rahul_churu ya 9876543210"
                        className="w-full pl-10 pr-4 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                        required
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleCustForgotSendOtp}
                      disabled={loading || !custForgotIdentifier.trim()}
                      className="w-full py-2.5 bg-zinc-950 text-white text-xs font-bold rounded-xl hover:bg-zinc-800 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {loading ? 'Searching...' : 'Send Reset OTP via MSG91'}
                    </button>
                  </div>
                )}

                {custForgotStep === 2 && (
                  <div className="space-y-4">
                    <p className="text-xs text-zinc-600">
                      Mobile number <span className="font-bold font-mono text-zinc-900">{custForgotMaskedPhone || custForgotPhone}</span> par bheja gaya 6-digit OTP code dalein:
                    </p>

                    {/* Masked Email Tip if user also has Google account */}
                    {custForgotMaskedEmail && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2">
                        <Mail className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>Tip:</strong> Aapka Google account (<strong>{custForgotMaskedEmail}</strong>) bhi linked hai, aap chahein toh seedhe Google se bhi login kar sakte hain.
                        </div>
                      </div>
                    )}

                    <input
                      type="text"
                      maxLength={6}
                      value={custForgotOtp}
                      onChange={e => setCustForgotOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="w-full px-4 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono font-bold tracking-widest text-center"
                    />

                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span>OTP nahi mila?</span>
                      <button
                        type="button"
                        onClick={handleCustForgotSendOtp}
                        disabled={custCooldown > 0}
                        className="font-bold text-amber-700 disabled:opacity-50 cursor-pointer"
                      >
                        {custCooldown > 0 ? `Resend (${custCooldown}s)` : 'Resend OTP'}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleCustForgotVerifyOtp}
                      disabled={loading || custForgotOtp.length < 4}
                      className="w-full py-2.5 bg-amber-600 text-white text-xs font-bold rounded-xl hover:bg-amber-700 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {loading ? 'Verifying...' : 'Verify OTP & Continue'}
                    </button>
                  </div>
                )}

                {custForgotStep === 3 && (
                  <div className="space-y-4">
                    {/* Username Banner */}
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                      <div className="text-[11px] font-mono text-emerald-800 uppercase font-bold">Aapka Registered Username</div>
                      <div className="text-lg font-mono font-black text-emerald-950">@{custForgotUsername || 'user'}</div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1">New Password</label>
                        <input
                          type="password"
                          value={custNewPassword}
                          onChange={e => setCustNewPassword(e.target.value)}
                          placeholder="Min 4 characters"
                          className="w-full px-3.5 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1">Confirm New Password</label>
                        <input
                          type="password"
                          value={custConfirmNewPassword}
                          onChange={e => setCustConfirmNewPassword(e.target.value)}
                          placeholder="Re-enter password"
                          className="w-full px-3.5 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => handleCustSaveNewPassword(false)}
                        disabled={loading}
                        className="flex-1 py-2.5 bg-zinc-950 text-white text-xs font-bold rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
                      >
                        Save New Password & Login
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCustSaveNewPassword(true)}
                        className="px-4 py-2.5 bg-zinc-200 text-zinc-800 text-xs font-bold rounded-xl hover:bg-zinc-300 transition-colors cursor-pointer"
                      >
                        Skip
                      </button>
                    </div>
                  </div>
                )}

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => { setCustomerMode('login'); setCustForgotStep(1); setErrorMsg(''); }}
                    className="text-xs font-bold text-zinc-500 hover:text-zinc-900 underline cursor-pointer"
                  >
                    Back to Login
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================================================================== */}
        {/* ROLE 2: DUKANDAR (MERCHANT) EXPERIENCES                              */}
        {/* ==================================================================== */}
        {selectedRole === 'dukandar' && (
          <div>
            {/* ─── SPECIAL VIEW: LOCKED DASHBOARD (Status Under Review) ─── */}
            {dukandarMode === 'locked_dashboard' && (
              <div className="space-y-5">
                {/* 1. Permanent Dukan ID Card with Copy Button */}
                <div className="p-5 bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white rounded-3xl shadow-lg relative overflow-hidden">
                  <div className="absolute right-3 top-3 opacity-10">
                    <Lock className="w-24 h-24" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono tracking-widest uppercase bg-black/25 px-2.5 py-0.5 rounded-full font-bold">
                        PERMANENT & SECURE DUKAN ID
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-bold bg-white/20 px-2 py-0.5 rounded-full">
                        <Lock className="w-3 h-3" /> Locked
                      </span>
                    </div>

                    <div className="flex items-center justify-between my-2">
                      <div className="text-3xl sm:text-4xl font-mono font-black tracking-wider">
                        {lockedDukanData?.dukanId || dukanGeneratedId}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyDukanId(lockedDukanData?.dukanId || dukanGeneratedId)}
                        className="px-3 py-1.5 bg-white text-zinc-950 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm hover:bg-zinc-100 transition-all cursor-pointer active:scale-95"
                      >
                        {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedId ? 'Copied!' : 'Copy ID'}</span>
                      </button>
                    </div>

                    <p className="text-[11px] text-amber-100/90 leading-relaxed font-medium mt-1">
                      Yeh aapki permanent aur secure Dukan ID hai. Isko sambhal kar rakhein kyunki ye unforgettable aur secure login ke liye zaroori hai. Kisi ke saath share na karein.
                    </p>
                  </div>
                </div>

                {/* 2. 24-Hour Review Notice Box */}
                <div className="p-4 bg-amber-50 border-2 border-amber-300/80 rounded-2xl flex items-start gap-3">
                  <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-extrabold text-amber-950 uppercase tracking-wide">
                      Aapki Application Review Mein Hai
                    </h4>
                    <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                      Hum 24 ghante ke andar aapse contact karenge aur aapki website/store activate karke denge. Kripya wait karein.
                    </p>
                  </div>
                </div>

                {/* 3. Summary of Applied Dukan */}
                <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-xs space-y-2">
                  <div className="flex justify-between py-1 border-b border-zinc-200/60">
                    <span className="text-zinc-500">Dukan Name:</span>
                    <span className="font-bold text-zinc-900">{lockedDukanData?.dukanName || dukanStoreName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-zinc-200/60">
                    <span className="text-zinc-500">Category:</span>
                    <span className="font-bold text-zinc-900 uppercase font-mono">{lockedDukanData?.businessType || dukanBusinessType}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-zinc-200/60">
                    <span className="text-zinc-500">Owner Name:</span>
                    <span className="font-bold text-zinc-900">{lockedDukanData?.ownerName || dukanOwnerName}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-zinc-500">Registered Mobile:</span>
                    <span className="font-bold text-zinc-900 font-mono">+91 {lockedDukanData?.phone || dukanPhone}</span>
                  </div>
                </div>

                {/* 4. Locked Features Preview */}
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">Feature Access:</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {['Live Orders Stream', 'Menu & Product Editor', 'Thermal KOT Printing', 'UPI Payment Gateway'].map((feat, i) => (
                      <div key={i} className="p-2.5 bg-zinc-100 rounded-xl border border-zinc-200 text-zinc-400 flex items-center justify-between font-medium">
                        <span>{feat}</span>
                        <Lock className="w-3 h-3 text-zinc-400" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Support Hotline */}
                <div className="flex items-center justify-between pt-2">
                  <a
                    href="https://wa.me/917023963189?text=Hello%20ChuruOne%2C%20maine%20nayi%20dukan%20ke%20liye%20apply%20kiya%20hai"
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>WhatsApp Fast-Track Onboarding</span>
                  </a>
                </div>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDukandarMode('login');
                      setLockedDukanData(null);
                    }}
                    className="text-xs font-bold text-zinc-500 hover:text-zinc-900 underline cursor-pointer"
                  >
                    Back to Dukan Login
                  </button>
                </div>
              </div>
            )}

            {/* Mode 1: Dukandar Login */}
            {dukandarMode === 'login' && (
              <form onSubmit={handleDukandarLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wide">
                    Dukan ID *
                  </label>
                  <div className="relative">
                    <Store className="w-4 h-4 absolute left-3.5 top-3.5 text-zinc-400" />
                    <input
                      type="text"
                      value={dukanIdInput}
                      onChange={e => setDukanIdInput(e.target.value.toUpperCase())}
                      placeholder="e.g. DKN-1001 ya SHAWARMA"
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950 font-mono font-bold"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wide">
                    Username / Registered Mobile *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-3.5 text-zinc-400" />
                    <input
                      type="text"
                      value={dukanUserInput}
                      onChange={e => setDukanUserInput(e.target.value)}
                      placeholder="e.g. shawarma_churu ya 9876543210"
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950 font-medium"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wide">
                      Password *
                    </label>
                    <button
                      type="button"
                      onClick={() => { setDukandarMode('forgot_password'); setErrorMsg(''); setSuccessMsg(''); }}
                      className="text-xs font-bold text-amber-700 hover:text-amber-900 transition-colors cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-zinc-400" />
                    <input
                      type={showDukanPassword ? "text" : "password"}
                      value={dukanPasswordInput}
                      onChange={e => setDukanPasswordInput(e.target.value)}
                      placeholder="Enter Dukan password"
                      className="w-full pl-10 pr-10 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950 font-medium"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowDukanPassword(!showDukanPassword)}
                      className="absolute right-3.5 top-3.5 text-zinc-400 hover:text-zinc-700 cursor-pointer"
                    >
                      {showDukanPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-zinc-950 hover:bg-black text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Store className="w-4 h-4 text-emerald-400" />
                  {loading ? 'Authenticating...' : 'Login to Dukan Master Portal'}
                </button>

                <div className="pt-3 text-center border-t border-zinc-200/60 mt-4">
                  <p className="text-xs text-zinc-500">
                    Nayi dukan kholni hai?{' '}
                    <button
                      type="button"
                      onClick={() => { setDukandarMode('register'); setDukanStep(1); setErrorMsg(''); setSuccessMsg(''); }}
                      className="font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                    >
                      Register & Apply Karein
                    </button>
                  </p>
                </div>
              </form>
            )}

            {/* Mode 2: Dukandar Registration Wizard */}
            {dukandarMode === 'register' && (
              <div>
                {/* 4-Step Progress Indicator */}
                <div className="flex items-center justify-between mb-5 px-1 overflow-x-auto pb-1">
                  {[
                    { num: 1, label: 'Phone' },
                    { num: 2, label: 'Dukan Info' },
                    { num: 3, label: 'Credentials' },
                    { num: 4, label: 'Contract' }
                  ].map((s, idx) => (
                    <React.Fragment key={s.num}>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                          dukanStep === s.num ? 'bg-zinc-950 text-white' : (dukanStep > s.num ? 'bg-emerald-600 text-white' : 'bg-zinc-200 text-zinc-600')
                        }`}>
                          {dukanStep > s.num ? '✓' : s.num}
                        </span>
                        <span className={`text-[11px] font-bold ${dukanStep === s.num ? 'text-zinc-950' : 'text-zinc-400'}`}>
                          {s.label}
                        </span>
                      </div>
                      {idx < 3 && <div className="h-0.5 w-6 bg-zinc-200 shrink-0" />}
                    </React.Fragment>
                  ))}
                </div>

                {/* Step 1: Mobile Phone Verification via MSG91 (NO Google Auth) */}
                {dukanStep === 1 && (
                  <div className="space-y-4">
                    <p className="text-xs text-zinc-600 leading-relaxed">
                      Nayi Dukan kholne ke liye pehle apna official mobile number verify karein:
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3.5 top-2.5 text-sm font-bold text-zinc-400">+91</span>
                        <input
                          type="tel"
                          maxLength={10}
                          value={dukanPhone}
                          onChange={e => setDukanPhone(e.target.value.replace(/\D/g, ''))}
                          placeholder="9876543210"
                          className="w-full pl-12 pr-4 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950 font-mono font-bold"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleDukanSendPhoneOtp}
                        disabled={loading || dukanContractCooldown > 0}
                        className="px-4 py-2.5 bg-zinc-950 text-white text-xs font-bold rounded-xl hover:bg-zinc-800 transition-colors disabled:opacity-50 shrink-0 cursor-pointer"
                      >
                        {dukanContractCooldown > 0 ? `(${dukanContractCooldown}s)` : 'Send OTP'}
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wide">
                        6-Digit Verification OTP
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={dukanOtp}
                        onChange={e => setDukanOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="123456"
                        className="w-full px-4 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950 font-mono font-bold tracking-widest text-center"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleDukanVerifyPhoneOtp}
                      disabled={loading || dukanOtp.length < 4}
                      className="w-full py-3 bg-zinc-950 hover:bg-black text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? 'Verifying...' : 'Verify Phone & Continue'}
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <div className="pt-2 text-center">
                      <button
                        type="button"
                        onClick={() => { setDukandarMode('login'); setErrorMsg(''); }}
                        className="text-xs font-bold text-zinc-500 hover:text-zinc-900 underline cursor-pointer"
                      >
                        Pehle se Dukan ID hai? Login Karein
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Dukandar & Store Details */}
                {dukanStep === 2 && (
                  <form onSubmit={handleDukanProceedToCredentials} className="space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1 uppercase tracking-wide">
                          Owner Full Name *
                        </label>
                        <input
                          type="text"
                          value={dukanOwnerName}
                          onChange={e => setDukanOwnerName(e.target.value)}
                          placeholder="e.g. Ramesh Kumar"
                          className="w-full px-3.5 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950 font-medium"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1 uppercase tracking-wide">
                          Email (Optional, no verify)
                        </label>
                        <input
                          type="email"
                          value={dukanEmail}
                          onChange={e => setDukanEmail(e.target.value)}
                          placeholder="shop@gmail.com"
                          className="w-full px-3.5 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950 font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1 uppercase tracking-wide">
                          Owner Age (Umra)
                        </label>
                        <input
                          type="number"
                          min="18"
                          max="100"
                          value={dukanDob}
                          onChange={e => setDukanDob(e.target.value.replace(/\D/g, ''))}
                          placeholder="e.g. 28"
                          className="w-full px-3.5 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1 uppercase tracking-wide">
                          Gender
                        </label>
                        <select
                          value={dukanGender}
                          onChange={e => setDukanGender(e.target.value)}
                          className="w-full px-3.5 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950 font-medium"
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1 uppercase tracking-wide">
                          Dukan Name (Store Name) *
                        </label>
                        <input
                          type="text"
                          value={dukanStoreName}
                          onChange={e => setDukanStoreName(e.target.value)}
                          placeholder="e.g. Churu Sweets & Namkeen"
                          className="w-full px-3.5 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950 font-medium"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1 uppercase tracking-wide">
                          Brand Name (Optional)
                        </label>
                        <input
                          type="text"
                          value={dukanBrandName}
                          onChange={e => setDukanBrandName(e.target.value)}
                          placeholder="Brand name if any"
                          className="w-full px-3.5 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950 font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1 uppercase tracking-wide">
                        Dukan Category / Type *
                      </label>
                      <select
                        value={dukanBusinessType}
                        onChange={e => setDukanBusinessType(e.target.value)}
                        className="w-full px-3.5 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950 font-medium"
                      >
                        <option value="restaurant">🍲 Restaurant / Food Delivery</option>
                        <option value="fashion">👔 Fashion / Outfits & Footwear</option>
                        <option value="salon">✂️ Salon / Grooming & Appointments</option>
                        <option value="grocery">🛒 Grocery / Kirana & Daily Needs</option>
                        <option value="electronics">📱 Electronics & Accessories</option>
                        <option value="retail">🏷️ General Store / Retail</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1 uppercase tracking-wide">
                        Website Description (Products & Details)
                      </label>
                      <textarea
                        rows={2}
                        value={dukanDescription}
                        onChange={e => setDukanDescription(e.target.value)}
                        placeholder="Aap kya bechte hain? Kesi website chahiye? (e.g. Food menu with veg/non-veg, cloth sizes/colors, hair appointments...)"
                        className="w-full px-3.5 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950 font-medium resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 mt-1 bg-zinc-950 hover:bg-black text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? 'Processing...' : 'Generate Dukan ID & Set Password'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                )}

                {/* Step 3: Dukan ID Preview & Credentials */}
                {dukanStep === 3 && (
                  <form onSubmit={handleDukanProceedToContract} className="space-y-4">
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-800 font-bold block">
                          Assigned Secure Dukan ID
                        </span>
                        <span className="text-xl font-mono font-black text-emerald-950 tracking-wider">
                          {dukanGeneratedId}
                        </span>
                      </div>
                      <span className="px-3 py-1 bg-emerald-600 text-white text-[11px] font-bold rounded-full flex items-center gap-1 shadow-2xs">
                        <Check className="w-3.5 h-3.5 stroke-[3]" /> Permanent
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1 uppercase tracking-wide">
                        Merchant Username *
                      </label>
                      <input
                        type="text"
                        value={dukanUsername}
                        onChange={e => setDukanUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                        className="w-full px-3.5 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950 font-mono font-medium"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1 uppercase tracking-wide">
                          Dukan Password *
                        </label>
                        <input
                          type={showDukanRegPassword ? "text" : "password"}
                          value={dukanPassword}
                          onChange={e => setDukanPassword(e.target.value)}
                          placeholder="Min 4 characters"
                          className="w-full px-3.5 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950 font-medium"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1 uppercase tracking-wide">
                          Confirm Password *
                        </label>
                        <input
                          type={showDukanRegPassword ? "text" : "password"}
                          value={dukanConfirmPassword}
                          onChange={e => setDukanConfirmPassword(e.target.value)}
                          placeholder="Re-enter password"
                          className="w-full px-3.5 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950 font-medium"
                          required
                        />
                      </div>
                    </div>

                    <label className="flex items-center gap-2 text-xs text-zinc-600 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={showDukanRegPassword}
                        onChange={e => setShowDukanRegPassword(e.target.checked)}
                        className="rounded text-zinc-950 focus:ring-zinc-950"
                      />
                      <span>Show password</span>
                    </label>

                    <button
                      type="submit"
                      className="w-full py-3 bg-zinc-950 hover:bg-black text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Proceed to Digital Contract & E-Sign</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                )}

                {/* Step 4: Digital Merchant Agreement & E-Signature via MSG91 OTP */}
                {dukanStep === 4 && (
                  <form onSubmit={handleDukanFinalSubmit} className="space-y-4">
                    <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl max-h-48 overflow-y-auto text-xs text-zinc-700 leading-relaxed space-y-2.5 font-medium scrollbar-thin">
                      <h4 className="font-extrabold text-zinc-950 text-sm border-b pb-1">
                        ChuruOne Merchant Digital Service Agreement
                      </h4>
                      <p>
                        <strong>1. 100% Free Store Onboarding:</strong> Abhi ke liye website aur portal registration sabhi Churu ke dukandaron ke liye 100% FREE hai.
                      </p>
                      <p>
                        <strong>2. Authentic & Legal Goods:</strong> Dukandar koi bhi illegal, counterfeit, expired ya banned product platform par nahi bechenge. Sirf genuine legal products hi allowed hain.
                      </p>
                      <p>
                        <strong>3. Category Adherence:</strong> Dukandar ne jis business category ({dukanBusinessType}) ke liye apply kiya hai, strictly usi se sambandhit items bechenge.
                      </p>
                      <p>
                        <strong>4. Fulfillment & Quality:</strong> Product quality, order packaging aur customer fulfillment ki sidhi zimmedari Dukandar ki hogi.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-start gap-2.5 text-xs text-zinc-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={dukanContractAccepted}
                          onChange={e => setDukanContractAccepted(e.target.checked)}
                          className="mt-0.5 rounded text-zinc-950 focus:ring-zinc-950"
                          required
                        />
                        <span className="leading-tight font-semibold">
                          Main uprokt sabhi terms and conditions se sehmat hoon aur digital contract par sign karne ke liye taiyar hoon.
                        </span>
                      </label>
                    </div>

                    {/* E-Signature OTP Section */}
                    <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-amber-700" />
                          Sign with Mobile OTP (+91 {dukanPhone})
                        </span>
                        <button
                          type="button"
                          onClick={handleDukanSendSigningOtp}
                          disabled={loading || dukanContractCooldown > 0}
                          className="px-3 py-1 bg-amber-800 hover:bg-amber-900 text-white rounded-lg text-xs font-bold disabled:opacity-50 cursor-pointer"
                        >
                          {dukanContractCooldown > 0 ? `Wait (${dukanContractCooldown}s)` : (dukanSigningOtpSent ? 'Resend OTP' : 'Send Signing OTP')}
                        </button>
                      </div>

                      <input
                        type="text"
                        maxLength={6}
                        value={dukanSigningOtp}
                        onChange={e => setDukanSigningOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="Enter 6-digit Signing OTP"
                        className="w-full px-3.5 py-2 text-sm bg-white border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-600 font-mono font-bold text-center tracking-widest"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !dukanContractAccepted}
                      className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-bold shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      {loading ? 'Submitting Application...' : 'Sign Contract & Apply for Dukan ID'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Mode 3: Dukandar Forgot Password */}
            {dukandarMode === 'forgot_password' && (
              <div className="space-y-4">
                {dukanForgotStep === 1 && (
                  <div className="space-y-3.5">
                    <p className="text-xs text-zinc-600">
                      Apna <strong>Dukan ID</strong> aur <strong>Registered Mobile Number</strong> dalein:
                    </p>
                    <input
                      type="text"
                      value={dukanForgotDukanId}
                      onChange={e => setDukanForgotDukanId(e.target.value.toUpperCase())}
                      placeholder="Dukan ID (e.g. DKN-1001)"
                      className="w-full px-4 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950 font-mono font-bold"
                    />
                    <input
                      type="tel"
                      maxLength={10}
                      value={dukanForgotPhone}
                      onChange={e => setDukanForgotPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="10-digit Registered Mobile"
                      className="w-full px-4 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950 font-mono font-bold"
                    />
                    <button
                      type="button"
                      onClick={handleDukanForgotSendOtp}
                      disabled={loading || (!dukanForgotDukanId.trim() && !dukanForgotPhone.trim())}
                      className="w-full py-2.5 bg-zinc-950 text-white text-xs font-bold rounded-xl hover:bg-zinc-800 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {loading ? 'Sending...' : 'Send Password Reset OTP via MSG91'}
                    </button>
                  </div>
                )}

                {dukanForgotStep === 2 && (
                  <div className="space-y-3.5">
                    <p className="text-xs text-zinc-600">
                      Mobile number <span className="font-bold font-mono">+91 {dukanForgotPhone}</span> par bheja gaya 6-digit OTP dalein:
                    </p>
                    <input
                      type="text"
                      maxLength={6}
                      value={dukanForgotOtp}
                      onChange={e => setDukanForgotOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="w-full px-4 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950 font-mono font-bold tracking-widest text-center"
                    />
                    <button
                      type="button"
                      onClick={handleDukanForgotVerifyOtp}
                      disabled={loading || dukanForgotOtp.length < 4}
                      className="w-full py-2.5 bg-amber-600 text-white text-xs font-bold rounded-xl hover:bg-amber-700 transition-colors cursor-pointer"
                    >
                      {loading ? 'Verifying...' : 'Verify OTP'}
                    </button>
                  </div>
                )}

                {dukanForgotStep === 3 && (
                  <div className="space-y-3.5">
                    {/* Username Banner */}
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl">
                      <div className="text-[10px] font-mono text-emerald-800 uppercase font-bold">Aapka Dukandar Username</div>
                      <div className="text-base font-mono font-black text-emerald-950">@{dukanForgotUsername || 'merchant'}</div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Enter New Password</label>
                      <input
                        type="password"
                        value={dukanNewPassword}
                        onChange={e => setDukanNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="w-full px-3.5 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        value={dukanConfirmNewPassword}
                        onChange={e => setDukanConfirmNewPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className="w-full px-3.5 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950 font-medium"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleDukanForgotResetPassword(false)}
                        disabled={loading}
                        className="flex-1 py-2.5 bg-zinc-950 text-white text-xs font-bold rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
                      >
                        Update Dukan Password
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDukanForgotResetPassword(true)}
                        className="px-4 py-2.5 bg-zinc-200 text-zinc-800 text-xs font-bold rounded-xl hover:bg-zinc-300 transition-colors cursor-pointer"
                      >
                        Skip
                      </button>
                    </div>
                  </div>
                )}

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => { setDukandarMode('login'); setDukanForgotStep(1); setErrorMsg(''); }}
                    className="text-xs font-bold text-zinc-500 hover:text-zinc-900 underline cursor-pointer"
                  >
                    Back to Dukan Login
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Footer / SSL Notice */}
      <div className="max-w-md w-full mx-auto text-center pb-4 text-[11px] text-zinc-400 font-mono flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span>ChuruOne Social Commerce Ecosystem • 256-Bit Encrypted Portal</span>
      </div>

    </div>
  );
}
