import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  sku: z.string().min(2, 'SKU is required'),
  productCode: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  unit: z.string().optional(),
  price: z.number().min(0, 'Price must be a positive number'),
  costPrice: z.number().min(0).optional(),
  tax: z.number().min(0).optional(),
  minimumStock: z.number().min(0).optional(),
  barcode: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const updateProductSchema = z.object({
  name: z.string().min(2).optional(),
  sku: z.string().min(2).optional(),
  productCode: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  unit: z.string().optional(),
  price: z.number().min(0).optional(),
  costPrice: z.number().min(0).optional(),
  tax: z.number().min(0).optional(),
  minimumStock: z.number().min(0).optional(),
  barcode: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const updateBasicProductSchema = z.object({
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  // Sales manager cannot update price, costPrice, sku, name, etc.
});

export const createWarehouseSchema = z.object({
  name: z.string().min(2, 'Warehouse name is required'),
  code: z.string().optional(),
  location: z.string().optional(),
  latitude: z.union([z.number(), z.string()]).optional().nullable(),
  longitude: z.union([z.number(), z.string()]).optional().nullable(),
  branchId: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const updateWarehouseSchema = z.object({
  name: z.string().min(2).optional(),
  code: z.string().optional(),
  location: z.string().optional(),
  latitude: z.union([z.number(), z.string()]).optional().nullable(),
  longitude: z.union([z.number(), z.string()]).optional().nullable(),
  isActive: z.boolean().optional(),
});

export const addStockSchema = z.object({
  productId: z.string().uuid('Invalid Product ID'),
  warehouseId: z.string().uuid('Invalid Warehouse ID'),
  quantity: z.number().int().positive('Quantity must be positive'),
  notes: z.string().optional(),
});

export const reduceStockSchema = z.object({
  productId: z.string().uuid('Invalid Product ID'),
  warehouseId: z.string().uuid('Invalid Warehouse ID'),
  quantity: z.number().int().positive('Quantity must be positive'),
  notes: z.string().optional(),
});

export const transferStockSchema = z.object({
  productId: z.string().uuid('Invalid Product ID'),
  fromWarehouseId: z.string().uuid('Invalid Source Warehouse ID'),
  toWarehouseId: z.string().uuid('Invalid Destination Warehouse ID'),
  quantity: z.number().int().positive('Quantity must be positive'),
  notes: z.string().optional(),
});

export const assignWarehouseManagerSchema = z.object({
  userId: z.string().uuid('Invalid User ID'),
});

export const createWarehouseManagerSchema = z.object({
  userId: z.string().uuid('Invalid User ID').optional(),
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  email: z.string().email('Invalid email address').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  phoneNumber: z.string().optional(),
  warehouseId: z.string().uuid('Invalid Warehouse ID').optional(),
}).refine(data => data.userId || (data.firstName && data.lastName && data.email && data.password), {
  message: 'Either userId of existing user OR full new user details (firstName, lastName, email, password) must be provided.',
});

export const updateWarehouseManagerSchema = z.object({
  userId: z.string().uuid('Invalid User ID').optional().nullable(),
});

export const createProductIssueSchema = z.object({
  productId: z.string().uuid('Invalid Product ID'),
  warehouseId: z.string().uuid('Invalid Warehouse ID'),
  salesExecutiveId: z.string().uuid('Invalid Sales Executive ID'),
  salesOrderId: z.string().uuid('Invalid Sales Order ID').optional(),
  quantity: z.number().int().positive('Quantity must be positive'),
  notes: z.string().optional(),
});

export const updateProductIssueSchema = z.object({
  status: z.enum(['PENDING', 'ISSUED', 'RETURNED', 'CANCELLED']),
  notes: z.string().optional(),
});

