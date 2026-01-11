import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Heart,
  Droplets,
  Building2,
  AlertTriangle,
  Bell,
  Users,
  Clock,
  CheckCircle,
  Plus,
  Search,
  Filter,
  Settings,
  LogOut,
  FileText,
  TrendingUp,
  MapPin,
  Phone,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const HospitalDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [isCreatingRequest, setIsCreatingRequest] = useState(false);
  const [newRequest, setNewRequest] = useState({
    bloodType: "",
    units: "",
    urgency: "",
    notes: "",
  });

  // Mock hospital data
  const hospital = {
    name: "City General Hospital",
    totalRequests: 45,
    fulfilledRequests: 38,
    pendingRequests: 7,
    avgResponseTime: "28 min",
  };

  const activeRequests = [
    {
      id: 1,
      bloodType: "O-",
      units: 3,
      urgency: "critical",
      status: "searching",
      matchedDonors: 5,
      confirmedDonors: 2,
      createdAt: "10 min ago",
    },
    {
      id: 2,
      bloodType: "A+",
      units: 2,
      urgency: "high",
      status: "in_progress",
      matchedDonors: 8,
      confirmedDonors: 2,
      createdAt: "45 min ago",
    },
    {
      id: 3,
      bloodType: "B+",
      units: 1,
      urgency: "moderate",
      status: "fulfilled",
      matchedDonors: 3,
      confirmedDonors: 1,
      createdAt: "2 hours ago",
    },
  ];

  const confirmedDonors = [
    { id: 1, name: "John D.", bloodType: "O-", distance: "2.1 km", eta: "15 min", phone: "+1 555-0123" },
    { id: 2, name: "Sarah M.", bloodType: "O-", distance: "3.5 km", eta: "20 min", phone: "+1 555-0456" },
    { id: 3, name: "Mike R.", bloodType: "A+", distance: "1.8 km", eta: "12 min", phone: "+1 555-0789" },
  ];

  const handleCreateRequest = () => {
    if (!newRequest.bloodType || !newRequest.units || !newRequest.urgency) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    toast.success("SOS Alert sent! Matching donors are being notified.");
    setIsCreatingRequest(false);
    setNewRequest({ bloodType: "", units: "", urgency: "", notes: "" });
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

        <nav className="space-y-2">
          {[
            { icon: TrendingUp, label: "Overview", id: "overview" },
            { icon: AlertTriangle, label: "Create SOS", id: "create" },
            { icon: FileText, label: "Active Requests", id: "requests" },
            { icon: Users, label: "Donor Responses", id: "responses" },
            { icon: Droplets, label: "Donation Records", id: "records" },
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
              {hospital.name}
            </h1>
            <p className="text-muted-foreground">Hospital Dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Bell className="h-4 w-4" />
            </Button>
            <Dialog open={isCreatingRequest} onOpenChange={setIsCreatingRequest}>
              <DialogTrigger asChild>
                <Button variant="sos" size="lg">
                  <AlertTriangle className="h-5 w-5" />
                  Create SOS Request
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    Emergency Blood Request
                  </DialogTitle>
                  <DialogDescription>
                    This will send instant notifications to all matching donors in your area.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Blood Type Required *</Label>
                    <Select
                      value={newRequest.bloodType}
                      onValueChange={(value) => setNewRequest({ ...newRequest, bloodType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select blood type" />
                      </SelectTrigger>
                      <SelectContent>
                        {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Units Required *</Label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="Number of units"
                      value={newRequest.units}
                      onChange={(e) => setNewRequest({ ...newRequest, units: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Urgency Level *</Label>
                    <Select
                      value={newRequest.urgency}
                      onValueChange={(value) => setNewRequest({ ...newRequest, urgency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select urgency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="critical">🔴 Critical (Immediate)</SelectItem>
                        <SelectItem value="high">🟠 High (Within 2 hours)</SelectItem>
                        <SelectItem value="moderate">🟡 Moderate (Within 6 hours)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Additional Notes</Label>
                    <Input
                      placeholder="Any specific requirements..."
                      value={newRequest.notes}
                      onChange={(e) => setNewRequest({ ...newRequest, notes: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setIsCreatingRequest(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button variant="sos" onClick={handleCreateRequest} className="flex-1">
                    Send SOS Alert
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: FileText, label: "Total Requests", value: hospital.totalRequests, color: "text-primary" },
            { icon: CheckCircle, label: "Fulfilled", value: hospital.fulfilledRequests, color: "text-success" },
            { icon: Clock, label: "Pending", value: hospital.pendingRequests, color: "text-warning" },
            { icon: TrendingUp, label: "Avg Response", value: hospital.avgResponseTime, color: "text-info" },
          ].map((stat, i) => (
            <Card key={i}>
              <CardContent className="flex items-center gap-4 p-6">
                <div className={`p-3 rounded-xl bg-secondary ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Active Requests */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-primary" />
                  Active Blood Requests
                </CardTitle>
                <CardDescription>Current emergency requests</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeRequests.map((request) => (
                <div
                  key={request.id}
                  className="p-4 rounded-xl border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-crimson flex items-center justify-center">
                        <span className="text-lg font-bold text-primary-foreground">
                          {request.bloodType}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">
                          {request.units} unit{request.units > 1 ? "s" : ""} needed
                        </p>
                        <p className="text-sm text-muted-foreground">{request.createdAt}</p>
                      </div>
                    </div>
                    <Badge
                      className={
                        request.urgency === "critical"
                          ? "bg-destructive"
                          : request.urgency === "high"
                          ? "bg-warning"
                          : "bg-info"
                      }
                    >
                      {request.urgency.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-3 w-3" />
                      {request.matchedDonors} matched
                    </span>
                    <span className="flex items-center gap-1 text-success">
                      <CheckCircle className="h-3 w-3" />
                      {request.confirmedDonors} confirmed
                    </span>
                    <Badge variant="outline" className="ml-auto">
                      {request.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Confirmed Donors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-success" />
                Confirmed Donors
              </CardTitle>
              <CardDescription>Donors en route to your hospital</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {confirmedDonors.map((donor) => (
                <div
                  key={donor.id}
                  className="p-4 rounded-xl border border-border bg-success/5"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-crimson flex items-center justify-center">
                        <span className="text-sm font-bold text-primary-foreground">
                          {donor.bloodType}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{donor.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {donor.distance}
                          <Clock className="h-3 w-3 ml-1" />
                          ETA: {donor.eta}
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Phone className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full">
                View All Responses
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default HospitalDashboard;
