import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Heart,
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  Eye,
  EyeOff,
  Building2,
  Droplets,
  Warehouse,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import LoadingWithQuotes from "@/components/ui/LoadingWithQuotes";

const getDashboardPath = (role: string) => {
  if (role === "hospital") return "/dashboard/hospital";
  if (role === "bloodbank") return "/dashboard/bloodbank";
  return "/dashboard/donor";
};

// List of disposable/temporary email domains to block
const disposableEmailDomains = [
  "tempmail.com", "throwaway.com", "mailinator.com", "guerrillamail.com",
  "10minutemail.com", "fakeinbox.com", "trashmail.com", "yopmail.com",
  "tempail.com", "getnada.com", "maildrop.cc", "dispostable.com",
  "temp-mail.org", "fakemailgenerator.com", "emailondeck.com",
  "mohmal.com", "minutemail.com", "tempr.email", "discard.email",
  "mailnesia.com", "spamgourmet.com", "mytrashmail.com", "sharklasers.com",
];

// Validate email format and check for disposable domains
const validateEmail = (email: string): { valid: boolean; error?: string } => {
  const trimmedEmail = email.trim().toLowerCase();
  
  // Basic email format validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmedEmail)) {
    return { valid: false, error: "Please enter a valid email address" };
  }

  // Check for disposable email domains
  const domain = trimmedEmail.split("@")[1];
  if (disposableEmailDomains.includes(domain)) {
    return { valid: false, error: "Temporary or disposable emails are not allowed. Please use a permanent email." };
  }

  // Check for common typos in popular domains
  const commonDomains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com"];
  const typoPatterns = [
    { typo: "gmial.com", correct: "gmail.com" },
    { typo: "gmal.com", correct: "gmail.com" },
    { typo: "gamil.com", correct: "gmail.com" },
    { typo: "yaho.com", correct: "yahoo.com" },
    { typo: "yahooo.com", correct: "yahoo.com" },
    { typo: "outloo.com", correct: "outlook.com" },
    { typo: "hotmal.com", correct: "hotmail.com" },
  ];
  
  const typoMatch = typoPatterns.find(p => domain === p.typo);
  if (typoMatch) {
    return { valid: false, error: `Did you mean ${typoMatch.correct}?` };
  }

  return { valid: true };
};

