import { createContext, useContext, useState, ReactNode, useEffect, useRef } from "react";
import { isFirebaseConfigured, getFirebaseDb } from "@/lib/firebase";

export interface BloodInventoryItem {
  type: string;
  units: number;
  maxCapacity: number;
  status: "critical" | "low" | "good";
}

export interface BloodDrive {
  id: string;
  date: string;
  venue: string;
  description: string;
  createdAt: string;
}

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] as const;
const DEFAULT_MAX: Record<string, number> = {
  "A+": 100, "A-": 50, "B+": 80, "B-": 40,
  "O+": 120, "O-": 60, "AB+": 50, "AB-": 30,
};

function getStatus(units: number, maxCapacity: number): "critical" | "low" | "good" {
  const pct = maxCapacity > 0 ? (units / maxCapacity) * 100 : 0;
  if (pct <= 10) return "critical";
  if (pct <= 30) return "low";
  return "good";
}

interface BloodBankContextType {
  inventory: BloodInventoryItem[];
  drives: BloodDrive[];
  isLoading: boolean;
  addUnits: (bloodType: string, units: number) => Promise<void>;
  removeUnits: (bloodType: string, units: number) => Promise<void>;
  setInventoryUnits: (bloodType: string, units: number) => Promise<void>;
  addDrive: (drive: Omit<BloodDrive, "id" | "createdAt">) => Promise<void>;
  removeDrive: (id: string) => Promise<void>;
}

const defaultInventory: BloodInventoryItem[] = BLOOD_TYPES.map((type) => ({
  type,
  units: 0,
  maxCapacity: DEFAULT_MAX[type] ?? 100,
  status: "low",
}));

const BloodBankContext = createContext<BloodBankContextType | undefined>(undefined);

const STORAGE_KEY_INVENTORY = "crimsoncare_bloodbank_inventory";
const STORAGE_KEY_DRIVES = "crimsoncare_bloodbank_drives";

