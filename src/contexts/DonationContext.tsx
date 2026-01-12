import { createContext, useContext, useState, ReactNode, useEffect } from "react";

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
  createDonation: (donation: Omit<Donation, "id" | "donatedAt" | "status">) => Donation;
  completeDonation: (id: string) => void;
  cancelDonation: (id: string) => void;
  getDonationsByDonor: (donorId: string) => Donation[];
  getDonationsByHospital: (hospitalName: string) => Donation[];
  getDonationsByBloodBank: (bloodBankName: string) => Donation[];
  getDonationsBySOS: (sosRequestId: string) => Donation[];
  getCompletedDonations: () => Donation[];
}

const DonationContext = createContext<DonationContextType | undefined>(undefined);

const getStoredDonations = (): Donation[] => {
  const stored = localStorage.getItem("crimsoncare_donations");
  return stored ? JSON.parse(stored) : [];
};

const saveDonations = (donations: Donation[]) => {
  localStorage.setItem("crimsoncare_donations", JSON.stringify(donations));
};

export const DonationProvider = ({ children }: { children: ReactNode }) => {
  const [donations, setDonations] = useState<Donation[]>(() => getStoredDonations());

  useEffect(() => {
    saveDonations(donations);
  }, [donations]);

  const createDonation = (
    donationData: Omit<Donation, "id" | "donatedAt" | "status">
  ): Donation => {
    const newDonation: Donation = {
      ...donationData,
      id: crypto.randomUUID?.() || Math.random().toString(36).slice(2),
      donatedAt: new Date().toISOString(),
      status: "pending",
    };

    setDonations((prev) => [newDonation, ...prev]);
    return newDonation;
  };

  const completeDonation = (id: string) => {
    setDonations((prev) =>
      prev.map((d) =>
        d.id === id
          ? { ...d, status: "completed" as const, completedAt: new Date().toISOString() }
          : d
      )
    );
  };

  const cancelDonation = (id: string) => {
    setDonations((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: "cancelled" as const } : d))
    );
  };

  const getDonationsByDonor = (donorId: string) => {
    return donations.filter((d) => d.donorId === donorId);
  };

  const getDonationsByHospital = (hospitalName: string) => {
    return donations.filter((d) => d.hospitalName === hospitalName);
  };

  const getDonationsByBloodBank = (bloodBankName: string) => {
    return donations.filter((d) => d.bloodBankName === bloodBankName);
  };

  const getDonationsBySOS = (sosRequestId: string) => {
    return donations.filter((d) => d.sosRequestId === sosRequestId);
  };

  const getCompletedDonations = () => {
    return donations.filter((d) => d.status === "completed");
  };

  return (
    <DonationContext.Provider
      value={{
        donations,
        createDonation,
        completeDonation,
        cancelDonation,
        getDonationsByDonor,
        getDonationsByHospital,
        getDonationsByBloodBank,
        getDonationsBySOS,
        getCompletedDonations,
      }}
    >
      {children}
    </DonationContext.Provider>
  );
};

export const useDonation = () => {
  const context = useContext(DonationContext);
  if (!context) {
    throw new Error("useDonation must be used within a DonationProvider");
  }
  return context;
};
