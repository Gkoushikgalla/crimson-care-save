import { createContext, useContext, useState, ReactNode, useEffect, useRef } from "react";
import { isFirebaseConfigured, getFirebaseDb } from "@/lib/firebase";
import { sosRequestSchema, safeValidate } from "@/lib/validation";
import { getAll, put, putMany, remove, isIndexedDBAvailable, STORE_NAMES } from "@/lib/indexedDB";
import { toast } from "sonner";

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
  checkBloodTypeMatch: (donorBloodType: string, requestBloodType: string) => boolean;
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
      if (requests.length > 0) {
        // Filter out dummy/test data
        const realRequests = requests.filter(req => {
          const isDummy = 
            req.patientName?.toLowerCase().includes("test") ||
            req.patientName?.toLowerCase().includes("dummy") ||
            req.hospitalName?.toLowerCase().includes("test") ||
            req.hospitalName?.toLowerCase().includes("dummy") ||
            req.createdBy === "system" ||
            req.createdBy === "admin";
          return !isDummy;
        });
        return realRequests;
      }
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

// Blood type compatibility checker
const checkBloodTypeMatch = (donorBloodType: string, requestBloodType: string): boolean => {
  if (!donorBloodType) return false;
  
  // Universal donor (O-) can donate to everyone
  if (donorBloodType === "O-") return true;
  
  // O+ can donate to all positive types
  if (donorBloodType === "O+") {
    return requestBloodType.includes("+");
  }
  
  // A- can donate to A-, A+, AB-, AB+
  if (donorBloodType === "A-") {
    return requestBloodType.startsWith("A") || requestBloodType.startsWith("AB");
  }
  
  // A+ can donate to A+, AB+
  if (donorBloodType === "A+") {
    return requestBloodType === "A+" || requestBloodType === "AB+";
  }
  
  // B- can donate to B-, B+, AB-, AB+
  if (donorBloodType === "B-") {
    return requestBloodType.startsWith("B") || requestBloodType.startsWith("AB");
  }
  
  // B+ can donate to B+, AB+
  if (donorBloodType === "B+") {
    return requestBloodType === "B+" || requestBloodType === "AB+";
  }
  
  // AB- can donate to AB-, AB+
  if (donorBloodType === "AB-") {
    return requestBloodType.startsWith("AB");
  }
  
  // AB+ can only donate to AB+
  if (donorBloodType === "AB+") {
    return requestBloodType === "AB+";
  }
  
  return false;
};

