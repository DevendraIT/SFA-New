import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

// Define schema for environment variables with fallback defaults for development
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "staging", "production"]).default("development"),
  PORT: z.string().default("5000"),
  API_VERSION: z.string().default("v1"),
  
  // Neon DB URL or regular DATABASE_URL
  DATABASE_URL: z.string().default("postgresql://neondb_owner:npg_fQSbtco3AWK6@ep-long-wave-aoay8uwc-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"),
  
  // JWT Configuration
  JWT_SECRET: z.string().default("your-super-secret-access-token-key-should-be-at-least-32-characters"),
  JWT_EXPIRY: z.string().default("15m"),
  JWT_REFRESH_SECRET: z.string().default("your-super-secret-refresh-token-key-should-be-at-least-32-characters"),
  JWT_REFRESH_EXPIRY: z.string().default("7d"),
  
 // CORS
  CORS_ORIGIN: z.string().default(
  "http://localhost:5173,https://sfa-beige.vercel.app/"
),
  
  
  // Logging
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default("900000"),
  RATE_LIMIT_MAX_REQUESTS: z.string().default("100"),
  
  // Geo-Fencing Testing Mode Configuration (default false = testing mode enabled)
  GEO_FENCE_ENABLED: z.string().default("false"),

  // Swagger Documentation
  SWAGGER_ENABLED: z.string().default("true"),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),



  // Email Delivery
  EMAIL_PROVIDER: z.enum(["mock", "smtp", "sendgrid", "ses"]).default("mock"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SENDGRID_API_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  EMAIL_FROM_ADDRESS: z.string().default("noreply@sfa-example.com"),
  EMAIL_FROM_NAME: z.string().default("SFA Engine"),

  // Auth Configuration
  PASSWORD_EXPIRY_DAYS: z.string().default("90"),
  MAX_CONCURRENT_SESSIONS: z.string().default("3"),

  // AI Analysis
  AI_PROVIDER: z.enum(["mock", "openai", "gemini"]).default("mock"),
  OPENAI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  
  // N8n Integration
  N8N_WEBHOOK_URL: z.string().optional(),
});

// Load DB_URL to DATABASE_URL if DATABASE_URL is not set
if (process.env.DB_URL && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.DB_URL;
}

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Environment validation failed:");
  Object.entries(parsed.error.flatten().fieldErrors).forEach(([key, errors]) => {
    console.error(`  ${key}: ${errors?.join(", ")}`);
  });
  process.exit(1);
}

export const config = {
  NODE_ENV: parsed.data.NODE_ENV,
  PORT: parseInt(parsed.data.PORT, 10),
  API_VERSION: parsed.data.API_VERSION,
  isDevelopment: parsed.data.NODE_ENV === "development",
  isProduction: parsed.data.NODE_ENV === "production",
  isStaging: parsed.data.NODE_ENV === "staging",
  
  DATABASE_URL: parsed.data.DATABASE_URL,
  
  JWT: {
    secret: parsed.data.JWT_SECRET,
    expiresIn: parsed.data.JWT_EXPIRY,
    refreshSecret: parsed.data.JWT_REFRESH_SECRET,
    refreshExpiresIn: parsed.data.JWT_REFRESH_EXPIRY,
  },
  
  CORS_ORIGIN: parsed.data.CORS_ORIGIN,
  LOG_LEVEL: parsed.data.LOG_LEVEL,
  
  RATE_LIMIT: {
    windowMs: parseInt(parsed.data.RATE_LIMIT_WINDOW_MS, 10),
    maxRequests: parseInt(parsed.data.RATE_LIMIT_MAX_REQUESTS, 10),
  },
  
  GEO_FENCE_ENABLED: parsed.data.GEO_FENCE_ENABLED === "true",
  SWAGGER_ENABLED: parsed.data.SWAGGER_ENABLED === "true",

  CLOUDINARY: {
    cloudName: parsed.data.CLOUDINARY_CLOUD_NAME,
    apiKey: parsed.data.CLOUDINARY_API_KEY,
    apiSecret: parsed.data.CLOUDINARY_API_SECRET,
  },


  EMAIL: {
    provider: parsed.data.EMAIL_PROVIDER,
    fromAddress: parsed.data.EMAIL_FROM_ADDRESS,
    fromName: parsed.data.EMAIL_FROM_NAME,
    smtp: {
      host: parsed.data.SMTP_HOST,
      port: parsed.data.SMTP_PORT ? parseInt(parsed.data.SMTP_PORT, 10) : 587,
      user: parsed.data.SMTP_USER,
      pass: parsed.data.SMTP_PASS,
    },
    sendgrid: {
      apiKey: parsed.data.SENDGRID_API_KEY,
    },
    aws: {
      region: parsed.data.AWS_REGION,
      accessKeyId: parsed.data.AWS_ACCESS_KEY_ID,
      secretAccessKey: parsed.data.AWS_SECRET_ACCESS_KEY,
    },
  },

  AI: {
    provider: parsed.data.AI_PROVIDER,
    openai: { apiKey: parsed.data.OPENAI_API_KEY },
    gemini: { apiKey: parsed.data.GEMINI_API_KEY },
  },

  PASSWORD_EXPIRY_DAYS: parseInt(parsed.data.PASSWORD_EXPIRY_DAYS, 10),
  MAX_CONCURRENT_SESSIONS: parseInt(parsed.data.MAX_CONCURRENT_SESSIONS, 10),

  N8N_WEBHOOK_URL: parsed.data.N8N_WEBHOOK_URL,
};

export default config;