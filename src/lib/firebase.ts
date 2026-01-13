import { logger } from "./logger";

// Firebase configuration - uses dynamic imports to avoid build issues
// Build timestamp: 2026-01-13
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId
);

let firebaseApp: any = null;

export const getFirebaseApp = async () => {
  if (!isFirebaseConfigured) return null;
  
  try {
    const { initializeApp, getApps } = await import("firebase/app");
    
    if (getApps().length === 0) {
      firebaseApp = initializeApp(firebaseConfig);
    } else {
      firebaseApp = getApps()[0];
    }
    return firebaseApp;
  } catch (e) {
    logger.error("Firebase app init error:", e);
    return null;
  }
};

export const getFirebaseDb = async () => {
  if (!isFirebaseConfigured) return null;
  
  try {
    const app = await getFirebaseApp();
    if (!app) return null;
    
    const { getFirestore } = await import("firebase/firestore");
    return getFirestore(app);
  } catch (e) {
    logger.error("Firebase Firestore init error:", e);
    return null;
  }
};

export const getFirebaseAuth = async () => {
  if (!isFirebaseConfigured) return null;
  
  try {
    const app = await getFirebaseApp();
    if (!app) return null;
    
    const { getAuth } = await import("firebase/auth");
    return getAuth(app);
  } catch (e) {
    logger.error("Firebase Auth init error:", e);
    return null;
  }
};

export { firebaseConfig };