export const SOSProvider = ({ children }: { children: ReactNode }) => {
  const [requests, setRequests] = useState<SOSRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const previousRequestIdsRef = useRef<Set<string>>(new Set());
  const userBloodTypeRef = useRef<string | null>(null);

  useEffect(() => {
    const initFirestore = async () => {
      // Clear any dummy/static data from localStorage on first load
      try {
        const stored = localStorage.getItem("crimsoncare_sos_requests");
        if (stored) {
          const requests = JSON.parse(stored) as SOSRequest[];
          // Filter out any dummy/test data (you can customize this filter)
          const realRequests = requests.filter(req => {
            // Remove requests with obvious dummy data patterns
            const isDummy = 
              req.patientName.toLowerCase().includes("test") ||
              req.patientName.toLowerCase().includes("dummy") ||
              req.hospitalName.toLowerCase().includes("test") ||
              req.hospitalName.toLowerCase().includes("dummy") ||
              req.createdBy === "system" ||
              req.createdBy === "admin";
            return !isDummy;
          });
          
          if (realRequests.length !== requests.length) {
            console.log(`Removed ${requests.length - realRequests.length} dummy SOS requests`);
            localStorage.setItem("crimsoncare_sos_requests", JSON.stringify(realRequests));
          }
        }
      } catch (e) {
        console.error("Error cleaning dummy data:", e);
      }

      if (!isFirebaseConfigured) {
        const storedRequests = await getStoredRequests();
        const activeRequests = storedRequests.filter(r => r.status === "searching" || r.status === "in_progress");
        previousRequestIdsRef.current = new Set(storedRequests.map(r => r.id));
        setRequests(storedRequests);
        setIsLoading(false);
        console.log(`[SOSContext] Loaded ${storedRequests.length} SOS requests from local storage (${activeRequests.length} active)`);
        return;
      }

      try {
        const db = await getFirebaseDb();
        if (!db) {
          const storedRequests = await getStoredRequests();
          const activeRequests = storedRequests.filter(r => r.status === "searching" || r.status === "in_progress");
          previousRequestIdsRef.current = new Set(storedRequests.map(r => r.id));
          setRequests(storedRequests);
          setIsLoading(false);
          console.log(`[SOSContext] Loaded ${storedRequests.length} SOS requests from local storage (${activeRequests.length} active)`);
          return;
        }

        const { collection, query, orderBy, onSnapshot } = await import("firebase/firestore");
        // Query all SOS requests ordered by creation date (newest first)
        // This ensures all users see new alerts in real-time
        const q = query(collection(db, "sosRequests"), orderBy("createdAt", "desc"));
        
        console.log("Setting up real-time SOS alerts listener - all users will see new alerts");
        
        unsubscribeRef.current = onSnapshot(
          q,
          async (snapshot) => {
            const data: SOSRequest[] = [];
            snapshot.forEach((d) => {
              const request = { id: d.id, ...d.data() } as SOSRequest;
              data.push(request);
            });
            
            // Filter out dummy/test data
            const realData = data.filter(req => {
              const isDummy = 
                req.patientName.toLowerCase().includes("test") ||
                req.patientName.toLowerCase().includes("dummy") ||
                req.hospitalName.toLowerCase().includes("test") ||
                req.hospitalName.toLowerCase().includes("dummy") ||
                req.createdBy === "system" ||
                req.createdBy === "admin";
              return !isDummy;
            });
            
            // Detect new requests (for urgency-based notifications)
            const currentRequestIds = new Set(realData.map(r => r.id));
            const previousIds = previousRequestIdsRef.current;
            const newRequests = realData.filter(req => 
              !previousIds.has(req.id) && 
              (req.status === "searching" || req.status === "in_progress")
            );
            
            // Store new request IDs for next comparison
            previousRequestIdsRef.current = currentRequestIds;
            
            setRequests(realData);
            await saveRequests(realData);
            setIsLoading(false);
            
            // Log when new alerts are detected
            const activeCount = realData.filter(r => r.status === "searching" || r.status === "in_progress").length;
            console.log(`[SOSContext] Loaded ${realData.length} total SOS requests (${activeCount} active) - visible to all users`);
            if (newRequests.length > 0) {
              console.log(`[SOSContext] ${newRequests.length} new SOS request(s) detected`);
              // Emit custom event for urgency-based alerts (handled by LocationPermissionHandler)
              window.dispatchEvent(new CustomEvent('newSOSRequests', { detail: newRequests }));
            }
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
    // Validate input data - ensure all required fields are present
    const validationData = {
      patientName: requestData.patientName?.trim() || "",
      bloodType: requestData.bloodType,
      units: requestData.units,
      urgency: requestData.urgency,
      notes: requestData.notes || "",
      hospitalName: requestData.hospitalName?.trim() || "",
      hospitalAddress: requestData.hospitalAddress?.trim() || "",
      contactPhone: requestData.contactPhone?.trim() || "",
      contactEmail: requestData.contactEmail?.trim() || "",
    };

    const validation = safeValidate(sosRequestSchema, validationData);
    if (!validation.success) {
      throw new Error((validation as { success: false; errors: string[] }).errors[0]);
    }

    const id = crypto.randomUUID?.() || Math.random().toString(36).slice(2);
    const newRequest: SOSRequest = {
      ...requestData,
      // Sanitize string inputs
      patientName: (requestData.patientName || "").trim().slice(0, 100),
      notes: (requestData.notes || "").trim().slice(0, 500),
      hospitalName: (requestData.hospitalName || "").trim().slice(0, 200),
      hospitalAddress: (requestData.hospitalAddress || "").trim().slice(0, 500),
      contactPhone: (requestData.contactPhone || "").trim().slice(0, 20),
      contactEmail: (requestData.contactEmail || "").trim().toLowerCase().slice(0, 255),
      id,
      createdAt: new Date().toISOString(),
      status: "searching",
      matchedDonors: 0, // Placeholder - can be updated when donors respond
      confirmedDonors: 0,
    };

    // Optimistically update local state so the UI never hangs,
    // even if the network or Firebase is slow/unavailable.
    setRequests((prev) => {
      const updated = [newRequest, ...prev];
      // Trigger alert event for new request (if active)
      if (newRequest.status === "searching" || newRequest.status === "in_progress") {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('newSOSRequests', { detail: [newRequest] }));
        }, 100);
      }
      return updated;
    });

    if (isFirebaseConfigured) {
      (async () => {
        try {
          const db = await getFirebaseDb();
          if (!db) return;

          const { doc, setDoc } = await import("firebase/firestore");
          await setDoc(doc(db, "sosRequests", id), newRequest);
          console.log("SOS request synced to Firestore");
        } catch (e) {
          console.error("Firebase write error (SOS request will still be visible locally):", e);
        }
      })();
    }

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
    <SOSContext.Provider value={{ 
      requests, 
      createRequest, 
      updateRequest, 
      deleteRequest, 
      getActiveRequests, 
      getRequestsByHospital, 
      isLoading,
      checkBloodTypeMatch 
    }}>
      {children}
    </SOSContext.Provider>
  );
};

export const useSOS = () => {
  const context = useContext(SOSContext);
  if (!context) throw new Error("useSOS must be used within an SOSProvider");
  return context;
};
