import { createContext, useContext, useState, ReactNode, useEffect, useRef, useCallback } from "react";
import { isFirebaseConfigured, getFirebaseDb, getFirebaseAuth } from "@/lib/firebase";
import { registrationSchema, loginSchema, safeValidate } from "@/lib/validation";
import { logger } from "@/lib/logger";

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
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (data: Partial<User>) => Promise<void>;
  updateDonorStats: (stats: Partial<DonorStats>) => Promise<void>;
  // Only expose users relevant to current user's role, not all users
  getDonorsByBloodType: (bloodType: string) => Promise<User[]>;
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

// Simple hash function for demo - in production, use bcrypt on server
const simpleHash = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "crimsoncare_salt_2024");
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const unsubscribeAuthRef = useRef<(() => void) | null>(null);
  const unsubscribeUserRef = useRef<(() => void) | null>(null);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      // Check sessionStorage for current session (more secure than localStorage)
      const sessionUserId = sessionStorage.getItem("crimsoncare_session_id");
      
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
          logger.error("Firebase Auth init error:", e);
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
          const { doc, onSnapshot } = await import("firebase/firestore");
          
          unsubscribeUserRef.current = onSnapshot(
            doc(db, "users", userId),
            (docSnap) => {
              if (docSnap.exists()) {
                const userData = docSnap.data() as StoredUser;
                // Remove sensitive fields before setting state
                const { hasPassword, ...safeUser } = userData;
                setUser({ ...safeUser, id: docSnap.id });
                sessionStorage.setItem("crimsoncare_session_id", userId);
              } else {
                setUser(null);
                sessionStorage.removeItem("crimsoncare_session_id");
              }
              setIsLoading(false);
            },
            (error) => {
              logger.error("User profile error:", error);
              setIsLoading(false);
            }
          );
          return;
        }
      } catch (e) {
        logger.error("Load user profile error:", e);
      }
    }
    
// Demo mode fallback - only available in development
    if (import.meta.env.DEV) {
      try {
        const stored = localStorage.getItem("crimsoncare_users");
        if (stored) {
          const users = JSON.parse(stored) as StoredUser[];
          const foundUser = users.find(u => u.id === userId);
          if (foundUser) {
            const { hasPassword, ...safeUser } = foundUser;
            setUser(safeUser);
            sessionStorage.setItem("crimsoncare_session_id", userId);
          }
        }
      } catch (e) {
        logger.error("Local storage error:", e);
      }
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

    const passwordHash = await simpleHash(userData.password);
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
        
        if (auth && db) {
          const { createUserWithEmailAndPassword } = await import("firebase/auth");
          const { doc, setDoc } = await import("firebase/firestore");
          
          // Create Firebase Auth user FIRST (handles email uniqueness check)
          // This ensures we're authenticated before any Firestore operations
          const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
          newUser.id = userCredential.user.uid;
          
          // Now authenticated - store user profile in Firestore
          await setDoc(doc(db, "users", newUser.id), newUser);
          
          const { hasPassword, ...safeUser } = newUser;
          setUser(safeUser);
          sessionStorage.setItem("crimsoncare_session_id", newUser.id);
          return { success: true };
        }
      } catch (e: any) {
        console.error("=== FIREBASE REGISTRATION ERROR ===");
        console.error("Error code:", e.code);
        console.error("Error message:", e.message);
        console.error("Full error:", e);
        console.error("===================================");
        
        logger.error("Firebase register error:", e);
        
        if (e.code === "auth/email-already-in-use") {
          return { success: false, error: "Email already registered. Please login instead." };
        }
        if (e.code === "auth/weak-password") {
          return { success: false, error: "Password should be at least 6 characters." };
        }
        if (e.code === "auth/invalid-email") {
          return { success: false, error: "Invalid email address format." };
        }
        if (e.code === "auth/operation-not-allowed") {
          return { success: false, error: "Email/Password sign-in is not enabled. Enable it in Firebase Console." };
        }
        if (e.code === "auth/invalid-argument" || e.code === "invalid-argument") {
          return { success: false, error: "Invalid registration data. Please check all fields and try again." };
        }
        if (e.code === "auth/network-request-failed") {
          return { success: false, error: "Network error. Please check your connection and try again." };
        }
        return { success: false, error: `Registration failed: ${e.code || e.message || "Unknown error"}` };
      }
    }

