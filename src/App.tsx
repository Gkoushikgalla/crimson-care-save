import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SOSProvider } from "@/contexts/SOSContext";
import { DonationProvider } from "@/contexts/DonationContext";
import { BloodBankProvider } from "@/contexts/BloodBankContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import LocationPermissionHandler from "@/components/LocationPermissionHandler";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import DonorDashboard from "./pages/DonorDashboard";
import HospitalDashboard from "./pages/HospitalDashboard";
import BloodBankDashboard from "./pages/BloodBankDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import SOSDetails from "./pages/SOSDetails";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppWithBloodBank = () => {
  const { user } = useAuth();
  const bloodBankUserId = user?.role === "bloodbank" ? user.id : null;
  return (
    <BloodBankProvider userId={bloodBankUserId}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <LocationPermissionHandler />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/dashboard" element={<ProtectedRoute allowedRoles={["donor"]}><DonorDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/donor" element={<ProtectedRoute allowedRoles={["donor"]}><DonorDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/hospital" element={<ProtectedRoute allowedRoles={["hospital"]}><HospitalDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/bloodbank" element={<ProtectedRoute allowedRoles={["bloodbank"]}><BloodBankDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/sos/:id" element={<ProtectedRoute><SOSDetails /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </BloodBankProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SOSProvider>
        <DonationProvider>
          <AppWithBloodBank />
        </DonationProvider>
      </SOSProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
