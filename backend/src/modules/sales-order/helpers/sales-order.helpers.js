/**
 * Sales Order Module - Helper Functions
 * Enterprise business logic utilities and calculations
 */

import { ORDER_STATUS, ORDER_STATUS_TRANSITIONS, BUSINESS_RULES, ORDER_PRIORITY } from '../constants/sales-order.constants.js';

// --------------------------------------------------
// Order Number Generation
// --------------------------------------------------
export class OrderNumberGenerator {
  /**
   * Generate unique order number
   * Format: SO-YYYY-MM-XXXXXX (e.g., SO-2024-01-000001)
   */
  static generateOrderNumber(companyCode = '', sequence = 1) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const paddedSequence = String(sequence).padStart(6, '0');
    const prefix = companyCode ? `${companyCode}-` : 'SO-';
    
    return `${prefix}${year}-${month}-${paddedSequence}`;
  }

  /**
   * Generate batch order numbers
   */
  static generateBatchNumbers(count, companyCode = '', startSequence = 1) {
    const numbers = [];
    for (let i = 0; i < count; i++) {
      numbers.push(this.generateOrderNumber(companyCode, startSequence + i));
    }
    return numbers;
  }
}

// --------------------------------------------------
// Financial Calculations
// --------------------------------------------------
export class OrderCalculations {
  /**
   * Calculate line item total
   */
  static calculateLineTotal(quantity, unitPrice, discountAmount = 0, taxAmount = 0) {
    const subtotal = (parseFloat(quantity) || 0) * (parseFloat(unitPrice) || 0);
    const discount = parseFloat(discountAmount) || 0;
    const tax = parseFloat(taxAmount) || 0;
    
    return Math.max(0, subtotal - discount + tax);
  }

  /**
   * Calculate order totals
   */
  static calculateOrderTotals(items = []) {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    items.forEach(item => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unitPrice) || 0;
      const itemSubtotal = quantity * unitPrice;
      
      subtotal += itemSubtotal;
      totalDiscount += parseFloat(item.discountAmount) || 0;
      totalTax += parseFloat(item.taxAmount) || 0;
    });

    const totalAmount = subtotal - totalDiscount + totalTax;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      discountAmount: Math.round(totalDiscount * 100) / 100,
      taxAmount: Math.round(totalTax * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
    };
  }

  /**
   * Apply percentage discount
   */
  static applyPercentageDiscount(amount, percentage) {
    const discountAmount = (parseFloat(amount) || 0) * (parseFloat(percentage) || 0) / 100;
    return Math.round(discountAmount * 100) / 100;
  }

  /**
   * Calculate tax amount
   */
  static calculateTax(amount, taxRate) {
    const taxAmount = (parseFloat(amount) || 0) * (parseFloat(taxRate) || 0) / 100;
    return Math.round(taxAmount * 100) / 100;
  }

  /**
   * Format currency amount
   */
  static formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount || 0);
  }
}

// --------------------------------------------------
// Status Workflow Management
// --------------------------------------------------
export class OrderStatusManager {
  /**
   * Check if status transition is valid
   */
  static isValidTransition(currentStatus, newStatus) {
    if (!currentStatus || !newStatus) return false;
    if (currentStatus === newStatus) return true;
    
    const allowedTransitions = ORDER_STATUS_TRANSITIONS[currentStatus] || [];
    return allowedTransitions.includes(newStatus);
  }

  /**
   * Get allowed next statuses
   */
  static getAllowedTransitions(currentStatus) {
    return ORDER_STATUS_TRANSITIONS[currentStatus] || [];
  }

  /**
   * Check if status is terminal (no further transitions)
   */
  static isTerminalStatus(status) {
    return ORDER_STATUS_TRANSITIONS[status]?.length === 0;
  }

  /**
   * Get status display information
   */
  static getStatusInfo(status) {
    const statusMap = {
      [ORDER_STATUS.DRAFT]: { label: 'Draft', color: 'gray', canEdit: true },
      [ORDER_STATUS.PENDING]: { label: 'Pending Approval', color: 'yellow', canEdit: false },
      [ORDER_STATUS.APPROVED]: { label: 'Approved', color: 'green', canEdit: false },
      [ORDER_STATUS.REJECTED]: { label: 'Rejected', color: 'red', canEdit: true },
      [ORDER_STATUS.CANCELLED]: { label: 'Cancelled', color: 'red', canEdit: false },
      [ORDER_STATUS.COMPLETED]: { label: 'Completed', color: 'blue', canEdit: false },
      [ORDER_STATUS.ON_HOLD]: { label: 'On Hold', color: 'orange', canEdit: false },
    };

    return statusMap[status] || { label: status, color: 'gray', canEdit: false };
  }
}

// --------------------------------------------------
// Business Rules Validation
// --------------------------------------------------
export class OrderBusinessRules {
  /**
   * Validate order against business rules
   */
  static validateOrder(orderData) {
    const errors = [];
    const warnings = [];

    // Validate order items count
    if (!orderData.items || orderData.items.length === 0) {
      errors.push('Order must have at least one item');
    } else if (orderData.items.length > BUSINESS_RULES.MAX_ORDER_ITEMS) {
      errors.push(`Order cannot have more than ${BUSINESS_RULES.MAX_ORDER_ITEMS} items`);
    }

    // Validate order value
    const totals = OrderCalculations.calculateOrderTotals(orderData.items || []);
    if (totals.totalAmount < BUSINESS_RULES.MIN_ORDER_VALUE) {
      errors.push(`Order value must be at least ${BUSINESS_RULES.MIN_ORDER_VALUE}`);
    }
    if (totals.totalAmount > BUSINESS_RULES.MAX_ORDER_VALUE) {
      errors.push(`Order value cannot exceed ${BUSINESS_RULES.MAX_ORDER_VALUE}`);
    }

    // Validate quantities
    orderData.items?.forEach((item, index) => {
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
      }
      if (!item.unitPrice || item.unitPrice < 0) {
        errors.push(`Item ${index + 1}: Unit price cannot be negative`);
      }
    });

