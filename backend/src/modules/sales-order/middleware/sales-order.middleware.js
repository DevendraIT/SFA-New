/**
 * Sales Order Module - Middleware Functions
 * Enterprise middleware for authentication, authorization, validation, and business logic
 */

import { hasPermission } from '../../auth/auth.permissions.js';
import { ORDERS_PERMISSIONS } from '../constants/sales-order.permissions.js';
import { OrderStatusManager, OrderBusinessRules } from '../helpers/sales-order.helpers.js';
import { ORDER_STATUS } from '../constants/sales-order.constants.js';
import { AppError } from '../../../shared/response.js';

// --------------------------------------------------
// Permission Middleware
// --------------------------------------------------

/**
 * Check if user has permission to read orders
 */
export const requireReadOrderPermission = (req, res, next) => {
  try {
    const user = req.user;
    
    if (!hasPermission(user, ORDERS_PERMISSIONS.READ)) {
      throw AppError.forbidden('Insufficient permissions to read orders');
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user has permission to create orders
 */
export const requireCreateOrderPermission = (req, res, next) => {
  try {
    const user = req.user;
    
    if (!hasPermission(user, ORDERS_PERMISSIONS.CREATE)) {
      throw AppError.forbidden('Insufficient permissions to create orders');
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user has permission to update orders
 */
export const requireUpdateOrderPermission = (req, res, next) => {
  try {
    const user = req.user;
    
    if (!hasPermission(user, ORDERS_PERMISSIONS.UPDATE)) {
      throw AppError.forbidden('Insufficient permissions to update orders');
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user has permission to delete orders
 */
export const requireDeleteOrderPermission = (req, res, next) => {
  try {
    const user = req.user;
    
    if (!hasPermission(user, ORDERS_PERMISSIONS.DELETE)) {
      throw AppError.forbidden('Insufficient permissions to delete orders');
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user has permission to approve orders
 */
export const requireApproveOrderPermission = (req, res, next) => {
  try {
    const user = req.user;
    
    if (!hasPermission(user, ORDERS_PERMISSIONS.APPROVE)) {
      throw AppError.forbidden('Insufficient permissions to approve orders');
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

// --------------------------------------------------
// Order Ownership & Context Middleware
// --------------------------------------------------

/**
 * Check if user can access order based on ownership and organization context
 */
export const requireOrderAccess = async (req, res, next) => {
  try {
    const user = req.user;
    const orderId = req.params.id;
    
    // Administrator bypass
    if (user.roles?.includes('Administrator')) {
      return next();
    }
    
    // TODO: Implement order access checking
    // 1. Fetch order with organization context
    // 2. Check if user belongs to same organization
    // 3. Check if user has access to the territory/branch/company
    // 4. Check ownership if required
    
    // For now, allow access - will be implemented when database models are ready
    req.orderAccess = {
      canRead: true,
      canUpdate: user.id === req.order?.ownerId || hasPermission(user, ORDERS_PERMISSIONS.UPDATE),
      canDelete: user.id === req.order?.ownerId || hasPermission(user, ORDERS_PERMISSIONS.DELETE),
    };
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Load order and attach to request
 */
export const loadOrder = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    
    if (!orderId) {
      throw AppError.badRequest('Order ID is required');
    }
    
    // TODO: Implement order loading from database
    // const order = await orderRepository.findById(orderId);
    // if (!order) {
    //   throw AppError.notFound('Order not found');
    // }
    
    // Mock order for now
    req.order = {
      id: orderId,
      status: ORDER_STATUS.DRAFT,
      ownerId: req.user?.id,
      organizationId: req.user?.organizationId,
    };
    
    next();
  } catch (error) {
    next(error);
  }
};

// --------------------------------------------------
// Business Logic Middleware
// --------------------------------------------------

/**
 * Validate order status transition
 */
export const validateStatusTransition = (req, res, next) => {
  try {
    const currentStatus = req.order?.status;
    const newStatus = req.body?.status;
    
    if (!newStatus) {
      return next();
    }
    
    if (!OrderStatusManager.isValidTransition(currentStatus, newStatus)) {
      const allowedTransitions = OrderStatusManager.getAllowedTransitions(currentStatus);
      throw AppError.badRequest(
        `Invalid status transition from '${currentStatus}' to '${newStatus}'. ` +
        `Allowed transitions: ${allowedTransitions.join(', ')}`
      );
    }
    
    // Add transition metadata to request
    req.statusTransition = {
      from: currentStatus,
      to: newStatus,
      isTerminal: OrderStatusManager.isTerminalStatus(newStatus),
      reason: req.body.reason || null,
    };
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check if order can be edited
 */
export const requireEditableOrder = (req, res, next) => {
  try {
    const order = req.order;
    
    if (!order) {
      throw AppError.badRequest('Order not found in request context');
    }
    
    const statusInfo = OrderStatusManager.getStatusInfo(order.status);
    
    if (!statusInfo.canEdit) {
      throw AppError.badRequest(
        `Orders with status '${order.status}' cannot be edited`
      );
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate business rules for order creation/update
 */
export const validateBusinessRules = (req, res, next) => {
  try {
    const orderData = req.body;
    
    const validation = OrderBusinessRules.validateOrder(orderData);
    
    if (!validation.isValid) {
      throw AppError.badRequest('Order validation failed', {
        errors: validation.errors,
        warnings: validation.warnings,
      });
    }
    
    // Attach validation results to request
    req.businessValidation = validation;
    
    // Add approval requirements
    req.approvalRequired = OrderBusinessRules.requiresApproval(orderData);
    req.approvalLevel = OrderBusinessRules.getRequiredApprovalLevel(orderData);
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check approval requirements for order operations
 */
export const checkApprovalRequirements = (req, res, next) => {
  try {
    const user = req.user;
    const order = req.order;
    const operation = req.method.toLowerCase();
    
    // Skip approval check for administrators
    if (user.roles?.includes('Administrator')) {
      return next();
    }
    
    // TODO: Implement approval requirement checking
    // 1. Check if operation requires approval based on order value
    // 2. Check user's approval authority level
    // 3. Check if current user can perform the operation
    
    req.approvalStatus = {
      required: req.approvalRequired || false,
      level: req.approvalLevel || null,
      canApprove: true, // TODO: Implement approval authority checking
      requiresEscalation: false,
    };
    
    next();
  } catch (error) {
    next(error);
  }
};

// --------------------------------------------------
// Rate Limiting Middleware
// --------------------------------------------------

/**
 * Rate limiting for order creation
 */
export const orderCreationRateLimit = (req, res, next) => {
  // TODO: Implement rate limiting logic
  // Example: Max 100 orders per hour per user
  
  const user = req.user;
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  
  // Mock rate limit check
  req.rateLimitInfo = {
    limit: 100,
    remaining: 95,
    resetTime: new Date(now.getTime() + 60 * 60 * 1000),
  };
  
  next();
};

/**
 * Rate limiting for bulk operations
 */
export const bulkOperationRateLimit = (req, res, next) => {
  const user = req.user;
  const orderIds = req.body.orderIds || [];
  
  if (orderIds.length > 100) {
    throw AppError.badRequest('Bulk operations are limited to 100 orders at a time');
  }
  
  // TODO: Implement more sophisticated rate limiting
  req.bulkLimitInfo = {
    maxItems: 100,
    requestedItems: orderIds.length,
    allowed: true,
  };
  
  next();
};

// --------------------------------------------------
// Audit Trail Middleware
// --------------------------------------------------

/**
 * Log order operations for audit trail
 */
export const auditOrderOperation = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Log the operation after successful response
    const auditData = {
      userId: req.user?.id,
      operation: `${req.method} ${req.route?.path}`,
      orderId: req.params?.id || req.body?.id,
      timestamp: new Date().toISOString(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
    };
    
    // TODO: Send to audit logging service
    console.log('Order Operation Audit:', auditData);
    
    originalSend.call(this, data);
  };
  
  next();
};

// --------------------------------------------------
// Error Handling Middleware
// --------------------------------------------------

/**
 * Handle order-specific errors
 */
export const handleOrderErrors = (error, req, res, next) => {
  // Handle specific order errors
  if (error.code === 'ORDER_NOT_FOUND') {
    return res.status(404).json({
      success: false,
      error: {
        code: 'ORDER_NOT_FOUND',
        message: 'The requested order could not be found',
      },
    });
  }
  
  if (error.code === 'INVALID_STATUS_TRANSITION') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_STATUS_TRANSITION',
        message: error.message,
        details: error.details,
      },
    });
  }
  
  if (error.code === 'BUSINESS_RULE_VIOLATION') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'BUSINESS_RULE_VIOLATION',
        message: 'Order violates business rules',
        details: error.details,
      },
    });
  }
  
  // Pass to general error handler
  next(error);
};

// --------------------------------------------------
// Utility Middleware
// --------------------------------------------------

/**
 * Parse and validate pagination parameters
 */
export const parsePagination = (req, res, next) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const offset = (page - 1) * limit;
  
  req.pagination = { page, limit, offset };
  next();
};

/**
 * Parse and validate sorting parameters
 */
export const parseSorting = (req, res, next) => {
  const sortBy = req.query.sortBy || 'createdAt';
  const sortOrder = ['asc', 'desc'].includes(req.query.sortOrder) ? req.query.sortOrder : 'desc';
  
  req.sorting = { sortBy, sortOrder };
  next();
};

/**
 * Parse and validate filter parameters
 */
export const parseFilters = (req, res, next) => {
  const filters = {};
  
  // Status filter
  if (req.query.status) {
    filters.status = req.query.status;
  }
  
  // Date range filters
  if (req.query.fromDate) {
    filters.fromDate = new Date(req.query.fromDate);
  }
  if (req.query.toDate) {
    filters.toDate = new Date(req.query.toDate);
  }
  
  // Organization context filters
  if (req.query.customerId) {
    filters.customerId = req.query.customerId;
  }
  if (req.query.organizationId) {
    filters.organizationId = req.query.organizationId;
  }
  if (req.query.branchId) {
    filters.branchId = req.query.branchId;
  }
  if (req.query.territoryId) {
    filters.territoryId = req.query.territoryId;
  }
  if (req.query.ownerId) {
    filters.ownerId = req.query.ownerId;
  }
  
  // Search term
  if (req.query.q) {
    filters.searchTerm = req.query.q.trim();
  }
  
  req.filters = filters;
  next();
};

export default {
  requireReadOrderPermission,
  requireCreateOrderPermission,
  requireUpdateOrderPermission,
  requireDeleteOrderPermission,
  requireOrderAccess,
  loadOrder,
  validateStatusTransition,
  requireEditableOrder,
  validateBusinessRules,
  checkApprovalRequirements,
  orderCreationRateLimit,
  bulkOperationRateLimit,
  auditOrderOperation,
  handleOrderErrors,
  parsePagination,
  parseSorting,
  parseFilters,
};