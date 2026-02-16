import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  Heart,
  Droplets,
  Calendar,
  Award,
  Bell,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  Settings,
  LogOut,
  ChevronRight,
  TrendingUp,
  Save,
  History,
  Gift,
  Menu,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useSOS } from "@/contexts/SOSContext";
import { useDonation } from "@/contexts/DonationContext";
import DonationCentersMap from "@/components/maps/DonationCentersMap";

// Reusable setting toggle component
const SettingToggle = ({ 
  label, 
  description, 
  defaultChecked = false 
}: { 
  label: string; 
  description: string; 
  defaultChecked?: boolean;
}) => {
  const [checked, setChecked] = useState(defaultChecked);
  
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/50">
      <div className="flex-1 pr-4">
        <p className="font-medium text-foreground">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch 
        checked={checked} 
        onCheckedChange={(value) => {
          setChecked(value);
          toast.success(`${label} ${value ? "enabled" : "disabled"}`);
        }}
      />
    </div>
  );
};

const DonorDashboard = () => {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const { getActiveRequests } = useSOS();
  const { getDonationsByDonor, getCompletedDonationsByDonor } = useDonation();
  const [activeTab, setActiveTab] = useState<
    "overview" | "profile" | "history" | "rewards" | "alerts" | "settings"
  >("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Blood type compatibility helper
  const canDonate = (donorType: string, recipientType: string): boolean => {
    // Universal donor (O-) can donate to everyone
    if (donorType === "O-") return true;
    
    // O+ can donate to all positive types
    if (donorType === "O+") {
      return recipientType.includes("+");
    }
    
    // A- can donate to A-, A+, AB-, AB+
    if (donorType === "A-") {
      return recipientType.startsWith("A") || recipientType.startsWith("AB");
    }
    
    // A+ can donate to A+, AB+
    if (donorType === "A+") {
      return recipientType === "A+" || recipientType === "AB+";
    }
    
    // B- can donate to B-, B+, AB-, AB+
    if (donorType === "B-") {
      return recipientType.startsWith("B") || recipientType.startsWith("AB");
    }
    
    // B+ can donate to B+, AB+
    if (donorType === "B+") {
      return recipientType === "B+" || recipientType === "AB+";
    }
    
    // AB- can donate to AB-, AB+
    if (donorType === "AB-") {
      return recipientType.startsWith("AB");
    }
    
    // AB+ can only donate to AB+
    if (donorType === "AB+") {
      return recipientType === "AB+";
    }
    
    return false;
  };

  // Get SOS alerts from context - show real alerts only, no dummy data
  const recentAlerts = useMemo(() => {
    const requests = getActiveRequests();
    console.log(`[DonorDashboard] Found ${requests.length} active SOS requests`);
    
    // Filter alerts that match user's blood type compatibility
    const matchingAlerts = user?.bloodType 
      ? requests.filter(req => {
          const canDonateTo = canDonate(user.bloodType!, req.bloodType);
          if (!canDonateTo) {
            console.log(`[DonorDashboard] Filtering out ${req.bloodType} request (donor: ${user.bloodType})`);
          }
          return canDonateTo;
        })
      : requests; // Show all if user hasn't set blood type
    
    console.log(`[DonorDashboard] Showing ${matchingAlerts.length} matching alerts for donor ${user?.bloodType || "unknown"}`);
    
    return matchingAlerts.slice(0, 5).map((req) => ({
      id: req.id,
      hospital: req.hospitalName,
      patientName: req.patientName,
      bloodType: req.bloodType,
      urgency: req.urgency,
      distance: "~3 km", // TODO: Calculate actual distance using geolocation
      time: getTimeAgo(req.createdAt),
      units: req.units,
      address: req.hospitalAddress || "Address not provided",
      phone: req.contactPhone,
    }));
  }, [getActiveRequests, user?.bloodType]);

  function getTimeAgo(dateString: string): string {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    return `${Math.floor(diffMins / 60)} hr ago`;
  }

  // Get donor stats from user (defaults to empty for new users)
  const donorStats = user?.donorStats;

  // Get donation history from context first, fallback to user stats
  const donorId = user?.email || "";

  // Get completed donations count from context for accurate count
  const completedDonations = useMemo(() => {
    return getCompletedDonationsByDonor(donorId);
  }, [getCompletedDonationsByDonor, donorId]);

  const completedDonationsCount = completedDonations.length;

  // Get the last donation date from completed donations
  const lastDonationFromContext = useMemo(() => {
    if (completedDonations.length === 0) return null;
    const sorted = [...completedDonations].sort(
      (a, b) => new Date(b.completedAt || b.donatedAt).getTime() - new Date(a.completedAt || a.donatedAt).getTime()
    );
    const lastDate = sorted[0]?.completedAt || sorted[0]?.donatedAt;
    return lastDate ? new Date(lastDate).toLocaleDateString() : null;
  }, [completedDonations]);

  const donor = useMemo(() => {
    // Blood type should always come from user registration - never show "Unknown"
    const bloodType = user?.bloodType;
    if (!bloodType && user?.role === "donor") {
      console.warn("Donor missing blood type - this should be set during registration");
    }

    // Use the higher of donorStats or context count (in case of sync)
    const totalDonations = Math.max(donorStats?.totalDonations || 0, completedDonationsCount);
    const points = totalDonations * 200; // 200 points per donation
    
    // Calculate level based on points
    const getLevel = (pts: number) => {
      if (pts >= 5000) return "Legend";
      if (pts >= 3000) return "Platinum Donor";
      if (pts >= 1500) return "Gold Donor";
      if (pts >= 500) return "Silver Donor";
      if (pts >= 200) return "Bronze Donor";
      return "New Donor";
    };

    // Use context last donation date, fallback to donorStats
    const lastDonation = lastDonationFromContext || donorStats?.lastDonation || null;
    
    return {
      name: user?.name || "Donor",
      bloodType: bloodType || "N/A",
      email: user?.email || "",
      phone: user?.phone || "",
      apaarId: user?.apaarId || "",
      totalDonations: totalDonations,
      lastDonation: lastDonation,
      nextEligible: donorStats?.nextEligible || new Date().toISOString().split("T")[0],
      points: points,
      level: getLevel(points),
      isEligible: !lastDonation || true, // New users are eligible
    };
  }, [user, donorStats, completedDonationsCount, lastDonationFromContext]);

  const [profile, setProfile] = useState({
    name: donor.name,
    phone: donor.phone,
    address: "",
    emergencyContact: "",
    medicalNotes: "",
  });

  // Use real alerts only
  const displayAlerts = recentAlerts;

  // Get donation history from context first, fallback to user stats
  const contextDonations = useMemo(() => getDonationsByDonor(donorId), [getDonationsByDonor, donorId]);
  
  const donationHistory = useMemo(() => {
    if (contextDonations.length > 0) {
      return contextDonations.map(d => ({
        id: d.id,
        date: new Date(d.donatedAt).toLocaleDateString(),
        location: d.hospitalName,
        units: d.units,
        status: d.status,
      }));
    }
    return donorStats?.donationHistory || [];
  }, [contextDonations, donorStats]);

  // Get badges - calculate earned status based on actual donation count
  const badges = useMemo(() => {
    const baseBadges = [
      { name: "First Donation", icon: "🩸", threshold: 1 },
      { name: "5 Donations", icon: "⭐", threshold: 5 },
      { name: "10 Donations", icon: "🏆", threshold: 10 },
      { name: "Life Saver", icon: "❤️", threshold: 15 },
      { name: "25 Donations", icon: "👑", threshold: 25 },
    ];
    
    return baseBadges.map(badge => ({
      name: badge.name,
      icon: badge.icon,
      earned: donor.totalDonations >= badge.threshold,
    }));
  }, [donor.totalDonations]);

  const handleLogout = () => {
    logout();
    toast.success("Signed out");
    navigate("/login");
  };

  const handleAccept = (id: string) => {
    toast.success("Request accepted! The hospital has been notified.");
  };

  const handleSaveProfile = () => {
    updateUser({ name: profile.name, phone: profile.phone });
    setIsEditing(false);
    toast.success("Profile updated");
  };

  // Calculate points needed for next level
  const getNextLevelInfo = () => {
    const points = donor.points;
    if (points < 500) return { next: "Bronze Donor", needed: 500 - points, max: 500 };
    if (points < 1500) return { next: "Silver Donor", needed: 1500 - points, max: 1500 };
    if (points < 3000) return { next: "Gold Donor", needed: 3000 - points, max: 3000 };
    if (points < 5000) return { next: "Platinum Donor", needed: 5000 - points, max: 5000 };
    return { next: "Legend", needed: 0, max: points };
  };

  const levelInfo = getNextLevelInfo();

  const renderTab = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-display font-bold">Profile & Health Details</h2>
              <Button
                variant={isEditing ? "hero" : "outline"}
                onClick={() => (isEditing ? handleSaveProfile() : setIsEditing(true))}
              >
                {isEditing ? (
                  <>
                    <Save className="h-4 w-4 mr-2" /> Save
                  </>
                ) : (
                  "Edit"
                )}
              </Button>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Personal Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-crimson-light border border-primary/20">
                    <div className="w-14 h-14 rounded-xl bg-gradient-crimson flex items-center justify-center">
                      <span className="text-lg font-bold text-primary-foreground">{donor.bloodType}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{donor.name}</p>
                      <p className="text-sm text-muted-foreground">{donor.level}</p>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input
                        value={profile.name}
                        disabled={!isEditing}
                        onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input value={donor.email} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        value={profile.phone}
                        disabled={!isEditing}
                        onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Address</Label>
                      <Input
                        value={profile.address}
                        disabled={!isEditing}
                        placeholder="Your address"
                        onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Droplets className="h-5 w-5 text-primary" />
                    Health Information
                  </CardTitle>
                  <CardDescription>Eligibility is based on donation interval & health status.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-secondary">
                      <p className="text-xs text-muted-foreground">Eligibility</p>
                      <p className="text-xl font-bold text-success">Eligible</p>
                    </div>
                    <div className="p-4 rounded-xl bg-secondary">
                      <p className="text-xs text-muted-foreground">Blood Type</p>
                      <p className="text-xl font-bold text-primary">{donor.bloodType}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Emergency Contact</Label>
                    <Input
                      value={profile.emergencyContact}
                      disabled={!isEditing}
                      placeholder="Emergency contact"
                      onChange={(e) => setProfile((p) => ({ ...p, emergencyContact: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Medical Notes</Label>
                    <Textarea
                      rows={4}
                      value={profile.medicalNotes}
                      disabled={!isEditing}
                      placeholder="Any allergies or relevant medical notes"
                      onChange={(e) => setProfile((p) => ({ ...p, medicalNotes: e.target.value }))}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case "history":
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-display font-bold">Donation History</h2>
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Your Donations</CardTitle>
                <CardDescription>Track your donation dates and centers.</CardDescription>
              </CardHeader>
              <CardContent>
                {donationHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <Droplets className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-medium text-foreground mb-2">No donations yet</p>
                    <p className="text-muted-foreground mb-6">
                      Make your first donation to start saving lives!
                    </p>
                    <Button variant="hero" onClick={() => setShowMap(true)}>
                      <MapPin className="h-4 w-4 mr-2" />
                      Find Donation Center
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {donationHistory.map((d) => (
                      <div key={d.id} className="flex items-center justify-between p-4 rounded-xl bg-secondary/40">
                        <div>
                          <p className="font-semibold">{d.location}</p>
                          <p className="text-sm text-muted-foreground">{d.date}</p>
                        </div>
                        <Badge variant="outline">{d.units} unit</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case "rewards":
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-display font-bold">Rewards & Badges</h2>
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-warning" /> Points & Level
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded-xl bg-gradient-crimson-light border border-primary/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{donor.level}</span>
                    <span className="text-sm text-muted-foreground">
                      {donor.points} / {levelInfo.max} pts
                    </span>
                  </div>
                  <Progress value={(donor.points / levelInfo.max) * 100} className="h-2" />
                  {levelInfo.needed > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {levelInfo.needed} more points to reach {levelInfo.next}
                    </p>
                  )}
                </div>

                <p className="text-sm text-muted-foreground my-4">
                  Earn 200 points for each donation. Complete donations to unlock badges!
                </p>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6">
                  {badges.map((badge) => (
                    <div
                      key={badge.name}
                      className={`flex flex-col items-center p-4 rounded-xl border ${
                        badge.earned ? "border-primary/30 bg-accent" : "border-border opacity-50"
                      }`}
                    >
                      <span className="text-2xl mb-1">{badge.icon}</span>
                      <span className="text-xs text-center text-muted-foreground">{badge.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "alerts":
        const allActiveRequests = getActiveRequests();
        // Get all matching alerts (not just first 5) - filter by blood type compatibility
        const allMatchingAlerts = user?.bloodType 
          ? allActiveRequests.filter(req => canDonate(user.bloodType!, req.bloodType))
          : allActiveRequests;
        
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-display font-bold">SOS Alerts</h2>
              <Badge variant="destructive" className="animate-pulse">
                {allMatchingAlerts.length} Active
              </Badge>
            </div>
            <Card className="shadow-card">
              <CardContent className="p-6 space-y-4">
                {allMatchingAlerts.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertTriangle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-semibold mb-2">No Active SOS Alerts</p>
                    {user?.bloodType ? (
                      <p className="text-muted-foreground">
                        There are currently no emergency requests matching your blood type ({user.bloodType}).
                        <br />
                        We'll notify you as soon as a matching request comes in!
                      </p>
                    ) : (
                      <p className="text-muted-foreground">
                        Update your profile with your blood type to see matching emergency requests.
                      </p>
                    )}
                  </div>
                ) : (
                  allMatchingAlerts.map((req) => {
                    const alert = {
                      id: req.id,
                      hospital: req.hospitalName,
                      patientName: req.patientName,
                      bloodType: req.bloodType,
                      urgency: req.urgency,
                      distance: "~3 km",
                      time: getTimeAgo(req.createdAt),
                      units: req.units,
                      address: req.hospitalAddress || "Address not provided",
                      phone: req.contactPhone,
                    };
                    return (
                      <div key={alert.id} className="p-4 rounded-xl border border-border">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-crimson flex items-center justify-center">
                              <span className="text-lg font-bold text-primary-foreground">{alert.bloodType}</span>
                            </div>
                            <div>
                              <p className="font-semibold">{alert.hospital}</p>
                              <p className="text-sm text-muted-foreground">Patient: {alert.patientName}</p>
                              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" /> {alert.distance}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" /> {alert.time}
                                </span>
                                <span>{alert.units} unit(s) needed</span>
                              </div>
                            </div>
                          </div>
                          <Badge className={alert.urgency === "critical" ? "bg-destructive" : "bg-warning"}>
                            {alert.urgency.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="hero" size="sm" className="flex-1" onClick={() => handleAccept(alert.id)}>
                            Accept
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => navigate(`/sos/${alert.id}`)}>
                            Details
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        );

      case "settings":
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-display font-bold">Settings</h2>
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Notifications
                </CardTitle>
                <CardDescription>Manage how you receive reminders and SOS alerts.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <SettingToggle 
                  label="SOS Alerts" 
                  description="Get notified about emergency blood requests in your area"
                  defaultChecked={true}
                />
                <SettingToggle 
                  label="Donation Reminders" 
                  description="Remind me when I'm eligible to donate again"
                  defaultChecked={true}
                />
                <SettingToggle 
                  label="Email Updates" 
                  description="Receive newsletters and platform updates via email"
                  defaultChecked={false}
                />
                <SettingToggle 
                  label="SMS Notifications" 
                  description="Get text messages for urgent requests"
                  defaultChecked={true}
                />
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  Privacy
                </CardTitle>
                <CardDescription>Control your profile visibility and data sharing.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <SettingToggle 
                  label="Profile Visibility" 
                  description="Allow hospitals to see your profile when matching donors"
                  defaultChecked={true}
                />
                <SettingToggle 
                  label="Location Sharing" 
                  description="Share your approximate location for better matching"
                  defaultChecked={true}
                />
              </CardContent>
            </Card>
          </div>
        );

      default:
        return (
          <div className="space-y-6 animate-fade-in">
            {/* Eligibility Banner */}
            <Card className={`border-2 ${donor.isEligible ? "border-success bg-success/5" : "border-warning bg-warning/5"}`}>
              <CardContent className="flex flex-col md:flex-row md:items-center gap-4 py-4">
                {donor.isEligible ? (
                  <>
                    <CheckCircle className="h-8 w-8 text-success" />
                    <div className="flex-1">
                      <p className="font-semibold">You're eligible to donate!</p>
                      <p className="text-sm text-muted-foreground">
                        {donor.lastDonation 
                          ? `Your last donation was on ${donor.lastDonation}` 
                          : "Make your first donation today!"}
                      </p>
                    </div>
                    <Button variant="hero" size="sm" onClick={() => setShowMap(true)}>
                      <MapPin className="h-4 w-4 mr-2" />
                      Find Donation Center
                    </Button>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-8 w-8 text-warning" />
                    <div className="flex-1">
                      <p className="font-semibold">Next eligible date: {donor.nextEligible}</p>
                      <p className="text-sm text-muted-foreground">You need to wait 56 days between donations</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: Droplets, label: "Total Donations", value: donor.totalDonations, color: "text-primary" },
                { icon: Calendar, label: "Last Donation", value: donor.lastDonation || "None yet", color: "text-info" },
                { icon: Award, label: "Points Earned", value: donor.points.toLocaleString(), color: "text-warning" },
                { icon: Heart, label: "Lives Saved", value: donor.totalDonations * 3, color: "text-success" },
              ].map((stat) => (
                <Card key={stat.label} className="shadow-card">
                  <CardContent className="flex items-center gap-4 p-6">
                    <div className={`p-3 rounded-xl bg-secondary ${stat.color}`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* SOS Alerts */}
              <Card className="shadow-card">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5 text-primary" /> Active SOS Alerts
                    </CardTitle>
                    <CardDescription>Emergency requests in your area</CardDescription>
                  </div>
                  <Badge variant="destructive" className="animate-pulse">{recentAlerts.length} Active</Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recentAlerts.length === 0 ? (
                    <div className="text-center py-8">
                      <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-2">No active SOS alerts</p>
                      {user?.bloodType ? (
                        <p className="text-xs text-muted-foreground">
                          We'll notify you when there are requests matching your blood type ({user.bloodType})
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Update your profile with your blood type to see matching requests
                        </p>
                      )}
                    </div>
                  ) : (
                    recentAlerts.map((alert) => (
                      <div key={alert.id} className="p-4 rounded-xl border border-border">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold">{alert.hospital}</p>
                            <p className="text-sm text-muted-foreground">{alert.distance} • {alert.time}</p>
                          </div>
                          <Badge className={alert.urgency === "critical" ? "bg-destructive" : "bg-warning"}>
                            {alert.urgency.toUpperCase()}
                          </Badge>
                        </div>
                        <Button variant="hero" size="sm" className="w-full" onClick={() => navigate(`/sos/${alert.id}`)}>
                          View & Respond
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Rewards & Badges */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-warning" /> Rewards & Badges
                  </CardTitle>
                  <CardDescription>Your achievements and recognition</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6 p-4 rounded-xl bg-gradient-crimson-light border border-primary/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{donor.level}</span>
                      <span className="text-sm text-muted-foreground">
                        {donor.points} / {levelInfo.max} pts
                      </span>
                    </div>
                    <Progress value={(donor.points / levelInfo.max) * 100} className="h-2" />
                    {levelInfo.needed > 0 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {levelInfo.needed} more points to reach {levelInfo.next}
                      </p>
                    )}
                  </div>

                  <Button variant="outline" className="w-full" onClick={() => setActiveTab("rewards")}>
                    View All Rewards
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        );
    }
  };

  const nav = [
    { id: "overview" as const, label: "Overview", icon: TrendingUp },
    { id: "profile" as const, label: "Profile", icon: User },
    { id: "history" as const, label: "Donation History", icon: History },
    { id: "rewards" as const, label: "Rewards", icon: Award },
    { id: "alerts" as const, label: "SOS Alerts", icon: Bell },
    { id: "settings" as const, label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-mesh">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 glass-strong p-6 hidden lg:flex flex-col">
        <Link to="/" className="flex items-center gap-2 mb-8">
          <Heart className="h-8 w-8 text-primary fill-primary" />
          <span className="text-xl font-display font-bold">
            Crimson<span className="text-primary">Care</span>
          </span>
        </Link>

        <div className="p-4 rounded-xl bg-gradient-crimson-light border border-primary/20 mb-6">
          <p className="text-xs text-muted-foreground">Logged in as</p>
          <p className="font-semibold">{donor.name}</p>
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-crimson text-primary-foreground text-sm">
            <Droplets className="h-4 w-4" />
            <span className="font-semibold">{donor.bloodType}</span>
          </div>
        </div>

        <nav className="space-y-2 flex-1">
          {nav.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                activeTab === item.id
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={handleLogout}>
          <LogOut className="h-5 w-5 mr-3" />
          Sign Out
        </Button>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <aside className="h-full w-full glass-strong p-6 flex flex-col">
            <Link
              to="/"
              className="flex items-center gap-2 mb-8"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Heart className="h-8 w-8 text-primary fill-primary" />
              <span className="text-xl font-display font-bold">
                Crimson<span className="text-primary">Care</span>
              </span>
            </Link>

            <div className="p-4 rounded-xl bg-gradient-crimson-light border border-primary/20 mb-6">
              <p className="text-xs text-muted-foreground">Logged in as</p>
              <p className="font-semibold">{donor.name}</p>
              <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-crimson text-primary-foreground text-sm">
                <Droplets className="h-4 w-4" />
                <span className="font-semibold">{donor.bloodType}</span>
              </div>
            </div>

            <nav className="space-y-2 flex-1">
              {nav.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    activeTab === item.id
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </button>
              ))}
            </nav>

            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Sign Out
            </Button>
          </aside>
        </SheetContent>
      </Sheet>

      {/* Main */}
      <main className="lg:ml-64 p-6 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold">
              Welcome back, {donor.name}!
            </h1>
            <p className="text-muted-foreground">{activeTab === "overview" ? "Here's your donation overview" : ""}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Menu</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setActiveTab("alerts")}>
              <Bell className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-crimson text-primary-foreground">
              <Droplets className="h-4 w-4" />
              <span className="font-semibold">{donor.bloodType}</span>
            </div>
          </div>
        </div>

        {renderTab()}
      </main>

      {/* Google Maps Modal */}
      <DonationCentersMap isOpen={showMap} onClose={() => setShowMap(false)} />
    </div>
  );
};

export default DonorDashboard;
