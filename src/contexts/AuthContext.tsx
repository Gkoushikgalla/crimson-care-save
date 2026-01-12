import { createContext, useContext, useState, ReactNode, useEffect, useRef } from "react";
import { isFirebaseConfigured, getFirebaseDb } from "@/lib/firebase";

export interface DonorStats {
  totalDonations: number;
  lastDonation: string | null;
  nextEligible: string | null;
  points: number;
  level: string;
  donationHistory: Array<{ id: string; date: string; location: string; units: number }>;
  badges: Array<{ name: string; icon: string; earned: boolean }>;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  role: "donor" | "hospital" | "bloodbank" | "admin";
  bloodType?: string;
  apaarId?: string;
  hospitalName?: string;
  bloodBankName?: string;
  licenseNumber?: string;
  createdAt: string;
  donorStats?: DonorStats;
}

interface AuthContextType {
  user: User | null;
  allUsers: User[];
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (user: Omit<User, "id" | "createdAt" | "donorStats">) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (data: Partial<User>) => Promise<void>;
  updateDonorStats: (stats: Partial<DonorStats>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getStoredUsers = (): User[] => {
  try {
    const stored = localStorage.getItem("crimsoncare_users");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveUsers = (users: User[]) => {
  localStorage.setItem("crimsoncare_users", JSON.stringify(users));
};

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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem("crimsoncare_current_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const initFirestore = async () => {
      if (!isFirebaseConfigured) {
        setAllUsers(getStoredUsers());
        return;
      }

      try {
        const db = await getFirebaseDb();
        if (!db) {
          setAllUsers(getStoredUsers());
          return;
        }

        const { collection, onSnapshot } = await import("firebase/firestore");
        
        unsubscribeRef.current = onSnapshot(
          collection(db, "users"),
          (snapshot) => {
            const users: User[] = [];
            snapshot.forEach((d) => users.push({ id: d.id, ...d.data() } as User));
            setAllUsers(users);
            saveUsers(users);
          },
          (error) => {
            console.error("Firestore error:", error);
            setAllUsers(getStoredUsers());
          }
        );
      } catch (error) {
        console.error("Firebase init error:", error);
        setAllUsers(getStoredUsers());
      }
    };

    initFirestore();
    return () => unsubscribeRef.current?.();
  }, []);

  // Update current user when allUsers changes
  useEffect(() => {
    if (user && allUsers.length > 0) {
      const updated = allUsers.find((u) => u.id === user.id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(user)) {
        setUser(updated);
      }
    }
  }, [allUsers, user?.id]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("crimsoncare_current_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("crimsoncare_current_user");
    }
  }, [user]);

  const register = async (userData: Omit<User, "id" | "createdAt" | "donorStats">) => {
    const users = allUsers.length > 0 ? allUsers : getStoredUsers();

    if (users.some((u) => u.email.toLowerCase() === userData.email.toLowerCase())) {
      return { success: false, error: "Email already registered. Please login instead." };
    }

    const newUser: User = {
      ...userData,
      id: crypto.randomUUID?.() || Math.random().toString(36).slice(2),
      createdAt: new Date().toISOString(),
      donorStats: userData.role === "donor" ? getInitialDonorStats() : undefined,
    };

    if (isFirebaseConfigured) {
      try {
        const db = await getFirebaseDb();
        if (db) {
          const { doc, setDoc } = await import("firebase/firestore");
          await setDoc(doc(db, "users", newUser.id), newUser);
          setUser(newUser);
          return { success: true };
        }
      } catch (e) {
        console.error("Firebase write error:", e);
      }
    }

    const updated = [...users, newUser];
    saveUsers(updated);
    setAllUsers(updated);
    setUser(newUser);
    return { success: true };
  };

  const login = async (email: string, password: string) => {
    const users = allUsers.length > 0 ? allUsers : getStoredUsers();
    const foundUser = users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

    if (!foundUser) return { success: false, error: "Invalid email or password" };

    setUser(foundUser);
    return { success: true };
  };

  const logout = () => setUser(null);

  const updateUser = async (data: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...data };

    if (isFirebaseConfigured) {
      try {
        const db = await getFirebaseDb();
        if (db) {
          const { doc, setDoc } = await import("firebase/firestore");
          await setDoc(doc(db, "users", user.id), updated);
        }
      } catch (e) {
        console.error("Firebase update error:", e);
      }
    }
    setUser(updated);
  };

  const updateDonorStats = async (stats: Partial<DonorStats>) => {
    if (!user?.donorStats) return;
    const updated = { ...user, donorStats: { ...user.donorStats, ...stats } };

    if (isFirebaseConfigured) {
      try {
        const db = await getFirebaseDb();
        if (db) {
          const { doc, setDoc } = await import("firebase/firestore");
          await setDoc(doc(db, "users", user.id), updated);
        }
      } catch (e) {
        console.error("Firebase update error:", e);
      }
    }
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, allUsers, login, register, logout, updateUser, updateDonorStats }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
