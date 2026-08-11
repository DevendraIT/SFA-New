import { z } from "zod";
import AUTH_CONSTANTS from "./constants/auth.constants.js";

const passwordPolicy = AUTH_CONSTANTS.PASSWORD_POLICY;

// Reusable text sanitization helper
const sanitizeText = (val) => {
  if (typeof val !== "string") return val;
  return val.replace(/<[^>]*>/g, "").trim();
};

// Strong Password Schema
export const strongPasswordSchema = z
  .string()
  .min(passwordPolicy.MIN_LENGTH, {
    message: `Password must be at least ${passwordPolicy.MIN_LENGTH} characters long.`,
  })
  .max(passwordPolicy.MAX_LENGTH, {
    message: `Password cannot exceed ${passwordPolicy.MAX_LENGTH} characters.`,
  })
  .refine(
    (val) => !passwordPolicy.REQUIRE_UPPERCASE || /[A-Z]/.test(val),
    {
      message: "Password must contain at least one uppercase letter.",
    }
  )
  .refine(
    (val) => !passwordPolicy.REQUIRE_LOWERCASE || /[a-z]/.test(val),
    {
      message: "Password must contain at least one lowercase letter.",
    }
  )
  .refine(
    (val) => !passwordPolicy.REQUIRE_NUMBER || /[0-9]/.test(val),
    {
      message: "Password must contain at least one numeric digit.",
    }
  )
  .refine(
    (val) =>
      !passwordPolicy.REQUIRE_SPECIAL ||
      /[!@#$%^&*(),.?":{}|<>]/.test(val),
    {
      message: "Password must contain at least one special character.",
    }
  );

// Standard tenant identifier (keep if used elsewhere)
export const tenantIdentifierSchema = z.string().uuid({
  message: "Invalid Organization ID.",
});

// -------------------------------
// Login
// -------------------------------
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, {
      message: "Email or Phone Number is required.",
    })
    .transform(sanitizeText),

  password: z.string().min(1, {
    message: "Password is required.",
  }),
});

// -------------------------------
// Verify Email
// -------------------------------
export const verifyEmailSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email({
      message: "Invalid email address.",
    })
    .transform(sanitizeText),

  otp: z
    .string()
    .trim()
    .length(AUTH_CONSTANTS.OTP.LENGTH, {
      message: `OTP must be exactly ${AUTH_CONSTANTS.OTP.LENGTH} digits.`,
    }),
});

// -------------------------------
// Resend OTP
// -------------------------------
export const resendOtpSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email({
      message: "Invalid email address.",
    })
    .transform(sanitizeText),
});

// -------------------------------
// Change Password
// -------------------------------
export const changePasswordSchema = z
  .object({
    oldPassword: z.string().optional(),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(6, {
      message: "New password must be at least 6 characters long.",
    }),
  })
  .refine((data) => (data.oldPassword || data.currentPassword), {
    message: "Current password is required.",
    path: ["currentPassword"],
  });

// -------------------------------
// Forgot Password
// -------------------------------
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email({
      message: "Invalid email address.",
    })
    .transform(sanitizeText),
});

// -------------------------------
// Reset Password
// -------------------------------
export const resetPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email({
      message: "Invalid email address.",
    })
    .transform(sanitizeText),

  otp: z
    .string()
    .trim()
    .length(AUTH_CONSTANTS.OTP.LENGTH, {
      message: `OTP must be exactly ${AUTH_CONSTANTS.OTP.LENGTH} digits.`,
    }),

  newPassword: strongPasswordSchema,
});

// -------------------------------
// Update Profile
// -------------------------------
export const updateProfileSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, { message: "First name must be at least 2 characters." })
    .max(50, { message: "First name cannot exceed 50 characters." })
    .transform(sanitizeText)
    .optional(),

  lastName: z
    .string()
    .trim()
    .min(2, { message: "Last name must be at least 2 characters." })
    .max(50, { message: "Last name cannot exceed 50 characters." })
    .transform(sanitizeText)
    .optional(),

  phoneNumber: z
    .string()
    .trim()
    .regex(/^\+?[\d\s\-\(\)]{10,}$/, { message: "Invalid phone number format." })
    .transform(sanitizeText)
    .optional(),
}).refine(
  (data) => Object.values(data).some(v => v !== undefined),
  { message: "At least one field must be provided for update." }
);