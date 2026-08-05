import { verifyAccessToken } from '../config/jwt.js';
import { AppError } from '../shared/response.js';
import { prisma } from '../config/database.js';

/**
 * Authenticate user via JWT token
 * Extracts token from Authorization header and validates it
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw AppError.unauthorized('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    // Fetch user from database matching multi-role relational schema
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw AppError.unauthorized('User not found or inactive');
    }

    if (user.deletedAt) {
      throw AppError.unauthorized('User account has been deleted');
    }

    // Attach user metadata to request context
    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.roles.map((ur) => ur.role.name),
      permissions: user.roles.flatMap((ur) => ur.role.permissions.map((rp) => rp.permission.slug)),
      organizationId: user.organizationId,
      branchId: user.branchId,
      departmentId: user.departmentId,
      teamId: user.teamId,
    };

    console.log("=================================");
console.log("Logged User :", req.user.email);
console.log("Roles :", req.user.roles);
console.log("Permissions :", req.user.permissions);
console.log("=================================");

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Authorize user based on role or permissions
 * @param {string[]|string} requiredPermissions - Permissions required
 */
export const authorize = (requiredPermissions) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw AppError.unauthorized('Authentication required');
      }

      // TEMPORARY: Skip permission check for testing (set SKIP_PERMISSION_CHECK=true in .env)
      if (process.env.SKIP_PERMISSION_CHECK === 'true') {
        return next();
      }

      const permissions = Array.isArray(requiredPermissions)
        ? requiredPermissions
        : [requiredPermissions];

      // Organization Super Admin is the tenant's highest-privilege role.  It
      // must retain access even if permission mappings were created before a
      // newly added permission (for example company/branch permissions).
      if (req.user.roles.includes('Organization Super Admin')) {
        return next();
      }

      const hasPermission = permissions.some((permission) =>
        req.user.permissions.includes(permission)
      );

      if (!hasPermission) {
        throw AppError.forbidden('Insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check user's organizational access
 * Ensures user can only access their organization's data
 */
export const requireOrganization = (req, res, next) => {
  try {
    if (!req.user) {
      throw AppError.unauthorized('Authentication required');
    }

    if (!req.user.organizationId) {
      throw AppError.forbidden('User does not belong to any organization');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Require Super Admin role for sensitive administrative actions
 */
export const requireSuperAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      throw AppError.unauthorized('Authentication required');
    }

    const isSuperAdmin = req.user.roles.some((r) =>
      r && (r.toLowerCase().includes('super admin') || r.toLowerCase().includes('organization super admin'))
    );

    if (!isSuperAdmin) {
      throw AppError.forbidden('Only Super Admin can create, edit, or delete organizations.');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Verify user owns resource
 * @param {Object} req - Request context
 * @param {string} resourceOwnerId - ID of the resource owner
 */
export const verifyOwnership = (req, resourceOwnerId) => {
  if (resourceOwnerId !== req.user?.id) {
    throw AppError.forbidden('You do not own this resource');
  }
};

export default authenticate;
