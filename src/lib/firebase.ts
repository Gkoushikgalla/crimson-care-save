// Firebase configuration - uses dynamic imports to avoid build issues
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

// Debug: Log Firebase configuration status (only in development)
if (import.meta.env.DEV) {
  console.log("Firebase configuration check:", {
    isConfigured: isFirebaseConfigured,
    hasApiKey: !!firebaseConfig.apiKey,
    hasProjectId: !!firebaseConfig.projectId,
    projectId: firebaseConfig.projectId,
  });
}

let firebaseApp: any = null;

export const getFirebaseApp = async () => {
  if (!isFirebaseConfigured) {
    console.warn("Firebase not configured - missing API key or project ID");
    return null;
  }
  
  try {
    const { initializeApp, getApps } = await import("firebase/app");
    
    if (getApps().length === 0) {
      firebaseApp = initializeApp(firebaseConfig);
      console.log("Firebase app initialized successfully");
    } else {
      firebaseApp = getApps()[0];
    }
    return firebaseApp;
  } catch (e: any) {
    console.error("Firebase app init error:", e);
    console.error("Error details:", e.message, e.code);
    return null;
  }
};

export const getFirebaseDb = async () => {
  if (!isFirebaseConfigured) return null;
  
  try {
    const app = await getFirebaseApp();
    if (!app) {
      console.warn("Firebase app not available for Firestore");
      return null;
    }
    
    const { getFirestore } = await import("firebase/firestore");
    const db = getFirestore(app);
    console.log("Firestore initialized successfully");
    return db;
  } catch (e: any) {
    console.error("Firebase Firestore init error:", e);
    console.error("Error details:", e.message, e.code);
    return null;
  }
};

export const getFirebaseAuth = async () => {
  if (!isFirebaseConfigured) return null;
  
  try {
    const app = await getFirebaseApp();
    if (!app) {
      console.warn("Firebase app not available for Auth");
      return null;
    }
    
    const { getAuth } = await import("firebase/auth");
    const auth = getAuth(app);
    // Use default persistence (LOCAL on web) - do NOT call setPersistence here as repeated calls can wipe sessions
    console.log("Firebase Auth initialized successfully");
    return auth;
  } catch (e: any) {
    console.error("Firebase Auth init error:", e);
    console.error("Error details:", e.message, e.code);
    return null;
  }
};

export const getFirebaseAnalytics = async () => {
  // Analytics only works in the browser and requires measurementId.
  if (!isFirebaseConfigured || !firebaseConfig.measurementId) return null;
  if (typeof window === "undefined") return null;

  try {
    const app = await getFirebaseApp();
    if (!app) return null;

    const { getAnalytics, isSupported } = await import("firebase/analytics");
    if (!(await isSupported())) return null;

    return getAnalytics(app);
  } catch (e) {
    console.error("Firebase Analytics init error:", e);
    return null;
  }
};

export { firebaseConfig };
