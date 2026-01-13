import { logger } from "./logger";

// Firebase configuration - hardcoded for production builds
// These are public/publishable keys, secured by Firebase Security Rules
const firebaseConfig = {
  apiKey: "AIzaSyAuu-CwO_inAYz70rdNOByFCLapDMoGF2s",
  authDomain: "crimson-care-109be.firebaseapp.com",
  projectId: "crimson-care-109be",
  storageBucket: "crimson-care-109be.firebasestorage.app",
  messagingSenderId: "25340781932",
  appId: "1:25340781932:web:aab9ed613c27dad5ed3f49",
  measurementId: "G-YVJ1T9JJWM"
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