// Validate phone number
const validatePhone = (phone: string): { valid: boolean; error?: string } => {
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, "");
  if (cleanPhone.length < 10) {
    return { valid: false, error: "Please enter a valid phone number (at least 10 digits)" };
  }
  return { valid: true };
};

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get("role") || "donor";

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    role: initialRole,
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    bloodType: "",
    apaarId: "",
    hospitalName: "",
    bloodBankName: "",
    licenseNumber: "",
  });

  const bloodTypes = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

  const handleEmailChange = (email: string) => {
    setFormData({ ...formData, email });
    if (email.includes("@")) {
      const validation = validateEmail(email);
      setEmailError(validation.valid ? null : validation.error || null);
    } else {
      setEmailError(null);
    }
  };

  const nextStep = () => {
    if (!formData.role) {
      toast.error("Please select a role");
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.valid) {
      toast.error(emailValidation.error || "Invalid email address");
      return;
    }

    // Validate phone
    const phoneValidation = validatePhone(formData.phone);
    if (!phoneValidation.valid) {
      toast.error(phoneValidation.error || "Invalid phone number");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (formData.role === "donor" && !formData.bloodType) {
      toast.error("Please select your blood type");
      return;
    }

    if (formData.role === "hospital" && (!formData.hospitalName || !formData.licenseNumber)) {
      toast.error("Please enter hospital name and license number");
      return;
    }

    if (formData.role === "bloodbank" && (!formData.bloodBankName || !formData.licenseNumber)) {
      toast.error("Please enter blood bank name and license number");
      return;
    }

    setIsLoading(true);

    // Simulate network delay with loading quotes
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const result = await register({
      name: formData.name,
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone,
      password: formData.password,
      role: formData.role as "donor" | "hospital" | "bloodbank" | "admin",
      bloodType: formData.role === "donor" ? formData.bloodType : undefined,
      apaarId: formData.role === "donor" && formData.apaarId ? formData.apaarId : undefined,
      hospitalName: formData.role === "hospital" ? formData.hospitalName : undefined,
      bloodBankName: formData.role === "bloodbank" ? formData.bloodBankName : undefined,
      licenseNumber: formData.role !== "donor" ? formData.licenseNumber : undefined,
    });

    setIsLoading(false);

    if (!result.success) {
      toast.error(result.error || "Registration failed");
      return;
    }

    // Show success message
    if (formData.role === "hospital" || formData.role === "bloodbank") {
      toast.success("Registration submitted! Awaiting admin verification.");
    } else {
      toast.success("🎉 Welcome to CrimsonCare! Thank you for becoming a donor.");
    }

    // Mock: Show email/SMS notification (in production, this would be sent from backend)
    toast.info("📧 Confirmation email sent to " + formData.email, { duration: 5000 });
    
    navigate(getDashboardPath(formData.role));
  };

  // Show loading screen with motivational quotes
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-mesh flex items-center justify-center p-4">
        <Card className="glass-strong shadow-card w-full max-w-md">
          <CardContent className="py-12">
            <LoadingWithQuotes message="Creating your account..." />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-mesh flex items-center justify-center p-4 py-12 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />
      </div>

      <div className="w-full max-w-3xl relative z-10">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8 group">
          <Heart className="h-10 w-10 text-primary fill-primary group-hover:scale-110 transition-transform" />
          <span className="text-2xl font-display font-bold">
            Crimson<span className="text-primary">Care</span>
          </span>
        </Link>

        <Card className="glass-strong shadow-card">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-display">Create an account</CardTitle>
            <CardDescription>
              {step === 1 ? "Select your role to get started" : `Complete your ${formData.role} profile`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 1 ? (
              <div className="space-y-6">
                <RadioGroup
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                  {/* Donor */}
                  <Label
                    htmlFor="donor"
                    className={`flex flex-col items-center gap-3 p-6 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${
                      formData.role === "donor"
                        ? "border-primary bg-accent shadow-crimson"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <RadioGroupItem value="donor" id="donor" className="sr-only" />
                    <div className="w-14 h-14 rounded-full bg-gradient-crimson flex items-center justify-center">
                      <Droplets className="h-7 w-7 text-primary-foreground" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold">Donor</p>
                      <p className="text-xs text-muted-foreground">Save lives by donating</p>
                    </div>
                  </Label>

                  {/* Hospital */}
                  <Label
                    htmlFor="hospital"
                    className={`flex flex-col items-center gap-3 p-6 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${
                      formData.role === "hospital"
                        ? "border-primary bg-accent shadow-crimson"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <RadioGroupItem value="hospital" id="hospital" className="sr-only" />
                    <div className="w-14 h-14 rounded-full bg-gradient-crimson flex items-center justify-center">
                      <Building2 className="h-7 w-7 text-primary-foreground" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold">Hospital</p>
                      <p className="text-xs text-muted-foreground">Request blood supplies</p>
                    </div>
                  </Label>

                  {/* Blood Bank */}
                  <Label
                    htmlFor="bloodbank"
                    className={`flex flex-col items-center gap-3 p-6 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${
                      formData.role === "bloodbank"
                        ? "border-primary bg-accent shadow-crimson"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <RadioGroupItem value="bloodbank" id="bloodbank" className="sr-only" />
                    <div className="w-14 h-14 rounded-full bg-gradient-crimson flex items-center justify-center">
                      <Warehouse className="h-7 w-7 text-primary-foreground" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold">Blood Bank</p>
                      <p className="text-xs text-muted-foreground">Manage blood inventory</p>
                    </div>
                  </Label>
                </RadioGroup>

                <Button onClick={nextStep} variant="hero" size="lg" className="w-full">
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {formData.role === "hospital" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="hospitalName">Hospital Name</Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="hospitalName"
                          placeholder="Enter hospital name"
                          className="pl-10"
                          value={formData.hospitalName}
                          onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="licenseNumber">License Number</Label>
                      <Input
                        id="licenseNumber"
                        placeholder="Hospital license number"
                        value={formData.licenseNumber}
                        onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                        required
                      />
                    </div>
                  </>
                )}

                {formData.role === "bloodbank" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="bloodBankName">Blood Bank Name</Label>
                      <div className="relative">
                        <Warehouse className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="bloodBankName"
                          placeholder="Enter blood bank name"
                          className="pl-10"
                          value={formData.bloodBankName}
                          onChange={(e) => setFormData({ ...formData, bloodBankName: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="licenseNumber">License Number</Label>
                      <Input
                        id="licenseNumber"
                        placeholder="Blood bank license number"
                        value={formData.licenseNumber}
                        onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                        required
                      />
                    </div>
                  </>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      {formData.role === "hospital" ? "Contact Person Name" : formData.role === "bloodbank" ? "Manager Name" : "Full Name"}
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        placeholder="Enter your full name"
                        className="pl-10"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        className="pl-10"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${emailError ? "text-destructive" : "text-muted-foreground"}`} />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      className={`pl-10 ${emailError ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      value={formData.email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      required
                    />
                  </div>
                  {emailError && (
                    <div className="flex items-center gap-1.5 text-destructive text-sm">
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span>{emailError}</span>
                    </div>
                  )}
                </div>

                {formData.role === "donor" && (
                  <>
                    <div className="space-y-2">
                      <Label>Blood Type <span className="text-destructive">*</span></Label>
                      <div className="grid grid-cols-4 gap-2">
                        {bloodTypes.map((type) => (
                          <Button
                            key={type}
                            type="button"
                            variant={formData.bloodType === type ? "hero" : "outline"}
                            size="sm"
                            onClick={() => setFormData({ ...formData, bloodType: type })}
                            className="font-bold"
                          >
                            {type}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="apaarId">APAAR ID <span className="text-muted-foreground text-xs">(Optional)</span></Label>
                      <Input
                        id="apaarId"
                        placeholder="Enter your APAAR ID (if available)"
                        value={formData.apaarId}
                        onChange={(e) => setFormData({ ...formData, apaarId: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Automated Permanent Academic Account Registry ID
                      </p>
                    </div>
                  </>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
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

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm your password"
                        className="pl-10"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" size="lg" className="flex-1" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button type="submit" variant="hero" size="lg" className="flex-1" disabled={isLoading}>
                    {isLoading ? "Creating..." : "Create Account"}
                  </Button>
                </div>

                {(formData.role === "hospital" || formData.role === "bloodbank") && (
                  <p className="text-xs text-center text-muted-foreground">
                    {formData.role === "hospital" ? "Hospital" : "Blood Bank"} accounts may require verification before full activation.
                  </p>
                )}
              </form>
            )}

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link to="/login" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;
