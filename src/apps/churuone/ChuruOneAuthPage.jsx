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
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { firebaseConfig } from '../nash/firebase';
import { setChuruOneSession, getChuruOneSession, sanitizeChuruOneUser } from '../../utils/ssoHelper';
import { API_URL } from '../../config/api';
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
  const isSkyline = storeId.includes('skyline');
  const isShawarma = storeId.includes('shawarma') || storeId === 'shawarma-nights';

  // Master Role Selection: 'select' (choice screen) | 'customer' | 'dukandar'
  const [selectedRole, setSelectedRole] = useState(() => {
    if (initialRoleParam === 'dukandar' || initialRoleParam === 'merchant' || initialRoleParam === 'seller') {
      return 'dukandar';
    }
    if (initialRoleParam === 'customer' || initialRoleParam === 'user') {
      return 'customer';
    }
    // If arriving with a specific store returnUrl/context, default to customer directly, otherwise ask
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
  const [custRegStep, setCustRegStep] = useState(1); // 1: Phone/Google OTP Verify, 2: Profile Details & Password
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

  // Customer Forgot Password State
  const [custForgotPhone, setCustForgotPhone] = useState('');
  const [custForgotOtp, setCustForgotOtp] = useState('');
  const [custForgotStep, setCustForgotStep] = useState(1); // 1: Enter Phone, 2: Enter OTP, 3: Set New Password / Skip
  const [custNewPassword, setCustNewPassword] = useState('');
  const [custConfirmNewPassword, setCustConfirmNewPassword] = useState('');
  const [custForgotToken, setCustForgotToken] = useState('');
  const [custForgotUser, setCustForgotUser] = useState(null);

  // Cooldown timer for Customer OTP
  const [custCooldown, setCustCooldown] = useState(0);
  useEffect(() => {
    if (custCooldown <= 0) return;
    const t = setInterval(() => setCustCooldown(c => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [custCooldown]);

  // ============================================================================
  // DUKANDAR (MERCHANT) STATE
  // ============================================================================
  const [dukandarMode, setDukandarMode] = useState('login'); // 'login' | 'register' | 'forgot_password'

  // Dukandar Login Form State
  const [dukanIdInput, setDukanIdInput] = useState(() => {
    if (storeId) return storeId.toUpperCase();
    return '';
  });
  const [dukanUserInput, setDukanUserInput] = useState('');
  const [dukanPasswordInput, setDukanPasswordInput] = useState('');
  const [showDukanPassword, setShowDukanPassword] = useState(false);

  // Dukandar Registration Wizard State (4 Steps)
  const [dukanStep, setDukanStep] = useState(1); // 1: Phone OTP, 2: Store & Owner Details, 3: ID & Credentials, 4: Digital Contract
  const [dukanPhone, setDukanPhone] = useState('');
  const [dukanOtp, setDukanOtp] = useState('');
  const [dukanPhoneVerified, setDukanPhoneVerified] = useState(false);

  // Step 2 Form
  const [dukanOwnerName, setDukanOwnerName] = useState('');
  const [dukanFatherName, setDukanFatherName] = useState('');
  const [dukanDob, setDukanDob] = useState('');
  const [dukanGender, setDukanGender] = useState('male');
  const [dukanStoreName, setDukanStoreName] = useState('');
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

  // Dukandar Forgot Password State
  const [dukanForgotIdentifier, setDukanForgotIdentifier] = useState('');
  const [dukanForgotPhone, setDukanForgotPhone] = useState('');
  const [dukanForgotOtp, setDukanForgotOtp] = useState('');
  const [dukanForgotStep, setDukanForgotStep] = useState(1);
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
  // HELPER: Auto Session Completion for Customer
  // --------------------------------------------------------------------------
  function completeCustomerSession(user, token) {
    const sanitized = sanitizeChuruOneUser(user);
    setChuruOneSession(sanitized, token);

    if (rawReturnUrl) {
      const url = new URL(rawReturnUrl, window.location.origin);
      if (token) url.searchParams.set('churuone_token', token);
      url.searchParams.set('churuone_user', encodeURIComponent(JSON.stringify(sanitized)));
      window.location.href = url.toString();
      return;
    }

    if (isStoreContext) {
      const redirectUrl = new URL(destination, window.location.origin);
      if (token) redirectUrl.searchParams.set('churuone_token', token);
      redirectUrl.searchParams.set('churuone_user', encodeURIComponent(JSON.stringify(sanitized)));
      window.location.href = redirectUrl.toString();
      return;
    }

    const tokenParam = token ? `&churuone_token=${encodeURIComponent(token)}` : '';
    window.location.href = `/?account_created=1&churuone_user=${encodeURIComponent(JSON.stringify(sanitized))}${tokenParam}`;
  }

  // --------------------------------------------------------------------------
  // HELPER: Auto Session Completion for Dukandar
  // --------------------------------------------------------------------------
  function completeDukandarSession(dukanId, token, userObj) {
    const storeSlug = String(dukanId).toLowerCase();
    localStorage.setItem('churuone_master_store_id', storeSlug);
    localStorage.setItem('churuone_master_token', token || 'master_token');
    localStorage.setItem('churuone_master_role', 'dukandar');
    localStorage.setItem('churuone_master_user', JSON.stringify(userObj || { dukanId }));

    // Redirect straight to Master OS Portal
    window.location.href = `/master?storeId=${storeSlug}`;
  }

  // ============================================================================
  // CUSTOMER HANDLERS
  // ============================================================================

  // 1. Customer Login Submit
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
          setCustForgotPhone(data.phone || custIdentifier);
          setCustomerMode('forgot_password');
          return;
        }
        setErrorMsg(data.message || 'Login failed. Please check credentials.');
        return;
      }

      setSuccessMsg('Login successful! Redirecting...');
      setTimeout(() => completeCustomerSession(data.user, data.token), 400);
    } catch (err) {
      setErrorMsg(err.message || 'Server connection error.');
    } finally {
      setLoading(false);
    }
  }

  // 2. Customer Google Sign-In
  async function handleCustomerGoogleSignIn() {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const gEmail = user.email || '';
      const gName = user.displayName || gEmail.split('@')[0] || 'Customer';

      // Check account collisions or existing user with this email
      const checkRes = await fetch(`${API_URL}/api/auth/customer/check-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: gEmail })
      });
      const checkData = await checkRes.json();

      if (checkData.collision) {
        setErrorMsg(checkData.message);
        setLoading(false);
        return;
      }

      // If existing user already has full profile and password, login directly
      if (checkData.userExists && checkData.user?.hasPassword) {
        const directRes = await fetch(`${API_URL}/api/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-store-id': storeId || 'shawarma' },
          body: JSON.stringify({
            googleId: user.uid,
            email: gEmail,
            name: gName,
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
      }

      // If new user via Google, move to Registration Step 2 with Google pre-filled!
      setIsGoogleVerified(true);
      setGoogleUserObj(user);
      setCustRegName(gName);
      setCustRegEmail(gEmail);
      setCustRegUsername(gEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, ''));
      setCustomerMode('register');
      setCustRegStep(1); // Still verify their mobile number as requested
      setSuccessMsg(`Google Account verified (${gEmail})! Ab apna mobile number OTP se verify karein.`);
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setErrorMsg(err.message || 'Google sign-in error.');
      }
    } finally {
      setLoading(false);
    }
  }

  // 3. Customer Send Registration Phone OTP
  async function handleCustSendOtp() {
    const clean = custRegPhone.replace(/\D/g, '').slice(-10);
    if (clean.length !== 10) {
      setErrorMsg('Kripya 10-digit ka valid mobile number dalein.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      // Check collision first
      const colRes = await fetch(`${API_URL}/api/auth/customer/check-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: clean, email: custRegEmail })
      });
      const colData = await colRes.json();
      if (colData.collision) {
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
      setSuccessMsg(`OTP +91 ${clean} par bhej diya gaya hai.`);
    } catch (err) {
      setErrorMsg(err.message || 'OTP dispatch failed.');
    } finally {
      setLoading(false);
    }
  }

  // 4. Customer Verify Registration Phone OTP
  async function handleCustVerifyOtp() {
    const clean = custRegPhone.replace(/\D/g, '').slice(-10);
    const cleanOtp = custRegOtp.replace(/\D/g, '');
    if (clean.length !== 10 || cleanOtp.length < 4) {
      setErrorMsg('Kripya sahi phone number aur 6-digit OTP dalein.');
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
      if (!data.success) {
        setErrorMsg(data.message || 'Galat OTP code. Kripya dobara koshish karein.');
        setLoading(false);
        return;
      }

      setCustRegPhoneVerified(true);
      setCustRegStep(2);
      setSuccessMsg('Mobile number safaltapoorvak verify ho gaya! Ab apni profile aur password banayein.');
    } catch (err) {
      setErrorMsg(err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  }

  // 5. Customer Complete Registration
  async function handleCustCompleteRegistration(e) {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!custRegName.trim() || !custRegUsername.trim() || !custRegPassword.trim()) {
      setErrorMsg('Name, Username aur Password bharna anivarya hai.');
      return;
    }
    if (custRegPassword !== custRegConfirmPassword) {
      setErrorMsg('Password aur Confirm Password aapas mein match nahi kar rahe.');
      return;
    }

    setLoading(true);
    try {
      const cleanPhone = custRegPhone.replace(/\D/g, '').slice(-10);
      const res = await fetch(`${API_URL}/api/auth/customer/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: custRegName.trim(),
          dob: custRegDob,
          gender: custRegGender,
          phone: cleanPhone,
          email: custRegEmail.trim().toLowerCase(),
          username: custRegUsername.trim().toLowerCase(),
          password: custRegPassword.trim(),
          isGoogleVerified,
          preVerified: true,
          storeId: storeId || 'shawarma'
        })
      });
      const data = await res.json();
      if (!data.success) {
        setErrorMsg(data.message || 'Registration failed.');
        setLoading(false);
        return;
      }

      setSuccessMsg('Aapka ChuruOne account safaltapoorvak ban gaya hai!');
      setTimeout(() => completeCustomerSession(data.user, data.token), 500);
    } catch (err) {
      setErrorMsg(err.message || 'Registration request failed.');
    } finally {
      setLoading(false);
    }
  }

  // 6. Customer Forgot Password: Send OTP
  async function handleCustForgotSendOtp() {
    const clean = custForgotPhone.replace(/\D/g, '').slice(-10);
    if (clean.length !== 10) {
      setErrorMsg('Kripya 10-digit registered mobile number dalein.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${API_URL}/api/auth/customer/forgot-password/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: clean })
      });
      const data = await res.json();
      if (!data.success) {
        setErrorMsg(data.message || 'Failed to send OTP.');
        setLoading(false);
        return;
      }

      setCustForgotStep(2);
      setCustCooldown(60);
      setSuccessMsg(`OTP +91 ${clean} par bhej diya gaya hai.`);
    } catch (err) {
      setErrorMsg(err.message || 'Server error.');
    } finally {
      setLoading(false);
    }
  }

  // 7. Customer Forgot Password: Verify OTP
  async function handleCustForgotVerifyOtp() {
    const clean = custForgotPhone.replace(/\D/g, '').slice(-10);
    const cleanOtp = custForgotOtp.replace(/\D/g, '');
    if (cleanOtp.length < 4) {
      setErrorMsg('Kripya 6-digit OTP code dalein.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${API_URL}/api/auth/customer/forgot-password/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: clean, otp: cleanOtp })
      });
      const data = await res.json();
      if (!data.success) {
        setErrorMsg(data.message || 'Invalid OTP code.');
        setLoading(false);
        return;
      }

      setCustForgotToken(data.token);
      setCustForgotUser(data.user);
      setCustForgotStep(3);
      setSuccessMsg('OTP verified! Aap naya password bana sakte hain ya skip kar sakte hain.');
    } catch (err) {
      setErrorMsg(err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  }

  // 8. Customer Forgot Password: Save New Password
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
          phone: custForgotPhone.replace(/\D/g, '').slice(-10),
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
      setErrorMsg(err.message || 'Reset password failed.');
    } finally {
      setLoading(false);
    }
  }

  // ============================================================================
  // DUKANDAR HANDLERS
  // ============================================================================

  // 1. Dukandar Login
  async function handleDukandarLogin(e) {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!dukanIdInput.trim() || !dukanPasswordInput.trim()) {
      setErrorMsg('Dukan ID aur Password bharna zaroori hai.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/dukandar/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dukanId: dukanIdInput.trim(),
          username: dukanUserInput.trim() || dukanIdInput.trim(),
          password: dukanPasswordInput.trim()
        })
      });
      const data = await res.json();
      if (!data.success) {
        setErrorMsg(data.message || 'Invalid credentials. Please verify your Dukan ID and password.');
        setLoading(false);
        return;
      }

      setSuccessMsg('Dukandar login successful! Opening Dukan Master Portal...');
      setTimeout(() => completeDukandarSession(data.dukanId || data.storeId, data.token, data), 400);
    } catch (err) {
      setErrorMsg(err.message || 'Server connection error.');
    } finally {
      setLoading(false);
    }
  }

  // 2. Dukandar Step 1: Send OTP
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
      } catch (e) {
        console.warn('MSG91 Dukandar OTP send error:', e);
      }

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
      setSuccessMsg(`OTP +91 ${clean} par bhej diya gaya hai.`);
    } catch (err) {
      setErrorMsg(err.message || 'OTP request failed.');
    } finally {
      setLoading(false);
    }
  }

  // 3. Dukandar Step 1: Verify OTP
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
      } catch (e) {
        console.warn('MSG91 Dukandar verify client error:', e);
      }

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
        setErrorMsg(data.message || 'Galat OTP code. Kripya dobara koshish karein.');
        setLoading(false);
        return;
      }

      setDukanPhoneVerified(true);
      setDukanStep(2);
      setSuccessMsg('Phone verify ho gaya! Ab apni Dukan aur Personal details bharein.');
    } catch (err) {
      setErrorMsg(err.message || 'Verification error.');
    } finally {
      setLoading(false);
    }
  }

  // 4. Dukandar Step 2 to Step 3: Generate Dukan ID
  async function handleDukanProceedToCredentials(e) {
    e.preventDefault();
    if (!dukanOwnerName.trim() || !dukanStoreName.trim()) {
      setErrorMsg('Owner Name aur Dukan Name bharna anivarya hai.');
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
        setSuccessMsg(`Aapke liye unique Dukan ID (${data.dukanId}) generate ho gayi hai!`);
      } else {
        setErrorMsg('Failed to generate Dukan ID.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Server error.');
    } finally {
      setLoading(false);
    }
  }

  // 5. Dukandar Step 3 to Step 4: Proceed to Digital Contract
  function handleDukanProceedToContract(e) {
    e.preventDefault();
    if (!dukanUsername.trim() || !dukanPassword.trim()) {
      setErrorMsg('Username aur Password bharna anivarya hai.');
      return;
    }
    if (dukanPassword !== dukanConfirmPassword) {
      setErrorMsg('Password match nahi kar rahe.');
      return;
    }
    setErrorMsg('');
    setDukanStep(4);
  }

  // 6. Dukandar Step 4: Send Signing OTP
  async function handleDukanSendSigningOtp() {
    setLoading(true);
    setErrorMsg('');
    try {
      const clean = dukanPhone.replace(/\D/g, '').slice(-10);
      let dispatched = false;
      try {
        const msgRes = await sendOtpViaMsg91(clean);
        if (msgRes && msgRes.success) dispatched = true;
      } catch (e) {
        console.warn('MSG91 contract signing send error:', e);
      }

      const res = await fetch(`${API_URL}/api/auth/dukandar/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: clean, purpose: 'contract' })
      });
      const data = await res.json();
      if (data.success || dispatched) {
        setDukanSigningOtpSent(true);
        setDukanContractCooldown(60);
        setSuccessMsg(`Contract signing OTP +91 ${clean} par bhej diya gaya hai.`);
      } else {
        setErrorMsg(data.message || 'Failed to dispatch signing OTP.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'OTP dispatch failed.');
    } finally {
      setLoading(false);
    }
  }

  // 7. Dukandar Step 4: Final Submit Application & E-Sign Contract
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
          fatherName: dukanFatherName.trim(),
          dob: dukanDob,
          gender: dukanGender,
          dukanName: dukanStoreName.trim(),
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
        setErrorMsg(data.message || 'Registration failed.');
        setLoading(false);
        return;
      }

      setSuccessMsg('Badhaai ho! Aapka Dukan Account ban chuka hai. Dukan Portal khul raha hai...');
      setTimeout(() => completeDukandarSession(data.dukanId || data.storeId, data.token, data), 600);
    } catch (err) {
      setErrorMsg(err.message || 'Submission error.');
    } finally {
      setLoading(false);
    }
  }

  // 8. Dukandar Forgot Password
  async function handleDukanForgotSendOtp() {
    if (!dukanForgotIdentifier.trim()) {
      setErrorMsg('Apna Dukan ID ya Registered Phone number dalein.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const isNum = /^\d+$/.test(dukanForgotIdentifier.replace(/\D/g, ''));
      const cleanPhone = isNum ? dukanForgotIdentifier.replace(/\D/g, '').slice(-10) : '';

      if (cleanPhone.length === 10) {
        try {
          sendOtpViaMsg91(cleanPhone);
        } catch (e) {}
      }

      const res = await fetch(`${API_URL}/api/auth/dukandar/forgot-password/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: isNum ? dukanForgotIdentifier : '',
          dukanId: !isNum ? dukanForgotIdentifier : ''
        })
      });
      const data = await res.json();
      if (!data.success) {
        setErrorMsg(data.message || 'Account nahi mila.');
        setLoading(false);
        return;
      }

      setDukanForgotPhone(data.phoneMasked || dukanForgotIdentifier);
      setDukanForgotStep(2);
      setSuccessMsg(data.message || 'OTP bhej diya gaya hai.');
    } catch (err) {
      setErrorMsg(err.message || 'Error occurred.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDukanForgotVerifyAndReset() {
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
      const isNum = /^\d+$/.test(dukanForgotIdentifier.replace(/\D/g, ''));
      const res = await fetch(`${API_URL}/api/auth/dukandar/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: isNum ? dukanForgotIdentifier : '',
          dukanId: !isNum ? dukanForgotIdentifier : '',
          newPassword: dukanNewPassword.trim()
        })
      });
      const data = await res.json();
      if (!data.success) {
        setErrorMsg(data.message || 'Password reset failed.');
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
            CHURUONE SOCIAL COMMERCE PORTAL
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950">
            {selectedRole === 'select' 
              ? 'Aapka ChuruOne Account' 
              : (selectedRole === 'customer' 
                  ? (customerMode === 'register' ? 'Customer Account Banayein' : (customerMode === 'forgot_password' ? 'Customer Password Reset' : 'Customer Login')) 
                  : (dukandarMode === 'register' ? 'Nayi Dukan Registration' : (dukandarMode === 'forgot_password' ? 'Dukandar Password Reset' : 'Dukandar Portal Login')))}
          </h1>

          <p className="text-xs text-zinc-500 mt-1.5 max-w-sm mx-auto">
            {selectedRole === 'select'
              ? 'Churu ki apni digital marketplace mein aapka swagat hai. Kripya apna role chunein:'
              : (selectedRole === 'customer' 
                  ? 'Shopping, Instant Order Tracking aur Exclusive City Deals ke liye connect karein.' 
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
        {selectedRole !== 'select' && (
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

        {/* ─── SCREEN 0: ROLE SELECTION CARDS (Aap Customer ho ya Dukandar?) ─── */}
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
                  <span className="text-[10px] font-mono uppercase bg-zinc-100 text-zinc-700 font-bold px-2 py-0.5 rounded-full">Order History</span>
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
                  <span className="text-[10px] font-mono uppercase bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded-full">Dukan Portal</span>
                  <span className="text-[10px] font-mono uppercase bg-zinc-100 text-zinc-700 font-bold px-2 py-0.5 rounded-full">Free Store Onboarding</span>
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
                      placeholder="e.g. rahul_churu ya 9876543210 ya rahul@gmail.com"
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
                      className="text-xs font-bold text-amber-700 hover:text-amber-900 transition-colors"
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
                      placeholder="Enter your password"
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
                  {loading ? 'Logging in...' : 'Sign In to ChuruOne'}
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-200" /></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-zinc-400 font-mono">OR</span></div>
                </div>

                {/* Google Sign-in */}
                <button
                  type="button"
                  onClick={handleCustomerGoogleSignIn}
                  disabled={loading}
                  className="w-full py-2.5 bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-2xs"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>1-Tap Google Sign-In</span>
                </button>

                {/* Footer Switcher */}
                <div className="pt-3 text-center">
                  <p className="text-xs text-zinc-500">
                    Naye ho ya account nahi hai?{' '}
                    <button
                      type="button"
                      onClick={() => { setCustomerMode('register'); setErrorMsg(''); setSuccessMsg(''); }}
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
                {/* Step Progress Pill */}
                <div className="flex items-center justify-between mb-5 px-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      custRegStep === 1 ? 'bg-amber-600 text-white' : 'bg-emerald-500 text-white'
                    }`}>
                      {custRegStep === 1 ? '1' : <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </span>
                    <span className="text-xs font-bold text-zinc-800">Phone Verification</span>
                  </div>
                  <div className="h-0.5 w-12 bg-zinc-200" />
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      custRegStep === 2 ? 'bg-amber-600 text-white' : 'bg-zinc-200 text-zinc-500'
                    }`}>
                      2
                    </span>
                    <span className="text-xs font-bold text-zinc-800">Profile & Password</span>
                  </div>
                </div>

                {/* Sub-step 1: Mobile Number & OTP Verification */}
                {custRegStep === 1 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wide">
                        Mobile Number
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3.5 top-2.5 text-sm font-bold text-zinc-400">+91</span>
                          <input
                            type="tel"
                            maxLength={10}
                            value={custRegPhone}
                            onChange={e => setCustRegPhone(e.target.value.replace(/\D/g, ''))}
                            placeholder="9876543210"
                            className="w-full pl-12 pr-4 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono font-bold tracking-wide"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleCustSendOtp}
                          disabled={loading || custCooldown > 0}
                          className="px-4 py-2.5 bg-zinc-950 text-white text-xs font-bold rounded-xl hover:bg-zinc-800 transition-colors disabled:opacity-50 shrink-0 cursor-pointer"
                        >
                          {custCooldown > 0 ? `Resend (${custCooldown}s)` : 'Send OTP'}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wide">
                        6-Digit OTP Code
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={custRegOtp}
                        onChange={e => setCustRegOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="123456"
                        className="w-full px-4 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono font-bold tracking-widest text-center"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleCustVerifyOtp}
                      disabled={loading || custRegOtp.length < 4}
                      className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? 'Verifying...' : 'Verify OTP & Proceed'}
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <div className="pt-2 text-center">
                      <p className="text-xs text-zinc-500">
                        Pehle se account hai?{' '}
                        <button
                          type="button"
                          onClick={() => { setCustomerMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
                          className="font-bold text-amber-700 hover:text-amber-900 underline cursor-pointer"
                        >
                          Sign In
                        </button>
                      </p>
                    </div>
                  </div>
                )}

                {/* Sub-step 2: Complete Profile & Password */}
                {custRegStep === 2 && (
                  <form onSubmit={handleCustCompleteRegistration} className="space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1 uppercase tracking-wide">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={custRegName}
                          onChange={e => setCustRegName(e.target.value)}
                          placeholder="e.g. Rahul Sharma"
                          className="w-full px-3.5 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1 uppercase tracking-wide">
                          Date of Birth (DOB)
                        </label>
                        <input
                          type="date"
                          value={custRegDob}
                          onChange={e => setCustRegDob(e.target.value)}
                          className="w-full px-3.5 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1 uppercase tracking-wide">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={custRegEmail}
                          disabled={isGoogleVerified}
                          onChange={e => setCustRegEmail(e.target.value)}
                          placeholder="rahul@gmail.com"
                          className="w-full px-3.5 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium disabled:opacity-70"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1 uppercase tracking-wide">
                          Unique Username *
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-zinc-400 font-mono text-sm">@</span>
                          <input
                            type="text"
                            value={custRegUsername}
                            onChange={e => setCustRegUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                            placeholder="rahul_churu"
                            className="w-full pl-8 pr-3.5 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono font-medium"
                            required
                          />
                        </div>
                      </div>
                    </div>

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
                      <span className="text-[11px] font-mono text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded">
                        📱 +91 {custRegPhone}
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 mt-2 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? 'Creating Account...' : 'Account Banayein & Continue'}
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
                    <p className="text-xs text-zinc-600">
                      Apna registered 10-digit mobile number dalein. Hum password reset karne ke liye OTP bhejenge:
                    </p>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-sm font-bold text-zinc-400">+91</span>
                      <input
                        type="tel"
                        maxLength={10}
                        value={custForgotPhone}
                        onChange={e => setCustForgotPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="9876543210"
                        className="w-full pl-12 pr-4 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono font-bold"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleCustForgotSendOtp}
                      disabled={loading || custForgotPhone.length !== 10}
                      className="w-full py-2.5 bg-zinc-950 text-white text-xs font-bold rounded-xl hover:bg-zinc-800 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {loading ? 'Sending...' : 'Send Reset OTP'}
                    </button>
                  </div>
                )}

                {custForgotStep === 2 && (
                  <div className="space-y-4">
                    <p className="text-xs text-zinc-600">
                      Mobile number <span className="font-bold">+91 {custForgotPhone}</span> par bheja gaya 6-digit OTP code dalein:
                    </p>
                    <input
                      type="text"
                      maxLength={6}
                      value={custForgotOtp}
                      onChange={e => setCustForgotOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="w-full px-4 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono font-bold tracking-widest text-center"
                    />
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
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium">
                      ✅ OTP verified! Aap ab naya password bana sakte hain ya seedhe continue kar sakte hain.
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">New Password</label>
                      <input
                        type="password"
                        value={custNewPassword}
                        onChange={e => setCustNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="w-full px-3.5 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        value={custConfirmNewPassword}
                        onChange={e => setCustConfirmNewPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className="w-full px-3.5 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => handleCustSaveNewPassword(false)}
                        disabled={loading}
                        className="flex-1 py-2.5 bg-zinc-950 text-white text-xs font-bold rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
                      >
                        Save New Password
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
            {/* Mode 1: Dukandar Login */}
            {dukandarMode === 'login' && (
              <form onSubmit={handleDukandarLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wide">
                    Dukan ID / Store Slug *
                  </label>
                  <div className="relative">
                    <Store className="w-4 h-4 absolute left-3.5 top-3.5 text-zinc-400" />
                    <input
                      type="text"
                      value={dukanIdInput}
                      onChange={e => setDukanIdInput(e.target.value.toUpperCase())}
                      placeholder="e.g. DKN-1001 ya SHAWARMA ya SKYLINE ya NASH"
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950 font-mono font-bold"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wide">
                    Username / Registered Mobile
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-3.5 text-zinc-400" />
                    <input
                      type="text"
                      value={dukanUserInput}
                      onChange={e => setDukanUserInput(e.target.value)}
                      placeholder="e.g. Shawarma_Nights ya 7023963189"
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950 font-medium"
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
                      onClick={() => { setDukandarMode('forgot_password'); setErrorMsg(''); setSuccessMsg(''); }}
                      className="text-xs font-bold text-amber-700 hover:text-amber-900 transition-colors"
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
                    Nayi dukan kholni hai ya registered nahi hain?{' '}
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

            {/* Mode 2: Dukandar Register & Apply Wizard (4 Steps) */}
            {dukandarMode === 'register' && (
              <div>
                {/* 4-Step Progress Indicator */}
                <div className="flex items-center justify-between mb-5 px-1 overflow-x-auto pb-1">
                  {[
                    { num: 1, label: 'Phone' },
                    { num: 2, label: 'Dukan Info' },
                    { num: 3, label: 'Dukan ID' },
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

                {/* Step 1: Phone Verification */}
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

                {/* Step 2: Store & Merchant Details */}
                {dukanStep === 2 && (
                  <form onSubmit={handleDukanProceedToCredentials} className="space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1 uppercase tracking-wide">
                          Dukandar Full Name *
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
                          Father's Name
                        </label>
                        <input
                          type="text"
                          value={dukanFatherName}
                          onChange={e => setDukanFatherName(e.target.value)}
                          placeholder="Father's full name"
                          className="w-full px-3.5 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950 font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1 uppercase tracking-wide">
                          Date of Birth (DOB)
                        </label>
                        <input
                          type="date"
                          value={dukanDob}
                          onChange={e => setDukanDob(e.target.value)}
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
                          Dukan / Business Name *
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
                          Dukan Category / Type *
                        </label>
                        <select
                          value={dukanBusinessType}
                          onChange={e => setDukanBusinessType(e.target.value)}
                          className="w-full px-3.5 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950 font-medium"
                        >
                          <option value="restaurant">🍲 Restaurant / Food & Beverages</option>
                          <option value="fashion">👔 Fashion / Outfits & Footwear</option>
                          <option value="salon">✂️ Salon / Grooming & Services</option>
                          <option value="grocery">🛒 Grocery / Kirana & Daily Needs</option>
                          <option value="electronics">📱 Electronics & Mobile</option>
                          <option value="retail">🏷️ General Retail & Other</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1 uppercase tracking-wide">
                        Kesi Website Chahiye? (Product Details & Description)
                      </label>
                      <textarea
                        rows={2}
                        value={dukanDescription}
                        onChange={e => setDukanDescription(e.target.value)}
                        placeholder="Aap kya bechte hain? Kesi website chahiye? (e.g. Menu delivery system, sizes/colors, appointment slots...)"
                        className="w-full px-3.5 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950 font-medium resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 mt-1 bg-zinc-950 hover:bg-black text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? 'Processing...' : 'Create Dukan ID & Set Password'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                )}

                {/* Step 3: Dukan ID & Credentials Setup */}
                {dukanStep === 3 && (
                  <form onSubmit={handleDukanProceedToContract} className="space-y-4">
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-800 font-bold block">
                          Official Generated Dukan ID
                        </span>
                        <span className="text-xl font-mono font-black text-emerald-950 tracking-wider">
                          {dukanGeneratedId}
                        </span>
                      </div>
                      <span className="px-3 py-1 bg-emerald-600 text-white text-[11px] font-bold rounded-full flex items-center gap-1 shadow-2xs">
                        <Check className="w-3.5 h-3.5 stroke-[3]" /> Assigned
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
                      <span>Proceed to Digital Merchant Contract</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                )}

                {/* Step 4: Digital Merchant Agreement & E-Signature */}
                {dukanStep === 4 && (
                  <form onSubmit={handleDukanFinalSubmit} className="space-y-4">
                    <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl max-h-48 overflow-y-auto text-xs text-zinc-700 leading-relaxed space-y-2.5 font-medium scrollbar-thin">
                      <h4 className="font-extrabold text-zinc-950 text-sm border-b pb-1">
                        ChuruOne Merchant Digital Service Agreement
                      </h4>
                      <p>
                        <strong>1. 100% Free Store Onboarding:</strong> Abhi ke liye website aur portal registration sabhi Churu ke dukandaron ke liye 100% FREE hai. Bhavishya mein platform maintenance ya premium features ke liye shulk liya ja sakta hai, jiski soochna 30 din pehle di jayegi.
                      </p>
                      <p>
                        <strong>2. Authentic & Legal Goods:</strong> Dukandar koi bhi illegal, counterfeit, expired ya banned product platform par nahi bechenge. Sirf legal aur authentic products hi allowed hain.
                      </p>
                      <p>
                        <strong>3. Category Adherence:</strong> Dukandar ne jis business category ({dukanBusinessType}) ke liye apply kiya hai, strictly usi se sambandhit items bechenge. Kisi nayi category ko add karne se pehle ChuruOne administration se approval lena anivarya hoga.
                      </p>
                      <p>
                        <strong>4. Service Provider Status:</strong> ChuruOne keval ek digital technology aur discovery platform hai. Product quality, order preparation, packaging aur customer fulfillment ki sidhi zimmedari Dukandar ki hogi.
                      </p>
                      <p>
                        <strong>5. Fair Pricing:</strong> MRP se adhik muly par koi item nahi becha jayega, aur shahar ke customers ke sath transparent vyavhaar kiya jayega.
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
                      {loading ? 'Submitting Application...' : 'Sign Contract & Open Dukan Portal'}
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
                      Apna Dukan ID ya Registered Mobile Number dalein:
                    </p>
                    <input
                      type="text"
                      value={dukanForgotIdentifier}
                      onChange={e => setDukanForgotIdentifier(e.target.value)}
                      placeholder="e.g. DKN-1001 ya 7023963189"
                      className="w-full px-4 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950 font-mono font-bold"
                    />
                    <button
                      type="button"
                      onClick={handleDukanForgotSendOtp}
                      disabled={loading || !dukanForgotIdentifier.trim()}
                      className="w-full py-2.5 bg-zinc-950 text-white text-xs font-bold rounded-xl hover:bg-zinc-800 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {loading ? 'Sending...' : 'Send Password Reset OTP'}
                    </button>
                  </div>
                )}

                {dukanForgotStep === 2 && (
                  <div className="space-y-3.5">
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
                    <button
                      type="button"
                      onClick={handleDukanForgotVerifyAndReset}
                      disabled={loading}
                      className="w-full py-2.5 bg-zinc-950 text-white text-xs font-bold rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      {loading ? 'Updating...' : 'Update Dukan Password'}
                    </button>
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
