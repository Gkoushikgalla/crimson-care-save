import { createContext, useContext, useState, ReactNode, useEffect, useRef } from "react";
import { isFirebaseConfigured, getFirebaseDb } from "@/lib/firebase";
import { sosRequestSchema, safeValidate } from "@/lib/validation";
import { getAll, put, putMany, remove, isIndexedDBAvailable, STORE_NAMES } from "@/lib/indexedDB";

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

const getStoredRequestsFromLocalStorage = (): SOSRequest[] => {
  try {
    const stored = localStorage.getItem("crimsoncare_sos_requests");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveRequestsToLocalStorage = (requests: SOSRequest[]) => {
  localStorage.setItem("crimsoncare_sos_requests", JSON.stringify(requests));
};

const getStoredRequests = async (): Promise<SOSRequest[]> => {
  if (isIndexedDBAvailable()) {
    try {
      const requests = await getAll<SOSRequest>(STORE_NAMES.SOS_REQUESTS);
      if (requests.length > 0) return requests;
    } catch (e) {
      console.error("IndexedDB read error:", e);
    }
  }
  return getStoredRequestsFromLocalStorage();
};

const saveRequests = async (requests: SOSRequest[]) => {
  // Always save to localStorage as backup
  saveRequestsToLocalStorage(requests);
  
  if (isIndexedDBAvailable()) {
    try {
      await putMany(STORE_NAMES.SOS_REQUESTS, requests);
    } catch (e) {
      console.error("IndexedDB write error:", e);
    }
  }
};

export const SOSProvider = ({ children }: { children: ReactNode }) => {
  const [requests, setRequests] = useState<SOSRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const initFirestore = async () => {
      if (!isFirebaseConfigured) {
        const storedRequests = await getStoredRequests();
        setRequests(storedRequests);
        setIsLoading(false);
        return;
      }

      try {
        const db = await getFirebaseDb();
        if (!db) {
          const storedRequests = await getStoredRequests();
          setRequests(storedRequests);
          setIsLoading(false);
          return;
        }

        const { collection, query, orderBy, onSnapshot } = await import("firebase/firestore");
        const q = query(collection(db, "sosRequests"), orderBy("createdAt", "desc"));
        
        unsubscribeRef.current = onSnapshot(
          q,
          async (snapshot) => {
            const data: SOSRequest[] = [];
            snapshot.forEach((d) => data.push({ id: d.id, ...d.data() } as SOSRequest));
            setRequests(data);
            await saveRequests(data);
            setIsLoading(false);
          },
          async (error) => {
            console.error("Firestore error:", error);
            const storedRequests = await getStoredRequests();
            setRequests(storedRequests);
            setIsLoading(false);
          }
        );
      } catch (error) {
        console.error("Firebase init error:", error);
        const storedRequests = await getStoredRequests();
        setRequests(storedRequests);
        setIsLoading(false);
      }
    };

    initFirestore();
    return () => unsubscribeRef.current?.();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      saveRequests(requests);
    }
  }, [requests, isLoading]);

  const createRequest = async (
    requestData: Omit<SOSRequest, "id" | "createdAt" | "matchedDonors" | "confirmedDonors" | "status">
  ): Promise<SOSRequest> => {
    // Validate input data
    const validationData = {
      patientName: requestData.patientName,
      bloodType: requestData.bloodType,
      units: requestData.units,
      urgency: requestData.urgency,
      notes: requestData.notes || "",
      hospitalName: requestData.hospitalName,
      hospitalAddress: requestData.hospitalAddress || "",
      contactPhone: requestData.contactPhone,
      contactEmail: requestData.contactEmail,
    };

    const validation = safeValidate(sosRequestSchema, validationData);
    if (!validation.success) {
      throw new Error((validation as { success: false; errors: string[] }).errors[0]);
    }

    const id = crypto.randomUUID?.() || Math.random().toString(36).slice(2);
    const newRequest: SOSRequest = {
      ...requestData,
      // Sanitize string inputs
      patientName: requestData.patientName.trim().slice(0, 100),
      notes: (requestData.notes || "").trim().slice(0, 500),
      hospitalName: requestData.hospitalName.trim().slice(0, 200),
      hospitalAddress: (requestData.hospitalAddress || "").trim().slice(0, 500),
      contactPhone: requestData.contactPhone.trim().slice(0, 20),
      contactEmail: requestData.contactEmail.trim().toLowerCase().slice(0, 255),
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
        throw new Error("Failed to create SOS request. Please try again.");
      }
    }
    
    setRequests((prev) => [newRequest, ...prev]);
    return newRequest;
  };

  const updateRequest = async (id: string, updates: Partial<SOSRequest>) => {
    const existing = requests.find((r) => r.id === id);
    if (!existing) return;

    // Prevent modification of critical fields
    const { id: _, createdAt: __, createdBy: ___, ...allowedUpdates } = updates;

    if (isFirebaseConfigured) {
      try {
        const db = await getFirebaseDb();
        if (db) {
          const { doc, updateDoc } = await import("firebase/firestore");
          await updateDoc(doc(db, "sosRequests", id), allowedUpdates);
          return;
        }
      } catch (e) {
        console.error("Firebase update error:", e);
      }
    }
    
    setRequests((prev) => prev.map((req) => (req.id === id ? { ...req, ...allowedUpdates } : req)));
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
