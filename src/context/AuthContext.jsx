import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_URL, getStoreId } from '../config/api';
import { sounds } from '../utils/soundEffects';
import { auth, isFirebaseConfigured } from '../firebase/config';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Helper to load persistent user session from localStorage
  const loadSavedUser = () => {
    try {
      const saved = localStorage.getItem('sn_session') || localStorage.getItem('sn_current_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && (parsed.phone || parsed.id || parsed.name)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved session:', e);
    }
    return null;
  };

  // Current session user - restored immediately on page open/refresh
  const [currentUser, setCurrentUser] = useState(loadSavedUser);

  // Modal & Flow Control States
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeStep, setActiveStep] = useState('phone'); // 'phone', 'otp', 'register'
  const [pendingPhone, setPendingPhone] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [fast2smsInfo, setFast2smsInfo] = useState(null);
  const [gatewayInfo, setGatewayInfo] = useState(null);

  // New State for Profile VIP Pass Modal
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Keep session synchronized in localStorage whenever currentUser updates
  useEffect(() => {
    try {
      if (currentUser) {
        const userJson = JSON.stringify(currentUser);
        localStorage.setItem('sn_session', userJson);
        localStorage.setItem('sn_current_user', userJson);
      }
    } catch (e) {
      console.warn('Local storage write warning:', e);
    }
  }, [currentUser]);

  // Background Session Refresh: Keep profile fresh with server without logging out
  useEffect(() => {
    if (!currentUser?.phone) return;
    let isMounted = true;
    const cleanPhone = currentUser.phone.replace(/\D/g, '').slice(-10);

    fetch(`${API_URL}/api/auth/me?phone=${cleanPhone}`)
      .then(res => res.json())
      .then(data => {
        if (!isMounted) return;
        if (data.success && data.user) {
          // Merge fresh customer record (orders count, spent, address, etc.)
          setCurrentUser(prev => {
            if (!prev) return data.user;
            return { ...prev, ...data.user };
          });
        }
      })
      .catch(err => {
        // Offline / network glitch: DO NOT log out user! Local session remains active.
        console.warn('Session background sync note:', err.message);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Open modal safely (defaults to 'phone')
  const openAuthModal = (arg1 = 'phone', arg2 = 'phone') => {
    const validSteps = ['phone', 'otp', 'register'];
    const targetStep = validSteps.includes(arg1) ? arg1 : (validSteps.includes(arg2) ? arg2 : 'phone');
    setActiveStep(targetStep);
    setIsAuthModalOpen(true);
    setFast2smsInfo(null);
    setGatewayInfo(null);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setActiveStep('phone');
    setPendingPhone('');
    setConfirmationResult(null);
    setIsSendingOtp(false);
    setFast2smsInfo(null);
    setGatewayInfo(null);
  };

  // Setup Google invisible reCAPTCHA verifier
  const initRecaptchaVerifier = (containerId = 'recaptcha-container') => {
    if (!auth) return null;
    try {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {
          console.warn('reCAPTCHA clear note:', e);
        }
        window.recaptchaVerifier = null;
      }

      // Check if target container exists
      const el = document.getElementById(containerId);
      if (!el) {
        console.warn(`reCAPTCHA container #${containerId} not found, will use body container`);
      }

      window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size: 'invisible',
        callback: () => {
          console.log('reCAPTCHA verified successfully by Google');
        },
        'expired-callback': () => {
          console.warn('reCAPTCHA expired, please retry');
        },
      });
      return window.recaptchaVerifier;
    } catch (err) {
      console.error('Error initializing RecaptchaVerifier:', err);
      return null;
    }
  };

  // Step 1: Send REAL SMS OTP to Mobile Phone via Firebase / Google
  const sendPhoneOtp = async (phone) => {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      return { success: false, message: 'Kripya sahi 10-digit mobile number dalein' };
    }

    const fullPhoneNumber = `+91${cleanPhone}`;
    setPendingPhone(cleanPhone);
    setIsSendingOtp(true);

    // 1. Send OTP via Backend SMS Engine (Priority 1: Private SIM Gateway, Priority 2: Fast2SMS)
    try {
      const activeStoreId = getStoreId();
      const sRes = await fetch(`${API_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-store-id': activeStoreId
        },
        body: JSON.stringify({ phone: cleanPhone, storeId: activeStoreId }),
      });
      const sData = await sRes.json();

      // Handle Security Lockout from Backend
      if (sData.lockedOut) {
        setIsSendingOtp(false);
        return {
          success: false,
          lockedOut: true,
          minutesLeft: sData.minutesLeft,
          message: sData.message,
        };
      }

      // Handle Cooldown Timer from Backend
      if (sData.cooldown) {
        setIsSendingOtp(false);
        return {
          success: false,
          cooldown: true,
          secondsLeft: sData.secondsLeft,
          message: sData.message,
        };
      }

      if (!sData.success) {
        setIsSendingOtp(false);
        return {
          success: false,
          message: sData.message,
        };
      }

      // Transition to OTP step
      setIsSendingOtp(false);
      setActiveStep('otp');
      setGatewayInfo({
        isDispatched: sData.isSmsDispatched,
        dispatchMethod: sData.dispatchMethod,
        simGatewayEnabled: sData.simGatewayEnabled,
        simGatewayUrl: sData.simGatewayUrl,
        message: sData.message,
      });
      setFast2smsInfo({
        hasKey: sData.hasSmsApiKey,
        isDispatched: sData.isSmsDispatched,
        gatewayMessage: sData.fast2smsError,
        isVerificationPending: sData.fast2smsWebsiteVerificationPending,
      });
      sounds.playPop();

      return {
        success: true,
        message: sData.message,
      };
    } catch (sErr) {
      console.warn('Backend SMS service note:', sErr);
    }

    // 2. If Backend was offline, use Google Firebase Phone Auth fallback
    if (isFirebaseConfigured && auth) {
      try {
        const appVerifier = initRecaptchaVerifier('recaptcha-container');
        if (!appVerifier) {
          throw new Error('reCAPTCHA container initialize nahi ho paya. Kripya page refresh karein.');
        }

        console.log(`📡 Sending Real SMS OTP via Google Firebase to ${fullPhoneNumber}...`);
        const confirmResult = await signInWithPhoneNumber(auth, fullPhoneNumber, appVerifier);
        setConfirmationResult(confirmResult);
        setActiveStep('otp');
        setIsSendingOtp(false);
        sounds.playPop();

        return {
          success: true,
          message: `Real SMS Google dwara +91 ${cleanPhone} par bhej diya gaya hai! SMS inbox check karein.`,
        };
      } catch (err) {
        setIsSendingOtp(false);
        console.error('Firebase Phone Auth Error:', err);

        let errorExplanation = '';
        if (err.code === 'auth/operation-not-allowed') {
          errorExplanation = 'Google ne SMS block kiya: Firebase Console me India (+91) ko Allow karein ya Private SIM Gateway use karein.';
        } else if (err.code === 'auth/invalid-phone-number') {
          errorExplanation = 'Phone number ka format valid nahi hai.';
        } else if (err.code === 'auth/quota-exceeded') {
          errorExplanation = 'Google SMS Quota exceed ho gaya. Private Android SIM Gateway use karein.';
        } else if (err.code === 'auth/billing-not-enabled') {
          errorExplanation = 'Google Cloud me Phone SMS ke liye billing linked honi chahiye.';
        } else {
          errorExplanation = `SMS dispatch error (${err.code || 'Failed'}): ${err.message || 'SMS send fail hua'}`;
        }

        return {
          success: false,
          errorCode: err.code,
          message: errorExplanation,
        };
      }
    }

    setIsSendingOtp(false);
    return {
      success: false,
      message: 'Real SMS bhejne ke liye Private Android SIM Gateway ya Fast2SMS configure karein.',
    };
  };

  // Step 2: Verify Real OTP (Backed by Server)
  const verifyPhoneOtp = async (enteredOtp) => {
    const cleanOtp = (enteredOtp || '').trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      return { success: false, message: 'Kripya 6-digit ka valid OTP dalein.' };
    }

    try {
      const activeStoreId = getStoreId();
      const sRes = await fetch(`${API_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-store-id': activeStoreId
        },
        body: JSON.stringify({ phone: pendingPhone, otp: cleanOtp, storeId: activeStoreId }),
      });
      const sData = await sRes.json();
      
      if (sData.success) {
        if (!sData.isNewUser) {
          // Existing User -> Login Directly!
          console.log('🔥 Welcome back, existing user!');
          sounds.playSuccessFanfare();
          setCurrentUser(sData.user);
          localStorage.setItem('auth_token', sData.token);
          closeAuthModal();
          return { success: true, isNewUser: false, user: sData.user };
        } else {
          // New User -> Prompt for Registration
          setActiveStep('register');
          // Save temporary token for registration submission
          localStorage.setItem('temp_reg_token', sData.tempToken);
          return { success: true, isNewUser: true };
        }
      } else {
        return {
          success: false,
          lockedOut: sData.lockedOut,
          attemptsLeft: sData.attemptsLeft,
          message: sData.message,
        };
      }
    } catch (e) {
      console.error('Backend verify check error:', e);
      return { success: false, message: 'Server se connect nahi ho paya. Kripya check karein.' };
    }
  };

  // Step 3: Register Complete Profile ID
  const registerUserProfile = async (profileData) => {
    const tempToken = localStorage.getItem('temp_reg_token');
    
    try {
      const activeStoreId = getStoreId();
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-store-id': activeStoreId
        },
        body: JSON.stringify({
          phone: pendingPhone,
          name: profileData.name || 'Foodie',
          email: profileData.email || '',
          address: profileData.address || '',
          tempToken,
          storeId: activeStoreId
        })
      });
      const data = await res.json();
      
      if (data.success) {
        setCurrentUser(data.user);
        localStorage.setItem('auth_token', data.token);
        localStorage.removeItem('temp_reg_token');
        sounds.playSuccessFanfare();
        closeAuthModal();
        return { success: true, user: data.user };
      }
      return { success: false, message: data.message };
    } catch (e) {
      return { success: false, message: 'Registration failed.' };
    }
  };

  // Universal Google Login with Smart Server
  const loginWithGoogle = async (googleData = null) => {
    try {
      if (googleData) {
        const activeStoreId = getStoreId();
        const res = await fetch(`${API_URL}/api/auth/google`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-store-id': activeStoreId
          },
          body: JSON.stringify({
            ...googleData,
            storeId: activeStoreId
          })
        });
        const data = await res.json();
        if (data.success && data.user) {
          setCurrentUser(data.user);
          if (data.token) localStorage.setItem('auth_token', data.token);
          sounds.playSuccessFanfare();
          closeAuthModal();
          return { success: true, user: data.user };
        }
      }
    } catch (e) {
      console.warn('Google login context error:', e);
    }
    setActiveStep('phone');
    alert('Google login ke baad mobile number verify karna zaroori hai taaki rider call kar sake.');
  };

  // Live GPS Location Detection
  const fetchCurrentGPSLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          resolve(coords);
        },
        (error) => {
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  };

  const logout = () => {
    try {
      localStorage.removeItem('sn_session');
      localStorage.removeItem('sn_current_user');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('temp_reg_token');
    } catch (e) {
      console.warn('Error clearing session:', e);
    }
    setCurrentUser(null);
    sounds.playTick();
  };

  // Update Customer Profile
  const updateUserProfile = async (updates) => {
    try {
      if (!currentUser) return { success: false };
      const updatedUser = { ...currentUser, ...updates };
      setCurrentUser(updatedUser);
      try {
        const userJson = JSON.stringify(updatedUser);
        localStorage.setItem('sn_session', userJson);
        localStorage.setItem('sn_current_user', userJson);
      } catch (e) {}

      // Sync with backend
      const activeStoreId = getStoreId();
      await fetch(`${API_URL}/api/auth/update-profile`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-store-id': activeStoreId
        },
        body: JSON.stringify({
          phone: currentUser.phone,
          name: updates.name,
          email: updates.email,
          address: updates.address,
          storeId: activeStoreId
        })
      });

      sounds.playSuccessFanfare();
      return { success: true, user: updatedUser };
    } catch (err) {
      console.error('Failed to sync profile update:', err);
      return { success: true };
    }
  };

  // Delete Customer Account
  const deleteUserAccount = async () => {
    try {
      if (currentUser?.phone) {
        const activeStoreId = getStoreId();
        await fetch(`${API_URL}/api/auth/delete-account`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-store-id': activeStoreId
          },
          body: JSON.stringify({ phone: currentUser.phone, storeId: activeStoreId })
        });
      }
      try {
        localStorage.removeItem('sn_session');
        localStorage.removeItem('sn_current_user');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('temp_reg_token');
      } catch (e) {}
      setCurrentUser(null);
      sounds.playTick();
      setIsProfileOpen(false);
      return { success: true };
    } catch (err) {
      console.error('Delete account error:', err);
      try {
        localStorage.removeItem('sn_session');
        localStorage.removeItem('sn_current_user');
        localStorage.removeItem('auth_token');
      } catch (e) {}
      setCurrentUser(null);
      return { success: true };
    }
  };

  const isAuthenticated = Boolean(currentUser);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        isAuthModalOpen,
        isProfileOpen,
        setIsProfileOpen,
        activeStep,
        pendingPhone,
        confirmationResult,
        isSendingOtp,
        fast2smsInfo,
        gatewayInfo,
        openAuthModal,
        closeAuthModal,
        sendPhoneOtp,
        verifyPhoneOtp,
        registerUserProfile,
        updateUserProfile,
        deleteUserAccount,
        loginWithGoogle,
        fetchCurrentGPSLocation,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
