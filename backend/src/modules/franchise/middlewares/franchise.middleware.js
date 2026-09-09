import jwt from 'jsonwebtoken';
import config from '../../../config/env.js';
import { AppError } from '../../../shared/response.js';

export const requireFranchiseAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(AppError.unauthorized('Authorization token is required'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.JWT.secret);

    // If it is a franchise admin token
    if (decoded.isFranchiseAdmin || decoded.roleName === 'Franchise Admin') {
      req.franchise = {
        id: decoded.franchiseId,
        email: decoded.email,
      };
      return next();
    }

    // Also allow global super admin
    const isSuperAdmin =
      decoded.roleName?.toLowerCase().includes('super') ||
      (Array.isArray(decoded.roles) &&
        decoded.roles.some((r) => r?.toLowerCase().includes('super')));

    if (isSuperAdmin) {
      req.franchise = {
        id: null, // Global access
        email: decoded.email,
      };
      return next();
    }

    return next(AppError.forbidden('Only Franchise Admin is authorized to access this resource'));
  } catch (err) {
    return next(AppError.unauthorized('Invalid or expired token'));
  }
};
