import { z } from 'zod';

// --------------------------------------------------
// Shared Helpers
// --------------------------------------------------
const uuidSchema = (label) => z.string().uuid({ message: `Invalid ${label} ID.` });
const moneySchema = (label) => z.coerce.number().min(0, `${label} cannot be negative.`);
const quantitySchema = z.coerce.number().positive('Quantity must be greater than zero.');

// --------------------------------------------------
// Pagination / Search / Filter Query
// --------------------------------------------------
export const listOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().optional(),
  status: z.string().trim().max(50).optional(),
  organizationId: uuidSchema('Organization').optional(),
  branchId: uuidSchema('Branch').optional(),
  customerId: uuidSchema('Customer').optional(),
  ownerId: uuidSchema('Owner').optional(),
  territoryId: uuidSchema('Territory').optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  sortBy: z.string().trim().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// --------------------------------------------------
// Order
// --------------------------------------------------
export const orderLineItemSchema = z.object({
  productId: uuidSchema('Product').optional(),
  description: z.string().trim().min(1, 'Item description is required.').max(255),
  quantity: quantitySchema,
  unitPrice: moneySchema('Unit price'),
  discountAmount: moneySchema('Discount amount').optional().default(0),
  taxAmount: moneySchema('Tax amount').optional().default(0),
});

export const createOrderSchema = z.object({
  customerId: uuidSchema('Customer'),
  organizationId: uuidSchema('Organization').optional(),
  branchId: uuidSchema('Branch').optional(),
  territoryId: uuidSchema('Territory').optional(),
  ownerId: uuidSchema('Owner').optional(),
  quotationId: uuidSchema('Quotation').optional(),
  orderDate: z.coerce.date().optional(),
  expectedDeliveryDate: z.coerce.date().optional(),
  currency: z.string().trim().length(3, 'Currency must be a 3-letter ISO code.').optional(),
  notes: z.string().trim().max(1000, 'Notes cannot exceed 1000 characters.').optional(),
  items: z.array(orderLineItemSchema).min(1, 'At least one order item is required.'),
});

export const updateOrderSchema = createOrderSchema.partial().extend({
  items: z.array(orderLineItemSchema).min(1, 'At least one order item is required.').optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.string().trim().min(1, 'Status is required.').max(50, 'Status cannot exceed 50 characters.'),
  reason: z.string().trim().max(500, 'Reason cannot exceed 500 characters.').optional(),
});

export const bulkOrderIdsSchema = z.object({
  orderIds: z
    .array(uuidSchema('Order'))
    .min(1, 'At least one order must be selected.')
    .max(100, 'Bulk operations cannot exceed 100 orders.'),
});

export const bulkOrderStatusSchema = bulkOrderIdsSchema.extend({
  status: z.string().trim().min(1, 'Status is required.').max(50, 'Status cannot exceed 50 characters.'),
});

// --------------------------------------------------
// ID Param
// --------------------------------------------------
export const idParamSchema = z.object({
  id: uuidSchema('Order'),
});