    // Business warnings
    if (totals.totalAmount > BUSINESS_RULES.AUTO_APPROVAL_THRESHOLD) {
      warnings.push('Order exceeds auto-approval threshold and will require manual approval');
    }

    return { errors, warnings, isValid: errors.length === 0 };
  }

  /**
   * Check if order requires approval
   */
  static requiresApproval(orderData) {
    const totals = OrderCalculations.calculateOrderTotals(orderData.items || []);
    return totals.totalAmount > BUSINESS_RULES.AUTO_APPROVAL_THRESHOLD;
  }

  /**
   * Get required approval level
   */
  static getRequiredApprovalLevel(orderData) {
    const totals = OrderCalculations.calculateOrderTotals(orderData.items || []);
    
    if (totals.totalAmount <= BUSINESS_RULES.AUTO_APPROVAL_THRESHOLD) {
      return null; // No approval needed
    }
    if (totals.totalAmount <= BUSINESS_RULES.MANAGER_APPROVAL_THRESHOLD) {
      return 'manager';
    }
    return 'senior_management';
  }
}

// --------------------------------------------------
// Data Sanitization
// --------------------------------------------------
export class OrderDataSanitizer {
  /**
   * Sanitize order creation data
   */
  static sanitizeCreateData(data) {
    const sanitized = {
      customerId: data.customerId?.trim(),
      organizationId: data.organizationId?.trim(),
      branchId: data.branchId?.trim(),
      territoryId: data.territoryId?.trim(),
      ownerId: data.ownerId?.trim(),
      quotationId: data.quotationId?.trim(),
      orderType: data.orderType?.trim(),
      priority: data.priority?.trim() || ORDER_PRIORITY.NORMAL,
      orderDate: data.orderDate ? new Date(data.orderDate) : new Date(),
      expectedDeliveryDate: data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate) : null,
      paymentTerms: data.paymentTerms?.trim(),
      deliveryTerms: data.deliveryTerms?.trim(),
      currency: (data.currency?.trim() || BUSINESS_RULES.DEFAULT_CURRENCY).toUpperCase(),
      notes: data.notes?.trim(),
      items: this.sanitizeItems(data.items),
    };

    // Remove undefined values
    Object.keys(sanitized).forEach(key => {
      if (sanitized[key] === undefined || sanitized[key] === '') {
        delete sanitized[key];
      }
    });

    return sanitized;
  }

  /**
   * Sanitize order items
   */
  static sanitizeItems(items = []) {
    return items.map(item => ({
      productId: item.productId?.trim(),
      description: item.description?.trim(),
      quantity: Math.max(0, parseFloat(item.quantity) || 0),
      unitPrice: Math.max(0, parseFloat(item.unitPrice) || 0),
      discountAmount: Math.max(0, parseFloat(item.discountAmount) || 0),
      taxAmount: Math.max(0, parseFloat(item.taxAmount) || 0),
    })).filter(item => item.description && item.quantity > 0);
  }
}

// --------------------------------------------------
// Query Helpers
// --------------------------------------------------
export class OrderQueryHelper {
  /**
   * Build order filters for database queries
   */
  static buildFilters(queryParams = {}) {
    const filters = {};

    if (queryParams.status) {
      filters.status = queryParams.status;
    }
    if (queryParams.customerId) {
      filters.customerId = queryParams.customerId;
    }
    if (queryParams.organizationId) {
      filters.organizationId = queryParams.organizationId;
    }
    if (queryParams.branchId) {
      filters.branchId = queryParams.branchId;
    }
    if (queryParams.territoryId) {
      filters.territoryId = queryParams.territoryId;
    }
    if (queryParams.ownerId) {
      filters.ownerId = queryParams.ownerId;
    }
    
    // Date range filters
    if (queryParams.fromDate || queryParams.toDate) {
      filters.orderDate = {};
      if (queryParams.fromDate) {
        filters.orderDate.gte = new Date(queryParams.fromDate);
      }
      if (queryParams.toDate) {
        filters.orderDate.lte = new Date(queryParams.toDate);
      }
    }

    return filters;
  }

  /**
   * Build search conditions
   */
  static buildSearchCondition(searchTerm) {
    if (!searchTerm?.trim()) return {};

    return {
      OR: [
        { orderNumber: { contains: searchTerm, mode: 'insensitive' } },
        { notes: { contains: searchTerm, mode: 'insensitive' } },
        { customer: { name: { contains: searchTerm, mode: 'insensitive' } } },
        { customer: { email: { contains: searchTerm, mode: 'insensitive' } } },
      ],
    };
  }

  /**
   * Build sort configuration
   */
  static buildSortConfig(sortBy = 'createdAt', sortOrder = 'desc') {
    const sortMap = {
      orderNumber: 'orderNumber',
      customerName: { customer: { name: sortOrder } },
      orderDate: 'orderDate',
      totalAmount: 'totalAmount',
      status: 'status',
      priority: 'priority',
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    };

    const sortField = sortMap[sortBy] || 'createdAt';
    
    if (typeof sortField === 'string') {
      return { [sortField]: sortOrder };
    }
    
    return sortField;
  }
}

export default {
  OrderNumberGenerator,
  OrderCalculations,
  OrderStatusManager,
  OrderBusinessRules,
  OrderDataSanitizer,
  OrderQueryHelper,
};