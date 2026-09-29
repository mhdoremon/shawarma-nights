import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { firebaseConfig as directConfig } from '../firebaseConfig';

// Read config from:
// 1. Direct JS file (src/firebaseConfig.js)
// 2. Smart auto-parsed Vite define (__RAW_FIREBASE_CONFIG__)
// 3. Environment variables (import.meta.env)
const raw = typeof __RAW_FIREBASE_CONFIG__ !== 'undefined' ? __RAW_FIREBASE_CONFIG__ : {};

const firebaseConfig = {
  apiKey: directConfig?.apiKey || raw.apiKey || import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: directConfig?.authDomain || raw.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: directConfig?.projectId || raw.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: directConfig?.storageBucket || raw.storageBucket || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: directConfig?.messagingSenderId || raw.messagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: directConfig?.appId || raw.appId || import.meta.env.VITE_FIREBASE_APP_ID || '',
  databaseURL: directConfig?.databaseURL || raw.databaseURL || import.meta.env.VITE_FIREBASE_DATABASE_URL || '',
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey !== '' &&
  !firebaseConfig.apiKey.includes('YourApiKeyHere')
);

let app = null;
let db = null;
let rtdb = null;
let auth = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    if (firebaseConfig.databaseURL) {
      rtdb = getDatabase(app);
    }
    console.log('🔥 Firebase successfully connected with Project:', firebaseConfig.projectId);
  } catch (err) {
    console.warn('⚠️ Firebase initialization error:', err.message);
  }
} else {
  console.log('ℹ️ Firebase credentials not found or empty — using Built-in Real-Time Engine.');
}

export { app, db, rtdb, auth };
