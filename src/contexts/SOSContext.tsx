import { createContext, useContext, useState, ReactNode, useEffect, useRef } from "react";
import { isFirebaseConfigured, getFirebaseDb } from "@/lib/firebase";

export interface SOSRequest {
  id: string;
  patientName: string;
  bloodType: string;
  units: number;
  urgency: "critical" | "high" | "moderate";
  notes: string;
  hospitalName: string;
  hospitalAddress: string;
  contactPhone: string;
  contactEmail: string;
  status: "searching" | "in_progress" | "fulfilled" | "cancelled";
  matchedDonors: number;
  confirmedDonors: number;
  createdAt: string;
  createdBy: string;
  source: "hospital" | "public";
}

interface SOSContextType {
  requests: SOSRequest[];
  createRequest: (request: Omit<SOSRequest, "id" | "createdAt" | "matchedDonors" | "confirmedDonors" | "status">) => Promise<SOSRequest>;
  updateRequest: (id: string, updates: Partial<SOSRequest>) => Promise<void>;
  deleteRequest: (id: string) => Promise<void>;
  getActiveRequests: () => SOSRequest[];
  getRequestsByHospital: (hospitalName: string) => SOSRequest[];
  isLoading: boolean;
}

const SOSContext = createContext<SOSContextType | undefined>(undefined);

const getStoredRequests = (): SOSRequest[] => {
  try {
    const stored = localStorage.getItem("crimsoncare_sos_requests");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveRequests = (requests: SOSRequest[]) => {
  localStorage.setItem("crimsoncare_sos_requests", JSON.stringify(requests));
};

export const SOSProvider = ({ children }: { children: ReactNode }) => {
  const [requests, setRequests] = useState<SOSRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const initFirestore = async () => {
      if (!isFirebaseConfigured) {
        setRequests(getStoredRequests());
        setIsLoading(false);
        return;
      }

      try {
        const db = await getFirebaseDb();
        if (!db) {
          setRequests(getStoredRequests());
          setIsLoading(false);
          return;
        }

        const { collection, query, orderBy, onSnapshot } = await import("firebase/firestore");
        const q = query(collection(db, "sosRequests"), orderBy("createdAt", "desc"));
        
        unsubscribeRef.current = onSnapshot(
          q,
          (snapshot) => {
            const data: SOSRequest[] = [];
            snapshot.forEach((d) => data.push({ id: d.id, ...d.data() } as SOSRequest));
            setRequests(data);
            saveRequests(data);
            setIsLoading(false);
          },
          (error) => {
            console.error("Firestore error:", error);
            setRequests(getStoredRequests());
            setIsLoading(false);
          }
        );
      } catch (error) {
        console.error("Firebase init error:", error);
        setRequests(getStoredRequests());
        setIsLoading(false);
      }
    };

    initFirestore();
    return () => unsubscribeRef.current?.();
  }, []);

  useEffect(() => {
    if (!isLoading) saveRequests(requests);
  }, [requests, isLoading]);

  const createRequest = async (
    requestData: Omit<SOSRequest, "id" | "createdAt" | "matchedDonors" | "confirmedDonors" | "status">
  ): Promise<SOSRequest> => {
    const id = crypto.randomUUID?.() || Math.random().toString(36).slice(2);
    const newRequest: SOSRequest = {
      ...requestData,
      id,
      createdAt: new Date().toISOString(),
      status: "searching",
      matchedDonors: Math.floor(Math.random() * 10) + 3,
      confirmedDonors: 0,
    };

    if (isFirebaseConfigured) {
      try {
        const db = await getFirebaseDb();
        if (db) {
          const { doc, setDoc } = await import("firebase/firestore");
          await setDoc(doc(db, "sosRequests", id), newRequest);
          return newRequest;
        }
      } catch (e) {
        console.error("Firebase write error:", e);
      }
    }
    
    setRequests((prev) => [newRequest, ...prev]);
    return newRequest;
  };

  const updateRequest = async (id: string, updates: Partial<SOSRequest>) => {
    const existing = requests.find((r) => r.id === id);
    if (!existing) return;

    if (isFirebaseConfigured) {
      try {
        const db = await getFirebaseDb();
        if (db) {
          const { doc, setDoc } = await import("firebase/firestore");
          await setDoc(doc(db, "sosRequests", id), { ...existing, ...updates });
          return;
        }
      } catch (e) {
        console.error("Firebase update error:", e);
      }
    }
    
    setRequests((prev) => prev.map((req) => (req.id === id ? { ...req, ...updates } : req)));
  };

  const deleteRequest = async (id: string) => {
    if (isFirebaseConfigured) {
      try {
        const db = await getFirebaseDb();
        if (db) {
          const { doc, deleteDoc } = await import("firebase/firestore");
          await deleteDoc(doc(db, "sosRequests", id));
          return;
        }
      } catch (e) {
        console.error("Firebase delete error:", e);
      }
    }
    
    setRequests((prev) => prev.filter((req) => req.id !== id));
  };

  const getActiveRequests = () => requests.filter((req) => req.status === "searching" || req.status === "in_progress");
  const getRequestsByHospital = (hospitalName: string) => requests.filter((req) => req.hospitalName === hospitalName);

  return (
    <SOSContext.Provider value={{ requests, createRequest, updateRequest, deleteRequest, getActiveRequests, getRequestsByHospital, isLoading }}>
      {children}
    </SOSContext.Provider>
  );
};

export const useSOS = () => {
  const context = useContext(SOSContext);
  if (!context) throw new Error("useSOS must be used within an SOSProvider");
  return context;
};
