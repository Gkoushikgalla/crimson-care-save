import { createContext, useContext, useState, ReactNode, useEffect } from "react";

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
  password: string; // For mock auth matching
  role: "donor" | "hospital" | "bloodbank" | "admin";
  bloodType?: string;
  hospitalName?: string;
  bloodBankName?: string;
  licenseNumber?: string;
  createdAt: string;
  donorStats?: DonorStats;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => { success: boolean; error?: string };
  register: (user: Omit<User, "id" | "createdAt" | "donorStats">) => { success: boolean; error?: string };
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  updateDonorStats: (stats: Partial<DonorStats>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Get all registered users from localStorage
const getStoredUsers = (): User[] => {
  const stored = localStorage.getItem("crimsoncare_users");
  return stored ? JSON.parse(stored) : [];
};

// Save users to localStorage
const saveUsers = (users: User[]) => {
  localStorage.setItem("crimsoncare_users", JSON.stringify(users));
};

// Get initial donor stats for new users
const getInitialDonorStats = (): DonorStats => ({
  totalDonations: 0,
  lastDonation: null,
  nextEligible: new Date().toISOString().split("T")[0], // Eligible immediately
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
    const saved = localStorage.getItem("crimsoncare_current_user");
    return saved ? JSON.parse(saved) : null;
  });

  // Sync current user to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem("crimsoncare_current_user", JSON.stringify(user));
      // Also update in users array
      const users = getStoredUsers();
      const idx = users.findIndex((u) => u.id === user.id);
      if (idx !== -1) {
        users[idx] = user;
        saveUsers(users);
      }
    } else {
      localStorage.removeItem("crimsoncare_current_user");
    }
  }, [user]);

  const register = (userData: Omit<User, "id" | "createdAt" | "donorStats">) => {
    const users = getStoredUsers();
    
    // Check if email already exists
    if (users.some((u) => u.email.toLowerCase() === userData.email.toLowerCase())) {
      return { success: false, error: "Email already registered. Please login instead." };
    }

    const newUser: User = {
      ...userData,
      id: crypto.randomUUID?.() || Math.random().toString(36).slice(2),
      createdAt: new Date().toISOString(),
      donorStats: userData.role === "donor" ? getInitialDonorStats() : undefined,
    };

    users.push(newUser);
    saveUsers(users);
    setUser(newUser);
    
    return { success: true };
  };

  const login = (email: string, password: string) => {
    const users = getStoredUsers();
    const foundUser = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (!foundUser) {
      return { success: false, error: "Invalid email or password" };
    }

    setUser(foundUser);
    return { success: true };
  };

  const logout = () => {
    setUser(null);
  };

  const updateUser = (data: Partial<User>) => {
    if (user) {
      const updated = { ...user, ...data };
      setUser(updated);
    }
  };

  const updateDonorStats = (stats: Partial<DonorStats>) => {
    if (user && user.donorStats) {
      const updated = {
        ...user,
        donorStats: { ...user.donorStats, ...stats },
      };
      setUser(updated);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser, updateDonorStats }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
