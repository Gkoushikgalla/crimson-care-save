import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSOS } from "@/contexts/SOSContext";
import { useLocationPermission } from "@/hooks/useLocationPermission";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

const LocationPermissionHandler = () => {
  const { user, isAuthenticated } = useAuth();
  const { checkBloodTypeMatch } = useSOS();
  const { requestLocation, location, error: locationError } = useLocationPermission();

  // Request location permission when user logs in
  useEffect(() => {
    if (isAuthenticated && user && !location) {
      // Small delay to ensure UI is ready
      const timer = setTimeout(() => {
        requestLocation();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user, location, requestLocation]);

  // Handle new SOS requests with urgency-based alerts
  useEffect(() => {
    const handleNewSOSRequests = (event: CustomEvent) => {
      const newRequests = event.detail as Array<{
        id: string;
        patientName: string;
        bloodType: string;
        urgency: "critical" | "high" | "moderate";
        hospitalName: string;
        units: number;
      }>;

      if (!user) return;

      newRequests.forEach((request) => {
        const userBloodType = user.bloodType;
        const isMatch = userBloodType ? checkBloodTypeMatch(userBloodType, request.bloodType) : false;
        const userRole = user.role;

        // Show urgency-based alert for matching blood types (donors and blood banks)
        if (isMatch && (userRole === "donor" || userRole === "bloodbank")) {
          const urgencyConfig = {
            critical: {
              title: "🚨 CRITICAL SOS ALERT - BLOOD MATCH!",
              description: `Urgent blood request for ${request.bloodType} at ${request.hospitalName}`,
              duration: 10000, // 10 seconds
              action: {
                label: "View Details",
                onClick: () => {
                  window.location.href = `/sos/${request.id}`;
                },
              },
            },
            high: {
              title: "⚠️ HIGH PRIORITY SOS ALERT - BLOOD MATCH!",
              description: `Blood request for ${request.bloodType} at ${request.hospitalName}`,
              duration: 8000,
              action: {
                label: "View Details",
                onClick: () => {
                  window.location.href = `/sos/${request.id}`;
                },
              },
            },
            moderate: {
              title: "📢 SOS ALERT - BLOOD MATCH",
              description: `Blood request for ${request.bloodType} at ${request.hospitalName}`,
              duration: 6000,
              action: {
                label: "View Details",
                onClick: () => {
                  window.location.href = `/sos/${request.id}`;
                },
              },
            },
          };

          const config = urgencyConfig[request.urgency];
          
          toast(config.title, {
            description: `${config.description}. Patient: ${request.patientName}, ${request.units} unit(s) needed.`,
            duration: config.duration,
            icon: <AlertTriangle className="h-5 w-5 text-destructive" />,
            action: {
              label: config.action.label,
              onClick: config.action.onClick,
            },
            className: request.urgency === "critical" ? "border-destructive" : "",
          });
        }
        // For non-matching or hospitals/admins, alerts will show in "Active SOS Alerts" section
      });
    };

    window.addEventListener("newSOSRequests", handleNewSOSRequests as EventListener);
    return () => {
      window.removeEventListener("newSOSRequests", handleNewSOSRequests as EventListener);
    };
  }, [user, checkBloodTypeMatch]);

  // Show location error if permission denied
  useEffect(() => {
    if (locationError && isAuthenticated) {
      toast.warning("Location Permission", {
        description: locationError,
        duration: 5000,
      });
    }
  }, [locationError, isAuthenticated]);

  return null; // This is a handler component, no UI
};

export default LocationPermissionHandler;
