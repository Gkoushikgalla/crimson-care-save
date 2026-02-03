import { createContext, useContext, useState, ReactNode, useEffect, useRef, useCallback } from "react";
import { isFirebaseConfigured, getFirebaseDb, getFirebaseAuth } from "@/lib/firebase";
import { registrationSchema, loginSchema, safeValidate } from "@/lib/validation";
import { getAll, getById, put, getByIndex, initializeDB, isIndexedDBAvailable, STORE_NAMES } from "@/lib/indexedDB";

export interface DonorStats {
  totalDonations: number;
  lastDonation: string | null;
  nextEligible: string | null;
  points: number;
  level: string;
  donationHistory: Array<{ id: string; date: string; location: string; units: number }>;
  badges: Array<{ name: string; icon: string; earned: boolean }>;
}

// User interface WITHOUT password - passwords should never be stored client-side
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "donor" | "hospital" | "bloodbank" | "admin";
  bloodType?: string;
  apaarId?: string;
  hospitalName?: string;
  bloodBankName?: string;
  licenseNumber?: string;
  createdAt: string;
  donorStats?: DonorStats;
}

// Internal user type for Firestore (includes hashed password indicator)
interface StoredUser extends User {
  hasPassword: boolean; // Indicates user was registered with password
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; role?: string }>;
  register: (userData: RegisterData) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (data: Partial<User>) => Promise<void>;
  updateDonorStats: (stats: Partial<DonorStats>) => Promise<void>;
}

interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: "donor" | "hospital" | "bloodbank";
  bloodType?: string;
  apaarId?: string;
  hospitalName?: string;
  bloodBankName?: string;
  licenseNumber?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getInitialDonorStats = (): DonorStats => ({
  totalDonations: 0,
  lastDonation: null,
  nextEligible: new Date().toISOString().split("T")[0],
  points: 0,
  level: "New Donor",
  donationHistory: [],
  badges: [
    { name: "First Donation", icon: "🩸", earned: false },
    { name: "5 Donations", icon: "⭐", earned: false },
    { name: "10 Donations", icon: "🏆", earned: false },
    { name: "Life Saver", icon: "❤️", earned: false },
    { name: "25 Donations", icon: "👑", earned: false },
  ],
});

// PBKDF2-based password hashing for demo mode
// Uses unique salt per user and high iteration count
// Note: In production with Firebase, Firebase Auth handles password security
const PBKDF2_ITERATIONS = 100000;

const generateSalt = (): Uint8Array => {
  return crypto.getRandomValues(new Uint8Array(16));
};

const arrayToHex = (arr: Uint8Array): string => {
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
};

const hexToArray = (hex: string): Uint8Array => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
};

const deriveKey = async (password: string, salt: Uint8Array): Promise<string> => {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  
  // Create a new ArrayBuffer to satisfy TypeScript's strict type checking
  const saltBuffer = new Uint8Array(salt).buffer;
  
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: new Uint8Array(saltBuffer),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );
  
  return arrayToHex(new Uint8Array(derivedBits));
};

// Creates a secure hash with unique salt - returns "salt:hash" format
const secureHash = async (password: string): Promise<string> => {
  const salt = generateSalt();
  const hash = await deriveKey(password, salt);
  return `${arrayToHex(salt)}:${hash}`;
};

// Verifies password against stored "salt:hash" format
const verifyPassword = async (password: string, storedHash: string): Promise<boolean> => {
  const [saltHex, expectedHash] = storedHash.split(':');
  if (!saltHex || !expectedHash) return false;
  
  const salt = hexToArray(saltHex);
  const computedHash = await deriveKey(password, salt);
  
  // Constant-time comparison to prevent timing attacks
  if (computedHash.length !== expectedHash.length) return false;
  let result = 0;
  for (let i = 0; i < computedHash.length; i++) {
    result |= computedHash.charCodeAt(i) ^ expectedHash.charCodeAt(i);
  }
  return result === 0;
};