function loadInventoryFromStorage(userId: string): BloodInventoryItem[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_INVENTORY}_${userId}`);
    if (!raw) return defaultInventory;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((p: any) => ({
        type: p.type,
        units: Number(p.units) || 0,
        maxCapacity: Number(p.maxCapacity) || DEFAULT_MAX[p.type] || 100,
        status: getStatus(Number(p.units) || 0, Number(p.maxCapacity) || 100),
      }));
    }
  } catch (_) {}
  return defaultInventory;
}

function loadDrivesFromStorage(userId: string): BloodDrive[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_DRIVES}_${userId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {}
  return [];
}

function saveInventoryToStorage(userId: string, inventory: BloodInventoryItem[]) {
  localStorage.setItem(`${STORAGE_KEY_INVENTORY}_${userId}`, JSON.stringify(inventory));
}

function saveDrivesToStorage(userId: string, drives: BloodDrive[]) {
  localStorage.setItem(`${STORAGE_KEY_DRIVES}_${userId}`, JSON.stringify(drives));
}

export const BloodBankProvider = ({ children, userId }: { children: ReactNode; userId: string | null }) => {
  const [inventory, setInventoryState] = useState<BloodInventoryItem[]>(defaultInventory);
  const [drives, setDrivesState] = useState<BloodDrive[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const unsubscribeDrivesRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!userId) {
      setInventoryState(defaultInventory);
      setDrivesState([]);
      setIsLoading(false);
      return;
    }

    const init = async () => {
      if (isFirebaseConfigured) {
        try {
          const db = await getFirebaseDb();
          if (db) {
            const { doc, onSnapshot, getDoc, setDoc } = await import("firebase/firestore");
            const bloodBankRef = doc(db, "bloodBanks", userId);

            const syncFromDoc = (data: any) => {
              if (data?.inventory && Array.isArray(data.inventory)) {
                const inv: BloodInventoryItem[] = data.inventory.map((p: any) => ({
                  type: p.type,
                  units: Number(p.units) || 0,
                  maxCapacity: Number(p.maxCapacity) || DEFAULT_MAX[p.type] || 100,
                  status: getStatus(Number(p.units) || 0, Number(p.maxCapacity) || 100),
                }));
                setInventoryState(inv.length ? inv : defaultInventory);
                saveInventoryToStorage(userId, inv.length ? inv : defaultInventory);
              }
              if (data?.drives && Array.isArray(data.drives)) {
                setDrivesState(data.drives);
                saveDrivesToStorage(userId, data.drives);
              }
            };

            unsubscribeRef.current = onSnapshot(
              bloodBankRef,
              (snap) => {
                if (snap.exists()) {
                  syncFromDoc(snap.data());
                } else {
                  setInventoryState(loadInventoryFromStorage(userId));
                  setDrivesState(loadDrivesFromStorage(userId));
                }
                setIsLoading(false);
              },
              () => {
                setInventoryState(loadInventoryFromStorage(userId));
                setDrivesState(loadDrivesFromStorage(userId));
                setIsLoading(false);
              }
            );
            return;
          }
        } catch (e) {
          console.error("BloodBank Firestore init:", e);
        }
      }

      setInventoryState(loadInventoryFromStorage(userId));
      setDrivesState(loadDrivesFromStorage(userId));
      setIsLoading(false);
    };

    init();
    return () => {
      unsubscribeRef.current?.();
      unsubscribeDrivesRef.current?.();
    };
  }, [userId]);

  const persistInventory = async (nextInventory: BloodInventoryItem[]) => {
    if (!userId) return;
    setInventoryState(nextInventory);
    saveInventoryToStorage(userId, nextInventory);
    if (isFirebaseConfigured) {
      try {
        const db = await getFirebaseDb();
        if (db) {
          const { doc, setDoc } = await import("firebase/firestore");
          const ref = doc(db, "bloodBanks", userId);
          // Use merge so we only update the inventory field and avoid
          // clobbering concurrent updates to other fields (like drives).
          await setDoc(
            ref,
            {
              inventory: nextInventory,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        }
      } catch (e) {
        console.error("Persist inventory error:", e);
      }
    }
  };

  const persistDrives = async (nextDrives: BloodDrive[]) => {
    if (!userId) return;
    setDrivesState(nextDrives);
    saveDrivesToStorage(userId, nextDrives);
    if (isFirebaseConfigured) {
      try {
        const db = await getFirebaseDb();
        if (db) {
          const { doc, setDoc } = await import("firebase/firestore");
          const ref = doc(db, "bloodBanks", userId);
          // Use merge so we only update the drives field and avoid
          // clobbering concurrent updates to other fields (like inventory).
          await setDoc(
            ref,
            {
              drives: nextDrives,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        }
      } catch (e) {
        console.error("Persist drives error:", e);
      }
    }
  };

  const addUnits = async (bloodType: string, units: number) => {
    if (units <= 0) return;
    const next = inventory.map((item) =>
      item.type === bloodType
        ? {
            ...item,
            units: Math.min(item.units + units, item.maxCapacity),
            status: getStatus(Math.min(item.units + units, item.maxCapacity), item.maxCapacity),
          }
        : item
    );
    await persistInventory(next);
  };

  const removeUnits = async (bloodType: string, units: number) => {
    if (units <= 0) return;
    const next = inventory.map((item) =>
      item.type === bloodType
        ? {
            ...item,
            units: Math.max(0, item.units - units),
            status: getStatus(Math.max(0, item.units - units), item.maxCapacity),
          }
        : item
    );
    await persistInventory(next);
  };

  const setInventoryUnits = async (bloodType: string, units: number) => {
    const next = inventory.map((item) =>
      item.type === bloodType
        ? {
            ...item,
            units: Math.max(0, Math.min(units, item.maxCapacity)),
            status: getStatus(Math.max(0, Math.min(units, item.maxCapacity)), item.maxCapacity),
          }
        : item
    );
    await persistInventory(next);
  };

  const addDrive = async (drive: Omit<BloodDrive, "id" | "createdAt">) => {
    const id = crypto.randomUUID?.() || Math.random().toString(36).slice(2);
    const newDrive: BloodDrive = { ...drive, id, createdAt: new Date().toISOString() };
    const next = [newDrive, ...drives];
    await persistDrives(next);
  };

  const removeDrive = async (id: string) => {
    const next = drives.filter((d) => d.id !== id);
    await persistDrives(next);
  };

  return (
    <BloodBankContext.Provider
      value={{
        inventory,
        drives,
        isLoading,
        addUnits,
        removeUnits,
        setInventoryUnits,
        addDrive,
        removeDrive,
      }}
    >
      {children}
    </BloodBankContext.Provider>
  );
};

export const useBloodBank = () => {
  const ctx = useContext(BloodBankContext);
  if (!ctx) throw new Error("useBloodBank must be used within BloodBankProvider");
  return ctx;
};
