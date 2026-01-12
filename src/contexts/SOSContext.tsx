import { createContext, useContext, useState, ReactNode, useEffect } from "react";

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
  createdBy: string; // user ID
  source: "hospital" | "public"; // hospital dashboard or public emergency request
}

interface SOSContextType {
  requests: SOSRequest[];
  createRequest: (request: Omit<SOSRequest, "id" | "createdAt" | "matchedDonors" | "confirmedDonors" | "status">) => SOSRequest;
  updateRequest: (id: string, updates: Partial<SOSRequest>) => void;
  deleteRequest: (id: string) => void;
  getActiveRequests: () => SOSRequest[];
  getRequestsByHospital: (hospitalName: string) => SOSRequest[];
}

const SOSContext = createContext<SOSContextType | undefined>(undefined);

const getStoredRequests = (): SOSRequest[] => {
  const stored = localStorage.getItem("crimsoncare_sos_requests");
  return stored ? JSON.parse(stored) : [];
};

const saveRequests = (requests: SOSRequest[]) => {
  localStorage.setItem("crimsoncare_sos_requests", JSON.stringify(requests));
};

export const SOSProvider = ({ children }: { children: ReactNode }) => {
  const [requests, setRequests] = useState<SOSRequest[]>(() => getStoredRequests());

  // Sync to localStorage
  useEffect(() => {
    saveRequests(requests);
  }, [requests]);

  const createRequest = (
    requestData: Omit<SOSRequest, "id" | "createdAt" | "matchedDonors" | "confirmedDonors" | "status">
  ): SOSRequest => {
    const newRequest: SOSRequest = {
      ...requestData,
      id: crypto.randomUUID?.() || Math.random().toString(36).slice(2),
      createdAt: new Date().toISOString(),
      status: "searching",
      matchedDonors: Math.floor(Math.random() * 10) + 3, // Mock: 3-12 matched donors
      confirmedDonors: 0,
    };

    setRequests((prev) => [newRequest, ...prev]);
    return newRequest;
  };

  const updateRequest = (id: string, updates: Partial<SOSRequest>) => {
    setRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, ...updates } : req))
    );
  };

  const deleteRequest = (id: string) => {
    setRequests((prev) => prev.filter((req) => req.id !== id));
  };

  const getActiveRequests = () => {
    // Filter out fulfilled and cancelled requests - they should not show in active alerts
    return requests.filter((req) => req.status === "searching" || req.status === "in_progress");
  };

  const getRequestsByHospital = (hospitalName: string) => {
    return requests.filter((req) => req.hospitalName === hospitalName);
  };

  return (
    <SOSContext.Provider
      value={{
        requests,
        createRequest,
        updateRequest,
        deleteRequest,
        getActiveRequests,
        getRequestsByHospital,
      }}
    >
      {children}
    </SOSContext.Provider>
  );
};

export const useSOS = () => {
  const context = useContext(SOSContext);
  if (!context) {
    throw new Error("useSOS must be used within an SOSProvider");
  }
  return context;
};