// Log demo mode security warning on startup
const logDemoModeWarning = () => {
  console.warn(
    '%c⚠️ DEMO MODE SECURITY WARNING',
    'color: #ff6b6b; font-size: 16px; font-weight: bold;'
  );
  console.warn(
    'This application is running in demo mode without Firebase. ' +
    'Password hashes are stored in browser storage. ' +
    'For production use, configure Firebase credentials for proper security.'
  );
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const unsubscribeAuthRef = useRef<(() => void) | null>(null);
  const unsubscribeUserRef = useRef<(() => void) | null>(null);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      // Initialize IndexedDB first
      if (isIndexedDBAvailable()) {
        await initializeDB();
      }
      
      // Check session then localStorage so login persists across refresh and tabs
      const sessionUserId = sessionStorage.getItem("crimsoncare_session_id") || localStorage.getItem("crimsoncare_session_id");
      
      if (isFirebaseConfigured) {
        try {
          const auth = await getFirebaseAuth();
          if (auth) {
            const { onAuthStateChanged } = await import("firebase/auth");
            
            unsubscribeAuthRef.current = onAuthStateChanged(auth, async (firebaseUser) => {
              if (firebaseUser) {
                // Load user profile from Firestore
                await loadUserProfile(firebaseUser.uid);
              } else if (sessionUserId) {
                // Fallback to session-based auth
                await loadUserProfile(sessionUserId);
              } else {
                setUser(null);
                setIsLoading(false);
              }
            });
            return;
          }
        } catch (e) {
          console.error("Firebase Auth init error:", e);
        }
      }

      // Fallback: Load from session storage
      if (sessionUserId) {
        await loadUserProfile(sessionUserId);
      } else {
        setIsLoading(false);
      }
    };

    initAuth();
    return () => {
      unsubscribeAuthRef.current?.();
      unsubscribeUserRef.current?.();
    };
  }, []);

  const loadUserProfile = async (userId: string) => {
    if (isFirebaseConfigured) {
      try {
        const db = await getFirebaseDb();
        if (db) {
          const { doc, onSnapshot, getDoc, setDoc } = await import("firebase/firestore");
          const auth = await getFirebaseAuth();
          
          // Check if document exists first
          const userDocRef = doc(db, "users", userId);
          const userDocSnap = await getDoc(userDocRef);
          
          // If user exists in Firebase Auth but profile doesn't exist in Firestore,
          // try to create a basic profile (this handles cases where registration partially failed)
          if (!userDocSnap.exists() && auth?.currentUser) {
            const firebaseUser = auth.currentUser;
            console.warn("User profile not found in Firestore, creating basic profile...");
            try {
              const basicProfile: StoredUser = {
                id: userId,
                name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
                email: firebaseUser.email || "",
                phone: firebaseUser.phoneNumber || "",
                role: "donor", // Default role
                createdAt: new Date().toISOString(),
                hasPassword: true,
              };
              await setDoc(userDocRef, basicProfile);
              console.log("Created basic user profile in Firestore");
            } catch (createError: any) {
              console.error("Failed to create user profile:", createError);
              if (createError.code === "permission-denied") {
                console.error("Firestore permission denied - please check security rules");
              }
            }
          }
          
          unsubscribeUserRef.current = onSnapshot(
            userDocRef,
            (docSnap) => {
              if (docSnap.exists()) {
                const userData = docSnap.data() as StoredUser;
                // Remove sensitive fields before setting state
                const { hasPassword, ...safeUser } = userData;
                setUser({ ...safeUser, id: docSnap.id });
                sessionStorage.setItem("crimsoncare_session_id", userId);
                localStorage.setItem("crimsoncare_session_id", userId);
              } else {
                console.warn("User profile not found in Firestore");
                setUser(null);
                sessionStorage.removeItem("crimsoncare_session_id");
                localStorage.removeItem("crimsoncare_session_id");
              }
              setIsLoading(false);
            },
            (error) => {
              console.error("User profile error:", error);
              setIsLoading(false);
            }
          );
          return;
        }
      } catch (e) {
        console.error("Load user profile error:", e);
      }
    }
    
    // Fallback: Load from IndexedDB (demo mode)
    try {
      if (isIndexedDBAvailable()) {
        const foundUser = await getById<StoredUser>(STORE_NAMES.USERS, userId);
        if (foundUser) {
          const { hasPassword, ...safeUser } = foundUser;
          setUser(safeUser);
          sessionStorage.setItem("crimsoncare_session_id", userId);
          localStorage.setItem("crimsoncare_session_id", userId);
          setIsLoading(false);
          return;
        }
      }
      
      // Final fallback to localStorage
      const stored = localStorage.getItem("crimsoncare_users");
      if (stored) {
        const users = JSON.parse(stored) as StoredUser[];
        const foundUser = users.find(u => u.id === userId);
        if (foundUser) {
          const { hasPassword, ...safeUser } = foundUser;
          setUser(safeUser);
          sessionStorage.setItem("crimsoncare_session_id", userId);
          localStorage.setItem("crimsoncare_session_id", userId);
        }
      }
    } catch (e) {
      console.error("Storage error:", e);
    }
    setIsLoading(false);
  };

  const register = async (userData: RegisterData): Promise<{ success: boolean; error?: string }> => {
    // Validate input data
    const validation = safeValidate(registrationSchema, userData);
    if (!validation.success) {
      return { success: false, error: (validation as { success: false; errors: string[] }).errors[0] };
    }

    // Prevent admin self-registration
    if ((userData.role as string) === "admin") {
      return { success: false, error: "Invalid role selection" };
    }

    const passwordHash = await secureHash(userData.password);
    const userId = crypto.randomUUID?.() || Math.random().toString(36).slice(2);
    
    const newUser: StoredUser = {
      id: userId,
      name: userData.name.trim(),
      email: userData.email.trim().toLowerCase(),
      phone: userData.phone,
      role: userData.role,
      bloodType: userData.role === "donor" ? userData.bloodType : undefined,
      apaarId: userData.role === "donor" && userData.apaarId ? userData.apaarId : undefined,
      hospitalName: userData.role === "hospital" ? userData.hospitalName : undefined,
      bloodBankName: userData.role === "bloodbank" ? userData.bloodBankName : undefined,
      licenseNumber: userData.role !== "donor" ? userData.licenseNumber : undefined,
      createdAt: new Date().toISOString(),
      donorStats: userData.role === "donor" ? getInitialDonorStats() : undefined,
      hasPassword: true,
    };

    if (isFirebaseConfigured) {
      try {
        const auth = await getFirebaseAuth();
        const db = await getFirebaseDb();
        
        if (!auth || !db) {
          console.warn("Firebase configured but initialization failed. Falling back to local storage.");
          // Fall through to fallback code below
        } else {
          const { createUserWithEmailAndPassword } = await import("firebase/auth");
          const { doc, setDoc, collection, query, where, getDocs } = await import("firebase/firestore");
          
          // Check if email exists
          const emailQuery = query(collection(db, "users"), where("email", "==", newUser.email));
          const emailSnap = await getDocs(emailQuery);
          if (!emailSnap.empty) {
            return { success: false, error: "Email already registered. Please login instead." };
          }

          // Create Firebase Auth user
          const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
          newUser.id = userCredential.user.uid;
          
          // Store user profile in Firestore (without password - Firebase Auth handles it)
          try {
            await setDoc(doc(db, "users", newUser.id), newUser);
            console.log("User profile saved to Firestore successfully");
          } catch (firestoreError: any) {
            console.error("Firestore write error:", firestoreError);
            // If Firestore write fails, we should delete the Firebase Auth user to avoid orphaned accounts
            // But for now, let's just log and continue - the user can still log in via Firebase Auth
            // The profile will be created on first login or can be fixed manually
            if (firestoreError.code === "permission-denied") {
              console.warn("Firestore permission denied - user created in Auth but profile not saved");
              // Still return success since Auth user was created
              // User can log in but profile won't be available until Firestore rules are fixed
            } else {
              throw firestoreError; // Re-throw other errors
            }
          }
          
          const { hasPassword, ...safeUser } = newUser;
          setUser(safeUser);
          sessionStorage.setItem("crimsoncare_session_id", newUser.id);
          localStorage.setItem("crimsoncare_session_id", newUser.id);
          return { success: true };
        }
      } catch (e: any) {
        console.error("Firebase register error:", e);
        // Provide more specific error messages
        if (e.code === "auth/email-already-in-use") {
          return { success: false, error: "Email already registered. Please login instead." };
        }
        if (e.code === "auth/invalid-email") {
          return { success: false, error: "Invalid email address. Please check your email." };
        }
        if (e.code === "auth/weak-password") {
          return { success: false, error: "Password is too weak. Please use a stronger password." };
        }
        if (e.code === "auth/network-request-failed") {
          return { success: false, error: "Network error. Please check your internet connection." };
        }
        if (e.code === "permission-denied" || e.message?.includes("permission")) {
          return { success: false, error: "Permission denied. Please check Firebase configuration." };
        }
        // If Firebase fails, fall through to fallback
        console.warn("Firebase registration failed, falling back to local storage:", e.message || e);
      }
    }

    // Fallback: Store in IndexedDB (demo mode) - store hash, not password
    try {
      if (isIndexedDBAvailable()) {
        // Check if email exists using index
        const existingUsers = await getByIndex<StoredUser>(STORE_NAMES.USERS, "email", newUser.email);
        if (existingUsers.length > 0) {
          return { success: false, error: "Email already registered. Please login instead." };
        }

        // Store with password hash for demo mode verification
        const userToStore = { ...newUser, passwordHash };
        await put(STORE_NAMES.USERS, userToStore);
        
        const { hasPassword, ...safeUser } = newUser;
        setUser(safeUser);
        sessionStorage.setItem("crimsoncare_session_id", newUser.id);
        localStorage.setItem("crimsoncare_session_id", newUser.id);
        return { success: true };
      }
      
      // Fallback to localStorage
      const stored = localStorage.getItem("crimsoncare_users");
      const users: any[] = stored ? JSON.parse(stored) : [];
      
      if (users.some(u => u.email.toLowerCase() === newUser.email)) {
        return { success: false, error: "Email already registered. Please login instead." };
      }

      const userToStore = { ...newUser, passwordHash };
      users.push(userToStore);
      localStorage.setItem("crimsoncare_users", JSON.stringify(users));
      
      const { hasPassword, ...safeUser } = newUser;
      setUser(safeUser);
      sessionStorage.setItem("crimsoncare_session_id", newUser.id);
      localStorage.setItem("crimsoncare_session_id", newUser.id);
      return { success: true };
    } catch (e) {
      console.error("Storage error:", e);
      return { success: false, error: "Registration failed. Please try again." };
    }
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    const trimmed = email?.trim().toLowerCase();
    if (!trimmed) {
      return { success: false, error: "Please enter your email address." };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      return { success: false, error: "Please enter a valid email address." };
    }

    if (isFirebaseConfigured) {
      try {
        const auth = await getFirebaseAuth();
        if (auth) {
          const { sendPasswordResetEmail } = await import("firebase/auth");
          await sendPasswordResetEmail(auth, trimmed);
          return { success: true };
        }
      } catch (e: any) {
        if (e.code === "auth/user-not-found") {
          return { success: false, error: "No account found with this email. Please check the address or sign up." };
        }
        if (e.code === "auth/invalid-email") {
          return { success: false, error: "Invalid email address. Please check and try again." };
        }
        if (e.code === "auth/too-many-requests") {
          return { success: false, error: "Too many attempts. Please try again later." };
        }
        if (e.code === "auth/network-request-failed") {
          return { success: false, error: "Network error. Please check your connection and try again." };
        }
        return { success: false, error: e.message || "Failed to send reset email. Please try again." };
      }
    }

    return {
      success: false,
      error: "Password reset is not available. Please contact support or ensure the app is configured with Firebase.",
    };
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string; role?: string }> => {
    // Validate input
    const validation = safeValidate(loginSchema, { email, password });
    if (!validation.success) {
      return { success: false, error: (validation as { success: false; errors: string[] }).errors[0] };
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (isFirebaseConfigured) {
      try {
        const auth = await getFirebaseAuth();
        const db = await getFirebaseDb();
        if (auth) {
          const { signInWithEmailAndPassword } = await import("firebase/auth");
          
          try {
            const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
            const uid = userCredential.user.uid;
            sessionStorage.setItem("crimsoncare_session_id", uid);
            localStorage.setItem("crimsoncare_session_id", uid);
            let role: string | undefined;
            if (db) {
              try {
                const { doc, getDoc } = await import("firebase/firestore");
                const userSnap = await getDoc(doc(db, "users", uid));
                if (userSnap.exists()) {
                  role = (userSnap.data() as User).role;
                }
              } catch (_) { /* ignore */ }
            }
            console.log("Firebase login successful");
            return { success: true, role };
          } catch (firebaseError: any) {
            console.error("Firebase Auth login error:", firebaseError);
            
            // If Firebase Auth fails, fall through to check local storage
            // This handles cases where registration fell back to local storage
            if (firebaseError.code === "auth/user-not-found" || 
                firebaseError.code === "auth/wrong-password" ||
                firebaseError.code === "auth/invalid-credential") {
              // User doesn't exist in Firebase Auth, check local storage
              console.log("User not found in Firebase Auth, checking local storage...");
            } else {
              // Other Firebase errors (network, etc.) - still try local storage as fallback
              console.log("Firebase Auth error, falling back to local storage...");
            }
          }
        } else {
          console.warn("Firebase Auth not available, using local storage");
        }
      } catch (e: any) {
        console.error("Firebase login error:", e);
        // Fall through to local storage check
      }
    }

    // Fallback: Check IndexedDB with secure password verification
    try {
      if (isIndexedDBAvailable()) {
        const users = await getByIndex<any>(STORE_NAMES.USERS, "email", normalizedEmail);
        
        for (const u of users) {
          if (u.passwordHash && await verifyPassword(password, u.passwordHash)) {
            const { passwordHash: _, hasPassword, ...safeUser } = u;
            setUser(safeUser);
            sessionStorage.setItem("crimsoncare_session_id", u.id);
            localStorage.setItem("crimsoncare_session_id", u.id);
            console.log("Login successful from IndexedDB");
            return { success: true, role: safeUser.role };
          }
        }
      }
      
      // Fallback to localStorage
      const stored = localStorage.getItem("crimsoncare_users");
      if (stored) {
        const users = JSON.parse(stored);
        
        for (const u of users) {
          if (u.email.toLowerCase() === normalizedEmail && 
              u.passwordHash && 
              await verifyPassword(password, u.passwordHash)) {
            const { passwordHash: _, hasPassword, ...safeUser } = u;
            setUser(safeUser);
            sessionStorage.setItem("crimsoncare_session_id", u.id);
            localStorage.setItem("crimsoncare_session_id", u.id);
            console.log("Login successful from localStorage");
            return { success: true, role: safeUser.role };
          }
        }
      }
    } catch (e) {
      console.error("Storage error:", e);
    }
    
    console.error("Login failed: No matching user found in Firebase Auth or local storage");
    return { success: false, error: "Invalid email or password" };
  };

  const logout = useCallback(async () => {
    if (isFirebaseConfigured) {
      try {
        const auth = await getFirebaseAuth();
        if (auth) {
          const { signOut } = await import("firebase/auth");
          await signOut(auth);
        }
      } catch (e) {
        console.error("Firebase signout error:", e);
      }
    }
    
    setUser(null);
    sessionStorage.removeItem("crimsoncare_session_id");
    localStorage.removeItem("crimsoncare_session_id");
  }, []);

  const updateUser = async (data: Partial<User>) => {
    if (!user) return;
    
    // Prevent role escalation
    if (data.role && data.role !== user.role) {
      console.error("Role modification not allowed");
      return;
    }

    const updated = { ...user, ...data };

    if (isFirebaseConfigured) {
      try {
        const db = await getFirebaseDb();
        if (db) {
          const { doc, updateDoc } = await import("firebase/firestore");
          // Only update allowed fields
          const { id, role, email, createdAt, ...allowedUpdates } = data;
          await updateDoc(doc(db, "users", user.id), allowedUpdates);
          return; // Firestore listener will update state
        }
      } catch (e) {
        console.error("Firebase update error:", e);
      }
    }
    
    setUser(updated);
  };

  const updateDonorStats = async (stats: Partial<DonorStats>) => {
    if (!user?.donorStats) return;
    const updatedStats = { ...user.donorStats, ...stats };
    const updated = { ...user, donorStats: updatedStats };

    if (isFirebaseConfigured) {
      try {
        const db = await getFirebaseDb();
        if (db) {
          const { doc, updateDoc } = await import("firebase/firestore");
          await updateDoc(doc(db, "users", user.id), { donorStats: updatedStats });
          return;
        }
      } catch (e) {
        console.error("Firebase update error:", e);
      }
    }
    
    setUser(updated);
  };

  // Note: getDonorsByBloodType was removed for privacy reasons
  // Donor matching now happens through the SOS request flow where donors voluntarily accept requests
  // This is more privacy-preserving as donors opt-in per request rather than having their PII exposed

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading,
      isAuthenticated: !!user,
      login, 
      register, 
      resetPassword, 
      logout, 
      updateUser, 
      updateDonorStats,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
