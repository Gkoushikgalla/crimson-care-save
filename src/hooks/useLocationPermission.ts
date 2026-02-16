import { useState, useEffect } from "react";
import { Geolocation } from "@capacitor/geolocation";
import { Capacitor } from "@capacitor/core";

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
    setIsRequesting(true);
    setError(null);

    try {
      // Use Capacitor Geolocation on native platforms
      if (Capacitor.isNativePlatform()) {
        // Check permissions first
        const permission = await Geolocation.checkPermissions();
        
        if (permission.location !== "granted") {
          const request = await Geolocation.requestPermissions();
          if (request.location !== "granted") {
            setError("Location permission denied. Please enable location in app settings.");
            setIsRequesting(false);
            return null;
          }
        }

        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000,
        });

        const locationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        
        setLocation(locationData);
        setIsRequesting(false);
        sessionStorage.setItem("crimsoncare_location", JSON.stringify(locationData));
        console.log("[Location] Capacitor location granted:", locationData);
        return locationData;
      } else {
        // Fallback to browser geolocation for web
        if (!navigator.geolocation) {
          setError("Geolocation is not supported by your browser");
          setIsRequesting(false);
          return null;
        }

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
              
              sessionStorage.setItem("crimsoncare_location", JSON.stringify(locationData));
              console.log("[Location] Browser location granted:", locationData);
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
      }
    } catch (err: any) {
      const errorMessage = err.message || "Failed to get location";
      setError(errorMessage);
      setIsRequesting(false);
      console.error("[Location] Error:", err);
      return null;
    }
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
