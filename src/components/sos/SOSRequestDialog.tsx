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
import { useAuth } from "@/contexts/AuthContext";

interface SOSRequestDialogProps {
  trigger?: React.ReactNode;
  isPublic?: boolean; // true for home page, false for hospital dashboard
  onSuccess?: (request: SOSRequest) => void;
}

const SOSRequestDialog = ({ trigger, isPublic = false, onSuccess }: SOSRequestDialogProps) => {
  const [open, setOpen] = useState(false);
  const { createRequest } = useSOS();
  const { user } = useAuth();

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

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.patientName.trim()) {
      toast.error("Patient name is required");
      return;
    }
    if (!formData.bloodType) {
      toast.error("Blood type is required");
      return;
    }
    if (!formData.units || parseInt(formData.units) < 1) {
      toast.error("Valid units required is required");
      return;
    }
    if (!formData.urgency) {
      toast.error("Urgency level is required");
      return;
    }

    // For public requests, additional fields are required
    if (isPublic) {
      if (!formData.hospitalName.trim()) {
        toast.error("Hospital/Location name is required");
        return;
      }
      if (!formData.contactPhone.trim()) {
        toast.error("Contact phone is required");
        return;
      }
    }

    const request = await createRequest({
      patientName: formData.patientName.trim(),
      bloodType: formData.bloodType,
      units: parseInt(formData.units),
      urgency: formData.urgency as "critical" | "high" | "moderate",
      notes: formData.notes.trim(),
      hospitalName: isPublic ? formData.hospitalName.trim() : (user?.hospitalName || "Hospital"),
      hospitalAddress: isPublic ? formData.hospitalAddress.trim() : "",
      contactPhone: isPublic ? formData.contactPhone.trim() : (user?.phone || ""),
      contactEmail: isPublic ? formData.contactEmail.trim() : (user?.email || ""),
      createdBy: user?.id || "anonymous",
      source: isPublic ? "public" : "hospital",
    });

    toast.success("SOS Alert sent! Matching donors are being notified.");
    setOpen(false);
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

    onSuccess?.(request);
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
                  {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((type) => (
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
                placeholder="Units"
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
                  value={formData.hospitalName}
                  onChange={(e) => setFormData((p) => ({ ...p, hospitalName: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Address</Label>
                <Textarea
                  placeholder="Enter full address"
                  rows={2}
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
                    value={formData.contactPhone}
                    onChange={(e) => setFormData((p) => ({ ...p, contactPhone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact Email</Label>
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData((p) => ({ ...p, contactEmail: e.target.value }))}
                  />
                </div>
              </div>
            </>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>Additional Notes</Label>
            <Textarea
              placeholder="Any specific requirements or additional information..."
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
            Cancel
          </Button>
          <Button variant="sos" onClick={handleSubmit} className="flex-1">
            Send SOS Alert
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SOSRequestDialog;
