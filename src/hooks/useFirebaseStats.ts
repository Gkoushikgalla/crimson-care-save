import { useState, useEffect } from "react";
import { getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase";

interface Stats {
  registeredDonors: number;
  successfulDonations: number;
  avgResponseTime: string;
  loading: boolean;
}

export const useFirebaseStats = (): Stats => {
  const [stats, setStats] = useState<Stats>({
    registeredDonors: 0,
    successfulDonations: 0,
    avgResponseTime: "—",
    loading: true,
  });

  useEffect(() => {
    const fetchStats = async () => {
      if (!isFirebaseConfigured) {
        setStats(prev => ({ ...prev, loading: false }));
        return;
      }

      try {
        const db = await getFirebaseDb();
        if (!db) {
          setStats(prev => ({ ...prev, loading: false }));
          return;
        }

        const { collection, getCountFromServer, getDocs, query, where } = await import("firebase/firestore");

        // Count registered donors (users with role 'donor')
        const usersRef = collection(db, "users");
        const donorsQuery = query(usersRef, where("role", "==", "donor"));
        const donorsSnapshot = await getCountFromServer(donorsQuery);
        const registeredDonors = donorsSnapshot.data().count;

        // Count successful donations
        const donationsRef = collection(db, "donations");
        const successfulQuery = query(donationsRef, where("status", "==", "completed"));
        const donationsSnapshot = await getCountFromServer(successfulQuery);
        const successfulDonations = donationsSnapshot.data().count;

        // Calculate average response time from SOS alerts
        const sosRef = collection(db, "sosAlerts");
        const respondedQuery = query(sosRef, where("status", "in", ["responded", "completed"]));
        const sosSnapshot = await getDocs(respondedQuery);
        
        let totalResponseTime = 0;
        let responseCount = 0;
        
        sosSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.createdAt && data.respondedAt) {
            const created = data.createdAt.toDate?.() || new Date(data.createdAt);
            const responded = data.respondedAt.toDate?.() || new Date(data.respondedAt);
            const diffMinutes = (responded.getTime() - created.getTime()) / (1000 * 60);
            if (diffMinutes > 0 && diffMinutes < 1440) { // Only count if under 24 hours
              totalResponseTime += diffMinutes;
              responseCount++;
            }
          }
        });

        const avgMinutes = responseCount > 0 ? Math.round(totalResponseTime / responseCount) : 0;
        const avgResponseTime = avgMinutes > 0 ? `< ${avgMinutes}min` : "—";

        setStats({
          registeredDonors,
          successfulDonations,
          avgResponseTime,
          loading: false,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchStats();
  }, []);

  return stats;
};
