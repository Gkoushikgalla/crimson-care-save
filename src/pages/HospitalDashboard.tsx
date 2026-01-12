import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Heart,
  Building2,
  AlertTriangle,
  Bell,
  Users,
  Clock,
  CheckCircle,
  Settings,
  LogOut,
  FileText,
  TrendingUp,
  MapPin,
  Phone,
  Droplets,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useSOS } from "@/contexts/SOSContext";
import SOSRequestDialog from "@/components/sos/SOSRequestDialog";

const HospitalDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { getRequestsByHospital } = useSOS();
  const [activeTab, setActiveTab] = useState<
    "overview" | "create" | "requests" | "responses" | "records" | "settings"
  >("overview");

  const hospital = useMemo(() => {
    return {
      name: user?.hospitalName || "City General Hospital",
      license: user?.licenseNumber || "HC-2024-001",
      email: user?.email || "",
      phone: user?.phone || "",
      totalRequests: 45,
      fulfilledRequests: 38,
      pendingRequests: 7,
      avgResponseTime: "28 min",
    };
  }, [user]);

  // Helper to format time ago
  function getTimeAgo(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    return `${Math.floor(diffHours / 24)} day${Math.floor(diffHours / 24) > 1 ? "s" : ""} ago`;
  }

  // Get active requests from SOS context for this hospital
  const activeRequests = useMemo(() => {
    const requests = getRequestsByHospital(hospital.name);
    if (requests.length === 0) {
      // Show sample data if no requests
      return [
        {
          id: "sample-1",
          patientName: "Sample Patient",
          bloodType: "O-",
          units: 3,
          urgency: "critical" as const,
          status: "searching" as const,
          matchedDonors: 5,
          confirmedDonors: 2,
          createdAt: "Demo data",
        },
      ];
    }
    return requests.map((req) => ({
      id: req.id,
      patientName: req.patientName,
      bloodType: req.bloodType,
      units: req.units,
      urgency: req.urgency,
      status: req.status,
      matchedDonors: req.matchedDonors,
      confirmedDonors: req.confirmedDonors,
      createdAt: getTimeAgo(req.createdAt),
    }));
  }, [getRequestsByHospital, hospital.name]);

  const confirmedDonors = [
    { id: 1, name: "John D.", bloodType: "O-", distance: "2.1 km", eta: "15 min", phone: "+1 555-0123" },
    { id: 2, name: "Sarah M.", bloodType: "O-", distance: "3.5 km", eta: "20 min", phone: "+1 555-0456" },
    { id: 3, name: "Mike R.", bloodType: "A+", distance: "1.8 km", eta: "12 min", phone: "+1 555-0789" },
  ];

  const donationRecords = [
    { id: 1, donor: "John D.", bloodType: "O-", units: 1, date: "2024-01-10", status: "completed" },
    { id: 2, donor: "Sarah M.", bloodType: "O-", units: 1, date: "2024-01-09", status: "completed" },
    { id: 3, donor: "Mike R.", bloodType: "A+", units: 1, date: "2024-01-08", status: "completed" },
  ];

  const handleLogout = () => {
    logout();
    toast.success("Signed out");
    navigate("/login");
  };

  const renderTab = () => {
    switch (activeTab) {
      case "create":
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-display font-bold">Create Blood Request</h2>
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Emergency SOS Request
                </CardTitle>
                <CardDescription>This will notify nearby eligible donors instantly.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center py-8">
                <p className="text-muted-foreground mb-6 text-center">
                  Click the button below to create a new SOS blood request with patient details.
                </p>
                <SOSRequestDialog
                  trigger={
                    <Button variant="sos" size="lg">
                      <AlertTriangle className="h-5 w-5" />
                      Create SOS Request
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          </div>
        );

      case "requests":
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-display font-bold">Active SOS Requests</h2>
            <Card className="shadow-card">
              <CardContent className="p-6 space-y-4">
                {activeRequests.map((request) => (
                  <div key={request.id} className="p-4 rounded-xl border border-border">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-crimson flex items-center justify-center">
                          <span className="text-lg font-bold text-primary-foreground">{request.bloodType}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold">{request.patientName}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {request.units} unit(s) needed • {request.createdAt}
                          </p>
                        </div>
                      </div>
                      <Badge className={request.urgency === "critical" ? "bg-destructive" : request.urgency === "high" ? "bg-warning" : "bg-info"}>
                        {request.urgency.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">{request.matchedDonors} matched</span>
                      <span className="text-success">{request.confirmedDonors} confirmed</span>
                      <Badge variant="outline" className="ml-auto">{request.status.replace("_", " ")}</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        );

      case "responses":
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-display font-bold">Donor Responses</h2>
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-success" /> Confirmed Donors
                </CardTitle>
                <CardDescription>Donors en route to your hospital</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {confirmedDonors.map((donor) => (
                  <div key={donor.id} className="p-4 rounded-xl border border-border bg-success/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-crimson flex items-center justify-center">
                          <span className="text-sm font-bold text-primary-foreground">{donor.bloodType}</span>
                        </div>
                        <div>
                          <p className="font-semibold">{donor.name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" /> {donor.distance}
                            <Clock className="h-3 w-3 ml-1" /> ETA: {donor.eta}
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Phone className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        );

      case "records":
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-display font-bold">Donation Records</h2>
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Recent Donations</CardTitle>
                <CardDescription>Track donations received for requests.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {donationRecords.map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-4 rounded-xl bg-secondary/40">
                    <div>
                      <p className="font-semibold">{r.donor}</p>
                      <p className="text-sm text-muted-foreground">{r.date}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{r.bloodType}</Badge>
                      <Badge variant="outline">{r.units} unit</Badge>
                      <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                        <CheckCircle className="h-3 w-3 mr-1" /> {r.status}
                      </Badge>
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
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" /> Hospital Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Hospital Name</Label>
                    <Input value={hospital.name} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>License</Label>
                    <Input value={hospital.license} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={hospital.email} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input value={hospital.phone} disabled />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" /> Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {["Donor Acceptances", "Request Updates", "Daily Summary"].map((label) => (
                    <div key={label} className="flex items-center justify-between p-3 rounded-lg bg-secondary/40">
                      <span className="font-medium">{label}</span>
                      <Button variant="outline" size="sm">Toggle</Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: FileText, label: "Total Requests", value: hospital.totalRequests, color: "text-primary" },
                { icon: CheckCircle, label: "Fulfilled", value: hospital.fulfilledRequests, color: "text-success" },
                { icon: Clock, label: "Pending", value: hospital.pendingRequests, color: "text-warning" },
                { icon: TrendingUp, label: "Avg Response", value: hospital.avgResponseTime, color: "text-info" },
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
              <Card className="shadow-card">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-primary" /> Active Blood Requests
                    </CardTitle>
                    <CardDescription>Current SOS requests</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {activeRequests.map((request) => (
                    <div key={request.id} className="p-4 rounded-xl border border-border">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-crimson flex items-center justify-center">
                            <span className="text-sm font-bold text-primary-foreground">{request.bloodType}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <User className="h-3 w-3 text-muted-foreground" />
                              <span className="font-semibold text-sm">{request.patientName}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{request.units} unit(s) • {request.createdAt}</p>
                          </div>
                        </div>
                        <Badge className={request.urgency === "critical" ? "bg-destructive" : request.urgency === "high" ? "bg-warning" : "bg-info"}>
                          {request.urgency.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
                        <span>{request.matchedDonors} matched</span>
                        <span>•</span>
                        <span className="text-success">{request.confirmedDonors} confirmed</span>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full" onClick={() => setActiveTab("requests")}
                  >
                    View All Requests
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-success" /> Confirmed Donors
                  </CardTitle>
                  <CardDescription>Donors currently responding</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {confirmedDonors.map((donor) => (
                    <div key={donor.id} className="p-3 rounded-xl border border-border bg-success/5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-crimson flex items-center justify-center">
                            <span className="text-sm font-bold text-primary-foreground">{donor.bloodType}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{donor.name}</p>
                            <p className="text-xs text-muted-foreground">ETA {donor.eta}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Phone className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full" onClick={() => setActiveTab("responses")}
                  >
                    View All Responses
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        );
    }
  };

  const nav = [
    { icon: TrendingUp, label: "Overview", id: "overview" as const },
    { icon: AlertTriangle, label: "Create SOS", id: "create" as const },
    { icon: FileText, label: "Active Requests", id: "requests" as const },
    { icon: Users, label: "Donor Responses", id: "responses" as const },
    { icon: Droplets, label: "Donation Records", id: "records" as const },
    { icon: Settings, label: "Settings", id: "settings" as const },
  ];

  return (
    <div className="min-h-screen bg-gradient-mesh">
      <aside className="fixed left-0 top-0 bottom-0 w-64 glass-strong p-6 hidden lg:flex flex-col">
        <Link to="/" className="flex items-center gap-2 mb-8">
          <Heart className="h-8 w-8 text-primary fill-primary" />
          <span className="text-xl font-display font-bold">
            Crimson<span className="text-primary">Care</span>
          </span>
        </Link>

        <div className="p-4 rounded-xl bg-gradient-crimson-light border border-primary/20 mb-6">
          <p className="text-xs text-muted-foreground">Hospital</p>
          <p className="font-semibold">{hospital.name}</p>
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

      <main className="lg:ml-64 p-6 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold">{hospital.name}</h1>
            <p className="text-muted-foreground">Hospital Dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setActiveTab("responses")}>
              <Bell className="h-4 w-4" />
            </Button>

            <SOSRequestDialog
              trigger={
                <Button variant="sos" size="lg">
                  <AlertTriangle className="h-5 w-5" />
                  Create SOS Request
                </Button>
              }
            />
          </div>
        </div>

        {renderTab()}
      </main>
    </div>
  );
};

export default HospitalDashboard;
