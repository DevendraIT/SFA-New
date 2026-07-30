import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import config from '../config/env.js';

/**
 * Request ID middleware
 * Adds unique request ID for tracing
 */
export const requestIdMiddleware = (req, res, next) => {
  req.id = crypto.randomUUID();
  res.setHeader('X-Request-ID', req.id);
  next();
};

/**
 * Security middleware configuration
 */
const allowedOrigins = config.CORS_ORIGIN.split(",").map(origin => origin.trim());
export const securityMiddleware = [
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
  cors({
    origin: config.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
];

/**
 * Compression middleware
 */
export const compressionMiddleware = compression();

/**
 * Cookie parser middleware
 */
export const cookieMiddleware = cookieParser();

/**
 * Rate limiting middleware
 */
export const rateLimitMiddleware = rateLimit({
  windowMs: config.RATE_LIMIT.windowMs,
  max: config.RATE_LIMIT.maxRequests,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV !== 'production',
});

/**
 * Strict rate limiting for auth endpoints
 */
export const authRateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per 15 minutes
  message: 'Too many login attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Request logging middleware
 */
export const requestLoggingMiddleware = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? 'error' : 'info';
    
    console.log(`[${req.id}] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });

  next();
};

export default {
  requestIdMiddleware,
  securityMiddleware,
  compressionMiddleware,
  cookieMiddleware,
  rateLimitMiddleware,
  authRateLimitMiddleware,
  requestLoggingMiddleware,
};
