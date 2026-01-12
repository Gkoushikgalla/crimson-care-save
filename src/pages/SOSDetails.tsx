import { useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Heart,
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Clock,
  User,
  Droplets,
  CheckCircle,
  AlertTriangle,
  Building2,
  MessageCircle,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { useSOS, SOSRequest } from "@/contexts/SOSContext";
import { useDonation, Donation } from "@/contexts/DonationContext";
import { useAuth } from "@/contexts/AuthContext";

const SOSDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { requests, updateRequest } = useSOS();
  const { createDonation, completeDonation, getDonationsBySOS } = useDonation();
  const { user, updateDonorStats } = useAuth();

  const [showMismatchDialog, setShowMismatchDialog] = useState(false);
  const [mismatchConfirmed, setMismatchConfirmed] = useState(false);

  const request = useMemo(() => {
    return requests.find((r) => r.id === id);
  }, [requests, id]);

  const donations = useMemo(() => {
    if (!id) return [];
    return getDonationsBySOS(id);
  }, [getDonationsBySOS, id]);

  // Blood type compatibility chart
  const bloodCompatibility: Record<string, string[]> = {
    "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"], // Universal donor
    "O+": ["O+", "A+", "B+", "AB+"],
    "A-": ["A-", "A+", "AB-", "AB+"],
    "A+": ["A+", "AB+"],
    "B-": ["B-", "B+", "AB-", "AB+"],
    "B+": ["B+", "AB+"],
    "AB-": ["AB-", "AB+"],
    "AB+": ["AB+"],
  };

  const isUniversalDonor = user?.bloodType === "O-";
  
  const isCompatible = useMemo(() => {
    if (!user?.bloodType || !request?.bloodType) return false;
    const canDonateTo = bloodCompatibility[user.bloodType] || [];
    return canDonateTo.includes(request.bloodType);
  }, [user?.bloodType, request?.bloodType]);

  if (!request) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-warning mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Request Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The SOS request you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getTimeAgo = (dateString: string): string => {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    return `${Math.floor(diffHours / 24)} day${Math.floor(diffHours / 24) > 1 ? "s" : ""} ago`;
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const proceedWithDonation = () => {
    if (!user) return;

    createDonation({
      sosRequestId: request.id,
      donorId: user.email || "unknown",
      donorName: user.name || "Anonymous Donor",
      donorPhone: user.phone || "",
      bloodType: user.bloodType || request.bloodType,
      units: 1,
      hospitalName: request.hospitalName,
      patientName: request.patientName,
    });

    updateRequest(request.id, {
      confirmedDonors: request.confirmedDonors + 1,
      status: "in_progress",
    });

    toast.success("You've accepted this request! Contact details shared.");
    setShowMismatchDialog(false);
    setMismatchConfirmed(false);
  };

  const handleAcceptRequest = () => {
    if (!user) {
      toast.error("Please login to accept this request");
      navigate("/login");
      return;
    }

    // Check blood type compatibility
    if (!isCompatible && !isUniversalDonor) {
      setShowMismatchDialog(true);
      return;
    }

    // Compatible or universal donor - proceed directly
    proceedWithDonation();
  };

  const handleMarkComplete = (donationId: string) => {
    completeDonation(donationId, (completedDonation: Donation) => {
      // Update donor stats when donation is completed
      updateDonorStatsForDonor(completedDonation);
    });
    
    const completedCount = donations.filter(d => d.status === "completed").length + 1;
    if (completedCount >= request.units) {
      updateRequest(request.id, { status: "fulfilled" });
    }
    
    toast.success("Donation marked as complete! Donor stats updated.");
  };

  const updateDonorStatsForDonor = (donation: Donation) => {
    // Get the donor from localStorage and update their stats
    const storedUsers = localStorage.getItem("crimsoncare_users");
    if (!storedUsers) return;

    const users = JSON.parse(storedUsers);
    const donorIndex = users.findIndex((u: any) => u.email === donation.donorId);
    
    if (donorIndex === -1) return;

    const donor = users[donorIndex];
    const currentStats = donor.donorStats || {
      totalDonations: 0,
      lastDonation: null,
      nextEligible: null,
      points: 0,
      level: "New Donor",
      donationHistory: [],
      badges: [
        { name: "First Donation", icon: "🩸", earned: false },
        { name: "5 Donations", icon: "⭐", earned: false },
        { name: "10 Donations", icon: "🏆", earned: false },
        { name: "Life Saver", icon: "❤️", earned: false },
        { name: "25 Donations", icon: "👑", earned: false },
      ],
    };

    const newTotalDonations = currentStats.totalDonations + 1;
    const newPoints = currentStats.points + 200; // 200 points per donation
    
    // Calculate new level based on points
    const getLevel = (points: number) => {
      if (points >= 5000) return "Legend";
      if (points >= 3000) return "Platinum Donor";
      if (points >= 1500) return "Gold Donor";
      if (points >= 500) return "Silver Donor";
      if (points >= 200) return "Bronze Donor";
      return "New Donor";
    };

    // Update badges based on donation count
    const updatedBadges = currentStats.badges.map((badge: any) => {
      if (badge.name === "First Donation" && newTotalDonations >= 1) {
        return { ...badge, earned: true };
      }
      if (badge.name === "5 Donations" && newTotalDonations >= 5) {
        return { ...badge, earned: true };
      }
      if (badge.name === "10 Donations" && newTotalDonations >= 10) {
        return { ...badge, earned: true };
      }
      if (badge.name === "Life Saver" && newTotalDonations >= 15) {
        return { ...badge, earned: true };
      }
      if (badge.name === "25 Donations" && newTotalDonations >= 25) {
        return { ...badge, earned: true };
      }
      return badge;
    });

    // Calculate next eligible date (56 days / 8 weeks after donation)
    const nextEligible = new Date();
    nextEligible.setDate(nextEligible.getDate() + 56);

    const updatedStats = {
      ...currentStats,
      totalDonations: newTotalDonations,
      lastDonation: donation.completedAt || new Date().toISOString(),
      nextEligible: nextEligible.toISOString().split("T")[0],
      points: newPoints,
      level: getLevel(newPoints),
      donationHistory: [
        {
          id: donation.id,
          date: new Date(donation.completedAt || donation.donatedAt).toLocaleDateString(),
          location: donation.hospitalName,
          units: donation.units,
        },
        ...currentStats.donationHistory,
      ],
      badges: updatedBadges,
    };

    users[donorIndex] = { ...donor, donorStats: updatedStats };
    localStorage.setItem("crimsoncare_users", JSON.stringify(users));

    // If current user is the donor, update their session too
    if (user && user.email === donation.donorId) {
      updateDonorStats(updatedStats);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "critical": return "bg-destructive";
      case "high": return "bg-warning";
      default: return "bg-info";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "fulfilled": return "bg-success text-success-foreground";
      case "in_progress": return "bg-info text-info-foreground";
      case "cancelled": return "bg-muted text-muted-foreground";
      default: return "bg-warning text-warning-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Link to="/" className="flex items-center gap-2">
              <Heart className="h-6 w-6 text-primary fill-primary" />
              <span className="font-display text-xl font-bold">
                Crimson<span className="text-primary">Care</span>
              </span>
            </Link>
          </div>
          <Badge className={getStatusColor(request.status)}>
            {request.status.replace("_", " ").toUpperCase()}
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Request Overview */}
        <Card className="shadow-card mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-gradient-crimson flex items-center justify-center">
                    <span className="text-xl font-bold text-primary-foreground">{request.bloodType}</span>
                  </div>
                  <div>
                    <span>{request.bloodType} Blood Needed</span>
                    <p className="text-sm font-normal text-muted-foreground mt-1">
                      {request.units} unit(s) required
                    </p>
                  </div>
                </CardTitle>
              </div>
              <Badge className={getUrgencyColor(request.urgency)}>
                {request.urgency.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-secondary/50">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <User className="h-4 w-4" />
                  <span className="text-sm">Patient Name</span>
                </div>
                <p className="font-semibold">{request.patientName}</p>
              </div>
              <div className="p-4 rounded-xl bg-secondary/50">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">Requested</span>
                </div>
                <p className="font-semibold">{getTimeAgo(request.createdAt)}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-secondary/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Droplets className="h-4 w-4" />
                <span className="text-sm">Notes</span>
              </div>
              <p className="text-foreground">{request.notes || "No additional notes"}</p>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">{request.matchedDonors} matched donors</span>
              <span className="text-success font-medium">{request.confirmedDonors} confirmed</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">Source: {request.source}</span>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="shadow-card mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              Contact Information
            </CardTitle>
            <CardDescription>Get in touch with the hospital or requester</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    <span className="text-sm">Hospital/Location</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => copyToClipboard(request.hospitalName, "Hospital name")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="font-semibold">{request.hospitalName}</p>
              </div>

              <div className="p-4 rounded-xl border border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">Address</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => copyToClipboard(request.hospitalAddress, "Address")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="font-semibold">{request.hospitalAddress || "Not provided"}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span className="text-sm">Phone</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => copyToClipboard(request.contactPhone, "Phone")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="font-semibold">{request.contactPhone || "Not provided"}</p>
                {request.contactPhone && (
                  <a
                    href={`tel:${request.contactPhone}`}
                    className="inline-flex items-center gap-2 mt-2 text-primary text-sm hover:underline"
                  >
                    <Phone className="h-3 w-3" /> Call now
                  </a>
                )}
              </div>

              <div className="p-4 rounded-xl border border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="text-sm">Email</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => copyToClipboard(request.contactEmail, "Email")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="font-semibold">{request.contactEmail || "Not provided"}</p>
                {request.contactEmail && (
                  <a
                    href={`mailto:${request.contactEmail}`}
                    className="inline-flex items-center gap-2 mt-2 text-primary text-sm hover:underline"
                  >
                    <Mail className="h-3 w-3" /> Send email
                  </a>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Donations */}
        <Card className="shadow-card mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-primary" />
              Donations ({donations.length})
            </CardTitle>
            <CardDescription>Track donations for this request</CardDescription>
          </CardHeader>
          <CardContent>
            {donations.length === 0 ? (
              <div className="text-center py-8">
                <Droplets className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No donations yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {donations.map((donation) => (
                  <div
                    key={donation.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-crimson flex items-center justify-center">
                        <span className="text-sm font-bold text-primary-foreground">
                          {donation.bloodType}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold">{donation.donorName}</p>
                        <p className="text-sm text-muted-foreground">{donation.donorPhone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {donation.status === "completed" ? (
                        <Badge className="bg-success text-success-foreground">
                          <CheckCircle className="h-3 w-3 mr-1" /> Completed
                        </Badge>
                      ) : donation.status === "pending" ? (
                        <Button
                          variant="hero"
                          size="sm"
                          onClick={() => handleMarkComplete(donation.id)}
                        >
                          Mark Complete
                        </Button>
                      ) : (
                        <Badge variant="outline">Cancelled</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        {user?.role === "donor" && request.status !== "fulfilled" && request.status !== "cancelled" && (
          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="hero" className="flex-1" onClick={handleAcceptRequest}>
                  <Heart className="h-4 w-4 mr-2" /> Accept & Donate
                </Button>
                <Button variant="outline" className="flex-1" asChild>
                  <a href={`tel:${request.contactPhone}`}>
                    <Phone className="h-4 w-4 mr-2" /> Call Hospital
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Blood Type Mismatch Dialog */}
        <AlertDialog open={showMismatchDialog} onOpenChange={setShowMismatchDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-warning">
                <AlertTriangle className="h-5 w-5" />
                Blood Type Mismatch
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-4">
                  <p>
                    The patient requires <strong className="text-primary">{request.bloodType}</strong> blood, 
                    but your blood type is <strong className="text-primary">{user?.bloodType || "Unknown"}</strong>.
                  </p>
                  
                  <div className="p-4 rounded-xl bg-warning/10 border border-warning/30">
                    <p className="text-sm text-foreground">
                      <strong>⚠️ Important:</strong> Donating incompatible blood can cause serious medical complications. 
                      Please confirm with the hospital staff before proceeding.
                    </p>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                    <Checkbox 
                      id="confirm-mismatch"
                      checked={mismatchConfirmed}
                      onCheckedChange={(checked) => setMismatchConfirmed(checked === true)}
                    />
                    <label 
                      htmlFor="confirm-mismatch" 
                      className="text-sm text-foreground cursor-pointer leading-relaxed"
                    >
                      I understand the blood types are different and I will confirm with the hospital before donating.
                    </label>
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setMismatchConfirmed(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={proceedWithDonation}
                disabled={!mismatchConfirmed}
                className="bg-primary hover:bg-primary/90"
              >
                Proceed Anyway
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
};

export default SOSDetails;
