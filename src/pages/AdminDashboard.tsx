import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Heart,
  Users,
  Building2,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Download,
  Settings,
  LogOut,
  BarChart3,
  Clock,
  Activity,
  Shield,
} from "lucide-react";
import { toast } from "sonner";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");

  // Mock admin data
  const stats = {
    totalDonors: 52340,
    totalHospitals: 156,
    totalDonations: 28750,
    activeSOSRequests: 23,
    avgResponseTime: "24 min",
    matchAccuracy: "94.5%",
    donorRetention: "78%",
  };

  const pendingHospitals = [
    { id: 1, name: "Metro Health Center", license: "MHC-2024-001", submittedAt: "2 days ago", contact: "admin@metrohealth.com" },
    { id: 2, name: "Valley Medical", license: "VM-2024-015", submittedAt: "3 days ago", contact: "info@valleymed.com" },
    { id: 3, name: "Sunrise Hospital", license: "SH-2024-008", submittedAt: "5 days ago", contact: "reg@sunrise.com" },
  ];

  const recentActivity = [
    { type: "sos", message: "Critical SOS fulfilled - O- blood to City General", time: "5 min ago" },
    { type: "donor", message: "New donor registered: John D. (O+)", time: "12 min ago" },
    { type: "hospital", message: "St. Mary's Hospital verified", time: "1 hour ago" },
    { type: "sos", message: "SOS request created by Metro Health", time: "2 hours ago" },
    { type: "donation", message: "Donation recorded: Sarah M. at Blood Bank Central", time: "3 hours ago" },
  ];

  const handleVerifyHospital = (id: number) => {
    toast.success("Hospital verified successfully!");
  };

  const handleRejectHospital = (id: number) => {
    toast.error("Hospital registration rejected");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border p-6 hidden lg:block">
        <Link to="/" className="flex items-center gap-2 mb-8">
          <Heart className="h-8 w-8 text-primary fill-primary" />
          <span className="text-xl font-display font-bold">
            Crimson<span className="text-primary">Care</span>
          </span>
        </Link>

        <div className="mb-6 px-4 py-2 rounded-lg bg-accent">
          <p className="text-xs text-muted-foreground">Logged in as</p>
          <p className="font-semibold text-accent-foreground">System Admin</p>
        </div>

        <nav className="space-y-2">
          {[
            { icon: TrendingUp, label: "Dashboard", id: "overview" },
            { icon: Users, label: "User Management", id: "users" },
            { icon: Building2, label: "Hospital Verification", id: "hospitals" },
            { icon: BarChart3, label: "Analytics", id: "analytics" },
            { icon: Activity, label: "System Logs", id: "logs" },
            { icon: Settings, label: "Settings", id: "settings" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
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

        <div className="absolute bottom-6 left-6 right-6">
          <Button variant="ghost" className="w-full justify-start text-muted-foreground">
            <LogOut className="h-5 w-5 mr-3" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground">System overview and management</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Users, label: "Total Donors", value: stats.totalDonors.toLocaleString(), color: "text-primary", change: "+12%" },
            { icon: Building2, label: "Hospitals", value: stats.totalHospitals, color: "text-info", change: "+3" },
            { icon: Heart, label: "Total Donations", value: stats.totalDonations.toLocaleString(), color: "text-success", change: "+8%" },
            { icon: AlertTriangle, label: "Active SOS", value: stats.activeSOSRequests, color: "text-warning", change: "-5" },
          ].map((stat, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-secondary ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <Badge variant="outline" className="text-success">
                    {stat.change}
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { icon: Clock, label: "Avg Response Time", value: stats.avgResponseTime, description: "Time to first donor match" },
            { icon: Activity, label: "Match Accuracy", value: stats.matchAccuracy, description: "Successful donor-patient matches" },
            { icon: TrendingUp, label: "Donor Retention", value: stats.donorRetention, description: "Donors with repeat donations" },
          ].map((metric, i) => (
            <Card key={i} className="bg-gradient-card">
              <CardContent className="p-6 text-center">
                <metric.icon className="h-8 w-8 text-primary mx-auto mb-3" />
                <p className="text-3xl font-bold text-foreground mb-1">{metric.value}</p>
                <p className="font-medium text-foreground">{metric.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Pending Hospital Verifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-warning" />
                Pending Hospital Verifications
              </CardTitle>
              <CardDescription>Review and verify hospital registrations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingHospitals.map((hospital) => (
                <div
                  key={hospital.id}
                  className="p-4 rounded-xl border border-border"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-foreground">{hospital.name}</p>
                      <p className="text-sm text-muted-foreground">License: {hospital.license}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Submitted {hospital.submittedAt}
                      </p>
                    </div>
                    <Badge variant="outline">Pending</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="success"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleVerifyHospital(hospital.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Verify
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleRejectHospital(hospital.id)}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-info" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest system events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div
                      className={`w-2 h-2 rounded-full mt-2 ${
                        activity.type === "sos"
                          ? "bg-destructive"
                          : activity.type === "donor"
                          ? "bg-success"
                          : activity.type === "hospital"
                          ? "bg-info"
                          : "bg-primary"
                      }`}
                    />
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                View All Activity
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
