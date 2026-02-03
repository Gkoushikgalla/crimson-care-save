import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Heart,
  Droplets,
  Warehouse,
  AlertTriangle,
  Bell,
  Package,
  Clock,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Settings,
  LogOut,
  BarChart3,
  Calendar,
  Plus,
  Minus,
  User,
  MapPin,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useSOS } from "@/contexts/SOSContext";
import { useDonation } from "@/contexts/DonationContext";
import { useBloodBank, type BloodDrive } from "@/contexts/BloodBankContext";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] as const;

const BloodBankDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { getActiveRequests } = useSOS();
  const { donations, getDonationsByBloodBank, completeDonation } = useDonation();
  const {
    inventory,
    drives,
    isLoading: bloodBankLoading,
    addUnits,
    removeUnits,
    addDrive,
    removeDrive,
  } = useBloodBank();
  const [activeTab, setActiveTab] = useState("overview");

  const bloodBankName = user?.bloodBankName ?? "";

  const activeSOSRequests = useMemo(() => {
    return getActiveRequests().slice(0, 5);
  }, [getActiveRequests]);

  const bloodBankDonations = useMemo(() => {
    return getDonationsByBloodBank(bloodBankName);
  }, [getDonationsByBloodBank, bloodBankName]);

  const totalUnits = useMemo(() => inventory.reduce((s, i) => s + i.units, 0), [inventory]);
  const completedThisWeek = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return bloodBankDonations.filter(
      (d) => d.status === "completed" && new Date(d.completedAt ?? d.donatedAt) >= weekAgo
    ).length;
  }, [bloodBankDonations]);

  const stats = {
    totalUnits,
    weeklyDonations: completedThisWeek,
    weeklyDistributions: 0,
    pendingRequests: activeSOSRequests.length,
  };

  const [addStockOpen, setAddStockOpen] = useState(false);
  const [addStockType, setAddStockType] = useState<string>(BLOOD_TYPES[0]);
  const [addStockUnits, setAddStockUnits] = useState("1");

  const [scheduleDriveOpen, setScheduleDriveOpen] = useState(false);
  const [driveDate, setDriveDate] = useState("");
  const [driveVenue, setDriveVenue] = useState("");
  const [driveDescription, setDriveDescription] = useState("");

  function getTimeAgo(dateString: string): string {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hr ago`;
    return `${Math.floor(diffHours / 24)} day${Math.floor(diffHours / 24) > 1 ? "s" : ""} ago`;
  }

  const handleLogout = () => {
    logout();
    navigate("/");
    toast.success("Logged out successfully");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "critical": return "text-destructive bg-destructive/10";
      case "low": return "text-warning bg-warning/10";
      default: return "text-success bg-success/10";
    }
  };

  const handleAddStock = async () => {
    const u = parseInt(addStockUnits, 10);
    if (isNaN(u) || u < 1) {
      toast.error("Enter a valid number of units");
      return;
    }
    await addUnits(addStockType, u);
    toast.success(`Added ${u} unit(s) of ${addStockType}`);
    setAddStockOpen(false);
    setAddStockType(BLOOD_TYPES[0]);
    setAddStockUnits("1");
  };

  const handleScheduleDrive = async () => {
    if (!driveDate || !driveVenue.trim()) {
      toast.error("Date and venue are required");
      return;
    }
    await addDrive({
      date: driveDate,
      venue: driveVenue.trim(),
      description: driveDescription.trim(),
    });
    toast.success("Drive scheduled");
    setScheduleDriveOpen(false);
    setDriveDate("");
    setDriveVenue("");
    setDriveDescription("");
  };

  const handleMarkDonationComplete = (donationId: string) => {
    completeDonation(donationId);
    toast.success("Donation marked as complete!");
  };

  const navItems = [
    { icon: TrendingUp, label: "Overview", id: "overview" },
    { icon: AlertTriangle, label: "SOS Alerts", id: "sos" },
    { icon: Package, label: "Inventory", id: "inventory" },
    { icon: BarChart3, label: "Transactions", id: "transactions" },
    { icon: Droplets, label: "Donations", id: "donations" },
    { icon: Calendar, label: "Drives", id: "drives" },
    { icon: Settings, label: "Settings", id: "settings" },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "sos":
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-display font-bold">Active SOS Alerts</h2>
              <Badge variant="destructive" className="animate-pulse">
                {activeSOSRequests.length} Active
              </Badge>
            </div>
            <Card className="shadow-card">
              <CardContent className="p-6 space-y-4">
                {activeSOSRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No active SOS requests</p>
                  </div>
                ) : (
                  activeSOSRequests.map((request) => (
                    <div key={request.id} className="p-4 rounded-xl border border-border hover:border-primary/30 transition-colors">
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
                              {request.units} unit(s) • {request.hospitalName}
                            </p>
                          </div>
                        </div>
                        <Badge className={request.urgency === "critical" ? "bg-destructive" : request.urgency === "high" ? "bg-warning" : "bg-info"}>
                          {request.urgency.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{request.matchedDonors} matched</span>
                          <span className="text-success">{request.confirmedDonors} confirmed</span>
                          <span>{getTimeAgo(request.createdAt)}</span>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => navigate(`/sos/${request.id}`)}>
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        );

      case "donations":
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-display font-bold">Donation Records</h2>
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Recent Donations</CardTitle>
                <CardDescription>Track all donations received</CardDescription>
              </CardHeader>
              <CardContent>
                {bloodBankDonations.length === 0 ? (
                  <div className="text-center py-8">
                    <Droplets className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No donations recorded yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bloodBankDonations.slice(0, 10).map((donation) => (
                      <div key={donation.id} className="flex items-center justify-between p-4 rounded-xl border border-border">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-crimson flex items-center justify-center">
                            <span className="text-sm font-bold text-primary-foreground">{donation.bloodType}</span>
                          </div>
                          <div>
                            <p className="font-semibold">{donation.donorName}</p>
                            <p className="text-sm text-muted-foreground">
                              For: {donation.patientName} • {donation.hospitalName}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{donation.units} unit</Badge>
                          {donation.status === "completed" ? (
                            <Badge className="bg-success/10 text-success border-success/30">
                              <CheckCircle className="h-3 w-3 mr-1" /> Completed
                            </Badge>
                          ) : donation.status === "pending" ? (
                            <Button variant="hero" size="sm" onClick={() => handleMarkDonationComplete(donation.id)}>
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
          </div>
        );

      case "inventory":
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-display font-bold">Blood Inventory</h2>
              <Button variant="hero" onClick={() => setAddStockOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Add Stock
              </Button>
            </div>
            {bloodBankLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {inventory.map((item) => (
                    <Card key={item.type} className="shadow-card">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-14 h-14 rounded-xl bg-gradient-crimson flex items-center justify-center">
                            <span className="text-lg font-bold text-primary-foreground">{item.type}</span>
                          </div>
                          <Badge className={getStatusColor(item.status)}>
                            {item.status.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold">{item.units}</span>
                            <span className="text-sm text-muted-foreground">/ {item.maxCapacity} units</span>
                          </div>
                          <Progress
                            value={item.maxCapacity > 0 ? (item.units / item.maxCapacity) * 100 : 0}
                            className={`h-2 ${item.status === "critical" ? "bg-destructive/20" : item.status === "low" ? "bg-warning/20" : ""}`}
                          />
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => addUnits(item.type, 1)}
                            disabled={item.units >= item.maxCapacity}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => removeUnits(item.type, 1)}
                            disabled={item.units <= 0}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {inventory.some((i) => i.status !== "good") && (
                  <Card className="shadow-card border-warning/50 bg-warning/5">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-warning">
                        <AlertTriangle className="h-5 w-5" />
                        Low Stock Alerts
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-4">
                        {inventory.filter((i) => i.status !== "good").map((item) => (
                          <div key={item.type} className="flex items-center justify-between p-3 rounded-lg bg-background">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.status === "critical" ? "bg-destructive" : "bg-warning"}`}>
                                <span className="font-bold text-primary-foreground">{item.type}</span>
                              </div>
                              <div>
                                <p className="font-medium">{item.type} Blood</p>
                                <p className="text-sm text-muted-foreground">{item.units} units remaining</p>
                              </div>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setAddStockOpen(true)}>
                              Add Stock
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        );

      case "transactions":
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-display font-bold">Recent Transactions</h2>
            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="text-center py-8 text-muted-foreground">
                  No transactions yet. Transactions will appear when stock is added or distributed.
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "drives":
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-display font-bold">Blood Donation Drives</h2>
              <Button variant="hero" onClick={() => setScheduleDriveOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Schedule Drive
              </Button>
            </div>
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Upcoming Drives</CardTitle>
                <CardDescription>Manage your scheduled donation drives</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {drives.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No upcoming drives scheduled</p>
                    <Button variant="hero" className="mt-4" onClick={() => setScheduleDriveOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" /> Schedule Your First Drive
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {drives.map((drive) => (
                      <div
                        key={drive.id}
                        className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-primary/30"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Calendar className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold">{drive.venue}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(drive.date).toLocaleDateString()} {drive.description ? "• " + drive.description : ""}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeDrive(drive.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
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
                    <Warehouse className="h-5 w-5 text-primary" />
                    Blood Bank Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Blood Bank Name</label>
                    <Input value={bloodBankName} disabled placeholder="Set when you register" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">License Number</label>
                    <Input value={user?.licenseNumber ?? ""} disabled placeholder="—" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Contact Email</label>
                    <Input value={user?.email ?? ""} disabled />
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    Alert Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: "Low Stock Alerts", description: "Notify when stock falls below threshold", enabled: true },
                    { label: "Expiry Warnings", description: "Alert before blood units expire", enabled: true },
                    { label: "Request Notifications", description: "Notify for hospital requests", enabled: true },
                  ].map((setting, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50">
                      <div>
                        <p className="font-medium">{setting.label}</p>
                        <p className="text-sm text-muted-foreground">{setting.description}</p>
                      </div>
                      <Button variant={setting.enabled ? "hero" : "outline"} size="sm">
                        {setting.enabled ? "On" : "Off"}
                      </Button>
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
                { icon: Package, label: "Total Units", value: stats.totalUnits, color: "text-primary", bg: "bg-primary/10" },
                { icon: TrendingUp, label: "Weekly Donations", value: stats.weeklyDonations, color: "text-success", bg: "bg-success/10" },
                { icon: TrendingDown, label: "Weekly Distributions", value: stats.weeklyDistributions, color: "text-info", bg: "bg-info/10" },
                { icon: Clock, label: "Pending Requests", value: stats.pendingRequests, color: "text-warning", bg: "bg-warning/10" },
              ].map((stat, i) => (
                <Card key={i} className="shadow-card hover:shadow-lg transition-shadow">
                  <CardContent className="p-5">
                    <div className={`p-3 rounded-xl ${stat.bg} w-fit mb-3`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Droplets className="h-5 w-5 text-primary" />
                  Blood Inventory Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bloodBankLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {inventory.map((item) => (
                        <div key={item.type} className="p-4 rounded-xl border border-border text-center">
                          <div className="w-12 h-12 rounded-xl bg-gradient-crimson flex items-center justify-center mx-auto mb-2">
                            <span className="font-bold text-primary-foreground">{item.type}</span>
                          </div>
                          <p className="text-xl font-bold">{item.units}</p>
                          <p className="text-xs text-muted-foreground">units</p>
                          <Badge className={`mt-2 ${getStatusColor(item.status)}`} variant="outline">
                            {item.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                    <Button variant="ghost" className="w-full mt-4" onClick={() => setActiveTab("inventory")}>
                      View Full Inventory
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-mesh">
        <aside className="fixed left-0 top-0 bottom-0 w-64 glass-strong p-6 hidden lg:flex flex-col z-50">
          <Link to="/" className="flex items-center gap-2 mb-8 group">
            <Heart className="h-8 w-8 text-primary fill-primary group-hover:scale-110 transition-transform" />
            <span className="text-xl font-display font-bold">
              Crimson<span className="text-primary">Care</span>
            </span>
          </Link>
          <div className="p-4 rounded-xl bg-gradient-crimson-light border border-primary/20 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-crimson flex items-center justify-center">
                <Warehouse className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <p className="font-semibold text-sm truncate">{bloodBankName || "Blood Bank"}</p>
                <p className="text-xs text-muted-foreground">Blood Bank</p>
              </div>
            </div>
          </div>
          <nav className="space-y-1 flex-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === item.id
                    ? "bg-gradient-crimson text-primary-foreground shadow-crimson"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </button>
            ))}
          </nav>
          <Button variant="ghost" className="justify-start text-muted-foreground mt-auto" onClick={handleLogout}>
            <LogOut className="h-5 w-5 mr-3" />
            Sign Out
          </Button>
        </aside>

        <main className="lg:ml-64 p-4 lg:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-bold">{bloodBankName || "Blood Bank Dashboard"}</h1>
              <p className="text-muted-foreground">Blood Bank Dashboard</p>
            </div>
          </div>
          {renderContent()}
        </main>

        <nav className="lg:hidden fixed bottom-0 left-0 right-0 glass-strong border-t border-border p-2 z-50">
          <div className="flex justify-around">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                  activeTab === item.id ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px]">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>

      {/* Add Stock Dialog */}
      <Dialog open={addStockOpen} onOpenChange={setAddStockOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Blood Stock</DialogTitle>
            <DialogDescription>Add units to your inventory by blood type.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Blood Type</Label>
              <Select value={addStockType} onValueChange={setAddStockType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BLOOD_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Units to add</Label>
              <Input
                type="number"
                min={1}
                value={addStockUnits}
                onChange={(e) => setAddStockUnits(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setAddStockOpen(false)}>Cancel</Button>
            <Button variant="hero" onClick={handleAddStock}>Add Stock</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedule Drive Dialog */}
      <Dialog open={scheduleDriveOpen} onOpenChange={setScheduleDriveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Donation Drive</DialogTitle>
            <DialogDescription>Add an upcoming blood donation drive.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={driveDate}
                onChange={(e) => setDriveDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="space-y-2">
              <Label>Venue / Location *</Label>
              <Input
                placeholder="e.g. Community Hall, City Center"
                value={driveVenue}
                onChange={(e) => setDriveVenue(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea
                placeholder="Additional details..."
                rows={2}
                value={driveDescription}
                onChange={(e) => setDriveDescription(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setScheduleDriveOpen(false)}>Cancel</Button>
            <Button variant="hero" onClick={handleScheduleDrive}>Schedule Drive</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BloodBankDashboard;
