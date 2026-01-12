import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import DonationCentersMap from "@/components/maps/DonationCentersMap";

const DonorDashboard = () => {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "overview" | "profile" | "history" | "rewards" | "alerts" | "settings"
  >("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [showMap, setShowMap] = useState(false);

  // Get donor stats from user (defaults to empty for new users)
  const donorStats = user?.donorStats;

  const donor = useMemo(() => {
    // Blood type should always come from user registration - never show "Unknown"
    const bloodType = user?.bloodType;
    if (!bloodType && user?.role === "donor") {
      console.warn("Donor missing blood type - this should be set during registration");
    }
    
    return {
      name: user?.name || "Donor",
      bloodType: bloodType || "N/A",
      email: user?.email || "",
      phone: user?.phone || "",
      apaarId: user?.apaarId || "",
      totalDonations: donorStats?.totalDonations || 0,
      lastDonation: donorStats?.lastDonation || null,
      nextEligible: donorStats?.nextEligible || new Date().toISOString().split("T")[0],
      points: donorStats?.points || 0,
      level: donorStats?.level || "New Donor",
      isEligible: !donorStats?.lastDonation || true, // New users are eligible
    };
  }, [user, donorStats]);

  const [profile, setProfile] = useState({
    name: donor.name,
    phone: donor.phone,
    address: "",
    emergencyContact: "",
    medicalNotes: "",
  });

  // SOS alerts (mock - would come from backend)
  const recentAlerts = [
    {
      id: 1,
      hospital: "City General Hospital",
      bloodType: donor.bloodType,
      urgency: "critical" as const,
      distance: "2.5 km",
      time: "10 min ago",
      units: 2,
    },
    {
      id: 2,
      hospital: "St. Mary's Medical Center",
      bloodType: donor.bloodType,
      urgency: "high" as const,
      distance: "4.8 km",
      time: "25 min ago",
      units: 1,
    },
  ];

  // Get donation history from user stats (empty for new users)
  const donationHistory = donorStats?.donationHistory || [];

  // Get badges from user stats
  const badges = donorStats?.badges || [
    { name: "First Donation", icon: "🩸", earned: false },
    { name: "5 Donations", icon: "⭐", earned: false },
    { name: "10 Donations", icon: "🏆", earned: false },
    { name: "Life Saver", icon: "❤️", earned: false },
    { name: "25 Donations", icon: "👑", earned: false },
  ];

  const handleLogout = () => {
    logout();
    toast.success("Signed out");
    navigate("/login");
  };

  const handleAccept = (id: number) => {
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
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-display font-bold">SOS Alerts</h2>
              <Badge variant="destructive" className="animate-pulse">
                {recentAlerts.length} Active
              </Badge>
            </div>
            <Card className="shadow-card">
              <CardContent className="p-6 space-y-4">
                {recentAlerts.map((alert) => (
                  <div key={alert.id} className="p-4 rounded-xl border border-border">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold">{alert.hospital}</p>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {alert.distance}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {alert.time}
                          </span>
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
                      <Button variant="outline" size="sm">
                        Details
                      </Button>
                    </div>
                  </div>
                ))}
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
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Manage how you receive reminders and SOS alerts.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {["SOS Alerts", "Donation Reminders", "Email Updates"].map((label) => (
                  <div key={label} className="flex items-center justify-between p-3 rounded-lg bg-secondary/40">
                    <span className="font-medium">{label}</span>
                    <Button variant="outline" size="sm">Toggle</Button>
                  </div>
                ))}
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
                  {recentAlerts.map((alert) => (
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
                      <Button variant="hero" size="sm" className="w-full" onClick={() => setActiveTab("alerts")}>
                        View & Respond
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
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
