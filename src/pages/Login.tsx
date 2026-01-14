import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import LoadingWithQuotes from "@/components/ui/LoadingWithQuotes";

const getDashboardPath = (role?: string) => {
  switch (role) {
    case "hospital": return "/dashboard/hospital";
    case "bloodbank": return "/dashboard/bloodbank";
    case "admin": return "/dashboard/admin";
    default: return "/dashboard/donor";
  }
};

const Login = () => {
  const navigate = useNavigate();
  const { login, user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [targetRole, setTargetRole] = useState<string | undefined>();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Watch for user state to be ready, then navigate
  useEffect(() => {
    if (isRedirecting && user && !authLoading) {
      console.log("Login: User ready, navigating to dashboard", user.role);
      navigate(getDashboardPath(user.role), { replace: true });
    }
  }, [isRedirecting, user, authLoading, navigate]);

  // Fallback: if user state doesn't update within 2 seconds, use targetRole
  useEffect(() => {
    if (!isRedirecting || !targetRole) return;
    
    const timer = setTimeout(() => {
      console.log("Login: Fallback navigation to", targetRole);
      navigate(getDashboardPath(targetRole), { replace: true });
    }, 2000);

    return () => clearTimeout(timer);
  }, [isRedirecting, targetRole, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await login(formData.email, formData.password);
    setIsLoading(false);

    if (!result.success) {
      toast.error(result.error || "Invalid email or password");
      return;
    }

    toast.success("Welcome back!");
    setTargetRole(result.role);
    setIsRedirecting(true);
    // Navigation happens in useEffect when user state is ready
  };

  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-gradient-mesh flex items-center justify-center">
        <LoadingWithQuotes message="Taking you to your dashboard..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-mesh flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8 group">
          <Heart className="h-10 w-10 text-primary fill-primary group-hover:scale-110 transition-transform" />
          <span className="text-2xl font-display font-bold">
            Crimson<span className="text-primary">Care</span>
          </span>
        </Link>

        <Card className="glass-strong shadow-card">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-display">Welcome back</CardTitle>
            <CardDescription>Sign in to your account to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    className="pl-10"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="pl-10 pr-10"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <Link to="/register" className="text-primary font-medium hover:underline">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
