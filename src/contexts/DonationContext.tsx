import { createContext, useContext, useState, ReactNode, useEffect, useRef } from "react";
import { isFirebaseConfigured, getFirebaseDb } from "@/lib/firebase";

export interface Donation {
  id: string;
  sosRequestId: string;
  donorId: string;
  donorName: string;
  donorPhone: string;
  bloodType: string;
  units: number;
  hospitalName: string;
  bloodBankName?: string;
  patientName: string;
  status: "pending" | "completed" | "cancelled";
  donatedAt: string;
  completedAt?: string;
}

interface DonationContextType {
  donations: Donation[];
  createDonation: (donation: Omit<Donation, "id" | "donatedAt" | "status">) => Promise<Donation>;
  completeDonation: (id: string, onComplete?: (donation: Donation) => void) => Promise<void>;
  cancelDonation: (id: string) => Promise<void>;
  getDonationsByDonor: (donorId: string) => Donation[];
  getDonationsByHospital: (hospitalName: string) => Donation[];
  getDonationsByBloodBank: (bloodBankName: string) => Donation[];
  getDonationsBySOS: (sosRequestId: string) => Donation[];
  getCompletedDonations: () => Donation[];
  getCompletedDonationsByDonor: (donorId: string) => Donation[];
  isLoading: boolean;
}

const DonationContext = createContext<DonationContextType | undefined>(undefined);

const getStoredDonations = (): Donation[] => {
  try {
    const stored = localStorage.getItem("crimsoncare_donations");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveDonations = (donations: Donation[]) => {
  localStorage.setItem("crimsoncare_donations", JSON.stringify(donations));
};

export const DonationProvider = ({ children }: { children: ReactNode }) => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const initFirestore = async () => {
      if (!isFirebaseConfigured) {
        setDonations(getStoredDonations());
        setIsLoading(false);
        return;
      }

      try {
        const db = await getFirebaseDb();
        if (!db) {
          setDonations(getStoredDonations());
          setIsLoading(false);
          return;
        }

        const { collection, query, orderBy, onSnapshot } = await import("firebase/firestore");
        const q = query(collection(db, "donations"), orderBy("donatedAt", "desc"));
        
        unsubscribeRef.current = onSnapshot(
          q,
          (snapshot) => {
            const data: Donation[] = [];
            snapshot.forEach((d) => data.push({ id: d.id, ...d.data() } as Donation));
            setDonations(data);
            saveDonations(data);
            setIsLoading(false);
          },
          (error) => {
            console.error("Firestore error:", error);
            setDonations(getStoredDonations());
            setIsLoading(false);
          }
        );
      } catch (error) {
        console.error("Firebase init error:", error);
        setDonations(getStoredDonations());
        setIsLoading(false);
      }
    };

    initFirestore();
    return () => unsubscribeRef.current?.();
  }, []);

  useEffect(() => {
    if (!isLoading) saveDonations(donations);
  }, [donations, isLoading]);

  const createDonation = async (donationData: Omit<Donation, "id" | "donatedAt" | "status">): Promise<Donation> => {
    const id = crypto.randomUUID?.() || Math.random().toString(36).slice(2);
    const newDonation: Donation = { ...donationData, id, donatedAt: new Date().toISOString(), status: "pending" };

    if (isFirebaseConfigured) {
      try {
        const db = await getFirebaseDb();
        if (db) {
          const { doc, setDoc } = await import("firebase/firestore");
          await setDoc(doc(db, "donations", id), newDonation);
          return newDonation;
        }
      } catch (e) {
        console.error("Firebase write error:", e);
      }
    }
    
    setDonations((prev) => [newDonation, ...prev]);
    return newDonation;
  };

  const completeDonation = async (id: string, onComplete?: (donation: Donation) => void) => {
    const existing = donations.find((d) => d.id === id);
    if (!existing) return;

    const updated: Donation = { ...existing, status: "completed", completedAt: new Date().toISOString() };

    if (isFirebaseConfigured) {
      try {
        const db = await getFirebaseDb();
        if (db) {
          const { doc, setDoc } = await import("firebase/firestore");
          await setDoc(doc(db, "donations", id), updated);
          if (onComplete) setTimeout(() => onComplete(updated), 0);
          return;
        }
      } catch (e) {
        console.error("Firebase update error:", e);
      }
    }
    
    setDonations((prev) => prev.map((d) => (d.id === id ? updated : d)));
    if (onComplete) setTimeout(() => onComplete(updated), 0);
  };

  const cancelDonation = async (id: string) => {
    const existing = donations.find((d) => d.id === id);
    if (!existing) return;

    if (isFirebaseConfigured) {
      try {
        const db = await getFirebaseDb();
        if (db) {
          const { doc, setDoc } = await import("firebase/firestore");
          await setDoc(doc(db, "donations", id), { ...existing, status: "cancelled" });
          return;
        }
      } catch (e) {
        console.error("Firebase update error:", e);
      }
    }
    
    setDonations((prev) => prev.map((d) => (d.id === id ? { ...d, status: "cancelled" as const } : d)));
  };

  const getDonationsByDonor = (donorId: string) => donations.filter((d) => d.donorId === donorId);
  const getDonationsByHospital = (hospitalName: string) => donations.filter((d) => d.hospitalName === hospitalName);
  const getDonationsByBloodBank = (bloodBankName: string) => donations.filter((d) => d.bloodBankName === bloodBankName);
  const getDonationsBySOS = (sosRequestId: string) => donations.filter((d) => d.sosRequestId === sosRequestId);
  const getCompletedDonations = () => donations.filter((d) => d.status === "completed");
  const getCompletedDonationsByDonor = (donorId: string) => donations.filter((d) => d.donorId === donorId && d.status === "completed");

  return (
    <DonationContext.Provider
      value={{ donations, createDonation, completeDonation, cancelDonation, getDonationsByDonor, getDonationsByHospital, getDonationsByBloodBank, getDonationsBySOS, getCompletedDonations, getCompletedDonationsByDonor, isLoading }}
    >
      {children}
    </DonationContext.Provider>
  );
};

export const useDonation = () => {
  const context = useContext(DonationContext);
  if (!context) throw new Error("useDonation must be used within a DonationProvider");
  return context;
};
