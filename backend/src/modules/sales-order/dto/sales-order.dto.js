/**
 * Sales Order Module - Data Transfer Objects (DTOs)
 * Enterprise-grade response formatting and data transformation
 */

import { ORDER_STATUS, ORDER_PRIORITY, ORDER_TYPE } from '../constants/sales-order.constants.js';

// --------------------------------------------------
// Base DTO Helpers
// --------------------------------------------------
class BaseOrderDto {
  constructor(data = {}) {
    this.id = data.id;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  static formatMoney(amount, currency = 'USD') {
    return {
      amount: parseFloat(amount) || 0,
      currency: currency,
      formatted: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
      }).format(amount || 0),
    };
  }

  static formatDate(date) {
    if (!date) return null;
    return {
      iso: new Date(date).toISOString(),
      formatted: new Date(date).toLocaleDateString(),
      timestamp: new Date(date).getTime(),
    };
  }
}

// --------------------------------------------------
// Order Item DTO
// --------------------------------------------------
export class OrderItemDto extends BaseOrderDto {
  constructor(item = {}) {
    super(item);
    this.productId = item.productId;
    this.productName = item.productName || item.description;
    this.description = item.description;
    this.quantity = parseFloat(item.quantity) || 0;
    this.unitPrice = BaseOrderDto.formatMoney(item.unitPrice, item.currency);
    this.discountAmount = BaseOrderDto.formatMoney(item.discountAmount, item.currency);
    this.taxAmount = BaseOrderDto.formatMoney(item.taxAmount, item.currency);
    this.lineTotal = BaseOrderDto.formatMoney(this.calculateLineTotal(item), item.currency);
  }

  calculateLineTotal(item) {
    const subtotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0);
    const discount = parseFloat(item.discountAmount) || 0;
    const tax = parseFloat(item.taxAmount) || 0;
    return subtotal - discount + tax;
  }
}

// --------------------------------------------------
// Order List DTO (Lightweight)
// --------------------------------------------------
export class OrderListDto extends BaseOrderDto {
  constructor(order = {}) {
    super(order);
    this.orderNumber = order.orderNumber;
    this.customerName = order.customerName || order.customer?.name;
    this.customerId = order.customerId;
    this.status = order.status;
    this.priority = order.priority || ORDER_PRIORITY.NORMAL;
    this.orderType = order.orderType || ORDER_TYPE.STANDARD;
    this.orderDate = BaseOrderDto.formatDate(order.orderDate);
    this.expectedDeliveryDate = BaseOrderDto.formatDate(order.expectedDeliveryDate);
    this.totalAmount = BaseOrderDto.formatMoney(order.totalAmount, order.currency);
    this.itemCount = parseInt(order.itemCount) || (order.items ? order.items.length : 0);
    this.ownerName = order.ownerName || order.owner?.name;
    this.companyName = order.companyName || order.company?.name;
  }
}

// --------------------------------------------------
// Order Details DTO (Full)
// --------------------------------------------------
export class OrderDetailsDto extends BaseOrderDto {
  constructor(order = {}) {
    super(order);
    this.orderNumber = order.orderNumber;
    this.status = order.status;
    this.priority = order.priority || ORDER_PRIORITY.NORMAL;
    this.orderType = order.orderType || ORDER_TYPE.STANDARD;
    
    // Dates
    this.orderDate = BaseOrderDto.formatDate(order.orderDate);
    this.expectedDeliveryDate = BaseOrderDto.formatDate(order.expectedDeliveryDate);
    this.actualDeliveryDate = BaseOrderDto.formatDate(order.actualDeliveryDate);
    
    // Customer Information
    this.customer = {
      id: order.customerId,
      name: order.customerName || order.customer?.name,
      email: order.customerEmail || order.customer?.email,
      phone: order.customerPhone || order.customer?.phone,
    };

    // Organization Context
    this.organization = {
      organizationId: order.organizationId,
      companyName: order.companyName || order.company?.name,
      branchId: order.branchId,
      branchName: order.branchName || order.branch?.name,
      territoryId: order.territoryId,
      territoryName: order.territoryName || order.territory?.name,
    };

    // Order Items
    this.items = (order.items || []).map(item => new OrderItemDto(item));
    this.itemCount = this.items.length;

    // Financial Summary
    this.financial = this.calculateFinancials(order);

    // Terms
    this.paymentTerms = order.paymentTerms;
    this.deliveryTerms = order.deliveryTerms;
    
    // Metadata
    this.notes = order.notes;
    this.currency = order.currency || 'USD';
    this.quotationId = order.quotationId;
    
    // Ownership
    this.owner = {
      id: order.ownerId,
      name: order.ownerName || order.owner?.name,
      email: order.ownerEmail || order.owner?.email,
    };

    // Audit Information
    this.audit = {
      createdBy: order.createdBy,
      createdByName: order.createdByName || order.createdByUser?.name,
      updatedBy: order.updatedBy,
      updatedByName: order.updatedByName || order.updatedByUser?.name,
      createdAt: BaseOrderDto.formatDate(order.createdAt),
      updatedAt: BaseOrderDto.formatDate(order.updatedAt),
    };
  }

