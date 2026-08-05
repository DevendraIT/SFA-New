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

  static formatMoney(amount, currency = 'INR') {
    const cur = currency || 'INR';
    return {
      amount: parseFloat(amount) || 0,
      currency: cur,
      formatted: new Intl.NumberFormat(cur === 'INR' ? 'en-IN' : 'en-US', {
        style: 'currency',
        currency: cur,
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
    const realPrice = parseFloat(item.product?.price) || parseFloat(item.unitPrice) || 0;
    this.productId = item.productId;
    this.productName = item.product?.name || item.productName || item.description;
    this.sku = item.product?.sku || '-';
    this.description = item.description;
    this.quantity = parseFloat(item.quantity) || 0;
    this.unitPrice = BaseOrderDto.formatMoney(realPrice, item.currency || 'INR');
    this.discountAmount = BaseOrderDto.formatMoney(item.discountAmount, item.currency || 'INR');
    this.taxAmount = BaseOrderDto.formatMoney(item.taxAmount, item.currency || 'INR');
    this.lineTotal = BaseOrderDto.formatMoney(this.calculateLineTotal(item, realPrice), item.currency || 'INR');
  }

  calculateLineTotal(item, price) {
    const qty = parseFloat(item.quantity) || 0;
    const unitP = price !== undefined ? price : (parseFloat(item.unitPrice) || 0);
    const subtotal = qty * unitP;
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
    const ownerName = order.owner ? `${order.owner.firstName || ''} ${order.owner.lastName || ''}`.trim() : (order.ownerName || '-');
    const branchName = order.branch?.name || order.owner?.branch?.name || (order.branchId ? 'Mohit Branch' : 'Indore Palasiya Branch');
    this.orderName = order.orderName || order.orderNumber;
    this.orderNumber = order.orderNumber;
    this.customer = {
      id: order.customerId,
      name: order.customer?.name || order.customerName || 'N/A',
      email: order.customer?.email || order.customerEmail || '-',
      phone: order.customer?.phone || order.customerPhone || '-',
      companyName: order.customer?.companyName || '-',
    };
    this.customerName = this.customer.name;
    this.customerId = order.customerId;
    this.status = order.status;
    this.priority = order.priority || ORDER_PRIORITY.NORMAL;
    this.orderType = order.orderType || ORDER_TYPE.STANDARD;
    this.orderDate = BaseOrderDto.formatDate(order.orderDate || order.createdAt);
    this.expectedDeliveryDate = BaseOrderDto.formatDate(order.expectedDeliveryDate);
    
    // Recalculate total amount from items if items exist with real product prices
    let calculatedTotal = parseFloat(order.totalAmount) || 0;
    const itemsList = (order.items || []).map(item => new OrderItemDto(item));
    if (itemsList.length > 0) {
      const sumItems = itemsList.reduce((acc, curr) => acc + (curr.lineTotal?.amount || 0), 0);
      if (sumItems > 0) calculatedTotal = sumItems;
    }

    this.totalAmount = BaseOrderDto.formatMoney(calculatedTotal, order.currency || 'INR');
    this.items = itemsList;
    this.itemCount = this.items.length || (parseInt(order.itemCount) || 0);
    this.owner = {
      id: order.ownerId,
      name: ownerName,
      email: order.owner?.email || '-',
      branchName: branchName,
    };
    this.ownerName = ownerName;
    this.branchName = branchName;
    this.companyName = order.organization?.name || order.companyName || 'IT Software';
  }
}

// --------------------------------------------------
// Order Details DTO (Full)
// --------------------------------------------------
export class OrderDetailsDto extends BaseOrderDto {
  constructor(order = {}) {
    super(order);
    const ownerName = order.owner ? `${order.owner.firstName || ''} ${order.owner.lastName || ''}`.trim() : (order.ownerName || '-');
    this.orderNumber = order.orderNumber;
    this.orderName = order.orderName || order.orderNumber;
    this.status = order.status;
    this.priority = order.priority || ORDER_PRIORITY.NORMAL;
    this.orderType = order.orderType || ORDER_TYPE.STANDARD;
    
    // Dates
    this.orderDate = BaseOrderDto.formatDate(order.orderDate || order.createdAt);
    this.expectedDeliveryDate = BaseOrderDto.formatDate(order.expectedDeliveryDate);
    this.actualDeliveryDate = BaseOrderDto.formatDate(order.actualDeliveryDate);
    
    // Customer Information
    this.customer = {
      id: order.customerId,
      name: order.customer?.name || order.customerName || 'N/A',
      email: order.customer?.email || order.customerEmail || '-',
      phone: order.customer?.phone || order.customerPhone || '-',
      companyName: order.customer?.companyName || '-',
      gstNumber: order.customer?.gstNumber || '-',
      panNumber: order.customer?.panNumber || '-',
      address: order.customer?.address || '-',
      city: order.customer?.city || '-',
      state: order.customer?.state || '-',
    };

    // Organization Context
    this.organization = {
      organizationId: order.organizationId,
      companyName: order.organization?.name || order.companyName || '-',
      branchId: order.branchId || order.owner?.branchId,
      branchName: order.branch?.name || order.owner?.branch?.name || '-',
      territoryId: order.territoryId,
      territoryName: order.territory?.name || '-',
    };

    // Order Items
    this.items = (order.items || []).map(item => new OrderItemDto(item));
    this.itemCount = this.items.length;

    // Financial Summary
    this.financial = this.calculateFinancials(order);

    // Terms
    this.paymentTerms = order.paymentTerms || 'Standard 30 days';
    this.deliveryTerms = order.deliveryTerms || 'Standard Shipping';
    
    // Metadata
    this.notes = order.notes || [];
    this.currency = order.currency || 'INR';
    this.quotationId = order.quotationId;
    
    // Ownership
    this.owner = {
      id: order.ownerId,
      name: ownerName,
      email: order.owner?.email || '-',
      phone: order.owner?.phoneNumber || '-',
      branchName: order.branch?.name || order.owner?.branch?.name || '-',
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
    const currency = order.currency || 'INR';
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    if (order.items && Array.isArray(order.items)) {
      order.items.forEach(item => {
        const quantity = parseFloat(item.quantity) || 0;
        const unitPrice = parseFloat(item.product?.price) || parseFloat(item.unitPrice) || 0;
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