// Demo mode fallback - only available in development
    if (import.meta.env.DEV) {
      try {
        const stored = localStorage.getItem("crimsoncare_users");
        const users: any[] = stored ? JSON.parse(stored) : [];
        
        if (users.some(u => u.email.toLowerCase() === newUser.email)) {
          return { success: false, error: "Email already registered. Please login instead." };
        }

        // Store with password hash for demo mode verification (DEV ONLY)
        const userToStore = { ...newUser, passwordHash };
        users.push(userToStore);
        localStorage.setItem("crimsoncare_users", JSON.stringify(users));
        
        const { hasPassword, ...safeUser } = newUser;
        setUser(safeUser);
        sessionStorage.setItem("crimsoncare_session_id", newUser.id);
        return { success: true };
      } catch (e) {
        logger.error("Local storage error:", e);
        return { success: false, error: "Registration failed. Please try again." };
      }
    }
    
    // Production without Firebase - reject
    return { success: false, error: "Backend not configured. Please contact support." };
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Validate input
    const validation = safeValidate(loginSchema, { email, password });
    if (!validation.success) {
      return { success: false, error: (validation as { success: false; errors: string[] }).errors[0] };
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (isFirebaseConfigured) {
      try {
        const auth = await getFirebaseAuth();
        if (auth) {
          const { signInWithEmailAndPassword } = await import("firebase/auth");
          
          const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
          // User profile will be loaded by onAuthStateChanged listener
          sessionStorage.setItem("crimsoncare_session_id", userCredential.user.uid);
          return { success: true };
        }
      } catch (e: any) {
        logger.error("Firebase login error:", e);
        // Don't reveal whether email exists
        return { success: false, error: "Invalid email or password" };
      }
    }

// Demo mode fallback - only available in development
    if (import.meta.env.DEV) {
      try {
        const stored = localStorage.getItem("crimsoncare_users");
        if (stored) {
          const users = JSON.parse(stored);
          const passwordHash = await simpleHash(password);
          const foundUser = users.find((u: any) => 
            u.email.toLowerCase() === normalizedEmail && u.passwordHash === passwordHash
          );
          
          if (foundUser) {
            const { passwordHash: _, hasPassword, ...safeUser } = foundUser;
            setUser(safeUser);
            sessionStorage.setItem("crimsoncare_session_id", foundUser.id);
            return { success: true };
          }
        }
      } catch (e) {
        logger.error("Local storage error:", e);
      }
    }
    
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
        logger.error("Firebase signout error:", e);
      }
    }
    
    setUser(null);
    // Clear session data
    sessionStorage.removeItem("crimsoncare_session_id");
    // Don't clear localStorage entirely - keep demo users for testing
  }, []);

  const updateUser = async (data: Partial<User>) => {
    if (!user) return;
    
    // Prevent role escalation
    if (data.role && data.role !== user.role) {
      logger.warn("Role modification not allowed");
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
        logger.error("Firebase update error:", e);
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
        logger.error("Firebase update error:", e);
      }
    }
    
    setUser(updated);
  };

  // Query donors by blood type - role-based access
  const getDonorsByBloodType = async (bloodType: string): Promise<User[]> => {
    if (!user) return [];
    
    // Only hospitals and blood banks can query donors
    if (!["hospital", "bloodbank", "admin"].includes(user.role)) {
      return [];
    }

    if (isFirebaseConfigured) {
      try {
        const db = await getFirebaseDb();
        if (db) {
          const { collection, query, where, getDocs } = await import("firebase/firestore");
          const q = query(
            collection(db, "users"),
            where("role", "==", "donor"),
            where("bloodType", "==", bloodType)
          );
          const snapshot = await getDocs(q);
          const donors: User[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data() as StoredUser;
            const { hasPassword, ...safeUser } = data;
            donors.push({ ...safeUser, id: doc.id });
          });
          return donors;
        }
      } catch (e) {
        logger.error("Query donors error:", e);
      }
    }

// Demo mode fallback - only available in development
    if (import.meta.env.DEV) {
      try {
        const stored = localStorage.getItem("crimsoncare_users");
        if (stored) {
          const users = JSON.parse(stored);
          return users
            .filter((u: any) => u.role === "donor" && u.bloodType === bloodType)
            .map(({ passwordHash, hasPassword, ...u }: any) => u);
        }
      } catch (e) {
        logger.error("Local storage error:", e);
      }
    }
    
    return [];
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading,
      isAuthenticated: !!user,
      login, 
      register, 
      logout, 
      updateUser, 
      updateDonorStats,
      getDonorsByBloodType,
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

// Safe version that returns null if outside AuthProvider (for public components)
export const useAuthSafe = () => {
  const context = useContext(AuthContext);
  return context ?? null;
};
