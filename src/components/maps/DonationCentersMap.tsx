import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Phone, Clock, X, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface DonationCenter {
  id: string;
  name: string;
  type: "hospital" | "bloodbank";
  address: string;
  distance: string;
  phone: string;
  hours: string;
  lat: number;
  lng: number;
}

interface DonationCentersMapProps {
  isOpen: boolean;
  onClose: () => void;
}

const DonationCentersMap = ({ isOpen, onClose }: DonationCentersMapProps) => {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [centers, setCenters] = useState<DonationCenter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCenter, setSelectedCenter] = useState<DonationCenter | null>(null);

  const requestLocation = useCallback(() => {
    setIsLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        // Only real, registered centers from backend would be shown here when implemented
        setCenters([]);
        setIsLoading(false);
        toast.success("Location found.");
      },
      (err) => {
        let errorMsg = "Unable to get your location";
        if (err.code === err.PERMISSION_DENIED) {
          errorMsg = "Location permission denied. Please enable location access in your browser settings.";
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          errorMsg = "Location information unavailable";
        } else if (err.code === err.TIMEOUT) {
          errorMsg = "Location request timed out";
        }
        setError(errorMsg);
        setIsLoading(false);
        toast.error(errorMsg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  useEffect(() => {
    if (isOpen) {
      requestLocation();
    }
  }, [isOpen, requestLocation]);

  const openInGoogleMaps = (center: DonationCenter) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${center.lat},${center.lng}&travelmode=driving`;
    window.open(url, "_blank");
  };

  const openAllInGoogleMaps = () => {
    if (!userLocation) return;
    // Open Google Maps with user's location centered
    const url = `https://www.google.com/maps/search/blood+donation+centers/@${userLocation.lat},${userLocation.lng},14z`;
    window.open(url, "_blank");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Nearby Donation Centers
            </CardTitle>
            <CardDescription>
              {userLocation
                ? "Find blood banks and hospitals near you"
                : "Requesting your location..."}
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>
        <CardContent className="p-0 overflow-auto max-h-[calc(90vh-120px)]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Getting your location...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4 px-6 text-center">
              <AlertTriangle className="h-12 w-12 text-warning" />
              <p className="text-foreground font-medium">{error}</p>
              <Button variant="hero" onClick={requestLocation}>
                Try Again
              </Button>
            </div>
          ) : (
            <div className="grid lg:grid-cols-2">
              {/* Map placeholder - Shows Google Maps link */}
              <div className="h-64 lg:h-auto bg-secondary/50 flex flex-col items-center justify-center p-6 border-b lg:border-b-0 lg:border-r">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-crimson flex items-center justify-center mx-auto">
                    <MapPin className="h-10 w-10 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">Your Location</p>
                    <p className="text-sm text-muted-foreground">
                      {userLocation?.lat.toFixed(4)}, {userLocation?.lng.toFixed(4)}
                    </p>
                  </div>
                  <Button variant="hero" onClick={openAllInGoogleMaps}>
                    <Navigation className="h-4 w-4 mr-2" />
                    Open in Google Maps
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Search for "blood donation centers" near you
                  </p>
                </div>
              </div>

              {/* Centers list - only real registered centers when backend is implemented */}
              <div className="divide-y min-h-[200px] flex flex-col">
                {centers.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-12 px-6 text-center">
                    <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="font-medium text-foreground">No donation centers found</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Only registered blood banks and hospitals appear here. Use the Google Maps button on the left to find nearby centers.
                    </p>
                  </div>
                ) : (
                  centers.map((center) => (
                    <div
                      key={center.id}
                      className={`p-4 hover:bg-secondary/50 cursor-pointer transition-colors ${
                        selectedCenter?.id === center.id ? "bg-accent" : ""
                      }`}
                      onClick={() => setSelectedCenter(center)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold">{center.name}</p>
                          <p className="text-sm text-muted-foreground">{center.address}</p>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            center.type === "hospital"
                              ? "border-info text-info"
                              : "border-primary text-primary"
                          }
                        >
                          {center.type === "hospital" ? "Hospital" : "Blood Bank"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {center.distance}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {center.hours}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="hero"
                          size="sm"
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            openInGoogleMaps(center);
                          }}
                        >
                          <Navigation className="h-4 w-4 mr-1" />
                          Directions
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`tel:${center.phone}`);
                          }}
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DonationCentersMap;
