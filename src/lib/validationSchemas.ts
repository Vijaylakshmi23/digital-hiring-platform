import { z } from 'zod';

// Auth validation schemas
export const signUpSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }).max(255),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }).max(100),
  fullName: z.string().trim().min(2, { message: "Full name must be at least 2 characters" }).max(100),
  phone: z.string().trim().min(10, { message: "Phone must be at least 10 digits" }).max(20).optional().or(z.literal('')),
  role: z.enum(['hirer', 'worker'], { message: "Role must be either hirer or worker" }),
});

export const loginSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }).max(255),
  password: z.string().min(1, { message: "Password is required" }).max(100),
});

// Worker application validation schema
export const workerApplicationSchema = z.object({
  categoryId: z.string().uuid({ message: "Please select a valid category" }),
  hourlyRate: z.number({ invalid_type_error: "Hourly rate must be a number" })
    .min(100, { message: "Hourly rate must be at least ₹100" })
    .max(10000, { message: "Hourly rate cannot exceed ₹10,000" }),
  dailyRate: z.number({ invalid_type_error: "Daily rate must be a number" })
    .min(500, { message: "Daily rate must be at least ₹500" })
    .max(50000, { message: "Daily rate cannot exceed ₹50,000" })
    .optional()
    .or(z.literal(0)),
  experienceYears: z.number({ invalid_type_error: "Experience must be a number" })
    .int({ message: "Experience must be a whole number" })
    .min(0, { message: "Experience cannot be negative" })
    .max(50, { message: "Experience cannot exceed 50 years" }),
  skills: z.string()
    .trim()
    .min(2, { message: "Please enter at least one skill" })
    .max(500, { message: "Skills must be less than 500 characters" })
    .transform((val) => {
      const skillsArray = val.split(',').map(s => s.trim()).filter(s => s.length > 0);
      if (skillsArray.length === 0) throw new Error("Please enter at least one skill");
      if (skillsArray.length > 20) throw new Error("Maximum 20 skills allowed");
      skillsArray.forEach(skill => {
        if (skill.length < 2) throw new Error("Each skill must be at least 2 characters");
        if (skill.length > 50) throw new Error("Each skill must be less than 50 characters");
      });
      return skillsArray;
    }),
  bio: z.string()
    .trim()
    .max(1000, { message: "Bio must be less than 1000 characters" })
    .optional()
    .or(z.literal('')),
});

// Booking validation schema
export const bookingSchema = z.object({
  bookingDate: z.date({ required_error: "Please select a date" }),
  startTime: z.string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Invalid time format (HH:MM)" })
    .optional()
    .or(z.literal('')),
  durationHours: z.number({ invalid_type_error: "Duration must be a number" })
    .min(0.5, { message: "Duration must be at least 0.5 hours" })
    .max(24, { message: "Duration cannot exceed 24 hours" })
    .optional()
    .or(z.literal(0)),
  workDescription: z.string()
    .trim()
    .min(10, { message: "Work description must be at least 10 characters" })
    .max(2000, { message: "Work description must be less than 2000 characters" }),
});

export type SignUpFormData = z.infer<typeof signUpSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type WorkerApplicationFormData = z.infer<typeof workerApplicationSchema>;
export type BookingFormData = z.infer<typeof bookingSchema>;
