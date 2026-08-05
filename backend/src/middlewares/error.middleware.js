import { AppError, ApiResponse } from '../shared/response.js';

/**
 * Global Error Handling Middleware
 * Catches all errors and returns standardized error response
 */
export const errorHandler = (err, req, res, next) => {
  // Always log error details in console for diagnostic visibility
  console.error('❌ HTTP Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    const errors = (err.issues || err.errors || []).map((error) => ({
      field: error.path.join('.'),
      message: error.message,
    }));
    return res.status(422).json(ApiResponse.error('Validation failed', errors));
  }

  // Handle AppError
  if (err.isOperational && err instanceof AppError) {
    return res.status(err.statusCode).json(
      ApiResponse.error(err.message, err.errors)
    );
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res
      .status(401)
      .json(ApiResponse.error('Invalid token'));
  }

  if (err.name === 'TokenExpiredError') {
    return res
      .status(401)
      .json(ApiResponse.error('Token expired'));
  }

  // Default error response
  return res.status(500).json(
    ApiResponse.error('Internal server error')
  );
};

/**
 * Async Route Handler Wrapper
 * Wraps async route handlers to catch errors
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default errorHandler;
