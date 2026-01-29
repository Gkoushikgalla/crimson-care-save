import { useState, useEffect } from "react";

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number | null;
}

export const useLocationPermission = () => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<PermissionState | null>(null);

  const requestLocation = async (): Promise<LocationData | null> => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return null;
    }

    setIsRequesting(true);
    setError(null);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          setLocation(locationData);
          setIsRequesting(false);
          
          // Store location in sessionStorage
          sessionStorage.setItem("crimsoncare_location", JSON.stringify(locationData));
          console.log("[Location] Location permission granted:", locationData);
          resolve(locationData);
        },
        (err) => {
          let errorMessage = "Location permission denied";
          if (err.code === 1) {
            errorMessage = "Location access denied. Please enable location to see nearby SOS alerts.";
          } else if (err.code === 2) {
            errorMessage = "Location unavailable. Please check your device settings.";
          } else if (err.code === 3) {
            errorMessage = "Location request timed out.";
          }
          setError(errorMessage);
          setIsRequesting(false);
          console.warn("[Location] Location permission error:", err);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      );
    });
  };

  useEffect(() => {
    // Check if location is already stored
    const stored = sessionStorage.getItem("crimsoncare_location");
    if (stored) {
      try {
        const locationData = JSON.parse(stored) as LocationData;
        setLocation(locationData);
      } catch (e) {
        console.error("[Location] Error parsing stored location:", e);
      }
    }

    // Check permission status if available
    if (navigator.permissions) {
      navigator.permissions.query({ name: "geolocation" as PermissionName }).then((result) => {
        setPermissionStatus(result.state);
        result.onchange = () => {
          setPermissionStatus(result.state);
        };
      });
    }
  }, []);

  return {
    location,
    isRequesting,
    error,
    permissionStatus,
    requestLocation,
  };
};
