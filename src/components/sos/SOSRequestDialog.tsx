import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useSOS, SOSRequest } from "@/contexts/SOSContext";
import { useAuthSafe } from "@/contexts/AuthContext";

interface SOSRequestDialogProps {
  trigger?: React.ReactNode;
  isPublic?: boolean; // true for home page, false for hospital dashboard
  onSuccess?: (request: SOSRequest) => void;
}

const bloodTypes = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] as const;

const SOSRequestDialog = ({ trigger, isPublic = false, onSuccess }: SOSRequestDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createRequest } = useSOS();
  const authContext = useAuthSafe();
  const user = authContext?.user ?? null;

  const [formData, setFormData] = useState({
    patientName: "",
    bloodType: "",
    units: "",
    urgency: "",
    hospitalName: "",
    hospitalAddress: "",
    contactPhone: "",
    contactEmail: "",
    notes: "",
  });

  const resetForm = () => {
    setFormData({
      patientName: "",
      bloodType: "",
      units: "",
      urgency: "",
      hospitalName: "",
      hospitalAddress: "",
      contactPhone: "",
      contactEmail: "",
      notes: "",
    });
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    // Validate required fields
    const patientName = formData.patientName.trim();
    if (!patientName || patientName.length > 100) {
      toast.error("Patient name is required (max 100 characters)");
      return;
    }

    if (!formData.bloodType || !bloodTypes.includes(formData.bloodType as any)) {
      toast.error("Please select a valid blood type");
      return;
    }

    const units = parseInt(formData.units);
    if (isNaN(units) || units < 1 || units > 10) {
      toast.error("Units must be between 1 and 10");
      return;
    }

    if (!["critical", "high", "moderate"].includes(formData.urgency)) {
      toast.error("Please select urgency level");
      return;
    }

    // For public requests, additional fields are required
    const hospitalName = isPublic ? formData.hospitalName.trim() : (user?.hospitalName || "Hospital");
    const contactPhone = isPublic ? formData.contactPhone.trim() : (user?.phone || "");
    const contactEmail = isPublic ? formData.contactEmail.trim() : (user?.email || "");

    if (isPublic) {
      if (!hospitalName || hospitalName.length > 200) {
        toast.error("Hospital/Location name is required (max 200 characters)");
        return;
      }
      if (!contactPhone || contactPhone.replace(/[\s\-\(\)]/g, "").length < 10) {
        toast.error("Valid contact phone is required");
        return;
      }
    }

    // Validate notes length
    if (formData.notes.length > 500) {
      toast.error("Notes must be less than 500 characters");
      return;
    }

    setIsSubmitting(true);

    try {
      const request = await createRequest({
        patientName,
        bloodType: formData.bloodType,
        units,
        urgency: formData.urgency as "critical" | "high" | "moderate",
        notes: formData.notes.trim(),
        hospitalName,
        hospitalAddress: formData.hospitalAddress.trim().slice(0, 500),
        contactPhone,
        contactEmail: contactEmail.toLowerCase(),
        createdBy: user?.id || "anonymous",
        source: isPublic ? "public" : "hospital",
      });

      toast.success("SOS Alert sent! Matching donors are being notified.");
      setOpen(false);
      resetForm();
      onSuccess?.(request);
    } catch (error: any) {
      toast.error(error.message || "Failed to create SOS request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="sos" size="lg">
            <AlertTriangle className="h-5 w-5" />
            {isPublic ? "Emergency Request" : "Create SOS Request"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Emergency Blood Request
          </DialogTitle>
          <DialogDescription>
            This will send instant notifications to all matching donors in the area.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Patient Name */}
          <div className="space-y-2">
            <Label>Patient Name *</Label>
            <Input
              placeholder="Enter patient name"
              maxLength={100}
              value={formData.patientName}
              onChange={(e) => setFormData((p) => ({ ...p, patientName: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Blood Type */}
            <div className="space-y-2">
              <Label>Blood Type Required *</Label>
              <Select
                value={formData.bloodType}
                onValueChange={(v) => setFormData((p) => ({ ...p, bloodType: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {bloodTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Units */}
            <div className="space-y-2">
              <Label>Units Required *</Label>
              <Input
                type="number"
                min="1"
                max="10"
                placeholder="1-10"
                value={formData.units}
                onChange={(e) => setFormData((p) => ({ ...p, units: e.target.value }))}
              />
            </div>
          </div>

          {/* Urgency */}
          <div className="space-y-2">
            <Label>Urgency Level *</Label>
            <Select
              value={formData.urgency}
              onValueChange={(v) => setFormData((p) => ({ ...p, urgency: v }))}
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

          {/* Public request additional fields */}
          {isPublic && (
            <>
              <div className="space-y-2">
                <Label>Hospital / Location Name *</Label>
                <Input
                  placeholder="Enter hospital or location name"
                  maxLength={200}
                  value={formData.hospitalName}
                  onChange={(e) => setFormData((p) => ({ ...p, hospitalName: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Address</Label>
                <Textarea
                  placeholder="Enter full address"
                  rows={2}
                  maxLength={500}
                  value={formData.hospitalAddress}
                  onChange={(e) => setFormData((p) => ({ ...p, hospitalAddress: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contact Phone *</Label>
                  <Input
                    type="tel"
                    placeholder="Phone number"
                    maxLength={20}
                    value={formData.contactPhone}
                    onChange={(e) => setFormData((p) => ({ ...p, contactPhone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact Email</Label>
                  <Input
                    type="email"
                    placeholder="Email address"
                    maxLength={255}
                    value={formData.contactEmail}
                    onChange={(e) => setFormData((p) => ({ ...p, contactEmail: e.target.value }))}
                  />
                </div>
              </div>
            </>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>Additional Notes ({formData.notes.length}/500)</Label>
            <Textarea
              placeholder="Any specific requirements or additional information..."
              rows={2}
              maxLength={500}
              value={formData.notes}
              onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setOpen(false)} className="flex-1" disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="sos" onClick={handleSubmit} className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Send SOS Alert"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SOSRequestDialog;
