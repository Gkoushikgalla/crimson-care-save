import { z } from 'zod';

// Blood type validation
export const bloodTypeSchema = z.enum(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']);

// User role validation - admin cannot be self-assigned
export const userRoleSchema = z.enum(['donor', 'hospital', 'bloodbank']);

// Email validation with disposable domain check
const disposableEmailDomains = [
  "tempmail.com", "throwaway.com", "mailinator.com", "guerrillamail.com",
  "10minutemail.com", "fakeinbox.com", "trashmail.com", "yopmail.com",
  "tempail.com", "getnada.com", "maildrop.cc", "dispostable.com",
  "temp-mail.org", "fakemailgenerator.com", "emailondeck.com",
  "mohmal.com", "minutemail.com", "tempr.email", "discard.email",
  "mailnesia.com", "spamgourmet.com", "mytrashmail.com", "sharklasers.com",
];

export const emailSchema = z.string()
  .trim()
  .email({ message: "Please enter a valid email address" })
  .max(255, { message: "Email must be less than 255 characters" })
  .refine((email) => {
    const domain = email.toLowerCase().split("@")[1];
    return !disposableEmailDomains.includes(domain);
  }, { message: "Temporary or disposable emails are not allowed" });

// Phone validation
export const phoneSchema = z.string()
  .min(10, { message: "Phone number must be at least 10 digits" })
  .max(20, { message: "Phone number is too long" })
  .refine((phone) => {
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, "");
    return cleanPhone.length >= 10;
  }, { message: "Please enter a valid phone number" });

// Password validation - matches Firebase Auth minimum of 6 characters
export const passwordSchema = z.string()
  .min(6, { message: "Password must be at least 6 characters" })
  .max(128, { message: "Password is too long" });

// Name validation
export const nameSchema = z.string()
  .trim()
  .min(1, { message: "Name is required" })
  .max(100, { message: "Name must be less than 100 characters" });

// Registration schema
export const registrationSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
  role: userRoleSchema,
  bloodType: z.union([bloodTypeSchema, z.literal(""), z.undefined()]).optional(),
  apaarId: z.string().max(50).optional().or(z.literal("")),
  hospitalName: z.string().max(200).optional().or(z.literal("")),
  bloodBankName: z.string().max(200).optional().or(z.literal("")),
  licenseNumber: z.string().max(100).optional().or(z.literal("")),
});

// Login schema
export const loginSchema = z.object({
  email: z.string().trim().email({ message: "Please enter a valid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

// SOS Request schema
export const sosRequestSchema = z.object({
  patientName: z.string().trim().min(1, { message: "Patient name is required" }).max(100, { message: "Name too long" }),
  bloodType: bloodTypeSchema,
  units: z.number().int().min(1, { message: "At least 1 unit required" }).max(10, { message: "Maximum 10 units" }),
  urgency: z.enum(['critical', 'high', 'moderate']),
  notes: z.string().max(500, { message: "Notes must be less than 500 characters" }).optional(),
  hospitalName: z.string().trim().min(1).max(200),
  hospitalAddress: z.string().trim().min(1).max(500),
  contactPhone: phoneSchema,
  contactEmail: emailSchema,
});

// Donation schema
export const donationSchema = z.object({
  donorName: z.string().trim().min(1).max(100),
  donorId: z.string().min(1),
  donorPhone: phoneSchema,
  bloodType: bloodTypeSchema,
  units: z.number().int().min(1).max(5),
  hospitalName: z.string().trim().min(1).max(200),
  patientName: z.string().trim().min(1).max(100).optional(),
});

// Helper function to safely validate and return errors
export const safeValidate = <T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } => {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { 
    success: false, 
    errors: result.error.errors.map(e => e.message)
  };
};