  calculateFinancials(order) {
    const currency = order.currency || 'USD';
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    if (order.items && Array.isArray(order.items)) {
      order.items.forEach(item => {
        const quantity = parseFloat(item.quantity) || 0;
        const unitPrice = parseFloat(item.unitPrice) || 0;
        const itemSubtotal = quantity * unitPrice;
        
        subtotal += itemSubtotal;
        totalDiscount += parseFloat(item.discountAmount) || 0;
        totalTax += parseFloat(item.taxAmount) || 0;
      });
    }

    const total = subtotal - totalDiscount + totalTax;

    return {
      subtotal: BaseOrderDto.formatMoney(subtotal, currency),
      discountAmount: BaseOrderDto.formatMoney(totalDiscount, currency),
      taxAmount: BaseOrderDto.formatMoney(totalTax, currency),
      totalAmount: BaseOrderDto.formatMoney(total, currency),
      currency: currency,
    };
  }
}

// --------------------------------------------------
// Order Create DTO
// --------------------------------------------------
export class OrderCreateDto {
  constructor(requestData = {}) {
    this.customerId = requestData.customerId;
    this.organizationId = requestData.organizationId;
    this.branchId = requestData.branchId;
    this.territoryId = requestData.territoryId;
    this.ownerId = requestData.ownerId;
    this.quotationId = requestData.quotationId;
    this.orderType = requestData.orderType || ORDER_TYPE.STANDARD;
    this.priority = requestData.priority || ORDER_PRIORITY.NORMAL;
    this.orderDate = requestData.orderDate ? new Date(requestData.orderDate) : new Date();
    this.expectedDeliveryDate = requestData.expectedDeliveryDate ? new Date(requestData.expectedDeliveryDate) : null;
    this.paymentTerms = requestData.paymentTerms;
    this.deliveryTerms = requestData.deliveryTerms;
    this.currency = requestData.currency || 'USD';
    this.notes = requestData.notes;
    this.items = (requestData.items || []).map(item => ({
      productId: item.productId,
      description: item.description,
      quantity: parseFloat(item.quantity) || 0,
      unitPrice: parseFloat(item.unitPrice) || 0,
      discountAmount: parseFloat(item.discountAmount) || 0,
      taxAmount: parseFloat(item.taxAmount) || 0,
    }));
    this.status = ORDER_STATUS.DRAFT;
  }
}

// --------------------------------------------------
// Order Update DTO
// --------------------------------------------------
export class OrderUpdateDto {
  constructor(requestData = {}) {
    if (requestData.customerId) this.customerId = requestData.customerId;
    if (requestData.organizationId) this.organizationId = requestData.organizationId;
    if (requestData.branchId) this.branchId = requestData.branchId;
    if (requestData.territoryId) this.territoryId = requestData.territoryId;
    if (requestData.ownerId) this.ownerId = requestData.ownerId;
    if (requestData.orderType) this.orderType = requestData.orderType;
    if (requestData.priority) this.priority = requestData.priority;
    if (requestData.orderDate) this.orderDate = new Date(requestData.orderDate);
    if (requestData.expectedDeliveryDate) this.expectedDeliveryDate = new Date(requestData.expectedDeliveryDate);
    if (requestData.paymentTerms) this.paymentTerms = requestData.paymentTerms;
    if (requestData.deliveryTerms) this.deliveryTerms = requestData.deliveryTerms;
    if (requestData.currency) this.currency = requestData.currency;
    if (requestData.notes !== undefined) this.notes = requestData.notes;
    if (requestData.items) {
      this.items = requestData.items.map(item => ({
        productId: item.productId,
        description: item.description,
        quantity: parseFloat(item.quantity) || 0,
        unitPrice: parseFloat(item.unitPrice) || 0,
        discountAmount: parseFloat(item.discountAmount) || 0,
        taxAmount: parseFloat(item.taxAmount) || 0,
      }));
    }
  }
}

// --------------------------------------------------
// Order Status DTO
// --------------------------------------------------
export class OrderStatusDto {
  constructor(order = {}) {
    this.id = order.id;
    this.orderNumber = order.orderNumber;
    this.status = order.status;
    this.previousStatus = order.previousStatus;
    this.statusChangedAt = BaseOrderDto.formatDate(order.statusChangedAt || order.updatedAt);
    this.statusChangedBy = order.statusChangedBy;
    this.reason = order.statusChangeReason;
  }
}

// --------------------------------------------------
// Order Activity DTO
// --------------------------------------------------
export class OrderActivityDto extends BaseOrderDto {
  constructor(activity = {}) {
    super(activity);
    this.orderId = activity.orderId;
    this.activityType = activity.activityType;
    this.description = activity.description;
    this.performedBy = {
      id: activity.performedBy,
      name: activity.performedByName || activity.performedByUser?.name,
    };
    this.performedAt = BaseOrderDto.formatDate(activity.performedAt || activity.createdAt);
    this.metadata = activity.metadata || {};
  }
}

// --------------------------------------------------
// Bulk Operation Result DTO
// --------------------------------------------------
export class BulkOperationResultDto {
  constructor(results = {}) {
    this.totalRequested = results.totalRequested || 0;
    this.successful = results.successful || 0;
    this.failed = results.failed || 0;
    this.skipped = results.skipped || 0;
    this.successRate = this.totalRequested > 0 ? 
      Math.round((this.successful / this.totalRequested) * 100) : 0;
    this.errors = results.errors || [];
    this.processedIds = results.processedIds || [];
  }
}

export default {
  OrderItemDto,
  OrderListDto,
  OrderDetailsDto,
  OrderCreateDto,
  OrderUpdateDto,
  OrderStatusDto,
  OrderActivityDto,
  BulkOperationResultDto,
};