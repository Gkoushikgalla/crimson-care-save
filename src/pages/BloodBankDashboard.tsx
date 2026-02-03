import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
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
  Phone,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useSOS } from "@/contexts/SOSContext";
import { useDonation } from "@/contexts/DonationContext";

const BloodBankDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { getActiveRequests } = useSOS();
  const { donations, getDonationsByBloodBank, completeDonation } = useDonation();
  const [activeTab, setActiveTab] = useState("overview");

  const bloodBankName = user?.bloodBankName || "Central Blood Bank";

  // Get active SOS requests - blood banks see ALL requests
  const activeSOSRequests = useMemo(() => {
    const requests = getActiveRequests();
    console.log(`[BloodBankDashboard] Found ${requests.length} active SOS requests`);
    return requests.slice(0, 5);
  }, [getActiveRequests]);

  // Get donations for this blood bank
  const bloodBankDonations = useMemo(() => {
    return getDonationsByBloodBank(bloodBankName);
  }, [getDonationsByBloodBank, bloodBankName]);

  function getTimeAgo(dateString: string): string {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hr ago`;
    return `${Math.floor(diffHours / 24)} day${Math.floor(diffHours / 24) > 1 ? "s" : ""} ago`;
  }

  // Blood inventory data - will be populated from real data
  const inventory = [
    { type: "A+", units: 0, maxCapacity: 100, status: "low" },
    { type: "A-", units: 0, maxCapacity: 50, status: "low" },
    { type: "B+", units: 0, maxCapacity: 80, status: "low" },
    { type: "B-", units: 0, maxCapacity: 40, status: "low" },
    { type: "O+", units: 0, maxCapacity: 120, status: "low" },
    { type: "O-", units: 0, maxCapacity: 60, status: "low" },
    { type: "AB+", units: 0, maxCapacity: 50, status: "low" },
    { type: "AB-", units: 0, maxCapacity: 30, status: "low" },
  ];

  const recentTransactions: { id: number; type: string; bloodType: string; units: number; source?: string; destination?: string; date: string }[] = [];

  const stats = {
    totalUnits: 207,
    weeklyDonations: 34,
    weeklyDistributions: 28,
    pendingRequests: activeSOSRequests.length,
  };

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

  const navItems = [
    { icon: TrendingUp, label: "Overview", id: "overview" },
    { icon: AlertTriangle, label: "SOS Alerts", id: "sos" },
    { icon: Package, label: "Inventory", id: "inventory" },
    { icon: BarChart3, label: "Transactions", id: "transactions" },
    { icon: Droplets, label: "Donations", id: "donations" },
    { icon: Calendar, label: "Drives", id: "drives" },
    { icon: Settings, label: "Settings", id: "settings" },
  ];

  const handleMarkDonationComplete = (donationId: string) => {
    completeDonation(donationId);
    toast.success("Donation marked as complete!");
  };

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
                {bloodBankDonations.length === 0 && donations.length === 0 ? (
                  <div className="text-center py-8">
                    <Droplets className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No donations recorded yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(bloodBankDonations.length > 0 ? bloodBankDonations : donations).slice(0, 10).map((donation) => (
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
              <Button variant="hero">
                <Plus className="h-4 w-4 mr-2" /> Add Stock
              </Button>
            </div>

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
                        value={(item.units / item.maxCapacity) * 100} 
                        className={`h-2 ${item.status === "critical" ? "bg-destructive/20" : item.status === "low" ? "bg-warning/20" : ""}`}
                      />
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Low Stock Alerts */}
            <Card className="shadow-card border-warning/50 bg-warning/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-warning">
                  <AlertTriangle className="h-5 w-5" />
                  Low Stock Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {inventory.filter(i => i.status !== "good").map((item) => (
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
                      <Button variant="outline" size="sm">Request Donors</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "transactions":
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-display font-bold">Recent Transactions</h2>

            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {recentTransactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${tx.type === "in" ? "bg-success/20" : "bg-primary/20"}`}>
                          {tx.type === "in" ? (
                            <TrendingUp className="h-6 w-6 text-success" />
                          ) : (
                            <TrendingDown className="h-6 w-6 text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold">
                            {tx.type === "in" ? `Received from ${tx.source}` : `Sent to ${tx.destination}`}
                          </p>
                          <p className="text-sm text-muted-foreground">{tx.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">{tx.bloodType}</Badge>
                        <p className={`text-sm font-medium mt-1 ${tx.type === "in" ? "text-success" : "text-primary"}`}>
                          {tx.type === "in" ? "+" : "-"}{tx.units} units
                        </p>
                      </div>
                    </div>
                  ))}
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
              <Button variant="hero">
                <Plus className="h-4 w-4 mr-2" /> Schedule Drive
              </Button>
            </div>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Upcoming Drives</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No upcoming drives scheduled</p>
                  <Button variant="hero" className="mt-4">
                    <Plus className="h-4 w-4 mr-2" /> Schedule Your First Drive
                  </Button>
                </div>
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
                    <Input value={bloodBankName} disabled />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">License Number</label>
                    <Input value={user?.licenseNumber || "BB-2024-001"} disabled />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Contact Email</label>
                    <Input value={user?.email} disabled />
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

      default: // overview
        return (
          <div className="space-y-6 animate-fade-in">
            {/* Stats Grid */}
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

            {/* Inventory Overview */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Droplets className="h-5 w-5 text-primary" />
                  Blood Inventory Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentTransactions.slice(0, 3).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tx.type === "in" ? "bg-success/20" : "bg-primary/20"}`}>
                        {tx.type === "in" ? (
                          <TrendingUp className="h-4 w-4 text-success" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {tx.type === "in" ? tx.source : tx.destination}
                        </p>
                        <p className="text-xs text-muted-foreground">{tx.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-xs">{tx.bloodType}</Badge>
                      <p className={`text-xs font-medium ${tx.type === "in" ? "text-success" : "text-primary"}`}>
                        {tx.type === "in" ? "+" : "-"}{tx.units}
                      </p>
                    </div>
                  </div>
                ))}
                <Button variant="ghost" className="w-full" onClick={() => setActiveTab("transactions")}>
                  View All Transactions
                </Button>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-mesh">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 glass-strong p-6 hidden lg:flex flex-col z-50">
        <Link to="/" className="flex items-center gap-2 mb-8 group">
          <Heart className="h-8 w-8 text-primary fill-primary group-hover:scale-110 transition-transform" />
          <span className="text-xl font-display font-bold">
            Crimson<span className="text-primary">Care</span>
          </span>
        </Link>

        {/* Blood Bank Info */}
        <div className="p-4 rounded-xl bg-gradient-crimson-light border border-primary/20 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-crimson flex items-center justify-center">
              <Warehouse className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="font-semibold text-sm truncate">{bloodBankName}</p>
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

      {/* Main Content */}
      <main className="lg:ml-64 p-4 lg:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold">{bloodBankName}</h1>
            <p className="text-muted-foreground">Blood Bank Dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-warning rounded-full text-[10px] text-white flex items-center justify-center">
                2
              </span>
            </Button>
          </div>
        </div>

        {renderContent()}
      </main>

      {/* Mobile Navigation */}
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
  );
};

export default BloodBankDashboard;
