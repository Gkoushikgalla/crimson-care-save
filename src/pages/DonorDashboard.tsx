import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
} from "lucide-react";

const DonorDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");

  // Mock donor data
  const donor = {
    name: "John Doe",
    bloodType: "O+",
    totalDonations: 12,
    lastDonation: "2024-10-15",
    nextEligible: "2025-01-15",
    points: 2400,
    level: "Gold Donor",
    isEligible: true,
  };

  const recentAlerts = [
    {
      id: 1,
      hospital: "City General Hospital",
      bloodType: "O+",
      urgency: "critical",
      distance: "2.5 km",
      time: "10 min ago",
    },
    {
      id: 2,
      hospital: "St. Mary's Medical Center",
      bloodType: "O+",
      urgency: "high",
      distance: "4.8 km",
      time: "25 min ago",
    },
  ];

  const badges = [
    { name: "First Donation", icon: "🩸", earned: true },
    { name: "5 Donations", icon: "⭐", earned: true },
    { name: "10 Donations", icon: "🏆", earned: true },
    { name: "Life Saver", icon: "❤️", earned: true },
    { name: "25 Donations", icon: "👑", earned: false },
  ];

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
            { icon: User, label: "Profile", id: "profile" },
            { icon: Droplets, label: "Donation History", id: "history" },
            { icon: Award, label: "Rewards", id: "rewards" },
            { icon: Bell, label: "SOS Alerts", id: "alerts" },
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
              Welcome back, {donor.name}!
            </h1>
            <p className="text-muted-foreground">Here's your donation overview</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Bell className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-crimson text-primary-foreground">
              <Droplets className="h-4 w-4" />
              <span className="font-semibold">{donor.bloodType}</span>
            </div>
          </div>
        </div>

        {/* Eligibility Banner */}
        <Card className={`mb-6 border-2 ${donor.isEligible ? "border-success bg-success/5" : "border-warning bg-warning/5"}`}>
          <CardContent className="flex items-center gap-4 py-4">
            {donor.isEligible ? (
              <>
                <CheckCircle className="h-8 w-8 text-success" />
                <div>
                  <p className="font-semibold text-foreground">You're eligible to donate!</p>
                  <p className="text-sm text-muted-foreground">Your last donation was on {donor.lastDonation}</p>
                </div>
                <Button variant="hero" className="ml-auto" size="sm">
                  Find Donation Center
                </Button>
              </>
            ) : (
              <>
                <AlertTriangle className="h-8 w-8 text-warning" />
                <div>
                  <p className="font-semibold text-foreground">Next eligible date: {donor.nextEligible}</p>
                  <p className="text-sm text-muted-foreground">You need to wait 56 days between donations</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Droplets, label: "Total Donations", value: donor.totalDonations, color: "text-primary" },
            { icon: Calendar, label: "Last Donation", value: donor.lastDonation, color: "text-info" },
            { icon: Award, label: "Points Earned", value: donor.points.toLocaleString(), color: "text-warning" },
            { icon: Heart, label: "Lives Saved", value: donor.totalDonations * 3, color: "text-success" },
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
          {/* SOS Alerts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Active SOS Alerts
                </CardTitle>
                <CardDescription>Emergency requests in your area</CardDescription>
              </div>
              <Badge variant="destructive" className="animate-pulse">
                {recentAlerts.length} Active
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-4 rounded-xl border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-foreground">{alert.hospital}</p>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {alert.distance}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {alert.time}
                        </span>
                      </div>
                    </div>
                    <Badge
                      className={
                        alert.urgency === "critical"
                          ? "bg-destructive"
                          : "bg-warning"
                      }
                    >
                      {alert.urgency.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="hero" size="sm" className="flex-1">
                      Accept Request
                    </Button>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Rewards & Badges */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-warning" />
                Rewards & Badges
              </CardTitle>
              <CardDescription>Your achievements and recognition</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Level Progress */}
              <div className="mb-6 p-4 rounded-xl bg-gradient-crimson-light border border-primary/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-foreground">{donor.level}</span>
                  <span className="text-sm text-muted-foreground">{donor.points} / 3000 pts</span>
                </div>
                <Progress value={(donor.points / 3000) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  600 more points to reach Platinum Donor
                </p>
              </div>

              {/* Badges */}
              <div className="grid grid-cols-5 gap-3">
                {badges.map((badge, i) => (
                  <div
                    key={i}
                    className={`flex flex-col items-center p-3 rounded-xl border ${
                      badge.earned
                        ? "border-primary/30 bg-accent"
                        : "border-border opacity-50"
                    }`}
                  >
                    <span className="text-2xl mb-1">{badge.icon}</span>
                    <span className="text-xs text-center text-muted-foreground">
                      {badge.name}
                    </span>
                  </div>
                ))}
              </div>

              <Button variant="outline" className="w-full mt-4">
                View All Rewards
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default DonorDashboard;
