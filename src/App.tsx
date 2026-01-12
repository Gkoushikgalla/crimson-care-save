import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SOSProvider } from "@/contexts/SOSContext";
import { DonationProvider } from "@/contexts/DonationContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DonorDashboard from "./pages/DonorDashboard";
import HospitalDashboard from "./pages/HospitalDashboard";
import BloodBankDashboard from "./pages/BloodBankDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import SOSDetails from "./pages/SOSDetails";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SOSProvider>
        <DonationProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<DonorDashboard />} />
                <Route path="/dashboard/donor" element={<DonorDashboard />} />
                <Route path="/dashboard/hospital" element={<HospitalDashboard />} />
                <Route path="/dashboard/bloodbank" element={<BloodBankDashboard />} />
                <Route path="/dashboard/admin" element={<AdminDashboard />} />
                <Route path="/sos/:id" element={<SOSDetails />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </DonationProvider>
      </SOSProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
